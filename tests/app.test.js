const request = require("supertest");
const app = require("../src/app");

describe("Express app", () => {
  test("GET / should return app information", async () => {
    const response = await request(app).get("/");

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("Automated Multi-Environment Deployment Pipeline");
    expect(response.body.environment).toBe("test");
  });

  test("GET /health should return ok status", async () => {
    const response = await request(app).get("/health");

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe("ok");
  });
});