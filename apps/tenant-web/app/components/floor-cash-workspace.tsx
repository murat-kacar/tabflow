"use client";

import type {
  AdminDevice,
  AdminTableSummary,
  CustomerBillSummary,
  CustomerOrderSummary
} from "@tabflow/shared-ts";
import { useActionState, useMemo, useState } from "react";
import {
  closeBillAction,
  saveFloorLayoutAction,
  type TenantAdminActionState,
  type TenantTableActionState
} from "../auth-actions";
import { formatDateTime } from "../lib/format";

const initialState: TenantAdminActionState = {
  ok: false,
  message: ""
};

const tableActionInitialState: TenantTableActionState = {
  ok: false,
  message: ""
};

type FloorCashView = "floor" | "open-checks" | "payment-queue" | "closed-checks";
type PaymentMethod = "nakit" | "kart" | "transfer" | "diger";
type FloorZoneKey = "salon" | "balkon" | "paket";
type FloorLayoutKey = "ana-kat" | "balkon" | "paket";
type TableShape = "square" | "round" | "rect";
type LayoutPlacement = { left: number; top: number };
type TableVisual = { width: number; height: number; shape: TableShape; rotation: 0 | 90 | 180 | 270 };
type FixedObjectKind = "cashier" | "service-pass" | "wc" | "entrance" | "wall";
type FixedObjectPlacement = {
  id: string;
  layout: FloorLayoutKey;
  kind: FixedObjectKind;
  label: string;
  left: number;
  top: number;
  width: number;
  height: number;
  rotation: 0 | 90 | 180 | 270;
};
type ZonePlacement = {
  id: string;
  zone: FloorZoneKey;
  layout: FloorLayoutKey;
  left: number;
  top: number;
  width: number;
  height: number;
};

type FloorLayoutDocument = {
  zones?: Partial<Record<FloorLayoutKey, ZonePlacement[]>>;
  tables?: Record<string, Partial<TableVisual>>;
  objects?: Partial<Record<FloorLayoutKey, FixedObjectPlacement[]>>;
};

function formatMoney(minor: number, currencyCode: string | null): string {
  if (!currencyCode) {
    return "-";
  }

  return `${(minor / 100).toFixed(2)} ${currencyCode}`;
}

function statusBadge(table: AdminTableSummary) {
  if (!table.isActive) {
    return { label: "Pasif", tone: "bg-stone-200 text-stone-700" };
  }

  if (!table.deviceOnline) {
    return { label: "Offline", tone: "bg-rose-100 text-rose-700" };
  }

  if (table.readyOrderCount > 0) {
    return { label: "Hazir servis", tone: "bg-emerald-100 text-emerald-800" };
  }

  if (table.submittedOrderCount + table.preparingOrderCount > 0) {
    return { label: "Aktif siparis", tone: "bg-amber-100 text-amber-800" };
  }

  if (table.openBillId) {
    return { label: "Acik hesap", tone: "bg-stone-200 text-stone-800" };
  }

  return { label: "Bos", tone: "bg-stone-100 text-stone-600" };
}

function tableUrgency(table: AdminTableSummary) {
  if (!table.deviceOnline) {
    return { label: "Cihaz problemi", tone: "bg-rose-100 text-rose-700" };
  }

  if (table.readyOrderCount > 0) {
    return { label: "Servis cikmali", tone: "bg-emerald-100 text-emerald-800" };
  }

  if (table.preparingOrderCount + table.submittedOrderCount >= 3) {
    return { label: "Yogun masa", tone: "bg-amber-100 text-amber-800" };
  }

  if (table.openBillId) {
    return { label: "Kapanis bekliyor", tone: "bg-stone-200 text-stone-800" };
  }

  return { label: "Sakin", tone: "bg-stone-100 text-stone-600" };
}

function inferZone(table: AdminTableSummary): FloorZoneKey {
  const source = `${table.name} ${table.serviceNote ?? ""}`.toLowerCase();

  if (source.includes("balkon") || source.includes("teras")) {
    return "balkon";
  }

  if (source.includes("paket") || source.includes("kurye") || source.includes("takeaway")) {
    return "paket";
  }

  return "salon";
}

function inferLayout(table: AdminTableSummary): FloorLayoutKey {
  const zone = inferZone(table);
  if (zone === "balkon") {
    return "balkon";
  }
  if (zone === "paket") {
    return "paket";
  }
  return "ana-kat";
}

function layoutMeta(layout: FloorLayoutKey) {
  switch (layout) {
    case "balkon":
      return { label: "Balkon", description: "Teras ve balkon yerlesimi" };
    case "paket":
      return { label: "Paket", description: "Kurye ve takeaway akisi" };
    default:
      return { label: "Ana Kat", description: "Salon ve ana servis duzeni" };
  }
}

function createInitialLayoutPlacements(
  tables: AdminTableSummary[]
): Record<FloorLayoutKey, Record<string, LayoutPlacement>> {
  const placements: Record<FloorLayoutKey, Record<string, LayoutPlacement>> = {
    "ana-kat": {},
    balkon: {},
    paket: {}
  };

  (["ana-kat", "balkon", "paket"] as FloorLayoutKey[]).forEach((layout) => {
    tables
      .filter((table) => inferLayout(table) === layout)
      .forEach((table, index) => {
        placements[layout][table.id] = {
          left: table.layoutX || 8 + (index % 4) * 21,
          top: table.layoutY || 10 + Math.floor(index / 4) * 24
        };
      });
  });

  return placements;
}

function createInitialZonePlacements(): Record<FloorLayoutKey, ZonePlacement[]> {
  return {
    "ana-kat": [
      { id: "salon-main", zone: "salon", layout: "ana-kat", left: 6, top: 8, width: 62, height: 42 },
      { id: "salon-side", zone: "salon", layout: "ana-kat", left: 70, top: 8, width: 22, height: 42 }
    ],
    balkon: [
      { id: "balkon-main", zone: "balkon", layout: "balkon", left: 8, top: 10, width: 70, height: 48 }
    ],
    paket: [
      { id: "paket-main", zone: "paket", layout: "paket", left: 10, top: 12, width: 56, height: 36 }
    ]
  };
}

function createInitialFixedObjects(): Record<FloorLayoutKey, FixedObjectPlacement[]> {
  return {
    "ana-kat": [
      {
        id: "ana-kat-cashier",
        layout: "ana-kat",
        kind: "cashier",
        label: "Kasiyer Bankosu",
        left: 44,
        top: 4,
        width: 16,
        height: 8,
        rotation: 0
      },
      {
        id: "ana-kat-pass",
        layout: "ana-kat",
        kind: "service-pass",
        label: "Mutfak Servis Alani",
        left: 18,
        top: 2,
        width: 28,
        height: 12,
        rotation: 0
      },
      {
        id: "ana-kat-wc",
        layout: "ana-kat",
        kind: "wc",
        label: "WC",
        left: 72,
        top: 2,
        width: 18,
        height: 12,
        rotation: 0
      },
      {
        id: "ana-kat-entrance",
        layout: "ana-kat",
        kind: "entrance",
        label: "Giris",
        left: 10,
        top: 84,
        width: 14,
        height: 10,
        rotation: 0
      }
    ],
    balkon: [],
    paket: []
  };
}

function defaultTableShape(zone: FloorZoneKey): TableShape {
  if (zone === "balkon") {
    return "round";
  }

  if (zone === "paket") {
    return "rect";
  }

  return "square";
}

function createInitialTableVisuals(
  tables: AdminTableSummary[],
  document?: FloorLayoutDocument
): Record<string, TableVisual> {
  return Object.fromEntries(
    tables.map((table) => {
      const zone = inferZone(table);
      const stored = document?.tables?.[table.id];
      return [
        table.id,
        {
          width: Math.max(10, Math.min(26, Math.round(stored?.width ?? (zone === "paket" ? 18 : 14)))),
          height: Math.max(10, Math.min(26, Math.round(stored?.height ?? 14))),
          rotation:
            stored?.rotation === 90 || stored?.rotation === 180 || stored?.rotation === 270
              ? stored.rotation
              : 0,
          shape: stored?.shape === "round" || stored?.shape === "rect" || stored?.shape === "square"
            ? stored.shape
            : defaultTableShape(zone)
        }
      ];
    })
  );
}

