import IDatabaseService from "../interfaces/iDatabaseService";
import IDiscordService from "../interfaces/iDiscordService";
import ILogger from "../interfaces/iLogger";

const { WebcastPushConnection } = require('tiktok-live-connector');
import { HttpsProxyAgent } from 'https-proxy-agent';

class TikTokService {
  private tiktokLiveConnection: typeof WebcastPushConnection;
  private discordService: IDiscordService;
  private databaseService: IDatabaseService;
  private usingProxy: boolean = false;
  private proxyType: string;
  private username: string;
  private status: String = 'offline';
  private createTimestamp: number = 0;
  private viewers: number = 0;
  private minViewers: number;
  private minUpdateInterval: number;
  private debug: boolean = false;
  private log: boolean = false;
  private logger: ILogger;

  constructor(
    {
      username,
      discordService,
      proxyAccess,
      proxyType,
      proxyTimeout,
      databaseService,
      minViewers,
      minUpdateInterval,
      debug,
      log,
      logger
    }:
      {
        username: string;
        discordService: IDiscordService;
        proxyAccess: string;
        proxyType: string;
        proxyTimeout: number;
        databaseService: IDatabaseService;
        minViewers: number;
        minUpdateInterval: number;
        debug: boolean;
        log: boolean;
        logger: ILogger;
      }
  ) {
    this.discordService = discordService;
    this.databaseService = databaseService;
    this.username = username;
    this.minViewers = minViewers;
    this.minUpdateInterval = minUpdateInterval;
    this.debug = debug;
    this.log = log;
    this.logger = logger;
    this.proxyType = proxyType;

    if (proxyAccess !== '') {
      let proxyOptions: Object;

      if (this.proxyType === 'http') {
        proxyOptions = {
          requestOptions: {
            httpsAgent: new HttpsProxyAgent(proxyAccess),
            timeout: proxyTimeout
          }
        };
      } else {
        proxyOptions = {
          websocketOptions: {
            httpsAgent: new HttpsProxyAgent(proxyAccess),
            timeout: proxyTimeout
          }
        };
      }

      this.tiktokLiveConnection = new WebcastPushConnection(this.username, proxyOptions);

      this.usingProxy = true;
    } else {
      this.tiktokLiveConnection = new WebcastPushConnection(this.username);
    }

    this.connected();
    this.disconnected();
    this.viewerCount();
    this.error();
  }

  async runViaExpress(): Promise<void> {
    const color = '\x1b[35m';
    const resetColor = '\x1b[0m';
    const time = this.getCurrentTimeFormatted();

    await this.roomInfo();
    if (this.viewers > 1) {
      if (!this.usingProxy || this.proxyType === 'socks5') {
        const connect = await this.connectToChat();
        console.log('connect', connect);

        if (connect) {
          await this.disconnectFromChat();
        }
      } else {
        await this.isLiveStreaming();
      }
      if (this.debug && this.status) {
        console.log('Viewers: ', this.viewers);
      }
    }

    if (this.debug) {
      console.log(`${color}[${time}] Status: ${this.status}${resetColor}`);
    }
  }

  async runViaInterval(): Promise<void> {
    const color = '\x1b[35m';
    const resetColor = '\x1b[0m';
    const time = this.getCurrentTimeFormatted();

    switch (this.status) {
      case 'offline':
        await this.roomInfo();

        if (this.viewers > 1) {
          if (!this.usingProxy || this.proxyType === 'socks5') {
            const connect = await this.connectToChat();

            if (connect && this.debug) {
              this.startChatListener();
            }

            if (this.debug && this.status) {
              console.log('Viewers: ', this.viewers);
            }
          } else {
            await this.isLiveStreaming();
          }
        }
        break;
      case 'connected':
        if (this.viewers === 0) {
          this.status = 'offline';
        }
        break;
      case 'disconnected':
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1800000);
        this.status = 'offline';
        break;
      case 'ended':
        break;
      default:
        break;
    }

