import {
  CropLocation,
  CropRiskResult,
  CropType,
  DailySoilTip,
  EcoTask,
  LeaderboardMember,
  LearnCard,
  PollutionReport,
  PollutionType,
  ShcSampleCard,
  SoilHealthEvaluation,
  SoilReading,
} from '../types';

export const POLLUTION_TYPES: { value: PollutionType; emoji: string; hint: string }[] = [
  { value: 'Farming', emoji: '🌾', hint: 'Excess urea, DAP, pesticides or stubble ash' },
  { value: 'Industry', emoji: '🏭', hint: 'Dyeing effluent, heavy metals, tannery sludge' },
  { value: 'Urban Waste', emoji: '🗑️', hint: 'Unsegregated plastic, landfill leachate' },
  { value: 'E-Waste', emoji: '🔋', hint: 'Burnt cables, lead batteries, circuit boards' },
  { value: 'Oil Spill', emoji: '🛢️', hint: 'Engine oil, diesel leaks near workshops' },
  { value: 'Acid Rain Fallout', emoji: '🌧️', hint: 'Sulfur/NOx deposition near thermal plants' },
];

export const INITIAL_REPORTS: PollutionReport[] = [
  {
    id: 'seed-1',
    type: 'Industry',
    location: 'Mujesar Industrial Belt, Faridabad',
    coordinates: '28.3782° N, 77.3145° E',
    description:
      'Untreated electroplating and textile drainage seeping into open soil plots along the boundary drain. Soil crust looks discolored and hardened.',
    photoDataUrl: '/src/assets/images/report_soil_sample_1795014404679.jpg',
    createdAt: '2 days ago',
    isUserSubmitted: false,
  },
  {
    id: 'seed-2',
    type: 'Urban Waste',
    location: 'Yamuna Khadar Floodplain, East Delhi',
    coordinates: '28.6315° N, 77.2698° E',
    description:
      'Multi-layer plastic sachets and construction debris dumped near vegetable cultivation beds. Microplastics mixing into topsoil after rain.',
    createdAt: '4 days ago',
    isUserSubmitted: false,
  },
  {
    id: 'seed-3',
    type: 'Farming',
    location: 'Sonipat-Panipat Paddy Corridor, Haryana',
    coordinates: '29.1034° N, 77.0156° E',
    description:
      'Repeated over-application of chemical nitrogen and post-harvest stubble burning leaving topsoil dry, alkaline, and low in organic carbon.',
    createdAt: '6 days ago',
    isUserSubmitted: false,
  },
];

export const SHC_SAMPLE_CARDS: ShcSampleCard[] = [
  {
    id: 'shc-karnal',
    cardNumber: 'HR-KNL-2026-8419',
    farmerName: 'Harpreet Singh',
    district: 'Karnal, Haryana',
    soilType: 'Alluvial Loam (Domat Mitti)',
    reading: { ph: 7.9, nitrogen: 195, phosphorus: 18, potassium: 210 },
    organicCarbon: '0.38% (Low)',
  },
  {
    id: 'shc-delhi',
    cardNumber: 'DL-YMN-2026-3092',
    farmerName: 'Sunita Devi',
    district: 'Yamuna Khadar, Delhi',
    soilType: 'Sandy Silt (Balui Mitti)',
    reading: { ph: 8.6, nitrogen: 120, phosphorus: 11, potassium: 135 },
    organicCarbon: '0.24% (Very Low)',
  },
  {
    id: 'shc-palwal',
    cardNumber: 'HR-PWL-2026-5520',
    farmerName: 'Rameshwar Yadav',
    district: 'Palwal, Haryana',
    soilType: 'Fertile Clay Loam',
    reading: { ph: 6.9, nitrogen: 340, phosphorus: 38, potassium: 290 },
    organicCarbon: '0.72% (Good)',
  },
];

