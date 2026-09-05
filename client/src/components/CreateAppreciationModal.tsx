import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  PenLine, 
  Mic, 
  Video, 
  Plus, 
  Minus,
  Check, 
  Lock, 
  Globe, 
  Sparkles, 
  Smile, 
  Heart,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Info,
  Sliders,
  Play,
  Square,
  Image as ImageIcon,
  Type,
  Palette,
  Upload,
  Trash2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Loader2,
  PartyPopper,
  Search,
  UserX,
  Hash,
  User,
  Send
} from 'lucide-react';
import { refineText } from '../services/geminiService';
import { createBoard } from '../services/board.api';
import { postMessage } from '../services/message.api';
import { uploadFile, validateFile } from '../services/upload.api';
import { toApiError } from '../lib/api';
import {
  fromClientMessageType,
  fromPostVisibility,
  usernameOf,
  wrapCanvasData,
} from '../lib/adapters';
import type { BoardEvent } from '../types/api';

/**
 * Maps the UI's free-text event label onto the server's `event` enum
 * (models/boardModel.js). Anything unrecognised becomes 'other' rather than
 * failing schema validation.
 */
const BOARD_EVENTS: BoardEvent[] = [
  'birthday', 'wedding', 'anniversary', 'graduation',
  'sport', 'retirement', 'promotion', 'other',
];

function toBoardEvent(label?: string): BoardEvent | null {
  if (!label) return null;
  const clean = label.trim().toLowerCase();
  const direct = BOARD_EVENTS.find((e) => e === clean);
  if (direct) return direct;
  const partial = BOARD_EVENTS.find((e) => clean.includes(e));
  return partial ?? 'other';
}
import { VectorPicker, PHOSPHOR_VECTORS } from './VectorPicker';
import { ChooseColor } from './ColorPicker';
import { ConfettiOverlay, ConfettiType } from './ConfettiOverlay';
import { ConfettiPickerModal } from './ConfettiPickerModal';

export interface CanvasElement {
  id: string;
  type: 'text' | 'image' | 'vector' | 'bg';
  text?: string;
  isCursive?: boolean;
  fontFamily?: string;
  color?: string;
  align?: 'left' | 'center' | 'right' | 'justify';
  imageUrl?: string;
  strokeEnabled?: boolean;
  strokeColor?: string;
  strokeWidth?: number;
  cornerRadius?: number;
  vectorId?: string;
  vectorName?: string;
  emoji?: string;
  label?: string;
  bubbleColor?: string;
  bgHex?: string;
  frameName?: string;
  x?: number;
  y?: number;
  scale?: number;
  rotation?: number;
}

interface RenderCanvasElementProps {
  el: CanvasElement;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
  onUpdate: (id: string, updates: Partial<CanvasElement>) => void;
}

