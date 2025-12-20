import { URLParser } from './core/parser'
import { StorageManager } from './core/storage'
import type { DevNavigatorConfig, ParsedInput } from './types'
import type { ChromeOmniboxSuggestion } from './types/chrome-api'

class DevNavigatorExtension {
  private parser: URLParser
  private storage: StorageManager
  private config: DevNavigatorConfig | null = null

  constructor() {
    this.parser = new URLParser()
    this.storage = new StorageManager()
    this.init()
  }

  /**
   * Initialize the extension
   */
  private async init(): Promise<void> {
    try {
      // Load initial configuration
      this.config = await this.storage.getConfig()

      // Setup event listeners
      this.setupEventListeners()

      // Set default suggestion
      this.setDefaultSuggestion()

      // Register custom search engine for better UX
      this.registerSearchEngine()

      console.log('DevNav extension initialized')
    } catch (error) {
      console.error('Failed to initialize DevNav:', error)
    }
  }

  /**
   * Setup Chrome extension event listeners
   */
  private setupEventListeners(): void {
    // Handle omnibox input changes
    chrome.omnibox.onInputChanged.addListener(
      (
        text: string,
        suggest: (suggestions: ChromeOmniboxSuggestion[]) => void
      ) => {
        this.handleInputChanged(text, suggest)
      }
    )

    // Handle omnibox input entered (navigation)
    chrome.omnibox.onInputEntered.addListener(
      (text: string, disposition: chrome.omnibox.OnInputEnteredDisposition) => {
        this.handleInputEntered(text, disposition)
      }
    )

    // Listen for configuration changes
    this.storage.onConfigChanged((newConfig: DevNavigatorConfig) => {
      this.config = newConfig
      this.setDefaultSuggestion()
    })

    // Handle extension icon click (open side panel)
    chrome.action.onClicked.addListener(tab => {
      chrome.sidePanel.open({ windowId: tab.windowId }).catch(error => {
        console.error('Failed to open side panel:', error)
      })
    })

    // Configure side panel behavior for Manifest V3
    // Note: This replaces the V2 popup pattern - side panel opens when extension icon is clicked
    chrome.sidePanel
      .setPanelBehavior({ openPanelOnActionClick: true })
      .catch(error => console.error('Failed to set panel behavior:', error))
  }

  /**
   * Validates and sanitizes omnibox suggestion content
   * Chrome's omnibox API requires non-empty content strings or it crashes silently
   */
  private validateSuggestionContent(
    content: string,
    fallback: string = 'suggestion'
  ): string {
    if (
      !content ||
      typeof content !== 'string' ||
      content.trim().length === 0
    ) {
      return fallback
    }
    return content.trim()
  }

  /**
   * Handle omnibox input changes and provide suggestions
   */
  private async handleInputChanged(
    text: string,
    suggest: (suggestions: ChromeOmniboxSuggestion[]) => void
  ): Promise<void> {
    try {
      // Ensure we have current config
      if (!this.config) {
        this.config = await this.storage.getConfig()
      }

      const suggestions: ChromeOmniboxSuggestion[] = []

      // Quick format validation - if invalid, show no suggestions
      if (!this.parser.isValidFormat(text)) {
        suggest([])
        return
      }

      // Parse the input
      const parsed = this.parser.parse(text, this.config)
      const constructed = this.parser.construct(parsed, this.config)

      if (constructed.isValid) {
        // Add the main suggestion - ensure content is not empty
        const content = this.validateSuggestionContent(
          constructed.content || constructed.url,
          text || 'result'
        )
        suggestions.push({
          content: content,
          description: constructed.url
        })

        // Add partial completions if applicable
        const partialSuggestions = this.generatePartialSuggestions(text, parsed)
        suggestions.push(...partialSuggestions)
      } else {
        // For invalid inputs, don't show suggestions
        // Just return empty to keep it clean
      }

      // Filter out any suggestions with empty content before sending
      // Double validation: Chrome omnibox crashes with empty suggestion arrays or content
      const validSuggestions = suggestions.filter(
        s =>
          s.content &&
          typeof s.content === 'string' &&
          s.content.trim().length > 0
      )

      suggest(
        validSuggestions.length > 0
          ? validSuggestions
          : []
      )
    } catch (error) {
      console.error('Error handling input change:', error)
      // Return empty suggestions on error
      suggest([])
    }
  }

