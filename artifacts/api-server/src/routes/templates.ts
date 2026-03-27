import { Router, type IRouter } from "express";

const router: IRouter = Router();

export interface ProtocolTemplate {
  id: string;
  domain: string;
  name: string;
  description: string;
  icon: string;
  tags: string[];
  starterPrompt: string;
}

export const PROTOCOL_TEMPLATES: ProtocolTemplate[] = [
  {
    id: "pcr",
    domain: "genetics",
    name: "PCR Protocol",
    description: "Polymerase Chain Reaction — amplification of a target DNA sequence using Taq polymerase, primers, and thermal cycling.",
    icon: "🧬",
    tags: ["DNA", "amplification", "molecular biology"],
    starterPrompt: "I'm starting a PCR experiment to amplify a target DNA sequence. My protocol uses Taq polymerase with the following primers: [FORWARD_PRIMER] and [REVERSE_PRIMER]. Template DNA is [SOURCE]. Please help me optimize my thermal cycling conditions (denaturation, annealing, extension temperatures and times) and suggest how to troubleshoot if I see non-specific bands on the gel.",
  },
  {
    id: "western-blot",
    domain: "biology",
    name: "Western Blot",
    description: "Protein detection by SDS-PAGE electrophoresis followed by membrane transfer, antibody probing, and chemiluminescence imaging.",
    icon: "🔬",
    tags: ["protein", "immunodetection", "gel electrophoresis"],
    starterPrompt: "I'm setting up a Western Blot to detect [TARGET_PROTEIN] in [SAMPLE_TYPE]. I'm using [PRIMARY_ANTIBODY] at [DILUTION] and an HRP-conjugated secondary antibody. Please guide me through sample preparation, SDS-PAGE gel percentage selection, transfer conditions, blocking strategy, and ECL exposure optimization.",
  },
  {
    id: "elisa",
    domain: "clinical",
    name: "ELISA Assay",
    description: "Enzyme-Linked Immunosorbent Assay for quantifying antigens or antibodies in a sample using enzyme-linked detection.",
    icon: "🧪",
    tags: ["immunoassay", "antibody", "quantification"],
    starterPrompt: "I'm running an ELISA to quantify [ANALYTE] in [SAMPLE_TYPE]. I'm using a [sandwich/competitive/indirect] ELISA format. Please help me design the standard curve, optimize coating concentration, blocking conditions, and walk me through calculating sample concentrations from OD450 readings.",
  },
  {
    id: "titration",
    domain: "chemistry",
    name: "Acid-Base Titration",
    description: "Determination of unknown acid or base concentration using a calibrated standard solution and pH indicator or potentiometer.",
    icon: "⚗️",
    tags: ["pH", "stoichiometry", "analytical chemistry"],
    starterPrompt: "I'm performing an acid-base titration to determine the concentration of [ANALYTE]. I'm using [TITRANT] as my standard solution at [CONCENTRATION] M. I'm using [INDICATOR/pH meter] to detect the endpoint. Please help me calculate the expected equivalence point volume, suggest how to handle the titration curve, and explain sources of error I should minimize.",
  },
  {
    id: "cell-culture",
    domain: "biology",
    name: "Cell Culture Maintenance",
    description: "Standard passaging protocol for adherent mammalian cell lines — trypsinization, counting, re-seeding, and media exchange.",
    icon: "🦠",
    tags: ["mammalian cells", "passaging", "tissue culture"],
    starterPrompt: "I'm maintaining [CELL_LINE] cells in [MEDIA] with [SUPPLEMENTS]. My cells are currently at approximately [CONFLUENCE]% confluency. Please help me optimize my passaging schedule, trypsinization protocol, seeding density for the next passage, and tell me what signs of stress or contamination to watch for.",
  },
  {
    id: "flow-cytometry",
    domain: "clinical",
    name: "Flow Cytometry",
    description: "Multi-parameter single-cell analysis using fluorescent antibody markers and laser-based detection for cell population profiling.",
    icon: "💉",
    tags: ["cells", "immunophenotyping", "fluorescence"],
    starterPrompt: "I'm setting up a flow cytometry panel to characterize [CELL_POPULATION] using the following markers: [MARKERS_LIST]. My instrument has [LASER_CONFIGURATION] lasers. Please help me design the antibody panel to minimize spectral overlap, set up compensation controls, define gating strategy, and interpret the resulting population data.",
  },
  {
    id: "spectrophotometry",
    domain: "chemistry",
    name: "UV-Vis Spectrophotometry",
    description: "Measurement of absorbance at specific wavelengths to quantify analyte concentration using Beer-Lambert law.",
    icon: "🌈",
    tags: ["absorbance", "quantification", "Beer-Lambert"],
    starterPrompt: "I'm using UV-Vis spectrophotometry to quantify [ANALYTE] in [SAMPLE_TYPE]. I plan to measure at [WAVELENGTH] nm. Please help me construct a standard curve, calculate molar absorptivity (ε), apply Beer-Lambert law to determine unknown concentrations, and identify potential interferences I should account for.",
  },
  {
    id: "rna-extraction",
    domain: "genetics",
    name: "RNA Extraction",
    description: "Isolation of total RNA from biological samples using TRIzol or column-based methods, followed by quality assessment (A260/280).",
    icon: "🧫",
    tags: ["RNA", "gene expression", "molecular biology"],
    starterPrompt: "I'm extracting total RNA from [TISSUE/CELL_TYPE] using [TRIZOL/COLUMN_KIT]. My starting material is approximately [AMOUNT]. Please help me optimize my lysis conditions to maximize RNA yield, prevent degradation (RNase contamination), and interpret my NanoDrop A260/280 and A260/230 ratios to assess RNA quality before downstream RT-qPCR.",
  },
  {
    id: "drug-dose-response",
    domain: "pharmacology",
    name: "Drug Dose-Response",
    description: "Systematic testing of compound efficacy across a concentration range to determine IC50, EC50, or LD50 parameters.",
    icon: "💊",
    tags: ["pharmacokinetics", "IC50", "dose-response curve"],
    starterPrompt: "I'm characterizing the dose-response relationship of [COMPOUND_NAME] on [TARGET/CELL_LINE]. I'm measuring [ENDPOINT: viability/inhibition/etc.] using [ASSAY_METHOD]. My concentration range is [RANGE]. Please help me design the serial dilution scheme, select the appropriate curve-fitting model (Hill equation), and calculate IC50/EC50 with 95% confidence intervals.",
  },
  {
    id: "imaging-microscopy",
    domain: "neuroscience",
    name: "Fluorescence Microscopy",
    description: "Confocal or widefield imaging of fluorescently labeled structures with z-stack acquisition and deconvolution.",
    icon: "🔭",
    tags: ["fluorescence", "confocal", "imaging"],
    starterPrompt: "I'm imaging [STRUCTURE/CELL_TYPE] labeled with [FLUOROPHORES] using [CONFOCAL/WIDEFIELD] microscopy. My objective is [MAGNIFICATION/NA]. Please help me optimize laser power, gain settings, and z-stack parameters to minimize photobleaching while achieving sufficient signal-to-noise ratio, and suggest image analysis pipelines for quantifying [MEASUREMENT_GOAL].",
  },
  {
    id: "xrd-analysis",
    domain: "materials",
    name: "X-Ray Diffraction (XRD)",
    description: "Characterization of crystalline material structure by measuring diffraction angles and intensities from X-ray beams.",
    icon: "💎",
    tags: ["crystal structure", "diffraction", "materials characterization"],
    starterPrompt: "I'm using XRD to characterize [MATERIAL] synthesized via [METHOD]. I'll be scanning 2θ from [RANGE]° at [STEP_SIZE]°/step using [Cu Kα/other] radiation. Please help me index the diffraction peaks, identify the crystal phase using reference patterns, calculate lattice parameters using Bragg's law, and estimate crystallite size using the Scherrer equation.",
  },
  {
    id: "climate-sensor",
    domain: "environmental",
    name: "Environmental Sensor Monitoring",
    description: "Continuous logging of air quality, temperature, humidity, CO2, or particulate matter using IoT sensor arrays.",
    icon: "🌍",
    tags: ["IoT", "air quality", "environmental monitoring"],
    starterPrompt: "I'm deploying an environmental sensor network to monitor [PARAMETERS: CO2/PM2.5/temperature/etc.] at [LOCATION]. My sensors are [SENSOR_MODEL] connected via [PROTOCOL]. I'm collecting data at [SAMPLING_INTERVAL] intervals. Please help me design a data validation pipeline, identify outliers and calibration drift, and set up statistical analysis to detect significant environmental trends.",
  },
];

router.get("/templates", (_req, res) => {
  res.json({ templates: PROTOCOL_TEMPLATES });
});

export default router;
