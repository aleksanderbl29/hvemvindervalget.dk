/**
 * Canonical registry of Danish political parties.
 * Use this as the single source of truth for party codes, names, colors, and URLs.
 * Party codes match those used in the polls database (party_code column).
 */

export interface Party {
  /** Single- or double-letter party code matching the database party_code column */
  code: string;
  /** Full official party name */
  name: string;
  /** Short display name for compact UI */
  shortName: string;
  /** Brand color (hex) */
  color: string;
  /** Official party website */
  url?: string;
}

export const PARTIES: Party[] = [
  {
    code: "A",
    name: "Socialdemokratiet",
    shortName: "Socialdemokratiet",
    color: "#C0222B",
    url: "https://www.socialdemokratiet.dk",
  },
  {
    code: "V",
    name: "Venstre",
    shortName: "Venstre",
    color: "#003B8A",
    url: "https://www.venstre.dk",
  },
  {
    code: "M",
    name: "Moderaterne",
    shortName: "Moderaterne",
    color: "#8B3F8B",
    url: "https://moderaterne.dk",
  },
  {
    code: "F",
    name: "SF – Socialistisk Folkeparti",
    shortName: "SF",
    color: "#E8005A",
    url: "https://sf.dk",
  },
  {
    code: "Æ",
    name: "Danmarksdemokraterne",
    shortName: "Danmarksdemokraterne",
    color: "#235789",
    url: "https://danmarksdemokraterne.dk",
  },
  {
    code: "I",
    name: "Liberal Alliance",
    shortName: "Liberal Alliance",
    color: "#00A8CC",
    url: "https://liberalalliance.dk",
  },
  {
    code: "C",
    name: "Det Konservative Folkeparti",
    shortName: "Konservative",
    color: "#1D5E2A",
    url: "https://konservative.dk",
  },
  {
    code: "Ø",
    name: "Enhedslisten",
    shortName: "Enhedslisten",
    color: "#E5383B",
    url: "https://enhedslisten.dk",
  },
  {
    code: "B",
    name: "Radikale Venstre",
    shortName: "Radikale",
    color: "#C0277E",
    url: "https://www.radikale.dk",
  },
  {
    code: "H",
    name: "Borgernes Parti",
    shortName: "Borgernes Parti",
    color: "#2E4057",
    url: "https://borgernes-parti.dk",
  },
  {
    code: "Å",
    name: "Alternativet",
    shortName: "Alternativet",
    color: "#2BAE66",
    url: "https://alternativet.dk",
  },
  {
    code: "O",
    name: "Dansk Folkeparti",
    shortName: "Dansk Folkeparti",
    color: "#E8A400",
    url: "https://www.danskfolkeparti.dk",
  },
  {
    code: "D",
    name: "Nye Borgerlige",
    shortName: "Nye Borgerlige",
    color: "#213B80",
    url: "https://nyeborgerlige.dk",
  },
  {
    code: "K",
    name: "Kristendemokraterne",
    shortName: "KD",
    color: "#007B40",
    url: "https://www.kd.dk",
  },
  {
    code: "Q",
    name: "Frie Grønne",
    shortName: "Frie Grønne",
    color: "#6DBF67",
    url: "https://friegroenne.dk",
  },
];

/** Look up a party by its code in O(1). Falls back gracefully if not found. */
export const PARTY_BY_CODE: Record<string, Party> = Object.fromEntries(
  PARTIES.map((p) => [p.code, p]),
);

/** Return the brand color for a party code, with a sensible default. */
export function partyColor(code: string): string {
  return PARTY_BY_CODE[code]?.color ?? "#94a3b8";
}
