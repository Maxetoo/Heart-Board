import { useState } from 'react'
import styled from 'styled-components'
import { RxCross2 } from 'react-icons/rx'
import { BsCheckLg, BsChevronDown, BsChevronUp, BsTextLeft, BsTextCenter, BsTextRight } from 'react-icons/bs'
import { ModalBackdrop, ModalBox, AccordionRow, ColorSection, OpacityRow, RemoveBtn } from '../sharedStyles/index'
import { FONTS, SWATCHES } from '../constants/messageConstant'

const ALIGNMENTS = [
  { id: 'left',   icon: BsTextLeft },
  { id: 'center', icon: BsTextCenter },
  { id: 'right',  icon: BsTextRight },
]

const TextModal = ({ onClose, onConfirm, currentText, onRemove }) => {
  const [content, setContent]           = useState(currentText?.content || '')
  const [selectedFont, setSelectedFont] = useState(currentText?.font || FONTS[1])
  const [selectedColor, setSelectedColor] = useState(currentText?.color || '#111111')
  const [fontSize, setFontSize]         = useState(currentText?.fontSize ?? 16)
  const [textAlign, setTextAlign]       = useState(currentText?.textAlign || 'left')
  const [fontOpen, setFontOpen]         = useState(true)
  const [colorOpen, setColorOpen]       = useState(false)

  return (
    <ModalBackdrop onClick={onClose}>
      <ModalBox onClick={e => e.stopPropagation()}>
        <div className="modal_header">
          <h3>Text</h3>
          <button className="modal_close" onClick={onClose}><RxCross2 /></button>
        </div>

        <TextInputArea
          style={{ fontFamily: selectedFont.family, color: selectedColor, fontSize, textAlign, ...selectedFont.style }}
          placeholder="Type here......"
          value={content}
          onChange={e => setContent(e.target.value)}
        />

        <OpacityRow>
          <span className="label">Size</span>
          <div className="slider_wrap">
            <input
              type="range"
              min="10" max="48" step="1"
              value={fontSize}
              onChange={e => setFontSize(Number(e.target.value))}
            />
          </div>
          <span className="val">{fontSize}px</span>
        </OpacityRow>

        <AccordionRow onClick={() => setFontOpen(o => !o)}>
          <span>Select Font</span>
          {fontOpen ? <BsChevronUp /> : <BsChevronDown />}
        </AccordionRow>

        {fontOpen && (
          <FontDropdown>
            <div className="font_style_label">Font Style</div>
            <div className="font_scroll_list">
              {FONTS.map(f => {
                const isActive = selectedFont.label === f.label
                return (
                  <div
                    key={f.label}
                    className={`font_item ${isActive ? 'active' : ''}`}
                    style={{ fontFamily: f.family, ...f.style }}
                    onClick={() => setSelectedFont(f)}
                  >
                    <span>{f.label}</span>
                    <CheckCircle $active={isActive}>
                      {isActive && <BsCheckLg />}
                    </CheckCircle>
                  </div>
                )
              })}
            </div>
          </FontDropdown>
        )}

        <AlignRow>
          <span className="align_label">Alignment</span>
          <div className="align_btns">
            {ALIGNMENTS.map(a => {
              const Icon = a.icon
              const isActive = textAlign === a.id
              return (
                <button
                  key={a.id}
                  className={`align_btn ${isActive ? 'active' : ''}`}
                  onClick={() => setTextAlign(a.id)}
                >
                  <Icon />
                </button>
              )
            })}
          </div>
        </AlignRow>

        <AccordionRow onClick={() => setColorOpen(o => !o)}>
          <span>Choose Colour</span>
          {colorOpen ? <BsChevronUp /> : <BsChevronDown />}
        </AccordionRow>

        {colorOpen && (
          <ColorSection>
            <div className="swatches">
              {SWATCHES.map(c => (
                <div
                  key={c}
                  className={`swatch ${selectedColor === c ? 'active' : ''}`}
                  style={{ background: c, border: c === '#FFFFFF' ? '1.5px solid #E5E7EB' : 'none' }}
                  onClick={() => setSelectedColor(c)}
                >
                  {selectedColor === c && (
                    <BsCheckLg style={{ color: c === '#FFFFFF' || c === '#F59E0B' ? '#333' : '#fff', fontSize: '0.65em' }} />
                  )}
                </div>
              ))}
            </div>
            <div className="custom_color_row">
              <label>Custom colour</label>
              <input type="color" value={selectedColor} onChange={e => setSelectedColor(e.target.value)} />
            </div>
          </ColorSection>
        )}

        <button
          className="modal_continue"
          disabled={!content.trim()}
          onClick={() => onConfirm({ content, font: selectedFont, color: selectedColor, fontSize, textAlign })}
        >
          Continue
        </button>

        {onRemove && <RemoveBtn onClick={onRemove}>Remove Text</RemoveBtn>}
      </ModalBox>
    </ModalBackdrop>
  )
}

const TextInputArea = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: 1rem;
  border-radius: 12px;
  background: #F3F4F6;
  border: none;
  outline: none;
  resize: none;
  font-size: 1em;
  line-height: 1.5;
  box-sizing: border-box;
  &::placeholder { color: #9CA3AF; font-family: inherit; }
`

const AlignRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 1rem;
  border-radius: 10px;
  background: #F9FAFB;
  border: 1.5px solid #ECEFF3;

  .align_label {
    font-size: 0.95em;
    font-weight: 500;
    color: var(--text-color, #111);
  }

  .align_btns {
    display: flex;
    gap: 2px;
  }

  .align_btn {
    width: 28px;
    border: none;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.05em;
    cursor: pointer;
    color: #9CA3AF;
    padding: 0;

    &.active {
      color: #111;
      font-weight: 600;
    }
  }
`

const FontDropdown = styled.div`
  border-radius: 10px;
  background: #FAFAFA;
  border: 1.5px solid #ECEFF3;
  overflow: hidden;
  max-height: 220px;
  display: flex;
  flex-direction: column;

  .font_style_label {
    padding: 0.55rem 1rem;
    font-size: 0.8em;
    color: #9CA3AF;
    border-bottom: 1px solid #F3F4F6;
    flex-shrink: 0;
  }

  .font_scroll_list {
    overflow-y: auto;
    flex: 1;
    &::-webkit-scrollbar { width: 4px; }
    &::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 4px; }
  }

  .font_item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.65rem 1rem;
    font-size: 1em;
    color: var(--text-color, #111);
    cursor: pointer;
    border-bottom: 1px solid #F3F4F6;
    &:last-child { border-bottom: none; }
  }
`

const CheckCircle = styled.div`
  width: 15px;
  height: 15px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 2px solid ${p => p.$active ? '#22c55e' : '#d1d5db'};
  background: ${p => p.$active ? '#22c55e' : 'transparent'};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.2s, background 0.2s;
  svg { font-size: 0.45em; color: #fff; }
`

export default TextModal
