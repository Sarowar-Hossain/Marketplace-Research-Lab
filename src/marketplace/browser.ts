import { chromium, type Browser } from 'playwright';

// Launches a headless Chromium browser for Marketplace automation. A single
// browser is intended to be reused across the pipeline stages (Doc 008 §16);
// per-session lifecycle orchestration is the caller's responsibility.
export function launchBrowser(): Promise<Browser> {
  return chromium.launch({ headless: true });
}

// Closes the browser gracefully once all processing is complete (Doc 008 §16).
export function closeBrowser(browser: Browser): Promise<void> {
  return browser.close();
}
