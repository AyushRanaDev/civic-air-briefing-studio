import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { getLovableAiGatewayRunId, createLovableAiGatewayRunIdFetch } from "./run-id.ts";
import type { StationAverage } from "./air-quality";

type GatewayConfig = { apiKey: string; baseURL: string; model: string };
type BriefingInput = {
  kind: "briefing" | "advisory";
  stations: StationAverage[];
  stakeholder: string;
  language: string;
  previousAverages: string;
};

export async function generateBriefingText(request: Request, config: GatewayConfig, input: BriefingInput) {
  const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(request));
  const openai = createOpenAI({
    baseURL: `${config.baseURL.replace(/\/+$/, "").replace(/\/v1$/, "")}/v1`,
    apiKey: config.apiKey,
    headers: { "Lovable-API-Key": config.apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });
  const isAdvisory = input.kind === "advisory";
  const instructions = isAdvisory
    ? `Write a concise citizen air-quality advisory in ${input.language}. Mention practical ways to reduce exposure, with particular care for children and older adults. Use plain language and only the provided station averages. Do not invent causes, health diagnoses, or numerical readings.`
    : `Write a plain-text civic air-quality briefing for a ${input.stakeholder}. Summarize the station averages and provide practical recommendations for this stakeholder as free text. If previous station averages are supplied, compare the current figures with them without discussing coverage or inventing trends. Do not infer causes or add readings not supplied.`;
  const payload = JSON.stringify({
    stationAverages: input.stations,
    ...(isAdvisory ? {} : { previousStationAverages: input.previousAverages || null }),
  });
  const result = streamText({
    model: openai.responses(config.model),
    instructions,
    prompt: payload,
    abortSignal: request.signal,
    maxRetries: 0,
    providerOptions: {
      openai: {
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        store: false,
        include: ["reasoning.encrypted_content"],
      },
    },
  });
  const text = await result.text;
  if (!text.trim()) throw new Error("The AI returned an empty response. Please try again.");
  return { text };
}