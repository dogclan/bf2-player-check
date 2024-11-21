import { AutocompleteInteraction, ChatInputApplicationCommandData, ChatInputCommandInteraction } from 'discord.js';
import { Project } from '../typing';

export interface Command extends ChatInputApplicationCommandData {
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
    autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
}

export type PlayerSearchResponse = {
    asof: number
    results: PlayerSearchResult[]
}

export type PlayerSearchResult = {
    n: number
    pid: number
    nick: string
    score: number
}

export type EnrichedPlayerSearch = {
    asof: number
    results: EnrichedPlayerSearchResult[]
}

export type EnrichedPlayerSearchResult = PlayerSearchResult & {
    currentServer?: string
}

export type Player = {
    pid: number
    name: string
    project: Project
}

export type PlayerInfoResponse = {
    asof: number
    data: {
        pid: number
        nick: string
        rank: number
        accuracy: number
        timestamp: {
            joined: number
            last_battle: number
        }
        score: {
            total: number
            per_minute: number
        }
        time: {
            total: number
        }
        rounds: {
            wins: number
            losses: number
        }
        kills: {
            total: number
            per_minute: number
        }
        deaths: {
            total: number
        }
        weapons: WeaponInfo[]
        vehicles: VehicleInfo[]
        armies: ArmyInfo[]
        kits: KitInfo[]
    }
}

export type WeaponInfo = {
    id: number
    time: number
    kills: number
    deaths: number
    accuracy: number
    kd: number
}

export type VehicleInfo = {
    id: number
    time: number
    kills: number
    deaths: number
    kd: number
    road_kills: number
}

export type ArmyInfo = {
    id: number
    time: number
    wins: number
    losses: number
    best_round_score: number
}

export type KitInfo = {
    id: number
    time: number
    kills: number
    deaths: number
    kd: number
}

export type PlayerMapInfoResponse = {
    asof: number
    data: {
        pid: number
        nick: string
        maps: MapInfo[]
    }
}

export type MapInfo = {
    id: number
    time: number
    wins: number
    losses: number
}

export type PlayerLeaderboardResponse = {
    size: number
    asof: number
    entries: PlayerLeaderboardEntry[]
}

export type PlayerLeaderboardEntry = {
    n: number
    pid: number
    nick: string
    rank: number
    country_code: string
}

export type Columns = {
    [key: string]: Column
}

export type Column = {
    heading: string
    width: number
}

export type SearchColumns = Columns & {
    name: Column
    pid: Column
    currentServer: Column
}

export type WeaponStatsColumns = Columns & {
    category: Column
    timeWith: Column
    kd: Column
    accuracy: Column
}

export type VehicleStatsColumns = Columns & {
    category: Column
    timeWith: Column
    kd: Column
}

export type ArmyStatsColumns = Columns & {
    army: Column
    timeWith: Column
    wl: Column
}

export type MapStatsColumns = Columns & {
    name: Column
    timeWith: Column
    winRate: Column
}

export type LeaderboardColumns = Columns & {
    position: Column
    name: Column
    country: Column
}

export type BflistServer = {
    name: string
    players: BflistPlayer[]
}

export type BflistPlayer = {
    pid: number
    name: string
}
