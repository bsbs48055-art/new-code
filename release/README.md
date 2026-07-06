# Ready-to-install build

`social-media-studio-pro.zip` in this folder is a pre-built, ready-to-use copy of the extension — you don't need to run any commands to use it.

## How to install it in Chrome

1. **Download** `social-media-studio-pro.zip` from this folder (click the file on GitHub, then click **Download raw file**).
2. **Unzip it** on your computer (right-click → Extract All on Windows, or double-click on Mac). You should end up with a folder containing files like `manifest.json`, `popup.html`, etc.
3. Open Google Chrome and go to `chrome://extensions`.
4. Turn on **Developer mode** using the toggle in the top-right corner.
5. Click **Load unpacked**.
6. Select the folder you unzipped in step 2 (the one that directly contains `manifest.json`).
7. The extension is now installed! You'll see its icon in your Chrome toolbar.

## Next steps

Before you can publish content, you need to connect your own YouTube/Facebook/TikTok accounts. See [`docs/API_SETUP.md`](../docs/API_SETUP.md) in the main project for that walkthrough — click the extension icon → **Settings** to enter your credentials and connect each platform.

## Note

This zip is a snapshot of the build at the time it was added. If the project's source code changes later, re-run `npm run build` (see [`docs/BUILD.md`](../docs/BUILD.md)) to get an updated version, or ask for a fresh zip to be generated.
