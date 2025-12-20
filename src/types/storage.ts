import type { ConfigExport, DevNavigatorConfig } from './index';

// Chrome Storage API wrapper types
export interface StorageArea {
  get(keys?: string | string[] | Record<string, any>): Promise<Record<string, any>>;
  set(items: Record<string, any>): Promise<void>;
  remove(keys: string | string[]): Promise<void>;
  clear(): Promise<void>;
}

// Storage manager interface
export interface IStorageManager {
  getConfig(): Promise<DevNavigatorConfig>;
  saveConfig(config: DevNavigatorConfig): Promise<void>;
  exportConfig(): Promise<ConfigExport>;
  importConfig(exported: ConfigExport): Promise<void>;
  resetConfig(): Promise<void>;
}

// Storage events
export interface StorageChangeEvent {
  changes: Record<string, chrome.storage.StorageChange>;
  areaName: string;
}
