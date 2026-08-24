import { Layers3, Paintbrush, PanelsTopLeft, ScanText, ShieldCheck, type LucideIcon } from "lucide-react";
import type { ProductCardView } from "@/components/product-card";

export const homepageProducts: ProductCardView[] = [
  { slug: "cable-tray-systems", name: "Cable Tray Systems", family: "Cable management", description: "Adaptable tray systems for coordinated routing across building and industrial projects.", image: "/assets/products/photo/cable-tray-systems.png", imageAlt: "Galvanized steel ladder cable tray product" },
  { slug: "utility-tunnel-supports", name: "Utility-Tunnel Supports", family: "Structural support", description: "Support components for utility-tunnel and infrastructure corridor requirements.", image: "/assets/products/photo/utility-tunnel-supports.png", imageAlt: "Galvanized utility-tunnel support frame assembly" },
  { slug: "solar-mounting-structures", name: "Solar Mounting Structures", family: "Structural support", description: "Structural components for solar projects with order-specific material and process options.", image: "/assets/products/photo/solar-mounting-structures.png", imageAlt: "Galvanized solar mounting structure assembly" },
];

export interface MaterialOption {
  accessibleLabel: string;
  icon: LucideIcon;
  iconName: string;
  mark: string;
  text: string;
  title: string;
}

export const materialOptions: MaterialOption[] = [
  { accessibleLabel: "Galvanized steel — Zn material mark", icon: ShieldCheck, iconName: "shield-check", mark: "Zn", text: "A steel option with a galvanized surface.", title: "Galvanized steel" },
  { accessibleLabel: "Powder-coated steel — PC process mark", icon: Paintbrush, iconName: "paintbrush", mark: "PC", text: "A steel option with a powder-coated finish.", title: "Powder-coated steel" },
  { accessibleLabel: "Zinc-aluminum-magnesium steel — Zn–Al–Mg material mark", icon: Layers3, iconName: "layers", mark: "Zn–Al–Mg", text: "A coated steel option available for confirmed requirements.", title: "Zinc-aluminum-magnesium steel" },
  { accessibleLabel: "Stainless steel 201 / 304 / 316 — grade mark", icon: ScanText, iconName: "scan-text", mark: "201 / 304 / 316", text: "Multiple specified stainless-steel grades for project applications.", title: "Stainless steel 201 / 304 / 316" },
  { accessibleLabel: "Aluminum alloy — Al material mark", icon: PanelsTopLeft, iconName: "panels-top-left", mark: "Al", text: "An aluminum-alloy profile option for selected cable-routing projects.", title: "Aluminum alloy" },
];
