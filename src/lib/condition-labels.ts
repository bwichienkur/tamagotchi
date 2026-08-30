export type ConditionBadgeValue = "NONE" | "NIB" | "IOB";

const CONDITION_LABELS: Record<ConditionBadgeValue, string> = {
  NONE: "No Box",
  NIB: "NIB",
  IOB: "IOB",
};

const CONDITION_TOOLTIPS: Record<ConditionBadgeValue, string> = {
  NONE: "No original box",
  NIB: "New In Box",
  IOB: "In Original Box",
};

export function getConditionLabel(condition: ConditionBadgeValue): string {
  return CONDITION_LABELS[condition];
}

export function getConditionTooltip(condition: ConditionBadgeValue): string {
  return CONDITION_TOOLTIPS[condition];
}
