import {
  type DevNavigatorConfig,
  DEFAULT_CONFIG,
  STORAGE_KEYS
} from '../types/storage'

/* ========================================
 * 1. CORE MODULES & INITIALIZATION
 * ======================================== */

// Simple storage manager for vanilla JS
class SimpleStorageManager {
  private storage: typeof chrome.storage.sync

  constructor() {
    this.storage = chrome.storage.sync
  }

  async getConfig(): Promise<DevNavigatorConfig> {
    try {
      const result = await this.storage.get(STORAGE_KEYS.CONFIG)
      const stored = result[STORAGE_KEYS.CONFIG]

      if (stored && this.isValidConfig(stored)) {
        return {
          ...DEFAULT_CONFIG,
          ...stored,
          settings: {
            ...DEFAULT_CONFIG.settings,
            ...stored.settings
          }
        }
      }

      await this.saveConfig(DEFAULT_CONFIG)
      return DEFAULT_CONFIG
    } catch (error) {
      console.error('Failed to get config from storage:', error)
      return DEFAULT_CONFIG
    }
  }

  async saveConfig(config: DevNavigatorConfig): Promise<void> {
    try {
      const configToSave = {
        ...config,
        version: config.version || DEFAULT_CONFIG.version
      }

      await this.storage.set({
        [STORAGE_KEYS.CONFIG]: configToSave
      })
    } catch (error) {
      console.error('Failed to save config to storage:', error)
      throw new Error('Failed to save configuration')
    }
  }

  isValidConfig(obj: any): obj is DevNavigatorConfig {
    return (
      obj &&
      typeof obj === 'object' &&
      typeof obj.tokens === 'object' &&
      typeof obj.settings === 'object' &&
      typeof obj.version === 'string'
    )
  }
}

// Import icon modules
const downloadIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
  <polyline points="7,10 12,15 17,10"/>
  <line x1="12" y1="15" x2="12" y2="3"/>
</svg>`

const uploadIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
  <polyline points="17,8 12,3 7,8"/>
  <line x1="12" y1="3" x2="12" y2="15"/>
</svg>`

const trashIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="3,6 5,6 21,6"/>
  <path d="m19,6v14a2,2 0,0 1,-2,2H7a2,2 0,0 1,-2-2V6m3,0V4a2,2 0,0 1,2-2h4a2,2 0,0 1,2,2v2"/>
  <line x1="10" y1="11" x2="10" y2="17"/>
  <line x1="14" y1="11" x2="14" y2="17"/>
</svg>`

const plusIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <line x1="12" y1="5" x2="12" y2="19"/>
  <line x1="5" y1="12" x2="19" y2="12"/>
</svg>`

const xIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <line x1="18" y1="6" x2="6" y2="18"/>
  <line x1="6" y1="6" x2="18" y2="18"/>
</svg>`

// Initialize storage manager
let storageManager: SimpleStorageManager
let isInitialized = false

/* ========================================
 * 2. STATE MANAGEMENT
 * ======================================== */

// Simple object-based state management
const appState = {
  config: null as DevNavigatorConfig | null,
  tokens: {} as Record<string, { value: string }>,
  loading: true,
  formData: {
    key: '',
    value: ''
  }
}

// State update helpers
function updateState(updates: Partial<typeof appState>) {
  Object.assign(appState, updates)
  renderUI()
}

function updateTokens(tokens: Record<string, { value: string }>) {
  appState.tokens = tokens
  renderUI()
}

function updateFormData(field: 'key' | 'value', value: string) {
  appState.formData[field] = value
}

function clearFormData() {
  appState.formData = { key: '', value: '' }
  const keyInput = document.getElementById('token-key') as HTMLInputElement
  const valueInput = document.getElementById('token-value') as HTMLInputElement
  if (keyInput) keyInput.value = ''
  if (valueInput) valueInput.value = ''
}

/* ========================================
 * 3. THEME MANAGEMENT
 * ======================================== */

// Initialize theme detection using Chrome's built-in support
function initializeTheme() {
  // Listen for system theme changes
  const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)')

  // Apply initial theme
  updateThemeUI(darkModeQuery.matches)

  // Listen for theme changes
  darkModeQuery.addEventListener('change', e => {
    updateThemeUI(e.matches)
  })
}

// Update UI based on theme preference
function updateThemeUI(isDark: boolean) {
  const root = document.documentElement
  if (isDark) {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

/* ========================================
 * 4. FORM HANDLING & VALIDATION
 * ======================================== */

// Validate token input
function validateTokenInput(key: string, value: string): string[] {
  const errors: string[] = []

  // Validate key
  if (!key || key.trim() === '') {
    errors.push('Token key is required')
  } else if (!/^[a-zA-Z0-9-]+$/.test(key.trim())) {
    errors.push('Token key can only contain letters, numbers, and dashes')
  } else if (appState.tokens && appState.tokens[key.trim()]) {
    errors.push(`Token '${key.trim()}' already exists`)
  }

  // Validate value
  if (!value || value.trim() === '') {
    errors.push('Token value is required')
  }

  return errors
}

// Handle form submission
async function handleFormSubmit(event: Event) {
  event.preventDefault()

  const key = appState.formData.key.trim()
  const value = appState.formData.value.trim()

  // Validate input
  const errors = validateTokenInput(key, value)
  if (errors.length > 0) {
    alert('Error: ' + errors.join('. '))
    return
  }

  try {
    // Add token to storage - maintain compatibility with original Token format
    const updatedTokens = { ...appState.tokens, [key]: { value: value } }
    const updatedConfig = {
      ...appState.config,
      tokens: updatedTokens
    } as DevNavigatorConfig

    await storageManager.saveConfig(updatedConfig)
    updateState({ config: updatedConfig, tokens: updatedTokens })
    clearFormData()
  } catch (error) {
    console.error('Error adding token:', error)
    alert('Error: Failed to add token')
  }
}

// Handle input changes
function handleKeyInput(event: Event) {
  updateFormData('key', (event.target as HTMLInputElement).value)
}

function handleValueInput(event: Event) {
  updateFormData('value', (event.target as HTMLInputElement).value)
}

/* ========================================
 * 5. FILE OPERATIONS
 * ======================================== */

// Export configuration as JSON file
function handleExportConfig() {
  try {
    const configToExport = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      config: appState.config
    }

    const blob = new Blob([JSON.stringify(configToExport, null, 2)], {
      type: 'application/json'
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `devnav-config-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error exporting config:', error)
    alert('Error: Failed to export configuration')
  }
}

