/**
 * Test Setup File
 *
 * This file runs before each test file and sets up the testing environment.
 *
 * WHY a setup file?
 * - Configures jest-dom matchers for DOM assertions
 * - Sets up global mocks (like matchMedia for responsive tests)
 * - Provides consistent test environment
 */

import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock matchMedia for responsive component tests
// WHY? jsdom doesn't implement matchMedia, but MUI uses it
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver for chart components
// WHY? Recharts uses ResizeObserver which jsdom doesn't have
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

window.ResizeObserver = ResizeObserverMock;

// Mock IntersectionObserver
// WHY? Some components use lazy loading with IntersectionObserver
class IntersectionObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

window.IntersectionObserver = IntersectionObserverMock as unknown as typeof IntersectionObserver;

// Mock scrollTo
window.scrollTo = vi.fn();

// Mock Notification API
Object.defineProperty(window, 'Notification', {
  writable: true,
  value: class MockNotification {
    static permission = 'granted';
    static requestPermission = vi.fn().mockResolvedValue('granted');
    constructor() {}
  },
});
