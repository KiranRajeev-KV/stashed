import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const screenshotDirectory = join(root, "docs", "assets", "screenshots");
const defaultBaseUrl = "https://stashed.kiranrajeevkv.workers.dev";
const viewport = { width: 1440, height: 900 };
const timeout = 30_000;
const themes = [
  { colorScheme: "dark", name: "dark", suffix: "" },
  { colorScheme: "light", name: "light", suffix: "-light" },
];

// These public records are deliberately explicit so a removed or restricted
// record fails the command instead of silently changing the documentation.
const details = {
  ideaId: "70b7ff03-bc5f-448b-bf49-93b6ae104fc1",
  collectionId: "f34eedad-31fd-4ae8-9be1-c6a9f307ccbc",
};

const screenshots = [
  { name: "landing", path: "/", ready: "main h1" },
  { name: "ideas", path: "/ideas", ready: ".idea-card h2 a" },
  {
    name: "idea-detail",
    path: `/ideas/${details.ideaId}`,
    ready: "article h1",
  },
  {
    name: "collections",
    path: "/collections",
    ready: ".collection-card h2 a",
  },
  {
    name: "collection-detail",
    path: `/collections/${details.collectionId}`,
    ready: ".collection-hero h1",
  },
];

function baseUrl() {
  const candidate = process.env.STASHED_SCREENSHOT_BASE_URL ?? defaultBaseUrl;
  const url = new URL(candidate);
  if (!/^https?:$/.test(url.protocol)) {
    throw new Error("STASHED_SCREENSHOT_BASE_URL must use http or https");
  }
  return url.origin;
}

function selectedScreenshots() {
  const args = process.argv.slice(2);
  const onlyIndex = args.indexOf("--only");
  const names =
    onlyIndex === -1
      ? args.flatMap((value) => value.split(","))
      : args.slice(onlyIndex + 1).flatMap((value) => value.split(","));
  const requested = names.filter(Boolean);
  if (requested.length === 0) return screenshots;

  const available = new Set(screenshots.map((screenshot) => screenshot.name));
  const unknown = requested.filter((name) => !available.has(name));
  if (unknown.length > 0) {
    throw new Error(
      `Unknown screenshot name(s): ${unknown.join(", ")}. Available: ${[...available].join(", ")}`,
    );
  }
  const selected = new Set(requested);
  return screenshots.filter((screenshot) => selected.has(screenshot.name));
}

async function assertPublicDetails(origin, definitions) {
  const records = [
    [
      "idea-detail",
      "Idea",
      details.ideaId,
      `/api/ideas/${details.ideaId}`,
      "idea",
    ],
    [
      "collection-detail",
      "Collection",
      details.collectionId,
      `/api/collections/${details.collectionId}`,
      "collection",
    ],
  ];

  const selected = new Set(definitions.map((definition) => definition.name));
  for (const [screenshot, label, id, path, key] of records) {
    if (!selected.has(screenshot)) continue;
    const response = await fetch(`${origin}${path}`, {
      signal: AbortSignal.timeout(timeout),
    });
    if (!response.ok) {
      throw new Error(
        `${label} ${id} is unavailable at ${origin} (HTTP ${response.status}). Update scripts/screenshots.mjs with a public record before capturing.`,
      );
    }
    const payload = await response.json();
    if (payload[key]?.visibility !== "PUBLIC") {
      throw new Error(
        `${label} ${id} is no longer public. Update scripts/screenshots.mjs with a public record before capturing.`,
      );
    }
  }
}

async function visit(page, url, ready) {
  let lastError;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout });
      await page.locator(ready).first().waitFor({ state: "visible", timeout });
      await page.evaluate(async () => {
        await document.fonts.ready;
      });
      await page.waitForFunction(() =>
        [...document.images].every((image) => image.complete),
      );
      return;
    } catch (error) {
      lastError = error;
      if (attempt === 2) break;
    }
  }
  throw lastError;
}

async function capture(origin, definitions, theme) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    colorScheme: theme.colorScheme,
    deviceScaleFactor: 1,
    locale: "en-US",
    reducedMotion: "reduce",
    timezoneId: "UTC",
    viewport,
  });
  await context.addInitScript((preference) => {
    localStorage.setItem("stashed-theme", preference);
  }, theme.name);

  try {
    for (const definition of definitions) {
      const page = await context.newPage();
      page.setDefaultTimeout(timeout);
      await visit(page, `${origin}${definition.path}`, definition.ready);
      await page.addStyleTag({
        content: `
          *, *::before, *::after {
            animation: none !important;
            caret-color: transparent !important;
            transition: none !important;
          }
        `,
      });
      await page.mouse.move(-1, -1);
      await page.screenshot({
        path: join(
          screenshotDirectory,
          `${definition.name}${theme.suffix}.png`,
        ),
        type: "png",
      });
      await page.close();
      console.log(`Captured ${definition.name}${theme.suffix}.png`);
    }
  } finally {
    await context.close();
    await browser.close();
  }
}

async function main() {
  const origin = baseUrl();
  const definitions = selectedScreenshots();
  mkdirSync(screenshotDirectory, { recursive: true });
  await assertPublicDetails(origin, definitions);
  for (const theme of themes) {
    await capture(origin, definitions, theme);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
