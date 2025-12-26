import { URLParser } from '../src/core/parser'
import { DevNavigatorConfig } from '../src/types'

describe('URLParser', () => {
  const parser = new URLParser()
  const mockConfig: DevNavigatorConfig = {
    tokens: {
      dev: { type: 'base', value: 'https://app.dev.com' },
      prod: { type: 'base', value: 'https://app.com' },
      staging: { type: 'base', value: 'https://staging.example.com' },
      'staging-server': { type: 'base', value: 'https://staging-server.com' },
      api: { type: 'path', value: 'api/v1' },
      admin: { type: 'path', value: 'admin/dashboard' }
    },
    settings: {
      trigger: '>',
      defaultDisposition: 'currentTab',
      showDescriptions: true
    },
    version: '1.0.0'
  }

  describe('parse', () => {
    it('should parse simple base-path pattern', () => {
      const result = parser.parse('dev api', mockConfig)

      expect(result.isValid).toBe(true)
      expect(result.tokens).toHaveLength(2)
      expect(result.tokens[0]).toEqual({
        key: 'dev',
        value: 'https://app.dev.com',
        type: 'base',
        isResolved: true
      })
      expect(result.tokens[1]).toEqual({
        key: 'api',
        value: 'api/v1',
        type: 'path',
        isResolved: true
      })
    })

    it('should parse pattern with dynamic segments', () => {
      const result = parser.parse('dev session123 api', mockConfig)

      expect(result.isValid).toBe(true)
      expect(result.tokens).toHaveLength(3)
      expect(result.tokens[0]).toEqual({
        key: 'dev',
        value: 'https://app.dev.com',
        type: 'base',
        isResolved: true
      })
      expect(result.tokens[1]).toEqual({
        key: 'session123',
        value: 'session123',
        type: 'dynamic',
        isResolved: false
      })
      expect(result.tokens[2]).toEqual({
        key: 'api',
        value: 'api/v1',
        type: 'path',
        isResolved: true
      })
    })

    it('should handle multiple dynamic segments', () => {
      const result = parser.parse('dev segment1 segment2 admin', mockConfig)

      expect(result.isValid).toBe(true)
      expect(result.tokens).toHaveLength(4)
      expect(result.tokens[1].type).toBe('dynamic')
      expect(result.tokens[2].type).toBe('dynamic')
      expect(result.tokens[1].key).toBe('segment1')
      expect(result.tokens[2].key).toBe('segment2')
    })

    it('should handle missing base token', () => {
      const result = parser.parse('unknown api', mockConfig)
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].code).toBe('MISSING_BASE')
    })

    it('should handle base-only pattern', () => {
      const result = parser.parse('staging', mockConfig)

      expect(result.isValid).toBe(true)
      expect(result.tokens).toHaveLength(1)
      expect(result.tokens[0]).toEqual({
        key: 'staging',
        value: 'https://staging.example.com',
        type: 'base',
        isResolved: true
      })
    })

    it('should handle invalid base-only pattern', () => {
      const result = parser.parse('unknown', mockConfig)

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].code).toBe('MISSING_BASE')
    })

    it('should support legacy @ format', () => {
      const result = parser.parse('@dev api', mockConfig)

      expect(result.isValid).toBe(true)
      expect(result.tokens).toHaveLength(2)
      expect(result.tokens[0].key).toBe('dev')
      expect(result.tokens[1].key).toBe('api')
    })

    it('should handle dynamic-only patterns', () => {
      const result = parser.parse('unknown123', mockConfig)

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].code).toBe('MISSING_BASE')
    })

    it('should handle multiple spaces gracefully', () => {
      const result = parser.parse('  dev   api  ', mockConfig)

      expect(result.isValid).toBe(true)
      expect(result.tokens).toHaveLength(2)
      expect(result.tokens[0].key).toBe('dev')
      expect(result.tokens[1].key).toBe('api')
    })

    it('should preserve dashes in token names', () => {
      const result = parser.parse('staging-server api', mockConfig)

      expect(result.isValid).toBe(true)
      expect(result.tokens).toHaveLength(2)
      expect(result.tokens[0]).toEqual({
        key: 'staging-server',
        value: 'https://staging-server.com',
        type: 'base',
        isResolved: true
      })
      expect(result.tokens[1]).toEqual({
        key: 'api',
        value: 'api/v1',
        type: 'path',
        isResolved: true
      })
    })
  })

  describe('construct', () => {
    it('should construct URL from valid parsed input', () => {
      const parsed = parser.parse('dev api', mockConfig)
      const constructed = parser.construct(parsed, mockConfig)

      expect(constructed.isValid).toBe(true)
      expect(constructed.url).toBe('https://app.dev.com/api/v1')
      expect(constructed.description).toContain('dev')
      expect(constructed.description).toContain('api')
    })

    it('should construct URL with dynamic segments', () => {
      const parsed = parser.parse('dev session123 api', mockConfig)
      const constructed = parser.construct(parsed, mockConfig)

      expect(constructed.isValid).toBe(true)
      expect(constructed.url).toBe('https://app.dev.com/session123/api/v1')
    })

    it('should handle invalid parsed input', () => {
      const parsed = parser.parse('unknown api', mockConfig)
      const constructed = parser.construct(parsed, mockConfig)

      expect(constructed.isValid).toBe(false)
      expect(constructed.description).toContain('Base token not found')
    })

    it('should construct URL from base-only pattern', () => {
      const parsed = parser.parse('staging', mockConfig)
      const constructed = parser.construct(parsed, mockConfig)

      expect(constructed.isValid).toBe(true)
      expect(constructed.url).toBe('https://staging.example.com')
    })

    it('should handle multiple path tokens', () => {
      const parsed = parser.parse('dev api admin', mockConfig)
      const constructed = parser.construct(parsed, mockConfig)

      expect(constructed.isValid).toBe(true)
      expect(constructed.url).toBe('https://app.dev.com/api/v1/admin/dashboard')
    })

    it('should handle mixed dynamic and path tokens', () => {
      const parsed = parser.parse(
        'dev session123 api user456 admin',
        mockConfig
      )
      const constructed = parser.construct(parsed, mockConfig)

      expect(constructed.isValid).toBe(true)
      expect(constructed.url).toBe(
        'https://app.dev.com/session123/api/v1/user456/admin/dashboard'
      )
    })

    it('should handle tokens with dashes', () => {
      const parsed = parser.parse('staging-server session123 admin', mockConfig)
      const constructed = parser.construct(parsed, mockConfig)

      expect(constructed.isValid).toBe(true)
      expect(constructed.url).toBe(
        'https://staging-server.com/session123/admin/dashboard'
      )
    })
  })

  describe('isValidFormat', () => {
    it('should validate correct format', () => {
      expect(parser.isValidFormat('dev api')).toBe(true)
      expect(parser.isValidFormat('dev session api')).toBe(true)
      expect(parser.isValidFormat('staging')).toBe(true) // Base-only pattern
      expect(parser.isValidFormat('@dev api')).toBe(true) // Legacy format still supported
      expect(parser.isValidFormat('@staging')).toBe(true) // Legacy base-only pattern
      expect(parser.isValidFormat('staging-server api')).toBe(true) // Token with dashes
      expect(parser.isValidFormat('  dev   api  ')).toBe(true) // Multiple spaces - should normalize
    })

    it('should reject invalid format', () => {
      expect(parser.isValidFormat('@')).toBe(false)
      expect(parser.isValidFormat('')).toBe(false)
      expect(parser.isValidFormat('  ')).toBe(false)
      expect(parser.isValidFormat('dev api!')).toBe(false) // Special characters not allowed
      expect(parser.isValidFormat('dev api@')).toBe(false) // @ in middle not allowed
    })
  })
})
