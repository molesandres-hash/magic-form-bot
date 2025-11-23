import Dexie, { Table } from 'dexie';
import type { EnteAccreditato, ResponsabileCorso } from '@/types/courseData';
import { DEFAULT_PREDEFINED_DATA } from '@/types/userSettings';

export interface DocumentTemplateRecord {
  id: string;
  name: string;
  description: string | null;
  template_type: string;
  file_name: string;
  file_data: Blob;
  version: number;
  is_active: boolean;
  created_at: string;
}

export interface LocalUser {
  id: string;
  email: string;
  role: 'admin' | 'user';
  password?: string;
}

class LocalDatabase extends Dexie {
  enti_accreditati!: Table<EnteAccreditato, string>;
  responsabili_corso!: Table<ResponsabileCorso, string>;
  document_templates!: Table<DocumentTemplateRecord, string>;
  users!: Table<LocalUser, string>;

  constructor() {
    super('magic_form_bot');

    this.version(2).stores({
      enti_accreditati: 'id, nome, comune, provincia',
      responsabili_corso: 'id, tipo, cognome',
      document_templates: 'id, template_type, created_at, file_name',
      users: 'id, email, role',
    });

    this.on('populate', () => this.seed());
  }

  private async seed() {
    // Seed admin user for offline mode
    await this.users.bulkPut([
      {
        id: 'local-admin',
        email: 'offline@local',
        role: 'admin',
      }
    ]);

    // Seed responsabili from predefined data
    const responsabili = DEFAULT_PREDEFINED_DATA.responsabili.map((resp, index) => ({
      id: `seed-resp-${index}`,
      tipo: 'responsabile_cert' as const,
      nome: resp.nome,
      cognome: resp.cognome,
      qualifica: 'Responsabile Certificazione',
      data_nascita: resp.dataNascita,
      citta_nascita: resp.cittaNascita,
      provincia_nascita: resp.provinciaNascita,
      citta_residenza: resp.cittaResidenza,
      via_residenza: resp.viaResidenza,
      numero_civico_residenza: resp.numeroCivico,
      documento_identita: resp.documento,
    }));

    const supervisors = DEFAULT_PREDEFINED_DATA.supervisors.map((sup, index) => {
      const [firstName, ...rest] = sup.nomeCompleto.split(' ');
      return {
        id: `seed-sup-${index}`,
        tipo: 'supervisore' as const,
        nome: firstName || sup.nomeCompleto,
        cognome: rest.join(' ') || sup.nomeCompleto,
        qualifica: sup.qualifica,
      };
    });

    const directors = DEFAULT_PREDEFINED_DATA.supervisors.map((sup, index) => {
      const [firstName, ...rest] = sup.nomeCompleto.split(' ');
      return {
        id: `seed-dir-${index}`,
        tipo: 'direttore' as const,
        nome: firstName || sup.nomeCompleto,
        cognome: rest.join(' ') || sup.nomeCompleto,
        qualifica: sup.qualifica,
      };
    });

    await this.responsabili_corso.bulkPut([...responsabili, ...supervisors, ...directors]);

    // Seed a sample ente if none exist
    await this.enti_accreditati.bulkPut([
      {
        id: 'seed-ente-1',
        nome: 'Ente Demo Locale',
        via: 'Via Demo 1',
        numero_civico: '1',
        comune: 'Milano',
        cap: '20100',
        provincia: 'MI',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as EnteAccreditato,
    ]);
  }
}

export const localDb = new LocalDatabase();

const createId = () => (crypto.randomUUID ? crypto.randomUUID() : `id-${Math.random().toString(16).slice(2)}`);

export async function listEnti(): Promise<EnteAccreditato[]> {
  return localDb.enti_accreditati.orderBy('nome').toArray();
}

export async function saveEnte(ente: Partial<EnteAccreditato>): Promise<string> {
  const id = ente.id || createId();
  const record: EnteAccreditato = {
    id,
    nome: ente.nome || 'Ente',
    via: ente.via || '',
    numero_civico: ente.numero_civico || '',
    comune: ente.comune || '',
    cap: ente.cap || '',
    provincia: ente.provincia || '',
    created_at: (ente as any).created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  await localDb.enti_accreditati.put(record);
  return id;
}

export async function deleteEnte(id: string) {
  return localDb.enti_accreditati.delete(id);
}

export async function listResponsabili(): Promise<ResponsabileCorso[]> {
  return localDb.responsabili_corso.orderBy('cognome').toArray();
}

export async function saveResponsabile(responsabile: Partial<ResponsabileCorso>): Promise<string> {
  const id = responsabile.id || createId();
  const record: ResponsabileCorso = {
    id,
    tipo: responsabile.tipo || 'direttore',
    nome: responsabile.nome || '',
    cognome: responsabile.cognome || '',
    qualifica: responsabile.qualifica,
    data_nascita: responsabile.data_nascita,
    citta_nascita: responsabile.citta_nascita,
    provincia_nascita: responsabile.provincia_nascita,
    citta_residenza: responsabile.citta_residenza,
    via_residenza: responsabile.via_residenza,
    numero_civico_residenza: responsabile.numero_civico_residenza,
    documento_identita: responsabile.documento_identita,
    firma: responsabile.firma,
  };
  await localDb.responsabili_corso.put(record);
  return id;
}

export async function deleteResponsabile(id: string) {
  return localDb.responsabili_corso.delete(id);
}

export async function listTemplates(): Promise<DocumentTemplateRecord[]> {
  return localDb.document_templates.orderBy('created_at').reverse().toArray();
}

export async function addTemplateRecord(params: {
  name: string;
  description?: string | null;
  template_type: string;
  file: File | Blob;
  file_name: string;
}): Promise<string> {
  const id = createId();
  const now = new Date().toISOString();
  const blob = params.file instanceof Blob ? params.file : new Blob([params.file]);

  const record: DocumentTemplateRecord = {
    id,
    name: params.name,
    description: params.description || null,
    template_type: params.template_type,
    file_name: params.file_name,
    file_data: blob,
    version: 1,
    is_active: true,
    created_at: now,
  };

  await localDb.document_templates.put(record);
  return id;
}

export async function deleteTemplateRecord(id: string) {
  return localDb.document_templates.delete(id);
}

export async function getTemplateBlob(id: string): Promise<{ blob: Blob; name: string } | null> {
  const record = await localDb.document_templates.get(id);
  if (!record) return null;
  return { blob: record.file_data, name: record.file_name };
}

export async function getTemplateBlobByPath(path: string): Promise<{ blob: Blob; name: string } | null> {
  const record = await localDb.document_templates.where('file_name').equals(path).first();
  if (!record) return null;
  return { blob: record.file_data, name: record.file_name };
}

export async function ensureUser(email: string, role: 'admin' | 'user' = 'user') {
  const existing = await localDb.users.where('email').equals(email).first();
  if (existing) return existing;
  const user: LocalUser = { id: createId(), email, role };
  await localDb.users.put(user);
  return user;
}
