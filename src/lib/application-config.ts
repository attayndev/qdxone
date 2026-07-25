import type { OrgBranding, FieldMode, CustomQuestion } from "./supabase/types";

export interface ApplicationConfig {
  work_experience: FieldMode;
  references: FieldMode;
  custom_questions: CustomQuestion[];
}

/** Per-posting overrides for the two standard fields (null = inherit org). */
export interface PostingFieldOverrides {
  work_experience?: FieldMode | null;
  references?: FieldMode | null;
}

/**
 * Application-form field config. work_experience/references default to
 * optional at the org level; a posting may override either (`overrides`) —
 * a non-null override wins over the org default. Pass `role` (the posting's
 * title) to scope custom questions to that role — a question shows when it has
 * no roles set (applies to all) or lists that role. With no `role` (admin
 * views), all questions are returned.
 */
export function applicationConfig(
  branding: OrgBranding | null | undefined,
  role?: string,
  overrides?: PostingFieldOverrides
): ApplicationConfig {
  const all: CustomQuestion[] = branding?.application_config?.custom_questions ?? [];
  const custom_questions =
    role == null
      ? all
      : all.filter((q) => !q.roles?.length || q.roles.includes(role));
  const orgWork = branding?.application_config?.work_experience ?? "optional";
  const orgRefs = branding?.application_config?.references ?? "optional";
  return {
    work_experience: overrides?.work_experience ?? orgWork,
    references: overrides?.references ?? orgRefs,
    custom_questions,
  };
}
