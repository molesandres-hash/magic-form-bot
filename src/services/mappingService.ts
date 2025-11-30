import { localDb, type FieldMapping } from './localDb';
import type { CourseData } from '@/types/courseData';

export async function getMappings(): Promise<FieldMapping[]> {
    return await localDb.field_mappings.toArray();
}

export async function saveMapping(mapping: FieldMapping): Promise<number> {
    return await localDb.field_mappings.put(mapping);
}

export async function deleteMapping(id: number): Promise<void> {
    await localDb.field_mappings.delete(id);
}

/**
 * Maps course data to a flat object based on configured mappings.
 * Also includes the original data flattened for backward compatibility.
 */
export async function mapData(data: CourseData): Promise<Record<string, any>> {
    const mappings = await getMappings();
    const result: Record<string, any> = {};

    // Apply configured mappings
    for (const mapping of mappings) {
        const value = getValueByPath(data, mapping.path);
        result[mapping.placeholder] = value !== undefined ? value : '';
    }

    // Flatten original data for backward compatibility (e.g. corso.titolo)
    const flattened = flattenObject(data);

    return { ...flattened, ...result };
}

function getValueByPath(obj: any, path: string): any {
    return path.split('.').reduce((acc, part) => {
        // Handle array access like modules[0]
        const arrayMatch = part.match(/(\w+)\[(\d+)\]/);
        if (arrayMatch) {
            const prop = arrayMatch[1];
            const index = parseInt(arrayMatch[2], 10);
            return acc && acc[prop] ? acc[prop][index] : undefined;
        }
        return acc ? acc[part] : undefined;
    }, obj);
}

function flattenObject(obj: any, prefix = ''): Record<string, any> {
    const result: Record<string, any> = {};

    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            const newKey = prefix ? `${prefix}.${key}` : key;

            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                Object.assign(result, flattenObject(value, newKey));
            } else {
                result[newKey] = value;
            }
        }
    }

    return result;
}
