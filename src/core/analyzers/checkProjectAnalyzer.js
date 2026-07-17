import fs from 'fs';
import path from 'path';

export async function analyzeCheckProject(repoPath) {
    const result = {
        name: 'check-project Integration',
        passed: true,
        errors: [],
        details: []
    };

    try {
        const packageJsonPath = path.join(repoPath, 'package.json');
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const devDeps = packageJson.devDependencies || {};
        if (!devDeps['@CHANGEME/check-project']) {
            result.errors.push('Missing @CHANGEME/check-project');
            result.passed = false;
        }
        const scripts = packageJson.scripts || {};
        if (!scripts.preinstall) {
            result.errors.push('Missing preinstall script');
            result.passed = false;
        } else if (!scripts.preinstall.includes('check')) {
            result.errors.push('preinstall script does not contain "check"');
            result.passed = false;
        } else {
            result.details.push(`✓ preinstall script: "${scripts.preinstall}"`);
        }

        return result;
    } catch (error) {
        result.passed = false;
        result.errors.push(`Error reading package.json: ${error.message}`);
        return result;
    }
}