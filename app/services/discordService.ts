import IDiscordService from "../interfaces/iDiscordService";
import ILogger from "../interfaces/iLogger";
const { Client, Events, GatewayIntentBits } = require('discord.js');

class DiscordService implements IDiscordService {
    public message: string = '';
    private isReady: boolean = false;
    private token: String;
    private client: typeof Client;
    private channelId: string;
    private debug: boolean = false;
    private log: boolean = false;
    private logger: ILogger;

     constructor(token: String, channelId: string, debug: boolean, enableLogs: boolean, logger: ILogger) {
        this.token = token;
        this.channelId = channelId;
        this.debug = debug;
        this.log = enableLogs;
        this.logger = logger;
        this.client = new Client({ intents: [GatewayIntentBits.Guilds] });

        this.clientReady();

        this.client.login(this.token);
    }

    getMessage(): string {
        return this.message;
    }

    public async sendMessage(message: string) {
        try {
            await this.waitForClientReady();
            const channel = await this.client.channels.fetch(this.channelId);
            if (channel) {
                await channel.send(message);
                
                if (this.debug) {
                    console.info('Message sent successfully!');
                }
            } else {
                if (this.debug) {
                    console.log(`Unable to send message to channel with ID: ${this.channelId}`);
                }
            }
        } catch (error: any) {
            if (this.debug) {
                console.error('Error sending message:', error);
            }

            if (this.log) {
                this.logger.log(error);
            }
        }
    }

    private async clientReady() {
        await this.client.on(Events.ClientReady, async (c: { user: { tag: string; }; }) => {
            
            if (this.debug) {
                console.log(`Logged in as ${c.user.tag}!`);
            }

            this.isReady = true;
        });
    }

    private async waitForClientReady() {
        return new Promise((resolve) => {
            if (this.isReady) {
                resolve(true);
            } else {
                this.client.on(Events.ClientReady, () => {
                    resolve(true);
                });
            }
        });
    }
}

export default DiscordService;