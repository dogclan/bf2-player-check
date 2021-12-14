import { Client, CommandInteraction, Intents, Interaction } from 'discord.js';
import { Logger } from 'tslog';
import { Command } from './commands/typing';
import { search } from './commands/search';
import { summary } from './commands/summary';
import logger from './logger';

class PlayerCheckBot {
    private token: string;

    private client: Client;
    private logger: Logger;

    private commands: Command[];

    constructor(token: string) {
        this.token = token;

        this.logger = logger.getChildLogger({ name: 'BotLogger'});
        this.client = new Client({ intents: [Intents.FLAGS.GUILDS] });

        this.commands = [search, summary];

        this.client.once('ready', () => {
            this.logger.info('Client is ready, registering commands');
            this.client.application?.commands.set(this.commands);

            this.logger.info('Initialization complete, listening for commands');
        });

        this.client.on('interactionCreate', async (interaction: Interaction) => {
            if (interaction.isCommand()) {
                try {
                    await this.handleSlashCommand(interaction);
                }
                catch (e: any) {
                    this.logger.error('Failed to handle slash command', e.message);
                }
            }
        });

        logger.info('Logging into Discord using token');
        this.client.login(this.token);
    }

    private async handleSlashCommand(interaction: CommandInteraction): Promise<void> {
        const slashCommand = this.commands.find(c => c.name === interaction.commandName);

        if (!slashCommand) {
            interaction.followUp({ content: 'An error has occurred' });
            return;
        }

        await slashCommand.execute(interaction);
    }
}

export default PlayerCheckBot;
