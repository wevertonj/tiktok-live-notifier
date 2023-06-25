import Logger from './logs/logger';
import TikTokService from './services/tiktokService';
require('dotenv').config();

// (async () => {
//   const tikTokService = new TikTokService();

//   const isConnected = await tikTokService.connectToChat();
//   if (isConnected) {
//     tikTokService.startChatListener();
//   }
// })();

function runTikTokService(callback: (error?: Error) => void): void {
  const tiktokService = new TikTokService();
  
  const interval = setInterval(() => {
    try {
      tiktokService.run();
    } catch (error: any) {
      clearInterval(interval);
      callback(error);
    }
  }, 10000);
}

runTikTokService((error?: Error) => {
  const logger = new Logger();
  if (error) {
    const errorToString = error.toString();
    logger.log(errorToString);
  } else {
    logger.log('Finished running TikTok Service');
  }
});

