import axios from 'axios';
import {
    ApplicationCommandOptionType,
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    EmbedBuilder
} from 'discord.js';
import Constants from '../constants';
import { Project } from '../typing';
import { Command, MapStatsColumns, Player, PlayerMapInfoResponse } from './typing';
import cmdLogger from './logger';
import {
    createStatsEmbed,
    fetchPlayerNameOptionChoices,
    filterInvalidEntries,
    formatTimePlayed,
    longestStringLen
} from './utility';

export const maps: Command = {
    name: 'maps',
    description: 'Get a player\'s map stats',
    options: [
        {
            name: 'project',
            description: 'GameSpy-replacement project the player is using',
            type: ApplicationCommandOptionType.Integer,
            choices: [
                { name: Constants.PROJECT_LABELS[Project.bf2hub], value: Project.bf2hub },
                { name: Constants.PROJECT_LABELS[Project.playbf2], value: Project.playbf2 },
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
        const project = interaction.options.getInteger('project', true);
        const name = interaction.options.getString('name', true);

        let player: Player;
        try {
            const resp = await axios.get(`https://resolve-api.cetteup.com/persona/${Project[project]}/bf2/by-name/${encodeURIComponent(name)}`);
            player = {
                pid: resp.data.pid,
                name: resp.data.name,
                project: project
            };
        }
        catch (e: any) {
            if (e.isAxiosError && e?.response?.status == 404) {
                await interaction.editReply(`Sorry, could not find a BF2 player called "${name}" on ${Constants.PROJECT_LABELS[project as Project]}.`);
                return;
            }
            else {
                cmdLogger.error('Persona resolution request failed', name, Project[project], e?.response?.status, e?.code);
                await interaction.editReply(`Sorry, failed to resolve pid for ${name} on ${Constants.PROJECT_LABELS[project as Project]}.`);
                return;
            }
        }

        try {
            const resp = await axios.get('https://bf2-stats-jsonifier.cetteup.com/getplayerinfo', {
                params: {
                    pid: player.pid,
                    info: 'mtm-,mwn-,mls-',
                    groupValues: 1,
                    project: Project[player.project]
                }
            });
            const embed = formatMapStats(player, resp.data);
            await interaction.editReply({ embeds: [embed] });
        }
        catch (e: any) {
            cmdLogger.error('Failed to fetch player info for', player.name, Project[player.project], e?.response?.status, e?.code);
            await interaction.editReply(`Sorry, failed to fetch stats for ${player.name} from ${Constants.PROJECT_LABELS[player.project]}.`);
        }
    },
    autocomplete: async (interaction: AutocompleteInteraction) => {
        const project = interaction.options.getInteger('project');
        const focusedValue = interaction.options.getFocused();
        const choices = await fetchPlayerNameOptionChoices(project, focusedValue);
        await interaction.respond(choices);
    }
};

function formatMapStats(player: Player, stats: PlayerMapInfoResponse): EmbedBuilder {
    const maps = filterInvalidEntries(stats.grouped.maps, Constants.INVALID_MAP_IDS, false);
    const timeWithsFormatted: Record<number, string> = {};
    const winRates: Record<number, string> = {};
    for (const m of maps) {
        const secondsPlayed = Number(m.tm);
        timeWithsFormatted[m.id] = formatTimePlayed(secondsPlayed);
        const winRate = Number(m.wn) / (Number(m.wn) +  Number(m.ls) || 1) * 100;
        winRates[m.id] = `${winRate.toFixed(2)}%`;
    }

    const padding = 4;
    const columns: MapStatsColumns = {
        name: {
            width: longestStringLen(Object.values(Constants.MAP_LABELS), 10),
            heading: 'Map'
        },
        timeWith: {
            width: longestStringLen(Object.values(timeWithsFormatted), 7),
            heading: 'Time'
        },
        winRate: {
            width: longestStringLen(Object.values(winRates), 5),
            heading: 'Win rate'
        }
    };

    // Start markdown embed
    let formatted = '```\n';

    // Add table headers
    let totalWidth = 0;
    for (const key in columns) {
        const column = columns[key];

        // Add a few spaces of padding between tables
        column.width = key == 'winRate' ? column.width : column.width + padding;

        formatted += column.heading.padEnd(column.width);
        totalWidth += column.width;
    }

    formatted += '\n';

    // Add separator
    formatted += `${'-'.padEnd(totalWidth, '-')}\n`;

    for (const mapInfo of maps) {
        const timeWith = timeWithsFormatted[mapInfo.id];
        const winRate = winRates[mapInfo.id];

        formatted += Constants.MAP_LABELS[mapInfo.id].padEnd(columns.name.width);
        formatted += timeWith.padEnd(columns.timeWith.width);
        // No need for the usual padStart(width - padding) plus padEnd(padding), since win rate is the last column
        formatted += winRate.padStart(columns.winRate.width);
        formatted += '\n';
    }

    // End markdown embed
    formatted += '```';

    return createStatsEmbed({
        player: player,
        title: `Map stats for ${player.name}`,
        description: formatted,
        asOf: stats.asof,
    });
}
