import React, { useState, useEffect, useCallback, useRef } from 'react'
import styled from 'styled-components'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, useNavigate } from 'react-router-dom'
import {
  BsChevronLeft, BsX,
  BsImage, BsTypeBold, BsBezier2, BsPalette2, BsBorderOuter,
  BsCheck2,
} from 'react-icons/bs'

import { getMessage, editMessage }  from '../../slices/messageSlice'
import { uploadFile }               from '../../slices/uploadSlice'

import ImageModal          from '../../modals/ImageModal'
import TextModal           from '../../modals/TextModal'
import VectorModal         from '../../modals/VectorModal'
import EditVectorModal     from '../../modals/EditVectorModal'
import BgModal             from '../../modals/BgModal'
import FrameModal          from '../../modals/FrameModal'
import DraggableCanvasItem from '../../canvas/DraggableCanvasItem'
import AudioTab            from '../../tab/AudioTab'
import useFonts            from '../../hooks/UseFonts'

import {
  BsHeart, BsHandThumbsUp, BsEmojiSmile, BsStar,
  BsSun, BsFire, BsMusicNote, BsMusicNoteBeamed,
  BsHeadphones, BsTrophy, BsBalloon, BsGift,
  BsDiamond, BsAward, BsClock, BsBriefcase,
} from 'react-icons/bs'

const VECTOR_ICON_MAP = {
  heart:      BsHeart,
  thumbsup:   BsHandThumbsUp,
  smile:      BsEmojiSmile,
  star:       BsStar,
  sun:        BsSun,
  fire:       BsFire,
  music:      BsMusicNote,
  music2:     BsMusicNoteBeamed,
  headphones: BsHeadphones,
  trophy:     BsTrophy,
  balloon:    BsBalloon,
  gift:       BsGift,
  diamond:    BsDiamond,
  award:      BsAward,
  clock:      BsClock,
  briefcase:  BsBriefcase,
}

