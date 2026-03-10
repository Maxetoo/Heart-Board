// import React, { useState } from 'react'
// import styled from 'styled-components'
// import { BsX, BsCheck2, BsChevronDown, BsChevronUp } from 'react-icons/bs'
// import { ModalBackdrop, ModalBox, AccordionRow, ColorSection, OpacityRow } from '../sharedStyles/index'
// import { FONTS, SWATCHES } from '../constants/messageConstant'

// const TextModal = ({ onClose, onConfirm, currentText }) => {
//   const [content, setContent]             = useState(currentText?.content || '')
//   const [selectedFont, setSelectedFont]   = useState(currentText?.font || FONTS[1])
//   const [selectedColor, setSelectedColor] = useState(currentText?.color || '#111111')
//   const [fontSize, setFontSize]           = useState(currentText?.fontSize ?? 16)
//   const [fontOpen, setFontOpen]           = useState(true)
//   const [colorOpen, setColorOpen]         = useState(false)

//   return (
//     <ModalBackdrop onClick={onClose}>
//       <ModalBox onClick={(e) => e.stopPropagation()}>
//         <div className="modal_header">
//           <h3>Text</h3>
//           <button className="modal_close" onClick={onClose}><BsX /></button>
//         </div>

//         <TextInputArea
//           style={{ fontFamily: selectedFont.family, color: selectedColor, fontSize, ...selectedFont.style }}
//           placeholder="Type here......"
//           value={content}
//           onChange={(e) => setContent(e.target.value)}
//         />

//         <OpacityRow>
//           <span className="label">Size</span>
//           <div className="slider_wrap">
//             <input
//               type="range"
//               min="10" max="48" step="1"
//               value={fontSize}
//               onChange={(e) => setFontSize(Number(e.target.value))}
//             />
//           </div>
//           <span className="val">{fontSize}px</span>
//         </OpacityRow>

//         <AccordionRow onClick={() => setFontOpen(o => !o)}>
//           <span>Select Font</span>
//           {fontOpen ? <BsChevronUp /> : <BsChevronDown />}
//         </AccordionRow>

//         {fontOpen && (
//           <FontDropdown>
//             <div className="font_style_label">Font Style</div>
//             {FONTS.map((f) => (
//               <div
//                 key={f.label}
//                 className={`font_item ${selectedFont.label === f.label ? 'active' : ''}`}
//                 style={{ fontFamily: f.family, ...f.style }}
//                 onClick={() => setSelectedFont(f)}
//               >
//                 <span>{f.label}</span>
//                 {selectedFont.label === f.label && <BsCheck2 className="font_check" />}
//               </div>
//             ))}
//           </FontDropdown>
//         )}

//         <AccordionRow onClick={() => setColorOpen(o => !o)}>
//           <span>Choose Colour</span>
//           {colorOpen ? <BsChevronUp /> : <BsChevronDown />}
//         </AccordionRow>

//         {colorOpen && (
//           <ColorSection>
//             <div className="swatches">
//               {SWATCHES.map((c) => (
//                 <div
//                   key={c}
//                   className={`swatch ${selectedColor === c ? 'active' : ''}`}
//                   style={{ background: c, border: c === '#FFFFFF' ? '1.5px solid #E5E7EB' : 'none' }}
//                   onClick={() => setSelectedColor(c)}
//                 >
//                   {selectedColor === c && (
//                     <BsCheck2 style={{ color: c === '#FFFFFF' || c === '#F59E0B' ? '#333' : '#fff', fontSize: '0.75em' }} />
//                   )}
//                 </div>
//               ))}
//             </div>
//             <div className="custom_color_row">
//               <label>Custom colour</label>
//               <input type="color" value={selectedColor} onChange={(e) => setSelectedColor(e.target.value)} />
//             </div>
//           </ColorSection>
//         )}

//         <button
//           className="modal_continue"
//           disabled={!content.trim()}
//           onClick={() => onConfirm({ content, font: selectedFont, color: selectedColor, fontSize })}
//         >
//           Continue
//         </button>
//       </ModalBox>
//     </ModalBackdrop>
//   )
// }

// const TextInputArea = styled.textarea`
//   width: 100%;
//   min-height: 120px;
//   padding: 1rem;
//   border-radius: 12px;
//   background: #F3F4F6;
//   border: none;
//   outline: none;
//   resize: none;
//   font-size: 1em;
//   line-height: 1.5;
//   box-sizing: border-box;
//   transition: background 0.2s;
//   &:focus { background: #ECEFF3; }
//   &::placeholder { color: #9CA3AF; font-family: inherit; }
// `

// const FontDropdown = styled.div`
//   border-radius: 10px;
//   background: #FAFAFA;
//   border: 1.5px solid #ECEFF3;
//   overflow: hidden;

//   .font_style_label {
//     padding: 0.55rem 1rem;
//     font-size: 0.8em;
//     color: #9CA3AF;
//     border-bottom: 1px solid #F3F4F6;
//   }

