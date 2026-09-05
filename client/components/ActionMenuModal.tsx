import React, { useState } from 'react';
import { Post, Contribution } from '../types';
import { Plus, Share2, Pencil, Trash2, X, AlertTriangle, MessageSquare } from 'lucide-react';

export interface ActionMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post;
  isCreator: boolean;
  userContributions: Contribution[];
  onAddPost: () => void;
  onShare: () => void;
  onEditBoard?: () => void;
  onDeleteBoard?: () => void;
  onEditMainMessage?: () => void;
  onDeleteMainMessage?: () => void;
  onEditContribution?: (contribution: Contribution) => void;
  onDeleteContribution?: (contribution: Contribution) => void;
}

export const ActionMenuModal: React.FC<ActionMenuModalProps> = ({
  isOpen,
  onClose,
  post,
  isCreator,
  userContributions = [],
  onAddPost,
  onShare,
  onEditBoard,
  onDeleteBoard,
  onEditMainMessage,
  onDeleteMainMessage,
  onEditContribution,
  onDeleteContribution
}) => {
  const [deleteTarget, setDeleteTarget] = useState<{ 
    type: 'board' | 'main_message' | 'contribution'; 
    item?: Contribution 
  } | null>(null);

  if (!isOpen) return null;

  const allContributions = post.contributions || [];
  const totalMessages = 1 + allContributions.length;
  const maxCapacity = post.maxCapacity || (post.boardCapacity === 'solo' ? 1 : 20);
  const isSolo = post.boardCapacity === 'solo' || maxCapacity === 1;

  // Frame Background resolution
  const getFrameBg = () => {
    const theme = post.theme || '';
    if (theme.startsWith('#')) return theme;
    if (theme.includes('bg-[')) {
      const match = theme.match(/bg-\[(#[0-9a-fA-F]+)\]/);
      if (match) return match[1];
    }
    if (theme.includes('slate') || theme.includes('272835')) return '#272835';
    if (theme.includes('mint') || theme.includes('ECEFE6')) return '#ECEFE6';
    if (theme.includes('sunset') || theme.includes('FAF5E8')) return '#FAF5E8';
    if (theme.includes('lavender') || theme.includes('EEF1FA')) return '#EEF1FA';
    if (theme.includes('peach') || theme.includes('F7F0ED') || theme.includes('FAF0EC')) return '#F7F0ED';
    return '#FEA735';
  };

  const frameBgColor = getFrameBg();

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'board') {
      onDeleteBoard?.();
    } else if (deleteTarget.type === 'main_message') {
      onDeleteMainMessage?.();
    } else if (deleteTarget.type === 'contribution' && deleteTarget.item) {
      onDeleteContribution?.(deleteTarget.item);
    }
    setDeleteTarget(null);
    onClose();
  };

  const hasEditActions = isCreator || userContributions.length > 0;

  return (
    <div 
      className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-[370px] bg-white rounded-[2rem] shadow-2xl relative animate-in zoom-in-95 duration-200 max-h-[600px] h-auto flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Delete Confirmation Overlay */}
        {deleteTarget && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-[2rem] p-6 flex flex-col items-center justify-center text-center z-30 animate-in fade-in duration-150">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-3">
              <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
            </div>
            <h4 className="text-base font-bold text-[#1A1B25] mb-1">
              {deleteTarget.type === 'board' 
                ? 'Delete Board?' 
                : deleteTarget.type === 'main_message' 
                  ? 'Delete Board Message?' 
                  : 'Delete Contributed Message?'}
            </h4>
            <p className="text-xs text-gray-500 font-medium max-w-[250px] mb-5 leading-relaxed">
              {deleteTarget.type === 'board' 
                ? "This will permanently remove the board and all its contributions." 
                : deleteTarget.type === 'main_message'
                  ? "This will permanently remove the creator's main board message."
                  : "This will permanently remove your contribution from this board."}
            </p>
            <div className="flex items-center gap-3 w-full">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-full bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        )}

        {/* Sticky Header */}
        <div className="sticky top-0 z-20 bg-white px-6 pt-6 pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold text-[#1A1B25] tracking-tight">
                Action Menu
              </h3>
              <p className="text-xs font-medium text-gray-400 mt-0.5">
                {isSolo ? 'Board capacity: 1/1 (Solo)' : `Board capacity: ${totalMessages}/${maxCapacity}`}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* Top Action Buttons (Grid 2 columns) */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                onClose();
                onAddPost();
              }}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#F6F8FA] hover:bg-[#ECEFF3] text-[#1A1B25] text-xs font-bold transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Post</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onShare();
              }}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#F6F8FA] hover:bg-[#ECEFF3] text-[#1A1B25] text-xs font-bold transition-all active:scale-95 cursor-pointer"
            >
              <Share2 className="w-4 h-4 stroke-[2]" />
              <span>Share</span>
            </button>
          </div>

          {/* Edit Actions Section */}
          {hasEditActions && (
            <div className="space-y-3">
              <h4 className="text-[11px] font-extrabold text-[#808897] tracking-wider uppercase mb-2">
                EDIT ACTIONS
              </h4>

              {/* 1. Board Row (Creator Only) */}
              {isCreator && (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F6F8FA] hover:bg-[#ECEFF3]/70 transition-all">
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div 
                      style={{ backgroundColor: frameBgColor }}
                      className="w-11 h-14 rounded-xl flex items-center justify-center p-1 shadow-2xs shrink-0"
                    >
                      <div className="w-full h-full bg-white rounded-lg p-0.5 flex flex-col justify-center items-center overflow-hidden">
                        <div className="w-4 h-0.5 bg-gray-300 rounded-full mb-0.5" />
                        <div className="w-3 h-0.5 bg-gray-200 rounded-full" />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-bold text-[#1A1B25] block leading-tight">
                        Board
                      </span>
                      <span className="text-[11px] text-gray-400 font-medium truncate block mt-0.5">
                        Settings & cover
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onEditBoard?.();
                      }}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[#808897] hover:text-[#1A1B25] hover:bg-black/5 transition-all cursor-pointer"
                      title="Edit Board"
                    >
                      <Pencil className="w-4 h-4 stroke-[2]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget({ type: 'board' })}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[#808897] hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer"
                      title="Delete Board"
                    >
                      <Trash2 className="w-4 h-4 stroke-[2]" />
                    </button>
                  </div>
                </div>
              )}

              {/* 2. Main Message Row (Creator Only) */}
              {isCreator && (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F6F8FA] hover:bg-[#ECEFF3]/70 transition-all">
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="w-11 h-14 rounded-xl bg-[#FAF5E8] flex items-center justify-center p-1 shadow-2xs shrink-0 border border-amber-200/50">
                      <div className="w-full h-full bg-white rounded-lg p-0.5 flex flex-col justify-center items-center overflow-hidden">
                        <div className="w-4 h-0.5 bg-amber-400 rounded-full mb-0.5" />
                        <div className="w-3 h-0.5 bg-gray-300 rounded-full" />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-bold text-[#1A1B25] block leading-tight">
                        Message
                      </span>
                      <span className="text-[11px] text-gray-400 font-medium truncate block mt-0.5">
                        {post.content ? (post.content.length > 22 ? `${post.content.slice(0, 22)}...` : post.content) : 'Main tribute'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onEditMainMessage?.();
                      }}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[#808897] hover:text-[#1A1B25] hover:bg-black/5 transition-all cursor-pointer"
                      title="Edit Message"
                    >
                      <Pencil className="w-4 h-4 stroke-[2]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget({ type: 'main_message' })}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[#808897] hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer"
                      title="Delete Message"
                    >
                      <Trash2 className="w-4 h-4 stroke-[2]" />
                    </button>
                  </div>
                </div>
              )}

              {/* 3. All Contributed Messages Created by User on this Board */}
              {userContributions.map((contrib, idx) => {
                const snippet = contrib.content 
                  ? (contrib.content.length > 22 ? `${contrib.content.slice(0, 22)}...` : contrib.content)
                  : contrib.caption 
                    ? (contrib.caption.length > 22 ? `${contrib.caption.slice(0, 22)}...` : contrib.caption)
                    : 'Tribute message';

                const title = userContributions.length > 1 
                  ? `Message (${idx + 1})` 
                  : 'Message';

                return (
                  <div 
                    key={contrib.id || `user-contrib-${idx}`} 
                    className="flex items-center justify-between p-3 rounded-2xl bg-[#F6F8FA] hover:bg-[#ECEFF3]/70 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      {contrib.imageUrl ? (
                        <div className="w-11 h-14 rounded-xl overflow-hidden shadow-2xs shrink-0 border border-gray-200">
                          <img 
                            src={contrib.imageUrl} 
                            alt="preview" 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover" 
                          />
                        </div>
                      ) : (
                        <div className="w-11 h-14 rounded-xl bg-[#FAF0EC] flex items-center justify-center p-1 shadow-2xs shrink-0 border border-orange-200/50">
                          <div className="w-full h-full bg-white rounded-lg p-0.5 flex flex-col justify-center items-center overflow-hidden">
                            <MessageSquare className="w-3.5 h-3.5 text-[#FE6349] mb-0.5" />
                            <div className="w-3 h-0.5 bg-gray-200 rounded-full" />
                          </div>
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="text-sm font-bold text-[#1A1B25] block leading-tight">
                          {title}
                        </span>
                        <span className="text-[11px] text-gray-400 font-medium truncate block mt-0.5">
                          {snippet}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onEditContribution?.(contrib);
                        }}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[#808897] hover:text-[#1A1B25] hover:bg-black/5 transition-all cursor-pointer"
                        title="Edit Contribution"
                      >
                        <Pencil className="w-4 h-4 stroke-[2]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget({ type: 'contribution', item: contrib })}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[#808897] hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer"
                        title="Delete Contribution"
                      >
                        <Trash2 className="w-4 h-4 stroke-[2]" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
