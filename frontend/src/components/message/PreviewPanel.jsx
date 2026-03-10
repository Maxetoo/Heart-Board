// import React, { useState, useRef } from 'react'
// import styled from 'styled-components'
// import { BsX, BsCameraFill, BsChevronRight, BsCheckCircleFill, BsPlayFill, BsPauseFill } from 'react-icons/bs'
// import { CAPACITY_OPTIONS, PRIVACY_OPTIONS } from '../../slices/boardPaymentSlice'

// const PreviewPanel = ({
//   // canvas snapshot
//   canvasImage,
//   canvasText,
//   canvasBg,
//   canvasFrame,
//   // audio (mutually exclusive with canvas fields)
//   audioURL,
//   audioName,
//   // form state
//   caption,
//   setCaption,
//   selectedCapacity,
//   setSelectedCapacity,
//   selectedPrivacy,
//   setSelectedPrivacy,
//   // sub-modal
//   previewSubModal,
//   setPreviewSubModal,
//   // actions
//   onClose,
//   onPost,
//   isPosting,
//   postError,
// }) => {
//   // ── Audio player state (only used when audioURL is present) ──────────────────
//   const audioRef   = useRef(null)
//   const [playing, setPlaying]     = useState(false)
//   const [duration, setDuration]   = useState(0)
//   const [currentTime, setCurrent] = useState(0)

//   const togglePlay = () => {
//     if (!audioRef.current) return
//     if (playing) { audioRef.current.pause() } else { audioRef.current.play() }
//   }

//   const formatDur = (s) => {
//     if (!s || isNaN(s)) return '0:00'
//     const m = Math.floor(s / 60)
//     const sec = Math.floor(s % 60).toString().padStart(2, '0')
//     return `${m}:${sec}`
//   }

//   return (
//     <PreviewOverlay>
//       <PreviewCard>
//         {/* Header */}
//         <div className="preview_header">
//           <span className="preview_title">Preview</span>
//           <button className="preview_close" onClick={onClose}><BsX /></button>
//         </div>

//         {/* Thumbnail — audio player OR canvas snapshot */}
//         {audioURL ? (
//           <AudioThumb>
//             {/* Hidden native audio element drives play/pause/duration */}
//             <audio
//               ref={audioRef}
//               src={audioURL}
//               onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
//               onTimeUpdate={() => setCurrent(audioRef.current?.currentTime || 0)}
//               onPlay={() => setPlaying(true)}
//               onPause={() => setPlaying(false)}
//               onEnded={() => { setPlaying(false); setCurrent(0) }}
//             />
//             <button className="play_btn" onClick={togglePlay}>
//               {playing ? <BsPauseFill /> : <BsPlayFill />}
//             </button>
//             <div className="audio_meta">
//               <span className="audio_label">{audioName || 'Audio message'}</span>
//               <span className="audio_duration">
//                 {formatDur(currentTime)} / {formatDur(duration)}
//               </span>
//             </div>
//             {/* Progress bar */}
//             <div className="audio_progress_track">
//               <div
//                 className="audio_progress_fill"
//                 style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
//               />
//             </div>
//           </AudioThumb>
//         ) : (
//           <PreviewThumb
//             style={{
//               background: canvasBg ? canvasBg.value : '#F3F4F6',
//               ...(canvasFrame
//                 ? { border: canvasFrame.border, borderRadius: canvasFrame.borderRadius }
//                 : {}),
//             }}
//           >
//             {canvasImage && <img src={canvasImage} alt="preview" className="thumb_img" />}
//             {canvasText && (
//               <span
//                 className="thumb_text"
//                 style={{
//                   fontFamily: canvasText.font?.family,
//                   color:      canvasText.color,
//                   fontSize:   Math.min(canvasText.fontSize ?? 16, 13),
//                   ...canvasText.font?.style,
//                 }}
//               >
//                 {canvasText.content}
//               </span>
//             )}
//             {!canvasImage && !canvasText && !canvasBg && (
//               <span className="thumb_placeholder"><BsCameraFill /></span>
//             )}
//           </PreviewThumb>
//         )}

//         {/* Capacity sub-modal */}
//         {previewSubModal === 'capacity' && (
//           <SubModal>
//             <div className="sub_title">Board Capacity</div>
//             {CAPACITY_OPTIONS.map(opt => {
//               const isActive = selectedCapacity.id === opt.id
//               return (
//                 <div
//                   key={opt.id}
//                   className={`sub_option ${isActive ? 'active' : ''}`}
//                   onClick={() => { setSelectedCapacity(opt); setPreviewSubModal(null) }}
//                 >
//                   <div className={`sub_radio ${isActive ? 'filled' : ''}`}>
//                     {isActive && <BsCheckCircleFill className="radio_icon" />}
//                   </div>
//                   <span className="sub_label">{opt.label}</span>
//                   {opt.badge && (
//                     <span className={`sub_badge ${opt.price ? 'pay' : 'free'}`}>
//                       {opt.badge}
//                     </span>
//                   )}
//                 </div>
//               )
//             })}
//           </SubModal>
//         )}

//         {/* Privacy sub-modal */}
//         {previewSubModal === 'privacy' && (
//           <SubModal>
//             <div className="sub_title">Privacy</div>
//             {PRIVACY_OPTIONS.map(opt => {
//               const isActive = selectedPrivacy.id === opt.id
//               return (
//                 <div
//                   key={opt.id}
//                   className={`sub_option ${isActive ? 'active' : ''}`}
//                   onClick={() => { setSelectedPrivacy(opt); setPreviewSubModal(null) }}
//                 >
//                   <div className={`sub_radio ${isActive ? 'filled' : ''}`}>
//                     {isActive && <BsCheckCircleFill className="radio_icon" />}
//                   </div>
//                   <span className="sub_label">{opt.label}</span>
//                 </div>
//               )
//             })}
//           </SubModal>
//         )}

//         {/* Caption */}
//         <input
//           className="caption_input"
//           placeholder="Caption"
//           value={caption}
//           onChange={e => setCaption(e.target.value)}
//         />

//         {/* Capacity row */}
//         <div
//           className="preview_row"
//           onClick={() => setPreviewSubModal(prev => prev === 'capacity' ? null : 'capacity')}
//         >
//           <span className="row_label">Select board capacity</span>
//           <span className="row_value">{selectedCapacity.label} <BsChevronRight /></span>
//         </div>

//         {/* Privacy row */}
//         <div
//           className="preview_row"
//           onClick={() => setPreviewSubModal(prev => prev === 'privacy' ? null : 'privacy')}
//         >
//           <span className="row_label">Privacy</span>
//           <span className="row_value">{selectedPrivacy.label} <BsChevronRight /></span>
//         </div>

//         {postError && <p className="post_error">{postError}</p>}

//         <button
//           className={`post_btn ${isPosting ? 'loading' : ''}`}
//           onClick={onPost}
//           disabled={isPosting}
//         >
//           {isPosting ? 'Posting…' : 'Post'}
//         </button>
//       </PreviewCard>
//     </PreviewOverlay>
//   )
// }

// // ─── Success Screen ───────────────────────────────────────────────────────────

