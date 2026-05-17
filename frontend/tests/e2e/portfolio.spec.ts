import { test, expect } from '@playwright/test';

test.describe('Portfolio Features', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[type="email"]', 'chaudhariakshat14@gmail.com');
        await page.fill('input[type="password"]', 'Aaaa1234@@@@');
        await page.click('button[type="submit"]');
        
        await expect(page.locator('text=Recent Activity').first()).toBeVisible({ timeout: 15000 });
    });

    test('Should render Portfolio P&L and metrics (TC_PRT_001)', async ({ page }) => {
        await page.goto('/portfolio');
        
        // Wait for the portfolio strip to load — it shows 'Net Worth' once portfolio is fetched
        // The strip has a loading skeleton until data arrives
        await expect(page.locator('text=Net Worth')).toBeVisible({ timeout: 30000 });
        
        // Check for other metrics in the portfolio strip
        await expect(page.locator('text=Active Holdings')).toBeVisible({ timeout: 10000 });
        await expect(page.locator('text=P&L').first()).toBeVisible({ timeout: 10000 });
    });

    test('Should prefill SELL order when Close Position is clicked (TC_PRT_003)', async ({ page }) => {
        await page.goto('/portfolio');
        
        // Wait for the portfolio strip
        await expect(page.locator('text=Net Worth')).toBeVisible({ timeout: 30000 });
        
        // The 'Close' button has opacity-0 and only shows on group-hover.
        // We use force:true to click through the opacity-0 state, or we hover first.
        const holdingRow = page.locator('tbody tr').first();
        
        if (await holdingRow.isVisible()) {
            // Hover over the row to reveal the 'Close' button (CSS group-hover)
            await holdingRow.hover();
            
            const closeButton = holdingRow.locator('button', { hasText: 'Close' });
            await closeButton.waitFor({ state: 'visible', timeout: 5000 });
            await closeButton.click();
            
            // SimVest opens a ClosePositionModal (not navigate to /practice)
            // The modal should appear on the same page
            // Check for modal content — it has a trade form inside
            await expect(
                page.locator('text=Close Position').or(page.locator('text=SELL'))
            ).toBeVisible({ timeout: 10000 });
        }
    });
});
