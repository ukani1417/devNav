import { StorageManager } from '../core/storage';
import type { DevNavigatorConfig } from '../types';
import { sanitizeTokenKey, sanitizeTokenValue } from '../utils/helpers';

// Import shared types and utilities
interface UIElements {
  tokenCountEl: HTMLElement;
  baseCountEl: HTMLElement;
  successMessageEl: HTMLElement;
  errorMessageEl: HTMLElement;
  addTokenBtn: HTMLButtonElement;
  addTokenForm: HTMLElement;
  tokenKeyInput: HTMLInputElement;
  tokenTypeSelect: HTMLSelectElement;
  tokenValueInput: HTMLInputElement;
  saveTokenBtn: HTMLButtonElement;
  cancelTokenBtn: HTMLButtonElement;
  tokenExampleKey: HTMLElement;
  tokenExampleType: HTMLElement;
  tokenExampleValue: HTMLElement;
  tokensList: HTMLElement;
  tokensEmptyState: HTMLElement;
  exportBtn: HTMLButtonElement;
  importInput: HTMLInputElement;
  clearAllBtn: HTMLButtonElement;
}

class SidePanelManager {
  private storage: StorageManager;
  private config: DevNavigatorConfig | null = null;
  private ui: UIElements;

  constructor() {
    this.storage = new StorageManager();
    this.ui = this.getUIElements();
    this.init();
  }

  private getUIElements(): UIElements {
    return {
      tokenCountEl: document.getElementById('token-count')!,
      baseCountEl: document.getElementById('base-count')!,
      successMessageEl: document.getElementById('success-message')!,
      errorMessageEl: document.getElementById('error-message')!,
      addTokenBtn: document.getElementById('add-token-btn') as HTMLButtonElement,
      addTokenForm: document.getElementById('add-token-form')!,
      tokenKeyInput: document.getElementById('token-key') as HTMLInputElement,
      tokenTypeSelect: document.getElementById('token-type') as HTMLSelectElement,
      tokenValueInput: document.getElementById('token-value') as HTMLInputElement,
      saveTokenBtn: document.getElementById('save-token-btn') as HTMLButtonElement,
      cancelTokenBtn: document.getElementById('cancel-token-btn') as HTMLButtonElement,
      tokenExampleKey: document.getElementById('token-example-key')!,
      tokenExampleType: document.getElementById('token-example-type')!,
      tokenExampleValue: document.getElementById('token-example-value')!,
      tokensList: document.getElementById('tokens-list')!,
      tokensEmptyState: document.getElementById('tokens-empty-state')!,
      exportBtn: document.getElementById('export-btn') as HTMLButtonElement,
      importInput: document.getElementById('import-input') as HTMLInputElement,
      clearAllBtn: document.getElementById('clear-all-btn') as HTMLButtonElement,
    };
  }

  private async init(): Promise<void> {
    try {
      // Load configuration
      this.config = await this.storage.getConfig();

      // Setup event listeners
      this.setupEventListeners();

      // Render initial UI
      this.updateStats();
      this.renderTokens();

      console.log('Side panel initialized successfully');
    } catch (error) {
      console.error('Failed to initialize side panel:', error);
      this.showError('Failed to load configuration');
    }
  }

  private setupEventListeners(): void {
    // Token management
    this.ui.addTokenBtn.addEventListener('click', () => this.showAddTokenForm());
    this.ui.saveTokenBtn.addEventListener('click', () => this.saveToken());
    this.ui.cancelTokenBtn.addEventListener('click', () => this.hideAddTokenForm());

    // Input sanitization and validation
    this.ui.tokenKeyInput.addEventListener('input', e => {
      const input = e.target as HTMLInputElement;
      input.value = sanitizeTokenKey(input.value);
      this.updateTokenExample();
    });

    this.ui.tokenValueInput.addEventListener('input', e => {
      const input = e.target as HTMLInputElement;
      input.value = sanitizeTokenValue(input.value);
      this.updateTokenExample();
    });

    this.ui.tokenTypeSelect.addEventListener('change', () => this.updateTokenExample());

    // Import/Export
    this.ui.exportBtn.addEventListener('click', () => this.exportConfig());
    this.ui.importInput.addEventListener('change', e => this.importConfig(e));
    this.ui.clearAllBtn.addEventListener('click', () => this.clearAllConfig());

    // Enter key support
    this.ui.tokenKeyInput.addEventListener('keypress', e => {
      if (e.key === 'Enter') this.saveToken();
    });
    this.ui.tokenValueInput.addEventListener('keypress', e => {
      if (e.key === 'Enter') this.saveToken();
    });
  }

  // Token Management
  private showAddTokenForm(): void {
    this.ui.addTokenForm.style.display = 'block';
    this.ui.tokenKeyInput.focus();
  }

  private hideAddTokenForm(): void {
    this.ui.addTokenForm.style.display = 'none';
    this.ui.tokenKeyInput.value = '';
    this.ui.tokenTypeSelect.value = 'base';
    this.ui.tokenValueInput.value = '';
    this.updateTokenExample();
  }

  private updateTokenExample(): void {
    const key = this.ui.tokenKeyInput.value || 'staging-server';
    const type = this.ui.tokenTypeSelect.value || 'base';
    const value =
      this.ui.tokenValueInput.value || (type === 'base' ? 'https://staging-server.com' : 'api/v1');

    this.ui.tokenExampleKey.textContent = key;
    this.ui.tokenExampleType.textContent = type;
    this.ui.tokenExampleValue.textContent = value;
  }

