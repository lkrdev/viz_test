import { Query } from "../../../types";
import queries from "./queries";

describe("Query Render Tests - visx_scatterplot", () => {
  test("should have queries defined", () => {
    expect(queries).toBeDefined();
    expect(Array.isArray(queries)).toBe(true);
  });
});
