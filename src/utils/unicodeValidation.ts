import React from 'react'

/**
 * Centralized Unicode Input Validation & Sanitization Utility
 * 
 * Target Blocked Unicode Ranges:
 * 1. U+0080 - U+07FF (2 UTF-8 bytes): Latin extensions, Greek, Cyrillic, Hebrew, Arabic, etc.
 * 2. U+0800 - U+D7FF (3 UTF-8 bytes): Asian scripts (Chinese, Japanese, Korean), Indic scripts (Hindi, Bengali, etc.), symbols, punctuation.
 * 
 * Standard ASCII (U+0000 - U+007F, e.g. English letters A-Z/a-z, numbers 0-9, standard symbols & spaces) are ALLOWED.
 */

// Regular expression matching characters in the blocked ranges: U+0080 - U+07FF and U+0800 - U+D7FF
export const BLOCKED_UNICODE_REGEX = /[\u0080-\uD7FF]/g

/**
 * Checks if a string contains any blocked Unicode characters.
 * @param value - The input text to check.
 * @returns True if any blocked character is found, false otherwise.
 */
export const hasBlockedUnicode = (value?: string | null): boolean => {
  if (typeof value !== 'string' || !value) return false
  return /[\u0080-\uD7FF]/.test(value)
}

/**
 * Strips/removes all blocked Unicode characters from a string.
 * @param value - The input text to sanitize.
 * @returns The sanitized text containing only allowed characters.
 */
export const sanitizeBlockedUnicode = (value?: string | null): string => {
  if (typeof value !== 'string' || !value) return value || ''
  return value.replace(BLOCKED_UNICODE_REGEX, '')
}

/**
 * Validates a value against the blocked Unicode ranges.
 * @param value - The input value to validate.
 * @returns Validation result object
 */
export const validateBlockedUnicode = (value?: string | null): {
  isValid: boolean
  sanitized: string
  hasBlockedChars: boolean
} => {
  const hasBlocked = hasBlockedUnicode(value)
  return {
    isValid: !hasBlocked,
    sanitized: sanitizeBlockedUnicode(value),
    hasBlockedChars: hasBlocked,
  }
}

/**
 * KeyDown handler that prevents typing characters in the blocked Unicode ranges.
 * @param e - React KeyboardEvent on HTMLElement.
 */
export const handleBlockedUnicodeKeyDown = (
  e: React.KeyboardEvent<HTMLElement>
) => {
  // Allow navigation, control keys, backspace, delete, tab, enter, arrow keys, copy/paste shortcuts
  if (
    !e.key ||
    e.key.length > 1 ||
    e.ctrlKey ||
    e.metaKey ||
    e.altKey
  ) {
    return
  }

  if (hasBlockedUnicode(e.key)) {
    e.preventDefault()
  }
}

/**
 * Paste event handler that filters out blocked Unicode characters upon paste.
 * @param e - React ClipboardEvent on HTMLElement.
 * @param onValueChange - Optional callback receiving the sanitized paste or full input value.
 */
export const handleBlockedUnicodePaste = (
  e: React.ClipboardEvent<HTMLElement>,
  onValueChange?: (val: string) => void
) => {
  const clipboardData = e.clipboardData || (window as unknown as { clipboardData?: DataTransfer }).clipboardData
  if (!clipboardData) return

  const pastedText = clipboardData.getData('text')
  if (!hasBlockedUnicode(pastedText)) return

  e.preventDefault()
  const sanitizedText = sanitizeBlockedUnicode(pastedText)

  if (typeof onValueChange === 'function') {
    onValueChange(sanitizedText)
  } else if (e.target && 'value' in e.target && typeof (e.target as HTMLInputElement).value === 'string') {
    const target = e.target as HTMLInputElement
    const start = target.selectionStart || 0
    const end = target.selectionEnd || 0
    const original = target.value
    const updated =
      original.substring(0, start) + sanitizedText + original.substring(end)
    target.value = updated

    // Trigger synthetic input/change event
    const event = new Event('input', { bubbles: true })
    target.dispatchEvent(event)
  }
}

/**
 * onChange / onInput interceptor helper.
 * Automatically removes any blocked characters from e.target.value and invokes your original onChange handler.
 */
export const filterBlockedUnicodeChange = (
  originalOnChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
) => {
  return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e && e.target && typeof e.target.value === 'string') {
      const originalValue = e.target.value
      if (hasBlockedUnicode(originalValue)) {
        e.target.value = sanitizeBlockedUnicode(originalValue)
      }
    }
    if (typeof originalOnChange === 'function') {
      originalOnChange(e)
    }
  }
}

/**
 * React Hook Form validation rule to forbid non-standard Unicode characters.
 */
export const validateNoBlockedUnicode = (value?: string | null): boolean | string => {
  if (!value) return true
  if (hasBlockedUnicode(value)) {
    return 'Special/Non-standard Unicode characters are not allowed'
  }
  return true
}

/**
 * Generates standard input props to easily attach to any MUI TextField or <input>.
 */
export const getBlockedUnicodeInputProps = (
  customOnChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
) => ({
  onKeyDown: handleBlockedUnicodeKeyDown,
  onPaste: (e: React.ClipboardEvent<HTMLElement>) => handleBlockedUnicodePaste(e),
  onChange: customOnChange ? filterBlockedUnicodeChange(customOnChange) : undefined,
})

const unicodeValidation = {
  BLOCKED_UNICODE_REGEX,
  hasBlockedUnicode,
  sanitizeBlockedUnicode,
  validateBlockedUnicode,
  handleBlockedUnicodeKeyDown,
  handleBlockedUnicodePaste,
  filterBlockedUnicodeChange,
  validateNoBlockedUnicode,
  getBlockedUnicodeInputProps,
}

export default unicodeValidation
