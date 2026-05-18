import React, { useState, useEffect, useCallback, useRef } from 'react'
import BoardIcon from '../../assets/board icon.svg'
import styled from 'styled-components'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, useNavigate } from 'react-router-dom'
import {
  BsX, BsChevronLeft, BsChevronRight, BsCheckLg, BsCameraVideo,
  BsHeart, BsHandThumbsUp, BsEmojiSmile, BsStar,
  BsSun, BsFire, BsMusicNote, BsMusicNoteBeamed,
  BsHeadphones, BsTrophy, BsBalloon, BsGift,
  BsDiamond, BsAward, BsClock, BsBriefcase,
} from 'react-icons/bs'
import { AiOutlineAudio } from 'react-icons/ai'
import { PiPencilSimpleLineLight, PiPerspective, PiTextAUnderlineBold, PiRectangleDashed, PiImageBold } from 'react-icons/pi'
import { IoColorPaletteOutline } from 'react-icons/io5'
import { RiSketching } from 'react-icons/ri'

import { getBoardBySlug, updateBoard, invalidateBoardCaches } from '../../slices/boardSlice'
import { getBoardMessages, editMessage } from '../../slices/messageSlice'
import { uploadFile }                    from '../../slices/uploadSlice'
import { PRIVACY_OPTIONS }               from '../../slices/boardPaymentSlice'
import { EVENTS, EVENT_MAP }             from '../../constants/messageConstant'

import ImageModal          from '../../modals/ImageModal'
import TextModal           from '../../modals/TextModal'
import VectorModal         from '../../modals/VectorModal'
import EditVectorModal     from '../../modals/EditVectorModal'
import BgModal             from '../../modals/BgModal'
import FrameModal          from '../../modals/FrameModal'
import EventModal          from '../../modals/EventModal'
import DraggableCanvasItem from '../../canvas/DraggableCanvasItem'
import AudioTab            from '../../tab/AudioTab'
import TagInput            from '../../components/message/TagInput'
import useFonts            from '../../hooks/UseFonts'
import { invalidateMsgCache } from '../../utils/msgCache'
import { SuccessScreen } from '../../components/message/PreviewPanel'

const VECTOR_ICON_MAP = {
  heart:      BsHeart,      thumbsup:   BsHandThumbsUp,
  smile:      BsEmojiSmile, star:       BsStar,
  sun:        BsSun,        fire:       BsFire,
  music:      BsMusicNote,  music2:     BsMusicNoteBeamed,
  headphones: BsHeadphones, trophy:     BsTrophy,
  balloon:    BsBalloon,    gift:       BsGift,
  diamond:    BsDiamond,    award:      BsAward,
  clock:      BsClock,      briefcase:  BsBriefcase,
}

