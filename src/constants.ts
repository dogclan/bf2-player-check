import { Project } from './typing';

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
        'Helicopter',
        'Transport',
        'Anti-Air',
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
}
