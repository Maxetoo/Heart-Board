import React, { useState } from 'react';
import { ChooseColor } from './ColorPicker';
import {
  Heart,
  ThumbsUp,
  Smiley,
  HandsClapping,
  Sun,
  Drop,
  Wine,
  TreePalm,
  BeachBall,
  SoccerBall,
  MusicNote,
  MusicNotes,
  Guitar,
  CurrencyDollar,
  Coins,
  CloudRain,
  Sparkle,
  Star,
  Trophy,
  Fire,
  Coffee,
  Gift,
  Crown,
  Lightning,
  Balloon,
  Rocket,
  Camera,
  Medal,
  Cake,
  Rainbow,
  MagnifyingGlass,
  Check,
  Trash,
  X
} from '@phosphor-icons/react';

export interface VectorIconItem {
  id: string;
  name: string;
  tags: string[];
  Icon: React.ComponentType<{ size?: number; weight?: 'fill' | 'regular' | 'bold'; className?: string; style?: React.CSSProperties }>;
  weight?: 'fill' | 'regular' | 'bold';
}

export const VECTOR_COLORS = [
  { name: 'Dark', hex: '#272835' },
  { name: 'Coral', hex: '#FF5A36' },
  { name: 'Red', hex: '#E11D48' },
  { name: 'Orange', hex: '#F97316' },
  { name: 'Amber', hex: '#F59E0B' },
  { name: 'Green', hex: '#10B981' },
  { name: 'Blue', hex: '#2563EB' },
  { name: 'Purple', hex: '#7C3AED' },
  { name: 'Pink', hex: '#EC4899' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Indigo', hex: '#4F46E5' },
  { name: 'Fuchsia', hex: '#D946EF' },
  { name: 'Emerald', hex: '#047857' },
  { name: 'Sky', hex: '#0284C7' },
  { name: 'Violet', hex: '#A855F7' }
];

export const PHOSPHOR_VECTORS: VectorIconItem[] = [
  // First 16 match the reference screenshot grid exactly
  { id: 'heart', name: 'Heart', tags: ['heart', 'love', 'like', 'valentine'], Icon: Heart, weight: 'fill' },
  { id: 'thumbs_up', name: 'Thumbs Up', tags: ['thumbs', 'up', 'like', 'approve', 'agree'], Icon: ThumbsUp, weight: 'fill' },
  { id: 'smiley', name: 'Smiley', tags: ['smile', 'face', 'happy', 'emoji', 'joy'], Icon: Smiley, weight: 'fill' },
  { id: 'hand_clapping', name: 'Clapping Hands', tags: ['clap', 'applause', 'cheer', 'bravo', 'hands'], Icon: HandsClapping, weight: 'fill' },

  { id: 'sun', name: 'Sun', tags: ['sun', 'weather', 'bright', 'summer', 'shine'], Icon: Sun, weight: 'bold' },
  { id: 'drop', name: 'Drop', tags: ['drop', 'water', 'tear', 'rain', 'liquid'], Icon: Drop, weight: 'fill' },
  { id: 'wine', name: 'Glasses / Toast', tags: ['wine', 'glasses', 'toast', 'cheers', 'drink', 'party'], Icon: Wine, weight: 'fill' },
  { id: 'palm_tree', name: 'Palm Tree', tags: ['palm', 'tree', 'beach', 'island', 'vacation', 'summer'], Icon: TreePalm, weight: 'fill' },

  { id: 'beach_ball', name: 'Beach Ball', tags: ['beach', 'ball', 'summer', 'play', 'game', 'globe'], Icon: BeachBall, weight: 'bold' },
  { id: 'soccer_ball', name: 'Soccer Ball', tags: ['soccer', 'football', 'ball', 'sport', 'game'], Icon: SoccerBall, weight: 'bold' },
  { id: 'musical_note', name: 'Musical Note', tags: ['music', 'note', 'song', 'audio', 'sound'], Icon: MusicNote, weight: 'fill' },
  { id: 'musical_notes', name: 'Musical Notes', tags: ['music', 'notes', 'song', 'melody', 'audio'], Icon: MusicNotes, weight: 'fill' },

  { id: 'guitar', name: 'Guitar', tags: ['guitar', 'music', 'ukulele', 'instrument', 'play'], Icon: Guitar, weight: 'fill' },
  { id: 'money', name: 'Money Bag', tags: ['money', 'bag', 'cash', 'dollar', 'savings', 'wealth'], Icon: CurrencyDollar, weight: 'fill' },
  { id: 'coins', name: 'Coins', tags: ['coins', 'money', 'gold', 'currency', 'cash'], Icon: Coins, weight: 'fill' },
  { id: 'cloud_rain', name: 'Cloud Rain', tags: ['cloud', 'rain', 'weather', 'storm', 'drop'], Icon: CloudRain, weight: 'fill' },

  // Additional Phosphor vectors for search
  { id: 'sparkle', name: 'Sparkle', tags: ['sparkle', 'magic', 'star', 'glow'], Icon: Sparkle, weight: 'fill' },
  { id: 'star', name: 'Star', tags: ['star', 'favorite', 'rating', 'top'], Icon: Star, weight: 'fill' },
  { id: 'trophy', name: 'Trophy', tags: ['trophy', 'winner', 'cup', 'award'], Icon: Trophy, weight: 'fill' },
  { id: 'fire', name: 'Fire', tags: ['fire', 'flame', 'hot', 'trend'], Icon: Fire, weight: 'fill' },
  { id: 'coffee', name: 'Coffee', tags: ['coffee', 'cup', 'tea', 'drink'], Icon: Coffee, weight: 'fill' },
  { id: 'gift', name: 'Gift', tags: ['gift', 'present', 'box', 'surprise'], Icon: Gift, weight: 'fill' },
  { id: 'crown', name: 'Crown', tags: ['crown', 'king', 'queen', 'vip'], Icon: Crown, weight: 'fill' },
  { id: 'lightning', name: 'Lightning', tags: ['lightning', 'bolt', 'electric', 'fast'], Icon: Lightning, weight: 'fill' },
  { id: 'balloon', name: 'Balloon', tags: ['balloon', 'party', 'birthday', 'celebrate'], Icon: Balloon, weight: 'fill' },
  { id: 'rocket', name: 'Rocket', tags: ['rocket', 'launch', 'space', 'boost'], Icon: Rocket, weight: 'fill' },
  { id: 'camera', name: 'Camera', tags: ['camera', 'photo', 'picture', 'snapshot'], Icon: Camera, weight: 'fill' },
  { id: 'medal', name: 'Medal', tags: ['medal', 'award', 'badge', 'victory'], Icon: Medal, weight: 'fill' },
  { id: 'cake', name: 'Cake', tags: ['cake', 'birthday', 'dessert', 'party'], Icon: Cake, weight: 'fill' },
  { id: 'rainbow', name: 'Rainbow', tags: ['rainbow', 'color', 'sky', 'dream'], Icon: Rainbow, weight: 'bold' }
];

export interface VectorPickerProps {
  selectedIconId?: string | null;
  vectorColor?: string;
  onSelectVector: (icon: VectorIconItem) => void;
  onColorChange?: (color: string) => void;
  onDelete?: () => void;
  onClose: () => void;
  onContinue?: () => void;
}

export const VectorPicker: React.FC<VectorPickerProps> = ({
  selectedIconId,
  vectorColor = '#272835',
  onSelectVector,
  onColorChange,
  onDelete,
  onClose,
  onContinue
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSelectedId, setActiveSelectedId] = useState<string | null>(selectedIconId || 'heart');
  const [currentColor, setCurrentColor] = useState<string>(vectorColor);

  const handleColorSelect = (hex: string) => {
    setCurrentColor(hex);
    if (onColorChange) {
      onColorChange(hex);
    }
  };

  const filteredVectors = PHOSPHOR_VECTORS.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      item.name.toLowerCase().includes(q) ||
      item.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  const handleSelect = (item: VectorIconItem) => {
    setActiveSelectedId(item.id);
    onSelectVector(item);
  };

  const handleContinueClick = () => {
    if (onContinue) {
      onContinue();
    } else {
      onClose();
    }
  };

  return (
    <div className="bg-white rounded-[1.8rem] sm:rounded-[2.2rem] max-w-[420px] w-full max-h-[90dvh] sm:max-h-[85vh] my-auto shadow-2xl flex flex-col relative font-sans animate-in zoom-in-95 duration-200 select-none overflow-hidden">
      {/* Sticky Top Header */}
      <div className="px-5 sm:px-6 pt-5 pb-3 bg-white border-b border-[#ECEFF3] flex items-center justify-between shrink-0 sticky top-0 z-10">
        <h2 className="text-[20px] sm:text-[22px] font-bold text-[#1A1B25] tracking-tight">Vector</h2>
        <div className="flex items-center gap-1">
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="w-9 h-9 rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
              aria-label="Delete vector"
              title="Delete vector"
            >
              <Trash size={20} weight="bold" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#1A1B25] hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Close vector dialog"
          >
            <X size={20} weight="bold" />
          </button>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 flex flex-col gap-3.5 min-h-0 scrollbar-thin">
        {/* Search Input */}
        <div className="bg-[#F6F8FA] rounded-[1.2rem] px-4 h-10 flex items-center gap-2.5 shrink-0 focus-within:ring-2 focus-within:ring-gray-200 transition-colors">
          <MagnifyingGlass size={18} className="text-[#A4ABB8] shrink-0" weight="bold" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search"
            className="w-full bg-transparent text-sm font-medium text-[#1A1B25] placeholder:text-[#A4ABB8] border-none outline-none p-0"
          />
        </div>

        {/* Color Picker Selector */}
        <ChooseColor
          label="Color"
          selectedColor={currentColor}
          onChangeColor={handleColorSelect}
          isAccordion={true}
          className="shrink-0"
        />

        {/* Icon Grid */}
        <div className="grid grid-cols-4 gap-2.5 sm:gap-3.5 pb-2">
          {filteredVectors.map((item) => {
            const isSelected = activeSelectedId === item.id;
            const IconComp = item.Icon;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item)}
                className="aspect-square rounded-[1.1rem] bg-[#F6F8FA] hover:bg-[#ECEFF3] transition-all flex items-center justify-center relative cursor-pointer group"
                title={item.name}
              >
                {/* Selected Checkmark Badge */}
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 w-4.5 h-4.5 rounded-full bg-[#3BB88C] flex items-center justify-center text-white shadow-xs z-10 animate-in zoom-in-75 duration-150">
                    <Check size={11} weight="bold" />
                  </div>
                )}

                {/* Vector Icon */}
                <IconComp
                  size={30}
                  weight={item.weight || 'fill'}
                  style={{ color: currentColor }}
                  className="group-hover:scale-110 transition-transform duration-150"
                />
              </button>
            );
          })}

          {filteredVectors.length === 0 && (
            <div className="col-span-4 py-10 text-center text-gray-400 text-sm font-medium">
              No vectors match "{searchQuery}"
            </div>
          )}
        </div>
      </div>

      {/* Sticky CTA Section */}
      <div className="shrink-0 p-4 sm:p-5 bg-[#F6F8FA] border-t border-[#ECEFF3] sticky bottom-0 z-10 rounded-b-[1.8rem] sm:rounded-b-[2.2rem]">
        <button
          type="button"
          onClick={handleContinueClick}
          className="w-full py-3.5 sm:py-4 bg-[#FF5A36] hover:bg-[#ff4821] active:scale-[0.99] text-white font-bold text-base rounded-full shadow-xs transition-all cursor-pointer text-center"
        >
          Continue
        </button>
      </div>
    </div>
  );
};
