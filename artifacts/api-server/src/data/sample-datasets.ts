import type { CsvDataType } from "@workspace/db";

export interface SampleDatasetMeta {
  id: string;
  name: string;
  description: string;
  domain: string;
  rowCount: number;
  columns: string[];
}

function computeStats(rows: Record<string, string>[], columns: string[]) {
  const numericColumns: string[] = [];
  const stats: Record<string, { min: number; max: number; mean: number }> = {};

  for (const col of columns) {
    const values = rows.map((r) => parseFloat(r[col] ?? "")).filter((v) => !isNaN(v));
    if (values.length > 0) {
      numericColumns.push(col);
      const min = Math.min(...values);
      const max = Math.max(...values);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      stats[col] = { min: +min.toFixed(4), max: +max.toFixed(4), mean: +mean.toFixed(4) };
    }
  }

  return { numericColumns, stats };
}

const PLANT_GROWTH_ROWS: Record<string, string>[] = [
  { time_hours: "0", temperature_c: "22.1", humidity_pct: "65.2", co2_ppm: "400", growth_mm: "0.0" },
  { time_hours: "6", temperature_c: "23.5", humidity_pct: "67.8", co2_ppm: "412", growth_mm: "0.3" },
  { time_hours: "12", temperature_c: "25.0", humidity_pct: "70.1", co2_ppm: "425", growth_mm: "0.8" },
  { time_hours: "18", temperature_c: "24.2", humidity_pct: "68.5", co2_ppm: "418", growth_mm: "1.4" },
  { time_hours: "24", temperature_c: "22.8", humidity_pct: "66.0", co2_ppm: "405", growth_mm: "2.1" },
  { time_hours: "30", temperature_c: "23.1", humidity_pct: "66.8", co2_ppm: "408", growth_mm: "2.9" },
  { time_hours: "36", temperature_c: "24.7", humidity_pct: "69.3", co2_ppm: "420", growth_mm: "3.8" },
  { time_hours: "42", temperature_c: "25.3", humidity_pct: "71.2", co2_ppm: "430", growth_mm: "4.9" },
  { time_hours: "48", temperature_c: "23.9", humidity_pct: "67.9", co2_ppm: "415", growth_mm: "5.7" },
  { time_hours: "54", temperature_c: "22.5", humidity_pct: "65.5", co2_ppm: "402", growth_mm: "6.2" },
  { time_hours: "60", temperature_c: "23.8", humidity_pct: "68.0", co2_ppm: "416", growth_mm: "7.0" },
  { time_hours: "66", temperature_c: "25.1", humidity_pct: "70.8", co2_ppm: "428", growth_mm: "8.1" },
  { time_hours: "72", temperature_c: "24.4", humidity_pct: "69.1", co2_ppm: "422", growth_mm: "9.3" },
  { time_hours: "78", temperature_c: "22.9", humidity_pct: "66.2", co2_ppm: "406", growth_mm: "10.0" },
  { time_hours: "84", temperature_c: "23.6", humidity_pct: "67.5", co2_ppm: "411", growth_mm: "11.2" },
  { time_hours: "90", temperature_c: "25.5", humidity_pct: "71.5", co2_ppm: "432", growth_mm: "12.5" },
  { time_hours: "96", temperature_c: "24.0", humidity_pct: "68.2", co2_ppm: "417", growth_mm: "13.4" },
  { time_hours: "102", temperature_c: "22.3", humidity_pct: "65.8", co2_ppm: "403", growth_mm: "14.1" },
  { time_hours: "108", temperature_c: "23.4", humidity_pct: "67.2", co2_ppm: "410", growth_mm: "15.0" },
  { time_hours: "114", temperature_c: "24.8", humidity_pct: "69.8", co2_ppm: "424", growth_mm: "16.2" },
];

