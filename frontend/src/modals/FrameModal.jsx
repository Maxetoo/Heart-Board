import React, { useState } from 'react'
import styled from 'styled-components'
import { BsX, BsCheck2, BsChevronDown, BsChevronUp } from 'react-icons/bs'
import { ModalBackdrop, ModalBox, AccordionRow, OpacityRow, RemoveBtn } from '../sharedStyles/index'
import { FRAME_STYLES, FRAME_SWATCHES } from '../constants/messageConstant'

const FrameModal = ({ onClose, onConfirm, currentFrame }) => {
  const [style,     setStyle]     = useState(currentFrame?.style     ?? 'solid')
  const [thickness, setThickness] = useState(currentFrame?.thickness ?? 4)
  const [radius,    setRadius]    = useState(currentFrame?.radius    ?? 0)
  const [color,     setColor]     = useState(currentFrame?.color     ?? '#111111')
  const [colorOpen, setColorOpen] = useState(false)

  const previewBorder = `${thickness}px ${style} ${color}`
  const previewRadius = `${radius}px`
  const frame = { style, thickness, radius, color, border: previewBorder, borderRadius: previewRadius }

  return (
    <ModalBackdrop onClick={onClose}>
      <ModalBox onClick={(e) => e.stopPropagation()}>
        <div className="modal_header">
          <h3>Frame</h3>
          <button className="modal_close" onClick={onClose}><BsX /></button>
        </div>

        {/* Live Preview */}
        <FramePreview style={{ border: previewBorder, borderRadius: previewRadius }} />

        {/* Style pills */}
        <FrameSection>
          <span className="section_label">Style</span>
          <div className="style_pills">
            {FRAME_STYLES.map(s => (
              <button
                key={s.id}
                className={`style_pill ${style === s.id ? 'active' : ''}`}
                onClick={() => setStyle(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </FrameSection>

        {/* Thickness */}
        <OpacityRow>
          <span className="label">Thickness</span>
          <div className="slider_wrap">
            <input
              type="range" min="1" max="20" step="1"
              value={thickness}
              onChange={(e) => setThickness(Number(e.target.value))}
            />
          </div>
          <span className="val">{thickness}px</span>
        </OpacityRow>

        {/* Radius */}
        <OpacityRow>
          <span className="label">Radius</span>
          <div className="slider_wrap">
            <input
              type="range" min="0" max="48" step="2"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
            />
          </div>
          <span className="val">{radius}px</span>
        </OpacityRow>

        {/* Colour */}
        <AccordionRow onClick={() => setColorOpen(o => !o)}>
          <span>Colour</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{
              width: 16, height: 16, borderRadius: '50%',
              background: color,
              border: color === '#FFFFFF' ? '1.5px solid #E5E7EB' : 'none',
              display: 'inline-block', flexShrink: 0,
            }} />
            {colorOpen ? <BsChevronUp /> : <BsChevronDown />}
          </div>
        </AccordionRow>

        {colorOpen && (
          <SwatchesSection>
            <div className="swatches">
              {FRAME_SWATCHES.map(c => (
                <div
                  key={c}
                  className={`swatch ${color === c ? 'active' : ''}`}
                  style={{ background: c, border: c === '#FFFFFF' ? '1.5px solid #E5E7EB' : 'none' }}
                  onClick={() => setColor(c)}
                >
                  {color === c && (
                    <BsCheck2 style={{ color: c === '#FFFFFF' || c === '#F59E0B' ? '#333' : '#fff', fontSize: '0.75em' }} />
                  )}
                </div>
              ))}
            </div>
            <div className="custom_color_row">
              <label>Custom colour</label>
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
            </div>
          </SwatchesSection>
        )}

        <button className="modal_continue" onClick={() => onConfirm(frame)}>
          Apply Frame
        </button>

        {currentFrame && (
          <RemoveBtn onClick={() => onConfirm(null)}>Remove Frame</RemoveBtn>
        )}
      </ModalBox>
    </ModalBackdrop>
  )
}

const FramePreview = styled.div`
  width: 100%;
  aspect-ratio: 4/3;
  background: #F3F4F6;
  transition: border 0.15s, border-radius 0.15s;
`

const FrameSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  .section_label {
    font-size: 0.9em;
    font-weight: 500;
    color: var(--text-color, #111);
  }

  .style_pills {
    display: flex;
    gap: 6px;
  }

  .style_pill {
    flex: 1;
    height: 36px;
    border-radius: 99px;
    border: 1.5px solid #ECEFF3;
    background: #F9FAFB;
    font-size: 0.82em;
    font-weight: 500;
    color: var(--light-text-color, #6B7280);
    cursor: pointer;
    transition: border-color 0.2s, color 0.2s, background 0.2s;
    &.active {
      border-color: var(--primary-color, #EF5A42);
      color: var(--primary-color, #EF5A42);
      background: rgba(239,90,66,0.06);
    }
    &:hover:not(.active) { border-color: #D1D5DB; }
  }
`

const SwatchesSection = styled.div`
  padding: 0.75rem;
  background: #FAFAFA;
  border-radius: 10px;
  border: 1.5px solid #ECEFF3;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  .swatches {
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
    padding: 6px 4px;
  }

  .swatch {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: transform 0.15s, box-shadow 0.15s;
    &.active { box-shadow: 0 0 0 2.5px #fff, 0 0 0 4.5px var(--primary-color, #EF5A42); }
    &:hover:not(.active) { transform: scale(1.12); }
  }

  .custom_color_row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 0.25rem;
    label { font-size: 0.9em; color: var(--light-text-color, #6B7280); }
    input[type="color"] {
      width: 36px; height: 36px;
      border-radius: 8px;
      border: 1.5px solid #ECEFF3;
      background: none;
      cursor: pointer;
      padding: 2px;
    }
  }
`

export default FrameModal