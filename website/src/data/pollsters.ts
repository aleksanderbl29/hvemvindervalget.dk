/**
 * Canonical registry of Danish polling companies.
 * The `name` field must match the pollster values stored in the polls database table.
 */

export interface Pollster {
  /** Name as it appears in the polls.pollster database column */
  name: string;
  /** Short display name */
  shortName: string;
  /** Brand color (hex) */
  color: string;
  /** Official website */
  url: string;
  /** Logo URL — uses Google Favicon Service as a reliable public source */
  logoUrl: string;
}

export const POLLSTERS: Pollster[] = [
  {
    name: "Epinion",
    shortName: "Epinion",
    color: "#0057A8",
    url: "https://epinion.dk",
    logoUrl: "https://www.google.com/s2/favicons?domain=epinion.dk&sz=64",
  },
  {
    name: "Verian",
    shortName: "Verian",
    color: "#E05206",
    url: "https://www.veriangroup.com",
    logoUrl: "https://www.google.com/s2/favicons?domain=veriangroup.com&sz=64",
  },
];

/** Look up a pollster by name (case-insensitive) in O(1). */
export const POLLSTER_BY_NAME: Record<string, Pollster> = Object.fromEntries(
  POLLSTERS.flatMap((p) => [
    [p.name.toLowerCase(), p],
    [p.name, p],
  ]),
);

/** Return the Pollster entry for a name, or a fallback with neutral styling. */
export function getPollster(name: string): Pollster {
  return (
    POLLSTER_BY_NAME[name] ??
    POLLSTER_BY_NAME[name.toLowerCase()] ?? {
      name,
      shortName: name,
      color: "#64748b",
      url: "",
      logoUrl: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(name.toLowerCase().replace(/\s+/g, "") + ".dk")}&sz=64`,
    }
  );
}
