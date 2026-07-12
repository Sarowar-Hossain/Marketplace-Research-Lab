import type { Page } from 'playwright';
import type { Logger } from 'pino';

// Raw product data extracted from a marketplace product page (Doc 008 §8).
// `url` is always present; every other field is nullable/empty when the
// information is unavailable. No validation or normalization is performed here.
export type ExtractedProduct = {
  url: string;
  title: string | null;
  description: string | null;
  artistName: string | null;
  productType: string | null;
  price: number | null;
  currency: string | null;
  imageUrls: string[];
  tags: string[];
  // Competition/availability signals (live-verified sources, all optional):
  // "View this design on +N products" and the artist's "N designs" portfolio size.
  availableProducts: number | null;
  artistDesignCount: number | null;
};

// Structured data collected from the page: JSON-LD blocks plus OpenGraph/meta
// fallbacks. Extraction reads only structured product metadata, never fragile
// marketplace-specific CSS selectors.
type PageData = {
  ldScripts: string[];
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  metaKeywords: string | null;
  docTitle: string | null;
  // Raw tags from the on-page "All Product Tags" section — the listing's real
  // SEO tags, richer and cleaner than meta keywords (live-verified).
  pageTags: string[];
  availableProductsText: string | null;
  artistDesignsText: string | null;
};

type JsonObject = Record<string, unknown>;

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function nameOf(value: unknown): string | null {
  if (typeof value === 'string') {
    return value;
  }
  if (value && typeof value === 'object') {
    const name = (value as JsonObject).name;
    if (typeof name === 'string') {
      return name;
    }
  }
  return null;
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

// Flattens a parsed JSON-LD value into candidate object nodes, following
// schema.org `@graph` containers.
function collectNodes(parsed: unknown): JsonObject[] {
  const nodes: JsonObject[] = [];
  const visit = (value: unknown): void => {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (value && typeof value === 'object') {
      const object = value as JsonObject;
      nodes.push(object);
      if (Array.isArray(object['@graph'])) {
        (object['@graph'] as unknown[]).forEach(visit);
      }
    }
  };
  visit(parsed);
  return nodes;
}

function findProductNode(ldScripts: string[]): JsonObject | null {
  for (const script of ldScripts) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(script);
    } catch {
      continue;
    }
    for (const node of collectNodes(parsed)) {
      const type = node['@type'];
      if (type === 'Product' || (Array.isArray(type) && type.includes('Product'))) {
        return node;
      }
    }
  }
  return null;
}

function extractImages(image: unknown): string[] {
  const urls: string[] = [];
  const push = (value: unknown): void => {
    if (typeof value === 'string') {
      urls.push(value);
    } else if (value && typeof value === 'object') {
      const url = (value as JsonObject).url;
      if (typeof url === 'string') {
        urls.push(url);
      }
    }
  };
  if (Array.isArray(image)) {
    image.forEach(push);
  } else {
    push(image);
  }
  return urls;
}

function firstOffer(offers: unknown): JsonObject | null {
  if (Array.isArray(offers)) {
    const first = offers[0];
    return first && typeof first === 'object' ? (first as JsonObject) : null;
  }
  if (offers && typeof offers === 'object') {
    return offers as JsonObject;
  }
  return null;
}

function splitKeywords(value: string): string[] {
  return value
    .split(',')
    .map((keyword) => keyword.trim())
    .filter((keyword) => keyword.length > 0);
}

function extractTags(keywords: unknown, metaKeywords: string | null): string[] {
  if (Array.isArray(keywords)) {
    return keywords.filter((k): k is string => typeof k === 'string').map((k) => k.trim()).filter((k) => k.length > 0);
  }
  if (typeof keywords === 'string' && keywords.trim().length > 0) {
    return splitKeywords(keywords);
  }
  if (metaKeywords && metaKeywords.trim().length > 0) {
    return splitKeywords(metaKeywords);
  }
  return [];
}

// Live Redbubble pages do not publish JSON-LD brand/category (verified
// 2026-07-12), so the artist falls back to the URL slug convention
// ("…-by-<artist>/<id>/…" — the most stable source), then the og:title
// convention ("… for Sale by <artist>"); the product type falls back to the
// URL path segment ("/i/<type>/…").
function artistFromTitle(title: string | null): string | null {
  if (!title) {
    return null;
  }
  const match = title.match(/\bfor sale by\s+(.+?)\s*$/i);
  return match ? match[1].trim() : null;
}

