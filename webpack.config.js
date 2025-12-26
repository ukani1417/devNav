const path = require('path')
const CopyPlugin = require('copy-webpack-plugin')

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production'

  return {
    entry: {
      background: './src/background.ts',
      'src/sidepanel/sidepanel': './src/sidepanel/sidepanel.ts'
    },
    module: {
      rules: [
        // TypeScript processing only
        {
          test: /\.(ts)$/,
          use: 'ts-loader',
          exclude: /node_modules/
        }
      ]
    },
    resolve: {
      extensions: ['.ts', '.js'],
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    output: {
      filename: '[name].js',
      path: path.resolve(__dirname, 'dist'),
      clean: true
    },
    // Critical: Use source-map instead of eval for CSP compliance
    devtool: isProduction ? false : 'source-map',

    // Ensure no dynamic imports or code splitting for service workers
    optimization: {
      splitChunks: false,
      runtimeChunk: false
    },

    plugins: [
      new CopyPlugin({
        patterns: [
          { from: 'manifest.json', to: 'manifest.json' },
          {
            from: 'src/sidepanel',
            to: 'src/sidepanel',
            globOptions: {
              ignore: ['**/*.ts'] // Don't copy TS files, they'll be compiled
            }
          },
          { from: 'public/icons', to: 'icons' }
        ]
      })
    ],

    // Disable performance warnings for extension builds
    performance: {
      hints: false
    }
  }
}