const EditMessagePage = () => {
  useFonts()

  const { id }    = useParams()
  const navigate  = useNavigate()
  const dispatch  = useDispatch()

  const { message, messageLoad, messageError, editMessageLoad, editMessageError, editMessageErrorMsg } =
    useSelector(s => s.message)
  const { audioUploadLoad } = useSelector(s => s.upload)

  const msgType = message?.type

  // ── Canvas state ──────────────────────────────────────────────────────────
  const [aspectRatio, setAspectRatio]     = useState('square')
  const [activeModal, setActiveModal]     = useState(null)
  const [selectedItem, setSelectedItem]   = useState(null)

  const [canvasBg, setCanvasBg]           = useState(null)
  const [canvasImage, setCanvasImage]     = useState(null)
  const [imageSize, setImageSize]         = useState(80)
  const [imagePosition, setImagePosition] = useState({ x: 50, y: 50 })
  const [canvasText, setCanvasText]       = useState(null)
  const [canvasVector, setCanvasVector]   = useState(null)
  const [canvasFrame, setCanvasFrame]     = useState(null)

  // ── Audio state ───────────────────────────────────────────────────────────
  const [newAudioFile, setNewAudioFile]   = useState(null)

  // ── Save state ────────────────────────────────────────────────────────────
  const [saveError, setSaveError] = useState('')
  const [saved, setSaved]         = useState(false)

  // ── Load message ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (id) dispatch(getMessage(id))
  }, [id, dispatch])

  // ── Restore canvas from canvasData ───────────────────────────────────────
  // Uses a ref so the seeding logic can watch message arrive without
  // putting message in the dependency array (which causes re-render warnings).
  const hasSeeded  = useRef(false)
  const messageRef = useRef(null)

  useEffect(() => {
    messageRef.current = message
    if (!message || hasSeeded.current) return
    hasSeeded.current = true

    const cd = message.canvasData
    if (cd) {
      if (cd.aspectRatio)   setAspectRatio(cd.aspectRatio)
      if (cd.canvasBg)      setCanvasBg(cd.canvasBg)
      if (cd.canvasImage)   setCanvasImage(cd.canvasImage)
      if (cd.imageSize)     setImageSize(cd.imageSize)
      if (cd.imagePosition) setImagePosition(cd.imagePosition)
      if (cd.canvasText)    setCanvasText(cd.canvasText)
      if (cd.canvasFrame)   setCanvasFrame(cd.canvasFrame)
      if (cd.canvasVector) {
        const iconId   = cd.canvasVector.icon || cd.canvasVector.id
        const iconComp = VECTOR_ICON_MAP[iconId]
        setCanvasVector({ ...cd.canvasVector, icon: iconComp })
      }
    } else if (message.type === 'emblem') {
      const c = message.content || {}
      if (c.text) {
        setCanvasText({
          content:  c.text,
          color:    c.color || '#111111',
          fontSize: 16,
          font:     c.font ? { family: c.font, label: c.font, style: {} } : null,
          position: { x: 50, y: 75 },
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message?._id])

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
  const isWorking   = editMessageLoad || audioUploadLoad

  const handleToolClick = toolId =>
    setActiveModal(toolId === 'vector' && canvasVector ? 'editVector' : toolId)

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    setSaveError('')
    try {
      if (msgType === 'audio') {
        if (!newAudioFile) { setSaveError('Please record or upload a new audio.'); return }
        const uploadResult = await dispatch(uploadFile({ file: newAudioFile, type: 'audio' })).unwrap()
        if (uploadResult.status !== 'success') { setSaveError(uploadResult.response?.message || 'Audio upload failed'); return }
        const audioUrl = uploadResult.response.url || uploadResult.response.secure_url
        const publicId = uploadResult.response.public_id
        const result   = await dispatch(editMessage({ id, content: { audioUrl, duration: null, text: null, imageUrls: [] }, cloudinaryPublicId: publicId, fileType: 'audio' })).unwrap()
        if (result.status !== 'success') { setSaveError(result.response?.message || 'Failed to update message'); return }
        setSaved(true)
        setTimeout(() => navigate(-1), 1200)
        return
      }

      const result = await dispatch(editMessage({
        id,
        content: {
          text:       canvasText?.content      || null,
          font:       canvasText?.font?.family || null,
          color:      canvasText?.color        || null,
          background: canvasBg?.value          || null,
          frame:      canvasFrame ? `${canvasFrame.thickness}px ${canvasFrame.style} ${canvasFrame.color}` : null,
          imageUrls:  [],
          vectorKey:  canvasVector?.id         || null,
          audioUrl:   null, duration: null,
        },
        canvasData: {
          canvasText, canvasBg, canvasFrame,
          canvasVector: canvasVector ? { ...canvasVector, icon: canvasVector.id } : null,
          canvasImage, imageSize, imagePosition, aspectRatio,
        },
      })).unwrap()

      if (result.status !== 'success') { setSaveError(result.response?.message || 'Failed to update message'); return }
      setSaved(true)
      setTimeout(() => navigate(-1), 1200)
    } catch {
      setSaveError('Something went wrong. Please try again.')
    }
  }, [dispatch, id, msgType, newAudioFile, canvasText, canvasBg, canvasFrame, canvasVector, canvasImage, imageSize, imagePosition, aspectRatio, navigate])

  if (messageLoad) return <Wrapper><LoadMsg>Loading message…</LoadMsg></Wrapper>
  if (messageError || !message) return <Wrapper><LoadMsg>Message not found.</LoadMsg></Wrapper>

  return (
    <Wrapper>

      {/* ── Header ── */}
      <div className="page_header">
        <button className="close_btn" onClick={() => navigate(-1)}><BsChevronLeft /></button>
        <h2 className="page_title">Edit Message</h2>
        <div style={{ width: 36 }} />
      </div>

      {/* ── Body ── */}
      <div className="page_body">
        <div className="setup_outline">

          {/* ── Audio ── */}
          {msgType === 'audio' && (
            <>
              {/* AudioTab pre-seeded with existing audio — user can remove and re-record/upload */}
              <AudioTab
                initialAudioUrl={message.content?.audioUrl}
                initialAudioName="Current audio"
                hideSendBtn
                onSend={(audioFile) => {
                  setNewAudioFile(audioFile)
                }}
              />

              {(saveError || editMessageError) && <ErrorMsg>{saveError || editMessageErrorMsg}</ErrorMsg>}

              {/* Single save button */}
              <button
                className={`preview_btn ${newAudioFile && !isWorking && !saved ? 'ready' : ''}`}
                disabled={isWorking || !newAudioFile || saved}
                onClick={handleSave}
              >
                {saved ? '✓ Saved' : isWorking ? 'Saving…' : 'Save Changes'}
              </button>
            </>
          )}

          {/* ── Emblem / text canvas ── */}
          {(msgType === 'emblem' || msgType === 'text' || !msgType) && (
            <>
              {/* Aspect ratio */}
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

              {/* Canvas */}
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
                    position={canvasVector.position}
                    onPositionChange={pos => setCanvasVector(prev => ({ ...prev, position: pos }))}
                    selected={selectedItem === 'vector'} onSelect={() => setSelectedItem('vector')}
                    onTap={() => setActiveModal('editVector')}
                  >
                    <VectorIcon style={{ color: canvasVector.color, opacity: canvasVector.opacity, fontSize: canvasVector.size ?? 48, display: 'block' }} />
                  </DraggableCanvasItem>
                )}

                {canvasText && (
                  <DraggableCanvasItem
                    position={canvasText.position}
                    onPositionChange={pos => setCanvasText(prev => ({ ...prev, position: pos }))}
                    selected={selectedItem === 'text'} onSelect={() => setSelectedItem('text')}
                    onTap={() => setActiveModal('text')}
                  >
                    <p style={{
                      margin: 0, fontFamily: canvasText.font?.family,
                      color: canvasText.color, fontSize: canvasText.fontSize ?? 16,
                      maxWidth: 200, textAlign: 'center', lineHeight: 1.35,
                      wordBreak: 'break-word', ...canvasText.font?.style,
                    }}>{canvasText.content}</p>
                  </DraggableCanvasItem>
                )}
              </CanvasArea>

              {/* Toolbar */}
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

              {(saveError || editMessageError) && <ErrorMsg>{saveError || editMessageErrorMsg}</ErrorMsg>}

              <button
                className={`preview_btn ${hasContent && !isWorking && !saved ? 'ready' : ''}`}
                disabled={!hasContent || isWorking || saved}
                onClick={handleSave}
              >
                {saved ? '✓ Saved' : isWorking ? 'Saving…' : 'Save Changes'}
              </button>

              {/* Modals */}
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
            </>
          )}

        </div>
      </div>



    </Wrapper>
  )
}

