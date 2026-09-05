// import React, { useState, useRef, useEffect } from 'react'
// import styled from 'styled-components'
// import { BsMic, BsX, BsUpload, BsCameraVideo } from 'react-icons/bs'
// import { useSelector } from 'react-redux'


// const MAX_AUDIO_MB    = 25
// const MAX_AUDIO_BYTES = MAX_AUDIO_MB * 1024 * 1024



// const AudioTab = ({ onSend, initialAudioUrl, initialAudioName, hideSendBtn }) => { 
//   const { checkReceipentUser, receipentUser} = useSelector(state => state.user) 
//   const [recording, setRecording] = useState(false) 
//   const [elapsed, setElapsed] = useState(0) 
//   const [audioFile, setAudioFile] = useState(null) 
//   const [audioURL, setAudioURL] = useState(null)
//   const [uploadedName, setUploadedName] = useState(null)
//   const [localError, setLocalError] = useState('')    
//   const [extracting, setExtracting] = useState(false) 

//   const mediaRecorderRef = useRef(null)
//   const chunksRef = useRef([])
//   const timerRef = useRef(null)
//   const audioFileRef = useRef(null)
//   const videoFileRef = useRef(null)

//   const formatTime = (s) => {
//     const m   = Math.floor(s / 60).toString().padStart(2, '0')
//     const sec = (s % 60).toString().padStart(2, '0')
//     return `${m}:${sec}`
//   }

//   const applyAudio = (blob, name) => {
//     setLocalError('')
//     setAudioFile(blob)
//     setAudioURL(URL.createObjectURL(blob))
//     setUploadedName(name)
//     // In edit mode the send button is hidden, so notify parent immediately
//     if (hideSendBtn && onSend) onSend(blob, name)
//   }

//   const startRecording = async () => {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
//       const mr     = new MediaRecorder(stream)
//       mediaRecorderRef.current = mr
//       chunksRef.current        = []

//       mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
//       mr.onstop = () => {
//         const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
//         stream.getTracks().forEach(t => t.stop())
//         if (blob.size > MAX_AUDIO_BYTES) {
//           setLocalError(`Recording exceeds ${MAX_AUDIO_MB}MB. Please keep it shorter.`)
//           return
//         }
//         applyAudio(blob, 'Recorded audio')
//       }

//       mr.start()
//       setRecording(true)
//       setElapsed(0)
//       timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
//     } catch {
//       setLocalError('Microphone access denied. Please allow microphone access and try again.')
//     }
//   }

//   const stopRecording = () => {
//     if (mediaRecorderRef.current) mediaRecorderRef.current.stop()
//     clearInterval(timerRef.current)
//     setRecording(false)
//   }

//   const handleAudioUpload = (e) => {
//     const file = e.target.files[0]
//     if (!file) return
//     if (file.size > MAX_AUDIO_BYTES) {
//       setLocalError(`File exceeds ${MAX_AUDIO_MB}MB limit. Please choose a smaller file.`)
//       e.target.value = ''
//       return
//     }
//     applyAudio(file, file.name)
//     setElapsed(0)
//     setRecording(false)
//     e.target.value = ''
//   }

//   const handleVideoUpload = async (e) => {
//     const file = e.target.files[0]
//     e.target.value = ''
//     if (!file) return

//     setLocalError('')
//     setExtracting(true)

//     try {
      
//       const videoURL = URL.createObjectURL(file)
//       const video    = document.createElement('video')
//       video.src      = videoURL
//       video.muted    = false
//       video.preload  = 'auto'

//       await new Promise((res, rej) => {
//         video.onloadedmetadata = res
//         video.onerror          = () => rej(new Error('Could not read video file.'))
//       })

//       const stream       = video.captureStream()
//       const audioTracks  = stream.getAudioTracks()

//       if (audioTracks.length === 0) {
//         setLocalError('No audio track found in this video.')
//         setExtracting(false)
//         URL.revokeObjectURL(videoURL)
//         return
//       }

//       const audioStream = new MediaStream(audioTracks)
//       const chunks      = []

     
//       const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
//         ? 'audio/webm;codecs=opus'
//         : 'audio/webm'

