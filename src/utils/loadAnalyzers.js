import { readdirSync } from 'fs';
import { resolve, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = __filename.substring(0, __filename.lastIndexOf('/'));

export async function loadAnalyzers() {
    const analyzersDir = join(__dirname, '../analyzers');
    const files = readdirSync(analyzersDir).filter(f => f.endsWith('Analyzer.js'));

    const analyzerMap = {};

    for (const file of files) {
        // Convertir "checkProjectAnalyzer.js" → "checkProject"
        const name = file.replace('Analyzer.js', '');
        const pascalName = name.charAt(0).toUpperCase() + name.slice(1);

        // Importer dynamiquement le module
        const module = await import(`../analyzers/${file}`);

        // Récupérer la fonction export (ex: "analyzeCheckProject")
        const funcName = `analyze${pascalName}`;
        analyzerMap[name] = module[funcName];
    }

    return analyzerMap;
}