import { describe, expect, it } from "vitest";
import { analyzeCsv, type AirRow } from "@/lib/air-quality";

describe("station averages", () => {
  it("skips empty pollutant readings and sorts stations by PM2.5 average", () => {
    const rows: AirRow[] = [
      { station: "North", timestamp: "08:00", pm25: "80", pm10: "100", no2: "20" },
      { station: "North", timestamp: "09:00", pm25: "", pm10: "", no2: "40" },
      { station: "South", timestamp: "08:00", pm25: "40", pm10: "60", no2: "" },
    ];

    const result = analyzeCsv(rows);

    expect(result.missingCount).toBe(3);
    expect(result.stations[0]).toEqual({ station: "North", pm25: 80, pm10: 100, no2: 30 });
    expect(result.stations[1].pm25).toBe(40);
  });
});