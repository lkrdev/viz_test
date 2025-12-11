import { Query } from "../../../types";
import queries from "../../mocks/multi_sparkline/queries";

describe("Query Render Tests - multi_sparkline", () => {
  test("should have queries defined", () => {
    expect(queries).toBeDefined();
    expect(Array.isArray(queries)).toBe(true);
  });
});
