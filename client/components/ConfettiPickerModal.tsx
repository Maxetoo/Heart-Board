import React, { useState } from 'react';
import { X, Check, PartyPopper, Trash2, Sparkles, RefreshCw } from 'lucide-react';
import { ConfettiOverlay, ConfettiType } from './ConfettiOverlay';

interface ConfettiOption {
  id: 'clap' | 'ribbons' | 'simple' | 'celebration';
  name: string;
  emoji: string;
  description: string;
  badge: string;
}

export const CONFETTI_OPTIONS: ConfettiOption[] = [
  {
    id: 'clap',
    name: 'Clap Confetti',
    emoji: '👏',
    description: 'Clapping hands, applause sparkles & golden floating heart bursts',
    badge: 'Popular',
  },
  {
    id: 'ribbons',
    name: 'Ribbons',
    emoji: '🎀',
    description: 'Flowing colorful streamers & satin swirls dancing across the card',
    badge: 'Elegant',
  },
  {
    id: 'simple',
    name: 'Simple Confetti',
    emoji: '✨',
    description: 'Classic colorful dots, geometric confetti squares & sparkling stars',
    badge: 'Classic',
  },
  {
    id: 'celebration',
    name: 'Celebration Confetti',
    emoji: '🎉',
    description: 'Party poppers, floating balloons, gold glitter & festive foil bursts',
    badge: 'Festive',
  },
];

interface ConfettiPickerModalProps {
  selectedConfetti: ConfettiType;
  onSelectConfetti: (type: ConfettiType) => void;
  onClose: () => void;
}

export const ConfettiPickerModal: React.FC<ConfettiPickerModalProps> = ({
  selectedConfetti,
  onSelectConfetti,
  onClose,
}) => {
  const [previewType, setPreviewType] = useState<ConfettiType>(selectedConfetti || 'celebration');
  const [key, setKey] = useState(0); // For re-triggering preview burst

  const handleSelect = (id: ConfettiType) => {
    setPreviewType(id);
    setKey((prev) => prev + 1);
  };

  const handleConfirm = () => {
    onSelectConfetti(previewType);
    onClose();
  };

  const handleRemove = () => {
    onSelectConfetti(null);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[4000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-[1.8rem] sm:rounded-[2.5rem] max-w-md w-full max-h-[90dvh] sm:max-h-[85vh] shadow-2xl flex flex-col relative animate-in zoom-in-95 duration-200 font-sans overflow-hidden my-auto select-none">
        
        {/* Sticky Top Header */}
        <div className="px-5 sm:px-6 pt-5 pb-3 bg-white border-b border-[#ECEFF3] flex items-center justify-between shrink-0 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-orange-100/80 text-[#FE6349] flex items-center justify-center">
              <PartyPopper className="w-4 h-4" />
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-[#1A1B25]">
              Confetti Animation
            </h3>
          </div>

          <div className="flex items-center gap-1.5">
            {selectedConfetti && (
              <button
                type="button"
                onClick={handleRemove}
                className="w-9 h-9 rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 transition-all cursor-pointer"
                title="Remove Confetti"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:text-[#1A1B25] hover:bg-gray-100 transition-all cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4 min-h-0 scrollbar-thin">
          
          {/* Live Preview Box */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#FE6349]" />
                Live Preview
              </span>
              {previewType && (
                <button
                  type="button"
                  onClick={() => setKey((k) => k + 1)}
                  className="text-[11px] font-bold text-[#FE6349] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" /> Re-burst
                </button>
              )}
            </div>

            <div className="relative w-full h-36 bg-gradient-to-br from-[#FAF0EC] to-[#FFF8F5] rounded-2xl overflow-hidden border border-orange-100/80 shadow-inner flex flex-col items-center justify-center p-3 text-center">
              {/* Confetti Canvas Animation Live Preview */}
              <ConfettiOverlay key={key} type={previewType} />

              <div className="relative z-10 bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-xl shadow-xs border border-gray-100 max-w-[85%]">
                <p className="text-xs font-extrabold text-gray-800">
                  {previewType 
                    ? `Selected: ${CONFETTI_OPTIONS.find(c => c.id === previewType)?.name}` 
                    : 'No confetti animation selected'}
                </p>
                <p className="text-[10px] text-gray-500 font-semibold mt-0.5">
                  {previewType ? 'Will animate across your published post canvas' : 'Tap an option below to test'}
                </p>
              </div>
            </div>
          </div>

          {/* Confetti Options Selection Cards */}
          <div className="space-y-2">
            <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wider pl-0.5 block">
              Choose Effect Style
            </span>

            <div className="grid grid-cols-1 gap-2.5">
              {CONFETTI_OPTIONS.map((opt) => {
                const isSelected = previewType === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelect(opt.id)}
                    className="w-full p-3.5 rounded-2xl text-left transition-all flex items-center justify-between bg-gray-50/80 hover:bg-gray-100/80 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-xl shadow-2xs shrink-0">
                        {opt.emoji}
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[#1A1B25]">
                            {opt.name}
                          </span>
                          <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-white text-gray-600 border border-gray-100">
                            {opt.badge}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 font-medium leading-snug">
                          {opt.description}
                        </span>
                      </div>
                    </div>

                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ml-2 transition-all ${
                      isSelected ? 'bg-[#3BB88C] text-white shadow-xs' : 'border-2 border-gray-300 bg-white text-transparent'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}

              {/* Clear / None Option */}
              <button
                type="button"
                onClick={() => handleSelect(null)}
                className="w-full p-3 rounded-2xl text-left transition-all flex items-center justify-between bg-gray-50/50 hover:bg-gray-100/50 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-base text-gray-400 shadow-2xs shrink-0">
                    🚫
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-[#1A1B25]">
                      No Confetti Effect
                    </span>
                    <span className="text-xs text-gray-500 font-medium">
                      Display post without animated particles
                    </span>
                  </div>
                </div>

                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ml-2 transition-all ${
                  previewType === null ? 'bg-[#3BB88C] text-white shadow-xs' : 'border-2 border-gray-300 bg-white text-transparent'
                }`}>
                  {previewType === null && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </button>
            </div>
          </div>

        </div>

        {/* Sticky CTA Section */}
        <div className="shrink-0 p-4 sm:p-5 bg-[#F6F8FA] border-t border-[#ECEFF3] sticky bottom-0 z-10 rounded-b-[1.8rem] sm:rounded-b-[2.5rem]">
          <button
            type="button"
            onClick={handleConfirm}
            className="w-full py-3.5 sm:py-4 bg-[#FE6349] hover:bg-[#e05234] active:scale-[0.99] text-white font-bold text-base rounded-full shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <PartyPopper className="w-4 h-4" />
            <span>{previewType ? 'Apply Confetti Effect' : 'Confirm Selection'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
