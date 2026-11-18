import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Shuffle } from 'lucide-react';
import { DAILY_SOIL_TIPS } from '../data/soilData';

const DAILY_TIP_STORAGE_KEY = 'mittimitra_daily_tip_v1';
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

interface StoredDailyTip {
  index: number;
  updatedAt: number;
}

function pickRandomIndex(length: number, excludeIndex?: number): number {
  if (length <= 1) return 0;
  let candidate = Math.floor(Math.random() * length);
  if (excludeIndex !== undefined && candidate === excludeIndex) {
    candidate = (candidate + 1 + Math.floor(Math.random() * (length - 1))) % length;
  }
  return candidate;
}

function loadOrRefreshDailyTip(): StoredDailyTip {
  const now = Date.now();
  try {
    const raw = localStorage.getItem(DAILY_TIP_STORAGE_KEY);
    if (raw) {
      const parsed: StoredDailyTip = JSON.parse(raw);
      const validIndex =
        typeof parsed.index === 'number' &&
        parsed.index >= 0 &&
        parsed.index < DAILY_SOIL_TIPS.length;
      const within24Hours =
        typeof parsed.updatedAt === 'number' && now - parsed.updatedAt < TWENTY_FOUR_HOURS_MS;

      if (validIndex && within24Hours) {
        return parsed;
      }

      const nextTip: StoredDailyTip = {
        index: pickRandomIndex(DAILY_SOIL_TIPS.length, validIndex ? parsed.index : undefined),
        updatedAt: now,
      };
      localStorage.setItem(DAILY_TIP_STORAGE_KEY, JSON.stringify(nextTip));
      return nextTip;
    }
  } catch {
    // Fall back to fresh random selection
  }

  const initial: StoredDailyTip = {
    index: pickRandomIndex(DAILY_SOIL_TIPS.length),
    updatedAt: now,
  };
  try {
    localStorage.setItem(DAILY_TIP_STORAGE_KEY, JSON.stringify(initial));
  } catch {
    // Ignore storage write errors
  }
  return initial;
}

export const DailySoilTip: React.FC = () => {
  const [tipState, setTipState] = useState<StoredDailyTip>(loadOrRefreshDailyTip);

  // Schedule an automatic refresh when the 24-hour window expires
  useEffect(() => {
    const elapsed = Date.now() - tipState.updatedAt;
    const remainingMs = Math.max(1000, TWENTY_FOUR_HOURS_MS - elapsed);

    const timer = window.setTimeout(() => {
      const refreshed: StoredDailyTip = {
        index: pickRandomIndex(DAILY_SOIL_TIPS.length, tipState.index),
        updatedAt: Date.now(),
      };
      setTipState(refreshed);
      try {
        localStorage.setItem(DAILY_TIP_STORAGE_KEY, JSON.stringify(refreshed));
      } catch {
        // Ignore storage write errors
      }
    }, remainingMs);

    return () => window.clearTimeout(timer);
  }, [tipState.index, tipState.updatedAt]);

  const saveAndSetIndex = (nextIndex: number) => {
    const updated: StoredDailyTip = {
      index: nextIndex,
      updatedAt: Date.now(),
    };
    setTipState(updated);
    try {
      localStorage.setItem(DAILY_TIP_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore storage write errors
    }
  };

  const currentTip = DAILY_SOIL_TIPS[tipState.index] || DAILY_SOIL_TIPS[0];

  const handlePrev = () => {
    const prev = (tipState.index - 1 + DAILY_SOIL_TIPS.length) % DAILY_SOIL_TIPS.length;
    saveAndSetIndex(prev);
  };

  const handleNext = () => {
    const next = (tipState.index + 1) % DAILY_SOIL_TIPS.length;
    saveAndSetIndex(next);
  };

  const handleRandomTip = () => {
    saveAndSetIndex(pickRandomIndex(DAILY_SOIL_TIPS.length, tipState.index));
  };

  return (
    <div
      aria-label="Daily Soil Tip"
      className="mt-6 rounded-2xl bg-[#EEF7EE] border border-[#B9DFBA] p-5 sm:p-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#1B5E20]">
          <span className="font-bold">Daily Soil Tip</span>
          <span aria-hidden="true">·</span>
          <span className="font-medium text-[#2E7D32]">{currentTip.focusArea}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono-num text-[#3D6B3F]">
            Tip {tipState.index + 1} of {DAILY_SOIL_TIPS.length} · Refreshes every 24h
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous soil tip"
            className="min-h-[38px] min-w-[38px] px-2.5 rounded-xl bg-[#FFFFFF] hover:bg-[#FAF7F0] border border-[#C6DFC7] text-[#1B5E20] inline-flex items-center justify-center cursor-pointer transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleRandomTip}
            className="min-h-[38px] px-3.5 rounded-xl bg-[#FFFFFF] hover:bg-[#FAF7F0] border border-[#C6DFC7] text-[#1B5E20] text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>New Tip</span>
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next soil tip"
            className="min-h-[38px] min-w-[38px] px-2.5 rounded-xl bg-[#FFFFFF] hover:bg-[#FAF7F0] border border-[#C6DFC7] text-[#1B5E20] inline-flex items-center justify-center cursor-pointer transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-col md:flex-row md:items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-[#FFFFFF] border border-[#C6DFC7] flex items-center justify-center text-2xl shrink-0">
          <span aria-hidden="true">{currentTip.emoji}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-display text-lg sm:text-xl font-bold text-[#1B431E]">
            {currentTip.title}
          </h2>
          <p className="mt-0.5 text-sm font-medium text-[#2E7D32]">{currentTip.hindiLine}</p>
          <p className="mt-2 text-sm sm:text-base text-[#2C3E2D] leading-relaxed">
            {currentTip.advice}
          </p>
        </div>
      </div>
    </div>
  );
};
