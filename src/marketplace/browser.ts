import { chromium, type Browser } from 'playwright';

// Launches a browser for Marketplace automation. A single browser is reused
// across the pipeline stages (Doc 008 §16); per-session lifecycle orchestration
// is the caller's responsibility.
//
// The installed Chrome channel in headed mode is required: Redbubble sits
// behind Cloudflare, and headless bundled Chromium is hard-blocked with a 403
// challenge page, while headed real Chrome passes (verified 2026-07-12).
export function launchBrowser(): Promise<Browser> {
  return chromium.launch({ channel: 'chrome', headless: false });
}

// Closes the browser gracefully once all processing is complete (Doc 008 §16).
export function closeBrowser(browser: Browser): Promise<void> {
  return browser.close();
}
