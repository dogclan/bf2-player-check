import axios from 'axios';
import { Project } from '../typing';
import Constants from '../constants';
import { ColorResolvable, EmbedAuthorData, EmbedBuilder, EmbedField } from 'discord.js';
import Config from '../config';
import moment from 'moment';
import { KitInfo, MapInfo, Player, PlayerSearchResponse, VehicleInfo, WeaponInfo } from './typing';

export async function fetchPlayerNameOptionChoices(project: number | null, focusedValue: string): Promise<{ name: string, value: string }[]> {
    // Skip searches for if we have nothing to search for
    if (project == null || focusedValue.trim().length == 0) {
        return [];
    }

    const url = new URL(
        `v2/players/${Project[project]}/search-nick/${encodeURIComponent(focusedValue)}`,
        'https://aspxstats.cetteup.com/'
    );

    url.searchParams.set('where', 'a');

    const resp = await axios.get(url.toString());
    const data: PlayerSearchResponse = resp.data;
    return data.results
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

export function longestStringLen(strings: string[], fallback: number): number {
    const longest = strings.slice().sort((a, b) => a.length - b.length).pop();
    return longest?.length || fallback;
}

export function fitStringToLength(str: string, maxLength: number, trailer = '...'): string {
    if (str.length < maxLength) {
        return str;
    }
    return str.substring(0, maxLength - trailer.length) + trailer;
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

export function filterInvalidEntries<T extends WeaponInfo | VehicleInfo | MapInfo>(entries: T[], invalidIds: number[], updateIndexes = true): T[] {
    const filtered = entries.filter((e) => !invalidIds.includes(e.id));
    // Rewrite ids (which are just the index)
    const valid: T[] = [];
    for (const [index, entry] of filtered.entries()) {
        // Copy object instead of changing original one
        valid.push({ ...entry, id: updateIndexes ? index : entry.id });
    }

    return valid;
}

export function sortByKillsAndTimeAsc<T extends KitInfo | WeaponInfo | VehicleInfo>(a: T, b: T): number {
    const n = a.kills - b.kills;
    if (n != 0) {
        return n;
    }
    return a.time - b.time;
}

export function getAuthorUrl(player: Player): string {
    switch (player.project) {
        case Project.bf2hub:
            return `https://www.bf2hub.com/stats/${player.pid}`;
        case Project.playbf2:
            return `http://bf2.tgamer.ru/stats/?pid=${player.pid}`;
        default:
            return Constants.PROJECT_WEBSITES[player.project];
    }
}

export function createEmbed({
    title,
    description,
    fields,
    author
}: { title: string, description: string, fields: EmbedField[], author: EmbedAuthorData }): EmbedBuilder {
    const embed = new EmbedBuilder({
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
}: { player: Player, title: string, description: string, asOf: number, lastBattle?: number }): EmbedBuilder {
    const fields = [
        { name: 'As of', value: moment(asOf * 1000).format('YYYY-MM-DD HH:mm:ss'), inline: true }
    ];
    if (lastBattle) {
        fields.unshift({
            name: 'Last battle',
            value: moment(lastBattle * 1000).format('YYYY-MM-DD HH:mm:ss'),
            inline: true
        });
    }

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
