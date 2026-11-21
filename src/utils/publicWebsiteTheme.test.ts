import { expect, test, describe, beforeEach } from 'bun:test';
import {
  getStoredPublicWebsiteTheme,
  setStoredPublicWebsiteTheme,
  PUBLIC_WEBSITE_THEMES,
  PUBLIC_WEBSITE_THEME_STORAGE_KEY,
  PUBLIC_THEME_CHANGE_EVENT,
  PublicWebsiteThemeId,
} from './publicWebsiteTheme';

describe('Public Website Theme Manager', () => {
  beforeEach(() => {
    // Mock minimal localStorage if running in pure node/bun environment
    if (typeof globalThis.localStorage === 'undefined') {
      const store: Record<string, string> = {};
      (globalThis as any).localStorage = {
        getItem: (k: string) => store[k] || null,
        setItem: (k: string, v: string) => {
          store[k] = v;
        },
        removeItem: (k: string) => {
          delete store[k];
        },
        clear: () => {
          for (const k in store) delete store[k];
        },
      };
    } else {
      globalThis.localStorage.clear();
    }

    // Mock minimal window if not defined
    if (typeof globalThis.window === 'undefined') {
      const listeners: Record<string, Function[]> = {};
      (globalThis as any).window = {
        localStorage: (globalThis as any).localStorage,
        addEventListener: (ev: string, fn: Function) => {
          listeners[ev] = listeners[ev] || [];
          listeners[ev].push(fn);
        },
        removeEventListener: (ev: string, fn: Function) => {
          if (listeners[ev]) {
            listeners[ev] = listeners[ev].filter((f) => f !== fn);
          }
        },
        dispatchEvent: (ev: any) => {
          if (listeners[ev.type]) {
            listeners[ev.type].forEach((fn) => fn(ev));
          }
          return true;
        },
      };
      (globalThis as any).CustomEvent = class {
        type: string;
        detail: any;
        constructor(type: string, opts?: any) {
          this.type = type;
          this.detail = opts?.detail;
        }
      };
    }
  });

  test('default public website theme is theme2', () => {
    const theme = getStoredPublicWebsiteTheme();
    expect(theme).toBe('theme2');
  });

  test('PUBLIC_WEBSITE_THEMES defines theme1, theme2, and theme3', () => {
    expect(PUBLIC_WEBSITE_THEMES.length).toBe(3);
    expect(PUBLIC_WEBSITE_THEMES[0].id).toBe('theme1');
    expect(PUBLIC_WEBSITE_THEMES[1].id).toBe('theme2');
    expect(PUBLIC_WEBSITE_THEMES[2].id).toBe('theme3');
    expect(PUBLIC_WEBSITE_THEMES[0].nameBn).toContain('থিম ১');
    expect(PUBLIC_WEBSITE_THEMES[1].nameBn).toContain('থিম ২');
    expect(PUBLIC_WEBSITE_THEMES[2].nameBn).toContain('থিম ৩');
  });

  test('can set and retrieve theme2 and theme3 from storage and dispatch event', () => {
    let capturedEventDetail: any = null;
    const listener = (e: any) => {
      capturedEventDetail = e.detail;
    };

    window.addEventListener(PUBLIC_THEME_CHANGE_EVENT, listener);

    setStoredPublicWebsiteTheme('theme2');
    expect(getStoredPublicWebsiteTheme()).toBe('theme2');
    expect(capturedEventDetail).not.toBeNull();
    expect(capturedEventDetail.theme).toBe('theme2');

    // Switch to theme3
    setStoredPublicWebsiteTheme('theme3');
    expect(getStoredPublicWebsiteTheme()).toBe('theme3');
    expect(capturedEventDetail.theme).toBe('theme3');

    // Switch back to theme1
    setStoredPublicWebsiteTheme('theme1');
    expect(getStoredPublicWebsiteTheme()).toBe('theme1');
    expect(capturedEventDetail.theme).toBe('theme1');

    window.removeEventListener(PUBLIC_THEME_CHANGE_EVENT, listener);
  });
});
