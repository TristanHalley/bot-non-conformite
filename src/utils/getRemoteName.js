export function getRemoteName() {
    try {
        const { bin, args } = COMMANDS.GIT_COMMAND_GET_REMOTE
        return safeExec(bin, args).stdout.trim()
    } catch (error) {
        console.error(ERROR_MESSAGES.COMMAND_GET_REMOTE, {
            name: error.name,
            message: error.message,
            stack: error.stack,
            ...error
        });
        throw new Error(ERROR_MESSAGES.COMMAND_GET_REMOTE_NAME, {cause: error});
    }
}

