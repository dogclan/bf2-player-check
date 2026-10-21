import { Server } from './types';
import axios from 'axios';

export async function getServers(): Promise<Server[]> {
    const servers: Server[] = [];
    
    let cursor: string | undefined;
    let after: string | undefined;
    let hasNextPage: boolean;
    do {
        const url = new URL(
            '/v2/bf2/servers',
            'https://api.bflist.io/'
        );

        url.searchParams.set('perPage', '100');
        if (cursor && after) {
            url.searchParams.set('cursor', cursor);
            url.searchParams.set('after', after);
        }

        const resp = await axios.get<{
            servers: Server[]
            cursor: string
            hasMore: boolean
        }>(url.toString());
        
        for (const server of resp.data.servers) {
            servers.push(server);
            // Last server of the page becomes the marker for the next page
            after = `${server.ip}:${server.port}`;
        }
        
        cursor = resp.data.cursor;
        hasNextPage = resp.data.hasMore;
    } while (hasNextPage);
    
    return servers;
}