// export const SuccessScreen = ({ hasPaidTier, onDone }) => (
//   <PreviewOverlay>
//     <PreviewCard style={{ alignItems: 'center', textAlign: 'center', gap: '1rem', padding: '2rem 1.5rem' }}>
//       <BsCheckCircleFill style={{ fontSize: '3rem', color: '#10B981' }} />
//       <h3 style={{ margin: 0, fontSize: '1.1em', fontWeight: 700 }}>Board Posted!</h3>
//       <p style={{ margin: 0, color: '#6B7280', fontSize: '0.9em', lineHeight: 1.5 }}>
//         Your appreciation board has been created and your message has been posted.
//         {hasPaidTier && ' You will be redirected to complete payment.'}
//       </p>
//       <button className="post_btn" onClick={onDone}>Done</button>
//     </PreviewCard>
//   </PreviewOverlay>
// )

// // ─── Styled Components ────────────────────────────────────────────────────────

// const PreviewOverlay = styled.div`
//   position: fixed;
//   inset: 0;
//   z-index: 200;
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   padding: 1rem;
//   background: rgba(0,0,0,0.35);
//   backdrop-filter: blur(2px);
// `

// const PreviewCard = styled.div`
//   background: #fff;
//   border-radius: 20px;
//   width: 100%;
//   max-width: 420px;
//   display: flex;
//   flex-direction: column;
//   gap: 0.6rem;
//   padding: 1.25rem;
//   box-shadow: 0 16px 48px rgba(0,0,0,0.18);
//   position: relative;
//   max-height: 92vh;
//   overflow-y: auto;

//   .preview_header {
//     display: flex;
//     align-items: center;
//     justify-content: space-between;
//     margin-bottom: 0.25rem;

//     .preview_title { font-size: 1em; font-weight: 700; color: var(--text-color, #111); }

//     .preview_close {
//       width: 28px; height: 28px;
//       border-radius: 50%;
//       border: 1.5px solid #ECEFF3;
//       background: transparent;
//       display: flex; align-items: center; justify-content: center;
//       font-size: 1.1em; cursor: pointer;
//       color: var(--text-color, #111);
//       &:hover { border-color: var(--primary-color, #EF5A42); color: var(--primary-color, #EF5A42); }
//     }
//   }

//   .caption_input {
//     width: 100%;
//     height: 44px;
//     padding: 0 1rem;
//     background: #F9FAFB;
//     border: 1.5px solid #ECEFF3;
//     border-radius: 10px;
//     font-size: 0.93em;
//     color: var(--text-color, #111);
//     outline: none;
//     box-sizing: border-box;
//     transition: border-color 0.2s;
//     &::placeholder { color: #9CA3AF; }
//     &:focus { border-color: var(--primary-color, #EF5A42); background: #fff; }
//   }

//   .preview_row {
//     display: flex;
//     align-items: center;
//     justify-content: space-between;
//     padding: 0.75rem 0;
//     border-bottom: 1px solid #F3F4F6;
//     cursor: pointer;
//     user-select: none;
//     &:last-of-type { border-bottom: none; }
//     &:hover .row_value { color: var(--primary-color, #EF5A42); }

//     .row_label { font-size: 0.93em; font-weight: 500; color: var(--text-color, #111); }
//     .row_value {
//       display: flex; align-items: center; gap: 4px;
//       font-size: 0.87em; color: #9CA3AF;
//       transition: color 0.15s;
//       svg { font-size: 0.8em; }
//     }
//   }

//   .post_error {
//     font-size: 0.83em;
//     color: #EF5A42;
//     margin: 0;
//     text-align: center;
//   }

//   .post_btn {
//     width: 100%;
//     height: 52px;
//     border: none;
//     border-radius: 26px;
//     background: var(--primary-color, #EF5A42);
//     color: #fff;
//     font-size: 1em;
//     font-weight: 700;
//     cursor: pointer;
//     transition: opacity 0.2s;
//     margin-top: 0.4rem;
//     &:hover { opacity: 0.88; }
//     &.loading { opacity: 0.6; cursor: not-allowed; }
//   }
// `

// const PreviewThumb = styled.div`
//   width: 100%;
//   aspect-ratio: 4 / 3;
//   border-radius: 12px;
//   overflow: hidden;
//   position: relative;
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   border: 1.5px solid #ECEFF3;

//   .thumb_img {
//     position: absolute; inset: 0;
//     width: 100%; height: 100%;
//     object-fit: cover;
//   }

//   .thumb_text {
//     position: relative; z-index: 1;
//     max-width: 80%;
//     text-align: center;
//     word-break: break-word;
//     line-height: 1.4;
//     font-weight: 600;
//   }

//   .thumb_placeholder { color: #D1D5DB; font-size: 2em; }
// `

// const SubModal = styled.div`
//   background: #fff;
//   border-radius: 16px;
//   border: 1.5px solid #ECEFF3;
//   padding: 1rem 1rem 0.5rem;
//   display: flex;
//   flex-direction: column;
//   box-shadow: 0 4px 20px rgba(0,0,0,0.08);

//   .sub_title {
//     font-size: 1em; font-weight: 700;
//     color: var(--text-color, #111);
//     margin-bottom: 0.65rem;
//   }

//   .sub_option {
//     display: flex;
//     align-items: center;
//     gap: 0.75rem;
//     padding: 0.65rem 0.5rem;
//     border-radius: 10px;
//     cursor: pointer;
//     background: #F9FAFB;
//     margin-bottom: 6px;
//     border: 1.5px solid transparent;
//     transition: border-color 0.15s, background 0.15s;
//     &:hover { border-color: #E5E7EB; }
//     &.active { background: #fff; border-color: var(--primary-color, #EF5A42); }

//     .sub_radio {
//       width: 20px; height: 20px;
//       border-radius: 50%;
//       border: 1.5px solid #D1D5DB;
//       display: flex; align-items: center; justify-content: center;
//       flex-shrink: 0;
//       &.filled { border-color: transparent; .radio_icon { color: #10B981; font-size: 1.15em; } }
//     }

//     .sub_label { flex: 1; font-size: 0.9em; font-weight: 500; color: var(--text-color, #111); }

//     .sub_badge {
//       font-size: 0.78em; font-weight: 600;
//       padding: 3px 10px; border-radius: 99px;
//       &.free { color: #6B7280; background: transparent; }
//       &.pay  { color: var(--primary-color, #EF5A42); background: rgba(239,90,66,0.1); }
//     }
//   }
// `

// const AudioThumb = styled.div`
//   width: 100%;
//   aspect-ratio: 4 / 3;
//   border-radius: 12px;
//   border: 1.5px solid #ECEFF3;
//   background: #F9FAFB;
//   display: flex;
//   flex-direction: column;
//   align-items: center;
//   justify-content: center;
//   gap: 0.75rem;
//   padding: 1.5rem;
//   box-sizing: border-box;

//   .play_btn {
//     width: 72px; height: 72px;
//     border-radius: 50%;
//     border: none;
//     background: var(--primary-color, #EF5A42);
//     color: #fff;
//     display: flex; align-items: center; justify-content: center;
//     font-size: 1.8em;
//     cursor: pointer;
//     transition: transform 0.15s, opacity 0.15s;
//     flex-shrink: 0;
//     padding-left: 4px; /* optical centre for play icon */
//     &:hover { transform: scale(1.06); opacity: 0.9; }
//     svg { display: block; }
//   }

//   .audio_meta {
//     display: flex;
//     flex-direction: column;
//     align-items: center;
//     gap: 2px;
//   }

