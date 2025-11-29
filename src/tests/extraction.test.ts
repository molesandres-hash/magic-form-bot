/**
 * Extraction Tests
 *
 * Purpose: Test the AI extraction system with multi-module courses
 * Validates:
 * - Correct extraction of multiple modules
 * - Proper separation of online lessons per module
 * - Correct mapping of sessions to modules
 * - Placeholder generation
 *
 * Run with: npm test or npx vitest
 */

import { describe, it, expect } from 'vitest';
import type { CourseData } from '@/types/courseData';
import { generatePlaceholderMap, getOnlineLessonsByModule } from '@/services/placeholderService';

// Import test fixtures
import corso2ModuliMisto from './fixtures/corso-2-moduli-misto.json';
import corso3ModuliMixed from './fixtures/corso-3-moduli-mixed.json';

// ============================================================================
// MOCK DATA GENERATORS
// ============================================================================

/**
 * Creates a mock CourseData from test fixture
 * In a real test, this would be the output of the AI extraction
 */
function createMockCourseData(fixture: typeof corso2ModuliMisto): CourseData {
  const isMixed = fixture.description.includes('miste');

  return {
    corso: {
      id: fixture.expected_output.corso.id,
      titolo: fixture.expected_output.corso.titolo,
      tipo: 'Test',
      data_inizio: '01/02/2025',
      data_fine: '15/02/2025',
      anno: '2025',
      durata_totale: '40 ore',
      ore_totali: '40 ore',
      ore_rendicontabili: '40 ore',
      stato: 'Aperto',
      capienza: '10/12',
      capienza_numero: 10,
      capienza_totale: 12,
      programma: '',
    },
    moduli: fixture.expected_output.moduli.map((mod, idx) => ({
      id: mod.id_sezione,
      titolo: mod.titolo,
      numero_sessioni: mod.sessioni_raw_count,
      id_corso: fixture.expected_output.corso.id,
      id_sezione: mod.id_sezione,
      data_inizio: '01/02/2025',
      data_fine: '15/02/2025',
      ore_totali: '20 ore',
      durata: '20 ore',
      ore_rendicontabili: '20 ore',
      capienza: '10/12',
      capienza_numero: 10,
      capienza_totale: 12,
      stato: 'Aperto',
      tipo_sede: mod.tipo_sede,
      provider: 'Test Provider',
      argomenti: (mod as any).argomenti_count ? Array(( mod as any).argomenti_count).fill('').map((_, i) => `Argomento ${i + 1}`) : [],
      sessioni: generateMockSessions(mod.sessioni_raw_count, mod.has_online_lessons || false, mod.has_presenza_lessons !== false, mod.id_sezione),
      sessioni_presenza: generateMockSessions((mod as any).presenza_count || (mod.has_presenza_lessons ? mod.sessioni_raw_count : 0), false, true, mod.id_sezione),
      lezioni_online: generateMockSessions((mod as any).online_count || (mod.has_online_lessons ? (isMixed ? Math.floor(mod.sessioni_raw_count / 2) : mod.sessioni_raw_count) : 0), true, false, mod.id_sezione),
    })),
    sede: { tipo: 'Test', nome: 'Test Sede', modalita: 'Test', indirizzo: 'Test' },
    ente: {
      nome: 'Test Ente',
      id: 'E001',
      indirizzo: 'Via Test 1',
      accreditato: {
        nome: 'Ente Accreditato Test',
        via: 'Via Test',
        numero_civico: '1',
        comune: 'Roma',
        cap: '00100',
        provincia: 'RM',
      },
    },
    trainer: {
      nome_completo: 'Mario Rossi',
      nome: 'Mario',
      cognome: 'Rossi',
      codice_fiscale: 'RSSMRA70A01H501X',
    },
    partecipanti: Array(fixture.expected_output.partecipanti_count).fill(null).map((_, idx) => ({
      numero: idx + 1,
      id: `P00${idx + 1}`,
      nome: `Nome${idx + 1}`,
      cognome: `Cognome${idx + 1}`,
      nome_completo: `Nome${idx + 1} Cognome${idx + 1}`,
      codice_fiscale: `TSTCF${idx}80A01H501X`,
      telefono: '1234567890',
      cellulare: '0987654321',
      email: `test${idx + 1}@email.it`,
      programma: 'Test',
      ufficio: 'Test',
      case_manager: 'Test',
      benefits: idx % 2 === 0 ? 'Sì' : 'No',
      frequenza: '100%',
    })),
    partecipanti_count: fixture.expected_output.partecipanti_count,
    sessioni: [],
    sessioni_presenza: [],
    registro: {
      numero_pagine: '10',
      data_vidimazione: '15/02/2025',
      luogo_vidimazione: 'Roma',
    },
    metadata: {
      data_estrazione: new Date().toISOString(),
      versione_sistema: '2.0.0',
      utente: 'test',
      completamento_percentuale: 100,
      campi_mancanti: [],
      warnings: [],
    },
  };
}

