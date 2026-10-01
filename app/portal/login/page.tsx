import {
  redirect,
} from "next/navigation";

import {
  createClient,
} from "@/lib/supabase/server";

import PortalLoginForm from "@/components/portal/PortalLoginForm";

export const dynamic =
  "force-dynamic";

export default async function PortalLoginPage() {
  const supabase =
    await createClient();

  const {
    data: {
      user,
    },
  } =
    await supabase.auth.getUser();

  if (user) {
    redirect(
      "/portal"
    );
  }

  return (
    <PortalLoginForm />
  );
}