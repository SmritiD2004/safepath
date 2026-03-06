import { expect, test } from '@playwright/test'

test('simulation mode route loads and plays one turn', async ({ page }) => {
  await page.goto('/mode/simulation/placeholder-1')

  await expect(page.locator('section.mode-simulation')).toBeVisible()
  await expect(page.getByText('The Empty Elevator')).toBeVisible()

  await page.getByRole('button', { name: /begin/i }).click()

  await expect(page.getByText('RISK')).toBeVisible()
  await expect(page.getByText('What do you do?')).toBeVisible()

  const choiceButtons = page.locator('button').filter({ hasText: /security|space|discomfort/i })
  await expect(choiceButtons.first()).toBeVisible()
  await choiceButtons.first().click()

  await expect(page.getByText('SafePath AI Coach')).toBeVisible()
})

test('puzzle mode route renders puzzle shell and scenario warning', async ({ page }) => {
  await page.goto('/mode/puzzle/placeholder-6')

  await expect(page.locator('section.mode-puzzle')).toBeVisible()
  await expect(page.getByText('Interview Scam Call')).toBeVisible()
  await expect(page.getByText(/content notice/i)).toBeVisible()
})
