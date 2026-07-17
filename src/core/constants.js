export const COMMANDS =
    {
        GIT_COMMAND_GET_REMOTE: {
            bin : 'git',
            args : ['remote'],
        },
        GIT_COMMAND_GET_CURRENT_BRANCH: {
            bin : 'git',
            args : ['rev-parse', '--abbrev-ref', 'HEAD'],
        },
        // Récupère toutes les références de tags depuis le dépôt distant et les stocke dans votre dépôt local.
        // Cela ne modifie pas votre branche actuelle, mais met à jour les références de tags.
        GIT_COMMAND_FETCH_TAGS: {
            bin : 'git',
            args : ['fetch', '--tags'],
        },
        GIT_COMMAND_GET_TAGS: {
            bin : 'git',
            args : ['tag'],
        },
        GIT_COMMAND_GET_VERSION_FROM_PACKAGE_JSON: (tag) => ({
            bin : 'git',
            args : ['show', `${tag}:package.json`]
        }),
        GIT_COMMAND_GET_REMOTE_URL: (remoteName) => ({
            bin : 'git',
            args : ['config', '--get', `remote.${remoteName}.url`],
        })
    }