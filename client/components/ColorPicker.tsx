import React, { useState } from 'react';
import { ChevronDown, Check, Plus } from 'lucide-react';

export interface ColorOption {
  hex: string;
  name?: string;
}

export const DEFAULT_COLOR_OPTIONS: ColorOption[] = [
  { hex: '#1A1B25' },
  { hex: '#FF6B4A' },
  { hex: '#E11D48' },
  { hex: '#F59E0B' },
  { hex: '#10B981' },
  { hex: '#14B8A6' },
  { hex: '#06B6D4' },
  { hex: '#3B82F6' },
  { hex: '#6366F1' },
  { hex: '#8B5CF6' },
  { hex: '#EC4899' },
  { hex: '#84CC16' },
  { hex: '#F97316' },
  { hex: '#64748B' },
  { hex: '#000000' },
  { hex: '#FFFFFF' },
  { hex: '#4F46E5' },
  { hex: '#D946EF' },
  { hex: '#047857' },
  { hex: '#0284C7' },
  { hex: '#A855F7' },
];

export interface ChooseColorProps {
  label?: string;
  selectedColor: string;
  onChangeColor: (colorHex: string) => void;
  colorOptions?: ColorOption[];
  isOpen?: boolean;
  defaultIsOpen?: boolean;
  onToggleOpen?: () => void;
  isAccordion?: boolean;
  showCustomPicker?: boolean;
  className?: string;
}

export const ChooseColor: React.FC<ChooseColorProps> = ({
  label = 'Choose Colour',
  selectedColor,
  onChangeColor,
  colorOptions = DEFAULT_COLOR_OPTIONS,
  isOpen,
  defaultIsOpen = true,
  onToggleOpen,
  isAccordion = true,
  showCustomPicker = true,
  className = '',
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(defaultIsOpen);

  const isControlled = isOpen !== undefined;
  const expanded = isAccordion ? (isControlled ? isOpen : internalIsOpen) : true;

  const handleToggle = () => {
    if (!isAccordion) return;
    if (onToggleOpen) {
      onToggleOpen();
    }
    if (!isControlled) {
      setInternalIsOpen((prev) => !prev);
    }
  };

  const isDarkColor = (hex: string) => {
    if (!hex) return true;
    if (hex === '#FFFFFF' || hex.toLowerCase() === '#ffffff' || hex.toLowerCase() === '#fff') return false;
    if (hex.startsWith('#') && hex.length === 7) {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return (r * 0.299 + g * 0.587 + b * 0.114) < 180;
    }
    return true;
  };

  return (
    <div className={`bg-[#F6F8FA] rounded-2xl p-4 flex flex-col transition-all ${className}`}>
      {/* Header */}
      <div
        onClick={handleToggle}
        className={`flex items-center justify-between ${
          isAccordion ? 'cursor-pointer select-none group' : ''
        }`}
      >
        <span className="text-sm font-bold text-[#1A1B25] group-hover:text-black transition-colors">
          {label}
        </span>
        <div className="flex items-center gap-2">
          {/* Active color preview indicator */}
          <div
            className="w-5 h-5 rounded-full border border-black/10 shadow-2xs transition-transform group-hover:scale-105"
            style={{ backgroundColor: selectedColor || '#1A1B25' }}
            title={`Selected: ${selectedColor}`}
          />
          {isAccordion && (
            <ChevronDown
              className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
                expanded ? 'rotate-180' : ''
              }`}
            />
          )}
        </div>
      </div>

      {/* Expanded Swatches Grid */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          expanded
            ? 'grid-rows-[1fr] opacity-100 mt-2.5 pt-2.5 border-t border-gray-200/60'
            : 'grid-rows-[0fr] opacity-0 mt-0 pt-0 border-t-0 pointer-events-none'
        }`}
      >
        <div className="overflow-hidden">
          <div className="grid grid-cols-5 sm:grid-cols-6 gap-2.5">
            {colorOptions.map((col) => {
              const isSelected = selectedColor?.toLowerCase() === col.hex.toLowerCase();

              return (
                <button
                  key={col.hex}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChangeColor(col.hex);
                  }}
                  className="aspect-square h-9 rounded-full flex items-center justify-center transition-all cursor-pointer relative shadow-2xs border border-black/10 hover:scale-105 active:scale-95"
                  style={{ backgroundColor: col.hex }}
                >
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-[#3BB88C] flex items-center justify-center text-white shadow-xs animate-in zoom-in-75 duration-150">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}

            {/* Custom Color Wheel Button */}
            {showCustomPicker && (
              <label
                onClick={(e) => e.stopPropagation()}
                className="aspect-square h-9 rounded-full cursor-pointer flex items-center justify-center overflow-hidden bg-gradient-to-tr from-rose-500 via-amber-400 to-indigo-500 hover:scale-110 active:scale-95 transition-all relative border border-black/10 shadow-2xs"
                title="Custom color"
              >
                <input
                  type="color"
                  value={selectedColor || '#1A1B25'}
                  onChange={(e) => onChangeColor(e.target.value)}
                  className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                />
                <Plus className="w-4 h-4 text-white drop-shadow-xs stroke-[3]" />
              </label>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
