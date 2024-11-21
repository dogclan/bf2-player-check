import axios from 'axios';
import {
    ApplicationCommandOptionType,
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    EmbedBuilder, escapeMarkdown
} from 'discord.js';
import Constants from '../constants';
import { Project } from '../typing';
import { ArmyStatsColumns, Command, Player, PlayerInfoResponse } from './typing';
import cmdLogger from './logger';
import { createStatsEmbed, fetchPlayerNameOptionChoices, formatTimePlayed, longestStringLen } from './utility';

export const armies: Command = {
    name: 'armies',
    description: 'Get a player\'s army stats',
    options: [
        {
            name: 'project',
            description: 'GameSpy-replacement project the player is using',
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

        const url = new URL(
            `/v2/players/${Project[player.project]}/by-id/${player.pid}/stats`,
            'https://aspxstats.cetteup.com/'
        );

        try {
            const resp = await axios.get(url.toString());
            const embed = formatArmyStats(player, resp.data);
            await interaction.editReply({ embeds: [embed] });
        }
        catch (e: any) {
            cmdLogger.error('Failed to fetch player info for', player.name, Project[player.project], e?.response?.status, e?.code);
            await interaction.editReply(`Sorry, failed to fetch stats for ${escapeMarkdown(player.name)} from ${Constants.PROJECT_LABELS[player.project]}.`);
        }
    },
    autocomplete: async (interaction: AutocompleteInteraction) => {
        const project = interaction.options.getInteger('project');
        const focusedValue = interaction.options.getFocused();
        const choices = await fetchPlayerNameOptionChoices(project, focusedValue);
        await interaction.respond(choices);
    }
};

function formatArmyStats(player: Player, { asof, data }: PlayerInfoResponse): EmbedBuilder {
    const timeWithsFormatted = data.armies.map((k) => {
        return formatTimePlayed(k.time);
    });
    const wls = data.armies.map((k) => {
        const wl = k.wins / (k.losses || 1);
        return wl.toFixed(2);
    });

    const columns: ArmyStatsColumns = {
        army: {
            width: longestStringLen(Constants.ARMY_LABELS, 14),
            heading: 'Army'
        },
        timeWith: {
            width: longestStringLen(timeWithsFormatted, 7),
            heading: 'Time'
        },
        wl: {
            width: longestStringLen(wls, 5),
            heading: 'W/L'
        }
    };

    // Start markdown embed
    let formatted = '```\n';

    // Add table headers
    let totalWidth = 0;
    for (const key in columns) {
        const column = columns[key];

        // Add a few spaces of padding between tables
        column.width = key == 'wl' ? column.width : column.width + 4;

        formatted += column.heading.padEnd(column.width, ' ');
        totalWidth += column.width;
    }

    formatted += '\n';

    // Add separator
    formatted += `${'-'.padEnd(totalWidth, '-')}\n`;

    for (const armyInfo of data.armies) {
        const timeWith = timeWithsFormatted[armyInfo.id];
        const wl = wls[armyInfo.id];

        formatted += Constants.ARMY_LABELS[armyInfo.id].padEnd(columns.army.width);
        formatted += timeWith.padEnd(columns.timeWith.width);
        formatted += wl.padEnd(columns.wl.width);
        formatted += '\n';
    }

    // End markdown embed
    formatted += '```';

    return createStatsEmbed({
        player: player,
        title: `Army stats for ${escapeMarkdown(player.name)}`,
        description: formatted,
        asOf: asof,
        lastBattle: data.timestamp.last_battle
    });
}
