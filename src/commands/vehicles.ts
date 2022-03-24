import axios from 'axios';
import { CommandInteraction } from 'discord.js';
import { ApplicationCommandOptionTypes } from 'discord.js/typings/enums';
import Constants from '../constants';
import { Project } from '../typing';
import { Command } from './typing';
import { formatVehicleStats } from '../utility';

export const vehicles: Command = {
    name: 'vehicles',
    description: 'Get a player\'s vehicle stats',
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
            if (e.isAxiosError && e?.response?.status == 404) {
                await interaction.editReply(`Sorry, could not find a BF2 player called "${name}" on ${Constants.PROJECT_LABELS[project as Project]}.`);
                return;
            }
            else {
                throw e;
            }
        }

        const resp = await axios.get('https://bf2-stats-jsonifier.cetteup.com/getplayerinfo', {
            params: {
                pid: pid,
                groupValues: 1,
                project: Project[project]
            }
        });
        const embed = formatVehicleStats(name, project, resp.data);
        await interaction.editReply({ embeds: [embed] });
    }
};