import { DEFAULT_HEIGHT, DEFAULT_WIDTH } from "./constants";

export const safeHWParse = (
  value: string | number | undefined | null,
  type: "height" | "width"
) => {
  if (typeof value === "number") {
    return value;
  } else if (typeof value === "string") {
    const parsed = parseInt(value);
    return isNaN(parsed)
      ? type === "height"
        ? DEFAULT_HEIGHT
        : DEFAULT_WIDTH
      : parsed;
  } else if (value === undefined) {
    return type === "height" ? DEFAULT_HEIGHT : DEFAULT_WIDTH;
  }
  return type === "height" ? DEFAULT_HEIGHT : DEFAULT_WIDTH;
};
