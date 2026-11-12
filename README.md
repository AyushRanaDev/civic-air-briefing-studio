# Civic Air Briefing Studio

Build "Civic Air Quality Briefing Studio" with React + TypeScript + Tailwind. Use Lovable Cloud with an edge function calling the Lovable AI gateway Features (keep it simple, MVP quality):

1. Paste or upload a CSV. Expect these columns: station, timestamp, pm25, pm10, no2. Use papaparse. If the headers don't match exactly, show a "Invalid format" error. No fuzzy mapping.

2. Parse the data and show a table. Highlight empty cells in yellow and count them. Skip empty cells in averages (don't treat them as zero). No unit conversion, outlier detection or duplicate detection.

3. Compute average PM2.5/PM10/NO2 per station and rank the stations. Mark stations with PM2.5 average > 60 as "Hotspot".

4. A "Generate Briefing" button sends the station averages (not the raw rows) to the AI. The AI returns a plain-text summary, which is shown on screen. No evidence IDs and no validation of the output.

5. A stakeholder dropdown (Ward Officer / Housing Society / School). It is passed into the AI prompt as a variable, and the AI generates recommendations as free text. No priorities, timelines or structure.

6. A "Citizen advisory" button with a language dropdown (English and Hindi only) that generates a short advisory. Mention children and older adults in the prompt.

7. Previous brief: the user can paste a previous brief's station averages. The AI is asked to "compare". No coverage handling.

8. No database and no history. Refreshing loses everything.

9. Simple error toast if the AI call fails.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://civic-air-briefing-studio.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/92665f34-c768-4a75-825d-9ee5e6f0dbc3).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
