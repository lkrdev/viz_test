const path = require('path');

const PATHS = {
  app: path.join(__dirname, 'src/custom_viz_container.tsx'),
}

var webpackConfig = {
    mode: 'production',
    entry: {
        app: PATHS.app,
    },
    output: {
        filename: './bundle.js',
        path: path.join(__dirname, 'dist'),
        // library: '[name]',
        // libraryTarget: 'umd',
    },
    // optimization: {
    //   splitChunks: {
    //     chunks: 'all',
    //   },
    // },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx'],
        modules: [path.join(__dirname, '../src'), 'node_modules'],
    },
    devServer: {
        hot: true,
        https: true,
        static: {
          directory: path.join(__dirname, 'dist'),
        },
    },
    module: {
        rules: [
            { test: /\.(js|jsx)$/, use: 'babel-loader' },
            { test: /\.ts(x?)$/, loader: 'ts-loader' },
            {
                test: /\.(png|jpe?g|gif)$/i,
                use: [
                  {
                    loader: 'file-loader',
                  },
                ],
              },
            { test: /\.css$/, use: ['style-loader', 'css-loader'] },
        ],
    },
    performance: {
        hints: false,
        maxEntrypointSize: 512000,
        maxAssetSize: 512000
    }
};

module.exports = webpackConfig;