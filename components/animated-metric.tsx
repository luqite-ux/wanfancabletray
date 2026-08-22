"use client";

import { useEffect, useState } from "react";
import { CircleGauge, Factory, FileSearch, Truck } from "lucide-react";

const metricIcons = {
  factory: Factory,
  machines: CircleGauge,
  schedule: Truck,
  drawing: FileSearch,
};

interface AnimatedMetricProps {
  value: string;
  label: string;
  detail: string;
  iconName: "factory" | "machines" | "schedule" | "drawing";
}

export function AnimatedMetric({ value, label, detail, iconName }: AnimatedMetricProps) {
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => setReducedMotion(query.matches);
    syncMotion();
    query.addEventListener("change", syncMotion);
    const timer = window.setTimeout(() => setVisible(true), reducedMotion ? 0 : 90);
    return () => {
      query.removeEventListener("change", syncMotion);
      window.clearTimeout(timer);
    };
  }, [reducedMotion]);

  const Icon = metricIcons[iconName];

  return (
    <article className={`metric-card ${visible ? "metric-card--visible" : ""}`}>
      <Icon aria-hidden="true" className="metric-card__icon" strokeWidth={1.8} />
      <strong aria-label={`${value} ${label}`}>{value}</strong>
      <span>{label}</span>
      <p>{detail}</p>
    </article>
  );
}
