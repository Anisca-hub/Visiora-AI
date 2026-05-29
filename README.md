Visiora AI 🚀

Visiora AI is a cutting-edge generative image platform designed to bridge the gap between creative intent and high-fidelity visual output. Built for both enthusiasts and power users, it leverages advanced AI models to transform descriptive prompts into stunning, high-resolution visuals within a professional-grade canvas environment.


🎨 What Makes Visiora AI Different?
Unlike generic image generators that focus solely on "prompt-in/image-out," Visiora AI provides:
Contextual Style Injection: A curated engine that understands nuanced style descriptors better than standard models.
Personal Vault Integration: A secure, Supabase-backed gallery where every generation is automatically indexed and stored for the authenticated user.
Privacy-First Architecture: Built with Row Level Security (RLS) to ensure that your creative assets remain your own—no data leakage, no cross-user visibility.
Optimized Latency: Streamlined backend processing to reduce "time-to-first-pixel."


✨ Core Features
Intuitive Prompting: A refined text-to-image interface.
Style Gallery: One-click style application (e.g., Cinematic, Cyberpunk, Oil Painting).
Secure Authentication: Powered by Supabase Auth for seamless login and session persistence.
Cloud Storage: Direct upload to encrypted storage buckets.
Persistent Gallery: Auto-saving feature that builds a personal history of your creations.


🛠 Tech Stack
Frontend: React (Vite), Tailwind CSS, Framer Motion
Backend/Database: Supabase (PostgreSQL)
Authentication: Supabase Auth
Storage: Supabase Storage
AI Engine: Integrated via Supabase Edge Functions (for secure, server-side image processing)
Deployment: Vercel


📂 Project Structure
visiora-ai/
├── src/               # Frontend source code
│   ├── components/    # Reusable UI components
│   ├── hooks/         # Custom authentication and generation hooks
│   ├── lib/           # Supabase client initialization
│   └── routes/        # Application navigation structure
├── supabase/          # Backend configuration
│   ├── functions/     # Supabase Edge Functions
│   └── migrations/    # SQL migration files
├── .env               # Environment variables (Add your keys here!)
├── .gitignore         # Prevents .env and node_modules from being pushed
├── package.json       # Dependencies and scripts
└── vite.config.ts     # Vite configuration


🚀 How to Clone and Use
1. Prerequisites
Ensure you have Node.js installed, then verify:
node -v
npm -v

2. Setup
Clone the repository and install dependencies:
git clone https://github.com/Anisca-hub/Visiora-AI.git
cd Visiora-AI
npm install

3. Environment Configuration
Create a .env file in the root directory and add the following keys from your Supabase Dashboard (Settings > API):
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key

4. Database & Edge Function Deployment
Database: Navigate to your Supabase Dashboard and run the SQL script to create the generated_images table.
Policies: Enable RLS on the generated_images table and apply policies using auth.uid() = user_id.
Edge Functions: Deploy your image generation logic using the Supabase CLI: supabase functions deploy generate-image
Ensure your `IMAGE_API_KEY` is added to your Supabase project secrets via the CLI or Dashboard so the function can authenticate with the AI service.

5. Start Development
npm run dev

6. Deployment to Vercel
Connect your GitHub repo to Vercel.
In Vercel’s project settings, navigate to Environment Variables.
Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY manually.
Click Deploy.

Note: Ensure your .env file is included in your .gitignore to prevent sensitive credentials (like your IMAGE_API_KEY or SUPABASE_SERVICE_ROLE_KEY) from being committed to your public repository.
Deployment: Vercel

📂 Project Structure
