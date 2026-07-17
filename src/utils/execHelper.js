// exec-helper.mjs
import { spawnSync } from 'child_process';

/**
 * Exécute une commande OS de façon sécurisée via spawnSync.
 *
 * Contrairement à execSync, spawnSync avec shell: false transmet les arguments
 * directement au processus enfant sans passer par un interpréteur shell —
 * ce qui rend l'injection de commande structurellement impossible.
 *
 * ## Deux usages distincts
 *
 * ```js
 * // git.mjs — capture de la sortie
 * const { bin, args } = COMMANDS.GIT_COMMAND_GET_CURRENT_BRANCH;
 * return safeExec(bin, args).stdout.trim(); // stdout disponible car stdio: 'pipe'
 *
 * // setup.mjs / runNpm — affichage direct dans le terminal
 * safeExec('npm', ['install'], { stdio: 'inherit' }); // surcharge explicite
 * ```
 *
 * stdio: 'pipe' est la valeur par défaut dans safeExec car c'est le cas le plus courant (on veut la valeur de retour).
 * Les commandes qui n'ont pas besoin de retour passent `{ stdio: 'inherit' }` explicitement.
 *
 * @param {string} bin - Binaire à exécuter (ex. 'npm', 'git')
 * @param {string[]} args - Arguments sous forme de tableau (jamais interpolés)
 * @param {object} options - Options spawnSync (env, cwd, stdio…)
 * @returns {import('child_process').SpawnSyncReturns<string>}
 * @throws {Error} Si le binaire est invalide, si la commande échoue, ou erreur système
 */
export function safeExec(bin, args = [], options = {}) {
    // Validation du binaire : lettres, chiffres, tirets, points, slashes
    if (typeof bin !== 'string' || !/^[\w.\-/]+$/.test(bin)) {
        console.log(bin)
        throw new Error(`Binaire invalide : "${bin}"`);
    }

    // Validation de chaque argument : même politique de caractères autorisés
    if (!Array.isArray(args)) {
        throw new Error('Les arguments doivent être un tableau');
    }
    for (const arg of args) {
        if (typeof arg !== 'string') {
            throw new Error(`Argument invalide (non-string) : ${JSON.stringify(arg)}`);
        }
    }

    const result = spawnSync(bin, args, {
        encoding : 'utf-8',
        shell : false,
        stdio : 'pipe', // ← capture stdout/stderr au lieu de les afficher
        ...options, // l'appelant peut passer stdio: 'inherit' si besoin
    });

    if (result.error) {
        throw result.error;
    }

    if (result.status !== 0) {
        throw new Error(
            `La commande "${bin} ${args.join(' ')}" a échoué (code ${result.status})\n${result.stderr ?? ''}`
        );
    }
    return result;
}