const fs = require('fs');
const path = require('path');

// Logs provided by OpenNext can sometimes deviate. We need to find the worker file.
// Usually it is at .open-next/worker.js or .open-next/server-functions/default/index.js (or similar)
// But based on the logs: "Worker saved in .open-next/worker.js"

// Update: In recent versions, if might vary. Let's try to assume it's at .open-next/worker.js
// If not found, we check if it is somewhere else?
// Actually, earlier logs showed: "Worker saved in `.open-next/worker.js`"
// But my local check failed. Maybe because local build was done BEFORE some changes?
// Or maybe I am looking at the wrong directory? D:\Garayi-cloud\.open-next
// I will assume the log from Cloudflare is correct for the Cloudflare environment.

const src = path.join(process.cwd(), '.open-next', 'worker.js');
const dest = path.join(process.cwd(), '.open-next', 'assets', '_worker.js');

console.log(`Copying worker from ${src} to ${dest}`);

if (fs.existsSync(src)) {
    // Ensure assets dir exists
    const assetsDir = path.dirname(dest);
    if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true });
    }

    fs.copyFileSync(src, dest);
    console.log('Success: _worker.js created in assets directory.');
} else {
    // Check if it is maybe inside cloudflare folder?
    // .open-next/cloudflare/worker.js? No.
    // Let's just warn for now, as local environment might be different from CI.
    console.warn(`Warning: Could not find worker file at ${src}. Using a placeholder or failing?`);
    console.warn('Listing .open-next contents:');
    try {
        console.log(fs.readdirSync(path.join(process.cwd(), '.open-next')));
    } catch (e) { }

    // We should probably fail in CI
    if (process.env.CI) {
        console.error('Failing build because worker.js was not found in CI.');
        process.exit(1);
    }
}
