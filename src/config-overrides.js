const path = require('path');
const { override, fixBabelImports, addLessLoader } = require('customize-cra')
const FilterWarningsPlugin = require('webpack-filter-warnings-plugin')


// filter out warning to prevent CI build failing
const filterWarningsPlugin = config => {
    config.plugins.push(
        new FilterWarningsPlugin({
            exclude: /mini-css-extract-plugin/
        })
    )
    return config
}

// const path = require('path')
module.exports = override(
    filterWarningsPlugin,
    fixBabelImports('antd', {
        libraryName: 'antd',
        libraryDirectory: 'es',
        style: true
    }),
    fixBabelImports('lodash', {
        libraryName: 'lodash',
        libraryDirectory: '',
        camel2DashComponentName: false
    }),
    fixBabelImports('ant-design-pro', {
        libraryName: 'ant-design-pro',
        libraryDirectory: 'lib',
        style: true,
        camel2DashComponentName: false
    }),
    addLessLoader({
        javascriptEnabled: true,
        modifyVars: path.join(__dirname, './src/theme/vars.less'),
    }),
)