function parseFloorLayoutDocument(floorLayoutJson?: string | null): FloorLayoutDocument | null {
  if (!floorLayoutJson?.trim()) {
    return null;
  }

  try {
    const parsed = JSON.parse(floorLayoutJson) as FloorLayoutDocument;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function createZonePlacementsFromDocument(
  document?: FloorLayoutDocument | null
): Record<FloorLayoutKey, ZonePlacement[]> {
  const fallback = createInitialZonePlacements();

  if (!document?.zones) {
    return fallback;
  }

  return {
    "ana-kat": Array.isArray(document.zones["ana-kat"]) ? document.zones["ana-kat"] as ZonePlacement[] : fallback["ana-kat"],
    balkon: Array.isArray(document.zones.balkon) ? document.zones.balkon as ZonePlacement[] : fallback.balkon,
    paket: Array.isArray(document.zones.paket) ? document.zones.paket as ZonePlacement[] : fallback.paket
  };
}

function createFixedObjectsFromDocument(
  document?: FloorLayoutDocument | null
): Record<FloorLayoutKey, FixedObjectPlacement[]> {
  const fallback = createInitialFixedObjects();

  if (!document?.objects) {
    return fallback;
  }

  return {
    "ana-kat": Array.isArray(document.objects["ana-kat"])
      ? (document.objects["ana-kat"] as FixedObjectPlacement[])
      : fallback["ana-kat"],
    balkon: Array.isArray(document.objects.balkon)
      ? (document.objects.balkon as FixedObjectPlacement[])
      : fallback.balkon,
    paket: Array.isArray(document.objects.paket)
      ? (document.objects.paket as FixedObjectPlacement[])
      : fallback.paket
  };
}

function shapeClassForTable(shape: TableShape): string {
  switch (shape) {
    case "round":
      return "rounded-[999px]";
    case "rect":
      return "rounded-[1rem]";
    default:
      return "rounded-[1.8rem]";
  }
}

function rotateNext(rotation: 0 | 90 | 180 | 270): 0 | 90 | 180 | 270 {
  switch (rotation) {
    case 90:
      return 180;
    case 180:
      return 270;
    case 270:
      return 0;
    default:
      return 90;
  }
}

function fixedObjectMeta(kind: FixedObjectKind) {
  switch (kind) {
    case "cashier":
      return {
        label: "Kasiyer Bankosu",
        className: "border-[#3d5f9c] bg-white text-[#21406f]"
      };
    case "service-pass":
      return {
        label: "Mutfak Servis Alani",
        className: "border-[#6b5b2d] bg-[#fff5cc] text-[#5f4c14]"
      };
    case "wc":
      return {
        label: "WC",
        className: "border-[#6b648f] bg-[#f3efff] text-[#463f6a]"
      };
    case "entrance":
      return {
        label: "Giris",
        className: "border-[#386d3d] bg-[#e4f7e6] text-[#214d25]"
      };
    default:
      return {
        label: "Duvar",
        className: "border-[#5a5a5a] bg-[#dadada] text-[#303030]"
      };
  }
}

function zoneMeta(zone: FloorZoneKey) {
  switch (zone) {
    case "balkon":
      return {
        label: "Balkon",
        tone: "bg-[#87a9d8] text-white",
        panel: "border-[#87a9d8]/40 bg-[linear-gradient(180deg,#e8f0ff,#dbe8fb)]"
      };
    case "paket":
      return {
        label: "Paket",
        tone: "bg-[#506c84] text-white",
        panel: "border-[#506c84]/40 bg-[linear-gradient(180deg,#ebeff3,#d8e0e8)]"
      };
    default:
      return {
        label: "Salon",
        tone: "bg-[#5f8ec9] text-white",
        panel: "border-[#d8c85f]/40 bg-[linear-gradient(180deg,#fff7a8,#f6e980)]"
      };
  }
}

function FloorTableCard({
  isSelected,
  onSelect,
  shape,
  table,
  zone
}: {
  isSelected: boolean;
  onSelect: () => void;
  shape: TableShape;
  table: AdminTableSummary;
  zone: FloorZoneKey;
}) {
  const badge = statusBadge(table);
  const zoneDetails = zoneMeta(zone);
  const shapeClass = `${shape === "rect" ? "aspect-[1.25/1]" : "aspect-square"} ${shapeClassForTable(shape)}`;

  return (
    <button
      className={`${shapeClass} relative border-[3px] p-4 text-left shadow-sm transition ${
        isSelected
          ? "border-[#16392e] bg-[#ff6e70] text-stone-950"
          : zone === "salon"
            ? "border-[#534449] bg-[#fffdf4] text-stone-950 hover:border-[#263e73]"
            : zone === "balkon"
              ? "border-[#534449] bg-[#f8ae2f] text-stone-950 hover:border-[#263e73]"
              : "border-[#534449] bg-[#f6f6f4] text-stone-950 hover:border-[#263e73]"
      }`}
      onClick={onSelect}
      type="button"
    >
      <div className="flex h-full flex-col justify-between">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className={`text-xs font-semibold uppercase tracking-[0.22em] ${
              isSelected ? "text-stone-800/70" : "text-stone-500"
            }`}
          >
            {zoneDetails.label}
          </p>
          <h3 className="mt-3 text-2xl font-black tracking-tight">
            {table.name || `M.${table.number.toString().padStart(2, "0")}`}
          </h3>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            isSelected ? "bg-stone-950/10 text-stone-950" : badge.tone
          }`}
        >
          {badge.label}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <div className={`rounded-2xl px-3 py-2 ${isSelected ? "bg-stone-950/10" : "bg-black/5"}`}>
          <p className={isSelected ? "text-stone-800/70" : "text-stone-500"}>Hesap</p>
          <p className="mt-1 text-base font-bold">
            {table.openBillId ? formatMoney(table.openBillSubtotalMinor, table.openBillCurrencyCode) : "-"}
          </p>
        </div>
        <div className={`rounded-2xl px-3 py-2 ${isSelected ? "bg-stone-950/10" : "bg-black/5"}`}>
          <p className={isSelected ? "text-stone-800/70" : "text-stone-500"}>Hazir / Yeni</p>
          <p className="mt-1 text-base font-bold">
            {table.readyOrderCount} / {table.submittedOrderCount + table.preparingOrderCount}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${tableUrgency(table).tone} ${
            isSelected ? "bg-stone-950/10 text-stone-950" : ""
          }`}
        >
          {tableUrgency(table).label}
        </span>
        {table.openBillId ? (
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isSelected ? "bg-white/10 text-white" : "bg-stone-100 text-stone-700"}`}>
            Hesap acik
          </span>
        ) : null}
      </div>
      </div>
    </button>
  );
}

function FloorZoneTabs({
  current,
  onChange,
  zoneCounts
}: {
  current: FloorZoneKey | "all" | "open";
  onChange: (value: FloorZoneKey | "all" | "open") => void;
  zoneCounts: Record<FloorZoneKey, number>;
}) {
  const tabs: Array<{ id: FloorZoneKey | "all" | "open"; label: string }> = [
    { id: "balkon", label: "Balkon" },
    { id: "salon", label: "Salon" },
    { id: "open", label: "Acik Masalar" },
    { id: "all", label: "Hepsi" }
  ];

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <button
          className={`rounded-sm border px-4 py-2 text-sm font-bold transition ${
            current === tab.id
              ? "border-[#3d5f9c] bg-[#7ca4d8] text-white"
              : "border-[#9eb8d6] bg-[#dce7f5] text-[#21406f]"
          }`}
          key={tab.id}
          onClick={() => onChange(tab.id)}
          type="button"
        >
          {tab.label}
          {tab.id === "salon" || tab.id === "balkon" ? ` (${zoneCounts[tab.id]})` : ""}
        </button>
      ))}
    </div>
  );
}

function FloorLayoutTabs({
  current,
  layoutCounts,
  onChange
}: {
  current: FloorLayoutKey | "all";
  layoutCounts: Record<FloorLayoutKey, number>;
  onChange: (value: FloorLayoutKey | "all") => void;
}) {
  const tabs: Array<{ id: FloorLayoutKey | "all"; label: string }> = [
    { id: "ana-kat", label: "Ana Kat" },
    { id: "balkon", label: "Balkon" },
    { id: "paket", label: "Paket" },
    { id: "all", label: "Hepsi" }
  ];

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <button
          className={`rounded-sm border px-4 py-2 text-sm font-bold transition ${
            current === tab.id
              ? "border-[#3d5f9c] bg-[#7ca4d8] text-white"
              : "border-[#9eb8d6] bg-[#dce7f5] text-[#21406f]"
          }`}
          key={tab.id}
          onClick={() => onChange(tab.id)}
          type="button"
        >
          {tab.label}
          {tab.id !== "all" ? ` (${layoutCounts[tab.id]})` : ""}
        </button>
      ))}
    </div>
  );
}

function LayoutEditorPanel({
  layoutPlacements,
  tableVisuals,
  fixedObjects,
  zonePlacements,
  layout,
  selectedLayout,
  setLayoutPlacements,
  setTableVisuals,
  setFixedObjects,
  setZonePlacements,
  tables
}: {
  layoutPlacements: Record<FloorLayoutKey, Record<string, LayoutPlacement>>;
  tableVisuals: Record<string, TableVisual>;
  fixedObjects: Record<FloorLayoutKey, FixedObjectPlacement[]>;
  zonePlacements: Record<FloorLayoutKey, ZonePlacement[]>;
  layout: FloorLayoutKey | "all";
  selectedLayout: FloorLayoutKey | "all";
  setLayoutPlacements: (
    value:
      | Record<FloorLayoutKey, Record<string, LayoutPlacement>>
      | ((current: Record<FloorLayoutKey, Record<string, LayoutPlacement>>) => Record<FloorLayoutKey, Record<string, LayoutPlacement>>)
  ) => void;
  setTableVisuals: (
    value: Record<string, TableVisual> | ((current: Record<string, TableVisual>) => Record<string, TableVisual>)
  ) => void;
  setFixedObjects: (
    value:
      | Record<FloorLayoutKey, FixedObjectPlacement[]>
      | ((current: Record<FloorLayoutKey, FixedObjectPlacement[]>) => Record<FloorLayoutKey, FixedObjectPlacement[]>)
  ) => void;
  setZonePlacements: (
    value:
      | Record<FloorLayoutKey, ZonePlacement[]>
      | ((current: Record<FloorLayoutKey, ZonePlacement[]>) => Record<FloorLayoutKey, ZonePlacement[]>)
  ) => void;
  tables: AdminTableSummary[];
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [draggingZoneId, setDraggingZoneId] = useState<string | null>(null);
  const [resizingZoneId, setResizingZoneId] = useState<string | null>(null);
  const [resizingTableId, setResizingTableId] = useState<string | null>(null);
  const [draggingObjectId, setDraggingObjectId] = useState<string | null>(null);
  const [resizingObjectId, setResizingObjectId] = useState<string | null>(null);
  const [saveState, saveAction, savePending] = useActionState(
    saveFloorLayoutAction,
    tableActionInitialState
  );
  const items = tables
    .filter((table) => selectedLayout === "all" || inferLayout(table) === selectedLayout)
    .map((table, index) => {
      const layoutKey = selectedLayout === "all" ? inferLayout(table) : selectedLayout;
      const fallbackPlacement = {
        left: 8 + (index % 4) * 22,
        top: 12 + Math.floor(index / 4) * 24
      };
      const placement = layoutPlacements[layoutKey]?.[table.id] ?? fallbackPlacement;
      const visual = tableVisuals[table.id] ?? {
        width: inferZone(table) === "paket" ? 18 : 14,
        height: 14,
        shape: defaultTableShape(inferZone(table))
      };

      return {
        id: table.id,
        label: table.name || `Masa ${table.number}`,
        layoutKey,
        left: placement.left,
        top: placement.top,
        width: visual.width,
        height: visual.height,
        shape: visual.shape,
        rotation: visual.rotation
      };
    });

  function updatePlacement(tableId: string, layoutKey: FloorLayoutKey, left: number, top: number) {
    const visual = tableVisuals[tableId] ?? { width: 14, height: 14, shape: "square" as TableShape };
    setLayoutPlacements((current) => ({
      ...current,
      [layoutKey]: {
        ...current[layoutKey],
        [tableId]: {
          left: Math.max(2, Math.min(96 - visual.width, left)),
          top: Math.max(4, Math.min(94 - visual.height, top))
        }
      }
    }));
  }

  function updateTableVisual(
    tableId: string,
    updates: Partial<TableVisual>,
    placement?: { layoutKey: FloorLayoutKey; left: number; top: number }
  ) {
    setTableVisuals((current) => {
      const next = {
        ...(current[tableId] ?? { width: 14, height: 14, shape: "square" as TableShape }),
        ...updates
      };

      if (placement) {
        setLayoutPlacements((layouts) => ({
          ...layouts,
          [placement.layoutKey]: {
            ...layouts[placement.layoutKey],
            [tableId]: {
              left: Math.max(2, Math.min(96 - next.width, placement.left)),
              top: Math.max(4, Math.min(94 - next.height, placement.top))
            }
          }
        }));
      }

      return {
        ...current,
        [tableId]: next
      };
    });
  }

  function cycleTableShape(tableId: string) {
    const currentShape = tableVisuals[tableId]?.shape ?? "square";
    const nextShape: TableShape =
      currentShape === "square" ? "round" : currentShape === "round" ? "rect" : "square";
    updateTableVisual(tableId, { shape: nextShape });
  }

  function rotateTable(tableId: string) {
    const currentRotation = tableVisuals[tableId]?.rotation ?? 0;
    updateTableVisual(tableId, { rotation: rotateNext(currentRotation) });
  }

  function updateZonePlacement(zoneId: string, layoutKey: FloorLayoutKey, left: number, top: number) {
    setZonePlacements((current) => ({
      ...current,
      [layoutKey]: current[layoutKey].map((zone) =>
        zone.id === zoneId
          ? {
              ...zone,
              left: Math.max(2, Math.min(84, left)),
              top: Math.max(4, Math.min(80, top))
            }
          : zone
      )
    }));
  }

  function updateZoneSize(zoneId: string, layoutKey: FloorLayoutKey, width: number, height: number) {
    setZonePlacements((current) => ({
      ...current,
      [layoutKey]: current[layoutKey].map((zone) =>
        zone.id === zoneId
          ? {
              ...zone,
              width: Math.max(16, Math.min(94 - zone.left, width)),
              height: Math.max(12, Math.min(92 - zone.top, height))
            }
          : zone
      )
    }));
  }

  function addZone() {
    if (selectedLayout === "all") {
      return;
    }

    setZonePlacements((current) => ({
      ...current,
      [selectedLayout]: [
        ...current[selectedLayout],
        {
          id: `${selectedLayout}-zone-${current[selectedLayout].length + 1}`,
          zone: selectedLayout === "balkon" ? "balkon" : selectedLayout === "paket" ? "paket" : "salon",
          layout: selectedLayout,
          left: 12,
          top: 12 + current[selectedLayout].length * 8,
          width: 28,
          height: 18
        }
      ]
    }));
  }

  function addFixedObject(kind: FixedObjectKind) {
    if (selectedLayout === "all") {
      return;
    }

    const meta = fixedObjectMeta(kind);
    setFixedObjects((current) => ({
      ...current,
      [selectedLayout]: [
        ...current[selectedLayout],
        {
          id: `${selectedLayout}-${kind}-${current[selectedLayout].length + 1}`,
          layout: selectedLayout,
          kind,
          label: meta.label,
          left: 14,
          top: 14 + current[selectedLayout].length * 7,
          width: kind === "wall" ? 26 : kind === "service-pass" ? 22 : 16,
          height: kind === "wall" ? 4 : 10,
          rotation: 0
        }
      ]
    }));
  }

  function updateFixedObjectPlacement(
    objectId: string,
    layoutKey: FloorLayoutKey,
    left: number,
    top: number
  ) {
    setFixedObjects((current) => ({
      ...current,
      [layoutKey]: current[layoutKey].map((item) =>
        item.id === objectId
          ? {
              ...item,
              left: Math.max(2, Math.min(96 - item.width, left)),
              top: Math.max(2, Math.min(96 - item.height, top))
            }
          : item
      )
    }));
  }

  function updateFixedObjectSize(
    objectId: string,
    layoutKey: FloorLayoutKey,
    width: number,
    height: number
  ) {
    setFixedObjects((current) => ({
      ...current,
      [layoutKey]: current[layoutKey].map((item) =>
        item.id === objectId
          ? {
              ...item,
              width: Math.max(10, Math.min(96 - item.left, width)),
              height: Math.max(4, Math.min(96 - item.top, height))
            }
          : item
      )
    }));
  }

  function rotateFixedObject(objectId: string, layoutKey: FloorLayoutKey) {
    setFixedObjects((current) => ({
      ...current,
      [layoutKey]: current[layoutKey].map((item) =>
        item.id === objectId
          ? {
              ...item,
              rotation: rotateNext(item.rotation)
            }
          : item
      )
    }));
  }

  const visibleZones =
    selectedLayout === "all"
      ? ([] as ZonePlacement[]).concat(
          zonePlacements["ana-kat"],
          zonePlacements.balkon,
          zonePlacements.paket
        )
      : zonePlacements[selectedLayout];
  const visibleObjects =
    selectedLayout === "all"
      ? ([] as FixedObjectPlacement[]).concat(
          fixedObjects["ana-kat"],
          fixedObjects.balkon,
          fixedObjects.paket
        )
      : fixedObjects[selectedLayout];

  return (
    <section className="rounded-[1.25rem] border border-[#9eb8d6] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">
            Duzenleme Modu
          </p>
          <h3 className="mt-1 text-xl font-bold tracking-tight text-stone-950">
            {layout === "all" ? "Tum layoutlar" : layoutMeta(layout).label} icin editor iskeleti
          </h3>
        </div>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
          MVP
        </span>
      </div>
      <p className="mt-3 text-sm text-stone-600">
        Bu ilk iterasyonda dogru zihinsel modeli kuruyoruz: bir tenant icinde birden fazla layout
        var ve her birinde masa konumlari edit mode ile yonetilecek. Kalici kaydetme sonraki adim.
      </p>

      <div className="mt-5 rounded-[1rem] border border-dashed border-stone-300 bg-[linear-gradient(180deg,#f9fbfe,#edf3fb)] p-4">
        <div className="relative min-h-[24rem] overflow-hidden rounded-[0.9rem] border border-[#c7d7eb] bg-[linear-gradient(90deg,rgba(124,164,216,0.12)_1px,transparent_1px),linear-gradient(rgba(124,164,216,0.12)_1px,transparent_1px)] bg-[size:2rem_2rem]">
          {visibleZones.map((zoneBlock) => (
            <div
              className={`absolute rounded-[1rem] border-2 border-dashed p-3 transition ${
                draggingZoneId === zoneBlock.id
                  ? "border-[#3d5f9c] bg-[#7ca4d8]/25 shadow-lg"
                  : "border-[#7ca4d8]/70 bg-[#7ca4d8]/12"
              }`}
              key={zoneBlock.id}
              onPointerDown={(event) => {
                const canvas = event.currentTarget.parentElement;
                if (!canvas) {
                  return;
                }

                setDraggingZoneId(zoneBlock.id);
                const rect = canvas.getBoundingClientRect();

                const handleMove = (moveEvent: PointerEvent) => {
                  const left = ((moveEvent.clientX - rect.left) / rect.width) * 100 - zoneBlock.width / 2;
                  const top = ((moveEvent.clientY - rect.top) / rect.height) * 100 - zoneBlock.height / 2;
                  updateZonePlacement(zoneBlock.id, zoneBlock.layout, left, top);
                };

                const handleUp = () => {
                  setDraggingZoneId(null);
                  window.removeEventListener("pointermove", handleMove);
                };

                window.addEventListener("pointermove", handleMove);
                window.addEventListener("pointerup", handleUp, { once: true });
              }}
              style={{
                left: `${zoneBlock.left}%`,
                top: `${zoneBlock.top}%`,
                width: `${zoneBlock.width}%`,
                height: `${zoneBlock.height}%`
              }}
            >
              <div className="flex h-full flex-col justify-between">
                <div className="flex items-start justify-between gap-3">
                  <div className="rounded-sm bg-white/80 px-2 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#21406f]">
                    {zoneMeta(zoneBlock.zone).label}
                  </div>
                  <div className="rounded-sm bg-white/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-600">
                    {Math.round(zoneBlock.width)} x {Math.round(zoneBlock.height)}
                  </div>
                </div>
                <button
                  aria-label={`${zoneMeta(zoneBlock.zone).label} boyutunu degistir`}
                  className={`ml-auto h-7 w-7 rounded-sm border border-[#3d5f9c] bg-white/90 text-[#21406f] shadow-sm transition ${
                    resizingZoneId === zoneBlock.id ? "scale-110" : ""
                  }`}
                  onPointerDown={(event) => {
                    event.stopPropagation();
                    const canvas = event.currentTarget.parentElement?.parentElement;
                    if (!canvas) {
                      return;
                    }

                    setResizingZoneId(zoneBlock.id);
                    const rect = canvas.getBoundingClientRect();

                    const handleMove = (moveEvent: PointerEvent) => {
                      const width = ((moveEvent.clientX - rect.left) / rect.width) * 100 - zoneBlock.left;
                      const height = ((moveEvent.clientY - rect.top) / rect.height) * 100 - zoneBlock.top;
                      updateZoneSize(zoneBlock.id, zoneBlock.layout, width, height);
                    };

                    const handleUp = () => {
                      setResizingZoneId(null);
                      window.removeEventListener("pointermove", handleMove);
                    };

                    window.addEventListener("pointermove", handleMove);
                    window.addEventListener("pointerup", handleUp, { once: true });
                  }}
                  type="button"
                >
                  <span className="text-base font-black leading-none">+</span>
                </button>
              </div>
            </div>
          ))}
          {visibleObjects.map((item) => {
            const meta = fixedObjectMeta(item.kind);

            return (
              <div
                className={`absolute border-2 p-3 shadow-sm transition ${meta.className} ${
                  draggingObjectId === item.id ? "shadow-lg ring-2 ring-[#7ca4d8]" : ""
                }`}
                key={item.id}
                onPointerDown={(event) => {
                  const canvas = event.currentTarget.parentElement;
                  if (!canvas) {
                    return;
                  }

                  setDraggingObjectId(item.id);
                  const rect = canvas.getBoundingClientRect();

                  const handleMove = (moveEvent: PointerEvent) => {
                    const left = ((moveEvent.clientX - rect.left) / rect.width) * 100 - item.width / 2;
                    const top = ((moveEvent.clientY - rect.top) / rect.height) * 100 - item.height / 2;
                    updateFixedObjectPlacement(item.id, item.layout, left, top);
                  };

                  const handleUp = () => {
                    setDraggingObjectId(null);
                    window.removeEventListener("pointermove", handleMove);
                  };

                  window.addEventListener("pointermove", handleMove);
                  window.addEventListener("pointerup", handleUp, { once: true });
                }}
                style={{
                  left: `${item.left}%`,
                  top: `${item.top}%`,
                  width: `${item.width}%`,
                  height: `${item.height}%`,
                  transform: `rotate(${item.rotation}deg)`,
                  transformOrigin: "center center"
                }}
              >
                <div className="flex h-full flex-col justify-between gap-2">
                  <div className="text-[11px] font-black uppercase tracking-[0.18em]">
                    {item.label}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <button
                      className="h-7 rounded-sm border border-current bg-white/80 px-2 text-[10px] font-bold uppercase tracking-[0.12em]"
                      onPointerDown={(event) => {
                        event.stopPropagation();
                        rotateFixedObject(item.id, item.layout);
                      }}
                      type="button"
                    >
                      Dondur
                    </button>
                    <button
                      aria-label={`${item.label} boyutunu degistir`}
                      className={`h-7 w-7 rounded-sm border border-current bg-white/80 text-sm font-black ${
                        resizingObjectId === item.id ? "scale-110" : ""
                      }`}
                      onPointerDown={(event) => {
                        event.stopPropagation();
                        const canvas = event.currentTarget.parentElement?.parentElement?.parentElement;
                        if (!canvas) {
                          return;
                        }

                        setResizingObjectId(item.id);
                        const rect = canvas.getBoundingClientRect();

                        const handleMove = (moveEvent: PointerEvent) => {
                          const width = ((moveEvent.clientX - rect.left) / rect.width) * 100 - item.left;
                          const height = ((moveEvent.clientY - rect.top) / rect.height) * 100 - item.top;
                          updateFixedObjectSize(item.id, item.layout, width, height);
                        };

                        const handleUp = () => {
                          setResizingObjectId(null);
                          window.removeEventListener("pointermove", handleMove);
                        };

                        window.addEventListener("pointermove", handleMove);
                        window.addEventListener("pointerup", handleUp, { once: true });
                      }}
                      type="button"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {items.map((item) => (
            <div
              className={`absolute flex cursor-move select-none items-center justify-center border-2 border-[#534449] bg-[#fff6cf] text-center text-sm font-black text-stone-950 shadow-sm transition ${shapeClassForTable(item.shape)} ${
                draggingId === item.id ? "scale-105 shadow-lg ring-2 ring-[#7ca4d8]" : ""
              }`}
              key={item.id}
              onPointerDown={(event) => {
                const canvas = event.currentTarget.parentElement;
                if (!canvas) {
                  return;
                }

                setDraggingId(item.id);
                const rect = canvas.getBoundingClientRect();

                const handleMove = (moveEvent: PointerEvent) => {
                  const left = ((moveEvent.clientX - rect.left) / rect.width) * 100 - item.width / 2;
                  const top = ((moveEvent.clientY - rect.top) / rect.height) * 100 - item.height / 2;
                  updatePlacement(item.id, item.layoutKey, left, top);
                };

                const handleUp = () => {
                  setDraggingId(null);
                  window.removeEventListener("pointermove", handleMove);
                };

                window.addEventListener("pointermove", handleMove);
                window.addEventListener("pointerup", handleUp, { once: true });
              }}
              style={{
                left: `${item.left}%`,
                top: `${item.top}%`,
                width: `${item.width}%`,
                height: `${item.height}%`,
                transform: `rotate(${item.rotation}deg)`,
                transformOrigin: "center center"
              }}
            >
              <div className="pointer-events-none px-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                  {item.shape}
                </div>
                <div>{item.label}</div>
              </div>
              <div className="absolute inset-x-2 bottom-2 flex items-center justify-between gap-2">
                <button
                  className="z-10 h-7 rounded-sm border border-[#3d5f9c] bg-white/90 px-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#21406f]"
                  onPointerDown={(event) => {
                    event.stopPropagation();
                    cycleTableShape(item.id);
                  }}
                  type="button"
                >
                  Sekil
                </button>
                <button
                  className="z-10 h-7 rounded-sm border border-[#3d5f9c] bg-white/90 px-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#21406f]"
                  onPointerDown={(event) => {
                    event.stopPropagation();
                    rotateTable(item.id);
                  }}
                  type="button"
                >
                  Dondur
                </button>
                <button
                  aria-label={`${item.label} boyutunu degistir`}
                  className={`z-10 h-7 w-7 rounded-sm border border-[#3d5f9c] bg-white/90 text-[#21406f] shadow-sm transition ${
                    resizingTableId === item.id ? "scale-110" : ""
                  }`}
                  onPointerDown={(event) => {
                    event.stopPropagation();
                    const canvas = event.currentTarget.parentElement?.parentElement;
                    if (!canvas) {
                      return;
                    }

                    setResizingTableId(item.id);
                    const rect = canvas.getBoundingClientRect();

                    const handleMove = (moveEvent: PointerEvent) => {
                      const width = Math.max(10, ((moveEvent.clientX - rect.left) / rect.width) * 100 - item.left);
                      const height = Math.max(10, ((moveEvent.clientY - rect.top) / rect.height) * 100 - item.top);
                      updateTableVisual(
                        item.id,
                        {
                          width: Math.min(26, width),
                          height: Math.min(26, height)
                        },
                        { layoutKey: item.layoutKey, left: item.left, top: item.top }
                      );
                    };

                    const handleUp = () => {
                      setResizingTableId(null);
                      window.removeEventListener("pointermove", handleMove);
                    };

                    window.addEventListener("pointermove", handleMove);
                    window.addEventListener("pointerup", handleUp, { once: true });
                  }}
                  type="button"
                >
                  <span className="text-base font-black leading-none">+</span>
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700"
            type="button"
          >
            Masa ekle
          </button>
          <button
            className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700"
            onClick={addZone}
            type="button"
          >
            Zone ekle
          </button>
          <button
            className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700"
            onClick={() => addFixedObject("cashier")}
            type="button"
          >
            Kasa bankosu
          </button>
          <button
            className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700"
            onClick={() => addFixedObject("service-pass")}
            type="button"
          >
            Servis alani
          </button>
          <button
            className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700"
            onClick={() => addFixedObject("wc")}
            type="button"
          >
            WC
          </button>
          <button
            className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700"
            onClick={() => addFixedObject("entrance")}
            type="button"
          >
            Giris
          </button>
          <button
            className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700"
            onClick={() => addFixedObject("wall")}
            type="button"
          >
            Duvar
          </button>
          <form action={saveAction}>
            <input
              name="layoutPayload"
              type="hidden"
              value={JSON.stringify(
                (Object.keys(layoutPlacements) as FloorLayoutKey[]).flatMap((layoutKey) =>
                  Object.entries(layoutPlacements[layoutKey]).map(([tableId, placement]) => ({
                    tableId,
                    layoutCode: layoutKey,
                    layoutX: Math.round(placement.left),
                    layoutY: Math.round(placement.top)
                  }))
                )
              )}
            />
            <input
              name="floorLayoutJson"
              type="hidden"
              value={JSON.stringify({
                zones: zonePlacements,
                tables: tableVisuals,
                objects: fixedObjects
              })}
            />
            <button
              className="rounded-full bg-[#16392e] px-4 py-2 text-sm font-semibold text-white"
              disabled={savePending}
              type="submit"
            >
              Duzeni kaydet
            </button>
          </form>
        </div>
        {saveState.message ? (
          <p className={`mt-4 text-sm ${saveState.ok ? "text-emerald-700" : "text-rose-700"}`}>
            {saveState.message}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function FloorPlanBoard({
  editMode,
  layoutPlacements,
  tableVisuals,
  fixedObjects,
  zonePlacements,
  selectedLayout,
  selectedTable,
  selectedZone,
  setEditMode,
  setLayoutPlacements,
  setTableVisuals,
  setFixedObjects,
  setZonePlacements,
  setSelectedLayout,
  setSelectedTableId,
  setSelectedZone,
  tables
}: {
  editMode: boolean;
  layoutPlacements: Record<FloorLayoutKey, Record<string, LayoutPlacement>>;
  tableVisuals: Record<string, TableVisual>;
  fixedObjects: Record<FloorLayoutKey, FixedObjectPlacement[]>;
  zonePlacements: Record<FloorLayoutKey, ZonePlacement[]>;
  selectedLayout: FloorLayoutKey | "all";
  selectedTable?: AdminTableSummary;
  selectedZone: FloorZoneKey | "all" | "open";
  setEditMode: (value: boolean) => void;
  setLayoutPlacements: (
    value:
      | Record<FloorLayoutKey, Record<string, LayoutPlacement>>
      | ((current: Record<FloorLayoutKey, Record<string, LayoutPlacement>>) => Record<FloorLayoutKey, Record<string, LayoutPlacement>>)
  ) => void;
  setTableVisuals: (
    value: Record<string, TableVisual> | ((current: Record<string, TableVisual>) => Record<string, TableVisual>)
  ) => void;
  setFixedObjects: (
    value:
      | Record<FloorLayoutKey, FixedObjectPlacement[]>
      | ((current: Record<FloorLayoutKey, FixedObjectPlacement[]>) => Record<FloorLayoutKey, FixedObjectPlacement[]>)
  ) => void;
  setZonePlacements: (
    value:
      | Record<FloorLayoutKey, ZonePlacement[]>
      | ((current: Record<FloorLayoutKey, ZonePlacement[]>) => Record<FloorLayoutKey, ZonePlacement[]>)
  ) => void;
  setSelectedLayout: (value: FloorLayoutKey | "all") => void;
  setSelectedTableId: (value: string) => void;
  setSelectedZone: (value: FloorZoneKey | "all" | "open") => void;
  tables: AdminTableSummary[];
}) {
  const zoneCounts = tables.reduce<Record<FloorZoneKey, number>>(
    (acc, table) => {
      acc[inferZone(table)] += 1;
      return acc;
    },
    { salon: 0, balkon: 0, paket: 0 }
  );

  const filteredTables = tables.filter((table) => {
    if (selectedLayout !== "all" && inferLayout(table) !== selectedLayout) {
      return false;
    }
    if (selectedZone === "all") {
      return true;
    }
    if (selectedZone === "open") {
      return Boolean(table.openBillId);
    }
    return inferZone(table) === selectedZone;
  });

  const grouped = {
    salon: filteredTables.filter((table) => inferZone(table) === "salon"),
    balkon: filteredTables.filter((table) => inferZone(table) === "balkon"),
    paket: filteredTables.filter((table) => inferZone(table) === "paket")
  };

  const sections: FloorZoneKey[] =
    selectedZone === "all" || selectedZone === "open"
      ? ["balkon", "salon", "paket"]
      : [selectedZone];
  const layoutCounts = tables.reduce<Record<FloorLayoutKey, number>>(
    (acc, table) => {
      acc[inferLayout(table)] += 1;
      return acc;
    },
    { "ana-kat": 0, balkon: 0, paket: 0 }
  );

  return (
    <section className="rounded-[1.25rem] border border-[#9eb8d6] bg-[#edf3fb] p-3 shadow-sm">
      <div className="border border-[#7ca4d8] bg-[#7ca4d8] px-3 py-2 text-sm font-bold text-white">
        Masalar
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <FloorLayoutTabs current={selectedLayout} layoutCounts={layoutCounts} onChange={setSelectedLayout} />
        <button
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            editMode
              ? "bg-[#16392e] text-white"
              : "border border-stone-300 bg-white text-stone-700"
          }`}
          onClick={() => setEditMode(!editMode)}
          type="button"
        >
          {editMode ? "Operasyon Modu" : "Duzeni Duzenle"}
        </button>
      </div>
      <FloorZoneTabs current={selectedZone} onChange={setSelectedZone} zoneCounts={zoneCounts} />
      {editMode ? (
        <div className="mt-4">
          <LayoutEditorPanel
            layout={selectedLayout}
            layoutPlacements={layoutPlacements}
            tableVisuals={tableVisuals}
            fixedObjects={fixedObjects}
            zonePlacements={zonePlacements}
            selectedLayout={selectedLayout}
            setLayoutPlacements={setLayoutPlacements}
            setTableVisuals={setTableVisuals}
            setFixedObjects={setFixedObjects}
            setZonePlacements={setZonePlacements}
            tables={tables}
          />
        </div>
      ) : null}
      <div className="mt-3 space-y-4">
        {sections.map((section) => {
          const meta = zoneMeta(section);
          const sectionTables = grouped[section];

          return (
            <section className={`rounded-md border p-4 ${meta.panel}`} key={section}>
              <div className="flex items-center justify-between gap-3">
                <div className={`rounded-sm px-3 py-1 text-xs font-black uppercase tracking-[0.18em] ${meta.tone}`}>
                  {meta.label}
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-700">
                  {sectionTables.length} masa
                </p>
              </div>
              <div
                className={`mt-4 grid gap-4 ${
                  section === "salon"
                    ? "grid-cols-2 md:grid-cols-3 xl:grid-cols-4"
                    : "grid-cols-2 md:grid-cols-3"
                }`}
              >
                {sectionTables.length === 0 ? (
                  <div className="rounded-md border border-dashed border-stone-400/40 bg-white/40 px-4 py-8 text-center text-sm text-stone-600">
                    Bu alanda gorunecek masa yok.
                  </div>
                ) : (
                  sectionTables.map((table) => (
                    <FloorTableCard
                      isSelected={selectedTable?.id === table.id}
                      key={table.id}
                      onSelect={() => setSelectedTableId(table.id)}
                      shape={tableVisuals[table.id]?.shape ?? defaultTableShape(inferZone(table))}
                      table={table}
                      zone={section}
                    />
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}

function ShiftSnapshot({
  bills,
  tables
}: {
  bills: CustomerBillSummary[];
  tables: AdminTableSummary[];
}) {
  const activeTables = tables.filter((table) => table.isActive).length;
  const urgentTables = tables.filter(
    (table) => table.readyOrderCount > 0 || !table.deviceOnline
  ).length;
  const grossMinor = bills
    .filter((bill) => bill.status === "open")
    .reduce((sum, bill) => sum + bill.subtotalMinor, 0);

  return (
    <section className="mt-6 grid gap-4 lg:grid-cols-4">
      <article className="rounded-[1.5rem] border border-stone-200 bg-white/90 p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">Serviste masa</p>
        <p className="mt-3 text-3xl font-bold tracking-tight text-stone-950">{activeTables}</p>
      </article>
      <article className="rounded-[1.5rem] border border-stone-200 bg-white/90 p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">Acil masa</p>
        <p className="mt-3 text-3xl font-bold tracking-tight text-stone-950">{urgentTables}</p>
      </article>
      <article className="rounded-[1.5rem] border border-stone-200 bg-white/90 p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">Acik hesap</p>
        <p className="mt-3 text-3xl font-bold tracking-tight text-stone-950">
          {bills.filter((bill) => bill.status === "open").length}
        </p>
      </article>
      <article className="rounded-[1.5rem] border border-stone-200 bg-white/90 p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">Acik ciro</p>
        <p className="mt-3 text-3xl font-bold tracking-tight text-stone-950">
          {formatMoney(grossMinor, bills[0]?.currencyCode ?? "GBP")}
        </p>
      </article>
    </section>
  );
}

function PaymentQueue({
  bills
}: {
  bills: CustomerBillSummary[];
}) {
  return (
    <section className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">
        Payment Queue
      </p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight">Kapatilmaya hazir hesaplar</h2>
      <div className="mt-5 grid gap-3">
        {bills.length === 0 ? (
          <p className="rounded-2xl bg-stone-50 px-4 py-4 text-sm text-stone-600">
            Acik hesap kuyrugu bos.
          </p>
        ) : (
          bills.map((bill) => (
            <div
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-stone-50 px-4 py-4"
              key={bill.id}
            >
              <div>
                <p className="font-semibold text-stone-950">
                  Masa {bill.tableNumber.toString().padStart(3, "0")} • {bill.tableName}
                </p>
                <p className="mt-1 text-sm text-stone-600">
                  {formatMoney(bill.subtotalMinor, bill.currencyCode)} • {bill.orderCount} siparis
                </p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-stone-700">
                {bill.status}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function FloorCashTabs({
  current,
  onChange
}: {
  current: FloorCashView;
  onChange: (view: FloorCashView) => void;
}) {
  const tabs: Array<{ id: FloorCashView; label: string }> = [
    { id: "floor", label: "Floor" },
    { id: "open-checks", label: "Open Checks" },
    { id: "payment-queue", label: "Payment Queue" },
    { id: "closed-checks", label: "Closed Checks" }
  ];

  return (
    <div className="mt-6 flex flex-wrap gap-3">
      {tabs.map((tab) => (
        <button
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            current === tab.id
              ? "bg-[#16392e] text-white"
              : "border border-stone-300 bg-white text-stone-700 hover:border-stone-950 hover:text-stone-950"
          }`}
          key={tab.id}
          onClick={() => onChange(tab.id)}
          type="button"
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function ChecksPanel({
  bills,
  mode
}: {
  bills: CustomerBillSummary[];
  mode: "open" | "closed";
}) {
  return (
    <section className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">
        {mode === "open" ? "Open Checks" : "Closed Checks"}
      </p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight">
        {mode === "open" ? "Acilik ve kapanis bekleyen hesaplar" : "Kapanan hesap gecmisi"}
      </h2>
      <div className="mt-5 grid gap-3">
        {bills.length === 0 ? (
          <p className="rounded-2xl bg-stone-50 px-4 py-4 text-sm text-stone-600">
            {mode === "open" ? "Acik hesap yok." : "Kapanmis hesap kaydi yok."}
          </p>
        ) : (
          bills.map((bill) => (
            <article
              className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4"
              key={bill.id}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-stone-950">
                    Masa {bill.tableNumber.toString().padStart(3, "0")} • {bill.tableName}
                  </p>
                  <p className="mt-1 text-sm text-stone-600">
                    {formatMoney(bill.subtotalMinor, bill.currencyCode)} • {bill.orderCount} siparis
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    mode === "open"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-stone-200 text-stone-700"
                  }`}
                >
                  {bill.status}
                </span>
              </div>

              <div className="mt-4 grid gap-2 text-sm text-stone-600 sm:grid-cols-3">
                <p>Acilis: {formatDateTime(bill.openedAt)}</p>
                <p>Kapanis: {formatDateTime(bill.closedAt)}</p>
                <p>Kayit: #{bill.id.slice(0, 8)}</p>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function MoveMergePanel({ table }: { table: AdminTableSummary }) {
  return (
    <section className="rounded-[1.5rem] border border-dashed border-stone-300 bg-stone-50 px-4 py-4">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">
        Masa Hareketleri
      </p>
      <p className="mt-2 text-sm text-stone-700">
        Masa {table.number.toString().padStart(3, "0")} icin tasima ve birlestirme akisi bu sprintte
        gorunur hale getirildi. Bir sonraki backend adiminda secili hedef masa ile islenecek.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700"
          type="button"
        >
          Masayi tasi
        </button>
        <button
          className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700"
          type="button"
        >
          Masalari birlestir
        </button>
      </div>
    </section>
  );
}

function ActionRail({
  queueBills,
  tables
}: {
  queueBills: CustomerBillSummary[];
  tables: AdminTableSummary[];
}) {
  const urgentTables = tables.filter((table) => table.readyOrderCount > 0 || !table.deviceOnline);

  return (
    <section className="rounded-[1.75rem] border border-stone-200 bg-white/90 p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">
            Operasyon Nabzi
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">Hemen aksiyon gerektirenler</h2>
        </div>
      </div>
      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <div className="rounded-[1.5rem] bg-stone-50 p-4">
          <p className="text-sm font-semibold text-stone-950">Servis / cihaz aksiyonu</p>
          <div className="mt-3 grid gap-2">
            {urgentTables.length === 0 ? (
              <p className="text-sm text-stone-600">Acil masa yok.</p>
            ) : (
              urgentTables.slice(0, 5).map((table) => (
                <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3" key={table.id}>
                  <div>
                    <p className="font-semibold text-stone-950">
                      Masa {table.number.toString().padStart(3, "0")} • {table.name}
                    </p>
                    <p className="mt-1 text-sm text-stone-600">{tableUrgency(table).label}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tableUrgency(table).tone}`}>
                    Aksiyon
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="rounded-[1.5rem] bg-stone-50 p-4">
          <p className="text-sm font-semibold text-stone-950">Kapanis kuyrugu</p>
          <div className="mt-3 grid gap-2">
            {queueBills.length === 0 ? (
              <p className="text-sm text-stone-600">Kapanisa hazir hesap yok.</p>
            ) : (
              queueBills.slice(0, 5).map((bill) => (
                <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3" key={bill.id}>
                  <div>
                    <p className="font-semibold text-stone-950">
                      Masa {bill.tableNumber.toString().padStart(3, "0")} • {bill.tableName}
                    </p>
                    <p className="mt-1 text-sm text-stone-600">
                      {formatMoney(bill.subtotalMinor, bill.currencyCode)} • {bill.orderCount} siparis
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                    Tahsilat
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function SelectedTablePanel({
  bill,
  device,
  orders,
  table
}: {
  bill?: CustomerBillSummary;
  device?: AdminDevice;
  orders: CustomerOrderSummary[];
  table: AdminTableSummary;
}) {
  const [state, action, pending] = useActionState(closeBillAction, initialState);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("nakit");

  return (
    <aside className="rounded-[0.75rem] border border-[#9eb8d6] bg-[#eef4fb] p-3 shadow-sm">
      <div className="border border-[#7ca4d8] bg-[#7ca4d8] px-3 py-2 text-sm font-bold text-white">
        Adisyon
      </div>
      <div className="mt-3 rounded-md border border-[#c7d7eb] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
            Secili masa
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-stone-950">
            Masa {table.number.toString().padStart(3, "0")}
          </h2>
          <p className="mt-2 text-sm text-stone-600">{table.name}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(table).tone}`}>
          {statusBadge(table).label}
        </span>
      </div>

      <div className="mt-5 grid gap-3">
        <div className="rounded-2xl bg-stone-50 px-4 py-4">
          <p className="text-sm font-semibold text-stone-950">Acik adisyon</p>
          <p className="mt-1 text-lg font-bold text-stone-950">
            {bill ? formatMoney(bill.subtotalMinor, bill.currencyCode) : "Yok"}
          </p>
          <p className="mt-1 text-sm text-stone-600">
            {bill ? `${bill.orderCount} siparis • ${formatDateTime(bill.openedAt)}` : "Bu masada acik hesap yok."}
          </p>
        </div>

        <div className="rounded-2xl bg-stone-50 px-4 py-4">
          <p className="text-sm font-semibold text-stone-950">Cihaz / QR durumu</p>
          <p className="mt-1 text-sm text-stone-600">
            {device
              ? device.deviceOnline
                ? "Cihaz online, masa QR akisi canli."
                : "Cihaz offline, takip gerektiriyor."
              : "Bu masa icin cihaz kaydi bulunmuyor."}
          </p>
        </div>

        <div className="rounded-2xl bg-stone-50 px-4 py-4">
          <p className="text-sm font-semibold text-stone-950">Odeme durumu</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Durum
              </p>
              <p className="mt-1 text-sm text-stone-700">
                {bill ? "Tahsilat bekliyor" : "Kapanacak hesap yok"}
              </p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Yontem
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(["nakit", "kart", "transfer", "diger"] as PaymentMethod[]).map((option) => (
                  <button
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      paymentMethod === option
                        ? "bg-[#16392e] text-white"
                        : "bg-stone-100 text-stone-700"
                    }`}
                    key={option}
                    onClick={() => setPaymentMethod(option)}
                    type="button"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs text-stone-500">
            Odeme yontemi simdilik operasyon notu niteliginde. Tahsilat manuel alinip hesap kapatilir.
          </p>
        </div>

        <div className="rounded-2xl bg-stone-50 px-4 py-4">
          <p className="text-sm font-semibold text-stone-950">Canli siparisler</p>
          <div className="mt-3 grid gap-2">
            {orders.length === 0 ? (
              <p className="text-sm text-stone-600">Bu masaya bagli canli siparis yok.</p>
            ) : (
              orders.slice(0, 4).map((order) => (
                <div className="rounded-2xl bg-white px-4 py-3" key={order.id}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-stone-950">Siparis #{order.id.slice(0, 8)}</p>
                    <span className="text-xs text-stone-500">{order.status}</span>
                  </div>
                  <p className="mt-1 text-sm text-stone-600">
                    {formatMoney(order.subtotalMinor, order.currencyCode)} • {formatDateTime(order.updatedAt)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        <MoveMergePanel table={table} />

        {bill ? (
          <form action={action}>
            <input name="billId" type="hidden" value={bill.id} />
            <div className="grid gap-3">
              <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-4 py-4">
                <p className="text-sm font-semibold text-emerald-900">Kapanis ozetı</p>
                <p className="mt-2 text-sm text-emerald-900">
                  {formatMoney(bill.subtotalMinor, bill.currencyCode)} tutarli hesap manuel olarak{" "}
                  <span className="font-semibold">{paymentMethod}</span> ile tahsil edildi olarak kapanacak.
                </p>
              </div>
              <button
                className="w-full rounded-full bg-[#16392e] px-4 py-3 text-sm font-semibold text-white"
                disabled={pending}
                type="submit"
              >
                Odeme alindi ve hesap kapat
              </button>
            </div>
          </form>
        ) : null}

        {state.message ? (
          <p className={`text-sm ${state.ok ? "text-emerald-700" : "text-rose-700"}`}>
            {state.message}
          </p>
        ) : null}
      </div>
      </div>
    </aside>
  );
}

export function FloorCashWorkspace({
  bills,
  devices,
  floorLayoutJson,
  orders,
  tables
}: {
  bills: CustomerBillSummary[];
  devices: AdminDevice[];
  floorLayoutJson?: string | null;
  orders: CustomerOrderSummary[];
  tables: AdminTableSummary[];
}) {
  const floorLayoutDocument = useMemo(() => parseFloorLayoutDocument(floorLayoutJson), [floorLayoutJson]);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(tables[0]?.id ?? null);
  const [view, setView] = useState<FloorCashView>("floor");
  const [selectedZone, setSelectedZone] = useState<FloorZoneKey | "all" | "open">("all");
  const [selectedLayout, setSelectedLayout] = useState<FloorLayoutKey | "all">("all");
  const [editMode, setEditMode] = useState(false);
  const [layoutPlacements, setLayoutPlacements] = useState<
    Record<FloorLayoutKey, Record<string, LayoutPlacement>>
  >(() => createInitialLayoutPlacements(tables));
  const [tableVisuals, setTableVisuals] = useState<Record<string, TableVisual>>(() =>
    createInitialTableVisuals(tables, floorLayoutDocument ?? undefined)
  );
  const [fixedObjects, setFixedObjects] = useState<Record<FloorLayoutKey, FixedObjectPlacement[]>>(
    () => createFixedObjectsFromDocument(floorLayoutDocument)
  );
  const [zonePlacements, setZonePlacements] = useState<Record<FloorLayoutKey, ZonePlacement[]>>(
    () => createZonePlacementsFromDocument(floorLayoutDocument)
  );

  const selectedTable = tables.find((table) => table.id === selectedTableId) ?? tables[0];
  const selectedBill = bills.find((bill) => bill.tableId === selectedTable?.id && bill.status === "open");
  const selectedDevice = devices.find((device) => device.tableId === selectedTable?.id);
  const selectedOrders = useMemo(
    () => orders.filter((order) => order.tableId === selectedTable?.id),
    [orders, selectedTable?.id]
  );
  const openBills = bills.filter((bill) => bill.status === "open");
  const closedBills = bills.filter((bill) => bill.status !== "open");
  const queueBills = [...openBills].sort((a, b) => a.openedAt.localeCompare(b.openedAt));
  const floorTables = [...tables].sort((a, b) => {
    const score = (table: AdminTableSummary) =>
      Number(!table.deviceOnline) * 5 +
      Number(table.readyOrderCount > 0) * 4 +
      (table.preparingOrderCount + table.submittedOrderCount > 0 ? 3 : 0) +
      Number(Boolean(table.openBillId));
    return score(b) - score(a) || a.number - b.number;
  });

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#f0e0bd,transparent_28rem),radial-gradient(circle_at_bottom_right,#dce7f0,transparent_30rem),linear-gradient(135deg,#f6f1e7,#e6e1d6)] px-6 py-8 text-stone-950">
      <section className="mx-auto max-w-7xl">
        <section className="rounded-[0.75rem] border border-[#8fb0db] bg-[linear-gradient(180deg,#7ea8d9,#6492cb)] p-6 text-white shadow-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-blue-100">
            Masa + Kasa
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">Masa duzeni, adisyon ve kasa akisi</h1>
          <p className="mt-4 max-w-4xl text-base leading-7 text-blue-50">
            AKINSOFT benzeri masa plani mantigini modern operasyon paneline ceviriyoruz:
            salon sekmeleri, masa yerlesimi, sag adisyon alani ve altta kapanis takibi.
          </p>
        </section>

        <ShiftSnapshot bills={bills} tables={tables} />

        <FloorCashTabs current={view} onChange={setView} />

        {view === "floor" ? (
          <section className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_0.78fr]">
            <FloorPlanBoard
              editMode={editMode}
              layoutPlacements={layoutPlacements}
              tableVisuals={tableVisuals}
              fixedObjects={fixedObjects}
              zonePlacements={zonePlacements}
              selectedLayout={selectedLayout}
              selectedTable={selectedTable}
              selectedZone={selectedZone}
              setEditMode={setEditMode}
              setLayoutPlacements={setLayoutPlacements}
              setTableVisuals={setTableVisuals}
              setFixedObjects={setFixedObjects}
              setZonePlacements={setZonePlacements}
              setSelectedLayout={setSelectedLayout}
              setSelectedTableId={setSelectedTableId}
              setSelectedZone={setSelectedZone}
              tables={floorTables}
            />

            {selectedTable ? (
              <SelectedTablePanel
                bill={selectedBill}
                device={selectedDevice}
                orders={selectedOrders}
                table={selectedTable}
              />
            ) : null}
          </section>
        ) : null}

        {view === "floor" ? (
          <section className="mt-6">
            <ActionRail queueBills={queueBills} tables={tables} />
          </section>
        ) : null}

        {view === "open-checks" ? (
          <section className="mt-6">
            <ChecksPanel bills={openBills} mode="open" />
          </section>
        ) : null}

        {view === "payment-queue" ? (
          <section className="mt-6">
            <PaymentQueue bills={queueBills} />
          </section>
        ) : null}

        {view === "closed-checks" ? (
          <section className="mt-6">
            <ChecksPanel bills={closedBills} mode="closed" />
          </section>
        ) : null}
      </section>
    </main>
  );
}
