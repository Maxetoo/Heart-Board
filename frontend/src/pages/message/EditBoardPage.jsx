import React, { useState, useEffect, useCallback, useRef } from 'react'
import styled from 'styled-components'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, useNavigate } from 'react-router-dom'
import {
  BsX, BsImage, BsTypeBold, BsBezier2, BsPalette2, BsBorderOuter,
  BsCheck2, BsCheckCircleFill, BsChevronRight,
  BsHeart, BsHandThumbsUp, BsEmojiSmile, BsStar,
  BsSun, BsFire, BsMusicNote, BsMusicNoteBeamed,
  BsHeadphones, BsTrophy, BsBalloon, BsGift,
  BsDiamond, BsAward, BsClock, BsBriefcase,
} from 'react-icons/bs'
import { AiOutlineAudio } from 'react-icons/ai'
import { PiPencilSimpleLineLight, PiPerspective } from 'react-icons/pi'

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
import VideoTab            from '../../tab/VideoTab'
import TagInput            from '../../components/message/TagInput'
import useFonts            from '../../hooks/UseFonts'
import { invalidateMsgCache } from '../../utils/msgCache'

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
  const canvasRef = useRef(null)

  const { board, boardLoad, boardError, updateBoardLoad } = useSelector(s => s.board)
  const { boardMessages, boardMessagesLoad, editMessageLoad } = useSelector(s => s.message)
  const { audioUploadLoad, imageUploadLoad } = useSelector(s => s.upload)
  const { checkReceipentUser, receipentUser } = useSelector(s => s.user)

  const [activeTab, setActiveTab]         = useState('text')
  const [aspectRatio, setAspectRatio]     = useState('portrait')
  const [activeModal, setActiveModal]     = useState(null)
  const [selectedItem, setSelectedItem]   = useState(null)
  const [selectedEvent, setSelectedEvent] = useState(null)

  const [canvasBg, setCanvasBg]           = useState(null)
  const [canvasImage, setCanvasImage]     = useState(null)
  const [imageSize, setImageSize]         = useState(80)
  const [imagePosition, setImagePosition] = useState({ x: 50, y: 50 })
  const [canvasText, setCanvasText]       = useState(null)
  const [canvasVector, setCanvasVector]   = useState(null)
  const [canvasFrame, setCanvasFrame]     = useState(null)

  const [caption, setCaption]               = useState('')
  const [, setMentionedUser]                = useState(null)
  const [boardTags, setBoardTags]           = useState([])
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

    const text = cd.canvasTexts?.[0] ?? cd.canvasText ?? null
    if (text) setCanvasText(text)

    const img = cd.canvasImages?.[0] ?? null
    if (img) {
      setCanvasImage(img.src)
      setImageSize(img.size ?? 80)
      setImagePosition(img.position ?? { x: 50, y: 50 })
    } else if (cd.canvasImage) {
      setCanvasImage(cd.canvasImage)
      if (cd.imageSize)     setImageSize(cd.imageSize)
      if (cd.imagePosition) setImagePosition(cd.imagePosition)
    }

    const vec = cd.canvasVectors?.[0] ?? cd.canvasVector ?? null
    if (vec) {
      const iconId = vec.icon || vec.vectorId || vec.id
      setCanvasVector({ ...vec, vectorId: iconId, icon: VECTOR_ICON_MAP[iconId] })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board?._id, boardMessagesLoad])

  const firstMessage = boardMessages?.[0] || null

  const tabs = [
    { id: 'audio', label: 'Audio', icon: <AiOutlineAudio /> },
    { id: 'text',  label: 'Text',  icon: <PiPencilSimpleLineLight /> },
  ]

  const tools = [
    { id: 'image',  label: 'Image',  icon: <BsImage /> },
    { id: 'text',   label: 'Text',   icon: <BsTypeBold /> },
    { id: 'vector', label: 'Vector', icon: <BsBezier2 /> },
    { id: 'bg',     label: 'BG',     icon: <BsPalette2 /> },
    { id: 'frame',  label: 'Frame',  icon: <BsBorderOuter /> },
  ]

  const hasContent  = canvasBg || canvasImage || canvasText || canvasVector || canvasFrame
  const VectorIcon  = canvasVector?.icon
  const canvasStyle = { background: canvasBg ? canvasBg.value : '#F9FAFB' }
  const isWorking   = updateBoardLoad || editMessageLoad || audioUploadLoad || imageUploadLoad
  const recipentOk  = !receipentUser || receipentUser.length === 0 || checkReceipentUser

  const handleToolClick = toolId =>
    setActiveModal(toolId === 'vector' && canvasVector ? 'editVector' : toolId)

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
            id: firstMessage._id,
            content: { audioUrl: up.response.url || up.response.secure_url, duration: null, text: null, imageUrls: [] },
            cloudinaryPublicId: up.response.public_id,
            fileType: 'audio',
          })).unwrap()
        } else if (activeTab === 'text' && hasContent) {
          await dispatch(editMessage({
            id: firstMessage._id,
            content: {
              text:       canvasText?.content      || null,
              font:       canvasText?.font?.family || null,
              color:      canvasText?.color        || null,
              background: canvasBg?.value          || null,
              frame:      canvasFrame ? `${canvasFrame.thickness}px ${canvasFrame.style} ${canvasFrame.color}` : null,
              imageUrls:  [],
              vectorKey:  canvasVector?.id || null,
              audioUrl: null, duration: null,
            },
            canvasData: {
              canvasBg,
              canvasFrame,
              aspectRatio,
              canvasTexts:   canvasText   ? [canvasText]   : [],
              canvasVectors: canvasVector ? [{
                id:       canvasVector.id ?? 'vec_0',
                vectorId: canvasVector.vectorId,
                icon:     canvasVector.vectorId,
                color:    canvasVector.color,
                opacity:  canvasVector.opacity,
                size:     canvasVector.size,
                position: canvasVector.position,
              }] : [],
              canvasImages: canvasImage ? [{
                id:       'img_0',
                src:      canvasImage,
                size:     imageSize,
                position: imagePosition,
              }] : [],
            },
          })).unwrap()
        }
      }

      // Invalidate caches so home/profile re-fetch fresh data
      if (board._id) invalidateMsgCache(board._id)
      dispatch(invalidateBoardCaches())
      setSaved(true)
    } catch {
      setSaveError('Something went wrong. Please try again.')
    }
  }, [
    dispatch, board, caption, selectedPrivacy, boardTags, selectedEvent,
    firstMessage, activeTab, pendingAudioFile, hasContent,
    canvasText, canvasBg, canvasFrame, canvasVector,
    canvasImage, imageSize, imagePosition, aspectRatio,
  ])

  if (boardLoad) return <Wrapper><LoadMsg>Loading…</LoadMsg></Wrapper>
  if (boardError || !board) return <Wrapper><LoadMsg>Board not found.</LoadMsg></Wrapper>

  if (saved) {
    return (
      <Wrapper>
        <SuccessCard>
          <BsCheckCircleFill className="success_icon" />
          <h2>Board Updated!</h2>
          <p>Your changes have been saved.</p>
          <button className="done_btn" onClick={() => navigate(`/board/${slug}`)}>View Board</button>
        </SuccessCard>
      </Wrapper>
    )
  }

  return (
    <Wrapper>
      {/* ── Header ── */}
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

      {/* ── Body ── */}
      <div className="page_body">
        <ContentWrap>

          {/* Event selector */}
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

          {/* Recipient + tags */}
          <TagInput onMentionChange={setMentionedUser} onTagsChange={setBoardTags} />

          {/* Board title */}
          <input
            className="caption_input"
            placeholder="Board title…"
            value={caption}
            onChange={e => setCaption(e.target.value)}
            maxLength={80}
          />

          {/* ── Text / canvas tab ── */}
          {activeTab === 'text' && (
            <>
              <div className="canvas_unit">
                <div className="aspect_header">
                  <span className="aspect_label"><PiPerspective /> Aspect Ratio</span>
                  <div className="ratio_toggles">
                    <button
                      className={`ratio_btn portrait_btn ${aspectRatio === 'portrait' ? 'active' : ''}`}
                      onClick={() => setAspectRatio('portrait')} title="Portrait"
                    >
                      {aspectRatio === 'portrait' && <BsCheck2 />}
                    </button>
                    <button
                      className={`ratio_btn landscape_btn ${aspectRatio === 'landscape' ? 'active' : ''}`}
                      onClick={() => setAspectRatio('landscape')} title="Landscape"
                    >
                      {aspectRatio === 'landscape' && <BsCheck2 />}
                    </button>
                  </div>
                </div>

                <div className="aspect_container">
                  <div className="canvas_wrap">
                    <CanvasArea
                      ref={canvasRef}
                      $ratio={aspectRatio}
                      style={{
                        ...canvasStyle,
                        ...(canvasFrame ? { border: canvasFrame.border, borderRadius: canvasFrame.borderRadius } : {}),
                      }}
                      data-canvas="true"
                      onClick={() => setSelectedItem(null)}
                    >
                      {canvasImage && (
                        <DraggableCanvasItem
                          position={imagePosition} onPositionChange={setImagePosition}
                          selected={selectedItem === 'image'} onSelect={() => setSelectedItem('image')}
                          onTap={() => setActiveModal('image')}
                        >
                          <div style={{ position: 'relative' }}>
                            <img src={canvasImage} alt="canvas" className="canvas_image" style={{ width: `${imageSize * 2}px`, height: `${imageSize * 2}px` }} />
                            <button className="remove_image_btn" onMouseDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); setCanvasImage(null); setImageSize(80); setImagePosition({ x: 50, y: 50 }) }}><BsX /></button>
                            {selectedItem === 'image' && (
                              <div className="image_resize_bar" onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
                                <input type="range" min="30" max="180" step="2" value={imageSize} onChange={e => setImageSize(Number(e.target.value))} />
                              </div>
                            )}
                          </div>
                        </DraggableCanvasItem>
                      )}

                      {canvasVector && VectorIcon && (
                        <DraggableCanvasItem
                          position={canvasVector.position} onPositionChange={pos => setCanvasVector(prev => ({ ...prev, position: pos }))}
                          selected={selectedItem === 'vector'} onSelect={() => setSelectedItem('vector')}
                          onTap={() => setActiveModal('editVector')}
                        >
                          <VectorIcon style={{ color: canvasVector.color, opacity: canvasVector.opacity, fontSize: canvasVector.size ?? 48, display: 'block' }} />
                        </DraggableCanvasItem>
                      )}

                      {canvasText && (
                        <DraggableCanvasItem
                          position={canvasText.position} onPositionChange={pos => setCanvasText(prev => ({ ...prev, position: pos }))}
                          selected={selectedItem === 'text'} onSelect={() => setSelectedItem('text')}
                          onTap={() => setActiveModal('text')}
                        >
                          <p style={{ margin: 0, fontFamily: canvasText.font?.family, color: canvasText.color, fontSize: canvasText.fontSize ?? 16, maxWidth: 200, textAlign: 'center', lineHeight: 1.35, wordBreak: 'break-word', ...canvasText.font?.style }}>
                            {canvasText.content}
                          </p>
                        </DraggableCanvasItem>
                      )}
                    </CanvasArea>
                  </div>
                </div>
              </div>

              <div className="toolbar">
                {tools.map(tool => {
                  return (
                    <button key={tool.id} className="tool_btn" onClick={() => handleToolClick(tool.id)}>
                      {tool.icon}<span>{tool.label}</span>
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {/* ── Audio tab ── */}
          {activeTab === 'audio' && (
            <AudioTab
              initialAudioUrl={firstMessage?.type === 'audio' ? firstMessage.content?.audioUrl : undefined}
              initialAudioName="Current audio"
              hideSendBtn
              onSend={audioFile => setPendingAudioFile(audioFile)}
            />
          )}

          {/* ── Video tab ── */}
          {activeTab === 'video' && <VideoTab />}

          {saveError && <ErrorMsg>{saveError}</ErrorMsg>}

          <button
            className={`preview_btn ${!isWorking && !saved && recipentOk ? 'ready' : ''}`}
            disabled={isWorking || saved || !recipentOk}
            onClick={handleSave}
          >
            {isWorking ? 'Saving…' : 'Save Changes'}
          </button>

          {/* Modals */}
          {activeModal === 'event'      && <EventModal     onClose={() => setActiveModal(null)} currentEvent={selectedEvent} onConfirm={ev => { setSelectedEvent(ev); setActiveModal(null) }} />}
          {activeModal === 'image'      && <ImageModal     onClose={() => setActiveModal(null)} currentImage={canvasImage}   onConfirm={src => { setCanvasImage(src); setImagePosition({ x: 50, y: 50 }); setImageSize(80); setActiveModal(null) }} />}
          {activeModal === 'text'       && <TextModal      onClose={() => setActiveModal(null)} currentText={canvasText}     onConfirm={t   => { setCanvasText(prev => ({ ...t, position: prev?.position ?? { x: 50, y: 75 } })); setActiveModal(null) }} />}
          {activeModal === 'vector'     && <VectorModal    onClose={() => setActiveModal(null)}                              onConfirm={v   => { setCanvasVector({ ...v, size: 48, position: { x: 75, y: 20 } }); setActiveModal(null) }} />}
          {activeModal === 'editVector' && canvasVector && (
            <EditVectorModal onClose={() => setActiveModal(null)} vector={canvasVector} onUpdate={updates => setCanvasVector(prev => ({ ...prev, ...updates }))} onRemove={() => { setCanvasVector(null); setActiveModal(null); setSelectedItem(null) }} />
          )}
          {activeModal === 'bg'    && <BgModal    onClose={() => setActiveModal(null)} currentBg={canvasBg}       onConfirm={bg    => { setCanvasBg(bg);       setActiveModal(null) }} />}
          {activeModal === 'frame' && <FrameModal onClose={() => setActiveModal(null)} currentFrame={canvasFrame} onConfirm={frame => { setCanvasFrame(frame); setActiveModal(null) }} />}

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

  @media only screen and (min-width: 768px) {
    .page_body { justify-content: flex-start; }
  }
`

const ContentWrap = styled.div`
  display: flex; flex-direction: column; gap: 1rem;
  width: 100%; max-width: 480px; padding: 0 0.5rem;

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
      cursor: pointer; color: #10B981; font-size: 1em; border-radius: 5px;
      transition: border-color 0.2s, background 0.2s;
      &.portrait_btn  { width: 24px; height: 36px; }
      &.landscape_btn { width: 40px; height: 26px; }
      &.active { border-color: #10B981; background: #fff; }
      &:hover:not(.active) { border-color: #D1D5DB; }
    }
  }

  .aspect_container {
    background: #F7F0ED; border-radius: 0 0 12px 12px; overflow: hidden;
  }

  .canvas_wrap {
    display: flex; justify-content: center;
    padding: 0.75rem 3rem 1rem;
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

const CanvasArea = styled.div`
  aspect-ratio: ${({ $ratio }) => $ratio === 'landscape' ? '4 / 3' : '3 / 4'};
  width: ${({ $ratio }) => $ratio === 'landscape' ? '100%' : '82%'};
  border-radius: 30px; border: none;
  overflow: hidden; position: relative; transition: aspect-ratio 0.3s ease, width 0.3s ease;

  .canvas_image { display: block; object-fit: cover; border-radius: 6px; transition: width 0.08s, height 0.08s; pointer-events: none; }
  .remove_image_btn {
    position: absolute; top: -10px; right: -10px; z-index: 5;
    width: 22px; height: 22px; border-radius: 50%;
    background: rgba(0,0,0,0.6); border: none; color: #fff;
    display: flex; align-items: center; justify-content: center; font-size: 0.9em; cursor: pointer;
    &:hover { background: rgba(0,0,0,0.85); }
  }
  .image_resize_bar {
    position: absolute; bottom: -28px; left: 50%; transform: translateX(-50%);
    z-index: 5; background: rgba(0,0,0,0.5); border-radius: 99px; padding: 3px 10px;
    display: flex; align-items: center;
    input[type='range'] { width: 80px; height: 3px; accent-color: #fff; cursor: pointer; }
  }
`

const SuccessCard = styled.div`
  flex: 1; display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 1rem; padding: 3rem 1.5rem; text-align: center;
  .success_icon { font-size: 3.5rem; color: #10B981; }
  h2 { margin: 0; font-size: 1.2em; font-weight: 700; color: var(--text-color, #111); }
  p  { margin: 0; color: #6B7280; font-size: 0.9em; line-height: 1.5; }
  .done_btn { height: 50px; padding: 0 2rem; border: none; border-radius: 25px; background: var(--primary-color, #EF5A42); color: #fff; font-size: 1em; font-weight: 600; cursor: pointer; transition: opacity 0.2s; &:hover { opacity: 0.88; } }
`

const ErrorMsg = styled.p`
  font-size: 0.85em; color: #EF5A42; margin: 0; text-align: center;
`

const LoadMsg = styled.p`
  padding: 3rem 1.5rem; text-align: center; color: #9CA3AF; font-size: 0.95em;
`

export default EditBoardPage
