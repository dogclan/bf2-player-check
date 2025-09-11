import { Command, LeaderboardColumns, PlayerLeaderboardResponse } from './typing';
import Constants from '../constants';
import { LeaderboardCategory, LeaderboardScoreType, Project } from '../typing';
import {
    ApplicationCommandNumericOptionData,
    ApplicationCommandOptionType,
    ChatInputCommandInteraction,
    EmbedBuilder,
    EmbedField
} from 'discord.js';
import axios from 'axios';
import cmdLogger from './logger';
import { createEmbed, longestStringLen } from './utility';

const commonOptions: Record<'project' | 'page', ApplicationCommandNumericOptionData> = {
    project: {
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
    page: {
        name: 'page',
        description: 'Page of the leaderboard to fetch',
        type: ApplicationCommandOptionType.Integer,
        minValue: 1
    }
};

export const leaderboard: Command = {
    name: 'leaderboard',
    description: 'Get a section of the leaderboard',
    options: [
        {
            name: LeaderboardCategory[LeaderboardCategory.score],
            description: buildSubcommandDescription(LeaderboardCategory.score),
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                commonOptions.project,
                {
                    name: Constants.LEADERBOARD_SORT_BY_OPTION_NAMES[LeaderboardCategory.score],
                    description: 'Score-type to sort leaderboard by',
                    type: ApplicationCommandOptionType.Integer,
                    choices: [
                        { name: Constants.LEADERBOARD_ID_LABELS[LeaderboardScoreType.overall], value: LeaderboardScoreType.overall },
                        { name: Constants.LEADERBOARD_ID_LABELS[LeaderboardScoreType.risingstar], value: LeaderboardScoreType.risingstar },
                        { name: Constants.LEADERBOARD_ID_LABELS[LeaderboardScoreType.commander], value: LeaderboardScoreType.commander },
                        { name: Constants.LEADERBOARD_ID_LABELS[LeaderboardScoreType.team], value: LeaderboardScoreType.team },
                        { name: Constants.LEADERBOARD_ID_LABELS[LeaderboardScoreType.combat], value: LeaderboardScoreType.combat },
                    ]
                },
                commonOptions.page
            ]
        },
        {
            name: LeaderboardCategory[LeaderboardCategory.weapon],
            description: buildSubcommandDescription(LeaderboardCategory.weapon),
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                commonOptions.project,
                {
                    name: Constants.LEADERBOARD_SORT_BY_OPTION_NAMES[LeaderboardCategory.weapon],
                    description: 'Weapon category to sort leaderboard by',
                    type: ApplicationCommandOptionType.Integer,
                    choices: Constants.WEAPON_CATEGORY_LABELS.map((label, index) => {
                        return { name: label, value: index };
                    })
                },
                commonOptions.page
            ]
        },
        {
            name: LeaderboardCategory[LeaderboardCategory.vehicle],
            description: buildSubcommandDescription(LeaderboardCategory.vehicle),
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                commonOptions.project,
                {
                    name: Constants.LEADERBOARD_SORT_BY_OPTION_NAMES[LeaderboardCategory.vehicle],
                    description: 'Vehicle category to sort leaderboard by',
                    type: ApplicationCommandOptionType.Integer,
                    choices: Constants.VEHICLE_CATEGORY_LABELS.map((label, index) => {
                        return { name: label, value: index };
                    })
                },
                commonOptions.page
            ]
        },
        {
            name: LeaderboardCategory[LeaderboardCategory.kit],
            description: buildSubcommandDescription(LeaderboardCategory.kit),
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                commonOptions.project,
                {
                    name: Constants.LEADERBOARD_SORT_BY_OPTION_NAMES[LeaderboardCategory.kit],
                    description: 'Kit to sort leaderboard by',
                    type: ApplicationCommandOptionType.Integer,
                    choices: Constants.KIT_LABELS.map((label, index) => {
                        return { name: label, value: index };
                    })
                },
                commonOptions.page
            ]
        },
    ],
    execute: async (interaction: ChatInputCommandInteraction) => {
        await interaction.deferReply();
        const project: Project = interaction.options.getInteger('project', true);
        const categoryName = interaction.options.getSubcommand();
        const category = leaderboardCategoryFromName(categoryName);
        const sortBy = interaction.options.getInteger(Constants.LEADERBOARD_SORT_BY_OPTION_NAMES[category]) || 0;
        const page = interaction.options.getInteger('page') || 1;

        // Score category uses names for different scores to sort by, not indexes => map numeric id to name
        const leaderboardId = category == LeaderboardCategory.score ? LeaderboardScoreType[sortBy] : sortBy;
        const url = new URL(
            `/v2/leaderboards/${Project[project]}/${LeaderboardCategory[category]}/${leaderboardId}`,
            'https://aspxstats.cetteup.com/'
        );

        url.searchParams.set('position', (1 + (page - 1) * Constants.LEADERBOARD_PER_PAGE).toString());
        url.searchParams.set('before', '0');
        url.searchParams.set('after', '19');

        try {
            const resp = await axios.get(url.toString());
            const embed = formatLeaderboardPage(category, sortBy, page, project, resp.data);
            await interaction.editReply({ embeds: [embed] });
        }
        catch (e: any) {
            cmdLogger.error('Failed to fetch leaderboard page', LeaderboardCategory[category], sortBy, page, Project[project], e?.response?.status, e?.code);
            await interaction.editReply(`Sorry, failed to fetch ${LeaderboardCategory[category]}-based leaderboard from ${Constants.PROJECT_LABELS[project]}.`);
        }
    }
};

