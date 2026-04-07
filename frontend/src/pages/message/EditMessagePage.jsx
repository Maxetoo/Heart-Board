import React, { useState, useEffect, useCallback, useRef } from 'react'
import styled from 'styled-components'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, useNavigate } from 'react-router-dom'
import {
  BsX, BsImage, BsTypeBold, BsBezier2, BsPalette2, BsBorderOuter,
  BsCheck2, BsCheckCircleFill, BsPlayFill, BsPauseFill,
} from 'react-icons/bs'
import { AiOutlineAudio } from 'react-icons/ai'
import { PiPencilSimpleLineLight, PiPerspective } from 'react-icons/pi'

import { getMessage, editMessage }  from '../../slices/messageSlice'
import { uploadFile }               from '../../slices/uploadSlice'
import { invalidateBoardCaches }    from '../../slices/boardSlice'
import { invalidateMsgCache }       from '../../utils/msgCache'

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
  heart:      BsHeart,   thumbsup:   BsHandThumbsUp,  smile:   BsEmojiSmile,
  star:       BsStar,    sun:        BsSun,            fire:    BsFire,
  music:      BsMusicNote, music2:   BsMusicNoteBeamed, headphones: BsHeadphones,
  trophy:     BsTrophy,  balloon:    BsBalloon,        gift:    BsGift,
  diamond:    BsDiamond, award:      BsAward,          clock:   BsClock,
  briefcase:  BsBriefcase,
}

