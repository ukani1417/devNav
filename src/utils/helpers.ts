import type { ValidationError } from '../types';
import { URL_PATTERNS } from './constants';

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return URL_PATTERNS.VALID_URL.test(url);
  } catch {
    return false;
  }
}

export function isValidShortcut(shortcut: string): boolean {
  return URL_PATTERNS.SHORTCUT_PATTERN.test(shortcut);
}

export function sanitizeTokenKey(input: string): string {
  return input
    .trim()                                    // Remove spaces
    .replace(/[^a-zA-Z0-9-]/g, '')            // Allow dashes in token keys, remove spaces and special chars
    .toLowerCase();                            // Enforce lowercase for case-insensitive matching
}

export function sanitizeTokenValue(input: string): string {
  return input.trim();                        // Only trim token values, preserve all content
}

export function sanitizeUserInput(input: string): string {
  return input
    .trim()
    .replace(/\s+/g, ' ');                    // Normalize multiple spaces to single spaces for consistent parsing
}

export function sanitizeShortcut(input: string): string {
  // Legacy function - now calls sanitizeTokenKey for backward compatibility
  return sanitizeTokenKey(input);
}

export function createValidationError(
  field: string,
  message: string,
  code: string
): ValidationError {
  return { field, message, code };
}

export function joinUrlParts(...parts: string[]): string {
  return parts
    .filter(part => part && part.length > 0)    // Remove empty/undefined parts
    .map(part => part.replace(/^\/+|\/+$/g, '')) // Strip leading/trailing slashes to avoid double slashes
    .join('/');                                  // Join with single slash
}

export function formatDescription(
  baseKey: string,
  pathKey?: string,
  dynamicSegments?: string[]
): string {
  const parts = [baseKey];

  if (dynamicSegments && dynamicSegments.length > 0) {
    parts.push(...dynamicSegments);
  }

  if (pathKey) {
    parts.push(pathKey);
  }

  return `Navigate to: ${parts.join(' → ')}`;
}

export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}