export function evaluateSoilHealth(reading: SoilReading): SoilHealthEvaluation {
  const { ph, nitrogen, phosphorus, potassium } = reading;
  let score = 100;
  const adviceList: string[] = [];

  // pH evaluation (Ideal Indian crop range: 6.5 - 7.5)
  if (ph < 5.5) {
    score -= 32;
    adviceList.push('Highly acidic soil (Amliya Mitti) — Apply agricultural lime (Choona) at 2–3 quintals/acre and enrich with vermicompost.');
  } else if (ph < 6.3) {
    score -= 14;
    adviceList.push('Slightly acidic pH — Mix well-decomposed cow dung (Gobar Khaad) to buffer acidity naturally.');
  } else if (ph > 8.5) {
    score -= 34;
    adviceList.push('High alkalinity / Sodic soil (Kshariya Mitti) — Apply Gypsum (Jipsam) + Dhaincha green manuring to restore pH.');
  } else if (ph > 7.7) {
    score -= 16;
    adviceList.push('Mildly alkaline pH — Incorporate organic mulch and green manure to gently lower pH toward 7.0.');
  }

  // Nitrogen (Low < 240, Medium 240-480, High > 480)
  if (nitrogen < 200) {
    score -= 26;
    adviceList.push('Low Organic Carbon & Nitrogen — Add Compost (Khaad), Jeevamrit, or grow legumes like Moong/Dhaincha.');
  } else if (nitrogen < 280) {
    score -= 12;
    adviceList.push('Moderate Nitrogen — Supplement with Azotobacter biofertilizer and vermicompost before sowing.');
  } else if (nitrogen > 520) {
    score -= 14;
    adviceList.push('Excess Urea/Nitrogen runoff risk — Cut synthetic urea by 30% to prevent nitrate leaching into groundwater.');
  }

  // Phosphorus (Low < 15, Optimal 20-55, Excess > 75)
  if (phosphorus < 15) {
    score -= 18;
    adviceList.push('Low Phosphorus (P) — Mix Phosphate Rich Organic Manure (PROM) or PSB bio-culture near root zones.');
  } else if (phosphorus > 75) {
    score -= 10;
    adviceList.push('Excess Phosphorus buildup — Pause DAP fertilizer for one season; let mycorrhizal fungi unlock existing P.');
  }

  // Potassium (Low < 150, Optimal 180-350)
  if (potassium < 150) {
    score -= 18;
    adviceList.push('Low Potassium (K) — Add wood ash, banana-peel compost, or Potash Mobilizing Bacteria (KMB) for crop resilience.');
  }

  score = Math.max(12, Math.min(100, score));

  if (adviceList.length === 0) {
    adviceList.push('Balanced NPK & neutral pH! Maintain soil life with seasonal mulching (Palwar) and crop rotation.');
  }

  if (score >= 76) {
    return {
      tier: 'green',
      statusLabel: 'Healthy Soil · Green Grade',
      hindiLabel: 'Swasth Mitti (उपजाऊ)',
      score,
      headline: 'Living, Balanced Topsoil Ready for Safe Farming',
      summary:
        'Your pH and NPK balance supports active earthworms and microbial carbon cycling without chemical stress.',
      adviceList,
    };
  }

  if (score >= 48) {
    return {
      tier: 'yellow',
      statusLabel: 'Moderate Stress · Yellow Grade',
      hindiLabel: 'Sudhar ki Zaroorat (मध्यम)',
      score,
      headline:
        nitrogen < 240
          ? 'Low Organic Carbon - Add Compost'
          : 'Nutrient Imbalance Detected — Organic Recovery Needed',
      summary:
        'Topsoil shows early depletion or mild pH drift. Switching from synthetic sprays to compost will rebuild fertility.',
      adviceList,
    };
  }

  return {
    tier: 'red',
    statusLabel: 'Critical Degradation · Red Grade',
    hindiLabel: 'Gambhir Sankat (खराब मिट्टी)',
    score,
    headline:
      nitrogen < 200
        ? 'Low Organic Carbon - Add Compost & Halt Chemical Inputs'
        : 'Severe Soil Stress — Immediate Remediation Required',
    summary:
      'High risk of crop toxicity, root burn, and barren crusting. Pause chemical fertilizers and begin organic soil healing.',
    adviceList,
  };
}

