// import React, { useState, useCallback, useRef } from 'react'
// import styled from 'styled-components'
// import { useDispatch, useSelector } from 'react-redux'
// import {
//   BsX, BsPencil, BsMic, BsCameraVideo,
//   BsImage, BsTypeBold, BsBezier2, BsPalette2, BsBorderOuter,
//   BsChevronRight, BsCheck2,
// } from 'react-icons/bs'

// import { createBoard }    from '../../slices/boardSlice'
// import { postMessage }    from '../../slices/messageSlice'
// import { uploadFile }     from '../../slices/uploadSlice'
// import { createBoardUpgrade, CAPACITY_OPTIONS, PRIVACY_OPTIONS } from '../../slices/boardPaymentSlice'
// import { EVENT_MAP }      from '../../constants/messageConstant'

// import ImageModal         from '../../modals/ImageModal'
// import TextModal          from '../../modals/TextModal'
// import VectorModal        from '../../modals/VectorModal'
// import EditVectorModal    from '../../modals/EditVectorModal'
// import BgModal            from '../../modals/BgModal'
// import FrameModal         from '../../modals/FrameModal'
// import EventModal         from '../../modals/EventModal'
// import DraggableCanvasItem from '../../canvas/DraggableCanvasItem'
// import AudioTab           from '../../tab/AudioTab'
// import VideoTab           from '../../tab/VideoTab'
// import TagInput           from './TagInput'
// import PreviewPanel, { SuccessScreen } from './PreviewPanel'

// const PostCreationComponent = ({ type }) => {
//   const dispatch = useDispatch()
//   const { createBoardLoad }  = useSelector(s => s.board)
//   const { postMessageLoad }  = useSelector(s => s.message)
//   const { imageUploadLoad, audioUploadLoad } = useSelector(s => s.upload)
//   const { checkReceipentUser, receipentUser} = useSelector(state => state.user) 
  

//   // ── canvas state ─────────────────────────────────────────────────────────────
//   const [activeTab, setActiveTab]         = useState('text')
//   const [aspectRatio, setAspectRatio]     = useState('square')
//   const [activeModal, setActiveModal]     = useState(null)
//   const [selectedItem, setSelectedItem]   = useState(null)
//   const [selectedEvent, setSelectedEvent] = useState(null)

//   const [canvasBg, setCanvasBg]               = useState(null)
//   const [canvasImage, setCanvasImage]         = useState(null)
//   const [imageSize, setImageSize]             = useState(80)
//   const [imagePosition, setImagePosition]     = useState({ x: 50, y: 50 })
//   const [canvasText, setCanvasText]           = useState(null)
//   const [canvasVector, setCanvasVector]       = useState(null)
//   const [canvasFrame, setCanvasFrame]         = useState(null)

//   // ── preview / post state ──────────────────────────────────────────────────────
//   const [showPreview, setShowPreview]         = useState(false)
//   const [canvasSnapshot, setCanvasSnapshot]   = useState(null)   // object URL of captured canvas PNG
//   const [pendingCanvasFile, setPendingCanvasFile] = useState(null) // File blob reused on Post
//   const [caption, setCaption]                 = useState('')
//   const [previewSubModal, setPreviewSubModal] = useState(null)
//   const [selectedCapacity, setSelectedCapacity] = useState(CAPACITY_OPTIONS[1])
//   const [selectedPrivacy, setSelectedPrivacy]   = useState(PRIVACY_OPTIONS[0])
//   const [postSuccess, setPostSuccess]         = useState(false)
//   const [postError, setPostError]             = useState('')
//   const [mentionedUser, setMentionedUser]     = useState(null)
//   const [boardTags, setBoardTags]             = useState([])
//   const [pendingAudioFile, setPendingAudioFile] = useState(null)
//   const [pendingAudioURL,  setPendingAudioURL]  = useState(null)   // object URL for preview player
//   const [pendingAudioName, setPendingAudioName] = useState(null)

//   // ── canvas DOM ref (for html2canvas capture) ──────────────────────────────────
//   const canvasRef = useRef(null)

//   // ── derived ───────────────────────────────────────────────────────────────────
//   const tabs  = [
//     { id: 'text',  label: 'Text',  icon: <BsPencil /> },
//     { id: 'audio', label: 'Audio', icon: <BsMic /> },
//     { id: 'video', label: 'Video', icon: <BsCameraVideo /> },
//   ]
//   const tools = [
//     { id: 'image',  label: 'Image',  icon: <BsImage /> },
//     { id: 'text',   label: 'Text',   icon: <BsTypeBold /> },
//     { id: 'vector', label: 'Vector', icon: <BsBezier2 /> },
//     { id: 'bg',     label: 'BG',     icon: <BsPalette2 /> },
//     { id: 'frame',  label: 'Frame',  icon: <BsBorderOuter /> },
//   ]

//   const hasContent  = canvasBg || canvasImage || canvasText || canvasVector || canvasFrame
//   const VectorIcon  = canvasVector?.icon
//   const canvasStyle = { background: canvasBg ? canvasBg.value : '#F9FAFB' }
//   const isPosting   = createBoardLoad || postMessageLoad || imageUploadLoad || audioUploadLoad

//   const handleToolClick = (toolId) => {
//     setActiveModal(toolId === 'vector' && canvasVector ? 'editVector' : toolId)
//   }

