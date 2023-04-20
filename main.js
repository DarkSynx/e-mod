/**
 * autor: DarkSynx
 * date: 18/04/2023
 * version: 1.7.0
 * description: E-Mod
 * - The main file
 * @file main.js - The main file
 * @param win - The main window
 * @returns {Promise<void>} - The main function
 */
async function main(win = null) {
    try {
        const {ipcMain: ipc, dialog, app, Menu, MenuItem, BrowserWindow, webContents} = require('electron');
        const {MicaBrowserWindow, IS_WINDOWS_11} = require('mica-electron');
        const path = require('path');
        const fs = require('fs');
        const OSV = require('os').release();
        const OSR = OSV.slice(0, 2);
        const APPNAME = "eMod";
        const VERSION = "1.7.0";

        // https://www.electronjs.org/de/docs/latest/api/command-line-switches#--force_high_performance_gpu
        // app.disableHardwareAcceleration();
        // app.commandLine.appendSwitch('force_high_performance_gpu');
        // app.commandLine.appendSwitch('force_low_power_gpu');
        // app.commandLine.appendSwitch('enable-experimental-web-platform-features');

// Variables
        const EMOD_PATH = path.join(__dirname, '/index/', 'index.html');
        const PRELOAD_PATH = path.join(app.getAppPath(), 'preload.js');
        const CONFIGS_FILE_PATH = path.join(__dirname, '/cfg/', 'configs.json');
        const DATA_FILE_PATH = path.join(__dirname, '/data/', 'data.json');

// fichier charger
        let mainWindowWebContentsTempInstenceStop = true;
        let mainWindowWebContentsTempStop = false;
        let mainWindowWebContentsTemp = [];
        let mainWindowWebContents = [];

        let data = require(DATA_FILE_PATH);
        if (!data.contextmenu) data.contextmenu = undefined;
        if (!data.licencedialogue) data.licencedialogue = undefined;

        let configs = require(CONFIGS_FILE_PATH);
        if (!configs.devtoolwc) configs.devtoolwc = undefined;
        if (!configs.SpellCheckerLanguages) configs.SpellCheckerLanguages = undefined;
        if (!configs.frame) configs.frame = undefined;
        if (!configs.xframeoptions) configs.xframeoptions = undefined;
        if (!configs.devtool) configs.devtool = undefined;
        if (!configs.windows) configs.windows = undefined;

        let ModuleNumber = 0;
        let timeoutstop10s = null;

// Affichage des informations
        console.log(`                      
 ================================
 ${APPNAME} v${VERSION}
 Windows version : ${OSV}
 Windows 11 : ${IS_WINDOWS_11}
 timestamp: ${Math.floor(Date.now() / 1000)}
 ================================================
`);

        const {setupTitlebar, attachTitlebarToWindow} = require('custom-electron-titlebar/main');
        setupTitlebar();
        const template = [
            {
                label: "menu", submenu: [
                    {label: APPNAME + " v" + VERSION}
                    , {type: "separator"},
                    {
                        label: "Devtool",
                        accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Alt+Shift+I',
                        click: async () => {
                            await win.openDevTools();
                        }
                    }
                    , {type: "separator"},
                    {label: "🚪 exit", role: "quit", accelerator: "Alt+F4"}
                ]
            }
        ]


        const menubar = Menu.buildFromTemplate(template)
        Menu.setApplicationMenu(menubar)

        const winding = () => {

            const MicaBrowserWindowConfig = data.MicaBrowserWindow;
            MicaBrowserWindowConfig.webPreferences.preload = PRELOAD_PATH;
            MicaBrowserWindowConfig.icon = path.join(__dirname, '/data/logo.png');

            const useMicaElectron = configs.MicaBrowserWindow === true && (OSR >= "10" || IS_WINDOWS_11);


            win = useMicaElectron ? new MicaBrowserWindow(MicaBrowserWindowConfig) : new BrowserWindow(MicaBrowserWindowConfig);

            if (useMicaElectron) {
                const {wx: wxConfigs = {}, w11: w11Configs = {}} = configs.windows;
                const {Transparent, Blur, Acrylic, RoundedCorner} = wxConfigs;
                const {DarkTheme, MicaEffect} = w11Configs;

                if (Transparent) win.setTransparent();
                if (Blur) win.setBlur();
                if (Acrylic) win.setAcrylic();
                if (RoundedCorner) win.setRoundedCorner();
                if (DarkTheme) win.setDarkTheme();
                if (MicaEffect) win.setMicaEffect();
            }

            // Attach fullscreen(f11 and not 'maximized') && focus listeners
            attachTitlebarToWindow(win);

            win.once('ready-to-show', () => {
                win.show();
            });


            // IPC Central Main
            ipc.on("ipcCentralMain", (event, arg) => {
                sendToMainWindow(arg);
            });

            // IPC WebContents Abonnement
            ipc.on("ipcWebContentsAbonnementNumberModule", (event, arg) => {
                console.log("-> [ NumberModule ] :", arg);
                ModuleNumber = arg;
            });

            // IPC WebContents Abonnement
            ipc.on("ipcWebContentsAbonnement", (event, arg) => {
                mainWindowWebContents[arg[0]] = mainWindowWebContentsTemp[arg[1]];
                console.log("-> [ ipcWebContentsAbonnement ] :", arg[0], "load:", ModuleNumber, '/', Object.keys(mainWindowWebContents).length);
                win.send('indexControler', ['loading', arg[0], Object.keys(mainWindowWebContents).length, ModuleNumber]);
                if (ModuleNumber === Object.keys(mainWindowWebContents).length) {
                    console.log("-- [ ipcWebContentsAbonnement ] :", ModuleNumber, '/', Object.keys(mainWindowWebContents).length);
                    mainWindowWebContentsTempInstenceStop = false;
                    mainWindowWebContentsTempStop = true;
                    closeModule();
                }
            });

            win.loadFile(EMOD_PATH).then(() => {
                console.log("=> emod : ready!");
                // Devtools
                if (configs.devtool) {
                    win.webContents.openDevTools();
                }
            });

            win.on("closed", () => {
                win = null;
            });


            // x-frame-options
            if (configs.xframeoptions) {
                win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
                    Object.fromEntries(Object.entries(details.responseHeaders).filter(header => !/x-frame-options/i.test(header[0])));
                    callback({
                        responseHeaders: {
                            ...details.responseHeaders,
                            'Content-Security-Policy': ['default-src \'none\'']
                        }
                    });
                });
            }

            // SpellCheckerLanguages
            if (configs.SpellCheckerLanguages) {
                win.webContents.session.setSpellCheckerLanguages(configs.SpellCheckerLanguages);
            }
        }

        function sendToMainWindow(arg) {
            if (mainWindowWebContents[arg.webview]) {
                mainWindowWebContents[arg.webview].send(arg.ipc, arg.data);
                console.log("<- [ " + arg.ipc + " ] to:", arg.webview, " | data: ", arg.data);
            }
        }
        function closeModule(msg = null) {
            if(msg) console.log(msg);
            mainWindowWebContentsTemp = null;
            mainWindowWebContentsTempStop = true;
            const listNameWebContents = Object.keys(mainWindowWebContents);
            console.log("<- [ ipcListNameWebContents ] :");
            for (const key in mainWindowWebContents) {
                if (mainWindowWebContents.hasOwnProperty(key) && mainWindowWebContents[key]) {
                    mainWindowWebContents[key].send("ipcListNameWebContents", listNameWebContents);
                    console.log(" - to :", key , "| lst :", listNameWebContents);
                }
            }
            clearTimeout(timeoutstop10s);
            win.send('indexControler', ['loadingOK',]);
        }

