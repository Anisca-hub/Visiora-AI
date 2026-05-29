// Visiora AI brand mark.
import { Sparkles } from "lucide-react";

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const text = size === "lg" ? "text-3xl" : size === "sm" ? "text-base" : "text-xl";
  const icon = size === "lg" ? 28 : size === "sm" ? 16 : 20;
  return (
    <div className="flex items-center gap-2 font-bold">
      <div className="grid place-items-center rounded-xl gradient-bg glow-primary p-1.5">
        <Sparkles size={icon} className="text-white" />
      </div>
      <span className={`${text} gradient-text tracking-tight`}>Visiora AI</span>
    </div>
  );
}
