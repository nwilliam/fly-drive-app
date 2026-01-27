/**
 * airport-puller.js
 *
 * Builds a static JS module exporting all PUBLIC-USE AIRPORTS (no heliports, no seaplane bases)
 * within a radius (default 500nm) of KSTP.
 *
 * Output objects:
 *  { name:"...", icao:"...", faa:"...", lat:.., lon:.., flyingFromKSTP:.., drivingFromKSTP:.. },
 *
 * Requirements:
 *  - Node 18+ (global fetch)
 *  - npm i csv-parse
 *
 * Usage:
 *  node airport-puller.js --faa APT_BASE.csv --mapquestKey YOUR_KEY --out ./airports.js --radiusNm 500
 */

import fs from "node:fs";
import path from "node:path";
import { parse as parseCsv } from "csv-parse/sync";

function getArg(flag, fallback = null) {
  const i = process.argv.indexOf(flag);
  return i === -1 ? fallback : (process.argv[i + 1] ?? fallback);
}

const FAA_CSV_PATH = getArg("--faa");
const MAPQUEST_KEY = getArg("--mapquestKey");
const OUT_PATH_RAW = getArg("--out", "./airports.js");
const MAX_RADIUS_NM = Number(getArg("--radiusNm", "500"));

if (!FAA_CSV_PATH) throw new Error("Missing --faa path to FAA APT csv/tsv file");
if (!MAPQUEST_KEY) throw new Error("Missing --mapquestKey");
if (!Number.isFinite(MAX_RADIUS_NM) || MAX_RADIUS_NM <= 0) {
  throw new Error("--radiusNm must be a positive number");
}

// Resolve output path:
// - If user passes "/airports.js" on Windows, that becomes "C:\\airports.js" (root of current drive).
const OUT_PATH = path.isAbsolute(OUT_PATH_RAW)
  ? OUT_PATH_RAW
  : path.resolve(process.cwd(), OUT_PATH_RAW);

/** KSTP (St Paul Downtown / Holman Field) */
const KSTP = { lat: 44.9345, lon: -93.0604 };

/** Great-circle distance in nautical miles */
function haversineNm(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R_km = 6371.0088;
  const kmPerNm = 1.852;

  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R_km * c) / kmPerNm;
}

