import { Locator, Page } from "@playwright/test";

export class RegistrationPage {
  private readonly page: Page;

  // Locators
  private readonly pageHeading: Locator;
  private readonly firstNameInput: Locator;
  private readonly lastNameInput: Locator;
  private readonly emailInput: Locator;
  private readonly telephoneInput: Locator;
  private readonly passwordInput: Locator;
  private readonly passwordConfirmInput: Locator;
  private readonly privacyPolicyCheckbox: Locator;
  private readonly continueButton: Locator;
  private readonly confirmationHeading: Locator;
  private readonly accountPageHeading: Locator;

  constructor(page: Page) {
    this.page = page;

    // Initialize locators with CSS selectors
    this.pageHeading = page.getByRole("heading", { name: "Register Account" });
    this.firstNameInput = page.getByLabel("First Name");
    this.lastNameInput = page.getByLabel("Last Name");
    this.emailInput = page.getByLabel("E-Mail");
    this.telephoneInput = page.getByLabel("Telephone");
    this.passwordInput = page.getByLabel("Password", { exact: true });
    this.passwordConfirmInput = page.getByLabel("Password Confirm");
    this.privacyPolicyCheckbox = page.locator('input[name="agree"]');
    this.continueButton = page.getByRole("button", { name: "Continue" });
    this.confirmationHeading = page.getByRole("heading", {
      name: "Your Account Has Been Created!",
    });
    this.accountPageHeading = page.locator("#content").getByRole("heading", { name: "My Account" });
  }

  /**
   * Checks whether the registration page is displayed.
   * @returns Promise<boolean> - True when the registration heading is visible
   */
  async isRegistrationPageExists(): Promise<boolean> {
    try {
      await this.pageHeading.waitFor({ state: "visible" });
      return true;
    } catch (error) {
      console.log(`Error checking registration page: ${error}`);
      return false;
    }
  }

  /**
   * Completes and submits the registration form.
   * @param customer - Registration form values
   */
  async completeRegistration(customer: {
    firstName: string;
    lastName: string;
    email: string;
    telephone: string;
    password: string;
  }): Promise<void> {
    try {
      await this.firstNameInput.fill(customer.firstName);
      await this.lastNameInput.fill(customer.lastName);
      await this.emailInput.fill(customer.email);
      await this.telephoneInput.fill(customer.telephone);
      await this.passwordInput.fill(customer.password);
      await this.passwordConfirmInput.fill(customer.password);
      await this.privacyPolicyCheckbox.check();
      await this.continueButton.click();
    } catch (error) {
      console.log(`Error completing registration: ${error}`);
      throw error;
    }
  }

  /**
   * Checks whether the account-created confirmation is displayed.
   * @returns Promise<boolean> - True when the confirmation heading is visible
   */
  async isAccountCreatedConfirmationDisplayed(): Promise<boolean> {
    try {
      await this.confirmationHeading.waitFor({ state: "visible" });
      return true;
    } catch (error) {
      console.log(`Error checking account creation confirmation: ${error}`);
      return false;
    }
  }

  /**
   * Continues from the account-created confirmation to the account page.
   */
  async continueToAccount(): Promise<void> {
    await this.page.getByRole("link", { name: "Continue", exact: true }).click();
  }

  /**
   * Checks whether the newly created account page is displayed.
   * @returns Promise<boolean> - True when the account page heading is visible
   */
  async isAccountPageExists(): Promise<boolean> {
    try {
      await this.accountPageHeading.waitFor({ state: "visible" });
      return true;
    } catch (error) {
      console.log(`Error checking account page: ${error}`);
      return false;
    }
  }
}
