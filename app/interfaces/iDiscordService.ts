interface  IDiscordService {
    message: string;
    getMessage(): string;
    sendMessage(message: string): void;
}

export default IDiscordService;