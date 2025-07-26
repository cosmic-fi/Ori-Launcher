import { getAppWindow } from "../window/appWindow.js";
import { Tray, Menu, app } from "electron";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let tray = undefined;

const setTray = () => {
    tray = new Tray(path.join(__dirname, "../../../public/icons/win32.ico"));
    const contextMenu = Menu.buildFromTemplate([
        { label: "Ori Launcher", enabled: false },
        { type: "separator" },
        { label: "Retrieve", click: () => getAppWindow()?.show() },
        {label: 'Check for Updates', click: () => console.log('Huh no update yet!')},
        {type: 'separator'},
        { label: "Quit", click: () => app.quit() },
    ]);

    tray.setContextMenu(contextMenu);
    tray.setToolTip("Ori Launcher");
    tray.on("double-click", () => getAppWindow()?.show());
}


export default setTray;