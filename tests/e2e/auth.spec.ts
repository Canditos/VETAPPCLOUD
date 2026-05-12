import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/auth/signin');

    // Assumimos que existe um formulário com email e password e um botão de submit
    await page.fill('input[type="email"]', 'demo@vetconnect.com');
    await page.fill('input[type="password"]', 'demo123'); // Substituir com credentials reais ou mockadas no ambiente de testes
    
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
