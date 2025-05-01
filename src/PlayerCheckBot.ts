import {
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    Client,
    GatewayIntentBits,
    Interaction
} from 'discord.js';
import { Logger } from 'tslog';
import { Command } from './commands/typing';
import { search } from './commands/search';
import { summary } from './commands/summary';
import { weapons } from './commands/weapons';
import { vehicles } from './commands/vehicles';
import { kits } from './commands/kits';
import logger from './logger';
import { leaderboard } from './commands/leaderboard';
import { maps } from './commands/maps';
import { armies } from './commands/armies';
import { activity } from './commands/activity';

class PlayerCheckBot {
    private token: string;

    private client: Client;
    private logger: Logger;

    private commands: Command[];

    constructor(token: string) {
        this.token = token;

        this.logger = logger.getChildLogger({ name: 'BotLogger' });
        this.client = new Client({ intents: [GatewayIntentBits.Guilds] });

        this.commands = [
            activity,
            armies,
            kits,
            leaderboard,
            maps,
            search,
            summary,
            vehicles,
            weapons
        ];

        this.client.once('ready', () => {
            this.client.user?.presence.set({ status: 'online' });

            this.logger.info('Client is ready, registering commands');
            this.client.application?.commands.set(this.commands);

            this.logger.info('Initialization complete, listening for commands');
        });

        this.client.on('interactionCreate', async (interaction: Interaction) => {
            if (interaction.isChatInputCommand()) {
                try {
                    await this.handleChatInputCommand(interaction);
                }
                catch (e: any) {
                    this.logger.error('Failed to handle chat input command interaction', e.message);
                }
            }
            else if (interaction.isAutocomplete()) {
                try {
                    await this.handleAutocomplete(interaction);
                }
                catch (e: any) {
                    this.logger.error('Failed to handle autocomplete interaction', e.message);
                }
            }
        });

        logger.info('Logging into Discord using token');
        this.client.login(this.token);
    }

    private async handleChatInputCommand(interaction: ChatInputCommandInteraction): Promise<void> {
        const command = this.commands.find(c => c.name === interaction.commandName);

        if (!command) {
            this.logger.error('Received chat input command interaction with unknown command name', interaction.commandName);
            return;
        }

        await command.execute(interaction);
    }

    private async handleAutocomplete(interaction: AutocompleteInteraction): Promise<void> {
        const command = this.commands.find(c => c.name === interaction.commandName);

        if (!command) {
            this.logger.error('Received autocomplete interaction with unknown command name', interaction.commandName);
            return;
        }
        else if (!command.autocomplete) {
            this.logger.error('Received autocomplete interaction for command without autocomplete handler', interaction.commandName);
            return;
        }

        await command.autocomplete(interaction);
    }
}

export default PlayerCheckBot;
