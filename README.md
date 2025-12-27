# Dev Navigator

A Chrome extension for fast URL construction using shortcuts. Perfect for developers working across multiple environments and API endpoints.

## Features

- **Fast URL Construction**: Type space-separated shortcuts to quickly build URLs
- **Environment Shortcuts**: Configure shortcuts for different environments (dev, staging, prod)
- **Dynamic Segments**: Any unmatched tokens become URL path segments
- **Side Panel UI**: Modern Chrome side panel with native styling and theme support
- **Team Sharing**: Import/export configurations for team collaboration
- **TypeScript**: Fully typed with comprehensive error handling
- **Manifest V3**: Modern Chrome extension architecture with service workers

## Usage

### Basic Pattern
```
> shortcut dynamic segments
```

### Examples
- `> dev api` → `https://myapp.dev.com/api`
- `> prod session123 admin` → `https://myapp.com/session123/admin`
- `> staging user456 reports` → `https://myapp.staging.com/user456/reports`

### Setup
1. Install the extension
2. Click the extension icon to open the side panel
3. Configure your URL shortcuts
4. Start typing `>` in the address bar followed by your shortcuts

## Configuration

### URL Shortcuts
Map shortcuts directly to full URLs:
- `dev` → `https://myapp.dev.com`
- `api` → `https://myapp.dev.com/api/v1`
- `staging` → `https://myapp.staging.com`
- `prod` → `https://myapp.com`

### Dynamic Segments
Any unmatched tokens become URL path segments:
- `> dev session123 api` → `https://myapp.dev.com/session123/api`
- `> prod user456` → `https://myapp.com/user456`

## Development

### Prerequisites
- Node.js 16+
- npm

### Setup
```bash
git clone <repository>
cd dev-navigator
npm install
```

### Development Commands
```bash
npm run dev        # Build with watch mode
npm run build      # Production build
npm test          # Run tests
npm run typecheck # TypeScript checking
npm run lint      # Biome linting
npm run format    # Biome formatting
npm run check     # Biome check (lint + format)
```

### Project Structure
```
src/
├── core/           # Core parsing and storage logic
├── sidepanel/      # Side panel UI (vanilla TypeScript)
├── types/          # TypeScript definitions
├── utils/          # Helper functions
└── background.ts   # Chrome extension service worker

public/
└── icons/         # Extension icons

tests/             # Jest test files
```

### Loading Development Version
1. Run `npm run build`
2. Open Chrome → More tools → Extensions
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `dist` folder

## Architecture

### URL Parser (`src/core/parser.ts`)
- Parses space-separated token input
- Matches tokens against configured shortcuts
- Constructs URLs with dynamic path segments
- Comprehensive error handling and validation

### Storage Manager (`src/core/storage.ts`)
- Chrome Storage Sync API integration
- Flat shortcut-to-URL mapping
- JSON import/export for team sharing
- Type-safe configuration with full TypeScript coverage

### Side Panel UI (`src/sidepanel/`)
- Vanilla TypeScript implementation
- Chrome-native styling with theme support
- Real-time shortcut management
- CSP-compliant design

### Chrome Integration
- Manifest V3 service worker (`src/background.ts`)
- Omnibox API with `>` trigger keyword
- Side panel API for modern UI
- Multiple navigation options (current/new tab)

## Testing

The extension includes comprehensive tests for core functionality:

```bash
npm test
```

Tests cover:
- URL parsing and construction
- Dynamic segment handling
- Error validation
- Edge cases

## Browser Compatibility

- Chrome 88+
- Chromium-based browsers (Edge, Brave, etc.)

## Team Usage

### Sharing Configurations
1. Configure your shortcuts in options
2. Click "Export Configuration"
3. Share the JSON file with team members
4. Team members use "Import Configuration"

### Example Team Config
```json
{
  "devNavigator": {
    "version": "1.0.0",
    "shortcuts": {
      "dev": "https://myapp.dev.company.com",
      "staging": "https://myapp.staging.company.com",
      "prod": "https://myapp.company.com",
      "api": "https://myapp.dev.company.com/api/v1",
      "admin": "https://myapp.company.com/admin",
      "docs": "https://myapp.company.com/documentation"
    }
  }
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Submit a pull request


## Support

- Create an issue for bugs or feature requests
- Check existing issues for common problems
- Contribute improvements via pull requests
