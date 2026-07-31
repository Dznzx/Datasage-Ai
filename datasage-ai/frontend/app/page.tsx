"use client";

import { useRouter } from "next/navigation";
import { BrainCircuit, Github } from "lucide-react";
import { Hero } from "@/components/landing/Hero";
import { FeatureCards } from "@/components/landing/FeatureCards";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { UploadResponse } from "@/lib/api";

export default function LandingPage() {
  const router = useRouter();

  function handleUploaded(data: UploadResponse) {
    sessionStorage.setItem(`ds:${data.dataset_id}`, JSON.stringify(data));
    router.push(`/dashboard?id=${data.dataset_id}`);
  }

  return (
    <main className="relative min-h-screen">
      <header className="sticky top-0 z-30 border-b border-transparent">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2 font-display font-semibold text-ink">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sage/10 text-sage">
              <BrainCircuit size={18} />
            </span>
            DataSage AI
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/topics/ai-data-analyst"
              target="_blank"
              rel="noreferrer"
              className="glass hidden h-9 items-center gap-2 rounded-full px-4 text-sm text-ink-soft transition-colors hover:text-sage sm:flex"
            >
              <Github size={15} />
              GitHub
            </a>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <Hero onUploaded={handleUploaded} />
      <FeatureCards />

      <footer className="border-t border-border py-10 text-center text-sm text-ink-muted">
        Built for a 24-hour hackathon · DataSage AI © {new Date().getFullYear()}
      </footer>
    </main>
  );
}
