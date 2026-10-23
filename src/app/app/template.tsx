import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/data";
import { homeFor, tabForPath, tabsForRole } from "@/lib/appNav";

// Route guard per role. A template (unlike the layout) renders again on every navigation inside /app.
// The path comes from the proxy (x-pathname). RLS still protects the data itself.
export default async function AppTemplate({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const tab = tabForPath((await headers()).get("x-pathname") ?? "");
  if (user.role && tab && !tabsForRole(user.role).includes(tab)) redirect(homeFor(user.role));
  return children;
}
