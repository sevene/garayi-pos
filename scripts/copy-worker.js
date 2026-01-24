const fs = require('fs');
const path = require('path');

const src = path.join(process.cwd(), '.open-next', 'worker.js');
const dest = path.join(process.cwd(), '.open-next', 'assets', '_worker.js');

console.log(`Copying worker from ${src} to ${dest}`);

if (fs.existsSync(src)) {
    // Ensure assets dir exists
    const assetsDir = path.dirname(dest);
    if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true });
    }

    // Read the original worker file
    let content = fs.readFileSync(src, 'utf8');

    // Rewrite imports to step up one directory because we moved the file
    // from .open-next/worker.js to .open-next/assets/_worker.js
    // We need to change matches like: from "./cloudflare/..." to from "../cloudflare/..."
    // and from "./server-functions/..." to from "../server-functions/..."
    // and from "./middleware/..." to from "../middleware/..."
    // and from "./.build/..." to from "../.build/..."

    // A relatively safe global replacement for "./" to "../" in string literals
    // might be risky if it matches something else, but let's try to be specific for what we see in logs.

    content = content.replace(/from "\.\//g, 'from "../');
    content = content.replace(/import\("\.\//g, 'import("../');

    fs.writeFileSync(dest, content);
    console.log('Success: _worker.js created in assets directory with import paths adjusted.');
} else {
    // Check if it is maybe inside cloudflare folder?
    console.warn(`Warning: Could not find worker file at ${src}.`);

    // We should probably fail in CI
    if (process.env.CI) {
        console.error('Failing build because worker.js was not found in CI.');
        process.exit(1);
    }
}
