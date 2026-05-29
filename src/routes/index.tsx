// Landing page for Visiora AI
import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
import { Sparkles, Wand2, Zap, Shield, Image as ImageIcon, Layers, ArrowRight, Star } from "lucide-react";
import { STYLES } from "@/lib/styles";

export const Route = createFileRoute("/")({ component: Landing });

function Landing() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="sticky top-0 z-40 glass border-b">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Logo />
          <nav className="hidden gap-8 text-sm md:flex">
            <a href="#features" className="text-muted-foreground hover:text-foreground">Features</a>
            <a href="#styles" className="text-muted-foreground hover:text-foreground">Styles</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground">Sign in</Link>
            <Link to="/auth" className="rounded-xl gradient-bg px-4 py-2 text-sm font-medium text-white glow-primary glow-hover">
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 pt-20 pb-24 text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs text-muted-foreground">
          <Sparkles size={14} className="text-accent" /> Powered by next-gen image models
        </div>
        <h1 className="mx-auto mt-6 max-w-4xl text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
          Create <span className="gradient-text">limitless AI art</span><br />
          from pure imagination
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Type a prompt. Pick a style. Get a masterpiece in seconds. Visiora AI is your creative co-pilot for every visual idea.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link to="/auth" className="inline-flex items-center gap-2 rounded-2xl gradient-bg px-6 py-3 font-medium text-white glow-primary glow-hover">
            Start generating <ArrowRight size={18} />
          </Link>
          <a href="#styles" className="rounded-2xl glass px-6 py-3 font-medium hover:bg-white/5">
            Explore styles
          </a>
        </div>

        {/* Mock prompt bar */}
        <div className="mx-auto mt-16 max-w-3xl glass rounded-3xl p-2 glow-primary">
          <div className="flex items-center gap-3 rounded-2xl bg-background/40 p-4">
            <Wand2 className="text-accent" size={20} />
            <span className="text-left text-muted-foreground">A neon dragon flying over Tokyo at night, cinematic...</span>
            <button className="ml-auto rounded-xl gradient-bg px-4 py-2 text-sm font-medium text-white">Generate</button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-24">
        <h2 className="text-center text-4xl font-bold">Built for serious creators</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
          Everything you need to go from idea to finished asset, fast.
        </p>
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {[
            { icon: Zap, title: "Blazing fast", body: "Generations in seconds, with smart retries and queueing built in." },
            { icon: Layers, title: "13+ pro styles", body: "Cinematic, anime, cyberpunk, Ghibli, neon, watercolor, and more." },
            { icon: ImageIcon, title: "Image-to-image", body: "Upload a reference and steer the result toward your vision." },
            { icon: Sparkles, title: "Prompt boosts", body: "AI-assisted prompt suggestions for richer, more detailed output." },
            { icon: Shield, title: "Private by default", body: "Your generations stay yours. Toggle public when you're ready to share." },
            { icon: Star, title: "Save favorites", body: "Build a personal library and curate your best work." },
          ].map((f) => (
            <div key={f.title} className="glass rounded-2xl p-6 glow-hover">
              <div className="inline-flex rounded-xl gradient-bg p-2.5"><f.icon size={20} className="text-white" /></div>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Styles */}
      <section id="styles" className="mx-auto max-w-7xl px-6 py-24">
        <h2 className="text-center text-4xl font-bold">A style for every mood</h2>
        <div className="mt-12 flex flex-wrap justify-center gap-3">
          {STYLES.map((s) => (
            <span key={s.key} className="glass rounded-full px-5 py-2.5 text-sm glow-hover">
              <span className="mr-1.5">{s.emoji}</span>{s.label}
            </span>
          ))}
        </div>
      </section>

      <footer className="border-t py-10 text-center text-sm text-muted-foreground">
        <Logo size="sm" />
        <p className="mt-3">© {new Date().getFullYear()} Visiora AI. Create limitless AI art from pure imagination.</p>
      </footer>
    </div>
  );
}
