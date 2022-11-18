import { Command } from './typing';
import Constants from '../constants';
import { LeaderboardCategory, LeaderboardScoreType, Project } from '../typing';
import {
    ApplicationCommandNumericOptionData,
    ApplicationCommandOptionType,
    ChatInputCommandInteraction
} from 'discord.js';
import axios from 'axios';
import { formatLeaderboardPage } from '../utility';
import cmdLogger from './logger';

const commonOptions: Record<'project' | 'page', ApplicationCommandNumericOptionData> = {
    project: {
        name: 'project',
        description: 'GameSpy-replacement project the player is using',
        type: ApplicationCommandOptionType.Integer,
        choices: [
            { name: Constants.PROJECT_LABELS[Project.bf2hub], value: Project.bf2hub },
            { name: Constants.PROJECT_LABELS[Project.playbf2], value: Project.playbf2 },
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

        try {
            const resp = await axios.get('https://bf2-stats-jsonifier.cetteup.com/getleaderboard', {
                params: {
                    type: LeaderboardCategory[category],
                    // Score category uses names for different scores to sort by, not indexes => map numeric id to name
                    id: category == LeaderboardCategory.score ? LeaderboardScoreType[sortBy] : sortBy,
                    pos: 1 + (page - 1) * Constants.LEADERBOARD_PER_PAGE,
                    before: 0,
                    after: 19,
                    project: Project[project]
                }
            });
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
