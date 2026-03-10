import React, { useState, useEffect, useCallback, useRef } from 'react'
import styled from 'styled-components'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, useNavigate } from 'react-router-dom'
import {
  BsChevronLeft, BsX, BsPencil, BsMic, BsCameraVideo,
  BsImage, BsTypeBold, BsBezier2, BsPalette2, BsBorderOuter,
  BsCheck2, BsCheckCircleFill, BsPlayFill, BsPauseFill,
} from 'react-icons/bs'

import { getMessage, editMessage} from '../../slices/messageSlice'
import { uploadFile }                from '../../slices/uploadSlice'

import ImageModal          from '../../modals/ImageModal'
import TextModal           from '../../modals/TextModal'
import VectorModal         from '../../modals/VectorModal'
import EditVectorModal     from '../../modals/EditVectorModal'
import BgModal             from '../../modals/BgModal'
import FrameModal          from '../../modals/FrameModal'
import DraggableCanvasItem from '../../canvas/DraggableCanvasItem'
import AudioTab            from '../../tab/AudioTab'



const EditMessagePage = () => {
  const { id }    = useParams()
  const navigate  = useNavigate()
  const dispatch  = useDispatch()
  const canvasRef = useRef(null)

  const { message, messageLoad, messageError, updateMessageLoad, updateMessageError, updateMessageErrorMsg } =
    useSelector(s => s.message)
  const { imageUploadLoad, audioUploadLoad } = useSelector(s => s.upload)

  // ── Derived message type ──────────────────────────────────────────────────────
  const msgType = message?.type  // 'emblem' | 'audio' | 'text'

  // ── Canvas state (emblem editing) ─────────────────────────────────────────────
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

  // ── Audio replacement state ───────────────────────────────────────────────────
  const [newAudioFile, setNewAudioFile]   = useState(null)
  const [newAudioURL, setNewAudioURL]     = useState(null)
  const [newAudioName, setNewAudioName]   = useState(null)

  // ── Preview / save state ──────────────────────────────────────────────────────
  const [showPreview, setShowPreview]             = useState(false)
  const [canvasSnapshot, setCanvasSnapshot]       = useState(null)
  const [pendingCanvasFile, setPendingCanvasFile] = useState(null)
  const [saveError, setSaveError]                 = useState('')
  const [saved, setSaved]                         = useState(false)

  // ── Load message ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (id) dispatch(getMessage(id))
  }, [id, dispatch])

  // ── Pre-populate canvas with whatever is restorable ───────────────────────────
  // Positions are not stored — elements start at sensible defaults.
  // The existing rendered image is shown as a read-only reference above the canvas.
  useEffect(() => {
    if (!message) return
    const c = message.content || {}

    if (message.type === 'emblem') {
      // Restore text if stored
      if (c.text) {
        setCanvasText({
          content:  c.text,
          color:    c.color  || '#111111',
          fontSize: 16,
          font:     c.font ? { family: c.font, label: c.font, style: {} } : null,
          position: { x: 50, y: 75 },
        })
      }
    }
    // Audio: nothing to pre-populate in canvas — AudioTab handles it
  }, [message])

  // ── Tools ─────────────────────────────────────────────────────────────────────
  const tools = [
    { id: 'image',  label: 'Image',  icon: <BsImage /> },
    { id: 'text',   label: 'Text',   icon: <BsTypeBold /> },
    { id: 'vector', label: 'Vector', icon: <BsBezier2 /> },
    { id: 'bg',     label: 'BG',     icon: <BsPalette2 /> },
    { id: 'frame',  label: 'Frame',  icon: <BsBorderOuter /> },
  ]

  const hasContent = canvasBg || canvasImage || canvasText || canvasVector || canvasFrame
  const VectorIcon = canvasVector?.icon
  const canvasStyle = { background: canvasBg ? canvasBg.value : '#F9FAFB' }
  const isWorking   = updateMessageLoad || imageUploadLoad || audioUploadLoad

  const handleToolClick = toolId =>
    setActiveModal(toolId === 'vector' && canvasVector ? 'editVector' : toolId)

  // ── Canvas capture ────────────────────────────────────────────────────────────
  const captureCanvasAsFile = useCallback(async () => {
    if (!canvasRef.current) throw new Error('Canvas element not found')
    const html2canvas = (await import('html2canvas')).default
    const uiOnly = canvasRef.current.querySelectorAll('.drag_hint, .remove_image_btn, .image_resize_bar')
    uiOnly.forEach(el => { el.style.visibility = 'hidden' })
    let canvasEl
    try {
      canvasEl = await html2canvas(canvasRef.current, {
        useCORS: true, allowTaint: false, backgroundColor: null, scale: 2, logging: false,
      })
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

  // ── Open preview (emblem path) ─────────────────────────────────────────────────
  const handlePreviewOpen = async () => {
    if (!hasContent) { setSaveError('Add something to the canvas first.'); return }
    setSaveError('')
    try {
      const file = await captureCanvasAsFile()
      setPendingCanvasFile(file)
      setCanvasSnapshot(URL.createObjectURL(file))
      setShowPreview(true)
    } catch {
      setSaveError('Failed to render canvas. Please try again.')
    }
  }

  // ── Save ──────────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    setSaveError('')
    try {
      // ── Audio path ────────────────────────────────────────────────────────────
      if (msgType === 'audio') {
        if (!newAudioFile) { setSaveError('Please record or upload a new audio to replace the current one.'); return }

        const uploadResult = await dispatch(uploadFile({ file: newAudioFile, type: 'audio' })).unwrap()
        if (uploadResult.status !== 'success') {
          setSaveError(uploadResult.response?.message || 'Audio upload failed'); return
        }
        const audioUrl = uploadResult.response.url || uploadResult.response.secure_url
        const publicId = uploadResult.response.public_id

        const result = await dispatch(editMessage({
          id,
          content:            { audioUrl, duration: null, text: null, imageUrls: [] },
          cloudinaryPublicId: publicId,
          fileType:           'audio',
        })).unwrap()

        if (result.status !== 'success') {
          setSaveError(result.response?.message || 'Failed to update message'); return
        }
        setSaved(true)
        setTimeout(() => navigate(-1), 1200)
        return
      }

      // ── Emblem path ───────────────────────────────────────────────────────────
      if (!pendingCanvasFile) {
        setSaveError('Preview render missing. Close preview and try again.'); return
      }

      const uploadResult = await dispatch(uploadFile({ file: pendingCanvasFile, type: 'image' })).unwrap()
      if (uploadResult.status !== 'success') {
        setSaveError(uploadResult.response?.message || 'Image upload failed'); return
      }
      const renderedImageUrl = uploadResult.response.url || uploadResult.response.secure_url
      const publicId         = uploadResult.response.public_id

      const result = await dispatch(editMessage({
        id,
        content: {
          text:       canvasText?.content      || null,
          font:       canvasText?.font?.family || null,
          color:      canvasText?.color        || null,
          background: canvasBg?.value          || null,
          frame:      canvasFrame
            ? `${canvasFrame.thickness}px ${canvasFrame.style} ${canvasFrame.color}` : null,
          imageUrls:  renderedImageUrl ? [renderedImageUrl] : [],
          vectorKey:  canvasVector?.id         || null,
          audioUrl: null, duration: null,
        },
        cloudinaryPublicId: publicId,
        fileType:           'image',
      })).unwrap()

      if (result.status !== 'success') {
        setSaveError(result.response?.message || 'Failed to update message'); return
      }
      setSaved(true)
      setTimeout(() => navigate(-1), 1200)
    } catch {
      setSaveError('Something went wrong. Please try again.')
    }
  }, [
    dispatch, id, msgType,
    pendingCanvasFile, newAudioFile,
    canvasText, canvasBg, canvasFrame, canvasVector,
    navigate,
  ])

  // ── Loading / error states ────────────────────────────────────────────────────
  if (messageLoad) return <Page><LoadMsg>Loading message…</LoadMsg></Page>
  if (messageError || !message) return <Page><LoadMsg>Message not found.</LoadMsg></Page>

  const existingImageUrl = message.content?.imageUrls?.[0] || null
  const existingAudioUrl = message.content?.audioUrl || null

  return (
    <Page>
      {/* Header */}
      <Header>
        <button className="back_btn" onClick={() => navigate(-1)}><BsChevronLeft /></button>
        <h1 className="page_title">Edit Message</h1>
        <div style={{ width: 36 }} />
      </Header>

      <Body>

        {/* ── Audio message editing ── */}
        {msgType === 'audio' && (
          <>
            {/* Existing audio */}
            {existingAudioUrl && !newAudioFile && (
              <CurrentSection>
                <SectionLabel>Current Audio</SectionLabel>
                <audio controls src={existingAudioUrl} style={{ width: '100%', borderRadius: 8 }} />
                <p className="replace_hint">Record or upload below to replace it.</p>
              </CurrentSection>
            )}

            {/* New audio picker */}
            <AudioTab
              onSend={(audioFile, audioName) => {
                setNewAudioFile(audioFile)
                // setNewAudioURL(URL.createObjectURL(audioFile))
                setNewAudioName(audioName)
              }}
            />

            {newAudioFile && (
              <NewAudioRow>
                <BsMic className="new_audio_icon" />
                <span className="new_audio_name">{newAudioName}</span>
                <button className="new_audio_remove" onClick={() => { setNewAudioFile(null); setNewAudioURL(null); setNewAudioName(null) }}>
                  <BsX />
                </button>
              </NewAudioRow>
            )}

            {(saveError || updateMessageError) && (
              <ErrorMsg>{saveError || updateMessageErrorMsg}</ErrorMsg>
            )}

            <SaveBtn onClick={handleSave} disabled={isWorking || !newAudioFile}>
              {isWorking ? 'Saving…' : saved ? '✓ Saved' : 'Save Changes'}
            </SaveBtn>
          </>
        )}

        {/* ── Emblem message editing ── */}
        {(msgType === 'emblem' || msgType === 'text' || !msgType) && (
          <>
            {/* Show existing rendered image as reference */}
            {existingImageUrl && (
              <CurrentSection>
                <SectionLabel>Current Message</SectionLabel>
                <div className="current_img_wrap">
                  <img src={existingImageUrl} alt="current message" />
                </div>
                <p className="replace_hint">Use the canvas below to create a replacement.</p>
              </CurrentSection>
            )}

            {/* Aspect ratio */}
            <div className="aspect_row">
              <span className="aspect_label">Aspect Ratio</span>
              <div className="ratio_toggles">
                <button
                  className={`ratio_btn square_btn ${aspectRatio === 'square' ? 'active' : ''}`}
                  onClick={() => setAspectRatio('square')} title="Square"
                >
                  {aspectRatio === 'square' && <BsCheck2 />}
                </button>
                <button
                  className={`ratio_btn portrait_btn ${aspectRatio === 'portrait' ? 'active' : ''}`}
                  onClick={() => setAspectRatio('portrait')} title="Portrait"
                >
                  {aspectRatio === 'portrait' && <BsCheck2 />}
                </button>
              </div>
            </div>

            {/* Canvas */}
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
                  }}>{canvasText.content}</p>
                </DraggableCanvasItem>
              )}
            </CanvasArea>

            {/* Toolbar */}
            <div className="toolbar">
              {tools.map(tool => {
                const isSet =
                  (tool.id === 'image' && canvasImage) || (tool.id === 'text' && canvasText) ||
                  (tool.id === 'vector' && canvasVector) || (tool.id === 'bg' && canvasBg) ||
                  (tool.id === 'frame' && canvasFrame)
                return (
                  <button key={tool.id} className={`tool_btn ${isSet ? 'set' : ''}`} onClick={() => handleToolClick(tool.id)}>
                    {tool.icon}<span>{tool.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Preview button */}
            <button
              className={`preview_btn ${hasContent ? 'ready' : ''}`}
              disabled={!hasContent}
              onClick={handlePreviewOpen}
            >
              {hasContent ? 'Preview changes' : 'Add content to canvas'}
            </button>

            {(saveError || updateMessageError) && (
              <ErrorMsg>{saveError || updateMessageErrorMsg}</ErrorMsg>
            )}

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

      </Body>

      {/* ── Preview overlay (emblem path only) ── */}
      {showPreview && (
        <PreviewOverlay>
          <PreviewCard>
            <div className="preview_header">
              <span className="preview_title">Preview New Version</span>
              <button className="preview_close" onClick={() => { setShowPreview(false); setPendingCanvasFile(null); setCanvasSnapshot(null) }}>
                <BsX />
              </button>
            </div>

            <div className="snapshot_wrap">
              {canvasSnapshot && <img src={canvasSnapshot} alt="preview" className="snapshot_img" />}
            </div>

            {(saveError || updateMessageError) && (
              <p className="preview_error">{saveError || updateMessageErrorMsg}</p>
            )}

            <button
              className={`save_btn ${isWorking ? 'loading' : ''} ${saved ? 'done' : ''}`}
              onClick={handleSave} disabled={isWorking || saved}
            >
              {saved ? '✓ Saved!' : isWorking ? 'Saving…' : 'Save Changes'}
            </button>
          </PreviewCard>
        </PreviewOverlay>
      )}

    </Page>
  )
}

// ─── Styled Components ────────────────────────────────────────────────────────

const Page = styled.div`
  min-height: 100vh; background: #F9FAFB; display: flex; flex-direction: column;
`

const Header = styled.div`
  position: sticky; top: 0; z-index: 20;
  display: flex; align-items: center; justify-content: space-between;
  padding: 1rem 1.25rem; background: #fff; border-bottom: 1px solid #ECEFF3;

  .back_btn {
    width: 36px; height: 36px; border-radius: 50%;
    border: 1.5px solid #ECEFF3; background: transparent; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-size: 1em; color: var(--text-color, #111);
    &:hover { border-color: var(--primary-color, #EF5A42); }
  }
  .page_title { font-size: 1em; font-weight: 700; margin: 0; color: var(--text-color, #111); }
`

const Body = styled.div`
  flex: 1; padding: 1.25rem;
  display: flex; flex-direction: column; gap: 1rem;
  max-width: 560px; width: 100%; margin: 0 auto; box-sizing: border-box;

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
      &.set { border-style: solid; border-color: var(--primary-color, #EF5A42); color: var(--primary-color, #EF5A42); background: rgba(239,90,66,0.04); }
    }
  }

  .preview_btn {
    width: 100%; height: 50px; border: none; border-radius: 25px;
    background: var(--primary-color, #EF5A42); color: #fff; font-size: 1em; font-weight: 600;
    cursor: not-allowed; opacity: 0.4; transition: opacity 0.2s;
    &.ready { opacity: 1; cursor: pointer; &:hover { opacity: 0.88; } }
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

const SectionLabel = styled.p`
  font-size: 0.82em; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.6px; color: #9CA3AF; margin: 0 0 0.5rem;
`

const CurrentSection = styled.div`
  background: #fff; border: 1.5px solid #ECEFF3; border-radius: 12px; padding: 1rem;

  .current_img_wrap {
    width: 100%; border-radius: 8px; overflow: hidden;
    img { width: 100%; display: block; object-fit: cover; }
  }
  .replace_hint {
    margin: 0.6rem 0 0; font-size: 0.8em; color: #9CA3AF; line-height: 1.4;
  }
`

const NewAudioRow = styled.div`
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.75rem 1rem; background: rgba(239,90,66,0.05);
  border: 1.5px solid rgba(239,90,66,0.2); border-radius: 10px;

  .new_audio_icon { color: var(--primary-color, #EF5A42); font-size: 1.1em; flex-shrink: 0; }
  .new_audio_name { flex: 1; font-size: 0.9em; font-weight: 500; color: var(--text-color, #111); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .new_audio_remove {
    border: none; background: transparent; cursor: pointer;
    color: #9CA3AF; font-size: 1.1em; display: flex; align-items: center;
    &:hover { color: #EF5A42; }
  }
`

const SaveBtn = styled.button`
  width: 100%; height: 52px; border: none; border-radius: 26px;
  background: var(--primary-color, #EF5A42); color: #fff;
  font-size: 1em; font-weight: 700; cursor: pointer; transition: opacity 0.2s;
  &:hover { opacity: 0.88; }
  &:disabled { opacity: 0.55; cursor: not-allowed; }
`

const ErrorMsg = styled.p`
  font-size: 0.85em; color: #EF5A42; margin: 0; line-height: 1.4;
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
  padding: 1.25rem; box-shadow: 0 16px 48px rgba(0,0,0,0.18);
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
    width: 100%; aspect-ratio: 1 / 1;
    border-radius: 12px; overflow: hidden;
    border: 1.5px solid #ECEFF3; background: #F3F4F6;
    .snapshot_img { width: 100%; height: 100%; object-fit: contain; display: block; }
  }

  .preview_error { font-size: 0.83em; color: #EF5A42; margin: 0; text-align: center; }

  .save_btn {
    width: 100%; height: 52px; border: none; border-radius: 26px;
    background: var(--primary-color, #EF5A42); color: #fff;
    font-size: 1em; font-weight: 700; cursor: pointer; transition: opacity 0.2s, background 0.2s;
    &:hover { opacity: 0.88; }
    &.loading { opacity: 0.6; cursor: not-allowed; }
    &.done { background: #10B981; cursor: default; }
  }
`

const LoadMsg = styled.p`
  padding: 3rem 1.5rem; text-align: center; color: #9CA3AF; font-size: 0.95em;
`

export default EditMessagePage