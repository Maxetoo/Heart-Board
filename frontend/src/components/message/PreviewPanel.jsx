import React, { useState, useRef } from 'react'
import styled, { keyframes } from 'styled-components'
import { BsX, BsCameraFill, BsChevronRight, BsCheckCircleFill, BsPlayFill, BsPauseFill } from 'react-icons/bs'
import { FaMicrophone } from 'react-icons/fa'
import { CAPACITY_OPTIONS, PRIVACY_OPTIONS } from '../../slices/boardPaymentSlice'
import CanvasRenderer from '../../canvas/CanvasRenderer'
import confetti1 from '../../assets/confetti 1.svg'
import confetti2 from '../../assets/confetti 2.svg'
 
const PreviewPanel = ({
  canvasData,
  // audio (mutually exclusive with canvasData)
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
        {/* Scrollable body */}
        <div className="preview_scroll">
          {/* Header */}
          <div className="preview_header">
            <span className="preview_title">Preview</span>
            <button className="preview_close" onClick={onClose}><BsX /></button>
          </div>

          {/* Thumbnail — audio player OR live canvas render */}
          {audioURL ? (
            <AudioThumb>
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
              <div className="audio_progress_track">
                <div
                  className="audio_progress_fill"
                  style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
                />
              </div>
            </AudioThumb>
          ) : (
            <PreviewThumb $ratio={canvasData?.aspectRatio || 'portrait'}>
              {canvasData
                ? <CanvasRenderer canvasData={canvasData} />
                : <span className="thumb_placeholder"><BsCameraFill /></span>
              }
            </PreviewThumb>
          )}

          {/* Caption */}
          <input
            className="caption_input"
            placeholder="Caption"
            value={caption}
            onChange={e => setCaption(e.target.value)}
          />

          {/* Capacity row */}
          <RowWrap>
            <div
              className="preview_row"
              onClick={() => setPreviewSubModal(prev => prev === 'capacity' ? null : 'capacity')}
            >
              <span className="row_label">Select board capacity</span>
              <span className="row_value">{selectedCapacity.label} <BsChevronRight /></span>
            </div>
            {previewSubModal === 'capacity' && (
              <SubModal>
                <div className="sub_title">Board Capacity</div>
                {CAPACITY_OPTIONS.map((opt, idx) => {
                  const isActive   = selectedCapacity.id === opt.id
                  const isDisabled = opt.disabled
                  const prevOpt    = CAPACITY_OPTIONS[idx - 1]
                  const showDivider = prevOpt?.id === 'only_me'
                  return (
                    <React.Fragment key={opt.id}>
                      {showDivider && <div className="sub_divider" />}
                      <div
                        className={`sub_option ${isActive ? 'active' : ''} ${isDisabled ? 'sub_disabled' : ''}`}
                        onClick={() => { if (!isDisabled) { setSelectedCapacity(opt); setPreviewSubModal(null) } }}
                      >
                        <div className={`sub_radio ${isActive ? 'filled' : ''}`}>
                          {isActive && <BsCheckCircleFill className="radio_icon" />}
                        </div>
                        <span className="sub_label">{opt.label}</span>
                        {isDisabled
                          ? <span className="sub_coming">Coming soon</span>
                          : opt.badge && (
                            <span className={`sub_badge ${opt.price ? 'pay' : 'free'}`}>{opt.badge}</span>
                          )
                        }
                      </div>
                    </React.Fragment>
                  )
                })}
              </SubModal>
            )}
          </RowWrap>

          {/* Privacy row */}
          <RowWrap>
            <div
              className="preview_row"
              onClick={() => setPreviewSubModal(prev => prev === 'privacy' ? null : 'privacy')}
            >
              <span className="row_label">Privacy</span>
              <span className="row_value">{selectedPrivacy.label} <BsChevronRight /></span>
            </div>
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
          </RowWrap>

          {postError && <p className="post_error">{postError}</p>}
        </div>

        {/* Fixed footer */}
        <div className="preview_footer">
          <button
            className={`post_btn ${isPosting ? 'loading' : ''}`}
            onClick={onPost}
            disabled={isPosting}
          >
            {isPosting ? 'Posting…' : 'Continue'}
          </button>
        </div>
      </PreviewCard>
    </PreviewOverlay>
  )
}
 
// ─── Success Screen ───────────────────────────────────────────────────────────

export const SuccessScreen = ({ canvasData, isAudio, onViewPost, onDone }) => (
  <SuccessOverlay>
    <div className="success_inner">
      <div className="preview_stage">
        <img src={confetti1} className="confetti confetti_1" alt="" aria-hidden="true" />
        <img src={confetti2} className="confetti confetti_2" alt="" aria-hidden="true" />
        <div className={`success_preview${isAudio ? ' success_audio' : ''}`}>
          {isAudio
            ? (
              <div className="audio_frame">
                <span className="mic_ripple">
                  <span className="ripple r1" />
                  <span className="ripple r2" />
                  <span className="ripple r3" />
                  <span className="mic_icon"><FaMicrophone /></span>
                </span>
              </div>
            )
            : canvasData
              ? <CanvasRenderer canvasData={canvasData} />
              : <div className="preview_placeholder"><BsCameraFill /></div>
          }
        </div>
      </div>

      <p className="success_message">
        Your appreciation board has been created and your message has been posted.
      </p>

      <button className="view_post_btn" onClick={onViewPost || onDone}>
        View Post
      </button>
    </div>
  </SuccessOverlay>
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
  max-height: 92vh;
  overflow: hidden;

  .preview_scroll {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    padding: 1.25rem;
    &::-webkit-scrollbar { width: 4px; }
    &::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 4px; }
  }

  .preview_footer {
    flex-shrink: 0;
    padding: 0.85rem 1.25rem;
    background: #F7F0ED;
    border-radius: 0 0 20px 20px;
  }

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
    flex-shrink: 0;
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
    &:hover { opacity: 0.88; }
    &.loading { opacity: 0.6; cursor: not-allowed; }
  }
