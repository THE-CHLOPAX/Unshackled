const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const { version } = require('./package.json');

module.exports = {
  mode: 'development',
  entry: './src/renderer/index.tsx',
  target: 'electron-renderer',
  devtool: 'source-map',
  output: {
    path: path.resolve(__dirname, 'release/dist'),
    filename: 'renderer.js',
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: 'tsconfig.renderer.json',
          },
        },
      },
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
          },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.svg$/i,
        resourceQuery: /url/, // import x from './file.svg?url' -> asset URL
        type: 'asset/resource',
      },
      {
        test: /\.svg$/i,
        issuer: /\.[jt]sx?$/,
        resourceQuery: { not: [/url/] },
        use: [
          {
            loader: '@svgr/webpack',
            // SVGO's default `removeViewBox` strips viewBox when width/height
            // are present, which breaks scaling these components via width/
            // height props (content stops scaling with the box). Keep it off.
            options: { svgo: false },
          },
        ],
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      __APP_VERSION__: JSON.stringify(version),
    }),
    new HtmlWebpackPlugin({
      template: './src/renderer/index.html',
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'src/assets',
          to: 'assets',
        },
        {
          from: 'src/renderer/FMOD/fmodstudio.wasm',
          to: 'fmodstudio.wasm',
        },
      ],
    }),
  ],
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      '@tgdf': path.resolve(__dirname, 'src/lib'),
      '@tgdf/*': path.resolve(__dirname, 'src/lib/*'),
      renderer: path.resolve(__dirname, 'src/renderer'),
      '3D': path.resolve(__dirname, 'src/renderer/3D'),
      'UI': path.resolve(__dirname, 'src/renderer/ui')
    },
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'release/dist'),
    },
    port: 3000,
    hot: true,
  },
};
