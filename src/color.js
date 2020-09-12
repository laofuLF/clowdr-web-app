const path = require('path');
const { generateTheme } = require('antd-theme-generator');
const { getLessVars } = require('antd-theme-generator');
const defaultVars = getLessVars('./node_modules/antd/lib/style/themes/default.less')
const darkVars = { ...getLessVars('./node_modules/antd/lib/style/themes/dark.less'), '@primary-color': defaultVars['@primary-color'] };
const lightVars = { ...getLessVars('./node_modules/antd/lib/style/themes/compact.less'), '@primary-color': defaultVars['@primary-color'] };

const themeVariables = getLessVars(path.join(__dirname, './src/theme/vars.less'))


const options = {
    stylesDir: path.join(__dirname, './src/theme'),
    antDir: path.join(__dirname, './node_modules/antd'),
    varFile: path.join(__dirname, './src/theme/vars.less'),
    mainLessFile: path.join(__dirname, './src/theme/index.less'),
    themeVariables:  Array.from(new Set([
        ...Object.keys(darkVars),
        ...Object.keys(lightVars),
        ...Object.keys(themeVariables),
    ])),
    indexFileName: 'index.html',
    outputFilePath: path.join(__dirname, './public/color.less'),
};

generateTheme(options)
    .then((less) => {
        console.log('theme generated successfully');
    })
    .catch((error) => {
        console.log('Error', error);
    });