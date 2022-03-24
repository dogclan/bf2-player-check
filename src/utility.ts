import Constants from './constants';
import { PlayerInfo, PlayerSearchResult, Project, WeaponStatsColumns } from './typing';
import { ColorResolvable, MessageEmbed } from 'discord.js';
import Config from './config';
import moment from 'moment';

export function longestStringLen(strings: string[], fallback: number): number {
    const longest = strings.slice().sort((a, b) => a.length - b.length).pop();
    return longest?.length ?? fallback;
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

export async function formatSearchResultList(name: string, project: Project, results: PlayerSearchResult[]): Promise<string> {
    let formatted: string;
    if (results.length > 0) {
        const players = results
        // Remove clan tags from names
            .map((player) => ({ ...player, 'nick': player.nick.split(' ').pop() || player.nick }))
        // Filter out players who's clan tag matches but actual name does match the given name
            .filter((player) => player.nick.toLowerCase().includes(name.toLowerCase()));

        const longestName = players.slice().sort((a, b) => a.nick.length - b.nick.length).pop()?.nick;
        const longestPid = players.slice().sort((a, b) => a.pid.length - b.pid.length).pop()?.pid;
        const nameComlumnWidth = longestName?.length || 10;
        const pidColumnWidth = longestPid?.length || 6;
        
        formatted = `**Found ${results.length} player(s) on ${Constants.PROJECT_LABEL[project]}:**\n`;

        // Show "warning" of any results have been removed
        if (players.length < results.length) {
            formatted += '*Some results are not shown because only the player\'s tag matched the given name.*\n';
        }

        // Start markdown embed
        formatted += '```\n';

        // Add table headers
        formatted += `${'Name'.padEnd(nameComlumnWidth, ' ')}   `;
        formatted += `${'PID'.padEnd(pidColumnWidth, ' ')}\n`;

        // Add separator
        const headerLength = 3 + nameComlumnWidth + pidColumnWidth;
        formatted += `${'-'.padEnd(headerLength, '-')}\n`;

        for (const player of players) {
            formatted += `${player.nick.padEnd(nameComlumnWidth, ' ') }   `;
            formatted += `${player.pid.padStart(pidColumnWidth, ' ') }\n`;
        }

        // End markdown embed
        formatted += '```';

        // Add note about max results if limit was hit
        if (results.length == Constants.PROJECT_RESULT_LIMIT[project]) {
            formatted += `\n**Note:** Search returned the maximum number for results (${Constants.PROJECT_RESULT_LIMIT[project]})`;
        }
    }
    else {
        formatted = `Sorry, could not find any BF2 players who's name is/contains "${name}" on ${Constants.PROJECT_LABEL[project]}.`;
    }

    return formatted;
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

        // Add three spaces of padding between tables
        column.width = key == 'accuracy' ? column.width : column.width + 3;

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
        title: `Weapon stats for ${name} on ${Constants.PROJECT_LABEL[project as Project]}`,
        description: formatted,
        asOf: stats.asof,
        lastBattle: stats.player.lbtl
    });
}

export function createStatsEmbed({
    name,
    project,
    title,
    description,
    asOf,
    lastBattle
}: { name: string, project: Project, title: string, description: string, asOf: string, lastBattle: string }): MessageEmbed {
    const embed = new MessageEmbed();
    embed.setColor(Config.EMBED_COLOR as ColorResolvable);
    embed.setTitle(title);
    embed.addFields([
        { name: 'As of', value: moment(Number(asOf) * 1000).format('YYYY-MM-DD hh:mm:ss'), inline: true },
        { name: 'Last battle', value: moment(Number(lastBattle) * 1000).format('YYYY-MM-DD hh:mm:ss'), inline: true }
    ]);
    embed.setDescription(description);

    if (project == Project.bf2hub) {
        embed.setURL(`https://www.bf2hub.com/player/${name}`);
    }

    return embed;
}
