import {ERROR_MESSAGES} from "../errors/errorMessages.mjs";
import {resolve} from 'path';
import fs from 'fs/promises';
import {existsSync} from "fs";
import gitHelper from "./gitHelper.js";

/**
 * Récupère un fichier à la racine du projet (par exemple package.json ou sonar-project.properties)
 * @param fileName
 * @returns {string} Chemin absolu du fichier
 */
export function getFile(fileName) {
    const cwd = process.cwd();
    console.log('cwd', cwd)
    let filePath
    try {
        filePath = resolve(cwd, fileName);
    } catch(error) {
        console.error('error resolve : ', error.toString())
        throw new Error(ERROR_MESSAGES.PARAM_NO_VARCHAR(fileName), { cause: error });
    }
    console.log('filePath : ', filePath)
    if (!existsSync(filePath)) {
        throw new Error(ERROR_MESSAGES.FILE_NOT_FOUND(fileName));
    }
    return filePath;
}

export async function readFile(fileName) {
    const fileFound = getFile(fileName);
    try {
        return await fs.readFile(fileFound, 'utf-8')
    } catch (error) {
        throw new Error(ERROR_MESSAGES.FILE_NOT_READABLE(fileName), { cause: error });
    }
}

export async function getPackageJson(packageJsonName) {
    const data = await readFile(packageJsonName);
    try {
        return JSON.parse(data);
    } catch (error) {
        throw new Error(ERROR_MESSAGES.FILE_NOT_READABLE(packageJsonName), { cause: error });
    }
}