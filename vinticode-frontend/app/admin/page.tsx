import { redirect } from "next/navigation";

// Redirect /admin → /admin/dashboard
export default function AdminRootPage() {
  redirect("/admin/dashboard");
}
