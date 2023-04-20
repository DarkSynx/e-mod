const path = require('path');
const fs = require('fs');
const {ipcRenderer} = require('electron');
module.exports = {
    ModulesGestion: function (data) {
        return require(path.join(__dirname, '../modulesGestion.js')).init(data);
    },
    loading: function () {
            $('#msgload').fadeOut('slow');
            $('#frame').fadeIn('slow');
    },
    loadingbar : function (percentage) {
        $('#loadingp').css('background', 'linear-gradient(to right, #4CAF50 ' + percentage + '%, transparent ' + percentage + '%)');
    },
    findModJsonFiles: function (dir, callback) {
        fs.readdir(dir, (err, files) => {

            console.log("findModJsonFiles" + dir);

            if (err) {
                console.error(err);
                return;
            }

            files.forEach(file => {
                const filePath = path.join(dir, file);
                fs.stat(filePath, (err, stats) => {
                    if (err) {
                        console.error(err);
                        return;
                    }

                    if (stats.isDirectory()) {
                        module.exports.findModJsonFiles(filePath, callback);
                    } else if (path.basename(filePath) === 'mod.json') {
                        callback(filePath);
                    }
                });
            });
        });
    },
    bind : (value, func) => {
        return func(value);
    },
    sendNumberModule : function (number) {
        ipcRenderer.send('ipcWebContentsAbonnementNumberModule', number);
    },
    countModJSONFiles : function (startPath) {
        let count = 0; // variable pour stocker le nombre de fichiers mod.json trouvés
        const files = fs.readdirSync(startPath); // liste tous les fichiers et dossiers dans le dossier donné
        for (let i = 0; i < files.length; i++) {
            const filename = path.join(startPath, files[i]); // chemin complet du fichier/dossier
            const stat = fs.lstatSync(filename); // informations sur le fichier/dossier
            if (stat.isDirectory()) {
                count += module.exports.countModJSONFiles(filename); // recherche dans les sous-dossiers et ajoute le nombre de fichiers mod.json trouvés
            } else if (filename.endsWith('mod.json')) {
                count++; // incrémente le nombre de fichiers mod.json trouvés
            }
        }
        return count; // renvoie le nombre de fichiers mod.json trouvés
    },
   createHtmlElement : (tag, attributes, children = []) => {
       return module.exports.bind($('<' + tag + '>'), $element => {
           Object.entries(attributes).forEach(([key, value]) => {
               $element.attr(key, value);
           });

           children.forEach(child => {
               $element.append(child);
           });

           return $element;
       });
   }
}