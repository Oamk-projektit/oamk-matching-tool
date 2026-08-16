# Oamk education terminology

Canonical sources checked on 16 August 2026:

- Oamk current degree offering: https://oamk.fi/koulutus/ammattikorkeakoulututkinnot/
- Oamk ICT engineering programme: https://oamk.fi/koulutus/ammattikorkeakoulututkinnot/insinoori-amk-tieto-ja-viestintatekniikka/
- Oamk business information systems programme: https://oamk.fi/koulutus/ammattikorkeakoulututkinnot/tradenomi-amk-tietojenkasittely/
- Oamk curricula, ICT engineering: https://opetussuunnitelmat.oamk.fi/68096/fi/68089/68157
- Oamk curricula, business information systems: https://opetussuunnitelmat.oamk.fi/68096/fi/68089/68125
- Oamk 2026 education guide linked from the current offering page.

The database previously used free text in `students.degree_programme` and
`students.department`. The latter is used as a field-of-education proxy by the
matching model and does not represent an organizational department. Stable codes
are now stored in `education_field_code`, `degree_programme_code` and
`specialization_code`. Localized display names live in `lib/education/catalog.ts`.

Known exact migrations:

| Old value | Canonical result |
|---|---|
| `Software Engineering` (student programme) | `Tietotekniikan tutkinto-ohjelma`; `Ohjelmistokehityksen suuntautumisvaihtoehto`; field `Informaatioteknologia` |
| `Business Information Technology` (student programme) | `Tietojenkäsittelyn tutkinto-ohjelma`; degree title `Tradenomi (AMK)`; field `Informaatioteknologia` |
| `Information Technology` (English-taught student programme) | `Bachelor of Engineering, Information Technology`; field `Informaatioteknologia` |
| `Tietotekniikka` / `Tieto- ja viestintätekniikka` (legacy student programme) | `Tietotekniikan tutkinto-ohjelma` |
| `ICT` in the legacy field columns | `Informaatioteknologia` |

The current Oamk fields confirmed from the official offering are
`Informaatioteknologia`, `Tekniikka`, `Liiketalous`, `Kulttuuri`,
`Luonnonvara-ala` and `Sosiaali- ja terveysala`.

Current engineering offerings recorded in the canonical catalog are the two
official English-taught offerings and the Finnish offerings listed on Oamk's
current page: energy and environmental engineering, mechanical engineering,
electrical and automation engineering, building services engineering, civil
engineering, construction architecture and construction site management.
Finnish programme names are not given invented English translations: where Oamk
did not publish an English canonical label in the checked source, the official
Finnish name is used as the English-UI fallback.