const EditMessagePage = () => {
  useFonts()

  const { id }    = useParams()
  const navigate  = useNavigate()
  const dispatch  = useDispatch()
  const canvasRef = useRef(null)

  const { message, messageLoad, messageError, editMessageLoad } = useSelector(s => s.message)
  const { audioUploadLoad, imageUploadLoad } = useSelector(s => s.upload)

  // ── Active tab ────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('text')

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
  const [newAudioFile, setNewAudioFile]         = useState(null)
  const [pendingAudioURL, setPendingAudioURL]   = useState(null)
  const [pendingAudioName, setPendingAudioName] = useState(null)

  // ── Preview / save state ──────────────────────────────────────────────────
  const [showPreview, setShowPreview]             = useState(false)
  const [canvasSnapshot, setCanvasSnapshot]       = useState(null)
  const [pendingCanvasFile, setPendingCanvasFile] = useState(null)
  const [saveError, setSaveError]                 = useState('')
  const [saved, setSaved]                         = useState(false)

  // ── Load message ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (id) dispatch(getMessage(id))
  }, [id, dispatch])

  // ── Seed canvas from saved data ───────────────────────────────────────────
  const hasSeeded = useRef(false)
  useEffect(() => {
    if (!message || hasSeeded.current) return
    hasSeeded.current = true
    setActiveTab(message.type === 'audio' ? 'audio' : 'text')
    const cd = message.canvasData
    if (cd) {
      if (cd.aspectRatio) setAspectRatio(cd.aspectRatio)
      if (cd.canvasBg)    setCanvasBg(cd.canvasBg)
      if (cd.canvasFrame) setCanvasFrame(cd.canvasFrame)

      // texts — saved as plural array by PostCreationComponent
      const text = cd.canvasTexts?.[0] ?? cd.canvasText ?? null
      if (text) setCanvasText(text)

      // images — saved as plural array
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

      // vectors — saved as plural array
      const vec = cd.canvasVectors?.[0] ?? cd.canvasVector ?? null
      if (vec) {
        const iconId = vec.icon || vec.vectorId || vec.id
        setCanvasVector({ ...vec, vectorId: iconId, icon: VECTOR_ICON_MAP[iconId] })
      }
    } else if (message.type === 'emblem') {
      const c = message.content || {}
      if (c.text) setCanvasText({ content: c.text, color: c.color || '#111111', fontSize: 16, font: c.font ? { family: c.font, label: c.font, style: {} } : null, position: { x: 50, y: 75 } })
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

  const tabs = [
    { id: 'audio', label: 'Audio', icon: <AiOutlineAudio /> },
    { id: 'text',  label: 'Text',  icon: <PiPencilSimpleLineLight /> },
  ]

  const hasContent  = canvasBg || canvasImage || canvasText || canvasVector || canvasFrame
  const VectorIcon  = canvasVector?.icon
  const canvasStyle = { background: canvasBg ? canvasBg.value : '#F9FAFB' }
  const isWorking   = editMessageLoad || audioUploadLoad || imageUploadLoad

  const handleToolClick = toolId =>
    setActiveModal(toolId === 'vector' && canvasVector ? 'editVector' : toolId)

  // ── Canvas capture ────────────────────────────────────────────────────────
  const captureCanvasAsFile = useCallback(async () => {
    if (!canvasRef.current) throw new Error('Canvas element not found')
    const html2canvas = (await import('html2canvas')).default
    const uiOnly = canvasRef.current.querySelectorAll('.drag_hint, .remove_image_btn, .image_resize_bar')
    uiOnly.forEach(el => { el.style.visibility = 'hidden' })
    let canvasEl
    try {
      canvasEl = await html2canvas(canvasRef.current, { useCORS: true, allowTaint: false, backgroundColor: null, scale: 2, logging: false })
    } finally {
      uiOnly.forEach(el => { el.style.visibility = '' })
    }
    return new Promise((resolve, reject) => {
      canvasEl.toBlob(
        blob => blob
          ? resolve(new File([blob], `canvas_${Date.now()}.png`, { type: 'image/png' }))
          : reject(new Error('Canvas toBlob failed')),
        'image/png', 0.95
      )
    })
  }, [])

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    setSaveError('')
    try {
      if (activeTab === 'audio') {
        if (!newAudioFile) { setSaveError('Please record or upload a new audio.'); return }
        const up = await dispatch(uploadFile({ file: newAudioFile, type: 'audio' })).unwrap()
        if (up.status !== 'success') { setSaveError(up.response?.message || 'Audio upload failed'); return }
        const result = await dispatch(editMessage({ id, content: { audioUrl: up.response.url || up.response.secure_url, duration: null, text: null, imageUrls: [] }, cloudinaryPublicId: up.response.public_id, fileType: 'audio' })).unwrap()
        if (result.status !== 'success') { setSaveError(result.response?.message || 'Failed to update'); return }
        const boardId = message?.board?._id || message?.board || message?.boardId
        if (boardId) invalidateMsgCache(String(boardId))
        dispatch(invalidateBoardCaches())
        setSaved(true); return
      }

      if (!pendingCanvasFile) { setSaveError('Preview render missing. Please close and try again.'); return }
      const up = await dispatch(uploadFile({ file: pendingCanvasFile, type: 'image' })).unwrap()
      if (up.status !== 'success') { setSaveError(up.response?.message || 'Image upload failed'); return }
      const renderedImageUrl = up.response.url || up.response.secure_url

      const result = await dispatch(editMessage({
        id,
        content: {
          text:       canvasText?.content      || null,
          font:       canvasText?.font?.family || null,
          color:      canvasText?.color        || null,
          background: canvasBg?.value          || null,
          frame:      canvasFrame ? `${canvasFrame.thickness}px ${canvasFrame.style} ${canvasFrame.color}` : null,
          imageUrls:  renderedImageUrl ? [renderedImageUrl] : [],
          vectorKey:  canvasVector?.id         || null,
          audioUrl: null, duration: null,
        },
        cloudinaryPublicId: up.response.public_id,
        fileType: 'image',
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

      if (result.status !== 'success') { setSaveError(result.response?.message || 'Failed to update'); return }
      const boardId = message?.board?._id || message?.board || message?.boardId
      if (boardId) invalidateMsgCache(String(boardId))
      dispatch(invalidateBoardCaches())
      setSaved(true)
    } catch {
      setSaveError('Something went wrong. Please try again.')
    }
  }, [dispatch, id, activeTab, message, newAudioFile, pendingCanvasFile, canvasText, canvasBg, canvasFrame, canvasVector, canvasImage, imageSize, imagePosition, aspectRatio])

  const closePreview = () => {
    setShowPreview(false); setSaveError('')
    setPendingCanvasFile(null); setCanvasSnapshot(null)
    setNewAudioFile(null); setPendingAudioURL(null); setPendingAudioName(null)
  }

  if (messageLoad) return <Wrapper><LoadMsg>Loading message…</LoadMsg></Wrapper>
  if (messageError || !message) return <Wrapper><LoadMsg>Message not found.</LoadMsg></Wrapper>

  if (saved) {
    return (
      <Wrapper>
        <SuccessCard>
          <BsCheckCircleFill className="success_icon" />
          <h2>Message Updated!</h2>
          <p>Your changes have been saved.</p>
          <button className="done_btn" onClick={() => navigate(-1)}>Go Back</button>
        </SuccessCard>
      </Wrapper>
    )
  }

  return (
    <Wrapper>
      {/* ── Header ── */}
      <div className="page_header">
        <button className="close_btn" onClick={() => navigate(-1)}><BsX /></button>
        <h2 className="page_title">Edit Message</h2>
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

          {/* ── Audio tab ── */}
          {activeTab === 'audio' && (
            <>
              <AudioTab
                initialAudioUrl={message.content?.audioUrl}
                initialAudioName="Current audio"
                hideSendBtn
                onSend={(audioFile, audioName) => {
                  setNewAudioFile(audioFile)
                  setPendingAudioURL(URL.createObjectURL(audioFile))
                  setPendingAudioName(audioName)
                  setShowPreview(true)
                }}
              />
              {saveError && <ErrorMsg>{saveError}</ErrorMsg>}
            </>
          )}

          {/* ── Canvas tab ── */}
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
                          <p style={{ margin: 0, fontFamily: canvasText.font?.family, color: canvasText.color, fontSize: canvasText.fontSize ?? 16, maxWidth: 200, textAlign: 'center', lineHeight: 1.35, wordBreak: 'break-word', ...canvasText.font?.style }}>{canvasText.content}</p>
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

              <button
                className={`preview_btn ${hasContent ? 'ready' : ''}`}
                disabled={!hasContent}
                onClick={async () => {
                  if (!hasContent) return
                  try {
                    const file = await captureCanvasAsFile()
                    setPendingCanvasFile(file)
                    setCanvasSnapshot(URL.createObjectURL(file))
                    setShowPreview(true)
                  } catch {
                    setSaveError('Failed to render canvas. Please try again.')
                  }
                }}
              >
                Preview changes
              </button>

              {saveError && <ErrorMsg>{saveError}</ErrorMsg>}

              {activeModal === 'image'      && <ImageModal      onClose={() => setActiveModal(null)} currentImage={canvasImage}   onConfirm={src => { setCanvasImage(src); setImagePosition({ x: 50, y: 50 }); setImageSize(80); setActiveModal(null) }} />}
              {activeModal === 'text'       && <TextModal       onClose={() => setActiveModal(null)} currentText={canvasText}     onConfirm={t   => { setCanvasText(prev => ({ ...t, position: prev?.position ?? { x: 50, y: 75 } })); setActiveModal(null) }} />}
              {activeModal === 'vector'     && <VectorModal     onClose={() => setActiveModal(null)}                              onConfirm={v   => { setCanvasVector({ ...v, size: 48, position: { x: 75, y: 20 } }); setActiveModal(null) }} />}
              {activeModal === 'editVector' && canvasVector && (
                <EditVectorModal onClose={() => setActiveModal(null)} vector={canvasVector} onUpdate={updates => setCanvasVector(prev => ({ ...prev, ...updates }))} onRemove={() => { setCanvasVector(null); setActiveModal(null); setSelectedItem(null) }} />
              )}
              {activeModal === 'bg'    && <BgModal    onClose={() => setActiveModal(null)} currentBg={canvasBg}       onConfirm={bg    => { setCanvasBg(bg);       setActiveModal(null) }} />}
              {activeModal === 'frame' && <FrameModal onClose={() => setActiveModal(null)} currentFrame={canvasFrame} onConfirm={frame => { setCanvasFrame(frame); setActiveModal(null) }} />}
            </>
          )}

        </ContentWrap>
      </div>

      {/* ── Preview overlay ── */}
      {showPreview && (
        <PreviewOverlay>
          <PreviewCard>
            <div className="preview_header">
              <span className="preview_title">Preview</span>
              <button className="preview_close" onClick={closePreview}><BsX /></button>
            </div>
            {pendingAudioURL
              ? <AudioPreview audioURL={pendingAudioURL} audioName={pendingAudioName} />
              : (
                <div className="snapshot_wrap">
                  {canvasSnapshot && <img src={canvasSnapshot} alt="preview" className="snapshot_img" />}
                </div>
              )
            }
            {saveError && <p className="preview_error">{saveError}</p>}
            <button className={`post_btn ${isWorking ? 'loading' : ''}`} onClick={handleSave} disabled={isWorking}>
              {isWorking ? 'Saving…' : 'Save Changes'}
            </button>
          </PreviewCard>
        </PreviewOverlay>
      )}
    </Wrapper>
  )
}

// ─── AudioPreview ─────────────────────────────────────────────────────────────
const AudioPreview = ({ audioURL, audioName }) => {
  const audioRef = useRef(null)
  const [playing, setPlaying]     = useState(false)
  const [duration, setDuration]   = useState(0)
  const [currentTime, setCurrent] = useState(0)
  const togglePlay = () => { if (!audioRef.current) return; playing ? audioRef.current.pause() : audioRef.current.play() }
  const fmt = s => !s || isNaN(s) ? '0:00' : `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`
  return (
    <AudioThumb>
      <audio ref={audioRef} src={audioURL} onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)} onTimeUpdate={() => setCurrent(audioRef.current?.currentTime || 0)} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => { setPlaying(false); setCurrent(0) }} />
      <button className="play_btn" onClick={togglePlay}>{playing ? <BsPauseFill /> : <BsPlayFill />}</button>
      <div className="audio_meta">
        <span className="audio_label">{audioName || 'Audio message'}</span>
        <span className="audio_dur">{fmt(currentTime)} / {fmt(duration)}</span>
      </div>
      <div className="progress_track"><div className="progress_fill" style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }} /></div>
    </AudioThumb>
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
    position: sticky;
    top: 0;
    z-index: 10;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1.5rem 1.5rem 0;
    background: #fff;
    border-bottom: 1px solid rgba(0,0,0,0.06);
    box-sizing: border-box;
  }

  .close_btn {
    position: absolute;
    left: 1.5rem;
    top: 1rem;
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
    display: flex;
    gap: 3rem;
    margin-top: 1rem;
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
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 480px;
  padding: 0 0.5rem;

  .canvas_unit {
    display: flex;
    flex-direction: column;
  }

  .aspect_header {
    background: #F1E5DF;
    border-radius: 12px 12px 0 0;
    padding: 0 1rem;
    height: 50px;
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
    background: #F7F0ED;
    border-radius: 0 0 12px 12px;
    overflow: hidden;
  }

  .canvas_wrap {
    display: flex;
    justify-content: center;
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
  width: 100%;
  aspect-ratio: ${({ $ratio }) => $ratio === 'landscape' ? '4 / 3' : $ratio === 'portrait' ? '3 / 4' : '1 / 1'};
  border-radius: 30px;
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

const PreviewOverlay = styled.div`
  position: fixed; inset: 0; z-index: 200;
  display: flex; align-items: center; justify-content: center;
  padding: 1rem; background: rgba(0,0,0,0.4); backdrop-filter: blur(2px);
`

const PreviewCard = styled.div`
  background: #fff; border-radius: 20px;
  width: 100%; max-width: 420px;
  display: flex; flex-direction: column; gap: 0.75rem;
  padding: 1.25rem;
  max-height: 90vh; overflow-y: auto;

  .preview_header {
    display: flex; align-items: center; justify-content: space-between;
    .preview_title { font-size: 1em; font-weight: 700; color: var(--text-color, #111); }
    .preview_close {
      width: 28px; height: 28px; border-radius: 50%;
      border: 1.5px solid #ECEFF3; background: transparent;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.1em; cursor: pointer; color: var(--text-color, #111);
      &:hover { border-color: var(--primary-color, #EF5A42); color: var(--primary-color, #EF5A42); }
    }
  }

  .snapshot_wrap {
    width: 100%; aspect-ratio: 1 / 1; border-radius: 12px; overflow: hidden;
    border: 1.5px solid #ECEFF3; background: #F3F4F6;
    .snapshot_img { width: 100%; height: 100%; object-fit: contain; display: block; }
  }

  .preview_error { font-size: 0.83em; color: #EF5A42; margin: 0; text-align: center; }

  .post_btn {
    width: 100%; height: 52px; border: none; border-radius: 26px;
    background: var(--primary-color, #EF5A42); color: #fff;
    font-size: 1em; font-weight: 700; cursor: pointer; transition: opacity 0.2s;
    &:hover { opacity: 0.88; }
    &.loading { opacity: 0.6; cursor: not-allowed; }
  }
`

const AudioThumb = styled.div`
  width: 100%; border-radius: 12px; border: 1.5px solid #ECEFF3;
  background: #F9FAFB; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 0.75rem;
  padding: 2rem 1.5rem; box-sizing: border-box;
  .play_btn { width: 68px; height: 68px; border-radius: 50%; border: none; background: var(--primary-color, #EF5A42); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 1.8em; cursor: pointer; padding-left: 4px; transition: transform 0.15s; &:hover { transform: scale(1.06); } svg { display: block; } }
  .audio_meta { display: flex; flex-direction: column; align-items: center; gap: 2px; }
  .audio_label { font-size: 0.88em; font-weight: 500; color: var(--text-color, #111); max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .audio_dur { font-size: 0.82em; font-variant-numeric: tabular-nums; color: #9CA3AF; }
  .progress_track { width: 100%; height: 4px; border-radius: 2px; background: #E5E7EB; overflow: hidden; }
  .progress_fill { height: 100%; border-radius: 2px; background: var(--primary-color, #EF5A42); transition: width 0.25s linear; }
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
  font-size: 0.85em; color: #EF5A42; margin: 0; line-height: 1.4;
`

const LoadMsg = styled.p`
  padding: 3rem 1.5rem; text-align: center; color: #9CA3AF; font-size: 0.95em;
`

export default EditMessagePage
