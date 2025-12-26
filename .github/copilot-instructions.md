# Copilot Instructions for Dev Navigator

## Project Overview
Dev Navigator is a Chrome extension for fast URL construction using shortcuts, designed for developers working across multiple environments and API endpoints. The extension is written in TypeScript and uses React for UI components.

## Architecture & Key Components
- **src/background.ts**: Chrome extension service worker, handles omnibox and background logic.
- **src/components/**: React UI components for the side panel and options.
- **src/core/parser.ts**: Core logic for parsing shortcut patterns (e.g., `@base-dynamic-@path`).
- **src/core/storage.ts**: Manages configuration using Chrome Storage Sync API.
- **src/context/AppContext.tsx**: React context for global app state.
- **src/utils/**: Helper functions and constants.
- **src/types/**: TypeScript type definitions for Chrome APIs and config objects.

## Patterns & Conventions
- **Shortcuts**: All URL construction uses the `@base-dynamic-@path` pattern. Dynamic segments are inserted between shortcuts.
- **Type Safety**: All config and storage operations are strongly typed (see `src/types/`).
- **Component Structure**: UI is modular, with reusable components in `src/components/ui/`.
- **Config Import/Export**: Team sharing is supported via JSON import/export in the options UI.
- **Testing**: Core logic is tested with Jest (`npm test`). Tests are in `tests/`.

## Developer Workflows
- **Development**: `npm run dev` (watch mode)
- **Build**: `npm run build` (production)
- **Type Checking**: `npm run typecheck`
- **Testing**: `npm test`
- **Load in Chrome**: Build, then load the `dist/` folder as an unpacked extension

## Integration Points
- **Chrome APIs**: Uses Omnibox, Storage Sync, and native UI styling.
- **Options/Sidepanel**: UI is React-based, communicates with background via Chrome messaging if needed.

## Examples
- Shortcut: `@dev-session123-@api` → `https://myapp.dev.com/session123/api/v1`
- Config JSON: See README.md for team sharing format

## References
- See `README.md` for usage, configuration, and team sharing details.
- See `src/core/parser.ts` and `src/core/storage.ts` for main business logic.

---
**For AI agents:**
- Follow the shortcut pattern and type safety conventions.
- Prefer updating or creating helpers in `src/utils/` for shared logic.
- When adding new config or storage features, update types in `src/types/` and ensure import/export compatibility.
- Keep UI modular and use existing components where possible.