//   .audio_label {
//     font-size: 0.88em;
//     font-weight: 500;
//     color: var(--text-color, #111);
//     max-width: 200px;
//     overflow: hidden;
//     text-overflow: ellipsis;
//     white-space: nowrap;
//     text-align: center;
//   }

//   .audio_duration {
//     font-size: 0.82em;
//     font-variant-numeric: tabular-nums;
//     color: #9CA3AF;
//   }

//   .audio_progress_track {
//     width: 100%;
//     height: 4px;
//     border-radius: 2px;
//     background: #E5E7EB;
//     overflow: hidden;
//   }

//   .audio_progress_fill {
//     height: 100%;
//     border-radius: 2px;
//     background: var(--primary-color, #EF5A42);
//     transition: width 0.25s linear;
//   }
// `

// export default PreviewPanel

// import React, { useState, useRef } from 'react'
// import styled from 'styled-components'
// import { BsX, BsCameraFill, BsChevronRight, BsCheckCircleFill, BsPlayFill, BsPauseFill } from 'react-icons/bs'
// import { CAPACITY_OPTIONS, PRIVACY_OPTIONS } from '../../slices/boardPaymentSlice'

// const PreviewPanel = ({
//   // canvas snapshot
//   canvasImage,
//   imageSize,
//   canvasText,
//   canvasBg,
//   canvasFrame,
//   canvasVector,
//   // audio (mutually exclusive with canvas fields)
//   audioURL,
//   audioName,
//   // form state
//   caption,
//   setCaption,
//   selectedCapacity,
//   setSelectedCapacity,
//   selectedPrivacy,
//   setSelectedPrivacy,
//   // sub-modal
//   previewSubModal,
//   setPreviewSubModal,
//   // actions
//   onClose,
//   onPost,
//   isPosting,
//   postError,
// }) => {
//   // ── Audio player state (only used when audioURL is present) ──────────────────
//   const audioRef   = useRef(null)
//   const [playing, setPlaying]     = useState(false)
//   const [duration, setDuration]   = useState(0)
//   const [currentTime, setCurrent] = useState(0)

//   const togglePlay = () => {
//     if (!audioRef.current) return
//     if (playing) { audioRef.current.pause() } else { audioRef.current.play() }
//   }

//   const formatDur = (s) => {
//     if (!s || isNaN(s)) return '0:00'
//     const m = Math.floor(s / 60)
//     const sec = Math.floor(s % 60).toString().padStart(2, '0')
//     return `${m}:${sec}`
//   }

//   return (
//     <PreviewOverlay>
//       <PreviewCard>
//         {/* Header */}
//         <div className="preview_header">
//           <span className="preview_title">Preview</span>
//           <button className="preview_close" onClick={onClose}><BsX /></button>
//         </div>

//         {/* Thumbnail — audio player OR canvas snapshot */}
//         {audioURL ? (
//           <AudioThumb>
//             {/* Hidden native audio element drives play/pause/duration */}
//             <audio
//               ref={audioRef}
//               src={audioURL}
//               onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
//               onTimeUpdate={() => setCurrent(audioRef.current?.currentTime || 0)}
//               onPlay={() => setPlaying(true)}
//               onPause={() => setPlaying(false)}
//               onEnded={() => { setPlaying(false); setCurrent(0) }}
//             />
//             <button className="play_btn" onClick={togglePlay}>
//               {playing ? <BsPauseFill /> : <BsPlayFill />}
//             </button>
//             <div className="audio_meta">
//               <span className="audio_label">{audioName || 'Audio message'}</span>
//               <span className="audio_duration">
//                 {formatDur(currentTime)} / {formatDur(duration)}
//               </span>
//             </div>
//             {/* Progress bar */}
//             <div className="audio_progress_track">
//               <div
//                 className="audio_progress_fill"
//                 style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
//               />
//             </div>
//           </AudioThumb>
//         ) : (
//           <PreviewThumb
//             style={{
//               background: canvasBg ? canvasBg.value : '#F3F4F6',
//               ...(canvasFrame
//                 ? { border: canvasFrame.border, borderRadius: canvasFrame.borderRadius }
//                 : {}),
//             }}
//           >
//             {canvasImage && (
//               <img
//                 src={canvasImage}
//                 alt="preview"
//                 className="thumb_img"
//                 style={{ width: `${imageSize ?? 80}%`, height: `${imageSize ?? 80}%` }}
//               />
//             )}
//             {canvasVector?.icon && (() => {
//               const VIcon = canvasVector.icon
//               return (
//                 <VIcon
//                   className="thumb_vector"
//                   style={{
//                     color:    canvasVector.color,
//                     opacity:  canvasVector.opacity,
//                     fontSize: Math.min(canvasVector.size ?? 48, 36),
//                   }}
//                 />
//               )
//             })()}
//             {canvasText && (
//               <span
//                 className="thumb_text"
//                 style={{
//                   fontFamily: canvasText.font?.family,
//                   color:      canvasText.color,
//                   fontSize:   Math.min(canvasText.fontSize ?? 16, 13),
//                   ...canvasText.font?.style,
//                 }}
//               >
//                 {canvasText.content}
//               </span>
//             )}
//             {!canvasImage && !canvasText && !canvasBg && !canvasVector && (
//               <span className="thumb_placeholder"><BsCameraFill /></span>
//             )}
//           </PreviewThumb>
//         )}

//         {/* Capacity sub-modal */}
//         {previewSubModal === 'capacity' && (
//           <SubModal>
//             <div className="sub_title">Board Capacity</div>
//             {CAPACITY_OPTIONS.map(opt => {
//               const isActive = selectedCapacity.id === opt.id
//               return (
//                 <div
//                   key={opt.id}
//                   className={`sub_option ${isActive ? 'active' : ''}`}
//                   onClick={() => { setSelectedCapacity(opt); setPreviewSubModal(null) }}
//                 >
//                   <div className={`sub_radio ${isActive ? 'filled' : ''}`}>
//                     {isActive && <BsCheckCircleFill className="radio_icon" />}
//                   </div>
//                   <span className="sub_label">{opt.label}</span>
//                   {opt.badge && (
//                     <span className={`sub_badge ${opt.price ? 'pay' : 'free'}`}>
//                       {opt.badge}
//                     </span>
//                   )}
//                 </div>
//               )
//             })}
//           </SubModal>
//         )}

//         {/* Privacy sub-modal */}
//         {previewSubModal === 'privacy' && (
//           <SubModal>
//             <div className="sub_title">Privacy</div>
//             {PRIVACY_OPTIONS.map(opt => {
//               const isActive = selectedPrivacy.id === opt.id
//               return (
//                 <div
//                   key={opt.id}
//                   className={`sub_option ${isActive ? 'active' : ''}`}
//                   onClick={() => { setSelectedPrivacy(opt); setPreviewSubModal(null) }}
//                 >
//                   <div className={`sub_radio ${isActive ? 'filled' : ''}`}>
//                     {isActive && <BsCheckCircleFill className="radio_icon" />}
//                   </div>
//                   <span className="sub_label">{opt.label}</span>
//                 </div>
//               )
//             })}
//           </SubModal>
//         )}

//         {/* Caption */}
//         <input
//           className="caption_input"
//           placeholder="Caption"
//           value={caption}
//           onChange={e => setCaption(e.target.value)}
//         />

