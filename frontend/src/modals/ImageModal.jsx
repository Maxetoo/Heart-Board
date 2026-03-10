import React, { useState, useRef } from 'react'
import styled from 'styled-components'
import { BsX, BsImage, BsUpload } from 'react-icons/bs'
import { ModalBackdrop, ModalBox } from '../sharedStyles/index'

const ImageModal = ({ onClose, onConfirm, currentImage }) => {
  const [previewSrc, setPreviewSrc] = useState(currentImage || null)
  const [rawFile, setRawFile]       = useState(null)
  const fileRef = useRef()

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setRawFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setPreviewSrc(ev.target.result)
    reader.readAsDataURL(file)
  }

  return (
    <ModalBackdrop onClick={onClose}>
      <ModalBox onClick={(e) => e.stopPropagation()}>
        <div className="modal_header">
          <h3>Image</h3>
          <button className="modal_close" onClick={onClose}><BsX /></button>
        </div>

        <ImagePreviewBox onClick={() => fileRef.current.click()}>
          {previewSrc
            ? <img src={previewSrc} alt="preview" />
            : <div className="placeholder">
                <BsImage className="ph_icon" />
                <span>Preview image here</span>
              </div>
          }
        </ImagePreviewBox>

        <input
          type="file"
          accept="image/*"
          ref={fileRef}
          style={{ display: 'none' }}
          onChange={handleFile}
        />

        <UploadRowBtn onClick={() => fileRef.current.click()}>
          <BsUpload />
          <span>Upload Image</span>
        </UploadRowBtn>

        <button
          className="modal_continue"
          disabled={!previewSrc}
          onClick={() => onConfirm(previewSrc, rawFile)}
        >
          Continue
        </button>
      </ModalBox>
    </ModalBackdrop>
  )
}

const ImagePreviewBox = styled.div`
  width: 100%;
  aspect-ratio: 1;
  border-radius: 12px;
  background: #F3F4F6;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  img { width: 100%; height: 100%; object-fit: cover; }
  .placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    color: #9CA3AF;
    .ph_icon { font-size: 1.6em; }
    span { font-size: 0.9em; }
  }
`

const UploadRowBtn = styled.button`
  width: 100%;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: 1.5px solid #ECEFF3;
  border-radius: 12px;
  background: #FAFAFA;
  font-size: 0.95em;
  color: var(--text-color, #111);
  cursor: pointer;
  transition: border-color 0.2s;
  &:hover { border-color: var(--primary-color, #EF5A42); }
`

export default ImageModal