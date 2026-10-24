import { test as base, expect } from "@playwright/test";
import dotenv from "dotenv";
import { HomePage } from "../pages/HomePage";
import { LoginPage } from "../pages/LoginPage";
import { RegistrationPage } from "../pages/RegistrationPage";

dotenv.config();

const APP_URL = process.env.WEB_APP_URL;

type PageFixtures = {
  homePage: HomePage;
  loginPage: LoginPage;
  registrationPage: RegistrationPage;
};

export const test = base.extend<PageFixtures>({
  homePage: async ({ page }, use) => {
    if (!APP_URL) {
      throw new Error("WEB_APP_URL must be set in the environment.");
    }

    await page.goto(APP_URL);
    await use(new HomePage(page));
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  registrationPage: async ({ page }, use) => {
    await use(new RegistrationPage(page));
  },
});

test.afterEach(async ({ page, context }) => {
  if (!page.isClosed()) {
    await page.close();
  }
  await context.close();
});

export { expect };
