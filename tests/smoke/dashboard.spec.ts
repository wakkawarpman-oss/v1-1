import { expect, test } from '@playwright/test'

test.describe('dashboard smoke @smoke', () => {
  test('loads dashboard shell and primary navigation', async ({ page }) => {
    await page.goto('/dashboard')

    await expect(page.getByTestId('site-header')).toBeVisible()
    await expect(page.getByTestId('suite-dashboard')).toBeVisible()
    await expect(page.getByTestId('dashboard-tab-dashboard')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'droneCalc 🇺🇦' })).toBeVisible()
  })

  test('switches between critical dashboard tabs', async ({ page }) => {
    await page.goto('/dashboard?tab=dashboard')

    await page.getByTestId('dashboard-tab-frequency').click()
    await expect(page).toHaveURL(/tab=frequency/)
    await expect(page.getByTestId('tab-panel-frequency')).toBeVisible()

    await page.getByTestId('dashboard-tab-coords').click()
    await expect(page).toHaveURL(/tab=coords/)
    await expect(page.getByTestId('tab-panel-coords')).toBeVisible()

    await page.getByTestId('dashboard-tab-radiohorizon').click()
    await expect(page).toHaveURL(/tab=radiohorizon/)
    await expect(page.getByTestId('tab-panel-radiohorizon')).toBeVisible()
  })

  test('navigation tabs: mission', async ({ page }) => {
    await page.goto('/dashboard?tab=dashboard')

    await page.getByTestId('dashboard-tab-mission').click()
    await expect(page).toHaveURL(/tab=mission/)
    await expect(page.getByTestId('tab-panel-mission')).toBeVisible()
  })

  test('navigation tabs: aeronav and engineering', async ({ page }) => {
    await page.goto('/dashboard?tab=dashboard')

    await page.getByTestId('dashboard-tab-aeronav').click()
    await expect(page).toHaveURL(/tab=aeronav/)
    await expect(page.getByTestId('tab-panel-aeronav')).toBeVisible()

    await page.getByTestId('dashboard-tab-engineering').click()
    await expect(page).toHaveURL(/tab=engineering/)
    await expect(page.getByTestId('tab-panel-engineering')).toBeVisible()
  })

  test('navigation tabs: avionics and geometry', async ({ page }) => {
    await page.goto('/dashboard?tab=dashboard')

    await page.getByTestId('dashboard-tab-avionics').click()
    await expect(page).toHaveURL(/tab=avionics/)
    await expect(page.getByTestId('tab-panel-avionics')).toBeVisible()

    await page.getByTestId('dashboard-tab-geometry').click()
    await expect(page).toHaveURL(/tab=geometry/)
    await expect(page.getByTestId('tab-panel-geometry')).toBeVisible()
  })

  test('navigation tabs: environment and dronetools', async ({ page }) => {
    await page.goto('/dashboard?tab=dashboard')

    await page.getByTestId('dashboard-tab-environment').click()
    await expect(page).toHaveURL(/tab=environment/)
    await expect(page.getByTestId('tab-panel-environment')).toBeVisible()

    await page.getByTestId('dashboard-tab-dronetools').click()
    await expect(page).toHaveURL(/tab=dronetools/)
    await expect(page.getByTestId('tab-panel-dronetools')).toBeVisible()
  })

  test('navigation tabs: soldering and ballistics', async ({ page }) => {
    await page.goto('/dashboard?tab=dashboard')

    await page.getByTestId('dashboard-tab-soldering').click()
    await expect(page).toHaveURL(/tab=soldering/)
    await expect(page.getByTestId('tab-panel-soldering')).toBeVisible()

    await page.getByTestId('dashboard-tab-ballistics').click()
    await expect(page).toHaveURL(/tab=ballistics/)
    await expect(page.getByTestId('tab-panel-ballistics')).toBeVisible()
  })

  test('navigation tabs: perfcalc and xcoptercalc', async ({ page }) => {
    await page.goto('/dashboard?tab=dashboard')

    await page.getByTestId('dashboard-tab-perfcalc').click()
    await expect(page).toHaveURL(/tab=perfcalc/)
    await expect(page.getByTestId('tab-panel-perfcalc')).toBeVisible()

    await page.getByTestId('dashboard-tab-xcoptercalc').click()
    await expect(page).toHaveURL(/tab=xcoptercalc/)
    await expect(page.getByTestId('tab-panel-xcoptercalc')).toBeVisible()
  })

  test('navigation tabs: propcalc and cgcalc', async ({ page }) => {
    await page.goto('/dashboard?tab=dashboard')

    await page.getByTestId('dashboard-tab-propcalc').click()
    await expect(page).toHaveURL(/tab=propcalc/)
    await expect(page.getByTestId('tab-panel-propcalc')).toBeVisible()

    await page.getByTestId('dashboard-tab-cgcalc').click()
    await expect(page).toHaveURL(/tab=cgcalc/)
    await expect(page.getByTestId('tab-panel-cgcalc')).toBeVisible()
  })

  test('navigation tabs: ew and battery', async ({ page }) => {
    await page.goto('/dashboard?tab=dashboard')

    await page.getByTestId('dashboard-tab-ew').click()
    await expect(page).toHaveURL(/tab=ew/)
    await expect(page.getByTestId('tab-panel-ew')).toBeVisible()

    await page.getByTestId('dashboard-tab-battery').click()
    await expect(page).toHaveURL(/tab=battery/)
    await expect(page.getByTestId('tab-panel-battery')).toBeVisible()
  })

  test('navigation tabs: optics and dronedb', async ({ page }) => {
    await page.goto('/dashboard?tab=dashboard')

    await page.getByTestId('dashboard-tab-optics').click()
    await expect(page).toHaveURL(/tab=optics/)
    await expect(page.getByTestId('tab-panel-optics')).toBeVisible()

    await page.getByTestId('dashboard-tab-dronedb').click()
    await expect(page).toHaveURL(/tab=dronedb/)
    await expect(page.getByTestId('tab-panel-dronedb')).toBeVisible()
  })

  test('navigation tabs: windprofile, thermalcooling and acoustic', async ({ page }) => {
    await page.goto('/dashboard?tab=dashboard')

    await page.getByTestId('dashboard-tab-windprofile').click()
    await expect(page).toHaveURL(/tab=windprofile/)
    await expect(page.getByTestId('tab-panel-windprofile')).toBeVisible()

    await page.getByTestId('dashboard-tab-thermalcooling').click()
    await expect(page).toHaveURL(/tab=thermalcooling/)
    await expect(page.getByTestId('tab-panel-thermalcooling')).toBeVisible()

    await page.getByTestId('dashboard-tab-acoustic').click()
    await expect(page).toHaveURL(/tab=acoustic/)
    await expect(page.getByTestId('tab-panel-acoustic')).toBeVisible()
  })

  test('navigation tabs: slipstream', async ({ page }) => {
    await page.goto('/dashboard?tab=dashboard')

    await page.getByTestId('dashboard-tab-slipstream').click()
    await expect(page).toHaveURL(/tab=slipstream/)
    await expect(page.getByTestId('tab-panel-slipstream')).toBeVisible()
  })
})