function buildSubcommandDescription(category: LeaderboardCategory): string {
    return `Player leaderboard sorted by ${Constants.LEADERBOARD_CATEGORY_DESCRIPTIONS[category].toLowerCase()}`;
}

function leaderboardCategoryFromName(name: string): LeaderboardCategory {
    switch (name) {
        case LeaderboardCategory[LeaderboardCategory.weapon]:
            return LeaderboardCategory.weapon;
        case LeaderboardCategory[LeaderboardCategory.vehicle]:
            return LeaderboardCategory.vehicle;
        case LeaderboardCategory[LeaderboardCategory.kit]:
            return LeaderboardCategory.kit;
        default:
            return LeaderboardCategory.score;
    }
}

function formatLeaderboardPage(category: LeaderboardCategory, sortBy: number, page: number, project: Project, { size, entries }: PlayerLeaderboardResponse): EmbedBuilder {
    let sortedByField: EmbedField;
    switch (category) {
        case LeaderboardCategory.weapon:
            sortedByField = { name: 'Weapon category', value: Constants.WEAPON_CATEGORY_LABELS[sortBy], inline: true };
            break;
        case LeaderboardCategory.vehicle:
            sortedByField = { name: 'Vehicle category', value: Constants.VEHICLE_CATEGORY_LABELS[sortBy], inline: true };
            break;
        case LeaderboardCategory.kit:
            sortedByField = { name: 'Kit', value: Constants.KIT_LABELS[sortBy], inline: true };
            break;
        default:
            sortedByField = { name: 'Score-type', value: Constants.LEADERBOARD_ID_LABELS[sortBy as LeaderboardScoreType], inline: true };
    }

    const fields: EmbedField[] = [
        { name: 'Sorted by', value: Constants.LEADERBOARD_CATEGORY_DESCRIPTIONS[category], inline: true },
        sortedByField,
        { name: '\u200B', value: '\u200B', inline: true },
        { name: 'Page', value: `${page}`, inline: true },
        { name: 'Total pages', value: `${Math.ceil(size / Constants.LEADERBOARD_PER_PAGE)}`, inline: true },
    ];

    // Remove clan tags from names
    entries = entries.map((e) => ({ ...e, 'nick': e.nick.trim().split(' ').pop() || e.nick }));

    let formatted: string;
    if (entries.length == 0) {
        formatted = 'There seem to be no more players on this leaderboard.';
    }
    else {
        // Leave a few spaces between columns
        const padding = 3;
        const columns: LeaderboardColumns = {
            position: {
                width: longestStringLen(entries.map((e) => e.n.toString()), 1),
                heading: '#'
            },
            name: {
                width: longestStringLen(entries.map((e) => e.nick), 10),
                heading: 'Name'
            },
            country: {
                width: 7,
                heading: 'Country'
            }
        };

        // Start markdown embed
        formatted = '```\n';

        // Add table headers
        let totalWidth = 0;
        for (const key in columns) {
            const column = columns[key];

            // Add a few spaces of padding between tables
            column.width = key == 'currentServer' ? column.width : column.width + padding;

            formatted += column.heading.padEnd(column.width, ' ');
            totalWidth += column.width;
        }

        formatted += '\n';

        // Add separator
        formatted += `${'-'.padEnd(totalWidth, '-')}\n`;

        for (const entry of entries) {
            // Align position to the right for better readability
            formatted += `${entry.n.toString().padStart(columns.position.width - padding, ' ')}${''.padEnd(padding, ' ')}`;
            formatted += `${entry.nick.padEnd(columns.name.width, ' ')}`;
            formatted += `${entry.country_code.padEnd(columns.country.width, ' ') }\n`;
        }

        // End markdown embed
        formatted += '```';

        fields.push();
    }

    return createEmbed({
        title: 'Player leaderboard',
        description: formatted,
        fields,
        author: { name: Constants.PROJECT_LABELS[project], iconURL: Constants.PROJECT_ICONS[project], url: Constants.PROJECT_WEBSITES[project] }
    });
}
