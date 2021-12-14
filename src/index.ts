import PlayerCheckBot from './PlayerCheckBot';
import Config from './config';
import logger from './logger';

logger.info('Starting status bot');
const bot = new PlayerCheckBot(Config.TOKEN);
