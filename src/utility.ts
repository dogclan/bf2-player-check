import Constants from './constants';
import {
    EnrichedPlayerSearch,
    PlayerInfo,
    Project,
    SearchColumns,
    VehicleStatsColumns,
    WeaponStatsColumns
} from './typing';
import { ColorResolvable, EmbedAuthorData, EmbedFieldData, MessageEmbed } from 'discord.js';
import Config from './config';
import moment from 'moment';

export function longestStringLen(strings: string[], fallback: number): number {
    const longest = strings.slice().sort((a, b) => a.length - b.length).pop();
    return longest?.length || fallback;
}

/**
 * Get full hours from the given timespan in seconds.
 */
export function secondsToHours(num: number): number {
    return Math.floor(num / 60 / 60);
}

/**
 * Get full remainder minutes (0-59) from the given timespan in seconds.
 */
export function secondsToRemainderMinutes(num: number): number {
    return Math.floor(num / 60) % 60;
}

export function formatSearchResultList(name: string, project: Project, data: EnrichedPlayerSearch): MessageEmbed {
    let formatted: string;
    const fields: EmbedFieldData[] = [
        { name: 'As of', value: moment(Number(data.asof) * 1000).format('YYYY-MM-DD HH:mm:ss'), inline: true },
    ];
    const players = data.players
        // Remove clan tags from names
        .map((player) => ({ ...player, 'nick': player.nick.trim().split(' ').pop() || player.nick }))
        // Filter out players who's clan tag matches but actual name does match the given name
        .filter((player) => player.nick.toLowerCase().includes(name.toLowerCase()));
    if (players.length > 0) {
        const serverNames = players.map((p) => {
            let serverName = p.currentServer?.trim() || '';
            if (serverName.length > 18) {
                serverName = `${serverName.substring(0, 15)}...`;
            }
            return serverName;
        });

        // Leave a few spaces between columns
        const padding = 3;
        const columns: SearchColumns = {
            name: {
                width: longestStringLen(players.map((p) => p.nick), 10),
                heading: 'Name'
            },
            pid: {
                width: longestStringLen(players.map((p) => p.pid), 6),
                heading: 'PID'
            },
            currentServer: {
                width: longestStringLen(serverNames, 13),
                heading: 'Playing on'
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

        for (const [index, player] of players.entries()) {
            const serverName = serverNames[index];

            formatted += `${player.nick.padEnd(columns.name.width, ' ') }`;
            // Align pid to the right for better readability
            formatted += `${player.pid.padStart(columns.pid.width - padding, ' ') }${''.padEnd(padding, ' ')}`;
            formatted += `${serverName.padEnd(columns.currentServer.width, ' ') }\n`;
        }

        // End markdown embed
        formatted += '```';

        fields.push({
            name: 'Results',
            value: players.length.toString(),
            inline: true
        }, {
            name: 'Results max.',
            value: Constants.PROJECT_RESULT_LIMITS[project].toString(),
            inline: true
        });
    }
    else {
        formatted = `Sorry, could not find any BF2 players who's name is/contains "${name}".`;
    }

    return createEmbed({
        title: `Search results for "${name}"`,
        description: formatted,
        fields,
        author: { name: Constants.PROJECT_LABELS[project], iconURL: Constants.PROJECT_ICONS[project], url: Constants.PROJECT_WEBSITES[project] }
    });
}

export function formatWeaponStats(name: string, project: Project, stats: PlayerInfo): MessageEmbed {
    const timeWithsFormatted = stats.grouped.weapons.map((w) => {
        const seconds = Number(w.tm);
        return `${secondsToHours(seconds)}h ${secondsToRemainderMinutes(seconds)}m`;
    });
    const kds = stats.grouped.weapons.map((w) => {
        const kd = Number(w.kl) / (Number(w.dt) || 1);
        return kd.toFixed(2);
    });

    const columns: WeaponStatsColumns = {
        category: {
            width: longestStringLen(Constants.WEAPON_CATEGORY_LABELS, 10),
            heading: 'Category'
        },
        timeWith: {
            width: longestStringLen(timeWithsFormatted, 7),
            heading: 'Time'
        },
        kd: {
            width: longestStringLen(kds, 5),
            heading: 'K/D'
        },
        accuracy: {
            width: 6,
            heading: 'Acc.'
        }
    };

    // Start markdown embed
    let formatted = '```\n';

    // Add table headers
    let totalWidth = 0;
    for (const key in columns) {
        const column = columns[key];

        // Add a few spaces of padding between tables
        column.width = key == 'accuracy' ? column.width : column.width + 4;

        formatted += column.heading.padEnd(column.width, ' ');
        totalWidth += column.width;
    }

    formatted += '\n';

    // Add separator
    formatted += `${'-'.padEnd(totalWidth, '-')}\n`;

    // Skip last weapon category since it's stats are always 0
    for (const weaponInfo of stats.grouped.weapons.slice(0, stats.grouped.weapons.length - 1)) {
        const timeWith = timeWithsFormatted[weaponInfo.id];
        const kd = kds[weaponInfo.id];
        const accuracy = `${Number(weaponInfo.ac).toFixed(2)}%`;

        formatted += Constants.WEAPON_CATEGORY_LABELS[weaponInfo.id].padEnd(columns.category.width);
        formatted += timeWith.padEnd(columns.timeWith.width);
        formatted += kd.padEnd(columns.kd.width);
        formatted += accuracy.padEnd(columns.accuracy.width);
        formatted += '\n';
    }

    // End markdown embed
    formatted += '```';

    return createStatsEmbed({
        name: name,
        project: project,
        title: `Weapon stats for ${name}`,
        description: formatted,
        asOf: stats.asof,
        lastBattle: stats.player.lbtl
    });
}

export function formatVehicleStats(name: string, project: Project, stats: PlayerInfo): MessageEmbed {
    const timeWithsFormatted = stats.grouped.vehicles.map((v) => {
        const seconds = Number(v.tm);
        return `${secondsToHours(seconds)}h ${secondsToRemainderMinutes(seconds)}m`;
    });
    const kds = stats.grouped.vehicles.map((v) => {
        const kd = Number(v.kl) / (Number(v.dt) || 1);
        return kd.toFixed(2);
    });

    const columns: VehicleStatsColumns = {
        category: {
            width: longestStringLen(Constants.VEHICLE_CATEGORY_LABELS, 10),
            heading: 'Category'
        },
        timeWith: {
            width: longestStringLen(timeWithsFormatted, 7),
            heading: 'Time'
        },
        kd: {
            width: longestStringLen(kds, 5),
            heading: 'K/D'
        }
    };

    // Start markdown embed
    let formatted = '```\n';

    // Add table headers
    let totalWidth = 0;
    for (const key in columns) {
        const column = columns[key];

        // Add a few spaces of padding between tables
        column.width = key == 'kd' ? column.width : column.width + 4;

        formatted += column.heading.padEnd(column.width, ' ');
        totalWidth += column.width;
    }

    formatted += '\n';

    // Add separator
    formatted += `${'-'.padEnd(totalWidth, '-')}\n`;

    // Ignore fifth vehicle since it's values are always 0
    for (const  [index, vehicleInfo] of stats.grouped.vehicles.filter((v) => v.id != 5).entries()) {
        const timeWith = timeWithsFormatted[vehicleInfo.id];
        const kd = kds[vehicleInfo.id];

        // Use index here since it shifts due to the removal of vehicle 5
        formatted += Constants.VEHICLE_CATEGORY_LABELS[index].padEnd(columns.category.width);
        formatted += timeWith.padEnd(columns.timeWith.width);
        formatted += kd.padEnd(columns.kd.width);
        formatted += '\n';
    }

    // End markdown embed
    formatted += '```';

    return createStatsEmbed({
        name: name,
        project: project,
        title: `Vehicle stats for ${name}`,
        description: formatted,
        asOf: stats.asof,
        lastBattle: stats.player.lbtl
    });
}

export function formatKitStats(name: string, project: Project, stats: PlayerInfo): MessageEmbed {
    const timeWithsFormatted = stats.grouped.classes.map((c) => {
        const seconds = Number(c.tm);
        return `${secondsToHours(seconds)}h ${secondsToRemainderMinutes(seconds)}m`;
    });
    const kds = stats.grouped.classes.map((c) => {
        const kd = Number(c.kl) / (Number(c.dt) || 1);
        return kd.toFixed(2);
    });

    const columns: VehicleStatsColumns = {
        category: {
            width: longestStringLen(Constants.KIT_LABELS, 10),
            heading: 'Kit'
        },
        timeWith: {
            width: longestStringLen(timeWithsFormatted, 7),
            heading: 'Time'
        },
        kd: {
            width: longestStringLen(kds, 5),
            heading: 'K/D'
        }
    };

    // Start markdown embed
    let formatted = '```\n';

    // Add table headers
    let totalWidth = 0;
    for (const key in columns) {
        const column = columns[key];

        // Add a few spaces of padding between tables
        column.width = key == 'kd' ? column.width : column.width + 4;

        formatted += column.heading.padEnd(column.width, ' ');
        totalWidth += column.width;
    }

    formatted += '\n';

    // Add separator
    formatted += `${'-'.padEnd(totalWidth, '-')}\n`;

    for (const classInfo of stats.grouped.classes) {
        const timeWith = timeWithsFormatted[classInfo.id];
        const kd = kds[classInfo.id];

        formatted += Constants.KIT_LABELS[classInfo.id].padEnd(columns.category.width);
        formatted += timeWith.padEnd(columns.timeWith.width);
        formatted += kd.padEnd(columns.kd.width);
        formatted += '\n';
    }

    // End markdown embed
    formatted += '```';

    return createStatsEmbed({
        name: name,
        project: project,
        title: `Kit stats for ${name}`,
        description: formatted,
        asOf: stats.asof,
        lastBattle: stats.player.lbtl
    });
}

export function createEmbed({
    title,
    description,
    fields,
    author
}: { title: string, description: string, fields: EmbedFieldData[], author: EmbedAuthorData }): MessageEmbed {
    const embed = new MessageEmbed({
        title,
        description,
        fields,
        author
    });
    embed.setColor(Config.EMBED_COLOR as ColorResolvable);

    return embed;
}

export function createStatsEmbed({
    name,
    project,
    title,
    description,
    asOf,
    lastBattle
}: { name: string, project: Project, title: string, description: string, asOf: string, lastBattle: string }): MessageEmbed {
    const fields = [
        { name: 'As of', value: moment(Number(asOf) * 1000).format('YYYY-MM-DD HH:mm:ss'), inline: true },
        { name: 'Last battle', value: moment(Number(lastBattle) * 1000).format('YYYY-MM-DD HH:mm:ss'), inline: true }
    ];
    let authorUrl: string;
    if (project == Project.bf2hub) {
        // Use player stats page URL for BF2Hub
        authorUrl = `https://www.bf2hub.com/player/${name}`;
    }
    else {
        authorUrl = Constants.PROJECT_WEBSITES[project];
    }
    const author: EmbedAuthorData = { name: Constants.PROJECT_LABELS[project], iconURL: Constants.PROJECT_ICONS[project], url: authorUrl };

    return createEmbed({
        title,
        description,
        fields,
        author
    });
}
