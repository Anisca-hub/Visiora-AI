import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Loader2, AlertTriangle, Download, Heart, Image as ImageIcon, Compass, Globe, EyeOff } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/generate")({ component: GenerateImagePage });

const stylesList = [
  { id: "cinematic", name: "Cinematic", icon: "🎬" },
  { id: "realistic", name: "Realistic", icon: "📸" },
  { id: "anime", name: "Anime", icon: "🌸" },
  { id: "ghibli", name: "Ghibli", icon: "🍃" },
  { id: "cyberpunk", name: "Cyberpunk", icon: "🏙️" },
  { id: "fantasy", name: "Fantasy", icon: "🦄" },
  { id: "artistic", name: "Artistic", icon: "🎨" },
  { id: "watercolor", name: "Watercolor", icon: "💧" },
  { id: "pixel-art", name: "Pixel Art", icon: "👾" },
  { id: "3d-render", name: "3D Render", icon: "🧊" },
  { id: "oil-painting", name: "Oil Painting", icon: "🖼️" },
  { id: "sci-fi", name: "Sci-Fi", icon: "🚀" },
  { id: "neon", name: "Neon", icon: "💡" }
];

type DbImage = {
  id: string;
  prompt: string;
  style: string;
  image_url: string;
  is_public: boolean;
  favorites: { id: string }[];
};

