import fs from 'fs';
import path from 'path';
import ILogger from '../interfaces/iLogger';

class Logger implements ILogger {
  private logsDir: string;
  private sentry: typeof import("@sentry/node") | false;

  constructor(sentry?: typeof import("@sentry/node")) {
    if (sentry) {
      this.sentry = sentry;
    } else {
      this.sentry = false;
    }

    this.logsDir = path.join(__dirname, '../logs');
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir);
    }
  }

  private getLogFilePath(): string {
    const currentDate = new Date().toISOString().split('T')[0];
    const logFilePath = path.join(this.logsDir, `log_${currentDate}.log`);

    return logFilePath;
  }

  private getCurrentTimestamp(): string {
    return new Date().toISOString();
  }

  public log(message: string | Error): void {  
    let logMessage: string;
    if (message instanceof Error) {
      logMessage = `[${this.getCurrentTimestamp()}] ${message.stack}\n`;
    } else {
      logMessage = `[${this.getCurrentTimestamp()}] ${message}\n`;
    }
  
    fs.appendFile(this.getLogFilePath(), logMessage, (error) => {
      if (error) {
        console.error('Error while saving the log:', error);
      }
    });

    this.sendToMonitoring(message);
  }  

  public sendToMonitoring(message: string | Error): void {
    if (this.sentry && message instanceof Error) {
      this.sentry.captureException(message);
    }
  }
}

export default Logger;
