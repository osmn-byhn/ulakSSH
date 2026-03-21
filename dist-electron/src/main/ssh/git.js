export const getGitRepos = (conn) => {
    return new Promise((resolve, reject) => {
        // Find git repos up to 3 levels deep in home directory and get their branches
        // Using a more compatible command for branch detection
        const cmd = `find ~ -maxdepth 3 -name .git -type d -prune 2>/dev/null | while read gitdir; do 
            repo_path=$(dirname "$gitdir"); 
            repo_name=$(basename "$repo_path");
            cd "$repo_path" && branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown"); 
            echo "$repo_name:$branch:$repo_path"; 
        done`;
        conn.exec(cmd, (err, stream) => {
            if (err)
                return reject(err);
            let output = '';
            stream.on('data', (data) => {
                output += data.toString();
            }).on('close', () => {
                const repos = output
                    .split('\n')
                    .map(line => line.trim())
                    .filter(line => line.length > 0)
                    .map(line => {
                    const [name, branch, path] = line.split(':');
                    return { name, branch, path };
                });
                resolve(repos);
            });
        });
    });
};
