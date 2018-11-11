const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    main: './src/index.tsx'
  },
  output: {
    path: path.join(__dirname, 'build/'),
    filename: '[name].js'
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js']
  },
  devServer: {
    contentBase: path.join(__dirname, 'build/'),
    port: 3000
  },
  devtool: 'cheap-module-source-map',
  module: {
    rules: [
      { test: /.tsx?$/, use: 'ts-loader' },
      { test: /.html$/, use: 'raw-loader' },
      { test: /\.json$/, use: 'json-loader' },
      { test: /\.(s*)css$/, use:['style-loader','css-loader'] },
      { test: /\.png$/, use: 'url-loader?mimetype=image/png' }
    ],
    noParse: /^react|^react-dom/
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'public/index.html',
      filename: 'index.html',
      showErrors: true,
      path: path.join(__dirname, 'build/'),
      hash: true
    }),
    new CopyWebpackPlugin([{
      from: 'public/',
      to: '.',
      ignore: ['index.html']
    }])
  ],
  externals: {
    "react": "React",
    "react-dom": "ReactDOM"
  }
}
