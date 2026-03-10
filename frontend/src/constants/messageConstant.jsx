import {
  BsHeart, BsHandThumbsUp, BsEmojiSmile, BsStar,
  BsSun, BsFire, BsMusicNote, BsMusicNoteBeamed,
  BsHeadphones, BsTrophy, BsBalloon, BsGift,
  BsDiamond, BsAward, BsClock, BsBriefcase,
} from 'react-icons/bs'

export const FONTS = [
  { label: 'Playfair Display', family: "'Playfair Display', serif",  style: { fontStyle: 'italic' } },
  { label: 'Inter',            family: "'Inter', sans-serif",         style: {} },
  { label: 'Anton',            family: "'Anton', sans-serif",         style: { fontWeight: 900 } },
  { label: 'Anaheim',          family: "'Anaheim', sans-serif",       style: {} },
  { label: 'Pacifico',         family: "'Pacifico', cursive",         style: {} },
  { label: 'Impact',           family: 'Impact, sans-serif',          style: { fontWeight: 900 } },
  { label: 'Brush Script MT',  family: "'Brush Script MT', cursive",  style: {} },
  { label: 'Georgia',          family: 'Georgia, serif',              style: {} },
]

export const VECTOR_ICONS = [
  { id: 'heart',      label: 'Heart',      icon: BsHeart },
  { id: 'thumbsup',   label: 'Thumbs Up',  icon: BsHandThumbsUp },
  { id: 'smile',      label: 'Smile',      icon: BsEmojiSmile },
  { id: 'star',       label: 'Star',       icon: BsStar },
  { id: 'sun',        label: 'Sun',        icon: BsSun },
  { id: 'fire',       label: 'Fire',       icon: BsFire },
  { id: 'music',      label: 'Music',      icon: BsMusicNote },
  { id: 'music2',     label: 'Music 2',    icon: BsMusicNoteBeamed },
  { id: 'headphones', label: 'Headphones', icon: BsHeadphones },
  { id: 'trophy',     label: 'Trophy',     icon: BsTrophy },
  { id: 'balloon',    label: 'Balloon',    icon: BsBalloon },
  { id: 'gift',       label: 'Gift',       icon: BsGift },
  { id: 'diamond',    label: 'Diamond',    icon: BsDiamond },
  { id: 'award',      label: 'Award',      icon: BsAward },
  { id: 'clock',      label: 'Clock',      icon: BsClock },
  { id: 'briefcase',  label: 'Briefcase',  icon: BsBriefcase },
]

