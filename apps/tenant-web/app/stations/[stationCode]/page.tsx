import { notFound, redirect } from "next/navigation";
import { KitchenBoard } from "../../components/kitchen-board";
import { getDictionary } from "../../i18n/server";
import { getKitchenBoard } from "../../lib/tenant-api";
import { getTenantSession } from "../../lib/tenant-session";

export const dynamic = "force-dynamic";

export default async function TenantStationBoardPage({
  params
}: {
  params: Promise<{ stationCode: string }>;
}) {
  const session = await getTenantSession();

  if (!session) {
    redirect("/login");
  }

  if (session.mustChangePassword) {
    redirect("/change-password");
  }

  const { stationCode } = await params;
  const [boards, t] = await Promise.all([getKitchenBoard(session), getDictionary()]);
  const filteredBoards = boards.filter((board) => board.stationCode === stationCode);

  if (filteredBoards.length === 0) {
    notFound();
  }

  return (
    <KitchenBoard boards={filteredBoards} focusedStationCode={stationCode} t={t.kitchenBoard} />
  );
}
