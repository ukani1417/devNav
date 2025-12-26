// Core configuration interfaces
export interface Token {
  value: string
}

export interface DevNavigatorConfig {
  tokens: Record<string, Token>
  settings: ExtensionSettings
  version: string
}

export interface ExtensionSettings {
  trigger: string
  defaultDisposition: NavigationDisposition
  showDescriptions: boolean
}

// URL parsing and construction
export interface ParsedInput {
  tokens: Array<{
    key: string
    value: string
    isResolved: boolean
  }>
  isValid: boolean
  errors: ValidationError[]
  originalInput: string
}

export interface ConstructedUrl {
  url: string
  description: string
  isValid: boolean
  content: string
}

// Import/Export configuration
export interface ConfigExport {
  devNavigator: {
    version: string
    exported: string
    tokens: Record<string, Token>
  }
}

// Chrome extension types
export type NavigationDisposition =
  | 'currentTab'
  | 'newForegroundTab'
  | 'newBackgroundTab'

export interface ValidationError {
  field: string
  message: string
  code: string
}

// Storage-related types
export interface StorageKeys {
  CONFIG: 'dev_navigator_config'
}

export interface DefaultConfig extends DevNavigatorConfig {
  tokens: {}
  settings: {
    trigger: '>'
    defaultDisposition: 'currentTab'
    showDescriptions: true
  }
  version: '1.0.0'
}

// UI-related types
export interface TokenFormData {
  key: string
  value: string
}

export interface ImportValidationResult {
  isValid: boolean
  errors: string[]
  config?: ConfigExport
}
