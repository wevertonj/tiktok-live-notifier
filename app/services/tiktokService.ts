import IDatabaseService from "../interfaces/iDatabaseService";
import IDiscordService from "../interfaces/iDiscordService";
import ILogger from "../interfaces/iLogger";

const { WebcastPushConnection } = require('tiktok-live-connector');
const sleep = require('sleep');

class TikTokService {
  private tiktokLiveConnection: typeof WebcastPushConnection;
  private discordService: IDiscordService;
  private databaseService: IDatabaseService;
  private username: string;
  private status: String = 'offline';
  private viewers: number = 0;
  private debug: boolean = false;
  private log: boolean = false;
  private logger: ILogger;

  constructor(username: string, discordService: IDiscordService, databaseService: IDatabaseService, debug: boolean, log: boolean, logger: ILogger) {
    this.discordService = discordService;
    this.databaseService = databaseService;
    this.username = username;
    this.debug = debug;
    this.log = log;
    this.logger = logger;

    this.tiktokLiveConnection = new WebcastPushConnection(this.username);
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
      const connect = await this.connectToChat();
      console.log('connect', connect);

      if (connect) {
        await this.disconnectFromChat();
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
          const connect = await this.connectToChat();

          if (connect && this.debug) {
            this.startChatListener();
          }

          if (this.debug && this.status) {
            console.log('Viewers: ', this.viewers);
          }
        }
        break;
      case 'connected':
        if (this.viewers === 0) {
          this.status = 'offline';
        }
        break;
      case 'disconnected':
        sleep.sleep(1800);
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
          console.log('Stream has ended');
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
        console.error(err);
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


      const startedTimestamp = state.roomInfo.create_time;
      const lastUpdate = await this.databaseService.get('lastUpdate');

      console.log('startedTimestamp', startedTimestamp);
      console.log('lastUpdate', lastUpdate);

      if (startedTimestamp != lastUpdate) {
        this.databaseService.set('lastUpdate', startedTimestamp);
        this.discordService.sendMessage(this.discordService.getMessage());
      }



      if (this.debug) {
        console.info(`Connected to roomId ${state.roomId}`);
      }

      if (this.log) {
        console.info(`Connected to roomId ${state.roomId}`);
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
