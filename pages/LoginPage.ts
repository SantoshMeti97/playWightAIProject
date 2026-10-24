import { Locator, Page } from "@playwright/test";

export class LoginPage {
  private readonly page: Page;

  // Locators
  private readonly pageHeading: Locator;
  private readonly emailInput: Locator;
  private readonly passwordInput: Locator;
  private readonly loginButton: Locator;
  private readonly warningMessage: Locator;
  private readonly accountPageHeading: Locator;
  private readonly logoutLink: Locator;

  constructor(page: Page) {
    this.page = page;

    // Initialize locators with CSS selectors
    this.pageHeading = page.getByRole("heading", { name: "Returning Customer" });
    this.emailInput = page.getByLabel("E-Mail Address");
    this.passwordInput = page.getByLabel("Password", { exact: true });
    this.loginButton = page.getByRole("button", { name: "Login" });
    this.warningMessage = page.locator(".alert-danger");
    this.accountPageHeading = page.locator("#content").getByRole("heading", { name: "My Account" });
    this.logoutLink = page.locator("#column-right").getByRole("link", { name: "Logout", exact: true });
  }

  /**
   * Checks whether the login page is displayed.
   * @returns Promise<boolean> - True when the login heading is visible
   */
  async isLoginPageExists(): Promise<boolean> {
    try {
      await this.pageHeading.waitFor({ state: "visible" });
      return true;
    } catch (error) {
      console.log(`Error checking login page: ${error}`);
      return false;
    }
  }

  /**
   * Submits the login form.
   * @param email - Customer email address
   * @param password - Customer password
   */
  async login(email: string, password: string): Promise<void> {
    try {
      await this.emailInput.fill(email);
      await this.passwordInput.fill(password);
      await this.loginButton.click();
    } catch (error) {
      console.log(`Error submitting login form: ${error}`);
      throw error;
    }
  }

  /**
   * Checks whether the authenticated account page is displayed.
   * @returns Promise<boolean> - True when the account heading and logout link are visible
   */
  async isAuthenticatedAccountPageExists(): Promise<boolean> {
    try {
      return await this.accountPageHeading.isVisible() && await this.logoutLink.isVisible();
    } catch (error) {
      console.log(`Error checking authenticated account page: ${error}`);
      return false;
    }
  }

  /**
   * Checks whether the login warning is displayed.
   * @returns Promise<boolean> - True when a login warning is visible
   */
  async isWarningDisplayed(): Promise<boolean> {
    try {
      await this.warningMessage.waitFor({ state: "visible" });
      return true;
    } catch (error) {
      console.log(`Error checking login warning: ${error}`);
      return false;
    }
  }

  /**
   * Returns the visible login warning text.
   * @returns Promise<string> - Warning message text
   */
  async getWarningMessage(): Promise<string> {
    return (await this.warningMessage.innerText()).trim();
  }
}
