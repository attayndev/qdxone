import type { OrgBranding, FieldMode } from "./supabase/types";

export interface ApplicationConfig {
  work_experience: FieldMode;
  references: FieldMode;
}

/** Application-form field config, defaulting both to optional. */
export function applicationConfig(
  branding: OrgBranding | null | undefined
): ApplicationConfig {
  return {
    work_experience: branding?.application_config?.work_experience ?? "optional",
    references: branding?.application_config?.references ?? "optional",
  };
}
