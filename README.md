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

    \* Keep in mind that if you use the default values, TikTok will block your IP after some time.

4. Run the application:

    ```shell
    npm start
    ```

## Usage

The application will connect to TikTok Live and monitor for live streams. When a live stream starts, it will provide notifications in the console.

## Logging

If logging is enabled (`ENABLE_LOGS=true`), the application will save the logs to the `logs` directory.

## License

This project is licensed under the [MIT License](LICENSE).
