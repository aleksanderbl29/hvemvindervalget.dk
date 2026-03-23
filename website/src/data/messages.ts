export const MESSAGES = {
  "modelSummary.description":
    "Den morke bjaelke viser modellens gennemsnit, og den lyse markering viser {rangeLabel}.",
  "modelLanding.databaseNotConfigured":
    "Modellen kan ikke vises endnu, fordi databasen ikke er konfigureret.",
} as const;

type MessageKey = keyof typeof MESSAGES;
type MessageParams = Record<string, string | number>;

export function formatMessage(key: MessageKey, params: MessageParams = {}): string {
  return MESSAGES[key].replace(/\{(\w+)\}/g, (_, token: string) => {
    const value = params[token];
    return value === undefined ? `{${token}}` : String(value);
  });
}
