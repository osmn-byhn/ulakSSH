import { Client } from 'ssh2';

export interface FileItem {
    name: string;
    isDirectory: boolean;
    size: number;
    mtime: number;
}

export const listDirectory = (conn: Client, path: string): Promise<FileItem[]> => {
    return new Promise((resolve, reject) => {
        conn.sftp((err, sftp) => {
            if (err) {
                console.error("SFTP initialization error:", err);
                return reject(err);
            }

            sftp.readdir(path, (readErr, list) => {
                // IMPORTANT: Always end the SFTP channel to prevent "Channel open failure"
                try {
                    sftp.end();
                } catch (endErr) {
                    console.error("Error closing SFTP channel:", endErr);
                }

                if (readErr) {
                    console.error(`SFTP readdir error for path ${path}:`, readErr);
                    return reject(readErr);
                }

                const items: FileItem[] = list.map(item => ({
                    name: item.filename,
                    isDirectory: item.attrs.isDirectory(),
                    size: item.attrs.size,
                    mtime: item.attrs.mtime * 1000, // Convert to ms
                }));

                // Sort: directories first, then alphabetically
                items.sort((a, b) => {
                    if (a.isDirectory && !b.isDirectory) return -1;
                    if (!a.isDirectory && b.isDirectory) return 1;
                    return a.name.localeCompare(b.name);
                });

                resolve(items);
            });
        });
    });
};
