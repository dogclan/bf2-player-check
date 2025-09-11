import axios from 'axios';
import {
    ApplicationCommandOptionType,
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    EmbedBuilder,
    EmbedField, escapeMarkdown
} from 'discord.js';
import Constants from '../constants';
import { Project } from '../typing';
import { Command, Player, PlayerInfoResponse } from './typing';
import cmdLogger from './logger';
import {
    createEmbed,
    fetchPlayerNameOptionChoices, filterInvalidEntries,
    formatTimePlayed, formatTimestamp,
    getAuthorUrl,
    sortByKillsAndTimeAsc
} from './utility';

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
            const embed = formatStatsSummary(player, resp.data);
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

function formatStatsSummary(player: Player, { data }: PlayerInfoResponse): EmbedBuilder {
    const bestKitId = data.kits.slice().sort(sortByKillsAndTimeAsc).pop()?.id ?? 1;
    const vehicles = filterInvalidEntries(data.vehicles, Constants.INVALID_VEHICLE_IDS);
    const bestVehicleId = vehicles.slice().sort(sortByKillsAndTimeAsc).pop()?.id ?? 5;
    const weapons = filterInvalidEntries(data.weapons, Constants.INVALID_WEAPON_IDS);
    const bestWeaponId = weapons.slice().sort(sortByKillsAndTimeAsc).pop()?.id ?? 5;
    const fields: EmbedField[] = [
        { name: 'Time', value: formatTimePlayed(data.time.total), inline: true },
        { name: 'Score per minute', value: data.score.per_minute.toFixed(2), inline: true },
        { name: 'Kills per minute', value: data.kills.per_minute.toFixed(2), inline: true },
        { name: 'K/D', value: (data.kills.total / (data.deaths.total || 1)).toFixed(2), inline: true },
        { name: 'W/L', value: (data.rounds.wins / (data.rounds.losses || 1)).toFixed(2), inline: true },
        { name: 'Accuracy', value: `${data.accuracy.toFixed(2)}%`, inline: true },
        { name: 'Best kit', value: Constants.KIT_LABELS[bestKitId], inline: true },
        { name: 'Best weapon', value: Constants.WEAPON_CATEGORY_LABELS[bestWeaponId], inline: true },
        { name: 'Best vehicle', value: Constants.VEHICLE_CATEGORY_LABELS[bestVehicleId], inline: true },
        { name: 'Enlisted', value: formatTimestamp(data.timestamp.joined), inline: true },
        { name: 'Last battle', value: formatTimestamp(data.timestamp.last_battle), inline: true },
    ];

    const embed = createEmbed({
        title: `Stats summary for ${escapeMarkdown(player.name)}`,
        description: '',
        fields,
        author: {
            name: Constants.PROJECT_LABELS[player.project],
            iconURL: Constants.PROJECT_ICONS[player.project],
            url: getAuthorUrl(player)
        },
        footer: {
            text: `Player ID: ${player.pid}`
        }
    });

    embed.setThumbnail(`https://cdn.gametools.network/bf2/${data.rank}.png`);

    return embed;
}