const CROP_RISK_MATRIX: Record<CropLocation, Record<CropType, CropRiskResult>> = {
  Delhi: {
    Spinach: {
      location: 'Delhi',
      crop: 'Spinach',
      risk: 'high',
      riskBadge: 'High Heavy-Metal Risk',
      headline: 'High Lead Risk - Avoid leafy vegetables, Grow Mustard for cleaning soil',
      explanation:
        'Urban & Yamuna floodplain soils around Delhi often carry elevated Lead (Pb) and Cadmium from battery scrap, traffic dust, and untreated drains. Broad-leaf greens like Palak (Spinach) hyper-accumulate metals directly into edible leaves.',
      hindiTip: 'सावधानी: दिल्ली की शहरी मिट्टी में पालक जैसी पत्तेदार सब्जियां सीसा (Lead) सोख लेती हैं।',
      phytoremediationNote:
        'Plant Indian Mustard (Sarson / Brassica juncea) for 1–2 cycles and safely dispose of biomass to extract heavy metals.',
      recommendedAlternative: 'Mustard',
    },
    Wheat: {
      location: 'Delhi',
      crop: 'Wheat',
      risk: 'moderate',
      riskBadge: 'Moderate Risk · Test Water First',
      headline: 'Moderate Risk — Irrigate with Clean Groundwater Only',
      explanation:
        'Wheat grains accumulate fewer heavy metals than leafy greens, but wastewater irrigation near peri-urban Delhi drains can elevate Nickel and Chromium in roots and straw.',
      hindiTip: 'गेहूं की खेती के लिए नाले के पानी की जगह साफ बोरवेल या बारिश के पानी का उपयोग करें।',
      phytoremediationNote:
        'Add 2 tons/acre composted biochar or vermicompost to bind free heavy-metal ions in the root zone.',
      recommendedAlternative: 'Mustard',
    },
    Mustard: {
      location: 'Delhi',
      crop: 'Mustard',
      risk: 'low',
      riskBadge: 'Safe · Soil Cleaner Crop',
      headline: 'Recommended — Natural Soil Cleaner (Phytoremediation)',
      explanation:
        'Indian Mustard (Sarson) thrives in Delhi NCR winter soil and naturally draws Lead, Zinc, and Cadmium out of topsoil into its stems—helping regenerate contaminated plots.',
      hindiTip: 'सरसों मिट्टी से भारी धातुएं खींचकर खेत को शुद्ध करने (Phytoremediation) में मदद करती है।',
      phytoremediationNote:
        'If grown on heavily polluted drain-side plots, use seed oil only after lab testing or harvest biomass for non-food bio-disposal.',
      recommendedAlternative: 'Wheat',
    },
    Rice: {
      location: 'Delhi',
      crop: 'Rice',
      risk: 'high',
      riskBadge: 'High Arsenic & Water Stress',
      headline: 'High Uptake Risk — Avoid Flooded Paddy in Urban Delhi',
      explanation:
        'Flooded paddy conditions mobilize Arsenic and Lead from polluted sediment directly into rice grains while worsening Delhi’s falling water table.',
      hindiTip: 'धान में भरा पानी मिट्टी के जहरीले तत्वों को सीधे दाने तक पहुंचा देता है।',
      phytoremediationNote:
        'Shift to low-water Mustard or Pearl Millet (Bajra) with organic mulching.',
      recommendedAlternative: 'Mustard',
    },
  },
  Faridabad: {
    Spinach: {
      location: 'Faridabad',
      crop: 'Spinach',
      risk: 'high',
      riskBadge: 'High Lead & Chromium Risk',
      headline: 'High Lead Risk - Avoid leafy vegetables, Grow Mustard for cleaning soil',
      explanation:
        'Proximity to electroplating, dyeing, and metalworking belts in Faridabad elevates Lead (Pb) and Chromium in peri-urban topsoil. Leafy Spinach concentrates these toxins rapidly.',
      hindiTip: 'फरीदाबाद के औद्योगिक क्षेत्र के पास पालक उगाना सेहत के लिए खतरनाक हो सकता है।',
      phytoremediationNote:
        'Rotate with Indian Mustard (Sarson) + marigold borders and apply gypsum + compost to lock toxins away from food crops.',
      recommendedAlternative: 'Mustard',
    },
    Wheat: {
      location: 'Faridabad',
      crop: 'Wheat',
      risk: 'moderate',
      riskBadge: 'Moderate Industrial Runoff Risk',
      headline: 'Moderate Risk — Maintain 100m Buffer from Industrial Drains',
      explanation:
        'Away from industrial nullahs, Wheat grows reliably in Faridabad loam. Near factory zones, check soil pH and electrical conductivity before sowing.',
      hindiTip: 'फैक्ट्री नालों से दूर साफ मिट्टी में ही गेहूं बोएं और गोबर की खाद जरूर मिलाएं।',
      phytoremediationNote:
        'Use green manure (Dhaincha) pre-sowing to boost soil organic matter and buffer industrial salts.',
      recommendedAlternative: 'Mustard',
    },
    Mustard: {
      location: 'Faridabad',
      crop: 'Mustard',
      risk: 'low',
      riskBadge: 'Safe & Soil-Healing Choice',
      headline: 'Best Choice — Cleans Industrial Soil & Builds Resilience',
      explanation:
        'Mustard (Sarson) is a proven hyper-accumulator suited to Faridabad’s semi-arid plains. It stabilizes topsoil and extracts heavy metals.',
      hindiTip: 'फरीदाबाद की मिट्टी सुधारने के लिए सरसों और गेंदे की खेती सबसे सुरक्षित विकल्प है।',
      phytoremediationNote:
        'Pair with vermicompost to restore beneficial soil microbes damaged by effluent.',
      recommendedAlternative: 'Wheat',
    },
    Rice: {
      location: 'Faridabad',
      crop: 'Rice',
      risk: 'high',
      riskBadge: 'High Effluent Mobility Risk',
      headline: 'Avoid Paddy Near Industrial Belts — High Metal Leaching',
      explanation:
        'Standing water in paddy fields dissolves Chromium and Nickel from Faridabad industrial dust into groundwater and grain.',
      hindiTip: 'खड़े पानी वाली धान की फसल औद्योगिक प्रदूषण को जड़ों और भूजल में फैलाती है।',
      phytoremediationNote:
        'Replace paddy with Mustard or dryland pulses (Arhar/Moong) to cut toxic leaching.',
      recommendedAlternative: 'Mustard',
    },
  },
  Haryana: {
    Spinach: {
      location: 'Haryana',
      crop: 'Spinach',
      risk: 'moderate',
      riskBadge: 'Moderate Pesticide Residue Risk',
      headline: 'Moderate Risk — Grow Organic Only, Wash & Test Nitrate Levels',
      explanation:
        'Across rural Haryana, heavy-metal levels are generally lower than urban NCR, but intensive pesticide and urea use leaves high nitrate and organophosphate residues in fast-growing Spinach.',
      hindiTip: 'हरियाणा में पालक उगाते समय रासायनिक कीटनाशकों की जगह नीम तेल (Neem Oil) का उपयोग करें।',
      phytoremediationNote:
        'Adopt Zero-Chemical kitchen/farm beds using vermicompost and neem-cake (Neem Khali).',
      recommendedAlternative: 'Mustard',
    },
    Wheat: {
      location: 'Haryana',
      crop: 'Wheat',
      risk: 'low',
      riskBadge: 'Safe · Stop Stubble Burning',
      headline: 'Safe to Grow — Protect Soil by Using Happy Seeder Instead of Burning',
      explanation:
        'Haryana’s alluvial plains are ideal for Wheat. The main soil threat is post-harvest burning (Parali) and excess urea, which kills topsoil earthworms.',
      hindiTip: 'गेहूं सुरक्षित है — पराली न जलाएं, मल्चर/हैप्पी सीडर से मिट्टी में ही खाद बनाएं।',
      phytoremediationNote:
        'Mix crop residue back into soil with Pusa Decomposer to raise organic carbon by 0.15% in two seasons.',
      recommendedAlternative: 'Mustard',
    },
    Mustard: {
      location: 'Haryana',
      crop: 'Mustard',
      risk: 'low',
      riskBadge: 'Safe & Climate-Smart',
      headline: 'Optimal Crop — Low Water, High Soil Restoration Value',
      explanation:
        'Mustard thrives across Haryana (Rewari, Mahendragarh, Karnal, Hisar) with minimal irrigation and actively breaks pest and chemical cycles left by rice-wheat monoculture.',
      hindiTip: 'सरसों कम पानी में उगती है और हरियाणा की मिट्टी की उर्वरा शक्ति वापस लाती है।',
      phytoremediationNote:
        'Intercrop with chickpea (Chana) for natural nitrogen fixation without urea.',
      recommendedAlternative: 'Wheat',
    },
    Rice: {
      location: 'Haryana',
      crop: 'Rice',
      risk: 'moderate',
      riskBadge: 'Moderate · Groundwater & Parali Stress',
      headline: 'Moderate Risk — Switch to Direct Seeded Rice (DSR) & Zero Stubble Burn',
      explanation:
        'Conventional flooded paddy depletes Haryana aquifers and creates hardpan soil layers. Stubble burning kills billions of beneficial microbes per square meter.',
      hindiTip: 'धान की सीधी बुवाई (DSR) अपनाएं और पराली को मिट्टी में मिलाकर खाद बनाएं।',
      phytoremediationNote:
        'Rotate with Mustard or Moong every alternate year to restore porous topsoil.',
      recommendedAlternative: 'Mustard',
    },
  },
};

