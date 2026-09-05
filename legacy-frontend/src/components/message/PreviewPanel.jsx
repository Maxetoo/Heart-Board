import React, { useState, useRef, useCallback } from 'react'
import html2canvas from 'html2canvas'
import styled, { keyframes } from 'styled-components'
import { BsCameraFill, BsChevronRight, BsCheckCircleFill, BsPlayFill, BsPauseFill, BsMicFill } from 'react-icons/bs'
import { RxCross2 } from 'react-icons/rx'
import { CAPACITY_OPTIONS, PRIVACY_OPTIONS } from '../../slices/boardPaymentSlice'
import confetti from '../../assets/confetti.svg'
import shareFrame from '../../assets/share profile/share profile frame.svg'
import heartboardLogo from '../../assets/Heartboard logo 2.svg'
import shareRect1 from '../../assets/share profile/share profile rectangle 1.svg'
import shareRect2 from '../../assets/share profile/share profile rectangle 2.svg'
import CanvasRenderer from '../../canvas/CanvasRenderer'
 
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
            <button className="preview_close" onClick={onClose}><RxCross2 /></button>
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
                : <div className="thumb_placeholder"><BsCameraFill /></div>
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
            {isPosting ? 'Posting…' : 'Post'}
          </button>
        </div>
      </PreviewCard>
    </PreviewOverlay>
  )
}
 
// ─── Success Screen ───────────────────────────────────────────────────────────

