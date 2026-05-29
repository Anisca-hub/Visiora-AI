// Curated style presets for the generator UI.
export type StyleKey =
  | "ghibli" | "anime" | "realistic" | "artistic" | "cyberpunk"
  | "fantasy" | "watercolor" | "pixel-art" | "3d-render"
  | "oil-painting" | "sci-fi" | "neon" | "cinematic";

export const STYLES: { key: StyleKey; label: string; emoji: string }[] = [
  { key: "cinematic", label: "Cinematic", emoji: "🎬" },
  { key: "realistic", label: "Realistic", emoji: "📷" },
  { key: "anime", label: "Anime", emoji: "🌸" },
  { key: "ghibli", label: "Ghibli", emoji: "🍃" },
  { key: "cyberpunk", label: "Cyberpunk", emoji: "🌃" },
  { key: "fantasy", label: "Fantasy", emoji: "🐉" },
  { key: "artistic", label: "Artistic", emoji: "🎨" },
  { key: "watercolor", label: "Watercolor", emoji: "💧" },
  { key: "pixel-art", label: "Pixel Art", emoji: "👾" },
  { key: "3d-render", label: "3D Render", emoji: "🧊" },
  { key: "oil-painting", label: "Oil Painting", emoji: "🖼️" },
  { key: "sci-fi", label: "Sci-Fi", emoji: "🚀" },
  { key: "neon", label: "Neon", emoji: "💡" },
];
