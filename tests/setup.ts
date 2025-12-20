// Jest setup file
import 'jest';

// Mock Chrome APIs for testing
global.chrome = {
  storage: {
    sync: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
    },
    onChanged: {
      addListener: jest.fn(),
    },
  },
  omnibox: {
    onInputChanged: {
      addListener: jest.fn(),
    },
    onInputEntered: {
      addListener: jest.fn(),
    },
    setDefaultSuggestion: jest.fn(),
  },
  tabs: {
    update: jest.fn(),
    create: jest.fn(),
  },
  action: {
    onClicked: {
      addListener: jest.fn(),
    },
  },
  runtime: {
    openOptionsPage: jest.fn(),
  },
} as any;