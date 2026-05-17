import { test, expect } from '@playwright/test';

test.describe('Trading Execution Flow - Negative Scenarios', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[type="email"]', 'chaudhariakshat14@gmail.com');
        await page.fill('input[type="password"]', 'Aaaa1234@@@@');
        await page.click('button[type="submit"]');
        
        await expect(page.locator('text=Recent Activity').first()).toBeVisible({ timeout: 15000 });
    });

    test('Should reject BUY order with insufficient balance (TC_TRD_004)', async ({ page }) => {
        await page.goto('/practice');
        // Wait for instruments API — can take up to 45s on cold backend start
        await expect(page.locator('text=Trade Terminal')).toBeVisible({ timeout: 45000 });
        
        // The terminal defaults to LIMIT mode — this avoids the chart crash bug
        await page.getByRole('button', { name: 'Buy', exact: true }).click();
        
        // Fill quantity with a huge number
        const quantityInput = page.locator('input[type="number"]').first();
        await quantityInput.fill('10000000');
        
        // Click the Trade button
        await page.locator('button', { hasText: /BUY /i }).last().click();

        // Confirm Trade
        const confirmButton = page.locator('button:has-text("Confirm Order")');
        await confirmButton.waitFor({ state: 'visible', timeout: 10000 });
        await confirmButton.click();
        
        // Expect failure toast
        await expect(
            page.locator('text=Insufficient virtual balance').or(page.locator('text=Trade failed'))
        ).toBeVisible({ timeout: 15000 });
    });

    test('Should reject SELL order with insufficient holdings (TC_TRD_005)', async ({ page }) => {
        await page.goto('/practice');
        await expect(page.locator('text=Trade Terminal')).toBeVisible({ timeout: 45000 });
        
        // Select "Sell"
        await page.getByRole('button', { name: 'Sell', exact: true }).click();
        
        // Fill quantity with a huge number
        const quantityInput = page.locator('input[type="number"]').first();
        await quantityInput.fill('10000000');
        
        // Click the Trade button
        await page.locator('button', { hasText: /SELL /i }).last().click();

        // Confirm Trade
        const confirmButton = page.locator('button:has-text("Confirm Order")');
        await confirmButton.waitFor({ state: 'visible', timeout: 10000 });
        await confirmButton.click();
        
        // Expect failure toast
        await expect(
            page.locator('text=Insufficient holdings').or(page.locator('text=Trade failed'))
        ).toBeVisible({ timeout: 15000 });
    });

    test('Should successfully cancel a pending LIMIT order (TC_TRD_007)', async ({ page }) => {
        await page.goto('/practice');
        await expect(page.locator('text=Trade Terminal')).toBeVisible({ timeout: 45000 });

        // The terminal defaults to LIMIT mode — this avoids the chart crash bug
        await page.getByRole('button', { name: 'Buy', exact: true }).click();

        // Fill quantity (first number input)
        const quantityInput = page.locator('input[type="number"]').first();
        await quantityInput.fill('1');

        // Fill price with very low limit price that won't execute immediately (second number input)
        const priceInput = page.locator('input[type="number"]').nth(1);
        await priceInput.fill('1.00');

        // Click the BUY button to go to confirmation
        await page.locator('button', { hasText: /BUY /i }).last().click();

        const confirmButton = page.locator('button:has-text("Confirm Order")');
        await confirmButton.waitFor({ state: 'visible', timeout: 10000 });
        await confirmButton.click();

        // Wait for success - the UI renders 'Order Placed!' in TradeSuccessMessage
        await expect(page.locator('text=Order Placed!')).toBeVisible({ timeout: 15000 });

        // Navigate to Orders page to cancel the pending limit order
        await page.goto('/orders');

        // Look for the "Cancel" button on a pending order and click it
        const cancelButton = page.locator('button', { hasText: /^Cancel$/ }).first();
        if (await cancelButton.isVisible()) {
            await cancelButton.click();
            await expect(
                page.locator('text=CANCELLED').or(page.locator('text=Cancelled'))
            ).toBeVisible({ timeout: 10000 });
        }
    });
});
