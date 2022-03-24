import axios from 'axios';
import { CommandInteraction } from 'discord.js';
import { ApplicationCommandOptionTypes } from 'discord.js/typings/enums';
import Constants from '../constants';
import { Project } from '../typing';
import { Command } from './typing';
import { formatWeaponStats } from '../utility';

export const weapons: Command = {
    name: 'weapons',
    description: 'Get a player\'s weapon stats',
    options: [
        {
            name: 'project',
            description: 'GameSpy-replacement project the player is using',
            type: ApplicationCommandOptionTypes.INTEGER,
            choices: [
                { name: Constants.PROJECT_LABELS[Project.bf2hub], value: Project.bf2hub },
                { name: Constants.PROJECT_LABELS[Project.playbf2], value: Project.playbf2 },
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
        // Two request might take a moment => defer reply
        await interaction.deferReply();
        const project = interaction.options.getInteger('project', true);
        const name = interaction.options.getString('name', true);
        let pid: number;
        try {
            const resp = await axios.get(`https://resolve-api.cetteup.com/persona/${Project[project]}/bf2/by-name/${name}`);
            pid = resp.data.pid;
        }
        catch (e: any) {
            if (e.isAxiosError && e?.response?.data) {
                await interaction.editReply(e.response.data?.errors);
                return;
            }
            else {
                throw e;
            }
        }

        try {
            const resp = await axios.get('https://bf2-stats-jsonifier.cetteup.com/getplayerinfo', {
                params: {
                    pid: pid,
                    groupValues: 1,
                    project: Project[project]
                }
            });
            const embed = formatWeaponStats(name, project, resp.data);
            await interaction.editReply({ embeds: [embed] });
        }
        catch (e: any) {
            if (e.isAxiosError && e?.response?.data) {
                await interaction.editReply(e.response.data?.errors);
            }
            else {
                throw e;
            }
        }
    }
};