  private async saveToken(): Promise<void> {
    const key = this.ui.tokenKeyInput.value.trim();
    const type = this.ui.tokenTypeSelect.value as 'base' | 'path';
    const value = this.ui.tokenValueInput.value.trim();

    if (!key || !value) {
      this.showError('Both token key and value are required');
      return;
    }

    try {
      await this.storage.setToken(key, value, type);
      this.config = await this.storage.getConfig();

      this.hideAddTokenForm();
      this.updateStats();
      this.renderTokens();
      this.showSuccess(`Token '${key}' (${type}) added successfully`);
    } catch (error) {
      console.error('Failed to save token:', error);
      this.showError('Failed to save token');
    }
  }

  private async deleteToken(key: string): Promise<void> {
    const token = this.config?.tokens[key];
    if (!token) return;

    if (!confirm(`Are you sure you want to delete the '${key}' (${token.type}) token?`)) {
      return;
    }

    try {
      await this.storage.removeToken(key);
      this.config = await this.storage.getConfig();

      this.updateStats();
      this.renderTokens();
      this.showSuccess(`Token '${key}' deleted successfully`);
    } catch (error) {
      console.error('Failed to delete token:', error);
      this.showError('Failed to delete token');
    }
  }

  private renderTokens(): void {
    if (!this.config || Object.keys(this.config.tokens).length === 0) {
      this.ui.tokensEmptyState.style.display = 'block';
      return;
    }

    this.ui.tokensEmptyState.style.display = 'none';

    // Clear existing items (except empty state)
    const existingItems = this.ui.tokensList.querySelectorAll('.shortcut-item');
    existingItems.forEach(item => item.remove());

    Object.entries(this.config.tokens).forEach(([key, token]) => {
      const item = document.createElement('div');
      item.className = 'shortcut-item';
      // Using innerHTML with template literals for cleaner code
      // Safe here: key and token.type are controlled, token.value is sanitized
      // Note: Inline onclick required due to Chrome extension context limitations
      item.innerHTML = `
        <div class="shortcut-info">
          <div class="shortcut-key">${key} <span style="font-size: 11px; color: #9aa0a6;">(${token.type})</span></div>
          <div class="shortcut-value">${token.value}</div>
        </div>
        <div class="shortcut-actions">
          <button class="button button-danger" onclick="sidePanelManager.handleDeleteToken('${key}')">Delete</button>
        </div>
      `;
      this.ui.tokensList.appendChild(item);
    });
  }

  // Import/Export
  private async exportConfig(): Promise<void> {
    try {
      const configExport = await this.storage.exportConfig();
      const dataStr = JSON.stringify(configExport, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });

      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dev-navigator-config-${new Date().toISOString().split('T')[0]}.json`;
      link.click();

      URL.revokeObjectURL(url);
      this.showSuccess('Configuration exported successfully');
    } catch (error) {
      console.error('Failed to export config:', error);
      this.showError('Failed to export configuration');
    }
  }

  private async importConfig(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    try {
      const text = await file.text();
      const importData = JSON.parse(text);

      await this.storage.importConfig(importData);
      this.config = await this.storage.getConfig();

      this.updateStats();
      this.renderTokens();
      this.showSuccess('Configuration imported successfully');

      // Clear the file input
      input.value = '';
    } catch (error) {
      console.error('Failed to import config:', error);
      this.showError('Failed to import configuration. Please check the file format.');
      input.value = '';
    }
  }

  private async clearAllConfig(): Promise<void> {
    if (!confirm('Are you sure you want to clear all shortcuts? This cannot be undone.')) {
      return;
    }

    try {
      await this.storage.resetConfig();
      this.config = await this.storage.getConfig();

      this.updateStats();
      this.renderTokens();
      this.showSuccess('All shortcuts cleared successfully');
    } catch (error) {
      console.error('Failed to clear config:', error);
      this.showError('Failed to clear configuration');
    }
  }

  // UI Helpers
  private updateStats(): void {
    if (!this.config) return;

    const totalTokens = Object.keys(this.config.tokens).length;
    const baseTokens = Object.values(this.config.tokens).filter(t => t.type === 'base').length;

    this.ui.tokenCountEl.textContent = totalTokens.toString();
    this.ui.baseCountEl.textContent = baseTokens.toString();
  }

  private showSuccess(message: string): void {
    this.ui.successMessageEl.textContent = message;
    this.ui.successMessageEl.style.display = 'block';
    this.ui.errorMessageEl.style.display = 'none';

    setTimeout(() => {
      this.ui.successMessageEl.style.display = 'none';
    }, 3000);
  }

  private showError(message: string): void {
    this.ui.errorMessageEl.textContent = message;
    this.ui.errorMessageEl.style.display = 'block';
    this.ui.successMessageEl.style.display = 'none';
  }

  // Public methods for button onclick handlers
  public handleDeleteToken(key: string): void {
    this.deleteToken(key);
  }
}

// Initialize the side panel manager
const sidePanelManager = new SidePanelManager();

// Make it globally accessible for onclick handlers
// Required for Chrome extension context - event delegation doesn't work across script boundaries
// Security: Limited exposure, only exposes handleDeleteToken method via public interface
(window as any).sidePanelManager = sidePanelManager;
