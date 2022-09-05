import { LeaderboardCategory, LeaderboardScoreType, Project } from './typing';

export default abstract class Constants {
    public static readonly PROJECT_LABELS = {
        [Project.bf2hub]: 'BF2Hub',
        [Project.playbf2]: 'PlayBf2',
        [Project.phoenix]: 'Phoenix Network'
    };
    public static readonly PROJECT_ICONS = {
        [Project.bf2hub]: 'https://cdn.discordapp.com/icons/377985116758081541/525b59c06d45c14479657638cae8091a.webp',
        [Project.playbf2]: 'https://cdn.discordapp.com/icons/376417565511122944/04585bf0c0c5dc0ff5d85fe205e5a9dd.webp',
        [Project.phoenix]: 'https://cdn.discordapp.com/icons/409665499736178698/861db9ea097d330ee72a95a297990c5f.webp?size=96'
    };
    public static PROJECT_WEBSITES = {
        [Project.bf2hub]: 'https://www.bf2hub.com/',
        [Project.playbf2]: 'https://playbf2.tilda.ws/en',
        [Project.phoenix]: 'https://phoenixnetwork.net/'
    };
    public static readonly PROJECT_RESULT_LIMITS = {
        [Project.bf2hub]: 20,
        [Project.playbf2]: 50,
        [Project.phoenix]: 20
    };

    // Not a single player has stats for weapon 13 + could not find any reference
    public static readonly INVALID_WEAPON_IDS = [13];
    // Some early accounts have stats for this, this may have tracked artillery kills back in the day
    // (https://dribibu.xs4all.nl/home-en/26-website/199-battlefield2statssignaturegenerator.html)
    public static readonly INVALID_VEHICLE_IDS = [5];
    // Map stats contain stats for a map that was cut from the game during development (Hingan Hills)
    public static readonly INVALID_MAP_IDS = [104];

    public static readonly LEADERBOARD_PER_PAGE = 20;
    
    public static readonly WEAPON_CATEGORY_LABELS = [
        'Assault-Rifle',
        'Grenade-Launcher',
        'Carbine',
        'Light Machine Gun',
        'Sniper Rifle',
        'Pistol',
        'Anti-Tank',
        'Sub-Machine Gun',
        'Shotgun',
        'Knife',
        'Defibrillator',
        'Explosives',
        'Grenade'
    ];

    public static readonly VEHICLE_CATEGORY_LABELS = [
        'Armor',
        'Jet',
        'Anti-Air',
        'Helicopter',
        'Transport',
        'Ground-Def.'
    ];
    
    public static readonly KIT_LABELS = [
        'Anti-Tank',
        'Assault',
        'Engineer',
        'Medic',
        'Spec-Ops',
        'Support',
        'Sniper'
    ];

    public static readonly MAP_LABELS: Record<number, string> = {
        0: 'Kubra Dam',
        1: 'Mashtuur City',
        2: 'Operation Clean Sweep',
        3: 'Zatar Wetlands',
        4: 'Strike at Karkand',
        5: 'Sharqi Peninsula',
        6: 'Gulf Of Oman',
        10: 'Operation Smoke Screen',
        11: 'Taraba Quarry',
        12: 'Road To Jalalabad',
        100: 'Daqing Oilfields',
        101: 'Dalian Plant',
        102: 'Dragon Valley',
        103: 'Fushe Pass',
        105: 'Songhua Stalemate',
        110: 'Great Wall',
        // BF2's constants.py lists Operation Blue pearl as 120, which is what BF2hub seems to use
        // (they don't return stats for that unless only that map is requested)
        120: 'Operation Blue Pearl',
        200: 'Midnight Sun',
        201: 'Operation Road Rage',
        202: 'Operation Harvest',
        300: 'Devils Perch',
        301: 'Iron Gator',
        302: 'Night Flight',
        303: 'Warlord',
        304: 'Leviathan',
        305: 'Mass Destruction',
        306: 'Surge',
        307: 'Ghost Town',
        601: 'Wake Island 2007',
        602: 'Highway Tampa',
        // https://github.com/BF2Statistics/ControlCenter/blob/master/BF2Statistics/Web/Bf2Stats/MapData.xml
        // lists Operation Blue Pearl as 603, which is what PlayBF2 seems to use (though they return stats for 120, which are all 0)
        603: 'Operation Blue Pearl',
    };

    public static readonly LEADERBOARD_CATEGORY_DESCRIPTIONS = {
        [LeaderboardCategory.score]: 'Score',
        [LeaderboardCategory.weapon]: 'Kills in a given weapon category',
        [LeaderboardCategory.vehicle]: 'Kills in a given vehicle category',
        [LeaderboardCategory.kit]: 'Kills with a given kit',
    };

    public static LEADERBOARD_SORT_BY_OPTION_NAMES = {
        [LeaderboardCategory.score]: 'score-type',
        [LeaderboardCategory.weapon]: 'weapon-category',
        [LeaderboardCategory.vehicle]: 'vehicle-category',
        [LeaderboardCategory.kit]: 'kit',
    };

    public static readonly LEADERBOARD_ID_LABELS = {
        [LeaderboardScoreType.overall]: 'Overall',
        [LeaderboardScoreType.risingstar]: 'Rising star',
        [LeaderboardScoreType.commander]: 'Commander',
        [LeaderboardScoreType.team]: 'Teamwork',
        [LeaderboardScoreType.combat]: 'Combat'
    };
}
