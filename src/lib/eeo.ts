/**
 * Voluntary EEO self-identification options. These approximate the standard
 * EEO-1 / OMB / VEVRAA / Section 503 categories. Exact federal form wording
 * (and OMB control numbers) should be finalized with legal counsel before
 * production — the methodology requires a legal review pass.
 *
 * Every question includes "Prefer not to answer". This data is collected
 * voluntarily, stored in the locked `eeo` schema, and never shown to a
 * hiring decision-maker — only aggregate reporting.
 */

export type EeoOption = { value: string; label: string };

export const RACE_OPTIONS: EeoOption[] = [
  { value: "hispanic_latino", label: "Hispanic or Latino" },
  { value: "white", label: "White (Not Hispanic or Latino)" },
  { value: "black", label: "Black or African American" },
  {
    value: "native_hawaiian_pacific",
    label: "Native Hawaiian or Other Pacific Islander",
  },
  { value: "asian", label: "Asian" },
  {
    value: "american_indian_alaska",
    label: "American Indian or Alaska Native",
  },
  { value: "two_or_more", label: "Two or More Races" },
  { value: "decline", label: "Prefer not to answer" },
];

export const GENDER_OPTIONS: EeoOption[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "decline", label: "Prefer not to answer" },
];

export const VETERAN_OPTIONS: EeoOption[] = [
  {
    value: "protected_veteran",
    label: "I identify as one or more classifications of protected veteran",
  },
  { value: "not_protected_veteran", label: "I am not a protected veteran" },
  { value: "decline", label: "Prefer not to answer" },
];

export const DISABILITY_OPTIONS: EeoOption[] = [
  {
    value: "yes",
    label: "Yes, I have a disability (or previously had one)",
  },
  {
    value: "no",
    label: "No, I do not have a disability and have not had one",
  },
  { value: "decline", label: "Prefer not to answer" },
];

export const RACE_LABELS = Object.fromEntries(RACE_OPTIONS.map((o) => [o.value, o.label]));
export const GENDER_LABELS = Object.fromEntries(GENDER_OPTIONS.map((o) => [o.value, o.label]));