//   // ── canvas capture → upload → post ───────────────────────────────────────────
//   //
//   // Strategy: render the entire canvas DOM element to a PNG blob using html2canvas,
//   // upload that single image to Cloudinary via the existing /api/v1/upload endpoint,
//   // then store the returned URL in content.imageUrls[0].
//   //
//   // This means the backend model requires ZERO changes — imageUrls already exists,
//   // type 'emblem' already exists, and the upload controller already handles images.
//   // Every visual element (bg, image, text, vector, frame) is baked into one image.
//   //
//   const captureCanvasAsFile = useCallback(async () => {
//     if (!canvasRef.current) throw new Error('Canvas element not found')

//     // Dynamically import html2canvas so it doesn't bloat initial bundle
//     const html2canvas = (await import('html2canvas')).default

//     // Temporarily hide UI-only overlays (drag hints, remove buttons) before capture
//     const hints = canvasRef.current.querySelectorAll('.drag_hint, .remove_image_btn, .image_resize_bar')
//     hints.forEach(el => { el.style.visibility = 'hidden' })

//     let canvasEl
//     try {
//       canvasEl = await html2canvas(canvasRef.current, {
//         useCORS:         true,   // allow cross-origin images (e.g. user uploads)
//         allowTaint:      false,
//         backgroundColor: null,   // preserve transparent / gradient backgrounds
//         scale:           2,      // 2× for retina-quality output
//         logging:         false,
//       })
//     } finally {
//       hints.forEach(el => { el.style.visibility = '' })
//     }

//     // Convert canvas element → Blob → File
//     return new Promise((resolve, reject) => {
//       canvasEl.toBlob((blob) => {
//         if (!blob) { reject(new Error('Canvas toBlob failed')); return }
//         resolve(new File([blob], `canvas_${Date.now()}.png`, { type: 'image/png' }))
//       }, 'image/png', 0.95)
//     })
//   }, [])

//   const handlePost = useCallback(async () => {
//     setPostError('')
//     try {
//       const eventValue = selectedEvent?.id ? (EVENT_MAP[selectedEvent.id] ?? 'other') : null
//       const receipent  = mentionedUser?.replace('@', '') || undefined

//       // ── Audio branch ──────────────────────────────────────────────────────────
//       if (pendingAudioFile) {
//         const uploadResult = await dispatch(
//           uploadFile({ file: pendingAudioFile, type: 'audio' })
//         ).unwrap()
//         if (uploadResult.status !== 'success') {
//           setPostError(uploadResult.response?.message || 'Audio upload failed')
//           return
//         }
//         const audioUrl   = uploadResult.response.url || uploadResult.response.secure_url
//         const publicId   = uploadResult.response.public_id

//         const boardResult = await dispatch(createBoard({
//           title:      caption.trim() || 'My Appreciation Board',
//           description: '',
//           visibility:  selectedPrivacy.value,
//           receipent,
//           event:       eventValue,
//           tags:        boardTags,
//         })).unwrap()
//         if (boardResult.status !== 'success') {
//           setPostError(boardResult.response?.message || 'Failed to create board')
//           return
//         }

//         // const msgResult = await dispatch(postMessage({
//         //   slug:                boardResult.response.board.slug,
//         //   type:                'audio',
//         //   content:             { audioUrl, duration: null, text: null, imageUrls: [] },
//         //   cloudinaryPublicId:  publicId,   // ← worker uses this for rollback
//         //   fileType:            'audio',
//         // })).unwrap()

//         const msgResult = await dispatch(postMessage({
//           slug: boardResult.response.board.slug,
//           type: 'emblem',
//           content: {
//             imageUrls:  [renderedImageUrl],
//             audioUrl:   null,
//             duration:   null,
//             // keep lightweight text fields for search/display
//             text:       canvasText?.content  || null,
//             background: canvasBg?.value      || null,
//           },
//           cloudinaryPublicId: publicId,
//           fileType: 'image',
//           // ── full layer data for re-editing ───────────────────────────────
//           canvasData: {
//             canvasText,
//             canvasBg,
//             canvasFrame,
//             canvasVector: canvasVector
//               ? { ...canvasVector, icon: canvasVector.id }  // store id, not the component ref
//               : null,
//             canvasImage,      // base64 — user's original upload
//             imageSize,
//             imagePosition,
//             aspectRatio,
//           },
//         })).unwrap()

//         if (msgResult.status !== 'success') {
//           setPostError(msgResult.response?.message || 'Failed to post message')
//           return
//         }

//         if (selectedCapacity.price && boardResult.response.board._id) {
//           await dispatch(createBoardUpgrade({ boardId: boardResult.response.board._id, toTier: selectedCapacity.tier }))
//           return
//         }
//         setPostSuccess(true)
//         return
//       }

//       // ── Canvas / emblem branch ────────────────────────────────────────────────
//       if (!hasContent) {
//         setPostError('Add something to your canvas first.')
//         return
//       }

//       // Canvas was already captured when the user opened preview — reuse that file.
//       // This avoids a second html2canvas call and guarantees upload matches what was previewed.
//       if (!pendingCanvasFile) {
//         setPostError('Preview render missing. Please close and try again.')
//         return
//       }

