import { AutocompleteInteraction, ChatInputApplicationCommandData, ChatInputCommandInteraction } from 'discord.js';
import { Project } from '../typing';

export interface Command extends ChatInputApplicationCommandData {
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
    autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
}

export type PlayerSearchResponse = {
    asof: string
    players: PlayerSearchResult[]
}

export type PlayerSearchResult = {
    n: string;
    pid: string;
    nick: string;
    score: string;
}

export type EnrichedPlayerSearch = {
    asof: string
    players: EnrichedPlayerSearchResult[]
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
    asof: string
    grouped: {
        armies: ArmyInfo[]
        classes: ClassInfo[]
        vehicles: VehicleInfo[]
        weapons: WeaponInfo[]
    }
    player: {
        pid: string
        nick: string
        scor: string
        rank: string
        jond: string
        lbtl: string
        time: string
        wins: string
        loss: string
        kill: string
        deth: string
        ospm: string
        klpm: string
        osaa: string
    }
}

export type ArmyInfo = {
    id: number
    tm: string
    wn: string
    lo: string
    br: string
}

export type ClassInfo = {
    id: number
    tm: string
    kl: string
    dt: string
    kd: string
}

export type VehicleInfo = {
    id: number
    tm: string
    kl: string
    dt: string
    kd: string
    kr: string
}

export type WeaponInfo = {
    id: number
    tm: string
    kl: string
    dt: string
    ac: string
    kd: string
}

export type PlayerMapInfoResponse = {
    asof: string
    grouped: {
        maps: MapInfo[]
    }
    player: {
        pid: string
        nick: string
    }
}

export type MapInfo = {
    id: number
    tm: string
    wn: string
    ls: string
}

export type PlayerLeaderboardResponse = {
    size: string
    asof: string
    players: PlayerLeaderboardEntry[]
}

export type PlayerLeaderboardEntry = {
    n: string
    pid: string
    nick: string
    playerrank: string
    countrycode: string
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
