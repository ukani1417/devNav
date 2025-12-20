# Dev Navigator 🧭

A Chrome extension for fast URL construction using shortcuts. Perfect for developers working across multiple environments and API endpoints.

## Features

- **Fast URL Construction**: Type `@base-dynamic-@path` to quickly build URLs
- **Environment Shortcuts**: Configure base URLs for different environments (dev, staging, prod)
- **Path Shortcuts**: Define common API endpoints and paths
- **Dynamic Segments**: Support for dynamic content like session IDs or user IDs
- **Chrome Native UI**: Options page styled to match Chrome's built-in settings
- **Team Sharing**: Import/export configurations for team collaboration
- **TypeScript**: Fully typed for robust development

## Usage

### Basic Pattern
```
@base-dynamic-@path
```

### Examples
- `@dev-@api` → `https://myapp.dev.com/api/v1`
- `@prod-session123-@admin` → `https://myapp.com/session123/admin/dashboard`
- `@staging-user456-@reports` → `https://myapp.staging.com/user456/reports`

### Setup
1. Install the extension
2. Right-click extension icon → Options (or visit chrome://extensions)
3. Configure your base URLs and path shortcuts
4. Start typing `@` in the address bar

## Configuration

### Base URLs
Map environment shortcuts to base URLs:
- `dev` → `https://myapp.dev.com`
- `staging` → `https://myapp.staging.com`
- `prod` → `https://myapp.com`

### Path Shortcuts
Define common endpoints:
- `api` → `/api/v1`
- `admin` → `/admin/dashboard`
- `reports` → `/reports/analytics`

### Dynamic Segments
Any text between shortcuts becomes part of the URL:
- `@dev-session123-@api` → `https://myapp.dev.com/session123/api/v1`

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
```

### Project Structure
```
src/
├── types/           # TypeScript definitions
├── core/           # Core parsing and storage logic
├── options/        # Options page
├── utils/          # Helper functions
└── background.ts   # Chrome extension service worker

public/
├── options.html    # Options page HTML
└── icons/         # Extension icons
```

### Loading Development Version
1. Run `npm run build`
2. Open Chrome → More tools → Extensions
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `dist` folder

## Architecture

### URL Parser
- Parses input like `@base-dynamic-@path`
- Validates shortcuts against configuration
- Constructs final URLs with proper joining
- Handles error cases gracefully

### Storage Manager
- Uses Chrome Storage Sync API
- Manages base URLs and path shortcuts
- Handles import/export for team sharing
- Provides type-safe configuration management

### Chrome Integration
- Omnibox API for address bar interaction
- Real-time suggestion generation
- Multiple navigation options (current/new tab)
- Native Chrome UI styling

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
    "baseUrls": {
      "dev": "https://myapp.dev.company.com",
      "staging": "https://myapp.staging.company.com",
      "prod": "https://myapp.company.com"
    },
    "paths": {
      "api": "/api/v1",
      "admin": "/admin",
      "docs": "/documentation"
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
