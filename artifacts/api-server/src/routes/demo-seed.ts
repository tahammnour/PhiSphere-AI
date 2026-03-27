import { Router, type IRouter } from "express";
import { db, labSessions, conversations, messages } from "@workspace/db";
import { like } from "drizzle-orm";
import type { CsvDataType } from "@workspace/db";

const router: IRouter = Router();

const DEMO_SESSIONS = [
  {
    name: "🌿 Plant Sensor Analysis Demo",
    description: "Greenhouse IoT sensor data — temperature, humidity, light intensity, and growth tracking over 30 days",
    domain: "biology",
    csvData: {
      type: "csv" as const,
      filename: "plant_sensor_data.csv",
      columns: ["day", "temperature_c", "humidity_pct", "light_lux", "growth_mm"],
      numericColumns: ["day", "temperature_c", "humidity_pct", "light_lux", "growth_mm"],
      rowCount: 30,
      preview: [
        { day: "1", temperature_c: "22.1", humidity_pct: "65.3", light_lux: "4200", growth_mm: "0.0" },
        { day: "2", temperature_c: "22.5", humidity_pct: "64.8", light_lux: "4350", growth_mm: "1.2" },
        { day: "3", temperature_c: "23.1", humidity_pct: "66.1", light_lux: "4100", growth_mm: "2.8" },
        { day: "4", temperature_c: "21.8", humidity_pct: "67.5", light_lux: "3950", growth_mm: "3.1" },
        { day: "5", temperature_c: "22.9", humidity_pct: "65.0", light_lux: "4450", growth_mm: "5.3" },
      ],
      stats: {
        temperature_c: { min: 20.1, max: 26.8, mean: 23.2 },
        humidity_pct: { min: 58.2, max: 74.1, mean: 65.8 },
        light_lux: { min: 3800, max: 5100, mean: 4320 },
        growth_mm: { min: 0.0, max: 42.7, mean: 21.4 },
      },
      uploadedAt: new Date().toISOString(),
    } satisfies CsvDataType,
    messages: [
      {
        role: "user" as const,
        content: "I have 30 days of greenhouse sensor data. Can you analyze the relationship between temperature, humidity, and plant growth rate?",
      },
      {
        role: "assistant" as const,
        content: `**🔬 Observation:**
The dataset spans 30 days with measurements of temperature (20.1–26.8°C, mean 23.2°C), humidity (58.2–74.1%, mean 65.8%), light intensity (3800–5100 lux), and plant growth (0–42.7mm total, mean 21.4mm accumulated).

**📊 Analysis:**
The data suggests a positive correlation between temperature (within the 20–27°C range) and growth rate, consistent with optimal thermophilic plant metabolism. Humidity variance (±8%) is within typical tolerance for most C3 plants. Light at 4320 lux mean is adequate but below the 5000+ lux optimal for many leafy crops.

Key patterns to investigate:
- Days 14–20 likely show peak growth (extrapolating from the 1.2–5.3mm/day early trend)
- Temperature dips below 21°C may correlate with growth slowdowns

**💡 Suggested Next Steps:**
1. Run a Pearson correlation between temperature_c and daily growth delta (growth_mm[d] - growth_mm[d-1])
2. Test whether humidity above 70% causes fungal stress markers or stomatal closure effects
3. Increase light intensity to 5500 lux for days 31–45 to compare growth acceleration

**🧠 Why I Recommend This:**
Multi-variable sensor analysis requires isolating individual factor contributions. Controlled light intensity increase is the lowest-risk intervention that directly tests the light-limited growth hypothesis without disturbing other variables.`,
      },
      {
        role: "user" as const,
        content: "The growth seems to slow after day 20. What could cause this plateau?",
      },
      {
        role: "assistant" as const,
        content: `**🔬 Observation:**
Growth plateau after day 20 is a well-documented phenomenon in controlled environment agriculture. With mean temperature 23.2°C and humidity 65.8%, the environmental conditions suggest this isn't thermal stress.

**📊 Analysis:**
Likely causes for post-day-20 growth plateau:
1. **Nutrient depletion** — Rapidly growing plants exhaust available nitrogen (N) and phosphorus (P) in soil/substrate by day 15–20
2. **Root-bound restriction** — Pot volume limits root expansion, creating mechanical growth ceiling
3. **Circadian acclimation** — Plants may downregulate growth hormones (gibberellins) after initial establishment phase
4. **Light saturation compensation** — At 4320 lux, CO₂ may become the limiting factor, not light

**💡 Suggested Next Steps:**
1. Test leaf chlorophyll content (SPAD meter) on day 21 samples vs. day 7 samples — yellowing indicates nitrogen deficiency
2. Apply dilute N-P-K solution (10-10-10, 500ppm) on day 22 and monitor for 7-day growth response
3. Measure substrate electrical conductivity (EC) to assess nutrient solution concentration

**🧠 Why I Recommend This:**
Nutrient depletion is the most common and correctable cause of mid-experiment plateaus. EC measurement is non-destructive and gives immediate feedback on substrate nutrient status. This approach uses your existing sensor infrastructure without requiring additional equipment.`,
      },
    ],
  },
  {
    name: "⚗️ Acid-Base Titration Protocol",
    description: "Standard HCl/NaOH titration protocol review with equivalence point calculation and indicator selection guidance",
    domain: "chemistry",
    csvData: null as null,
    messages: [
      {
        role: "user" as const,
        content: "I'm designing a titration experiment to determine the concentration of an unknown HCl solution using 0.1 M NaOH. What's the optimal protocol and how do I select the right indicator?",
      },
      {
        role: "assistant" as const,
        content: `**🔬 Observation:**
You're setting up a strong acid–strong base titration (HCl + NaOH → NaCl + H₂O). This is a well-characterized system with predictable equivalence point behavior at pH 7.0 and a sharp endpoint transition (pH jump of 6–8 units near equivalence).

**📊 Analysis:**
**Indicator Selection:**
- **Phenolphthalein** (pH range 8.2–10.0) — Standard choice; color change from colorless to pink is clear and well-defined. ✓ Recommended
- **Methyl orange** (pH range 3.1–4.4) — Not suitable; endpoint occurs before true equivalence in strong acid titration
- **Bromothymol blue** (pH 6.0–7.6) — Acceptable alternative if precise endpoint color reading is needed

**Protocol Design:**
1. Prepare 25.00 mL of unknown HCl in a clean Erlenmeyer flask using a calibrated volumetric pipette
2. Add 2–3 drops phenolphthalein indicator
3. Fill burette with 0.1000 M NaOH (standardize against potassium hydrogen phthalate if concentration is nominal)
4. Titrate dropwise past 90% of expected volume, then in 0.1 mL increments
5. Record volume at first permanent pink endpoint (persisting >30 sec)

**💡 Suggested Next Steps:**
1. Perform a blank titration first to eliminate systematic error from indicator contribution
2. Run three replicate titrations — accept results within ±0.05 mL burette read discrepancy
3. Calculate: c(HCl) = V(NaOH) × c(NaOH) / V(HCl)

**🧠 Why I Recommend This:**
Triple replication is minimum for analytical chemistry confidence intervals (95% CI). Phenolphthalein minimizes endpoint overshoot risk compared to indicators with lower pH ranges.`,
      },
      {
        role: "user" as const,
        content: "What are the main sources of error in this titration and how can I minimize them?",
      },
      {
        role: "assistant" as const,
        content: `**🔬 Observation:**
Titration accuracy typically achieves ±0.1–0.3% relative error in skilled hands. Common sources in strong acid-base titrations fall into three categories: volumetric measurement, chemical, and procedural.

**📊 Analysis:**
**Systematic Errors (correctable):**
- **Burette calibration drift** — Glass burettes can have ±0.02 mL systematic error per graduation. Use Class A volumetric glassware and verify calibration gravimetrically
- **Temperature effects** — 1°C change shifts aqueous solution volume ~0.025%. Conduct all measurements at controlled temperature (20±1°C)
- **Indicator volume** — Each drop of phenolphthalein (~0.05 mL) contributes ~0.1% systematic volume error in 50 mL titrations

**Random Errors (statistical):**
- **Endpoint color perception** — Human color perception varies; use a white tile background and consistent lighting
- **Parallax reading** — Always read meniscus at eye level from the bottom of the meniscus curve
- **CO₂ absorption** — NaOH absorbs atmospheric CO₂, forming Na₂CO₃, which reduces effective concentration over time. Prepare fresh NaOH solutions and seal storage containers

**💡 Suggested Next Steps:**
1. Standardize your NaOH against certified potassium hydrogen phthalate (KHP) primary standard immediately before titration
2. Add N₂ blanket to NaOH burette to prevent CO₂ absorption during titration
3. Use a magnetic stirrer to ensure complete mixing without manual swirling error

**🧠 Why I Recommend This:**
CO₂ absorption is the most underappreciated error source in NaOH standardization — even a 30-minute exposure can shift concentration by 0.2–0.5%. Nitrogen blanketing is standard practice in precise volumetric analysis and requires only a simple gas line setup.`,
      },
    ],
  },
  {
    name: "🔬 Gel Electrophoresis Image Analysis",
    description: "DNA gel electrophoresis image analysis — band pattern interpretation and molecular weight estimation",
    domain: "biology",
    csvData: null as null,
    imageData: {
      type: "image" as const,
      filename: "dna_gel_electrophoresis.png",
      mimeType: "image/png",
      base64: "iVBORw0KGgoAAAANSUhEUgAAAMgAAAEsCAIAAAAJmGvpAAAC4klEQVR4nO3BMQEAAADCoPVP7WsIoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAeAMBuAABHgAAAABJRU5ErkJggg==",
      uploadedAt: new Date().toISOString(),
      visionAnalysis: {
        available: false,
        analyzedAt: new Date().toISOString(),
        error: "Demo session — upload your own gel image to enable Azure AI Vision analysis",
      },
    },
    messages: [
      {
        role: "user" as const,
        content: "I have a DNA gel electrophoresis image showing 6 lanes. Lane 1 is a 1kb DNA ladder. Lanes 2-6 show PCR products from different primer sets. How should I approach the analysis?",
      },
      {
        role: "assistant" as const,
        content: `**🔬 Observation:**
You have a standard agarose gel electrophoresis image with a 1 kb ladder reference. With 5 experimental lanes (2–6) containing PCR amplicons from different primer pairs, the primary goals are: (1) confirm successful amplification, (2) estimate band sizes, and (3) assess specificity (single band = specific primers).

**📊 Analysis:**
**Lane Analysis Framework:**

For each experimental lane (2–6):
1. **Band presence** — Amplification success; absence indicates primer failure, template issue, or PCR inhibition
2. **Band position** — Compare migration distance to ladder to estimate fragment size (interpolate on semi-log plot: log₁₀(bp) vs. migration distance in mm)
3. **Band count** — Single band = high primer specificity; multiple bands = non-specific amplification or primer-dimer
4. **Band intensity** — Reflects template quantity; faint bands may require gel extraction and re-amplification

**Standard 1kb Ladder Bands:**
10,000 / 8,000 / 6,000 / 5,000 / 4,000 / 3,000 / 2,000 / 1,500 / 1,000 / 750 / 500 / 250 bp

**💡 Suggested Next Steps:**
1. Upload the gel image — Azure AI Vision will extract band position data and generate a migration distance table
2. Create a standard curve: plot log₁₀(bp size) vs. normalized migration distance (0–1) for each ladder band
3. Use linear regression to interpolate unknown band sizes
4. If multiple bands appear in a lane, consider redesigning primers with ΔG ≤ -2 kcal/mol for 3' end self-complementarity

**🧠 Why I Recommend This:**
Semi-log interpolation is more accurate than linear interpolation for gel analysis because DNA migration follows log-linear behavior in agarose matrices. Normalized migration distance corrects for gel-to-gel run time variations.`,
      },
    ],
  },
];

