import { test, expect } from '@playwright/test';

test.describe('Patients Flow', () => {
  // Configurar estado de autenticação antes de cada teste
  test.beforeEach(async ({ page }) => {
    // Para testes robustos, usar autenticação via state ou mock da API
    // Por simplicidade aqui vamos pela rota do UI
    await page.goto('/login');
    await page.fill('input[type="email"]', 'demo@vetconnect.com');
    await page.fill('input[type="password"]', 'demo123');
    await Promise.all([
      page.waitForNavigation(),
      page.click('button[type="submit"]')
    ]);
  });

  test('should navigate to patients and open new patient modal', async ({ page }) => {
    // Navegar para pacientes
    await page.click('text=Pacientes');
    await expect(page).toHaveURL(/.*\/dashboard\/patients/);

    // Tentar adicionar um paciente (verificando UI, não vamos submeter para não sujar a base de dados de prod)
    await page.click('button:has-text("Adicionar Paciente")');
    
    // Verificar se o modal/formulário abre
    await expect(page.locator('text=Novo Paciente').first()).toBeVisible();
    await expect(page.locator('input[name="name"]')).toBeVisible();
  });
});