const EditBoardPage = () => {
  useFonts()

  const { slug }  = useParams()
  const navigate  = useNavigate()
  const dispatch  = useDispatch()

  const { board, boardLoad, boardError, updateBoardLoad } = useSelector(s => s.board)
  const { boardMessages, boardMessagesLoad, editMessageLoad } = useSelector(s => s.message)
  const { audioUploadLoad } = useSelector(s => s.upload)
  const { checkReceipentUser, receipentUser } = useSelector(s => s.user)

  const [activeTab, setActiveTab]         = useState('text')
  const [aspectRatio, setAspectRatio]     = useState('portrait')
  const [activeModal, setActiveModal]     = useState(null)
  const [selectedItem, setSelectedItem]   = useState(null)
  const [editingItemId, setEditingItemId] = useState(null)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [canvasExpanded, setCanvasExpanded] = useState(false)

  const [canvasBg, setCanvasBg]           = useState(null)
  const [canvasImages, setCanvasImages]   = useState([])
  const [canvasTexts, setCanvasTexts]     = useState([])
  const [canvasVectors, setCanvasVectors] = useState([])
  const [canvasFrame, setCanvasFrame]     = useState(null)
  const DEFAULT_FRAME = { style: 'solid', thickness: 16, radius: 16, color: '#111111', border: '16px solid #111111', borderRadius: '16px' }

  const [caption, setCaption]             = useState('')
  const [, setMentionedUser]              = useState(null)
  const [boardTags, setBoardTags]         = useState([])
  const [selectedPrivacy, setSelectedPrivacy] = useState(PRIVACY_OPTIONS[0])

  const [pendingAudioFile, setPendingAudioFile] = useState(null)
  const [saveError, setSaveError] = useState('')
  const [saved, setSaved]         = useState(false)

  useEffect(() => {
    if (slug) {
      dispatch(getBoardBySlug(slug))
      dispatch(getBoardMessages({ slug, page: 1, limit: 1 }))
    }
  }, [slug, dispatch])

  const hasSeeded = useRef(false)
  useEffect(() => {
    if (!board || boardMessagesLoad || hasSeeded.current) return
    hasSeeded.current = true

    setCaption(board.title || '')
    if (board.tags?.length) setBoardTags(board.tags)
    const privacy = PRIVACY_OPTIONS.find(p => p.value === board.visibility)
    if (privacy) setSelectedPrivacy(privacy)
    if (board.event) {
      const ev = EVENTS.find(e => EVENT_MAP[e.id] === board.event || e.id === board.event)
      if (ev) setSelectedEvent(ev)
    }

    const firstMsg = boardMessages?.[0]
    if (!firstMsg) return

    if (firstMsg.type === 'audio') { setActiveTab('audio'); return }

    const cd = firstMsg.canvasData
    if (!cd) return
    if (cd.aspectRatio) setAspectRatio(cd.aspectRatio)
    if (cd.canvasBg)    setCanvasBg(cd.canvasBg)
    if (cd.canvasFrame) setCanvasFrame(cd.canvasFrame)

    if (cd.canvasTexts?.length) {
      setCanvasTexts(cd.canvasTexts)
    } else if (cd.canvasText) {
      setCanvasTexts([{ ...cd.canvasText, id: Date.now() }])
    }

    if (cd.canvasImages?.length) {
      setCanvasImages(cd.canvasImages)
    } else if (cd.canvasImage) {
      setCanvasImages([{ id: 'img_0', src: cd.canvasImage, size: cd.imageSize ?? 80, position: cd.imagePosition ?? { x: 50, y: 50 } }])
    }

    if (cd.canvasVectors?.length) {
      setCanvasVectors(cd.canvasVectors.map(vec => {
        const iconId = vec.icon || vec.vectorId || vec.id
        return { ...vec, vectorId: iconId, icon: VECTOR_ICON_MAP[iconId] }
      }))
    } else if (cd.canvasVector) {
      const vec = cd.canvasVector
      const iconId = vec.icon || vec.vectorId || vec.id
      setCanvasVectors([{ ...vec, id: 'vec_0', vectorId: iconId, icon: VECTOR_ICON_MAP[iconId] }])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board?._id, boardMessagesLoad])

  const firstMessage = boardMessages?.[0] || null

  const tabs = [
    { id: 'audio', label: 'Audio', icon: <AiOutlineAudio /> },
    { id: 'text',  label: 'Text',  icon: <PiPencilSimpleLineLight /> },
    { id: 'video', label: 'Video', icon: <BsCameraVideo /> },
  ]

  const tools = [
    { id: 'image',  label: 'Image',  icon: <PiImageBold /> },
    { id: 'text',   label: 'Text',   icon: <PiTextAUnderlineBold /> },
    { id: 'vector', label: 'Vector', icon: <RiSketching /> },
    { id: 'bg',     label: 'BG',     icon: <IoColorPaletteOutline /> },
    { id: 'frame',  label: 'Frame',  icon: <PiRectangleDashed /> },
  ]

  const hasContent  = canvasBg || canvasImages.length > 0 || canvasTexts.length > 0 || canvasVectors.length > 0 || canvasFrame
  const activeFrame = canvasFrame || (hasContent ? DEFAULT_FRAME : null)
  const canvasStyle = { background: canvasBg ? canvasBg.value : '#FFFFFF' }
  const isWorking   = updateBoardLoad || editMessageLoad || audioUploadLoad
  const recipentOk  = !receipentUser || receipentUser.length === 0 || checkReceipentUser

  const handleToolClick = toolId => setActiveModal(toolId)

  const handleSave = useCallback(async () => {
    if (!board) return
    setSaveError('')
    try {
      const boardResult = await dispatch(updateBoard({
        id:         board._id,
        title:      caption.trim() || board.title,
        visibility: selectedPrivacy.value,
        tags:       boardTags,
        event:      selectedEvent?.id ? (EVENT_MAP[selectedEvent.id] ?? 'other') : board.event,
      })).unwrap()
      if (boardResult.status !== 'success') {
        setSaveError(boardResult.response?.message || 'Failed to update board'); return
      }

      if (firstMessage) {
        if (activeTab === 'audio' && pendingAudioFile) {
          const up = await dispatch(uploadFile({ file: pendingAudioFile, type: 'audio' })).unwrap()
          if (up.status !== 'success') { setSaveError(up.response?.message || 'Audio upload failed'); return }
          await dispatch(editMessage({
            id:                 firstMessage._id,
            content:            { audioUrl: up.response.url || up.response.secure_url, duration: null, text: null, imageUrls: [] },
            cloudinaryPublicId: up.response.public_id,
            fileType:           'audio',
          })).unwrap()
        } else if (activeTab === 'text' && hasContent) {
          await dispatch(editMessage({
            id: firstMessage._id,
            content: {
              text:       canvasTexts[0]?.content      || null,
              font:       canvasTexts[0]?.font?.family || null,
              color:      canvasTexts[0]?.color        || null,
              background: canvasBg?.value              || null,
              frame:      activeFrame ? `${activeFrame.thickness}px ${activeFrame.style} ${activeFrame.color}` : null,
              imageUrls:  [],
              vectorKey:  canvasVectors[0]?.vectorId   || null,
              audioUrl: null, duration: null,
            },
            canvasData: {
              canvasBg,
              canvasFrame: activeFrame,
              aspectRatio,
              canvasTexts,
              canvasVectors: canvasVectors.map(v => ({ ...v, icon: v.vectorId })),
              canvasImages,
            },
          })).unwrap()
        }
      }

      if (board._id) invalidateMsgCache(board._id)
      dispatch(invalidateBoardCaches())
      setSaved(true)
    } catch {
      setSaveError('Something went wrong. Please try again.')
    }
  }, [
    dispatch, board, caption, selectedPrivacy, boardTags, selectedEvent,
    firstMessage, activeTab, pendingAudioFile, hasContent,
    canvasTexts, canvasBg, canvasFrame, canvasVectors,
    canvasImages, aspectRatio, activeFrame,
  ])

  if (boardLoad) return <Wrapper><LoadMsg>Loading…</LoadMsg></Wrapper>
  if (boardError || !board) return <Wrapper><LoadMsg>Board not found.</LoadMsg></Wrapper>

  if (saved) {
    return (
      <SuccessScreen
        canvasData={pendingAudioFile ? null : {
          canvasTexts,
          canvasBg,
          canvasFrame: activeFrame,
          canvasVectors: canvasVectors.map(v => ({ ...v, icon: v.vectorId })),
          canvasImages,
          aspectRatio,
        }}
        isAudio={!!pendingAudioFile}
        boardSlug={slug}
        boardTitle={caption}
        messageCount={board?.stats?.messages ?? 0}
        onViewPost={() => navigate(`/board/${slug}`)}
        onDone={() => navigate(`/board/${slug}`)}
      />
    )
  }

  return (
    <Wrapper>
      <div className="page_header">
        <button className="close_btn" onClick={() => navigate(-1)}><BsX /></button>
        <h2 className="page_title">Edit Board</h2>
        <div className="tab_switcher">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab_btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}<span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="page_body">
        <ContentWrap>

          {activeTab !== 'video' && (
            <div className="select_row" onClick={() => setActiveModal('event')}>
              {selectedEvent ? (
                <>
                  <span className="select_event_emoji">{selectedEvent.emoji}</span>
                  <span className="select_value">{selectedEvent.label}</span>
                </>
              ) : (
                <span className="select_placeholder">Select Event</span>
              )}
              <BsChevronRight className="select_arrow" />
            </div>
          )}

          {activeTab !== 'video' && (
            <TagInput onMentionChange={setMentionedUser} onTagsChange={setBoardTags} />
          )}

          {activeTab !== 'video' && (
            <input
              className="caption_input"
              placeholder="Board title…"
              value={caption}
              onChange={e => setCaption(e.target.value)}
              maxLength={80}
            />
          )}

          {activeTab === 'text' && (
            <>
              {canvasExpanded && (
                <div className="expanded_header">
                  <button className="back_btn" onClick={() => setCanvasExpanded(false)}>
                    <BsChevronLeft />
                  </button>
                  <button className="save_btn" onClick={() => setCanvasExpanded(false)}>
                    Save
                  </button>
                </div>
              )}

              <div className="canvas_unit">
                {!canvasExpanded && (
                  <div className="aspect_header">
                    <span className="aspect_label"><PiPerspective /> Aspect Ratio</span>
                    <div className="ratio_toggles">
                      <button
                        className={`ratio_btn portrait_btn ${aspectRatio === 'portrait' ? 'active' : ''}`}
                        onClick={() => setAspectRatio('portrait')} title="Portrait"
                      >
                        {aspectRatio === 'portrait' && <span className="check_circle"><BsCheckLg /></span>}
                      </button>
                      <button
                        className={`ratio_btn landscape_btn ${aspectRatio === 'landscape' ? 'active' : ''}`}
                        onClick={() => setAspectRatio('landscape')} title="Landscape"
                      >
                        {aspectRatio === 'landscape' && <span className="check_circle"><BsCheckLg /></span>}
                      </button>
                    </div>
                  </div>
                )}

                <div className={`aspect_container${canvasExpanded ? ' expanded' : ''}`}>
                  <div className={`canvas_wrap${canvasExpanded ? ' expanded' : ''}`}>
                    {(() => {
                      const canvasContent = (
                        <>
                          {!hasContent && !canvasExpanded && (
                            <CanvasPlaceholder>
                              <img src={BoardIcon} alt="" className="placeholder_icon" />
                              <p className="placeholder_text">Tap to create a message</p>
                            </CanvasPlaceholder>
                          )}
                          {canvasImages.map(img => (
                            <DraggableCanvasItem
                              key={img.id}
                              position={img.position}
                              onPositionChange={pos => setCanvasImages(prev => prev.map(i => i.id === img.id ? { ...i, position: pos } : i))}
                              selected={selectedItem?.id === img.id}
                              onSelect={() => setSelectedItem({ type: 'image', id: img.id })}
                              onTap={() => { setEditingItemId(img.id); setActiveModal('editImage') }}
                            >
                              <div style={{ position: 'relative' }}>
                                <img src={img.src} alt="canvas" className="canvas_image" style={{ width: `${img.size * 2}px`, height: `${img.size * 2}px` }} />
                                <button className="remove_image_btn" onMouseDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); setCanvasImages(prev => prev.filter(i => i.id !== img.id)) }}><BsX /></button>
                                {selectedItem?.id === img.id && (
                                  <div className="image_resize_bar" onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
                                    <input type="range" min="30" max="180" step="2" value={img.size} onChange={e => setCanvasImages(prev => prev.map(i => i.id === img.id ? { ...i, size: Number(e.target.value) } : i))} />
                                  </div>
                                )}
                              </div>
                            </DraggableCanvasItem>
                          ))}
                          {canvasVectors.map(vec => {
                            const VIcon = vec.icon
                            return VIcon ? (
                              <DraggableCanvasItem
                                key={vec.id}
                                position={vec.position}
                                onPositionChange={pos => setCanvasVectors(prev => prev.map(v => v.id === vec.id ? { ...v, position: pos } : v))}
                                selected={selectedItem?.id === vec.id}
                                onSelect={() => setSelectedItem({ type: 'vector', id: vec.id })}
                                onTap={() => { setEditingItemId(vec.id); setActiveModal('editVector') }}
                              >
                                <VIcon style={{ color: vec.color, opacity: vec.opacity, fontSize: vec.size ?? 48, display: 'block' }} />
                              </DraggableCanvasItem>
                            ) : null
                          })}
                          {canvasTexts.map(txt => (
                            <DraggableCanvasItem
                              key={txt.id}
                              position={txt.position}
                              onPositionChange={pos => setCanvasTexts(prev => prev.map(t => t.id === txt.id ? { ...t, position: pos } : t))}
                              selected={selectedItem?.id === txt.id}
                              onSelect={() => setSelectedItem({ type: 'text', id: txt.id })}
                              onTap={() => { setEditingItemId(txt.id); setActiveModal('editText') }}
                            >
                              <p style={{ margin: 0, fontFamily: txt.font?.family, color: txt.color, fontSize: txt.fontSize ?? 16, maxWidth: 200, textAlign: txt.textAlign || 'center', lineHeight: 1.35, wordBreak: 'break-word', ...txt.font?.style }}>
                                {txt.content}
                              </p>
                            </DraggableCanvasItem>
                          ))}
                        </>
                      )

                      return activeFrame ? (
                        <CanvasFrameWrap
                          $ratio={aspectRatio}
                          $expanded={canvasExpanded}
                          style={{ background: activeFrame.color, padding: '20px', borderRadius: '32px' }}
                          data-canvas="true"
                        >
                          <CanvasArea $ratio={aspectRatio} $expanded={canvasExpanded} $inFrame style={canvasStyle} onClick={() => { setCanvasExpanded(true); setSelectedItem(null) }}>
                            {canvasContent}
                          </CanvasArea>
                        </CanvasFrameWrap>
                      ) : (
                        <CanvasArea $ratio={aspectRatio} $expanded={canvasExpanded} style={canvasStyle} data-canvas="true" onClick={() => { setCanvasExpanded(true); setSelectedItem(null) }}>
                          {canvasContent}
                        </CanvasArea>
                      )
                    })()}
                  </div>
                </div>
              </div>

              <div className="toolbar">
                {tools.map(tool => (
                  <button key={tool.id} className="tool_btn" onClick={() => handleToolClick(tool.id)}>
                    {tool.icon}<span>{tool.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {activeTab === 'audio' && (
            <AudioTab
              initialAudioUrl={firstMessage?.type === 'audio' ? firstMessage.content?.audioUrl : undefined}
              initialAudioName="Current audio"
              hideSendBtn
              onSend={audioFile => setPendingAudioFile(audioFile)}
            />
          )}

          {activeTab === 'video' && (
            <div style={{ padding: '2rem 0', textAlign: 'center', color: '#9CA3AF', fontSize: '0.9em' }}>
              Video messages coming soon
            </div>
          )}

          {saveError && <ErrorMsg>{saveError}</ErrorMsg>}

          {activeTab !== 'video' && !canvasExpanded && (
            <button
              className={`preview_btn ${!isWorking && !saved && recipentOk ? 'ready' : ''}`}
              disabled={isWorking || saved || !recipentOk}
              onClick={handleSave}
            >
              {isWorking ? 'Saving…' : 'Save Changes'}
            </button>
          )}

          {activeModal === 'event'      && <EventModal  onClose={() => setActiveModal(null)} currentEvent={selectedEvent} onConfirm={ev => { setSelectedEvent(ev); setActiveModal(null) }} />}
          {activeModal === 'image'      && <ImageModal  onClose={() => setActiveModal(null)} currentImage={null} onConfirm={src => { setCanvasImages(prev => [...prev, { id: Date.now(), src, size: 80, position: { x: 50, y: 50 } }]); setActiveModal(null) }} />}
          {activeModal === 'editImage'  && (() => { const img = canvasImages.find(i => i.id === editingItemId); return img ? <ImageModal onClose={() => setActiveModal(null)} currentImage={img.src} onConfirm={src => { setCanvasImages(prev => prev.map(i => i.id === editingItemId ? { ...i, src } : i)); setActiveModal(null) }} /> : null })()}
          {activeModal === 'text'       && <TextModal   onClose={() => setActiveModal(null)} currentText={null} onConfirm={t => { setCanvasTexts(prev => [...prev, { ...t, id: Date.now(), position: { x: 50, y: 50 } }]); setActiveModal(null) }} />}
          {activeModal === 'editText'   && (() => { const txt = canvasTexts.find(t => t.id === editingItemId); return txt ? <TextModal onClose={() => setActiveModal(null)} currentText={txt} onConfirm={t => { setCanvasTexts(prev => prev.map(item => item.id === editingItemId ? { ...item, ...t } : item)); setActiveModal(null) }} onRemove={() => { setCanvasTexts(prev => prev.filter(t => t.id !== editingItemId)); setSelectedItem(null); setActiveModal(null) }} /> : null })()}
          {activeModal === 'vector'     && <VectorModal onClose={() => setActiveModal(null)} onConfirm={v => { setCanvasVectors(prev => [...prev, { ...v, vectorId: v.id, id: Date.now(), size: 48, position: { x: 50, y: 30 } }]); setActiveModal(null) }} />}
          {activeModal === 'editVector' && (() => { const vec = canvasVectors.find(v => v.id === editingItemId); return vec ? <EditVectorModal onClose={() => setActiveModal(null)} vector={vec} onUpdate={updates => setCanvasVectors(prev => prev.map(v => v.id === editingItemId ? { ...v, ...updates } : v))} onRemove={() => { setCanvasVectors(prev => prev.filter(v => v.id !== editingItemId)); setActiveModal(null); setSelectedItem(null) }} /> : null })()}
          {activeModal === 'bg'         && <BgModal    onClose={() => setActiveModal(null)} currentBg={canvasBg}       onConfirm={bg    => { setCanvasBg(bg);       setActiveModal(null) }} />}
          {activeModal === 'frame'      && <FrameModal onClose={() => setActiveModal(null)} currentFrame={canvasFrame} onConfirm={frame => { setCanvasFrame(frame); setActiveModal(null) }} />}

        </ContentWrap>
      </div>
    </Wrapper>
  )
}

// ─── Styled Components ────────────────────────────────────────────────────────

const Wrapper = styled.div`
  width: 100vw;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #FCF9F8;

  .page_header {
    position: sticky; top: 0; z-index: 10;
    width: 100%;
    display: flex; flex-direction: column; align-items: center;
    padding: 1.5rem 1.5rem 0;
    background: #fff;
    border-bottom: 1px solid rgba(0,0,0,0.06);
    box-sizing: border-box;
  }

  .close_btn {
    position: absolute; left: 1.5rem; top: 1rem;
    width: 36px; height: 36px;
    border: none; background: transparent;
    display: flex; align-items: center; justify-content: center;
    font-size: 2em; color: var(--text-color, #111); cursor: pointer;
    transition: color 0.2s;
    &:hover { color: var(--primary-color, #EF5A42); }
  }

  .page_title {
    font-size: 1.3em; font-weight: 700; color: var(--text-color, #111);
    margin: 0 0 1rem 0;
  }

  .tab_switcher {
    display: flex; gap: 3rem; margin-top: 1rem;
  }

  .tab_btn {
    display: flex; align-items: center; justify-content: center;
    gap: 0.4rem; padding: 0.5rem 0; width: 100px;
    border: none; background: transparent;
    color: var(--light-text-color, #6B7280);
    font-size: 0.95em; cursor: pointer; transition: color 0.2s;
    border-bottom: 2px solid transparent;
    &.active { color: var(--text-color, #111); font-weight: 600; border-bottom-color: var(--text-color, #111); }
    svg { font-size: 1.1em; }
  }

  .page_body {
    flex: 1; display: flex; flex-direction: column; align-items: center;
    padding: 2rem 1rem 4rem; overflow-y: auto;
  }

  @media only screen and (max-width: 480px) {
    .tab_switcher {
      gap: 1.5rem;
    }
    .tab_btn {
      width: 80px;
    }
  }

  @media only screen and (min-width: 768px) {
    .page_body { justify-content: flex-start; }
  }
`

const ContentWrap = styled.div`
  display: flex; flex-direction: column; gap: 1rem;
  width: 100%; max-width: 480px; padding: 0 0.5rem;

  .expanded_header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .back_btn {
    width: 38px; height: 38px;
    border-radius: 50%; background: transparent; border: none;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.2em; color: #111; cursor: pointer;
  }

  .save_btn {
    height: 38px; padding: 0 1.25rem;
    border-radius: 25px; background: #fff; border: none;
    color: #111; font-size: 0.95em; font-weight: 600; cursor: pointer;
  }

  .select_row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 1rem; height: 50px;
    background: #F7F0ED; border-radius: 10px; border: none;
    cursor: pointer;
    .select_placeholder { font-size: 0.95em; color: #9CA3AF; flex: 1; }
    .select_event_emoji { font-size: 1.1em; margin-right: 0.5rem; flex-shrink: 0; }
    .select_value { flex: 1; font-size: 0.95em; font-weight: 500; color: var(--text-color, #111); }
    .select_arrow { color: #9CA3AF; font-size: 0.9em; flex-shrink: 0; }
  }

  .caption_input {
    width: 100%; height: 48px; padding: 0 1rem;
    border: none; border-radius: 10px;
    background: #F7F0ED; font-size: 0.95em; color: var(--text-color, #111);
    outline: none; box-sizing: border-box;
    &::placeholder { color: #9CA3AF; }
  }

  .canvas_unit {
    display: flex; flex-direction: column;
  }

  .aspect_header {
    background: #F1E5DF; border-radius: 12px 12px 0 0;
    padding: 0 1rem; height: 50px;
    display: flex; align-items: center; gap: 0.5rem;
    .aspect_label { flex: 1; font-size: 0.95em; font-weight: 500; color: var(--text-color, #111); display: flex; align-items: center; gap: 5px; }
    .ratio_toggles { display: flex; gap: 6px; align-items: center; }
    .ratio_btn {
      display: flex; align-items: center; justify-content: center;
      border: 1.5px solid #ECEFF3; background: #fff;
      cursor: pointer; border-radius: 5px; position: relative;
      transition: border-color 0.2s;
      &.portrait_btn  { width: 24px; height: 36px; }
      &.landscape_btn { width: 40px; height: 26px; }
      &.active { border-color: #ECEFF3; }
      &:hover:not(.active) { border-color: #D1D5DB; }
      .check_circle {
        width: 14px; height: 14px; border-radius: 50%;
        background: #22c55e;
        display: flex; align-items: center; justify-content: center;
        svg { color: #fff; font-size: 0.45em; }
      }
    }
  }

  .aspect_container {
    background: #F7F0ED; border-radius: 0 0 12px 12px; overflow: hidden;
    &.expanded { border-radius: 12px; }
  }

  .canvas_wrap {
    display: flex; justify-content: center;
    padding: 0.75rem 3rem 1rem;
    &.expanded { padding: 8px; }
  }

  .toolbar {
    display: flex; gap: 6px;
    .tool_btn {
      flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 4px; padding: 0.6rem 0.25rem;
      background: #fff; border: 1.5px dashed #D1D5DB; border-radius: 10px;
      color: var(--light-text-color, #6B7280); font-size: 0.75em; cursor: pointer;
      transition: border-color 0.2s, color 0.2s, background 0.2s;
      svg { font-size: 1.2em; }
      &:hover { border-color: var(--primary-color, #EF5A42); color: var(--primary-color, #EF5A42); }
      &.set { border-style: solid; border-color: var(--primary-color, #EF5A42); color: var(--primary-color, #EF5A42); background: rgba(239,90,66,0.04); }
    }
  }

  .preview_btn {
    width: 100%; height: 50px; border: none; border-radius: 25px;
    background: var(--primary-color, #EF5A42); color: #fff;
    font-size: 1em; font-weight: 600;
    cursor: not-allowed; opacity: 0.4; transition: opacity 0.2s;
    &.ready { opacity: 1; cursor: pointer; &:hover { opacity: 0.88; } }
  }
`

const CanvasPlaceholder = styled.div`
  position: absolute; inset: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 0.65rem; pointer-events: none;
  .placeholder_icon { width: 48px; height: 48px; }
  .placeholder_text { margin: 0; font-size: 0.9em; font-weight: 700; color: #111; opacity: 0.25; text-align: center; }
`

const CanvasFrameWrap = styled.div`
  width: ${({ $expanded, $ratio }) => $expanded ? '100%' : ($ratio === 'landscape' ? '100%' : '82%')};
  border-radius: 32px;
  clip-path: inset(0 round 32px);
  flex-shrink: 0;
  transition: width 0.3s ease;
`

const CanvasArea = styled.div`
  aspect-ratio: ${({ $expanded, $ratio }) =>
    $expanded
      ? ($ratio === 'landscape' ? '1 / 1' : '3 / 4')
      : ($ratio === 'landscape' ? '4 / 3' : '3 / 4')};
  width: ${({ $inFrame, $expanded, $ratio }) => ($inFrame || $expanded)
    ? '100%'
    : ($ratio === 'landscape' ? '100%' : '82%')};
  border-radius: 32px;
  clip-path: inset(0 round 32px);
  border: none; overflow: hidden; position: relative;
  transition: aspect-ratio 0.3s ease, width 0.3s ease;

  .canvas_image { display: block; object-fit: cover; border-radius: 6px; transition: width 0.08s, height 0.08s; pointer-events: none; }

  .remove_image_btn {
    position: absolute; top: -10px; right: -10px; z-index: 5;
    width: 22px; height: 22px; border-radius: 50%;
    background: rgba(0,0,0,0.6); border: none; color: #fff;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.9em; cursor: pointer;
    &:hover { background: rgba(0,0,0,0.85); }
  }

  .image_resize_bar {
    position: absolute; bottom: -28px; left: 50%; transform: translateX(-50%);
    z-index: 5; background: rgba(0,0,0,0.5); border-radius: 99px;
    padding: 3px 10px; display: flex; align-items: center;
    input[type='range'] { width: 80px; height: 3px; accent-color: #fff; cursor: pointer; }
  }
`


const ErrorMsg = styled.p`
  font-size: 0.85em; color: #EF5A42; margin: 0; text-align: center;
`

const LoadMsg = styled.p`
  padding: 3rem 1.5rem; text-align: center; color: #9CA3AF; font-size: 0.95em;
`

export default EditBoardPage