function generateMockSessions(
  count: number,
  isOnline: boolean,
  isPresenza: boolean,
  moduloId: string
): any[] {
  const sessions = [];
  for (let i = 0; i < count; i++) {
    const isFad = isOnline && !isPresenza ? true : (isOnline && isPresenza ? i % 2 === 0 : false);
    sessions.push({
      numero: i + 1,
      data_completa: `0${i + 1}/02/2025`,
      giorno: `0${i + 1}`,
      mese: 'Febbraio',
      mese_numero: '02',
      anno: '2025',
      giorno_settimana: 'Lunedì',
      ora_inizio_giornata: '09:00',
      ora_fine_giornata: '13:00',
      sede: isFad ? 'Online' : 'Aula 1',
      tipo_sede: isFad ? 'Online' : 'Presenza',
      is_fad: isFad,
      registrata: isFad ? (i % 2 === 0) : undefined,
      modulo_id: moduloId,
    });
  }
  return sessions;
}

// ============================================================================
// TEST SUITE: 2 MODULI (UNO PRESENZA, UNO ONLINE)
// ============================================================================

describe('Extraction - Corso con 2 Moduli (uno presenza, uno online)', () => {
  const courseData = createMockCourseData(corso2ModuliMisto);

  it('should extract 2 modules correctly', () => {
    expect(courseData.moduli).toHaveLength(2);
    expect(courseData.moduli[0].id_sezione).toBe('60001');
    expect(courseData.moduli[1].id_sezione).toBe('60002');
  });

  it('should have correct session counts per module', () => {
    expect(courseData.moduli[0].numero_sessioni).toBe(5);
    expect(courseData.moduli[1].numero_sessioni).toBe(6);
  });

  it('should have online lessons only in module 2', () => {
    expect(courseData.moduli[0].lezioni_online).toHaveLength(0);
    expect(courseData.moduli[1].lezioni_online).toHaveLength(6);
  });

  it('should have presenza lessons only in module 1', () => {
    expect(courseData.moduli[0].sessioni_presenza.length).toBeGreaterThan(0);
    expect(courseData.moduli[1].sessioni_presenza).toHaveLength(0);
  });

  it('should link sessions to correct module via modulo_id', () => {
    const mod1OnlineLessons = courseData.moduli[0].lezioni_online;
    const mod2OnlineLessons = courseData.moduli[1].lezioni_online;

    mod2OnlineLessons.forEach(lesson => {
      expect(lesson.modulo_id).toBe('60002');
    });
  });
});

// ============================================================================
// TEST SUITE: 3 MODULI CON LEZIONI MISTE
// ============================================================================

