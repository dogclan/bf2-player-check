import axios from 'axios';
import {
    ApplicationCommandOptionType,
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    EmbedBuilder,
    EmbedField, escapeMarkdown
} from 'discord.js';
import Constants from '../constants';
import { Provider } from '../typing';
import { Command, Player, PlayerInfoResponse } from './typing';
import cmdLogger from './logger';
import {
    createEmbed,
    fetchPlayerNameOptionChoices,
    filterInvalidEntries,
    formatTimePlayed,
    formatTimestamp,
    getAuthorURL,
    resolvePlayerByName,
    sortByKillsAndTimeAsc
} from './utility';

export const summary: Command = {
    name: 'summary',
    description: 'Get a summary of a player\'s stats',
    options: [
        {
            name: 'provider',
            description: 'GameSpy-replacement provider the player is using',
            type: ApplicationCommandOptionType.Integer,
            choices: [
                { name: Constants.PROVIDER_LABELS[Provider.bf2hub], value: Provider.bf2hub },
                { name: Constants.PROVIDER_LABELS[Provider.playbf2], value: Provider.playbf2 },
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
        const provider = interaction.options.getInteger('provider', true) as Provider;
        const name = interaction.options.getString('name', true);

        let player: Player;
        try {
            player = await resolvePlayerByName(provider, name);
        }
        catch (e: any) {
            if (e.isAxiosError && e?.response?.status == 404) {
                await interaction.editReply(`Sorry, could not find a BF2 player called "${name}" on ${Constants.PROVIDER_LABELS[provider]}.`);
                return;
            }
            else {
                cmdLogger.error('Persona resolution request failed', name, Provider[provider], e?.response?.status, e?.code);
                await interaction.editReply(`Sorry, failed to resolve pid for ${name} on ${Constants.PROVIDER_LABELS[provider]}.`);
                return;
            }
        }

        const url = new URL(
            `/v2/players/${Provider[player.provider]}/by-id/${player.pid}/stats`,
            'https://aspxstats.cetteup.com/'
        );

        try {
            const resp = await axios.get(url.toString());
            const embed = formatStatsSummary(player, resp.data);
            await interaction.editReply({ embeds: [embed] });
        }
        catch (e: any) {
            cmdLogger.error('Failed to fetch player info for', player.name, Provider[player.provider], e?.response?.status, e?.code);
            await interaction.editReply(`Sorry, failed to fetch stats for ${escapeMarkdown(player.name)} from ${Constants.PROVIDER_LABELS[player.provider]}.`);
        }
    },
    autocomplete: async (interaction: AutocompleteInteraction) => {
        const provider = interaction.options.getInteger('provider') as Provider | null;
        const focusedValue = interaction.options.getFocused();
        const choices = await fetchPlayerNameOptionChoices(provider, focusedValue);
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
            name: Constants.PROVIDER_LABELS[player.provider],
            iconURL: Constants.PROVIDER_ICONS[player.provider],
            url: getAuthorURL(player)
        },
        footer: {
            text: `Player ID: ${player.pid}`
        }
    });

    embed.setThumbnail(`https://cdn.gametools.network/bf2/${data.rank}.png`);

    return embed;
}
