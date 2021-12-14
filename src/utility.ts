import Constants from './constants';
import { PlayerSearchResult, Project } from './typing';

export async function formatSearchResultList(name: string, project: Project, results: PlayerSearchResult[]): Promise<string> {
    let formatted: string;
    if (results.length > 0) {
        const players = results
        // Remove clan tags from names
        .map((player) => ({...player, 'nick': player.nick.split(' ').pop() || player.nick}))
        // Filter out players who's clan tag matches but actual name does match the given name
        .filter((player) => player.nick.toLowerCase().includes(name.toLowerCase()));

        const longestName = players.slice().sort((a, b) => a.nick.length - b.nick.length).pop()?.nick;
        const longestPid = players.slice().sort((a, b) => a.pid.length - b.pid.length).pop()?.pid;
        const nameComlumnWidth = longestName?.length || 10;
        const pidColumnWidth = longestPid?.length || 6;
        
        formatted = `**Found ${results.length} player(s) on ${Constants.PROJECT_LABEL[project]}:**\n`;

        // Show "warning" of any results have been removed
        if (players.length < results.length) {
            formatted += '*Some results are not shown because only the player\'s tag matched the given name.*\n'
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
        formatted = `Sorry, could not find any BF2 players who\'s name is/contains "${name}" on ${Constants.PROJECT_LABEL[project]}.`;
    }

    return formatted;
}
