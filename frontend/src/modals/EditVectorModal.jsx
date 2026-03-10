import React, { useState } from 'react'
import styled from 'styled-components'
import { BsX, BsCheck2, BsChevronDown, BsChevronUp } from 'react-icons/bs'
import { ModalBackdrop, ModalBox, AccordionRow, ColorSection, OpacityRow, RemoveBtn } from '../sharedStyles/index'

const VECTOR_SWATCHES = [
  '#2d3748', '#EF5A42', '#3B82F6', '#10B981',
  '#F59E0B', '#8B5CF6', '#EC4899', '#FFFFFF',
]

const EditVectorModal = ({ onClose, vector, onUpdate, onRemove }) => {
  const [opacity, setOpacity]     = useState(vector.opacity ?? 1)
  const [color, setColor]         = useState(vector.color ?? '#2d3748')
  const [size, setSize]           = useState(vector.size ?? 48)
  const [colorOpen, setColorOpen] = useState(false)
  const Icon = vector.icon

  return (
    <ModalBackdrop onClick={onClose}>
      <ModalBox onClick={(e) => e.stopPropagation()}>
        <div className="modal_header">
          <h3>Edit Vector</h3>
          <button className="modal_close" onClick={onClose}><BsX /></button>
        </div>

        <VectorPreviewBox>
          <Icon style={{ color, opacity, fontSize: size }} />
        </VectorPreviewBox>

        <OpacityRow>
          <span className="label">Size</span>
          <div className="slider_wrap">
            <input
              type="range" min="20" max="120" step="4"
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
            />
          </div>
          <span className="val">{size}px</span>
        </OpacityRow>

        <OpacityRow>
          <span className="label">Opacity</span>
          <div className="slider_wrap">
            <input
              type="range" min="0.1" max="1" step="0.05"
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
            />
          </div>
          <span className="val">{Math.round(opacity * 100)}%</span>
        </OpacityRow>

        <AccordionRow onClick={() => setColorOpen(o => !o)}>
          <span>Choose Colour</span>
          {colorOpen ? <BsChevronUp /> : <BsChevronDown />}
        </AccordionRow>

        {colorOpen && (
          <ColorSection>
            <div className="swatches">
              {VECTOR_SWATCHES.map((c) => (
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
          </ColorSection>
        )}

        <button
          className="modal_continue"
          onClick={() => { onUpdate({ color, opacity, size }); onClose() }}
        >
          Save Changes
        </button>

        <RemoveBtn onClick={onRemove}>Remove Vector</RemoveBtn>
      </ModalBox>
    </ModalBackdrop>
  )
}

const VectorPreviewBox = styled.div`
  width: 100%;
  aspect-ratio: 16/9;
  border-radius: 12px;
  background: #F3F4F6;
  display: flex;
  align-items: center;
  justify-content: center;
`

export default EditVectorModal