function escString(s) {
  return String(s ?? "").replace(/\\/g, "\\\\").replace(/"/g, '\\"').trim();
}

/**
 * Detect delimiter from the header line.
 * - FAA files are often tab-delimited; sometimes comma.
 */
function detectDelimiter(fileText) {
  const firstLine = fileText.split(/\r?\n/, 1)[0] ?? "";
  const tabs = (firstLine.match(/\t/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  if (tabs === 0 && commas === 0) {
    throw new Error("Could not detect delimiter (no tabs or commas found in header line).");
  }
  return tabs >= commas ? "\t" : ",";
}

/**
 * Loads FAA APT file using your exact schema columns:
 *  SITE_TYPE_CODE, FACILITY_USE_CODE, ARPT_NAME, ARPT_ID, ICAO_ID, LAT_DECIMAL, LONG_DECIMAL
 *
 * Filters:
 *  - SITE_TYPE_CODE === "A"  (airport only; excludes heliports + seaplane bases)
 *  - FACILITY_USE_CODE === "PU" (public use only)
 */
function loadEligibleAirportsFromFaa(filePath) {
  const fileText = fs.readFileSync(filePath, "utf8");
  const delimiter = detectDelimiter(fileText);

  const records = parseCsv(fileText, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
    delimiter, // <-- fixed (string, not regex)
    relax_quotes: true,
    relax_column_count: true,
    trim: true,
  });

  const out = [];

  for (const r of records) {
    const siteType = String(r.SITE_TYPE_CODE ?? "").trim().toUpperCase();
    const useCode = String(r.FACILITY_USE_CODE ?? "").trim().toUpperCase();

    if (siteType !== "A") continue; // only airports
    if (useCode !== "PU") continue; // only public-use

    const name = String(r.ARPT_NAME ?? "").trim();
    const faa = String(r.ARPT_ID ?? "").trim();
    const icao = String(r.ICAO_ID ?? "").trim();

    const lat = Number(String(r.LAT_DECIMAL ?? "").trim());
    const lon = Number(String(r.LONG_DECIMAL ?? "").trim());
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

    const nm = haversineNm(KSTP.lat, KSTP.lon, lat, lon);
    if (nm > MAX_RADIUS_NM) continue;

    out.push({
      name,
      icao,
      faa,
      lat,
      lon,
      flyingFromKSTP: Math.round(nm),
      drivingFromKSTP: null,
    });
  }

  return out;
}

/**
 * MapQuest Route Matrix API (one-to-many).
 * Returns distances in miles when options.unit = "m".
 */
/**
 * MapQuest Route Matrix API (one-to-many).
 * Handles both:
 *  - 1D distance array: [0, d1, d2, ...]
 *  - 2D distance matrix: [[0, d1, d2, ...], [..], ...]
 */
async function mapquestDrivingMilesOneToMany(origin, destinations, mapquestKey) {
  const url = `https://www.mapquestapi.com/directions/v2/routematrix?key=${encodeURIComponent(
    mapquestKey
  )}`;

  const body = {
    locations: [
      `${origin.lat},${origin.lon}`,
      ...destinations.map((d) => `${d.lat},${d.lon}`),
    ],
    options: {
      unit: "m", // miles
      // routeType: "fastest",
      // allToAll: false, // some plans honor this, some ignore; parsing below covers both
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const msg =
      json?.info?.messages?.join(" | ") ||
      json?.messages?.join?.(" | ") ||
      JSON.stringify(json);
    throw new Error(`MapQuest routematrix HTTP ${res.status}: ${msg}`);
  }

  // MapQuest can return an "info" object with status + messages even on 200
  const statusCode = json?.info?.statuscode;
  if (typeof statusCode === "number" && statusCode !== 0) {
    const msg =
      json?.info?.messages?.join(" | ") ||
      json?.messages?.join?.(" | ") ||
      "Unknown MapQuest error";
    throw new Error(`MapQuest routematrix statuscode ${statusCode}: ${msg}`);
  }

  const dist = json?.distance;

  // Case A: 1D array: [0, d1, d2, ...]
  if (Array.isArray(dist) && dist.length === destinations.length + 1 && !Array.isArray(dist[0])) {
    return dist.slice(1).map((d) => (Number.isFinite(d) ? Math.round(d) : null));
  }

  // Case B: 2D matrix: [[0,d1,d2..],[...],...]
  // Expected size: (N x N) where N = destinations.length + 1
  if (Array.isArray(dist) && Array.isArray(dist[0])) {
    const N = destinations.length + 1;
    const firstRow = dist[0];
    if (Array.isArray(firstRow) && firstRow.length >= N) {
      return firstRow.slice(1, N).map((d) => (Number.isFinite(d) ? Math.round(d) : null));
    }
  }

  // If we get here, shape is unexpected. Include a tiny hint without dumping huge JSON.
  const distanceType = Array.isArray(dist)
    ? Array.isArray(dist[0]) ? "2D array" : "1D array (wrong length)"
    : typeof dist;

  throw new Error(
    `Unexpected MapQuest response shape: distance is ${distanceType}. ` +
    `Keys present: ${Object.keys(json || {}).join(", ")}`
  );
}


async function main() {
  const airports = loadEligibleAirportsFromFaa(FAA_CSV_PATH);

  airports.sort((a, b) => a.flyingFromKSTP - b.flyingFromKSTP);

  const BATCH_SIZE = 25;
  for (let i = 0; i < airports.length; i += BATCH_SIZE) {
    const chunk = airports.slice(i, i + BATCH_SIZE);
    const miles = await mapquestDrivingMilesOneToMany(KSTP, chunk, MAPQUEST_KEY);

    miles.forEach((m, idx) => {
      chunk[idx].drivingFromKSTP = m;
    });

    console.log(`Driving distances: ${Math.min(i + BATCH_SIZE, airports.length)}/${airports.length}`);
  }

  const lines = airports.map((a) => {
    const lat = Number(a.lat.toFixed(4));
    const lon = Number(a.lon.toFixed(4));
    return `  { name:"${escString(a.name)}", icao:"${escString(a.icao)}", faa:"${escString(
      a.faa
    )}", lat:${lat.toFixed(4)}, lon:${lon.toFixed(4)}, flyingFromKSTP:${a.flyingFromKSTP}, drivingFromKSTP:${a.drivingFromKSTP ?? "null"} },`;
  });

  const outText =
    `// Auto-generated. Public-use AIRPORTS (SITE_TYPE_CODE=A, FACILITY_USE_CODE=PU) within ${MAX_RADIUS_NM}nm of KSTP.\n` +
    `export const AIRPORTS_WITHIN_${MAX_RADIUS_NM}NM = [\n` +
    lines.join("\n") +
    `\n];\n`;

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, outText, "utf8");

  console.log(`Wrote: ${OUT_PATH}`);
  console.log(`Count: ${airports.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
