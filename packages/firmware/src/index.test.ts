import { describe, expect, it } from "vitest";
import { tableConfigName } from "./index";

describe("tableConfigName", () => {
  it("creates stable firmware config paths with zero-padded table ids", () => {
    expect(tableConfigName(1)).toBe("masa001/config.h");
    expect(tableConfigName(12)).toBe("masa012/config.h");
    expect(tableConfigName(101)).toBe("masa101/config.h");
  });
});
