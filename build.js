import { build } from 'electron-builder';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const args = process.argv.slice(2);
const shouldBuild = args.includes('--build=platform');

const getFiles = async (dir, files = []) => {
    const fileList = await fsPromises.readdir(dir);
    for (const file of fileList) {
        const name = `${dir}/${file}`;
        const stat = await fsPromises.stat(name);
        if (stat.isDirectory()) {
            await getFiles(name, files);
        } else {
            files.push(name);
        }
    }
    return files;
};

const copyFiles = async () => {
    console.log('Copying source files...');
    
    // We don't need to copy src/app as it's built by Vite into dist/
    // Only copy the electron files
    const electronFiles = await getFiles('src/electron');
    for (const file of electronFiles) {
        const content = await fsPromises.readFile(file, 'utf8');
        const outputPath = file.replace('src/', 'app/');
        const outputDir = path.dirname(outputPath);
        
        try {
            await fsPromises.access(outputDir);
        } catch (error) {
            await fsPromises.mkdir(outputDir, { recursive: true });
        }
        
        await fsPromises.writeFile(outputPath, content);
    }
    
    // Copy locale files if they exist
    try {
        await fsPromises.access('locale');
        const localeFiles = await getFiles('locale');
        for (const file of localeFiles) {
            const content = await fsPromises.readFile(file, 'utf8');
            const outputPath = `app/locale/${path.basename(file)}`;
            const outputDir = path.dirname(outputPath);
            
            try {
                await fsPromises.access(outputDir);
            } catch (error) {
                await fsPromises.mkdir(outputDir, { recursive: true });
            }
            
            await fsPromises.writeFile(outputPath, content);
        }
    } catch (error) {
        console.log('No locale files found, skipping...');
    }
    
    console.log('Files copied successfully!');
};
const buildApp = async () => {
    try {
        console.log('Building application...');
        await build({
            config: {
                appId: 'online.cosmicfi.orilauncher',
                productName: 'Ori Launcher',
                copyright: 'Copyright © 2025 Ori Launcher',
                forceCodeSigning: false,
                afterSign: null,
                artifactName: '${productName}-${version}-${os}-${arch}.${ext}',
                extraMetadata: {
                    main: 'app/electron/main.js'
                },
                files: [
                    "dist/**/*",           // Frontend built by Vite
                    "app/electron/**/*",    // Copied Electron files
                    "app/locale/**/*",      // Copied locale files
                    "node_modules/**/*",    // Dependencies
                    "!node_modules/**/{test,__tests__,tests,powered-test,example,examples}/**",
                    "!node_modules/**/*.{d.ts,o,hprof,rc,bin,log,sh,md,txt}",
                    "package.json",         // Package info
                    "LICENSE.md",           // License
                    "public/**/*"           // Public assets
                ],
                directories: {
                    buildResources: "public",
                    output: 'build'
                },
                compression: 'normal',
                asar: true,
                asarUnpack: [
                    '**/*.node',
                    '**/discord-rpc/**/*',
                    '**/discord-rpc/**/.*'
                ],
                win: {
                    target: {
                        target: 'nsis',
                        arch: ['x64']
                    },
                    icon: 'public/icon.ico'
                },
                nsis: {
                    oneClick: false,
                    allowToChangeInstallationDirectory: true,
                    createDesktopShortcut: true,
                    createStartMenuShortcut: true,
                    allowElevation: false,
                    artifactName: '${productName}-${version}-${os}-${arch}.${ext}',
                    deleteAppDataOnUninstall: false
                },
                mac: {
                    target: [
                        {
                            target: 'dmg',
                            arch: ['universal']
                        },
                        {
                            target: 'zip',
                            arch: ['universal']
                        }
                    ],
                    icon: 'public/icon.icns',
                    identity: null,
                    hardenedRuntime: false,
                    gatekeeperAssess: false
                },
                linux: {
                    target: [
                        {
                            target: 'AppImage',
                            arch: ['x64']
                        }
                    ],
                    icon: 'public/icon.png',
                    category: 'Game',
                    synopsis: 'Ori Launcher - Game Launcher',
                    description: 'A modern game launcher for Ori games'
                },
                publish: [
                    {
                        provider: 'github',
                        owner: 'cosmic-fi',
                        repo: 'Ori-Launcher',
                        releaseType: 'release'
                    }
                ]
            }
        });
        console.log('Build completed successfully!');
    } catch (error) {
        console.error('Build failed:', error);
        process.exit(1);
    }
};

const buildFrontend = async () => {
    try {
        console.log('Building frontend with Vite...');
        execSync('npm run build:ui', { stdio: 'inherit' });
        console.log('Frontend build completed successfully!');
        return true;
    } catch (error) {
        console.error('Frontend build failed:', error);
        return false;
    }
};

const main = async () => {
    if (shouldBuild) {
        // First build the frontend with Vite
        const frontendBuilt = await buildFrontend();
        if (!frontendBuilt) {
            console.error('Failed to build frontend, aborting packaging process.');
            process.exit(1);
        }
        
        // Then copy necessary files
        await copyFiles();
        
        // Finally package the application
        await buildApp();
    } else {
        console.log('Use --build=platform to build the application');
    }
};

main().catch(console.error);