//       const uploadResult = await dispatch(
//         uploadFile({ file: pendingCanvasFile, type: 'image' })
//       ).unwrap()
//       if (uploadResult.status !== 'success') {
//         setPostError(uploadResult.response?.message || 'Image upload failed')
//         return
//       }
//       const renderedImageUrl  = uploadResult.response.url || uploadResult.response.secure_url
//       const publicId          = uploadResult.response.public_id

//       const boardResult = await dispatch(createBoard({
//         title:              caption.trim() || 'My Appreciation Board',
//         description:        canvasText?.content || '',
//         visibility:         selectedPrivacy.value,
//         receipent,
//         event:              eventValue,
//         coverImage:         renderedImageUrl || null,
//         coverImagePublicId: publicId || null,          // ← worker uses this for rollback
//         tags:               boardTags,
//       })).unwrap()
//       if (boardResult.status !== 'success') {
//         setPostError(boardResult.response?.message || 'Failed to create board')
//         return
//       }

//       const msgResult = await dispatch(postMessage({
//         slug: boardResult.response.board.slug,
//         type: 'emblem',
//         content: {
//           text:       canvasText?.content       || null,
//           font:       canvasText?.font?.family  || null,
//           color:      canvasText?.color         || null,
//           background: canvasBg?.value           || null,
//           frame:      canvasFrame
//             ? `${canvasFrame.thickness}px ${canvasFrame.style} ${canvasFrame.color}`
//             : null,
//           imageUrls:  renderedImageUrl ? [renderedImageUrl] : [],
//           vectorKey:  canvasVector?.id          || null,
//           audioUrl:   null,
//           duration:   null,
//         },
//         cloudinaryPublicId: publicId,    // ← worker uses this for rollback
//         fileType:           'image',
//       })).unwrap()
//       if (msgResult.status !== 'success') {
//         setPostError(msgResult.response?.message || 'Failed to post message')
//         return
//       }

//       if (selectedCapacity.price && boardResult.response.board._id) {
//         await dispatch(createBoardUpgrade({
//           boardId: boardResult.response.board._id,
//           toTier:  selectedCapacity.tier,
//         }))
//         return
//       }

//       setPostSuccess(true)
//     } catch {
//       setPostError('Something went wrong. Please try again.')
//     }
//   }, [
//     dispatch, hasContent, pendingCanvasFile, caption, selectedEvent, mentionedUser,
//     selectedPrivacy, selectedCapacity, canvasText, canvasBg, canvasFrame, canvasVector,
//     boardTags, pendingAudioFile,
//   ])

//   return (
//     <PostCreationWrapper>
//       {/* ── Tab Switcher ── */}
//       <div className="tab_switcher">
//         {tabs.map((tab) => (
//           <button
//             key={tab.id}
//             className={`tab_btn ${activeTab === tab.id ? 'active' : ''}`}
//             onClick={() => setActiveTab(tab.id)}
//           >
//             {tab.icon}
//             <span>{tab.label}</span>
//           </button>
//         ))}
//       </div>

//       {/* ── Select Event (board only) ── */}
//       {type === 'board' && (
//         <div className="select_row" onClick={() => setActiveModal('event')}>
//           {selectedEvent ? (
//             <>
//               <span className="select_event_emoji">{selectedEvent.emoji}</span>
//               <span className="select_value">{selectedEvent.label}</span>
//             </>
//           ) : (
//             <span className="select_placeholder">Select Event</span>
//           )}
//           <BsChevronRight className="select_arrow" />
//         </div>
//       )}

//       {/* ── Send To / Tag Input ── */}
//       <TagInput onMentionChange={setMentionedUser} onTagsChange={setBoardTags} />

//       {/* ── Text Tab Content ── */}
//       {activeTab === 'text' && (
//         <>
//           {/* Aspect Ratio */}
//           <div className="aspect_row">
//             <span className="aspect_label">Aspect Ratio</span>
//             <div className="ratio_toggles">
//               <button
//                 className={`ratio_btn square_btn ${aspectRatio === 'square' ? 'active' : ''}`}
//                 onClick={() => setAspectRatio('square')}
//                 title="Square (1:1)"
//               >
//                 {aspectRatio === 'square' && <BsCheck2 />}
//               </button>
//               <button
//                 className={`ratio_btn portrait_btn ${aspectRatio === 'portrait' ? 'active' : ''}`}
//                 onClick={() => setAspectRatio('portrait')}
//                 title="Portrait (4:5)"
//               >
//                 {aspectRatio === 'portrait' && <BsCheck2 />}
//               </button>
//             </div>
//           </div>

