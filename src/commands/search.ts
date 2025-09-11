import axios from 'axios';
import { ApplicationCommandOptionType, ChatInputCommandInteraction, EmbedBuilder, EmbedField } from 'discord.js';
import Constants from '../constants';
import { Project } from '../typing';
import {
    BflistServer,
    Command,
    EnrichedPlayerSearchResult,
    PlayerSearchResponse,
    SearchColumns
} from './typing';
import cmdLogger from './logger';
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
                { name: Constants.PROJECT_LABELS[Project.b2bf2], value: Project.b2bf2 }
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

        const url = new URL(
            `v2/players/${Project[project]}/search-nick/${encodeURIComponent(name)}`,
            'https://aspxstats.cetteup.com/'
        );

        url.searchParams.set('where', 'a');

        let data: PlayerSearchResponse;
        try {
            const resp = await axios.get(url.toString());
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
        for (const result of data.results) {
            const server = servers.find((s) => s.players.some((p) => {
                // Make sure pid matches
                // Comparing name leads to issues in rare cases where long player names are cut off
                return p.pid == result.pid;
            }));

            const enrichedResult: EnrichedPlayerSearchResult = result;
            if (server) {
                enrichedResult.currentServer = server.name;
            }

            enrichedResults.push(enrichedResult);
        }

        const embed = formatSearchResultList(name, project, enrichedResults);
        await interaction.editReply({ embeds: [embed] });
    }
};

function formatSearchResultList(name: string, project: Project, results: EnrichedPlayerSearchResult[]): EmbedBuilder {
    let formatted: string;
    const fields: EmbedField[] = [];
    results = results
        // Remove clan tags from names
        .map((r) => ({ ...r, 'nick': r.nick.trim().split(' ').pop() || r.nick }))
        // Filter out players who's clan tag matches but actual name does match the given name
        .filter((r) => r.nick.toLowerCase().includes(name.toLowerCase()));
    if (results.length > 0) {
        const serverNames = results.map((r) => {
            const serverName = r.currentServer?.trim() || '';
            return fitStringToLength(serverName, 18);
        });

        // Leave a few spaces between columns
        const padding = 3;
        const columns: SearchColumns = {
            name: {
                width: longestStringLen(results.map((r) => r.nick), 10),
                heading: 'Name'
            },
            pid: {
                width: longestStringLen(results.map((r) => r.pid.toString()), 6),
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

        for (const [index, result] of results.entries()) {
            const serverName = serverNames[index];

            formatted += `${result.nick.padEnd(columns.name.width, ' ') }`;
            // Align pid to the right for better readability
            formatted += `${result.pid.toString().padStart(columns.pid.width - padding, ' ') }${''.padEnd(padding, ' ')}`;
            formatted += `${serverName.padEnd(columns.currentServer.width, ' ') }\n`;
        }

        // End markdown embed
        formatted += '```';

        fields.push({
            name: 'Results',
            value: results.length.toString(),
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
