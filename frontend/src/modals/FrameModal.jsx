import { useState } from 'react'
import { BsX, BsCheck2, BsChevronDown, BsChevronUp } from 'react-icons/bs'
import { ModalBackdrop, ModalBox, AccordionRow } from '../sharedStyles/index'
import { FRAME_SWATCHES } from '../constants/messageConstant'
import styled from 'styled-components'

const FrameModal = ({ onClose, onConfirm, currentFrame }) => {
  const [color,     setColor]     = useState(currentFrame?.color ?? '#111111')
  const [colorOpen, setColorOpen] = useState(true)

  const handleApply = () => {
    onConfirm({
      ...currentFrame,
      color,
      border: `${currentFrame.thickness}px ${currentFrame.style} ${color}`,
    })
  }

  return (
    <ModalBackdrop onClick={onClose}>
      <ModalBox onClick={(e) => e.stopPropagation()}>
        <div className="modal_header">
          <h3>Frame Colour</h3>
          <button className="modal_close" onClick={onClose}><BsX /></button>
        </div>

        <FramePreview style={{ border: `${currentFrame.thickness}px ${currentFrame.style} ${color}`, borderRadius: currentFrame.borderRadius }} />

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

        <button className="modal_continue" onClick={handleApply}>
          Apply
        </button>
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
    transition: transform 0.15s;
    &.active { outline: 2.5px solid var(--primary-color, #EF5A42); outline-offset: 2px; }
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
