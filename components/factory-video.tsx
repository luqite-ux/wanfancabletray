"use client";

import { useEffect, useState } from "react";
import { PlayCircle } from "lucide-react";

interface FactoryVideoProps {
  poster: string;
  source: string;
}

export function FactoryVideo({ poster, source }: FactoryVideoProps) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => setReducedMotion(query.matches);
    syncMotion();
    query.addEventListener("change", syncMotion);
    return () => query.removeEventListener("change", syncMotion);
  }, []);

  return (
    <div className="factory-video" data-reduced-motion={reducedMotion ? "static" : undefined}>
      <video aria-label="Wanfan workshop production video" controls muted playsInline poster={poster} preload="metadata">
        <source src={source} type="video/mp4" />
        Your browser does not support embedded video.
      </video>
      <p><PlayCircle aria-hidden="true" size={18} /> A short workshop view. Playback is optional and starts only when you choose it.</p>
    </div>
  );
}