function GenerateImagePage() {
  const [activeTab, setActiveTab] = useState<"generate" | "gallery" | "favorites" | "explore">("generate");
  const [prompt, setPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("cinematic");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Collections Data States
  const [galleryImages, setGalleryImages] = useState<DbImage[]>([]);
  const [favoriteImages, setFavoriteImages] = useState<DbImage[]>([]);
  const [exploreImages, setExploreImages] = useState<DbImage[]>([]);

  // Sync state data on tab change
  useEffect(() => {
    if (activeTab === "gallery") fetchUserGallery();
    if (activeTab === "favorites") fetchUserFavorites();
    if (activeTab === "explore") fetchExploreFeed();
  }, [activeTab]);

  const fetchUserGallery = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("generated_images")
        .select(`
          *,
          favorites (
            id
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setGalleryImages((data as unknown as DbImage[]) || []);
    } catch (err) {
      toast.error("Failed to sync personal gallery.");
    }
  };

  const fetchUserFavorites = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("generated_images")
        .select(`
          *,
          favorites!inner (
            id
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFavoriteImages((data as unknown as DbImage[]) || []);
    } catch (err) {
      toast.error("Failed to sync favorites.");
    }
  };

  const fetchExploreFeed = async () => {
    try {
      const { data, error } = await supabase
        .from("generated_images")
        .select(`
          *,
          favorites (
            id
          )
        `)
        .eq("is_public", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setExploreImages((data as unknown as DbImage[]) || []);
    } catch (err) {
      toast.error("Failed to load community feed.");
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      toast.error("Please enter a prompt first!");
      return;
    }

    setIsLoading(true);
    setImageUrl(null);

    const fullPrompt = `${prompt.trim()}, ${selectedStyle} style`;

    try {
      // FIX: Use native fetch to handle binary image streams instead of invoke
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        "https://ccrtzwrdqlchupqxhols.supabase.co/functions/v1/generate-image", 
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token || ""}`
          },
          body: JSON.stringify({ prompt: fullPrompt })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to process target canvas generation response.");
      }

      // Convert raw response stream to a Blob
      const imageBlob = await response.blob();
      const localUrl = URL.createObjectURL(imageBlob);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setImageUrl(localUrl);
        toast.success("Generated! Log in to save permanently.");
        return;
      }

      // 1. Upload to storage
      const filePath = `${user.id}/${Date.now()}.png`;
      const { error: uploadError } = await supabase.storage
        .from("visiora-ai")
        .upload(filePath, imageBlob, { contentType: "image/png", upsert: true });

      if (uploadError) throw uploadError;

      const cloudImageUrl = `https://ccrtzwrdqlchupqxhols.supabase.co/storage/v1/object/public/visiora-ai/${filePath}`;

      // 2. Write metadata
      const { error: dbError } = await supabase.from("generated_images").insert({
        user_id: user.id,
        prompt: prompt.trim(),
        style: selectedStyle,
        image_url: cloudImageUrl,
        storage_path: filePath,
        is_public: false 
      });

      if (dbError) throw dbError;

      // 3. Verification
      const imgTracker = new Image();
      imgTracker.src = cloudImageUrl;
      imgTracker.onload = () => {
        setImageUrl(cloudImageUrl);
        toast.success("Saved to your personal gallery vault!");
      };
      
      imgTracker.onerror = () => {
        setImageUrl(localUrl);
        toast.success("Generated! Saved to vault successfully.");
      };

    } catch (error: any) {
      console.error("Generation sequence error:", error);
      toast.error(error.message || "Failed to process image generation.");
    } finally {
      setIsLoading(false);
    }
  };
  const handleToggleFavorite = async (img: DbImage) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const isFavorited = img.favorites && img.favorites.length > 0;

      if (isFavorited) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("image_id", img.id);

        if (error) throw error;
        toast.success("Removed from favorites");
      } else {
        const { error } = await supabase
          .from("favorites")
          .insert({
            user_id: user.id,
            image_id: img.id
          });

        if (error) throw error;
        toast.success("Added to favorites!");
      }
      
      if (activeTab === "gallery") fetchUserGallery();
      if (activeTab === "favorites") fetchUserFavorites();
      if (activeTab === "explore") fetchExploreFeed();
    } catch (err) {
      toast.error("Could not change favorite assignment state.");
    }
  };

  const handleTogglePublicShare = async (img: DbImage) => {
    try {
      const { error } = await supabase
        .from("generated_images")
        .update({ is_public: !img.is_public })
        .eq("id", img.id);

      if (error) throw error;

      toast.success(img.is_public ? "Image is now private" : "Published to public Explore Feed!");
      
      if (activeTab === "gallery") fetchUserGallery();
      if (activeTab === "favorites") fetchUserFavorites();
      if (activeTab === "explore") fetchExploreFeed();
    } catch (err) {
      toast.error("Could not modify sharing configurations.");
    }
  };

  const handleRemoteDownload = async (url: string, explicitName: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const localBlobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = localBlobUrl;
      link.download = `${explicitName.replace(/\s+/g, "-")}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(localBlobUrl);
      toast.success("Download started!");
    } catch {
      toast.error("Failed to parse and fetch file object.");
    }
  };

  const getActiveCollection = () => {
    if (activeTab === "gallery") return galleryImages;
    if (activeTab === "favorites") return favoriteImages;
    return exploreImages;
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center space-x-3">
          <Sparkles className="w-8 h-8 text-indigo-500 animate-pulse" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Visiora AI</h1>
            <p className="text-muted-foreground">Transform your ideas into stunning visual art blocks instantly.</p>
          </div>
        </div>

        <div className="flex flex-wrap bg-muted p-1 rounded-xl border gap-1 self-start">
          <button
            type="button" onClick={() => setActiveTab("generate")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${activeTab === "generate" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Sparkles className="w-3.5 h-3.5" /> <span>Studio</span>
          </button>
          <button
            type="button" onClick={() => setActiveTab("gallery")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${activeTab === "gallery" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <ImageIcon className="w-3.5 h-3.5" /> <span>My Gallery</span>
          </button>
          <button
            type="button" onClick={() => setActiveTab("favorites")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${activeTab === "favorites" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Heart className="w-3.5 h-3.5" /> <span>Favorites</span>
          </button>
          <button
            type="button" onClick={() => setActiveTab("explore")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${activeTab === "explore" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Compass className="w-3.5 h-3.5" /> <span>Explore Feed</span>
          </button>
        </div>
      </div>

      {activeTab === "generate" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <form onSubmit={handleGenerate} className="lg:col-span-7 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">Step 1: Choose an Artistic Theme Style</label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {stylesList.map((style) => (
                  <button
                    key={style.id} type="button" onClick={() => setSelectedStyle(style.id)} disabled={isLoading}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-sm transition gap-1.5 ${selectedStyle === style.id ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-medium ring-2 ring-indigo-500/20" : "border-border bg-card hover:bg-accent"}`}
                  >
                    <span className="text-2xl">{style.icon}</span> <span className="truncate text-xs">{style.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">Step 2: Describe your imagination</label>
              <textarea
                value={prompt} onChange={(e) => setPrompt(e.target.value)} disabled={isLoading} rows={4}
                placeholder="An astronaut riding a glowing horse on Mars..."
                className="w-full p-4 rounded-xl border border-border bg-background focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none"
              />
            </div>

            <button
              type="submit" disabled={isLoading || !prompt.trim()}
              className="w-full flex items-center justify-center space-x-2 py-4 px-6 rounded-xl text-white font-medium bg-indigo-600 hover:bg-indigo-500 disabled:bg-muted disabled:text-muted-foreground transition shadow-lg cursor-pointer"
            >
              {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> <span>Weaving Masterpiece...</span></> : <><Sparkles className="w-5 h-5" /> <span>Generate Masterpiece</span></>}
            </button>
          </form>

          <div className="lg:col-span-5 space-y-4">
            <label className="text-sm font-semibold tracking-wide uppercase text-muted-foreground block">Canvas Output Workspace</label>
            <div className="relative aspect-square w-full rounded-2xl border-2 border-dashed bg-muted/40 overflow-hidden flex flex-col items-center justify-center p-6 text-center group">
              {isLoading && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-3 z-10 animate-fade-in">
                  <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                  <p className="text-sm font-medium">Applying neural context matrices...</p>
                </div>
              )}
              {imageUrl ? (
                <>
                  <img src={imageUrl} alt={prompt} className="w-full h-full object-cover rounded-xl" />
                  <button type="button" onClick={() => handleRemoteDownload(imageUrl, "visiora-ai")} className="absolute bottom-4 right-4 p-3 bg-background/90 rounded-xl shadow border hover:scale-105 transition cursor-pointer"><Download className="w-5 h-5" /></button>
                </>
              ) : (
                <div className="space-y-4 text-muted-foreground select-none max-w-xs">
                  <AlertTriangle className="w-8 h-8 text-indigo-400 mx-auto" />
                  <p className="text-sm">Select layout theme and trigger a generation sequence task context.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab !== "generate" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-fade-in">
          {getActiveCollection().length === 0 && (
            <div className="col-span-full py-16 text-center text-muted-foreground space-y-3">
              <ImageIcon className="w-10 h-10 mx-auto opacity-30" />
              <div>
                <h3 className="font-medium text-foreground">No assets found</h3>
                <p className="text-sm mt-0.5">Nothing matches this filter inside this directory block sequence layout.</p>
              </div>
            </div>
          )}

          {getActiveCollection().map((img) => {
            const isFavorited = img.favorites && img.favorites.length > 0;
            return (
              <div key={img.id} className="group relative aspect-square bg-muted border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
                <img src={img.image_url} alt={img.prompt} className="w-full h-full object-cover transition duration-300 group-hover:scale-105" />
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-4 flex flex-col justify-between">
                  <div className="flex justify-end space-x-1.5">
                    {activeTab !== "explore" && (
                      <button
                        type="button" onClick={() => handleTogglePublicShare(img)}
                        className={`p-2 rounded-lg backdrop-blur transition transform hover:scale-105 cursor-pointer ${img.is_public ? "bg-emerald-600 text-white" : "bg-black/40 text-white hover:bg-black/60"}`}
                        title={img.is_public ? "Make Private" : "Share Publicly"}
                      >
                        {img.is_public ? <Globe className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    )}
                    <button
                      type="button" onClick={() => handleToggleFavorite(img)}
                      className={`p-2 rounded-lg backdrop-blur transition transform hover:scale-105 cursor-pointer ${isFavorited ? "bg-rose-500 text-white" : "bg-black/40 text-white hover:bg-black/60"}`}
                      title={isFavorited ? "Unfavorite" : "Favorite"}
                    >
                      <Heart className={`w-4 h-4 ${isFavorited ? "fill-current" : ""}`} />
                    </button>
                    <button
                      type="button" onClick={() => handleRemoteDownload(img.image_url, img.prompt)}
                      className="p-2 rounded-lg bg-black/40 text-white hover:bg-black/60 backdrop-blur transition transform hover:scale-105 cursor-pointer"
                      title="Download Frame"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-1.5 mb-1">
                      <span className="inline-block px-1.5 py-0.5 bg-indigo-600 text-[10px] text-white font-semibold rounded uppercase tracking-wider">{img.style}</span>
                      {img.is_public && <span className="inline-block px-1.5 py-0.5 bg-emerald-600 text-[10px] text-white font-semibold rounded uppercase tracking-wider">Public Shared</span>}
                    </div>
                    <p className="text-white text-xs line-clamp-2 font-light">{img.prompt}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}