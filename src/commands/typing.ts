import { AutocompleteInteraction, ChatInputApplicationCommandData, ChatInputCommandInteraction } from 'discord.js';

export interface Command extends ChatInputApplicationCommandData {
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
    autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
}