// Cette méthode sera appelée quand Electron aura fini
// de s'initialiser et sera prêt à créer des fenêtres de navigation.
// Certaines APIs peuvent être utilisées uniquement quand cet événement est émit.
//app.on('ready', () => {

        app.whenReady().then(() => {

            if (typeof configs.licenceuse !== 'undefined' && configs.licenceuse === true) {
                winding();

            } else {
                dialog.showMessageBox(data.licencedialogue).then(result => {
                    const response = result.response;
                    const checkboxChecked = result.checkboxChecked;

                    if (checkboxChecked) {
                        configs.licenceuse = true;
                        try {
                            fs.writeFileSync(CONFIGS_FILE_PATH, JSON.stringify(configs), 'utf-8');
                        } catch (e) {
                            console.log('Failed to save the file !');
                        }
                    }

                    if (response === 1) {
                        winding();

                    } else {
                        win.destroy();
                        app.quit();
                    }
                });
            }

        });




        app.on("web-contents-created", (event, webContents) => {

            webContents.on('did-finish-load', () => {
                if (!mainWindowWebContentsTempStop) {
                    if (webContents.getType() === 'webview') {
                        mainWindowWebContentsTemp[webContents.id] = webContents;

                        setTimeout(() => {
                            if (mainWindowWebContentsTemp[webContents.id]) {
                                mainWindowWebContentsTemp[webContents.id].send("ipcWebContentsAbonnement", webContents.id);
                                console.log("<- [ ipcWebContentsAbonnement ] : Id", webContents.id);
                            }
                        }, 1000);

                        if (mainWindowWebContentsTempInstenceStop) {
                            mainWindowWebContentsTempInstenceStop = false;
                            timeoutstop10s = setTimeout(()=>{
                                closeModule("-> [ ipcWebContentsAbonnement ] : Stop 10s");
                            }, 10000);
                        }

                    }
                }
            });

            if (typeof configs.devtoolwc !== 'undefined' && configs.devtoolwc === true) {
                webContents.once('dom-ready', () => {
                    if (!webContents.isDestroyed()) {
                        webContents.openDevTools();
                    }
                });
            }

            webContents.on("context-menu", (event, params) => {
                if (!webContents.isDestroyed()) {
                    const menu = Menu.buildFromTemplate(data.contextmenu);

                    menu.append(new MenuItem({
                        label: "Devtool",
                        accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Alt+Shift+I',
                        click: async () => {
                            await win.openDevTools();
                        }
                    }));

                    let listsubmenu = [];
                    for (let mainWindowWebContentsKey in mainWindowWebContents) {
                        listsubmenu.push({
                            label: "Devtool:" + mainWindowWebContentsKey,
                            click: async () => {
                                await mainWindowWebContents[mainWindowWebContentsKey].openDevTools({mode: 'undocked'});
                            }
                        });
                    }

                    menu.append(new MenuItem({label: "DevTool Webview", submenu: listsubmenu}));
                    event.preventDefault();

                    // Ajouter toutes les suggestions
                    for (const suggestion of params.dictionarySuggestions) {
                        menu.append(new MenuItem({
                            label: suggestion,
                            click: () => win.webContents.replaceMisspelling(suggestion)
                        }));
                    }

                    // Permettre à l'utilisateur d'ajouter le mot considéré mal épellé au dictionnaire
                    if (params.misspelledWord) {
                        menu.append(new MenuItem({type: 'separator'}));
                        menu.append(new MenuItem({
                            label: '📖 Add to dictionary',
                            click: () => win.webContents.session.addWordToSpellCheckerDictionary(params.misspelledWord)
                        }));
                    }

                    menu.popup({x: params.x, y: params.y});
                }
            });

        });


        app.on('before-quit', () => {
            Object.values(mainWindowWebContents).forEach(wc => {
                if (wc.isDevToolsOpened()) {
                    wc.closeDevTools();
                }
            });
        });

        app.on('before-quit', () => {
            const allWebContents = webContents.getAllWebContents()
            allWebContents.forEach(wc => {
                if (wc.isDevToolsOpened()) {
                    wc.closeDevTools()
                }
            })
        });


        app.on('window-all-closed', () => {
            if (process.platform !== 'darwin') {
                app.quit()
            }
        });

    } catch (err) {
        console.log(err);
    }

}

main().then(() => {
    console.log("=> main : ready!");
});