import path from 'path';

export default abstract class Config {
    static readonly ROOT_DIR: string = path.join(__dirname, '..', '..');
    static readonly LOG_LEVEL: string = process.env.LOG_LEVEL || 'info';
    static readonly TOKEN: string = process.env.TOKEN || '';
    static readonly EMBED_COLOR: string = process.env.EMBED_COLOR || '#f07d47';
}