// ─── Styled Components — mirrors PostMessagePage exactly ──────────────────────

const Wrapper = styled.div`
  width: 100vw;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-color, #F7F5F0);

  .page_header {
    position: sticky;
    top: 0;
    z-index: 10;
    width: 100%;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 1.5rem;
    background: var(--bg-color, #F7F5F0);
    border-bottom: 1px solid rgba(0,0,0,0.06);
    box-sizing: border-box;
  }

  .close_btn {
    width: 36px; height: 36px; border-radius: 50%;
    border: 1.5px solid #ECEFF3; background: transparent;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.3em; color: var(--text-color, #111); cursor: pointer;
    transition: border-color 0.2s, color 0.2s;
    &:hover { border-color: var(--primary-color, #EF5A42); color: var(--primary-color, #EF5A42); }
  }

  .page_title {
    font-size: 1.1em; font-weight: 700; color: var(--text-color, #111);
    margin: 0;
    position: absolute; left: 50%; transform: translateX(-50%);
  }

  .page_body {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem 1rem 4rem;
    overflow-y: auto;
  }

  /* White card — same as setup_outline in PostMessagePage */
  .setup_outline {
    width: 100%;
    max-width: 480px;
    background: #fff;
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    padding: 1.5rem;
    gap: 1rem;
    box-shadow: 0 4px 24px rgba(0,0,0,0.06);
  }

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
      &.set {
        border-style: solid; border-color: var(--primary-color, #EF5A42);
        color: var(--primary-color, #EF5A42); background: rgba(239,90,66,0.04);
      }
    }
  }

  .preview_btn {
    width: 100%; height: 50px; border: none; border-radius: 25px;
    background: var(--primary-color, #EF5A42); color: #fff;
    font-size: 1em; font-weight: 600;
    cursor: not-allowed; opacity: 0.4; transition: opacity 0.2s;
    &.ready { opacity: 1; cursor: pointer; &:hover { opacity: 0.88; } }
    &:disabled { opacity: 0.4; cursor: not-allowed; }
  }

  @media only screen and (min-width: 768px) {
    .setup_outline { padding: 2rem; }
    .page_body { justify-content: center; }
  }
`

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
    &:hover { background: rgba(0,0,0,0.85); }
  }

  .image_resize_bar {
    position: absolute; bottom: -28px; left: 50%; transform: translateX(-50%);
    z-index: 5; background: rgba(0,0,0,0.5); border-radius: 99px; padding: 3px 10px;
    display: flex; align-items: center;
    input[type='range'] { width: 80px; height: 3px; accent-color: #fff; cursor: pointer; }
  }
`

const ErrorMsg = styled.p`
  font-size: 0.85em; color: #EF5A42; margin: 0; line-height: 1.4;
`

const LoadMsg = styled.p`
  padding: 3rem 1.5rem; text-align: center; color: #9CA3AF; font-size: 0.95em;
`

export default EditMessagePage