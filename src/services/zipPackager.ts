
/**
 * ZIP Packager Service
 *
 * Purpose: Creates organized ZIP archives containing all course documents
 * Generates a complete package with Word docs, Excel files, README, and metadata
 *
 * Clean Code Principles Applied:
 * - Single Responsibility: Each function creates one type of file
 * - DRY: Common Excel generation logic extracted to helpers
 * - Named Constants: Magic numbers and strings extracted
 * - Error Handling: Comprehensive error handling with logging
 * - Organization: Logical folder structure (Documenti/, Excel/)
 *
 * Why ZIP: Users need all documents together for offline storage/submission
 */

import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { CourseData, Metadata } from '@/types/courseData';
import {
  generateRegistroDidattico,
  generateVerbalePartecipazione,
  generateVerbaleScrutinio,
  generateModelloFAD,
} from './wordDocumentGenerator';
import { processWordTemplate } from './wordTemplateProcessor';
import * as XLSX from 'xlsx';
import { loadFolderStructureSettings } from '@/components/settings/FolderStructureSettings';
import {
  SYSTEM_TEMPLATES,
  createLocalTemplateGenerator,
  createDbTemplateGenerator,
  type TemplateGenerator
} from './templateRegistry';
import { generateAllFADRegistries, hasFADSessions } from './fadMultiFileGenerator';
import { createCleanExcelBlob, processSessionsIntoRows } from './excelTemplateGenerator';
import { listTemplates } from '@/services/localDb';
import { loadTemplateBufferFromPublic, addCertificatesToZip } from './zipPackagerCertificates';
import { addRegistroIDToZip } from './zipPackagerRegistroID';
import { loadPredefinedData } from '@/utils/predefinedDataUtils';
import { extractCityName } from '@/utils/stringUtils';
// NEW: Import PDF generators
import { PDFGenerators } from './pdfDocumentGenerator';

// ============================================================================
// CONSTANTS - Folder structure and configuration
// ============================================================================

/**
 * File naming patterns
 * Why: Consistent naming makes files easy to identify
 */
const FILE_PREFIX = {
  REGISTRO: 'Registro_Didattico',
  VERBALE_PART: 'Verbale_Partecipazione',
  VERBALE_SCRUT: 'Verbale_Scrutinio',
  FAD: 'Modello_A_FAD',
  PARTICIPANTS: 'Partecipanti',
  ATTENDANCE: 'Registro_Presenze',
  REPORT: 'Report_Completo',
} as const;

/**
 * Configuration for PDF generation
 * Set to true to generate PDF versions of documents alongside Word files
 */
let GENERATE_PDF_VERSIONS = true; // Can be changed via setGeneratePDF()

/**
 * Sets whether to generate PDF versions of documents
 * @param enabled - true to generate PDFs, false for Word only
 */
export function setGeneratePDF(enabled: boolean) {
  GENERATE_PDF_VERSIONS = enabled;
}

/**
 * Gets current PDF generation setting
 */
export function isGeneratePDFEnabled(): boolean {
  return GENERATE_PDF_VERSIONS;
}

/**
 * Creates a complete ZIP package with all course documents
 *
 * Purpose: Bundles all generated documents into one downloadable archive
 * Structure: Organized folders (Documenti/, Excel/) + README + metadata.json
 *
 * Why: Users need a single file containing all documents for submission/archival
 *
 * @param data - Complete course data
 * @throws Error if document generation or ZIP creation fails
 */
