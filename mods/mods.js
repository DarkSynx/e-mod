const path = require('path');
module.exports = {
    ModulesGestion: function (data) {
        return require(path.join(__dirname, '../modulesGestion.js')).init(data);
    }
}