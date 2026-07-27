import { redirect } from "next/navigation";

/** Folded into the unified Requests queue. */
export default function TimeOffRedirect() {
  redirect("/admin/schedule/requests");
}