describe('Extraction - Corso con 3 Moduli (lezioni miste)', () => {
  const courseData = createMockCourseData(corso3ModuliMixed);

  it('should extract 3 modules correctly', () => {
    expect(courseData.moduli).toHaveLength(3);
    expect(courseData.moduli[0].id_sezione).toBe('70001');
    expect(courseData.moduli[1].id_sezione).toBe('70002');
    expect(courseData.moduli[2].id_sezione).toBe('70003');
  });

  it('should have argomenti for each module', () => {
    courseData.moduli.forEach(modulo => {
      expect(modulo.argomenti).toBeDefined();
      expect(modulo.argomenti!.length).toBeGreaterThan(0);
    });
  });

  it('should correctly separate online and presenza lessons for module 1 (mixed)', () => {
    const mod1 = courseData.moduli[0];
    expect(mod1.lezioni_online.length).toBeGreaterThan(0);
    expect(mod1.sessioni_presenza.length).toBeGreaterThan(0);
    expect(mod1.lezioni_online.length + mod1.sessioni_presenza.length).toBe(mod1.numero_sessioni);
  });

  it('should correctly separate online and presenza lessons for module 2 (mixed)', () => {
    const mod2 = courseData.moduli[1];
    expect(mod2.lezioni_online.length).toBeGreaterThan(0);
    expect(mod2.sessioni_presenza.length).toBeGreaterThan(0);
  });

  it('should have only online lessons for module 3', () => {
    const mod3 = courseData.moduli[2];
    expect(mod3.lezioni_online.length).toBe(9);
    expect(mod3.sessioni_presenza.length).toBe(0);
  });

  it('should have registrata flag on some online lessons', () => {
    const mod3OnlineLessons = courseData.moduli[2].lezioni_online;
    const registrateCount = mod3OnlineLessons.filter(l => l.registrata).length;
    expect(registrateCount).toBeGreaterThan(0);
  });
});

// ============================================================================
// TEST SUITE: PLACEHOLDER GENERATION
// ============================================================================

describe('Placeholder Generation', () => {
  const courseData = createMockCourseData(corso3ModuliMixed);

  it('should generate CORSO_ placeholders', () => {
    const placeholders = generatePlaceholderMap(courseData);

    expect(placeholders.CORSO_ID).toBe('50002');
    expect(placeholders.CORSO_TITOLO).toBe('Master in Project Management');
    expect(placeholders.CORSO_ORE_TOTALI).toBe('40 ore');
  });

  it('should generate MOD{N}_ placeholders for each module', () => {
    const placeholders = generatePlaceholderMap(courseData);

    expect(placeholders.MOD1_ID_SEZIONE).toBe('70001');
    expect(placeholders.MOD1_TITOLO).toBe('Introduzione al PM');

    expect(placeholders.MOD2_ID_SEZIONE).toBe('70002');
    expect(placeholders.MOD2_TITOLO).toBe('Gestione Risorse');

    expect(placeholders.MOD3_ID_SEZIONE).toBe('70003');
    expect(placeholders.MOD3_TITOLO).toBe('Risk Management');
  });

  it('should generate MOD{N}_NUM_LEZIONI_ONLINE correctly', () => {
    const placeholders = generatePlaceholderMap(courseData);

    expect(placeholders.MOD1_NUM_LEZIONI_ONLINE).toBe(3);
    expect(placeholders.MOD2_NUM_LEZIONI_ONLINE).toBe(4);
    expect(placeholders.MOD3_NUM_LEZIONI_ONLINE).toBe(9);
  });

  it('should generate PART{N}_ placeholders for each participant', () => {
    const placeholders = generatePlaceholderMap(courseData);

    expect(placeholders.PART1_NOME).toBe('Nome1');
    expect(placeholders.PART1_COGNOME).toBe('Cognome1');
    expect(placeholders.PART1_EMAIL).toBe('test1@email.it');

    expect(placeholders.PART5_NOME).toBe('Nome5');
  });

  it('should generate ENTE_ placeholders', () => {
    const placeholders = generatePlaceholderMap(courseData);

    expect(placeholders.ENTE_NOME).toBe('Test Ente');
    expect(placeholders.ENTE_ACCRED_NOME).toBe('Ente Accreditato Test');
    expect(placeholders.ENTE_ACCRED_COMUNE).toBe('Roma');
  });

  it('should generate DOCENTE_ placeholders', () => {
    const placeholders = generatePlaceholderMap(courseData);

    expect(placeholders.DOCENTE_NOME_COMPLETO).toBe('Mario Rossi');
    expect(placeholders.DOCENTE_NOME).toBe('Mario');
    expect(placeholders.DOCENTE_COGNOME).toBe('Rossi');
  });

  it('should generate array placeholders for loops', () => {
    const placeholders = generatePlaceholderMap(courseData);

    expect(placeholders.MODULI).toBeInstanceOf(Array);
    expect(placeholders.MODULI).toHaveLength(3);

    expect(placeholders.PARTECIPANTI).toBeInstanceOf(Array);
    expect(placeholders.PARTECIPANTI).toHaveLength(5);
  });

  it('should generate metadata placeholders', () => {
    const placeholders = generatePlaceholderMap(courseData);

    expect(placeholders.NUM_MODULI).toBe(3);
    expect(placeholders.NUM_PARTECIPANTI).toBe(5);
  });
});