export function checkSafeCrop(location: CropLocation, crop: CropType): CropRiskResult {
  return CROP_RISK_MATRIX[location][crop];
}

export const ECO_TASKS: EcoTask[] = [
  {
    id: 'compost',
    title: 'Compost Kitchen Scraps',
    hindiTitle: 'गीले कचरे से खाद बनाएं (Compost)',
    description: 'Turn fruit peels, tea leaves & vegetable scraps into dark humus instead of landfill methane.',
    points: 25,
    emoji: '🪱',
  },
  {
    id: 'segregate',
    title: 'Segregate Wet & Dry Waste',
    hindiTitle: 'गीला और सूखा कचरा अलग करें',
    description: 'Keep plastics, batteries & e-waste completely separate from organic soil-bound waste.',
    points: 20,
    emoji: '♻️',
  },
  {
    id: 'sapling',
    title: 'Plant & Mulch a Native Sapling',
    hindiTitle: 'एक देसी पौधा लगाएं (Neem / Peepal / Jamun)',
    description: 'Anchor topsoil against erosion and feed subterranean mycorrhizal networks.',
    points: 50,
    emoji: '🌱',
  },
  {
    id: 'cloth-bag',
    title: 'Carry a Cloth Bag (Zero Plastic)',
    hindiTitle: 'कपड़े का थैला साथ रखें',
    description: 'Prevent single-use polythene from breaking down into permanent soil microplastics.',
    points: 15,
    emoji: '🛍️',
  },
];

