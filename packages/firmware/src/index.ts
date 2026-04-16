export type FirmwareConfigInput = {
  backendHost: string;
  backendPort: number;
  tableId: number;
  deviceKey: string;
  wifiSsid?: string;
  wifiPassword?: string;
};

export function tableConfigName(tableId: number): string {
  return `masa${tableId.toString().padStart(3, "0")}/config.h`;
}
