import React from 'react';
import { Award, BookOpen, FlaskConical, Home, MapPin, Sprout, Users } from 'lucide-react';
import { SectionId } from '../types';

interface NavbarProps {
  activeSection: SectionId;
  onNavigate: (section: SectionId) => void;
}

const DESKTOP_LINKS: { id: SectionId; label: string }[] = [
  { id: 'health', label: 'Soil Health' },
  { id: 'crops', label: 'Safe Crop' },
  { id: 'responses', label: 'Response Form' },
  { id: 'eco', label: 'Eco Actions' },
  { id: 'learn', label: 'Learn' },
];

const MOBILE_TABS: { id: SectionId; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'home', label: 'Home', Icon: Home },
  { id: 'report', label: 'Report', Icon: MapPin },
  { id: 'health', label: 'Soil', Icon: FlaskConical },
  { id: 'crops', label: 'Crops', Icon: Sprout },
  { id: 'responses', label: 'Form', Icon: Users },
  { id: 'eco', label: 'Eco', Icon: Award },
  { id: 'learn', label: 'Learn', Icon: BookOpen },
];

export const Navbar: React.FC<NavbarProps> = ({ activeSection, onNavigate }) => {
  return (
    <>
      <header className="sticky top-0 z-40 h-14 md:h-16 bg-[#FAF7F0]/95 backdrop-blur-md border-b border-[#E2D9C8]">
        <div className="max-w-6xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-8">
          {/* Zone 1: Single-element brand wordmark */}
          <a
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('home');
            }}
            className="font-display text-lg sm:text-xl font-bold tracking-tight text-[#2C1E18] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2E7D32]"
          >
            🌱 MittiMitra
          </a>

          {/* Zone 2: 5 concise single-line navigation links */}
          <nav aria-label="Primary Navigation" className="hidden md:flex items-center gap-6">
            {DESKTOP_LINKS.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <a
                  key={link.id}
                  href={`#${link.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate(link.id);
                  }}
                  className={`text-sm font-medium whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2E7D32] ${
                    isActive
                      ? 'text-[#1B5E20] border-[#2E7D32]'
                      : 'text-[#5C473D] border-transparent hover:text-[#2C1E18] hover:border-[#C9BEA8]'
                  }`}
                >
                  {link.label}
                </a>
              );
            })}
          </nav>

          {/* Zone 3: 1 primary action CTA */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('report')}
              className="min-h-[40px] px-4 py-2 rounded-lg bg-[#2E7D32] hover:bg-[#1B5E20] text-[#FAF7F0] text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B5E20]"
            >
              Report Pollution
            </button>
          </div>
        </div>
      </header>

      {/* Mobile bottom thumb-zone tab bar (56px high, total sticky <= 112px on 800px+ screen) */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-14 bg-[#FAF7F0]/95 backdrop-blur-md border-t border-[#E2D9C8]"
      >
        <div className="grid grid-cols-7 h-full">
          {MOBILE_TABS.map(({ id, label, Icon }) => {
            const isActive = activeSection === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onNavigate(id)}
                className={`flex flex-col items-center justify-center min-h-[44px] transition-colors duration-150 cursor-pointer ${
                  isActive ? 'text-[#1B5E20] font-semibold' : 'text-[#6E584D]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="text-[10px] leading-tight mt-0.5 whitespace-nowrap">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
