import axios from 'axios';
import { CommandInteraction } from 'discord.js';
import { ApplicationCommandOptionTypes } from 'discord.js/typings/enums';
import Constants from '../constants';
import { Project } from '../typing';
import { Command } from './typing';

export const summary: Command = {
    name: 'summary',
    description: 'Get a summary of a player\'s stats',
    options: [
        {
            name: 'project',
            description: 'GameSpy-replacement project the player is using',
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
            description: 'Player name',
            type: ApplicationCommandOptionTypes.STRING,
            required: true
        }
    ],
    execute: async (interaction: CommandInteraction) => {
        const project = interaction.options.getInteger('project', true);
        const name = interaction.options.getString('name', true);
        const url = `https://api.statbits.io/chatmsg/bf2/stats/${Project[project]}/players/${encodeURIComponent(name)}/summary-short-a`;

        try {
            const resp = await axios.get(url);
            await interaction.reply(resp.data);
        }
        catch (e: any) {
            if (e.isAxiosError && e?.response?.data) {
                interaction.reply(e.response.data);
            }
            else {
                throw e;
            }
        }
    }
};