//       const recorder = new MediaRecorder(audioStream, { mimeType })
//       recorder.ondataavailable = (ev) => { if (ev.data.size > 0) chunks.push(ev.data) }

//       recorder.onstop = () => {
//         URL.revokeObjectURL(videoURL)
//         const blob = new Blob(chunks, { type: 'audio/webm' })
//         setExtracting(false)

//         if (blob.size > MAX_AUDIO_BYTES) {
//           setLocalError(`Extracted audio exceeds ${MAX_AUDIO_MB}MB. Try a shorter video.`)
//           return
//         }

       
//         const baseName = file.name.replace(/\.[^.]+$/, '')
//         applyAudio(blob, `${baseName} (audio).webm`)
//       }

     
//       video.volume = 0
//       recorder.start()
//       video.play()

//       video.onended = () => recorder.stop()

    
//       setTimeout(() => {
//         if (recorder.state === 'recording') recorder.stop()
//       }, (video.duration + 2) * 1000)

//     } catch (err) {
//       setLocalError(err.message || 'Failed to extract audio from video.')
//       setExtracting(false)
//     }
//   }

//   const removeAudio = () => {
//     setAudioFile(null)
//     setAudioURL(null)
//     setUploadedName(null)
//     setElapsed(0)
//     setLocalError('')
//     // Reset parent selection when user removes audio in edit mode
//     if (hideSendBtn && onSend) onSend(null, null)
//   }

//   const handleSend = () => {
//     if (!audioFile || !onSend) return
//     onSend(audioFile, uploadedName)
//   }

//   // Seed with existing audio when provided (edit mode) — runs once on mount only
//   useEffect(() => {
//     if (initialAudioUrl) {
//       setAudioURL(initialAudioUrl)
//       setUploadedName(initialAudioName || 'Current audio')
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [])

//   useEffect(() => () => clearInterval(timerRef.current), [])

//   return (
//     <AudioWrapper>
//       {audioURL ? (
//         <div className="audio_result">
//           <div className="audio_file_row">
//             <BsMic className="audio_icon" />
//             <span className="audio_name">{uploadedName}</span>
//             <button className="audio_remove" onClick={removeAudio} title="Remove">
//               <BsX />
//             </button>
//           </div>
//           <audio controls src={audioURL} className="audio_player" />
//         </div>
//       ) : (
//         <>
//           <div className="record_area">
//             <button
//               className={`record_btn ${recording ? 'recording' : ''}`}
//               onClick={recording ? stopRecording : startRecording}
//               disabled={extracting}
//             >
//               {recording
//                 ? <span className="stop_square" />
//                 : <BsMic className="mic_icon" />
//               }
//             </button>
//             <span className="timer">{formatTime(elapsed)}</span>
//             {recording && <div className="pulse_ring" />}
//           </div>

//           {/* Audio file upload */}
//           <input type="file" accept="audio/*" ref={audioFileRef} style={{ display: 'none' }} onChange={handleAudioUpload} />
//           <button className="upload_sound_btn" onClick={() => audioFileRef.current.click()} disabled={extracting}>
//             <BsUpload />
//             <span>Upload audio (max {MAX_AUDIO_MB}MB)</span>
//           </button>

//           {/* Video file upload — extracts audio track */}
//           <input type="file" accept="video/*" ref={videoFileRef} style={{ display: 'none' }} onChange={handleVideoUpload} />
//           <button
//             className={`upload_sound_btn video_btn ${extracting ? 'extracting' : ''}`}
//             onClick={() => videoFileRef.current.click()}
//             disabled={extracting}
//           >
//             <BsCameraVideo />
//             <span>{extracting ? 'Extracting audio…' : 'Extract audio from video'}</span>
//             {extracting && <span className="spinner" />}
//           </button>
//         </>
//       )}

//       {/* Error box — local errors only (size, format, mic denied, extraction failed) */}
//       {localError && (
//         <div className="audio_error_box">
//           <span className="error_dot">●</span>
//           <span>{localError}</span>
//         </div>
//       )}

