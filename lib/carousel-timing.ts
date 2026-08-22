export const CAROUSEL_INTERVAL_MS = 7000;

export interface CarouselClock {
  startedAt: number | null;
  elapsedBeforePause: number;
}

export function getCarouselElapsed(clock: CarouselClock, now: number) {
  const activeElapsed = clock.startedAt === null ? 0 : Math.max(0, now - clock.startedAt);
  return Math.min(CAROUSEL_INTERVAL_MS, clock.elapsedBeforePause + activeElapsed);
}

export function getCarouselProgress(clock: CarouselClock, now: number) {
  return getCarouselElapsed(clock, now) / CAROUSEL_INTERVAL_MS;
}

export function startCarouselClock(clock: CarouselClock, now: number): CarouselClock {
  return clock.startedAt === null ? { ...clock, startedAt: now } : clock;
}

export function pauseCarouselClock(clock: CarouselClock, now: number): CarouselClock {
  return { elapsedBeforePause: getCarouselElapsed(clock, now), startedAt: null };
}

export function resetCarouselClock(now: number): CarouselClock {
  return { elapsedBeforePause: 0, startedAt: now };
}
