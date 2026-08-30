export interface CrisisResource {
  name: string;
  description: string;
  phone?: string;
  url?: string;
  availability?: string;
}

export interface CountryCrisisResources {
  countryCode: string;
  countryName: string;
  resources: CrisisResource[];
}

/**
 * Country-keyed so this can be localized (spec §9: "design the system so
 * resources can be localized by country" — never hard-code just one).
 * Numbers/availability were accurate at time of writing but helplines do
 * change — worth periodically re-verifying before relying on this in a
 * real deployment.
 */
export const CRISIS_RESOURCES: Record<string, CountryCrisisResources> = {
  IN: {
    countryCode: "IN",
    countryName: "India",
    resources: [
      { name: "Emergency services", description: "Police / Fire / Ambulance", phone: "112", availability: "24/7" },
      {
        name: "KIRAN Mental Health Helpline",
        description: "Government of India mental health rehabilitation helpline",
        phone: "1800-599-0019",
        availability: "24/7",
      },
      {
        name: "iCall (TISS)",
        description: "Psychosocial support helpline",
        phone: "9152987821",
        availability: "Mon–Sat, 8am–10pm",
      },
      {
        name: "AASRA",
        description: "Suicide prevention helpline",
        phone: "9820466726",
        availability: "24/7",
      },
      {
        name: "Vandrevala Foundation",
        description: "Mental health helpline",
        phone: "1860-2662-345",
        availability: "24/7",
      },
    ],
  },
  DEFAULT: {
    countryCode: "DEFAULT",
    countryName: "International",
    resources: [
      {
        name: "Find A Helpline",
        description: "Directory of crisis lines by country",
        url: "https://findahelpline.com",
      },
    ],
  },
};

export function getCrisisResources(countryCode: string = "IN"): CountryCrisisResources {
  return CRISIS_RESOURCES[countryCode] ?? CRISIS_RESOURCES.DEFAULT;
}
