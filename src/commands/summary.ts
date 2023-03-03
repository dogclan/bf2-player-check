import axios from 'axios';
import {
    ApplicationCommandOptionType,
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    EmbedBuilder,
    EmbedField
} from 'discord.js';
import Constants from '../constants';
import { Project } from '../typing';
import { Command, Player, PlayerInfoResponse } from './typing';
import cmdLogger from './logger';
import {
    createEmbed,
    fetchPlayerNameOptionChoices, filterInvalidEntries,
    formatTimePlayed,
    getAuthorUrl,
    sortByKillsAndTimeAsc
} from './utility';
import moment from 'moment/moment';

export const summary: Command = {
    name: 'summary',
    description: 'Get a summary of a player\'s stats',
    options: [
        {
            name: 'project',
            description: 'GameSpy-replacement project the player is using',
            type: ApplicationCommandOptionType.Integer,
            choices: [
                { name: Constants.PROJECT_LABELS[Project.bf2hub], value: Project.bf2hub },
                { name: Constants.PROJECT_LABELS[Project.playbf2], value: Project.playbf2 },
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

        try {
            const resp = await axios.get('https://bf2-stats-jsonifier.cetteup.com/getplayerinfo', {
                params: {
                    pid: player.pid,
                    groupValues: 1,
                    project: Project[player.project]
                }
            });
            const embed = formatStatsSummary(player, resp.data);
            await interaction.editReply({ embeds: [embed] });
        }
        catch (e: any) {
            cmdLogger.error('Failed to fetch player info for', name, Project[player.project], e?.response?.status, e?.code);
            await interaction.editReply(`Sorry, failed to fetch stats for ${player.name} from ${Constants.PROJECT_LABELS[player.project]}.`);
        }
    },
    autocomplete: async (interaction: AutocompleteInteraction) => {
        const project = interaction.options.getInteger('project');
        const focusedValue = interaction.options.getFocused();
        const choices = await fetchPlayerNameOptionChoices(project, focusedValue);
        await interaction.respond(choices);
    }
};

function formatStatsSummary(player: Player, stats: PlayerInfoResponse): EmbedBuilder {
    const bestClassId = stats.grouped.classes.slice().sort(sortByKillsAndTimeAsc).pop()?.id ?? 1;
    const vehicles = filterInvalidEntries(stats.grouped.vehicles, Constants.INVALID_VEHICLE_IDS);
    const bestVehicleId = vehicles.slice().sort(sortByKillsAndTimeAsc).pop()?.id ?? 5;
    const weapons = filterInvalidEntries(stats.grouped.weapons, Constants.INVALID_WEAPON_IDS);
    const bestWeaponId = weapons.slice().sort(sortByKillsAndTimeAsc).pop()?.id ?? 5;
    const fields: EmbedField[] = [
        { name: 'Time', value: formatTimePlayed(Number(stats.player.time)), inline: true },
        { name: 'Score per minute', value: Number(stats.player.ospm).toFixed(2), inline: true },
        { name: 'Kills per minute', value: Number(stats.player.klpm).toFixed(2), inline: true },
        { name: 'K/D', value: (Number(stats.player.kill) / (Number(stats.player.deth) || 1)).toFixed(2), inline: true },
        { name: 'Accuracy', value: `${Number(stats.player.osaa).toFixed(2)}%`, inline: true },
        { name: 'Enlisted', value: moment(Number(stats.player.jond) * 1000).format('YYYY-MM-DD HH:mm:ss'), inline: true },
        { name: 'Best kit', value: Constants.KIT_LABELS[bestClassId], inline: true },
        { name: 'Best weapon', value: Constants.WEAPON_CATEGORY_LABELS[bestWeaponId], inline: true },
        { name: 'Best vehicle', value: Constants.VEHICLE_CATEGORY_LABELS[bestVehicleId], inline: true },
        { name: 'Last battle', value: moment(Number(stats.player.lbtl) * 1000).format('YYYY-MM-DD HH:mm:ss'), inline: true },
        { name: 'As of', value: moment(Number(stats.asof) * 1000).format('YYYY-MM-DD HH:mm:ss'), inline: true },
    ];

    const embed = createEmbed({
        title: `Stats summary for ${player.name}`,
        description: '',
        fields,
        author: {
            name: Constants.PROJECT_LABELS[player.project],
            iconURL: Constants.PROJECT_ICONS[player.project],
            url: getAuthorUrl(player)
        }
    });

    embed.setThumbnail(`https://cdn.gametools.network/bf2/${stats.player.rank}.png`);

    return embed;
}
