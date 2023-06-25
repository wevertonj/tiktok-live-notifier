# TikTok Live Notifier

**Work in Progress - This project is currently in the early stages of development.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A Node.js application that connects to TikTok Live and provides notifications when a live stream starts.

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
TIKTOK_USERNAME=
```

- `DEBUG`: Set to `true` to enable debug mode, or leave it empty to disable debug mode.
- `ENABLE_LOGS`: Set to `true` to enable logging, or leave it empty to disable logging.
- `TIKTOK_USERNAME`: Your TikTok username.

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
