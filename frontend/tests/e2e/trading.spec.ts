import { test, expect } from '@playwright/test';

test.describe('Trading Execution Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Login with provided credentials
        await page.goto('/login');
        await page.fill('input[type="email"]', 'chaudhariakshat14@gmail.com');
        await page.fill('input[type="password"]', 'Aaaa1234@@@@');
        await page.click('button[type="submit"]');
        
        // Wait for redirect to dashboard
        await expect(page.locator('text=Recent Activity').first()).toBeVisible({ timeout: 15000 });
    });

    test('Execute a BUY Limit order', async ({ page }) => {
        // Go to terminal — use LIMIT mode (the default) to avoid the Market chart crash bug
        await page.goto('/practice');

        // Wait for instruments to load from the API (can take up to 30s on cold start)
        // The page shows 'Loading Market...' until stocks array is populated
        await expect(page.locator('text=Trade Terminal')).toBeVisible({ timeout: 45000 });
        
        // Ensure "Buy" is selected
        await page.getByRole('button', { name: 'Buy', exact: true }).click();
        
        // Fill quantity (first number input)
        const quantityInput = page.locator('input[type="number"]').first();
        await quantityInput.fill('1');
        
        // Click the Trade button (it will say something like BUY ADANIENT)
        await page.locator('button', { hasText: /BUY /i }).last().click();

        // Confirm Trade (shows Confirm Order button inside the terminal panel)
        const confirmButton = page.locator('button:has-text("Confirm Order")');
        await confirmButton.waitFor({ state: 'visible', timeout: 10000 });
        await confirmButton.click();
        
        // Expect success message - the UI renders 'Order Placed!' in TradeSuccessMessage
        await expect(page.locator('text=Order Placed!')).toBeVisible({ timeout: 15000 });
    });
});
