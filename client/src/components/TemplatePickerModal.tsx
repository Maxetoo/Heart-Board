import React, { useState } from 'react';
import { X } from '@phosphor-icons/react';
import { CanvasReadOnlyCard } from './CreateAppreciationModal';
import type { CanvasElement } from './CreateAppreciationModal';
import type { ConfettiType } from './ConfettiOverlay';

/**
 * A ready-made message design: canvas elements laid out on the 254x350 card.
 *
 * Templates are scrapbook collages. Their photo slots start empty — tap one
 * and pick a picture — and every label is ordinary text, so "Birthday!" or the
 * date can be retyped like any other message. Stickers and paper scraps move
 * like anything else; only the backdrop is fixed.
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

type Part = Omit<CanvasElement, 'id'>;

/** The card-sized backdrop every collage sits on. */
const backdrop = (bgHex: string): Part => ({ type: 'shape', bgHex, width: 254, height: 350, x: 0, y: 0, locked: true });

/** An empty photo slot. */
const photo = (
  width: number,
  height: number,
  x: number,
  y: number,
  rotation: number,
  frame: 'torn' | 'polaroid',
): Part => ({ type: 'image', imageUrl: '', placeholder: true, width, height, x, y, rotation, scale: 1, frame });

/** Text on a paper label. */
const label = (value: string, x: number, y: number, scale: number, labelBg = '#EFE6D2', color = '#1A1B25', rotation = 0): Part => ({
  type: 'text', text: value, fontFamily: MONO, color, labelBg, align: 'center', x, y, scale, rotation,
});

/** Free text. */
const words = (value: string, fontFamily: string, color: string, x: number, y: number, scale: number, rotation = 0): Part => ({
  type: 'text', text: value, fontFamily, isCursive: fontFamily === CURSIVE, color, align: 'center', x, y, scale, rotation,
});

const emoji = (char: string, x: number, y: number, scale: number, rotation = 0): Part => ({
  type: 'vector', vectorId: 'emoji', emoji: char, x, y, scale, rotation,
});

const sticker = (vectorId: string, vectorColor: string, x: number, y: number, scale: number, rotation = 0): Part => ({
  type: 'vector', vectorId, vectorColor, x, y, scale, rotation,
});

const tape = (bgHex: string, x: number, y: number, rotation: number): Part => ({
  type: 'shape', bgHex, width: 46, height: 14, x, y, rotation, scale: 1,
});

export const MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    id: 'birthday-scrapbook',
    name: 'Birthday Scrapbook',
    confetti: 'celebration',
    elements: [
      backdrop('#CFC4B2'),
      photo(150, 118, -38, -108, -4, 'torn'),
      photo(118, 132, 58, -6, 3, 'torn'),
      photo(104, 150, -68, 48, -2, 'torn'),
      photo(150, 104, 52, 118, 2, 'torn'),
      label('December 30', 62, -128, 0.55),
      sticker('heart', '#E46E5C', 98, -72, 0.8, 10),
      emoji('🎉', -102, -150, 0.7),
      emoji('🎁', -8, 84, 0.7, -8),
      label('Happy', -82, 92, 0.6),
      label('Birthday!', -62, 126, 0.6),
      words('Olivia', CURSIVE, '#B5452F', -62, 154, 1.25, -6),
    ],
  },
  {
    id: 'love-polaroids',
    name: 'Love Polaroids',
    elements: [
      backdrop('#F6D9D5'),
      photo(110, 110, -50, -90, -6, 'polaroid'),
      photo(110, 110, 52, -30, 5, 'polaroid'),
      photo(120, 96, -30, 70, -2, 'polaroid'),
      tape('#F3E3B8', -50, -160, -8),
      tape('#F3E3B8', 56, -100, 6),
      label('you + me', 74, 80, 0.55, '#FFF6EE'),
      words('Forever & always', CURSIVE, '#B83B5E', 22, 146, 1.05, -4),
      sticker('heart', '#E8506E', 96, -142, 0.7, 12),
      sticker('heart', '#F49AAE', -102, 18, 0.5, -10),
      emoji('💌', -96, 146, 0.7, -6),
    ],
  },
  {
    id: 'graduation',
    name: 'Graduation',
    confetti: 'simple',
    elements: [
      backdrop('#1F2A44'),
      photo(170, 150, -10, -62, -2, 'torn'),
      photo(90, 90, 62, 82, 6, 'polaroid'),
      words('Congrats,\nGrad!', SERIF, '#F5D27A', -55, 58, 0.85),
      label('Class of 2026', -55, 114, 0.55, '#F5D27A', '#1F2A44'),
      emoji('🎓', 90, -150, 0.8, 8),
      sticker('star', '#F5D27A', -100, -150, 0.5),
      sticker('star', '#F5D27A', -98, 152, 0.4),
      sticker('sparkle', '#F5D27A', 100, 146, 0.5),
    ],
  },
  {
    id: 'best-friends',
    name: 'Best Friends',
    elements: [
      backdrop('#D5EADF'),
      photo(82, 82, -58, -98, -4, 'polaroid'),
      photo(82, 82, 58, -90, 4, 'polaroid'),
      photo(82, 82, -55, 40, 3, 'polaroid'),
      photo(82, 82, 60, 48, -5, 'polaroid'),
      label('best friends', 0, -24, 0.6, '#FFFFFF'),
      words('since forever', CURSIVE, '#2F7D62', 0, 138, 1.3),
      emoji('🌸', 100, -150, 0.6),
      sticker('sparkle', '#F2B33D', -100, 150, 0.5),
    ],
  },
  {
    id: 'thank-you-note',
    name: 'Thank You Note',
    elements: [
      backdrop('#FBF1E1'),
      photo(180, 170, 0, -55, -2, 'torn'),
      tape('#F2C6B4', -80, -140, -30),
      tape('#F2C6B4', 82, -140, 30),
      words('Thank you', CURSIVE, '#E8603C', 0, 76, 1.8, -3),
      label('for everything', 0, 124, 0.55, '#FFFFFF'),
      sticker('sparkle', '#F2B33D', -96, 150, 0.5),
      sticker('sparkle', '#F2B33D', 100, 62, 0.45),
    ],
  },
  {
    id: 'anniversary',
    name: 'Anniversary',
    elements: [
      backdrop('#E9E1F2'),
      photo(100, 120, -50, -70, -5, 'polaroid'),
      photo(100, 120, 52, -50, 5, 'polaroid'),
      words('Happy\nAnniversary', SERIF, '#4B3A6B', 0, 88, 0.8),
      label('June 14', 0, 148, 0.5, '#FFFFFF'),
      emoji('💍', 96, -150, 0.7, 10),
      sticker('heart', '#B07CC6', -100, -150, 0.55),
      sticker('heart', '#D8A7E0', -100, 140, 0.45),
    ],
  },
];

/**
 * A template's elements with fresh ids, ready to drop onto the canvas.
 *
 * The part before "~" is stable per slot, so a torn photo edge is cut the same
 * way in the picker and on the canvas.
 */
export const instantiateTemplate = (template: MessageTemplate, stamp: string | number = Date.now()): CanvasElement[] =>
  template.elements.map((el, i) => ({
    ...el,
    id: `${template.id}-${i}~${stamp}`,
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
                    canvasElements={instantiateTemplate(template, 'preview')}
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
