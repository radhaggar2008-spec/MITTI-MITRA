import React, { useState } from 'react';
import { ArrowRight, FlaskConical, ShieldAlert } from 'lucide-react';
import { SectionId } from '../types';
import { DailySoilTip } from './DailySoilTip';

interface HomeHeroProps {
  onNavigate: (section: SectionId) => void;
  totalReports: number;
  ecoPoints: number;
}

export const HomeHero: React.FC<HomeHeroProps> = ({ onNavigate, totalReports, ecoPoints }) => {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <section id="home" className="pt-8 pb-12 sm:pt-12 sm:pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Two-column balanced hero split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center">
            <p className="text-sm font-medium text-[#5D4037]">
              🇮🇳 SoilGuard India · स्वच्छ मिट्टी, स्वस्थ जीवन
            </p>

            <h1
              className="mt-3 font-display text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight text-[#2C1E18] leading-[1.08]"
              style={{ textWrap: 'balance' }}
            >
              Healthy Soil, Healthy Lives.
            </h1>

            <p className="mt-4 text-base sm:text-lg text-[#5C473D] leading-relaxed max-w-xl">
              From Delhi’s Yamuna floodplains to Haryana’s farmlands, living topsoil feeds our
              plate. Spot toxic contamination early, test your NPK &amp; pH balance, and choose
              crops that keep Indian families safe. 🌾
            </p>

            {/* Primary & Secondary Action Buttons */}
            <div className="mt-7 flex flex-wrap items-center gap-3.5">
              <button
                type="button"
                onClick={() => onNavigate('report')}
                className="min-h-[48px] px-6 py-3 rounded-xl bg-[#2E7D32] hover:bg-[#1B5E20] text-[#FAF7F0] font-semibold text-sm sm:text-base inline-flex items-center gap-2 transition-colors duration-150 cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B5E20]"
              >
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Report Pollution</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('health')}
                className="min-h-[48px] px-6 py-3 rounded-xl bg-[#EFE7D6] hover:bg-[#E4D9C1] text-[#2C1E18] border border-[#D4C7AE] font-semibold text-sm sm:text-base inline-flex items-center gap-2 transition-colors duration-150 cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5D4037]"
              >
                <FlaskConical className="w-4 h-4 shrink-0 text-[#5D4037]" />
                <span>Check Soil Health</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>
            </div>

            {/* Quiet inline community summary with typographic separators */}
            <div className="mt-6 flex flex-wrap items-center gap-2 text-xs sm:text-sm text-[#6E584D]">
              <span className="font-mono-num font-semibold text-[#2C1E18]">{totalReports}</span>
              <span>Active local reports</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-num font-semibold text-[#1B5E20]">{ecoPoints} pts</span>
              <span>Your Eco-Mitra score</span>
              <span aria-hidden="true">·</span>
              <span>100% offline-ready LocalStorage</span>
            </div>
          </div>

          {/* Right visual carrier */}
          <div className="lg:col-span-6">
            <div className="relative h-64 sm:h-80 lg:h-full min-h-[300px] rounded-2xl overflow-hidden border border-[#DED4C0] bg-[#3E2723]">
              {!imgFailed ? (
                <img
                  src="/src/assets/images/hero_indian_soil_1795014403831.jpg"
                  alt="Indian farmer hands cradling dark fertile topsoil with a bright green mustard sprout over golden farmland"
                  referrerPolicy="no-referrer"
                  onError={() => setImgFailed(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-[#3E2723] via-[#4E342E] to-[#1B5E20] text-[#FAF7F0]">
                  <span className="text-4xl mb-3" aria-hidden="true">
                    🌱
                  </span>
                  <p className="font-display text-xl font-semibold">Living Indian Topsoil</p>
                  <p className="text-sm text-[#E6DEC8] mt-1">
                    Protecting 15 cm of earth that sustains 1.4 billion lives.
                  </p>
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 bg-gradient-to-t from-black/80 via-black/45 to-transparent text-[#FAF7F0]">
                <p className="text-xs sm:text-sm font-medium text-[#F3EDE0]">
                  🌿 Ek Mutthi Mitti — One handful of healthy soil holds more living organisms than
                  people on Earth.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Full-width 3-column proof / reality stats strip */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          <div className="rounded-2xl bg-[#FFFFFF] border border-[#E2D9C8] p-5 sm:p-6">
            <p className="text-xs font-medium text-[#6E584D]">Global &amp; Indian Topsoil Crisis</p>
            <p className="mt-2 font-display text-2xl sm:text-3xl font-bold text-[#8D3B1B] font-mono-num">
              1/3rd Soil Degraded
            </p>
            <p className="mt-2 text-sm text-[#5C473D] leading-relaxed">
              Over 33% of arable topsoil faces chemical fatigue, salinity, plastic accumulation, or
              erosion—threatening rural harvests. ⚠️
            </p>
          </div>

          <div className="rounded-2xl bg-[#FFFFFF] border border-[#E2D9C8] p-5 sm:p-6">
            <p className="text-xs font-medium text-[#6E584D]">Irreplaceable Natural Capital</p>
            <p className="mt-2 font-display text-2xl sm:text-3xl font-bold text-[#4E342E] font-mono-num">
              1,000 Years to Form
            </p>
            <p className="mt-2 text-sm text-[#5C473D] leading-relaxed">
              Nature takes up to a millennium to weather rock and organic matter into just 2–3 cm of
              fertile topsoil. ⏳
            </p>
          </div>

          <div className="rounded-2xl bg-[#FFFFFF] border border-[#E2D9C8] p-5 sm:p-6">
            <p className="text-xs font-medium text-[#6E584D]">Silent Threat Beneath Crops</p>
            <p className="mt-2 font-display text-2xl sm:text-3xl font-bold text-[#1B5E20]">
              Pollution Is Invisible
            </p>
            <p className="mt-2 text-sm text-[#5C473D] leading-relaxed">
              Lead, arsenic, and microplastics leave no foul smell or visible stain—yet enter our
              food chain silently. 🔬
            </p>
          </div>
        </div>

        {/* Daily Soil Tip Component */}
        <DailySoilTip />

        {/* Quick Navigation Strip to Dedicated Tabs */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              id: 'responses' as SectionId,
              emoji: '📝',
              title: 'Response Form & Advice Box',
              desc: 'Students, teachers & citizens share soil feedback and advice.',
            },
            {
              id: 'crops' as SectionId,
              emoji: '🌾',
              title: 'Safe Crop Checker',
              desc: 'Check lead risk across Delhi, Faridabad & Haryana crops.',
            },
            {
              id: 'eco' as SectionId,
              emoji: '🌿',
              title: 'Eco Actions & Photo Proof',
              desc: 'Complete daily tasks, upload action photos & climb leaderboard.',
            },
            {
              id: 'learn' as SectionId,
              emoji: '📚',
              title: 'Learn Soil Science',
              desc: 'Explore pollution sources, food chain & soil healing solutions.',
            },
          ].map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => onNavigate(card.id)}
              className="text-left rounded-2xl bg-[#FFFFFF] hover:bg-[#F5EFE2] border border-[#E2D9C8] p-5 transition-colors cursor-pointer flex flex-col justify-between"
            >
              <div>
                <span className="text-2xl" aria-hidden="true">
                  {card.emoji}
                </span>
                <h3 className="mt-2 font-display text-base font-bold text-[#2C1E18]">
                  {card.title}
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-[#5C473D] leading-relaxed">
                  {card.desc}
                </p>
              </div>
              <span className="mt-3 text-xs font-semibold text-[#1B5E20] inline-flex items-center gap-1">
                <span>Open tab</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

