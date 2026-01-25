#!/usr/bin/env node
/**
 * Fix dist directory structure
 * Moves dist/server/src/* to dist/*
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distPath = path.join(__dirname, '..', 'dist');
const serverSrcPath = path.join(distPath, 'server', 'src');

if (fs.existsSync(serverSrcPath)) {
    console.log('[fix-dist] Moving files from dist/server/src to dist/');

    // Move all files from dist/server/src to dist/
    const files = fs.readdirSync(serverSrcPath, { recursive: true });

    for (const file of files) {
        const srcFile = path.join(serverSrcPath, file);
        const destFile = path.join(distPath, file);

        // Skip if it's a directory
        const stat = fs.statSync(srcFile);
        if (stat.isDirectory()) {
            fs.mkdirSync(destFile, { recursive: true });
            continue;
        }

        // Create parent directory if needed
        const destDir = path.dirname(destFile);
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }

        // Move file
        fs.copyFileSync(srcFile, destFile);
    }

    // Remove old structure
    fs.rmSync(path.join(distPath, 'server'), { recursive: true, force: true });
    fs.rmSync(path.join(distPath, 'core'), { recursive: true, force: true });

    console.log('[fix-dist] ✅ Dist structure fixed');
} else {
    console.log('[fix-dist] No fix needed');
}