//      {!hideSendBtn && (
//       <button
//         className={`send_btn ${
//           audioURL && !extracting && (receipentUser.length === 0 || checkReceipentUser)
//             ? 'ready'
//             : ''
//         }`}
//         disabled={
//           !audioURL ||
//           extracting ||
//           !(receipentUser.length === 0 || checkReceipentUser)
//         }
//         onClick={handleSend}
//       >
//         {extracting ? 'Processing…' : 'Preview'}
//       </button>
//     )}
//     </AudioWrapper>
//   )
// }

// const AudioWrapper = styled.div`
//   display: flex;
//   flex-direction: column;
//   align-items: center;
//   gap: 1.25rem;
//   padding: 0.5rem 0;

//   .record_area {
//     position: relative;
//     display: flex;
//     flex-direction: column;
//     align-items: center;
//     gap: 0.75rem;
//   }

//   .record_btn {
//     width: 110px; height: 110px;
//     border-radius: 50%;
//     border: none;
//     background: #EF5A42;
//     color: #fff;
//     display: flex; align-items: center; justify-content: center;
//     cursor: pointer;
//     position: relative; z-index: 1;
//     transition: transform 0.15s;
//     &:hover:not(:disabled) { transform: scale(1.04); }
//     &:disabled { opacity: 0.5; cursor: not-allowed; }
//     .mic_icon { font-size: 2em; }
//     .stop_square { width: 28px; height: 28px; background: #fff; border-radius: 4px; }
//   }

//   .pulse_ring {
//     position: absolute;
//     top: 50%; left: 50%;
//     transform: translate(-50%, -50%);
//     width: 110px; height: 110px;
//     border-radius: 50%;
//     border: 3px solid rgba(239,90,66,0.5);
//     animation: pulse 1.4s ease-out infinite;
//     pointer-events: none; z-index: 0;
//   }

//   @keyframes pulse {
//     0%   { transform: translate(-50%, -50%) scale(1); opacity: 1; }
//     100% { transform: translate(-50%, -50%) scale(1.7); opacity: 0; }
//   }

//   .timer {
//     font-size: 1.15em; font-weight: 600;
//     font-variant-numeric: tabular-nums;
//     color: var(--text-color, #111);
//   }

//   .upload_sound_btn {
//     display: flex; align-items: center; justify-content: center; gap: 0.5rem;
//     width: 100%; height: 50px;
//     border: 1.5px dashed #D1D5DB;
//     border-radius: 12px; background: transparent;
//     font-size: 0.95em;
//     color: var(--light-text-color, #6B7280);
//     cursor: pointer;
//     transition: border-color 0.2s, color 0.2s, opacity 0.2s;
//     &:hover:not(:disabled) { border-color: var(--primary-color, #EF5A42); color: var(--primary-color, #EF5A42); }
//     &:disabled { opacity: 0.5; cursor: not-allowed; }

//     &.video_btn {
//       border-style: dashed;
//       border-color: #C4B5FD;
//       color: #7C3AED;
//       &:hover:not(:disabled) { border-color: #7C3AED; color: #7C3AED; background: rgba(124,58,237,0.04); }
//     }

//     &.extracting {
//       border-style: solid;
//       border-color: #7C3AED;
//       color: #7C3AED;
//       background: rgba(124,58,237,0.04);
//     }

//     .spinner {
//       width: 14px; height: 14px;
//       border-radius: 50%;
//       border: 2px solid #C4B5FD;
//       border-top-color: #7C3AED;
//       animation: spin 0.7s linear infinite;
//       flex-shrink: 0;
//     }
//   }

//   @keyframes spin {
//     to { transform: rotate(360deg); }
//   }

//   .audio_result {
//     width: 100%;
//     display: flex; flex-direction: column; gap: 0.75rem;
//   }

//   .audio_file_row {
//     display: flex; align-items: center; gap: 0.75rem;
//     padding: 0.75rem 1rem;
//     background: #F9FAFB;
//     border: 1.5px solid #ECEFF3;
//     border-radius: 10px;
//     .audio_icon { font-size: 1.1em; color: var(--primary-color, #EF5A42); flex-shrink: 0; }
//     .audio_name { flex: 1; font-size: 0.9em; color: var(--text-color, #111); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
//     .audio_remove {
//       border: none; background: transparent; cursor: pointer;
//       color: #9CA3AF; font-size: 1.1em; display: flex; align-items: center;
//       &:hover { color: #EF5A42; }
//     }
//   }

