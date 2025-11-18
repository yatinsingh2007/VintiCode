import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function NotFoundPage() {
  const cookieStore = await cookies()
  const authToken = cookieStore.get("token")?.value;
  if (authToken) {
    redirect("/dashboard/home");
  } else {
    redirect("/login");
  }
}