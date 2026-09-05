"use client";

import { useEffect, useRef, useState } from "react";
import { PlayCircle } from "lucide-react";

interface FactoryVideoProps {
  poster: string;
  sources: readonly string[];
}

export function getNextVideoIndex(currentIndex: number, sourceCount: number) {
  return sourceCount > 0 ? (currentIndex + 1) % sourceCount : 0;
}

export function FactoryVideo({ poster, sources }: FactoryVideoProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const resumeAfterSourceChange = useRef(false);
  const currentSource = sources[currentSourceIndex] ?? sources[0];

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => setReducedMotion(query.matches);
    syncMotion();
    query.addEventListener("change", syncMotion);
    return () => query.removeEventListener("change", syncMotion);
  }, []);

  useEffect(() => {
    if (resumeAfterSourceChange.current) {
      videoRef.current?.load();
    }
  }, [currentSource]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const playNextSource = () => {
      resumeAfterSourceChange.current = true;
      setCurrentSourceIndex((index) => getNextVideoIndex(index, sources.length));
    };

    video.addEventListener("ended", playNextSource);
    return () => video.removeEventListener("ended", playNextSource);
  }, [sources.length]);

  if (!currentSource) {
    return null;
  }

  return (
    <div className="factory-video" data-reduced-motion={reducedMotion ? "static" : undefined}>
      <video
        ref={videoRef}
        aria-label="Wanfan workshop production video"
        controls
        muted
        playsInline
        poster={poster}
        preload="metadata"
        onCanPlay={(event) => {
          if (resumeAfterSourceChange.current) {
            resumeAfterSourceChange.current = false;
            void event.currentTarget.play().catch(() => undefined);
          }
        }}
      >
        <source src={currentSource} type="video/mp4" />
        Your browser does not support embedded video.
      </video>
      <p><PlayCircle aria-hidden="true" size={18} /> Two short workshop views play in sequence once you choose to start.</p>
    </div>
  );
}