//   .audio_player { width: 100%; height: 40px; border-radius: 8px; outline: none; }

//   /* Error box — same intent as PreviewPanel's .post_error but with an icon */
//   .audio_error_box {
//     width: 100%;
//     display: flex;
//     align-items: flex-start;
//     gap: 0.4rem;
//     padding: 0.65rem 0.9rem;
//     background: rgba(239,90,66,0.06);
//     border: 1.5px solid rgba(239,90,66,0.25);
//     border-radius: 10px;
//     font-size: 0.85em;
//     color: #EF5A42;
//     line-height: 1.45;
//     .error_dot { font-size: 0.5em; margin-top: 0.35em; flex-shrink: 0; }
//   }

//   .send_btn {
//     width: 100%; height: 50px;
//     border: none; border-radius: 25px;
//     background: var(--primary-color, #EF5A42);
//     color: #fff; font-size: 1em; font-weight: 600;
//     cursor: not-allowed; opacity: 0.4;
//     transition: opacity 0.2s;
//     &.ready { opacity: 1; cursor: pointer; &:hover { opacity: 0.88; } }
//   }
// `

// export default AudioTab

import React, { useState, useRef, useEffect } from 'react'
import styled from 'styled-components'
import { BsMic, BsX, BsUpload, BsCameraVideo } from 'react-icons/bs'
import { useSelector } from 'react-redux'


const MAX_AUDIO_MB    = 25
const MAX_AUDIO_BYTES = MAX_AUDIO_MB * 1024 * 1024



