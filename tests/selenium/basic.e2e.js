// Базовые E2E сценарии для проверки ключевых потоков CampusFlow.
// Запуск: установите зависимость `selenium-webdriver`, поднимите фронт (например, http://localhost:5173)
// затем: node tests/selenium/basic.e2e.js

const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

const BASE_URL = process.env.CAMPUSFLOW_URL || 'http://localhost:8080';
const ADMIN_EMAIL = process.env.CAMPUSFLOW_ADMIN || 'superadmin@campusflow.com';
const ADMIN_PASS = process.env.CAMPUSFLOW_ADMIN_PASS || 'admin123';
const DEFAULT_TIMEOUT = Number(process.env.CAMPUSFLOW_TIMEOUT || 15000);

function buildDriver() {
  const options = new chrome.Options();
  if (process.env.CI === 'true' || process.env.HEADLESS === 'true') {
    options.addArguments('--headless=new');
  }
  return new Builder().forBrowser('chrome').setChromeOptions(options).build();
}

async function waitFor(driver, locator, timeout = DEFAULT_TIMEOUT) {
  const el = await driver.wait(until.elementLocated(locator), timeout);
  await driver.wait(until.elementIsVisible(el), timeout);
  return el;
}

async function waitAndClick(driver, locator, timeout = DEFAULT_TIMEOUT) {
  const el = await waitFor(driver, locator, timeout);
  await driver.wait(until.elementIsEnabled(el), timeout);
  await el.click();
  return el;
}

async function waitAny(driver, locators, timeout = DEFAULT_TIMEOUT) {
  const started = Date.now();
  let lastErr;
  for (const locator of locators) {
    const remaining = timeout - (Date.now() - started);
    if (remaining <= 0) break;
    try {
      return await waitFor(driver, locator, remaining);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('Element not found for provided locators');
}

async function clearAndType(driver, locator, text, timeout = DEFAULT_TIMEOUT) {
  const el = await waitFor(driver, locator, timeout);
  await el.clear();
  await el.sendKeys(text);
}

async function loginAsAdmin(driver) {
  // Перейти на главную на случай, если мы на другом роуте без кнопки
  try {
    await driver.get(BASE_URL);
  } catch (_) {}

  // Открываем модалку логина через кнопку в шапке (несколько вариантов текста/классов)
  const loginButton = await waitAny(driver, [
    By.xpath("//button[contains(.,'Войти как админ')]"),
    By.xpath("//button[contains(.,'Войти') and .//span[contains(.,'админ')]]"),
    By.xpath("//button[contains(.,'Войти') and contains(@class,'outline')]"),
  ]);
  await loginButton.click();

  await waitFor(driver, By.xpath("//div[contains(.,'Вход для администраторов')]"));
  await clearAndType(driver, By.css('input#login-email'), ADMIN_EMAIL);
  await clearAndType(driver, By.css('input#login-password'), ADMIN_PASS);
  await waitAndClick(driver, By.css('button[type=\"submit\"]'));

  // Убедимся, что авторизация прошла: бейдж/табы/закрытие модалки; если нет — достаем текст ошибки
  const successLocators = [
    By.xpath("//span[contains(.,'Авторизован')]"),
    By.css('[role=\"tablist\"]'),
    By.xpath("//div[contains(@class,'TabsList') or @role='tablist']"),
    By.xpath("//div[contains(.,'Вход для администраторов')]/ancestor::div[contains(@role,'dialog') and not(contains(@data-state,'open'))]"),
  ];
  try {
    await waitAny(driver, successLocators, DEFAULT_TIMEOUT);
  } catch (err) {
    try {
      const alert = await driver.findElement(
        By.xpath("//div[contains(@role,'dialog')]//*[contains(@class,'Alert') or contains(translate(.,'ERRORОШИБКА','errorошибка'),'error') or contains(translate(.,'НЕВЕР','невер'),'невер')]")
      );
      const text = await alert.getText();
      throw new Error(`Login failed: ${text}`);
    } catch (_) {
      throw err;
    }
  }
}

async function openAdminUsersTab(driver) {
  // Пытаемся дождаться табов; если нет — возможно, не авторизованы, пробуем перелогиниться.
  try {
    await driver.get(`${BASE_URL}/admin`);
    await waitFor(driver, By.css('[role="tablist"]'), 15000);
  } catch (e) {
    // Повторный логин и новая навигация
    await loginAsAdmin(driver);
    await driver.get(`${BASE_URL}/admin`);
    await waitFor(driver, By.css('[role="tablist"]'), DEFAULT_TIMEOUT);
  }

  // Триггер вкладки "Пользователи" в админке (value="users" и подпись)
  const tabButton = await waitAny(driver, [
    By.css('button[value="users"]'),
    By.xpath("//button[contains(@class,'TabsTrigger') and .//span[contains(.,'Пользователи')]]"),
  ]);
  await tabButton.click();

  await waitFor(driver, By.xpath("//div[contains(@class,'CardTitle') and contains(.,'Управление пользователями')]"));
}

async function searchGroup(driver, query = '121') {
  const searchInput = await waitAny(driver, [
    By.css('input[placeholder*="Поиск группы"]'),
    By.css('input[placeholder*="Поиск группы или преподавателя"]'),
  ]);
  await searchInput.clear();
  await searchInput.sendKeys(query);

  // Результаты выпадают как список кнопок без role-атрибута, ориентируемся на стили.
  const resultButton = await waitAny(driver, [
    By.css('div.shadow-medium button.w-full'), // дропдаун результатов
    By.xpath("//button[contains(@class,'w-full') and .//div[contains(@class,'font-medium')]]"),
    By.xpath("//button[.//div[contains(text(),'Группа')]]"),
  ]);
  await resultButton.click();
}

async function main() {
  const driver = await buildDriver();
  await driver.manage().setTimeouts({ implicit: 0, pageLoad: 20000, script: 20000 });
  try {
    await driver.get(BASE_URL);

    // Студент: поиск и добавление в избранное
    await searchGroup(driver, '121');
    await waitAndClick(driver, By.xpath("//button[contains(.,'В избранное')]"));

    // Переход к админке и проверка CRUD пользователей
    await loginAsAdmin(driver);
    await driver.get(`${BASE_URL}/admin`);
    await openAdminUsersTab(driver);

    // Создание пары с конфликтом (ожидаем предупреждение)
    await driver.get(`${BASE_URL}/schedule/group/121`);
    await driver.wait(until.elementLocated(By.xpath("//button[contains(.,'Добавить пару')]")), 7000).click();
    await driver.findElement(By.css('input#subgroup')).sendKeys('121-1');
    await driver.findElement(By.xpath("//button[contains(.,'Сохранить')]")).click();

    console.log('Сценарий завершён');
  } finally {
    await driver.quit();
  }
}

main().catch((e) => {
  console.error('E2E error', e);
  process.exit(1);
});

