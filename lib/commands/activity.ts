import { ActivityColumns, Command, Player } from './types';
import {
    ApplicationCommandOptionType,
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    EmbedAuthorData,
    EmbedBuilder,
    EmbedField,
    escapeMarkdown
} from 'discord.js';
import Constants from '../constants';
import { Provider } from '../types';
import axios from 'axios';
import {
    createEmbed,
    fetchPlayerNameOptionChoices,
    fitStringToLength,
    formatTimePlayed,
    getAuthorURL,
    longestStringLen,
    resolvePlayerByName
} from './utility';
import cmdLogger from './logger';
import moment from 'moment';

export const activity: Command = {
    name: 'activity',
    description: 'Get a player\'s recent online activity',
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
        // Two request might take a moment => defer reply
        await interaction.deferReply();
        const provider = interaction.options.getInteger('provider', true) as Provider;
        const name = interaction.options.getString('name', true);

        let player: Player;
        try {
            player = await resolvePlayerByName(provider, name);
        } catch (e: any) {
            if (e.isAxiosError && e?.response?.status == 404) {
                await interaction.editReply(`Sorry, could not find a BF2 player called "${name}" on ${Constants.PROVIDER_LABELS[provider]}.`);
                return;
            } else {
                cmdLogger.error('Persona resolution request failed', name, Provider[provider], e?.response?.status, e?.code);
                await interaction.editReply(`Sorry, failed to resolve player id for ${name} on ${Constants.PROVIDER_LABELS[provider]}.`);
                return;
            }
        }

        const url = new URL(
            '/v1/sessions',
            'https://api.sentry.bf2.co/'
        );

        url.searchParams.set('player.pid', player.pid.toString());
        url.searchParams.set('player.nick', player.name);

        try {
            const resp = await axios.get(url.toString());
            const embed = formatActivity(player, resp.data);
            await interaction.editReply({ embeds: [embed] });
        } catch (e: any) {
            cmdLogger.error('Failed to fetch sessions for', player.name, Provider[player.provider], e?.response?.status, e?.code);
            await interaction.editReply(`Sorry, failed to fetch recent activity for ${escapeMarkdown(player.name)}.`);
        }
    },
    autocomplete: async (interaction: AutocompleteInteraction) => {
        const provider = interaction.options.getInteger('provider') as Provider | null;
        const focusedValue = interaction.options.getFocused();
        const choices = await fetchPlayerNameOptionChoices(provider, focusedValue);
        await interaction.respond(choices);
    }
};

type SessionResponse = {
    sessions: {
        id: number
        player: {
            tag: string
        }
        server: {
            name: string
        }
        rounds: {
            id: number
            map: {
                name: string
            }
            ping: number
            start: string
            end: string
        }[]
    }[]
}

function formatActivity(player: Player, { sessions }: SessionResponse): EmbedBuilder {
    // Restructure and flatten the data to make it easier to work with
    const rounds = sessions
        .flatMap((session) => {
            return session.rounds.map((round) => {
                const start = moment(round.start);
                const end = round.end ? moment(round.end) : null;
                return {
                    id: round.id,
                    tag: session.player.tag,
                    server: fitStringToLength(session.server.name, 18),
                    map: fitStringToLength(round.map.name, 18),
                    ping: round.ping,
                    when: end ? end.fromNow() : 'ongoing',
                    start: start,
                    duration: (end ?? moment()).diff(start, 'seconds'),
                    ended: !!round.end
                };
            });
        })
        .sort((a, b) => b.start.unix() - a.start.unix())
        .filter((r) => r.duration > 0 || !r.ended)
        .slice(0, 15);

    const padding = 3;
    const columns: ActivityColumns = {
        server: {
            width: longestStringLen(rounds.map((r) => r.server), 10),
            heading: 'Server'
        },
        map: {
            width: longestStringLen(rounds.map((r) => r.map), 10),
            heading: 'Map'
        },
        when: {
            width: longestStringLen(rounds.map((r) => r.when.toString()), 7),
            heading: 'When'
        }
    };

    // Start markdown embed
    let formatted = '```\n';

    // Add table headers
    let totalWidth = 0;
    const keys = Object.keys(columns) as (keyof ActivityColumns)[];
    for (const [index, key] of keys.entries()) {
        const column = columns[key];

        // Add a few spaces of padding after columns, except for the last one
        column.width = index == keys.length - 1 ? column.width : column.width + padding;

        formatted += column.heading.padEnd(column.width, ' ');
        totalWidth += column.width;
    }

    formatted += '\n';

    // Add separator
    formatted += `${'-'.padEnd(totalWidth, '-')}\n`;

    for (const round of rounds) {
        formatted += round.server.padEnd(columns.server.width);
        formatted += round.map.padEnd(columns.map.width);
        formatted += round.when.padEnd(columns.when.width);
        formatted += '\n';
    }

    if (rounds.length == 0) {
        formatted += 'It\'s quiet, too quiet.\n';
    }

    // End markdown embed
    formatted += '```';

    const usedTags = [...new Set(rounds.map((r) => r.tag).filter((t) => t.length > 0))];
    const fields: EmbedField[] = [
        {
            name: 'Total time',
            value: rounds.length > 0 ? formatTimePlayed(rounds.reduce((acc, r) => acc + r.duration, 0)) : 'n/a',
            inline: true
        },
        {
            name: 'Average ping',
            value: rounds.length > 0 ? `${Math.floor(rounds.reduce((acc, r) => acc + r.ping, 0) / rounds.length)}ms` : 'n/a',
            inline: true
        },
        {
            name: 'Used tags',
            value: usedTags.length > 0 ? usedTags.join(', ') : 'n/a',
            inline: true
        },
    ];

    const author: EmbedAuthorData = {
        name: Constants.PROVIDER_LABELS[player.provider],
        iconURL: Constants.PROVIDER_ICONS[player.provider],
        url: getAuthorURL(player)
    };

    return createEmbed({
        title: `Recent activity for ${escapeMarkdown(player.name)}`,
        description: formatted,
        fields,
        author: author
    });
}
