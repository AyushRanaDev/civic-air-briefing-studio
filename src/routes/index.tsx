import { useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import Papa from "papaparse";
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Check,
  ClipboardPaste,
  FileUp,
  Leaf,
  LoaderCircle,
  Sparkles,
  Wind,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateAirQualityText } from "@/lib/air-quality.functions";
import { analyzeCsv, type AirRow, type StationAverage } from "@/lib/air-quality";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Civic Air Quality Briefing Studio" },
      {
        name: "description",
        content: "Analyze station readings and prepare clear community air-quality briefings.",
      },
      { property: "og:title", content: "Civic Air Quality Briefing Studio" },
      {
        property: "og:description",
        content: "Analyze station readings and prepare clear community air-quality briefings.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const EXPECTED_COLUMNS = ["station", "timestamp", "pm25", "pm10", "no2"] as const;

function Index() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [csvText, setCsvText] = useState("");
  const [rows, setRows] = useState<AirRow[]>([]);
  const [error, setError] = useState("");
  const [stakeholder, setStakeholder] = useState("Ward Officer");
  const [language, setLanguage] = useState("English");
  const [previousAverages, setPreviousAverages] = useState("");
  const [briefing, setBriefing] = useState("");
  const [advisory, setAdvisory] = useState("");
  const [busy, setBusy] = useState<"briefing" | "advisory" | null>(null);

  const analysis = useMemo(() => analyzeCsv(rows), [rows]);
  const missingCount = rows.reduce(
    (count, row) => count + EXPECTED_COLUMNS.filter((column) => !row[column].trim()).length,
    0,
  );

  const loadCsv = (text: string) => {
    setCsvText(text);
    setError("");
    const parsed = Papa.parse<Record<(typeof EXPECTED_COLUMNS)[number], string>>(text, {
      header: true,
      skipEmptyLines: "greedy",
    });
    const actualHeaders = parsed.meta.fields ?? [];
    if (
      actualHeaders.length !== EXPECTED_COLUMNS.length ||
      !EXPECTED_COLUMNS.every((column, index) => actualHeaders[index] === column) ||
      parsed.errors.length > 0
    ) {
      setRows([]);
      setError("Invalid format — use the exact headers and order shown above.");
      return;
    }
    if (parsed.data.length === 0) {
      setRows([]);
      setError("No data rows found. Add at least one station reading.");
      return;
    }
    setRows(
      parsed.data.map((row) => ({
        station: row.station ?? "",
        timestamp: row.timestamp ?? "",
        pm25: row.pm25 ?? "",
        pm10: row.pm10 ?? "",
        no2: row.no2 ?? "",
      })),
    );
    setBriefing("");
    setAdvisory("");
  };

  const handleFile = async (file?: File) => {
    if (!file) return;
    loadCsv(await file.text());
  };

  const requestText = async (kind: "briefing" | "advisory") => {
    if (analysis.stations.length === 0) return;
    setBusy(kind);
    try {
      const result = await generateAirQualityText({
        data: {
          kind,
          stations: analysis.stations,
          stakeholder,
          language,
          previousAverages: kind === "briefing" ? previousAverages : "",
        },
      });
      if (kind === "briefing") setBriefing(result.text);
      else setAdvisory(result.text);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Please try again.";
      toast.error("AI request failed", { description: message });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-surface/90">
        <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Wind aria-hidden="true" className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Civic Air Quality</p>
              <p className="text-xs text-muted-foreground">Briefing Studio</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
            <span className="size-2 rounded-full bg-good" />
            Local analysis workspace
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1480px] px-5 pb-16 pt-8 sm:px-8 sm:pt-12">
        <div className="mb-9 flex flex-col justify-between gap-5 border-b border-border pb-7 lg:flex-row lg:items-end">
          <div>
            <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-primary">
              <Activity className="size-4" aria-hidden="true" /> Field report workspace
            </p>
            <h1 className="max-w-3xl font-display text-3xl font-semibold leading-tight sm:text-4xl">
              Turn station readings into a clear civic briefing.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Review measurements, spot neighborhood hotspots, and prepare a stakeholder-ready summary.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
            <Leaf className="size-4 text-good" aria-hidden="true" />
            {rows.length > 0 ? `${rows.length} readings loaded` : "No readings loaded"}
          </div>
        </div>

        <section aria-labelledby="import-title" className="mb-10">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="section-kicker">01 / Data source</p>
              <h2 id="import-title" className="mt-1 font-display text-xl font-semibold">
                Add station readings
              </h2>
            </div>
            <div className="flex flex-wrap gap-2" aria-label="Required CSV headers">
              {EXPECTED_COLUMNS.map((column) => (
                <code key={column} className="column-chip">{column}</code>
              ))}
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.42fr)]">
            <div className="min-w-0">
              <label htmlFor="csv-input" className="sr-only">Paste CSV readings</label>
              <Textarea
                id="csv-input"
                value={csvText}
                onChange={(event) => setCsvText(event.target.value)}
                placeholder="station,timestamp,pm25,pm10,no2&#10;Central Park,2026-11-12 08:00,42,68,18"
                className="min-h-36 resize-y rounded-md border-border bg-surface font-mono text-sm leading-6 placeholder:text-muted-foreground/70"
              />
              {error && (
                <p role="alert" className="mt-2 flex items-center gap-2 text-sm text-destructive">
                  <AlertTriangle className="size-4 shrink-0" aria-hidden="true" /> {error}
                </p>
              )}
            </div>
            <div className="flex flex-col justify-between gap-4 border-l-0 border-border lg:border-l lg:pl-5">
              <p className="max-w-xs text-sm leading-6 text-muted-foreground">
                Paste a comma-separated file here, or choose a CSV from your device.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => loadCsv(csvText)} disabled={!csvText.trim()}>
                  <ClipboardPaste aria-hidden="true" /> Analyze CSV
                </Button>
                <Button variant="outline" asChild>
                  <label htmlFor="csv-file">
                    <FileUp aria-hidden="true" /> Upload CSV
                    <Input
                      ref={fileRef}
                      id="csv-file"
                      type="file"
                      accept=".csv,text/csv"
                      className="sr-only"
                      onChange={(event) => void handleFile(event.target.files?.[0])}
                    />
                  </label>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="readings-title" className="mb-12">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
            <div>
              <p className="section-kicker">02 / Reading ledger</p>
              <h2 id="readings-title" className="mt-1 font-display text-xl font-semibold">Observations</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{rows.length}</span> rows
              <span className="mx-2 text-border">/</span>
              <span className="font-semibold text-warning-foreground">{missingCount}</span> empty cells
            </p>
          </div>
          <div className="overflow-x-auto border-y border-border">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead>
                <tr className="bg-muted/60 text-xs uppercase text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">Station</th>
                  <th className="px-4 py-3 font-semibold">Timestamp</th>
                  <th className="px-4 py-3 text-right font-semibold">PM2.5</th>
                  <th className="px-4 py-3 text-right font-semibold">PM10</th>
                  <th className="px-4 py-3 text-right font-semibold">NO₂</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                      Your imported station readings will appear here.
                    </td>
                  </tr>
                ) : rows.map((row, index) => (
                  <tr key={`${row.station}-${row.timestamp}-${index}`} className="border-t border-border/70">
                    <ObservationCell value={row.station} />
                    <ObservationCell value={row.timestamp} />
                    <ObservationCell value={row.pm25} numeric />
                    <ObservationCell value={row.pm10} numeric />
                    <ObservationCell value={row.no2} numeric />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="averages-title" className="mb-12">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
            <div>
              <p className="section-kicker">03 / Station comparison</p>
              <h2 id="averages-title" className="mt-1 font-display text-xl font-semibold">Average by station</h2>
            </div>
            <p className="text-xs text-muted-foreground">Ranked by average PM2.5 · empty readings excluded</p>
          </div>
          <div className="overflow-x-auto border-y border-border">
            <table className="w-full min-w-[680px] border-collapse text-left text-sm">
              <thead>
                <tr className="bg-muted/60 text-xs uppercase text-muted-foreground">
                  <th className="w-16 px-4 py-3 font-semibold">Rank</th>
                  <th className="px-4 py-3 font-semibold">Station</th>
                  <th className="px-4 py-3 text-right font-semibold">PM2.5 avg</th>
                  <th className="px-4 py-3 text-right font-semibold">PM10 avg</th>
                  <th className="px-4 py-3 text-right font-semibold">NO₂ avg</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {analysis.stations.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-9 text-center text-muted-foreground">Station averages will appear after analysis.</td></tr>
                ) : analysis.stations.map((station, index) => <AverageRow key={station.station} station={station} rank={index + 1} />)}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="briefing-title" className="grid gap-8 border-t border-border pt-8 xl:grid-cols-[minmax(300px,0.78fr)_minmax(0,1.22fr)]">
          <div>
            <p className="section-kicker">04 / Briefing desk</p>
            <h2 id="briefing-title" className="mt-1 font-display text-xl font-semibold">Prepare a briefing</h2>
            <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
              The AI receives station averages only—not individual readings.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <div>
                <label className="mb-2 block text-sm font-medium" htmlFor="stakeholder-select">For</label>
                <Select value={stakeholder} onValueChange={setStakeholder}>
                  <SelectTrigger id="stakeholder-select"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ward Officer">Ward Officer</SelectItem>
                    <SelectItem value="Housing Society">Housing Society</SelectItem>
                    <SelectItem value="School">School</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium" htmlFor="previous-brief">Previous station averages <span className="font-normal text-muted-foreground">(optional)</span></label>
                <Textarea
                  id="previous-brief"
                  value={previousAverages}
                  onChange={(event) => setPreviousAverages(event.target.value)}
                  placeholder="Paste earlier station averages to compare"
                  className="min-h-24 resize-y rounded-md border-border bg-surface text-sm"
                />
              </div>
            </div>
            <Button className="mt-5 w-full sm:w-auto" disabled={!analysis.stations.length || busy !== null} onClick={() => void requestText("briefing")}>
              {busy === "briefing" ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Sparkles aria-hidden="true" />}
              {busy === "briefing" ? "Preparing…" : "Generate Briefing"}
            </Button>
            <div className="mt-8 border-t border-border pt-6">
              <p className="section-kicker">Citizen advisory</p>
              <div className="mt-3 flex flex-wrap items-end gap-3">
                <div className="min-w-36 flex-1">
                  <label className="mb-2 block text-sm font-medium" htmlFor="language-select">Language</label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger id="language-select"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Hindi">Hindi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" disabled={!analysis.stations.length || busy !== null} onClick={() => void requestText("advisory")}>
                  {busy === "advisory" ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Wind aria-hidden="true" />}
                  {busy === "advisory" ? "Preparing…" : "Create advisory"}
                </Button>
              </div>
            </div>
          </div>

          <div aria-live="polite" className="min-h-64 border-l-0 border-border xl:border-l xl:pl-8">
            {advisory ? (
              <TextResult label={`Citizen advisory · ${language}`} text={advisory} onClear={() => setAdvisory("")} />
            ) : briefing ? (
              <TextResult label={`Stakeholder briefing · ${stakeholder}`} text={briefing} onClear={() => setBriefing("")} />
            ) : (
              <div className="flex h-full min-h-64 flex-col items-center justify-center border-y border-dashed border-border px-6 py-10 text-center">
                <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
                  <Sparkles className="size-5" aria-hidden="true" />
                </div>
                <h3 className="font-display text-lg font-semibold">Your briefing will appear here</h3>
                <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Load station data to generate a summary and recommendations.</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function ObservationCell({ value, numeric = false }: { value: string; numeric?: boolean }) {
  const empty = value.trim() === "";
  return (
    <td className={`px-4 py-3 ${numeric ? "text-right tabular-nums" : ""} ${empty ? "bg-warning/25 text-warning-foreground" : ""}`}>
      {empty ? <span className="sr-only">Empty cell</span> : value}
    </td>
  );
}

function AverageRow({ station, rank }: { station: StationAverage; rank: number }) {
  const hotspot = station.pm25 !== null && station.pm25 > 60;
  return (
    <tr className="border-t border-border/70">
      <td className="px-4 py-3 font-mono text-muted-foreground">{String(rank).padStart(2, "0")}</td>
      <td className="px-4 py-3 font-medium">{station.station || "Unnamed station"}</td>
      <td className="px-4 py-3 text-right font-mono tabular-nums">{formatAverage(station.pm25)}</td>
      <td className="px-4 py-3 text-right font-mono tabular-nums">{formatAverage(station.pm10)}</td>
      <td className="px-4 py-3 text-right font-mono tabular-nums">{formatAverage(station.no2)}</td>
      <td className="px-4 py-3">
        {hotspot ? <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-hotspot"><AlertTriangle className="size-3.5" aria-hidden="true" /> Hotspot</span> : <span className="inline-flex items-center gap-1.5 text-xs text-good"><Check className="size-3.5" aria-hidden="true" /> Within threshold</span>}
      </td>
    </tr>
  );
}

function TextResult({ label, text, onClear }: { label: string; text: string; onClear: () => void }) {
  return (
    <div className="h-full border-y border-border py-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="section-kicker">{label}</p>
        <Button variant="ghost" size="sm" onClick={onClear}>Clear</Button>
      </div>
      <p className="whitespace-pre-wrap text-sm leading-7">{text}</p>
    </div>
  );
}

function formatAverage(value: number | null) {
  return value === null ? "—" : value.toFixed(1);
}
