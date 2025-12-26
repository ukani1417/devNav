import type { ConfigExport, DevNavigatorConfig } from './index'

// Storage keys
export const STORAGE_KEYS = {
  CONFIG: 'dev_navigator_config' as const
}

// Default configuration
export const DEFAULT_CONFIG: DevNavigatorConfig = {
  tokens: {
    dev: { value: 'https://localhost:3000' },
    prod: { value: 'https://myapp.com' },
    api: { value: 'api/v1' },
    admin: { value: 'admin/dashboard' }
  },
  settings: {
    trigger: '>',
    defaultDisposition: 'currentTab',
    showDescriptions: true
  },
  version: '1.0.0'
}

// Re-export DevNavigatorConfig for convenience
export type { DevNavigatorConfig }

// Chrome Storage API wrapper types
export interface StorageArea {
  get(
    keys?: string | string[] | Record<string, any>
  ): Promise<Record<string, any>>
  set(items: Record<string, any>): Promise<void>
  remove(keys: string | string[]): Promise<void>
  clear(): Promise<void>
}

// Storage manager interface
export interface IStorageManager {
  getConfig(): Promise<DevNavigatorConfig>
  saveConfig(config: DevNavigatorConfig): Promise<void>
  exportConfig(): Promise<ConfigExport>
  importConfig(exported: ConfigExport): Promise<void>
  resetConfig(): Promise<void>
}

// Storage events
export interface StorageChangeEvent {
  changes: Record<string, chrome.storage.StorageChange>
  areaName: string
}
