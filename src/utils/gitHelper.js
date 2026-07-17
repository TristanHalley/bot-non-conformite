import { safeExec } from './execHelper.js';

/**
 * Vérifier que c'est un repo Git valide
 */
export function isGitRepo(repoPath) {
  try {
    safeExec('git', ['rev-parse', '--git-dir'], { cwd: repoPath });
    return true;
  } catch {
    return false;
  }
}

/**
 * Vérifier qu'un fichier est tracké par Git
 */
export function isFileTracked(repoPath, fileName) {
  try {
    safeExec('git', ['ls-files', fileName], { cwd: repoPath });
    return true;
  } catch {
    return false;
  }
}
