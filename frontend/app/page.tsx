import { redirect } from "next/navigation";

export default function RootPage() {
  // Sign-in is the front door; a successful (mock) sign-in enters the portal.
  redirect("/login");
}
