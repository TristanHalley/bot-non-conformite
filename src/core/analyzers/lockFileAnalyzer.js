import { existsSync } from 'fs';
import { join } from 'path';
import {safeExec} from "../../utils/execHelper.js";
import {COMMANDS} from "../constants.js";
import {getRemoteName} from "../../utils/getRemoteName.js";
import {isFileTracked} from "../../utils/gitHelper.js";

export async function analyzeLockFile(repoPath) {
    const result = {
        name: 'package-lock.json Tracking',
        passed: true,
        errors: [],
        details: []
    };

    try {
        if (!isFileTracked(repoPath, 'package-lock.json')) {
            result.passed = false;
            result.errors.push('package-lock.json is not tracked by Git');
        } else {
            result.details.push('✓ package-lock.json is tracked by Git');
        }


        return result;
    } catch (error) {
        result.passed = false;
        result.errors.push(`Error: ${error.message}`);
        return result;
    }
}