// Import configuration from JSON file
function handleImportConfig() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'

  input.onchange = async event => {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const importedData = JSON.parse(text)

      // Validate imported structure
      if (!importedData.config || !importedData.config.tokens) {
        throw new Error('Invalid configuration file format')
      }

      // Save imported config
      await storageManager.saveConfig(importedData.config)
      updateState({
        config: importedData.config,
        tokens: importedData.config.tokens
      })
    } catch (error) {
      console.error('Error importing config:', error)
      alert(
        'Error: Failed to import configuration. Please check the file format.'
      )
    }
  }

  input.click()
}

// Clear all configuration data
async function handleClearAllData() {
  try {
    const defaultConfig = { ...DEFAULT_CONFIG }
    await storageManager.saveConfig(defaultConfig)
    updateState({
      config: defaultConfig,
      tokens: defaultConfig.tokens
    })
    clearFormData()
  } catch (error) {
    console.error('Error clearing data:', error)
    alert('Error: Failed to clear all data')
  }
}

/* ========================================
 * 6. TOKEN MANAGEMENT
 * ======================================== */

// Delete a specific token
async function handleDeleteToken(tokenKey: string) {
  try {
    const updatedTokens = { ...appState.tokens }
    delete updatedTokens[tokenKey]

    const updatedConfig = {
      ...appState.config,
      tokens: updatedTokens
    } as DevNavigatorConfig
    await storageManager.saveConfig(updatedConfig)
    updateState({ config: updatedConfig, tokens: updatedTokens })
  } catch (error) {
    console.error('Error deleting token:', error)
    alert('Error: Failed to delete token')
  }
}

