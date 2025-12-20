// Extended Chrome API types for better type safety

export interface ChromeOmniboxSuggestion extends chrome.omnibox.SuggestResult {
  content: string;
  description: string;
  deletable?: boolean;
}

export interface ChromeStorageChange {
  oldValue?: any;
  newValue?: any;
}

export type ChromeDisposition = chrome.omnibox.OnInputEnteredDisposition;

// Helper types for Chrome API callbacks
export type OmniboxInputChangedCallback = (suggestions: ChromeOmniboxSuggestion[]) => void;

export type OmniboxInputEnteredCallback = (text: string, disposition: ChromeDisposition) => void;
