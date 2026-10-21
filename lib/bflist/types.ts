export type Server = {
    ip: string
    port: number
    name: string
    players: Player[]
}

export type Player = {
    pid: number
    name: string
    tag: string
}
