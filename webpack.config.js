const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    entry: {
      background: './src/background.ts',
      sidepanel: './src/sidepanel/sidepanel.tsx', // Updated to .tsx
    },
    module: {
      rules: [
        {
          test: /\.(ts|tsx)$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        // CSS processing for Tailwind
        {
          test: /\.css$/i,
          use: [
            'style-loader',
            {
              loader: 'css-loader',
              options: {
                importLoaders: 1,
              }
            },
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  plugins: [
                    require('tailwindcss'),
                    require('autoprefixer')
                  ]
                }
              }
            }
          ],
        },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
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
          { 
            from: 'src/sidepanel/index.html', 
            to: 'sidepanel.html' 
          },
          { from: 'public/icons', to: 'icons' },
        ],
      }),
    ],
    
    // Disable performance warnings for extension builds
    performance: {
      hints: false,
    },
  };
};