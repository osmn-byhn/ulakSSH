import * as fs from 'fs';
import { getServersFilePath, ensureServersFileExists } from './addSsh.js';
/**
 * Removes an SSH server from the local storage by its ID.
 * @param id The unique identifier of the Server to remove
 * @returns boolean indicating success or failure
 */
export const deleteSshServer = (id) => {
    try {
        const filePath = getServersFilePath();
        ensureServersFileExists(filePath);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        let servers = [];
        try {
            servers = JSON.parse(fileContent);
        }
        catch (e) {
            servers = [];
        }
        // Find the index of the server to delete
        const serverIndex = servers.findIndex(server => server.id === id);
        if (serverIndex === -1) {
            console.warn(`SSH Server with id ${id} not found for deletion.`);
            return false;
        }
        // Remove from the array
        servers.splice(serverIndex, 1);
        // Store back to the JSON file
        fs.writeFileSync(filePath, JSON.stringify(servers, null, 4), 'utf-8');
        return true;
    }
    catch (error) {
        console.error('Failed to delete SSH server:', error);
        return false;
    }
};
