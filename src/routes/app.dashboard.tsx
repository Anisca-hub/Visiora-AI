// Dashboard - stats with daily 10-image layout limits tracker
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Image as ImageIcon, Heart, CalendarDays } from "lucide-react";

export const Route = createFileRoute("/app/dashboard")({ component: Dashboard });

function Dashboard() {
  const [stats, setStats] = useState({ total: 0, favorites: 0, today: 0, public: 0 });

  const fetchDashboardData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // 1. Total personal generations count from right table name
    const { count: total } = await supabase
      .from("generated_images")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    // 2. Counts items out of the independent favorites map table
    const { count: favCount } = await supabase
      .from("favorites")
      .select("id", { count: "exact" })
      .eq("user_id", user.id);

    // 3. Public tracking count
    const { count: publicCount } = await supabase
      .from("generated_images")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_public", true);
    
    // 4. Daily quota calculations tracking boundaries
    const { count: todayCount } = await supabase
      .from("generated_images")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", startOfDay.toISOString());

    setStats({
      total: total ?? 0,
      favorites: favCount ?? 0,
      public: publicCount ?? 0,
      today: todayCount ?? 0,
    });
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const cards = [
    { label: "Created today", value: `${stats.today} / 10`, icon: CalendarDays, navigateTo: "/app/generate" },
    { label: "Total generations", value: stats.total, icon: ImageIcon, navigateTo: "/app/gallery" },
    { label: "Favorites", value: stats.favorites, icon: Heart, navigateTo: "/app/gallery" },
    { label: "Public shared", value: stats.public, icon: Sparkles, navigateTo: "/app/gallery" },
  ];

  return (
    <div className="p-6 md:p-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back. Here's what you've been creating.</p>
        </div>
        <Link 
          to="/app/generate" 
          className="inline-flex items-center gap-2 rounded-xl gradient-bg px-5 py-2.5 text-sm font-medium text-white glow-primary"
        >
          <Sparkles size={16} /> New generation
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link 
            key={c.label} 
            to={c.navigateTo} 
            className="glass rounded-2xl p-5 hover:bg-white/5 transition-all block group duration-200 cursor-pointer text-left outline-none"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground group-hover:text-sidebar-foreground transition-colors">{c.label}</span>
              <c.icon size={18} className="text-accent group-hover:scale-110 transition-transform" />
            </div>
            <div className="mt-3 text-3xl font-bold">{c.value}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}