    if (this.debug && this.status !== 'connected') {
      console.log(`${color}[${time}] Status: ${this.status}${resetColor}`);
    }
  }

  async isLiveStreaming() {
    const currentTime = Math.floor(Date.now() / 1000);
    const startedTime = this.createTimestamp;
    const lastUpdate: number = await this.databaseService.get('lastUpdate') || 0;
    const lastUpdateStartedTime: number = await this.databaseService.get('lastUpdateStartedTime') || 0;
    let isLive = false;

    const validateLastUpdate: boolean = (lastUpdate + this.minUpdateInterval) < currentTime;
    const validateLastUpdateStartedTime: boolean = (lastUpdateStartedTime + this.minUpdateInterval) < startedTime;
    const validateViewers: boolean = this.viewers >= this.minViewers;

    if (validateLastUpdate && validateLastUpdateStartedTime && validateViewers) {
      await this.databaseService.set('lastUpdate', currentTime);
      await this.databaseService.set('lastUpdateStartedTime', startedTime);

      this.discordService.sendMessage(this.discordService.getMessage());
      this.status = 'connected';
      isLive = true;
    } else if (validateViewers) {
      await this.databaseService.set('lastUpdate', currentTime);
    }

    return isLive;
  }

  async connectToChat(): Promise<boolean> {
    try {
      const state = await this.tiktokLiveConnection.connect();

      if (this.debug) {
        await this.roomInfo(true);
      }

      if (this.log) {
        this.logger.log(`Connected to roomId ${state.roomId}`);
      }


      return true;
    } catch (err: any) {
      if (!err.message.includes('LIVE has ended')) {
        if (this.debug) {
          console.log(err.message);
        }

        if (this.log) {
          this.logger.log(err);
        }
      }

      return false;
    }
  }

  async disconnectFromChat(): Promise<boolean> {
    try {
      await this.tiktokLiveConnection.disconnect();

      return true;
    } catch (err: any) {
      if (this.debug) {
        console.error(err);
      }

      if (this.log) {
        this.logger.log(err);
      }

      return false;
    }
  }

  async roomInfo(showIntro = false): Promise<any> {
    try {
      const currentTime = Math.floor(Date.now() / 1000);
      const roomInfo = await this.tiktokLiveConnection.getRoomInfo();
      this.viewers = roomInfo.user_count;
      this.createTimestamp = roomInfo.create_time;
      const startedLessThan5MinutesAgo = currentTime - roomInfo.create_time < 300;

      if ((showIntro || startedLessThan5MinutesAgo) && this.debug) {
        const createDateTime = new Date(roomInfo.create_time * 1000);
        const day = createDateTime.getDate().toString().padStart(2, '0');
        const month = (createDateTime.getMonth() + 1).toString().padStart(2, '0');
        const year = createDateTime.getFullYear();
        const hours = createDateTime.getHours().toString().padStart(2, '0');
        const minutes = createDateTime.getMinutes().toString().padStart(2, '0');
        const seconds = createDateTime.getSeconds().toString().padStart(2, '0');

        const formattedDateTime = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;

        const cyanColor = '\x1b[36m';
        const yellowColor = '\x1b[33m';
        const resetColor = '\x1b[0m';

        console.log(`\n${cyanColor}Stream started at: ${formattedDateTime}, Streamer bio: ${roomInfo.owner.bio_description}${resetColor}`);
        console.log(`${yellowColor}HLS URL: ${roomInfo.stream_url.hls_pull_url}${resetColor}`);
        console.log(`Viewers: ${roomInfo.user_count}\n`);

      }

      if ((showIntro || startedLessThan5MinutesAgo) && this.log) {
        this.logger.log(`Stream started timestamp: ${roomInfo.create_time}`);
        this.logger.log(`HLS URL: ${roomInfo.stream_url.hls_pull_url}`);
      }

      return roomInfo;
    } catch (err: any) {
      if (err.message.includes('LIVE has ended') || this.debug) {
        console.error(err.message);
      }

      if (this.log) {
        this.logger.log(err);
      }

      return false;
    }
  }

  startChatListener() {
    this.tiktokLiveConnection.on('chat', this.handleChatEvent.bind(this));
  }

  private handleChatEvent(data: { uniqueId: number; userId: number; comment: string; }) {
    this.printChatMessage(data);
  }

  private getCurrentTimeFormatted(): string {
    const date = new Date();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return hours + ":" + minutes + ":" + seconds;
  }

  private printChatMessage(data: { uniqueId: number; userId: number; comment: string; }) {
    const colorReset = "\x1b[0m";
    const timeColor = "\x1b[34m";
    const uniqueIdColor = "\x1b[32m";
    const time = this.getCurrentTimeFormatted();

    console.info(`${timeColor}[${time}]${colorReset} ${uniqueIdColor}${data.uniqueId}${colorReset}: ${data.comment}`);
  }

  /** Events */
  private connected() {
    this.tiktokLiveConnection.on('connected', async (state: any) => {
      this.status = 'connected';


      const currentTime = Math.floor(Date.now() / 1000);
      const startedTimestamp = state.roomInfo.create_time;
      const lastUpdate = await this.databaseService.get('lastUpdate');
      const lastUpdateStartedTime = await this.databaseService.get('lastUpdateStartedTime');

      await this.databaseService.set('lastUpdate', currentTime);

      if ((lastUpdate + this.minUpdateInterval) < currentTime && startedTimestamp != lastUpdateStartedTime) {
        await this.databaseService.set('lastUpdateStartedTime', startedTimestamp);
        this.discordService.sendMessage(this.discordService.getMessage());
      }



      if (this.debug) {
        console.info(`Connected to roomId ${state.roomId}`);
      }

      if (this.log) {
        this.logger.log(`Connected to roomId ${state.roomId}`);
      }
    });
  }

  private disconnected() {
    this.tiktokLiveConnection.on('disconnected', () => {
      this.status = 'disconnected';

      if (this.debug) {
        console.log('Disconnected!');
      }

      if (this.log) {
        this.logger.log('Disconnected!');
      }
    });
  }

  private viewerCount() {
    this.tiktokLiveConnection.on('roomUser', (data: { viewerCount: number; }) => {
      this.viewers = data.viewerCount;
    });
  }

  private error() {
    this.tiktokLiveConnection.on('error', (err: Error) => {
      if (this.debug) {
        console.error(err);
      }

      if (this.log) {
        this.logger.log(err);
      }
    });
  }
}

export default TikTokService;
