import axios from 'axios';
import { ApplicationCommandOptionType, ChatInputCommandInteraction, EmbedBuilder, EmbedField } from 'discord.js';
import Constants from '../constants';
import { Provider } from '../types';
import { Command, EnrichedRegistryPlayer, RegistryPlayersResponse, SearchColumns } from './types';
import cmdLogger from './logger';
import { createEmbed, fitStringToLength, longestStringLen } from './utility';
import { getServers, Server } from '../bflist';

export const search: Command = {
    name: 'search',
    description: 'Search for a player by their name',
    options: [
        {
            name: 'provider',
            description: 'GameSpy-replacement provider to search',
            type: ApplicationCommandOptionType.Integer,
            choices: [
                { name: Constants.PROVIDER_LABELS[Provider.bf2hub], value: Provider.bf2hub },
                { name: Constants.PROVIDER_LABELS[Provider.playbf2], value: Provider.playbf2 },
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
        const provider = interaction.options.getInteger('provider', true) as Provider;
        const name = interaction.options.getString('name', true);

        const url = new URL(
            '/v1/players',
            'https://api.registry.bf2.co/'
        );

        url.searchParams.set('nick', name + '*');
        url.searchParams.set('provider', Provider[provider]);

        let data: RegistryPlayersResponse;
        try {
            const resp = await axios.get<RegistryPlayersResponse>(url.toString());
            data = resp.data;
        }
        catch (e: any) {
            cmdLogger.error('Player search request failed', name, Provider[provider], e?.response?.status, e?.code);
            await interaction.editReply(`Sorry, search for "${name}" on ${Constants.PROVIDER_LABELS[provider]} failed.`);
            return;
        }

        let servers: Server[] = [];
        try {
            servers = await getServers();
        } catch (e: unknown) {
            const error = axios.isAxiosError(e) ? e : undefined;
            cmdLogger.error('Failed to fetch servers from bflist', error?.response?.status, error?.code);
        }

        const players: EnrichedRegistryPlayer[] = [];
        for (const player of data.players) {
            const server = servers.find((s) => s.players.some((p) => {
                if (p.pid != player.pid) {
                    return false;
                }

                // Comparing names directly leads to false negatives when long player names are cut off due to long tags
                if (player.nick.length + p.tag.length > 22) {
                    return p.name.toLowerCase() == player.nick.slice(0, 22 - Math.min(p.tag.length, 6)).toLowerCase();
                }

                return p.name.toLowerCase() == player.nick.toLowerCase();
            }));

            const enriched: EnrichedRegistryPlayer = player;
            if (server) {
                enriched.server = server.name;
            }

            players.push(enriched);
        }

        const embed = formatSearchResultList(name, provider, players);
        await interaction.editReply({ embeds: [embed] });
    }
};

function formatSearchResultList(name: string, provider: Provider, players: EnrichedRegistryPlayer[]): EmbedBuilder {
    let formatted: string;
    const fields: EmbedField[] = [];
    players = players.slice(0, 20); // Limit to 20 results
    if (players.length > 0) {
        const serverNames = players.map((r) => {
            const serverName = r.server?.trim() || '';
            return fitStringToLength(serverName, 18);
        });

        const padding = 3;
        const columns: SearchColumns = {
            name: {
                width: longestStringLen(players.map((r) => r.nick), 10),
                heading: 'Name'
            },
            pid: {
                width: longestStringLen(players.map((r) => r.pid.toString()), 6),
                heading: 'PID'
            },
            server: {
                width: longestStringLen(serverNames, 13),
                heading: 'Playing on'
            }
        };

        // Start markdown embed
        formatted = '```\n';

        // Add table headers
        let totalWidth = 0;
        const keys = Object.keys(columns) as (keyof SearchColumns)[];
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

        for (const [index, result] of players.entries()) {
            const serverName = serverNames[index];

            formatted += `${result.nick.padEnd(columns.name.width, ' ') }`;
            // Align pid to the right for better readability
            formatted += `${result.pid.toString().padStart(columns.pid.width - padding, ' ') }${''.padEnd(padding, ' ')}`;
            formatted += `${serverName.padEnd(columns.server.width, ' ') }\n`;
        }

        // End markdown embed
        formatted += '```';

        fields.push({
            name: 'Results',
            value: players.length.toString(),
            inline: true
        }, {
            name: 'Results max.',
            value: '20',
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
        author: { name: Constants.PROVIDER_LABELS[provider], iconURL: Constants.PROVIDER_ICONS[provider], url: Constants.PROVIDER_WEBSITES[provider] }
    });
}
