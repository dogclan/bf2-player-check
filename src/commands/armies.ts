import axios from 'axios';
import {
    ApplicationCommandOptionType,
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    EmbedBuilder, escapeMarkdown
} from 'discord.js';
import Constants from '../constants';
import { Provider } from '../typing';
import { ArmyStatsColumns, Command, Player, PlayerInfoResponse } from './typing';
import cmdLogger from './logger';
import { createStatsEmbed, fetchPlayerNameOptionChoices, formatTimePlayed, longestStringLen, resolvePlayerByName } from './utility';

export const armies: Command = {
    name: 'armies',
    description: 'Get a player\'s army stats',
    options: [
        {
            name: 'provider',
            description: 'GameSpy-replacement provider the player is using',
            type: ApplicationCommandOptionType.Integer,
            choices: [
                { name: Constants.PROVIDER_LABELS[Provider.bf2hub], value: Provider.bf2hub },
                { name: Constants.PROVIDER_LABELS[Provider.playbf2], value: Provider.playbf2 },
            ],
            required: true
        },
        {
            name: 'name',
            description: 'Player name',
            type: ApplicationCommandOptionType.String,
            required: true,
            autocomplete: true
        }
    ],
    execute: async (interaction: ChatInputCommandInteraction) => {
        // Two request might take a moment => defer reply
        await interaction.deferReply();
        const provider = interaction.options.getInteger('provider', true) as Provider;
        const name = interaction.options.getString('name', true);

        let player: Player;
        try {
            player = await resolvePlayerByName(provider, name);
        }
        catch (e: any) {
            if (e.isAxiosError && e?.response?.status == 404) {
                await interaction.editReply(`Sorry, could not find a BF2 player called "${name}" on ${Constants.PROVIDER_LABELS[provider]}.`);
                return;
            }
            else {
                cmdLogger.error('Persona resolution request failed', name, Provider[provider], e?.response?.status, e?.code);
                await interaction.editReply(`Sorry, failed to resolve player id for ${name} on ${Constants.PROVIDER_LABELS[provider]}.`);
                return;
            }
        }

        const url = new URL(
            `/v2/players/${Provider[player.provider]}/by-id/${player.pid}/stats`,
            'https://aspxstats.cetteup.com/'
        );

        try {
            const resp = await axios.get(url.toString());
            const embed = formatArmyStats(player, resp.data);
            await interaction.editReply({ embeds: [embed] });
        }
        catch (e: any) {
            cmdLogger.error('Failed to fetch player info for', player.name, Provider[player.provider], e?.response?.status, e?.code);
            await interaction.editReply(`Sorry, failed to fetch stats for ${escapeMarkdown(player.name)} from ${Constants.PROVIDER_LABELS[player.provider]}.`);
        }
    },
    autocomplete: async (interaction: AutocompleteInteraction) => {
        const provider = interaction.options.getInteger('provider') as Provider | null;
        const focusedValue = interaction.options.getFocused();
        const choices = await fetchPlayerNameOptionChoices(provider, focusedValue);
        await interaction.respond(choices);
    }
};

function formatArmyStats(player: Player, { data }: PlayerInfoResponse): EmbedBuilder {
    const timeWithsFormatted = data.armies.map((k) => {
        return formatTimePlayed(k.time);
    });
    const wls = data.armies.map((k) => {
        const wl = k.wins / (k.losses || 1);
        return wl.toFixed(2);
    });

    const padding = 4;
    const columns: ArmyStatsColumns = {
        army: {
            width: longestStringLen(Constants.ARMY_LABELS, 14),
            heading: 'Army'
        },
        timeWith: {
            width: longestStringLen(timeWithsFormatted, 7),
            heading: 'Time'
        },
        wl: {
            width: longestStringLen(wls, 5),
            heading: 'W/L'
        }
    };

    // Start markdown embed
    let formatted = '```\n';

    // Add table headers
    let totalWidth = 0;
    const keys = Object.keys(columns) as (keyof ArmyStatsColumns)[];
    for (const [index, key] of keys.entries()) {
        const column = columns[key];

        // Add a few spaces of padding after columns, except for the last one
        column.width = index == keys.length - 1 ? column.width : column.width + padding;

        formatted += column.heading.padEnd(column.width, ' ');
        totalWidth += column.width;
    }

    formatted += '\n';

    // Add separator
    formatted += `${'-'.padEnd(totalWidth, '-')}\n`;

    for (const armyInfo of data.armies) {
        const timeWith = timeWithsFormatted[armyInfo.id];
        const wl = wls[armyInfo.id];

        formatted += Constants.ARMY_LABELS[armyInfo.id].padEnd(columns.army.width);
        formatted += timeWith.padEnd(columns.timeWith.width);
        formatted += wl.padEnd(columns.wl.width);
        formatted += '\n';
    }

    // End markdown embed
    formatted += '```';

    return createStatsEmbed({
        player: player,
        title: `Army stats for ${escapeMarkdown(player.name)}`,
        description: formatted,
        lastBattle: data.timestamp.last_battle
    });
}
