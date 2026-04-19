import { describe, expect, it } from "vitest";
import {
  arduinoTableDisplayExampleConfigPath,
  arduinoTableDisplaySketchPath,
  tableConfigName
} from "./index";

describe("tableConfigName", () => {
  it("creates stable firmware config paths with zero-padded table ids", () => {
    expect(tableConfigName(1)).toBe("masa001/config.h");
    expect(tableConfigName(12)).toBe("masa012/config.h");
    expect(tableConfigName(101)).toBe("masa101/config.h");
  });

  it("exposes the Arduino table display source locations", () => {
    expect(arduinoTableDisplaySketchPath).toBe("arduino/tabflow-table-display/firmware.ino");
    expect(arduinoTableDisplayExampleConfigPath).toBe(
      "arduino/tabflow-table-display/config.example.h"
    );
  });
});
