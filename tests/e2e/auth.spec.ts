import { test, expect } from '@playwright/test';

const loginEmail = process.env.E2E_LOGIN_EMAIL || 'marco@clinicavet.pt';
const loginPassword = process.env.E2E_LOGIN_PASSWORD || 'admin123';

test.describe('Authentication Flow', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/auth/signin');

    // Assumimos que existe um formulário com email e password e um botão de submit
    await page.fill('input[type="email"]', loginEmail);
    await page.fill('input[type="password"]', loginPassword);
    
    // Aguardar o clique e a navegação
    await Promise.all([
      page.waitForNavigation(),
      page.click('button[type="submit"]')
    ]);

    // Verificar se foi redirecionado para o dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });
});
