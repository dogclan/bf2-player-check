import { Project } from './typing';

export default abstract class Constants {
    public static readonly PROJECT_LABEL = {
        [Project.bf2hub]: 'BF2Hub',
        [Project.playbf2]: 'PlayBf2',
        [Project.phoenix]: 'Phoenix Network'
    };

    public static readonly PROJECT_RESULT_LIMIT = {
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
}
