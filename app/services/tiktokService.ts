import Logger from "../logs/logger";

require('dotenv').config();
const { WebcastPushConnection } = require('tiktok-live-connector');
const sleep = require('sleep');

class TikTokService {
  private tiktokLiveConnection: typeof WebcastPushConnection;
  private username: string;
  private status: String = 'offline';
  private debug: boolean = false;
  private log: boolean = false;
  private logger: Logger = new Logger();

  constructor() {
    this.username = process.env.TIKTOK_USERNAME || '';
    this.debug = process.env.DEBUG === 'true';
    this.log = process.env.ENABLE_LOGS === 'true';

    if (this.username === '') {
      throw new Error('Please set TIKTOK_USERNAME environment variable');
    }

    this.tiktokLiveConnection = new WebcastPushConnection(this.username);
    this.connected();
    this.disconnected();
  }

  async run(): Promise<void> {
    const color = '\x1b[35m';
    const resetColor = '\x1b[0m';
    const time = this.getCurrentTimeFormatted();

    if (this.debug) {
      console.log(`${color}[${time}] Initial Status: ${this.status}${resetColor}`);
    }

    switch (this.status) {
      case 'offline':
        const connect = await this.connectToChat();
        if (connect && this.debug) {
          this.startChatListener();
        } else {
          this.status = 'ended';
        }
        break;
      case 'connected':
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

    if (this.debug) {
      console.log(`${color}[${time}] Final Status: ${this.status}${resetColor}`);
    }
  }

  async connectToChat(): Promise<boolean> {
    try {
      const state = await this.tiktokLiveConnection.connect();

      if (this.debug) {
        console.info(`Connected to roomId ${state.roomId}`);
        await this.roomInfo();
      }

      if (this.log) {
        this.logger.log(`Connected to roomId ${state.roomId}`);
      }


      return true;
    } catch (err: any) {
      if (err.message !== 'LIVE has ended' || this.debug) {
        console.error(err);
      }

      if (this.log) {
        this.logger.log(err);
      }

      return false;
    }
  }

  async roomInfo(): Promise<any> {
    try {
      const roomInfo = await this.tiktokLiveConnection.getRoomInfo();

      if (this.debug) {
        console.log(roomInfo.create_time);
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

        console.log(`\n${cyanColor}Stream started timestamp: ${formattedDateTime}, Streamer bio: ${roomInfo.owner.bio_description}${resetColor}`);
        console.log(`${yellowColor}HLS URL: ${roomInfo.stream_url.hls_pull_url}${resetColor}\n`);

      }

      if (this.log) {
        this.logger.log(`Stream started timestamp: ${roomInfo.create_time}`);
        this.logger.log(`HLS URL: ${roomInfo.stream_url.hls_pull_url}`);
      }

      return roomInfo;
    } catch (err: any) {
      if (err.message !== 'LIVE has ended' || this.debug) {
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
    this.tiktokLiveConnection.on('connected', (state: any) => {
      this.status = 'connected';

      if (this.debug) {
        console.log('Connected!', state);
      }

      if (this.log) {
        this.logger.log('Connected!');
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
}

export default TikTokService;
