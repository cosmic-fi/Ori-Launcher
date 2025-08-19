# Build and Release Guide

This guide explains how to build and publish versions of Ori Launcher to GitHub with an automatic updating system.

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Git** configured with your GitHub account
3. **GitHub Personal Access Token** with `repo` permissions
4. **Code signing certificates** (optional, for production releases)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure GitHub Token

Create a `.env` file in the project root:

```env
GH_TOKEN=your_github_personal_access_token_here
```

**Important:** Never commit the `.env` file to version control!

### 3. Update Version

Update the version in `package.json`:

```json
{
  "version": "2.0.0"
}
```

## Building

### Local Development Build

```bash
npm run dev
```

### Production Build (UI only)

```bash
npm run build
```

### Create Distributables

```bash
# Build for current platform
npm run dist

# Build for specific platforms
npm run dist:win    # Windows
npm run dist:mac    # macOS
npm run dist:linux  # Linux
npm run dist:all    # All platforms
```

## Publishing Releases

### Method 1: Manual Release

1. **Build and publish:**
   ```bash
   npm run release
   ```

2. **The command will:**
   - Build the UI
   - Package the Electron app
   - Upload to GitHub Releases as a stable release
   - Generate release notes automatically

### Method 2: Automated via GitHub Actions

1. **Push to develop branch:**
   ```bash
   git add .
   git commit -m "feat: new feature for beta"
   git push origin develop
   ```

2. **GitHub Actions will automatically:**
   - Build for Windows, macOS, and Linux
   - Create a development release with format `dev-{commit-hash}`
   - Upload all platform binaries
   - Mark as prerelease (for development builds)

### Method 3: Tagged Stable Release

1. **Create and push a release tag:**
   ```bash
   git tag v2.0.0
   git push origin v2.0.0
   ```

2. **GitHub Actions will:**
   - Build for all platforms
   - Create a proper stable release with the tag name
   - Mark as stable release

## Auto-Updater System

### How It Works

1. **Automatic Checks:** The app checks for updates on startup (production only)
2. **Background Downloads:** Updates download in the background
3. **User Notification:** Users are notified when updates are ready
4. **Restart to Update:** Users can choose to restart immediately or later

### Update Channels

The app supports different update channels:

- **stable:** Production releases only
- **beta:** Beta and production releases
- **alpha:** All releases including alpha versions

### Manual Update Check

Users can manually check for updates through the app's settings or help menu.

## File Structure

```
project/
├── .github/workflows/build.yml    # GitHub Actions workflow
├── src/electron/updater.js         # Auto-updater implementation
├── src/electron/main.js            # Main process with updater integration
├── package.json                    # Build configuration
├── BUILD_AND_RELEASE.md           # This guide
└── release/                       # Generated distributables
    ├── *.exe                      # Windows installers
    ├── *.dmg                      # macOS disk images
    ├── *.AppImage                 # Linux AppImages
    └── *.deb                      # Debian packages
```

## Troubleshooting

### Build Issues

1. **"electron-builder not found"**
   ```bash
   npm install --save-dev electron-builder
   ```

2. **"GH_TOKEN not set"**
   - Ensure `.env` file exists with valid GitHub token
   - Or set environment variable: `export GH_TOKEN=your_token`

3. **Code signing errors (macOS/Windows)**
   - For development releases, you can disable code signing temporarily
   - Add to package.json build config: `"forceCodeSigning": false`

### Update Issues

1. **Updates not working in development**
   - Auto-updater only works in packaged/production builds
   - Use `npm run dist` to test update functionality

2. **"Update server not reachable"**
   - Ensure GitHub releases are public
   - Check internet connection
   - Verify repository settings in package.json

## Security Notes

1. **Never commit secrets:** Use `.env` files and `.gitignore`
2. **Code signing:** Recommended for production releases
3. **HTTPS only:** Auto-updater only works with HTTPS endpoints
4. **Verify signatures:** Consider implementing signature verification

## Release Checklist

- [ ] Update version in `package.json`
- [ ] Test the application locally
- [ ] Update changelog/release notes
- [ ] Build and test distributables
- [ ] Verify auto-updater works with previous version
- [ ] Push to appropriate branch (develop for development builds, main for stable)
- [ ] Monitor GitHub Actions build
- [ ] Test download and installation from GitHub Releases
- [ ] Announce release to users

## Support

For issues with the build system:
1. Check GitHub Actions logs
2. Review electron-builder documentation
3. Ensure all dependencies are up to date
4. Test locally before pushing to GitHub