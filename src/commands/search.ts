import axios from 'axios';
import { CommandInteraction } from 'discord.js';
import { ApplicationCommandOptionTypes } from 'discord.js/typings/enums';
import Constants from '../constants';
import { Project } from '../typing';
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
                { name: Constants.PROJECT_LABEL[Project.bf2hub], value: Project.bf2hub },
                { name: Constants.PROJECT_LABEL[Project.playbf2], value: Project.playbf2 },
                { name: Constants.PROJECT_LABEL[Project.phoenix], value: Project.phoenix }
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
        const project = interaction.options.getInteger('project', true);
        const name = interaction.options.getString('name', true);
        const url = `https://bf2-stats-jsonifier.cetteup.com/searchforplayers?nick=${name}&where=a&project=${Project[project]}`;
        const resp = await axios.get(url);
        await interaction.reply(await formatSearchResultList(name, project, resp.data.players));
    }
};