//           {/* Canvas */}
//           <CanvasArea
//             ref={canvasRef}
//             $ratio={aspectRatio}
//             style={{
//               ...canvasStyle,
//               ...(canvasFrame ? { border: canvasFrame.border, borderRadius: canvasFrame.borderRadius } : {}),
//             }}
//             data-canvas="true"
//             onClick={() => setSelectedItem(null)}
//           >
//             {canvasImage && (
//               <DraggableCanvasItem
//                 position={imagePosition}
//                 onPositionChange={setImagePosition}
//                 selected={selectedItem === 'image'}
//                 onSelect={() => setSelectedItem('image')}
//                 onTap={() => setActiveModal('image')}
//               >
//                 <div style={{ position: 'relative' }}>
//                   <img
//                     src={canvasImage}
//                     alt="canvas"
//                     className="canvas_image"
//                     style={{ width: `${imageSize * 2}px`, height: `${imageSize * 2}px` }}
//                   />
//                   <button
//                     className="remove_image_btn"
//                     onMouseDown={(e) => e.stopPropagation()}
//                     onClick={(e) => { e.stopPropagation(); setCanvasImage(null); setImageSize(80); setImagePosition({ x: 50, y: 50 }) }}
//                     title="Remove image"
//                   >
//                     <BsX />
//                   </button>
//                   {selectedItem === 'image' && (
//                     <div
//                       className="image_resize_bar"
//                       onMouseDown={(e) => e.stopPropagation()}
//                       onClick={(e) => e.stopPropagation()}
//                     >
//                       <input
//                         type="range"
//                         min="30" max="180" step="2"
//                         value={imageSize}
//                         onChange={(e) => setImageSize(Number(e.target.value))}
//                       />
//                     </div>
//                   )}
//                 </div>
//               </DraggableCanvasItem>
//             )}

//             {canvasVector && VectorIcon && (
//               <DraggableCanvasItem
//                 position={canvasVector.position}
//                 onPositionChange={(pos) => setCanvasVector(prev => ({ ...prev, position: pos }))}
//                 selected={selectedItem === 'vector'}
//                 onSelect={() => setSelectedItem('vector')}
//                 onTap={() => setActiveModal('editVector')}
//               >
//                 <VectorIcon
//                   style={{
//                     color:    canvasVector.color,
//                     opacity:  canvasVector.opacity,
//                     fontSize: canvasVector.size ?? 48,
//                     display:  'block',
//                   }}
//                 />
//               </DraggableCanvasItem>
//             )}

//             {canvasText && (
//               <DraggableCanvasItem
//                 position={canvasText.position}
//                 onPositionChange={(pos) => setCanvasText(prev => ({ ...prev, position: pos }))}
//                 selected={selectedItem === 'text'}
//                 onSelect={() => setSelectedItem('text')}
//                 onTap={() => setActiveModal('text')}
//               >
//                 <p
//                   style={{
//                     margin:     0,
//                     fontFamily: canvasText.font?.family,
//                     color:      canvasText.color,
//                     fontSize:   canvasText.fontSize ?? 16,
//                     maxWidth:   200,
//                     textAlign:  'center',
//                     lineHeight: 1.35,
//                     wordBreak:  'break-word',
//                     ...canvasText.font?.style,
//                   }}
//                 >
//                   {canvasText.content}
//                 </p>
//               </DraggableCanvasItem>
//             )}
//           </CanvasArea>

//           {/* Toolbar */}
//           <div className="toolbar">
//             {tools.map((tool) => {
//               const isSet =
//                 (tool.id === 'image'  && canvasImage)  ||
//                 (tool.id === 'text'   && canvasText)   ||
//                 (tool.id === 'vector' && canvasVector)  ||
//                 (tool.id === 'bg'     && canvasBg)     ||
//                 (tool.id === 'frame'  && canvasFrame)
//               return (
//                 <button
//                   key={tool.id}
//                   className={`tool_btn ${isSet ? 'set' : ''}`}
//                   onClick={() => handleToolClick(tool.id)}
//                 >
//                   {tool.icon}
//                   <span>{tool.label}</span>
//                 </button>
//               )
//             })}
//           </div>

//           {/* Send / Preview button */}
//           <button
//             className={`preview_btn ${hasContent && (receipentUser.length === 0 || checkReceipentUser) ? 'ready' : ''}`}
//             disabled={!hasContent || !(receipentUser.length === 0 || checkReceipentUser)}
//             onClick={async () => {
//               if (!hasContent) return
//               try {
//                 const file = await captureCanvasAsFile()
//                 setPendingCanvasFile(file)
//                 setCanvasSnapshot(URL.createObjectURL(file))
//                 setShowPreview(true)
//               } catch {
//                 setPostError('Failed to render canvas. Please try again.')
//               }
//             }}
//           >
//             {hasContent ? 'Send appreciation' : 'Preview'}
//           </button>
//         </>
//       )}

//       {activeTab === 'audio' && (
//         <AudioTab
//           onSend={(audioFile, audioName) => {
//             setPendingAudioFile(audioFile)
//             setPendingAudioURL(URL.createObjectURL(audioFile))
//             setPendingAudioName(audioName)
//             setShowPreview(true)
//           }}
//         />
//       )}
//       {activeTab === 'video' && <VideoTab />}

