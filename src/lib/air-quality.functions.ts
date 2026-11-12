import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { CSV_COLUMNS, type StationAverage } from "./air-quality";
import { generateBriefingText } from "./air-quality.server";

const stationSchema = z.object({
  station: z.string(),
  pm25: z.number().nullable(),
  pm10: z.number().nullable(),
  no2: z.number().nullable(),
});

const requestSchema = z.object({
  kind: z.enum(["briefing", "advisory"]),
  stations: z.array(stationSchema).min(1).max(500),
  stakeholder: z.enum(["Ward Officer", "Housing Society", "School"]),
  language: z.enum(["English", "Hindi"]),
  previousAverages: z.string().max(12000),
});

export const generateAirQualityText = createServerFn({ method: "POST" })
  .inputValidator((input: z.input<typeof requestSchema>) => requestSchema.parse(input))
  .handler(async ({ data }): Promise<{ text: string }> => {
    const request = getRequest();
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI generation is not configured.");
    const stations: StationAverage[] = data.stations.map((station) => ({
      station: station.station,
      pm25: station.pm25,
      pm10: station.pm10,
      no2: station.no2,
    }));
    return generateBriefingText(
      request,
      { apiKey, baseURL: "https://ai.gateway.lovable.dev/v1", model: "openai/gpt-6-astra" },
      {
        kind: data.kind,
        stations,
        stakeholder: data.stakeholder,
        language: data.language,
        previousAverages: data.previousAverages,
      },
    );
  });

export { CSV_COLUMNS };