import React, { useState } from 'react';
import { X } from '@phosphor-icons/react';
import { CanvasReadOnlyCard } from './CreateAppreciationModal';
import type { CanvasElement } from './CreateAppreciationModal';
import type { ConfettiType } from './ConfettiOverlay';

/**
 * A ready-made message design: canvas elements laid out on the 254x350 card.
 *
 * Built from the same element types the composer edits (text and vector), so a
 * chosen template is an ordinary starting canvas — every piece of it can be
 * moved, retyped, recoloured or deleted afterwards.
 */
export interface MessageTemplate {
  id: string;
  name: string;
  elements: Omit<CanvasElement, 'id'>[];
  confetti?: ConfettiType;
}

const CURSIVE = 'Caveat, cursive';
const SERIF = 'Playfair Display, serif';
const MONO = 'Courier Prime, monospace';
const SANS = 'Nunito, sans-serif';

const vector = (
  vectorId: string,
  vectorColor: string,
  x: number,
  y: number,
  scale = 1,
  rotation = 0,
): Omit<CanvasElement, 'id'> => ({ type: 'vector', vectorId, vectorColor, x, y, scale, rotation });

const text = (
  value: string,
  fontFamily: string,
  color: string,
  x: number,
  y: number,
  scale = 1,
  rotation = 0,
): Omit<CanvasElement, 'id'> => ({
  type: 'text',
  text: value,
  fontFamily,
  isCursive: fontFamily === CURSIVE,
  color,
  align: 'center',
  x,
  y,
  scale,
  rotation,
});

export const MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    id: 'birthday',
    name: 'Happy Birthday',
    confetti: 'celebration',
    elements: [
      vector('balloon', '#F28B82', -82, -120, 0.9, -12),
      vector('balloon', '#F6C177', 84, -112, 0.8, 10),
      vector('cake', '#E8735A', 0, -78, 1.3),
      text('Happy\nBirthday!', MONO, '#1A1B25', 0, 18, 1.15),
      text('Wishing you the brightest year yet', SANS, '#666D80', 0, 112, 0.7),
      vector('sparkle', '#B4A3F5', -90, 120, 0.6),
      vector('gift', '#5FB3A1', 90, 118, 0.7, 8),
    ],
  },
  {
    id: 'love-note',
    name: 'Love Note',
    elements: [
      vector('heart', '#F9C9C1', -70, -110, 0.6, -14),
      vector('heart', '#E8735A', 0, -88, 1.4),
      vector('heart', '#F9C9C1', 76, -60, 0.45, 12),
      text('Your kindness means so much to me. I’m grateful for you always. Love you', CURSIVE, '#272835', 0, 52, 0.95),
    ],
  },
  {
    id: 'thank-you',
    name: 'Thank You',
    elements: [
      vector('sparkle', '#F6C177', -78, -112, 0.7),
      vector('sparkle', '#F6C177', 82, -96, 0.5),
      text('Thank you', CURSIVE, '#FE6349', 0, -40, 1.5, -4),
      text('for everything you do', SERIF, '#272835', 0, 30, 0.85),
      vector('heart', '#FE6349', 0, 108, 0.8),
    ],
  },
  {
    id: 'congrats',
    name: 'Congratulations',
    confetti: 'simple',
    elements: [
      vector('trophy', '#F2B33D', 0, -92, 1.5),
      text('Congratulations!', SERIF, '#1A1B25', 0, 12, 1),
      text('You earned every bit of this', SANS, '#666D80', 0, 70, 0.75),
      vector('star', '#F2B33D', -88, 118, 0.6, -10),
      vector('star', '#F2B33D', 88, 118, 0.6, 10),
    ],
  },
  {
    id: 'well-done',
    name: 'Well Done',
    confetti: 'clap',
    elements: [
      vector('hand_clapping', '#F2B33D', 0, -90, 1.4),
      text('Well done!', MONO, '#1A1B25', 0, 0, 1.2),
      text('So proud of you', CURSIVE, '#4CB993', 0, 64, 1.1),
      vector('medal', '#E8735A', 0, 124, 0.7),
    ],
  },
  {
    id: 'cheers',
    name: 'Cheers',
    elements: [
      vector('wine', '#8B5CF6', 0, -88, 1.4),
      text('Cheers to you', SERIF, '#1A1B25', 0, 8, 1.1),
      text('Here’s to many more wins', CURSIVE, '#8B5CF6', 0, 72, 1),
      vector('sparkle', '#B4A3F5', -84, -118, 0.6),
      vector('sparkle', '#B4A3F5', 86, 116, 0.6),
    ],
  },
];

/** A template's elements with fresh ids, ready to drop onto the canvas. */
export const instantiateTemplate = (template: MessageTemplate): CanvasElement[] =>
  template.elements.map((el, i) => ({
    ...el,
    id: `${el.type}-${Date.now()}-${i}-${Math.floor(Math.random() * 1000)}`,
  }));

interface TemplatePickerModalProps {
  onUseTemplate: (template: MessageTemplate) => void;
  onClose: () => void;
}

export const TemplatePickerModal: React.FC<TemplatePickerModalProps> = ({ onUseTemplate, onClose }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = MESSAGE_TEMPLATES.find((t) => t.id === selectedId) ?? null;

  return (
    <div
      className="fixed inset-0 z-[4000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-[2rem] max-w-md w-full max-h-[90dvh] sm:max-h-[85vh] shadow-2xl flex flex-col relative animate-in zoom-in-95 duration-200 font-sans overflow-hidden select-none">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between shrink-0">
          <h3 className="text-lg font-bold text-[#1A1B25]">Select Template</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 -mr-2 rounded-full flex items-center justify-center text-gray-500 hover:text-[#1A1B25] hover:bg-gray-100 transition-all cursor-pointer"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <div className="mx-6 border-t border-[#ECEFF3]" />

        {/* Templates */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 min-h-0 scrollbar-thin">
          {MESSAGE_TEMPLATES.map((template) => {
            const isSelected = template.id === selectedId;
            return (
              <div key={template.id} className="relative">
                <button
                  type="button"
                  onClick={() => setSelectedId(isSelected ? null : template.id)}
                  className={`w-full aspect-[254/350] rounded-2xl overflow-hidden bg-[#FAF0EC] cursor-pointer transition-all border-[3px] ${
                    isSelected ? 'border-[#14B8A6]' : 'border-transparent'
                  }`}
                  aria-pressed={isSelected}
                  aria-label={`${template.name} template`}
                >
                  <CanvasReadOnlyCard
                    canvasElements={instantiateTemplate(template)}
                    selectedConfetti={null}
                    showMetadata={false}
                    square
                    fill
                  />
                </button>
                {isSelected && (
                  <button
                    type="button"
                    onClick={() => setSelectedId(null)}
                    className="absolute top-3 right-3 z-30 w-10 h-10 rounded-full bg-[#14B8A6] text-white flex items-center justify-center shadow-md cursor-pointer active:scale-95 transition-transform"
                    aria-label="Deselect template"
                  >
                    <X size={20} weight="bold" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-6 bg-[#F8F2EF] shrink-0">
          <button
            type="button"
            disabled={!selected}
            onClick={() => selected && onUseTemplate(selected)}
            className={`w-full h-14 rounded-full text-base font-bold transition-all ${
              selected
                ? 'bg-[#FE6349] hover:bg-[#e05234] text-white active:scale-[0.99] cursor-pointer'
                : 'bg-[#F9D3CA] text-white cursor-not-allowed'
            }`}
          >
            Use Template
          </button>
        </div>
      </div>
    </div>
  );
};