//       {/* ── Modals ── */}
//       {activeModal === 'event' && (
//         <EventModal
//           onClose={() => setActiveModal(null)}
//           currentEvent={selectedEvent}
//           onConfirm={(ev) => { setSelectedEvent(ev); setActiveModal(null) }}
//         />
//       )}
//       {activeModal === 'image' && (
//         <ImageModal
//           onClose={() => setActiveModal(null)}
//           currentImage={canvasImage}
//           onConfirm={(src) => {
//             setCanvasImage(src)
//             setImagePosition({ x: 50, y: 50 })  // centre on fresh upload
//             setImageSize(80)
//             setActiveModal(null)
//           }}
//         />
//       )}
//       {activeModal === 'text' && (
//         <TextModal
//           onClose={() => setActiveModal(null)}
//           currentText={canvasText}
//           onConfirm={(t) => {
//             setCanvasText(prev => ({ ...t, position: prev?.position ?? { x: 50, y: 75 } }))
//             setActiveModal(null)
//           }}
//         />
//       )}
//       {activeModal === 'vector' && (
//         <VectorModal
//           onClose={() => setActiveModal(null)}
//           onConfirm={(v) => {
//             setCanvasVector({ ...v, size: 48, position: { x: 75, y: 20 } })
//             setActiveModal(null)
//           }}
//         />
//       )}
//       {activeModal === 'editVector' && canvasVector && (
//         <EditVectorModal
//           onClose={() => setActiveModal(null)}
//           vector={canvasVector}
//           onUpdate={(updates) => setCanvasVector(prev => ({ ...prev, ...updates }))}
//           onRemove={() => { setCanvasVector(null); setActiveModal(null); setSelectedItem(null) }}
//         />
//       )}
//       {activeModal === 'bg' && (
//         <BgModal
//           onClose={() => setActiveModal(null)}
//           currentBg={canvasBg}
//           onConfirm={(bg) => { setCanvasBg(bg); setActiveModal(null) }}
//         />
//       )}
//       {activeModal === 'frame' && (
//         <FrameModal
//           onClose={() => setActiveModal(null)}
//           currentFrame={canvasFrame}
//           onConfirm={(frame) => { setCanvasFrame(frame); setActiveModal(null) }}
//         />
//       )}

//       {/* ── Preview Panel ── */}
//       {showPreview && !postSuccess && (
//         <PreviewPanel
//           canvasSnapshot={canvasSnapshot}
//           caption={caption}
//           setCaption={setCaption}
//           selectedCapacity={selectedCapacity}
//           setSelectedCapacity={setSelectedCapacity}
//           selectedPrivacy={selectedPrivacy}
//           setSelectedPrivacy={setSelectedPrivacy}
//           previewSubModal={previewSubModal}
//           setPreviewSubModal={setPreviewSubModal}
//           audioURL={pendingAudioURL}
//           audioName={pendingAudioName}
//           onClose={() => { setShowPreview(false); setPreviewSubModal(null); setPostError(''); setPendingAudioFile(null); setPendingAudioURL(null); setPendingAudioName(null); setPendingCanvasFile(null); setCanvasSnapshot(null) }}
//           onPost={handlePost}
//           isPosting={isPosting}
//           postError={postError}
//         />
//       )}

//       {/* ── Success Screen ── */}
//       {postSuccess && (
//         <SuccessScreen
//           hasPaidTier={!!selectedCapacity.price}
//           onDone={() => { setPostSuccess(false); setShowPreview(false); setPendingAudioFile(null); setPendingAudioURL(null); setPendingAudioName(null); setPendingCanvasFile(null); setCanvasSnapshot(null) }}
//         />
//       )}
//     </PostCreationWrapper>
//   )
// }

// // ─── Styled Components ────────────────────────────────────────────────────────

// const CanvasArea = styled.div`
//   width: 100%;
//   aspect-ratio: ${({ $ratio }) => $ratio === 'portrait' ? '4 / 5' : '1 / 1'};
//   border-radius: 12px;
//   border: 1.5px solid #ECEFF3;
//   overflow: hidden;
//   position: relative;
//   transition: aspect-ratio 0.3s ease;

//   .canvas_image {
//     display: block;
//     object-fit: cover;
//     border-radius: 6px;
//     transition: width 0.08s, height 0.08s;
//     pointer-events: none;
//   }

//   .remove_image_btn {
//     position: absolute;
//     top: -10px; right: -10px;
//     z-index: 5;
//     width: 22px; height: 22px;
//     border-radius: 50%;
//     background: rgba(0,0,0,0.6);
//     border: none;
//     color: #fff;
//     display: flex; align-items: center; justify-content: center;
//     font-size: 0.9em;
//     cursor: pointer;
//     transition: background 0.2s;
//     &:hover { background: rgba(0,0,0,0.85); }
//   }

//   .image_resize_bar {
//     position: absolute;
//     bottom: -28px;
//     left: 50%;
//     transform: translateX(-50%);
//     z-index: 5;
//     background: rgba(0,0,0,0.5);
//     border-radius: 99px;
//     padding: 3px 10px;
//     display: flex;
//     align-items: center;

//     input[type='range'] {
//       width: 80px;
//       height: 3px;
//       accent-color: #fff;
//       cursor: pointer;
//     }
//   }
// `

// const PostCreationWrapper = styled.div`
//   display: flex;
//   flex-direction: column;
//   gap: 1rem;

//   .tab_switcher {
//     display: flex;
//     background: #F3F4F6;
//     border-radius: 99px;
//     padding: 4px;
//     gap: 2px;
//   }

//   .tab_btn {
//     flex: 1;
//     display: flex;
//     align-items: center;
//     justify-content: center;
//     gap: 0.4rem;
//     height: 36px;
//     border: none;
//     border-radius: 99px;
//     background: transparent;
//     color: var(--light-text-color, #6B7280);
//     font-size: 0.9em;
//     cursor: pointer;
//     transition: background 0.2s, color 0.2s;
//     &.active {
//       background: #fff;
//       color: var(--text-color, #111);
//       font-weight: 600;
//       box-shadow: 0 1px 4px rgba(0,0,0,0.08);
//     }
//     svg { font-size: 0.95em; }
//   }

