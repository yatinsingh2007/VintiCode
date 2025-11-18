import { redirect } from "next/navigation";
import api from "@/lib/axios";

export default async function NotFoundPage() {
  const resp = await api.get("/auth/verify" , {
    withCredentials : true
  });

  if (resp.data.authenticated) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}