// Render token badges
function renderTokenBadges() {
  const container = document.getElementById('tokens-container')
  if (!container) return

  const tokens = appState.tokens || {}
  const tokenKeys = Object.keys(tokens)

  if (tokenKeys.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-emoji">📝</div>
        <div class="empty-state-title">No shortcuts configured</div>
        <div class="empty-state-description">Add your first URL shortcut above</div>
      </div>
    `
    return
  }

  const badgesHtml = tokenKeys
    .map(key => {
      const token = tokens[key]
      // Handle both old format (string) and new format ({ value: string })
      const value = typeof token === 'string' ? token : token.value
      const truncatedValue =
        value.length > 30 ? value.substring(0, 30) + '...' : value

      return `
      <div class="badge" title="${key}: ${value}">
        <span class="badge-key">${key}</span>
        <span class="badge-value">: ${truncatedValue}</span>
        <button class="badge-delete" data-token-key="${key}" aria-label="Delete ${key}">
          ${xIcon}
        </button>
      </div>
    `
    })
    .join('')

  container.innerHTML = `
    <div class="badges-container">
      ${badgesHtml}
    </div>
  `

  // Re-attach event listeners for delete buttons after rendering
  attachTokenDeleteListeners()
}

// Helper function to attach delete button listeners
function attachTokenDeleteListeners() {
  const tokensContainer = document.getElementById(
    'tokens-container'
  ) as HTMLElement & {
    _deleteHandler?: (event: MouseEvent) => void
  }
  if (tokensContainer) {
    // Remove existing listeners to avoid duplicates
    if (tokensContainer._deleteHandler) {
      tokensContainer.removeEventListener(
        'click',
        tokensContainer._deleteHandler
      )
    }

    // Add new event listener
    const deleteHandler = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (target.closest('.badge-delete')) {
        const deleteBtn = target.closest('.badge-delete') as HTMLElement
        const tokenKey = deleteBtn.getAttribute('data-token-key')
        if (tokenKey) {
          handleDeleteToken(tokenKey)
        }
      }
    }

    tokensContainer.addEventListener('click', deleteHandler)
    tokensContainer._deleteHandler = deleteHandler
  }
}

/* ========================================
 * 7. DOM MANIPULATION & RENDERING
 * ======================================== */

// Create the main UI structure
function createUIStructure() {
  const root = document.getElementById('devnav-root')
  if (!root) {
    console.error('Root element not found')
    return
  }

  root.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h1 class="card-title">DevNav - URL Shortcuts</h1>
        <p class="card-description">Configure URL shortcuts for fast navigation. Use pattern @base-dynamic-@path</p>
      </div>
      <div class="card-content">
        <!-- Action buttons -->
        <div class="button-group">
          <button class="btn btn-outline" id="export-btn">
            ${downloadIcon} Export
          </button>
          <button class="btn btn-outline" id="import-btn">
            ${uploadIcon} Import
          </button>
          <button class="btn btn-destructive" id="clear-all-btn">
            ${trashIcon} Clear All
          </button>
        </div>

        <!-- Add token form -->
        <form class="form" id="token-form">
          <div class="input-row">
            <div class="form-group" style="flex: 1;">
              <label class="label" for="token-key">Shortcut Key</label>
              <input
                type="text"
                id="token-key"
                class="input"
                placeholder="e.g., api"
                required
              />
            </div>
            <div class="form-group" style="flex: 2;">
              <label class="label" for="token-value">URL Value</label>
              <input
                type="text"
                id="token-value"
                class="input"
                placeholder="e.g., https://api.example.com"
                required
              />
            </div>
            <div class="form-group">
              <button type="submit" class="btn btn-primary" style="margin-top: 24px;">
                ${plusIcon} Add
              </button>
            </div>
          </div>
        </form>

        <!-- Tokens display -->
        <div id="tokens-container">
          <!-- Tokens will be rendered here -->
        </div>
      </div>
    </div>
  `
}

// Main render function
function renderUI() {
  if (!isInitialized) return

  // Update loading state
  const root = document.getElementById('devnav-root')
  if (!root) return

  if (appState.loading) {
    root.classList.add('loading')
  } else {
    root.classList.remove('loading')
  }

  // Render token badges
  renderTokenBadges()
}

// Attach event listeners after DOM creation
function attachEventListeners() {
  // Action buttons
  const exportBtn = document.getElementById('export-btn')
  const importBtn = document.getElementById('import-btn')
  const clearAllBtn = document.getElementById('clear-all-btn')

  if (exportBtn) exportBtn.addEventListener('click', handleExportConfig)
  if (importBtn) importBtn.addEventListener('click', handleImportConfig)
  if (clearAllBtn) clearAllBtn.addEventListener('click', handleClearAllData)

  // Form submission
  const tokenForm = document.getElementById('token-form')
  if (tokenForm) tokenForm.addEventListener('submit', handleFormSubmit)

  // Input change handlers
  const keyInput = document.getElementById('token-key')
  const valueInput = document.getElementById('token-value')

  if (keyInput) keyInput.addEventListener('input', handleKeyInput)
  if (valueInput) valueInput.addEventListener('input', handleValueInput)
}

/* ========================================
 * 8. ERROR HANDLING & NOTIFICATIONS
 * ======================================== */

// Global error handler
function handleError(error: any, userMessage: string) {
  console.error('DevNav Error:', error)
  if (userMessage) {
    alert('Error: ' + userMessage)
  }
}

// Initialize error handling
function initializeErrorHandling() {
  window.addEventListener('error', event => {
    handleError(event.error, 'An unexpected error occurred')
  })

  window.addEventListener('unhandledrejection', event => {
    handleError(event.reason, 'An unexpected error occurred')
  })
}

/* ========================================
 * MAIN INITIALIZATION
 * ======================================== */

// Main initialization function
async function initializeApp() {
  try {
    // Initialize error handling
    initializeErrorHandling()

    // Initialize theme detection
    initializeTheme()

    // Initialize storage manager
    storageManager = new SimpleStorageManager()

    // Load initial configuration
    const config = await storageManager.getConfig()
    updateState({
      config: config,
      tokens: config?.tokens || {},
      loading: false
    })

    // Create UI structure
    createUIStructure()

    // Attach event listeners
    attachEventListeners()

    // Mark as initialized
    isInitialized = true

    // Initial render
    renderUI()

    console.log('DevNav initialized successfully')
  } catch (error) {
    console.error('Failed to initialize DevNav:', error)
    handleError(error, 'Failed to initialize the application')
  }
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp)
} else {
  initializeApp()
}
