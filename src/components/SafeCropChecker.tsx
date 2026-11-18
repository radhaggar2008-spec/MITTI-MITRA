import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert, Sprout } from 'lucide-react';
import { checkSafeCrop } from '../data/soilData';
import { CropLocation, CropType } from '../types';

const LOCATIONS: { value: CropLocation; sub: string }[] = [
  { value: 'Delhi', sub: 'Yamuna Belt & Urban Plots' },
  { value: 'Faridabad', sub: 'Industrial Peri-Urban Zone' },
  { value: 'Haryana', sub: 'Alluvial Farming Plains' },
];

const CROPS: { value: CropType; hindi: string; emoji: string }[] = [
  { value: 'Spinach', hindi: 'पालक', emoji: '🥬' },
  { value: 'Wheat', hindi: 'गेहूं', emoji: '🌾' },
  { value: 'Mustard', hindi: 'सरसों', emoji: '🌼' },
  { value: 'Rice', hindi: 'धान / चावल', emoji: '🍚' },
];

export const SafeCropChecker: React.FC = () => {
  const [location, setLocation] = useState<CropLocation>('Delhi');
  const [crop, setCrop] = useState<CropType>('Spinach');

  const result = useMemo(() => checkSafeCrop(location, crop), [location, crop]);

  const riskTheme = {
    high: {
      card: 'bg-[#FDECEA] border-[#E8A5A1]',
      text: 'text-[#8D1E1E]',
      Icon: ShieldAlert,
    },
    moderate: {
      card: 'bg-[#FFF9E6] border-[#E6C770]',
      text: 'text-[#7A5200]',
      Icon: AlertTriangle,
    },
    low: {
      card: 'bg-[#EEF7EE] border-[#A5D6A7]',
      text: 'text-[#1B5E20]',
      Icon: CheckCircle2,
    },
  }[result.risk];

  const RiskIcon = riskTheme.Icon;

  return (
    <section id="crops" className="py-12 sm:py-16 border-t border-[#E2D9C8]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-xs sm:text-sm font-medium text-[#5D4037]">
            Phytoremediation &amp; Food Safety · सुरक्षित फसल चुनें
          </p>
          <h2 className="mt-1 font-display text-2xl sm:text-4xl font-bold tracking-tight text-[#2C1E18]">
            Safe Crop Checker
          </h2>
          <p className="mt-2 text-sm sm:text-base text-[#5C473D]">
            Different crops absorb soil toxins at very different rates. Select your region and crop
            to check heavy-metal risk and soil-cleaning alternatives. 🌾
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Selectors */}
          <div className="lg:col-span-5 rounded-2xl bg-[#FFFFFF] border border-[#E2D9C8] p-5 sm:p-6 space-y-6">
            <div>
              <label
                htmlFor="safe-crop-location"
                className="block text-sm font-semibold text-[#2C1E18] mb-2"
              >
                📍 1. Select Location (क्षेत्र चुनें)
              </label>
              <select
                id="safe-crop-location"
                value={location}
                onChange={(e) => setLocation(e.target.value as CropLocation)}
                className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl border border-[#D4C7AE] bg-[#FAF7F0] text-sm font-medium text-[#2C1E18] focus:outline-none focus:border-[#2E7D32]"
              >
                {LOCATIONS.map((loc) => (
                  <option key={loc.value} value={loc.value}>
                    {loc.value} — {loc.sub}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="block text-sm font-semibold text-[#2C1E18] mb-2.5">
                🌱 2. Select Crop (फसल चुनें)
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                {CROPS.map((item) => {
                  const active = crop === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setCrop(item.value)}
                      className={`min-h-[54px] px-3.5 py-2.5 rounded-xl border text-left transition-colors cursor-pointer flex items-center gap-2.5 ${
                        active
                          ? 'bg-[#2E7D32] border-[#1B5E20] text-[#FAF7F0]'
                          : 'bg-[#FAF7F0] border-[#E2D9C8] hover:bg-[#EFE7D6] text-[#2C1E18]'
                      }`}
                    >
                      <span className="text-xl shrink-0" aria-hidden="true">
                        {item.emoji}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-bold leading-tight truncate">{item.value}</p>
                        <p
                          className={`text-xs truncate ${
                            active ? 'text-[#DCEEDC]' : 'text-[#6E584D]'
                          }`}
                        >
                          {item.hindi}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Diagnostic Result */}
          <div className="lg:col-span-7">
            <div className={`rounded-2xl border p-6 sm:p-7 ${riskTheme.card}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className={`inline-flex items-center gap-2 text-sm font-bold ${riskTheme.text}`}>
                  <RiskIcon className="w-5 h-5 shrink-0" />
                  <span>{result.riskBadge}</span>
                </div>
                <span className="text-xs font-medium text-[#5C473D]">
                  {result.location} · {result.crop}
                </span>
              </div>

              <h3 className="mt-4 font-display text-xl sm:text-2xl font-bold text-[#2C1E18]">
                {result.headline}
              </h3>

              <p className="mt-2.5 text-sm sm:text-base text-[#4E342E] leading-relaxed">
                {result.explanation}
              </p>

              <div className="mt-4 rounded-xl bg-[#FFFFFF]/85 border border-[#E2D9C8] p-4 space-y-2">
                <p className="text-sm font-medium text-[#2C1E18]">{result.hindiTip}</p>
                <p className="text-xs sm:text-sm text-[#5C473D]">
                  <strong className="text-[#1B5E20]">Soil Action:</strong>{' '}
                  {result.phytoremediationNote}
                </p>
              </div>

              {result.crop !== result.recommendedAlternative && (
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#D4C7AE]/60">
                  <p className="text-xs sm:text-sm font-medium text-[#4E342E] flex items-center gap-1.5">
                    <Sprout className="w-4 h-4 text-[#1B5E20]" />
                    <span>
                      Safer choice for {result.location}:{' '}
                      <strong>{result.recommendedAlternative}</strong>
                    </span>
                  </p>
                  <button
                    type="button"
                    onClick={() => setCrop(result.recommendedAlternative)}
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-[#2E7D32] hover:bg-[#1B5E20] text-[#FAF7F0] text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Switch to {result.recommendedAlternative}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
