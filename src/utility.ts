import Constants from './constants';
import {
    ClassInfo,
    EnrichedPlayerSearch, Player,
    PlayerInfo,
    Project,
    SearchColumns, VehicleInfo,
    VehicleStatsColumns, WeaponInfo,
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

export function formatTimePlayed(seconds: number): string {
    return `${secondsToHours(seconds)}h ${secondsToRemainderMinutes(seconds)}m`;
}

export function filterInvalidEntries<T extends WeaponInfo | VehicleInfo>(entries: T[], invalidIds: number[]): T[] {
    const filtered = entries.filter((e) => !invalidIds.includes(e.id));
    // Rewrite ids (which are just the index)
    const valid: T[] = [];
    for (const [index, entry] of filtered.entries()) {
        // Copy object instead of changing original one
        valid.push({ ...entry, id: index });
    }

    return valid;
}

export function sortByKillsAndTimeAsc<T extends ClassInfo | WeaponInfo | VehicleInfo>(a: T, b: T): number {
    const n = Number(a.kl) - Number(b.kl);
    if (n != 0) {
        return n;
    }
    return Number(a.tm) - Number(b.tm);
}

export function getAuthorUrl(player: Player): string {
    switch (player.project) {
        case Project.bf2hub:
            // Use player stats page URL for BF2Hub
            return `https://www.bf2hub.com/player/${player.name}`;
        case Project.playbf2:
            return `http://bf2.tgamer.ru/stats/?pid=${player.pid}`;
        default:
            return Constants.PROJECT_WEBSITES[player.project];
    }
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

export function formatWeaponStats(player: Player, stats: PlayerInfo): MessageEmbed {
    // Skip last weapon category since it's stats are always 0
    const weapons = filterInvalidEntries(stats.grouped.weapons, Constants.INVALID_WEAPON_IDS);
    const timeWithsFormatted = weapons.map((w) => {
        const seconds = Number(w.tm);
        return formatTimePlayed(seconds);
    });
    const kds = weapons.map((w) => {
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

    for (const weaponInfo of weapons) {
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
        player: player,
        title: `Weapon stats for ${player.name}`,
        description: formatted,
        asOf: stats.asof,
        lastBattle: stats.player.lbtl
    });
}

export function formatVehicleStats(Player: Player, stats: PlayerInfo): MessageEmbed {
    // Ignore fifth vehicle since it's values are always 0
    const vehicles = filterInvalidEntries(stats.grouped.vehicles, Constants.INVALID_VEHICLE_IDS);
    const timeWithsFormatted = vehicles.map((v) => {
        const seconds = Number(v.tm);
        return formatTimePlayed(seconds);
    });
    const kds = vehicles.map((v) => {
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

    for (const vehicleInfo of vehicles) {
        const timeWith = timeWithsFormatted[vehicleInfo.id];
        const kd = kds[vehicleInfo.id];

        formatted += Constants.VEHICLE_CATEGORY_LABELS[vehicleInfo.id].padEnd(columns.category.width);
        formatted += timeWith.padEnd(columns.timeWith.width);
        formatted += kd.padEnd(columns.kd.width);
        formatted += '\n';
    }

    // End markdown embed
    formatted += '```';

    return createStatsEmbed({
        player: Player,
        title: `Vehicle stats for ${Player.name}`,
        description: formatted,
        asOf: stats.asof,
        lastBattle: stats.player.lbtl
    });
}

export function formatKitStats(player: Player, stats: PlayerInfo): MessageEmbed {
    const timeWithsFormatted = stats.grouped.classes.map((c) => {
        const seconds = Number(c.tm);
        return formatTimePlayed(seconds);
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
        player: player,
        title: `Kit stats for ${player.name}`,
        description: formatted,
        asOf: stats.asof,
        lastBattle: stats.player.lbtl
    });
}

export function formatStatsSummary(player: Player, stats: PlayerInfo): MessageEmbed {
    const bestClassId = stats.grouped.classes.slice().sort(sortByKillsAndTimeAsc).pop()?.id ?? 1;
    const vehicles = filterInvalidEntries(stats.grouped.vehicles, Constants.INVALID_VEHICLE_IDS);
    const bestVehicleId = vehicles.slice().sort(sortByKillsAndTimeAsc).pop()?.id ?? 5;
    const weapons = filterInvalidEntries(stats.grouped.weapons, Constants.INVALID_WEAPON_IDS);
    const bestWeaponId = weapons.slice().sort(sortByKillsAndTimeAsc).pop()?.id ?? 5;
    const fields: EmbedFieldData[] = [
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
    player,
    title,
    description,
    asOf,
    lastBattle
}: { player: Player, title: string, description: string, asOf: string, lastBattle: string }): MessageEmbed {
    const fields = [
        { name: 'Last battle', value: moment(Number(lastBattle) * 1000).format('YYYY-MM-DD HH:mm:ss'), inline: true },
        { name: 'As of', value: moment(Number(asOf) * 1000).format('YYYY-MM-DD HH:mm:ss'), inline: true }
    ];
    const author: EmbedAuthorData = {
        name: Constants.PROJECT_LABELS[player.project],
        iconURL: Constants.PROJECT_ICONS[player.project],
        url: getAuthorUrl(player)
    };

    return createEmbed({
        title,
        description,
        fields,
        author
    });
}
