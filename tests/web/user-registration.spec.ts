/**
 * Test Case: Successful customer registration
 *
 * Tags: @master @sanity @regression @web
 *
 * Steps:
 * 1) Navigate to the application and open My Account > Register
 * 2) Complete and submit the registration form
 * 3) Verify the account-created confirmation and account page
 */
import { test, expect } from "../../fixtures/pageFixtures";
import { RandomDataUtil } from "../../utils/dataGenerator";

test("Customer registration test @master @sanity @regression @web", async ({ homePage, registrationPage }) => {
  const firstName = RandomDataUtil.getFirstName();
  const lastName = RandomDataUtil.getLastName();
  const generatedEmail = RandomDataUtil.getEmail();
  const [emailName, emailDomain] = generatedEmail.split("@");
  const email = `${emailName}+${Date.now()}@${emailDomain}`;
  const telephone = RandomDataUtil.getPhoneNumber();
  const password = RandomDataUtil.getPassword();

  await test.step("1) Navigate to My Account > Register", async () => {
    await homePage.clickRegister();
    expect(await registrationPage.isRegistrationPageExists()).toBeTruthy();
  });

  await test.step("2) Complete the registration form and accept the Privacy Policy", async () => {
    await registrationPage.completeRegistration({
      firstName,
      lastName,
      email,
      telephone,
      password,
    });
    expect(await registrationPage.isAccountCreatedConfirmationDisplayed()).toBeTruthy();
    await registrationPage.continueToAccount();
    expect(await registrationPage.isAccountPageExists()).toBeTruthy();
  });

  console.log("✅ Customer registration completed successfully!");
});
