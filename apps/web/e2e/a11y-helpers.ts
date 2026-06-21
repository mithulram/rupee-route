import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export const AXE_TAGS = [
  'wcag2a',
  'wcag2aa',
  'wcag21a',
  'wcag21aa',
  'wcag22aa',
  'best-practice',
] as const;

export async function expectNoAxeViolations(page: Page): Promise<void> {
  const results = await Promise.race([
    new AxeBuilder({ page }).withTags([...AXE_TAGS]).analyze(),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('axe analyze timed out after 30s')), 30_000),
    ),
  ]);

  expect(
    results.violations,
    results.violations.map((v) => `${v.id}: ${v.help} (${v.impact})`).join('\n'),
  ).toEqual([]);
}

/** Tab until an element matching `matcher` receives focus, then press Enter. */
export async function tabUntilFocused(page: Page, matcher: RegExp): Promise<void> {
  for (let i = 0; i < 50; i++) {
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    const text = (await focused.textContent()) ?? '';
    const ariaLabel = (await focused.getAttribute('aria-label')) ?? '';
    if (matcher.test(text) || matcher.test(ariaLabel)) {
      await page.keyboard.press('Enter');
      return;
    }
  }
  throw new Error(`Could not reach element matching ${matcher} via keyboard`);
}

export async function tabUntilFocusedNoActivate(page: Page, matcher: RegExp): Promise<void> {
  for (let i = 0; i < 50; i++) {
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    const text = (await focused.textContent()) ?? '';
    const ariaLabel = (await focused.getAttribute('aria-label')) ?? '';
    if (matcher.test(text) || matcher.test(ariaLabel)) {
      return;
    }
  }
  throw new Error(`Could not reach element matching ${matcher} via keyboard`);
}
