import type { GptReasoningEffort } from "./types.js";

export type ClaudeEffort = "low" | "medium" | "high" | "max";
export type EffortSource = "cli" | "request" | "default";

export interface ResolveReasoningEffortOptions {
  cliOverride?: string;
  requestEffort?: string;
}

export interface ResolveReasoningEffortResult {
  effort: GptReasoningEffort;
  source: EffortSource;
}

const GPT_REASONING_EFFORTS: GptReasoningEffort[] = [
  "minimal",
  "low",
  "medium",
  "high",
  "xhigh",
];

const CLAUDE_REQUEST_EFFORTS: ClaudeEffort[] = [
  "low",
  "medium",
  "high",
  "max",
];

export function parseGptReasoningEffort(
  value: string | undefined
): GptReasoningEffort | undefined {
  if (!value) return undefined;
  const normalized = value.toLowerCase();
  return GPT_REASONING_EFFORTS.find((effort) => effort === normalized);
}

export function parseClaudeRequestEffort(
  value: string | undefined
): ClaudeEffort | undefined {
  if (!value) return undefined;
  const normalized = value.toLowerCase();
  return CLAUDE_REQUEST_EFFORTS.find((effort) => effort === normalized);
}

export function isClaudeOpus46Model(model: string): boolean {
  const normalized = model.toLowerCase();
  return normalized === "claude-opus-4-6" || normalized.startsWith("claude-opus-4-6-");
}

export function validateClaudeRequestEffortForModel(
  model: string,
  effort: string | undefined
): string | undefined {
  const parsedEffort = parseClaudeRequestEffort(effort);
  if (!parsedEffort || parsedEffort !== "max") {
    return undefined;
  }

  if (isClaudeOpus46Model(model)) {
    return undefined;
  }

  return "output_config.effort=max is only supported for claude-opus-4-6 requests";
}

export function mapClaudeEffortToGpt(
  effort: ClaudeEffort
): GptReasoningEffort {
  switch (effort) {
    case "max":
      return "xhigh";
    case "low":
    case "medium":
    case "high":
      return effort;
  }
}

export function resolveReasoningEffort(
  options: ResolveReasoningEffortOptions
): ResolveReasoningEffortResult {
  const cliEffort = parseGptReasoningEffort(options.cliOverride);
  if (cliEffort) {
    return {
      effort: cliEffort,
      source: "cli",
    };
  }

  const requestEffort = parseClaudeRequestEffort(options.requestEffort);
  if (requestEffort) {
    return {
      effort: mapClaudeEffortToGpt(requestEffort),
      source: "request",
    };
  }

  return {
    effort: "xhigh",
    source: "default",
  };
}
