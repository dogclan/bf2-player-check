import { Bot } from '../lib';
import Config from '../lib/config';
import logger from '../lib/logger';

const bot = new Bot(Config.TOKEN);
bot.run()
    .catch((error) => {
        if (error instanceof Error) {
            error = error.message;
        }
        logger.fatal(error);
    });
