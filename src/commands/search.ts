import axios from 'axios';
import { ApplicationCommandOptionType, ChatInputCommandInteraction, EmbedBuilder, EmbedField } from 'discord.js';
import Constants from '../constants';
import { Project } from '../typing';
import {
    BflistServer,
    Command,
    EnrichedPlayerSearch,
    EnrichedPlayerSearchResult,
    PlayerSearchResponse,
    SearchColumns
} from './typing';
import cmdLogger from './logger';
import moment from 'moment/moment';
import { createEmbed, fitStringToLength, longestStringLen } from './utility';

export const search: Command = {
    name: 'search',
    description: 'Search for a player by their name',
    options: [
        {
            name: 'project',
            description: 'GameSpy-replacement project to search',
            type: ApplicationCommandOptionType.Integer,
            choices: [
                { name: Constants.PROJECT_LABELS[Project.bf2hub], value: Project.bf2hub },
                { name: Constants.PROJECT_LABELS[Project.playbf2], value: Project.playbf2 },
            ],
            required: true
        },
        {
            name: 'name',
            description: '(Partial) Player name to search for',
            type: ApplicationCommandOptionType.String,
            required: true
        }
    ],
    execute: async (interaction: ChatInputCommandInteraction) => {
        await interaction.deferReply();
        const project = interaction.options.getInteger('project', true);
        const name = interaction.options.getString('name', true);
        let data: PlayerSearchResponse;
        try {
            const resp = await axios.get('https://bf2-stats-jsonifier.cetteup.com/searchforplayers', {
                params: {
                    nick: name,
                    where: 'a',
                    project: Project[project]
                }
            });
            data = resp.data;
        }
        catch (e: any) {
            cmdLogger.error('Player search request failed', name, Project[project], e?.response?.status, e?.code);
            await interaction.editReply(`Sorry, search for "${name}" on ${Constants.PROJECT_LABELS[project as Project]} failed.`);
            return;
        }

        const servers: BflistServer[] = [];
        let page = 1;
        let hasNextPage: boolean;
        do {
            try {
                const resp = await axios.get(`https://api.bflist.io/bf2/v1/servers/${page}`, {
                    params: {
                        perPage: 100
                    }
                });
                servers.push(...resp.data);
                hasNextPage = page < Number(resp.headers?.['x-total-pages'] ?? 1);
                page++;
            }
            catch (e: any) {
                cmdLogger.error('Failed to fetch page of BF2 servers', e?.response?.status, e?.code);
                hasNextPage = false;
            }
        } while (hasNextPage);

        const enrichedResults: EnrichedPlayerSearchResult[] = [];
        for (const player of data.players) {
            const server = servers.find((s) => s.players.some((p) => {
                // Make sure pid matches
                // Comparing name leads to issues in rare cases where long player names are cut off
                return p.pid == Number(player.pid);
            }));

            const enrichedResult: EnrichedPlayerSearchResult = player;
            if (server) {
                enrichedResult.currentServer = server.name;
            }

            enrichedResults.push(enrichedResult);
        }

        const embed = formatSearchResultList(name, project, { asof: data.asof, players: enrichedResults });
        await interaction.editReply({ embeds: [embed] });
    }
};

function formatSearchResultList(name: string, project: Project, data: EnrichedPlayerSearch): EmbedBuilder {
    let formatted: string;
    const fields: EmbedField[] = [
        { name: 'As of', value: moment(Number(data.asof) * 1000).format('YYYY-MM-DD HH:mm:ss'), inline: true },
    ];
    const players = data.players
        // Remove clan tags from names
        .map((player) => ({ ...player, 'nick': player.nick.trim().split(' ').pop() || player.nick }))
        // Filter out players who's clan tag matches but actual name does match the given name
        .filter((player) => player.nick.toLowerCase().includes(name.toLowerCase()));
    if (players.length > 0) {
        const serverNames = players.map((p) => {
            const serverName = p.currentServer?.trim() || '';
            return fitStringToLength(serverName, 18);
        });

        // Leave a few spaces between columns
        const padding = 3;
        const columns: SearchColumns = {
            name: {
                width: longestStringLen(players.map((p) => p.nick), 10),
                heading: 'Name'
            },
            pid: {
                width: longestStringLen(players.map((p) => p.pid), 6),
                heading: 'PID'
            },
            currentServer: {
                width: longestStringLen(serverNames, 13),
                heading: 'Playing on'
            }
        };

        // Start markdown embed
        formatted = '```\n';

        // Add table headers
        let totalWidth = 0;
        for (const key in columns) {
            const column = columns[key];

            // Add a few spaces of padding between tables
            column.width = key == 'currentServer' ? column.width : column.width + padding;

            formatted += column.heading.padEnd(column.width, ' ');
            totalWidth += column.width;
        }

        formatted += '\n';

        // Add separator
        formatted += `${'-'.padEnd(totalWidth, '-')}\n`;

        for (const [index, player] of players.entries()) {
            const serverName = serverNames[index];

            formatted += `${player.nick.padEnd(columns.name.width, ' ') }`;
            // Align pid to the right for better readability
            formatted += `${player.pid.padStart(columns.pid.width - padding, ' ') }${''.padEnd(padding, ' ')}`;
            formatted += `${serverName.padEnd(columns.currentServer.width, ' ') }\n`;
        }

        // End markdown embed
        formatted += '```';

        fields.push({
            name: 'Results',
            value: players.length.toString(),
            inline: true
        }, {
            name: 'Results max.',
            value: Constants.PROJECT_RESULT_LIMITS[project].toString(),
            inline: true
        });
    }
    else {
        formatted = `Sorry, could not find any BF2 players who's name is/contains "${name}".`;
    }

    return createEmbed({
        title: `Search results for "${name}"`,
        description: formatted,
        fields,
        author: { name: Constants.PROJECT_LABELS[project], iconURL: Constants.PROJECT_ICONS[project], url: Constants.PROJECT_WEBSITES[project] }
    });
}
