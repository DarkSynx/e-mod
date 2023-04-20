const { Titlebar, Color } = require('custom-electron-titlebar');
const path = require('path');
window.addEventListener('DOMContentLoaded', () => {
  new Titlebar({
    backgroundColor: Color.fromHex("#2F324170"),
    itemBackgroundColor: Color.fromHex("#74B1BE70"),
    svgColor: Color.WHITE,
    icon: path.join(__dirname, '/data/logo.png'),
  });
});

// load Script index.js => index.html
require(path.join(__dirname,'index/index.js'));
