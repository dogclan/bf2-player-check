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

### /maps

Show a player's per-map stats (time played, win rate).

#### Options

| Name    | Description                                  | Required | Note                                 |
|---------|----------------------------------------------|----------|--------------------------------------|
| project | BF2 revive project to pull stats from        | yes      | possible values: `BF2Hub`, `PlayBF2` |
| name    | Name of the player (without clan tag/prefix) | yes      |                                      |

#### Example

![](https://user-images.githubusercontent.com/17167062/188514748-bc7de362-2ddf-4cb4-88fd-695ab2aebf0d.png)

### /leaderboard score

Show a page of the player leaderboard sorted by score.

#### Options

| Name       | Description                           | Required | Note                                                                         |
|------------|---------------------------------------|----------|------------------------------------------------------------------------------|
| project    | BF2 revive project to pull stats from | yes      | possible values: `BF2Hub`, `PlayBF2`                                         |
| score-type | Type of score to sort leaderboard by  | no       | possible values: `Overall`, `Rising star`, `Commander`, `Teamwork`, `Combat` |
| page       | Page of the leaderboard to fetch      | no       | minimum value: 1                                                             |

#### Example

![](https://user-images.githubusercontent.com/17167062/179085431-5e7611fa-f6d3-4923-9b16-f82bee008bef.png)

### /leaderboard weapon

Show a page of the player leaderboard sorted by kills in a given weapon category.

#### Options

| Name            | Description                            | Required | Note                                                                                                                                                                                                         |
|-----------------|----------------------------------------|----------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| project         | BF2 revive project to pull stats from  | yes      | possible values: `BF2Hub`, `PlayBF2`                                                                                                                                                                         |
| weapon-category | Weapon category to sort leaderboard by | no       | possible values: `Assault-Rifle`, `Grenade-Launcher`, `Carbine`, `Light Machine Gun`, `Sniper Rifle`, `Pistol`, `Anti-Tank`, `Sub-Machine Gun`, `Shotgun`, `Knife`, `Defibrillator`, `Explosives`, `Grenade` |
| page            | Page of the leaderboard to fetch       | no       | minimum value: 1                                                                                                                                                                                             |

#### Example

![](https://user-images.githubusercontent.com/17167062/179086689-f4a9da9a-6572-4ab0-886d-b28fc6e149ed.png)

### /leaderboard vehicle

Show a page of the player leaderboard sorted by kills in a given vehicle category.

#### Options

| Name             | Description                             | Required | Note                                                                                  |
|------------------|-----------------------------------------|----------|---------------------------------------------------------------------------------------|
| project          | BF2 revive project to pull stats from   | yes      | possible values: `BF2Hub`, `PlayBF2`                                                  |
| vehicle-category | Vehicle category to sort leaderboard by | no       | possible values: `Armor`, `Jet`, `Anti-Air`, `Helicopter`, `Transport`, `Ground-Def.` |
| page             | Page of the leaderboard to fetch        | no       | minimum value: 1                                                                      |

#### Example

![](https://user-images.githubusercontent.com/17167062/179087459-2ac1dc5a-0cf9-4472-a179-5581debac9e1.png)

### /leaderboard kit

Show a page of the player leaderboard sorted by kills with a given kit.

#### Options

| Name    | Description                           | Required | Note                                                                                          |
|---------|---------------------------------------|----------|-----------------------------------------------------------------------------------------------|
| project | BF2 revive project to pull stats from | yes      | possible values: `BF2Hub`, `PlayBF2`                                                          |
| kit     | Kit to sort leaderboard by            | no       | possible values: `Anti-Tank`, `Assault`, `Engineer`, `Medic`, `Spec-Ops`, `Support`, `Sniper` |
| page    | Page of the leaderboard to fetch      | no       | minimum value: 1                                                                              |

#### Example

![](https://user-images.githubusercontent.com/17167062/179087616-88b42b07-1b1b-40ab-ab4a-f8afd8dbb17d.png)
