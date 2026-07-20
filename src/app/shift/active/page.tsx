import { redirect } from "next/navigation";
// This route is no longer used — the combined shift page is at /shift
export default function ActiveShiftRedirect() {
  redirect("/shift");
}