function artistFromUrl(url: string): string | null {
  try {
    const match = new URL(url).pathname.match(/-by-([^/]+)\//);
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

// Parses counts like "on +73 products" / "5691 designs" (thousands separators
// tolerated). Returns null when the text is absent.
function countFromText(text: string | null): number | null {
  if (!text) {
    return null;
  }
  const match = text.match(/([\d,.]+)/);
  if (!match) {
    return null;
  }
  const parsed = Number(match[1].replace(/[,.]/g, ''));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function productTypeFromUrl(url: string): string | null {
  try {
    const match = new URL(url).pathname.match(/^\/i\/([^/]+)\//);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

function buildExtractedProduct(url: string, product: JsonObject | null, data: PageData): ExtractedProduct {
  const offer = product ? firstOffer(product['offers']) : null;
  const ldImages = product ? extractImages(product['image']) : [];
  const imageUrls = ldImages.length > 0 ? ldImages : data.ogImage ? [data.ogImage] : [];
  // The document-title fallback carries the marketplace suffix ("… | Redbubble");
  // strip it so the fallback yields a usable product title.
  const docTitle = data.docTitle ? data.docTitle.replace(/\s*\|\s*Redbubble.*$/i, '') : null;

  return {
    url,
    title: (product ? asString(product['name']) : null) ?? data.ogTitle ?? docTitle,
    description: (product ? asString(product['description']) : null) ?? data.ogDescription,
    artistName:
      (product ? nameOf(product['brand']) ?? nameOf(product['author']) : null) ??
      artistFromUrl(url) ??
      artistFromTitle(data.ogTitle) ??
      artistFromTitle(docTitle),
    productType:
      (product ? asString(product['category']) ?? nameOf(product['category']) : null) ??
      productTypeFromUrl(url),
    price: offer ? toNumber(offer['price']) : null,
    currency: offer ? asString(offer['priceCurrency']) : null,
    imageUrls,
    tags:
      data.pageTags.length > 0
        ? data.pageTags
        : extractTags(product ? product['keywords'] : null, data.metaKeywords),
    availableProducts: countFromText(data.availableProductsText),
    artistDesignCount: countFromText(data.artistDesignsText),
  };
}

// Product Extraction stage (Doc 008 §8): open the product page, wait for it to
// load, and extract structured product data. Missing fields do not fail
// extraction; a load/parse failure is logged and rethrown (Doc 008 §13).
export async function extractProduct(page: Page, productUrl: string, logger: Logger): Promise<ExtractedProduct> {
  logger.info({ operation: 'extraction' }, 'Product extraction started');
  try {
    // Product metadata (JSON-LD, OpenGraph, meta keywords) ships in the initial
    // HTML, so domcontentloaded is sufficient — waiting for network idle hangs
    // on live marketplace pages with persistent connections.
    await page.goto(productUrl, { waitUntil: 'domcontentloaded' });

    // The artist portfolio section ("N designs") renders client-side below the
    // fold; scroll and give it a short bounded wait. Best-effort — the field
    // stays null when the section never appears.
    try {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForFunction(() => /\d[\d,.]*\s+designs/i.test(document.body.innerText), undefined, {
        timeout: 2500,
      });
    } catch {
      // Section did not render in time; artistDesignCount will be null.
    }

    const data: PageData = await page.evaluate(() => {
      const metaContent = (selector: string): string | null => {
        const element = document.querySelector(selector);
        return element ? element.getAttribute('content') : null;
      };

      // "All Product Tags" section: the listing's raw tags, located by heading
      // text (structural, no CSS classes). Sibling sections ("Related Tags")
      // mix in unrelated trending topics and are deliberately ignored.
      let pageTags: string[] = [];
      for (const heading of Array.from(document.querySelectorAll('h2,h3,h4,div,span'))) {
        if ((heading.textContent ?? '').trim() === 'All Product Tags' && heading.parentElement) {
          pageTags = Array.from(heading.parentElement.querySelectorAll('a[href*="/shop/"]'))
            .map((anchor) => (anchor.textContent ?? '').trim())
            .filter((tag) => tag.length > 0);
          if (pageTags.length > 0) break;
        }
      }

      const bodyText = document.body.innerText;
      const availableMatch = bodyText.match(/(?:on|in)\s*\+?([\d,.]+)\s+products/i);
      const designsMatch = bodyText.match(/([\d,.]+)\s+designs/i);

      return {
        ldScripts: Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map(
          (script) => script.textContent ?? '',
        ),
        ogTitle: metaContent('meta[property="og:title"]'),
        ogDescription: metaContent('meta[property="og:description"]'),
        ogImage: metaContent('meta[property="og:image"]'),
        metaKeywords: metaContent('meta[name="keywords"]'),
        docTitle: document.title || null,
        pageTags,
        availableProductsText: availableMatch ? availableMatch[0] : null,
        artistDesignsText: designsMatch ? designsMatch[0] : null,
      };
    });

    const product = findProductNode(data.ldScripts);
    const extracted = buildExtractedProduct(productUrl, product, data);

    logger.info({ operation: 'extraction' }, 'Product extraction completed');
    return extracted;
  } catch (error) {
    logger.error(
      { operation: 'extraction', error: error instanceof Error ? error.message : String(error) },
      'Extraction failure',
    );
    throw error;
  }
}
