const initLogger = () => {
    global.CUSTOM_EVENT.on("log", (data) => {
        let { level, message } = data;
        switch (level) {
            case "info":
                console.log("\x1b[36m", "[INFO]: ", '\x1b[0m', message);
                break;
            case "error":
                console.log("\x1b[31m", "[ERROR]: ", '\x1b[0m', message);
                break;
            case "success":
                console.log("\x1b[32m", "[SUCCESS]: ", '\x1b[0m', message);
                break;
            case "warning":
                console.log("\x1b[33m", "[WARNING]: ", '\x1b[0m', message);
                break;
            case "init":
                console.log("\x1b[35m", "[INIT]: ", '\x1b[0m', message);
                break;
            case 'debugger':
                console.log("\x1b[90m", "[DEBUGGER]: ", '\x1b[0m', message);
                break;
            default:
                console.log("\x1b[36m", "[INFO]: ", '\x1b[0m', message);
                break;
        }
    })
}

module.exports = {
    initLogger
}
