import fs from 'fs';
import path from 'path';

export async function generateMarkdownReport(results, repoPath, outputPath) {
    // 1. Compter les règles passées
    const passed = results.filter(r => r.passed).length;
    const total = results.length;

    // 2. Créer le contenu Markdown
    let markdown = `# Rapport d'audit\n\n`;
    markdown += `**Date:** ${new Date().toISOString()}\n`;
    markdown += `**Dépôt analysé:** ${repoPath}\n\n`;
    markdown += `## 📊 Résumé\n`;
    markdown += `${passed}/${total} règles respectées\n\n`;

    // 3. Détails de chaque analyzer
    markdown += `## Détails\n\n`;

    for (const result of results) {
        const icon = result.passed ? '✅' : '❌';
        markdown += `### ${icon} ${result.name}\n`;

        // Ajouter les détails (si tout est OK)
        if (result.details.length > 0) {
            result.details.forEach(d => {
                markdown += `${d}\n`;
            });
        }

        // Ajouter les erreurs (si y'a des problèmes)
        if (result.errors.length > 0) {
            result.errors.forEach(e => {
                markdown += `✗ ${e}\n`;
            });
        }

        markdown += `\n`;
    }

    // 4. Écrire le fichier
    fs.writeFileSync(outputPath, markdown);
    return outputPath;
}