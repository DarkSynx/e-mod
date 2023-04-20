// no security warning
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = true;

const {ipcRenderer} = require('electron');
const path = require('path');
const fs = require('fs');
const util = require('util');
const {createHtmlElement} = require("./index/outils");
const readFileAsync = util.promisify(fs.readFile);
const writeFileAsync = util.promisify(fs.writeFile);

module.exports = {
    readFile: function (modJsonPath = '', callback = (data) => {}) {
        readFileAsync(modJsonPath, 'utf8').then((data) => {
            return callback(data);
        }).catch((err) => {
            console.error(err);
        });
    },
    path_CFG: function (m = '') {
        return path.join(__dirname, 'cfg/', m);
    }
    ,
    path_DATA: function (m = '') {
        return path.join(__dirname, 'data/', m);
    }
    ,
    path_INDEX: function (m = '') {
        return path.join(__dirname, 'index/', m);
    }
    ,
    path_MODS: function (m = '') {
        return path.join(__dirname, 'mods/', m);
    }
    ,
    path_APP: function (m = '') {
        return path.join(__dirname, m);
    }
    ,
    /**
     * Permet d'envoyer un abonnerment au Controleur Central c'est passif
     * comme avec addrunnertext qui lui est un abonnement au webview Index
     * indiquant que le module est prêt à recevoir des données.
     * @param {string} webviewName - Le nom du webview.
     * @todo initWebview
     * arg indique le chiffre de l'abonnement cela permet par la suite
     * de remplacer le chiffre par le nom du webview
     **/
    initWebview: function (webviewName) {
        ipcRenderer.on('ipcWebContentsAbonnement', (_, arg) => {
            console.log(`ipcWebContentsAbonnement: ${arg}`);
            ipcRenderer.send('ipcWebContentsAbonnement', [webviewName, arg]);
            return arg;
        });
    }
    ,
    /**
     * Permet de récolter la liste des noms de webview disponible pour comuniqué
     **/
    addListNameWebview: function (webviewNameList = {}) {
        ipcRenderer.on('ipcListNameWebContents', (_, arg) => {
            console.log('ipcListNameWebContents:' + arg);
            webviewNameList[arg] = false;
        });
        return webviewNameList;
    }
    ,
    /**
     * Permet de recevoir des données du Controleur Central venant d'un autre module.
     * a vous de faire le traitement des données arg
     * @param {function} functionipcToWebView - La fonction à exécuter.
     **/
    ipcToWebView: function ({func, icponspec = 'ipcToWebView'}) {
        ipcRenderer.on(icponspec, (_, arg) => {
            func(arg);
        });
    }
    ,
    /**
     * Permet d'abonner votre module ici au Webview Index c'est un abonnement passif
     * comme avec initWebview qui lui est un abonnement au controleur central ici c'est
     * au webview Index pour une réponse ciblé vers le module qui demande une action
     **/
    addrunnertext: function (data) {
        setTimeout(function () {
            console.log('=> addrunnertext : ' + data);
            module.exports.sendToModule({dataExploit: ["listaddrunnertext", data]});
        }, 2000);
        return data;
    }
    ,
    /**
     * Permet d'envoyer a Index un prompt addrunnertext vous à abonné au webview Index
     * ce qui lui permet de vous répondre via ipcToWebView
     * addrunnertext => abonnement au webview Index
     * sendPromptControle => envoi de le prompt à Index
     * ipcToWebView <= réception de la réponse de Index
     **/
    sendPromptControle: function (prompt, de = '') {
        console.log('sendPromptControle => ' + prompt);
        module.exports.sendToModule({dataExploit: ["promptcontrole", prompt, de]});
    }
    ,
    /**
     * Permet d'envoyer a n'importe quel webview une donnée
     * @param {string} webviewName - Le nom du webview.
     * @param {string} ipcOn - Le nom de l'abonnement.
     * @param {string} dataExploit - Les données à envoyer.
     **/
    sendToModule: function ({webviewName = "Index", ipcOn= "ipcToWebViewIndex", dataExploit = null, debug = false}) {
        module.exports.sendToMain('ipcCentralMain', {
            "webview": webviewName,
            "ipc": ipcOn,
            "data": dataExploit
        }, debug);
    },
    /**
     * Permet d'envoyer a n'importe quel webview au Main via un Ipcon spécifique
     * @param {string} ipconMain - Le nom de l'abonnement.
     * @param {string} data - Les données à envoyer.
     **/
    sendToMain: function (ipconMain, data, debug = false) {
        if (debug) console.log('sendToMain => ' + ipconMain + ' data => ' + data);
        ipcRenderer.send(ipconMain, data);
    }
    ,
    /**
     * Permet d'envoyer a n'importe quel webview une donnée
     * @param {string} ipcOn - Le nom de l'abonnement.
     * @param {function} functionipcToWebView - La fonction à exécuter.
     * @param {boolean} event - Si la fonction à exécuter à besoin d'un event.
     * @param {boolean} debug - Si vous voulez afficher les logs.
     **/
    getToModule: function (ipcOn, functionipcToWebView = null, event = false, debug = false) {
        ipcRenderer.on(ipcOn, (event, arg) => {
            if (functionipcToWebView !== null && event === false) functionipcToWebView(arg);
            else if (functionipcToWebView !== null && event) functionipcToWebView(event, arg);
        });
    }
    ,
    /**
     * Permet d'envoyer a Index une fonction javascript
     * cela reste une méthode à risque d'exception !
     * @param {string} script - La fonction javascript à envoyer.
     * @todo sendActionScript : qui seront executé dans le webview
     * de maniére securisé avec les propriétés sandbox suivante : [
     * 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval', 'process', 'Buffer',
     * 'setImmediate', 'clearImmediate', 'global', 'exports', 'module', 'require',
     * '__filename', '__dirname' ]
     */
    sendActionScript: function (script) {
        const serializedFunction = script.toString();
        module.exports.sendToModule({dataExploit: ["actionscript", JSON.stringify(serializedFunction)]});
    }
    ,
    /**
     * fonction qui facilite la gestion du module via window.addEventListener:load
     * @param {function} backscript - La fonction à exécuter avant le chargement des scripts.
     * @param {string} jqueryPath - Le chemin vers le fichier jquery.
     * @param {array} otherScripts - Les autres scripts à charger.
     * @param {function} winLoad - La fonction à exécuter.
     * @todo WinLoad : qui seront executé dans le webview actuel
     */
    WinLoad: function ({
                           backscript = null,
                           jqueryPath = null,
                           otherScripts = [],
                           winLoad = null,
                       }) {
        if (backscript !== null) backscript();
        window.addEventListener('load', () => {
            if (jqueryPath !== null) window.$ = window.jQuery = require(jqueryPath);
            otherScripts.forEach((s) => {
                require(s);
            });
            if (winLoad !== null) winLoad();
        });
        return true;
    }
    ,
    /**
     * Permet de charger les fonctions du module
     * @param modulename - Le nom du module.
     * @param version - La version du module.
     * @param autor - L'auteur du module.
     * @param date - La date de création du module.
     * @param idmodule - L'identifiant du module.
     * @param module_files_path - Les chemins vers les fichiers du module.
     * @param requirethis - Les modules à charger.
     * @param initvar - Les variables à initialiser.
     * @param noAddRunnerText - Si vous ne voulez pas utiliser addrunnertext.
     * @param returnconsole - Si vous voulez afficher les logs.
     * @param JqueryPath - Le chemin vers le fichier jquery.
     * @returns {{}} - Les fonctions du module.
     */
    init: function ({
                        modulename = '',
                        version = '1.0a',
                        autor = '',
                        date = '',
                        idmodule = null,
                        module_files_path = [],
                        requirethis = [],
                        initvar = {},
                        noAddRunnerText = false,
                        returnconsole = false,
                        JqueryPath = 'index/js/jquery-3.6.3.min.js'
                    }) {
        const allFunctions = {};

        Object.keys(this).forEach(key => {
            if (typeof this[key] === 'function') {
                if (returnconsole) console.log(`existe function : ${key} => ${this[key]}`);
                if (key === 'initWebview') {
                    allFunctions[key] = this[key];
                    idmodule = this[key](modulename);
                } else if (key === 'addrunnertext' && noAddRunnerText === false) {
                    allFunctions[key] = this[key](modulename);
                } else if (key === 'addListNameWebview') {
                    allFunctions[key] = this[key]();
                    allFunctions.WEBVIEWLIST = allFunctions[key];
                } else {
                    allFunctions[key] = this[key];
                }
            }
        });

        console.log(path.join(this.path_APP(), JqueryPath));
        allFunctions.jqueryPath = path.join(this.path_APP(), JqueryPath);
        allFunctions.ipcRenderer = ipcRenderer;
        allFunctions.fs = fs;
        allFunctions.util = util;
        allFunctions.path = path;

        allFunctions.writeFileAsync = util.promisify(fs.writeFile);
        allFunctions.readFileAsync = util.promisify(fs.readFile);

        allFunctions.VERSION = version;
        allFunctions.AUTOR = autor;
        allFunctions.DATE = date;
        allFunctions.IDMODULE = idmodule;
        allFunctions.MODULE_NAME = modulename;


        // liste des liens vers les fichiers du module
        if (module_files_path.length > 0) {
            genmodulefilespath = [];
            module_files_path.forEach((m) => {
                genmodulefilespath.push(path.join(__dirname, modulename, '/', m));
            });
            allFunctions.MODULE_FILE_PATH = genmodulefilespath;
        }

        // liste des fichiers js charger avec require
        if (requirethis.length > 0) {
            genmodulefilesrequire = [];
            requirethis.forEach((g) => {
                let rc = require(path.join(__dirname, modulename, '/', g));
                genmodulefilesrequire.push(rc);
            });
            allFunctions.REQUIRE_THIS = genmodulefilesrequire;
        }

        allFunctions.INITVAR = {};
        if (Object.keys(initvar).length > 0) {
            Object.keys(initvar).forEach((key) => {
                console.log(`initvar : ${key} => ${initvar[key]}`);
                allFunctions.INITVAR[key] = initvar[key];
            });
        }

        if (returnconsole) console.log(`allFunctions : ${JSON.stringify(allFunctions)}`);

        console.log(allFunctions);
        return allFunctions;
    }
}
;