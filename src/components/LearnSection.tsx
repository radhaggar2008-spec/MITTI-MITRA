import React, { useState } from 'react';
import { LEARN_CARDS } from '../data/soilData';
import { LearnCard } from '../types';

export const LearnSection: React.FC = () => {
  const [selectedId, setSelectedId] = useState<LearnCard['id']>('sources');
  const [imgFailed, setImgFailed] = useState(false);

  const activeCard = LEARN_CARDS.find((c) => c.id === selectedId) || LEARN_CARDS[0];

  return (
    <section id="learn" className="py-12 sm:py-16 border-t border-[#E2D9C8]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-xs sm:text-sm font-medium text-[#5D4037]">
            Knowledge Hub · मिट्टी को जानें और बचाएं
          </p>
          <h2 className="mt-1 font-display text-2xl sm:text-4xl font-bold tracking-tight text-[#2C1E18]">
            Learn: Science of Living Soil
          </h2>
          <p className="mt-2 text-sm sm:text-base text-[#5C473D]">
            Understand how pollution enters Indian soil, travels into our food chain, affects human
            health, and how communities can heal the land. 📚
          </p>
        </div>

        {/* 4 Presentation Cards Grid */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {LEARN_CARDS.map((card) => {
            const isSelected = card.id === selectedId;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => setSelectedId(card.id)}
                className={`text-left rounded-2xl border p-5 transition-colors cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#3E2723] border-[#2C1E18] text-[#FAF7F0]'
                    : 'bg-[#FFFFFF] border-[#E2D9C8] hover:bg-[#F5EFE2] text-[#2C1E18]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-mono-num">
                    <span className={isSelected ? 'text-[#D7CCC8]' : 'text-[#6E584D]'}>
                      {card.stepNumber}. Module
                    </span>
                    <span className="text-lg" aria-hidden="true">
                      {card.emoji}
                    </span>
                  </div>
                  <h3 className="mt-3 font-display text-lg font-bold leading-snug">
                    {card.title}
                  </h3>
                  <p
                    className={`mt-1 text-xs ${
                      isSelected ? 'text-[#D7CCC8]' : 'text-[#6E584D]'
                    }`}
                  >
                    {card.hindiSubtitle}
                  </p>
                </div>

                <p
                  className={`mt-4 text-xs font-semibold ${
                    isSelected ? 'text-[#A5D6A7]' : 'text-[#1B5E20]'
                  }`}
                >
                  {isSelected ? 'Viewing details below ↓' : 'Read module →'}
                </p>
              </button>
            );
          })}
        </div>

        {/* Active Module Deep-Dive + Botanical Soil Profile Illustration */}
        <div className="mt-6 rounded-2xl bg-[#FFFFFF] border border-[#E2D9C8] overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <p className="text-xs font-medium text-[#5D4037]">
                {activeCard.stepNumber}. {activeCard.hindiSubtitle}
              </p>
              <h3 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-[#2C1E18]">
                {activeCard.emoji} {activeCard.title}
              </h3>
              <p className="mt-3 text-sm sm:text-base text-[#4E342E] leading-relaxed">
                {activeCard.summary}
              </p>

              <ul className="mt-5 space-y-2.5">
                {activeCard.keyPoints.map((point, idx) => (
                  <li
                    key={idx}
                    className="rounded-xl bg-[#FAF7F0] border border-[#EFE7D6] px-4 py-3 text-sm text-[#2C1E18] leading-relaxed"
                  >
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 rounded-xl bg-[#EEF7EE] border border-[#A5D6A7] p-4">
              <p className="text-xs font-bold text-[#1B5E20]">Key Takeaway · मुख्य संदेश</p>
              <p className="text-sm text-[#1B5E20] mt-1 font-medium">
                {activeCard.actionTakeaway}
              </p>
            </div>
          </div>

          <div className="lg:col-span-5 bg-[#FAF7F0] border-t lg:border-t-0 lg:border-l border-[#E2D9C8] flex flex-col">
            <div className="flex-1 min-h-[260px] overflow-hidden">
              {!imgFailed ? (
                <img
                  src="/src/assets/images/learn_soil_crosssection_1795014405044.jpg"
                  alt="Scientific botanical cross-section showing living topsoil, earthworms, and white mustard taproot system"
                  referrerPolicy="no-referrer"
                  onError={() => setImgFailed(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-[#EFE7D6]">
                  <span className="text-4xl mb-2" aria-hidden="true">
                    🪱
                  </span>
                  <p className="font-display font-bold text-[#2C1E18]">
                    Soil Profile &amp; Mustard Roots
                  </p>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-[#E2D9C8] bg-[#FAF7F0]">
              <p className="text-xs text-[#5C473D]">
                <strong>Did you know?</strong> Healthy O &amp; A soil horizons (0–30 cm) hold the
                humus, earthworms, and root fungi that filter pollutants naturally.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
