import axios from 'axios';
import {
    ApplicationCommandOptionType,
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    EmbedBuilder, escapeMarkdown
} from 'discord.js';
import Constants from '../constants';
import { Provider } from '../types';
import { Command, Player, PlayerInfoResponse, VehicleStatsColumns } from './types';
import cmdLogger from './logger';
import {
    createStatsEmbed,
    fetchPlayerNameOptionChoices,
    filterInvalidEntries,
    formatTimePlayed,
    longestStringLen,
    resolvePlayerByName
} from './utility';

export const vehicles: Command = {
    name: 'vehicles',
    description: 'Get a player\'s vehicle stats',
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
            const embed = formatVehicleStats(player, resp.data);
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

function formatVehicleStats(player: Player, { data }: PlayerInfoResponse): EmbedBuilder {
    // Ignore fifth vehicle since it's values are always 0
    const vehicles = filterInvalidEntries(data.vehicles, Constants.INVALID_VEHICLE_IDS);
    const timeWithsFormatted = vehicles.map((v) => {
        return formatTimePlayed(v.time);
    });
    const kds = vehicles.map((v) => {
        const kd = v.kills / (v.deaths || 1);
        return kd.toFixed(2);
    });

    const padding = 4;
    const columns: VehicleStatsColumns = {
        category: {
            width: longestStringLen(Constants.VEHICLE_CATEGORY_LABELS, 10),
            heading: 'Category'
        },
        timeWith: {
            width: longestStringLen(timeWithsFormatted, 7),
            heading: 'Time'
        },
        kd: {
            width: longestStringLen(kds, 5),
            heading: 'K/D'
        }
    };

    // Start markdown embed
    let formatted = '```\n';

    // Add table headers
    let totalWidth = 0;
    const keys = Object.keys(columns) as (keyof VehicleStatsColumns)[];
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

    for (const vehicleInfo of vehicles) {
        const timeWith = timeWithsFormatted[vehicleInfo.id];
        const kd = kds[vehicleInfo.id];

        formatted += Constants.VEHICLE_CATEGORY_LABELS[vehicleInfo.id].padEnd(columns.category.width);
        formatted += timeWith.padEnd(columns.timeWith.width);
        formatted += kd.padEnd(columns.kd.width);
        formatted += '\n';
    }

    // End markdown embed
    formatted += '```';

    return createStatsEmbed({
        player: player,
        title: `Vehicle stats for ${escapeMarkdown(player.name)}`,
        description: formatted,
        lastBattle: data.timestamp.last_battle
    });
}
