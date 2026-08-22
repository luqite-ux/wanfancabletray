import type { LocalizedList, LocalizedText, SiteLocale } from "@/lib/localization";

export interface Company {
  legalNameZh: string;
  publicName: string;
  brand: string;
  email: string;
  phone: string;
  address: string;
  domain: string;
  defaultLocale: SiteLocale;
  supportedLocales: SiteLocale[];
}

export interface ProductFamily {
  slug: string;
  name: LocalizedText;
  description: LocalizedText;
}

export interface FaqItem {
  question: LocalizedText;
  answer: LocalizedText;
}

export const company: Company = {
  legalNameZh: "南京万帆电气设备有限公司",
  publicName: "Nanjing Wanfan Electrical Equipment Co., Ltd.",
  brand: "Wanfan",
  email: "info@wanfancabletray.com",
  phone: "+86 158 5079 7846",
  address: "C4-2068, Runtai Market, Yuhuatai District, Nanjing, Jiangsu, China",
  domain: "wanfancabletray.com",
  defaultLocale: "en",
  supportedLocales: ["en"],
};

const english = (text: string): LocalizedText => ({ en: text });

export const productFamilies: ProductFamily[] = [
  ["cable-tray-systems", "Cable Tray Systems", "Cable-management systems for project requirements."],
  ["solar-mounting-structures", "Solar Mounting Structures", "Structural support components for solar projects."],
  ["seismic-supports", "Seismic Supports", "Support systems for coordinated building installations."],
  ["utility-tunnel-supports", "Utility-Tunnel Supports", "Support components for infrastructure corridors."],
  ["aluminum-cable-trunking", "Aluminum Cable Trunking", "Aluminum-alloy trunking for cable routing."],
  ["stainless-steel-rainwater-outlets", "Stainless-Steel Rainwater Outlets", "Stainless-steel components for drainage applications."],
  ["emt-conduits", "EMT Conduits", "Electrical metallic tubing for cable protection."],
  ["jdg-conduits", "JDG Conduits", "JDG conduit systems for electrical installations."],
  ["stainless-steel-hose-clamps", "Stainless-Steel Hose Clamps", "Stainless-steel clamps for secure connections."],
  ["stainless-steel-fasteners", "Stainless-Steel Fasteners", "Fastening components for industrial assemblies."],
].map(([slug, name, description]) => ({
  slug,
  name: english(name),
  description: english(description),
}));

export const cableTrayMaterials: LocalizedList = {
  en: [
    "Galvanized steel",
    "Powder-coated steel",
    "Zinc-aluminum-magnesium coated steel",
    "Stainless steel 201/304/316",
    "Aluminum alloy",
  ],
};

export const faqItems: FaqItem[] = [
  {
    question: english("Which cable-tray materials are available?"),
    answer: english("Material options include galvanized steel, powder-coated steel, zinc-aluminum-magnesium coated steel, stainless steel 201/304/316, and aluminum alloy."),
  },
  {
    question: english("What cable-tray thicknesses can be supplied?"),
    answer: english("The supplied thickness range is 0.5–3.0 mm. Sizes and processes can be customized to confirmed order requirements."),
  },
  {
    question: english("What is the typical production window?"),
    answer: english("Typical production is 5–15 days, subject to order confirmation."),
  },
  {
    question: english("Can you work from project drawings?"),
    answer: english("Drawing-based customization is available after project requirements are confirmed."),
  },
];
