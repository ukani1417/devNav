import type { DevNavigatorConfig } from '../types';

export const STORAGE_KEYS = {
  CONFIG: 'dev_navigator_config',
} as const;

export const DEFAULT_CONFIG: DevNavigatorConfig = {
  tokens: {},
  settings: {
    trigger: '>',
    defaultDisposition: 'currentTab',
    showDescriptions: true,
  },
  version: '1.0.0',
};

export const VALIDATION_ERRORS = {
  MISSING_BASE: 'MISSING_BASE',
  MISSING_PATH: 'MISSING_PATH',
  INVALID_URL: 'INVALID_URL',
  INVALID_FORMAT: 'INVALID_FORMAT',
  EMPTY_INPUT: 'EMPTY_INPUT',
} as const;

export const URL_PATTERNS = {
  HTTP_PROTOCOL: /^https?:\/\//,
  VALID_URL: /^https?:\/\/[^\s$.?#].[^\s]*$/i,
  TOKEN_KEY_PATTERN: /^[a-zA-Z0-9-]+$/,      // Token keys: alphanumeric + dashes, no spaces
  USER_INPUT_PATTERN: /^[a-zA-Z0-9-\s]+$/,   // User input: alphanumeric + dashes + spaces
  SHORTCUT_PATTERN: /^[a-zA-Z0-9-]+$/,       // Legacy compatibility - same as TOKEN_KEY_PATTERN
} as const;
