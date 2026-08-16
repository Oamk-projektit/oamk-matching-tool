import { describe, expect, it } from 'vitest'
import fi from '@/messages/fi.json'
import {
  DEGREE_PROGRAMMES,
  degreeProgrammeName,
  degreeTitleName,
  educationFieldName,
  specializationName,
} from '@/lib/education/catalog'

describe('canonical Oamk education terminology', () => {
  it('localizes information technology without storing a UI-language value', () => {
    const code = 'information_and_communication_technology' as const

    expect(DEGREE_PROGRAMMES[code].fieldCode).toBe('information_technology')
    expect(degreeProgrammeName(code, 'fi')).toBe('Tietotekniikan tutkinto-ohjelma')
    expect(educationFieldName('information_technology', 'fi')).toBe(
      'Informaatioteknologia'
    )
    expect(degreeTitleName(code, 'fi')).toBe('Insinööri (AMK)')
    expect(specializationName('software_development', 'fi')).toBe(
      'Ohjelmistokehityksen suuntautumisvaihtoehto'
    )
  })

  it('keeps the official English-taught programme name in both locales', () => {
    expect(degreeProgrammeName('information_technology_beng', 'fi')).toBe(
      'Bachelor of Engineering, Information Technology'
    )
    expect(degreeProgrammeName('information_technology_beng', 'en')).toBe(
      'Bachelor of Engineering, Information Technology'
    )
  })

  it('maps the former Business Information Technology fixture semantically', () => {
    expect(degreeProgrammeName('business_information_systems', 'fi')).toBe(
      'Tietojenkäsittelyn tutkinto-ohjelma'
    )
    expect(educationFieldName('information_technology', 'fi')).not.toBe(
      'Liiketalous'
    )
    expect(degreeTitleName('business_information_systems', 'fi')).toBe(
      'Tradenomi (AMK)'
    )
  })

  it('uses field terminology instead of department terminology in Finnish staff UI', () => {
    expect(fi.teacher.studentCard.educationField).toBe('Ala')
    expect(fi.teacher.studentCard).not.toHaveProperty('department')
    expect(JSON.stringify(fi.teacher.studentCard).toUpperCase()).not.toContain('OSASTO')
  })
})
