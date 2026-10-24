import { test, expect } from "@playwright/test";
import Ajv from "ajv";
import dotenv from "dotenv";
import { Routes } from "../../api/endpoints/routes";
import { DataProvider } from "../../utils/DataReader";
import { RandomDataUtil } from "../../utils/dataGenerator";

dotenv.config({ override: true });

test.describe("FakeStore API Tests", () => {
  // ---------------------------------------------------------
  // Configuration
  // ---------------------------------------------------------

  const BASE_URL = process.env.API_BASE_URL || Routes.BASE_URL;
  const PRODUCT_ID = Number(process.env.PRODUCT_ID ?? 1);
  const USER_ID = Number(process.env.USER_ID ?? 1);
  const CART_ID = Number(process.env.CART_ID ?? 1);
  const LIMIT = Number(process.env.LIMIT ?? 3);
  const START_DATE = process.env.START_DATE ?? "2019-12-10";
  const END_DATE = process.env.END_DATE ?? "2020-10-10";

  // ---------------------------------------------------------
  // Authentication
  // ---------------------------------------------------------

  test("POST - Successful login @master @sanity @api", async ({ request }) => {
    const response = await request.post(`${BASE_URL}${Routes.AUTH_LOGIN}`, {
      data: {
        username: process.env.USERNAME,
        password: process.env.PASSWORD,
      },
    });

    expect(response.status(), "Valid credentials should return HTTP 201").toBe(201);
    const body = await response.json();
    expect(body).toHaveProperty("token");
    expect(typeof body.token, "The authentication token should be a string").toBe("string");
    expect(body.token.length, "The authentication token should not be empty").toBeGreaterThan(0);
  });

  test("POST - Invalid login @master @regression @api", async ({ request }) => {
    const response = await request.post(`${BASE_URL}${Routes.AUTH_LOGIN}`, {
      data: RandomDataUtil.generateInvalidLoginPayload(),
    });

    expect(response.status(), "Invalid credentials should return HTTP 401").toBe(401);
    const errorMessage = await response.text();
    expect(errorMessage, "The API should explain that the credentials are incorrect").toBe(
      "username or password is incorrect",
    );
  });

  // ---------------------------------------------------------
  // Products - GET
  // ---------------------------------------------------------

  test("GET - All products @master @sanity @api", async ({ request }) => {
    const response = await request.get(`${BASE_URL}${Routes.GET_ALL_PRODUCTS}`);
    expect(response.status(), "Product listing should return HTTP 200").toBe(200);

    const products = await response.json();
    expect(Array.isArray(products), "Products response should be an array").toBeTruthy();
    expect(products.length, "At least one product should be returned").toBeGreaterThan(0);
    expect(products[0]).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        title: expect.any(String),
        price: expect.any(Number),
        category: expect.any(String),
        image: expect.any(String),
      }),
    );
  });

  test("GET - Product by ID @master @sanity @api", async ({ request }) => {
    const route = Routes.GET_PRODUCT_BY_ID.replace("{id}", String(PRODUCT_ID));
    const response = await request.get(`${BASE_URL}${route}`);
    expect(response.status(), "Product lookup should return HTTP 200").toBe(200);

    const product = await response.json();
    expect(product.id, "Returned product ID should match the requested ID").toBe(PRODUCT_ID);
    expect(product).toEqual(
      expect.objectContaining({
        title: expect.any(String),
        price: expect.any(Number),
        category: expect.any(String),
        image: expect.any(String),
      }),
    );
  });

  test("GET - Products with limit @master @regression @api", async ({ request }) => {
    const route = Routes.GET_PRODUCTS_WITH_LIMIT.replace("{limit}", String(LIMIT));
    const response = await request.get(`${BASE_URL}${route}`);
    expect(response.status(), "Limited product listing should return HTTP 200").toBe(200);

    const products = await response.json();
    expect(Array.isArray(products), "Limited products response should be an array").toBeTruthy();
    expect(products.length, "Returned product count should match the requested limit").toBe(LIMIT);
  });

  test("GET - Products sorted ascending @master @regression @api", async ({ request }) => {
    const route = Routes.GET_PRODUCTS_SORTED.replace("{order}", "asc");
    const response = await request.get(`${BASE_URL}${route}`);
    expect(response.status(), "Ascending product sort should return HTTP 200").toBe(200);

    const products = await response.json();
    const ids = products.map((product: { id: number }) => product.id);
    expect(ids, "Product IDs should be in ascending order").toEqual([...ids].sort((a, b) => a - b));
  });

  test("GET - Products sorted descending @master @regression @api", async ({ request }) => {
    const route = Routes.GET_PRODUCTS_SORTED.replace("{order}", "desc");
    const response = await request.get(`${BASE_URL}${route}`);
    expect(response.status(), "Descending product sort should return HTTP 200").toBe(200);

    const products = await response.json();
    const ids = products.map((product: { id: number }) => product.id);
    expect(ids, "Product IDs should be in descending order").toEqual([...ids].sort((a, b) => b - a));
  });

  test("GET - All product categories @master @sanity @api", async ({ request }) => {
    const response = await request.get(`${BASE_URL}${Routes.GET_ALL_CATEGORIES}`);
    expect(response.status(), "Product categories should return HTTP 200").toBe(200);

    const categories = await response.json();
    expect(Array.isArray(categories), "Categories response should be an array").toBeTruthy();
    expect(categories.length, "At least one category should be returned").toBeGreaterThan(0);
    expect(categories.every((category: unknown) => typeof category === "string")).toBeTruthy();
  });

  test("GET - Products by category @master @regression @api", async ({ request }) => {
    const category = "electronics";
    const route = Routes.GET_PRODUCTS_BY_CATEGORY.replace("{category}", category);
    const response = await request.get(`${BASE_URL}${route}`);
    expect(response.status(), "Category product listing should return HTTP 200").toBe(200);

    const products = await response.json();
    expect(Array.isArray(products), "Category products response should be an array").toBeTruthy();
    expect(products.length, "The selected valid category should have products").toBeGreaterThan(0);
    expect(products.every((product: { category: string }) => product.category === category)).toBeTruthy();
  });

  // ---------------------------------------------------------
  // Products - POST / PUT / DELETE
  // ---------------------------------------------------------

  test("POST - Create product @master @regression @api", async ({ request }) => {
    const payload = RandomDataUtil.generateProductPayload();
    const response = await request.post(`${BASE_URL}${Routes.CREATE_PRODUCT}`, { data: payload });
    expect(response.status(), "Product creation should return HTTP 201").toBe(201);

    const created = await response.json();
    expect(created.id, "Created product should have an ID").toBeTruthy();
    expect(created).toEqual(expect.objectContaining(payload));

    const deleteRoute = Routes.DELETE_PRODUCT.replace("{id}", String(created.id));
    const deleteResponse = await request.delete(`${BASE_URL}${deleteRoute}`);
    expect(deleteResponse.status(), "Created test product cleanup should return HTTP 200").toBe(200);
  });

  test("PUT - Update product @master @regression @api", async ({ request }) => {
    const payload = RandomDataUtil.generateUpdatedProductPayload();
    const route = Routes.UPDATE_PRODUCT.replace("{id}", String(PRODUCT_ID));
    const response = await request.put(`${BASE_URL}${route}`, { data: payload });
    expect(response.status(), "Product update should return HTTP 200").toBe(200);

    const updated = await response.json();
    expect(updated.id, "Updated product ID should match the requested ID").toBe(PRODUCT_ID);
    expect(updated).toEqual(expect.objectContaining(payload));
  });

  test("DELETE - Product @master @regression @api", async ({ request }) => {
    const route = Routes.DELETE_PRODUCT.replace("{id}", String(PRODUCT_ID));
    const response = await request.delete(`${BASE_URL}${route}`);
    expect(response.status(), "Product deletion should return HTTP 200").toBe(200);

    const deleted = await response.json();
    expect(deleted.id, "Deleted product response should identify the requested product").toBe(PRODUCT_ID);
  });

  // ---------------------------------------------------------
  // Users - GET
  // ---------------------------------------------------------

  test("GET - All users @master @sanity @api", async ({ request }) => {
    const response = await request.get(`${BASE_URL}${Routes.GET_ALL_USERS}`);
    expect(response.status(), "User listing should return HTTP 200").toBe(200);

    const users = await response.json();
    expect(Array.isArray(users), "Users response should be an array").toBeTruthy();
    expect(users.length, "At least one user should be returned").toBeGreaterThan(0);
  });

  test("GET - User by ID @master @sanity @api", async ({ request }) => {
    const route = Routes.GET_USER_BY_ID.replace("{id}", String(USER_ID));
    const response = await request.get(`${BASE_URL}${route}`);
    expect(response.status(), "User lookup should return HTTP 200").toBe(200);

    const user = await response.json();
    expect(user.id, "Returned user ID should match the requested ID").toBe(USER_ID);
  });

  test("GET - Users with limit @master @regression @api", async ({ request }) => {
    const route = Routes.GET_USERS_WITH_LIMIT.replace("{limit}", String(LIMIT));
    const response = await request.get(`${BASE_URL}${route}`);
    expect(response.status(), "Limited user listing should return HTTP 200").toBe(200);

    const users = await response.json();
    expect(Array.isArray(users), "Limited users response should be an array").toBeTruthy();
    expect(users.length, "Returned user count should match the requested limit").toBe(LIMIT);
  });

  test("GET - Users sorted ascending @master @regression @api", async ({ request }) => {
    const route = Routes.GET_USERS_SORTED.replace("{order}", "asc");
    const response = await request.get(`${BASE_URL}${route}`);
    expect(response.status(), "Ascending user sort should return HTTP 200").toBe(200);

    const users = await response.json();
    const ids = users.map((user: { id: number }) => user.id);
    expect(ids, "User IDs should be in ascending order").toEqual([...ids].sort((a, b) => a - b));
  });

  test("GET - Users sorted descending @master @regression @api", async ({ request }) => {
    const route = Routes.GET_USERS_SORTED.replace("{order}", "desc");
    const response = await request.get(`${BASE_URL}${route}`);
    expect(response.status(), "Descending user sort should return HTTP 200").toBe(200);

    const users = await response.json();
    const ids = users.map((user: { id: number }) => user.id);
    expect(ids, "User IDs should be in descending order").toEqual([...ids].sort((a, b) => b - a));
  });

  // ---------------------------------------------------------
  // Users - POST / PUT / DELETE
  // ---------------------------------------------------------

  test("POST - Create user @master @regression @api", async ({ request }) => {
    const payload = RandomDataUtil.generateUserPayload();
    const response = await request.post(`${BASE_URL}${Routes.CREATE_USER}`, { data: payload });
    expect(response.status(), "User creation should return HTTP 201").toBe(201);

    const created = await response.json();
    expect(created.id, "Created user should have an ID").toBeTruthy();

    const deleteRoute = Routes.DELETE_USER.replace("{id}", String(created.id));
    const deleteResponse = await request.delete(`${BASE_URL}${deleteRoute}`);
    expect(deleteResponse.status(), "Created test user cleanup should return HTTP 200").toBe(200);
  });

  test("PUT - Update user @master @regression @api", async ({ request }) => {
    const payload = RandomDataUtil.generateUserUpdatePayload();
    const route = Routes.UPDATE_USER.replace("{id}", String(USER_ID));
    const response = await request.put(`${BASE_URL}${route}`, { data: payload });
    expect(response.status(), "User update should return HTTP 200").toBe(200);

    const updated = await response.json();
    expect(updated).toEqual(expect.objectContaining(payload));
  });

  test("DELETE - User @master @regression @api", async ({ request }) => {
    const route = Routes.DELETE_USER.replace("{id}", String(USER_ID));
    const response = await request.delete(`${BASE_URL}${route}`);
    expect(response.status(), "User deletion should return HTTP 200").toBe(200);

    const deleted = await response.json();
    expect(deleted.id, "Deleted user response should identify the requested user").toBe(USER_ID);
  });

  // ---------------------------------------------------------
  // Carts - GET
  // ---------------------------------------------------------

  test("GET - All carts @master @sanity @api", async ({ request }) => {
    const response = await request.get(`${BASE_URL}${Routes.GET_ALL_CARTS}`);
    expect(response.status(), "Cart listing should return HTTP 200").toBe(200);

    const carts = await response.json();
    expect(Array.isArray(carts), "Carts response should be an array").toBeTruthy();
    expect(carts.length, "At least one cart should be returned").toBeGreaterThan(0);
  });

  test("GET - Cart by ID @master @sanity @api", async ({ request }) => {
    const route = Routes.GET_CART_BY_ID.replace("{id}", String(CART_ID));
    const response = await request.get(`${BASE_URL}${route}`);
    expect(response.status(), "Cart lookup should return HTTP 200").toBe(200);

    const cart = await response.json();
    expect(cart.id, "Returned cart ID should match the requested ID").toBe(CART_ID);
  });

  test("GET - Carts by date range @master @regression @api", async ({ request }) => {
    const route = Routes.GET_CARTS_BY_DATE_RANGE
      .replace("{startdate}", START_DATE)
      .replace("{enddate}", END_DATE);
    const response = await request.get(`${BASE_URL}${route}`);
    expect(response.status(), "Date-filtered cart listing should return HTTP 200").toBe(200);

    const carts = await response.json();
    expect(Array.isArray(carts), "Date-filtered carts response should be an array").toBeTruthy();
    for (const cart of carts) {
      const cartDate = new Date(cart.date).getTime();
      expect(cartDate, "Cart date should be on or after the requested start date").toBeGreaterThanOrEqual(
        new Date(START_DATE).getTime(),
      );
      expect(cartDate, "Cart date should be on or before the requested end date").toBeLessThanOrEqual(
        new Date(END_DATE).getTime(),
      );
    }
  });

  test("GET - Carts by user @master @regression @api", async ({ request }) => {
    const route = Routes.GET_USER_CART.replace("{userId}", String(USER_ID));
    const response = await request.get(`${BASE_URL}${route}`);
    expect(response.status(), "User cart lookup should return HTTP 200").toBe(200);

    const carts = await response.json();
    expect(Array.isArray(carts), "User carts response should be an array").toBeTruthy();
    expect(
      carts.every((cart: { userId: number }) => cart.userId === USER_ID),
      "Every returned cart should belong to the requested user",
    ).toBeTruthy();
  });

  test("GET - Carts with limit @master @regression @api", async ({ request }) => {
    const route = Routes.GET_CARTS_WITH_LIMIT.replace("{limit}", String(LIMIT));
    const response = await request.get(`${BASE_URL}${route}`);
    expect(response.status(), "Limited cart listing should return HTTP 200").toBe(200);

    const carts = await response.json();
    expect(Array.isArray(carts), "Limited carts response should be an array").toBeTruthy();
    expect(carts.length, "Returned cart count should match the requested limit").toBe(LIMIT);
  });

  test("GET - Carts sorted ascending @master @regression @api", async ({ request }) => {
    const route = Routes.GET_CARTS_SORTED.replace("{order}", "asc");
    const response = await request.get(`${BASE_URL}${route}`);
    expect(response.status(), "Ascending cart sort should return HTTP 200").toBe(200);

    const carts = await response.json();
    const ids = carts.map((cart: { id: number }) => cart.id);
    expect(ids, "Cart IDs should be in ascending order").toEqual([...ids].sort((a, b) => a - b));
  });

  test("GET - Carts sorted descending @master @regression @api", async ({ request }) => {
    const route = Routes.GET_CARTS_SORTED.replace("{order}", "desc");
    const response = await request.get(`${BASE_URL}${route}`);
    expect(response.status(), "Descending cart sort should return HTTP 200").toBe(200);

    const carts = await response.json();
    const ids = carts.map((cart: { id: number }) => cart.id);
    expect(ids, "Cart IDs should be in descending order").toEqual([...ids].sort((a, b) => b - a));
  });

  // ---------------------------------------------------------
  // Carts - POST / PUT / DELETE
  // ---------------------------------------------------------

  test("POST - Create cart @master @regression @api", async ({ request }) => {
    const payload = RandomDataUtil.generateCartPayload(USER_ID);
    const response = await request.post(`${BASE_URL}${Routes.CREATE_CART}`, { data: payload });
    expect(response.status(), "Cart creation should return HTTP 201").toBe(201);

    const created = await response.json();
    expect(created.id, "Created cart should have an ID").toBeTruthy();
    expect(created.userId, "Created cart should preserve the submitted user ID").toBe(USER_ID);
    expect(created.products, "Created cart should preserve the submitted products").toEqual(payload.products);

    const deleteRoute = Routes.DELETE_CART.replace("{id}", String(created.id));
    const deleteResponse = await request.delete(`${BASE_URL}${deleteRoute}`);
    expect(deleteResponse.status(), "Created test cart cleanup should return HTTP 200").toBe(200);
  });

  test("PUT - Update cart @master @regression @api", async ({ request }) => {
    const payload = RandomDataUtil.generateUpdatedCartPayload(USER_ID);
    const route = Routes.UPDATE_CART.replace("{id}", String(CART_ID));
    const response = await request.put(`${BASE_URL}${route}`, { data: payload });
    expect(response.status(), "Cart update should return HTTP 200").toBe(200);

    const updated = await response.json();
    expect(updated.id, "Updated cart ID should match the requested ID").toBe(CART_ID);
    expect(updated.userId, "Updated cart should preserve the submitted user ID").toBe(USER_ID);
    expect(updated.products, "Updated cart should contain the submitted quantity").toEqual(payload.products);
  });

  test("DELETE - Cart @master @regression @api", async ({ request }) => {
    const route = Routes.DELETE_CART.replace("{id}", String(CART_ID));
    const response = await request.delete(`${BASE_URL}${route}`);
    expect(response.status(), "Cart deletion should return HTTP 200").toBe(200);

    const deleted = await response.json();
    expect(deleted.id, "Deleted cart response should identify the requested cart").toBe(CART_ID);
  });

  // ---------------------------------------------------------
  // JSON Schema Validation
  // ---------------------------------------------------------

  test("GET - Product response schema @master @regression @api", async ({ request }) => {
    const route = Routes.GET_PRODUCT_BY_ID.replace("{id}", String(PRODUCT_ID));
    const response = await request.get(`${BASE_URL}${route}`);
    expect(response.status(), "Product schema source should return HTTP 200").toBe(200);

    const schema = DataProvider.readJson("./api/schemas/product_api_schema.json");
    const isValid = new Ajv().compile(schema)(await response.json());
    expect(isValid, "Product response should match product_api_schema.json").toBeTruthy();
  });

  test("GET - User response schema @master @regression @api", async ({ request }) => {
    const route = Routes.GET_USER_BY_ID.replace("{id}", String(USER_ID));
    const response = await request.get(`${BASE_URL}${route}`);
    expect(response.status(), "User schema source should return HTTP 200").toBe(200);

    const schema = DataProvider.readJson("./api/schemas/user_api_schema.json");
    const isValid = new Ajv().compile(schema)(await response.json());
    expect(isValid, "User response should match user_api_schema.json").toBeTruthy();
  });

  test("GET - Cart response schema @master @regression @api", async ({ request }) => {
    const route = Routes.GET_CART_BY_ID.replace("{id}", String(CART_ID));
    const response = await request.get(`${BASE_URL}${route}`);
    expect(response.status(), "Cart schema source should return HTTP 200").toBe(200);

    const schema = DataProvider.readJson("./api/schemas/cart_api_schema.json");
    const isValid = new Ajv().compile(schema)(await response.json());
    expect(isValid, "Cart response should match cart_api_schema.json").toBeTruthy();
  });

  // ---------------------------------------------------------
  // End-to-End CRUD Workflows
  // ---------------------------------------------------------

  test("WORKFLOW - Product create, update, delete @master @regression @api", async ({ request }) => {
    const product = RandomDataUtil.generateProductPayload();
    const createResponse = await request.post(`${BASE_URL}${Routes.CREATE_PRODUCT}`, { data: product });
    expect(createResponse.status(), "Workflow product creation should return HTTP 201").toBe(201);
    const created = await createResponse.json();
    expect(created.id, "Workflow product creation should return an ID").toBeTruthy();

    const updatePayload = RandomDataUtil.generateUpdatedProductPayload();
    const updateRoute = Routes.UPDATE_PRODUCT.replace("{id}", String(created.id));
    const updateResponse = await request.put(`${BASE_URL}${updateRoute}`, { data: updatePayload });
    expect(updateResponse.status(), "Workflow product update should return HTTP 200").toBe(200);
    const updated = await updateResponse.json();
    expect(updated.id, "Workflow should update the created product").toBe(created.id);
    expect(updated).toEqual(expect.objectContaining(updatePayload));

    const deleteRoute = Routes.DELETE_PRODUCT.replace("{id}", String(created.id));
    const deleteResponse = await request.delete(`${BASE_URL}${deleteRoute}`);
    expect(deleteResponse.status(), "Workflow product deletion should return HTTP 200").toBe(200);
  });

  test("WORKFLOW - User create, update, delete @master @regression @api", async ({ request }) => {
    const user = RandomDataUtil.generateUserPayload();
    const createResponse = await request.post(`${BASE_URL}${Routes.CREATE_USER}`, { data: user });
    expect(createResponse.status(), "Workflow user creation should return HTTP 201").toBe(201);
    const created = await createResponse.json();
    expect(created.id, "Workflow user creation should return an ID").toBeTruthy();

    const updatePayload = RandomDataUtil.generateUserUpdatePayload();
    const updateRoute = Routes.UPDATE_USER.replace("{id}", String(created.id));
    const updateResponse = await request.put(`${BASE_URL}${updateRoute}`, { data: updatePayload });
    expect(updateResponse.status(), "Workflow user update should return HTTP 200").toBe(200);
    const updated = await updateResponse.json();
    expect(updated).toEqual(expect.objectContaining(updatePayload));

    const deleteRoute = Routes.DELETE_USER.replace("{id}", String(created.id));
    const deleteResponse = await request.delete(`${BASE_URL}${deleteRoute}`);
    expect(deleteResponse.status(), "Workflow user deletion should return HTTP 200").toBe(200);
  });

  test("WORKFLOW - Cart create, update, delete @master @regression @api", async ({ request }) => {
    const cart = RandomDataUtil.generateCartPayload(USER_ID);
    const createResponse = await request.post(`${BASE_URL}${Routes.CREATE_CART}`, { data: cart });
    expect(createResponse.status(), "Workflow cart creation should return HTTP 201").toBe(201);
    const created = await createResponse.json();
    expect(created.id, "Workflow cart creation should return an ID").toBeTruthy();
    expect(created.userId).toBe(USER_ID);
    expect(created.products).toEqual(cart.products);

    const updatePayload = RandomDataUtil.generateUpdatedCartPayload(USER_ID);
    updatePayload.products[0].quantity = cart.products[0].quantity + 1;
    const updateRoute = Routes.UPDATE_CART.replace("{id}", String(created.id));
    const updateResponse = await request.put(`${BASE_URL}${updateRoute}`, { data: updatePayload });
    expect(updateResponse.status(), "Workflow cart update should return HTTP 200").toBe(200);
    const updated = await updateResponse.json();
    expect(updated.id, "Workflow should update the created cart").toBe(created.id);
    expect(updated.products[0].quantity, "Updated cart should reflect the changed quantity").toBe(
      updatePayload.products[0].quantity,
    );

    const deleteRoute = Routes.DELETE_CART.replace("{id}", String(created.id));
    const deleteResponse = await request.delete(`${BASE_URL}${deleteRoute}`);
    expect(deleteResponse.status(), "Workflow cart deletion should return HTTP 200").toBe(200);
  });
});
