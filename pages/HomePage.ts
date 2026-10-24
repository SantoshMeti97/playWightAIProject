import { Locator, Page } from "@playwright/test";
import { LoginPage } from "./LoginPage";
import { RegistrationPage } from "./RegistrationPage";

export class HomePage {
  private readonly page: Page;

  // Locators
  private readonly myAccountLink: Locator;
  private readonly registerLink: Locator;
  private readonly loginLink: Locator;

  constructor(page: Page) {
    this.page = page;

    // Initialize locators with CSS selectors
    this.myAccountLink = page.locator('a[title="My Account"]');
    this.registerLink = page.getByRole("link", { name: "Register", exact: true });
    this.loginLink = page.getByRole("link", { name: "Login", exact: true });
  }

  /**
   * Opens the registration page from the My Account menu.
   * @returns Promise<RegistrationPage> - Registration page object
   */
  async clickRegister(): Promise<RegistrationPage> {
    try {
      await this.myAccountLink.click();
      await this.registerLink.click();
      return new RegistrationPage(this.page);
    } catch (error) {
      console.log(`Error navigating to registration: ${error}`);
      throw error;
    }
  }

  /**
   * Opens the login page from the My Account menu.
   * @returns Promise<LoginPage> - Login page object
   */
  async clickLogin(): Promise<LoginPage> {
    try {
      await this.myAccountLink.click();
      await this.loginLink.click();
      return new LoginPage(this.page);
    } catch (error) {
      console.log(`Error navigating to login: ${error}`);
      throw error;
    }
  }
}