//   .font_item {
//     display: flex;
//     align-items: center;
//     justify-content: space-between;
//     padding: 0.65rem 1rem;
//     font-size: 1em;
//     color: var(--text-color, #111);
//     cursor: pointer;
//     transition: background 0.15s;
//     border-bottom: 1px solid #F3F4F6;
//     &:last-child { border-bottom: none; }
//     &:hover { background: #F3F4F6; }
//     &.active { background: rgba(239,90,66,0.04); }
//     .font_check { color: var(--primary-color, #EF5A42); font-size: 0.9em; }
//   }
// `

// export default TextModal

// import React, { useState } from 'react'
// import styled from 'styled-components'
// import { BsX, BsCheck2, BsChevronDown, BsChevronUp } from 'react-icons/bs'
// import { ModalBackdrop, ModalBox, AccordionRow, ColorSection, OpacityRow } from '../sharedStyles/index'
// import { FONTS, SWATCHES } from '../constants/messageConstant'

// const TextModal = ({ onClose, onConfirm, currentText }) => {
//   const [content, setContent]             = useState(currentText?.content || '')
//   const [selectedFont, setSelectedFont]   = useState(currentText?.font || FONTS[1])
//   const [selectedColor, setSelectedColor] = useState(currentText?.color || '#111111')
//   const [fontSize, setFontSize]           = useState(currentText?.fontSize ?? 16)
//   const [fontOpen, setFontOpen]           = useState(true)
//   const [colorOpen, setColorOpen]         = useState(false)

//   return (
//     <ModalBackdrop onClick={onClose}>
//       <ModalBox onClick={(e) => e.stopPropagation()}>
//         <div className="modal_header">
//           <h3>Text</h3>
//           <button className="modal_close" onClick={onClose}><BsX /></button>
//         </div>

//         <TextInputArea
//           style={{ fontFamily: selectedFont.family, color: selectedColor, fontSize, ...selectedFont.style }}
//           placeholder="Type here......"
//           value={content}
//           onChange={(e) => setContent(e.target.value)}
//         />

//         <OpacityRow>
//           <span className="label">Size</span>
//           <div className="slider_wrap">
//             <input
//               type="range"
//               min="10" max="48" step="1"
//               value={fontSize}
//               onChange={(e) => setFontSize(Number(e.target.value))}
//             />
//           </div>
//           <span className="val">{fontSize}px</span>
//         </OpacityRow>

//         <AccordionRow onClick={() => setFontOpen(o => !o)}>
//           <span>Select Font</span>
//           {fontOpen ? <BsChevronUp /> : <BsChevronDown />}
//         </AccordionRow>

//         {fontOpen && (
//           <FontDropdown>
//             <div className="font_style_label">Font Style</div>
//             <div className="font_scroll_list">
//               {FONTS.map((f) => (
//                 <div
//                   key={f.label}
//                   className={`font_item ${selectedFont.label === f.label ? 'active' : ''}`}
//                   style={{ fontFamily: f.family, ...f.style }}
//                   onClick={() => setSelectedFont(f)}
//                 >
//                   <span>{f.label}</span>
//                   {selectedFont.label === f.label && <BsCheck2 className="font_check" />}
//                 </div>
//               ))}
//             </div>
//           </FontDropdown>
//         )}

//         <AccordionRow onClick={() => setColorOpen(o => !o)}>
//           <span>Choose Colour</span>
//           {colorOpen ? <BsChevronUp /> : <BsChevronDown />}
//         </AccordionRow>

//         {colorOpen && (
//           <ColorSection>
//             <div className="swatches">
//               {SWATCHES.map((c) => (
//                 <div
//                   key={c}
//                   className={`swatch ${selectedColor === c ? 'active' : ''}`}
//                   style={{ background: c, border: c === '#FFFFFF' ? '1.5px solid #E5E7EB' : 'none' }}
//                   onClick={() => setSelectedColor(c)}
//                 >
//                   {selectedColor === c && (
//                     <BsCheck2 style={{ color: c === '#FFFFFF' || c === '#F59E0B' ? '#333' : '#fff', fontSize: '0.75em' }} />
//                   )}
//                 </div>
//               ))}
//             </div>
//             <div className="custom_color_row">
//               <label>Custom colour</label>
//               <input type="color" value={selectedColor} onChange={(e) => setSelectedColor(e.target.value)} />
//             </div>
//           </ColorSection>
//         )}

//         <button
//           className="modal_continue"
//           disabled={!content.trim()}
//           onClick={() => onConfirm({ content, font: selectedFont, color: selectedColor, fontSize })}
//         >
//           Continue
//         </button>
//       </ModalBox>
//     </ModalBackdrop>
//   )
// }

// const TextInputArea = styled.textarea`
//   width: 100%;
//   min-height: 120px;
//   padding: 1rem;
//   border-radius: 12px;
//   background: #F3F4F6;
//   border: none;
//   outline: none;
//   resize: none;
//   font-size: 1em;
//   line-height: 1.5;
//   box-sizing: border-box;
//   transition: background 0.2s;
//   &:focus { background: #ECEFF3; }
//   &::placeholder { color: #9CA3AF; font-family: inherit; }
// `

