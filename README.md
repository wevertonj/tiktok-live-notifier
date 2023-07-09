# TikTok Live Notifier

**Work in Progress - This project is currently in the early stages of development.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A Node.js application that connects to TikTok Live and provides notifications when a live stream starts.

## Disclaimer

⚠️ **Attention**: Please exercise caution when using this project. Continuous and frequent requests to TikTok's servers without appropriate intervals can lead to IP blocking or other restrictions imposed by TikTok. It's important to adjust the interval time appropriately to avoid any issues and ensure compliance with TikTok's usage policies. Use this project responsibly and at your own risk.

## Prerequisites

- Node.js v20.3.1 or higher

## Getting Started

1. Clone the repository:

    ```shell
    git clone https://github.com/wevertonj/tiktok-live-notifier.git
    cd tiktok-live-notifier
    ```

2. Install dependencies:

    ```shell
    npm install
    ```

3. Create a `.env` file in the root directory of the project and add the following:

    ```shell
    DEBUG=
    ENABLE_LOGS=
    USE_SENTRY=
    SENTRY_DSN=
    TIKTOK_USERNAME=
    USE_VARIABLE_INTERVAL=
    DEFAULT_INTERVAL_IN_SECONDS=
    MIN_INTERVAL_IN_SECONDS=
    MAX_INTERVAL_IN_SECONDS=
    USE_EXPRESS=
    ENDPOINT=
    PORT=
    PROXY_ACCESS=
    PROXY_TYPE=
    PROXY_TIMEOUT_IN_MILLISECONDS=
    MINIMUM_VIEWERS_TO_SEND_NOTIFICATION=
    MINIMUM_TIME_TO_SEND_NOTIFICATION_IN_SECONDS=
    SQLITE_FILE_PATH=
    DISCORD_TOKEN=
    DISCORD_CHANNEL_ID=
    DISCORD_MESSAGE=
    ```

    | Variable | Description | Default Value |
    | --- | --- | --- |
    | `DEBUG` | Set to `true` to enable debug mode, or leave it empty to disable debug mode. | `false` |
    | `ENABLE_LOGS` | Set to `true` to enable logging, or leave it empty to disable logging. | `false` |
    | `USE_SENTRY` | Set to `true` to enable Sentry, or leave it empty to disable Sentry. `ENABLE_LOGS` must be set to `true` to work. | `false` |
    | `SENTRY_DSN` | Your Sentry DSN. | Empty |
    | `TIKTOK_USERNAME` | Your TikTok username. | Empty |
    | `USE_VARIABLE_INTERVAL` | Set to `true` to use a variable interval, or leave it empty to use a fixed interval. | `false` |
    | `DEFAULT_INTERVAL_IN_SECONDS` | The default interval in seconds to check for live streams. | 60 |
    | `MIN_INTERVAL_IN_SECONDS` | The minimum interval in seconds to check for live streams. This is only used if `USE_VARIABLE_INTERVAL` is set to `true`. | 60* |
    | `MAX_INTERVAL_IN_SECONDS` | The maximum interval in seconds to check for live streams. This is only used if `USE_VARIABLE_INTERVAL` is set to `true`. | 90* |
    | `USE_EXPRESS` | Set to `true` to enable the Express server, or leave it empty to disable the Express server. | `false` |
    | `ENDPOINT` | The endpoint to use for the Express server. This is only used if `USE_EXPRESS` is set to `true`. | `/` |
    | `PORT` | The port to use for the Express server. This is only used if `USE_EXPRESS` is set to `true`. | 3000 |
    | `PROXY_ACCESS` | The proxy access type to use. Will only be used if some value is passed. Must be in the format 'https://username:password@host:port'. | Empty |
    | `PROXY_TYPE` | The proxy type to use. This is only used if `PROXY_ACCESS` is passed. The options is `http` or `socks5` | `http` |
    | `PROXY_TIMEOUT_IN_MILLISECONDS` | The proxy timeout in milliseconds. | 30000 |
    | `MINIMUM_VIEWERS_TO_SEND_NOTIFICATION` | The minimum number of viewers on chat to send a notification. | 10 |
    | `MINIMUM_TIME_TO_SEND_NOTIFICATION_IN_SECONDS` | The minimum time since the last update to send a new notification. Whenever the algorithm identifies that the user is live, it will update the last update time to the current time without sending a new notification. | 3600 |
    | `SQLITE_FILE_PATH` | The path to the SQLite file. | `sqlite://database.sqlite` |
    | `DISCORD_TOKEN` | Your Discord bot token. | Empty |
    | `DISCORD_CHANNEL_ID` | The Discord channel ID to send the notifications. | Empty |
    | `DISCORD_MESSAGE` | The Discord message to send when a live stream starts. Supports '\n' for line break. | Empty |

    \* Keep in mind that if you use the default values, TikTok will block your IP after some time.

4. Run the application:

    ```shell
    npm start
    ```

## Connecting the Discord Bot

To receive notifications in your Discord server, you need to connect your bot to the server. Follow the steps below to connect the bot:

1. [How to create a Discord bot](https://discordjs.guide/preparations/setting-up-a-bot-application.html) - Follow this tutorial to create a Discord bot and obtain a bot token.

2. [How to add a Discord bot to a server](https://discordjs.guide/preparations/adding-your-bot-to-servers.html) - Follow this tutorial to add the bot to your Discord server. The `applications.commands` scope is not required.

3. [How to get your Discord channel ID](https://support.discord.com/hc/en-us/articles/206346498-Where-can-I-find-my-User-Server-Message-ID-) - Follow this tutorial to find the channel ID of the Discord channel where you want to receive the notifications.

4. Once you have obtained the bot token and channel ID, open the `.env` file in the root directory of the project and update the following variables:

   - `DISCORD_TOKEN` - Set this variable to your Discord bot token.
   - `DISCORD_CHANNEL_ID` - Set this variable to the channel ID of the Discord channel.

5. Save the `.env` file.

Now, when a live stream starts, the application will send a notification to the specified Discord channel.

## Usage

The application will connect to TikTok Live and monitor for live streams. When a live stream starts, it will send a notification to the Discord channel defined in the `.env` file.

## Logging

If logging is enabled (`ENABLE_LOGS=true`), the application will save the logs to the `logs` directory.

## License

This project is licensed under the [MIT License](LICENSE).
