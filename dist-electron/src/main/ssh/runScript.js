import { executeCommand } from './execute.js';
import { writeRemoteFile, deleteRemoteItem } from './sftp.js';
export const runScriptStream = async (session, script) => {
    // Backward compatibility for simple command strings
    if (typeof script === 'string') {
        const finalCmd = session.shouldSudo
            ? `echo "${session.password}" | sudo -S -p "" bash -c "${script.replace(/"/g, '\\"')}"`
            : script;
        return new Promise((resolve, reject) => {
            session.conn.exec(finalCmd, (err, stream) => {
                if (err)
                    return reject(err);
                let exitCode = null;
                stream.on('exit', (code) => {
                    exitCode = code;
                });
                stream.on('close', () => {
                    console.log(`[runScriptStream] Simple command finished with code ${exitCode}`);
                });
                resolve(stream);
            });
        });
    }
    const isTemp = !script.remotePath;
    let remotePath = script.remotePath || `/tmp/ulakssh_script_${script.id || Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
    try {
        // 1. Upload script content
        try {
            console.log(`[runScriptStream] Uploading script to ${remotePath}`);
            await writeRemoteFile(session, remotePath, script.content);
        }
        catch (sftpErr) {
            // Error code 4 = Failure (often means the path is a directory)
            if (sftpErr.code === 4) {
                console.log(`[runScriptStream] Initial upload failed (code 4), likely a directory. Retrying with a filename...`);
                let fileName = script.name ? script.name.toLowerCase().replace(/[^a-z0-9.]/g, '_') : 'script';
                const lang = (script.language || 'bash').toLowerCase();
                const ext = lang === 'python' ? 'py' : lang === 'javascript' ? 'js' : 'sh';
                // Only append extension if it's not already there
                if (!fileName.endsWith(`.${ext}`)) {
                    fileName = `${fileName}.${ext}`;
                }
                const newPath = remotePath.endsWith('/') ? `${remotePath}${fileName}` : `${remotePath}/${fileName}`;
                console.log(`[runScriptStream] Retrying upload to: ${newPath}`);
                await writeRemoteFile(session, newPath, script.content);
                remotePath = newPath; // Update remotePath for subsequent chmod and execution
            }
            else {
                throw sftpErr;
            }
        }
        // 2. Make it executable
        console.log(`[runScriptStream] Making ${remotePath} executable`);
        await executeCommand(session, `chmod +x "${remotePath}"`);
        // 3. Determine execution command
        const dir = remotePath.substring(0, remotePath.lastIndexOf('/')) || '/';
        const base = remotePath.substring(remotePath.lastIndexOf('/') + 1);
        let executionCmd = '';
        if (script.command) {
            // User provided a command, we cd first and then run it relative to the file
            executionCmd = `cd "${dir}" && ${script.command} "./${base}"`;
        }
        else {
            const lang = (script.language || 'bash').toLowerCase();
            let engine = '';
            switch (lang) {
                case 'python':
                case 'python3':
                    engine = 'python3';
                    break;
                case 'nodejs':
                case 'node':
                    engine = 'node';
                    break;
                case 'bash':
                case 'sh':
                case 'shell':
                    engine = 'bash';
                    break;
                case 'perl':
                case 'ruby':
                case 'php':
                case 'go':
                    engine = lang;
                    break;
                default:
                    engine = ''; // Direct execution
            }
            if (engine) {
                executionCmd = `cd "${dir}" && ${engine} "./${base}"`;
            }
            else {
                executionCmd = `cd "${dir}" && "./${base}"`;
            }
        }
        const passwordPart = session.password ? `echo "${session.password}" | ` : '';
        const finalCmd = session.shouldSudo
            ? `${passwordPart}sudo -S -p "" ${executionCmd}`
            : String(executionCmd);
        console.log(`[runScriptStream] Running: ${finalCmd}`);
        return new Promise((resolve, reject) => {
            session.conn.exec(finalCmd, (err, stream) => {
                if (err) {
                    console.error(`[runScriptStream] Exec error for: ${finalCmd}`, err);
                    return reject(err);
                }
                let exitCode = null;
                stream.on('exit', (code) => {
                    exitCode = code;
                });
                stream.on('close', () => {
                    if (exitCode === 127) {
                        console.error(`[runScriptStream] Command not found (127): ${finalCmd}`);
                    }
                    if (isTemp) {
                        console.log(`[runScriptStream] Cleaning up ${remotePath}`);
                        deleteRemoteItem(session, remotePath, false).catch(e => {
                            console.error(`[runScriptStream] Failed to cleanup temp script ${remotePath}:`, e);
                        });
                    }
                });
                resolve(stream);
            });
        });
    }
    catch (err) {
        // Try to cleanup if upload failed
        if (isTemp) {
            deleteRemoteItem(session, remotePath, false).catch(() => { });
        }
        throw err;
    }
};
