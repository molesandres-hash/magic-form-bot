import type { CourseData } from '@/types/courseData';
import { processWordTemplate } from './wordTemplateProcessor';
import { getTemplateBlob } from '@/services/localDb';
import { mapCourseDataToTemplate } from './templateDataMapper';

// Define the interface for a template generator
export type TemplateGenerator = (data: CourseData) => Promise<Blob | null>;

export const createLocalTemplateGenerator = (templatePath: string, filename: string): TemplateGenerator => {
    return async (data: CourseData) => {
        try {
            // 1. Fetch the template file
            const response = await fetch(templatePath);
            if (!response.ok) throw new Error(`Failed to load template: ${templatePath}`);
            const templateBlob = await response.blob();

            // 2. Prepare data using shared mapper
            const templateData = mapCourseDataToTemplate(data);

            // 3. Process the template
            return processWordTemplate({
                template: templateBlob,
                data: templateData,
                filename: filename // This is just for internal use in the processor
            });
        } catch (error) {
            console.error(`Error generating local template ${filename}:`, error);
            return null;
        }
    };
};

// Helper to create a generator for a DB template stored nel DB locale
export const createDbTemplateGenerator = (templateId: string, filename: string): TemplateGenerator => {
    return async (data: CourseData) => {
        try {
            const fileData = await getTemplateBlob(templateId);
            if (!fileData) throw new Error("Template non trovato");

            // 2. Prepare data using shared mapper
            const templateData = mapCourseDataToTemplate(data);

            // 3. Process
            return processWordTemplate({
                template: fileData.blob,
                data: templateData,
                filename: filename
            });
        } catch (error) {
            console.error(`Error generating DB template ${filename}:`, error);
            return null;
        }
    };
};
