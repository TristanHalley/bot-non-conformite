import fs from 'fs';
import path from 'path';

export async function analyzeScopeCompliance(repoPath) {
    const result = {
        name: 'Scope Compliance (@CHANGEME)',
        passed: true,
        errors: [],
        details: []
    };

    try {
        const packageJsonPath = path.join(repoPath, 'package.json');
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const violations = [];
        const validScoped = [];

        const deps = packageJson.dependencies || {};
        for (const [pkg, version] of Object.entries(deps)) {
            if (pkg.startsWith('@CHANGEME/')) {
                violations.push(pkg);
            } else {
                validScoped.push(pkg);
            }
        }
        const devDeps = packageJson.devDependencies || {};
        for (const [pkg, version] of Object.entries(devDeps)) {
            if (pkg.startsWith('@CHANGEME/')) {
                violations.push(pkg);
            } else {
                validScoped.push(pkg);
            }
        }

        if (violations.length > 0) {
            result.passed = false;
            result.errors.push(`Found ${violations.length} package(s) with non-@CHANGEME scope:`);
            violations.forEach(v => result.errors.push(`  - ${v}`));
        }

        if (validScoped.length > 0) {
            result.details.push(`✓ ${validScoped.length} package(s) with @CHANGEME scope`);
        } else {
            result.details.push('ℹ No scoped packages found (this is OK if all packages are unscoped)');
        }

        return result;
    } catch (error) {
        result.passed = false;
        result.errors.push(`Error: ${error.message}`);
        return result;
    }
}