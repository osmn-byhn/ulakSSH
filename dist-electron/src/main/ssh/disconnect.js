/**
 * Disconnects from an active SSH connection.
 * @param conn The active ssh2 Client instance.
 * @returns boolean indicating whether it successfully called end()
 */
export const disconnectFromServer = (conn) => {
    try {
        if (conn) {
            conn.end();
            console.log('SSH Connection disconnected successfully.');
            return true;
        }
        return false;
    }
    catch (error) {
        console.error('Failed to disconnect SSH connection:', error);
        return false;
    }
};
