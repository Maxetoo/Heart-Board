import { useState, useCallback } from 'react'
import styled from 'styled-components'
import { useDispatch, useSelector } from 'react-redux'
import {useNavigate} from 'react-router-dom'
import {
  BsX, BsChevronRight, BsCheck2,
} from 'react-icons/bs'
import { PiTextAUnderlineBold, PiRectangleDashed, PiImageBold, PiPerspective } from "react-icons/pi";
import { IoColorPaletteOutline } from "react-icons/io5";
import { RiSketching } from "react-icons/ri";
import { createBoard }    from '../../slices/boardSlice'
import { postMessage }    from '../../slices/messageSlice'
import { uploadFile }     from '../../slices/uploadSlice'
import { createBoardUpgrade, CAPACITY_OPTIONS, PRIVACY_OPTIONS } from '../../slices/boardPaymentSlice'
import { EVENT_MAP }      from '../../constants/messageConstant'
  
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
import TagInput            from './TagInput'
import PreviewPanel, { SuccessScreen } from './PreviewPanel'
import LoginPopup from '../auth/LoginPopup'
 
const PostCreationComponent = ({ type, initialMention, activeTab = 'text' }) => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { createBoardLoad }                   = useSelector(s => s.board)
  const { postMessageLoad }                   = useSelector(s => s.message)
  const { audioUploadLoad }  = useSelector(s => s.upload)
  const { checkReceipentUser, receipentUser } = useSelector(s => s.user)  

  const [aspectRatio, setAspectRatio]     = useState(() => Math.random() < 0.5 ? 'portrait' : 'landscape')
  const [activeModal, setActiveModal]     = useState(null)
  const [selectedItem, setSelectedItem]   = useState(null)
  const [selectedEvent, setSelectedEvent] = useState(null)
 
  const [canvasBg, setCanvasBg]           = useState(null)
  const [canvasImages, setCanvasImages]   = useState([])  // [{ id, src, size, position }]
  const [canvasTexts, setCanvasTexts]     = useState([])  // [{ id, content, font, color, fontSize, position }]
  const [canvasVectors, setCanvasVectors] = useState([])  // [{ id, vectorId, icon, color, opacity, size, position }]
  const [editingItemId, setEditingItemId] = useState(null)
  const DEFAULT_FRAME = { style: 'solid', thickness: 25, radius: 30, color: '#111111', border: '25px solid #111111', borderRadius: '30px' }
  const [canvasFrame, setCanvasFrame]     = useState(DEFAULT_FRAME)
 
  const [showPreview, setShowPreview]   = useState(false)
  const [caption, setCaption]           = useState('')
  const [previewSubModal, setPreviewSubModal]     = useState(null)
  const [selectedCapacity, setSelectedCapacity]   = useState(CAPACITY_OPTIONS[0])
  const [selectedPrivacy, setSelectedPrivacy]     = useState(PRIVACY_OPTIONS[0])
  const [postSuccess, setPostSuccess]             = useState(false)
  const [createdBoardSlug, setCreatedBoardSlug]   = useState(null)
  const [postError, setPostError]                 = useState('')
  const [showLoginPopup, setShowLoginPopup]       = useState(false)
  const [mentionedUser, setMentionedUser]         = useState(null)
  const [boardTags, setBoardTags]                 = useState([])
  const [pendingAudioFile, setPendingAudioFile]   = useState(null)
  const [pendingAudioURL, setPendingAudioURL]     = useState(null)
  const [pendingAudioName, setPendingAudioName]   = useState(null)
 
  const isPosting = createBoardLoad || postMessageLoad || audioUploadLoad

  const tools = [
    { id: 'image',  label: 'Image',  icon: <PiImageBold />

     },
    { id: 'text',   label: 'Text',   icon: <PiTextAUnderlineBold />
     },
    { id: 'vector', label: 'Vector', icon: 
      <RiSketching />
     },
    { id: 'bg',     label: 'BG',     icon: <IoColorPaletteOutline /> },
    { id: 'frame',  label: 'Frame',  icon: <PiRectangleDashed /> },
  ]
 
  const hasContent = canvasBg || canvasImages.length > 0 || canvasTexts.length > 0 || canvasVectors.length > 0
  const canvasStyle = { background: canvasBg ? canvasBg.value : '#FFFFFF' }
 
  const isHashtagReceipent = mentionedUser?.startsWith('#')
  const recipentOk = isHashtagReceipent
    ? true  // hashtag receipents need no validation
    : initialMention
      ? (checkReceipentUser !== false)
      : (!receipentUser || receipentUser.length === 0 || checkReceipentUser)
 
  const handleToolClick = (toolId) => setActiveModal(toolId)
 
  const handlePost = useCallback(async () => {
    setPostError('')
    try {
      const eventValue = selectedEvent?.id ? (EVENT_MAP[selectedEvent.id] ?? 'other') : null
      // mentionedUser is either "@username" or "#hashtag"
      const receipent = mentionedUser
        ? mentionedUser.startsWith('#')
          ? mentionedUser          // pass "#hashtag" as-is — backend handles it
          : mentionedUser.replace('@', '')
        : undefined
 
      if (pendingAudioFile) {
        const uploadResult = await dispatch(uploadFile({ file: pendingAudioFile, type: 'audio' })).unwrap()
        if (uploadResult.status !== 'success') {
          setPostError(uploadResult.response?.message || 'Audio upload failed'); return
        }
        const audioUrl = uploadResult.response.url || uploadResult.response.secure_url
        const publicId = uploadResult.response.public_id
 
        const boardResult = await dispatch(createBoard({
          title: caption.trim() || 'My Appreciation Board',
          description: '', visibility: selectedPrivacy.value,
          receipent, event: eventValue, tags: boardTags,
        })).unwrap()
        if (boardResult.status !== 'success') {
          if (boardResult.code === 401) { setShowLoginPopup(true); return }
          setPostError(boardResult.response?.message || 'Failed to create board'); return
        }
 
        const msgResult = await dispatch(postMessage({
          slug:               boardResult.response.board.slug,
          type:               'audio',
          content:            { audioUrl, duration: null, text: null, imageUrls: [] },
          cloudinaryPublicId: publicId,
          fileType:           'audio',
        })).unwrap()
        if (msgResult.status !== 'success') {
          setPostError(msgResult.response?.message || 'Failed to post message'); return
        }
 
        if (selectedCapacity.price && boardResult.response.board._id) {
          dispatch(createBoardUpgrade({ boardId: boardResult.response.board._id, toTier: selectedCapacity.tier }))
          return
        }
        setCreatedBoardSlug(boardResult.response.board.slug)
        setPostSuccess(true); return
      }

      if (!hasContent) { setPostError('Add something to your canvas first.'); return }
 
      const boardResult = await dispatch(createBoard({
        title:       caption.trim() || 'My Appreciation Board',
        description: canvasTexts[0]?.content || '',
        visibility:  selectedPrivacy.value,
        receipent,
        event:       eventValue,
        tags:        boardTags,
      })).unwrap()
      if (boardResult.status !== 'success') {
        if (boardResult.code === 401) { setShowLoginPopup(true); return }
        setPostError(boardResult.response?.message || 'Failed to create board'); return
      }
 
      const msgResult = await dispatch(postMessage({
        slug: boardResult.response.board.slug,
        type: 'emblem',
        content: {
          text:       canvasTexts[0]?.content      || null,
          font:       canvasTexts[0]?.font?.family || null,
          color:      canvasTexts[0]?.color        || null,
          background: canvasBg?.value          || null,
          frame:      canvasFrame
            ? `${canvasFrame.thickness}px ${canvasFrame.style} ${canvasFrame.color}` : null,
          imageUrls:  [],
          vectorKey:  canvasVectors[0]?.vectorId   || null,
          audioUrl:   null, duration: null,
        },
        canvasData: {
          canvasTexts,
          canvasBg,
          canvasFrame,
          canvasVectors: canvasVectors.map(v => ({ ...v, icon: v.vectorId })),
          canvasImages,
          aspectRatio,
        },
      })).unwrap()
      if (msgResult.status !== 'success') {
        setPostError(msgResult.response?.message || 'Failed to post message'); return
      }
 
      if (selectedCapacity.price && boardResult.response.board._id) {
        dispatch(createBoardUpgrade({ boardId: boardResult.response.board._id, toTier: selectedCapacity.tier }))
        return
      }
      setCreatedBoardSlug(boardResult.response.board.slug)
      setPostSuccess(true)
    } catch {
      setPostError('Something went wrong. Please try again.')
    }
  }, [
    dispatch, hasContent, caption, selectedEvent, mentionedUser,
    selectedPrivacy, selectedCapacity, canvasTexts, canvasBg, canvasFrame, canvasVectors,
    canvasImages, aspectRatio, boardTags, pendingAudioFile,
  ])
 
  const closePreview = () => {
    setShowPreview(false); setPreviewSubModal(null); setPostError('')
    setPendingAudioFile(null); setPendingAudioURL(null); setPendingAudioName(null)
  }
  const resetAll = () => {
    navigate('/profile')
    setPostSuccess(false); setShowPreview(false)
    setPendingAudioFile(null); setPendingAudioURL(null); setPendingAudioName(null)
  }
 
  return (
    <>
    <PostCreationWrapper>

      {type === 'board' && (
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

      <TagInput onMentionChange={setMentionedUser} onTagsChange={setBoardTags} initialMention={initialMention} />

      {activeTab === 'text' && (
        <>
          <div className="canvas_unit">
          <div className="aspect_header">
            <span className="aspect_label"><PiPerspective /> Aspect Ratio</span>
            <div className="ratio_toggles">
              <button
                className={`ratio_btn portrait_btn ${aspectRatio === 'portrait' ? 'active' : ''}`}
                onClick={() => setAspectRatio('portrait')}
                title="Portrait (6:13)"
              >
                {aspectRatio === 'portrait' && <BsCheck2 />}
              </button>
              <button
                className={`ratio_btn landscape_btn ${aspectRatio === 'landscape' ? 'active' : ''}`}
                onClick={() => setAspectRatio('landscape')}
                title="Landscape (16:9)"
              >
                {aspectRatio === 'landscape' && <BsCheck2 />}
              </button>
            </div>
          </div>

          <div className="aspect_container">
            <div className="canvas_wrap">
            <CanvasArea
              $ratio={aspectRatio}
              style={{
                ...canvasStyle,
                ...(canvasFrame ? { border: canvasFrame.border, borderRadius: canvasFrame.borderRadius } : {}),
              }}
              data-canvas="true"
              onClick={() => setSelectedItem(null)}
            >
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
                    <img
                      src={img.src} alt="canvas" className="canvas_image"
                      style={{ width: `${img.size * 2}px`, height: `${img.size * 2}px` }}
                    />
                    <button
                      className="remove_image_btn"
                      onMouseDown={e => e.stopPropagation()}
                      onClick={e => { e.stopPropagation(); setCanvasImages(prev => prev.filter(i => i.id !== img.id)) }}
                    >
                      <BsX />
                    </button>
                    {selectedItem?.id === img.id && (
                      <div
                        className="image_resize_bar"
                        onMouseDown={e => e.stopPropagation()}
                        onClick={e => e.stopPropagation()}
                      >
                        <input
                          type="range" min="30" max="180" step="2"
                          value={img.size}
                          onChange={e => setCanvasImages(prev => prev.map(i => i.id === img.id ? { ...i, size: Number(e.target.value) } : i))}
                        />
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
                    <VIcon style={{
                      color: vec.color, opacity: vec.opacity,
                      fontSize: vec.size ?? 48, display: 'block',
                    }} />
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
                  <p style={{
                    margin: 0,
                    fontFamily: txt.font?.family,
                    color: txt.color,
                    fontSize: txt.fontSize ?? 16,
                    maxWidth: 200, textAlign: 'center',
                    lineHeight: 1.35, wordBreak: 'break-word',
                    ...txt.font?.style,
                  }}>
                    {txt.content}
                  </p>
                </DraggableCanvasItem>
              ))}
            </CanvasArea>
            </div>
          </div>
          </div>

          <div className="toolbar">
            {tools.map(tool => {
              return (
                <button
                  key={tool.id}
                  className="tool_btn"
                  onClick={() => handleToolClick(tool.id)}
                >
                  {tool.icon}<span>{tool.label}</span>
                </button>
              )
            })}
          </div>

          <button
            className={`preview_btn ${hasContent && recipentOk ? 'ready' : ''}`}
            disabled={!hasContent || !recipentOk}
            onClick={() => {
              if (!hasContent || !recipentOk) return
              setShowPreview(true)
            }}
          >
            {hasContent ? 'Send appreciation' : 'Preview'}
          </button>
        </>
      )}

      {activeTab === 'audio' && (
        <AudioTab
          onSend={(audioFile, audioName) => {
            setPendingAudioFile(audioFile)
            setPendingAudioURL(URL.createObjectURL(audioFile))
            setPendingAudioName(audioName)
            setShowPreview(true)
          }}
        />
      )}

      {activeTab === 'video' && <VideoTab />}

      {activeModal === 'event'  && <EventModal  onClose={() => setActiveModal(null)} currentEvent={selectedEvent} onConfirm={ev  => { setSelectedEvent(ev); setActiveModal(null) }} />}
      {activeModal === 'image'  && <ImageModal  onClose={() => setActiveModal(null)} currentImage={null} onConfirm={src => { setCanvasImages(prev => [...prev, { id: Date.now(), src, size: 80, position: { x: 50, y: 50 } }]); setActiveModal(null) }} />}
      {activeModal === 'editImage' && (() => { const img = canvasImages.find(i => i.id === editingItemId); return img ? <ImageModal onClose={() => setActiveModal(null)} currentImage={img.src} onConfirm={src => { setCanvasImages(prev => prev.map(i => i.id === editingItemId ? { ...i, src } : i)); setActiveModal(null) }} /> : null })()}
      {activeModal === 'text'   && <TextModal   onClose={() => setActiveModal(null)} currentText={null}  onConfirm={t => { setCanvasTexts(prev => [...prev, { ...t, id: Date.now(), position: { x: 50, y: 50 } }]); setActiveModal(null) }} />}
      {activeModal === 'editText' && (() => { const txt = canvasTexts.find(t => t.id === editingItemId); return txt ? <TextModal onClose={() => setActiveModal(null)} currentText={txt} onConfirm={t => { setCanvasTexts(prev => prev.map(item => item.id === editingItemId ? { ...item, ...t } : item)); setActiveModal(null) }} onRemove={() => { setCanvasTexts(prev => prev.filter(t => t.id !== editingItemId)); setSelectedItem(null); setActiveModal(null) }} /> : null })()}
      {activeModal === 'vector' && <VectorModal onClose={() => setActiveModal(null)} onConfirm={v => { setCanvasVectors(prev => [...prev, { ...v, id: Date.now(), size: 48, position: { x: 50, y: 30 } }]); setActiveModal(null) }} />}
      {activeModal === 'editVector' && (() => { const vec = canvasVectors.find(v => v.id === editingItemId); return vec ? <EditVectorModal onClose={() => setActiveModal(null)} vector={vec} onUpdate={updates => setCanvasVectors(prev => prev.map(v => v.id === editingItemId ? { ...v, ...updates } : v))} onRemove={() => { setCanvasVectors(prev => prev.filter(v => v.id !== editingItemId)); setActiveModal(null); setSelectedItem(null) }} /> : null })()}
      {activeModal === 'bg'    && <BgModal    onClose={() => setActiveModal(null)} currentBg={canvasBg}       onConfirm={bg    => { setCanvasBg(bg);       setActiveModal(null) }} />}
      {activeModal === 'frame' && <FrameModal onClose={() => setActiveModal(null)} currentFrame={canvasFrame} onConfirm={frame => { setCanvasFrame(frame); setActiveModal(null) }} />}

      {showPreview && !postSuccess && (
        <PreviewPanel
          canvasData={activeTab === 'text' ? {
            canvasTexts,
            canvasBg,
            canvasFrame,
            canvasVectors: canvasVectors.map(v => ({ ...v, icon: v.vectorId })),
            canvasImages,
            aspectRatio,
          } : null}
          audioURL={pendingAudioURL}
          audioName={pendingAudioName}
          caption={caption}
          setCaption={setCaption}
          selectedCapacity={selectedCapacity}
          setSelectedCapacity={setSelectedCapacity}
          selectedPrivacy={selectedPrivacy}
          setSelectedPrivacy={setSelectedPrivacy}
          previewSubModal={previewSubModal}
          setPreviewSubModal={setPreviewSubModal}
          onClose={closePreview}
          onPost={handlePost}
          isPosting={isPosting}
          postError={postError}
        />
      )}

      {postSuccess && (
        <SuccessScreen
          isAudio={!!pendingAudioFile}
          canvasData={!pendingAudioFile ? {
            canvasTexts,
            canvasBg,
            canvasFrame,
            canvasVectors: canvasVectors.map(v => ({ ...v, icon: v.vectorId })),
            canvasImages,
            aspectRatio,
          } : null}
          boardSlug={createdBoardSlug}
          onDone={resetAll}
          onViewPost={() => { resetAll(); navigate(`/board/${createdBoardSlug}`) }}
        />
      )}

    </PostCreationWrapper>

    {showLoginPopup && (
      <LoginPopup
        onClose={() => setShowLoginPopup(false)}
        message="Sign in to create your board"
      />
    )}
    </>
  )
}

