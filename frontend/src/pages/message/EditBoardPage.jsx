import React, { useState, useEffect, useCallback, useRef } from 'react'
import styled from 'styled-components'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, useNavigate } from 'react-router-dom'
import {
  BsX, BsPencil, BsMic, BsCameraVideo,
  BsImage, BsTypeBold, BsBezier2, BsPalette2, BsBorderOuter,
  BsChevronLeft, BsChevronRight, BsCheck2,
  BsHeart, BsHandThumbsUp, BsEmojiSmile, BsStar,
  BsSun, BsFire, BsMusicNote, BsMusicNoteBeamed,
  BsHeadphones, BsTrophy, BsBalloon, BsGift,
  BsDiamond, BsAward, BsClock, BsBriefcase,
} from 'react-icons/bs'

import { getBoardBySlug, updateBoard } from '../../slices/boardSlice'
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
  const { slug }  = useParams()
  const navigate  = useNavigate()
  const dispatch  = useDispatch()

  const { board, boardLoad, boardError, updateBoardLoad } = useSelector(s => s.board)
  const { boardMessages, boardMessagesLoad, editMessageLoad } = useSelector(s => s.message)
  const { audioUploadLoad } = useSelector(s => s.upload)
  const { checkReceipentUser, receipentUser } = useSelector(s => s.user)


  const [activeTab, setActiveTab]         = useState('text')
  const [aspectRatio, setAspectRatio]     = useState('square')
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

    // Board fields
    setCaption(board.title || '')
    if (board.tags?.length) setBoardTags(board.tags)
    const privacy = PRIVACY_OPTIONS.find(p => p.value === board.visibility)
    if (privacy) setSelectedPrivacy(privacy)
    if (board.event) {
      const ev = EVENTS.find(e => EVENT_MAP[e.id] === board.event || e.id === board.event)
      if (ev) setSelectedEvent(ev)
    }

    // First message canvas
    const firstMsg = boardMessages?.[0]
    if (!firstMsg) return

    if (firstMsg.type === 'audio') {
      setActiveTab('audio')
      return
    }

    const cd = firstMsg.canvasData
    if (!cd) return
    if (cd.aspectRatio)   setAspectRatio(cd.aspectRatio)
    if (cd.canvasBg)      setCanvasBg(cd.canvasBg)
    if (cd.canvasImage)   setCanvasImage(cd.canvasImage)
    if (cd.imageSize)     setImageSize(cd.imageSize)
    if (cd.imagePosition) setImagePosition(cd.imagePosition)
    if (cd.canvasText)    setCanvasText(cd.canvasText)
    if (cd.canvasFrame)   setCanvasFrame(cd.canvasFrame)
    if (cd.canvasVector) {
      const iconId = cd.canvasVector.icon || cd.canvasVector.id
      setCanvasVector({ ...cd.canvasVector, icon: VECTOR_ICON_MAP[iconId] })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board?._id, boardMessagesLoad])

 
  const firstMessage = boardMessages?.[0] || null
  const tabs = [
    { id: 'text',  label: 'Text',  icon: <BsPencil /> },
    { id: 'audio', label: 'Audio', icon: <BsMic /> },
    { id: 'video', label: 'Video', icon: <BsCameraVideo /> },
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
  const isWorking   = updateBoardLoad || editMessageLoad || audioUploadLoad
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
          const uploadResult = await dispatch(uploadFile({ file: pendingAudioFile, type: 'audio' })).unwrap()
          if (uploadResult.status !== 'success') {
            setSaveError(uploadResult.response?.message || 'Audio upload failed'); return
          }
          const audioUrl = uploadResult.response.url || uploadResult.response.secure_url
          const publicId = uploadResult.response.public_id
          await dispatch(editMessage({
            id: firstMessage._id,
            content: { audioUrl, duration: null, text: null, imageUrls: [] },
            cloudinaryPublicId: publicId,
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
              frame:      canvasFrame
                ? `${canvasFrame.thickness}px ${canvasFrame.style} ${canvasFrame.color}` : null,
              imageUrls:  [],
              vectorKey:  canvasVector?.id || null,
              audioUrl:   null, duration: null,
            },
            canvasData: {
              canvasText, canvasBg, canvasFrame,
              canvasVector: canvasVector ? { ...canvasVector, icon: canvasVector.id } : null,
              canvasImage, imageSize, imagePosition, aspectRatio,
            },
          })).unwrap()
        }
      }

      setSaved(true)
      setTimeout(() => navigate('/'), 1200)
    } catch {
      setSaveError('Something went wrong. Please try again.')
    }
  }, [
    dispatch, board, caption, selectedPrivacy, boardTags, selectedEvent,
    firstMessage, activeTab, pendingAudioFile, hasContent,
    canvasText, canvasBg, canvasFrame, canvasVector,
    canvasImage, imageSize, imagePosition, aspectRatio, navigate,
  ])

 
  if (boardLoad) return <Wrapper><LoadMsg>Loading…</LoadMsg></Wrapper>
  if (boardError || !board) return <Wrapper><LoadMsg>Board not found.</LoadMsg></Wrapper>

  return (
    <Wrapper>

      {/* ── Sticky header ── */}
      <div className="page_header">
        <button className="back_btn" onClick={() => navigate(-1)}>
          <BsChevronLeft />
        </button>
        <h2 className="page_title">Edit Board</h2>
        <div style={{ width: 36 }} />
      </div>

      {/* ── Body ── */}
      <div className="page_body">
        <div className="setup_outline">

          {/* Tab switcher */}
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

          {/* Caption / title */}
          <input
            className="caption_input"
            placeholder="Board title…"
            value={caption}
            onChange={e => setCaption(e.target.value)}
            maxLength={80}
          />

          {/* Text / canvas tab */}
          {activeTab === 'text' && (
            <>
              <div className="aspect_row">
                <span className="aspect_label">Aspect Ratio</span>
                <div className="ratio_toggles">
                  <button
                    className={`ratio_btn square_btn ${aspectRatio === 'square' ? 'active' : ''}`}
                    onClick={() => setAspectRatio('square')} title="Square (1:1)"
                  >
                    {aspectRatio === 'square' && <BsCheck2 />}
                  </button>
                  <button
                    className={`ratio_btn portrait_btn ${aspectRatio === 'portrait' ? 'active' : ''}`}
                    onClick={() => setAspectRatio('portrait')} title="Portrait (4:5)"
                  >
                    {aspectRatio === 'portrait' && <BsCheck2 />}
                  </button>
                </div>
              </div>

              <CanvasArea
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
                      <img
                        src={canvasImage} alt="canvas" className="canvas_image"
                        style={{ width: `${imageSize * 2}px`, height: `${imageSize * 2}px` }}
                      />
                      <button
                        className="remove_image_btn"
                        onMouseDown={e => e.stopPropagation()}
                        onClick={e => { e.stopPropagation(); setCanvasImage(null); setImageSize(80); setImagePosition({ x: 50, y: 50 }) }}
                      ><BsX /></button>
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
                    <p style={{
                      margin: 0, fontFamily: canvasText.font?.family,
                      color: canvasText.color, fontSize: canvasText.fontSize ?? 16,
                      maxWidth: 200, textAlign: 'center', lineHeight: 1.35, wordBreak: 'break-word',
                      ...canvasText.font?.style,
                    }}>
                      {canvasText.content}
                    </p>
                  </DraggableCanvasItem>
                )}
              </CanvasArea>

              <div className="toolbar">
                {tools.map(tool => {
                  const isSet =
                    (tool.id === 'image'  && canvasImage)  ||
                    (tool.id === 'text'   && canvasText)   ||
                    (tool.id === 'vector' && canvasVector) ||
                    (tool.id === 'bg'     && canvasBg)     ||
                    (tool.id === 'frame'  && canvasFrame)
                  return (
                    <button key={tool.id} className={`tool_btn ${isSet ? 'set' : ''}`} onClick={() => handleToolClick(tool.id)}>
                      {tool.icon}<span>{tool.label}</span>
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {/* Audio tab */}
          {activeTab === 'audio' && (
            <AudioTab
              initialAudioUrl={firstMessage?.type === 'audio' ? firstMessage.content?.audioUrl : undefined}
              initialAudioName="Current audio"
              hideSendBtn
              onSend={audioFile => setPendingAudioFile(audioFile)}
            />
          )}

          {/* Video tab */}
          {activeTab === 'video' && <VideoTab />}

          {saveError && <ErrorMsg>{saveError}</ErrorMsg>}

          <button
            className={`preview_btn ${!isWorking && !saved && recipentOk ? 'ready' : ''}`}
            disabled={isWorking || saved || !recipentOk}
            onClick={handleSave}
          >
            {saved ? '✓ Saved' : isWorking ? 'Saving…' : 'Save Changes'}
          </button>

          {/* Modals */}
          {activeModal === 'event'  && <EventModal  onClose={() => setActiveModal(null)} currentEvent={selectedEvent} onConfirm={ev  => { setSelectedEvent(ev);  setActiveModal(null) }} />}
          {activeModal === 'image'  && <ImageModal  onClose={() => setActiveModal(null)} currentImage={canvasImage}   onConfirm={src => { setCanvasImage(src); setImagePosition({ x: 50, y: 50 }); setImageSize(80); setActiveModal(null) }} />}
          {activeModal === 'text'   && <TextModal   onClose={() => setActiveModal(null)} currentText={canvasText}     onConfirm={t   => { setCanvasText(prev => ({ ...t, position: prev?.position ?? { x: 50, y: 75 } })); setActiveModal(null) }} />}
          {activeModal === 'vector' && <VectorModal onClose={() => setActiveModal(null)}                              onConfirm={v   => { setCanvasVector({ ...v, size: 48, position: { x: 75, y: 20 } }); setActiveModal(null) }} />}
          {activeModal === 'editVector' && canvasVector && (
            <EditVectorModal
              onClose={() => setActiveModal(null)} vector={canvasVector}
              onUpdate={updates => setCanvasVector(prev => ({ ...prev, ...updates }))}
              onRemove={() => { setCanvasVector(null); setActiveModal(null); setSelectedItem(null) }}
            />
          )}
          {activeModal === 'bg'    && <BgModal    onClose={() => setActiveModal(null)} currentBg={canvasBg}       onConfirm={bg    => { setCanvasBg(bg);       setActiveModal(null) }} />}
          {activeModal === 'frame' && <FrameModal onClose={() => setActiveModal(null)} currentFrame={canvasFrame} onConfirm={frame => { setCanvasFrame(frame); setActiveModal(null) }} />}

        </div>
      </div>

    </Wrapper>
  )
}



const CanvasArea = styled.div`
  width: 100%;
  aspect-ratio: ${({ $ratio }) => $ratio === 'portrait' ? '4 / 5' : '1 / 1'};
  border-radius: 12px; border: 1.5px solid #ECEFF3;
  overflow: hidden; position: relative; transition: aspect-ratio 0.3s ease;

  .canvas_image { display: block; object-fit: cover; border-radius: 6px; transition: width 0.08s, height 0.08s; pointer-events: none; }

  .remove_image_btn {
    position: absolute; top: -10px; right: -10px; z-index: 5;
    width: 22px; height: 22px; border-radius: 50%;
    background: rgba(0,0,0,0.6); border: none; color: #fff;
    display: flex; align-items: center; justify-content: center; font-size: 0.9em; cursor: pointer;
    transition: background 0.2s;
    &:hover { background: rgba(0,0,0,0.85); }
  }

  .image_resize_bar {
    position: absolute; bottom: -28px; left: 50%; transform: translateX(-50%);
    z-index: 5; background: rgba(0,0,0,0.5); border-radius: 99px; padding: 3px 10px;
    display: flex; align-items: center;
    input[type='range'] { width: 80px; height: 3px; accent-color: #fff; cursor: pointer; }
  }
`

const Wrapper = styled.div`
  width: 100vw;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-color, #F7F5F0);

  .page_header {
    position: sticky; top: 0; z-index: 10;
    width: 100%; height: 64px;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 1.5rem;
    background: var(--bg-color, #F7F5F0);
    border-bottom: 1px solid rgba(0,0,0,0.06);
    box-sizing: border-box;
  }

  .back_btn {
    width: 36px; height: 36px; border-radius: 50%;
    border: 1.5px solid #ECEFF3; background: transparent;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.3em; color: var(--text-color, #111); cursor: pointer;
    transition: border-color 0.2s, color 0.2s;
    &:hover { border-color: var(--primary-color, #EF5A42); color: var(--primary-color, #EF5A42); }
  }

  .page_title {
    font-size: 1.1em; font-weight: 700; color: var(--text-color, #111); margin: 0;
    position: absolute; left: 50%; transform: translateX(-50%);
  }

  .page_body {
    flex: 1; display: flex; flex-direction: column; align-items: center;
    padding: 2rem 1rem 4rem; overflow-y: auto;
  }

  .setup_outline {
    width: 100%; max-width: 480px;
    background: #fff; border-radius: 16px;
    display: flex; flex-direction: column;
    padding: 1.5rem; gap: 1rem;
    box-shadow: 0 4px 24px rgba(0,0,0,0.06);
  }

  /* Tab switcher — identical to PostCreationComponent */
  .tab_switcher {
    display: flex; background: #F3F4F6; border-radius: 99px; padding: 4px; gap: 2px;
  }
  .tab_btn {
    flex: 1; display: flex; align-items: center; justify-content: center;
    gap: 0.4rem; height: 36px; border: none; border-radius: 99px;
    background: transparent; color: var(--light-text-color, #6B7280);
    font-size: 0.9em; cursor: pointer; transition: background 0.2s, color 0.2s;
    &.active { background: #fff; color: var(--text-color, #111); font-weight: 600; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
    svg { font-size: 0.95em; }
  }

  /* Event row */
  .select_row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 1rem; height: 50px;
    background: #F9FAFB; border-radius: 10px; border: 1.5px solid #ECEFF3;
    cursor: pointer; transition: border-color 0.2s;
    &:hover { border-color: var(--primary-color, #EF5A42); }
    .select_placeholder { font-size: 0.95em; color: #9CA3AF; flex: 1; }
    .select_event_emoji { font-size: 1.1em; margin-right: 0.5rem; flex-shrink: 0; }
    .select_value { flex: 1; font-size: 0.95em; font-weight: 500; color: var(--text-color, #111); }
    .select_arrow { color: #9CA3AF; font-size: 0.9em; flex-shrink: 0; }
  }

  /* Caption/title input */
  .caption_input {
    width: 100%; height: 48px; padding: 0 1rem;
    border: 1.5px solid #ECEFF3; border-radius: 10px;
    background: #F9FAFB; font-size: 0.95em; color: var(--text-color, #111);
    outline: none; box-sizing: border-box; transition: border-color 0.2s, background 0.2s;
    &::placeholder { color: #9CA3AF; }
    &:focus { border-color: var(--primary-color, #EF5A42); background: #fff; }
  }

  /* Aspect ratio row */
  .aspect_row {
    display: flex; align-items: center; gap: 0.5rem; padding: 0 0.25rem;
    .aspect_label { flex: 1; font-size: 0.95em; font-weight: 500; color: var(--text-color, #111); }
    .ratio_toggles { display: flex; gap: 6px; align-items: center; }
    .ratio_btn {
      display: flex; align-items: center; justify-content: center;
      border: 1.5px solid #ECEFF3; background: #F9FAFB;
      cursor: pointer; color: var(--primary-color, #EF5A42); font-size: 0.8em; border-radius: 5px;
      transition: border-color 0.2s, background 0.2s;
      &.square_btn   { width: 28px; height: 28px; }
      &.portrait_btn { width: 22px; height: 28px; }
      &.active { border-color: var(--primary-color, #EF5A42); background: rgba(239,90,66,0.06); }
      &:hover:not(.active) { border-color: #D1D5DB; }
    }
  }

  /* Toolbar */
  .toolbar {
    display: flex; gap: 6px;
    .tool_btn {
      flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 4px; padding: 0.6rem 0.25rem;
      background: transparent; border: 1.5px dashed #D1D5DB; border-radius: 10px;
      color: var(--light-text-color, #6B7280); font-size: 0.75em; cursor: pointer;
      transition: border-color 0.2s, color 0.2s, background 0.2s;
      svg { font-size: 1.2em; }
      &:hover { border-color: var(--primary-color, #EF5A42); color: var(--primary-color, #EF5A42); }
      &.set { border-style: solid; border-color: var(--primary-color, #EF5A42); color: var(--primary-color, #EF5A42); background: rgba(239,90,66,0.04); }
    }
  }

  /* Save button — reuses preview_btn class name so styles are identical */
  .preview_btn {
    width: 100%; height: 50px; border: none; border-radius: 25px;
    background: var(--primary-color, #EF5A42); color: #fff; font-size: 1em; font-weight: 600;
    cursor: not-allowed; opacity: 0.4; transition: opacity 0.2s;
    &.ready { opacity: 1; cursor: pointer; &:hover { opacity: 0.88; } }
  }

  @media only screen and (min-width: 768px) {
    .setup_outline { padding: 2rem; }
    .page_body { justify-content: center; }
  }
`

const ErrorMsg = styled.p`
  font-size: 0.85em; color: #EF5A42; margin: 0; text-align: center;
`

const LoadMsg = styled.p`
  padding: 3rem 1.5rem; text-align: center; color: #9CA3AF; font-size: 0.95em;
`

export default EditBoardPage