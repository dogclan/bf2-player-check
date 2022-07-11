# bf2-player-check
Search BF2 players across GameSpy-replacement projects and check their stats

Don't feel like hosting the bot yourself? You can also simply [add it to Discord](https://discord.com/api/oauth2/authorize?client_id=920284644958699530&permissions=0&scope=bot%20applications.commands).

## Commands

### /summary

Show a summary of a player's overall stats (time played, k/d ratio, accuracy etc.).

#### Options

| Name    | Description                                  | Required | Note                                 |
|---------|----------------------------------------------|----------|--------------------------------------|
| project | BF2 revive project to pull stats from        | yes      | possible values: `BF2Hub`, `PlayBF2` |
| name    | Name of the player (without clan tag/prefix) | yes      |                                      |

#### Example
![](https://user-images.githubusercontent.com/17167062/178346929-b267e90e-60b3-48a1-82f3-9ab990b0fc55.png)

### /search

Find players who's nickname (partially) matches a given name.

#### Options

| Name    | Description                                            | Required | Note                                 |
|---------|--------------------------------------------------------|----------|--------------------------------------|
| project | BF2 revive project to search                           | yes      | possible values: `BF2Hub`, `PlayBF2` |
| name    | (Partial) Name of the player (without clan tag/prefix) | yes      |                                      |

#### Example

![](https://user-images.githubusercontent.com/17167062/178347468-c9580836-be56-43f2-80e2-81dff9af2c0f.png)


### /kits

Show a player's per-kit stats (time played, k/d ratio).

#### Options

| Name    | Description                                  | Required | Note                                 |
|---------|----------------------------------------------|----------|--------------------------------------|
| project | BF2 revive project to pull stats from        | yes      | possible values: `BF2Hub`, `PlayBF2` |
| name    | Name of the player (without clan tag/prefix) | yes      |                                      |

#### Example

![](https://user-images.githubusercontent.com/17167062/178348040-a3035dba-813d-4630-a70c-ebd5ed34b484.png)

### /weapons

Show a player's per-weapon stats (time played, k/d ratio, accuracy).

#### Options

| Name    | Description                                  | Required | Note                                 |
|---------|----------------------------------------------|----------|--------------------------------------|
| project | BF2 revive project to pull stats from        | yes      | possible values: `BF2Hub`, `PlayBF2` |
| name    | Name of the player (without clan tag/prefix) | yes      |                                      |

#### Example

![](https://user-images.githubusercontent.com/17167062/178348307-26aa4570-8d60-43a8-9b0b-4c998740b2c0.png)

### /vehicles

Show a player's per-vehicle stats (time player, k/d ratio).

#### Options

| Name    | Description                                  | Required | Note                                 |
|---------|----------------------------------------------|----------|--------------------------------------|
| project | BF2 revive project to pull stats from        | yes      | possible values: `BF2Hub`, `PlayBF2` |
| name    | Name of the player (without clan tag/prefix) | yes      |                                      |

#### Example

![](https://user-images.githubusercontent.com/17167062/178348559-cb6294e0-7b6a-4748-9545-c680c7969d7a.png)


