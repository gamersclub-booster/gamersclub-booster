const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');

const contentScripts = (file) => path.resolve(__dirname, 'src', 'content-scripts', file);

const options = (file) => path.resolve(__dirname, 'src', 'options', file);

module.exports = {
    mode: 'production',
    entry: {
        'index': options('index.js'),
        'content-scripts/main': contentScripts('main.js'),
        'content-scripts/lobby': contentScripts('lobby.js'),
        'content-scripts/missions': contentScripts('missions.js'),
        'content-scripts/matches': contentScripts('matches.js'),
        'content-scripts/my-matches': contentScripts('my-matches.js'),
        'content-scripts/profile': contentScripts('profile.js'),
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, './dist'),
        clean: true,
    },
    experiments: { topLevelAwait: true },
    plugins: [
        new CopyPlugin({
            patterns: ['public', 'manifest.json', 'src/options/index.html'],
            options: {},
        }),
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery',
        }),
    ],
};