//         {/* Capacity row */}
//         <div
//           className="preview_row"
//           onClick={() => setPreviewSubModal(prev => prev === 'capacity' ? null : 'capacity')}
//         >
//           <span className="row_label">Select board capacity</span>
//           <span className="row_value">{selectedCapacity.label} <BsChevronRight /></span>
//         </div>

//         {/* Privacy row */}
//         <div
//           className="preview_row"
//           onClick={() => setPreviewSubModal(prev => prev === 'privacy' ? null : 'privacy')}
//         >
//           <span className="row_label">Privacy</span>
//           <span className="row_value">{selectedPrivacy.label} <BsChevronRight /></span>
//         </div>

//         {postError && <p className="post_error">{postError}</p>}

//         <button
//           className={`post_btn ${isPosting ? 'loading' : ''}`}
//           onClick={onPost}
//           disabled={isPosting}
//         >
//           {isPosting ? 'Posting…' : 'Post'}
//         </button>
//       </PreviewCard>
//     </PreviewOverlay>
//   )
// }

// // ─── Success Screen ───────────────────────────────────────────────────────────

// export const SuccessScreen = ({ hasPaidTier, onDone }) => (
//   <PreviewOverlay>
//     <PreviewCard style={{ alignItems: 'center', textAlign: 'center', gap: '1rem', padding: '2rem 1.5rem' }}>
//       <BsCheckCircleFill style={{ fontSize: '3rem', color: '#10B981' }} />
//       <h3 style={{ margin: 0, fontSize: '1.1em', fontWeight: 700 }}>Board Posted!</h3>
//       <p style={{ margin: 0, color: '#6B7280', fontSize: '0.9em', lineHeight: 1.5 }}>
//         Your appreciation board has been created and your message has been posted.
//         {hasPaidTier && ' You will be redirected to complete payment.'}
//       </p>
//       <button className="post_btn" onClick={onDone}>Done</button>
//     </PreviewCard>
//   </PreviewOverlay>
// )

// // ─── Styled Components ────────────────────────────────────────────────────────

// const PreviewOverlay = styled.div`
//   position: fixed;
//   inset: 0;
//   z-index: 200;
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   padding: 1rem;
//   background: rgba(0,0,0,0.35);
//   backdrop-filter: blur(2px);
// `

// const PreviewCard = styled.div`
//   background: #fff;
//   border-radius: 20px;
//   width: 100%;
//   max-width: 420px;
//   display: flex;
//   flex-direction: column;
//   gap: 0.6rem;
//   padding: 1.25rem;
//   box-shadow: 0 16px 48px rgba(0,0,0,0.18);
//   position: relative;
//   max-height: 92vh;
//   overflow-y: auto;

//   .preview_header {
//     display: flex;
//     align-items: center;
//     justify-content: space-between;
//     margin-bottom: 0.25rem;

//     .preview_title { font-size: 1em; font-weight: 700; color: var(--text-color, #111); }

//     .preview_close {
//       width: 28px; height: 28px;
//       border-radius: 50%;
//       border: 1.5px solid #ECEFF3;
//       background: transparent;
//       display: flex; align-items: center; justify-content: center;
//       font-size: 1.1em; cursor: pointer;
//       color: var(--text-color, #111);
//       &:hover { border-color: var(--primary-color, #EF5A42); color: var(--primary-color, #EF5A42); }
//     }
//   }

//   .caption_input {
//     width: 100%;
//     height: 44px;
//     padding: 0 1rem;
//     background: #F9FAFB;
//     border: 1.5px solid #ECEFF3;
//     border-radius: 10px;
//     font-size: 0.93em;
//     color: var(--text-color, #111);
//     outline: none;
//     box-sizing: border-box;
//     transition: border-color 0.2s;
//     &::placeholder { color: #9CA3AF; }
//     &:focus { border-color: var(--primary-color, #EF5A42); background: #fff; }
//   }

//   .preview_row {
//     display: flex;
//     align-items: center;
//     justify-content: space-between;
//     padding: 0.75rem 0;
//     border-bottom: 1px solid #F3F4F6;
//     cursor: pointer;
//     user-select: none;
//     &:last-of-type { border-bottom: none; }
//     &:hover .row_value { color: var(--primary-color, #EF5A42); }

//     .row_label { font-size: 0.93em; font-weight: 500; color: var(--text-color, #111); }
//     .row_value {
//       display: flex; align-items: center; gap: 4px;
//       font-size: 0.87em; color: #9CA3AF;
//       transition: color 0.15s;
//       svg { font-size: 0.8em; }
//     }
//   }

//   .post_error {
//     font-size: 0.83em;
//     color: #EF5A42;
//     margin: 0;
//     text-align: center;
//   }

//   .job_progress_track {
//     width: 100%;
//     height: 4px;
//     border-radius: 2px;
//     background: #E5E7EB;
//     overflow: hidden;
//   }

//   .job_progress_fill {
//     height: 100%;
//     border-radius: 2px;
//     background: var(--primary-color, #EF5A42);
//     transition: width 0.4s ease;
//   }

//   .post_btn {
//     width: 100%;
//     height: 52px;
//     border: none;
//     border-radius: 26px;
//     background: var(--primary-color, #EF5A42);
//     color: #fff;
//     font-size: 1em;
//     font-weight: 700;
//     cursor: pointer;
//     transition: opacity 0.2s;
//     margin-top: 0.4rem;
//     &:hover { opacity: 0.88; }
//     &.loading { opacity: 0.6; cursor: not-allowed; }
//   }
// `

// const PreviewThumb = styled.div`
//   width: 100%;
//   aspect-ratio: 4 / 3;
//   border-radius: 12px;
//   overflow: hidden;
//   position: relative;
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   border: 1.5px solid #ECEFF3;
//   flex-wrap: wrap;
//   gap: 4px;

//   .thumb_img {
//     object-fit: cover;
//     border-radius: 4px;
//   }

//   .thumb_vector {
//     position: relative; z-index: 1;
//     display: block;
//     flex-shrink: 0;
//   }

//   .thumb_text {
//     position: relative; z-index: 1;
//     max-width: 80%;
//     text-align: center;
//     word-break: break-word;
//     line-height: 1.4;
//     font-weight: 600;
//   }

//   .thumb_placeholder { color: #D1D5DB; font-size: 2em; }
// `

// const SubModal = styled.div`
//   background: #fff;
//   border-radius: 16px;
//   border: 1.5px solid #ECEFF3;
//   padding: 1rem 1rem 0.5rem;
//   display: flex;
//   flex-direction: column;
//   box-shadow: 0 4px 20px rgba(0,0,0,0.08);

//   .sub_title {
//     font-size: 1em; font-weight: 700;
//     color: var(--text-color, #111);
//     margin-bottom: 0.65rem;
//   }

//   .sub_option {
//     display: flex;
//     align-items: center;
//     gap: 0.75rem;
//     padding: 0.65rem 0.5rem;
//     border-radius: 10px;
//     cursor: pointer;
//     background: #F9FAFB;
//     margin-bottom: 6px;
//     border: 1.5px solid transparent;
//     transition: border-color 0.15s, background 0.15s;
//     &:hover { border-color: #E5E7EB; }
//     &.active { background: #fff; border-color: var(--primary-color, #EF5A42); }

//     .sub_radio {
//       width: 20px; height: 20px;
//       border-radius: 50%;
//       border: 1.5px solid #D1D5DB;
//       display: flex; align-items: center; justify-content: center;
//       flex-shrink: 0;
//       &.filled { border-color: transparent; .radio_icon { color: #10B981; font-size: 1.15em; } }
//     }