const CanvasArea = styled.div`
  aspect-ratio: ${({ $ratio }) => $ratio === 'landscape' ? '4 / 3' : '3 / 4'};
  width: ${({ $ratio }) => $ratio === 'landscape' ? '100%' : '82%'};
  border-radius: 30px;
  border: none;
  overflow: hidden;
  position: relative;
  transition: aspect-ratio 0.3s ease, width 0.3s ease;

  .canvas_image {
    display: block;
    object-fit: cover;
    border-radius: 6px;
    transition: width 0.08s, height 0.08s;
    pointer-events: none;
  }

  .remove_image_btn {
    position: absolute; top: -10px; right: -10px; z-index: 5;
    width: 22px; height: 22px; border-radius: 50%;
    background: rgba(0,0,0,0.6); border: none; color: #fff;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.9em; cursor: pointer; transition: background 0.2s;
    &:hover { background: rgba(0,0,0,0.85); }
  }

  .image_resize_bar {
    position: absolute; bottom: -28px; left: 50%; transform: translateX(-50%);
    z-index: 5; background: rgba(0,0,0,0.5); border-radius: 99px;
    padding: 3px 10px; display: flex; align-items: center;
    input[type='range'] { width: 80px; height: 3px; accent-color: #fff; cursor: pointer; }
  }
`