const RenderCanvasElement: React.FC<RenderCanvasElementProps> = ({
  el,
  isSelected,
  onSelect,
  onEdit,
  onUpdate,
}) => {
  const isDraggingRef = useRef(false);
  const isScalingRef = useRef(false);
  const isRotatingRef = useRef(false);

  const lastTapRef = useRef<{ time: number; x: number; y: number }>({ time: 0, x: 0, y: 0 });

  const startStateRef = useRef({
    clientX: 0,
    clientY: 0,
    initX: 0,
    initY: 0,
    initScale: 1,
    initRot: 0,
  });

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    onSelect(el.id);

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch (_) {}

    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current.time;
    const dist = Math.hypot(e.clientX - lastTapRef.current.x, e.clientY - lastTapRef.current.y);

    if (lastTapRef.current.time > 0 && timeSinceLastTap < 300 && dist < 25) {
      lastTapRef.current = { time: 0, x: 0, y: 0 };
      isDraggingRef.current = false;
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (_) {}
      onEdit(el.id);
      return;
    }

    lastTapRef.current = { time: now, x: e.clientX, y: e.clientY };

    isDraggingRef.current = true;
    startStateRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      initX: el.x || 0,
      initY: el.y || 0,
      initScale: el.scale || 1,
      initRot: el.rotation || 0,
    };
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    isDraggingRef.current = false;
    onEdit(el.id);
  };

  const handleScalePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch (_) {}

    isScalingRef.current = true;
    startStateRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      initX: el.x || 0,
      initY: el.y || 0,
      initScale: el.scale || 1,
      initRot: el.rotation || 0,
    };
  };

  const handleRotatePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch (_) {}

    isRotatingRef.current = true;
    startStateRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      initX: el.x || 0,
      initY: el.y || 0,
      initScale: el.scale || 1,
      initRot: el.rotation || 0,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (isDraggingRef.current) {
      const deltaX = e.clientX - startStateRef.current.clientX;
      const deltaY = e.clientY - startStateRef.current.clientY;
      onUpdate(el.id, {
        x: startStateRef.current.initX + deltaX,
        y: startStateRef.current.initY + deltaY,
      });
    } else if (isScalingRef.current) {
      const deltaX = e.clientX - startStateRef.current.clientX;
      const deltaY = e.clientY - startStateRef.current.clientY;
      const delta = (deltaX + deltaY) / 100;
      const newScale = Math.max(0.4, Math.min(3.5, startStateRef.current.initScale + delta));
      onUpdate(el.id, { scale: Number(newScale.toFixed(2)) });
    } else if (isRotatingRef.current) {
      const deltaX = e.clientX - startStateRef.current.clientX;
      const newRot = Math.round((startStateRef.current.initRot + deltaX) % 360);
      onUpdate(el.id, { rotation: newRot });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.stopPropagation();
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (_) {}
    isDraggingRef.current = false;
    isScalingRef.current = false;
    isRotatingRef.current = false;
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onDoubleClick={handleDoubleClick}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(el.id);
      }}
      style={{
        transform: `translate3d(${el.x || 0}px, ${el.y || 0}px, 0) scale(${el.scale || 1}) rotate(${el.rotation || 0}deg)`,
        touchAction: 'none',
        userSelect: 'none',
      }}
      className={`absolute pointer-events-auto flex items-center justify-center cursor-grab active:cursor-grabbing transition-transform duration-75 select-none ${
        isSelected ? 'z-20' : 'hover:opacity-95 z-10'
      }`}
    >
      {/* 1. Image Element */}
      {el.type === 'image' && el.imageUrl && (
        <img
          src={el.imageUrl}
          alt="Uploaded attachment"
          draggable={false}
          style={{
            borderRadius: `${el.cornerRadius || 0}px`,
            border: el.strokeEnabled ? `${el.strokeWidth ?? 3}px solid ${el.strokeColor || '#FF6B4A'}` : 'none',
          }}
          className="max-w-[220px] max-h-[220px] w-auto h-auto object-contain shadow-xs pointer-events-none select-none transition-all"
        />
      )}

      {/* 2. Vector / Sticker Element */}
      {el.type === 'vector' && (
        <div className="p-1 pointer-events-none select-none flex items-center justify-center">
          {(() => {
            const match = PHOSPHOR_VECTORS.find(v => v.id === (el.vectorId || 'heart'));
            const color = el.vectorColor || '#272835';
            if (match) {
              const IconComp = match.Icon;
              return <IconComp size={48} weight={match.weight || 'fill'} style={{ color }} className="drop-shadow-xs" />;
            }
            if (el.emoji) {
              return <span className="text-4xl leading-none">{el.emoji}</span>;
            }
            return <Heart className="w-10 h-10 drop-shadow-xs" style={{ color }} />;
          })()}
        </div>
      )}

      {/* 3. Text Element */}
      {el.type === 'text' && el.text && (
        <div className={`w-full p-2 rounded-xl transition-all pointer-events-none select-none ${
          isSelected 
            ? 'border-2 border-dashed border-[#FE6349] ring-2 ring-[#FE6349]/20 bg-white/10' 
            : 'border border-transparent'
        }`}>
          <p 
            style={{ 
              color: el.color || '#1A1B25',
              fontFamily: el.fontFamily || (el.isCursive ? 'Playfair Display, cursive' : 'Nunito, sans-serif'),
              textAlign: el.align || 'left',
              whiteSpace: 'pre-wrap',
            }}
            className={`font-bold leading-snug break-words whitespace-pre-wrap ${
              el.isCursive || el.fontFamily?.includes('Playfair') || el.fontFamily?.includes('Caveat') 
                ? 'text-xl sm:text-2xl' 
                : 'text-sm sm:text-base'
            }`}
          >
            {el.text}
          </p>
        </div>
      )}

      {/* 4. Background Element */}
      {el.type === 'bg' && (
        <div 
          style={{ backgroundColor: el.bgHex || '#FAF5E8' }}
          className="w-24 h-16 rounded-xl border border-gray-200/80 shadow-2xs flex flex-col items-center justify-center p-2 text-center pointer-events-none select-none"
        >
          <span className="text-xs font-bold text-gray-700">{el.frameName || 'Background'}</span>
        </div>
      )}

      {/* Handles when element is selected */}
      {isSelected && (
        <>
          {/* Rotate Handle */}
          <div
            onPointerDown={handleRotatePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onClick={(e) => e.stopPropagation()}
            className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-[#FF6B4A] text-white flex items-center justify-center text-xs font-bold shadow-md cursor-grab active:cursor-grabbing hover:scale-110 transition-transform z-30"
            title="Drag to rotate"
          >
            ↻
          </div>

          {/* Scale / Resize Handle */}
          <div
            onPointerDown={handleScalePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onClick={(e) => e.stopPropagation()}
            className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-[#FF6B4A] text-white flex items-center justify-center text-xs font-bold shadow-md cursor-nwse-resize hover:scale-110 transition-transform z-30"
            title="Drag to resize"
          >
            ↘
          </div>
        </>
      )}
    </div>
  );
};

export interface RenderCanvasElementReadOnlyProps {
  el: CanvasElement;
}

export const RenderCanvasElementReadOnly: React.FC<RenderCanvasElementReadOnlyProps> = ({ el }) => {
  return (
    <div
      style={{
        transform: `translate3d(${el.x || 0}px, ${el.y || 0}px, 0) scale(${el.scale || 1}) rotate(${el.rotation || 0}deg)`,
        userSelect: 'none',
      }}
      className="absolute pointer-events-none flex items-center justify-center select-none transition-transform duration-75 z-10"
    >
      {/* 1. Image Element */}
      {el.type === 'image' && el.imageUrl && (
        <img
          src={el.imageUrl}
          alt="Uploaded attachment"
          draggable={false}
          style={{
            borderRadius: `${el.cornerRadius || 0}px`,
            border: el.strokeEnabled ? `${el.strokeWidth ?? 3}px solid ${el.strokeColor || '#FF6B4A'}` : 'none',
          }}
          className="max-w-[220px] max-h-[220px] w-auto h-auto object-contain shadow-xs pointer-events-none select-none transition-all"
        />
      )}

      {/* 2. Vector / Sticker Element */}
      {el.type === 'vector' && (
        <div className="p-1 pointer-events-none select-none flex items-center justify-center">
          {(() => {
            const match = PHOSPHOR_VECTORS.find(v => v.id === (el.vectorId || 'heart'));
            const color = el.vectorColor || '#272835';
            if (match) {
              const IconComp = match.Icon;
              return <IconComp size={48} weight={match.weight || 'fill'} style={{ color }} className="drop-shadow-xs" />;
            }
            if (el.emoji) {
              return <span className="text-4xl leading-none">{el.emoji}</span>;
            }
            return <Heart className="w-10 h-10 drop-shadow-xs" style={{ color }} />;
          })()}
        </div>
      )}

      {/* 3. Text Element */}
      {el.type === 'text' && el.text && (
        <div className="w-full p-2 rounded-xl border border-transparent pointer-events-none select-none">
          <p 
            style={{ 
              color: el.color || '#1A1B25',
              fontFamily: el.fontFamily || (el.isCursive ? 'Playfair Display, cursive' : 'Nunito, sans-serif'),
              textAlign: el.align || 'left',
              whiteSpace: 'pre-wrap',
            }}
            className={`font-bold leading-snug break-words whitespace-pre-wrap ${
              el.isCursive || el.fontFamily?.includes('Playfair') || el.fontFamily?.includes('Caveat') 
                ? 'text-xl' 
                : 'text-sm'
            }`}
          >
            {el.text}
          </p>
        </div>
      )}

      {/* 4. Background Element */}
      {el.type === 'bg' && (
        <div 
          style={{ backgroundColor: el.bgHex || '#FAF5E8' }}
          className="w-24 h-16 rounded-xl border border-gray-200/80 shadow-2xs flex flex-col items-center justify-center p-2 text-center pointer-events-none select-none"
        >
          <span className="text-xs font-bold text-gray-700">{el.frameName || 'Background'}</span>
        </div>
      )}
    </div>
  );
};

export interface CanvasReadOnlyCardProps {
  canvasElements?: CanvasElement[];
  selectedConfetti?: ConfettiType;
  content?: string;
  uploadedImage?: string | null;
  authorName?: string;
  recipient?: string;
  selectedHearts?: string[];
  activeType?: 'text' | 'audio' | 'video';
  isCollaborative?: boolean;
  visibility?: PostVisibility;
  showMetadata?: boolean;
  scale?: number;
}

export const CanvasReadOnlyCard: React.FC<CanvasReadOnlyCardProps> = ({
  canvasElements = [],
  selectedConfetti,
  content,
  uploadedImage,
  authorName,
  recipient,
  selectedHearts = [],
  isCollaborative = false,
  visibility,
  showMetadata = false,
  scale: externalScale,
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [measuredScale, setMeasuredScale] = React.useState<number>(1);

  const BASE_WIDTH = 254;
  const BASE_HEIGHT = 350;

  React.useEffect(() => {
    if (externalScale !== undefined) return;
    const container = containerRef.current;
    if (!container) return;

    const updateScale = () => {
      const rect = container.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      if (w > 0 && h > 0) {
        const s = Math.min(w / BASE_WIDTH, h / BASE_HEIGHT);
        setMeasuredScale(s);
      }
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(container);
    return () => observer.disconnect();
  }, [externalScale]);

  const effectiveScale = externalScale !== undefined ? externalScale : (measuredScale || 1);

  const visibleElements = canvasElements.filter(el => {
    if (el.type === 'text') return Boolean(el.text && el.text.trim());
    if (el.type === 'image') return Boolean(el.imageUrl && el.imageUrl.trim());
    if (el.type === 'vector') return Boolean(el.vectorId || el.emoji);
    return false;
  });

  const hasCanvasContent = visibleElements.length > 0;
  const fallbackText = content?.trim();

  const isAnonymous = visibility === PostVisibility.ANONYMOUS || authorName === 'Anon' || authorName === 'Anonymous';
  const displayAuthorName = isAnonymous ? 'Anon' : authorName;

  return (
    <div 
      ref={containerRef}
      className="w-full h-full relative flex items-center justify-center overflow-hidden shrink-0 select-none"
    >
      {/* Slanted background layers for collaborative boards strictly matching reference design */}
      {isCollaborative && (
        <div 
          style={{
            width: `${BASE_WIDTH}px`,
            height: `${BASE_HEIGHT}px`,
            transform: `scale(${effectiveScale})`,
            transformOrigin: 'center center',
          }}
          className="absolute pointer-events-none origin-center"
        >
          <div className="absolute inset-0 w-full h-full bg-white/20 rounded-[1.8rem] -rotate-[3.5deg] transform origin-center" />
          <div className="absolute inset-0 w-full h-full bg-white/20 rounded-[1.8rem] rotate-[3.5deg] transform origin-center" />
        </div>
      )}

      {/* Main Board Canvas Card: Fixed 254x350 base dimensions, scaled proportionally to fit container */}
      <div 
        style={{
          width: `${BASE_WIDTH}px`,
          height: `${BASE_HEIGHT}px`,
          transform: `scale(${effectiveScale})`,
          transformOrigin: 'center center',
        }}
        className="bg-white rounded-[1.8rem] p-5 shadow-xs flex flex-col justify-between relative overflow-hidden shrink-0 z-10 select-none"
      >
        {/* Confetti Animation Overlay */}
        <ConfettiOverlay type={selectedConfetti || null} />

        {/* Header: Privacy indicator (always shown if applicable) & Recipient tag (only in expanded metadata view) */}
        <div className="w-full flex justify-between items-center relative z-20 pointer-events-none select-none min-h-[20px]">
          {visibility === PostVisibility.PRIVATE ? (
            <span className="flex items-center gap-1 text-[9px] font-extrabold text-[#1A1B25] bg-gray-50/90 px-2 py-0.5 rounded-full border border-gray-200/80 shadow-2xs uppercase tracking-wider">
              <Lock className="w-2.5 h-2.5 text-[#353849] stroke-[2.5]" />
              <span>Private</span>
            </span>
          ) : (
            <div />
          )}

          {showMetadata && recipient?.trim() ? (
            <span className="text-[10px] font-extrabold text-[#A4ABB8] uppercase tracking-wider bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100 max-w-[120px] truncate">
              {recipient}
            </span>
          ) : (
            <div />
          )}
        </div>

        {/* Full Canvas Layer: Treats entire component as canvas area with zero internal clipping bounds */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center z-10 p-2">
          {hasCanvasContent ? (
            visibleElements.map((el) => (
              <RenderCanvasElementReadOnly key={el.id} el={el} />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center w-full h-full p-4 pointer-events-none my-auto text-center">
              {uploadedImage && (
                <img src={uploadedImage} alt="Uploaded attachment" className="max-w-[200px] max-h-[140px] rounded-xl object-contain shadow-xs my-auto" />
              )}
              {fallbackText ? (
                <div className="w-full p-2 my-auto">
                  <p 
                    className="text-base sm:text-lg font-bold leading-snug break-words whitespace-pre-wrap text-[#1A1B25]" 
                    style={{ 
                      fontFamily: 'Nunito, sans-serif',
                      textAlign: 'left',
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    {fallbackText}
                  </p>
                </div>
              ) : !uploadedImage && (
                <div className="text-center w-full px-4 space-y-0.5 py-1 pointer-events-none">
                  <h3 className="text-[15px] font-semibold text-gray-600 tracking-tight">
                    Message Card
                  </h3>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Card footer: only shown in expanded metadata view */}
        {showMetadata ? (
          <div className="w-full flex justify-between items-center select-none pt-1 relative z-20 pointer-events-none">
            <span className="text-[9px] font-extrabold text-gray-300 uppercase tracking-widest">
              {displayAuthorName?.trim() ? `By ${displayAuthorName}` : ''}
            </span>
            {selectedHearts.length > 0 && (
              <div className="flex gap-1 bg-gray-50/70 p-1.5 rounded-full">
                {selectedHearts.map(id => (
                  <span key={id} className="text-xs">
                    {SEMANTIC_HEARTS.find(h => h.id === id)?.emoji}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="h-1" />
        )}
      </div>
    </div>
  );
};

import { moderateContent } from '../services/geminiService';
import { EntityType, PostVisibility, Post, Contribution } from '../types';

export interface CreateAppreciationModalProps {
  onClose: () => void;
  onPostCreated: (post: any) => void;
  initialRecipient?: { id?: string; name: string; handle: string; avatar?: string };
  initialHashtag?: string;
  initialMode?: 'create_message' | 'send_heart';
  initialEventType?: string;
  parentBoard?: any;
  isContribution?: boolean;
  onAddContribution?: (parentBoardId: string, contribution: any) => void;
  editingPost?: Post | null;
  editingContribution?: Contribution | null;
  editMode?: 'board' | 'message' | 'contribution' | null;
  onUpdatePost?: (updatedPost: Post) => void;
  onUpdateContribution?: (parentBoardId: string, updatedContrib: Contribution) => void;
  onDeletePost?: (postId: string) => void;
  onDeleteContribution?: (parentBoardId: string, contribId: string) => void;
  currentUser?: RegisteredUser | null;
}

// Spacing System conforming to additional guide elements:
// Web: 3px, 6px, 12px, 24px, 48px, 96px
const SPACING = {
  web_3: '3px',
  web_6: '6px',
  web_12: '12px',
  web_24: '24px',
  web_48: '48px',
  web_96: '96px',
};

// Grayscale tokens conforming to instructions:
const GRAYS = {
  gray0: '#F8F9FB',
  gray25: '#F6F8FA',
  gray50: '#ECEFF3',
  gray100: '#DFE1E6',
  gray200: '#C1C7CF',
  gray300: '#A4ABB8',
  gray400: '#808897',
  gray500: '#666D80',
  gray600: '#353849',
  gray800: '#272835',
  gray900: '#1A1B25',
};

// Registered Users Dataset for Send Heart Selection
export interface RegisteredUser {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  isVerified?: boolean;
}

export const REGISTERED_USERS: RegisteredUser[] = [
  { 
    id: 'u-ronaldo', 
    name: 'Ronaldo', 
    handle: '@ronaldo', 
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=150', 
    isVerified: true 
  },
  { 
    id: 'u-ronike', 
    name: 'Ronike', 
    handle: '@ronike', 
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150', 
    isVerified: true 
  },
  { 
    id: 'u-ronny', 
    name: 'Ronny', 
    handle: '@ronny', 
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150', 
    isVerified: false 
  },
  { 
    id: 'u-mercy24', 
    name: 'Mercy24', 
    handle: '@mercy24', 
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mercy24', 
    isVerified: true 
  },
  { 
    id: 'u-messi', 
    name: 'Leo Messi', 
    handle: '@messi', 
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150', 
    isVerified: true 
  },
  { 
    id: 'u-beyonce', 
    name: 'Beyoncé', 
    handle: '@beyonce', 
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150', 
    isVerified: true 
  },
  { 
    id: 'u-amino', 
    name: 'Amino', 
    handle: '@amino', 
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=150', 
    isVerified: true 
  },
  { 
    id: 'u-tyler', 
    name: 'Tyler', 
    handle: '@tyler_grandson', 
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150', 
    isVerified: false 
  },
  { 
    id: 'u-davido', 
    name: 'Davido Fans', 
    handle: '@davido_30bg', 
    avatar: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&q=80&w=150', 
    isVerified: true 
  },
  { 
    id: 'u-sarah', 
    name: 'Sarah Connor', 
    handle: '@sarah', 
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150', 
    isVerified: false 
  },
  { 
    id: 'u-alex', 
    name: 'Alex Johnson', 
    handle: '@alexj', 
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150', 
    isVerified: false 
  },
];

export const KNOWN_HASHTAGS = [
  '#loveRonaldo',
  '#ronaldo13',
  '#cr7',
  '#messi',
  '#birthday',
  '#appreciation',
  '#goodwill',
  '#graduation',
  '#wedding',
  '#anniversary',
  '#retirement',
  '#promotion',
  '#mom',
  '#legend',
];

// Semantic Heart Spectrum matching the 6 screenshot items
export interface SemanticHeart {
  id: string;
  label: string;
  details: string;
  emoji: string;
  bubbleColor: string;
}

export const SEMANTIC_HEARTS: SemanticHeart[] = [
  { id: 'loving', label: 'Loving', details: 'Express romantic connection & affection', emoji: '💛', bubbleColor: '#FFB800' },
  { id: 'reliable', label: 'Reliable', details: 'Celebrate dependable, rock-solid support', emoji: '🧡', bubbleColor: '#FF8A65' },
  { id: 'leadership', label: 'Leadership', details: 'Salute career-defining status & legacy', emoji: '💜', bubbleColor: '#7B62FF' },
  { id: 'hardworking', label: 'Hard working', details: 'Commend tireless ethics & dedication', emoji: '💚', bubbleColor: '#4CD964' },
  { id: 'visionary', label: 'Visionary', details: 'Recognize standard-setting motivation', emoji: '💖', bubbleColor: '#FF53C0' },
  { id: 'best', label: 'Best of all', details: 'The ultimate golden status token', emoji: '💙', bubbleColor: '#007A78' },
];

// Clean circular heart token badge (no speech bubble tail, no smiley face)
export const HeartBubbleSvg: React.FC<{ color: string; size?: number; className?: string }> = ({ color, size = 56, className = '' }) => {
  return (
    <div 
      style={{ width: `${size}px`, height: `${size}px`, backgroundColor: color }}
      className={`rounded-full flex items-center justify-center shadow-2xs shrink-0 select-none ${className}`}
    >
      <Heart className="text-white fill-white stroke-none" style={{ width: `${Math.round(size * 0.52)}px`, height: `${Math.round(size * 0.52)}px` }} />
    </div>
  );
};

// Aesthetic Frame templates
interface FrameTemplate {
  id: string;
  name: string;
  bgHex: string;
  pillBg: string;
  pillText: string;
}

const FRAME_TEMPLATES: FrameTemplate[] = [
  { id: 'peach', name: 'Cozy Peach', bgHex: '#F7F0ED', pillBg: '#F7F0ED', pillText: '#808897' },
  { id: 'mint', name: 'Clean Mint', bgHex: '#ECEFE6', pillBg: '#ECEFE6', pillText: '#556644' },
  { id: 'slate', name: 'Cosmic Slate', bgHex: '#272835', pillBg: '#353849', pillText: '#DFE1E6' },
  { id: 'sunset', name: 'Soft Sunlight', bgHex: '#FAF5E8', pillBg: '#FAF5E8', pillText: '#806840' },
  { id: 'lavender', name: 'Dreamy Lavender', bgHex: '#EEF1FA', pillBg: '#EEF1FA', pillText: '#5A60A0' },
  { id: 'blush', name: 'Blush Rose', bgHex: '#FDE8E8', pillBg: '#FDE8E8', pillText: '#9B1C1C' },
  { id: 'sky', name: 'Sky Azure', bgHex: '#E0F2FE', pillBg: '#E0F2FE', pillText: '#0369A1' },
  { id: 'emerald', name: 'Sage Emerald', bgHex: '#E6F4EA', pillBg: '#E6F4EA', pillText: '#137333' },
  { id: 'amber', name: 'Warm Amber', bgHex: '#FEF3C7', pillBg: '#FEF3C7', pillText: '#92400E' },
  { id: 'lilac', name: 'Soft Lilac', bgHex: '#F3E8FF', pillBg: '#F3E8FF', pillText: '#6B21A8' },
];

// Stickers selection
interface StickerItem {
  id: string;
  emoji: string;
  label: string;
}

const STICKER_LIST: StickerItem[] = [
  { id: 'smile_bubble', emoji: '😊', label: 'Smile bubble' },
  { id: 'heart_bubble', emoji: '❤️', label: 'Heart bubble' },
  { id: 'star_glow', emoji: '⭐', label: 'Sparkling star' },
  { id: 'glow_vibes', emoji: '✨', label: 'Glow vibes' },
  { id: 'medal_trophy', emoji: '🏆', label: 'Trophy case' },
  { id: 'party_celebrate', emoji: '🎉', label: 'Tribute horn' },
];

export interface TemplateCategory {
  id: string;
  name: string;
  icon: string;
  templates: string[];
}

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  {
    id: 'love',
    name: 'Love',
    icon: '❤️',
    templates: [
      "I love you so much.",
      "You mean the world to me.",
      "Sending you all my love.",
      "You make life more beautiful.",
      "Forever grateful to have you in my life."
    ]
  },
  {
    id: 'appreciation',
    name: 'Appreciation',
    icon: '💐',
    templates: [
      "Thank you for everything.",
      "I truly appreciate you.",
      "You deserve to be celebrated.",
      "Thank you for always being there.",
      "Your kindness means so much to me."
    ]
  },
  {
    id: 'celebration',
    name: 'Celebration',
    icon: '🎉',
    templates: [
      "Congratulations! You did it!",
      "This moment deserves to be celebrated.",
      "So proud of you!",
      "Cheers to this amazing achievement!",
      "What a beautiful moment!"
    ]
  },
  {
    id: 'graduation',
    name: 'Graduation',
    icon: '🎓',
    templates: [
      "Congratulations on your graduation!",
      "You did it! Your hard work paid off.",
      "The beginning of an amazing new chapter.",
      "So proud of everything you've achieved.",
      "Here's to bigger dreams and brighter days ahead."
    ]
  },
  {
    id: 'birthday',
    name: 'Birthday',
    icon: '🎂',
    templates: [
      "Happy Birthday! Wishing you an amazing year ahead.",
      "Wishing you love, happiness and beautiful memories.",
      "Happy Birthday to someone truly special.",
      "May this new year of your life be your best one yet.",
      "Here's to another beautiful year!"
    ]
  },
  {
    id: 'gratitude',
    name: 'Gratitude',
    icon: '🙏',
    templates: [
      "I'm grateful for you.",
      "Thank you for being part of my journey.",
      "I appreciate everything you've done for me.",
      "Your support means more than you know.",
      "Forever thankful for you."
    ]
  },
  {
    id: 'encouragement',
    name: 'Encouragement',
    icon: '💪',
    templates: [
      "You've got this!",
      "Keep going. You're closer than you think.",
      "I believe in you.",
      "Don't give up. Better days are ahead.",
      "You're stronger than you realize."
    ]
  },
  {
    id: 'motivation',
    name: 'Motivation',
    icon: '🌟',
    templates: [
      "Keep pushing forward.",
      "Believe in yourself and keep going.",
      "Great things are ahead.",
      "Your effort will be worth it.",
      "This is only the beginning."
    ]
  },
  {
    id: 'friendship',
    name: 'Friendship',
    icon: '🤝',
    templates: [
      "I'm lucky to have you as a friend.",
      "Thank you for being an amazing friend.",
      "Life is better with friends like you.",
      "Always grateful for our friendship.",
      "Here's to many more memories together."
    ]
  },
  {
    id: 'sorry',
    name: 'Sorry',
    icon: '💔',
    templates: [
      "I'm truly sorry.",
      "Please forgive me.",
      "I didn't mean to hurt you.",
      "I hope we can make things right.",
      "I'm sorry for what happened."
    ]
  },
  {
    id: 'get-well-soon',
    name: 'Get Well Soon',
    icon: '❤️',
    templates: [
      "Wishing you a speedy recovery.",
      "Sending you love and positive thoughts.",
      "Take care of yourself and get well soon.",
      "Thinking of you and wishing you better days.",
      "Sending you strength and healing."
    ]
  },
  {
    id: 'condolences',
    name: 'Condolences',
    icon: '🕊️',
    templates: [
      "My deepest condolences.",
      "Thinking of you and your family.",
      "Sending you love and strength during this difficult time.",
      "May you find comfort and peace.",
      "My thoughts are with you."
    ]
  },
  {
    id: 'holidays',
    name: 'Holidays',
    icon: '🎄',
    templates: [
      "Wishing you a beautiful holiday season.",
      "Happy Holidays!",
      "Sending you love, joy and warm wishes.",
      "May your holidays be filled with happiness.",
      "Wishing you peace and beautiful moments."
    ]
  }
];

const TEXT_TEMPLATES = TEMPLATE_CATEGORIES.flatMap(c => c.templates);

const EVENT_TYPES = [
  'Graduation',
  'Wedding',
  'Birthday',
  'Anniversary',
  'Appreciation',
  'Congratulations',
  'Condolence',
  'Friendship',
  'Love',
  'Other',
];

const FONT_OPTIONS = [
  { id: 'nunito', name: 'Nunito (Clean Sans)', font: 'Nunito, sans-serif' },
  { id: 'playfair', name: 'Playfair Display (Serif)', font: 'Playfair Display, serif' },
  { id: 'caveat', name: 'Caveat (Handwritten)', font: 'Caveat, cursive' },
  { id: 'courier', name: 'Courier Prime (Mono)', font: 'Courier Prime, monospace' },
];

const COLOR_OPTIONS = [
  { hex: '#1A1B25', name: 'Charcoal' },
  { hex: '#FF6B4A', name: 'Coral' },
  { hex: '#4CB993', name: 'Mint' },
  { hex: '#3B82F6', name: 'Blue' },
  { hex: '#8B5CF6', name: 'Purple' },
  { hex: '#EC4899', name: 'Pink' },
  { hex: '#F59E0B', name: 'Amber' },
  { hex: '#000000', name: 'Black' },
  { hex: '#4F46E5', name: 'Indigo' },
  { hex: '#D946EF', name: 'Fuchsia' },
  { hex: '#047857', name: 'Emerald' },
  { hex: '#0284C7', name: 'Sky' },
  { hex: '#A855F7', name: 'Violet' },
];

export const CreateAppreciationModal: React.FC<CreateAppreciationModalProps> = ({ 
  onClose, 
  onPostCreated,
  initialRecipient,
  initialHashtag,
  initialMode,
  initialEventType,
  parentBoard,
  isContribution,
  onAddContribution,
  editingPost,
  editingContribution,
  editMode,
  onUpdatePost,
  onUpdateContribution,
  onDeletePost,
  onDeleteContribution,
  currentUser
}) => {
  const [activeType, setActiveType] = useState<'text' | 'audio' | 'video'>(() => {
    if (editingContribution?.type) return editingContribution.type === 'image' ? 'text' : editingContribution.type as any;
    if (editingPost?.type) return editingPost.type === 'image' ? 'text' : editingPost.type as any;
    return 'text';
  });
  
  // Customization & Core Information States
  const isContributorFlow = Boolean(isContribution || editMode === 'contribution' || editingContribution);
  const isEditingContributor = Boolean(editingContribution || editMode === 'contribution');

  const [content, setContent] = useState(() => {
    return editingContribution?.content || editingPost?.content || '';
  });
  const [authorName, setAuthorName] = useState(() => {
    return editingContribution?.authorName || editingPost?.authorName || '';
  });
  const [recipient, setRecipient] = useState<string>(() => {
    if (editingPost) {
      if (Array.isArray(editingPost.recipients) && editingPost.recipients.length > 0) {
        return editingPost.recipients[0];
      }
      return editingPost.targetId || '';
    }
    if (initialRecipient) return initialRecipient.handle || initialRecipient.name;
    if (parentBoard) {
      if (Array.isArray(parentBoard.recipients) && parentBoard.recipients.length > 0) {
        return parentBoard.recipients[0];
      }
      return parentBoard.targetId || '';
    }
    return '';
  });
  
  // Automatically inherit and lock the parent curator's frame background when creating a contribution
  const [selectedFrame, setSelectedFrame] = useState<FrameTemplate>(() => {
    const targetTheme = editingPost?.theme || parentBoard?.theme;
    if (targetTheme) {
      const found = FRAME_TEMPLATES.find(f => 
        targetTheme.includes(f.id) || 
        f.bgHex.toLowerCase() === targetTheme.toLowerCase() ||
        (targetTheme.startsWith('#') && f.bgHex.toLowerCase() === targetTheme.toLowerCase())
      );
      if (found) return found;
      if (targetTheme.startsWith('#')) {
        return { id: 'custom-theme', name: 'Board Theme', bgHex: targetTheme, pillBg: '#FAF5E8', pillText: '#806840' };
      }
    }
    return FRAME_TEMPLATES[0];
  });
  const [selectedSticker, setSelectedSticker] = useState<StickerItem | null>(() => {
    const stickerId = editingContribution?.sticker || editingPost?.sticker;
    if (stickerId) {
      return STICKERS.find(s => s.id === stickerId) || null;
    }
    return null;
  });
  const [selectedConfetti, setSelectedConfetti] = useState<ConfettiType>(() => {
    return (editingContribution?.confetti || editingPost?.confetti || null) as ConfettiType;
  });
  const [isConfettiPickerOpen, setIsConfettiPickerOpen] = useState(false);
  const [selectedHearts, setSelectedHearts] = useState<string[]>(() => {
    return editingPost?.selectedHearts || [];
  });
  const [isCursive, setIsCursive] = useState(true);
  const [canvasAspectRatio] = useState<'portrait'>('portrait');
  const [uploadedImage, setUploadedImage] = useState<string | null>(() => {
    return editingContribution?.imageUrl || editingContribution?.mediaUrl || editingPost?.imageUrl || editingPost?.mediaUrl || null;
  });
  /**
   * The picked File, held until submit. `uploadedImage` is only a data-URL
   * preview — data URLs must never be sent to the API as an image reference.
   */
  const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null);
  /** Cloudinary URL for a recorded audio clip, set once it has been uploaded. */
  const [pendingAudioUrl, setPendingAudioUrl] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Dynamic Canvas Elements state
  const [canvasElements, setCanvasElements] = useState<CanvasElement[]>(() => {
    if (editingContribution?.canvasElements && editingContribution.canvasElements.length > 0) {
      return editingContribution.canvasElements;
    }
    if (editingPost?.canvasElements && editingPost.canvasElements.length > 0) {
      return editingPost.canvasElements;
    }
    const initialText = editingContribution?.content || editingPost?.content;
    if (initialText && initialText.trim()) {
      return [
        {
          id: 'text-initial-' + Date.now(),
          type: 'text',
          text: initialText,
          isCursive: true,
          fontFamily: 'Caveat, cursive',
          color: '#1A1B25',
          fontSize: 28,
        }
      ];
    }
    return [];
  });
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [editingElementId, setEditingElementId] = useState<string | null>(null);

  // Text Element Redesign states
  const [activeAccordion, setActiveAccordion] = useState<'font' | 'color' | 'template' | null>(null);
  const [selectedTemplateCategoryId, setSelectedTemplateCategoryId] = useState<string | null>(null);
  const [isRefining, setIsRefining] = useState(false);

  const toggleAccordion = (section: 'font' | 'color' | 'template') => {
    setActiveAccordion(prev => {
      if (prev === section) {
        return null;
      }
      if (section === 'template') {
        setSelectedTemplateCategoryId(null);
      }
      return section;
    });
  };

  // Handlers for adding new elements on toolbar button clicks
  const handleAddTextElement = () => {
    const newEl: CanvasElement = {
      id: 'text-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      type: 'text',
      text: '',
      isCursive: isCursive,
    };
    setCanvasElements(prev => [...prev, newEl]);
    setSelectedElementId(newEl.id);
    setEditingElementId(newEl.id);
  };

  const handleAddImageElement = () => {
    const newEl: CanvasElement = {
      id: 'image-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      type: 'image',
      imageUrl: '',
      strokeEnabled: false,
      strokeColor: '#FF6B4A',
      strokeWidth: 3,
      cornerRadius: 0,
    };
    setCanvasElements(prev => [...prev, newEl]);
    setSelectedElementId(newEl.id);
    setEditingElementId(newEl.id);
    setTimeout(() => {
      imageInputRef.current?.click();
    }, 50);
  };

  const handleAddVectorElement = () => {
    const defaultVector = PHOSPHOR_VECTORS[0];
    const newEl: CanvasElement = {
      id: 'vector-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      type: 'vector',
      vectorId: defaultVector.id,
      vectorName: defaultVector.name,
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0,
    };
    setCanvasElements(prev => [...prev, newEl]);
    setSelectedElementId(newEl.id);
    setEditingElementId(newEl.id);
  };

  const handleAddBgElement = () => {
    const newEl: CanvasElement = {
      id: 'bg-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      type: 'bg',
      bgHex: '#FAF5E8',
      frameName: 'Soft Sunlight',
    };
    setCanvasElements(prev => [...prev, newEl]);
    setSelectedElementId(newEl.id);
    setEditingElementId(newEl.id);
  };

  const handleDeleteElement = (id: string) => {
    setCanvasElements(prev => prev.filter(el => el.id !== id));
    if (selectedElementId === id) {
      setSelectedElementId(null);
    }
    if (editingElementId === id) {
      setEditingElementId(null);
    }
  };

  const updateCanvasElement = (id: string, updates: Partial<CanvasElement>) => {
    setCanvasElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
  };

  const updateEditingElement = (updates: Partial<CanvasElement>) => {
    if (!editingElementId) return;
    setCanvasElements(prev => prev.map(el => el.id === editingElementId ? { ...el, ...updates } : el));
  };

  const editingElement = canvasElements.find(el => el.id === editingElementId);

  /**
   * Keeps a data-URL preview for the canvas AND the original File, which is
   * what actually gets uploaded to Cloudinary on submit. Validating here means
   * the user sees a real message instead of a generic 400 after filling in the
   * whole form.
   */
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const problem = validateFile(file, 'image');
    if (problem) {
      setModerationError(problem);
      return;
    }

    setModerationError(null);
    setPendingCoverFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Advanced variables
  const [privacyLayer, setPrivacyLayer] = useState<PostVisibility>(() => {
    return editingPost?.visibility || PostVisibility.PUBLIC;
  });
  const [isCollaborative, setIsCollaborative] = useState(false);
  const [isPremiumUnlocked, setIsPremiumUnlocked] = useState(false);
  
  // Preview Page State: Never open preview page for any contributor flow
  const [isPreviewOpen, setIsPreviewOpen] = useState(() => Boolean(editMode === 'board' && !isContributorFlow));
  const [caption, setCaption] = useState(() => {
    return editingContribution?.caption || editingPost?.caption || '';
  });
  const [selectedEventType, setSelectedEventType] = useState<string>(() => {
    return editingPost?.eventType || initialEventType || '';
  });
  const [isEventDropdownOpen, setIsEventDropdownOpen] = useState(false);
  const [recipients, setRecipients] = useState<string[]>(() => {
    if (editingPost?.recipients && editingPost.recipients.length > 0) {
      return editingPost.recipients;
    }
    const list: string[] = ['@you'];
    if (initialRecipient) {
      const handleOrName = initialRecipient.handle || initialRecipient.name;
      if (!list.includes(handleOrName)) {
        list.push(handleOrName);
      }
    }
    if (initialHashtag) {
      const formattedHash = initialHashtag.startsWith('#') ? initialHashtag : `#${initialHashtag}`;
      if (!list.includes(formattedHash)) {
        list.push(formattedHash);
      }
    }
    return list;
  });
  const [newRecipientInput, setNewRecipientInput] = useState('');
  const [isRecipientSuggestionsOpen, setIsRecipientSuggestionsOpen] = useState(false);

  const cleanRecipientQuery = newRecipientInput.trim().replace(/^[@#]/, '').toLowerCase();
  const isHashtagSearch = newRecipientInput.trim().startsWith('#');

  const matchingRegisteredUsers = React.useMemo(() => {
    if (isHashtagSearch) return [];
    if (!cleanRecipientQuery) {
      return REGISTERED_USERS.slice(0, 5);
    }
    return REGISTERED_USERS.filter(u => 
      u.name.toLowerCase().includes(cleanRecipientQuery) || 
      u.handle.toLowerCase().includes(cleanRecipientQuery)
    );
  }, [cleanRecipientQuery, isHashtagSearch]);

  const matchingHashtagsList = React.useMemo(() => {
    const queryTag = cleanRecipientQuery;
    let list = KNOWN_HASHTAGS.filter(tag => 
      !queryTag || tag.toLowerCase().includes(queryTag)
    );
    if (queryTag) {
      const customTag = `#${queryTag}`;
      if (!list.some(t => t.toLowerCase() === customTag.toLowerCase())) {
        list = [...list, customTag];
      }
    }
    return list;
  }, [cleanRecipientQuery]);

  const handleSelectRegisteredUser = (user: RegisteredUser) => {
    const tagName = user.name;
    if (!recipients.includes(tagName)) {
      setRecipients(prev => [...prev, tagName]);
    }
    setRecipient(user.name);
    setNewRecipientInput('');
    setIsRecipientSuggestionsOpen(false);
  };

  const handleSelectHashtag = (tag: string) => {
    const formatted = tag.startsWith('#') ? tag : `#${tag.toLowerCase()}`;
    if (!recipients.includes(formatted)) {
      setRecipients(prev => [...prev, formatted]);
    }
    setNewRecipientInput('');
    setIsRecipientSuggestionsOpen(false);
  };

  const handleRecipientKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = newRecipientInput.trim();
      if (!val) return;
      if (val.startsWith('#')) {
        handleSelectHashtag(val);
      } else {
        const clean = val.replace(/^@/, '').toLowerCase();
        const found = REGISTERED_USERS.find(u => 
          u.name.toLowerCase() === clean || 
          u.handle.toLowerCase() === `@${clean}` || 
          u.name.toLowerCase().includes(clean)
        );
        if (found) {
          handleSelectRegisteredUser(found);
        } else if (matchingRegisteredUsers.length > 0) {
          handleSelectRegisteredUser(matchingRegisteredUsers[0]);
        }
      }
    }
  };

  const [boardCapacity, setBoardCapacity] = useState<'collaborative' | 'solo'>(() => {
    return (editingPost?.boardCapacity as any) || 'collaborative';
  });
  const [isCapacityModalOpen, setIsCapacityModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  // Control States: Contributor flows immediately open the full Canva workspace
  const [isExpanded, setIsExpanded] = useState(() => {
    return Boolean(isContributorFlow || editMode === 'message');
  });
  const [expandedActiveTool, setExpandedActiveTool] = useState<'none' | 'image' | 'text' | 'vector' | 'bg'>('none');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isHeartsOnlyPickerOpen, setIsHeartsOnlyPickerOpen] = useState(false);
  const [isStickerPickerOpen, setIsStickerPickerOpen] = useState(false);
  
  // Isolated Send Heart Component States
  const [isSendHeartOpen, setIsSendHeartOpen] = useState<boolean>(initialMode === 'send_heart');
  const [selectedSendHeart, setSelectedSendHeart] = useState<string | null>('loving');
  const [sendHeartSearchQuery, setSendHeartSearchQuery] = useState('');
  const [selectedSendHeartRecipients, setSelectedSendHeartRecipients] = useState<RegisteredUser[]>(() => {
    if (!initialRecipient) return [];
    return [{
      id: initialRecipient.id || 'u-' + initialRecipient.name.toLowerCase().replace(/\s+/g, ''),
      name: initialRecipient.name,
      handle: initialRecipient.handle || `@${initialRecipient.name.toLowerCase().replace(/\s+/g, '')}`,
      avatar: initialRecipient.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
      isVerified: true,
      heartsCount: 100,
      boardsCount: 5,
      bio: ''
    }];
  });
  const [sendHeartNote, setSendHeartNote] = useState('');
  const [isBlowingHeart, setIsBlowingHeart] = useState(false);
  const [sendHeartConfirmation, setSendHeartConfirmation] = useState<{
    heart: SemanticHeart;
    recipient: string;
  } | null>(null);
  const [createdPostConfirmation, setCreatedPostConfirmation] = useState<any | null>(null);

  // Filter registered users based on search query
  const filteredSendHeartUsers = REGISTERED_USERS.filter((u) => {
    if (!sendHeartSearchQuery.trim()) return true;
    const q = sendHeartSearchQuery.toLowerCase().trim();
    return (
      u.name.toLowerCase().includes(q) ||
      u.handle.toLowerCase().includes(q)
    );
  });
  
  // Moderation variables
  const [isModerating, setIsModerating] = useState(false);
  const [moderationError, setModerationError] = useState<string | null>(null);

  // Auto recipient tagging check
  const isHashtagRecipient = recipient.startsWith('#');

  useEffect(() => {
    if (isHashtagRecipient) {
      setPrivacyLayer(PostVisibility.PUBLIC);
    }
  }, [recipient, isHashtagRecipient]);

  const hasElementContent = (el: CanvasElement) => {
    if (el.type === 'text') return Boolean(el.text && el.text.trim());
    if (el.type === 'image') return Boolean(el.imageUrl && el.imageUrl.trim());
    if (el.type === 'vector') return Boolean(el.vectorId || el.emoji);
    return false;
  };

  // Check if Canva has any content
  const hasCanvaContent = Boolean(
    content.trim() ||
    uploadedImage ||
    caption.trim() ||
    selectedSticker ||
    canvasElements.some(hasElementContent) ||
    (activeType !== 'text')
  );

  const handleHeartToggle = (heartId: string) => {
    if (selectedHearts.includes(heartId)) {
      setSelectedHearts(prev => prev.filter(id => id !== heartId));
    } else {
      setSelectedHearts(prev => [...prev, heartId]);
    }
  };

  const handlePublish = async () => {
    setIsPreviewOpen(true);
  };

  const handleFinalSubmitMessage = async () => {
    const textToWrite = caption.trim() || content.trim() || (canvasElements.find(el => el.type === 'text')?.text) || '';
    setIsModerating(true);
    setModerationError(null);

    const safeTextCheck = textToWrite || (activeType === 'audio' ? "Audio appreciation tribute" : "Visual video tribute");

    try {
      const result = await moderateContent(safeTextCheck);
      if (!result.isSafe) {
        setModerationError(result.reason || "Please ensure the message matches our positive platform code.");
        setIsModerating(false);
        return;
      }

      const finalRecipientsString = recipients.join(', ') || '@you';
      
      const extractedHashtags = recipients.filter(r => r.startsWith('#'));
      if (initialHashtag) {
        const formatted = initialHashtag.startsWith('#') ? initialHashtag : `#${initialHashtag}`;
        if (!extractedHashtags.includes(formatted)) {
          extractedHashtags.push(formatted);
        }
      }
      
      const effectiveVisibility = (isHashtagRecipient || extractedHashtags.length > 0) && privacyLayer === PostVisibility.PRIVATE 
        ? PostVisibility.PUBLIC 
        : privacyLayer;
      
      // 1. Editing Existing Contribution
      if (editingContribution && onUpdateContribution && parentBoard) {
        const updatedContrib: any = {
          ...editingContribution,
          authorName: effectiveVisibility === PostVisibility.ANONYMOUS ? 'Anon' : (authorName.trim() || editingContribution.authorName || 'Contributor'),
          authorHandle: authorName.trim() ? (authorName.startsWith('@') ? authorName.trim() : `@${authorName.trim().toLowerCase().replace(/\s+/g, '')}`) : editingContribution.authorHandle,
          content: safeTextCheck,
          caption: caption.trim() || undefined,
          type: activeType,
          mediaType: activeType === 'text' ? 'note' : activeType,
          imageUrl: uploadedImage || undefined,
          mediaUrl: uploadedImage || undefined,
          sticker: selectedSticker ? selectedSticker.id : undefined,
          confetti: selectedConfetti || undefined,
          canvasElements: canvasElements.filter(hasElementContent),
        };

        onUpdateContribution(parentBoard.id, updatedContrib);
        setIsModerating(false);
        setIsPreviewOpen(false);
        onClose();
        return;
      }

      // 2. Editing Existing Post/Board
      if (editingPost && onUpdatePost) {
        const updatedPost: any = {
          ...editingPost,
          visibility: effectiveVisibility,
          authorName: effectiveVisibility === PostVisibility.ANONYMOUS ? 'Anon' : (authorName.trim() || editingPost.authorName || 'Curator'),
          content: safeTextCheck,
          caption: caption.trim() || undefined,
          eventType: selectedEventType || editingPost.eventType || 'Appreciation',
          recipients: recipients,
          recipientName: recipients.filter(r => r !== '@you').join(', ') || recipient || editingPost.recipientName || 'Curator',
          hashtags: extractedHashtags,
          boardCapacity: boardCapacity,
          maxCapacity: boardCapacity === 'solo' ? 1 : 20,
          type: activeType,
          mediaType: activeType === 'text' ? 'note' : activeType,
          targetId: finalRecipientsString.replace('#', ''),
          targetType: isHashtagRecipient ? EntityType.WALL : EntityType.BOARD,
          imageUrl: uploadedImage || undefined,
          theme: selectedFrame.bgHex || (selectedFrame.id === 'slate' ? '#272835' : 
                 selectedFrame.id === 'mint' ? '#ECEFE6' :
                 selectedFrame.id === 'sunset' ? '#FAF5E8' :
                 selectedFrame.id === 'lavender' ? '#EEF1FA' :
                 selectedFrame.id === 'blush' ? '#FDE8E8' :
                 selectedFrame.id === 'sky' ? '#E0F2FE' :
                 selectedFrame.id === 'emerald' ? '#E6F4EA' :
                 selectedFrame.id === 'amber' ? '#FEF3C7' :
                 selectedFrame.id === 'lilac' ? '#F3E8FF' : '#F7F0ED'),
          sticker: selectedSticker ? selectedSticker.id : undefined,
          confetti: selectedConfetti || undefined,
          sponsor: boardCapacity === 'collaborative' ? "Community Coauthored" : undefined,
          canvasElements: canvasElements.filter(hasElementContent),
        };

        if (selectedHearts.length > 0) {
          updatedPost.selectedHearts = [...selectedHearts];
        }

        onUpdatePost(updatedPost);
        setIsModerating(false);
        setIsPreviewOpen(false);
        onClose();
        return;
      }

      // 3. New Contribution Flow
      if (isContribution && parentBoard) {
        const isAnon = effectiveVisibility === PostVisibility.ANONYMOUS;
        const isRegistered = Boolean(currentUser);

        const finalAuthorName = isAnon
          ? 'Anon'
          : isRegistered
            ? (authorName.trim() || currentUser!.name || 'Registered User')
            : (authorName.trim() || 'Guest');

        const finalAuthorHandle = isAnon
          ? '@anon'
          : isRegistered
            ? (authorName.trim()
                ? (authorName.startsWith('@') ? authorName.trim() : `@${authorName.trim().toLowerCase().replace(/\s+/g, '')}`)
                : (currentUser!.handle || '@user'))
            : (authorName.trim()
                ? (authorName.startsWith('@') ? authorName.trim() : `@${authorName.trim().toLowerCase().replace(/\s+/g, '')}`)
                : '@guest');

        const finalAuthorAvatar = isAnon
          ? undefined
          : isRegistered
            ? (currentUser!.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(finalAuthorName)}`)
            : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(finalAuthorName || 'Guest')}`;

        const newContrib: any = {
          id: 'contrib-' + Math.random().toString(36).substring(2, 11),
          authorName: finalAuthorName,
          authorHandle: finalAuthorHandle,
          authorAvatar: finalAuthorAvatar,
          authorId: isRegistered ? currentUser!.id : 'guest',
          content: safeTextCheck,
          caption: caption.trim() || undefined,
          type: activeType,
          mediaType: activeType === 'text' ? 'note' : activeType,
          imageUrl: uploadedImage || undefined,
          mediaUrl: uploadedImage || undefined,
          createdAt: new Date().toISOString(),
          sticker: selectedSticker ? selectedSticker.id : undefined,
          confetti: selectedConfetti || undefined,
          reactions: 0,
          canvasElements: canvasElements.filter(hasElementContent),
          isCreatedByUser: true,
        };

        if (onAddContribution) {
          onAddContribution(parentBoard.id, newContrib);
        }
        setIsModerating(false);
        setIsPreviewOpen(false);
        onClose();
        return;
      }

      const defaultPostAuthor = currentUser?.name || 'Curator';
      const defaultPostHandle = currentUser?.handle || '@curator';
      const newPost: any = {
        id: 'post-' + Math.random().toString(36).substring(2, 11),
        visibility: effectiveVisibility,
        authorName: effectiveVisibility === PostVisibility.ANONYMOUS ? 'Anon' : (authorName.trim() || defaultPostAuthor),
        authorHandle: authorName.trim() ? (authorName.startsWith('@') ? authorName.trim() : `@${authorName.trim().toLowerCase().replace(/\s+/g, '')}`) : defaultPostHandle,
        authorAvatar: effectiveVisibility === PostVisibility.ANONYMOUS ? undefined : (currentUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(authorName.trim() || defaultPostAuthor)}`),
        authorId: currentUser?.id,
        content: safeTextCheck,
        caption: caption.trim() || undefined,
        eventType: selectedEventType || 'Appreciation',
        recipients: recipients,
        recipientName: recipients.filter(r => r !== '@you').join(', ') || recipient || 'Curator',
        hashtags: extractedHashtags,
        boardCapacity: boardCapacity,
        maxCapacity: boardCapacity === 'solo' ? 1 : 20,
        contributions: [],
        type: activeType,
        mediaType: activeType === 'text' ? 'note' : activeType,
        targetId: finalRecipientsString.replace('#', ''),
        targetType: isHashtagRecipient ? EntityType.WALL : EntityType.BOARD,
        reactions: 0,
        isCreatedByUser: true,
        section: 'board',
        aspectRatio: 'portrait',
        imageUrl: uploadedImage || undefined,
        createdAt: new Date().toISOString(),
        theme: selectedFrame.bgHex || (selectedFrame.id === 'slate' ? '#272835' : 
               selectedFrame.id === 'mint' ? '#ECEFE6' :
               selectedFrame.id === 'sunset' ? '#FAF5E8' :
               selectedFrame.id === 'lavender' ? '#EEF1FA' :
               selectedFrame.id === 'blush' ? '#FDE8E8' :
               selectedFrame.id === 'sky' ? '#E0F2FE' :
               selectedFrame.id === 'emerald' ? '#E6F4EA' :
               selectedFrame.id === 'amber' ? '#FEF3C7' :
               selectedFrame.id === 'lilac' ? '#F3E8FF' : '#F7F0ED'),
        sticker: selectedSticker ? selectedSticker.id : undefined,
        confetti: selectedConfetti || undefined,
        sponsor: boardCapacity === 'collaborative' ? "Community Coauthored" : undefined,
        canvasElements: canvasElements.filter(hasElementContent),
      };

      // Enrich content with semantic hearts if set
      if (selectedHearts.length > 0) {
        newPost.selectedHearts = [...selectedHearts];
        const heartLabels = selectedHearts.map(id => SEMANTIC_HEARTS.find(h => h.id === id)?.label).filter(Boolean);
        newPost.content = `${newPost.content} (${heartLabels.join(', ')})`;
      }

      // ── Persist to the API ──────────────────────────────────────────────
      // Two-step media flow: upload first, then reference the returned
      // url + publicId, so the server can clean up the Cloudinary asset if
      // the board write fails.
      let coverImage: string | undefined;
      let coverImagePublicId: string | undefined;

      if (pendingCoverFile) {
        const uploaded = await uploadFile(pendingCoverFile, 'image');
        coverImage = uploaded.url;
        coverImagePublicId = uploaded.publicId;
        newPost.imageUrl = uploaded.url;
      }

      // The server takes a bare username or a #hashtag and resolves it
      // itself; it does not want a leading '@'.
      const primaryRecipient = recipients.find((r) => r !== '@you');
      const receipent = primaryRecipient
        ? primaryRecipient.startsWith('#')
          ? primaryRecipient
          : usernameOf(primaryRecipient)
        : undefined;

      const { board } = await createBoard({
        title: (caption.trim() || safeTextCheck).slice(0, 80),
        description: (content.trim() || safeTextCheck).slice(0, 300),
        visibility: fromPostVisibility(effectiveVisibility),
        receipent,
        event: toBoardEvent(selectedEventType),
        coverImage,
        coverImagePublicId,
        tags: extractedHashtags.map((t) => t.replace(/^#/, '').toLowerCase()),
        style: {
          theme: newPost.theme,
          sticker: newPost.sticker,
          confetti: newPost.confetti,
        },
      });

      // Post the author's own message onto the new board so the board is not
      // created empty.
      const elements = canvasElements.filter(hasElementContent);
      try {
        await postMessage(board.slug, {
          type: fromClientMessageType(activeType === 'video' ? 'image' : activeType),
          content: {
            text: safeTextCheck,
            imageUrls: coverImage ? [coverImage] : [],
            audioUrl: pendingAudioUrl ?? null,
          },
          cloudinaryPublicId: coverImagePublicId ?? null,
          fileType: coverImage ? 'image' : null,
          canvasData: wrapCanvasData(elements, 'portrait'),
        });
      } catch (msgErr) {
        // The board exists either way; surface the failure without losing it.
        console.error('Board created but first message failed:', msgErr);
      }

      // Reconcile the optimistic object with what the server actually stored.
      newPost.id = board._id;
      newPost.slug = board.slug;
      newPost.createdAt = board.createdAt;
      newPost.tier = board.tier;

      onPostCreated(newPost);
      setIsModerating(false);
      setIsPreviewOpen(false);
      setCreatedPostConfirmation(newPost);
    } catch (e) {
      console.error(e);
      const err = toApiError(e);
      setModerationError(
        err.status === 401
          ? 'Please sign in again to publish this board.'
          : err.message || 'We could not publish that board. Please try again.',
      );
      setIsModerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-[#FCF9F8] flex flex-col font-sans select-none overflow-y-auto antialiased">
      
      {/* Sticky Top Banner Header */}
      <div className="sticky top-0 z-50 bg-[#ffffff] border-b border-gray-100 shrink-0">
        {/* Header (Drop a message, Close button, and Send/Publish button) */}
        <div className="w-full px-6 py-4 flex items-center justify-between">
          <button 
            onClick={onClose}
            className="text-[#1A1B25] hover:bg-black/5 p-2 rounded-full transition-all active:scale-95"
            aria-label="Close message portal"
          >
            <X className="w-6 h-6 stroke-[1.5]" />
          </button>
          
          <h1 className="text-xl md:text-2xl font-bold text-[#1A1B25] tracking-tight text-center flex-grow">
            Drop a message
          </h1>
          
          {/* Top-right Publish action with Send icon */}
          <button
            type="button"
            onClick={handlePublish}
            disabled={!hasCanvaContent || isModerating}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              !hasCanvaContent || isModerating
                ? 'bg-[#F1E4DF] text-[#A49893] cursor-not-allowed shadow-none opacity-60'
                : 'bg-[#FE6349] hover:bg-[#e05234] text-white shadow-xs active:scale-95 cursor-pointer'
            }`}
            aria-label="Publish message"
            title={!hasCanvaContent ? "Add content to the Canva to publish" : "Publish"}
          >
            <Send className="w-5 h-5 -translate-x-0.5" />
          </button>
        </div>
      </div>

      {/* 3. Pristine Centered Workspace */}
      <div className="flex-grow w-full flex flex-col items-center justify-center pt-[24px] pb-12 px-6 bg-[#FCF9F8] gap-[16px]">
        
        {/* A. Outer Cozy Peach / Color Fill Preview Frame (Fixed Aspect Ratios with Responsive Scaling) */}
        <div 
          onClick={() => setIsExpanded(true)}
          style={{ 
            backgroundColor: selectedFrame.bgHex,
            height: 'min(480px, 65vh)'
          }}
          className="relative w-full max-w-[461px] rounded-[2rem] sm:rounded-[2.5rem] transition-all duration-300 flex items-center justify-center p-4 sm:p-6 select-none border border-transparent cursor-pointer group hover:scale-[1.01] active:scale-[0.99]"
          title="Click to expand into full workspace editor"
        >
          {/* Slanted background layers for collaborative boards strictly matching reference design */}
          {boardCapacity !== 'solo' && (
            <div className="absolute pointer-events-none origin-center w-[254px] h-[350px]">
              <div className="absolute inset-0 w-full h-full bg-white/20 rounded-[1.8rem] -rotate-[3.5deg] transform origin-center" />
              <div className="absolute inset-0 w-full h-full bg-white/20 rounded-[1.8rem] rotate-[3.5deg] transform origin-center" />
            </div>
          )}

          {/* B. Center vertical or horizontal white card */}
          <div 
            onClick={() => setSelectedElementId(null)}
            className="rounded-[1.8rem] sm:rounded-[2.2rem] bg-white flex flex-col justify-between relative p-4 sm:p-6 transition-all duration-300 max-w-full max-h-full w-[254px] h-[350px] overflow-hidden shadow-xs cursor-default z-10"
          >
            {/* Full Canvas Layer: Treats entire component as canvas area with zero internal clipping bounds */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center z-10">
              <>
                {(() => {
                  const visibleElements = canvasElements.filter(hasElementContent);
                  if (visibleElements.length === 0) {
                    return (
                      <div className="text-center w-full px-4 space-y-0.5 py-1 pointer-events-none">
                        <h3 className="text-[15px] font-semibold text-gray-600 tracking-tight">
                          Tap to create message
                        </h3>
                        <p className="text-[11px] text-[#808897] font-semibold">
                          Create beautiful message with stunning visuals
                        </p>
                      </div>
                    );
                  }
                  return visibleElements.map((el) => (
                    <RenderCanvasElement
                      key={el.id}
                      el={el}
                      isSelected={selectedElementId === el.id}
                      onSelect={(id) => setSelectedElementId(id)}
                      onEdit={(id) => setEditingElementId(id)}
                      onUpdate={updateCanvasElement}
                    />
                  ));
                })()}
              </>
            </div>

            {/* Recipient meta badge if recipient is filled */}
            <div className="w-full flex justify-end items-center pr-1 relative z-20 pointer-events-none select-none">
              {recipient.trim() ? (
                <span className="text-[10px] font-extrabold text-[#A4ABB8] uppercase tracking-wider bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100 max-w-[130px] truncate pointer-events-auto">
                  {recipient}
                </span>
              ) : (
                <div className="h-6" /> // Empty space to protect layout alignment
              )}
            </div>

            {/* Pristine clean footer: absolutely no borders, lines, or metadata unless there are active hearts */}
            <div className="w-full flex justify-between items-center select-none pt-1">
              <span className="text-[9px] font-extrabold text-gray-300 uppercase tracking-widest">
                {authorName.trim() ? `By ${authorName}` : ''}
              </span>
              
              <div className="flex gap-1 items-center">
                {selectedHearts.length > 0 && (
                  <div className="flex gap-1 bg-gray-50/70 p-1.5 rounded-full">
                    {selectedHearts.map(id => (
                      <span key={id} className="text-sm scale-110 active:scale-125 transition-transform" title={SEMANTIC_HEARTS.find(h => h.id === id)?.label}>
                        {SEMANTIC_HEARTS.find(h => h.id === id)?.emoji}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Send Heart Accordion Component - Styled precisely according to reference image */}
        <div 
          style={{ backgroundColor: selectedFrame.bgHex }}
          className="w-full max-w-[461px] mt-2 rounded-[24px] p-4 sm:p-5 transition-all duration-300 select-none border-0 shadow-none"
        >
          {/* Accordion Toggle Header */}
          <button
            type="button"
            onClick={() => setIsSendHeartOpen(!isSendHeartOpen)}
            className="w-full flex items-center justify-between px-2 py-1 transition-colors cursor-pointer group text-left"
            aria-expanded={isSendHeartOpen}
          >
            <span className="text-[16px] font-medium text-[#A4ABB8] tracking-tight">
              Send heart
            </span>
            <div className="text-[#A4ABB8] group-hover:text-[#666D80] transition-transform duration-300">
              {isSendHeartOpen ? (
                <Minus className="w-5 h-5 stroke-[1.75]" />
              ) : (
                <Plus className="w-5 h-5 stroke-[1.75]" />
              )}
            </div>
          </button>

          {/* Expanded Heart Spectrum Selector */}
          {isSendHeartOpen && (
            <div className="mt-4 pt-4 border-t border-[#EAE3DC] flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div>
                <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider block mb-2">
                  1. Select Heart Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {SEMANTIC_HEARTS.map((heart) => {
                    const isSelected = selectedSendHeart === heart.id;
                    return (
                      <button
                        key={heart.id}
                        type="button"
                        onClick={() => {
                          setSelectedSendHeart(isSelected ? null : heart.id);
                        }}
                        className="p-3 rounded-2xl text-left transition-all duration-200 cursor-pointer flex flex-col justify-between h-20 relative overflow-hidden bg-white hover:bg-white/90 border-0 shadow-none outline-none"
                      >
                        <div className="flex items-center justify-between w-full">
                          <HeartBubbleSvg color={heart.bubbleColor} size={36} />
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-[#3BB88C] text-white flex items-center justify-center shadow-xs">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#1A1B25]">{heart.label}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Recipient Input & Registered User Selection */}
              <div className="space-y-2.5 pt-1">
                <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider block">
                  2. Recipient Details
                </label>
                
                <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border-0 shadow-none space-y-3">
                  {/* Search bar input with search icon */}
                  <div className="relative flex items-center bg-[#F8F9FB] rounded-2xl px-3.5 py-3 border border-gray-100 focus-within:border-[#FE6349] transition-all">
                    <Search className="w-4.5 h-4.5 text-gray-400 mr-2 shrink-0" />
                    <input
                      type="text"
                      value={sendHeartSearchQuery}
                      onChange={(e) => setSendHeartSearchQuery(e.target.value)}
                      placeholder="Search registered user..."
                      className="w-full bg-transparent text-sm font-semibold text-[#1A1B25] placeholder:text-gray-400 focus:outline-none border-none p-0"
                    />
                    {sendHeartSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setSendHeartSearchQuery('')}
                        className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Selected Recipients Chips */}
                  {selectedSendHeartRecipients.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {selectedSendHeartRecipients.map((user) => (
                        <span
                          key={user.id}
                          className="inline-flex items-center gap-1.5 bg-rose-50 text-[#FE6349] border border-rose-100 font-bold text-xs px-2.5 py-1 rounded-full animate-in fade-in"
                        >
                          <img src={user.avatar} alt={user.name} className="w-4 h-4 rounded-full object-cover" />
                          <span>{user.name}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSendHeartRecipients(prev => prev.filter(u => u.id !== user.id));
                            }}
                            className="hover:bg-rose-100 rounded-full p-0.5 transition-colors cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Profile List Header & Results matching attached design */}
                  <div className="pt-2">
                    <p className="text-sm font-semibold text-gray-500 mb-2 px-1">Profile</p>

                    {filteredSendHeartUsers.length > 0 ? (
                      <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
                        {filteredSendHeartUsers.map((user) => {
                          const isSelected = selectedSendHeartRecipients.some(u => u.id === user.id);
                          return (
                            <div
                              key={user.id}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedSendHeartRecipients(prev => prev.filter(u => u.id !== user.id));
                                } else {
                                  setSelectedSendHeartRecipients(prev => [...prev, user]);
                                }
                              }}
                              className={`flex items-center justify-between p-2.5 rounded-2xl transition-all cursor-pointer select-none ${
                                isSelected ? 'bg-rose-50/60 hover:bg-rose-50' : 'hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {/* Avatar with optional verified checkmark badge */}
                                <div className="relative w-10 h-10 shrink-0">
                                  <img
                                    src={user.avatar}
                                    alt={user.name}
                                    className="w-10 h-10 rounded-full object-cover"
                                  />
                                  {user.isVerified && (
                                    <div className="absolute -bottom-0.5 -right-0.5 bg-[#38BDF8] text-white rounded-full p-0.5 flex items-center justify-center border-2 border-white shadow-2xs">
                                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                                    </div>
                                  )}
                                </div>

                                {/* Name */}
                                <div>
                                  <p className="text-base font-bold text-[#1A1B25] leading-tight">
                                    {user.name}
                                  </p>
                                </div>
                              </div>

                              {/* Right Green Checkmark when selected */}
                              {isSelected && (
                                <div className="w-5 h-5 rounded-full bg-[#3BB88C] text-white flex items-center justify-center shrink-0 shadow-xs">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* Empty State */
                      <div className="text-center py-6 px-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2 text-gray-400">
                          <UserX className="w-5 h-5" />
                        </div>
                        <p className="text-sm font-bold text-[#1A1B25]">No users found</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Only registered users can receive a Send Heart.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Blow Heart CTA Button */}
              <button
                type="button"
                disabled={!selectedSendHeart || selectedSendHeartRecipients.length === 0 || isBlowingHeart}
                onClick={() => {
                  if (!selectedSendHeart || selectedSendHeartRecipients.length === 0) return;
                  setIsBlowingHeart(true);
                  const chosenHeartObj = SEMANTIC_HEARTS.find(h => h.id === selectedSendHeart) || SEMANTIC_HEARTS[0];
                  
                  setTimeout(() => {
                    setIsBlowingHeart(false);
                    const recipientNames = selectedSendHeartRecipients.map(u => u.name).join(', ');
                    const newHeartPost: any = {
                      id: `heart-token-${Date.now()}`,
                      authorName: authorName?.trim() || 'You',
                      recipientName: recipientNames,
                      content: `${chosenHeartObj.label} Heart ${chosenHeartObj.emoji} blown to ${recipientNames} with deepest appreciation!`,
                      type: 'heart_token',
                      visibility: PostVisibility.PUBLIC,
                      createdAt: new Date().toISOString(),
                      targetId: selectedSendHeartRecipients[0]?.handle || 'user',
                      targetType: EntityType.WALL,
                      reactions: 1,
                      theme: '#FAF0EC',
                      frameBg: '#FAF0EC',
                      selectedHearts: [chosenHeartObj.id],
                      heartDetails: {
                        id: chosenHeartObj.id,
                        label: chosenHeartObj.label,
                        emoji: chosenHeartObj.emoji,
                        bubbleColor: chosenHeartObj.bubbleColor
                      },
                      category: 'vouch',
                      eventType: 'Moment',
                      statusBadge: `${chosenHeartObj.emoji} HEART TOKEN`,
                      isHeartToken: true,
                      isCreatedByUser: true,
                      section: 'hearts'
                    };
                    if (onPostCreated) {
                      onPostCreated(newHeartPost);
                    }
                    setSendHeartConfirmation({
                      heart: chosenHeartObj,
                      recipient: recipientNames
                    });
                  }, 700);
                }}
                className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all shadow-none flex items-center justify-center gap-2 cursor-pointer ${
                  !selectedSendHeart || selectedSendHeartRecipients.length === 0 || isBlowingHeart
                    ? 'bg-[#F1E4DF] text-[#A49893] cursor-not-allowed'
                    : 'bg-[#FE6349] hover:bg-[#e05234] text-white active:scale-[0.98]'
                }`}
              >
                {isBlowingHeart ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Blowing Heart...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {selectedSendHeartRecipients.length > 1
                        ? `Blow Heart Token (${selectedSendHeartRecipients.length})`
                        : 'Blow Heart Token'
                      }
                    </span>
                    <Sparkles className="w-4 h-4 fill-white" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Full Page Confirmation Screen for Send Heart */}
        {sendHeartConfirmation && (
          <div className="fixed inset-0 z-[6000] bg-[#FCF9F8] flex flex-col items-center justify-between p-4 sm:p-8 overflow-y-auto animate-in fade-in duration-300 min-h-screen">
            <ConfettiOverlay active={true} type="heart" />
            
            <div className="w-full max-w-[440px] flex flex-col items-center justify-between min-h-[92vh] sm:min-h-[85vh] my-auto relative z-10 py-2 sm:py-0">
              {/* Close Button Top Right */}
              <div className="w-full flex justify-end mb-3 sm:mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setSendHeartConfirmation(null);
                    setSelectedSendHeartRecipients([]);
                    setSendHeartSearchQuery('');
                    setSelectedSendHeart(null);
                    setIsSendHeartOpen(false);
                    onClose();
                  }}
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#F0F2F5] hover:bg-[#E4E7EB] text-[#666D80] flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                >
                  <X className="w-5 h-5" strokeWidth={2.5} />
                </button>
              </div>

              {/* Main Card */}
              <div className="w-full bg-white rounded-[2.5rem] p-6 sm:p-8 flex flex-col items-center text-center shadow-xs border border-gray-100/60">
                {/* Circular Icon Top */}
                <div 
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center mb-6 relative shadow-xs"
                  style={{ backgroundColor: sendHeartConfirmation.heart.bubbleColor ? `${sendHeartConfirmation.heart.bubbleColor}25` : '#FAF0EC' }}
                >
                  <span className="text-5xl sm:text-6xl select-none transform hover:scale-110 transition-transform">
                    {sendHeartConfirmation.heart.emoji}
                  </span>
                  <div className="absolute -bottom-1 -right-1 bg-white p-1.5 rounded-full shadow-xs border border-gray-100">
                    <Sparkles className="w-4 h-4 fill-[#FE6349] text-[#FE6349]" />
                  </div>
                </div>

                {/* Heading */}
                <h2 className="text-2xl sm:text-[28px] font-extrabold text-[#1A1B25] tracking-tight mb-2">
                  Appreciation Sent
                </h2>

                {/* Subtitle */}
                <p className="text-sm sm:text-base font-normal text-[#666D80] max-w-xs mb-6 leading-relaxed">
                  Your heartfelt has been published and delivered to{' '}
                  <strong className="text-[#1A1B25] font-bold">
                    {sendHeartConfirmation.recipient.startsWith('@') ? sendHeartConfirmation.recipient : `@${sendHeartConfirmation.recipient}`}
                  </strong>
                </p>

                {/* Details Summary Container */}
                <div className="w-full bg-[#FAF9F8] rounded-3xl p-5 sm:p-6 space-y-3.5 text-left">
                  <div className="flex items-center justify-between text-sm sm:text-base">
                    <span className="text-[#808897] font-medium">Recipient</span>
                    <span className="text-[#1A1B25] font-bold truncate max-w-[200px] text-right">
                      {sendHeartConfirmation.recipient.startsWith('@') ? sendHeartConfirmation.recipient : `@${sendHeartConfirmation.recipient}`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm sm:text-base">
                    <span className="text-[#808897] font-medium">Visibility</span>
                    <span className="text-[#1A1B25] font-bold">Trophy Case (Public)</span>
                  </div>

                  <div className="flex items-center justify-between text-sm sm:text-base">
                    <span className="text-[#808897] font-medium">Heart Type</span>
                    <span className="text-[#1A1B25] font-bold flex items-center gap-1.5">
                      <span>{sendHeartConfirmation.heart.emoji}</span>
                      <span>{sendHeartConfirmation.heart.label}</span>
                    </span>
                  </div>

                  {/* Inner Pill Quote */}
                  <div className="w-full bg-white rounded-2xl sm:rounded-3xl py-3.5 px-5 text-left mt-2 shadow-2xs border border-gray-100/40">
                    <p className="text-sm sm:text-base font-extrabold text-[#1A1B25] tracking-tight">
                      “{sendHeartConfirmation.heart.label} Heart Token”
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons Below Card */}
              <div className="w-full space-y-3 pt-6 sm:pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setSendHeartConfirmation(null);
                    setSelectedSendHeartRecipients([]);
                    setSendHeartSearchQuery('');
                    setSelectedSendHeart(null);
                    setIsSendHeartOpen(false);
                    onClose();
                  }}
                  className="w-full py-4 rounded-full bg-[#FE6349] hover:bg-[#e05234] text-white font-extrabold text-base shadow-xs active:scale-[0.98] transition-all cursor-pointer text-center"
                >
                  View on Heartboard
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSendHeartConfirmation(null);
                    setSelectedSendHeartRecipients([]);
                    setSendHeartSearchQuery('');
                    setSelectedSendHeart(null);
                  }}
                  className="w-full py-4 rounded-full bg-[#F0F4F8] hover:bg-[#E4E9F0] text-[#1A1B25] font-extrabold text-base transition-all active:scale-[0.98] cursor-pointer text-center"
                >
                  Send another heart
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* 4. Luxury Customization Form Slide-Up Bottom Sheet Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 bg-[#1A1B25]/40 backdrop-blur-sm z-[2500] flex items-end justify-center transition-all animate-fade-in-slow">
          <div className="bg-white w-full max-w-[500px] rounded-t-[3rem] shadow-2xl p-7 space-y-6 flex flex-col max-h-[90vh] overflow-y-auto transform transition-transform translate-y-0 duration-300">
            
            {/* Drawer Header */}
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <div>
                <h4 className="text-base font-extrabold text-[#1A1B25]">Configure Tribute Card</h4>
                <p className="text-[10px] text-[#808897] font-semibold uppercase mt-0.5">Customize recipient, style & details</p>
              </div>
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="text-[#A4ABB8] hover:text-[#353849] p-1.5 bg-[#FAF1EE] rounded-full transition-all active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* A. TEXT INPUT OR MEDIA CAPTURE */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-gray-500 uppercase tracking-widest pl-0.5 block">
                Tribute Message Text
              </label>
              {activeType === 'text' ? (
                <div className="relative">
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value.slice(0, 180))}
                    placeholder="Write beautiful heartfelt things..."
                    className="w-full bg-gray-50 border-none rounded-2xl py-3.5 px-4 text-sm text-[#1A1B25] placeholder-[#C1C7CF] focus:outline-none focus:ring-0 outline-none font-medium h-24 resize-none transition-all duration-200"
                  />
                  <div className="absolute bottom-2.5 right-3 text-[10px] text-[#A4ABB8] font-bold">
                    {content.length}/180 limits
                  </div>
                </div>
              ) : activeType === 'audio' ? (
                <div className="bg-gray-50 p-4 rounded-2xl border-none flex flex-col items-center gap-1.5 text-center">
                  <p className="text-xs font-semibold text-gray-600">Audio coming soon</p>
                  <p className="text-[10px] text-[#A4ABB8] font-medium">
                    Send beautiful message with your voice
                  </p>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-2xl border-none flex flex-col items-center gap-1.5 text-center">
                  <p className="text-xs font-semibold text-gray-600">Video coming soon</p>
                  <p className="text-[10px] text-[#A4ABB8] font-medium">
                    Send beautiful message with your video
                  </p>
                </div>
              )}
            </div>

            {/* B. RECIPIENT CAPTURE */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-0.5">
                <span className="text-xs font-extrabold text-gray-500 uppercase tracking-widest">
                  Who receives this?
                </span>
                {isHashtagRecipient && (
                  <span className="text-[9px] font-extrabold text-[#FE6349] bg-rose-50 px-2 rounded-full uppercase">Global Tag</span>
                )}
              </div>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="Full Name (or #hashtag tag)"
                className="w-full bg-gray-50 border-none rounded-2xl py-3.5 px-4 text-sm text-[#1A1B25] placeholder-[#C1C7CF] focus:outline-none focus:ring-0 outline-none font-semibold"
              />
              {!recipient.trim() && (
                <p className="text-[9px] text-[#C1C7CF] font-bold pl-0.5">
                  💡 Falls back to curating securely on your public trophy board
                </p>
              )}
            </div>

            {/* C. SENDER SIGNATURE */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-gray-500 uppercase tracking-widest pl-0.5 block">
                Sender Signature Name
              </label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Defaults to 'Curator'"
                className="w-full bg-gray-50 border-none rounded-2xl py-3.5 px-4 text-sm text-[#1A1B25] placeholder-[#C1C7CF] focus:outline-none focus:ring-0 outline-none font-semibold"
              />
            </div>

            {/* D. THE GRAPHIC TEMPLATES & STICKERS */}
            <div className="grid grid-cols-2 gap-4 pt-1">
              <div className="space-y-2">
                <span className="text-xs font-extrabold text-gray-500 uppercase tracking-widest pl-0.5 block">Frame Frame</span>
                <div className="flex gap-2 items-center flex-wrap">
                  {FRAME_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      onClick={() => setSelectedFrame(tmpl)}
                      style={{ backgroundColor: tmpl.bgHex }}
                      className="w-7 h-7 rounded-full border border-gray-200 relative cursor-pointer flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                      title={tmpl.name}
                    >
                      {selectedFrame.id === tmpl.id && (
                        <div className="w-4 h-4 rounded-full bg-[#3BB88C] text-white flex items-center justify-center shadow-xs">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-extrabold text-gray-500 uppercase tracking-widest pl-0.5 block">Sticker Decor</span>
                <button
                  onClick={() => setIsStickerPickerOpen(!isStickerPickerOpen)}
                  className="w-full py-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-xs font-bold transition-all text-[#1A1B25] flex justify-between px-3 items-center"
                >
                  <span>{selectedSticker.emoji} {selectedSticker.label}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                {isStickerPickerOpen && (
                  <div className="absolute bg-white border border-gray-100 p-2 rounded-2xl shadow-xl grid grid-cols-3 gap-2.5 z-50">
                    {STICKER_LIST.map(st => (
                      <button
                        key={st.id}
                        onClick={() => {
                          setSelectedSticker(st);
                          setIsStickerPickerOpen(false);
                        }}
                        className="p-1 px-2.5 hover:bg-gray-50 rounded text-lg flex flex-col items-center"
                      >
                        <span>{st.emoji}</span>
                        <span className="text-[7.5px] font-bold text-gray-400 capitalize">{st.label.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Confetti Effect Trigger */}
            <div className="space-y-2 pt-1">
              <span className="text-xs font-extrabold text-gray-500 uppercase tracking-widest pl-0.5 block">Confetti Animation</span>
              <button
                type="button"
                onClick={() => setIsConfettiPickerOpen(true)}
                className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl text-xs font-bold transition-all text-[#1A1B25] flex justify-between px-3.5 items-center cursor-pointer border border-transparent hover:border-gray-200"
              >
                <span className="flex items-center gap-2">
                  <PartyPopper className="w-4 h-4 text-[#FE6349]" />
                  <span>Add Confetti Animation</span>
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* E. FONT */}
            <div>
              <div className="space-y-2">
                <span className="text-xs font-extrabold text-gray-500 uppercase tracking-widest pl-0.5 block">Typography</span>
                <button
                  onClick={() => setIsCursive(!isCursive)}
                  className="w-full py-2 px-3 bg-gray-50 hover:bg-gray-100 rounded-xl text-xs font-bold text-left flex justify-between items-center"
                >
                  <span className={isCursive ? 'handwriting text-sm font-extrabold' : 'font-semibold'}>
                    {isCursive ? 'Handwritten Font' : 'Clean Sans Font'}
                  </span>
                </button>
              </div>
            </div>

            {/* F. SEMANTIC SPECTRUM SELECTION */}
            <div className="space-y-2.5 pt-1">
              <span className="text-xs font-extrabold text-gray-500 uppercase tracking-widest pl-0.5 block">
                The Semantic Heart Spectrum
              </span>
              <div className="flex flex-wrap gap-2">
                {SEMANTIC_HEARTS.map((heart) => {
                  const isSelected = selectedHearts.includes(heart.id);
                  return (
                    <button
                      key={heart.id}
                      onClick={() => handleHeartToggle(heart.id)}
                      className="py-2 px-3.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 bg-[#F6F8FA] hover:bg-[#ECEFF3] text-[#1A1B25] cursor-pointer relative"
                    >
                      <span>{heart.emoji}</span>
                      <span>{heart.label}</span>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-[#3BB88C] text-white flex items-center justify-center shrink-0 ml-0.5 shadow-xs">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* G. PRIVACY LAYERS */}
            <div className="space-y-2 pt-1">
              <span className="text-xs font-extrabold text-gray-500 uppercase tracking-widest pl-0.5 block">
                Privacy Settings
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => { if (!isHashtagRecipient) setPrivacyLayer(PostVisibility.PUBLIC); }}
                  disabled={isHashtagRecipient}
                  className="py-3 px-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 bg-[#F6F8FA] hover:bg-[#ECEFF3] text-[#1A1B25] relative cursor-pointer disabled:opacity-50"
                >
                  {privacyLayer === PostVisibility.PUBLIC && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#3BB88C] text-white flex items-center justify-center shadow-xs">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                  <Globe className="w-4 h-4 text-[#353849]" />
                  <span>Public</span>
                </button>

                <button
                  onClick={() => { if (!isHashtagRecipient) setPrivacyLayer(PostVisibility.PRIVATE); }}
                  disabled={isHashtagRecipient}
                  className="py-3 px-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 bg-[#F6F8FA] hover:bg-[#ECEFF3] text-[#1A1B25] relative cursor-pointer disabled:opacity-50"
                >
                  {privacyLayer === PostVisibility.PRIVATE && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#3BB88C] text-white flex items-center justify-center shadow-xs">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                  <Lock className="w-4 h-4 text-[#353849]" />
                  <span>Private</span>
                </button>

                <button
                  onClick={() => { if (!isHashtagRecipient) setPrivacyLayer(PostVisibility.ANONYMOUS); }}
                  disabled={isHashtagRecipient}
                  className="py-3 px-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 bg-[#F6F8FA] hover:bg-[#ECEFF3] text-[#1A1B25] relative cursor-pointer disabled:opacity-40"
                >
                  {privacyLayer === PostVisibility.ANONYMOUS && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#3BB88C] text-white flex items-center justify-center shadow-xs">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                  <Smile className="w-4 h-4 text-[#353849]" />
                  <span>Anonymous</span>
                </button>
              </div>
            </div>

            {/* H. COAUTHOR & PLATFORM CAPPING */}
            <div className="p-4 bg-gray-50/50 rounded-2xl space-y-2.5 border border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-700">Coauthored mode</span>
                <span className="text-[10px] text-gray-400 font-bold">20/Card Slot Free limit</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="drawer-collab"
                    checked={isCollaborative}
                    onChange={(e) => setIsCollaborative(e.target.checked)}
                    className="w-4 h-4 rounded text-[#FE6349] focus:ring-[#FE6349] border-gray-300"
                  />
                  <label htmlFor="drawer-collab" className="text-xs font-semibold text-gray-600 cursor-pointer">
                    Enable Community contributions
                  </label>
                </div>
                {isCollaborative && (
                  <button
                    onClick={() => setIsPremiumUnlocked(!isPremiumUnlocked)}
                    className={`text-[9px] font-extrabold uppercase px-2 py-1 rounded-full transition-all ${isPremiumUnlocked ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-100 text-amber-700'}`}
                  >
                    {isPremiumUnlocked ? '✨ Infinite slots' : 'Upgrade Slot ($4.99)'}
                  </button>
                )}
              </div>
            </div>

            {/* ERROR REPORTING */}
            {moderationError && (
              <p className="text-center text-xs font-extrabold text-red-500 animate-pulse bg-red-50 p-2.5 rounded-xl border border-red-100">
                {moderationError}
              </p>
            )}

            {/* CORE ACTIONS */}
            <div className="pt-2 flex gap-3 select-none">
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="w-1/3 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl font-bold text-sm transition-all active:scale-95"
              >
                Apply Styles
              </button>
              
              <button
                onClick={handlePublish}
                disabled={isModerating}
                className="flex-grow py-3.5 bg-[#FE6349] hover:opacity-95 text-white rounded-2xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {isModerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <span>Publish & Send card</span>
                    <Sparkles className="w-4 h-4 fill-white" />
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 5. EXPANDED FULL-PAGE WORKSPACE EDITOR (Matches attached design image input_file_0.png) */}
      {isExpanded && (
        <div className="fixed inset-0 z-[3000] bg-[#FCF9F8] flex flex-col font-sans select-none overflow-hidden animate-fade-in-slow">
          
          {/* A. TOP HEADER */}
          <div className="bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between relative shrink-0">
            {/* Left close button */}
            <button 
              onClick={() => {
                if (isContributorFlow) {
                  onClose();
                } else {
                  setIsExpanded(false);
                }
              }}
              className="text-[#1A1B25] hover:bg-black/5 p-2 rounded-full transition-all active:scale-95 cursor-pointer"
              aria-label="Close editor"
            >
              <X className="w-6 h-6 stroke-[2]" />
            </button>

            <h2 className="text-xl font-bold text-[#1A1B25] tracking-tight">
              {isEditingContributor ? 'Edit message' : isContributorFlow ? 'Add a message' : editMode === 'message' ? 'Edit message' : 'Drop a message'}
            </h2>

            {/* Right Save / Publish Action - Send Icon Only */}
            <div className="flex items-center">
              {isContributorFlow ? (
                <button 
                  type="button"
                  onClick={handleFinalSubmitMessage}
                  disabled={!hasCanvaContent || isModerating}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    !hasCanvaContent || isModerating
                      ? 'bg-[#F1E4DF] text-[#A49893] cursor-not-allowed shadow-none opacity-60'
                      : 'bg-[#FE6349] hover:bg-[#e05234] text-white shadow-xs active:scale-95 cursor-pointer'
                  }`}
                  aria-label="Publish message"
                  title={!hasCanvaContent ? "Add content to the Canva to publish" : "Publish message"}
                >
                  {isModerating ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-5 h-5 -translate-x-0.5" />
                  )}
                </button>
              ) : (
                <button 
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-[#FE6349] hover:bg-[#e05234] text-white shadow-xs active:scale-95 cursor-pointer transition-all"
                  aria-label="Save message"
                  title="Save message"
                >
                  <Send className="w-5 h-5 -translate-x-0.5" />
                </button>
              )}
            </div>
          </div>

          {/* C. DISTRACTION-FREE CANVAS WORKSPACE */}
          <div className="flex-grow w-full flex flex-col items-center justify-center p-4 relative overflow-hidden">
            
            {/* Outer frame matching default frame dimensions exactly */}
            <div 
              style={{ 
                backgroundColor: (activeType === 'audio' || activeType === 'video') ? '#ffffff' : selectedFrame.bgHex,
                height: 'min(480px, 65vh)'
              }}
              className="relative w-full max-w-[461px] rounded-[2rem] sm:rounded-[2.5rem] transition-all duration-300 flex items-center justify-center p-4 sm:p-6 select-none shadow-sm"
            >
              {/* Slanted background layers for collaborative boards strictly matching reference design */}
              {boardCapacity !== 'solo' && (
                <div className="absolute pointer-events-none origin-center w-[254px] h-[350px]">
                  <div className="absolute inset-0 w-full h-full bg-white/20 rounded-[1.8rem] -rotate-[3.5deg] transform origin-center" />
                  <div className="absolute inset-0 w-full h-full bg-white/20 rounded-[1.8rem] rotate-[3.5deg] transform origin-center" />
                </div>
              )}

              {/* Inner white card canvas */}
              <div 
                onClick={() => {
                  setSelectedElementId(null);
                  if (canvasElements.length === 0 && activeType === 'text') {
                    handleAddTextElement();
                  }
                }}
                className="rounded-[1.8rem] sm:rounded-[2.2rem] bg-white flex flex-col justify-between relative p-4 sm:p-6 transition-all duration-300 shadow-xs max-w-full max-h-full w-[254px] h-[350px] overflow-hidden cursor-pointer z-10"
              >
                {/* Confetti Animation Overlay */}
                <ConfettiOverlay type={selectedConfetti} />
                {/* Full Canvas Layer: Treats entire component as canvas area with zero internal clipping bounds */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center z-10">
                  {activeType === 'text' && (
                    <>
                      {(() => {
                        const visibleElements = canvasElements.filter(hasElementContent);
                        if (visibleElements.length === 0) {
                          return (
                            <div className="text-center w-full px-4 space-y-0.5 py-1 pointer-events-none">
                              <h3 className="text-[15px] font-semibold text-gray-600 tracking-tight">
                                Tap to create message
                              </h3>
                              <p className="text-[11px] text-[#808897] font-semibold">
                                {isContributorFlow ? "Add your tribute to this board" : "Create beautiful message with stunning visuals"}
                              </p>
                            </div>
                          );
                        }
                        return visibleElements.map((el) => (
                          <RenderCanvasElement
                            key={el.id}
                            el={el}
                            isSelected={selectedElementId === el.id}
                            onSelect={(id) => setSelectedElementId(id)}
                            onEdit={(id) => setEditingElementId(id)}
                            onUpdate={updateCanvasElement}
                          />
                        ));
                      })()}
                    </>
                  )}
                </div>

                {/* Recipient tag */}
                <div className="w-full flex justify-end items-center pr-1 relative z-20 pointer-events-none select-none">
                  {activeType === 'text' && recipient.trim() ? (
                    <span className="text-[10px] font-extrabold text-[#A4ABB8] uppercase tracking-wider bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100 max-w-[130px] truncate pointer-events-auto">
                      {recipient}
                    </span>
                  ) : (
                    <div className="h-6" />
                  )}
                </div>

                {/* Central placeholder for audio/video if active */}
                <div className="flex-grow flex flex-col items-center justify-center text-center py-2 relative z-0 w-full gap-2 pointer-events-none">
                  {activeType === 'audio' && (
                    <div className="w-full flex flex-col items-center justify-center gap-2 select-none">
                      <Mic className="w-12 h-12 stroke-[1.5]" style={{ color: '#EED8CE' }} />
                      <h3 className="text-base font-semibold text-[#272835]">Audio coming soon</h3>
                    </div>
                  )}

                  {activeType === 'video' && (
                    <div className="w-full flex flex-col items-center justify-center gap-2 select-none">
                      <Video className="w-12 h-12 stroke-[1.5]" style={{ color: '#EED8CE' }} />
                      <h3 className="text-base font-semibold text-[#272835]">Video coming soon</h3>
                    </div>
                  )}
                </div>

                {/* Card footer */}
                {activeType === 'text' ? (
                  <div className="w-full flex justify-between items-center select-none pt-1 relative z-20 pointer-events-none">
                    <span className="text-[9px] font-extrabold text-gray-300 uppercase tracking-widest">
                      {authorName.trim() ? `By ${authorName}` : ''}
                    </span>
                    {selectedHearts.length > 0 && (
                      <div className="flex gap-1 bg-gray-50/70 p-1.5 rounded-full">
                        {selectedHearts.map(id => (
                          <span key={id} className="text-xs">
                            {SEMANTIC_HEARTS.find(h => h.id === id)?.emoji}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-4" />
                )}
              </div>
            </div>

          </div>

          {/* D. BOTTOM EDITING CONTROLS BAR (Exclusive to Text tab) */}
          {activeType === 'text' && (
            <div className="w-full pb-8 pt-2 px-6 flex flex-col items-center gap-3 shrink-0">
              
              {/* Row of tool buttons with equal width, height, and space distribution matching message board width */}
              <div className="grid grid-flow-col auto-cols-fr items-center justify-center gap-2 sm:gap-2.5 w-full max-w-[380px] py-1 px-0">
                {/* 1. Image */}
                <button
                  type="button"
                  onClick={handleAddImageElement}
                  className="w-full h-[58px] bg-white border border-dashed border-gray-200/80 hover:bg-gray-50 rounded-2xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 text-[#1A1B25]"
                  title="Add new Image element"
                >
                  <ImageIcon className="w-4 h-4 text-[#1A1B25]" />
                  <span className="text-[11px] font-medium text-gray-700">Image</span>
                </button>

                {/* 2. Text */}
                <button
                  type="button"
                  onClick={handleAddTextElement}
                  className="w-full h-[58px] bg-white border border-dashed border-gray-200/80 hover:bg-gray-50 rounded-2xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 text-[#1A1B25]"
                  title="Add new Text element"
                >
                  <Type className="w-4 h-4 text-[#1A1B25]" />
                  <span className="text-[11px] font-medium text-gray-700">Text</span>
                </button>

                {/* 3. Vector */}
                <button
                  type="button"
                  onClick={handleAddVectorElement}
                  className="w-full h-[58px] bg-white border border-dashed border-gray-200/80 hover:bg-gray-50 rounded-2xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 text-[#1A1B25]"
                  title="Add new Vector element"
                >
                  <Sparkles className="w-4 h-4 text-[#1A1B25]" />
                  <span className="text-[11px] font-medium text-gray-700">Vector</span>
                </button>

                {/* 4. BG (Only for main board, hidden for contributions to ensure visual consistency) */}
                {!isContributorFlow && (
                  <button
                    type="button"
                    onClick={handleAddBgElement}
                    className="w-full h-[58px] bg-white border border-dashed border-gray-200/80 hover:bg-gray-50 rounded-2xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 text-[#1A1B25]"
                    title="Add new BG element"
                  >
                    <Palette className="w-4 h-4 text-[#1A1B25]" />
                    <span className="text-[11px] font-medium text-gray-700">BG</span>
                  </button>
                )}

                {/* 5. Confetti / Pop */}
                <button
                  type="button"
                  onClick={() => setIsConfettiPickerOpen(true)}
                  className="w-full h-[58px] bg-white border border-dashed border-gray-200/80 hover:bg-gray-50 rounded-2xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 text-[#1A1B25]"
                  title="Choose Confetti Animation"
                >
                  <PartyPopper className="w-4 h-4 text-[#1A1B25]" />
                  <span className="text-[11px] font-medium text-gray-700">
                    pop
                  </span>
                </button>
              </div>

              {/* Moderation Error Display */}
              {moderationError && (
                <div className="text-center text-xs font-bold text-red-500 bg-red-50 px-4 py-2 rounded-xl border border-red-100 mt-1 max-w-sm animate-pulse">
                  {moderationError}
                </div>
              )}
            </div>
          )}

          {/* EDIT ELEMENT POP-UP MODAL */}
          {editingElement && (
            <div 
              className="fixed inset-0 z-[4000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in"
              onClick={(e) => {
                if (e.target === e.currentTarget) setEditingElementId(null);
              }}
            >
              {editingElement.type === 'vector' ? (
                <VectorPicker
                  selectedIconId={editingElement.vectorId || 'heart'}
                  vectorColor={editingElement.vectorColor || '#272835'}
                  onSelectVector={(item) => {
                    updateEditingElement({
                      vectorId: item.id,
                      vectorName: item.name,
                    });
                  }}
                  onColorChange={(color) => {
                    updateEditingElement({
                      vectorColor: color,
                    });
                  }}
                  onDelete={() => handleDeleteElement(editingElement.id)}
                  onClose={() => setEditingElementId(null)}
                  onContinue={() => setEditingElementId(null)}
                />
              ) : (
                <div className="bg-white rounded-[1.8rem] sm:rounded-[2.5rem] max-w-md w-full max-h-[90dvh] sm:max-h-[85vh] shadow-2xl flex flex-col relative animate-in zoom-in-95 duration-200 font-sans overflow-hidden my-auto select-none">
                
                {/* Sticky Top Header */}
                <div className="px-5 sm:px-6 pt-5 pb-3 bg-white border-b border-[#ECEFF3] flex items-center justify-between shrink-0 sticky top-0 z-10">
                  <h3 className="text-xl font-bold text-[#1A1B25]">
                    {editingElement.type === 'text' ? 'Text' : editingElement.type === 'bg' ? 'Background' : editingElement.type.charAt(0).toUpperCase() + editingElement.type.slice(1)}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleDeleteElement(editingElement.id)}
                      className="w-9 h-9 rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 transition-all cursor-pointer"
                      title="Delete element"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingElementId(null)}
                      className="w-9 h-9 rounded-full flex items-center justify-center text-gray-700 hover:text-[#1A1B25] hover:bg-gray-100 transition-all cursor-pointer"
                      title="Close"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Content based on element type - scrollable body */}
                <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-3.5 min-h-0 scrollbar-thin">
                  {editingElement.type === 'text' && (
                    <div className="flex flex-col gap-3.5">
                      {/* Main Text Input Box with internal Template & Refine toolbar */}
                      <div className={`bg-[#F6F8FA] rounded-2xl p-4 flex flex-col justify-between relative border border-transparent focus-within:border-gray-200/80 transition-all ${activeAccordion === 'template' ? 'min-h-[330px]' : 'min-h-[210px]'}`}>
                        <textarea
                          value={editingElement.text || ''}
                          onChange={(e) => {
                            const txt = e.target.value.slice(0, 250);
                            updateEditingElement({ text: txt });
                            setContent(txt);
                          }}
                          placeholder="Type here......"
                          style={{
                            fontFamily: editingElement.fontFamily || (editingElement.isCursive ? 'Playfair Display, cursive' : 'Nunito, sans-serif'),
                            color: editingElement.color || '#1A1B25',
                            textAlign: editingElement.align || 'left',
                          }}
                          className="w-full h-28 bg-transparent text-[#1A1B25] text-base font-medium placeholder:text-gray-400 placeholder:font-normal focus:outline-none resize-none border-none p-0"
                        />

                        {/* Templates Popup Drawer */}
                        {activeAccordion === 'template' && (
                          <div className="absolute inset-0 bg-white/98 backdrop-blur-md rounded-2xl p-3 sm:p-4 shadow-xl z-30 flex flex-col border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
                            {!selectedTemplateCategoryId ? (
                              /* Categories View (Show Categories First) */
                              <div className="flex flex-col h-full">
                                <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100 shrink-0">
                                  <div>
                                    <h4 className="text-xs font-extrabold text-[#1A1B25]">
                                      Message Templates
                                    </h4>
                                    <p className="text-[11px] text-[#666D80] font-medium">
                                      Select a category to explore pre-written messages
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setActiveAccordion(null)}
                                    className="text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>

                                <div className="flex-grow overflow-y-auto pr-1 grid grid-cols-2 gap-2 scrollbar-thin">
                                  {TEMPLATE_CATEGORIES.map((cat) => (
                                    <button
                                      key={cat.id}
                                      type="button"
                                      onClick={() => setSelectedTemplateCategoryId(cat.id)}
                                      className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8F9FB] hover:bg-[#ECEFF3] active:scale-[0.98] text-[#1A1B25] transition-all cursor-pointer text-left group border border-transparent hover:border-gray-200/50"
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <span className="text-base shrink-0">{cat.icon}</span>
                                        <span className="text-xs font-bold truncate text-[#1A1B25]">{cat.name}</span>
                                      </div>
                                      <span className="text-[10px] font-bold text-[#666D80] bg-white px-1.5 py-0.5 rounded-full shadow-2xs group-hover:text-[#1A1B25] shrink-0">
                                        {cat.templates.length}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              /* Selected Category View (List of Pre-Written Messages) */
                              (() => {
                                const activeCat = TEMPLATE_CATEGORIES.find(c => c.id === selectedTemplateCategoryId) || TEMPLATE_CATEGORIES[0];
                                return (
                                  <div className="flex flex-col h-full">
                                    {/* Header with Back button and Category title */}
                                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => setSelectedTemplateCategoryId(null)}
                                        className="flex items-center gap-1 text-xs font-bold text-[#FE6349] hover:text-[#e05234] transition-colors p-0.5 rounded-lg hover:bg-orange-50 cursor-pointer"
                                      >
                                        <ChevronLeft className="w-4 h-4" />
                                        <span>All Categories</span>
                                      </button>
                                      
                                      <div className="flex items-center gap-1.5 font-bold text-xs text-[#1A1B25]">
                                        <span>{activeCat.icon}</span>
                                        <span>{activeCat.name}</span>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => setActiveAccordion(null)}
                                        className="text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>

                                    {/* Category horizontal switcher for quick jumping */}
                                    <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar-none shrink-0 border-b border-gray-100">
                                      {TEMPLATE_CATEGORIES.map((cat) => (
                                        <button
                                          key={cat.id}
                                          type="button"
                                          onClick={() => setSelectedTemplateCategoryId(cat.id)}
                                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                                            cat.id === activeCat.id
                                              ? 'bg-[#1A1B25] text-white shadow-xs'
                                              : 'bg-[#F8F9FB] text-[#666D80] hover:bg-[#ECEFF3] hover:text-[#1A1B25]'
                                          }`}
                                        >
                                          <span>{cat.icon}</span>
                                          <span>{cat.name}</span>
                                        </button>
                                      ))}
                                    </div>

                                    {/* Messages under this category */}
                                    <div className="flex-grow overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                                      {activeCat.templates.map((tmpl, idx) => (
                                        <button
                                          key={idx}
                                          type="button"
                                          onClick={() => {
                                            updateEditingElement({ text: tmpl });
                                            setContent(tmpl);
                                            setActiveAccordion(null);
                                          }}
                                          className="w-full text-left p-3 rounded-xl text-xs font-medium text-[#1A1B25] bg-[#F8F9FB] hover:bg-orange-50/90 hover:text-[#FE6349] transition-all cursor-pointer border border-transparent hover:border-orange-200 flex items-start gap-2.5 group shadow-2xs"
                                        >
                                          <span className="text-[#FE6349] font-serif font-bold text-sm shrink-0 leading-none mt-0.5">“</span>
                                          <span className="flex-1 leading-relaxed">{tmpl}</span>
                                          <span className="text-[10px] font-bold text-[#FE6349] bg-orange-100/70 px-2 py-0.5 rounded-full shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                            Use
                                          </span>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })()
                            )}
                          </div>
                        )}

                        {/* Bottom Toolbar inside Text Area */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-200/50">
                          <button
                            type="button"
                            onClick={() => toggleAccordion('template')}
                            className={`bg-white hover:bg-gray-50 text-[#1A1B25] font-semibold text-xs px-4 py-1.5 rounded-full shadow-2xs border transition-all cursor-pointer ${
                              activeAccordion === 'template' ? 'border-[#FF6B4A] text-[#FF6B4A]' : 'border-gray-200/80'
                            }`}
                          >
                            Template
                          </button>

                          <button
                            type="button"
                            disabled={isRefining || !editingElement.text?.trim()}
                            onClick={async () => {
                              if (!editingElement.text?.trim()) return;
                              setIsRefining(true);
                              try {
                                const refined = await refineText(editingElement.text);
                                if (refined) {
                                  updateEditingElement({ text: refined });
                                  setContent(refined);
                                }
                              } catch (err) {
                                console.error("Refine error:", err);
                              } finally {
                                setIsRefining(false);
                              }
                            }}
                            className="bg-white hover:bg-rose-50 text-[#1A1B25] font-bold text-xs px-3.5 py-1.5 rounded-full shadow-2xs border border-rose-200/80 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 active:scale-95 text-rose-600"
                          >
                            {isRefining ? (
                              <Loader2 className="w-3.5 h-3.5 text-[#FF6B4A] animate-spin" />
                            ) : (
                              <Sparkles className="w-3.5 h-3.5 text-[#FF6B4A]" />
                            )}
                            <span>{isRefining ? 'Refining...' : 'Refine'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Select Font Accordion Card */}
                      <div className="bg-[#F6F8FA] rounded-2xl p-4 flex flex-col gap-2 transition-all">
                        <div 
                          onClick={() => toggleAccordion('font')}
                          className="flex items-center justify-between cursor-pointer select-none"
                        >
                          <span className="text-sm font-bold text-[#1A1B25]">Select Font</span>
                          <div className="flex items-center gap-2">
                            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${activeAccordion === 'font' ? 'rotate-180' : ''}`} />
                          </div>
                        </div>

                        {activeAccordion === 'font' && (
                          <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-gray-200/60 animate-in fade-in duration-150">
                            {FONT_OPTIONS.map((f) => {
                              const isSelected = editingElement.fontFamily === f.font || (!editingElement.fontFamily && f.id === 'nunito');
                              return (
                                <button
                                  key={f.id}
                                  type="button"
                                  onClick={() => {
                                    const isCurs = f.id === 'playfair' || f.id === 'caveat';
                                    updateEditingElement({ fontFamily: f.font, isCursive: isCurs });
                                    setIsCursive(isCurs);
                                  }}
                                  style={{ fontFamily: f.font }}
                                  className="p-2.5 rounded-xl text-xs font-bold text-center transition-all bg-white text-gray-800 hover:bg-gray-50 relative flex items-center justify-center cursor-pointer shadow-2xs"
                                >
                                  <span>{f.name}</span>
                                  {isSelected && (
                                    <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#3BB88C] text-white flex items-center justify-center shadow-xs">
                                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Alignment Option Card */}
                      <div className="bg-[#F6F8FA] rounded-2xl p-4 flex items-center justify-between">
                        <span className="text-sm font-bold text-[#1A1B25]">Alignment</span>
                        <div className="flex items-center gap-1.5 bg-gray-200/40 p-1 rounded-xl">
                          <button
                            type="button"
                            onClick={() => updateEditingElement({ align: 'left' })}
                            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                              (editingElement.align || 'left') === 'left' ? 'bg-white text-[#1A1B25] shadow-xs' : 'text-gray-400 hover:text-gray-700'
                            }`}
                            title="Left Align"
                          >
                            <AlignLeft className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => updateEditingElement({ align: 'center' })}
                            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                              editingElement.align === 'center' ? 'bg-white text-[#1A1B25] shadow-xs' : 'text-gray-400 hover:text-gray-700'
                            }`}
                            title="Center Align"
                          >
                            <AlignCenter className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => updateEditingElement({ align: 'right' })}
                            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                              editingElement.align === 'right' ? 'bg-white text-[#1A1B25] shadow-xs' : 'text-gray-400 hover:text-gray-700'
                            }`}
                            title="Right Align"
                          >
                            <AlignRight className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => updateEditingElement({ align: 'justify' })}
                            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                              editingElement.align === 'justify' ? 'bg-white text-[#1A1B25] shadow-xs' : 'text-gray-400 hover:text-gray-700'
                            }`}
                            title="Justify Align"
                          >
                            <AlignJustify className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Choose Colour Accordion Card */}
                      <ChooseColor
                        label="Choose Colour"
                        selectedColor={editingElement.color || '#1A1B25'}
                        onChangeColor={(hex) => updateEditingElement({ color: hex })}
                        isOpen={activeAccordion === 'color'}
                        onToggleOpen={() => toggleAccordion('color')}
                      />
                    </div>
                  )}

                  {editingElement.type === 'image' && (
                  <div className="flex flex-col gap-3.5">
                    {/* Image Preview Box */}
                    <div className="bg-[#F8F9FB] rounded-2xl h-[180px] flex flex-col items-center justify-center p-3 text-center overflow-hidden relative">
                      {editingElement.imageUrl ? (
                        <img 
                          src={editingElement.imageUrl} 
                          alt="Uploaded" 
                          style={{
                            borderRadius: `${editingElement.cornerRadius || 0}px`,
                            border: editingElement.strokeEnabled ? `${editingElement.strokeWidth ?? 3}px solid ${editingElement.strokeColor || '#FF6B4A'}` : 'none',
                          }}
                          className="max-h-full max-w-full object-contain shadow-xs transition-all" 
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-2 text-gray-400">
                          <ImageIcon className="w-8 h-8 stroke-[1.5]" />
                          <span className="text-sm font-medium text-gray-400">No image uploaded yet</span>
                        </div>
                      )}
                    </div>

                    {/* Image Controls Section */}
                    <div className="flex flex-col gap-3 bg-[#F6F8FA] p-3.5 rounded-2xl">
                      
                      {/* 1. Corner Radius Control */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#1A1B25]">Corner Radius</span>
                          <span className="text-xs font-bold text-gray-600 bg-white px-2 py-0.5 rounded-md shadow-2xs">
                            {editingElement.cornerRadius || 0}px
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="40"
                          value={editingElement.cornerRadius || 0}
                          onChange={(e) => updateEditingElement({ cornerRadius: Number(e.target.value) })}
                          className="w-full accent-[#FF6B4A] cursor-pointer h-1.5 bg-gray-200 rounded-lg appearance-none"
                        />
                      </div>

                      <div className="w-full h-px bg-gray-200/60" />

                      {/* 2. Stroke / Outline Control */}
                      <div className="flex flex-col gap-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#1A1B25]">Stroke / Outline</span>
                          <button
                            type="button"
                            onClick={() => updateEditingElement({ strokeEnabled: !editingElement.strokeEnabled })}
                            className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors cursor-pointer ${
                              editingElement.strokeEnabled ? 'bg-[#FF6B4A]' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                                editingElement.strokeEnabled ? 'translate-x-5' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>

                        {editingElement.strokeEnabled && (
                          <div className="flex flex-col gap-2.5 pt-1 animate-in fade-in duration-150">
                            {/* Stroke Color Picker */}
                            <ChooseColor
                              label="Stroke Color"
                              selectedColor={editingElement.strokeColor || '#FF6B4A'}
                              onChangeColor={(hex) => updateEditingElement({ strokeColor: hex })}
                              isAccordion={false}
                            />

                            {/* Stroke Weight Slider */}
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-semibold text-gray-500">Stroke Weight</span>
                                <span className="text-xs font-bold text-gray-600 bg-white px-2 py-0.5 rounded-md shadow-2xs">
                                  {editingElement.strokeWidth ?? 3}px
                                </span>
                              </div>
                              <input
                                type="range"
                                min="1"
                                max="16"
                                value={editingElement.strokeWidth ?? 3}
                                onChange={(e) => updateEditingElement({ strokeWidth: Number(e.target.value) })}
                                className="w-full accent-[#FF6B4A] cursor-pointer h-1.5 bg-gray-200 rounded-lg appearance-none"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                    </div>

                    {/* Change / Upload Image */}
                    <label className="w-full py-3 bg-[#ffffff] border border-[#F6F8FA] outline outline-1 outline-[#F6F8FA] hover:bg-gray-50 text-[#1A1B25] font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99] shadow-2xs">
                      <Upload className="w-4 h-4 text-[#1A1B25]" />
                      <span>{editingElement.imageUrl ? 'Change Image' : 'Upload Image'}</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              const imgUrl = reader.result as string;
                              updateEditingElement({ imageUrl: imgUrl });
                              setUploadedImage(imgUrl);
                            };
                            reader.readAsDataURL(file);
                          }
                        }} 
                        className="hidden" 
                      />
                    </label>

                    </div>
                  )}

                  {editingElement.type === 'bg' && (
                    <div className="flex flex-col gap-3">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Select Canvas Theme</span>
                      <div className="grid grid-cols-2 gap-3 p-1">
                        {FRAME_TEMPLATES.map((frame) => {
                          const isSelected = (editingElement.bgHex || selectedFrame.bgHex) === frame.bgHex;
                          return (
                            <button
                              key={frame.id}
                              type="button"
                              onClick={() => {
                                updateEditingElement({ bgHex: frame.bgHex, frameName: frame.name });
                                setSelectedFrame(frame);
                              }}
                              className="h-16 rounded-2xl transition-all flex flex-col items-center justify-center p-2 cursor-pointer relative hover:scale-102"
                              style={{ backgroundColor: frame.bgHex }}
                            >
                              <span className={`text-xs font-bold ${frame.id === 'slate' ? 'text-white' : 'text-gray-800'}`}>{frame.name}</span>
                              {isSelected && (
                                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#3BB88C] text-white flex items-center justify-center shadow-xs">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>

                {/* Sticky CTA Section */}
                <div className="shrink-0 p-4 sm:p-5 bg-[#F6F8FA] border-t border-[#ECEFF3] sticky bottom-0 z-10 rounded-b-[1.8rem] sm:rounded-b-[2.5rem]">
                  <button
                    type="button"
                    onClick={() => setEditingElementId(null)}
                    className="w-full py-3.5 sm:py-4 bg-[#FF6B4A] hover:bg-[#ff5833] active:bg-[#e05234] text-white font-bold text-base rounded-full shadow-xs transition-all cursor-pointer active:scale-[0.99] text-center"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}
            </div>
          )}

        </div>
      )}

      {/* Hidden file input for image tool button */}
      <input 
        ref={imageInputRef}
        type="file" 
        accept="image/*" 
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
              const imgUrl = reader.result as string;
              updateEditingElement({ imageUrl: imgUrl });
              setUploadedImage(imgUrl);
            };
            reader.readAsDataURL(file);
          }
        }} 
        className="hidden" 
      />

      {/* CONFETTI PICKER POP-UP MODAL */}
      {isConfettiPickerOpen && (
        <ConfettiPickerModal
          selectedConfetti={selectedConfetti}
          onSelectConfetti={(type) => setSelectedConfetti(type)}
          onClose={() => setIsConfettiPickerOpen(false)}
        />
      )}

      {/* 6. MESSAGE PREVIEW PAGE (Matches attached design image) */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-[5000] bg-[#FCF9F8] flex flex-col font-sans select-none overflow-hidden animate-fade-in antialiased h-full">
          {/* Top Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-100/80 flex items-center justify-between shrink-0 sticky top-0 z-10">
            <button
              type="button"
              onClick={() => setIsPreviewOpen(false)}
              className="text-[#1A1B25] hover:bg-gray-100 p-2 rounded-full transition-all cursor-pointer active:scale-95"
              aria-label="Close preview"
            >
              <X className="w-6 h-6 stroke-[2]" />
            </button>

            <h2 className="text-xl font-bold text-[#1A1B25] tracking-tight">
              Message Preview
            </h2>

            <div className="w-10" />
          </div>

          {/* Body content wrapper */}
          <div className="flex-1 w-full flex flex-col items-center justify-center p-2 sm:p-6 overflow-hidden my-auto">
            <div className="max-w-[420px] w-full h-full max-h-[calc(100vh-80px)] bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col font-sans relative overflow-hidden">
              
              {/* Scrollable Content Body */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3.5 scrollbar-none">
                {/* Message Visual Card Frame */}
                <div
                  style={{ backgroundColor: selectedFrame.bgHex }}
                  className="w-full aspect-[380/474] sm:h-[404px] sm:aspect-auto rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-8 flex items-center justify-center relative overflow-hidden shadow-2xs transition-all shrink-0"
                >
                  <CanvasReadOnlyCard
                    canvasElements={canvasElements}
                    selectedConfetti={selectedConfetti}
                    content={content}
                    uploadedImage={uploadedImage}
                    authorName={authorName}
                    recipient={recipient}
                    selectedHearts={selectedHearts}
                    activeType={activeType}
                    isCollaborative={boardCapacity !== 'solo'}
                  />
                </div>

                {/* 1. Caption Input */}
                <div className="bg-[#F6F8FA] rounded-2xl px-4 py-3 flex items-center border border-transparent focus-within:border-gray-200 transition-all">
                  <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Caption"
                    className="w-full bg-transparent text-sm text-[#1A1B25] placeholder:text-gray-400 focus:outline-none border-none p-0 font-normal"
                  />
                </div>

                {/* 2. Select Event Dropdown Accordion */}
                <div className="bg-[#F6F8FA] rounded-2xl overflow-hidden transition-all duration-200 border border-transparent">
                  <button
                    type="button"
                    onClick={() => setIsEventDropdownOpen(!isEventDropdownOpen)}
                    className="w-full px-4 py-3.5 flex items-center justify-between transition-colors cursor-pointer text-left hover:bg-gray-100/50"
                  >
                    <span className={`text-sm ${selectedEventType ? 'text-[#1A1B25] font-medium' : 'text-gray-400 font-normal'}`}>
                      {selectedEventType || 'Select event'}
                    </span>
                    <ChevronRight className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${isEventDropdownOpen ? 'rotate-90' : ''}`} />
                  </button>

                  {isEventDropdownOpen && (
                    <div className="px-3 pb-3 pt-1 border-t border-gray-200/50 grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                      {EVENT_TYPES.map((evt) => {
                        const isSelected = selectedEventType === evt;
                        return (
                          <button
                            key={evt}
                            type="button"
                            onClick={() => {
                              setSelectedEventType(isSelected ? '' : evt);
                              setIsEventDropdownOpen(false);
                            }}
                            className="bg-white rounded-2xl p-3 flex items-center gap-2.5 transition-all cursor-pointer border-0 text-left shadow-2xs hover:bg-gray-50/80 active:scale-[0.98]"
                          >
                            {isSelected ? (
                              <div className="w-5 h-5 rounded-full bg-[#3BB88C] text-white flex items-center justify-center shrink-0">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full border-2 border-gray-300 shrink-0" />
                            )}
                            <span className="text-xs font-medium text-gray-700">
                              {evt}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 3. Recipients Input Tag Box with Suggestion Pop-up */}
                <div className="relative">
                  {/* Recipient Suggestion Pop-up */}
                  {(isRecipientSuggestionsOpen || newRecipientInput.trim().length > 0) && (
                    <div 
                      className="absolute bottom-full mb-2.5 left-0 right-0 z-50 bg-white rounded-[1.8rem] p-4 shadow-[0_12px_36px_rgba(0,0,0,0.12)] border border-gray-100/90 space-y-3 max-h-72 overflow-y-auto animate-in fade-in zoom-in-95 duration-150"
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      {/* 1. User section (Hidden if typing # for hashtags only) */}
                      {!isHashtagSearch && (
                        <div className="space-y-1.5">
                          <div className="text-xs font-semibold text-[#808897] px-2">User</div>
                          {matchingRegisteredUsers.length > 0 ? (
                            <div className="space-y-0.5">
                              {matchingRegisteredUsers.map((user) => (
                                <button
                                  type="button"
                                  key={user.id}
                                  onClick={() => handleSelectRegisteredUser(user)}
                                  className="w-full flex items-center gap-3 p-2 hover:bg-[#F6F8FA] rounded-2xl transition-colors text-left cursor-pointer group"
                                >
                                  <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-gray-100 border border-gray-100 flex items-center justify-center">
                                    {user.avatar ? (
                                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <User className="w-4 h-4 text-gray-500" />
                                    )}
                                  </div>
                                  <span className="text-sm font-bold text-[#1A1B25] group-hover:text-[#FE6349] transition-colors truncate">
                                    {user.name}
                                  </span>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-gray-400 px-2 py-1">No matching registered user</div>
                          )}
                        </div>
                      )}

                      {/* 2. #Tag section */}
                      <div className="space-y-1.5">
                        <div className="text-xs font-semibold text-[#808897] px-2">#Tag</div>
                        {matchingHashtagsList.length > 0 ? (
                          <div className="space-y-0.5">
                            {matchingHashtagsList.map((tag) => (
                              <button
                                type="button"
                                key={tag}
                                onClick={() => handleSelectHashtag(tag)}
                                className="w-full flex items-center gap-3 p-2 hover:bg-[#F6F8FA] rounded-2xl transition-colors text-left cursor-pointer group"
                              >
                                <div className="w-8 h-8 rounded-full bg-[#ECEFF3] flex items-center justify-center text-gray-500 shrink-0">
                                  <Hash className="w-4 h-4 text-[#808897]" />
                                </div>
                                <span className="text-sm font-bold text-[#1A1B25] group-hover:text-[#FE6349] transition-colors truncate">
                                  {tag.startsWith('#') ? tag : `#${tag}`}
                                </span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400 px-2 py-1">Type to create a hashtag</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Input Box and Chips */}
                  <div 
                    className="bg-[#F6F8FA] rounded-2xl p-2.5 sm:p-3 flex flex-wrap items-center gap-1.5 sm:gap-2 border border-transparent focus-within:border-gray-200 transition-all min-h-[48px] h-auto overflow-hidden cursor-text"
                    onClick={(e) => {
                      const input = e.currentTarget.querySelector('input');
                      if (input && e.target !== input) {
                        input.focus();
                      }
                    }}
                  >
                    {recipients.map((rec) => (
                      <span
                        key={rec}
                        className="bg-white text-xs font-medium text-[#1A1B25] px-2.5 py-1 rounded-full border border-gray-200/60 flex items-center gap-1 shadow-2xs shrink-0 max-w-full truncate animate-in fade-in duration-150"
                      >
                        <span className="truncate max-w-[160px]">{rec}</span>
                        {rec !== '@you' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const remaining = recipients.filter(r => r !== rec);
                              setRecipients(remaining);
                              if (recipient === rec) {
                                const nextRec = remaining.find(r => r !== '@you' && !r.startsWith('#')) || '';
                                setRecipient(nextRec);
                              }
                            }}
                            className="text-gray-400 hover:text-gray-600 p-0.5 rounded-full shrink-0 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </span>
                    ))}
                    <input
                      type="text"
                      value={newRecipientInput}
                      onChange={(e) => {
                        setNewRecipientInput(e.target.value);
                        setIsRecipientSuggestionsOpen(true);
                      }}
                      onFocus={() => setIsRecipientSuggestionsOpen(true)}
                      onBlur={() => {
                        setTimeout(() => setIsRecipientSuggestionsOpen(false), 200);
                      }}
                      onKeyDown={handleRecipientKeyDown}
                      placeholder="Add more recipient..."
                      className="flex-1 min-w-[120px] bg-transparent text-sm text-[#1A1B25] placeholder:text-gray-400 focus:outline-none border-none p-1 font-normal"
                    />
                  </div>
                </div>

                {/* 4. Select Board Capacity Accordion */}
                <div className="bg-[#F6F8FA] rounded-2xl overflow-hidden transition-all duration-200 border border-transparent">
                  <button
                    type="button"
                    onClick={() => setIsCapacityModalOpen(!isCapacityModalOpen)}
                    className="w-full px-4 py-3.5 flex items-center justify-between transition-colors cursor-pointer text-left hover:bg-gray-100/50"
                  >
                    <span className="text-sm font-normal text-[#1A1B25]">Select board capacity</span>
                    <span className="text-sm font-normal text-gray-500 flex items-center gap-1">
                      {boardCapacity === 'collaborative' ? '20 Contributions (Free)' : 'Only Me (1 message)'}
                      <ChevronRight className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${isCapacityModalOpen ? 'rotate-90' : ''}`} />
                    </span>
                  </button>

                  {isCapacityModalOpen && (
                    <div className="px-3 pb-3 pt-1 border-t border-gray-200/50 flex flex-col gap-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                      {/* Option 1: Only Me */}
                      <button
                        type="button"
                        onClick={() => {
                          setBoardCapacity('solo');
                          setIsCapacityModalOpen(false);
                        }}
                        className="w-full bg-white rounded-2xl p-3.5 flex items-center justify-between transition-all cursor-pointer border-0 text-left hover:bg-gray-50/80 active:scale-[0.99] shadow-2xs"
                      >
                        <div className="flex items-center gap-3">
                          {boardCapacity === 'solo' ? (
                            <div className="w-5 h-5 rounded-full bg-[#3BB88C] text-white flex items-center justify-center shrink-0">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-gray-300 shrink-0" />
                          )}
                          <div>
                            <span className="text-sm font-medium text-[#1A1B25]">Only Me</span>
                            <p className="text-xs text-gray-400 mt-0.5">1 message total</p>
                          </div>
                        </div>
                      </button>

                      {/* Option 2: 20 Contributions (Free) */}
                      <button
                        type="button"
                        onClick={() => {
                          setBoardCapacity('collaborative');
                          setIsCapacityModalOpen(false);
                        }}
                        className="w-full bg-white rounded-2xl p-3.5 flex items-center justify-between transition-all cursor-pointer border-0 text-left hover:bg-gray-50/80 active:scale-[0.99] shadow-2xs"
                      >
                        <div className="flex items-center gap-3">
                          {boardCapacity === 'collaborative' ? (
                            <div className="w-5 h-5 rounded-full bg-[#3BB88C] text-white flex items-center justify-center shrink-0">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-gray-300 shrink-0" />
                          )}
                          <div>
                            <span className="text-sm font-medium text-[#1A1B25]">20 Contributions (Free)</span>
                            <p className="text-xs text-gray-400 mt-0.5">20 messages total</p>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-[#1A1B25]">Free</span>
                      </button>

                      {/* Option 3: 200 Contributions */}
                      <div className="w-full bg-white rounded-2xl p-3.5 flex items-center justify-between border-0 text-left shadow-2xs opacity-60">
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full border-2 border-gray-300 shrink-0" />
                          <div>
                            <span className="text-sm font-medium text-gray-400">200 Contributions</span>
                            <p className="text-xs text-gray-300 mt-0.5">200 messages total</p>
                          </div>
                        </div>
                        <span className="bg-[#ECEFF3] text-[#666D80] text-[11px] font-semibold px-2.5 py-1 rounded-full">Paid Option</span>
                      </div>

                      {/* Option 4: 1,000 Contributions */}
                      <div className="w-full bg-white rounded-2xl p-3.5 flex items-center justify-between border-0 text-left shadow-2xs opacity-60">
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full border-2 border-gray-300 shrink-0" />
                          <div>
                            <span className="text-sm font-medium text-gray-400">1,000 Contributions</span>
                            <p className="text-xs text-gray-300 mt-0.5">1,000 messages total</p>
                          </div>
                        </div>
                        <span className="bg-[#ECEFF3] text-[#666D80] text-[11px] font-semibold px-2.5 py-1 rounded-full">Paid Option</span>
                      </div>

                      {/* Option 5: Unlimited */}
                      <div className="w-full bg-white rounded-2xl p-3.5 flex items-center justify-between border-0 text-left shadow-2xs opacity-60">
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full border-2 border-gray-300 shrink-0" />
                          <div>
                            <span className="text-sm font-medium text-gray-400">Unlimited</span>
                            <p className="text-xs text-gray-300 mt-0.5">Unlimited messages</p>
                          </div>
                        </div>
                        <span className="bg-[#ECEFF3] text-[#666D80] text-[11px] font-semibold px-2.5 py-1 rounded-full">Paid Option</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 5. Privacy Settings Accordion */}
                <div className="bg-[#F6F8FA] rounded-2xl overflow-hidden transition-all duration-200 border border-transparent">
                  <button
                    type="button"
                    onClick={() => setIsPrivacyModalOpen(!isPrivacyModalOpen)}
                    className="w-full px-4 py-3.5 flex items-center justify-between transition-colors cursor-pointer text-left hover:bg-gray-100/50"
                  >
                    <span className="text-sm font-normal text-[#1A1B25]">Privacy</span>
                    <span className="text-sm font-normal text-gray-500 flex items-center gap-1">
                      {privacyLayer === PostVisibility.PUBLIC ? 'Public' :
                       privacyLayer === PostVisibility.PRIVATE ? 'Recipient Only' : 'Public (Anonymous)'}
                      <ChevronRight className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${isPrivacyModalOpen ? 'rotate-90' : ''}`} />
                    </span>
                  </button>

                  {isPrivacyModalOpen && (
                    <div className="px-3 pb-3 pt-1 border-t border-gray-200/50 flex flex-col gap-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                      {/* Public */}
                      <button
                        type="button"
                        onClick={() => {
                          setPrivacyLayer(PostVisibility.PUBLIC);
                          setIsPrivacyModalOpen(false);
                        }}
                        className="w-full bg-white rounded-2xl p-3.5 flex items-center justify-between transition-all cursor-pointer border-0 text-left hover:bg-gray-50/80 active:scale-[0.99] shadow-2xs"
                      >
                        <div className="flex items-center gap-3">
                          {privacyLayer === PostVisibility.PUBLIC ? (
                            <div className="w-5 h-5 rounded-full bg-[#3BB88C] text-white flex items-center justify-center shrink-0">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-gray-300 shrink-0" />
                          )}
                          <div>
                            <p className="text-sm font-medium text-[#1A1B25]">Public</p>
                            <p className="text-xs text-gray-400 mt-0.5">Visible to everyone.</p>
                          </div>
                        </div>
                      </button>

                      {/* Recipient Only */}
                      <button
                        type="button"
                        onClick={() => {
                          setPrivacyLayer(PostVisibility.PRIVATE);
                          setIsPrivacyModalOpen(false);
                        }}
                        className="w-full bg-white rounded-2xl p-3.5 flex items-center justify-between transition-all cursor-pointer border-0 text-left hover:bg-gray-50/80 active:scale-[0.99] shadow-2xs"
                      >
                        <div className="flex items-center gap-3">
                          {privacyLayer === PostVisibility.PRIVATE ? (
                            <div className="w-5 h-5 rounded-full bg-[#3BB88C] text-white flex items-center justify-center shrink-0">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-gray-300 shrink-0" />
                          )}
                          <div>
                            <p className="text-sm font-medium text-[#1A1B25]">Recipient Only</p>
                            <p className="text-xs text-gray-400 mt-0.5">Only creator and selected recipients can view it.</p>
                          </div>
                        </div>
                      </button>

                      {/* Public (Anonymous) */}
                      <button
                        type="button"
                        onClick={() => {
                          setPrivacyLayer(PostVisibility.ANONYMOUS);
                          setIsPrivacyModalOpen(false);
                        }}
                        className="w-full bg-white rounded-2xl p-3.5 flex items-center justify-between transition-all cursor-pointer border-0 text-left hover:bg-gray-50/80 active:scale-[0.99] shadow-2xs"
                      >
                        <div className="flex items-center gap-3">
                          {privacyLayer === PostVisibility.ANONYMOUS ? (
                            <div className="w-5 h-5 rounded-full bg-[#3BB88C] text-white flex items-center justify-center shrink-0">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-gray-300 shrink-0" />
                          )}
                          <div>
                            <p className="text-sm font-medium text-[#1A1B25]">Public (Anonymous)</p>
                            <p className="text-xs text-gray-400 mt-0.5">Visible to everyone, but display creator as “Anon”.</p>
                          </div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>

                {/* Error reporting */}
                {moderationError && (
                  <p className="text-center text-xs font-extrabold text-red-500 animate-pulse bg-red-50 p-2.5 rounded-xl border border-red-100">
                    {moderationError}
                  </p>
                )}
              </div>

              {/* Fixed CTA Footer Section */}
              <div className="p-4 sm:p-5 bg-[#F6F8FA] border-t border-[#ECEFF3] shrink-0 sticky bottom-0 z-20">
                <button
                  type="button"
                  onClick={handleFinalSubmitMessage}
                  disabled={isModerating || !selectedEventType}
                  className={`w-full font-medium text-base py-3.5 sm:py-4 rounded-full transition-all shadow-xs flex items-center justify-center gap-2 ${
                    !selectedEventType || isModerating
                      ? 'bg-[#F8CBBF] text-white opacity-60 cursor-not-allowed'
                      : 'bg-[#FE6349] hover:bg-[#e05234] text-white cursor-pointer active:scale-[0.98]'
                  }`}
                >
                  {isModerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <span>Send Message</span>
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Full Page Confirmation Screen for Published Appreciation Card */}
      {createdPostConfirmation && (
        <div className="fixed inset-0 z-[6000] bg-[#FCF9F8] flex flex-col items-center justify-between p-4 sm:p-8 overflow-y-auto animate-in fade-in duration-300 min-h-screen">
          <ConfettiOverlay active={true} type={createdPostConfirmation.confetti || "heart"} />
          
          <div className="w-full max-w-[440px] flex flex-col items-center justify-between min-h-[92vh] sm:min-h-[85vh] my-auto relative z-10 py-2 sm:py-0">
            {/* Close Button Top Right */}
            <div className="w-full flex justify-end mb-3 sm:mb-4">
              <button
                type="button"
                onClick={() => {
                  setCreatedPostConfirmation(null);
                  setIsPreviewOpen(false);
                  onClose();
                }}
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#F0F2F5] hover:bg-[#E4E7EB] text-[#666D80] flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
              >
                <X className="w-5 h-5" strokeWidth={2.5} />
              </button>
            </div>

            {/* Main Card */}
            <div className="w-full bg-white rounded-[2.5rem] p-6 sm:p-8 flex flex-col items-center text-center shadow-xs border border-gray-100/60">
              {/* Circular Envelope Icon Top */}
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-[#FAF0EC] flex items-center justify-center mb-6 relative shadow-xs">
                <svg width="68" height="68" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-xs">
                  {/* Back paper sheet poking out */}
                  <rect x="18" y="14" width="36" height="30" rx="4" fill="#FFFFFF" />
                  {/* Heart on top of paper sheet */}
                  <path d="M36 29C36 29 29 23.5 29 19.8C29 17.7 30.7 16 32.8 16C34.2 16 35.3 16.7 36 17.5C36.7 16.7 37.8 16 39.2 16C41.3 16 43 17.7 43 19.8C43 23.5 36 29 36 29Z" fill="#E52E40" />

                  {/* Envelope back interior */}
                  <path d="M12 28L36 14L60 28" fill="#FCA5A5" opacity="0.4" />

                  {/* Envelope Main Body */}
                  <path d="M10 26C10 23.7909 11.7909 22 14 22H58C60.2091 22 62 23.7909 62 26V49C62 51.7614 59.7614 54 57 54H15C12.2386 54 10 51.7614 10 49V26Z" fill="#E52E40" />

                  {/* Envelope Side Flaps / Folds */}
                  <path d="M10 26L36 43L62 26" stroke="#C51E30" strokeWidth="2.5" strokeLinejoin="round" />
                  <path d="M10 54L28 37" stroke="#C51E30" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M62 54L44 37" stroke="#C51E30" strokeWidth="2.5" strokeLinecap="round" />

                  {/* Bottom fold fill / shaded flap */}
                  <path d="M10 26L36 43L62 26V49C62 51.7614 59.7614 54 57 54H15C12.2386 54 10 51.7614 10 49V26Z" fill="#DC2626" opacity="0.35" />

                  {/* Central Heart Seal Badge */}
                  <circle cx="36" cy="36" r="9.5" fill="#FFFFFF" />
                  <path d="M36 41C36 41 31 37.2 31 34.2C31 32.5 32.3 31.2 34 31.2C35.1 31.2 35.9 31.8 36 32.4C36.1 31.8 36.9 31.2 38 31.2C39.7 31.2 41 32.5 41 34.2C41 37.2 36 41 36 41Z" fill="#E52E40" />
                </svg>
              </div>

              {/* Heading */}
              <h2 className="text-2xl sm:text-[28px] font-extrabold text-[#1A1B25] tracking-tight mb-2">
                Appreciation Sent
              </h2>

              {/* Subtitle */}
              <p className="text-sm sm:text-base font-normal text-[#666D80] max-w-sm mb-6 leading-relaxed">
                Your heartfelt has been published and delivered to{' '}
                <strong className="text-[#1A1B25] font-bold">
                  {(() => {
                    if (Array.isArray(createdPostConfirmation.recipients) && createdPostConfirmation.recipients.length > 0) {
                      return createdPostConfirmation.recipients.map((r: string) => r.startsWith('@') || r.startsWith('#') ? r : `@${r}`).join(' ');
                    }
                    if (createdPostConfirmation.targetId) {
                      return createdPostConfirmation.targetId.startsWith('@') || createdPostConfirmation.targetId.startsWith('#')
                        ? createdPostConfirmation.targetId
                        : `@${createdPostConfirmation.targetId}`;
                    }
                    if (createdPostConfirmation.recipientName) {
                      return `@${createdPostConfirmation.recipientName.replace(/\s+/g, '').toLowerCase()}`;
                    }
                    return '@you @james';
                  })()}
                </strong>
              </p>

              {/* Details Summary Container */}
              <div className="w-full bg-[#FAF9F8] rounded-3xl p-5 sm:p-6 space-y-3.5 text-left">
                <div className="flex items-center justify-between text-sm sm:text-base">
                  <span className="text-[#808897] font-medium">Recipient</span>
                  <span className="text-[#1A1B25] font-bold truncate max-w-[200px] text-right">
                    {(() => {
                      if (Array.isArray(createdPostConfirmation.recipients) && createdPostConfirmation.recipients.length > 0) {
                        return createdPostConfirmation.recipients.map((r: string) => r.startsWith('@') || r.startsWith('#') ? r : `@${r}`).join(' ');
                      }
                      if (createdPostConfirmation.targetId) {
                        return createdPostConfirmation.targetId.startsWith('@') || createdPostConfirmation.targetId.startsWith('#')
                          ? createdPostConfirmation.targetId
                          : `@${createdPostConfirmation.targetId}`;
                      }
                      if (createdPostConfirmation.recipientName) {
                        return `@${createdPostConfirmation.recipientName.replace(/\s+/g, '').toLowerCase()}`;
                      }
                      return '@you @james';
                    })()}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm sm:text-base">
                  <span className="text-[#808897] font-medium">Visibility</span>
                  <span className="text-[#1A1B25] font-bold">
                    {privacyLayer === PostVisibility.PRIVATE ? 'Recipient Only (Private)' : privacyLayer === PostVisibility.ANONYMOUS ? 'Board (Anonymous)' : 'Board (Public)'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm sm:text-base">
                  <span className="text-[#808897] font-medium">Event Type</span>
                  <span className="text-[#1A1B25] font-bold capitalize">
                    {createdPostConfirmation.eventType || selectedEventType || 'Wedding'}
                  </span>
                </div>

                {/* Inner Pill Quote */}
                <div className="w-full bg-white rounded-2xl sm:rounded-3xl py-3.5 px-5 text-left mt-2 shadow-2xs border border-gray-100/40">
                  <p className="text-sm sm:text-base font-extrabold text-[#1A1B25] tracking-tight">
                    “{createdPostConfirmation.caption || createdPostConfirmation.content || 'Jesus is King'}”
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons Below Card */}
            <div className="w-full space-y-3 pt-6 sm:pt-6">
              <button
                type="button"
                onClick={() => {
                  setCreatedPostConfirmation(null);
                  setIsPreviewOpen(false);
                  onClose();
                }}
                className="w-full py-4 rounded-full bg-[#FE6349] hover:bg-[#e05234] text-white font-extrabold text-base shadow-xs active:scale-[0.98] transition-all cursor-pointer text-center"
              >
                View on Heartboard
              </button>
              <button
                type="button"
                onClick={() => {
                  setCreatedPostConfirmation(null);
                  setIsPreviewOpen(false);
                  setContent('');
                  setRecipient('');
                  setCaption('');
                }}
                className="w-full py-4 rounded-full bg-[#F0F4F8] hover:bg-[#E4E9F0] text-[#1A1B25] font-extrabold text-base transition-all active:scale-[0.98] cursor-pointer text-center"
              >
                Send another message
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
