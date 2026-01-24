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

    // Rewrite imports to step up one directory
    content = content.replace(/from "\.\//g, 'from "../');
    content = content.replace(/import\("\.\//g, 'import("../');

    // Wrap the worker to handle static assets via env.ASSETS
    // 1. Rename 'export default' to a variable
    content = content.replace('export default', 'const openNextWorker =');

    // 2. Append the wrapper logic
    content += `\n\n
export default {
  async fetch(request, env, ctx) {
    // Attempt to serve static assets from Cloudflare Pages ASSETS binding
    // only if the request is not for a specific API or dynamic route pattern that likely needs to be intercepted?
    // Actually, checking ASSETS is usually cheap.
    // However, we must ensure we don't accidentally intercept something that SHOULD be dynamic but happens to share a path?
    // Next.js static assets are in _next/static, which is safe.
    // Public files are at root.

    // Simple strategy: Try ASSETS. If found (200-299), return it.
    // If 404, delegate to OpenNext.

    try {
        const url = new URL(request.url);
        // Optimization: bypass ASSETS fetch for API routes to save time/ops?
        if (!url.pathname.startsWith('/api/') && env.ASSETS) {
             const asset = await env.ASSETS.fetch(request);
             if (asset.status >= 200 && asset.status < 400) {
                 return asset;
             }
        }
    } catch (e) {
        console.error("Error fetching asset:", e);
    }

    // Fallback to Next.js Application
    return openNextWorker.fetch(request, env, ctx);
  }
};`;

    fs.writeFileSync(dest, content);
    console.log('Success: _worker.js created in assets directory with import paths adjusted and asset fallback wrapper.');
} else {
    // Check if it is maybe inside cloudflare folder?
    console.warn(`Warning: Could not find worker file at ${src}.`);

    // We should probably fail in CI
    if (process.env.CI) {
        console.error('Failing build because worker.js was not found in CI.');
        process.exit(1);
    }
}
