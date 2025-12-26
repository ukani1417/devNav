import type {
  ConstructedUrl,
  DevNavigatorConfig,
  ParsedInput,
  Token,
  ValidationError
} from '../types'
import { VALIDATION_ERRORS } from '../utils/constants'
import {
  createValidationError,
  formatDescription,
  isValidUrl,
  joinUrlParts
} from '../utils/helpers'

export class URLParser {
  /**
   * Normalize input by trimming, collapsing spaces, and removing legacy @ prefix
   */
  private normalizeInput(input: string): string {
    return input
      .trim() // Remove leading/trailing spaces
      .replace(/\s+/g, ' ') // Collapse multiple spaces to single space
      .replace(/^@/, '') // Remove legacy @ prefix if present
  }

  /**
   * Parses input like "staging" or "dev api" or "staging-server session123 api" into token components
   * @param input - The user input from omnibox
   * @param config - Current extension configuration
   * @returns ParsedInput with token analysis and validation
   */
  parse(input: string, config: DevNavigatorConfig): ParsedInput {
    const errors: ValidationError[] = []
    const originalInput = input.trim()

    // Early validation
    if (!originalInput) {
      errors.push(
        createValidationError(
          'input',
          'Input cannot be empty',
          VALIDATION_ERRORS.EMPTY_INPUT
        )
      )
      return {
        tokens: [],
        isValid: false,
        errors,
        originalInput
      }
    }

    // Normalize input - handle spaces and remove @ prefix
    const normalizedInput = this.normalizeInput(originalInput)

    // Split into segments using spaces
    const segments = normalizedInput
      .split(' ')
      .filter(segment => segment.length > 0)

    if (segments.length === 0) {
      errors.push(
        createValidationError(
          'input',
          'Invalid input format',
          VALIDATION_ERRORS.INVALID_FORMAT
        )
      )
      return {
        tokens: [],
        isValid: false,
        errors,
        originalInput
      }
    }

    // Resolve each segment to tokens
    // Design: We allow unresolved (dynamic) segments to enable flexible URL construction
    // where users can mix configured tokens with arbitrary path segments
    const tokens = segments.map(segment => {
      const configToken = config.tokens[segment]

      if (configToken) {
        // Found in config - resolved token with configured value
        return {
          key: segment,
          value: configToken.value,
          isResolved: true
        } as const
      } else {
        // Not in config - dynamic segment
        return {
          key: segment,
          value: segment,
          isResolved: false
        }
      }
    })

    // Validate that we have at least one token that looks like a base URL
    if (tokens.length > 0) {
      const hasBaseUrl = tokens.some(
        token =>
          token.isResolved &&
          (token.value.startsWith('http://') ||
            token.value.startsWith('https://'))
      )

      if (!hasBaseUrl) {
        errors.push(
          createValidationError(
            'tokens',
            'No base URL found in tokens.',
            VALIDATION_ERRORS.MISSING_BASE
          )
        )
      }
    } else {
      errors.push(
        createValidationError(
          'tokens',
          'No tokens found in input.',
          VALIDATION_ERRORS.EMPTY_INPUT
        )
      )
    }

    return {
      tokens,
      isValid: errors.length === 0,
      errors,
      originalInput
    }
  }

  /**
   * Constructs final URL from parsed tokens
   * @param parsed - Result from parse method
   * @param config - Current extension configuration
   * @returns ConstructedUrl with final URL and metadata
   */
  construct(parsed: ParsedInput, _config: DevNavigatorConfig): ConstructedUrl {
    if (!parsed.isValid || parsed.tokens.length === 0) {
      const errorMessage =
        parsed.errors.map(e => e.message).join('; ') || 'Invalid input'
      return {
        url: '',
        description: errorMessage,
        isValid: false,
        content: parsed.originalInput
      }
    }

    const baseToken = parsed.tokens.find(
      token =>
        token.value.startsWith('http://') || token.value.startsWith('https://')
    )

    if (!baseToken) {
      return {
        url: '',
        description: 'No base URL token found.',
        isValid: false,
        content: parsed.originalInput
      }
    }

    // Build URL parts starting with the base token
    const urlParts: string[] = [baseToken.value]

    // Add all other tokens as path segments
    parsed.tokens.forEach(token => {
      if (token !== baseToken) {
        urlParts.push(token.value)
      }
    })

    // Construct final URL
    const finalUrl = this.buildFinalUrl(urlParts)

    // Validate constructed URL
    if (!isValidUrl(finalUrl)) {
      return {
        url: finalUrl,
        description: 'Invalid URL constructed',
        isValid: false,
        content: parsed.originalInput
      }
    }

    // Create description from token keys
    const tokenKeys = parsed.tokens.map(token => token.key)
    const description = `Navigate to: ${tokenKeys.join(' → ')}`

    return {
      url: finalUrl,
      description,
      isValid: true,
      content: finalUrl
    }
  }

  /**
   * Builds final URL from parts, handling proper URL joining
   * @param parts - Array of URL parts to join
   * @returns Complete URL string
   */
  private buildFinalUrl(parts: string[]): string {
    if (parts.length === 0) return ''

    const [baseUrl, ...restParts] = parts

    if (restParts.length === 0) {
      return baseUrl
    }

    // Ensure base URL doesn't end with slash for consistent joining
    const cleanBase = baseUrl.replace(/\/+$/, '')

    // Join remaining parts, ensuring they don't start with a slash
    const pathPart = restParts.map(part => part.replace(/^\/+/, '')).join('/')

    return pathPart ? `${cleanBase}/${pathPart}` : cleanBase
  }

  /**
   * Fast format validation for omnibox input
   * @param input - User input to validate
   * @returns boolean indicating if input format is potentially valid
   */
  isValidFormat(input: string): boolean {
    const normalized = this.normalizeInput(input)
    if (!normalized) return false

    // Split by spaces and validate each segment
    const segments = normalized.split(' ').filter(segment => segment.length > 0)

    if (segments.length === 0) return false

    // All segments must be valid token keys (can contain alphanumeric and dashes, but no spaces)
    return segments.every(
      segment => segment.length > 0 && /^[a-zA-Z0-9-]+$/.test(segment) // Token keys can contain dashes but no spaces
    )
  }
}
