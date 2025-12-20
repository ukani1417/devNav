const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    entry: {
      background: './src/background.ts',
      sidepanel: './src/sidepanel/sidepanel.ts',
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
      filename: '[name].js',
      path: path.resolve(__dirname, 'dist'),
      clean: true,
    },
    // Critical: Use source-map instead of eval for CSP compliance
    devtool: isProduction ? false : 'source-map',
    
    // Ensure no dynamic imports or code splitting for service workers
    optimization: {
      splitChunks: false,
      runtimeChunk: false,
    },
    
    plugins: [
      new CopyPlugin({
        patterns: [
          { from: 'manifest.json', to: 'manifest.json' },
          { from: 'public', to: '.' },
        ],
      }),
    ],
    
    // Disable performance warnings for extension builds
    performance: {
      hints: false,
    },
  };
};