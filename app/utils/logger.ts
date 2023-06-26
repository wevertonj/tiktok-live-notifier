import fs from 'fs';
import path from 'path';

class Logger {
  private logFilePath: string;

  constructor() {
    const logsDir = path.join(__dirname, '../logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir);
    }

    const currentDate = new Date().toISOString().split('T')[0];
    this.logFilePath = path.join(logsDir, `log_${currentDate}.log`);
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
  
    fs.appendFile(this.logFilePath, logMessage, (error) => {
      if (error) {
        console.error('Error while saving the log:', error);
      }
    });
  }  
}

export default Logger;