//     .sub_label { flex: 1; font-size: 0.9em; font-weight: 500; color: var(--text-color, #111); }

//     .sub_badge {
//       font-size: 0.78em; font-weight: 600;
//       padding: 3px 10px; border-radius: 99px;
//       &.free { color: #6B7280; background: transparent; }
//       &.pay  { color: var(--primary-color, #EF5A42); background: rgba(239,90,66,0.1); }
//     }
//   }
// `

// const AudioThumb = styled.div`
//   width: 100%;
//   aspect-ratio: 4 / 3;
//   border-radius: 12px;
//   border: 1.5px solid #ECEFF3;
//   background: #F9FAFB;
//   display: flex;
//   flex-direction: column;
//   align-items: center;
//   justify-content: center;
//   gap: 0.75rem;
//   padding: 1.5rem;
//   box-sizing: border-box;

//   .play_btn {
//     width: 72px; height: 72px;
//     border-radius: 50%;
//     border: none;
//     background: var(--primary-color, #EF5A42);
//     color: #fff;
//     display: flex; align-items: center; justify-content: center;
//     font-size: 1.8em;
//     cursor: pointer;
//     transition: transform 0.15s, opacity 0.15s;
//     flex-shrink: 0;
//     padding-left: 4px; /* optical centre for play icon */
//     &:hover { transform: scale(1.06); opacity: 0.9; }
//     svg { display: block; }
//   }

//   .audio_meta {
//     display: flex;
//     flex-direction: column;
//     align-items: center;
//     gap: 2px;
//   }

//   .audio_label {
//     font-size: 0.88em;
//     font-weight: 500;
//     color: var(--text-color, #111);
//     max-width: 200px;
//     overflow: hidden;
//     text-overflow: ellipsis;
//     white-space: nowrap;
//     text-align: center;
//   }

//   .audio_duration {
//     font-size: 0.82em;
//     font-variant-numeric: tabular-nums;
//     color: #9CA3AF;
//   }

//   .audio_progress_track {
//     width: 100%;
//     height: 4px;
//     border-radius: 2px;
//     background: #E5E7EB;
//     overflow: hidden;
//   }

//   .audio_progress_fill {
//     height: 100%;
//     border-radius: 2px;
//     background: var(--primary-color, #EF5A42);
//     transition: width 0.25s linear;
//   }
// `

// export default PreviewPanel

// import React, { useState, useRef } from 'react'
// import styled from 'styled-components'
// import { BsX, BsCameraFill, BsChevronRight, BsCheckCircleFill, BsPlayFill, BsPauseFill } from 'react-icons/bs'
// import { CAPACITY_OPTIONS, PRIVACY_OPTIONS } from '../../slices/boardPaymentSlice'

// const PreviewPanel = ({
//   // canvas — single captured screenshot (pixel-perfect, matches what user built)
//   canvasSnapshot,
//   // audio (mutually exclusive with canvasSnapshot)
//   audioURL,
//   audioName,
//   // form state
//   caption,
//   setCaption,
//   selectedCapacity,
//   setSelectedCapacity,
//   selectedPrivacy,
//   setSelectedPrivacy,
//   // sub-modal
//   previewSubModal,
//   setPreviewSubModal,
//   // actions
//   onClose,
//   onPost,
//   isPosting,
//   postError,
// }) => {
//   // ── Audio player state (only used when audioURL is present) ──────────────────
//   const audioRef   = useRef(null)
//   const [playing, setPlaying]     = useState(false)
//   const [duration, setDuration]   = useState(0)
//   const [currentTime, setCurrent] = useState(0)

//   const togglePlay = () => {
//     if (!audioRef.current) return
//     if (playing) { audioRef.current.pause() } else { audioRef.current.play() }
//   }

//   const formatDur = (s) => {
//     if (!s || isNaN(s)) return '0:00'
//     const m = Math.floor(s / 60)
//     const sec = Math.floor(s % 60).toString().padStart(2, '0')
//     return `${m}:${sec}`
//   }

//   return (
//     <PreviewOverlay>
//       <PreviewCard>
//         {/* Header */}
//         <div className="preview_header">
//           <span className="preview_title">Preview</span>
//           <button className="preview_close" onClick={onClose}><BsX /></button>
//         </div>

//         {/* Thumbnail — audio player OR canvas snapshot */}
//         {audioURL ? (
//           <AudioThumb>
//             {/* Hidden native audio element drives play/pause/duration */}
//             <audio
//               ref={audioRef}
//               src={audioURL}
//               onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
//               onTimeUpdate={() => setCurrent(audioRef.current?.currentTime || 0)}
//               onPlay={() => setPlaying(true)}
//               onPause={() => setPlaying(false)}
//               onEnded={() => { setPlaying(false); setCurrent(0) }}
//             />
//             <button className="play_btn" onClick={togglePlay}>
//               {playing ? <BsPauseFill /> : <BsPlayFill />}
//             </button>
//             <div className="audio_meta">
//               <span className="audio_label">{audioName || 'Audio message'}</span>
//               <span className="audio_duration">
//                 {formatDur(currentTime)} / {formatDur(duration)}
//               </span>
//             </div>
//             {/* Progress bar */}
//             <div className="audio_progress_track">
//               <div
//                 className="audio_progress_fill"
//                 style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
//               />
//             </div>
//           </AudioThumb>
//         ) : (
//           <PreviewThumb>
//             {canvasSnapshot
//               ? <img src={canvasSnapshot} alt="canvas preview" className="snapshot_img" />
//               : <span className="thumb_placeholder"><BsCameraFill /></span>
//             }
//           </PreviewThumb>
//         )}

//         {/* Capacity sub-modal */}
//         {previewSubModal === 'capacity' && (
//           <SubModal>
//             <div className="sub_title">Board Capacity</div>
//             {CAPACITY_OPTIONS.map(opt => {
//               const isActive = selectedCapacity.id === opt.id
//               return (
//                 <div
//                   key={opt.id}
//                   className={`sub_option ${isActive ? 'active' : ''}`}
//                   onClick={() => { setSelectedCapacity(opt); setPreviewSubModal(null) }}
//                 >
//                   <div className={`sub_radio ${isActive ? 'filled' : ''}`}>
//                     {isActive && <BsCheckCircleFill className="radio_icon" />}
//                   </div>
//                   <span className="sub_label">{opt.label}</span>
//                   {opt.badge && (
//                     <span className={`sub_badge ${opt.price ? 'pay' : 'free'}`}>
//                       {opt.badge}
//                     </span>
//                   )}
//                 </div>
//               )
//             })}
//           </SubModal>
//         )}

//         {/* Privacy sub-modal */}
//         {previewSubModal === 'privacy' && (
//           <SubModal>
//             <div className="sub_title">Privacy</div>
//             {PRIVACY_OPTIONS.map(opt => {
//               const isActive = selectedPrivacy.id === opt.id
//               return (
//                 <div
//                   key={opt.id}
//                   className={`sub_option ${isActive ? 'active' : ''}`}
//                   onClick={() => { setSelectedPrivacy(opt); setPreviewSubModal(null) }}
//                 >
//                   <div className={`sub_radio ${isActive ? 'filled' : ''}`}>
//                     {isActive && <BsCheckCircleFill className="radio_icon" />}
//                   </div>
//                   <span className="sub_label">{opt.label}</span>
//                 </div>
//               )
//             })}
//           </SubModal>
//         )}