export const SuccessScreen = ({ canvasData, isAudio, onViewPost, onDone, boardTitle, messageCount, boardSlug }) => {
  const [showShareModal, setShowShareModal] = useState(false)
  const [linkCopied,     setLinkCopied]     = useState(false)
  const shareFrameRef = useRef(null)

  const handleDownloadCopyLink = useCallback(async () => {
    try {
      const link = boardSlug ? `${window.location.origin}/board/${boardSlug}` : window.location.href
      if (shareFrameRef.current) {
        const canvas = await html2canvas(shareFrameRef.current, {
          useCORS: true, allowTaint: true, backgroundColor: null, scale: 2,
        })
        const dataUrl = canvas.toDataURL('image/png')
        const a = document.createElement('a')
        a.href = dataUrl
        a.download = `${boardSlug || 'board'}-share.png`
        a.click()
        await navigator.clipboard.writeText(link)
      } else {
        await navigator.clipboard.writeText(link)
      }
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2500)
    } catch (err) { console.error(err) }
  }, [boardSlug])

  return (
    <>
      <SuccessOverlay $isPortrait={canvasData?.aspectRatio === 'portrait'}>
        <div className="success_inner">
          <div className="preview_stage">
            <img src={confetti} className="confetti confetti_1" alt="" aria-hidden="true" />
            <img src={confetti} className="confetti confetti_2" alt="" aria-hidden="true" />
            <div className={`success_preview${isAudio ? ' success_audio' : ''}`}>
              {isAudio
                ? (
                  <div className="audio_frame">
                    <span className="audio_ripple" />
                    <span className="audio_ripple" />
                    <span className="audio_ripple" />
                    <div className="audio_mic_center">
                      <BsMicFill className="audio_mic_icon" />
                    </div>
                  </div>
                )
                : canvasData
                  ? <CanvasRenderer canvasData={canvasData} />
                  : <div className="preview_placeholder"><BsCameraFill /></div>
              }
            </div>
          </div>

          <p className="success_message">
            Your message has been sent. Share the message and let others contribute.
          </p>

          <div className="success_btns">
            <button className="view_msg_btn" onClick={onViewPost || onDone}>
              View Message
            </button>
            <button className="share_msg_btn" onClick={() => setShowShareModal(true)}>
              Share Message
            </button>
          </div>
        </div>
      </SuccessOverlay>

      {showShareModal && (
        <ShareModalOverlay onClick={() => setShowShareModal(false)}>
          <ShareModalCard onClick={e => e.stopPropagation()}>
            {/* Frame part */}
            <div className="share_frame_part">
              <div className="share_canvas_frame" ref={shareFrameRef}>
                <img src={shareRect1} alt="" className="share_rect share_rect_left" />
                <img src={shareRect2} alt="" className="share_rect share_rect_right" />
                <img src={heartboardLogo} alt="Heartboard" className="share_logo" />
                <img src={shareFrame} alt="" className="share_frame_img" />
                <div className="share_canvas_and_text">
                  {isAudio ? (
                    <div className="share_canvas_inner share_audio_inner">
                      <span className="audio_ripple" />
                      <span className="audio_ripple" />
                      <span className="audio_ripple" />
                      <div className="audio_mic_center">
                        <BsMicFill className="audio_mic_icon" />
                      </div>
                    </div>
                  ) : canvasData ? (
                    <div className="share_canvas_inner">
                      <CanvasRenderer canvasData={canvasData} />
                    </div>
                  ) : null}
                  <div className="share_text_container">
                    <h3 className="share_board_title">{boardTitle || 'My Appreciation Board'}</h3>
                    <p className="share_board_caption">
                      Go drop yours with other{messageCount >= 100 ? ` ${messageCount}` : ''} contributors.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Button part */}
            <div className="share_btn_part">
              <button className="share_primary_btn" onClick={handleDownloadCopyLink}>
                {linkCopied ? 'Link Copied!' : 'Download & Copy Link'}
              </button>
              <button className="share_secondary_btn" onClick={() => setShowShareModal(false)}>
                Close
              </button>
            </div>
          </ShareModalCard>
        </ShareModalOverlay>
      )}
    </>
  )
}
 
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
      border: none;
      background: transparent;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.3em; font-weight: 700; cursor: pointer;
      color: #111;
    }
  }

  .caption_input {
    width: 100%;
    height: 48px;
    flex-shrink: 0;
    margin-top: 1.5rem;
    padding: 0 1rem;
    background: var(--secondary-color);
    border: none;
    border-radius: 10px;
    font-size: 1em;
    color: var(--text-color, #111);
    outline: none;
    box-sizing: border-box;
    &::placeholder { color: #9CA3AF; }
  }

  .preview_row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 48px;
    padding: 0 1rem;
    background: var(--secondary-color);
    border-radius: 10px;
    cursor: pointer;
    user-select: none;

    .row_label { font-size: 0.93em; font-weight: 500; color: var(--text-color, #111); }
    .row_value {
      display: flex; align-items: center; gap: 4px;
      font-size: 0.87em; color: #9CA3AF;
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
  width: 100%;
  .thumb_placeholder {
    width: 100%;
    aspect-ratio: ${({ $ratio }) => {
      if ($ratio === 'landscape') return '4 / 3'
      if ($ratio === 'portrait')  return '3 / 4'
      return '1 / 1'
    }};
    background: #F3F4F6;
    border-radius: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #D1D5DB;
    font-size: 2em;
  }
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
 
const SuccessOverlay = styled.div.attrs(p => ({ $isPortrait: p.$isPortrait }))`
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

  .preview_stage {
    position: relative;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: ${({ $isPortrait }) => $isPortrait ? '3.5rem 0' : '2rem 0'};
  }

  .confetti {
    position: absolute;
    width: ${({ $isPortrait }) => $isPortrait ? '117%' : '115%'};
    pointer-events: none;
    user-select: none;
    z-index: 0;
    animation: ${keyframes`
      0%   { transform: scale(0.4) rotate(0deg); opacity: 0; }
      60%  { transform: scale(1.1) rotate(4deg); opacity: 1; }
      100% { transform: scale(1)   rotate(0deg); opacity: 1; }
    `} 0.65s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  }
  .confetti_1 { top: 0; left: -5%; animation-delay: 0s; }
  .confetti_2 { bottom: 0; right: -5%; transform: rotate(180deg); animation-delay: 0.12s; }

  .success_preview {
    position: relative;
    z-index: 1;
    width: 85%;
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
    background: #FDDDD7;
    border-radius: 20px;
    overflow: hidden;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .audio_ripple {
    position: absolute;
    top: 50%;
    left: 50%;
    border-radius: 50%;
    background: rgba(201, 79, 56, 0.12);
    transform: translate(-50%, -50%) scale(0);
    animation: ${keyframes`
      0%   { transform: translate(-50%, -50%) scale(0); opacity: 0.8; }
      100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
    `} 3s ease-out infinite both;
    &:nth-child(1) { width: 160%; padding-top: 160%; animation-delay: 0s; }
    &:nth-child(2) { width: 110%; padding-top: 110%; animation-delay: 1s; }
    &:nth-child(3) { width: 60%;  padding-top: 60%;  animation-delay: 2s; }
  }

  .audio_mic_center {
    position: relative;
    z-index: 2;
    width: 46px;
    height: 46px;
    border-radius: 50%;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .audio_mic_icon {
    font-size: 1.1em;
    color: #C94F38;
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
    margin: ${({ $isPortrait }) => $isPortrait ? '-1.5rem 0 0' : '1.5rem 0 0'};
    position: relative;
    z-index: 2;
    font-size: 1em;
    font-weight: 800;
    color: #808897;
    text-align: center;
    line-height: 1.6;
    max-width: 350px;
  }

  .success_btns {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    width: 100%;
    max-width: 280px;
    @media (min-width: 480px) {
      flex-direction: row;
      max-width: 380px;
    }
  }

  .view_msg_btn {
    flex: 1;
    padding: 0.7em 1.25em;
    border: 1px solid #ECEFF3;
    border-radius: 99px;
    background: transparent;
    color: #1A1B25;
    font-size: 0.85em;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s;
    &:hover { opacity: 0.75; }
  }

  .share_msg_btn {
    flex: 1;
    padding: 1em 1.25em;
    border: none;
    border-radius: 99px;
    background: var(--primary-color, #EF5A42);
    color: #fff;
    font-size: 0.85em;
    font-weight: 700;
    cursor: pointer;
    transition: opacity 0.2s;
    &:hover { opacity: 0.88; }
  }
`

const ShareModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 500;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
`

const ShareModalCard = styled.div`
  background: #fff;
  border-radius: 30px;
  padding: 1.5rem;
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  .share_frame_part {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .share_canvas_frame {
    position: relative;
    width: 100%;
    overflow: hidden;
    border-radius: 30px;
  }

  .share_logo {
    position: absolute;
    top: -10%;
    right: -30%;
    width: 280px;
    height: auto;
    z-index: 15;
    pointer-events: none;
  }

  .share_rect {
    position: absolute;
    top: 15%;
    width: 45%;
    pointer-events: none;
    z-index: 5;
  }

  .share_rect_left {
    left: 10%;
  }

  .share_rect_right {
    right: 10%;
  }

  .share_frame_img {
    width: 100%;
    height: auto;
    display: block;
    position: relative;
    z-index: 1;
    pointer-events: none;
  }

  .share_canvas_and_text {
    position: absolute;
    top: 10%;
    left: 50%;
    transform: translateX(-50%);
    width: 62%;
    z-index: 10;
    display: flex;
    flex-direction: column;
  }

  .share_canvas_inner {
    width: 100%;
  }

  .share_audio_inner {
    aspect-ratio: 1 / 1;
    background: #FDDDD7;
    border-radius: 16px;
    overflow: hidden;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;

    .audio_ripple {
      position: absolute;
      top: 50%;
      left: 50%;
      border-radius: 50%;
      background: rgba(201, 79, 56, 0.12);
      transform: translate(-50%, -50%) scale(0);
      animation: ${keyframes`
        0%   { transform: translate(-50%, -50%) scale(0); opacity: 0.8; }
        100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
      `} 3s ease-out infinite both;
      &:nth-child(1) { width: 160%; padding-top: 160%; animation-delay: 0s; }
      &:nth-child(2) { width: 110%; padding-top: 110%; animation-delay: 1s; }
      &:nth-child(3) { width: 60%;  padding-top: 60%;  animation-delay: 2s; }
    }

    .audio_mic_center {
      position: relative;
      z-index: 2;
      width: 46px;
      height: 46px;
      border-radius: 50%;
      background: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .audio_mic_icon {
      font-size: 1.1em;
      color: #C94F38;
    }
  }

  .share_text_container {
    margin-top: 2rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    text-align: center;
  }

  .share_board_title {
    margin: 0;
    font-size: 1.05em;
    font-weight: 700;
    color: var(--text-color, #111);
    line-height: 1.3;
  }

  .share_board_caption {
    margin: 0;
    font-size: 0.9em;
    color: #272835;
    opacity: 0.5;
    line-height: 1.5;
  }

  .share_btn_part {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .share_primary_btn {
    width: 100%;
    height: 50px;
    border: none;
    border-radius: 25px;
    background: var(--primary-color, #EF5A42);
    color: #fff;
    font-size: 1em;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s;
    &:hover { opacity: 0.88; }
  }

  .share_secondary_btn {
    width: 100%;
    height: 50px;
    border: 1px solid #111;
    border-radius: 25px;
    background: transparent;
    color: #111;
    font-size: 1em;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.2s;
    &:hover { opacity: 0.7; }
  }
`

export default PreviewPanel