// const FontDropdown = styled.div`
//   border-radius: 10px;
//   background: #FAFAFA;
//   border: 1.5px solid #ECEFF3;
//   overflow: hidden;
//   max-height: 220px;
//   display: flex;
//   flex-direction: column;

//   .font_style_label {
//     padding: 0.55rem 1rem;
//     font-size: 0.8em;
//     color: #9CA3AF;
//     border-bottom: 1px solid #F3F4F6;
//     flex-shrink: 0;
//   }

//   .font_scroll_list {
//     overflow-y: auto;
//     flex: 1;
//     &::-webkit-scrollbar { width: 4px; }
//     &::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 4px; }
//   }

//   .font_item {
//     display: flex;
//     align-items: center;
//     justify-content: space-between;
//     padding: 0.65rem 1rem;
//     font-size: 1em;
//     color: var(--text-color, #111);
//     cursor: pointer;
//     transition: background 0.15s;
//     border-bottom: 1px solid #F3F4F6;
//     &:last-child { border-bottom: none; }
//     &:hover { background: #F3F4F6; }
//     &.active { background: rgba(239,90,66,0.04); }
//     .font_check { color: var(--primary-color, #EF5A42); font-size: 0.9em; }
//   }
// `

// export default TextModal

import React, { useState } from 'react'
import styled from 'styled-components'
import { BsX, BsCheck2, BsChevronDown, BsChevronUp } from 'react-icons/bs'
import { ModalBackdrop, ModalBox, AccordionRow, ColorSection, OpacityRow } from '../sharedStyles/index'
import { FONTS, SWATCHES } from '../constants/messageConstant'

const TextModal = ({ onClose, onConfirm, currentText }) => {
  const [content, setContent]             = useState(currentText?.content || '')
  const [selectedFont, setSelectedFont]   = useState(currentText?.font || FONTS[1])
  const [selectedColor, setSelectedColor] = useState(currentText?.color || '#111111')
  const [fontSize, setFontSize]           = useState(currentText?.fontSize ?? 16)
  const [fontOpen, setFontOpen]           = useState(true)
  const [colorOpen, setColorOpen]         = useState(false)

  return (
    <ModalBackdrop onClick={onClose}>
      <ModalBox onClick={(e) => e.stopPropagation()}>
        <div className="modal_header">
          <h3>Text</h3>
          <button className="modal_close" onClick={onClose}><BsX /></button>
        </div>

        <TextInputArea
          style={{ fontFamily: selectedFont.family, color: selectedColor, fontSize, ...selectedFont.style }}
          placeholder="Type here......"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        <OpacityRow>
          <span className="label">Size</span>
          <div className="slider_wrap">
            <input
              type="range"
              min="10" max="48" step="1"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
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
              {FONTS.map((f) => (
                <div
                  key={f.label}
                  className={`font_item ${selectedFont.label === f.label ? 'active' : ''}`}
                  style={{ fontFamily: f.family, ...f.style }}
                  onClick={() => setSelectedFont(f)}
                >
                  <span>{f.label}</span>
                  {selectedFont.label === f.label && <BsCheck2 className="font_check" />}
                </div>
              ))}
            </div>
          </FontDropdown>
        )}

        <AccordionRow onClick={() => setColorOpen(o => !o)}>
          <span>Choose Colour</span>
          {colorOpen ? <BsChevronUp /> : <BsChevronDown />}
        </AccordionRow>

        {colorOpen && (
          <ColorSection>
            <div className="swatches">
              {SWATCHES.map((c) => (
                <div
                  key={c}
                  className={`swatch ${selectedColor === c ? 'active' : ''}`}
                  style={{ background: c, border: c === '#FFFFFF' ? '1.5px solid #E5E7EB' : 'none' }}
                  onClick={() => setSelectedColor(c)}
                >
                  {selectedColor === c && (
                    <BsCheck2 style={{ color: c === '#FFFFFF' || c === '#F59E0B' ? '#333' : '#fff', fontSize: '0.75em' }} />
                  )}
                </div>
              ))}
            </div>
            <div className="custom_color_row">
              <label>Custom colour</label>
              <input type="color" value={selectedColor} onChange={(e) => setSelectedColor(e.target.value)} />
            </div>
          </ColorSection>
        )}

        <button
          className="modal_continue"
          disabled={!content.trim()}
          onClick={() => onConfirm({ content, font: selectedFont, color: selectedColor, fontSize })}
        >
          Continue
        </button>
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
  transition: background 0.2s;
  &:focus { background: #ECEFF3; }
  &::placeholder { color: #9CA3AF; font-family: inherit; }
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
    transition: background 0.15s;
    border-bottom: 1px solid #F3F4F6;
    &:last-child { border-bottom: none; }
    &:hover { background: #F3F4F6; }
    &.active { background: rgba(239,90,66,0.04); }
    .font_check { color: var(--primary-color, #EF5A42); font-size: 0.9em; }
  }
`

export default TextModal