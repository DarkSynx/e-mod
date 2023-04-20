const {ModulesGestion} = require('../mods');
const moduleData = ModulesGestion({
    modulename: 'test', version: '1.0', autor: 'Darksynx', date: '17/04/2023',
    module_files_path: [],
    requirethis: [],
    initvar: {}
});

const {
    jqueryPath, fs, path, util, WinLoad, ipcToWebView, sendPromptControle,
    path_CFG, path_DATA, path_INDEX, path_MODS, path_APP,
    ipcRenderer, writeFileAsync, readFileAsync,
    VERSION, AUTOR, DATE, MODULE_NAME,
    MODULE_FILE_PATH,
    REQUIRE_THIS,
    INITVAR
} = moduleData;


// Chargement de la page
WinLoad({
    jqueryPath: jqueryPath, otherScripts: [],
    winLoad: () => {
        console.log('test load start');
    }
});