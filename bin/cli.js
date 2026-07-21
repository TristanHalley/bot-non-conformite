import { existsSync } from 'fs';
import path from 'path';
import { generateMarkdownReport } from '../src/core/reporters/markdownReporter.js';
import { loadAnalyzers } from '../src/utils/loadAnalyzers.js';
import git from 'simple-git';

// TODO: Parser les arguments (repo path, --analyzers)
const args = process.argv.slice(2);
// Charger les analyzers
const analyzerMap = await loadAnalyzers();

// Afficher l'aide
if (args.length === 0 || args.includes('--help')) {
    const availableAnalyzers = Object.keys(analyzerMap).join(', ');
    console.log("Usage: npm run audit /path/to/repo [--analyzers analyzer1,analyzer2]");
    console.log(`Available analyzers: ${availableAnalyzers}`);
    console.log("For a git URL: npm start -- https://github.com/user/repo.git");
    console.log("For a local repo: npm start -- /path/to/repo");
    process.exit(0);
}

// Parser le chemin du repo (peut être une URL Git)
const repoInput = args[0];

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

let repoPath = repoInput;
let tempDir = null;

try {
  // Si c'est une URL Git, cloner le repo dans un dossier temporaire
  if (/^(https?:\/\/|git@)/.test(repoInput)) {
    console.log(`\n📥 Cloning repository: ${repoInput}...`);
    tempDir = mkdtempSync(path.join(tmpdir(), 'audit-'));
    const repoGit = git(tempDir);
    repoPath = tempDir;
  }

  // Si c'est un chemin local, vérifier qu'il existe et c'est un repo Git
  if (!/^(https?:\/\/|git@)/.test(repoInput)) {
    if (!existsSync(repoPath)) {
      console.error(`❌ Repo path not found: ${repoPath}`);
      process.exit(1);
    }

    if (!isGitRepo(repoPath)) {
      console.error('❌ The provided path is not a valid Git repository.');
      process.exit(1);
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

  // Si on a cloné, copier le rapport localement
  if (tempDir) {
    console.log(`\n📄 Rapport généré: ${reportPath}`);
    const localReportPath = path.join(process.cwd(), 'conformite-report.md');
    try {
      copyFileSync(reportPath, localReportPath);
      console.log(`📄 Rapport copié: ${localReportPath}\n`);
    } catch (err) {
      console.warn(`⚠️ Failed to copy report to current directory: ${err.message}`);
    }
  } else {
    console.log(`\n📄 Rapport généré: ${reportPath}\n`);
  }

} catch (error) {
  console.error(`\n❌ Error: ${error.message}\n`);
  process.exit(1);
} finally {
  // Nettoyer le dossier temporaire
  if (tempDir) {
    console.log('🧹 Cleaning up temporary directory...');
    rmSync(tempDir, { recursive: true, force: true });
  }
}