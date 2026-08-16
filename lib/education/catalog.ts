export type EducationFieldCode =
  | 'information_technology'
  | 'engineering'
  | 'business'
  | 'culture'
  | 'natural_resources'
  | 'social_services_and_health_care'

export type DegreeProgrammeCode =
  | 'information_and_communication_technology'
  | 'business_information_systems'
  | 'information_technology_beng'
  | 'energy_and_environmental_engineering'
  | 'energy_and_environmental_engineering_beng'
  | 'mechanical_engineering'
  | 'mechanical_engineering_beng'
  | 'electrical_and_automation_engineering'
  | 'building_services_engineering'
  | 'civil_engineering'
  | 'construction_architecture'
  | 'construction_site_management'

export type DegreeTitleCode =
  | 'engineer_amk'
  | 'bachelor_business_administration_amk'
  | 'construction_architect_amk'
  | 'construction_site_manager_amk'

export type SpecializationCode =
  | 'software_development'
  | 'device_oriented_software_development'
  | 'ai_solutions_in_business'

type LocalizedName = { fi: string; en: string }

export const EDUCATION_FIELDS: Record<EducationFieldCode, LocalizedName> = {
  information_technology: { fi: 'Informaatioteknologia', en: 'Information Technology' },
  engineering: { fi: 'Tekniikka', en: 'Engineering' },
  business: { fi: 'Liiketalous', en: 'Liiketalous' },
  culture: { fi: 'Kulttuuri', en: 'Kulttuuri' },
  natural_resources: { fi: 'Luonnonvara-ala', en: 'Luonnonvara-ala' },
  social_services_and_health_care: {
    fi: 'Sosiaali- ja terveysala',
    en: 'Sosiaali- ja terveysala',
  },
}

export const DEGREE_TITLES: Record<DegreeTitleCode, LocalizedName> = {
  engineer_amk: { fi: 'Insinööri (AMK)', en: 'Bachelor of Engineering' },
  bachelor_business_administration_amk: {
    fi: 'Tradenomi (AMK)',
    en: 'Bachelor of Business Administration',
  },
  construction_architect_amk: {
    fi: 'Rakennusarkkitehti (AMK)',
    en: 'Rakennusarkkitehti (AMK)',
  },
  construction_site_manager_amk: {
    fi: 'Rakennusmestari (AMK)',
    en: 'Rakennusmestari (AMK)',
  },
}

export const DEGREE_PROGRAMMES: Record<
  DegreeProgrammeCode,
  LocalizedName & { fieldCode: EducationFieldCode; degreeTitleCode: DegreeTitleCode }
> = {
  information_and_communication_technology: {
    fi: 'Tietotekniikan tutkinto-ohjelma',
    en: 'Tietotekniikan tutkinto-ohjelma',
    fieldCode: 'information_technology',
    degreeTitleCode: 'engineer_amk',
  },
  business_information_systems: {
    fi: 'Tietojenkäsittelyn tutkinto-ohjelma',
    en: 'Tietojenkäsittelyn tutkinto-ohjelma',
    fieldCode: 'information_technology',
    degreeTitleCode: 'bachelor_business_administration_amk',
  },
  information_technology_beng: {
    fi: 'Bachelor of Engineering, Information Technology',
    en: 'Bachelor of Engineering, Information Technology',
    fieldCode: 'information_technology',
    degreeTitleCode: 'engineer_amk',
  },
  energy_and_environmental_engineering: {
    fi: 'Insinööri (AMK), energia- ja ympäristötekniikka',
    en: 'Insinööri (AMK), energia- ja ympäristötekniikka',
    fieldCode: 'engineering',
    degreeTitleCode: 'engineer_amk',
  },
  energy_and_environmental_engineering_beng: {
    fi: 'Bachelor of Engineering, Energy and Environmental Engineering',
    en: 'Bachelor of Engineering, Energy and Environmental Engineering',
    fieldCode: 'engineering',
    degreeTitleCode: 'engineer_amk',
  },
  mechanical_engineering: {
    fi: 'Insinööri (AMK), konetekniikka',
    en: 'Insinööri (AMK), konetekniikka',
    fieldCode: 'engineering',
    degreeTitleCode: 'engineer_amk',
  },
  mechanical_engineering_beng: {
    fi: 'Bachelor of Engineering, Mechanical Engineering',
    en: 'Bachelor of Engineering, Mechanical Engineering',
    fieldCode: 'engineering',
    degreeTitleCode: 'engineer_amk',
  },
  electrical_and_automation_engineering: {
    fi: 'Insinööri (AMK), sähkö- ja automaatiotekniikka',
    en: 'Insinööri (AMK), sähkö- ja automaatiotekniikka',
    fieldCode: 'engineering',
    degreeTitleCode: 'engineer_amk',
  },
  building_services_engineering: {
    fi: 'Insinööri (AMK), talotekniikka',
    en: 'Insinööri (AMK), talotekniikka',
    fieldCode: 'engineering',
    degreeTitleCode: 'engineer_amk',
  },
  civil_engineering: {
    fi: 'Insinööri (AMK), rakennus- ja yhdyskuntatekniikka',
    en: 'Insinööri (AMK), rakennus- ja yhdyskuntatekniikka',
    fieldCode: 'engineering',
    degreeTitleCode: 'engineer_amk',
  },
  construction_architecture: {
    fi: 'Rakennusarkkitehti (AMK)',
    en: 'Rakennusarkkitehti (AMK)',
    fieldCode: 'engineering',
    degreeTitleCode: 'construction_architect_amk',
  },
  construction_site_management: {
    fi: 'Rakennusmestari (AMK)',
    en: 'Rakennusmestari (AMK)',
    fieldCode: 'engineering',
    degreeTitleCode: 'construction_site_manager_amk',
  },
}

export const SPECIALIZATIONS: Record<SpecializationCode, LocalizedName> = {
  software_development: {
    fi: 'Ohjelmistokehityksen suuntautumisvaihtoehto',
    en: 'Ohjelmistokehityksen suuntautumisvaihtoehto',
  },
  device_oriented_software_development: {
    fi: 'Laiteläheinen ohjelmistokehitys',
    en: 'Laiteläheinen ohjelmistokehitys',
  },
  ai_solutions_in_business: {
    fi: 'AI-ratkaisut liiketoiminnassa',
    en: 'AI-ratkaisut liiketoiminnassa',
  },
}

export function educationName(
  names: LocalizedName,
  locale: 'fi' | 'en'
): string {
  return names[locale]
}

export function educationFieldName(
  code: EducationFieldCode | null,
  locale: 'fi' | 'en'
): string | null {
  return code ? educationName(EDUCATION_FIELDS[code], locale) : null
}

export function degreeProgrammeName(
  code: DegreeProgrammeCode | null,
  locale: 'fi' | 'en'
): string | null {
  return code ? educationName(DEGREE_PROGRAMMES[code], locale) : null
}

export function degreeTitleName(
  programmeCode: DegreeProgrammeCode | null,
  locale: 'fi' | 'en'
): string | null {
  if (!programmeCode) return null
  return educationName(
    DEGREE_TITLES[DEGREE_PROGRAMMES[programmeCode].degreeTitleCode],
    locale
  )
}

export function specializationName(
  code: SpecializationCode | null,
  locale: 'fi' | 'en'
): string | null {
  return code ? educationName(SPECIALIZATIONS[code], locale) : null
}