import axios from 'axios';
import { Provider } from '../types';
import Constants from '../constants';
import { ColorResolvable, EmbedAuthorData, EmbedBuilder, EmbedData, EmbedFooterData } from 'discord.js';
import Config from '../config';
import { KitInfo, MapInfo, Player, RegistryPlayersResponse, VehicleInfo, WeaponInfo } from './types';

export async function fetchPlayerNameOptionChoices(provider: number | null, focusedValue: string): Promise<{ name: string, value: string }[]> {
    // Skip searches for if we have nothing to search for
    if (provider == null || focusedValue.trim().length == 0) {
        return [];
    }

    // Use registry API instead of ASPX search as search results may contain players only tracked by a provider
    // (e.g. PlayBF2 tracking stats for a BF2Hub player)
    // We only want to expose "native" players, as the r3solve API will only resolve those
    // Using search + r3solve might result in a nick being suggested as an option, but then failing to resolve it to a player id (pid)
    const url = new URL(
        '/v1/players',
        'https://api.registry.bf2.co/'
    );

    url.searchParams.set('nick', focusedValue + '!');
    url.searchParams.set('provider', Provider[provider]);

    const resp = await axios.get<RegistryPlayersResponse>(url.toString());
    return resp.data.players
        // Avoid causing errors with long names
        .filter((player) => player.nick.length <= Constants.DISCORD_CHOICES_MAX_LENGTH)
        // Avoid causing errors with too many options
        .slice(0, Constants.DISCORD_CHOICES_MAX_LENGTH)
        .map((player) => ({ name: player.nick, value: player.nick }));
}

export async function resolvePlayerByName(provider: number, name: string): Promise<Player> {
    const url = new URL(
        `/v1/personas/bf2/${Provider[provider]}/by-name/${encodeURIComponent(name)}`,
        'https://r3solve-api.cetteup.com/'
    );

    const resp = await axios.get(url.toString());
    return {
        pid: resp.data.id,
        name: resp.data.name,
        provider: provider
    };
}

export function longestStringLen(strings: string[], fallback: number): number {
    const longest = strings.slice().sort((a, b) => a.length - b.length).pop();
    return longest?.length || fallback;
}

export function fitStringToLength(str: string, maxLength: number, trailer = '...'): string {
    if (str.length <= maxLength) {
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
    const hours = secondsToHours(seconds);
    if (hours == 0) {
        return `${secondsToRemainderMinutes(seconds)}m`;
    }
    return `${secondsToHours(seconds)}h ${secondsToRemainderMinutes(seconds)}m`;
}

export function formatTimestamp(timestamp: number): string {
    if (timestamp == 0) {
        return 'n/a';
    }
    return `<t:${timestamp}:f>`;
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

export function getAuthorURL(player: Player): string {
    switch (player.provider) {
        case Provider.bf2hub:
            return `https://www.bf2hub.com/stats/${player.pid}`;
        case Provider.playbf2:
            return `http://bf2.tgamer.ru/stats/?pid=${player.pid}`;
        default:
            return Constants.PROVIDER_WEBSITES[player.provider];
    }
}

export function createEmbed(data: EmbedData): EmbedBuilder {
    const embed = new EmbedBuilder(data);
    embed.setColor(Config.EMBED_COLOR as ColorResolvable);

    return embed;
}

export function createStatsEmbed({
    player,
    title,
    description,
    lastBattle
}: { player: Player, title: string, description: string, lastBattle?: number }): EmbedBuilder {
    const fields = [];
    if (lastBattle) {
        fields.push({
            name: 'Last battle',
            value: formatTimestamp(lastBattle),
            inline: true
        });
    }

    const author: EmbedAuthorData = {
        name: Constants.PROVIDER_LABELS[player.provider],
        iconURL: Constants.PROVIDER_ICONS[player.provider],
        url: getAuthorURL(player)
    };

    const footer: EmbedFooterData = {
        text: `Player ID: ${player.pid}`
    };

    return createEmbed({
        title,
        description,
        fields,
        author,
        footer
    });
}
