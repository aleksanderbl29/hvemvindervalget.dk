import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Runtime validation helpers
function validateString(value: unknown, fieldName: string): string {
  if (typeof value !== "string") {
    throw new Error(`Invalid ${fieldName}: expected string, got ${typeof value}`);
  }
  return value;
}

function validateNumber(value: unknown, fieldName: string): number {
  if (typeof value !== "number" || isNaN(value)) {
    throw new Error(`Invalid ${fieldName}: expected number, got ${typeof value}`);
  }
  return value;
}

function validateArray(value: unknown, fieldName: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`Invalid ${fieldName}: expected array, got ${typeof value}`);
  }
  return value;
}

function validateOptional<T>(
  value: unknown,
  fieldName: string,
  validator: (val: unknown) => T,
): T | undefined {
  if (value === undefined || value === null) return undefined;
  return validator(value);
}

// Table-specific runtime validators
function validateNationalOverview(data: unknown): Record<string, unknown> {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    throw new Error("Invalid national_overview data: expected object");
  }
  const obj = data as Record<string, unknown>;
  return {
    lastUpdated: validateString(obj.lastUpdated, "lastUpdated"),
    turnoutEstimate: validateNumber(obj.turnoutEstimate, "turnoutEstimate"),
    uncertainty: validateNumber(obj.uncertainty, "uncertainty"),
    partyProjections: validateArray(obj.partyProjections, "partyProjections"),
    scenarioNotes: validateArray(obj.scenarioNotes, "scenarioNotes"),
    primaryChart: validateOptional(obj.primaryChart, "primaryChart", (val) => {
      if (typeof val !== "object" || val === null) throw new Error("Invalid primaryChart");
      return val as Record<string, unknown>;
    }),
  };
}

function validateMunicipalitySnapshots(data: unknown): Record<string, unknown> {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    throw new Error("Invalid municipality_snapshots data: expected object");
  }
  const obj = data as Record<string, unknown>;
  return {
    slug: validateString(obj.slug, "slug"),
    name: validateString(obj.name, "name"),
    region: validateString(obj.region, "region"),
    leadingParty: validateString(obj.leadingParty, "leadingParty"),
    voteShare: validateNumber(obj.voteShare, "voteShare"),
    turnout: validateNumber(obj.turnout, "turnout"),
  };
}

function validatePolls(data: unknown): Record<string, unknown> {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    throw new Error("Invalid polls data: expected object");
  }
  const obj = data as Record<string, unknown>;
  return {
    pollster: validateString(obj.pollster, "pollster"),
    conductedAt: validateString(obj.conductedAt, "conductedAt"),
    sampleSize: validateNumber(obj.sampleSize, "sampleSize"),
    methodology: validateString(obj.methodology, "methodology"),
    parties: validateArray(obj.parties, "parties"),
    chartSummary: validateOptional(obj.chartSummary, "chartSummary", (val) => {
      if (typeof val !== "object" || val === null) throw new Error("Invalid chartSummary");
      return val as Record<string, unknown>;
    }),
  };
}

function validateScenarios(data: unknown): Record<string, unknown> {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    throw new Error("Invalid scenarios data: expected object");
  }
  const obj = data as Record<string, unknown>;
  return {
    name: validateString(obj.name, "name"),
    description: validateString(obj.description, "description"),
    probability: validateNumber(obj.probability, "probability"),
    impactedParties: validateArray(obj.impactedParties, "impactedParties"),
    chartSummary: validateOptional(obj.chartSummary, "chartSummary", (val) => {
      if (typeof val !== "object" || val === null) throw new Error("Invalid chartSummary");
      return val as Record<string, unknown>;
    }),
  };
}

function validateCurrentElectionResults(data: unknown): Record<string, unknown> {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    throw new Error("Invalid current_election_results data: expected object");
  }
  const obj = data as Record<string, unknown>;
  return {
    afstemningsomrade: validateString(obj.afstemningsomrade, "afstemningsomrade"),
    bogstavbetegnelse: validateString(obj.bogstavbetegnelse, "bogstavbetegnelse"),
    listenavn: validateString(obj.listenavn, "listenavn"),
    navn: validateString(obj.navn, "navn"),
    stemmetal: validateNumber(obj.stemmetal, "stemmetal"),
    municipality: validateString(obj.municipality, "municipality"),
    lastPull: validateString(obj.lastPull, "lastPull"),
  };
}

const tableValidators: Record<
  string,
  (data: unknown) => Record<string, unknown>
> = {
  national_overview: validateNationalOverview,
  municipality_snapshots: validateMunicipalitySnapshots,
  polls: validatePolls,
  scenarios: validateScenarios,
  current_election_results: validateCurrentElectionResults,
};

export const insertRecord = mutation({
  args: {
    table: v.union(
      v.literal("national_overview"),
      v.literal("municipality_snapshots"),
      v.literal("polls"),
      v.literal("scenarios"),
      v.literal("current_election_results"),
    ),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    const { table, data } = args;

    // Validate data against table-specific schema
    const validator = tableValidators[table];
    if (!validator) {
      throw new Error(`Unknown table: ${table}`);
    }

    // Validate and normalize the data structure
    const validatedData = validator(data);

    // For national_overview, we typically want to replace the existing record
    if (table === "national_overview") {
      const existing = await ctx.db.query("national_overview").first();
      if (existing) {
        await ctx.db.replace(existing._id, validatedData);
        return { _id: existing._id };
      }
    }

    // For other tables, insert new records
    const _id = await ctx.db.insert(table, validatedData);
    return { _id };
  },
});
