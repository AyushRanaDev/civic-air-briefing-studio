export const CSV_COLUMNS = ["station", "timestamp", "pm25", "pm10", "no2"] as const;

export type CsvColumn = (typeof CSV_COLUMNS)[number];
export type AirRow = Record<CsvColumn, string>;

export type StationAverage = {
  station: string;
  pm25: number | null;
  pm10: number | null;
  no2: number | null;
};

export function analyzeCsv(rows: AirRow[]) {
  const missingCount = rows.reduce(
    (count, row) => count + CSV_COLUMNS.filter((column) => !row[column].trim()).length,
    0,
  );
  const stations = new Map<string, AirRow[]>();
  for (const row of rows) {
    const group = stations.get(row.station) ?? [];
    group.push(row);
    stations.set(row.station, group);
  }

  const averages = Array.from(stations, ([station, observations]) => ({
    station,
    pm25: average(observations.map((row) => row.pm25)),
    pm10: average(observations.map((row) => row.pm10)),
    no2: average(observations.map((row) => row.no2)),
  } satisfies StationAverage)).sort((left, right) => {
    if (left.pm25 === null) return right.pm25 === null ? left.station.localeCompare(right.station) : 1;
    if (right.pm25 === null) return -1;
    return right.pm25 - left.pm25;
  });

  return { missingCount, stations: averages };
}

function average(values: string[]) {
  const numericValues = values
    .filter((value) => value.trim() !== "")
    .map(Number)
    .filter(Number.isFinite);
  if (numericValues.length === 0) return null;
  return numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length;
}