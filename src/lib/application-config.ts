import type { OrgBranding, FieldMode, CustomQuestion } from "./supabase/types";

export interface ApplicationConfig {
  work_experience: FieldMode;
  references: FieldMode;
  custom_questions: CustomQuestion[];
}

/**
 * Application-form field config, defaulting both to optional. Pass `role` (the
 * posting's title) to scope custom questions to that role — a question shows
 * when it has no roles set (applies to all) or lists that role. With no `role`
 * (admin views), all questions are returned.
 */
export function applicationConfig(
  branding: OrgBranding | null | undefined,
  role?: string
): ApplicationConfig {
  const all: CustomQuestion[] = branding?.application_config?.custom_questions ?? [];
  const custom_questions =
    role == null
      ? all
      : all.filter((q) => !q.roles?.length || q.roles.includes(role));
  return {
    work_experience: branding?.application_config?.work_experience ?? "optional",
    references: branding?.application_config?.references ?? "optional",
    custom_questions,
  };
}
