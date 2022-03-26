import axios from 'axios';
import { CommandInteraction } from 'discord.js';
import { ApplicationCommandOptionTypes } from 'discord.js/typings/enums';
import Constants from '../constants';
import { EnrichedPlayerSearchResult, PlayerSearch, Project } from '../typing';
import { formatSearchResultList } from '../utility';
import { Command } from './typing';

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
        const resp = await axios.get('https://bf2-stats-jsonifier.cetteup.com/searchforplayers', {
            params: {
                nick: name,
                where: 'a',
                project: Project[project]
            }
        });
        const data = resp.data as PlayerSearch;
        const promises: Promise<EnrichedPlayerSearchResult>[] = data.players.map(async (p): Promise<EnrichedPlayerSearchResult> => {
            try {
                const resp = await axios.get(`https://api.bflist.io/bf2/v1/players/${encodeURIComponent(p.nick)}/server/name`);
                return { ...p, currentServer: resp.data };
            }
            catch(e: any) {
                if (axios.isAxiosError(e) && e?.response?.status != 404) {
                    console.log(`${p.nick} is not playing`);
                }
                return p;
            }
        });
        const enriched = await Promise.all(promises);
        const embed = formatSearchResultList(name, project, { asof: data.asof, players: enriched });
        await interaction.editReply({ embeds: [embed] });
    }
};
