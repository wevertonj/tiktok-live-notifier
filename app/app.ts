import express, { Request, Response } from 'express';
import Logger from './utils/logger';
import DiscordService from './services/discordService';
import TikTokService from './services/tiktokService';
import ILogger from './interfaces/iLogger';
import * as Sentry from "@sentry/node";
import DatabaseService from './services/databaseService';

class App {
  private enableLogs: boolean;
  private debug: boolean;
  private username: string;
  private useVariableInterval: boolean;
  private defaultInterval: number;
  private minInterval: number;
  private maxInterval: number;
  private useSentry: boolean;
  private sentryDsn: string;
  private useExpress: boolean;
  private expressApp: express.Application | undefined;
  private endpoint: string;
  private port: number;
  private proxyAccess: string;
  private proxyType: string;
  private proxyTimeout: number;
  private minViewers: number;
  private minUpdateInterval: number;
  private sqliteDbPath: string;
  private discordToken: string;
  private channelId: string;
  private discordMessage: string;

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
    this.useSentry = process.env.USE_SENTRY === 'true';
    this.sentryDsn = process.env.SENTRY_DSN || '';
    this.useExpress = process.env.USE_EXPRESS === 'true';
    this.endpoint = process.env.ENDPOINT || '/';
    this.port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    this.proxyAccess = process.env.PROXY_ACCESS || '';
    this.proxyType = process.env.PROXY_TYPE || 'http';
    this.proxyTimeout = process.env.PROXY_TIMEOUT_IN_MILLISECONDS ? parseInt(process.env.PROXY_TIMEOUT_IN_MILLISECONDS) : 30000;
    this.minViewers = process.env.MINIMUM_VIEWERS_TO_SEND_NOTIFICATION ? parseInt(process.env.MINIMUM_VIEWERS_TO_SEND_NOTIFICATION) : 10;
    this.minUpdateInterval = process.env.MINIMUM_TIME_TO_SEND_NOTIFICATION_IN_SECONDS ? parseInt(process.env.MINIMUM_TIME_TO_SEND_NOTIFICATION_IN_SECONDS) : 3600;
    this.sqliteDbPath = process.env.SQLITE_FILE_PATH || 'sqlite://database.sqlite';
    this.discordToken = process.env.DISCORD_TOKEN || '';
    this.channelId = process.env.DISCORD_CHANNEL_ID || '';
    this.discordMessage = process.env.DISCORD_MESSAGE || '';

    if (this.username === '') {
      throw new Error('Please set TIKTOK_USERNAME environment variable');
    }

    if (this.useSentry && this.sentryDsn === '') {
      throw new Error('Please set SENTRY_DSN environment variable');
    } else if (this.useSentry) {
      Sentry.init({ dsn: this.sentryDsn });
      this.logger = new Logger(Sentry);
    } else {
      this.logger = new Logger();
    }

    if (this.proxyType !== 'http' && this.proxyType !== 'socks5') {
      throw new Error('Proxy type must be http or socks5');
    }

    if (this.discordToken === '') {
      throw new Error('Please set DISCORD_TOKEN environment variable');
    }

    if (this.channelId === '') {
      throw new Error('Please set DISCORD_CHANNEL_ID environment variable');
    }

    if (this.discordMessage === '') {
      throw new Error('Please set DISCORD_MESSAGE environment variable');
    } else {
      this.discordMessage = this.discordMessage.replace(/\\n/g, '\n');
    }

    const discordService = new DiscordService(this.discordToken, this.channelId, this.debug, this.enableLogs, this.logger);
    discordService.message = this.discordMessage;

    const databaseService = new DatabaseService(this.sqliteDbPath, this.debug, this.enableLogs, this.logger);
    this.tikTokService = new TikTokService({
      username: this.username,
      discordService: discordService,
      databaseService: databaseService,
      minViewers: this.minViewers,
      minUpdateInterval: this.minUpdateInterval,
      proxyAccess: this.proxyAccess,
      proxyType: this.proxyType,
      proxyTimeout: this.proxyTimeout,
      debug: this.debug,
      log: this.enableLogs,
      logger: this.logger
    });

    if (this.useExpress) {
      this.expressApp = express();

      if (this.useSentry) {
        this.expressApp.use(Sentry.Handlers.requestHandler());
      }

      this.setupExpressRoutes();
      this.startExpressServer();
    } else {
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
  }

  private async forceConnectToChat(): Promise<void> {
    const isConnected = await this.tikTokService.connectToChat();
    if (isConnected) {
      this.tikTokService.startChatListener();
    }
  }

  private setupExpressRoutes(): void {
    this.expressApp!.get(this.endpoint, async (req: Request, res: Response) => {
      try {
        await this.tikTokService.runViaExpress();
        res.status(200).json({ message: 'TikTok service executed successfully.' });
      } catch (error: any) {
        res.status(500).json({ message: 'There was an error while processing the request. Please check the error log.' });
      }
    });
  }

  private startExpressServer(): void {
    this.expressApp!.listen(this.port, () => {
      console.log(`Server listening on port ${this.port}`);
    });
  }

  private runTikTokService(callback: (error?: Error) => void): void {
    let interval: NodeJS.Timeout;

    const runWithVariableInterval = () => {
      try {
        this.tikTokService.runViaInterval();
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