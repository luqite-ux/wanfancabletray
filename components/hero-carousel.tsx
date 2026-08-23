"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Pause, Play } from "lucide-react";
import { InquiryCta } from "@/components/inquiry-cta";
import { CAROUSEL_INTERVAL_MS, getCarouselProgress, pauseCarouselClock, resetCarouselClock, startCarouselClock, type CarouselClock } from "@/lib/carousel-timing";
import type { SiteLocale } from "@/lib/localization";
import { localizePath } from "@/lib/locale-routing";
import { company } from "@/lib/site-data";

export const heroSlides = [
  {
    eyebrow: "Cable tray systems",
    title: "Engineered Cable Management for Demanding Projects.",
    description: "Cable-management systems and structural supports shaped around project requirements.",
    image: "/assets/factory/workshop-09.jpg",
    imageAlt: "Finished cable tray systems in the Wanfan workshop",
    primaryCta: { label: "Request a Quote", href: "/request-a-quote" },
    secondaryCta: { label: "Explore Products", href: "/products" },
  },
  {
    eyebrow: "Drawing-based manufacturing",
    title: "Flexible Manufacturing, Built Around Your Drawings.",
    description: "Share your drawings and specifications to begin a practical material and process review.",
    image: "/assets/factory/workshop-04.jpg",
    imageAlt: "Cable tray fabrication equipment in the Wanfan workshop",
    primaryCta: { label: "Discuss Your Drawing", href: "/request-a-quote" },
    secondaryCta: { label: "See Manufacturing", href: "/manufacturing" },
  },
  {
    eyebrow: "Wanfan / 万帆",
    title: "Registered Brand. Controlled Production. Project-Ready Support.",
    description: "A registered Class 6 brand with production support for cable-management project requirements.",
    image: "/assets/factory/workshop-13.jpg",
    imageAlt: "Organized cable tray production area at the Wanfan factory",
    primaryCta: { label: "Start an Inquiry", href: "/request-a-quote" },
    secondaryCta: { label: "About Wanfan", href: "/about" },
  },
] as const;

export function HeroCarousel({ locale = company.defaultLocale }: { locale?: SiteLocale }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isUserPaused, setIsUserPaused] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const clockRef = useRef<CarouselClock>({ elapsedBeforePause: 0, startedAt: null });
  const [progress, setProgress] = useState(0);

  const resetCycle = () => {
    const now = performance.now();
    clockRef.current = isPaused || reducedMotion
      ? pauseCarouselClock(resetCarouselClock(now), now)
      : resetCarouselClock(now);
    setProgress(0);
  };
  const showSlide = (index: number) => {
    setActiveIndex((index + heroSlides.length) % heroSlides.length);
    resetCycle();
  };
  const showNext = () => showSlide(activeIndex + 1);
  const showPrevious = () => showSlide(activeIndex - 1);
  const isPaused = isUserPaused || isInteracting;
  const pauseStatus = reducedMotion
    ? "Paused because reduced motion is enabled"
    : isUserPaused
      ? "Paused"
      : isInteracting
        ? "Paused while you are interacting"
        : `Playing — ${CAROUSEL_INTERVAL_MS / 1000} s per slide`;

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => setReducedMotion(query.matches);
    syncMotion();
    query.addEventListener("change", syncMotion);
    return () => query.removeEventListener("change", syncMotion);
  }, []);

  useEffect(() => {
    const now = performance.now();
    if (isPaused || reducedMotion) {
      clockRef.current = pauseCarouselClock(clockRef.current, now);
      setProgress(getCarouselProgress(clockRef.current, now));
      return;
    }

    clockRef.current = startCarouselClock(clockRef.current, now);
    let frame = 0;
    const tick = (timestamp: number) => {
      const nextProgress = getCarouselProgress(clockRef.current, timestamp);
      setProgress(nextProgress);
      if (nextProgress >= 1) {
        setActiveIndex((index) => (index + 1) % heroSlides.length);
        clockRef.current = resetCarouselClock(timestamp);
        setProgress(0);
      }
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(frame);
      clockRef.current = pauseCarouselClock(clockRef.current, performance.now());
    };
  }, [isPaused, reducedMotion]);

  const activeSlide = heroSlides[activeIndex];

  return (
    <div
      aria-label="Featured Wanfan capabilities"
      aria-roledescription="carousel"
      className="hero-carousel"
      role="region"
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsInteracting(false);
      }}
      onFocusCapture={() => window.requestAnimationFrame(() => setIsInteracting(true))}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") showPrevious();
        if (event.key === "ArrowRight") showNext();
      }}
      onMouseEnter={() => setIsInteracting(true)}
      onMouseLeave={() => setIsInteracting(false)}
      onTouchEnd={(event) => {
        if (touchStart === null) return;
        const distance = event.changedTouches[0].clientX - touchStart;
        if (Math.abs(distance) > 40) distance > 0 ? showPrevious() : showNext();
        setTouchStart(null);
      }}
      onTouchStart={(event) => setTouchStart(event.touches[0].clientX)}
      tabIndex={0}
    >
      <div className="hero-carousel__media" aria-hidden="true" style={{ backgroundImage: `url(${activeSlide.image})` }} />
      <div className="hero-carousel__content">
        <p className="eyebrow">{activeSlide.eyebrow}</p>
        <p aria-live="polite" className="sr-only">Slide {activeIndex + 1} of {heroSlides.length}: {activeSlide.title}</p>
        <h1>{activeSlide.title}</h1>
        <p className="hero-carousel__description">{activeSlide.description}</p>
        <div className="hero-carousel__ctas">
          <InquiryCta label={activeSlide.primaryCta.label} locale={locale} />
          <Link className="secondary-cta" href={localizePath(activeSlide.secondaryCta.href, locale, company.defaultLocale)}>{activeSlide.secondaryCta.label}</Link>
        </div>
      </div>
      <div className="hero-carousel__controls" aria-label="Carousel controls">
        <button aria-label="Previous slide" className="carousel-control" onClick={showPrevious} type="button"><ArrowLeft aria-hidden="true" size={20} /></button>
        <div className="hero-carousel__selectors" aria-label="Choose slide">
          {heroSlides.map((slide, index) => (
            <button aria-label={`Show slide ${index + 1}: ${slide.title}`} aria-pressed={activeIndex === index} className="carousel-selector" key={slide.title} onClick={() => showSlide(index)} type="button" />
          ))}
        </div>
        <span aria-live="polite" className="carousel-status">{pauseStatus}</span>
        <button aria-label={isUserPaused ? "Resume automatic slides after focus or hover ends" : "Keep automatic slides paused after focus or hover ends"} className="carousel-control" onClick={() => setIsUserPaused((value) => !value)} type="button">
          {isUserPaused ? <Play aria-hidden="true" size={18} /> : <Pause aria-hidden="true" size={18} />}
        </button>
        <button aria-label="Next slide" className="carousel-control" onClick={showNext} type="button"><ArrowRight aria-hidden="true" size={20} /></button>
      </div>
      <div aria-hidden="true" className={`hero-carousel__progress ${isPaused || reducedMotion ? "hero-carousel__progress--paused" : ""}`} style={{ transform: `scaleX(${progress})` }} />
    </div>
  );
}