const AIR_QUALITY_ROWS: Record<string, string>[] = [
  { datetime: "2026-01-01 08:00", pm25_ugm3: "12.4", pm10_ugm3: "24.1", no2_ppb: "18.3", o3_ppb: "31.5", aqi: "52" },
  { datetime: "2026-01-01 09:00", pm25_ugm3: "15.2", pm10_ugm3: "28.7", no2_ppb: "22.1", o3_ppb: "28.9", aqi: "58" },
  { datetime: "2026-01-01 10:00", pm25_ugm3: "18.7", pm10_ugm3: "35.2", no2_ppb: "28.4", o3_ppb: "35.2", aqi: "65" },
  { datetime: "2026-01-01 11:00", pm25_ugm3: "22.1", pm10_ugm3: "41.8", no2_ppb: "34.7", o3_ppb: "42.1", aqi: "73" },
  { datetime: "2026-01-01 12:00", pm25_ugm3: "19.4", pm10_ugm3: "37.5", no2_ppb: "30.2", o3_ppb: "51.3", aqi: "69" },
  { datetime: "2026-01-01 13:00", pm25_ugm3: "16.8", pm10_ugm3: "31.9", no2_ppb: "25.8", o3_ppb: "58.7", aqi: "63" },
  { datetime: "2026-01-01 14:00", pm25_ugm3: "14.1", pm10_ugm3: "27.3", no2_ppb: "21.4", o3_ppb: "62.4", aqi: "57" },
  { datetime: "2026-01-01 15:00", pm25_ugm3: "13.5", pm10_ugm3: "25.8", no2_ppb: "19.7", o3_ppb: "59.8", aqi: "55" },
  { datetime: "2026-01-01 16:00", pm25_ugm3: "17.9", pm10_ugm3: "33.6", no2_ppb: "26.3", o3_ppb: "53.1", aqi: "64" },
  { datetime: "2026-01-01 17:00", pm25_ugm3: "24.3", pm10_ugm3: "45.7", no2_ppb: "38.9", o3_ppb: "44.2", aqi: "78" },
  { datetime: "2026-01-01 18:00", pm25_ugm3: "31.2", pm10_ugm3: "58.4", no2_ppb: "47.1", o3_ppb: "35.8", aqi: "89" },
  { datetime: "2026-01-01 19:00", pm25_ugm3: "35.8", pm10_ugm3: "67.2", no2_ppb: "52.4", o3_ppb: "28.3", aqi: "101" },
  { datetime: "2026-01-01 20:00", pm25_ugm3: "28.4", pm10_ugm3: "53.1", no2_ppb: "43.7", o3_ppb: "22.1", aqi: "84" },
  { datetime: "2026-01-01 21:00", pm25_ugm3: "21.7", pm10_ugm3: "40.8", no2_ppb: "35.2", o3_ppb: "18.9", aqi: "72" },
  { datetime: "2026-01-01 22:00", pm25_ugm3: "16.3", pm10_ugm3: "30.7", no2_ppb: "26.8", o3_ppb: "15.4", aqi: "62" },
  { datetime: "2026-01-01 23:00", pm25_ugm3: "12.8", pm10_ugm3: "24.5", no2_ppb: "19.3", o3_ppb: "12.7", aqi: "53" },
  { datetime: "2026-01-02 00:00", pm25_ugm3: "10.2", pm10_ugm3: "19.8", no2_ppb: "14.8", o3_ppb: "10.1", aqi: "44" },
  { datetime: "2026-01-02 01:00", pm25_ugm3: "9.4", pm10_ugm3: "18.2", no2_ppb: "13.2", o3_ppb: "9.5", aqi: "40" },
  { datetime: "2026-01-02 02:00", pm25_ugm3: "8.7", pm10_ugm3: "16.9", no2_ppb: "12.1", o3_ppb: "8.8", aqi: "37" },
  { datetime: "2026-01-02 03:00", pm25_ugm3: "8.1", pm10_ugm3: "15.7", no2_ppb: "11.4", o3_ppb: "8.2", aqi: "35" },
];