`

const PreviewThumb = styled.div`
  width: ${({ $ratio }) => $ratio === 'landscape' ? '75%' : '70%'};
  align-self: center;
  aspect-ratio: ${({ $ratio }) => {
    if ($ratio === 'landscape') return '4 / 3'
    if ($ratio === 'portrait')  return '3 / 4'
    return '1 / 1'
  }};
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F3F4F6;
  .thumb_placeholder { color: #D1D5DB; font-size: 2em; }
`
 
const RowWrap = styled.div`
  position: relative;
`
 
const SubModal = styled.div`
  position: absolute;
  bottom: calc(100% + 8px);
  left: 0;
  right: 0;
  z-index: 10;
  background: #fff;
  border-radius: 16px;
  border: 1.5px solid #ECEFF3;
  padding: 1rem 1rem 0.5rem;
  display: flex;
  flex-direction: column;
 
  .sub_title {
    font-size: 1em; font-weight: 700;
    color: var(--text-color, #111);
    margin-bottom: 0.65rem;
  }

  .sub_divider {
    height: 1px;
    background: #ECEFF3;
    margin: 2px 0 8px;
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
    &:hover:not(.sub_disabled) { border-color: #E5E7EB; }
    &.active { background: #fff; border-color: var(--primary-color, #EF5A42); }
    &.sub_disabled { cursor: not-allowed; opacity: 0.5; }
 
    .sub_radio {
      width: 20px; height: 20px;
      border-radius: 50%;
      border: 1.5px solid #D1D5DB;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      &.filled { border-color: transparent; }
      .radio_icon { color: #10B981; font-size: 1.15em; }
    }
 
    .sub_label { flex: 1; font-size: 0.9em; font-weight: 500; color: var(--text-color, #111); }
 
    .sub_badge {
      font-size: 0.78em; font-weight: 600;
      padding: 3px 10px; border-radius: 99px;
      &.free { color: #6B7280; background: transparent; }
      &.pay  { color: var(--primary-color, #EF5A42); background: rgba(239,90,66,0.1); }
    }
 
    .sub_coming {
      font-size: 0.72em; font-weight: 600;
      color: #9CA3AF;
      background: #F3F4F6;
      padding: 3px 8px;
      border-radius: 99px;
      white-space: nowrap;
      flex-shrink: 0;
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
 
const SuccessOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 300;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  .success_inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.75rem;
    padding: 2rem 1.5rem;
    width: 100%;
    max-width: 400px;
  }

  /* Outer stage — wide enough for confetti to spill out */
  .preview_stage {
    position: relative;
    width: 85%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem 0;
  }

  .confetti {
    position: absolute;
    width: 90%;
    pointer-events: none;
    user-select: none;
    z-index: 0;
    opacity: 0.55;
  }
  .confetti_1 { top: 0; left: -5%; }
  .confetti_2 { bottom: 0; right: -5%; transform: rotate(180deg); }

  .success_preview {
    position: relative;
    z-index: 1;
    width: 68%;
    border-radius: 18px;
    overflow: hidden;
    &.success_audio {
      aspect-ratio: 1 / 1;
      border-radius: 20px;
      overflow: hidden;
    }
  }

  .audio_frame {
    width: 100%;
    aspect-ratio: 1 / 1;
    background: #F0E0DC;
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 25px solid #111;
  }

  .mic_ripple {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 64px;
    height: 64px;
  }

  .ripple {
    position: absolute;
    border-radius: 50%;
    border: 2px solid rgba(201, 79, 56, 0.5);
    animation: ${keyframes`
      0%   { transform: scale(1);   opacity: 0.7; }
      100% { transform: scale(2.8); opacity: 0; }
    `} 4s ease-out infinite;
    width: 100%;
    height: 100%;
  }
  .r1 { animation-delay: 0s; }
  .r2 { animation-delay: 1.3s; }
  .r3 { animation-delay: 2.6s; }

  .mic_icon {
    position: relative;
    z-index: 1;
    color: #C94F38;
    font-size: 2em;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .preview_placeholder {
    width: 100%;
    aspect-ratio: 3 / 4;
    background: #F3F4F6;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #D1D5DB;
    font-size: 2em;
  }

  .success_message {
    margin: 0;
    font-size: 0.95em;
    font-weight: 500;
    color: #6B7280;
    text-align: center;
    line-height: 1.6;
    max-width: 260px;
  }

  .view_post_btn {
    width: 100%;
    max-width: 280px;
    height: 52px;
    border: none;
    border-radius: 26px;
    background: var(--primary-color, #EF5A42);
    color: #fff;
    font-size: 1em;
    font-weight: 700;
    cursor: pointer;
    transition: opacity 0.2s;
    &:hover { opacity: 0.88; }
  }
`

export default PreviewPanel