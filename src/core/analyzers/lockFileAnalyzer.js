import { existsSync } from 'fs';
import { join } from 'path';
import {safeExec} from "../../utils/execHelper.js";
import {COMMANDS} from "../constants.js";
import {getRemoteName} from "../../utils/getRemoteName.js";

export async function analyzeLockFile(repoPath) {
    const result = {
        name: 'package-lock.json Tracking',
        passed: true,
        errors: [],
        details: []
    };

    try {
        const lockFilePath = join(repoPath, 'package-lock.json');

        if (!existsSync(lockFilePath)) {
            result.passed = false;
            result.errors.push('package-lock.json file is missing');
        }

        const { stdout } = safeExec('git', ['remote', 'get-url', repoPath]);


        return result;
    } catch (error) {
        result.passed = false;
        result.errors.push(`Error: ${error.message}`);
        return result;
    }
}