  /**
   * Handle omnibox input entered (user selected suggestion or pressed enter)
   */
  private async handleInputEntered(
    text: string,
    disposition: chrome.omnibox.OnInputEnteredDisposition
  ): Promise<void> {
    try {
      // Ensure we have current config
      if (!this.config) {
        this.config = await this.storage.getConfig()
      }

      let urlToNavigate = text

      // If text doesn't look like a URL, try to construct it
      if (!text.startsWith('http')) {
        const parsed = this.parser.parse(text, this.config)
        const constructed = this.parser.construct(parsed, this.config)

        if (constructed.isValid) {
          urlToNavigate = constructed.url
        } else {
          // Fallback strategy: Search rather than showing error for better UX
          // Design choice: Google search provides value even for failed constructions
          urlToNavigate = `https://www.google.com/search?q=${encodeURIComponent(
            text
          )}`
        }
      }

      // Navigate based on disposition
      await this.navigateToUrl(urlToNavigate, disposition)
    } catch (error) {
      console.error('Error handling input entered:', error)
    }
  }

  /**
   * Navigate to URL based on disposition
   */
  private async navigateToUrl(
    url: string,
    disposition: chrome.omnibox.OnInputEnteredDisposition
  ): Promise<void> {
    try {
      switch (disposition) {
        case 'currentTab':
          await chrome.tabs.update({ url })
          break
        case 'newForegroundTab':
          await chrome.tabs.create({ url, active: true })
          break
        case 'newBackgroundTab':
          await chrome.tabs.create({ url, active: false })
          break
        default:
          await chrome.tabs.update({ url })
      }
    } catch (error) {
      console.error('Failed to navigate to URL:', error)
    }
  }

  /**
   * Generate partial completion suggestions
   */
  private generatePartialSuggestions(
    text: string,
    parsed: ParsedInput
  ): ChromeOmniboxSuggestion[] {
    const suggestions: ChromeOmniboxSuggestion[] = []

    if (!this.config) return suggestions

    // Find if we have a base token and suggest path tokens
    const hasBaseToken = parsed.tokens.some(token => token.type === 'base')
    const pathTokens = Object.entries(this.config.tokens).filter(([_, token]) => token.type === 'path')

    if (hasBaseToken && pathTokens.length > 0) {
      const availablePaths = pathTokens.slice(0, 3) // Limit to 3 suggestions

      availablePaths.forEach(([pathKey, pathToken]) => {
        const suggestionText = `${text} ${pathKey}`
        const testParsed = this.parser.parse(suggestionText, this.config!)
        const testConstructed = this.parser.construct(testParsed, this.config!)

        if (testConstructed.isValid) {
          const content = this.validateSuggestionContent(
            testConstructed.content || testConstructed.url,
            suggestionText
          )
          suggestions.push({
            content: content,
            description: testConstructed.url
          })
        }
      })
    }

    return suggestions
  }

  /**
   * Generate helpful suggestions for invalid inputs
   */
  private generateHelpSuggestions(
    _text: string,
    _parsed: ParsedInput
  ): ChromeOmniboxSuggestion[] {
    // Return empty since we only want URLs in suggestions
    return []
  }

  /**
   * Register custom search engine for better UX
   */
  private registerSearchEngine(): void {
    // Note: Chrome doesn't provide an API to programmatically register search engines
    // Users need to manually add search engines through chrome://settings/searchEngines
    // The omnibox with > keyword will work without this
    console.log('DevNav omnibox ready with > keyword')
  }

  /**
   * Set the default omnibox suggestion
   */
  private setDefaultSuggestion(): void {
    chrome.omnibox.setDefaultSuggestion({ 
      description: 'DevNav' 
    })
  }
}

// Initialize the extension
new DevNavigatorExtension()
