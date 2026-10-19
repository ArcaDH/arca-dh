// A subcategory the user can pick during onboarding
export type StarterLine = { key: string; name: string; suggested: number };

export type StarterGroup = { name: string; lines: StarterLine[] };

export type StarterPicks = Record<string, string>;

export type StarterTile = StarterLine & { picked: boolean; amount: string };

export type StarterTileGroup = { name: string; tiles: StarterTile[] };

export type PlannedSummary = {
  income: number;
  planned: number;
  difference: number;
  share: number;
  isOver: boolean;
};

export type OnboardingStep = "basics" | "categories";

// Everything needed to create the user's first budget
export type OnboardingSetup = {
  planName: string;
  income: number;
  categories: { name: string; subcategories: { name: string; target: number | null }[] }[];
};
