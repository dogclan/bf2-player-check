import axios from 'axios';
import { PlayerSearchResponse, Project } from '../typing';
import Constants from '../constants';

export async function fetchPlayerNameOptionChoices(project: number | null, focusedValue: string): Promise<{ name: string, value: string }[]> {
    // Skip searches for if we have nothing to search for
    if (project == null || focusedValue.trim().length == 0) {
        return [];
    }

    const resp = await axios.get('https://bf2-stats-jsonifier.cetteup.com/searchforplayers', {
        params: {
            nick: focusedValue,
            where: 'a',
            project: Project[project]
        }
    });
    const results: PlayerSearchResponse = resp.data;
    return results.players
        // As always, PlayBF2 returns names with tags, so we need to remove any existing tags
        .map((result) => result.nick.split(' ').pop() ?? result.nick)
        // We may have received players whose tag's match but name does not, so filter again locally (ignoring case)
        .filter((choice) => choice.toLowerCase().includes(focusedValue.toLowerCase()))
        // Avoid causing errors with long names
        .filter((choice) => choice.length <= Constants.DISCORD_CHOICES_MAX_LENGTH)
        // PlayBF2 may return duplicates, if they added stats for the BF2Hub pid before adding a "real" PlayBF2 account
        .filter((choice, index, choices) => choices.indexOf(choice) == index)
        // Avoid causing errors with too many options
        .slice(0, Constants.DISCORD_CHOICES_MAX_LENGTH)
        .map((choice) => ({ name: choice, value: choice }));
}
