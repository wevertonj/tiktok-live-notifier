import Logger from './utils/logger';
import TikTokService from './services/tiktokService';
require('dotenv').config();

const enableLogs = process.env.ENABLE_LOGS === 'true';
const debug = process.env.DEBUG === 'true';

// (async () => {
//   const tikTokService = new TikTokService();

//   const isConnected = await tikTokService.connectToChat();
//   if (isConnected) {
//     tikTokService.startChatListener();
//   }
// })();

function runTikTokService(callback: (error?: Error) => void): void {
  const tiktokService = new TikTokService();
  const variableInterval = process.env.USE_VARIABLE_INTERVAL === 'true';
  const defaultInterval = process.env.DEFAULT_INTERVAL_IN_SECONDS ? parseInt(process.env.DEFAULT_INTERVAL_IN_SECONDS) * 1000 : 60000;
  const minInterval = process.env.MIN_INTERVAL_IN_SECONDS ? parseInt(process.env.MIN_INTERVAL_IN_SECONDS) * 1000 : 60000;
  const maxInterval = process.env.MAX_INTERVAL_IN_SECONDS ? parseInt(process.env.MAX_INTERVAL_IN_SECONDS) * 1000 : 90000;

  let interval: NodeJS.Timeout;

  const runWithVariableInterval = () => {
    try {
      tiktokService.run();
    } catch (error: any) {
      clearInterval(interval);
      callback(error);
    }

    if (variableInterval) {
      const variableInterval = Math.random() * (maxInterval - minInterval) + minInterval;
      clearInterval(interval);
      interval = setTimeout(runWithVariableInterval, variableInterval);

      if (debug) {
        console.log('Random interval: ', parseInt(variableInterval.toString()));
      }
    } else {
      interval = setTimeout(runWithVariableInterval, defaultInterval);
    }
  };

  interval = setTimeout(runWithVariableInterval, defaultInterval);
}



runTikTokService((error?: Error) => {
  if (enableLogs) {
    const logger = new Logger();
    if (error) {
      const errorToString = error.toString();
      logger.log(errorToString);
    } else {
      logger.log('Finished running TikTok Service');
    }
  }
});