export const BG_OPTIONS = [
  { id: 'bg1',  label: 'Marble',    value: 'linear-gradient(135deg, #f5f5f0 0%, #e8e4df 50%, #f0ede8 100%)' },
  { id: 'bg2',  label: 'Lines',     value: 'repeating-linear-gradient(0deg, #f9f9f9 0px, #f9f9f9 18px, #e5e5e5 18px, #e5e5e5 20px)' },
  { id: 'bg3',  label: 'Sky',       value: 'linear-gradient(180deg, #dbeafe 0%, #eff6ff 100%)' },
  { id: 'bg4',  label: 'Dusk',      value: 'linear-gradient(135deg, #3d2c1e 0%, #6b4226 50%, #3d2c1e 100%)' },
  { id: 'bg5',  label: 'Sand',      value: 'linear-gradient(135deg, #e8d5b0 0%, #d4b896 50%, #e8d5b0 100%)' },
  { id: 'bg6',  label: 'Blush',     value: 'linear-gradient(135deg, #fce4ec 0%, #f8bbd0 100%)' },
  { id: 'bg7',  label: 'Mint',      value: 'linear-gradient(135deg, #e0f2f1 0%, #b2dfdb 100%)' },
  { id: 'bg8',  label: 'Lavender',  value: 'linear-gradient(135deg, #ede7f6 0%, #d1c4e9 100%)' },
  { id: 'bg9',  label: 'Peach',     value: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)' },
  { id: 'bg10', label: 'Forest',    value: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)' },
  { id: 'bg11', label: 'Ocean',     value: 'linear-gradient(135deg, #e1f5fe 0%, #b3e5fc 100%)' },
  { id: 'bg12', label: 'Sunset',    value: 'linear-gradient(135deg, #fff9c4 0%, #ffccbc 50%, #f8bbd0 100%)' },
  { id: 'bg13', label: 'Night',     value: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' },
  { id: 'bg14', label: 'Rose Gold', value: 'linear-gradient(135deg, #f4c2c2 0%, #e8a598 50%, #d4846a 100%)' },
  { id: 'bg15', label: 'Arctic',    value: 'linear-gradient(135deg, #f0f4ff 0%, #dce8ff 100%)' },
  { id: 'bg16', label: 'Cream',     value: 'linear-gradient(135deg, #fffef7 0%, #faf8ee 100%)' },
]

export const SWATCHES = [
  '#111111', '#EF5A42', '#3B82F6', '#10B981',
  '#F59E0B', '#8B5CF6', '#EC4899', '#FFFFFF',
]

export const EVENTS = [
  { id: 'others',      label: 'Others',      emoji: '🌟' },
  { id: 'birthday',    label: 'Birthday',    emoji: '🎂' },
  { id: 'sport',       label: 'Sport',       emoji: '🏅' },
  { id: 'groove',      label: 'Groove',      emoji: '🎉' },
  { id: 'wedding',     label: 'Wedding',     emoji: '💍' },
  { id: 'graduation',  label: 'Graduation',  emoji: '🎓' },
  { id: 'retirement',  label: 'Retirement',  emoji: '🏖️' },
  { id: 'getwell',     label: 'Get well',    emoji: '💐' },
  { id: 'funeral',     label: 'Funeral',     emoji: '🕊️' },
  { id: 'promotion',   label: 'Promotion',   emoji: '🎊' },
  { id: 'newbaby',     label: 'New Baby',    emoji: '👶' },
  { id: 'anniversary', label: 'Anniversary', emoji: '❤️' },
]

export const MOCK_USERS = [
  { id: 1,  username: 'alex_johnson',   name: 'Alex Johnson',   avatar: '👨‍💼' },
  { id: 2,  username: 'sarah_williams', name: 'Sarah Williams', avatar: '👩‍🎨' },
  { id: 3,  username: 'mike_chen',      name: 'Mike Chen',      avatar: '👨‍💻' },
  { id: 4,  username: 'priya_patel',    name: 'Priya Patel',    avatar: '👩‍🔬' },
  { id: 5,  username: 'james_okafor',   name: 'James Okafor',   avatar: '👨‍🎤' },
  { id: 6,  username: 'emma_walsh',     name: 'Emma Walsh',     avatar: '👩‍🏫' },
  { id: 7,  username: 'david_kim',      name: 'David Kim',      avatar: '👨‍🍳' },
  { id: 8,  username: 'fatima_ali',     name: 'Fatima Ali',     avatar: '👩‍⚕️' },
  { id: 9,  username: 'carlos_reyes',   name: 'Carlos Reyes',   avatar: '👨‍🎸' },
  { id: 10, username: 'nina_brown',     name: 'Nina Brown',     avatar: '👩‍💼' },
]

export const FRAME_STYLES = [
  { id: 'solid',  label: 'Solid' },
  { id: 'dashed', label: 'Dashed' },
  { id: 'dotted', label: 'Dotted' },
  { id: 'double', label: 'Double' },
]

export const FRAME_SWATCHES = [
  '#111111', '#EF5A42', '#3B82F6', '#10B981',
  '#F59E0B', '#8B5CF6', '#EC4899', '#FFFFFF',
]

// Maps UI event IDs → backend enum values
export const EVENT_MAP = {
  birthday:    'birthday',
  wedding:     'wedding',
  anniversary: 'anniversary',
  graduation:  'graduation',
  sport:       'sport',
  retirement:  'retirement',
  promotion:   'promotion',
  groove:      'other',
  getwell:     'other',
  funeral:     'other',
  newbaby:     'other',
  others:      'other',
  other:       'other',
}