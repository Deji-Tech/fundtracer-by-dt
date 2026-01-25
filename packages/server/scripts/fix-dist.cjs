#!/usr/bin/env node
/**
 * Fix dist directory structure
 * Moves dist/server/src/* to dist/* and dist/packages/server/src/* to dist/*
 */

const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, '..', 'dist');

// Check for different possible nested structures
const possiblePaths = [
    path.join(distPath, 'server', 'src'),
    path.join(distPath, 'packages', 'server', 'src')
];

let foundPath = null;
for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
        foundPath = p;
        break;
    }
}

if (foundPath) {
    console.log('[fix-dist] Found nested structure at:', foundPath);
    console.log('[fix-dist] Moving files to dist/');

    // Recursively copy files
    function copyDir(src, dest) {
        fs.mkdirSync(dest, { recursive: true });
        const entries = fs.readdirSync(src, { withFileTypes: true });

        for (const entry of entries) {
            const srcPath = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);

            if (entry.isDirectory()) {
                copyDir(srcPath, destPath);
            } else {
                fs.copyFileSync(srcPath, destPath);
            }
        }
    }

    copyDir(foundPath, distPath);

    // Remove old structure
    try {
        fs.rmSync(path.join(distPath, 'server'), { recursive: true, force: true });
    } catch (e) { }
    try {
        fs.rmSync(path.join(distPath, 'packages'), { recursive: true, force: true });
    } catch (e) { }
    try {
        fs.rmSync(path.join(distPath, 'core'), { recursive: true, force: true });
    } catch (e) { }

    console.log('[fix-dist] ✅ Dist structure fixed');
    console.log('[fix-dist] Contents:', fs.readdirSync(distPath));
} else {
    console.log('[fix-dist] No nested structure found, checking current structure...');
    console.log('[fix-dist] Current dist contents:', fs.readdirSync(distPath));

    // Check if index.js exists at root
    if (fs.existsSync(path.join(distPath, 'index.js'))) {
        console.log('[fix-dist] ✅ Structure looks correct');
    } else {
        console.error('[fix-dist] ❌ WARNING: index.js not found in dist!');
    }
}
