const {
    sendNumberModule,
    countModJSONFiles,
    ModulesGestion,
    loading, loadingbar,
    findModJsonFiles,
    createHtmlElement
} = require('./outils');

const moduleData = ModulesGestion({
    modulename: 'index', version: '1.1', autor: 'Darksynx', date: '17/04/2023', idmodule: '00001',
    module_files_path: [],
    requirethis: [],
    initvar: {},
    noAddRunnerText: true,
    returnconsole: false
});

const {
    jqueryPath, readFile, fs, path, util, WinLoad, ipcToWebView, sendPromptControle,
    path_CFG, path_DATA, path_INDEX, path_MODS, path_APP, sendToModule,
    ipcRenderer, writeFileAsync, readFileAsync,
    VERSION, AUTOR, DATE, MODULE_NAME,
    MODULE_FILE_PATH,
    REQUIRE_THIS,
    INITVAR
} = moduleData;

console.log(`jqueryPath : ${jqueryPath}`);

numberModul = 0;
LoadOtherScripts = [];

function winLoad() {


    ipcToWebView({
        icponspec: 'indexControler', func: (arg) => {
            switch (arg[0]) {
                case 'loading':
                    console.log('loading');
                    loadingbar(((arg[2] * 100)/arg[3]));
                    $('#loadingp').text(`Chargement de ${arg[1]} - ${arg[2]}/${arg[3]} - ${((arg[2] * 100)/arg[3]).toFixed(0)}%`);
                    break;

                case 'loadingOK':
                    console.log('loadingOK');
                    setTimeout(() =>{
                        loading();
                    }, 1000);
                    break;
            }
        }
    });


    // on va envoyer le nombre de module au main
    sendNumberModule(countModJSONFiles(path_MODS()));

    findModJsonFiles(path_MODS(), (modJsonPath) => {
        console.log(`Found mod.json file at ${modJsonPath}`);
        readFile(modJsonPath, (data) => {

            data = JSON.parse(data);
            console.log(data);
            console.log(data.folder);

            const spanAttributes = {
                'style': `background-image: url("../mods/${data.folder}/${data.icon}"); background-color: ${data.bgcolor};`
            };
            const buttonAttributes = {
                'id': `App${data.sufixid}`,
                'data-webviewid': `#frameapp_${data.sufixid}`,
                'class': 'boutonApp'
            }


            let linkframe = path_MODS(`${data.folder}/${data.script}`);
            const webViewAttributes = {
                'id': `frameapp_${data.sufixid}`,
                'class': 'webviewframe',
                'preload': `${linkframe}`,
                'src': `${data.link}`,
                'style': '',
                'nodeintegration': '',
                'spellcheck': '1'
            }

            const $spanElement = createHtmlElement('span', spanAttributes);
            const $buttonElement = createHtmlElement('button', buttonAttributes, [$spanElement]);
            const $webViewElement = createHtmlElement('WebView', webViewAttributes);


            $('#application').append($buttonElement);
            $('#frame').append($webViewElement);

        });
    });


    $('div#application').on('click', 'button.boutonApp', function () {

    });
}


// Chargement de la page
WinLoad({jqueryPath: jqueryPath, otherScripts: LoadOtherScripts, winLoad: winLoad});
// FIN de script