export const BASE_LEADERBOARD: LeaderboardMember[] = [
  { id: 'lb-1', name: 'Ananya Sharma', city: 'South Delhi', points: 245, streakDays: 14 },
  { id: 'lb-2', name: 'Vikramjit Gill', city: 'Karnal, Haryana', points: 190, streakDays: 11 },
  { id: 'lb-3', name: 'Meera Deshmukh', city: 'Faridabad', points: 145, streakDays: 8 },
  { id: 'lb-4', name: 'Kabir Verma', city: 'Gurugram', points: 95, streakDays: 5 },
  { id: 'lb-5', name: 'Pooja Chauhan', city: 'Sonipat', points: 60, streakDays: 3 },
];

export const LEARN_CARDS: LearnCard[] = [
  {
    id: 'sources',
    stepNumber: '01',
    title: 'Sources of Soil Pollution',
    hindiSubtitle: 'मिट्टी प्रदूषण के मुख्य स्रोत',
    emoji: '🏭',
    summary:
      'Soil contamination in India stems from four overlapping pressures: industrial effluents, excess chemical agro-inputs, unsegregated urban dumps, and informal e-waste burning.',
    keyPoints: [
      'Farming: Overuse of synthetic Urea/DAP & toxic pesticides strips organic carbon and hardens topsoil.',
      'Industry & Mining: Heavy metals like Lead (Pb), Chromium, and Arsenic leach from dyeing, tannery, and metal units.',
      'Urban & E-Waste: Unsorted plastics release microplastics; burnt wires and batteries leak Lead & Mercury.',
      'Oil & Acid Fallout: Workshop oil spills suffocate soil microbes; SO2/NOx rain acidifies pH below 5.5.',
    ],
    actionTakeaway: 'Never burn plastic or e-waste on open ground—one burnt battery poisons topsoil for decades.',
  },
  {
    id: 'food-chain',
    stepNumber: '02',
    title: 'From Soil to Food Chain',
    hindiSubtitle: 'मिट्टी से हमारी थाली तक (Bioaccumulation)',
    emoji: '🥗',
    summary:
      'Plants drink nutrients directly through soil water. When heavy metals or persistent pesticides sit in topsoil, roots absorb them into leaves, grains, fodder, and milk.',
    keyPoints: [
      'Step 1 — Root Uptake: Toxic ions (Lead, Cadmium, Arsenic) mimic essential minerals like Calcium & Zinc.',
      'Step 2 — Leaf Accumulation: Leafy vegetables (Palak, Methi, Coriander) store higher metal concentrations in edible leaves.',
      'Step 3 — Livestock & Dairy: Cattle grazing on contaminated fodder pass persistent toxins into milk and meat.',
      'Step 4 — Human Plate: Daily micro-doses build up in liver, kidneys, and bones over years without changing taste or smell.',
    ],
    actionTakeaway: 'Healthy food starts with clean soil—always verify soil & irrigation water quality near industrial belts.',
  },
  {
    id: 'health-effects',
    stepNumber: '03',
    title: 'Human & Ecological Health Effects',
    hindiSubtitle: 'सेहत और पर्यावरण पर गंभीर असर',
    emoji: '🩺',
    summary:
      'Invisible soil toxins silently undermine public health while turning fertile agricultural land into barren, dust-prone wasteland.',
    keyPoints: [
      'Neurological & Child Risk: Lead (Pb) exposure impairs cognitive development in children even at low concentrations.',
      'Organ & Chronic Illness: Cadmium and pesticide residues link to kidney stress, hormonal disruption, and respiratory allergies.',
      'Dead Topsoil: Loss of earthworms, fungi, and nitrogen-fixing bacteria drops crop yields by 20–35%.',
      'Groundwater Poisoning: Rainwater washes surface nitrates and industrial salts straight into village borewells.',
    ],
    actionTakeaway: 'Protecting 15 cm of living topsoil protects both rural livelihoods and urban drinking water.',
  },
  {
    id: 'solutions',
    stepNumber: '04',
    title: 'Practical Solutions & Soil Healing',
    hindiSubtitle: 'मिट्टी बचाने के वैज्ञानिक और देसी उपाय',
    emoji: '🌿',
    summary:
      'Degraded soil can heal when we stop toxic dumping, feed organic carbon back to microbes, and use green plants to pull out heavy metals.',
    keyPoints: [
      'Phytoremediation: Grow Indian Mustard (Sarson), Sunflower, or Vetiver grass to naturally absorb heavy metals from contaminated plots.',
      'Compost & Jeevamrit: Returning kitchen compost, cow-dung manure, and crop mulch (Parali) rebuilds humus and earthworm life.',
      'Biochar & Neem Cake: Activated biochar locks heavy metals safely; Neem Khali replaces synthetic soil pesticides.',
      'Citizen Reporting: Mapping illegal dumping and demanding effluent treatment protects neighborhood soil.',
    ],
    actionTakeaway: 'Start today: compost kitchen waste, carry a cloth bag, and report open waste burning in your ward.',
  },
];

