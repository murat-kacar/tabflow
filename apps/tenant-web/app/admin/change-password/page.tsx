import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function LegacyTenantChangePasswordPage() {
  redirect("/change-password");
}
