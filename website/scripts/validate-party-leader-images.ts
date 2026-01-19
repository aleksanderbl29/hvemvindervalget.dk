/**
 * Validates that all party leader images are accessible.
 * Checks HTTP status codes and content types for each image URL.
 */

import { partyLeaders } from "../src/data/party-leaders";

interface ValidationResult {
  leader: {
    partyLetter: string;
    partyName: string;
    leaderName: string;
  };
  imageUrl: string;
  success: boolean;
  error?: string;
  statusCode?: number;
  contentType?: string;
}

const REQUEST_TIMEOUT_MS = 10000; // 10 seconds
const REQUEST_DELAY_MS = 1000; // 1 second delay between requests to avoid rate limiting
const MAX_RETRIES = 2; // Retry up to 2 times for 429 errors

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function validateImageUrl(
  url: string,
  leader: { partyLetter: string; partyName: string; leaderName: string },
  retryCount = 0,
): Promise<ValidationResult> {
  const result: ValidationResult = {
    leader,
    imageUrl: url,
    success: false,
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const response = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ImageValidator/1.0)",
      },
    });

    clearTimeout(timeoutId);

    result.statusCode = response.status;

    // Handle 429 (rate limit) with retry
    if (response.status === 429 && retryCount < MAX_RETRIES) {
      const retryDelay = (retryCount + 1) * 2000; // 2s, 4s delays
      console.log(
        `  ⚠ Rate limited, retrying in ${retryDelay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})...`,
      );
      await sleep(retryDelay);
      return validateImageUrl(url, leader, retryCount + 1);
    }

    if (!response.ok) {
      // Try to get more details from the response body for 429 errors
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      if (response.status === 429) {
        try {
          const text = await response.text();
          if (text) {
            errorMessage += ` - ${text}`;
          }
        } catch {
          // Ignore errors reading response body
        }
      }
      result.error = errorMessage;
      return result;
    }

    const contentType = response.headers.get("content-type");
    result.contentType = contentType || undefined;

    if (!contentType || !contentType.startsWith("image/")) {
      result.error = `Invalid content type: ${contentType || "unknown"}. Expected image/*`;
      return result;
    }

    result.success = true;
    return result;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        result.error = `Request timeout after ${REQUEST_TIMEOUT_MS}ms`;
      } else if (error.name === "AggregateError" && "errors" in error) {
        const aggError = error as AggregateError;
        const errorMessages = aggError.errors.map((e) =>
          e instanceof Error ? e.message : String(e),
        );
        result.error = `${error.message} (${errorMessages.join(", ")})`;
      } else if (error.cause) {
        result.error = `${error.message} (cause: ${error.cause})`;
      } else {
        result.error = error.message || String(error);
      }
    } else {
      result.error = String(error);
    }
    return result;
  }
}

async function main() {
  console.log(`Validating ${partyLeaders.length} party leader images...\n`);

  // Process requests sequentially with delays to avoid rate limiting
  const results: ValidationResult[] = [];
  for (let i = 0; i < partyLeaders.length; i++) {
    const leader = partyLeaders[i];
    const result = await validateImageUrl(leader.imageUrl, {
      partyLetter: leader.partyLetter,
      partyName: leader.partyName,
      leaderName: leader.leaderName,
    });
    results.push(result);

    // Add delay between requests (except after the last one)
    if (i < partyLeaders.length - 1) {
      await sleep(REQUEST_DELAY_MS);
    }
  }

  const failures = results.filter((r) => !r.success);
  const successes = results.filter((r) => r.success);

  // Print results
  for (const result of results) {
    if (result.success) {
      console.log(
        `✓ ${result.leader.partyLetter} (${result.leader.partyName}) - ${result.leader.leaderName}`,
      );
    } else {
      console.error(
        `✗ ${result.leader.partyLetter} (${result.leader.partyName}) - ${result.leader.leaderName}`,
      );
      console.error(`  URL: ${result.imageUrl}`);
      console.error(`  Error: ${result.error}`);
      if (result.statusCode) {
        console.error(`  Status: ${result.statusCode}`);
      }
      if (result.contentType) {
        console.error(`  Content-Type: ${result.contentType}`);
      }
      console.error("");
    }
  }

  console.log(`\nSummary: ${successes.length} passed, ${failures.length} failed`);

  if (failures.length > 0) {
    console.error(`\n❌ Validation failed: ${failures.length} image(s) are inaccessible`);
    process.exit(1);
  } else {
    console.log(`\n✅ All images are accessible`);
    process.exit(0);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