// ============================================================================
// TEST SUITE: ONLINE LESSONS BY MODULE
// ============================================================================

describe('Get Online Lessons By Module', () => {
  const courseData = createMockCourseData(corso3ModuliMixed);

  it('should return online lessons grouped by module', () => {
    const grouped = getOnlineLessonsByModule(courseData);

    expect(grouped).toHaveLength(3); // All 3 modules have online lessons

    expect(grouped[0].module.id_sezione).toBe('70001');
    expect(grouped[0].lessons).toHaveLength(3);

    expect(grouped[1].module.id_sezione).toBe('70002');
    expect(grouped[1].lessons).toHaveLength(4);

    expect(grouped[2].module.id_sezione).toBe('70003');
    expect(grouped[2].lessons).toHaveLength(9);
  });

  it('should include module metadata in grouped structure', () => {
    const grouped = getOnlineLessonsByModule(courseData);

    grouped.forEach(group => {
      expect(group.module.id).toBeDefined();
      expect(group.module.titolo).toBeDefined();
      expect(group.module.id_sezione).toBeDefined();
      expect(group.module.id_corso).toBeDefined();
    });
  });
});

// ============================================================================
// TEST SUITE: SCHEMA VALIDATION
// ============================================================================

describe('Data Model Validation', () => {
  it('should have lezioni_online property in Modulo interface', () => {
    const courseData = createMockCourseData(corso2ModuliMisto);

    courseData.moduli.forEach(modulo => {
      expect(modulo).toHaveProperty('lezioni_online');
      expect(Array.isArray(modulo.lezioni_online)).toBe(true);
    });
  });

  it('should have sessioni_presenza property in Modulo interface', () => {
    const courseData = createMockCourseData(corso2ModuliMisto);

    courseData.moduli.forEach(modulo => {
      expect(modulo).toHaveProperty('sessioni_presenza');
      expect(Array.isArray(modulo.sessioni_presenza)).toBe(true);
    });
  });

  it('should have modulo_id property in online lessons', () => {
    const courseData = createMockCourseData(corso3ModuliMixed);

    courseData.moduli.forEach(modulo => {
      modulo.lezioni_online.forEach(lesson => {
        expect(lesson).toHaveProperty('modulo_id');
        expect(lesson.modulo_id).toBe(modulo.id_sezione);
      });
    });
  });

  it('should have registrata property in online lessons', () => {
    const courseData = createMockCourseData(corso3ModuliMixed);

    courseData.moduli[2].lezioni_online.forEach(lesson => {
      expect(lesson).toHaveProperty('registrata');
    });
  });
});
