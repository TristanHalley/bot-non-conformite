import { existsSync } from 'fs';
import path from 'path';
import { generateMarkdownReport } from '../src/core/reporters/markdownReporter.js';
import { loadAnalyzers } from '../src/utils/loadAnalyzers.js';

// TODO: Parser les arguments (repo path, --analyzers)
const args = process.argv.slice(2);
// Charger les analyzers
const analyzerMap = await loadAnalyzers();

// Afficher l'aide
if (args.length === 0 || args.includes('--help')) {
    const availableAnalyzers = Object.keys(analyzerMap).join(', ');
    console.log("Usage: npm run audit /path/to/repo [--analyzers analyzer1,analyzer2]");
    console.log(`Available analyzers: ${availableAnalyzers}`);
    console.log("For all analyzers: npm run audit /path/to/repo");
    console.log("For specific analyzers: npm run audit /path/to/repo --analyzers analyzer1,analyzer2");
    process.exit(0);
}

// Parser le chemin du repo
const repoPath = args[0];

if (!existsSync(repoPath)) {
  console.error(`❌ Repo path not found: ${repoPath}`);
  process.exit(1);
}

// Vérifier que c'est un repo Git


// Parser --analyzers flag
let selectedAnalyzers = Object.keys(analyzerMap); // Par défaut, tous
const analyzersArg = args.find(arg => arg.startsWith('--analyzers'));
if (analyzersArg) {
  const list = analyzersArg.split('=')[1];
  selectedAnalyzers = list.split(',');
}

// Valider les noms d'analyzers
for (const name of selectedAnalyzers) {
  if (!analyzerMap[name]) {
    console.warn(`⚠️  Unknown analyzer: ${name}`);
  }
}

console.log(`\n📋 Analyzing repository: ${repoPath}`);
console.log(`📊 Analyzers: ${selectedAnalyzers.join(', ')}\n`);

// Exécuter les analyzers
const results = [];

for (const name of selectedAnalyzers) {
  if (!analyzerMap[name]) continue;

  try {
    const result = await analyzerMap[name](repoPath);
    results.push(result);
  } catch (error) {
    console.error(`❌ Error running analyzer ${name}: ${error.message}`);
  }
}

// Générer le rapport
const reportPath = path.join(repoPath, 'conformite-report.md');
await generateMarkdownReport(results, repoPath, reportPath);

// Afficher le résumé en console
console.log('\n' + '='.repeat(60));
const passed = results.filter(r => r.passed).length;
const total = results.length;
console.log(`📊 Résumé: ${passed}/${total} règles respectées`);
console.log('='.repeat(60) + '\n');

for (const result of results) {
  const icon = result.passed ? '✅' : '❌';
  console.log(`${icon} ${result.name}`);
  if (result.errors.length > 0) {
    result.errors.forEach(e => console.log(`   ✗ ${e}`));
  }
}

console.log(`\n📄 Rapport généré: ${reportPath}\n`);