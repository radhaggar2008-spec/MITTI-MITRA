import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  FileScan,
  RotateCcw,
  ShieldAlert,
  Upload,
} from 'lucide-react';
import { evaluateSoilHealth, SHC_SAMPLE_CARDS } from '../data/soilData';
import { ShcSampleCard, SoilReading } from '../types';

const DEFAULT_READING: SoilReading = {
  ph: 7.4,
  nitrogen: 180,
  phosphorus: 22,
  potassium: 190,
};

export const SoilHealthChecker: React.FC = () => {
  const [reading, setReading] = useState<SoilReading>(DEFAULT_READING);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedCard, setScannedCard] = useState<ShcSampleCard | null>(null);
  const [uploadedCardPreview, setUploadedCardPreview] = useState<string>('');

  const evaluation = useMemo(() => evaluateSoilHealth(reading), [reading]);

  const runShcScan = (card: ShcSampleCard, customPreview?: string) => {
    setIsScanning(true);
    if (customPreview) {
      setUploadedCardPreview(customPreview);
    } else {
      setUploadedCardPreview('');
    }
    setTimeout(() => {
      setReading(card.reading);
      setScannedCard(card);
      setIsScanning(false);
    }, 1250);
  };

  const handleShcUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      // Simulate OCR reading of uploaded Soil Health Card using Yamuna/Karnal reference values
      const sample = SHC_SAMPLE_CARDS[1];
      runShcScan(sample, reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const tierStyles = {
    green: {
      container: 'bg-[#EEF7EE] border-[#A5D6A7]',
      headerText: 'text-[#1B5E20]',
      subText: 'text-[#2E7D32]',
      Icon: CheckCircle2,
    },
    yellow: {
      container: 'bg-[#FFF9E6] border-[#E6C770]',
      headerText: 'text-[#7A5200]',
      subText: 'text-[#8D6100]',
      Icon: AlertTriangle,
    },
    red: {
      container: 'bg-[#FDECEA] border-[#E8A5A1]',
      headerText: 'text-[#8D1E1E]',
      subText: 'text-[#A62626]',
      Icon: ShieldAlert,
    },
  }[evaluation.tier];

  const StatusIcon = tierStyles.Icon;

  return (
    <section id="health" className="py-12 sm:py-16 border-t border-[#E2D9C8] bg-[#F5EFE2]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs sm:text-sm font-medium text-[#5D4037]">
              NPK &amp; pH Diagnostics · मिट्टी स्वास्थ्य जांच
            </p>
            <h2 className="mt-1 font-display text-2xl sm:text-4xl font-bold tracking-tight text-[#2C1E18]">
              Soil Health Checker
            </h2>
            <p className="mt-2 text-sm sm:text-base text-[#5C473D]">
              Adjust your field’s pH and NPK sliders—or scan a Soil Health Card (SHC)—to get instant
              remediation advice in English &amp; Hindi. 🧪
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setReading(DEFAULT_READING);
              setScannedCard(null);
              setUploadedCardPreview('');
            }}
            className="self-start md:self-auto min-h-[40px] px-3.5 py-2 rounded-xl bg-[#FFFFFF] border border-[#D4C7AE] text-xs font-semibold text-[#4E342E] hover:bg-[#FAF7F0] inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Sliders</span>
          </button>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Sliders + SHC Scanner */}
          <div className="lg:col-span-6 space-y-6">
            {/* NPK + pH Sliders Card */}
            <div className="rounded-2xl bg-[#FFFFFF] border border-[#E2D9C8] p-5 sm:p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-bold text-[#2C1E18]">
                  Enter Soil Parameters
                </h3>
                <span className="text-xs text-[#6E584D]">Ideal pH: 6.5 – 7.5</span>
              </div>

              {/* pH Slider */}
              <div>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <label htmlFor="slider-ph" className="font-semibold text-[#2C1E18]">
                    Soil pH (अम्लीयता / क्षारीयता)
                  </label>
                  <span className="font-mono-num font-bold text-[#1B5E20]">
                    {reading.ph.toFixed(1)} pH
                  </span>
                </div>
                <input
                  id="slider-ph"
                  type="range"
                  min={3.5}
                  max={9.5}
                  step={0.1}
                  value={reading.ph}
                  onChange={(e) =>
                    setReading((prev) => ({ ...prev, ph: parseFloat(e.target.value) }))
                  }
                  className="w-full soil-slider"
                />
                <div className="flex justify-between text-[11px] text-[#7D685C] mt-1 font-mono-num">
                  <span>3.5 Acidic</span>
                  <span>7.0 Neutral</span>
                  <span>9.5 Alkaline</span>
                </div>
              </div>

              {/* Nitrogen Slider */}
              <div>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <label htmlFor="slider-n" className="font-semibold text-[#2C1E18]">
                    Nitrogen (N · नाइट्रोजन)
                  </label>
                  <span className="font-mono-num font-bold text-[#1B5E20]">
                    {reading.nitrogen} kg/ha
                  </span>
                </div>
                <input
                  id="slider-n"
                  type="range"
                  min={40}
                  max={600}
                  step={5}
                  value={reading.nitrogen}
                  onChange={(e) =>
                    setReading((prev) => ({ ...prev, nitrogen: parseInt(e.target.value, 10) }))
                  }
                  className="w-full soil-slider"
                />
                <div className="flex justify-between text-[11px] text-[#7D685C] mt-1 font-mono-num">
                  <span>40 Low</span>
                  <span>280–450 Optimal</span>
                  <span>600 Excess</span>
                </div>
              </div>

              {/* Phosphorus Slider */}
              <div>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <label htmlFor="slider-p" className="font-semibold text-[#2C1E18]">
                    Phosphorus (P · फॉस्फोरस)
                  </label>
                  <span className="font-mono-num font-bold text-[#1B5E20]">
                    {reading.phosphorus} kg/ha
                  </span>
                </div>
                <input
                  id="slider-p"
                  type="range"
                  min={4}
                  max={100}
                  step={1}
                  value={reading.phosphorus}
                  onChange={(e) =>
                    setReading((prev) => ({ ...prev, phosphorus: parseInt(e.target.value, 10) }))
                  }
                  className="w-full soil-slider"
                />
                <div className="flex justify-between text-[11px] text-[#7D685C] mt-1 font-mono-num">
                  <span>4 Low</span>
                  <span>25–55 Optimal</span>
                  <span>100 High</span>
                </div>
              </div>

              {/* Potassium Slider */}
              <div>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <label htmlFor="slider-k" className="font-semibold text-[#2C1E18]">
                    Potassium (K · पोटाश)
                  </label>
                  <span className="font-mono-num font-bold text-[#1B5E20]">
                    {reading.potassium} kg/ha
                  </span>
                </div>
                <input
                  id="slider-k"
                  type="range"
                  min={50}
                  max={480}
                  step={5}
                  value={reading.potassium}
                  onChange={(e) =>
                    setReading((prev) => ({ ...prev, potassium: parseInt(e.target.value, 10) }))
                  }
                  className="w-full soil-slider"
                />
                <div className="flex justify-between text-[11px] text-[#7D685C] mt-1 font-mono-num">
                  <span>50 Low</span>
                  <span>180–340 Optimal</span>
                  <span>480 High</span>
                </div>
              </div>
            </div>

            {/* Dummy Soil Health Card (SHC) Scanner UI */}
            <div className="rounded-2xl bg-[#FFFFFF] border border-[#E2D9C8] p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-base sm:text-lg font-bold text-[#2C1E18] flex items-center gap-2">
                    <FileScan className="w-5 h-5 text-[#2E7D32]" />
                    <span>Soil Health Card (SHC) Scanner</span>
                  </h3>
                  <p className="text-xs text-[#6E584D] mt-1">
                    Upload your Govt. SHC card photo or tap a sample card below to auto-fill NPK &amp; pH.
                  </p>
                </div>
                <label className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#2E7D32] hover:bg-[#1B5E20] text-[#FAF7F0] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Scan Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleShcUpload}
                    className="sr-only"
                  />
                </label>
              </div>

              {/* Scanner Viewport */}
              <div className="mt-4 relative rounded-xl border border-[#D4C7AE] bg-[#FAF7F0] p-4 overflow-hidden min-h-[140px] flex flex-col justify-center">
                {isScanning && (
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-0 top-0 h-1 bg-[#2E7D32] shadow-[0_0_12px_#2E7D32] animate-scan-beam z-10"
                  />
                )}

                {isScanning ? (
                  <div className="text-center py-4">
                    <p className="font-display text-sm font-bold text-[#1B5E20]">
                      🔍 Scanning Soil Health Card...
                    </p>
                    <p className="text-xs text-[#6E584D] mt-1">
                      Reading pH, Organic Carbon, Nitrogen, Phosphorus &amp; Potassium
                    </p>
                  </div>
                ) : scannedCard ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {uploadedCardPreview && (
                      <img
                        src={uploadedCardPreview}
                        alt="Scanned SHC upload"
                        className="w-16 h-16 rounded-lg object-cover border border-[#D4C7AE] shrink-0"
                      />
                    )}
                    <div className="flex-1">
                      <p className="text-xs text-[#1B5E20] font-semibold">
                        ✅ Extracted Card · {scannedCard.cardNumber}
                      </p>
                      <p className="font-display text-sm font-bold text-[#2C1E18] mt-0.5">
                        {scannedCard.farmerName} · {scannedCard.district}
                      </p>
                      <p className="text-xs text-[#5C473D] mt-0.5">
                        {scannedCard.soilType} · Organic Carbon: {scannedCard.organicCarbon}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm text-[#6E584D] text-center">
                    Tap any sample Indian Soil Health Card below to test the scanner 🪪
                  </p>
                )}
              </div>

              {/* Quick sample card buttons */}
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                {SHC_SAMPLE_CARDS.map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    disabled={isScanning}
                    onClick={() => runShcScan(card)}
                    className={`min-h-[44px] px-3 py-2 rounded-xl border text-left transition-colors cursor-pointer disabled:opacity-60 ${
                      scannedCard?.id === card.id
                        ? 'bg-[#E8F5E9] border-[#2E7D32] text-[#1B5E20]'
                        : 'bg-[#FAF7F0] border-[#E2D9C8] hover:bg-[#EFE7D6] text-[#2C1E18]'
                    }`}
                  >
                    <p className="text-xs font-bold truncate">{card.district}</p>
                    <p className="text-[11px] text-[#6E584D] truncate">{card.farmerName}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Live Diagnostic Result Card (Green / Yellow / Red) */}
          <div className="lg:col-span-6">
            <div className={`rounded-2xl border p-6 sm:p-7 transition-colors ${tierStyles.container}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className={`inline-flex items-center gap-2 text-sm font-bold ${tierStyles.headerText}`}>
                    <StatusIcon className="w-5 h-5 shrink-0" />
                    <span>{evaluation.statusLabel}</span>
                  </div>
                  <p className={`text-xs font-medium mt-1 ${tierStyles.subText}`}>
                    {evaluation.hindiLabel}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-[11px] font-medium text-[#5C473D]">Soil Index</p>
                  <p className={`font-display text-3xl font-bold font-mono-num ${tierStyles.headerText}`}>
                    {evaluation.score}/100
                  </p>
                </div>
              </div>

              <h3 className="mt-5 font-display text-xl sm:text-2xl font-bold text-[#2C1E18]">
                {evaluation.headline}
              </h3>

              <p className="mt-2 text-sm sm:text-base text-[#4E342E] leading-relaxed">
                {evaluation.summary}
              </p>

              {/* Current metrics tabular strip */}
              <div className="mt-5 grid grid-cols-4 gap-2 rounded-xl bg-[#FFFFFF]/85 border border-[#E2D9C8] p-3 text-center">
                <div>
                  <p className="text-[11px] text-[#6E584D]">pH</p>
                  <p className="font-mono-num text-sm sm:text-base font-bold text-[#2C1E18]">
                    {reading.ph.toFixed(1)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-[#6E584D]">N (kg/ha)</p>
                  <p className="font-mono-num text-sm sm:text-base font-bold text-[#2C1E18]">
                    {reading.nitrogen}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-[#6E584D]">P (kg/ha)</p>
                  <p className="font-mono-num text-sm sm:text-base font-bold text-[#2C1E18]">
                    {reading.phosphorus}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-[#6E584D]">K (kg/ha)</p>
                  <p className="font-mono-num text-sm sm:text-base font-bold text-[#2C1E18]">
                    {reading.potassium}
                  </p>
                </div>
              </div>

              {/* Actionable Recommendations */}
              <div className="mt-6">
                <p className="text-xs font-bold uppercase tracking-wider text-[#5D4037] mb-3">
                  Recommended Soil Recovery Plan (सुझाव)
                </p>
                <ul className="space-y-2.5">
                  {evaluation.adviceList.map((advice, idx) => (
                    <li
                      key={idx}
                      className="rounded-xl bg-[#FFFFFF]/90 border border-[#E2D9C8] px-4 py-3 text-sm text-[#2C1E18] leading-relaxed"
                    >
                      🌱 {advice}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
