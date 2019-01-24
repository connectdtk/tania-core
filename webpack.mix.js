const mix = require('laravel-mix');
const webpack = require('webpack');
const path = require('path');
const fs = require('fs');
const confJSON = require('./conf.json');
const replace = require('replace-in-file');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const SWPrecacheWebpackPlugin = require('sw-precache-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;


mix.webpackConfig({
  output: {
    path: path.resolve(__dirname, 'public'),
    filename: '[name].[chunkhash].js',
    chunkFilename: 'js/[name].[chunkhash].js',
    publicPath: '/'
  },
  module: {
    rules: [
      {
        test: /\.hbs$/,
        use: {
          loader: 'handlebars-loader'
        }
      },
      {
        test: /\.pug$/,
        oneOf: [
          // this applies to `<template lang="pug">` in Vue components
          {
            resourceQuery: /^\?vue/,
            use: ['pug-plain-loader']
          },
          // this applies to pug imports inside JavaScript
          {
            use: ['raw-loader', 'pug-plain-loader']
          }
        ]
      }
    ]
  },
  plugins: [
    new CleanWebpackPlugin('public/'),
    new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /de|en|id/),
    new SWPrecacheWebpackPlugin({
      cacheId: 'tanibox',
      filename: 'service-worker.js',
      staticFileGlobs: ['public/**/*.{js,html,css}'],
      minify: true,
      stripPrefix: 'public/'
    }),
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      reportFilename: 'report.html',
      defaultSizes: 'parsed',
      openAnalyzer: false,
      generateStatsFile: false,
      statsFilename: 'stats.json',
      statsOptions: null,
      logLevel: 'info'
    }),
    new HtmlWebpackPlugin({
      filename: './index.html',
      template: './resources/index.hbs',
      inject: true,
      chunkSortMode: 'dependency',
      serviceWorkerLoader: `<script type="text/javascript">${fs.readFileSync(path.join(__dirname, mix.inProduction() ? './resources/js/service-worker-prod.js' : './resources/js/service-worker-dev.js'), 'utf-8')}</script>`
    }),
    new webpack.DefinePlugin({
      'process.env': {
        CLIENT_ID: JSON.stringify(confJSON.client_id)
      },
    })
  ],
  resolve: {
    extensions: ['.js', '.jsx', '.vue']
  }
})

mix.js('resources/js/app.js', 'js/')
  .then(() => replace.sync({
    // FIXME: Workaround for laravel-mix placing '//*.js' at the entry of JS output.
    // Yell at them to fix the following issue:
    // https://github.com/JeffreyWay/laravel-mix/issues/1717#issuecomment-440086631
    files: path.resolve(__dirname, 'public/index.html'),
    from: /\/\/js/gu,
    to: '/js',
  }));
mix.sass('resources/sass/app.scss', 'css/', {
  implementation: require('node-sass'),
});

mix.sourceMaps();

if (mix.inProduction()) {
  mix.version();
  mix.disableNotifications();
}
