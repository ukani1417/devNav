import type { ConfigExport, DevNavigatorConfig } from '../types';
import type { IStorageManager } from '../types/storage';
import { DEFAULT_CONFIG, STORAGE_KEYS } from '../utils/constants';
import { getCurrentTimestamp } from '../utils/helpers';

export class StorageManager implements IStorageManager {
  private storage: chrome.storage.StorageArea;

  constructor() {
    // Use chrome.storage.sync for syncing across devices
    this.storage = chrome.storage.sync;
  }

  /**
   * Retrieves configuration from Chrome storage
   * @returns Promise with current configuration or default if not found
   */
  async getConfig(): Promise<DevNavigatorConfig> {
    try {
      const result = await this.storage.get(STORAGE_KEYS.CONFIG);
      const stored = result[STORAGE_KEYS.CONFIG];

      if (stored && this.isValidConfig(stored)) {
        // Merge with defaults to ensure all properties exist - handles schema evolution
        // Nested merge required for settings to avoid overwriting entire settings object
        // This provides backward compatibility when we add new default properties
        return {
          ...DEFAULT_CONFIG,
          ...stored,
          settings: {
            ...DEFAULT_CONFIG.settings,
            ...stored.settings,
          },
        };
      }

      // No valid config found, return and save defaults
      await this.saveConfig(DEFAULT_CONFIG);
      return DEFAULT_CONFIG;
    } catch (error) {
      console.error('Failed to get config from storage:', error);
      return DEFAULT_CONFIG;
    }
  }

  /**
   * Saves configuration to Chrome storage
   * @param config - Configuration to save
   */
  async saveConfig(config: DevNavigatorConfig): Promise<void> {
    try {
      const configToSave = {
        ...config,
        version: config.version || DEFAULT_CONFIG.version,
      };

      await this.storage.set({
        [STORAGE_KEYS.CONFIG]: configToSave,
      });
    } catch (error) {
      console.error('Failed to save config to storage:', error);
      throw new Error('Failed to save configuration');
    }
  }

  /**
   * Exports current configuration for sharing
   * @returns Promise with exportable configuration
   */
  async exportConfig(): Promise<ConfigExport> {
    const config = await this.getConfig();

    return {
      devNavigator: {
        version: config.version,
        exported: getCurrentTimestamp(),
        tokens: { ...config.tokens },
      },
    };
  }

  /**
   * Imports and validates configuration from export format
   * @param exported - Exported configuration to import
   */
  async importConfig(exported: ConfigExport): Promise<void> {
    if (!this.isValidExport(exported)) {
      throw new Error('Invalid configuration format');
    }

    const currentConfig = await this.getConfig();

    const newConfig: DevNavigatorConfig = {
      ...currentConfig,
      tokens: { ...exported.devNavigator.tokens },
      version: exported.devNavigator.version,
    };

    await this.saveConfig(newConfig);
  }

  /**
   * Resets configuration to defaults
   */
  async resetConfig(): Promise<void> {
    await this.saveConfig(DEFAULT_CONFIG);
  }

  /**
   * Adds or updates a token
   * @param key - Token key
   * @param value - Token value
   */
  async setToken(key: string, value: string): Promise<void> {
    const config = await this.getConfig();
    config.tokens[key] = { value };
    await this.saveConfig(config);
  }

  /**
   * Removes a token
   * @param key - Token key to remove
   */
  async removeToken(key: string): Promise<void> {
    const config = await this.getConfig();
    delete config.tokens[key];
    await this.saveConfig(config);
  }

  /**
   * Updates extension settings
   * @param settings - New settings to apply
   */
  async updateSettings(settings: Partial<DevNavigatorConfig['settings']>): Promise<void> {
    const config = await this.getConfig();
    config.settings = { ...config.settings, ...settings };
    await this.saveConfig(config);
  }

  /**
   * Validates if an object is a valid DevNavigatorConfig
   * @param obj - Object to validate
   * @returns boolean indicating validity
   */
  private isValidConfig(obj: any): obj is DevNavigatorConfig {
    return (
      obj &&
      typeof obj === 'object' &&
      typeof obj.tokens === 'object' &&
      typeof obj.settings === 'object' &&
      typeof obj.version === 'string'
    );
  }

  /**
   * Validates if an object is a valid export format
   * @param obj - Object to validate
   * @returns boolean indicating validity
   */
  private isValidExport(obj: any): obj is ConfigExport {
    return (
      obj &&
      typeof obj === 'object' &&
      obj.devNavigator &&
      typeof obj.devNavigator === 'object' &&
      typeof obj.devNavigator.version === 'string' &&
      typeof obj.devNavigator.tokens === 'object'
    );
  }

  /**
   * Listens for storage changes and executes callback
   * Filters for 'sync' area to handle cross-device synchronization
   * @param callback - Function to call when storage changes
   */
  onConfigChanged(callback: (config: DevNavigatorConfig) => void): void {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      // Only handle sync area changes to avoid local storage noise
      if (areaName === 'sync' && changes[STORAGE_KEYS.CONFIG]) {
        const newValue = changes[STORAGE_KEYS.CONFIG].newValue;
        if (newValue && this.isValidConfig(newValue)) {
          callback(newValue);
        }
      }
    });
  }
}