//         {/* Caption */}
//         <input
//           className="caption_input"
//           placeholder="Caption"
//           value={caption}
//           onChange={e => setCaption(e.target.value)}
//         />

//         {/* Capacity row */}
//         <div
//           className="preview_row"
//           onClick={() => setPreviewSubModal(prev => prev === 'capacity' ? null : 'capacity')}
//         >
//           <span className="row_label">Select board capacity</span>
//           <span className="row_value">{selectedCapacity.label} <BsChevronRight /></span>
//         </div>

//         {/* Privacy row */}
//         <div
//           className="preview_row"
//           onClick={() => setPreviewSubModal(prev => prev === 'privacy' ? null : 'privacy')}
//         >
//           <span className="row_label">Privacy</span>
//           <span className="row_value">{selectedPrivacy.label} <BsChevronRight /></span>
//         </div>

//         {postError && <p className="post_error">{postError}</p>}

//         <button
//           className={`post_btn ${isPosting ? 'loading' : ''}`}
//           onClick={onPost}
//           disabled={isPosting}
//         >
//           {isPosting ? 'Posting…' : 'Post'}
//         </button>
//       </PreviewCard>
//     </PreviewOverlay>
//   )
// }

// // ─── Success Screen ───────────────────────────────────────────────────────────

// export const SuccessScreen = ({ hasPaidTier, onDone }) => (
//   <PreviewOverlay>
//     <PreviewCard style={{ alignItems: 'center', textAlign: 'center', gap: '1rem', padding: '2rem 1.5rem' }}>
//       <BsCheckCircleFill style={{ fontSize: '3rem', color: '#10B981' }} />
//       <h3 style={{ margin: 0, fontSize: '1.1em', fontWeight: 700 }}>Board Posted!</h3>
//       <p style={{ margin: 0, color: '#6B7280', fontSize: '0.9em', lineHeight: 1.5 }}>
//         Your appreciation board has been created and your message has been posted.
//         {hasPaidTier && ' You will be redirected to complete payment.'}
//       </p>
//       <button className="post_btn" onClick={onDone}>Done</button>
//     </PreviewCard>
//   </PreviewOverlay>
// )

// // ─── Styled Components ────────────────────────────────────────────────────────

// const PreviewOverlay = styled.div`
//   position: fixed;
//   inset: 0;
//   z-index: 200;
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   padding: 1rem;
//   background: rgba(0,0,0,0.35);
//   backdrop-filter: blur(2px);
// `

// const PreviewCard = styled.div`
//   background: #fff;
//   border-radius: 20px;
//   width: 100%;
//   max-width: 420px;
//   display: flex;
//   flex-direction: column;
//   gap: 0.6rem;
//   padding: 1.25rem;
//   box-shadow: 0 16px 48px rgba(0,0,0,0.18);
//   position: relative;
//   max-height: 92vh;
//   overflow-y: auto;

//   .preview_header {
//     display: flex;
//     align-items: center;
//     justify-content: space-between;
//     margin-bottom: 0.25rem;

//     .preview_title { font-size: 1em; font-weight: 700; color: var(--text-color, #111); }

//     .preview_close {
//       width: 28px; height: 28px;
//       border-radius: 50%;
//       border: 1.5px solid #ECEFF3;
//       background: transparent;
//       display: flex; align-items: center; justify-content: center;
//       font-size: 1.1em; cursor: pointer;
//       color: var(--text-color, #111);
//       &:hover { border-color: var(--primary-color, #EF5A42); color: var(--primary-color, #EF5A42); }
//     }
//   }

//   .caption_input {
//     width: 100%;
//     height: 44px;
//     padding: 0 1rem;
//     background: #F9FAFB;
//     border: 1.5px solid #ECEFF3;
//     border-radius: 10px;
//     font-size: 0.93em;
//     color: var(--text-color, #111);
//     outline: none;
//     box-sizing: border-box;
//     transition: border-color 0.2s;
//     &::placeholder { color: #9CA3AF; }
//     &:focus { border-color: var(--primary-color, #EF5A42); background: #fff; }
//   }

//   .preview_row {
//     display: flex;
//     align-items: center;
//     justify-content: space-between;
//     padding: 0.75rem 0;
//     border-bottom: 1px solid #F3F4F6;
//     cursor: pointer;
//     user-select: none;
//     &:last-of-type { border-bottom: none; }
//     &:hover .row_value { color: var(--primary-color, #EF5A42); }

//     .row_label { font-size: 0.93em; font-weight: 500; color: var(--text-color, #111); }
//     .row_value {
//       display: flex; align-items: center; gap: 4px;
//       font-size: 0.87em; color: #9CA3AF;
//       transition: color 0.15s;
//       svg { font-size: 0.8em; }
//     }
//   }

//   .post_error {
//     font-size: 0.83em;
//     color: #EF5A42;
//     margin: 0;
//     text-align: center;
//   }

//   .job_progress_track {
//     width: 100%;
//     height: 4px;
//     border-radius: 2px;
//     background: #E5E7EB;
//     overflow: hidden;
//   }

//   .job_progress_fill {
//     height: 100%;
//     border-radius: 2px;
//     background: var(--primary-color, #EF5A42);
//     transition: width 0.4s ease;
//   }

//   .post_btn {
//     width: 100%;
//     height: 52px;
//     border: none;
//     border-radius: 26px;
//     background: var(--primary-color, #EF5A42);
//     color: #fff;
//     font-size: 1em;
//     font-weight: 700;
//     cursor: pointer;
//     transition: opacity 0.2s;
//     margin-top: 0.4rem;
//     &:hover { opacity: 0.88; }
//     &.loading { opacity: 0.6; cursor: not-allowed; }
//   }
// `

// const PreviewThumb = styled.div`
//   width: 100%;
//   aspect-ratio: 1 / 1;
//   border-radius: 12px;
//   overflow: hidden;
//   position: relative;
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   border: 1.5px solid #ECEFF3;
//   background: #F3F4F6;

//   .snapshot_img {
//     width: 100%;
//     height: 100%;
//     object-fit: contain;
//     display: block;
//   }

//   .thumb_placeholder { color: #D1D5DB; font-size: 2em; }
// `

// const SubModal = styled.div`
//   background: #fff;
//   border-radius: 16px;
//   border: 1.5px solid #ECEFF3;
//   padding: 1rem 1rem 0.5rem;
//   display: flex;
//   flex-direction: column;
//   box-shadow: 0 4px 20px rgba(0,0,0,0.08);

//   .sub_title {
//     font-size: 1em; font-weight: 700;
//     color: var(--text-color, #111);
//     margin-bottom: 0.65rem;
//   }

//   .sub_option {
//     display: flex;
//     align-items: center;
//     gap: 0.75rem;
//     padding: 0.65rem 0.5rem;
//     border-radius: 10px;
//     cursor: pointer;
//     background: #F9FAFB;
//     margin-bottom: 6px;
//     border: 1.5px solid transparent;
//     transition: border-color 0.15s, background 0.15s;
//     &:hover { border-color: #E5E7EB; }
//     &.active { background: #fff; border-color: var(--primary-color, #EF5A42); }