//   .select_row {
//     display: flex;
//     align-items: center;
//     justify-content: space-between;
//     padding: 0 1rem;
//     height: 50px;
//     background: #F9FAFB;
//     border-radius: 10px;
//     border: 1.5px solid #ECEFF3;
//     cursor: pointer;
//     transition: border-color 0.2s;
//     &:hover { border-color: var(--primary-color, #EF5A42); }
//     .select_placeholder { font-size: 0.95em; color: #9CA3AF; flex: 1; }
//     .select_event_emoji { font-size: 1.1em; margin-right: 0.5rem; flex-shrink: 0; }
//     .select_value { flex: 1; font-size: 0.95em; font-weight: 500; color: var(--text-color, #111); }
//     .select_arrow { color: #9CA3AF; font-size: 0.9em; flex-shrink: 0; }
//   }

//   .aspect_row {
//     display: flex;
//     align-items: center;
//     gap: 0.5rem;
//     padding: 0 0.25rem;

//     .aspect_label {
//       flex: 1;
//       font-size: 0.95em;
//       font-weight: 500;
//       color: var(--text-color, #111);
//     }

//     .ratio_toggles { display: flex; gap: 6px; align-items: center; }

//     .ratio_btn {
//       display: flex; align-items: center; justify-content: center;
//       border: 1.5px solid #ECEFF3;
//       background: #F9FAFB;
//       cursor: pointer;
//       color: var(--primary-color, #EF5A42);
//       font-size: 0.8em;
//       border-radius: 5px;
//       transition: border-color 0.2s, background 0.2s;
//       &.square_btn   { width: 28px; height: 28px; }
//       &.portrait_btn { width: 22px; height: 28px; }
//       &.active { border-color: var(--primary-color, #EF5A42); background: rgba(239,90,66,0.06); }
//       &:hover:not(.active) { border-color: #D1D5DB; }
//     }
//   }

//   .toolbar {
//     display: flex;
//     gap: 6px;

//     .tool_btn {
//       flex: 1;
//       display: flex;
//       flex-direction: column;
//       align-items: center;
//       justify-content: center;
//       gap: 4px;
//       padding: 0.6rem 0.25rem;
//       background: transparent;
//       border: 1.5px dashed #D1D5DB;
//       border-radius: 10px;
//       color: var(--light-text-color, #6B7280);
//       font-size: 0.75em;
//       cursor: pointer;
//       transition: border-color 0.2s, color 0.2s, background 0.2s;
//       svg { font-size: 1.2em; }
//       &:hover { border-color: var(--primary-color, #EF5A42); color: var(--primary-color, #EF5A42); }
//       &.set {
//         border-style: solid;
//         border-color: var(--primary-color, #EF5A42);
//         color: var(--primary-color, #EF5A42);
//         background: rgba(239,90,66,0.04);
//       }
//     }
//   }

//   .preview_btn {
//     width: 100%;
//     height: 50px;
//     border: none;
//     border-radius: 25px;
//     background: var(--primary-color, #EF5A42);
//     color: #fff;
//     font-size: 1em;
//     font-weight: 600;
//     cursor: not-allowed;
//     opacity: 0.4;
//     transition: opacity 0.2s;
//     &.ready { opacity: 1; cursor: pointer; &:hover { opacity: 0.88; } }
//   }
// `

// export default PostCreationComponent

import React, { useState, useCallback, useRef } from 'react'
import styled from 'styled-components'
import { useDispatch, useSelector } from 'react-redux'
import {
  BsX, BsPencil, BsMic, BsCameraVideo,
  BsImage, BsTypeBold, BsBezier2, BsPalette2, BsBorderOuter,
  BsChevronRight, BsCheck2,
} from 'react-icons/bs'

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