const PostCreationWrapper = styled.div`
  display: flex; 
  flex-direction: column; 
  gap: 1rem;
  width: 100%;
  max-width: 480px;
  padding: 0 0.5rem;

  .select_row {
    display: flex; 
    align-items: center; 
    justify-content: space-between;
    padding: 0 1rem; 
    height: 50px;
    background: #F7F0ED;
    border-radius: 10px;
    border: none;
    cursor: pointer;
    .select_placeholder { font-size: 0.95em; color: #9CA3AF; flex: 1; }
    .select_event_emoji { font-size: 1.1em; margin-right: 0.5rem; flex-shrink: 0; }
    .select_value { flex: 1; font-size: 0.95em; font-weight: 500; color: var(--text-color, #111); }
    .select_arrow { color: #9CA3AF; font-size: 0.9em; flex-shrink: 0; }
  }

  .canvas_unit {
    display: flex;
    flex-direction: column;
  }

  .aspect_header {
    background: #F1E5DF;
    border-radius: 12px 12px 0 0;
    padding: 0 1rem;
    height: 50px;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    .aspect_label {
      flex: 1;
      font-size: 0.95em;
      font-weight: 500;
      color: var(--text-color, #111);
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .ratio_toggles { display: flex; gap: 6px; align-items: center; }
    .ratio_btn {
      display: flex; 
      align-items: center; 
      justify-content: center;
      border: 1.5px solid #ECEFF3; 
      background: #fff;
      cursor: pointer; 
      color: #10B981;
      font-size: 1em; 
      border-radius: 5px;
      transition: border-color 0.2s, background 0.2s;
      &.portrait_btn  { width: 24px; height: 36px; }
      &.landscape_btn { width: 40px; height: 26px; }
      &.active { 
        border-color: #10B981; 
        background: #fff;
      }
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
    display: flex; 
    gap: 6px;
    .tool_btn {
      flex: 1; 
      display: flex; 
      flex-direction: column; 
      align-items: center; 
      justify-content: center;
      gap: 4px; 
      padding: 0.6rem 0.25rem;
      background: #fff;
      border: 1.5px dashed #D1D5DB; 
      border-radius: 10px;
      color: var(--light-text-color, #6B7280); 
      font-size: 0.75em; 
      cursor: pointer;
      transition: border-color 0.2s, color 0.2s, background 0.2s;
      svg { font-size: 1.2em; }
      &:hover { 
        border-color: var(--primary-color, #EF5A42); 
        color: var(--primary-color, #EF5A42); 
      }
      &.set { 
        border-style: solid; 
        border-color: var(--primary-color, #EF5A42); 
        color: var(--primary-color, #EF5A42); 
        background: rgba(239,90,66,0.04); 
      }
    }
  }

  .preview_btn {
    width: 100%; 
    height: 50px; 
    border: none; 
    border-radius: 25px;
    background: var(--primary-color, #EF5A42); 
    color: #fff; 
    font-size: 1em; 
    font-weight: 600;
    cursor: not-allowed; 
    opacity: 0.4; 
    transition: opacity 0.2s;
    &.ready { 
      opacity: 1; 
      cursor: pointer; 
      &:hover { opacity: 0.88; } 
    }
  }
`

export default PostCreationComponent