//     .sub_radio {
//       width: 20px; height: 20px;
//       border-radius: 50%;
//       border: 1.5px solid #D1D5DB;
//       display: flex; align-items: center; justify-content: center;
//       flex-shrink: 0;
//       &.filled { border-color: transparent; .radio_icon { color: #10B981; font-size: 1.15em; } }
//     }

//     .sub_label { flex: 1; font-size: 0.9em; font-weight: 500; color: var(--text-color, #111); }

//     .sub_badge {
//       font-size: 0.78em; font-weight: 600;
//       padding: 3px 10px; border-radius: 99px;
//       &.free { color: #6B7280; background: transparent; }
//       &.pay  { color: var(--primary-color, #EF5A42); background: rgba(239,90,66,0.1); }
//     }
//   }
// `

// const AudioThumb = styled.div`
//   width: 100%;
//   aspect-ratio: 4 / 3;
//   border-radius: 12px;
//   border: 1.5px solid #ECEFF3;
//   background: #F9FAFB;
//   display: flex;
//   flex-direction: column;
//   align-items: center;
//   justify-content: center;
//   gap: 0.75rem;
//   padding: 1.5rem;
//   box-sizing: border-box;

//   .play_btn {
//     width: 72px; height: 72px;
//     border-radius: 50%;
//     border: none;
//     background: var(--primary-color, #EF5A42);
//     color: #fff;
//     display: flex; align-items: center; justify-content: center;
//     font-size: 1.8em;
//     cursor: pointer;
//     transition: transform 0.15s, opacity 0.15s;
//     flex-shrink: 0;
//     padding-left: 4px; /* optical centre for play icon */
//     &:hover { transform: scale(1.06); opacity: 0.9; }
//     svg { display: block; }
//   }

//   .audio_meta {
//     display: flex;
//     flex-direction: column;
//     align-items: center;
//     gap: 2px;
//   }

//   .audio_label {
//     font-size: 0.88em;
//     font-weight: 500;
//     color: var(--text-color, #111);
//     max-width: 200px;
//     overflow: hidden;
//     text-overflow: ellipsis;
//     white-space: nowrap;
//     text-align: center;
//   }

//   .audio_duration {
//     font-size: 0.82em;
//     font-variant-numeric: tabular-nums;
//     color: #9CA3AF;
//   }

//   .audio_progress_track {
//     width: 100%;
//     height: 4px;
//     border-radius: 2px;
//     background: #E5E7EB;
//     overflow: hidden;
//   }

//   .audio_progress_fill {
//     height: 100%;
//     border-radius: 2px;
//     background: var(--primary-color, #EF5A42);
//     transition: width 0.25s linear;
//   }
// `

// export default PreviewPanel


import React, { useState, useRef } from 'react'
import styled from 'styled-components'
import { BsX, BsCameraFill, BsChevronRight, BsCheckCircleFill, BsPlayFill, BsPauseFill } from 'react-icons/bs'
import { CAPACITY_OPTIONS, PRIVACY_OPTIONS } from '../../slices/boardPaymentSlice'

