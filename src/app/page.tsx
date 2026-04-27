import { currentOrg } from "@/lib/tenancy";
import OrgLanding from "@/components/landings/OrgLanding";
import ApexLanding from "@/components/landings/ApexLanding";

/**
 * Apex (qdx.one): marketing site for the SaaS.
 * Subdomain (slug.qdx.one): the org's branded "you're hiring" page.
 */
export default async function Home() {
  const org = await currentOrg();
  if (org) return <OrgLanding org={org} />;
  return <ApexLanding />;
}