const PostCreationComponent = ({ type }) => {
  const dispatch = useDispatch()
  const { createBoardLoad }                   = useSelector(s => s.board)
  const { postMessageLoad }                   = useSelector(s => s.message)
  const { imageUploadLoad, audioUploadLoad }  = useSelector(s => s.upload)
  const { checkReceipentUser, receipentUser } = useSelector(s => s.user)  // ← guards preview_btn

  // ── canvas state ─────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab]         = useState('text')
  const [aspectRatio, setAspectRatio]     = useState('square')
  const [activeModal, setActiveModal]     = useState(null)
  const [selectedItem, setSelectedItem]   = useState(null)
  const [selectedEvent, setSelectedEvent] = useState(null)

  const [canvasBg, setCanvasBg]           = useState(null)
  const [canvasImage, setCanvasImage]     = useState(null)
  const [imageSize, setImageSize]         = useState(80)                  // px multiplier (30–180)
  const [imagePosition, setImagePosition] = useState({ x: 50, y: 50 })  // % position on canvas
  const [canvasText, setCanvasText]       = useState(null)
  const [canvasVector, setCanvasVector]   = useState(null)
  const [canvasFrame, setCanvasFrame]     = useState(null)

  // ── preview / post state ─────────────────────────────────────────────────────
  const [showPreview, setShowPreview]             = useState(false)
  const [canvasSnapshot, setCanvasSnapshot]       = useState(null)  // objectURL shown in PreviewPanel
  const [pendingCanvasFile, setPendingCanvasFile] = useState(null)  // same File reused on Post
  const [caption, setCaption]                     = useState('')
  const [previewSubModal, setPreviewSubModal]     = useState(null)
  const [selectedCapacity, setSelectedCapacity]   = useState(CAPACITY_OPTIONS[1])
  const [selectedPrivacy, setSelectedPrivacy]     = useState(PRIVACY_OPTIONS[0])
  const [postSuccess, setPostSuccess]             = useState(false)
  const [postError, setPostError]                 = useState('')
  const [mentionedUser, setMentionedUser]         = useState(null)
  const [boardTags, setBoardTags]                 = useState([])
  const [pendingAudioFile, setPendingAudioFile]   = useState(null)
  const [pendingAudioURL, setPendingAudioURL]     = useState(null)
  const [pendingAudioName, setPendingAudioName]   = useState(null)

  const canvasRef = useRef(null)

  // ── derived ───────────────────────────────────────────────────────────────────
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

  const hasContent = canvasBg || canvasImage || canvasText || canvasVector || canvasFrame
  const VectorIcon = canvasVector?.icon
  const canvasStyle = { background: canvasBg ? canvasBg.value : '#F9FAFB' }
  const isPosting   = createBoardLoad || postMessageLoad || imageUploadLoad || audioUploadLoad

  // recipent guard: no input typed = always OK; typed input must be confirmed by API
  const recipentOk = !receipentUser || receipentUser.length === 0 || checkReceipentUser

  const handleToolClick = (toolId) =>
    setActiveModal(toolId === 'vector' && canvasVector ? 'editVector' : toolId)

  // ── canvas capture ───────────────────────────────────────────────────────────
  // Called ONCE when user taps "Send appreciation" → file stored → reused on Post.
  // All elements are baked into a single PNG — backend needs no changes.
  const captureCanvasAsFile = useCallback(async () => {
    if (!canvasRef.current) throw new Error('Canvas element not found')
    const html2canvas = (await import('html2canvas')).default

    // Hide UI-only chrome before screenshot
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

  // ── handlePost ───────────────────────────────────────────────────────────────
  const handlePost = useCallback(async () => {
    setPostError('')
    try {
      const eventValue = selectedEvent?.id ? (EVENT_MAP[selectedEvent.id] ?? 'other') : null
      const receipent  = mentionedUser?.replace('@', '') || undefined

      // ── Audio branch ─────────────────────────────────────────────────────────
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
          await dispatch(createBoardUpgrade({ boardId: boardResult.response.board._id, toTier: selectedCapacity.tier }))
          return
        }
        setPostSuccess(true); return
      }

      // ── Canvas / emblem branch ────────────────────────────────────────────────
      if (!hasContent) { setPostError('Add something to your canvas first.'); return }

      // pendingCanvasFile was captured at preview-open → no double-render
      if (!pendingCanvasFile) {
        setPostError('Preview render missing. Please close and try again.'); return
      }

      const uploadResult = await dispatch(uploadFile({ file: pendingCanvasFile, type: 'image' })).unwrap()
      if (uploadResult.status !== 'success') {
        setPostError(uploadResult.response?.message || 'Image upload failed'); return
      }
      const renderedImageUrl = uploadResult.response.url || uploadResult.response.secure_url
      const publicId         = uploadResult.response.public_id

      const boardResult = await dispatch(createBoard({
        title:              caption.trim() || 'My Appreciation Board',
        description:        canvasText?.content || '',
        visibility:         selectedPrivacy.value,
        receipent,
        event:              eventValue,
        coverImage:         renderedImageUrl || null,
        coverImagePublicId: publicId || null,
        tags:               boardTags,
      })).unwrap()
      if (boardResult.status !== 'success') {
        setPostError(boardResult.response?.message || 'Failed to create board'); return
      }

      const msgResult = await dispatch(postMessage({
        slug: boardResult.response.board.slug,
        type: 'emblem',
        content: {
          text:       canvasText?.content      || null,
          font:       canvasText?.font?.family || null,
          color:      canvasText?.color        || null,
          background: canvasBg?.value          || null,
          frame:      canvasFrame
            ? `${canvasFrame.thickness}px ${canvasFrame.style} ${canvasFrame.color}` : null,
          imageUrls:  renderedImageUrl ? [renderedImageUrl] : [],
          vectorKey:  canvasVector?.id         || null,
          audioUrl:   null, duration: null,
        },
        cloudinaryPublicId: publicId,
        fileType:           'image',
      })).unwrap()
      if (msgResult.status !== 'success') {
        setPostError(msgResult.response?.message || 'Failed to post message'); return
      }

      if (selectedCapacity.price && boardResult.response.board._id) {
        await dispatch(createBoardUpgrade({ boardId: boardResult.response.board._id, toTier: selectedCapacity.tier }))
        return
      }
      setPostSuccess(true)
    } catch {
      setPostError('Something went wrong. Please try again.')
    }
  }, [
    dispatch, hasContent, pendingCanvasFile, caption, selectedEvent, mentionedUser,
    selectedPrivacy, selectedCapacity, canvasText, canvasBg, canvasFrame, canvasVector,
    boardTags, pendingAudioFile,
  ])

  // ── helpers ───────────────────────────────────────────────────────────────────
  const closePreview = () => {
    setShowPreview(false); setPreviewSubModal(null); setPostError('')
    setPendingAudioFile(null); setPendingAudioURL(null); setPendingAudioName(null)
    setPendingCanvasFile(null); setCanvasSnapshot(null)
  }
  const resetAll = () => {
    setPostSuccess(false); setShowPreview(false)
    setPendingAudioFile(null); setPendingAudioURL(null); setPendingAudioName(null)
    setPendingCanvasFile(null); setCanvasSnapshot(null)
  }

  // ── render ────────────────────────────────────────────────────────────────────
  return (
    <PostCreationWrapper>

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

      {/* Recipient + tag input */}
      <TagInput onMentionChange={setMentionedUser} onTagsChange={setBoardTags} />

      {/* Text / canvas tab */}
      {activeTab === 'text' && (
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
            ref={canvasRef}
            $ratio={aspectRatio}
            style={{
              ...canvasStyle,
              ...(canvasFrame ? { border: canvasFrame.border, borderRadius: canvasFrame.borderRadius } : {}),
            }}
            data-canvas="true"
            onClick={() => setSelectedItem(null)}
          >
            {/* Draggable + resizable image */}
            {canvasImage && (
              <DraggableCanvasItem
                position={imagePosition}
                onPositionChange={setImagePosition}
                selected={selectedItem === 'image'}
                onSelect={() => setSelectedItem('image')}
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
                    onClick={e => {
                      e.stopPropagation()
                      setCanvasImage(null); setImageSize(80); setImagePosition({ x: 50, y: 50 })
                    }}
                  >
                    <BsX />
                  </button>
                  {selectedItem === 'image' && (
                    <div
                      className="image_resize_bar"
                      onMouseDown={e => e.stopPropagation()}
                      onClick={e => e.stopPropagation()}
                    >
                      <input
                        type="range" min="30" max="180" step="2"
                        value={imageSize}
                        onChange={e => setImageSize(Number(e.target.value))}
                      />
                    </div>
                  )}
                </div>
              </DraggableCanvasItem>
            )}

            {/* Draggable vector */}
            {canvasVector && VectorIcon && (
              <DraggableCanvasItem
                position={canvasVector.position}
                onPositionChange={pos => setCanvasVector(prev => ({ ...prev, position: pos }))}
                selected={selectedItem === 'vector'}
                onSelect={() => setSelectedItem('vector')}
                onTap={() => setActiveModal('editVector')}
              >
                <VectorIcon style={{
                  color: canvasVector.color, opacity: canvasVector.opacity,
                  fontSize: canvasVector.size ?? 48, display: 'block',
                }} />
              </DraggableCanvasItem>
            )}

            {/* Draggable text */}
            {canvasText && (
              <DraggableCanvasItem
                position={canvasText.position}
                onPositionChange={pos => setCanvasText(prev => ({ ...prev, position: pos }))}
                selected={selectedItem === 'text'}
                onSelect={() => setSelectedItem('text')}
                onTap={() => setActiveModal('text')}
              >
                <p style={{
                  margin: 0,
                  fontFamily: canvasText.font?.family,
                  color: canvasText.color,
                  fontSize: canvasText.fontSize ?? 16,
                  maxWidth: 200, textAlign: 'center',
                  lineHeight: 1.35, wordBreak: 'break-word',
                  ...canvasText.font?.style,
                }}>
                  {canvasText.content}
                </p>
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
                <button
                  key={tool.id}
                  className={`tool_btn ${isSet ? 'set' : ''}`}
                  onClick={() => handleToolClick(tool.id)}
                >
                  {tool.icon}<span>{tool.label}</span>
                </button>
              )
            })}
          </div>

          {/* Preview / send button */}
          <button
            className={`preview_btn ${hasContent && recipentOk ? 'ready' : ''}`}
            disabled={!hasContent || !recipentOk}
            onClick={async () => {
              if (!hasContent || !recipentOk) return
              try {
                const file = await captureCanvasAsFile()
                setPendingCanvasFile(file)
                setCanvasSnapshot(URL.createObjectURL(file))
                setShowPreview(true)
              } catch {
                setPostError('Failed to render canvas. Please try again.')
              }
            }}
          >
            {hasContent ? 'Send appreciation' : 'Preview'}
          </button>
        </>
      )}

      {/* Audio tab */}
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

      {/* Video tab */}
      {activeTab === 'video' && <VideoTab />}

      {/* Modals */}
      {activeModal === 'event'  && <EventModal  onClose={() => setActiveModal(null)} currentEvent={selectedEvent} onConfirm={ev  => { setSelectedEvent(ev); setActiveModal(null) }} />}
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

      {/* Preview panel */}
      {showPreview && !postSuccess && (
        <PreviewPanel
          canvasSnapshot={canvasSnapshot}
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

      {/* Success screen */}
      {postSuccess && <SuccessScreen hasPaidTier={!!selectedCapacity.price} onDone={resetAll} />}

    </PostCreationWrapper>
  )
}

// ─── Styled Components ────────────────────────────────────────────────────────

const CanvasArea = styled.div`
  width: 100%;
  aspect-ratio: ${({ $ratio }) => $ratio === 'portrait' ? '4 / 5' : '1 / 1'};
  border-radius: 12px;
  border: 1.5px solid #ECEFF3;
  overflow: hidden;
  position: relative;
  transition: aspect-ratio 0.3s ease;

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
  display: flex; flex-direction: column; gap: 1rem;

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

export default PostCreationComponent