const PreviewPanel = ({
  // canvas — single captured screenshot (pixel-perfect, matches what user built)
  canvasSnapshot,
  // audio (mutually exclusive with canvasSnapshot)
  audioURL,
  audioName,
  // form state
  caption,
  setCaption,
  selectedCapacity,
  setSelectedCapacity,
  selectedPrivacy,
  setSelectedPrivacy,
  // sub-modal
  previewSubModal,
  setPreviewSubModal,
  // actions
  onClose,
  onPost,
  isPosting,
  postError,
}) => {
  // ── Audio player state (only used when audioURL is present) ──────────────────
  const audioRef   = useRef(null)
  const [playing, setPlaying]     = useState(false)
  const [duration, setDuration]   = useState(0)
  const [currentTime, setCurrent] = useState(0)

  const togglePlay = () => {
    if (!audioRef.current) return
    if (playing) { audioRef.current.pause() } else { audioRef.current.play() }
  }

  const formatDur = (s) => {
    if (!s || isNaN(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60).toString().padStart(2, '0')
    return `${m}:${sec}`
  }

  return (
    <PreviewOverlay>
      <PreviewCard>
        {/* Header */}
        <div className="preview_header">
          <span className="preview_title">Preview</span>
          <button className="preview_close" onClick={onClose}><BsX /></button>
        </div>

        {/* Thumbnail — audio player OR canvas snapshot */}
        {audioURL ? (
          <AudioThumb>
            {/* Hidden native audio element drives play/pause/duration */}
            <audio
              ref={audioRef}
              src={audioURL}
              onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
              onTimeUpdate={() => setCurrent(audioRef.current?.currentTime || 0)}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onEnded={() => { setPlaying(false); setCurrent(0) }}
            />
            <button className="play_btn" onClick={togglePlay}>
              {playing ? <BsPauseFill /> : <BsPlayFill />}
            </button>
            <div className="audio_meta">
              <span className="audio_label">{audioName || 'Audio message'}</span>
              <span className="audio_duration">
                {formatDur(currentTime)} / {formatDur(duration)}
              </span>
            </div>
            {/* Progress bar */}
            <div className="audio_progress_track">
              <div
                className="audio_progress_fill"
                style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
              />
            </div>
          </AudioThumb>
        ) : (
          <PreviewThumb>
            {canvasSnapshot
              ? <img src={canvasSnapshot} alt="canvas preview" className="snapshot_img" />
              : <span className="thumb_placeholder"><BsCameraFill /></span>
            }
          </PreviewThumb>
        )}

        {/* Capacity sub-modal */}
        {previewSubModal === 'capacity' && (
          <SubModal>
            <div className="sub_title">Board Capacity</div>
            {CAPACITY_OPTIONS.map(opt => {
              const isActive = selectedCapacity.id === opt.id
              return (
                <div
                  key={opt.id}
                  className={`sub_option ${isActive ? 'active' : ''}`}
                  onClick={() => { setSelectedCapacity(opt); setPreviewSubModal(null) }}
                >
                  <div className={`sub_radio ${isActive ? 'filled' : ''}`}>
                    {isActive && <BsCheckCircleFill className="radio_icon" />}
                  </div>
                  <span className="sub_label">{opt.label}</span>
                  {opt.badge && (
                    <span className={`sub_badge ${opt.price ? 'pay' : 'free'}`}>
                      {opt.badge}
                    </span>
                  )}
                </div>
              )
            })}
          </SubModal>
        )}

        {/* Privacy sub-modal */}
        {previewSubModal === 'privacy' && (
          <SubModal>
            <div className="sub_title">Privacy</div>
            {PRIVACY_OPTIONS.map(opt => {
              const isActive = selectedPrivacy.id === opt.id
              return (
                <div
                  key={opt.id}
                  className={`sub_option ${isActive ? 'active' : ''}`}
                  onClick={() => { setSelectedPrivacy(opt); setPreviewSubModal(null) }}
                >
                  <div className={`sub_radio ${isActive ? 'filled' : ''}`}>
                    {isActive && <BsCheckCircleFill className="radio_icon" />}
                  </div>
                  <span className="sub_label">{opt.label}</span>
                </div>
              )
            })}
          </SubModal>
        )}

        {/* Caption */}
        <input
          className="caption_input"
          placeholder="Caption"
          value={caption}
          onChange={e => setCaption(e.target.value)}
        />

        {/* Capacity row */}
        <div
          className="preview_row"
          onClick={() => setPreviewSubModal(prev => prev === 'capacity' ? null : 'capacity')}
        >
          <span className="row_label">Select board capacity</span>
          <span className="row_value">{selectedCapacity.label} <BsChevronRight /></span>
        </div>

        {/* Privacy row */}
        <div
          className="preview_row"
          onClick={() => setPreviewSubModal(prev => prev === 'privacy' ? null : 'privacy')}
        >
          <span className="row_label">Privacy</span>
          <span className="row_value">{selectedPrivacy.label} <BsChevronRight /></span>
        </div>

        {postError && <p className="post_error">{postError}</p>}

        <button
          className={`post_btn ${isPosting ? 'loading' : ''}`}
          onClick={onPost}
          disabled={isPosting}
        >
          {isPosting ? 'Posting…' : 'Post'}
        </button>
      </PreviewCard>
    </PreviewOverlay>
  )
}

// ─── Success Screen ───────────────────────────────────────────────────────────

export const SuccessScreen = ({ hasPaidTier, onDone }) => (
  <PreviewOverlay>
    <PreviewCard style={{ alignItems: 'center', textAlign: 'center', gap: '1rem', padding: '2rem 1.5rem' }}>
      <BsCheckCircleFill style={{ fontSize: '3rem', color: '#10B981' }} />
      <h3 style={{ margin: 0, fontSize: '1.1em', fontWeight: 700 }}>Board Posted!</h3>
      <p style={{ margin: 0, color: '#6B7280', fontSize: '0.9em', lineHeight: 1.5 }}>
        Your appreciation board has been created and your message has been posted.
        {hasPaidTier && ' You will be redirected to complete payment.'}
      </p>
      <button className="post_btn" onClick={onDone}>Done</button>
    </PreviewCard>
  </PreviewOverlay>
)

// ─── Styled Components ────────────────────────────────────────────────────────

const PreviewOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(0,0,0,0.35);
  backdrop-filter: blur(2px);
`

const PreviewCard = styled.div`
  background: #fff;
  border-radius: 20px;
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 1.25rem;
  box-shadow: 0 16px 48px rgba(0,0,0,0.18);
  position: relative;
  max-height: 92vh;
  overflow-y: auto;

  .preview_header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.25rem;

    .preview_title { font-size: 1em; font-weight: 700; color: var(--text-color, #111); }

    .preview_close {
      width: 28px; height: 28px;
      border-radius: 50%;
      border: 1.5px solid #ECEFF3;
      background: transparent;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.1em; cursor: pointer;
      color: var(--text-color, #111);
      &:hover { border-color: var(--primary-color, #EF5A42); color: var(--primary-color, #EF5A42); }
    }
  }

  .caption_input {
    width: 100%;
    height: 44px;
    padding: 0 1rem;
    background: #F9FAFB;
    border: 1.5px solid #ECEFF3;
    border-radius: 10px;
    font-size: 0.93em;
    color: var(--text-color, #111);
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.2s;
    &::placeholder { color: #9CA3AF; }
    &:focus { border-color: var(--primary-color, #EF5A42); background: #fff; }
  }

  .preview_row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 0;
    border-bottom: 1px solid #F3F4F6;
    cursor: pointer;
    user-select: none;
    &:last-of-type { border-bottom: none; }
    &:hover .row_value { color: var(--primary-color, #EF5A42); }

    .row_label { font-size: 0.93em; font-weight: 500; color: var(--text-color, #111); }
    .row_value {
      display: flex; align-items: center; gap: 4px;
      font-size: 0.87em; color: #9CA3AF;
      transition: color 0.15s;
      svg { font-size: 0.8em; }
    }
  }

  .post_error {
    font-size: 0.83em;
    color: #EF5A42;
    margin: 0;
    text-align: center;
  }

  .job_progress_track {
    width: 100%;
    height: 4px;
    border-radius: 2px;
    background: #E5E7EB;
    overflow: hidden;
  }

  .job_progress_fill {
    height: 100%;
    border-radius: 2px;
    background: var(--primary-color, #EF5A42);
    transition: width 0.4s ease;
  }

  .post_btn {
    width: 100%;
    height: 52px;
    border: none;
    border-radius: 26px;
    background: var(--primary-color, #EF5A42);
    color: #fff;
    font-size: 1em;
    font-weight: 700;
    cursor: pointer;
    transition: opacity 0.2s;
    margin-top: 0.4rem;
    &:hover { opacity: 0.88; }
    &.loading { opacity: 0.6; cursor: not-allowed; }
  }
`

const PreviewThumb = styled.div`
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid #ECEFF3;
  background: #F3F4F6;

  .snapshot_img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
  }

  .thumb_placeholder { color: #D1D5DB; font-size: 2em; }
`

const SubModal = styled.div`
  background: #fff;
  border-radius: 16px;
  border: 1.5px solid #ECEFF3;
  padding: 1rem 1rem 0.5rem;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);

  .sub_title {
    font-size: 1em; font-weight: 700;
    color: var(--text-color, #111);
    margin-bottom: 0.65rem;
  }

  .sub_option {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.65rem 0.5rem;
    border-radius: 10px;
    cursor: pointer;
    background: #F9FAFB;
    margin-bottom: 6px;
    border: 1.5px solid transparent;
    transition: border-color 0.15s, background 0.15s;
    &:hover { border-color: #E5E7EB; }
    &.active { background: #fff; border-color: var(--primary-color, #EF5A42); }

    .sub_radio {
      width: 20px; height: 20px;
      border-radius: 50%;
      border: 1.5px solid #D1D5DB;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      &.filled { border-color: transparent; .radio_icon { color: #10B981; font-size: 1.15em; } }
    }

    .sub_label { flex: 1; font-size: 0.9em; font-weight: 500; color: var(--text-color, #111); }

    .sub_badge {
      font-size: 0.78em; font-weight: 600;
      padding: 3px 10px; border-radius: 99px;
      &.free { color: #6B7280; background: transparent; }
      &.pay  { color: var(--primary-color, #EF5A42); background: rgba(239,90,66,0.1); }
    }
  }
`

const AudioThumb = styled.div`
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: 12px;
  border: 1.5px solid #ECEFF3;
  background: #F9FAFB;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1.5rem;
  box-sizing: border-box;

  .play_btn {
    width: 72px; height: 72px;
    border-radius: 50%;
    border: none;
    background: var(--primary-color, #EF5A42);
    color: #fff;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.8em;
    cursor: pointer;
    transition: transform 0.15s, opacity 0.15s;
    flex-shrink: 0;
    padding-left: 4px; /* optical centre for play icon */
    &:hover { transform: scale(1.06); opacity: 0.9; }
    svg { display: block; }
  }

  .audio_meta {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }

  .audio_label {
    font-size: 0.88em;
    font-weight: 500;
    color: var(--text-color, #111);
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: center;
  }

  .audio_duration {
    font-size: 0.82em;
    font-variant-numeric: tabular-nums;
    color: #9CA3AF;
  }

  .audio_progress_track {
    width: 100%;
    height: 4px;
    border-radius: 2px;
    background: #E5E7EB;
    overflow: hidden;
  }

  .audio_progress_fill {
    height: 100%;
    border-radius: 2px;
    background: var(--primary-color, #EF5A42);
    transition: width 0.25s linear;
  }
`

export default PreviewPanel