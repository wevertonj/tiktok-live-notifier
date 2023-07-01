interface ILogger {
    log(message: string | Error): void;
    sendToMonitoring(message: string | Error): void;
}

export default ILogger;