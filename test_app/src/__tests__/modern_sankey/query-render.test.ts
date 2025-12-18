import { Query } from "../../../types";

describe("Query Render Tests - modern_sankey", () => {
  test("should have queries defined", () => {
    expect(queries).toBeDefined();
    expect(Array.isArray(queries)).toBe(true);
  });
});
