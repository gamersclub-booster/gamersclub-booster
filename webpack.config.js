const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');
var glob = require('glob');

const contentScripts = (name) => glob.sync(`./src/content-scripts/${name}/*.js`);

module.exports = {
  mode: 'production',
  entry: {
    'index': glob.sync('./src/options/*.js'),
    'content-scripts/main': contentScripts('main'),
    'content-scripts/lobby': contentScripts('lobby'),
    'content-scripts/missions': contentScripts('missions'),
    'content-scripts/team': contentScripts('team'),
    'content-scripts/my-matches': contentScripts('my-matches'),
    'content-scripts/profile': contentScripts('profile'),
  },
  output: {
    clean: true,
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
