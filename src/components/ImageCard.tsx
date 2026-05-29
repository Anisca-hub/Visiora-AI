import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Heart, Globe, Lock } from "lucide-react";
import { toast } from "sonner";

export interface GeneratedImage {
  id: string;
  user_id: string;
  prompt: text;
  style?: string;
  image_url: string; 
  is_public: boolean;
  created_at?: string;
}

interface ImageCardProps {
  img: GeneratedImage;
  isFavorite?: boolean;
  ownerControls?: boolean;
  onToggleFavorite?: (id: string, isAdded: boolean) => void;
}

export function ImageCard({ img, isFavorite = false, ownerControls = true, onToggleFavorite }: ImageCardProps) {
  const [fav, setFav] = useState(isFavorite);
  const [isPublic, setIsPublic] = useState(img.is_public);
  
  // Directly resolves data tracking from your exact Supabase schema field
  const displayUrl = img.image_url;

  const handleLike = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to save favorites.");
        return;
      }

      const nextState = !fav;
      setFav(nextState);

      if (nextState) {
        // FIXED: Explicitly providing user_id so it satisfies the Supabase table RLS insert check
        await supabase.from("favorites").insert([
          { 
            user_id: user.id, 
            image_id: img.id 
          }
        ]);
        toast.success("Saved to Favorites!");
      } else {
        await supabase.from("favorites").delete().eq("image_id", img.id).eq("user_id", user.id);
        toast.success("Removed from Favorites");
      }

      if (onToggleFavorite) {
        onToggleFavorite(img.id, nextState);
      }
    } catch (err) {
      setFav(!fav); // Fallback state synchronization roll-back
      console.error("Global favorite error catch execution:", err);
    }
  };

  const togglePrivacy = async () => {
    if (!ownerControls) return;
    try {
      const nextPublic = !isPublic;
      setIsPublic(nextPublic);
      await supabase.from("generated_images").update({ is_public: nextPublic }).eq("id", img.id);
      toast.success(nextPublic ? "Image is now visible in Explore" : "Image is now private");
    } catch (err) {
      setIsPublic(isPublic);
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl glass border border-white/5 aspect-square bg-muted/20">
      <img 
        src={displayUrl} 
        alt={img.prompt} 
        className="h-full w-full object-cover transition-all duration-500 group-hover:scale-105"
        loading="lazy"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-between">
        <div className="flex justify-end gap-2">
          <button 
            onClick={handleLike}
            className={`p-2 rounded-xl backdrop-blur-md cursor-pointer transition-all ${
              fav ? 'bg-rose-500 text-white' : 'bg-black/40 text-white/80 hover:text-white'
            }`}
          >
            <Heart size={16} fill={fav ? "currentColor" : "none"} />
          </button>
          
          {ownerControls && (
            <button 
              onClick={togglePrivacy}
              className="p-2 rounded-xl bg-black/40 text-white/80 hover:text-white backdrop-blur-md cursor-pointer"
            >
              {isPublic ? <Globe size={16} className="text-accent" /> : <Lock size={16} />}
            </button>
          )}
        </div>

        <div>
          <p className="text-xs text-white line-clamp-2 font-medium">{img.prompt}</p>
          {img.style && (
            <span className="mt-1.5 inline-block text-[10px] bg-accent/20 border border-accent/30 px-2 py-0.5 rounded-md text-accent font-medium capitalize">
              {img.style}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}