router.post("/demo/seed", async (_req, res): Promise<void> => {
  try {
    const results: Array<{ name: string; sessionId: number; created: boolean }> = [];

    for (const demo of DEMO_SESSIONS) {
      const existing = await db
        .select()
        .from(labSessions)
        .where(like(labSessions.name, `%${demo.name.slice(2, 20)}%`));

      if (existing.length > 0) {
        results.push({ name: demo.name, sessionId: existing[0].id, created: false });
        continue;
      }

      const [session] = await db
        .insert(labSessions)
        .values({
          name: demo.name,
          description: demo.description,
          domain: demo.domain,
          ...(demo.csvData ? { experimentData: demo.csvData } : demo.imageData ? { experimentData: demo.imageData } : {}),
        })
        .returning();

      const [conv] = await db
        .insert(conversations)
        .values({ sessionId: session.id })
        .returning();

      for (const msg of demo.messages) {
        await db.insert(messages).values({
          conversationId: conv.id,
          role: msg.role,
          content: msg.content,
          safetyMetadata: {
            status: "passed",
            categories: [
              { category: "Hate", severity: 0 },
              { category: "SelfHarm", severity: 0 },
              { category: "Sexual", severity: 0 },
              { category: "Violence", severity: 0 },
            ],
            blockedCategories: [],
            flaggedCategories: [],
            available: true,
            checkedAt: new Date().toISOString(),
          },
        });
      }

      results.push({ name: demo.name, sessionId: session.id, created: true });
    }

    res.json({ success: true, results });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: msg });
  }
});

export default router;
