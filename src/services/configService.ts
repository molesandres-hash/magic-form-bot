import { localDb } from './localDb';
import { SYSTEM_INSTRUCTION, EXTRACTION_SCHEMA } from './extractionConfig';

export const CONFIG_KEYS = {
    SYSTEM_INSTRUCTION: 'system_instruction',
    EXTRACTION_SCHEMA: 'extraction_schema',
} as const;

export async function getSystemInstruction(): Promise<string> {
    try {
        const config = await localDb.system_configs.get(CONFIG_KEYS.SYSTEM_INSTRUCTION);
        return config?.value || SYSTEM_INSTRUCTION;
    } catch (error) {
        console.error('Error fetching system instruction:', error);
        return SYSTEM_INSTRUCTION;
    }
}

export async function saveSystemInstruction(instruction: string): Promise<void> {
    await localDb.system_configs.put({
        key: CONFIG_KEYS.SYSTEM_INSTRUCTION,
        value: instruction,
        updated_at: new Date().toISOString(),
    });
}

export async function getExtractionSchema(): Promise<any> {
    try {
        const config = await localDb.system_configs.get(CONFIG_KEYS.EXTRACTION_SCHEMA);
        return config?.value || EXTRACTION_SCHEMA;
    } catch (error) {
        console.error('Error fetching extraction schema:', error);
        return EXTRACTION_SCHEMA;
    }
}

export async function saveExtractionSchema(schema: any): Promise<void> {
    await localDb.system_configs.put({
        key: CONFIG_KEYS.EXTRACTION_SCHEMA,
        value: schema,
        updated_at: new Date().toISOString(),
    });
}

export async function resetToDefaults(): Promise<void> {
    await saveSystemInstruction(SYSTEM_INSTRUCTION);
    await saveExtractionSchema(EXTRACTION_SCHEMA);
}
