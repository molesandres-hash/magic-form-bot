
import fs from 'fs';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import path from 'path';

const templatePath = path.resolve('public/templates/modulo5/Calendario_condizionalita_FINALE.docx');

try {
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
    });

    const text = doc.getFullText();
    console.log('Template Full Text Content:');
    console.log(text);

    // Regex to find potential tags
    const tags = text.match(/\{[^}]+\}/g) || [];
    console.log('\nFound potential tags:');
    tags.forEach(tag => console.log(tag));

} catch (error) {
    console.error('Error reading template:', error);
}
