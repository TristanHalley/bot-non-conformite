import fs from 'fs';
import path from 'path';

export async function analyzeVersionPinning(repoPath) {
    const result = {
        name: 'Version Pinning',
        passed: true,
        errors: [],
        details: []
    };

    try {
        const packageJsonPath = path.join(repoPath, 'package.json');
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

        const violations = [];

        // Vérifier dependencies
        const deps = packageJson.dependencies || {};
        for (const [pkg, version] of Object.entries(deps)) {
            if (version.startsWith('^') || version.startsWith('~')) {
                violations.push(`${pkg}@${version}`);
            }
        }

        // Vérifier devDependencies
        const devDeps = packageJson.devDependencies || {};
        for (const [pkg, version] of Object.entries(devDeps)) {
            if (version.startsWith('^') || version.startsWith('~')) {
                violations.push(`${pkg}@${version}`);
            }
        }

        if (violations.length > 0) {
            result.passed = false;
            result.errors.push(`Found ${violations.length} unpinned version(s):`);
            violations.forEach(v => result.errors.push(`  - ${v}`));
        } else {
            result.details.push('✓ All versions are pinned');
        }

        return result;
    } catch (error) {
        result.passed = false;
        result.errors.push(`Error: ${error.message}`);
        return result;
    }
}