const AudioTab = ({ onSend }) => { 
  const { checkReceipentUser, receipentUser} = useSelector(state => state.user) 
  const [recording, setRecording] = useState(false) 
  const [elapsed, setElapsed] = useState(0) 
  const [audioFile, setAudioFile] = useState(null) 
  const [audioURL, setAudioURL] = useState(null)
  const [uploadedName, setUploadedName] = useState(null)
  const [localError, setLocalError] = useState('')    
  const [extracting, setExtracting] = useState(false) 

  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const audioFileRef = useRef(null)
  const videoFileRef = useRef(null)

  const formatTime = (s) => {
    const m   = Math.floor(s / 60).toString().padStart(2, '0')
    const sec = (s % 60).toString().padStart(2, '0')
    return `${m}:${sec}`
  }

  const applyAudio = (blob, name) => {
    setLocalError('')
    setAudioFile(blob)
    setAudioURL(URL.createObjectURL(blob))
    setUploadedName(name)
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Pick the best supported format — Safari needs mp4/aac, Chrome prefers webm
      const preferredTypes = [
        'audio/mp4',
        'audio/aac',
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/ogg',
      ]
      const mimeType = preferredTypes.find(t => MediaRecorder.isTypeSupported(t)) || ''

      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      mediaRecorderRef.current = mr
      chunksRef.current        = []

      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        const finalType = mimeType || mr.mimeType || 'audio/webm'
        const blob = new Blob(chunksRef.current, { type: finalType })
        stream.getTracks().forEach(t => t.stop())
        if (blob.size > MAX_AUDIO_BYTES) {
          setLocalError(`Recording exceeds ${MAX_AUDIO_MB}MB. Please keep it shorter.`)
          return
        }
        applyAudio(blob, 'Recorded audio')
      }

      mr.start()
      setRecording(true)
      setElapsed(0)
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    } catch {
      setLocalError('Microphone access denied. Please allow microphone access and try again.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current) mediaRecorderRef.current.stop()
    clearInterval(timerRef.current)
    setRecording(false)
  }

  const handleAudioUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > MAX_AUDIO_BYTES) {
      setLocalError(`File exceeds ${MAX_AUDIO_MB}MB limit. Please choose a smaller file.`)
      e.target.value = ''
      return
    }
    applyAudio(file, file.name)
    setElapsed(0)
    setRecording(false)
    e.target.value = ''
  }

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return

    setLocalError('')
    setExtracting(true)

    try {
      
      const videoURL = URL.createObjectURL(file)
      const video    = document.createElement('video')
      video.src      = videoURL
      video.muted    = false
      video.preload  = 'auto'

      await new Promise((res, rej) => {
        video.onloadedmetadata = res
        video.onerror          = () => rej(new Error('Could not read video file.'))
      })

      const stream       = video.captureStream()
      const audioTracks  = stream.getAudioTracks()

      if (audioTracks.length === 0) {
        setLocalError('No audio track found in this video.')
        setExtracting(false)
        URL.revokeObjectURL(videoURL)
        return
      }

      const audioStream = new MediaStream(audioTracks)
      const chunks      = []

     
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm'

      const recorder = new MediaRecorder(audioStream, { mimeType })
      recorder.ondataavailable = (ev) => { if (ev.data.size > 0) chunks.push(ev.data) }

      recorder.onstop = () => {
        URL.revokeObjectURL(videoURL)
        const blob = new Blob(chunks, { type: 'audio/webm' })
        setExtracting(false)

        if (blob.size > MAX_AUDIO_BYTES) {
          setLocalError(`Extracted audio exceeds ${MAX_AUDIO_MB}MB. Try a shorter video.`)
          return
        }

       
        const baseName = file.name.replace(/\.[^.]+$/, '')
        applyAudio(blob, `${baseName} (audio).webm`)
      }

     
      video.volume = 0
      recorder.start()
      video.play()

      video.onended = () => recorder.stop()

    
      setTimeout(() => {
        if (recorder.state === 'recording') recorder.stop()
      }, (video.duration + 2) * 1000)

    } catch (err) {
      setLocalError(err.message || 'Failed to extract audio from video.')
      setExtracting(false)
    }
  }

  const removeAudio = () => {
    setAudioFile(null)
    setAudioURL(null)
    setUploadedName(null)
    setElapsed(0)
    setLocalError('')
  }

  const handleSend = () => {
    if (!audioFile || !onSend) return
    onSend(audioFile, uploadedName)
  }

  useEffect(() => () => clearInterval(timerRef.current), [])

  return (
    <AudioWrapper>
      {audioURL ? (
        <div className="audio_result">
          <div className="audio_file_row">
            <BsMic className="audio_icon" />
            <span className="audio_name">{uploadedName}</span>
            <button className="audio_remove" onClick={removeAudio} title="Remove">
              <BsX />
            </button>
          </div>
          <audio controls src={audioURL} className="audio_player" />
        </div>
      ) : (
        <>
          <div className="record_area">
            <button
              className={`record_btn ${recording ? 'recording' : ''}`}
              onClick={recording ? stopRecording : startRecording}
              disabled={extracting}
            >
              {recording
                ? <span className="stop_square" />
                : <BsMic className="mic_icon" />
              }
            </button>
            <span className="timer">{formatTime(elapsed)}</span>
            {recording && <div className="pulse_ring" />}
          </div>

          {/* Audio file upload */}
          <input type="file" accept="audio/*" ref={audioFileRef} style={{ display: 'none' }} onChange={handleAudioUpload} />
          <button className="upload_sound_btn" onClick={() => audioFileRef.current.click()} disabled={extracting}>
            <BsUpload />
            <span>Upload audio (max {MAX_AUDIO_MB}MB)</span>
          </button>

          {/* Video file upload — extracts audio track */}
          <input type="file" accept="video/*" ref={videoFileRef} style={{ display: 'none' }} onChange={handleVideoUpload} />
          <button
            className={`upload_sound_btn video_btn ${extracting ? 'extracting' : ''}`}
            onClick={() => videoFileRef.current.click()}
            disabled={extracting}
          >
            <BsCameraVideo />
            <span>{extracting ? 'Extracting audio…' : 'Extract audio from video'}</span>
            {extracting && <span className="spinner" />}
          </button>
        </>
      )}

      {/* Error box — local errors only (size, format, mic denied, extraction failed) */}
      {localError && (
        <div className="audio_error_box">
          <span className="error_dot">●</span>
          <span>{localError}</span>
        </div>
      )}

     <button
      className={`send_btn ${
        audioURL && !extracting && (receipentUser.length === 0 || checkReceipentUser)
          ? 'ready'
          : ''
      }`}
      disabled={
        !audioURL ||
        extracting ||
        !(receipentUser.length === 0 || checkReceipentUser)
      }
      onClick={handleSend}
    >
      {extracting ? 'Processing…' : 'Preview'}
    </button>
    </AudioWrapper>
  )
}

const AudioWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  padding: 0.5rem 0;

  .record_area {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }

  .record_btn {
    width: 110px; height: 110px;
    border-radius: 50%;
    border: none;
    background: #EF5A42;
    color: #fff;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    position: relative; z-index: 1;
    transition: transform 0.15s;
    &:hover:not(:disabled) { transform: scale(1.04); }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
    .mic_icon { font-size: 2em; }
    .stop_square { width: 28px; height: 28px; background: #fff; border-radius: 4px; }
  }

  .pulse_ring {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 110px; height: 110px;
    border-radius: 50%;
    border: 3px solid rgba(239,90,66,0.5);
    animation: pulse 1.4s ease-out infinite;
    pointer-events: none; z-index: 0;
  }

  @keyframes pulse {
    0%   { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    100% { transform: translate(-50%, -50%) scale(1.7); opacity: 0; }
  }

  .timer {
    font-size: 1.15em; font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: var(--text-color, #111);
  }

  .upload_sound_btn {
    display: flex; align-items: center; justify-content: center; gap: 0.5rem;
    width: 100%; height: 50px;
    border: 1.5px dashed #D1D5DB;
    border-radius: 12px; background: transparent;
    font-size: 0.95em;
    color: var(--light-text-color, #6B7280);
    cursor: pointer;
    transition: border-color 0.2s, color 0.2s, opacity 0.2s;
    &:hover:not(:disabled) { border-color: var(--primary-color, #EF5A42); color: var(--primary-color, #EF5A42); }
    &:disabled { opacity: 0.5; cursor: not-allowed; }

    &.video_btn {
      border-style: dashed;
      border-color: #C4B5FD;
      color: #7C3AED;
      &:hover:not(:disabled) { border-color: #7C3AED; color: #7C3AED; background: rgba(124,58,237,0.04); }
    }

    &.extracting {
      border-style: solid;
      border-color: #7C3AED;
      color: #7C3AED;
      background: rgba(124,58,237,0.04);
    }

    .spinner {
      width: 14px; height: 14px;
      border-radius: 50%;
      border: 2px solid #C4B5FD;
      border-top-color: #7C3AED;
      animation: spin 0.7s linear infinite;
      flex-shrink: 0;
    }
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .audio_result {
    width: 100%;
    display: flex; flex-direction: column; gap: 0.75rem;
  }

  .audio_file_row {
    display: flex; align-items: center; gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: #F9FAFB;
    border: 1.5px solid #ECEFF3;
    border-radius: 10px;
    .audio_icon { font-size: 1.1em; color: var(--primary-color, #EF5A42); flex-shrink: 0; }
    .audio_name { flex: 1; font-size: 0.9em; color: var(--text-color, #111); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .audio_remove {
      border: none; background: transparent; cursor: pointer;
      color: #9CA3AF; font-size: 1.1em; display: flex; align-items: center;
      &:hover { color: #EF5A42; }
    }
  }

  .audio_player { width: 100%; height: 40px; border-radius: 8px; outline: none; }

  /* Error box — same intent as PreviewPanel's .post_error but with an icon */
  .audio_error_box {
    width: 100%;
    display: flex;
    align-items: flex-start;
    gap: 0.4rem;
    padding: 0.65rem 0.9rem;
    background: rgba(239,90,66,0.06);
    border: 1.5px solid rgba(239,90,66,0.25);
    border-radius: 10px;
    font-size: 0.85em;
    color: #EF5A42;
    line-height: 1.45;
    .error_dot { font-size: 0.5em; margin-top: 0.35em; flex-shrink: 0; }
  }

  .send_btn {
    width: 100%; height: 50px;
    border: none; border-radius: 25px;
    background: var(--primary-color, #EF5A42);
    color: #fff; font-size: 1em; font-weight: 600;
    cursor: not-allowed; opacity: 0.4;
    transition: opacity 0.2s;
    &.ready { opacity: 1; cursor: pointer; &:hover { opacity: 0.88; } }
  }
`

export default AudioTab