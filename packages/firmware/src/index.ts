export type FirmwareConfigInput = {
  backendHost: string;
  backendPort: number;
  tableId: number;
  deviceKey: string;
  wifiSsid?: string;
  wifiPassword?: string;
};

export const arduinoTableDisplaySketchPath = "arduino/tabflow-table-display/firmware.ino";
export const arduinoTableDisplayExampleConfigPath =
  "arduino/tabflow-table-display/config.example.h";

export function tableConfigName(tableId: number): string {
  return `masa${tableId.toString().padStart(3, "0")}/config.h`;
}
