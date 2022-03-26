export enum Project {
    bf2hub = 0,
    playbf2,
    phoenix
}

export type PlayerSearch = {
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

export type PlayerInfo = {
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
