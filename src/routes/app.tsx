// Authenticated app shell with sidebar layout.
import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/AppSidebar";
import { Logo } from "@/components/Logo";
import type { Session } from "@supabase/supabase-js";

export const Route = createFileRoute("/app")({ component: AppLayout });

function AppLayout() {
  const nav = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // A single source of truth for auth state on mount and updates
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setReady(true);

      if (!currentSession) {
        nav({ to: "/auth" });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [nav]);

  useEffect(() => {
    if (!session?.user?.id) return;
    refreshCredits();

    // Realtime: keep profile credits fresh instantly
    const ch = supabase
      .channel("profile-credits")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${session.user.id}` },
        (p: any) => setCredits(p.new.credits),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [session?.user?.id]);

  async function refreshCredits() {
    if (!session?.user?.id) return;
    const { data } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", session.user.id)
      .single();
    if (data) setCredits(data.credits);
  }

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Logo />
      </div>
    );
  }

  // Double check safety if someone tries to render children while navigating out
  if (!session) return null;

  return (
    <div className="flex min-h-screen">
      <AppSidebar credits={credits} />
      <main className="flex-1 overflow-x-hidden">
        <div className="md:hidden glass border-b px-4 py-3">
          <Logo size="sm" />
        </div>
        <Outlet />
      </main>
    </div>
  );
}