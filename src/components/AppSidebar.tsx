// Sidebar for the authenticated app shell - Pricing removed, daily limit tracker integrated
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Sparkles, LogOut,
} from "lucide-react";
import { Logo } from "./Logo";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/generate", label: "Generate", icon: Sparkles },
];

interface AppSidebarProps {
  credits: number | null;
}

export function AppSidebar({ credits }: AppSidebarProps) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [todayCount, setTodayCount] = useState<number>(0);

  const fetchDailyUsage = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const { count } = await supabase
        .from("generated_images")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", startOfDay.toISOString());

      setTodayCount(count ?? 0);
    } catch (error) {
      console.error("Error fetching daily usage stats:", error);
    }
  };

  useEffect(() => {
    fetchDailyUsage();

    // Listen for new generations to update the daily limit bar completely live
    const imageSubscription = supabase
      .channel("sidebar-generation-sync")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "generated_images" },
        () => {
          fetchDailyUsage();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(imageSubscription);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      await navigate({ to: "/auth", replace: true });
    } catch (error) {
      console.error("Error signing out:", error);
      window.location.replace("/auth");
    }
  };

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar/60 backdrop-blur-xl p-4">
      <div className="px-2 py-2"><Logo /></div>

      <nav className="mt-6 flex flex-col gap-1">
        {nav.map(({ to, label, icon: Icon }) => {
          const active = path === to || path.startsWith(to + "/");
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all",
                active
                  ? "gradient-bg text-white glow-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              )}
            >
              <Icon size={18} /> {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3">
        <div className="glass rounded-2xl p-4">
          <div className="text-xs text-muted-foreground">Daily generations</div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-bold gradient-text">{todayCount}</span>
            <span className="text-xs text-muted-foreground">/ 10 used</span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
            <div 
              className="h-full gradient-bg transition-all duration-300" 
              style={{ width: `${Math.min((todayCount / 10) * 100, 100)}%` }}
            />
          </div>
        </div>
        
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent cursor-pointer text-left"
        >
          <LogOut size={18} /> Sign out
        </button>
      </div>
    </aside>
  );
}