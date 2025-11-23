
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATES_DIR = path.join(__dirname, '../public/templates');
const MANIFEST_FILE = path.join(TEMPLATES_DIR, 'manifest.json');

console.log(`Scanning templates in: ${TEMPLATES_DIR}`);

if (!fs.existsSync(TEMPLATES_DIR)) {
  console.error(`Directory not found: ${TEMPLATES_DIR}`);
  process.exit(1);
}

const files = fs.readdirSync(TEMPLATES_DIR);
const templates = files
  .filter(file => file.endsWith('.docx') && !file.startsWith('~$')) // Ignore temp files
  .map(file => {
    const stats = fs.statSync(path.join(TEMPLATES_DIR, file));
    return {
      id: `local-${file}`,
      name: file.replace('.docx', '').replace(/_/g, ' '),
      filename: file,
      path: `/templates/${file}`,
      size: stats.size,
      lastModified: stats.mtime
    };
  });

const manifest = {
  generatedAt: new Date().toISOString(),
  templates
};

fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2));

console.log(`Found ${templates.length} templates.`);
console.log(`Manifest written to: ${MANIFEST_FILE}`);