const CHEM_REACTION_ROWS: Record<string, string>[] = [
  { time_min: "0", reactant_a_mol: "1.000", reactant_b_mol: "1.000", product_mol: "0.000", temperature_k: "298", ph: "7.0", conversion_pct: "0.0" },
  { time_min: "2", reactant_a_mol: "0.921", reactant_b_mol: "0.921", product_mol: "0.079", temperature_k: "299", ph: "6.8", conversion_pct: "7.9" },
  { time_min: "4", reactant_a_mol: "0.847", reactant_b_mol: "0.847", product_mol: "0.153", temperature_k: "301", ph: "6.6", conversion_pct: "15.3" },
  { time_min: "6", reactant_a_mol: "0.778", reactant_b_mol: "0.778", product_mol: "0.222", temperature_k: "303", ph: "6.4", conversion_pct: "22.2" },
  { time_min: "8", reactant_a_mol: "0.714", reactant_b_mol: "0.714", product_mol: "0.286", temperature_k: "305", ph: "6.2", conversion_pct: "28.6" },
  { time_min: "10", reactant_a_mol: "0.655", reactant_b_mol: "0.655", product_mol: "0.345", temperature_k: "307", ph: "6.0", conversion_pct: "34.5" },
  { time_min: "12", reactant_a_mol: "0.601", reactant_b_mol: "0.601", product_mol: "0.399", temperature_k: "308", ph: "5.9", conversion_pct: "39.9" },
  { time_min: "14", reactant_a_mol: "0.552", reactant_b_mol: "0.552", product_mol: "0.448", temperature_k: "310", ph: "5.7", conversion_pct: "44.8" },
  { time_min: "16", reactant_a_mol: "0.507", reactant_b_mol: "0.507", product_mol: "0.493", temperature_k: "311", ph: "5.6", conversion_pct: "49.3" },
  { time_min: "18", reactant_a_mol: "0.465", reactant_b_mol: "0.465", product_mol: "0.535", temperature_k: "312", ph: "5.5", conversion_pct: "53.5" },
  { time_min: "20", reactant_a_mol: "0.427", reactant_b_mol: "0.427", product_mol: "0.573", temperature_k: "313", ph: "5.4", conversion_pct: "57.3" },
  { time_min: "25", reactant_a_mol: "0.357", reactant_b_mol: "0.357", product_mol: "0.643", temperature_k: "314", ph: "5.2", conversion_pct: "64.3" },
  { time_min: "30", reactant_a_mol: "0.299", reactant_b_mol: "0.299", product_mol: "0.701", temperature_k: "315", ph: "5.1", conversion_pct: "70.1" },
  { time_min: "40", reactant_a_mol: "0.210", reactant_b_mol: "0.210", product_mol: "0.790", temperature_k: "315", ph: "5.0", conversion_pct: "79.0" },
  { time_min: "50", reactant_a_mol: "0.147", reactant_b_mol: "0.147", product_mol: "0.853", temperature_k: "315", ph: "4.9", conversion_pct: "85.3" },
  { time_min: "60", reactant_a_mol: "0.104", reactant_b_mol: "0.104", product_mol: "0.896", temperature_k: "315", ph: "4.8", conversion_pct: "89.6" },
  { time_min: "75", reactant_a_mol: "0.063", reactant_b_mol: "0.063", product_mol: "0.937", temperature_k: "314", ph: "4.8", conversion_pct: "93.7" },
  { time_min: "90", reactant_a_mol: "0.038", reactant_b_mol: "0.038", product_mol: "0.962", temperature_k: "314", ph: "4.7", conversion_pct: "96.2" },
  { time_min: "120", reactant_a_mol: "0.014", reactant_b_mol: "0.014", product_mol: "0.986", temperature_k: "313", ph: "4.7", conversion_pct: "98.6" },
  { time_min: "150", reactant_a_mol: "0.005", reactant_b_mol: "0.005", product_mol: "0.995", temperature_k: "312", ph: "4.7", conversion_pct: "99.5" },
];

function buildDataset(
  id: string,
  name: string,
  description: string,
  domain: string,
  filename: string,
  rows: Record<string, string>[]
): SampleDatasetMeta & { data: CsvDataType } {
  const columns = Object.keys(rows[0] ?? {});
  const { numericColumns, stats } = computeStats(rows, columns);

  const data: CsvDataType = {
    type: "csv",
    filename,
    columns,
    numericColumns,
    rowCount: rows.length,
    preview: rows.slice(0, 5),
    stats,
    uploadedAt: new Date().toISOString(),
  };

  return {
    id,
    name,
    description,
    domain,
    rowCount: rows.length,
    columns,
    data,
  };
}

export const SAMPLE_DATASETS = [
  buildDataset(
    "plant-growth",
    "Plant Growth Sensor",
    "96-hour controlled environment sensor readings tracking plant growth alongside temperature, humidity, and CO₂ levels. Ideal for photosynthesis rate analysis.",
    "biology",
    "plant_growth_sensor.csv",
    PLANT_GROWTH_ROWS
  ),
  buildDataset(
    "air-quality",
    "Air Quality Readings",
    "24-hour urban air quality monitor data including PM2.5, PM10, NO₂, and ozone levels. Useful for pollution trend analysis and AQI computation.",
    "chemistry",
    "air_quality_readings.csv",
    AIR_QUALITY_ROWS
  ),
  buildDataset(
    "chem-reaction",
    "Chemical Reaction Measurements",
    "Second-order reaction kinetics data tracking reactant depletion, product formation, temperature, and pH over 150 minutes. Useful for rate constant determination.",
    "chemistry",
    "chemical_reaction.csv",
    CHEM_REACTION_ROWS
  ),
];

export const SAMPLE_DATASET_MAP = new Map(SAMPLE_DATASETS.map((d) => [d.id, d]));
