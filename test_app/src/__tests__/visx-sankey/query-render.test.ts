import { Query } from "../../../types";

describe("Query Render Tests - visx-sankey", () => {
  test("should have queries defined", () => {
    expect(queries).toBeDefined();
    expect(Array.isArray(queries)).toBe(true);
  });
});