export const DAILY_SOIL_TIPS: DailySoilTip[] = [
  {
    id: 'tip-compost',
    title: 'Feed Your Soil With Kitchen Gold',
    hindiLine: 'रसोई का गीला कचरा नहीं, मिट्टी का असली सोना है।',
    advice:
      'Turning daily vegetable peels and tea leaves into compost restores earthworms and boosts topsoil organic carbon—helping gardens and farms hold 20% more monsoon moisture.',
    focusArea: 'Organic Carbon · Home & Farm',
    emoji: '🪱',
  },
  {
    id: 'tip-mulch',
    title: 'Mulch Crop Residue, Never Burn Parali',
    hindiLine: 'पराली जलाएं नहीं, मिट्टी में मिलाकर खाद बनाएं।',
    advice:
      'Keeping straw and dried leaves as surface mulch (Palwar) shields topsoil from harsh North Indian summer heat, prevents wind erosion, and nourishes friendly soil fungi.',
    focusArea: 'Zero Stubble Burning · Haryana & Punjab',
    emoji: '🌾',
  },
  {
    id: 'tip-mustard',
    title: 'Let Indian Mustard Clean Heavy Metals',
    hindiLine: 'सरसों (Sarson) सिर्फ फसल नहीं, मिट्टी की प्राकृतिक रक्षक है।',
    advice:
      'Planting Indian Mustard (Brassica juncea) on peri-urban plots near roads or drains naturally draws Lead and Zinc out of topsoil—gradually healing contaminated land.',
    focusArea: 'Phytoremediation · Delhi NCR',
    emoji: '🌼',
  },
  {
    id: 'tip-neem',
    title: 'Swap Chemical Sprays for Neem Khali',
    hindiLine: 'रासायनिक कीटनाशक घटाएं, नीम खली और जीवामृत अपनाएं।',
    advice:
      'Mixing neem cake (Neem Khali) into soil wards off root pests without killing nitrogen-fixing microbes—keeping both crops and village borewells clean.',
    focusArea: 'Bio-Inputs · Sustainable Farming',
    emoji: '🌿',
  },
  {
    id: 'tip-ewaste',
    title: 'Keep Batteries & Plastics Off Bare Ground',
    hindiLine: 'एक जली हुई बैटरी या प्लास्टिक, सालों तक मिट्टी को जहरीला कर सकता है।',
    advice:
      'Always hand old chargers, bulbs, and batteries to authorized e-waste recyclers instead of burning or dumping them—preventing invisible Lead and microplastic leaks.',
    focusArea: 'Urban Soil Protection · Zero Waste',
    emoji: '♻️',
  },
  {
    id: 'tip-trees',
    title: 'Plant Native Trees to Anchor Topsoil',
    hindiLine: 'नीम, पीपल और जामुन की जड़ें मिट्टी को बहने से बचाती हैं।',
    advice:
      'Native Indian saplings build deep root webs that stop monsoon runoff from washing away precious topsoil that took 1,000 years to form.',
    focusArea: 'Erosion Control · Community Action',
    emoji: '🌳',
  },
];

