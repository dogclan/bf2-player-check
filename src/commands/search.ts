import axios from 'axios';
import { CommandInteraction } from 'discord.js';
import { ApplicationCommandOptionTypes } from 'discord.js/typings/enums';
import Constants from '../constants';
import { BflistServer, EnrichedPlayerSearchResult, PlayerSearch, Project } from '../typing';
import { formatSearchResultList } from '../utility';
import { Command } from './typing';
import cmdLogger from './logger';

export const search: Command = {
    name: 'search',
    description: 'Search for a player by their name',
    options: [
        {
            name: 'project',
            description: 'GameSpy-replacement project to search',
            type: ApplicationCommandOptionTypes.INTEGER,
            choices: [
                { name: Constants.PROJECT_LABELS[Project.bf2hub], value: Project.bf2hub },
                { name: Constants.PROJECT_LABELS[Project.playbf2], value: Project.playbf2 },
            ],
            required: true
        },
        {
            name: 'name',
            description: '(Partial) Player name to search for',
            type: ApplicationCommandOptionTypes.STRING,
            required: true
        }
    ],
    execute: async (interaction: CommandInteraction) => {
        await interaction.deferReply();
        const project = interaction.options.getInteger('project', true);
        const name = interaction.options.getString('name', true);
        let data: PlayerSearch;
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
            throw e;
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
                // Make sure pid AND name match
                return p.pid == Number(player.pid) && p.name.toLowerCase() == player.nick.toLowerCase();
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
