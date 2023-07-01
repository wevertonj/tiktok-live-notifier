import Logger from './utils/logger';
import TikTokService from './services/tiktokService';
import ILogger from './interfaces/iLogger';

class App {
  private enableLogs: boolean;
  private debug: boolean;
  private username: string;
  private useVariableInterval: boolean;
  private defaultInterval: number;
  private minInterval: number;
  private maxInterval: number;

  private tikTokService: TikTokService;
  private logger: ILogger;

  constructor() {
    require('dotenv').config();

    this.enableLogs = process.env.ENABLE_LOGS === 'true';
    this.debug = process.env.DEBUG === 'true';
    this.username = process.env.TIKTOK_USERNAME || '';
    this.useVariableInterval = process.env.USE_VARIABLE_INTERVAL === 'true';
    this.defaultInterval = process.env.DEFAULT_INTERVAL_IN_SECONDS ? parseInt(process.env.DEFAULT_INTERVAL_IN_SECONDS) * 1000 : 60000;

    this.minInterval = process.env.MIN_INTERVAL_IN_SECONDS ? parseInt(process.env.MIN_INTERVAL_IN_SECONDS) * 1000 : 60000;
    this.maxInterval = process.env.MAX_INTERVAL_IN_SECONDS ? parseInt(process.env.MAX_INTERVAL_IN_SECONDS) * 1000 : 90000;

    if (this.username === '') {
      throw new Error('Please set TIKTOK_USERNAME environment variable');
    }

    this.logger = new Logger();
    this.tikTokService = new TikTokService(this.username, this.debug, this.enableLogs, this.logger);
    
    this.runTikTokService((error?: Error) => {
      if (this.enableLogs) {
        if (error) {
          const errorToString = error.toString();
          this.logger.log(errorToString);
        } else {
          this.logger.log('Finished running TikTok Service');
        }
      }
    });
  }

  private async forceConnectToChat(): Promise<void> {
    const isConnected = await this.tikTokService.connectToChat();
    if (isConnected) {
      this.tikTokService.startChatListener();
    }
  }

  private runTikTokService(callback: (error?: Error) => void): void {
    let interval: NodeJS.Timeout;

    const runWithVariableInterval = () => {
      try {
        this.tikTokService.run();
      } catch (error: any) {
        clearInterval(interval);
        callback(error);
      }

      if (this.useVariableInterval) {
        const variableInterval = Math.random() * (this.maxInterval - this.minInterval) + this.minInterval;
        clearInterval(interval);
        interval = setTimeout(runWithVariableInterval, variableInterval);

        if (this.debug) {
          console.log('Random interval: ', parseInt(variableInterval.toString()));
        }
      } else {
        interval = setTimeout(runWithVariableInterval, this.defaultInterval);
      }
    };

    interval = setTimeout(runWithVariableInterval, this.defaultInterval);
  }
}

new App();