export async function createCompleteZIPPackage(data: CourseData): Promise<void> {
  try {
    const moduleScopes = buildModuleScopes(data);
    const sectionScopes = buildSectionScopes(data);

    // If multiple modules, generate one ZIP per module + aggregate ZIP
    if (moduleScopes.length > 1) {
      const aggregateZip = new JSZip();
      const baseCourseId = data.corso?.id || 'N_A';
      const baseTitle = data.corso?.titolo || 'Corso';

      for (const scope of moduleScopes) {
        const { blob, filename } = await buildZipBlob(scope.scopedData, {
          sectionId: scope.id,
          sectionLabel: scope.label,
          moduleIndex: scope.moduleIndex,
          moduleTitle: scope.label,
        });
        saveAs(blob, filename);

        // Also aggregate all module folders inside a single ZIP
        const modulePrefix = sanitizeFilename(scope.label || `Modulo_${scope.moduleIndex}`);
        const moduleZip = await JSZip.loadAsync(blob);
        const copyPromises = Object.keys(moduleZip.files).map(async (path) => {
          const file = moduleZip.files[path];
          if (file.dir) {
            aggregateZip.folder(`${modulePrefix}/${path}`);
            return;
          }
          const content = await file.async('blob');
          aggregateZip.file(`${modulePrefix}/${path}`, content);
        });
        await Promise.all(copyPromises);
      }

      const combinedBlob = await aggregateZip.generateAsync({ type: 'blob' });
      const combinedFilename = `Corso_${baseCourseId}_${sanitizeFilename(baseTitle)}_Tutti_Moduli_${formatDate(new Date())}.zip`;
      saveAs(combinedBlob, combinedFilename);
      return;
    }

    // If multiple sections, generate one ZIP per section
    if (sectionScopes.length > 1) {
      for (const scope of sectionScopes) {
        const { blob, filename } = await buildZipBlob(scope.scopedData, {
          sectionId: scope.id,
          sectionLabel: scope.label,
        });
        saveAs(blob, filename);
      }
      return;
    }

    // Single section/default flow
    const { blob, filename } = await buildZipBlob(sectionScopes[0]?.scopedData || data, {
      sectionId: sectionScopes[0]?.id,
      sectionLabel: sectionScopes[0]?.label,
    });
    saveAs(blob, filename);

    console.log('ZIP package created successfully!');
  } catch (error: any) {
    console.error('Error creating ZIP package:', error);
    throw new Error(`Errore durante la creazione del pacchetto ZIP: ${error.message}`);
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

interface ResolvedTemplate {
  id: string;
  name: string;
  filename: string;
  generator: TemplateGenerator;
}

interface SectionScope {
  id: string;
  label: string;
  scopedData: CourseData;
}

interface ModuleScope {
  id: string;
  label: string;
  moduleIndex: number;
  scopedData: CourseData;
}

/**
 * Resolves all available templates into a map for easy lookup
 */
async function resolveAllTemplates(): Promise<Map<string, ResolvedTemplate>> {
  const map = new Map<string, ResolvedTemplate>();

  // 1. System Templates
  Object.values(SYSTEM_TEMPLATES).forEach(t => {
    map.set(t.id, {
      id: t.id,
      name: t.name,
      filename: t.filename,
      generator: t.generator
    });
  });

  // 2. Local Templates
  try {
    const response = await fetch('/templates/manifest.json');
    if (response.ok) {
      const manifest = await response.json();
      if (manifest.templates) {
        manifest.templates.forEach((t: any) => {
          map.set(t.id, {
            id: t.id,
            name: t.name,
            filename: t.name, // Use name as filename base
            generator: createLocalTemplateGenerator(t.path, t.filename)
          });
        });
      }
    }
  } catch (e) {
    console.error("Failed to load local templates manifest", e);
  }

  // 3. DB Templates
  try {
    const data = await listTemplates();
    data.forEach((t: any) => {
      map.set(t.id, {
        id: t.id,
        name: t.name,
        filename: t.name,
        generator: createDbTemplateGenerator(t.id, t.file_name)
      });
    });
  } catch (e) {
    console.error("Failed to load DB templates", e);
  }

  return map;
}

/**
 * Determines if FAD (distance learning) document should be generated
 * Why: Not all courses have FAD components, saves unnecessary file generation
 *
 * @param data - Course data
 * @returns true if course has FAD sessions
 */
function shouldGenerateFAD(data: CourseData): boolean {
  const hasFADSessions = (data.sessioni || []).some((session) => session.is_fad);
  const isFADCourse = data.corso?.tipo?.toLowerCase().includes('fad');
  return hasFADSessions || isFADCourse;
}

/**
 * Generates PDF version for a specific template
 * Maps system template IDs to PDF generators
 *
 * @param templateId - ID of the template to generate
 * @param data - Course data
 * @returns PDF blob or null if not applicable
 */
async function generatePDFForTemplate(templateId: string, data: CourseData): Promise<Blob | null> {
  switch (templateId) {
    case 'system-registro-didattico':
      return await PDFGenerators.registroDidattico(data);

    case 'system-verbale-partecipazione':
      return await PDFGenerators.verbalePartecipazione(data);

    case 'system-verbale-scrutinio':
      return await PDFGenerators.verbaleScrutinio(data);

    case 'system-modello-fad':
      if (shouldGenerateFAD(data)) {
        return await PDFGenerators.modelloFAD(data);
      }
      return null;

    default:
      // For custom templates, we don't have PDF generators (yet)
      // Could implement a generic DOCX-to-PDF converter in the future
      console.log(`No PDF generator available for template: ${templateId}`);
      return null;
  }
}

// ============================================================================
// BENEFIT HELPERS
// ============================================================================

function hasBenefitsFlag(value: string | undefined | null): boolean {
  if (!value) return false;
  const cleaned = value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

  if (!cleaned || ['no', '0', 'false'].includes(cleaned)) return false;
  return ['si', 'yes', 'y', 'true', '1', 'benefit', 'benefits'].some(flag => cleaned.startsWith(flag));
}

// ============================================================================
// SECTION HELPERS (multi-section ZIP support)
// ============================================================================

function buildSectionScopes(data: CourseData): SectionScope[] {
  const moduli = data.moduli || [];
  const sectionIds = Array.from(
    new Set(moduli.map((m: any) => m.id_sezione).filter((id) => !!id))
  );

  if (sectionIds.length === 0) {
    // Fallback for when no sections are defined
    // We still try to populate metadata from the first module if available
    const firstModule = moduli[0];
    const scopedData = { ...data };

    if (firstModule) {
      scopedData.metadata = {
        ...(data.metadata || {}),
        modulo_corrente: {
          id: firstModule.id,
          id_sezione: firstModule.id_sezione,
          id_corso: firstModule.id_corso,
          titolo: firstModule.titolo,
          index: 1,
        },
      } as Metadata;
    }

    return [
      {
        id: data.corso?.id || 'N_A',
        label: data.corso?.id || 'N_A',
        scopedData,
      },
    ];
  }

  return sectionIds.map((id, index) => {
    const scopedModules = moduli.filter((m: any) => m.id_sezione === id);
    const sessioni = scopedModules.flatMap((m: any) => m.sessioni || []);
    const sessioniPresenza = scopedModules.flatMap((m: any) => m.sessioni_presenza || []);

    // Use the first module in the section as the representative for IDs
    const currentModule = scopedModules[0];

    const scopedData: CourseData = {
      ...data,
      moduli: scopedModules,
      sessioni: sessioni.length ? sessioni : data.sessioni,
      sessioni_presenza: sessioniPresenza.length ? sessioniPresenza : data.sessioni_presenza,
      corso: {
        ...data.corso,
        id: data.corso?.id || id,
      },
      metadata: {
        ...(data.metadata || {}),
        modulo_corrente: {
          id: currentModule?.id,
          id_sezione: currentModule?.id_sezione,
          id_corso: currentModule?.id_corso,
          titolo: currentModule?.titolo,
          index: index + 1,
        },
      } as Metadata,
    };

    return {
      id,
      label: id,
      scopedData,
    };
  });
}

function buildModuleScopes(data: CourseData): ModuleScope[] {
  const moduli = data.moduli || [];
  if (moduli.length <= 1) return [];

  return moduli.map((modulo, index) => {
    const scopedSessions = (modulo.sessioni && modulo.sessioni.length > 0)
      ? modulo.sessioni
      : data.sessioni;

    const scopedSessionsPresenza = (modulo.sessioni_presenza && modulo.sessioni_presenza.length > 0)
      ? modulo.sessioni_presenza
      : (scopedSessions || []).filter((s: any) => !s.is_fad);

    const scopedCourse = {
      ...data.corso,
      id: modulo.id_sezione || modulo.id || data.corso?.id,
      titolo: modulo.titolo || data.corso?.titolo,
      data_inizio: modulo.data_inizio || data.corso?.data_inizio,
      data_fine: modulo.data_fine || data.corso?.data_fine,
      ore_totali: modulo.ore_totali || data.corso?.ore_totali,
      durata_totale: modulo.durata || data.corso?.durata_totale,
      ore_rendicontabili: modulo.ore_rendicontabili || data.corso?.ore_rendicontabili,
    };

    const scopedData: CourseData = {
      ...data,
      moduli: [modulo], // Scope to just this module
      sessioni: scopedSessions || [],
      sessioni_presenza: scopedSessionsPresenza || [],
      corso: scopedCourse as any,
      metadata: {
        ...(data.metadata || {}),
        modulo_corrente: {
          id: modulo.id,
          id_sezione: modulo.id_sezione,
          id_corso: modulo.id_corso,
          titolo: modulo.titolo,
          index: index + 1,
        },
      } as Metadata,
    };

    return {
      id: modulo.id_sezione || modulo.id || data.corso?.id || `MOD_${index + 1}`,
      label: modulo.titolo || modulo.id_sezione || modulo.id || `Modulo ${index + 1}`,
      moduleIndex: index + 1,
      scopedData,
    };
  });
}

// ============================================================================
// MODULO 5 - Calendario condizionalità (beneficiari)
// ============================================================================

type SupervisorInfo = { nome: string; cognome: string; email: string };

interface Modulo5TemplateDataOptions {
  data: CourseData;
  participant: any;
  sessionRows: Array<Record<string, string>>;
  respCertName: string;
  supervisor: SupervisorInfo;
  startDate: string;
  endDate: string;
  docenteName: string;
}

/**
 * Creates "modulo 5" folder and generates Calendario condizionalità
 * for each participant that has benefits flag enabled.
 */
async function addModulo5Calendars(zipRoot: JSZip, data: CourseData): Promise<void> {
  const beneficiaries = (data.partecipanti || []).filter(p => hasBenefitsFlag(p.benefits));
  if (beneficiaries.length === 0) return;

  const templateBlob = await loadModulo5Template();
  if (!templateBlob) return;

  const modulo5Folder = zipRoot.folder('modulo 5');
  if (!modulo5Folder) return;

  const respCertName = getRespCertFullName(data);
  const supervisor = resolveSupervisorInfo(data);
  const docenteName = data.trainer?.nome_completo || data.trainer?.nome || '';

  const sortedSessions = sortSessionsByDate(data.sessioni || []);
  const sessionRows = buildModulo5SessionRows(sortedSessions, docenteName);
  const { startDate, endDate } = buildModulo5CourseDates(data, sortedSessions);

  for (const participant of beneficiaries) {
    const filename = buildModulo5Filename(participant, data.corso?.id || 'corso');
    const templateData = buildModulo5TemplateData({
      data,
      participant,
      sessionRows,
      respCertName,
      supervisor,
      startDate,
      endDate,
      docenteName,
    });

    try {
      const blob = await processWordTemplate({
        template: templateBlob,
        data: templateData,
        filename,
      });
      modulo5Folder.file(filename, blob);
    } catch (error) {
      console.error('Errore generazione Calendario condizionalità (Modulo 5):', error);
    }
  }
}

async function loadModulo5Template(): Promise<Blob | null> {
  try {
    const response = await fetch('/templates/modulo5/Calendario_condizionalita_FINALE.docx');
    if (!response.ok) throw new Error('Template Modulo 5 non trovato');
    return await response.blob();
  } catch (error) {
    console.error('Errore nel caricamento del template Modulo 5:', error);
    return null;
  }
}

function buildModulo5TemplateData(options: Modulo5TemplateDataOptions): Record<string, any> {
  const { data, participant, sessionRows, respCertName, supervisor, startDate, endDate, docenteName } = options;

  const enteNome = data.ente?.accreditato?.nome || data.ente?.nome || '';
  const sedeAccreditata = data.ente?.accreditato?.nome || data.sede?.nome || '';
  const sedeIndirizzo = buildCourseAddress(data);
  const fullName = participant?.nome_completo || `${participant?.nome || ''} ${participant?.cognome || ''}`.trim();

  return {
    'PARTECIPANTE 1 NOME': participant?.nome || '',
    'PARTECIPANTE 1 COGNOME': participant?.cognome || '',
    'PARTECIPANTE 1 CF': participant?.codice_fiscale || '',
    'PARTECIPANTE 1': fullName,
    NOME_CORSO: data.corso?.titolo || '',
    ID_CORSO: data.corso?.id || '',
    ID_SEZIONE: data.corso?.id || '',
    ENTE_NOME: enteNome,
    ID_ENTE: data.ente?.id || '',
    SEDE_ACCREDITATA: sedeAccreditata,
    SEDE_INDIRIZZO: sedeIndirizzo,
    DATA_INIZIO: startDate,
    DATA_FINE: endDate,
    ORE_TOTALI: data.corso?.ore_totali || data.corso?.durata_totale || '',
    VERBALE_LUOGO: extractCityName(data.verbale?.luogo || data.sede?.nome || data.ente?.accreditato?.comune || ''),
    NOME_DOCENTE: docenteName,
    RESP_CERT_NOME_COMPLETO: respCertName,
    SUPERVISORE_NOME: supervisor.nome.toLowerCase(),
    SUPERVISORE_COGNOME: supervisor.cognome.toLowerCase(),
    SUPERVISORE_EMAIL: supervisor.email,
    SESSIONI: sessionRows,
  };
}

function buildModulo5Filename(participant: any, courseId: string): string {
  const cognome = sanitizeFilename(participant?.cognome || 'Cognome');
  const nome = sanitizeFilename(participant?.nome || 'Nome');
  const idSafe = sanitizeFilename(courseId || 'corso');
  return `Calendario_condizionalita_${idSafe}_${cognome}_${nome}.docx`;
}

function buildModulo5SessionRows(sessions: any[], docenteName: string): Array<Record<string, string>> {
  return sessions.map((session) => {
    const start = session?.ora_inizio_giornata || session?.ora_inizio || '';
    const end = session?.ora_fine_giornata || session?.ora_fine || '';
    const duration = calculateDurationHours(start, end);
    const { ora_mattina, ora_pomeriggio } = splitSessionByShift(start, end, duration);

    return {
      data: session?.data_completa || session?.data || '',
      ora_mattina,
      ora_pomeriggio,
      durata: duration > 0 ? duration.toString().replace(/\.0$/, '') : '0',
      NOME_DOCENTE: docenteName,
    };
  });
}

function buildModulo5CourseDates(data: CourseData, sessions: any[]): { startDate: string; endDate: string } {
  const startDate = data.corso?.data_inizio || sessions[0]?.data_completa || sessions[0]?.data || '';
  const endDate = data.corso?.data_fine || sessions[sessions.length - 1]?.data_completa || sessions[sessions.length - 1]?.data || '';
  return { startDate, endDate };
}

function splitSessionByShift(start: string, end: string, duration: number): { ora_mattina: string; ora_pomeriggio: string } {
  if (duration >= 8) {
    return { ora_mattina: '9:00-13:00', ora_pomeriggio: '14:00-18:00' };
  }

  const range = formatTimeRange(start, end);
  if (range === '-') {
    return { ora_mattina: '-', ora_pomeriggio: '-' };
  }

  const startHour = parseInt((start || '0').split(':')[0] || '0', 10);
  if (!Number.isNaN(startHour) && startHour < 14) {
    return { ora_mattina: range, ora_pomeriggio: '-' };
  }

  return { ora_mattina: '-', ora_pomeriggio: range };
}

function formatTimeRange(start: string, end: string): string {
  if (!start && !end) return '-';
  if (!start || !end) return '-';
  return `${start}-${end}`;
}

function calculateDurationHours(start: string, end: string): number {
  if (!start || !end) return 0;
  const [h1, m1] = start.split(':').map(Number);
  const [h2, m2] = end.split(':').map(Number);
  if (Number.isNaN(h1) || Number.isNaN(h2)) return 0;

  const startHours = h1 + (Number.isNaN(m1) ? 0 : m1 / 60);
  const endHours = h2 + (Number.isNaN(m2) ? 0 : m2 / 60);
  const diff = endHours - startHours;
  return diff > 0 ? Number(diff.toFixed(2)) : 0;
}

function sortSessionsByDate(sessions: any[]): any[] {
  return [...sessions].sort((a, b) => {
    const dateA = parseSessionDate(a);
    const dateB = parseSessionDate(b);
    return dateA - dateB;
  });
}

function parseSessionDate(session: any): number {
  const datePart = session?.data_completa || session?.data || '';
  const timePart = session?.ora_inizio_giornata || session?.ora_inizio || '00:00';

  if (datePart && datePart.includes('/')) {
    const parts = datePart.split('/');
    if (parts.length === 3) {
      const ts = new Date(`${parts[2]}-${parts[1]}-${parts[0]} ${timePart}`).getTime();
      if (!Number.isNaN(ts)) return ts;
    }
  }

  const fallback = new Date(`${datePart} ${timePart}`).getTime();
  return Number.isNaN(fallback) ? 0 : fallback;
}

function resolveSupervisorInfo(data: CourseData): SupervisorInfo {
  let nome = (data as any).responsabili?.supervisore?.nome || '';
  let cognome = (data as any).responsabili?.supervisore?.cognome || '';

  if (!nome && !cognome) {
    try {
      const predefined = loadPredefinedData();
      const enabledSupervisor = (predefined.supervisors || []).find((s) => s.enabled !== false);
      if (enabledSupervisor?.nomeCompleto) {
        const parts = enabledSupervisor.nomeCompleto.trim().split(/\s+/);
        nome = parts.shift() || '';
        cognome = parts.join(' ');
      }
    } catch (error) {
      console.error('Errore nel caricamento del supervisore predefinito:', error);
    }
  }

  return {
    nome,
    cognome,
    email: buildSupervisorEmail(nome, cognome),
  };
}

function buildSupervisorEmail(nome: string, cognome: string): string {
  const localPart = [nome, cognome]
    .filter(Boolean)
    .map((value) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '.'))
    .filter(Boolean)
    .join('.');

  if (!localPart) return '';
  return `${localPart}@akgitalia.it`;
}

function buildCourseAddress(data: CourseData): string {
  const acc = data.ente?.accreditato;
  if (acc?.via) {
    const parts = [acc.via, acc.numero_civico, acc.comune].filter(Boolean);
    return parts.join(', ');
  }

  return data.sede?.indirizzo || data.ente?.indirizzo || '';
}

// ============================================================================
// CORE ZIP BUILDER (reused for single/multi section)
// ============================================================================

interface ZipBuildOptions {
  sectionId?: string;
  sectionLabel?: string;
  moduleIndex?: number;
  moduleTitle?: string;
}

async function buildZipBlob(data: CourseData, options?: ZipBuildOptions): Promise<{ blob: Blob; filename: string }> {
  const zip = new JSZip();
  const settings = loadFolderStructureSettings();
  const sectionSuffix = options?.sectionId ? `_SEZ_${options.sectionId}` : '';
  const moduleSuffix = options?.moduleIndex ? `_MOD_${options.moduleIndex}` : '';
  const courseId = (data.corso?.id || 'N_A') + sectionSuffix + moduleSuffix;
  const courseTitle = options?.moduleTitle || data.corso?.titolo || 'Corso';

  // 1. Resolve all available templates (System, Local, DB)
  const templateMap = await resolveAllTemplates();

  // 2. Create Root Folder (if configured)
  // Default pattern: "{ID_CORSO} - {NOME_CORSO}" if not specified
  let rootFolder = zip;
  if (settings.rootFolderName) {
    const rootName = settings.rootFolderName
      .replace('{ID_CORSO}', courseId)
      .replace('{NOME_CORSO}', sanitizeFilename(courseTitle));
    rootFolder = zip.folder(rootName) || zip;
  } else {
    // Default behavior: Use course ID and title
    const rootName = `${courseId} - ${sanitizeFilename(courseTitle)}`;
    rootFolder = zip.folder(rootName) || zip;
  }

  // 3. Iterate configured folders
  let excelFolderFound = false;
  for (const folderDef of settings.folders) {
    if (!folderDef.enabled) continue;

    const zipFolder = rootFolder.folder(folderDef.name);
    if (!zipFolder) continue;

    // 3a. Generate assigned templates
    if (folderDef.assignedTemplates) {
      for (const templateId of folderDef.assignedTemplates) {
        const templateInfo = templateMap.get(templateId);
        if (templateInfo) {
          console.log(`Generating template ${templateInfo.name} for folder ${folderDef.name}...`);
          try {
            const blob = await templateInfo.generator(data);
            if (blob) {
              // Use configured filename or default
              const filename = `${templateInfo.filename}_${courseId}.docx`;
              zipFolder.file(filename, blob);

              // ============================================================================
              // NEW: Generate PDF version if enabled
              // ============================================================================
              if (GENERATE_PDF_VERSIONS) {
                try {
                  const pdfBlob = await generatePDFForTemplate(templateId, data);
                  if (pdfBlob) {
                    const pdfFilename = `${templateInfo.filename}_${courseId}.pdf`;
                    zipFolder.file(pdfFilename, pdfBlob);
                    console.log(`✓ Generated PDF: ${pdfFilename}`);
                  }
                } catch (pdfErr) {
                  console.warn(`Could not generate PDF for ${templateId}:`, pdfErr);
                  // Continue even if PDF fails - Word is the primary format
                }
              }
            }
          } catch (err) {
            console.error(`Failed to generate template ${templateId}`, err);
          }
        }
      }
    }

    // 3b. Generate Excel files (Legacy support or if explicitly assigned)
    // For now, if folder accepts 'xlsx', we put standard Excel files there
    // TODO: Make Excel files also configurable templates
    if (folderDef.fileTypes.includes('xlsx')) {
      excelFolderFound = true;

      // Participants list - REDUNDANT (Merged into Registro Presenze)
      // const participantsExcel = generateParticipantsExcelBlob(data);
      // zipFolder.file(`${FILE_PREFIX.PARTICIPANTS}_${courseId}.xlsx`, participantsExcel);

      // Attendance register (CONSOLIDATED)
      const attendanceExcel = generateAttendanceExcelBlob(data);
      zipFolder.file(`${FILE_PREFIX.ATTENDANCE}_${courseId}.xlsx`, attendanceExcel);

      // Complete report - REDUNDANT (Merged into Registro Presenze)
      // const reportExcel = generateCourseReportExcelBlob(data);
      // zipFolder.file(`${FILE_PREFIX.REPORT}_${courseId}.xlsx`, reportExcel);

      // Hours calculation register (Registro Ore) - REDUNDANT
      // const hoursExcel = generateHoursExcelBlob(data);
      // zipFolder.file(`Registro_Ore_${courseId}.xlsx`, hoursExcel);

      // New: Calendario Lezioni per sezione (text-only)
      const calendarExcel = generateSectionCalendarExcelBlob(data, options?.sectionId);
      zipFolder.file(`Calendario_Lezioni_${courseId}.xlsx`, calendarExcel);
    }
  }

  // Fallback: If no folder accepted xlsx, create default Excel folder
  if (!excelFolderFound) {
    console.log('No folder configured for XLSX. Creating default "Excel" folder...');
    const defaultExcelFolder = rootFolder.folder('Excel');
    if (defaultExcelFolder) {
      const attendanceExcel = generateAttendanceExcelBlob(data);
      defaultExcelFolder.file(`${FILE_PREFIX.ATTENDANCE}_${courseId}.xlsx`, attendanceExcel);

      const calendarExcel = generateSectionCalendarExcelBlob(data, options?.sectionId);
      defaultExcelFolder.file(`Calendario_Lezioni_${courseId}.xlsx`, calendarExcel);
    }
  }

  // 4. Generate FAD Registries (Multi-file)
  // Create separate folder with one file per FAD session day
  if (hasFADSessions(data)) {
    console.log('Generating FAD registries folder...');
    const fadFolder = rootFolder.folder('Registri_FAD');
    if (fadFolder) {
      try {
        const fadFiles = await generateAllFADRegistries(data);
        fadFiles.forEach(({ filename, blob }) => {
          fadFolder.file(filename, blob);
        });
        console.log(`Generated ${fadFiles.length} FAD registry files`);
      } catch (error) {
        console.error('Error generating FAD registries:', error);
      }
    }
  }

  // 5. Add certificates for each participant (Attestato di partecipazione AKG)
  const certFolder = rootFolder.folder('certificati AKG');
  if (certFolder) {
    try {
      const templateBuffer = await loadTemplateBufferFromPublic();
      await addCertificatesToZip(rootFolder, data, templateBuffer);
    } catch (error) {
      console.error('Errore generazione certificati AKG:', error);
    }
  }

  // 6. Add Modulo 5 calendars (one file per beneficiary with benefits)
  await addModulo5Calendars(rootFolder, data);

  // 7. Add Modulo 7 communications (one folder per day, one file per beneficiary)
  await addModulo7Communications(rootFolder, data);

  // 8. Add Verbale Ammissione Esame (DOCX)
  await addVerbaleAmmissione(rootFolder, data);

  // 9. Add Registro ID (Registro presenza ID)
  await addRegistroIDToZip(rootFolder, data);

  // 10. Add README (if enabled)
  if (settings.generateReadme) {
    const readmeContent = generateREADME(data);
    rootFolder.file('README.txt', readmeContent);
  }

  // 9. Add Metadata (if enabled)
  if (settings.generateMetadata) {
    const metadataContent = JSON.stringify(
      {
        corso: data.corso,
        metadata: data.metadata,
        generato_il: new Date().toISOString(),
        sistema_versione: data.metadata?.versione_sistema || '2.1.0',
      },
      null,
      2
    );
    rootFolder.file('metadata.json', metadataContent);
  }

  // ========================================================================
  // STEP 10: Generate ZIP archive (returned to caller)
  // ========================================================================
  console.log('Creating ZIP archive...');
  const blob = await zip.generateAsync({ type: 'blob' });

  const filename = `Corso_${courseId}_${sanitizeFilename(courseTitle)}_${formatDate(new Date())}.zip`;
  return { blob, filename };
}

// ============================================================================
// MODULO 7 - Comunicazione Evento per beneficiari
// ============================================================================

/**
 * Creates "modulo 7" folder with one subfolder per session day and
 * generates Comunicazione_evento documents for participants with benefits.
 */
async function addModulo7Communications(zipRoot: JSZip, data: CourseData): Promise<void> {
  const sessions = data.sessioni || [];
  const beneficiaries = (data.partecipanti || []).filter(p => hasBenefitsFlag(p.benefits));

  if (sessions.length === 0 || beneficiaries.length === 0) {
    return;
  }

  const templateBlob = await loadModulo7Template();
  if (!templateBlob) return;

  const modulo7Folder = zipRoot.folder('modulo 7');
  if (!modulo7Folder) return;

  const respCertName = getRespCertFullName(data);

  for (const session of sessions) {
    const dayFolderName = sanitizeFilename(buildSessionFolderName(session));
    const dayFolder = modulo7Folder.folder(dayFolderName);
    if (!dayFolder) continue;

    for (const participant of beneficiaries) {
      const filename = buildModulo7Filename(session, participant);
      const templateData = buildModulo7TemplateData(data, session, participant, respCertName);

      try {
        const blob = await processWordTemplate({
          template: templateBlob,
          data: templateData,
          filename
        });
        dayFolder.file(filename, blob);
      } catch (error) {
        console.error('Errore generazione Comunicazione evento (Modulo 7):', error);
      }
    }
  }
}

async function loadModulo7Template(): Promise<Blob | null> {
  try {
    const response = await fetch('/templates/Modulo 7 Placeholder/Comunicazione_evento_SESSIONE.docx');
    if (!response.ok) throw new Error('Template Modulo 7 non trovato');
    return await response.blob();
  } catch (error) {
    console.error('Errore nel caricamento del template Modulo 7:', error);
    return null;
  }
}

function buildSessionFolderName(session: any): string {
  if (session?.data_completa) {
    return `Giorno_${session.data_completa.replace(/\//g, '-')}`;
  }
  if (session?.data_completa) {
    return `Giorno_${session.data_completa.replace(/\//g, '-')}`;
  }
  return `Giorno_${session.id || 'N_A'}`;
}

function buildModulo7Filename(session: any, participant: any): string {
  const cognome = sanitizeFilename(participant?.cognome || 'Cognome');
  const nome = sanitizeFilename(participant?.nome || 'Nome');
  const date = session?.data_completa ? session.data_completa.replace(/\//g, '_') : 'Data';
  return `Comunicazione_evento_${date}_${cognome}_${nome}.docx`;
}

function buildModulo7TemplateData(data: CourseData, session: any, participant: any, respCertName: string): Record<string, any> {
  const fullName = participant?.nome_completo || `${participant?.nome || ''} ${participant?.cognome || ''}`.trim();
  const enteNome = data.ente?.accreditato?.nome || data.ente?.nome || '';
  const sedeAccreditata = data.ente?.accreditato?.nome || data.sede?.nome || '';
  const sedeIndirizzo = buildCourseAddress(data);

  return {
    'PARTECIPANTE 1 NOME': participant?.nome || '',
    'PARTECIPANTE 1 COGNOME': participant?.cognome || '',
    'PARTECIPANTE 1 CF': participant?.codice_fiscale || '',
    'PARTECIPANTE 1': fullName,
    NOME_CORSO: data.corso?.titolo || '',
    ID_CORSO: data.corso?.id || '',
    ID_SEZIONE: data.corso?.id || '',
    ENTE_NOME: enteNome,
    ID_ENTE: data.ente?.id || '',
    SEDE_ACCREDITATA: sedeAccreditata,
    SEDE_INDIRIZZO: sedeIndirizzo,
    DATA_LEZIONE: session?.data_completa || '',
    ORA_INIZIO: session?.ora_inizio_giornata || session?.ora_inizio || '',
    ORA_FINE: session?.ora_fine_giornata || session?.ora_fine || '',
    RESP_CERT_NOME_COMPLETO: respCertName,
    luogo: sedeIndirizzo,
    data: session?.data_completa || '',
    ora_inizio: session?.ora_inizio_giornata || session?.ora_inizio || '',
    ora_fine: session?.ora_fine_giornata || session?.ora_fine || '',
    MOD_PRESENZA: resolveSessionLocation(session, data) === 'online' ? '' : 'X',
    MOD_DISTANZA: resolveSessionLocation(session, data) === 'online' ? 'X' : '',
  };
}

// ============================================================================
// VERBALE AMMISSIONE ESAME (DOCX)
// ============================================================================

const VERBALE_AMMISSIONE_PATH = '/templates/Verbale_Ammissione_Esame_con_placeholder.docx';

/**
 * Adds the "Verbale Ammissione Esame" to the zip, generated from the DOCX template.
 */
async function addVerbaleAmmissione(zipFolder: JSZip, data: CourseData): Promise<void> {
  try {
    const response = await fetch(VERBALE_AMMISSIONE_PATH);
    if (!response.ok) {
      console.warn('Verbale Ammissione Esame template not found at:', VERBALE_AMMISSIONE_PATH);
      return;
    }
    const templateBlob = await response.blob();

    // Prepare data for the template
    const templateData = {
      ...data.corso,
      ...data.ente,
      ...data.sede,
      // Add any specific placeholders needed for this document
      NOME_CORSO: data.corso?.titolo || '',
      ID_CORSO: data.corso?.id || '',
      DATA_INIZIO: data.corso?.data_inizio || '',
      DATA_FINE: data.corso?.data_fine || '',
      ENTE_NOME: data.ente?.accreditato?.nome || data.ente?.nome || '',
    };

    const blob = await processWordTemplate({
      template: templateBlob,
      data: templateData,
      filename: 'temp_verbale.docx'
    });

    const filename = `Verbale_Ammissione_Esame_${sanitizeFilename(data.corso?.id || 'corso')}.docx`;
    zipFolder.file(filename, blob);
    console.log(`Added ${filename} to zip`);
  } catch (error) {
    console.error('Error adding Verbale Ammissione Esame DOCX:', error);
  }
}

function getRespCertFullName(data: CourseData): string {
  const respFromData = (data as any).responsabili?.responsabile_certificazione;
  if (respFromData) {
    return `${respFromData.nome || ''} ${respFromData.cognome || ''}`.trim();
  }

  try {
    const predefined = loadPredefinedData();
    const enabledResp = (predefined.responsabili || []).find(r => r.enabled !== false);
    if (enabledResp) {
      return `${enabledResp.nome} ${enabledResp.cognome}`.trim();
    }
  } catch (error) {
    console.error('Errore nel caricamento del responsabile predefinito:', error);
  }

  return '';
}

function formatDateForFilename(dateStr: string): string {
  return dateStr.replace(/[^\dA-Za-z]+/g, '_');
}

// ============================================================================
// EXCEL GENERATION HELPERS - Create Excel blobs for ZIP packaging
// ============================================================================

/**
 * Generates participants Excel as Blob (for ZIP packaging)
 *
 * Purpose: Creates Excel with full participant roster and validation status
 * Why Blob: Needed for ZIP archive, not direct download
 *
 * @param data - Course data with participants
 * @returns Excel file as Blob
 */
function generateParticipantsExcelBlob(data: CourseData): Blob {
  const participantsData = (data.partecipanti || []).map((p) => ({
    'Numero': p.numero,
    'Nome': p.nome,
    'Cognome': p.cognome,
    'Nome Completo': p.nome_completo,
    'Codice Fiscale': p.codice_fiscale,
    'Email': p.email,
    'Telefono': p.telefono,
    'Cellulare': p.cellulare || '',
    'CF Valido': p._validations?.cf_valid ? 'Sì' : 'No',
    'Email Valida': p._validations?.email_valid ? 'Sì' : 'No',
  }));

  const ws = XLSX.utils.json_to_sheet(participantsData);
  ws['!cols'] = [
    { wch: 8 }, { wch: 15 }, { wch: 15 }, { wch: 25 },
    { wch: 18 }, { wch: 30 }, { wch: 15 }, { wch: 15 },
    { wch: 12 }, { wch: 12 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Partecipanti');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/**
 * Generates attendance Excel as Blob (for ZIP packaging)
 */
/**
 * Generates attendance Excel as Blob (for ZIP packaging)
 * Includes Attendance Matrix, Course Summary, and Participant Details in one sheet.
 */
function generateAttendanceExcelBlob(data: CourseData): Blob {
  const sessionDates = (data.sessioni_presenza || []).map((s) => s.data_completa);

  // 1. ATTENDANCE MATRIX
  const attendanceData = (data.partecipanti || []).map((p) => {
    const row: any = {
      'Numero': p.numero,
      'Nome Completo': p.nome_completo,
      'Codice Fiscale': p.codice_fiscale,
    };

    sessionDates.forEach((date) => {
      row[date] = '';
    });

    row['Totale Presenze'] = '';
    row['Percentuale'] = '';

    return row;
  });

  const ws = XLSX.utils.json_to_sheet(attendanceData);

  // 2. APPEND COURSE SUMMARY (Below matrix)
  // Calculate start row for summary (matrix rows + header + some spacing)
  const matrixEndRow = attendanceData.length + 2; // +1 for header, +1 for 0-based index
  const summaryStartRow = matrixEndRow + 3; // 3 rows spacing

  XLSX.utils.sheet_add_aoa(ws, [['--- RIEPILOGO CORSO ---']], { origin: `A${summaryStartRow}` });

  const courseSummary = [
    ['Campo', 'Valore'],
    ['ID Corso', data.corso?.id || 'N/A'],
    ['Titolo', data.corso?.titolo || 'N/A'],
    ['Data Inizio', data.corso?.data_inizio || 'N/A'],
    ['Data Fine', data.corso?.data_fine || 'N/A'],
    ['Ore Totali', data.corso?.ore_totali || 'N/A'],
    ['Numero Partecipanti', data.partecipanti_count?.toString() || '0'],
    ['Ente', data.ente?.accreditato?.nome || data.ente?.nome || 'N/A'],
    ['Sede', data.sede?.nome || 'N/A'],
  ];

  XLSX.utils.sheet_add_aoa(ws, courseSummary, { origin: `A${summaryStartRow + 1}` });

  // 3. APPEND PARTICIPANT DETAILS (Below summary)
  const participantsStartRow = summaryStartRow + courseSummary.length + 3;

  XLSX.utils.sheet_add_aoa(ws, [['--- DETTAGLIO PARTECIPANTI ---']], { origin: `A${participantsStartRow}` });

  const participantsHeaders = ['N.', 'Nome', 'Cognome', 'CF', 'Email', 'Telefono'];
  XLSX.utils.sheet_add_aoa(ws, [participantsHeaders], { origin: `A${participantsStartRow + 1}` });

  const participantsRows = (data.partecipanti || []).map(p => [
    p.numero,
    p.nome,
    p.cognome,
    p.codice_fiscale,
    p.email,
    p.telefono
  ]);

  XLSX.utils.sheet_add_aoa(ws, participantsRows, { origin: `A${participantsStartRow + 2}` });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Registro Presenze');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/**
 * Generates course report Excel as Blob (for ZIP packaging)
 */
function generateCourseReportExcelBlob(data: CourseData): Blob {
  const wb = XLSX.utils.book_new();

  // Course Summary
  const courseSummary = [
    { Campo: 'ID Corso', Valore: data.corso?.id || 'N/A' },
    { Campo: 'Titolo', Valore: data.corso?.titolo || 'N/A' },
    { Campo: 'Data Inizio', Valore: data.corso?.data_inizio || 'N/A' },
    { Campo: 'Data Fine', Valore: data.corso?.data_fine || 'N/A' },
    { Campo: 'Ore Totali', Valore: data.corso?.ore_totali || 'N/A' },
    { Campo: 'Numero Partecipanti', Valore: data.partecipanti_count.toString() },
    { Campo: 'Numero Sessioni', Valore: (data.sessioni || []).length.toString() },
  ];

  const wsSummary = XLSX.utils.json_to_sheet(courseSummary);
  wsSummary['!cols'] = [{ wch: 25 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Riepilogo');

  // Participants
  const participantsData = (data.partecipanti || []).map((p) => ({
    'N.': p.numero,
    'Nome Completo': p.nome_completo,
    'CF': p.codice_fiscale,
    'Email': p.email,
    'Telefono': p.telefono,
  }));

  const wsParticipants = XLSX.utils.json_to_sheet(participantsData);
  XLSX.utils.book_append_sheet(wb, wsParticipants, 'Partecipanti');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/**
 * Generates the "Registro Ore" Excel with hourly calculations
 */
/**
 * Generates the "Registro Ore" Excel with hourly calculations
 * Now includes Summary and Participants sheets
 */
function generateHoursExcelBlob(data: CourseData): Blob {
  const wb = XLSX.utils.book_new();

  // 1. SHEET: RIEPILOGO (Summary)
  const courseSummary = [
    { Campo: 'ID Corso', Valore: data.corso?.id || 'N/A' },
    { Campo: 'Titolo', Valore: data.corso?.titolo || 'N/A' },
    { Campo: 'Data Inizio', Valore: data.corso?.data_inizio || 'N/A' },
    { Campo: 'Data Fine', Valore: data.corso?.data_fine || 'N/A' },
    { Campo: 'Ore Totali', Valore: data.corso?.ore_totali || 'N/A' },
    { Campo: 'Numero Partecipanti', Valore: data.partecipanti_count?.toString() || '0' },
    { Campo: 'Ente', Valore: data.ente?.accreditato?.nome || data.ente?.nome || 'N/A' },
    { Campo: 'Sede', Valore: data.sede?.nome || 'N/A' },
  ];
  const wsSummary = XLSX.utils.json_to_sheet(courseSummary);
  wsSummary['!cols'] = [{ wch: 25 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Riepilogo');

  // 2. SHEET: PARTECIPANTI (Participants)
  const participantsData = (data.partecipanti || []).map((p) => ({
    'N.': p.numero,
    'Nome': p.nome,
    'Cognome': p.cognome,
    'CF': p.codice_fiscale,
    'Email': p.email,
    'Telefono': p.telefono,
  }));
  const wsParticipants = XLSX.utils.json_to_sheet(participantsData);
  wsParticipants['!cols'] = [
    { wch: 5 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 30 }, { wch: 15 }
  ];
  XLSX.utils.book_append_sheet(wb, wsParticipants, 'Partecipanti');

  // 3. SHEET: REGISTRO (Hourly Calculations)
  const sessions = (data.sessioni || []).map((s) => ({
    data: s.data_completa,
    ora_inizio: s.ora_inizio_giornata,
    ora_fine: s.ora_fine_giornata,
    luogo: s.sede,
  }));

  const rows = processSessionsIntoRows(
    sessions,
    data.corso?.id || '',
    (data.trainer as any)?.codice_fiscale || (data.trainer as any)?.codiceFiscale || '',
    data.corso?.titolo || ''
  );

  const columns = [
    { header: 'ID_SEZIONE', variableName: 'ID_SEZIONE', width: 15, format: 'text' },
    { header: 'DATA LEZIONE', variableName: 'DATA_LEZIONE', width: 12, format: 'text' },
    { header: 'TOTALE_ORE', variableName: 'TOTALE_ORE', width: 10, format: 'text' },
    { header: 'ORA_INIZIO', variableName: 'ORA_INIZIO', width: 10, format: 'text' },
    { header: 'ORA_FINE', variableName: 'ORA_FINE', width: 10, format: 'text' },
    { header: 'TIPOLOGIA', variableName: 'TIPOLOGIA', width: 10, format: 'text' },
    { header: 'CODICE FISCALE DOCENTE', variableName: 'CODICE_FISCALE_DOCENTE', width: 20, format: 'text' },
    { header: 'MATERIA', variableName: 'MATERIA', width: 30, format: 'text' },
    { header: 'CONTENUTI MATERIA', variableName: 'CONTENUTI_MATERIA', width: 30, format: 'text' },
    { header: 'SVOLGIMENTO SEDE LEZIONE', variableName: 'SVOLGIMENTO_SEDE_LEZIONE', width: 25, format: 'text' },
  ];

  // Create clean worksheet for Registro
  const wsRegistro = XLSX.utils.json_to_sheet(rows, {
    header: columns.map((c) => c.header),
  });

  // Force text format
  const range = XLSX.utils.decode_range(wsRegistro['!ref'] || 'A1');
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
      if (!wsRegistro[cellRef]) continue;
      wsRegistro[cellRef].t = 's';
      wsRegistro[cellRef].z = '@';
    }
  }
  wsRegistro['!cols'] = columns.map((col) => ({ wch: col.width }));

  XLSX.utils.book_append_sheet(wb, wsRegistro, 'Registro');

  // Write final workbook
  const excelBuffer = XLSX.write(wb, {
    bookType: 'xlsx',
    type: 'array',
    cellStyles: false,
    bookSST: false,
  });

  return new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/**
 * Generates Calendario Lezioni Excel (one row per lesson) with all-text cells
 * Matches requested headers and keeps ID_SEZIONE per each sezione.
 */
function generateSectionCalendarExcelBlob(data: CourseData, sectionId?: string): Blob {
  const idSezione = sectionId || data.corso?.id || '';
  const materia = data.corso?.titolo || '';
  const cfDocente = (data.trainer as any)?.codice_fiscale || (data.trainer as any)?.codiceFiscale || '';

  const sessions = sortSessionsByDate(data.sessioni || []).map((session) => ({
    data: session?.data_completa || (session as any)?.data || '',
    ora_inizio: session?.ora_inizio_giornata || (session as any)?.ora_inizio || '',
    ora_fine: session?.ora_fine_giornata || (session as any)?.ora_fine || '',
    luogo: resolveSessionLocation(session, data),
  }));

  const hourRows = processSessionsIntoRows(
    sessions,
    idSezione,
    cfDocente,
    materia
  );

  const rows = hourRows.map((row) => ({
    ID_SEZIONE: row.ID_SEZIONE,
    'DATA LEZIONE': row.DATA_LEZIONE,
    TOTALE_ORE: row.TOTALE_ORE,
    ORA_INIZIO: row.ORA_INIZIO,
    ORA_FINE: row.ORA_FINE,
    TIPOLOGIA: row.TIPOLOGIA,
    'CODICE FISCALE DOCENTE': row.CODICE_FISCALE_DOCENTE,
    MATERIA: row.MATERIA,
    'CONTENUTI MATERIA': row.CONTENUTI_MATERIA,
    'SEDE SVOLGIMENTO': row.SVOLGIMENTO_SEDE_LEZIONE,
  }));

  return createCleanExcelBlob(rows as any, getSectionCalendarColumns() as any);
}

function resolveSessionLocation(session: any, data: CourseData): string {
  const rawLocation =
    session?.sede ||
    session?.tipo_sede ||
    session?.modalita ||
    data.sede?.modalita ||
    data.sede?.nome ||
    '';

  if (rawLocation === '1') return 'presenza';
  if (rawLocation === '4') return 'online';
  if (rawLocation) return rawLocation;

  return session?.is_fad ? 'online' : 'presenza';
}

function getSectionCalendarColumns(): { header: string; variableName: string; width: number; format: string }[] {
  return [
    { header: 'ID_SEZIONE', variableName: 'ID_SEZIONE', width: 15, format: 'text' },
    { header: 'DATA LEZIONE', variableName: 'DATA LEZIONE', width: 12, format: 'text' },
    { header: 'TOTALE_ORE', variableName: 'TOTALE_ORE', width: 10, format: 'text' },
    { header: 'ORA_INIZIO', variableName: 'ORA_INIZIO', width: 10, format: 'text' },
    { header: 'ORA_FINE', variableName: 'ORA_FINE', width: 10, format: 'text' },
    { header: 'TIPOLOGIA', variableName: 'TIPOLOGIA', width: 10, format: 'text' },
    { header: 'CODICE FISCALE DOCENTE', variableName: 'CODICE FISCALE DOCENTE', width: 22, format: 'text' },
    { header: 'MATERIA', variableName: 'MATERIA', width: 30, format: 'text' },
    { header: 'CONTENUTI MATERIA', variableName: 'CONTENUTI MATERIA', width: 30, format: 'text' },
    { header: 'SEDE SVOLGIMENTO', variableName: 'SEDE SVOLGIMENTO', width: 18, format: 'text' },
  ];
}

/**
 * Generates README content
 */
function generateREADME(data: CourseData): string {
  const courseId = data.corso?.id || 'N/A';
  const courseTitle = data.corso?.titolo || 'N/A';
  const dateGenerated = new Date().toLocaleString('it-IT');

  return `
========================================
DOCUMENTAZIONE CORSO FORMATIVO
========================================

ID Corso: ${courseId}
Titolo: ${courseTitle}
Data Generazione: ${dateGenerated}
Versione Sistema: ${data.metadata?.versione_sistema || '2.1.0'}

========================================
CONTENUTO DEL PACCHETTO
========================================

Il contenuto di questo pacchetto è stato generato dinamicamente
in base alla configurazione del sistema.

File Root:
- README.txt
  Questo file

- metadata.json
  Metadati del corso in formato JSON

========================================
INFORMAZIONI CORSO
========================================

Periodo: dal ${data.corso?.data_inizio || 'N/A'} al ${data.corso?.data_fine || 'N/A'}
Ore Totali: ${data.corso?.ore_totali || 'N/A'}
Numero Partecipanti: ${data.partecipanti_count || 0}
Numero Sessioni: ${(data.sessioni || []).length}
Sessioni in Presenza: ${(data.sessioni_presenza || []).length}
Sessioni FAD: ${(data.sessioni || []).filter((s) => s.is_fad).length}

========================================
ENTE EROGATORE
========================================

Nome: ${data.ente?.accreditato?.nome || data.ente?.nome || 'N/A'}
Indirizzo: ${data.ente?.accreditato?.via || ''} ${data.ente?.accreditato?.numero_civico || ''}
Comune: ${data.ente?.accreditato?.comune || ''} (${data.ente?.accreditato?.provincia || ''})
CAP: ${data.ente?.accreditato?.cap || ''}

========================================
VALIDAZIONI
========================================

Completamento Dati: ${data.metadata?.completamento_percentuale || 0}%
${data.metadata?.warnings && data.metadata.warnings.length > 0 ? `\nAvvisi:\n${data.metadata.warnings.map((w) => `- ${w}`).join('\n')}` : 'Nessun avviso'}

========================================
NOTE
========================================

Tutti i documenti sono stati generati automaticamente
dal sistema "Compilatore Documenti di Avvio Corso".

Per informazioni o supporto, contattare l'amministratore
del sistema.

Generato con Google Gemini AI 2.5 Flash
========================================
`;
}

/**
 * Sanitizes filename for safe file system usage
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-z0-9_\-]/gi, '_')
    .replace(/_+/g, '_')
    .substring(0, 50);
}

/**
 * Formats date as YYYYMMDD
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}
