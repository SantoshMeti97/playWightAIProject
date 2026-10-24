/**
 * Test Case: Valid and invalid customer login
 *
 * Tags: @master @sanity @regression @web
 *
 * Steps:
 * 1) Navigate to My Account > Login
 * 2) Verify successful authentication with configured credentials
 * 3) Verify invalid credentials are rejected with the expected warning
 */
import { test, expect } from "../../fixtures/pageFixtures";
import { RandomDataUtil } from "../../utils/dataGenerator";
import { Helper } from "../../utils/helper";

test("Valid customer login test @master @sanity @regression @web", async ({ homePage, loginPage }) => {
  const { email, password } = Helper.getLoginDetails();

  await test.step("1) Navigate to My Account > Login", async () => {
    await homePage.clickLogin();
    expect(await loginPage.isLoginPageExists()).toBeTruthy();
  });

  await test.step("2) Authenticate with configured customer credentials", async () => {
    await loginPage.login(email, password);
    expect(await loginPage.isAuthenticatedAccountPageExists()).toBeTruthy();
  });

  console.log("✅ Customer login completed successfully!");
});

test("Invalid customer login test @master @regression @web", async ({ homePage, loginPage }) => {
  const email = RandomDataUtil.getEmail();
  const password = RandomDataUtil.getPassword();

  await test.step("1) Navigate to My Account > Login", async () => {
    await homePage.clickLogin();
    expect(await loginPage.isLoginPageExists()).toBeTruthy();
  });

  await test.step("2) Submit invalid credentials and verify authentication is rejected", async () => {
    await loginPage.login(email, password);
    expect(await loginPage.isWarningDisplayed()).toBeTruthy();
    expect(await loginPage.getWarningMessage()).toContain(
      "Warning: No match for E-Mail Address and/or Password.",
    );
    expect(await loginPage.isAuthenticatedAccountPageExists()).toBeFalsy();
  });

  console.log("✅ Invalid customer login was rejected as expected.");
});
