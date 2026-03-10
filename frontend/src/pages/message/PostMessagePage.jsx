// import React, { useState, useRef, useEffect } from 'react'
// import styled from 'styled-components'
// import {
//   BsX, BsPencil, BsMic, BsCameraVideo,
//   BsImage, BsTypeBold, BsBezier2, BsPalette2, BsBorderOuter,
//   BsPerson, BsLayoutWtf, BsCheck2, BsChevronRight,
//   BsChevronDown, BsChevronUp, BsCheckLg,
//   BsHeart, BsHandThumbsUp, BsEmojiSmile, BsStar,
//   BsSun, BsFire, BsMusicNote, BsMusicNoteBeamed,
//   BsHeadphones, BsTrophy, BsBalloon, BsGift,
//   BsDiamond, BsAward, BsClock, BsBriefcase,
//   BsCameraFill, BsSearch, BsUpload,
// } from 'react-icons/bs'

// // ─── Google Fonts Injection ──────────────────────────────────────────────────

// const useFonts = () => {
//   useEffect(() => {
//     const link = document.createElement('link')
//     link.rel = 'stylesheet'
//     link.href =
//       'https://fonts.googleapis.com/css2?family=Anton&family=Anaheim&family=Inter:wght@400;600&family=Playfair+Display:ital@0;1&family=Pacifico&display=swap'
//     document.head.appendChild(link)
//     return () => { document.head.removeChild(link) }
//   }, [])
// }

// // ─── Constants ───────────────────────────────────────────────────────────────

// const FONTS = [
//   { label: 'Playfair Display', family: "'Playfair Display', serif",  style: { fontStyle: 'italic' } },
//   { label: 'Inter',            family: "'Inter', sans-serif",         style: {} },
//   { label: 'Anton',            family: "'Anton', sans-serif",         style: { fontWeight: 900 } },
//   { label: 'Anaheim',          family: "'Anaheim', sans-serif",       style: {} },
//   { label: 'Pacifico',         family: "'Pacifico', cursive",         style: {} },
//   { label: 'Impact',           family: 'Impact, sans-serif',          style: { fontWeight: 900 } },
//   { label: 'Brush Script MT',  family: "'Brush Script MT', cursive",  style: {} },
//   { label: 'Georgia',          family: 'Georgia, serif',              style: {} },
// ]

// const VECTOR_ICONS = [
//   { id: 'heart',     label: 'Heart',     icon: BsHeart },
//   { id: 'thumbsup',  label: 'Thumbs Up', icon: BsHandThumbsUp },
//   { id: 'smile',     label: 'Smile',     icon: BsEmojiSmile },
//   { id: 'star',      label: 'Star',      icon: BsStar },
//   { id: 'sun',       label: 'Sun',       icon: BsSun },
//   { id: 'fire',      label: 'Fire',      icon: BsFire },
//   { id: 'music',     label: 'Music',     icon: BsMusicNote },
//   { id: 'music2',    label: 'Music 2',   icon: BsMusicNoteBeamed },
//   { id: 'headphones',label: 'Headphones',icon: BsHeadphones },
//   { id: 'trophy',    label: 'Trophy',    icon: BsTrophy },
//   { id: 'balloon',   label: 'Balloon',   icon: BsBalloon },
//   { id: 'gift',      label: 'Gift',      icon: BsGift },
//   { id: 'diamond',   label: 'Diamond',   icon: BsDiamond },
//   { id: 'award',     label: 'Award',     icon: BsAward },
//   { id: 'clock',     label: 'Clock',     icon: BsClock },
//   { id: 'briefcase', label: 'Briefcase', icon: BsBriefcase },
// ]

// const BG_OPTIONS = [
//   { id: 'bg1',  label: 'Marble',    value: 'linear-gradient(135deg, #f5f5f0 0%, #e8e4df 50%, #f0ede8 100%)' },
//   { id: 'bg2',  label: 'Lines',     value: 'repeating-linear-gradient(0deg, #f9f9f9 0px, #f9f9f9 18px, #e5e5e5 18px, #e5e5e5 20px)' },
//   { id: 'bg3',  label: 'Sky',       value: 'linear-gradient(180deg, #dbeafe 0%, #eff6ff 100%)' },
//   { id: 'bg4',  label: 'Dusk',      value: 'linear-gradient(135deg, #3d2c1e 0%, #6b4226 50%, #3d2c1e 100%)' },
//   { id: 'bg5',  label: 'Sand',      value: 'linear-gradient(135deg, #e8d5b0 0%, #d4b896 50%, #e8d5b0 100%)' },
//   { id: 'bg6',  label: 'Blush',     value: 'linear-gradient(135deg, #fce4ec 0%, #f8bbd0 100%)' },
//   { id: 'bg7',  label: 'Mint',      value: 'linear-gradient(135deg, #e0f2f1 0%, #b2dfdb 100%)' },
//   { id: 'bg8',  label: 'Lavender',  value: 'linear-gradient(135deg, #ede7f6 0%, #d1c4e9 100%)' },
//   { id: 'bg9',  label: 'Peach',     value: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)' },
//   { id: 'bg10', label: 'Forest',    value: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)' },
//   { id: 'bg11', label: 'Ocean',     value: 'linear-gradient(135deg, #e1f5fe 0%, #b3e5fc 100%)' },
//   { id: 'bg12', label: 'Sunset',    value: 'linear-gradient(135deg, #fff9c4 0%, #ffccbc 50%, #f8bbd0 100%)' },
//   { id: 'bg13', label: 'Night',     value: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' },
//   { id: 'bg14', label: 'Rose Gold', value: 'linear-gradient(135deg, #f4c2c2 0%, #e8a598 50%, #d4846a 100%)' },
//   { id: 'bg15', label: 'Arctic',    value: 'linear-gradient(135deg, #f0f4ff 0%, #dce8ff 100%)' },
//   { id: 'bg16', label: 'Cream',     value: 'linear-gradient(135deg, #fffef7 0%, #faf8ee 100%)' },
// ]

// const SWATCHES = ['#111111','#EF5A42','#3B82F6','#10B981','#F59E0B','#8B5CF6','#EC4899','#FFFFFF']

// // ─── Shared Styled Shells ─────────────────────────────────────────────────────

// const ModalBackdrop = styled.div`
//   position: fixed;
//   inset: 0;
//   background: rgba(0,0,0,0.5);
//   z-index: 100;
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   padding: 1rem;
// `

// const ModalBox = styled.div`
//   background: #fff;
//   border-radius: 20px;
//   width: 100%;
//   max-width: 380px;
//   padding: 1.5rem;
//   display: flex;
//   flex-direction: column;
//   gap: 0.85rem;
//   max-height: 88vh;
//   overflow-y: auto;

//   .modal_header {
//     display: flex;
//     align-items: center;
//     justify-content: space-between;
//     margin-bottom: 0.15rem;

//     h3 {
//       font-size: 1.1em;
//       font-weight: 700;
//       color: var(--text-color, #111);
//       margin: 0;
//     }

//     .modal_close {
//       width: 30px;
//       height: 30px;
//       border-radius: 50%;
//       border: 1.5px solid #ECEFF3;
//       background: transparent;
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       font-size: 1.1em;
//       cursor: pointer;
//       color: var(--text-color, #111);
//       transition: border-color 0.2s;
//       &:hover { border-color: var(--primary-color, #EF5A42); color: var(--primary-color, #EF5A42); }
//     }
//   }

//   .modal_continue {
//     width: 100%;
//     height: 50px;
//     border: none;
//     border-radius: 25px;
//     background: var(--primary-color, #EF5A42);
//     color: #fff;
//     font-size: 1em;
//     font-weight: 600;
//     cursor: pointer;
//     transition: opacity 0.2s;
//     flex-shrink: 0;
//     &:hover { opacity: 0.88; }
//     &:disabled { opacity: 0.4; cursor: not-allowed; }
//   }
// `

// const AccordionRow = styled.button`
//   width: 100%;
//   display: flex;
//   align-items: center;
//   justify-content: space-between;
//   padding: 0.85rem 1rem;
//   border-radius: 10px;
//   background: #F9FAFB;
//   border: 1.5px solid #ECEFF3;
//   font-size: 0.95em;
//   font-weight: 500;
//   color: var(--text-color, #111);
//   cursor: pointer;
//   transition: border-color 0.2s;
//   &:hover { border-color: var(--primary-color, #EF5A42); }
//   svg { color: #9CA3AF; font-size: 0.9em; }
// `

// const ColorSection = styled.div`
//   padding: 0.75rem;
//   background: #FAFAFA;
//   border-radius: 10px;
//   border: 1.5px solid #ECEFF3;
//   display: flex;
//   flex-direction: column;
//   gap: 0.75rem;

//   .swatches {
//     display: flex;
//     flex-wrap: wrap;
//     gap: 14px;
//     padding: 6px 4px;
//   }

//   .swatch {
//     width: 26px;
//     height: 26px;
//     border-radius: 50%;
//     cursor: pointer;
//     display: flex;
//     align-items: center;
//     justify-content: center;
//     flex-shrink: 0;
//     transition: transform 0.15s, box-shadow 0.15s;
//     &.active {
//       box-shadow: 0 0 0 2.5px #fff, 0 0 0 4.5px var(--primary-color, #EF5A42);
//     }
//     &:hover:not(.active) { transform: scale(1.12); }
//   }

//   .custom_color_row {
//     display: flex;
//     align-items: center;
//     justify-content: space-between;
//     padding: 0 0.25rem;
//     label { font-size: 0.9em; color: var(--light-text-color, #6B7280); }
//     input[type="color"] {
//       width: 36px;
//       height: 36px;
//       border-radius: 8px;
//       border: 1.5px solid #ECEFF3;
//       background: none;
//       cursor: pointer;
//       padding: 2px;
//     }
//   }
// `

// const SearchInput = styled.div`
//   display: flex;
//   align-items: center;
//   gap: 0.5rem;
//   padding: 0 1rem;
//   height: 44px;
//   background: #F3F4F6;
//   border-radius: 99px;
//   border: 1.5px solid transparent;
//   transition: border-color 0.2s;
//   &:focus-within { border-color: var(--primary-color, #EF5A42); background: #fff; }
//   .search_icon { color: #9CA3AF; font-size: 0.95em; flex-shrink: 0; }
//   input {
//     flex: 1;
//     border: none;
//     background: transparent;
//     outline: none;
//     font-size: 0.95em;
//     color: var(--text-color, #111);
//     &::placeholder { color: #9CA3AF; }
//   }
// `

// // ─── Image Modal ─────────────────────────────────────────────────────────────

// const ImageModal = ({ onClose, onConfirm, currentImage }) => {
//   const [previewSrc, setPreviewSrc] = useState(currentImage || null)
//   const fileRef = useRef()

//   const handleFile = (e) => {
//     const file = e.target.files[0]
//     if (!file) return
//     const reader = new FileReader()
//     reader.onload = (ev) => setPreviewSrc(ev.target.result)
//     reader.readAsDataURL(file)
//   }

//   return (
//     <ModalBackdrop onClick={onClose}>
//       <ModalBox onClick={(e) => e.stopPropagation()}>
//         <div className="modal_header">
//           <h3>Image</h3>
//           <button className="modal_close" onClick={onClose}><BsX /></button>
//         </div>

//         <ImagePreviewBox onClick={() => fileRef.current.click()}>
//           {previewSrc
//             ? <img src={previewSrc} alt="preview" />
//             : <div className="placeholder">
//                 <BsImage className="ph_icon" />
//                 <span>Preview image here</span>
//               </div>
//           }
//         </ImagePreviewBox>

//         <input type="file" accept="image/*" ref={fileRef} style={{ display: 'none' }} onChange={handleFile} />

//         <UploadRowBtn onClick={() => fileRef.current.click()}>
//           <BsUpload />
//           <span>Upload Image</span>
//         </UploadRowBtn>

//         <button className="modal_continue" disabled={!previewSrc} onClick={() => onConfirm(previewSrc)}>
//           Continue
//         </button>
//       </ModalBox>
//     </ModalBackdrop>
//   )
// }

// const ImagePreviewBox = styled.div`
//   width: 100%;
//   aspect-ratio: 1;
//   border-radius: 12px;
//   background: #F3F4F6;
//   overflow: hidden;
//   cursor: pointer;
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   img { width: 100%; height: 100%; object-fit: cover; }
//   .placeholder {
//     display: flex;
//     flex-direction: column;
//     align-items: center;
//     gap: 0.5rem;
//     color: #9CA3AF;
//     .ph_icon { font-size: 1.6em; }
//     span { font-size: 0.9em; }
//   }
// `

// const UploadRowBtn = styled.button`
//   width: 100%;
//   height: 50px;
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   gap: 0.5rem;
//   border: 1.5px solid #ECEFF3;
//   border-radius: 12px;
//   background: #FAFAFA;
//   font-size: 0.95em;
//   color: var(--text-color, #111);
//   cursor: pointer;
//   transition: border-color 0.2s;
//   &:hover { border-color: var(--primary-color, #EF5A42); }
// `

// // ─── Text Modal ──────────────────────────────────────────────────────────────

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
//               min="10"
//               max="48"
//               step="1"
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

// // ─── Vector Modal ─────────────────────────────────────────────────────────────

// const VectorModal = ({ onClose, onConfirm }) => {
//   const [search, setSearch]     = useState('')
//   const [selected, setSelected] = useState(null)

//   const filtered = VECTOR_ICONS.filter(v =>
//     v.label.toLowerCase().includes(search.toLowerCase())
//   )

//   return (
//     <ModalBackdrop onClick={onClose}>
//       <ModalBox onClick={(e) => e.stopPropagation()}>
//         <div className="modal_header">
//           <h3>Vector</h3>
//           <button className="modal_close" onClick={onClose}><BsX /></button>
//         </div>

//         <SearchInput>
//           <BsSearch className="search_icon" />
//           <input placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
//         </SearchInput>

//         <VectorGrid>
//           {filtered.map((v) => {
//             const Icon = v.icon
//             return (
//               <div
//                 key={v.id}
//                 className={`vector_cell ${selected?.id === v.id ? 'active' : ''}`}
//                 onClick={() => setSelected(v)}
//               >
//                 <Icon />
//               </div>
//             )
//           })}
//         </VectorGrid>

//         <button
//           className="modal_continue"
//           disabled={!selected}
//           onClick={() => onConfirm({ ...selected, color: '#2d3748', opacity: 1 })}
//         >
//           Continue
//         </button>
//       </ModalBox>
//     </ModalBackdrop>
//   )
// }

// const VectorGrid = styled.div`
//   display: grid;
//   grid-template-columns: repeat(4, 1fr);
//   gap: 8px;

//   .vector_cell {
//     aspect-ratio: 1;
//     background: #F3F4F6;
//     border-radius: 12px;
//     display: flex;
//     align-items: center;
//     justify-content: center;
//     font-size: 1.6em;
//     color: var(--text-color, #2d3748);
//     cursor: pointer;
//     border: 2px solid transparent;
//     transition: border-color 0.2s, background 0.2s;
//     &:hover { background: #E9ECEF; }
//     &.active {
//       border-color: var(--primary-color, #EF5A42);
//       background: rgba(239,90,66,0.06);
//     }
//   }
// `

// // ─── Edit Vector Modal ────────────────────────────────────────────────────────

// const EditVectorModal = ({ onClose, vector, onUpdate, onRemove }) => {
//   const [opacity, setOpacity]     = useState(vector.opacity ?? 1)
//   const [color, setColor]         = useState(vector.color ?? '#2d3748')
//   const [size, setSize]           = useState(vector.size ?? 48)
//   const [colorOpen, setColorOpen] = useState(false)
//   const Icon = vector.icon

//   return (
//     <ModalBackdrop onClick={onClose}>
//       <ModalBox onClick={(e) => e.stopPropagation()}>
//         <div className="modal_header">
//           <h3>Edit Vector</h3>
//           <button className="modal_close" onClick={onClose}><BsX /></button>
//         </div>

//         <VectorPreviewBox>
//           <Icon style={{ color, opacity, fontSize: size }} />
//         </VectorPreviewBox>

//         <OpacityRow>
//           <span className="label">Size</span>
//           <div className="slider_wrap">
//             <input
//               type="range"
//               min="20"
//               max="120"
//               step="4"
//               value={size}
//               onChange={(e) => setSize(Number(e.target.value))}
//             />
//           </div>
//           <span className="val">{size}px</span>
//         </OpacityRow>

//         <OpacityRow>
//           <span className="label">Opacity</span>
//           <div className="slider_wrap">
//             <input
//               type="range"
//               min="0.1"
//               max="1"
//               step="0.05"
//               value={opacity}
//               onChange={(e) => setOpacity(parseFloat(e.target.value))}
//             />
//           </div>
//           <span className="val">{Math.round(opacity * 100)}%</span>
//         </OpacityRow>

//         <AccordionRow onClick={() => setColorOpen(o => !o)}>
//           <span>Choose Colour</span>
//           {colorOpen ? <BsChevronUp /> : <BsChevronDown />}
//         </AccordionRow>

//         {colorOpen && (
//           <ColorSection>
//             <div className="swatches">
//               {['#2d3748','#EF5A42','#3B82F6','#10B981','#F59E0B','#8B5CF6','#EC4899','#FFFFFF'].map((c) => (
//                 <div
//                   key={c}
//                   className={`swatch ${color === c ? 'active' : ''}`}
//                   style={{ background: c, border: c === '#FFFFFF' ? '1.5px solid #E5E7EB' : 'none' }}
//                   onClick={() => setColor(c)}
//                 >
//                   {color === c && (
//                     <BsCheck2 style={{ color: c === '#FFFFFF' || c === '#F59E0B' ? '#333' : '#fff', fontSize: '0.75em' }} />
//                   )}
//                 </div>
//               ))}
//             </div>
//             <div className="custom_color_row">
//               <label>Custom colour</label>
//               <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
//             </div>
//           </ColorSection>
//         )}

//         <button
//           className="modal_continue"
//           onClick={() => { onUpdate({ color, opacity, size }); onClose() }}
//         >
//           Save Changes
//         </button>

//         <RemoveBtn onClick={onRemove}>
//           Remove Vector
//         </RemoveBtn>
//       </ModalBox>
//     </ModalBackdrop>
//   )
// }

// const VectorPreviewBox = styled.div`
//   width: 100%;
//   aspect-ratio: 16/9;
//   border-radius: 12px;
//   background: #F3F4F6;
//   display: flex;
//   align-items: center;
//   justify-content: center;
// `

// const OpacityRow = styled.div`
//   display: flex;
//   align-items: center;
//   gap: 0.75rem;

//   .label {
//     font-size: 0.9em;
//     font-weight: 500;
//     color: var(--text-color, #111);
//     white-space: nowrap;
//     min-width: 52px;
//   }

//   .val {
//     font-size: 0.8em;
//     color: var(--light-text-color, #6B7280);
//     min-width: 36px;
//     text-align: right;
//   }

//   .slider_wrap { flex: 1; }

//   input[type="range"] {
//     -webkit-appearance: none;
//     appearance: none;
//     width: 100%;
//     height: 6px;
//     border-radius: 3px;
//     background: #E5E7EB;
//     outline: none;
//     cursor: pointer;

//     &::-webkit-slider-thumb {
//       -webkit-appearance: none;
//       appearance: none;
//       width: 20px;
//       height: 20px;
//       border-radius: 50%;
//       background: #F59E0B;
//       cursor: pointer;
//       box-shadow: 0 2px 6px rgba(0,0,0,0.2);
//     }
//   }
// `

// const RemoveBtn = styled.button`
//   width: 100%;
//   height: 44px;
//   background: transparent;
//   border: 1.5px solid #ECEFF3;
//   border-radius: 22px;
//   cursor: pointer;
//   font-size: 0.95em;
//   color: #9CA3AF;
//   transition: border-color 0.2s, color 0.2s;
//   &:hover { border-color: #EF5A42; color: #EF5A42; }
// `

// // ─── Background Modal ─────────────────────────────────────────────────────────

// const BgModal = ({ onClose, onConfirm, onRemove, currentBg }) => {
//   const [search, setSearch]     = useState('')
//   const [selected, setSelected] = useState(currentBg || null)

//   const filtered = BG_OPTIONS.filter(b =>
//     b.label.toLowerCase().includes(search.toLowerCase())
//   )

//   const handleCellClick = (bg) => {
//     // clicking the already-selected bg toggles it off
//     setSelected(prev => prev?.id === bg.id ? null : bg)
//   }

//   return (
//     <ModalBackdrop onClick={onClose}>
//       <ModalBox onClick={(e) => e.stopPropagation()}>
//         <div className="modal_header">
//           <h3>Background</h3>
//           <button className="modal_close" onClick={onClose}><BsX /></button>
//         </div>

//         <SearchInput>
//           <BsSearch className="search_icon" />
//           <input placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
//         </SearchInput>

//         <BgGrid>
//           {filtered.map((bg) => (
//             <div
//               key={bg.id}
//               className={`bg_cell ${selected?.id === bg.id ? 'active' : ''}`}
//               style={{ background: bg.value }}
//               onClick={() => handleCellClick(bg)}
//             >
//               {selected?.id === bg.id && (
//                 <div className="bg_check"><BsX /></div>
//               )}
//             </div>
//           ))}
//         </BgGrid>

//         <button
//           className="modal_continue"
//           onClick={() => onConfirm(selected)}
//         >
//           {selected ? 'Apply Background' : 'Remove Background'}
//         </button>
//       </ModalBox>
//     </ModalBackdrop>
//   )
// }

// const BgGrid = styled.div`
//   display: grid;
//   grid-template-columns: repeat(4, 1fr);
//   gap: 8px;

//   .bg_cell {
//     aspect-ratio: 1;
//     border-radius: 10px;
//     cursor: pointer;
//     border: 2px solid transparent;
//     position: relative;
//     overflow: hidden;
//     transition: transform 0.15s, border-color 0.2s;
//     &:hover { transform: scale(1.04); }
//     &.active { border-color: var(--primary-color, #EF5A42); }

//     .bg_check {
//       position: absolute;
//       bottom: 4px;
//       right: 4px;
//       width: 18px;
//       height: 18px;
//       border-radius: 50%;
//       background: var(--primary-color, #EF5A42);
//       color: #fff;
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       font-size: 0.8em;
//     }
//   }
// `

// // ─── Frame Modal ──────────────────────────────────────────────────────────────

// const FRAME_STYLES = [
//   { id: 'solid',  label: 'Solid' },
//   { id: 'dashed', label: 'Dashed' },
//   { id: 'dotted', label: 'Dotted' },
//   { id: 'double', label: 'Double' },
// ]

// const FRAME_SWATCHES = ['#111111','#EF5A42','#3B82F6','#10B981','#F59E0B','#8B5CF6','#EC4899','#FFFFFF']

// const FrameModal = ({ onClose, onConfirm, currentFrame }) => {
//   const [style,     setStyle]     = useState(currentFrame?.style     ?? 'solid')
//   const [thickness, setThickness] = useState(currentFrame?.thickness ?? 4)
//   const [radius,    setRadius]    = useState(currentFrame?.radius    ?? 0)
//   const [color,     setColor]     = useState(currentFrame?.color     ?? '#111111')
//   const [colorOpen, setColorOpen] = useState(false)

//   const previewBorder = `${thickness}px ${style} ${color}`
//   const previewRadius = `${radius}px`

//   const frame = { style, thickness, radius, color,
//     border: previewBorder, borderRadius: previewRadius }

//   return (
//     <ModalBackdrop onClick={onClose}>
//       <ModalBox onClick={(e) => e.stopPropagation()}>
//         <div className="modal_header">
//           <h3>Frame</h3>
//           <button className="modal_close" onClick={onClose}><BsX /></button>
//         </div>

//         {/* Live Preview */}
//         <FramePreview style={{ border: previewBorder, borderRadius: previewRadius }} />

//         {/* Style Pills */}
//         <FrameSection>
//           <span className="section_label">Style</span>
//           <div className="style_pills">
//             {FRAME_STYLES.map(s => (
//               <button
//                 key={s.id}
//                 className={`style_pill ${style === s.id ? 'active' : ''}`}
//                 onClick={() => setStyle(s.id)}
//               >
//                 {s.label}
//               </button>
//             ))}
//           </div>
//         </FrameSection>

//         {/* Thickness */}
//         <OpacityRow>
//           <span className="label">Thickness</span>
//           <div className="slider_wrap">
//             <input
//               type="range" min="1" max="20" step="1"
//               value={thickness}
//               onChange={(e) => setThickness(Number(e.target.value))}
//             />
//           </div>
//           <span className="val">{thickness}px</span>
//         </OpacityRow>

//         {/* Radius */}
//         <OpacityRow>
//           <span className="label">Radius</span>
//           <div className="slider_wrap">
//             <input
//               type="range" min="0" max="48" step="2"
//               value={radius}
//               onChange={(e) => setRadius(Number(e.target.value))}
//             />
//           </div>
//           <span className="val">{radius}px</span>
//         </OpacityRow>

//         {/* Color */}
//         <AccordionRow onClick={() => setColorOpen(o => !o)}>
//           <span>Colour</span>
//           <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
//             <span style={{
//               width: 16, height: 16, borderRadius: '50%',
//               background: color,
//               border: color === '#FFFFFF' ? '1.5px solid #E5E7EB' : 'none',
//               display: 'inline-block', flexShrink: 0,
//             }} />
//             {colorOpen ? <BsChevronUp /> : <BsChevronDown />}
//           </div>
//         </AccordionRow>

//         {colorOpen && (
//           <ColorSection>
//             <div className="swatches">
//               {FRAME_SWATCHES.map(c => (
//                 <div
//                   key={c}
//                   className={`swatch ${color === c ? 'active' : ''}`}
//                   style={{ background: c, border: c === '#FFFFFF' ? '1.5px solid #E5E7EB' : 'none' }}
//                   onClick={() => setColor(c)}
//                 >
//                   {color === c && (
//                     <BsCheck2 style={{ color: c === '#FFFFFF' || c === '#F59E0B' ? '#333' : '#fff', fontSize: '0.75em' }} />
//                   )}
//                 </div>
//               ))}
//             </div>
//             <div className="custom_color_row">
//               <label>Custom colour</label>
//               <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
//             </div>
//           </ColorSection>
//         )}

//         <button className="modal_continue" onClick={() => onConfirm(frame)}>
//           Apply Frame
//         </button>

//         {currentFrame && (
//           <RemoveBtn onClick={() => onConfirm(null)}>
//             Remove Frame
//           </RemoveBtn>
//         )}
//       </ModalBox>
//     </ModalBackdrop>
//   )
// }

// const FramePreview = styled.div`
//   width: 100%;
//   aspect-ratio: 4/3;
//   background: #F3F4F6;
//   transition: border 0.15s, border-radius 0.15s;
// `

// const FrameSection = styled.div`
//   display: flex;
//   flex-direction: column;
//   gap: 0.5rem;

//   .section_label {
//     font-size: 0.9em;
//     font-weight: 500;
//     color: var(--text-color, #111);
//   }

//   .style_pills {
//     display: flex;
//     gap: 6px;
//   }

//   .style_pill {
//     flex: 1;
//     height: 36px;
//     border-radius: 99px;
//     border: 1.5px solid #ECEFF3;
//     background: #F9FAFB;
//     font-size: 0.82em;
//     font-weight: 500;
//     color: var(--light-text-color, #6B7280);
//     cursor: pointer;
//     transition: border-color 0.2s, color 0.2s, background 0.2s;

//     &.active {
//       border-color: var(--primary-color, #EF5A42);
//       color: var(--primary-color, #EF5A42);
//       background: rgba(239,90,66,0.06);
//     }
//     &:hover:not(.active) { border-color: #D1D5DB; }
//   }
// `

// // ─── Decision Component ───────────────────────────────────────────────────────

// const DecisionComponent = ({ selected, setSelected }) => {
//   const options = [
//     {
//       id: 'board',
//       label: 'Create a Board',
//       icon: <BsLayoutWtf />,
//       features: [
//         'Let multiple people contribute messages',
//         'Curate a collection of appreciations',
//         'Perfect for group celebrations',
//       ],
//     },
//     {
//       id: 'direct',
//       label: 'Direct Message',
//       icon: <BsPerson />,
//       features: [
//         'Send a personal message directly',
//         'Private one-to-one appreciation',
//       ],
//     },
//   ]

//   return (
//     <DecisionWrapper>
//       {options.map((opt) => (
//         <div
//           key={opt.id}
//           className={`option_card ${selected === opt.id ? 'active' : ''}`}
//           onClick={() => setSelected(opt.id)}
//         >
//           <div className="option_header">
//             <div className={`icon_circle ${selected === opt.id ? 'active' : ''}`}>
//               {opt.icon}
//             </div>
//             <span className="option_label">{opt.label}</span>
//             <div className={`radio ${selected === opt.id ? 'active' : ''}`}>
//               {selected === opt.id && <div className="radio_dot" />}
//             </div>
//           </div>
//           <ul className="feature_list">
//             {opt.features.map((f, i) => (
//               <li key={i} className="feature_item">
//                 <BsCheckLg className="check" />
//                 <span>{f}</span>
//               </li>
//             ))}
//           </ul>
//         </div>
//       ))}
//     </DecisionWrapper>
//   )
// }

// const DecisionWrapper = styled.div`
//   display: flex;
//   flex-direction: column;
//   gap: 0.75rem;

//   .option_card {
//     border-radius: 12px;
//     border: 1.5px solid #ECEFF3;
//     padding: 1rem 1.2rem;
//     cursor: pointer;
//     background: #FAFAFA;
//     transition: border-color 0.2s, background 0.2s;
//     &.active {
//       border-color: var(--primary-color);
//       background: rgba(239,90,66,0.04);
//     }
//     &:hover:not(.active) { border-color: var(--primary-color); }
//   }

//   .option_header {
//     display: flex;
//     align-items: center;
//     gap: 0.75rem;
//     margin-bottom: 0.75rem;
//   }

//   .icon_circle {
//     width: 36px;
//     height: 36px;
//     border-radius: 50%;
//     background: #F3F4F6;
//     color: var(--light-text-color, #6B7280);
//     display: flex;
//     align-items: center;
//     justify-content: center;
//     font-size: 1.1em;
//     transition: background 0.2s, color 0.2s;
//     flex-shrink: 0;
//     &.active { background: var(--primary-color); color: #fff; }
//   }

//   .option_label {
//     flex: 1;
//     font-size: 1em;
//     font-weight: 600;
//     color: var(--text-color, #111);
//   }

//   .radio {
//     width: 20px;
//     height: 20px;
//     border-radius: 50%;
//     border: 2px solid #D1D5DB;
//     display: flex;
//     align-items: center;
//     justify-content: center;
//     flex-shrink: 0;
//     transition: border-color 0.2s;
//     &.active { border-color: var(--primary-color); }

//     .radio_dot {
//       width: 10px;
//       height: 10px;
//       border-radius: 50%;
//       background: var(--primary-color);
//     }
//   }

//   .feature_list {
//     list-style: none;
//     padding: 0;
//     margin: 0;
//     display: flex;
//     flex-direction: column;
//     gap: 0.4rem;
//   }

//   .feature_item {
//     display: flex;
//     align-items: center;
//     gap: 0.5rem;
//     font-size: 0.9em;
//     color: var(--light-text-color, #6B7280);
//     .check { font-size: 0.8em; flex-shrink: 0; }
//   }
// `

// // ─── Draggable Canvas Item ────────────────────────────────────────────────────

// const DraggableCanvasItem = ({ position, onPositionChange, onTap, selected, onSelect, children }) => {
//   const elRef       = useRef(null)
//   const dragRef     = useRef({ dragging: false, startX: 0, startY: 0, origX: 0, origY: 0, moved: false })

//   const getClientXY = (e) => {
//     if (e.touches) return { cx: e.touches[0].clientX, cy: e.touches[0].clientY }
//     return { cx: e.clientX, cy: e.clientY }
//   }

//   const onPointerDown = (e) => {
//     e.stopPropagation()
//     onSelect()
//     const { cx, cy } = getClientXY(e)
//     dragRef.current = { dragging: true, startX: cx, startY: cy, origX: position.x, origY: position.y, moved: false }

//     const canvas = elRef.current?.closest('[data-canvas]')
//     if (!canvas) return
//     const rect = canvas.getBoundingClientRect()

//     const onMove = (ev) => {
//       if (!dragRef.current.dragging) return
//       const { cx: mx, cy: my } = getClientXY(ev)
//       const dx = mx - dragRef.current.startX
//       const dy = my - dragRef.current.startY
//       if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragRef.current.moved = true
//       const nx = Math.min(95, Math.max(5, dragRef.current.origX + (dx / rect.width) * 100))
//       const ny = Math.min(95, Math.max(5, dragRef.current.origY + (dy / rect.height) * 100))
//       onPositionChange({ x: nx, y: ny })
//     }

//     const onUp = () => {
//       if (!dragRef.current.moved) onTap()
//       dragRef.current.dragging = false
//       window.removeEventListener('mousemove', onMove)
//       window.removeEventListener('touchmove', onMove)
//       window.removeEventListener('mouseup', onUp)
//       window.removeEventListener('touchend', onUp)
//     }

//     window.addEventListener('mousemove', onMove)
//     window.addEventListener('touchmove', onMove, { passive: true })
//     window.addEventListener('mouseup', onUp)
//     window.addEventListener('touchend', onUp)
//   }

//   return (
//     <DraggableItem
//       ref={elRef}
//       $x={position.x}
//       $y={position.y}
//       $selected={selected}
//       onMouseDown={onPointerDown}
//       onTouchStart={onPointerDown}
//     >
//       {children}
//       {selected && <div className="drag_hint">drag • tap to edit</div>}
//     </DraggableItem>
//   )
// }

// const DraggableItem = styled.div`
//   position: absolute;
//   left: ${({ $x }) => $x}%;
//   top: ${({ $y }) => $y}%;
//   transform: translate(-50%, -50%);
//   cursor: grab;
//   user-select: none;
//   touch-action: none;
//   z-index: 10;
//   transition: left 0.05s linear, top 0.05s linear;

//   &:active { cursor: grabbing; }

//   ${({ $selected }) => $selected && `
//     outline: 2px dashed rgba(239,90,66,0.7);
//     outline-offset: 6px;
//     border-radius: 4px;
//   `}

//   .drag_hint {
//     position: absolute;
//     bottom: calc(100% + 8px);
//     left: 50%;
//     transform: translateX(-50%);
//     background: rgba(0,0,0,0.65);
//     color: #fff;
//     font-size: 0.62rem;
//     padding: 3px 8px;
//     border-radius: 99px;
//     white-space: nowrap;
//     pointer-events: none;
//     letter-spacing: 0.4px;
//   }
// `

// // ─── Event Modal ──────────────────────────────────────────────────────────────

// const EVENTS = [
//   { id: 'others',     label: 'Others',     emoji: '🌟' },
//   { id: 'birthday',   label: 'Birthday',   emoji: '🎂' },
//   { id: 'sport',      label: 'Sport',      emoji: '🏅' },
//   { id: 'groove',     label: 'Groove',     emoji: '🎉' },
//   { id: 'wedding',    label: 'Wedding',    emoji: '💍' },
//   { id: 'graduation', label: 'Graduation', emoji: '🎓' },
//   { id: 'retirement', label: 'Retirement', emoji: '🏖️' },
//   { id: 'getwell',    label: 'Get well',   emoji: '💐' },
//   { id: 'funeral',    label: 'Funeral',    emoji: '🕊️' },
//   { id: 'promotion',  label: 'Promotion',  emoji: '🎊' },
//   { id: 'newbaby',    label: 'New Baby',   emoji: '👶' },
//   { id: 'anniversary',label: 'Anniversary',emoji: '❤️' },
// ]

// const EventModal = ({ onClose, onConfirm, currentEvent }) => {
//   const [selected, setSelected]       = useState(currentEvent || null)
//   const [customEvent, setCustomEvent] = useState(currentEvent?.custom || '')

//   const canContinue = selected?.id !== 'others' || customEvent.trim().length > 0

//   return (
//     <ModalBackdrop onClick={onClose}>
//       <ModalBox onClick={(e) => e.stopPropagation()}>
//         <div className="modal_header">
//           <h3>Choose Event</h3>
//           <button className="modal_close" onClick={onClose}><BsX /></button>
//         </div>

//         <EventGrid>
//           {EVENTS.map((ev) => {
//             const isActive = selected?.id === ev.id
//             return (
//               <div
//                 key={ev.id}
//                 className={`event_cell ${isActive ? 'active' : ''}`}
//                 onClick={() => setSelected(isActive ? null : ev)}
//               >
//                 <div className={`event_radio ${isActive ? 'active' : ''}`}>
//                   {isActive && <BsCheck2 className="radio_check" />}
//                 </div>
//                 <span className="event_emoji">{ev.emoji}</span>
//                 <span className="event_label">{ev.label}</span>
//               </div>
//             )
//           })}
//         </EventGrid>

//         {selected?.id === 'others' && (
//           <OthersInput
//             type="text"
//             placeholder="Describe your event..."
//             value={customEvent}
//             onChange={(e) => setCustomEvent(e.target.value)}
//             autoFocus
//           />
//         )}

//         <button
//           className="modal_continue"
//           disabled={!canContinue}
//           onClick={() => onConfirm(
//             selected
//               ? { ...selected, ...(selected.id === 'others' && { custom: customEvent.trim(), label: customEvent.trim() || 'Others' }) }
//               : null
//           )}
//         >
//           Continue
//         </button>
//       </ModalBox>
//     </ModalBackdrop>
//   )
// }

// const OthersInput = styled.input`
//   width: 100%;
//   height: 48px;
//   padding: 0 1rem;
//   border: 1.5px solid var(--primary-color, #EF5A42);
//   border-radius: 10px;
//   background: rgba(239,90,66,0.03);
//   font-size: 0.95em;
//   color: var(--text-color, #111);
//   outline: none;
//   box-sizing: border-box;
//   transition: border-color 0.2s;

//   &::placeholder { color: #9CA3AF; }
//   &:focus { background: #fff; }
// `

// const EventGrid = styled.div`
//   display: grid;
//   grid-template-columns: 1fr 1fr;
//   gap: 8px;
//   max-height: 380px;
//   overflow-y: auto;
//   padding-right: 2px;

//   &::-webkit-scrollbar { width: 4px; }
//   &::-webkit-scrollbar-track { background: transparent; }
//   &::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 99px; }

//   .event_cell {
//     display: flex;
//     align-items: center;
//     gap: 0.5rem;
//     padding: 0.7rem 0.85rem;
//     border-radius: 12px;
//     background: #F9FAFB;
//     border: 1.5px solid #ECEFF3;
//     cursor: pointer;
//     transition: border-color 0.2s, background 0.2s;

//     &:hover:not(.active) { border-color: #D1D5DB; }
//     &.active {
//       border-color: var(--primary-color, #EF5A42);
//       background: rgba(239,90,66,0.04);
//     }
//   }

//   .event_radio {
//     width: 18px;
//     height: 18px;
//     border-radius: 50%;
//     border: 1.5px solid #D1D5DB;
//     flex-shrink: 0;
//     display: flex;
//     align-items: center;
//     justify-content: center;
//     transition: border-color 0.2s, background 0.2s;

//     &.active {
//       border-color: var(--primary-color, #EF5A42);
//       background: var(--primary-color, #EF5A42);
//     }

//     .radio_check {
//       font-size: 0.65em;
//       color: #fff;
//     }
//   }

//   .event_emoji {
//     font-size: 1.05em;
//     flex-shrink: 0;
//     line-height: 1;
//   }

//   .event_label {
//     font-size: 0.88em;
//     font-weight: 500;
//     color: var(--text-color, #111);
//     white-space: nowrap;
//     overflow: hidden;
//     text-overflow: ellipsis;
//   }
// `

// // ─── Audio Tab ────────────────────────────────────────────────────────────────

// const AudioTab = () => {
//   const [recording, setRecording]         = useState(false)
//   const [elapsed, setElapsed]             = useState(0)
//   const [audioBlob, setAudioBlob]         = useState(null)
//   const [audioURL, setAudioURL]           = useState(null)
//   const [uploadedName, setUploadedName]   = useState(null)

//   const mediaRecorderRef = useRef(null)
//   const chunksRef        = useRef([])
//   const timerRef         = useRef(null)
//   const fileRef          = useRef(null)

//   const formatTime = (s) => {
//     const m = Math.floor(s / 60).toString().padStart(2, '0')
//     const sec = (s % 60).toString().padStart(2, '0')
//     return `${m}:${sec}`
//   }

//   const startRecording = async () => {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
//       const mr = new MediaRecorder(stream)
//       mediaRecorderRef.current = mr
//       chunksRef.current = []

//       mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
//       mr.onstop = () => {
//         const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
//         setAudioBlob(blob)
//         setAudioURL(URL.createObjectURL(blob))
//         setUploadedName('Recorded audio')
//         stream.getTracks().forEach(t => t.stop())
//       }

//       mr.start()
//       setRecording(true)
//       setElapsed(0)
//       timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
//     } catch {
//       alert('Microphone access denied. Please allow microphone access to record.')
//     }
//   }

//   const stopRecording = () => {
//     if (mediaRecorderRef.current) mediaRecorderRef.current.stop()
//     clearInterval(timerRef.current)
//     setRecording(false)
//   }

//   const handleUpload = (e) => {
//     const file = e.target.files[0]
//     if (!file) return
//     setAudioBlob(file)
//     setAudioURL(URL.createObjectURL(file))
//     setUploadedName(file.name)
//     setElapsed(0)
//     setRecording(false)
//   }

//   const removeAudio = () => {
//     setAudioBlob(null)
//     setAudioURL(null)
//     setUploadedName(null)
//     setElapsed(0)
//   }

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
//             >
//               {recording
//                 ? <span className="stop_square" />
//                 : <BsMic className="mic_icon" />
//               }
//             </button>
//             <span className="timer">{formatTime(elapsed)}</span>
//             {recording && <div className="pulse_ring" />}
//           </div>

//           <input
//             type="file"
//             accept="audio/*"
//             ref={fileRef}
//             style={{ display: 'none' }}
//             onChange={handleUpload}
//           />
//           <button className="upload_sound_btn" onClick={() => fileRef.current.click()}>
//             <BsUpload />
//             <span>Upload / Extract sound</span>
//           </button>
//         </>
//       )}

//       <button
//         className={`send_btn ${audioURL ? 'ready' : ''}`}
//         disabled={!audioURL}
//       >
//         Send appreciation
//       </button>
//     </AudioWrapper>
//   )
// }

// const AudioWrapper = styled.div`
//   display: flex;
//   flex-direction: column;
//   align-items: center;
//   gap: 1.25rem;
//   padding: 0.5rem 0 0.25rem;
//   width: 100%;

//   .record_area {
//     position: relative;
//     display: flex;
//     flex-direction: column;
//     align-items: center;
//     gap: 0.85rem;
//     padding: 1.5rem 0 0.5rem;
//   }

//   .record_btn {
//     width: 110px;
//     height: 110px;
//     border-radius: 50%;
//     border: none;
//     background: var(--primary-color, #EF5A42);
//     color: #fff;
//     display: flex;
//     align-items: center;
//     justify-content: center;
//     cursor: pointer;
//     position: relative;
//     z-index: 2;
//     transition: transform 0.15s, background 0.2s;
//     box-shadow: 0 8px 24px rgba(239,90,66,0.35);

//     &:hover { transform: scale(1.04); }
//     &:active { transform: scale(0.97); }

//     &.recording {
//       background: #d94030;
//     }

//     .mic_icon { font-size: 2.4rem; }

//     .stop_square {
//       width: 28px;
//       height: 28px;
//       border-radius: 5px;
//       background: #fff;
//     }
//   }

//   .pulse_ring {
//     position: absolute;
//     width: 130px;
//     height: 130px;
//     border-radius: 50%;
//     border: 3px solid rgba(239,90,66,0.4);
//     animation: pulse 1.4s ease-out infinite;
//     top: 50%;
//     left: 50%;
//     transform: translate(-50%, -68%);
//     pointer-events: none;
//   }

//   @keyframes pulse {
//     0%   { transform: translate(-50%, -68%) scale(1);   opacity: 0.8; }
//     100% { transform: translate(-50%, -68%) scale(1.5); opacity: 0; }
//   }

//   .timer {
//     font-size: 1.05em;
//     font-weight: 500;
//     color: var(--light-text-color, #6B7280);
//     letter-spacing: 1px;
//     font-variant-numeric: tabular-nums;
//   }

//   .upload_sound_btn {
//     display: flex;
//     align-items: center;
//     gap: 0.5rem;
//     padding: 0.65rem 1.5rem;
//     border: 1.5px solid #ECEFF3;
//     border-radius: 99px;
//     background: #fff;
//     font-size: 0.92em;
//     color: var(--text-color, #111);
//     cursor: pointer;
//     transition: border-color 0.2s;
//     &:hover { border-color: var(--primary-color, #EF5A42); }
//     svg { font-size: 0.95em; color: var(--light-text-color, #6B7280); }
//   }

//   .audio_result {
//     width: 100%;
//     display: flex;
//     flex-direction: column;
//     gap: 0.75rem;
//   }

//   .audio_file_row {
//     display: flex;
//     align-items: center;
//     gap: 0.65rem;
//     padding: 0.75rem 1rem;
//     background: #F9FAFB;
//     border: 1.5px solid #ECEFF3;
//     border-radius: 12px;

//     .audio_icon {
//       color: var(--primary-color, #EF5A42);
//       font-size: 1.1em;
//       flex-shrink: 0;
//     }

//     .audio_name {
//       flex: 1;
//       font-size: 0.9em;
//       color: var(--text-color, #111);
//       overflow: hidden;
//       text-overflow: ellipsis;
//       white-space: nowrap;
//     }

//     .audio_remove {
//       width: 26px;
//       height: 26px;
//       border-radius: 50%;
//       border: 1.5px solid #ECEFF3;
//       background: transparent;
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       font-size: 1em;
//       color: #9CA3AF;
//       cursor: pointer;
//       transition: border-color 0.2s, color 0.2s;
//       flex-shrink: 0;
//       &:hover { border-color: #EF5A42; color: #EF5A42; }
//     }
//   }

//   .audio_player {
//     width: 100%;
//     border-radius: 8px;
//     outline: none;
//     height: 40px;
//   }

//   .send_btn {
//     width: 100%;
//     height: 50px;
//     border: none;
//     border-radius: 25px;
//     background: var(--primary-color, #EF5A42);
//     color: #fff;
//     font-size: 1em;
//     font-weight: 600;
//     opacity: 0.4;
//     cursor: not-allowed;
//     transition: opacity 0.2s;
//     margin-top: 0.25rem;

//     &.ready {
//       opacity: 1;
//       cursor: pointer;
//       &:hover { opacity: 0.88; }
//     }
//   }
// `

// // ─── Video Tab ────────────────────────────────────────────────────────────────

// const VideoTab = () => (
//   <VideoWrapper>
//     <div className="coming_soon_icon">
//       <BsCameraVideo />
//     </div>
//     <h3>Coming Soon</h3>
//     <p>Video messages are on the way. Stay tuned for updates!</p>
//   </VideoWrapper>
// )

// const VideoWrapper = styled.div`
//   display: flex;
//   flex-direction: column;
//   align-items: center;
//   justify-content: center;
//   gap: 0.6rem;
//   padding: 2.5rem 1rem;
//   text-align: center;

//   .coming_soon_icon {
//     width: 64px;
//     height: 64px;
//     border-radius: 50%;
//     background: #F3F4F6;
//     display: flex;
//     align-items: center;
//     justify-content: center;
//     font-size: 1.8rem;
//     color: #9CA3AF;
//     margin-bottom: 0.25rem;
//   }

//   h3 {
//     font-size: 1.1em;
//     font-weight: 700;
//     color: var(--text-color, #111);
//     margin: 0;
//   }

//   p {
//     font-size: 0.88em;
//     color: var(--light-text-color, #6B7280);
//     margin: 0;
//     max-width: 220px;
//     line-height: 1.5;
//   }
// `

// // ─── Mock Users & Tag Input ───────────────────────────────────────────────────

// const MOCK_USERS = [
//   { id: 1,  username: 'alex_johnson',   name: 'Alex Johnson',   avatar: '👨‍💼' },
//   { id: 2,  username: 'sarah_williams', name: 'Sarah Williams', avatar: '👩‍🎨' },
//   { id: 3,  username: 'mike_chen',      name: 'Mike Chen',      avatar: '👨‍💻' },
//   { id: 4,  username: 'priya_patel',    name: 'Priya Patel',    avatar: '👩‍🔬' },
//   { id: 5,  username: 'james_okafor',   name: 'James Okafor',   avatar: '👨‍🎤' },
//   { id: 6,  username: 'emma_walsh',     name: 'Emma Walsh',     avatar: '👩‍🏫' },
//   { id: 7,  username: 'david_kim',      name: 'David Kim',      avatar: '👨‍🍳' },
//   { id: 8,  username: 'fatima_ali',     name: 'Fatima Ali',     avatar: '👩‍⚕️' },
//   { id: 9,  username: 'carlos_reyes',   name: 'Carlos Reyes',   avatar: '👨‍🎸' },
//   { id: 10, username: 'nina_brown',     name: 'Nina Brown',     avatar: '👩‍💼' },
// ]

// const TagInput = () => {
//   const [inputValue, setInputValue]   = useState('')
//   const [tags, setTags]               = useState([])
//   const [suggestions, setSuggestions] = useState([])
//   const [suggestType, setSuggestType] = useState(null)
//   const inputRef                      = useRef(null)
//   const wrapperRef                    = useRef(null)

//   const hasMention = tags.some(t => t.type === 'user')

//   useEffect(() => {
//     const handler = (e) => {
//       if (wrapperRef.current && !wrapperRef.current.contains(e.target))
//         setSuggestions([])
//     }
//     document.addEventListener('mousedown', handler)
//     return () => document.removeEventListener('mousedown', handler)
//   }, [])

//   const getLastWord = (val) => val.split(/\s+/).pop()

//   const handleChange = (e) => {
//     const val = e.target.value
//     setInputValue(val)
//     const last = getLastWord(val)

//     if (last.startsWith('@') && last.length > 1) {
//       // Block second @ suggestion if a mention already exists
//       if (hasMention) { setSuggestions([]); setSuggestType(null); return }
//       const q = last.slice(1).toLowerCase()
//       setSuggestions(MOCK_USERS.filter(u =>
//         u.username.toLowerCase().includes(q) || u.name.toLowerCase().includes(q)
//       ))
//       setSuggestType('user')
//     } else if (last.startsWith('#') && last.length > 1) {
//       const q = last.slice(1).toLowerCase()
//       setSuggestions(EVENTS.filter(ev => ev.label.toLowerCase().includes(q)))
//       setSuggestType('event')
//     } else {
//       setSuggestions([])
//       setSuggestType(null)
//     }
//   }

//   const handleKeyDown = (e) => {
//     if ((e.key === ' ' || e.key === 'Enter') && inputValue.trim()) {
//       e.preventDefault()
//       commitInput(inputValue.trim())
//     }
//     if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
//       setTags(prev => prev.slice(0, -1))
//     }
//   }

//   const commitInput = (value) => {
//     if (!value) return
//     const type = value.startsWith('@') ? 'user' : value.startsWith('#') ? 'event' : 'plain'
//     // Enforce single mention
//     if (type === 'user' && hasMention) return
//     if (!tags.find(t => t.value === value)) {
//       setTags(prev => [...prev, { id: Date.now(), value, type }])
//     }
//     setInputValue('')
//     setSuggestions([])
//     setSuggestType(null)
//   }

//   const pickUser = (user) => { commitInput(`@${user.username}`); inputRef.current?.focus() }
//   const pickEvent = (ev)  => { commitInput(`#${ev.label}`);      inputRef.current?.focus() }

//   // Hint shown inside the field
//   const placeholder = tags.length === 0
//     ? 'Send to: @mention · #event tags'
//     : hasMention ? 'Add #event tags...' : '@mention or #event tags'

//   return (
//     <TagInputWrapper ref={wrapperRef}>
//       <div className="tag_field" onClick={() => inputRef.current?.focus()}>
//         {tags.map((tag) => (
//           <span key={tag.id} className={`tag_chip ${tag.type}`}>
//             {tag.value}
//             <button className="chip_remove" onClick={(e) => { e.stopPropagation(); setTags(p => p.filter(t => t.id !== tag.id)) }}>
//               <BsX />
//             </button>
//           </span>
//         ))}
//         <input
//           ref={inputRef}
//           value={inputValue}
//           onChange={handleChange}
//           onKeyDown={handleKeyDown}
//           onBlur={() => { if (inputValue.trim()) commitInput(inputValue.trim()) }}
//           placeholder={tags.length === 0 ? placeholder : ''}
//           className="tag_bare_input"
//         />
//       </div>

//       {/* Hint row */}
//       {tags.length > 0 && (
//         <div className="tag_hint">
//           {hasMention
//             ? <span>✓ Recipient set · Add more <strong>#event</strong> tags</span>
//             : <span>Type <strong>@name</strong> to set recipient · <strong>#tag</strong> for events</span>
//           }
//         </div>
//       )}

//       {suggestions.length > 0 && (
//         <SuggestionBox>
//           {suggestType === 'user' && suggestions.map((user) => (
//             <div key={user.id} className="suggestion_item" onMouseDown={(e) => { e.preventDefault(); pickUser(user) }}>
//               <span className="s_avatar">{user.avatar}</span>
//               <div className="s_info">
//                 <span className="s_name">{user.name}</span>
//                 <span className="s_sub">@{user.username}</span>
//               </div>
//             </div>
//           ))}
//           {suggestType === 'event' && suggestions.map((ev) => (
//             <div key={ev.id} className="suggestion_item" onMouseDown={(e) => { e.preventDefault(); pickEvent(ev) }}>
//               <span className="s_avatar s_emoji">{ev.emoji}</span>
//               <div className="s_info">
//                 <span className="s_name">{ev.label}</span>
//                 <span className="s_sub">#{ev.label}</span>
//               </div>
//             </div>
//           ))}
//         </SuggestionBox>
//       )}
//     </TagInputWrapper>
//   )
// }

// const TagInputWrapper = styled.div`
//   position: relative;
//   width: 100%;

//   .tag_field {
//     min-height: 50px;
//     padding: 0.4rem 0.75rem;
//     background: #F9FAFB;
//     border: 1.5px solid #ECEFF3;
//     border-radius: 10px;
//     display: flex;
//     flex-wrap: wrap;
//     align-items: center;
//     gap: 6px;
//     cursor: text;
//     transition: border-color 0.2s;
//     box-sizing: border-box;

//     &:focus-within {
//       border-color: var(--primary-color, #EF5A42);
//       background: #fff;
//     }

//     .tag_chip {
//       display: inline-flex;
//       align-items: center;
//       gap: 3px;
//       padding: 3px 8px 3px 10px;
//       border-radius: 99px;
//       font-size: 0.82em;
//       font-weight: 500;
//       white-space: nowrap;
//       line-height: 1;

//       &.user {
//         background: rgba(59,130,246,0.1);
//         color: #3B82F6;
//       }
//       &.event {
//         background: rgba(239,90,66,0.1);
//         color: var(--primary-color, #EF5A42);
//       }
//       &.plain {
//         background: #F3F4F6;
//         color: var(--text-color, #111);
//       }
//       .chip_remove {
//         border: none;
//         background: transparent;
//         cursor: pointer;
//         display: flex;
//         align-items: center;
//         padding: 0;
//         font-size: 0.95em;
//         color: inherit;
//         opacity: 0.55;
//         &:hover { opacity: 1; }
//       }
//     }

//     .tag_bare_input {
//       flex: 1;
//       min-width: 100px;
//       border: none;
//       background: transparent;
//       outline: none;
//       font-size: 0.92em;
//       color: var(--text-color, #111);
//       padding: 4px 0;
//       &::placeholder { color: #9CA3AF; }
//     }
//   }

//   .tag_hint {
//     margin-top: 5px;
//     font-size: 0.76em;
//     color: #9CA3AF;
//     padding: 0 0.25rem;
//     line-height: 1.4;

//     strong { color: var(--primary-color, #EF5A42); font-weight: 600; }
//   }`

// const SuggestionBox = styled.div`
//   position: absolute;
//   top: calc(100% + 6px);
//   left: 0;
//   right: 0;
//   background: #fff;
//   border: 1.5px solid #ECEFF3;
//   border-radius: 12px;
//   box-shadow: 0 8px 24px rgba(0,0,0,0.1);
//   z-index: 50;
//   overflow: hidden;
//   max-height: 200px;
//   overflow-y: auto;

//   &::-webkit-scrollbar { width: 4px; }
//   &::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 99px; }

//   .suggestion_item {
//     display: flex;
//     align-items: center;
//     gap: 0.65rem;
//     padding: 0.6rem 1rem;
//     cursor: pointer;
//     transition: background 0.15s;
//     border-bottom: 1px solid #F3F4F6;

//     &:last-child { border-bottom: none; }
//     &:hover { background: #F9FAFB; }

//     .s_avatar {
//       font-size: 1.3em;
//       flex-shrink: 0;
//       width: 32px;
//       height: 32px;
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       background: #F3F4F6;
//       border-radius: 50%;
//     }

//     .s_emoji { background: transparent; font-size: 1.4em; }

//     .s_info {
//       flex: 1;
//       display: flex;
//       flex-direction: column;
//       gap: 1px;
//       min-width: 0;

//       .s_name {
//         font-size: 0.88em;
//         font-weight: 600;
//         color: var(--text-color, #111);
//         white-space: nowrap;
//         overflow: hidden;
//         text-overflow: ellipsis;
//       }

//       .s_sub {
//         font-size: 0.76em;
//         color: var(--light-text-color, #6B7280);
//       }
//     }
//   }
// `

// // ─── Post Creation Component ──────────────────────────────────────────────────

// const PostCreationComponent = ({ type }) => {
//   const [activeTab, setActiveTab]       = useState('text')
//   const [aspectRatio, setAspectRatio]   = useState('square')
//   const [activeModal, setActiveModal]   = useState(null)
//   const [selectedItem, setSelectedItem] = useState(null)
//   const [selectedEvent, setSelectedEvent] = useState(null)

//   const [canvasBg, setCanvasBg]         = useState(null)
//   const [canvasImage, setCanvasImage]   = useState(null)
//   const [canvasText, setCanvasText]     = useState(null)
//   const [canvasVector, setCanvasVector] = useState(null)
//   const [canvasFrame, setCanvasFrame]   = useState(null)

//   const tabs = [
//     { id: 'text',  label: 'Text',  icon: <BsPencil /> },
//     { id: 'audio', label: 'Audio', icon: <BsMic /> },
//     { id: 'video', label: 'Video', icon: <BsCameraVideo /> },
//   ]

//   const tools = [
//     { id: 'image',  label: 'Image',  icon: <BsImage /> },
//     { id: 'text',   label: 'Text',   icon: <BsTypeBold /> },
//     { id: 'vector', label: 'Vector', icon: <BsBezier2 /> },
//     { id: 'bg',     label: 'BG',     icon: <BsPalette2 /> },
//     { id: 'frame',  label: 'Frame',  icon: <BsBorderOuter /> },
//   ]

//   const handleToolClick = (toolId) => {
//     if (toolId === 'vector' && canvasVector) {
//       setActiveModal('editVector')
//     } else {
//       setActiveModal(toolId)
//     }
//   }

//   const hasContent = canvasBg || canvasImage || canvasText || canvasVector || canvasFrame
//   const VectorIcon = canvasVector?.icon

//   const canvasStyle = {
//     background: canvasBg ? canvasBg.value : '#F9FAFB',
//   }

//   return (
//     <PostCreationWrapper>
//       {/* Tab Switcher */}
//       <div className="tab_switcher">
//         {tabs.map((tab) => (
//           <button
//             key={tab.id}
//             className={`tab_btn ${activeTab === tab.id ? 'active' : ''}`}
//             onClick={() => setActiveTab(tab.id)}
//           >
//             {tab.icon}
//             <span>{tab.label}</span>
//           </button>
//         ))}
//       </div>

//       {/* Select Event — board only */}
//       {type === 'board' && (
//         <div className="select_row" onClick={() => setActiveModal('event')}>
//           {selectedEvent ? (
//             <>
//               <span className="select_event_emoji">{selectedEvent.emoji}</span>
//               <span className="select_value">{selectedEvent.label}</span>
//             </>
//           ) : (
//             <span className="select_placeholder">Select Event</span>
//           )}
//           <BsChevronRight className="select_arrow" />
//         </div>
//       )}

//       {/* Send To */}
//       <TagInput />

//       {/* ── Tab Content ── */}
//       {activeTab === 'text' && (
//         <>
//           {/* Aspect Ratio */}
//           <div className="aspect_row">
//             <span className="aspect_label">Aspect Ratio</span>
//             <div className="ratio_toggles">
//               <button
//                 className={`ratio_btn square_btn ${aspectRatio === 'square' ? 'active' : ''}`}
//                 onClick={() => setAspectRatio('square')}
//                 title="Square (1:1)"
//               >
//                 {aspectRatio === 'square' && <BsCheck2 />}
//               </button>
//               <button
//                 className={`ratio_btn portrait_btn ${aspectRatio === 'portrait' ? 'active' : ''}`}
//                 onClick={() => setAspectRatio('portrait')}
//                 title="Portrait (4:5)"
//               >
//                 {aspectRatio === 'portrait' && <BsCheck2 />}
//               </button>
//             </div>
//           </div>

//           {/* Canvas Preview */}
//           <CanvasArea
//             $ratio={aspectRatio}
//             style={{
//               ...canvasStyle,
//               ...(canvasFrame ? {
//                 border: canvasFrame.border,
//                 borderRadius: canvasFrame.borderRadius,
//               } : {})
//             }}
//             data-canvas="true"
//             onClick={() => setSelectedItem(null)}
//           >
//             {canvasImage && (
//               <>
//                 <img src={canvasImage} alt="canvas bg" className="canvas_image" />
//                 <button
//                   className="remove_image_btn"
//                   onClick={(e) => { e.stopPropagation(); setCanvasImage(null) }}
//                   title="Remove image"
//                 >
//                   <BsX />
//                 </button>
//               </>
//             )}

//             {canvasVector && VectorIcon && (
//               <DraggableCanvasItem
//                 position={canvasVector.position}
//                 onPositionChange={(pos) => setCanvasVector(prev => ({ ...prev, position: pos }))}
//                 selected={selectedItem === 'vector'}
//                 onSelect={() => setSelectedItem('vector')}
//                 onTap={() => setActiveModal('editVector')}
//               >
//                 <VectorIcon style={{ color: canvasVector.color, opacity: canvasVector.opacity, fontSize: canvasVector.size ?? 48, display: 'block' }} />
//               </DraggableCanvasItem>
//             )}

//             {canvasText && (
//               <DraggableCanvasItem
//                 position={canvasText.position}
//                 onPositionChange={(pos) => setCanvasText(prev => ({ ...prev, position: pos }))}
//                 selected={selectedItem === 'text'}
//                 onSelect={() => setSelectedItem('text')}
//                 onTap={() => setActiveModal('text')}
//               >
//                 <div
//                   style={{
//                     fontFamily: canvasText.font.family,
//                     color: canvasText.color,
//                     fontSize: canvasText.fontSize ?? 16,
//                     fontWeight: 600,
//                     textAlign: 'center',
//                     maxWidth: 180,
//                     wordBreak: 'break-word',
//                     textShadow: '0 1px 4px rgba(0,0,0,0.12)',
//                     lineHeight: 1.4,
//                     ...canvasText.font.style,
//                   }}
//                 >
//                   {canvasText.content}
//                 </div>
//               </DraggableCanvasItem>
//             )}

//             {!hasContent && (
//               <div className="canvas_empty">
//                 <BsCameraFill className="empty_icon" />
//                 <span>Your canvas</span>
//               </div>
//             )}
//           </CanvasArea>

//           {/* Toolbar */}
//           <div className="toolbar">
//             {tools.map((tool) => {
//               const isSet =
//                 (tool.id === 'image' && canvasImage) ||
//                 (tool.id === 'text' && canvasText) ||
//                 (tool.id === 'vector' && canvasVector) ||
//                 (tool.id === 'bg' && canvasBg) ||
//                 (tool.id === 'frame' && canvasFrame)
//               return (
//                 <button
//                   key={tool.id}
//                   className={`tool_btn ${isSet ? 'set' : ''}`}
//                   onClick={() => handleToolClick(tool.id)}
//                 >
//                   {tool.icon}
//                   <span>{tool.label}</span>
//                 </button>
//               )
//             })}
//           </div>

//           {/* Send / Preview */}
//           <button className={`preview_btn ${hasContent ? 'ready' : ''}`} disabled={!hasContent}>
//             {hasContent ? 'Send appreciation' : 'Preview'}
//           </button>
//         </>
//       )}

//       {activeTab === 'audio' && <AudioTab />}
//       {activeTab === 'video' && <VideoTab />}

//       {/* ── Modals ── */}
//       {activeModal === 'event' && (
//         <EventModal
//           onClose={() => setActiveModal(null)}
//           currentEvent={selectedEvent}
//           onConfirm={(ev) => { setSelectedEvent(ev); setActiveModal(null) }}
//         />
//       )}
//       {activeModal === 'image' && (
//         <ImageModal
//           onClose={() => setActiveModal(null)}
//           currentImage={canvasImage}
//           onConfirm={(src) => { setCanvasImage(src); setActiveModal(null) }}
//         />
//       )}
//       {activeModal === 'text' && (
//         <TextModal
//           onClose={() => setActiveModal(null)}
//           currentText={canvasText}
//           onConfirm={(t) => {
//             setCanvasText(prev => ({ ...t, position: prev?.position ?? { x: 50, y: 75 } }))
//             setActiveModal(null)
//           }}
//         />
//       )}
//       {activeModal === 'vector' && (
//         <VectorModal
//           onClose={() => setActiveModal(null)}
//           onConfirm={(v) => {
//             setCanvasVector({ ...v, size: 48, position: { x: 75, y: 20 } })
//             setActiveModal(null)
//           }}
//         />
//       )}
//       {activeModal === 'editVector' && canvasVector && (
//         <EditVectorModal
//           onClose={() => setActiveModal(null)}
//           vector={canvasVector}
//           onUpdate={(updates) => setCanvasVector(prev => ({ ...prev, ...updates }))}
//           onRemove={() => { setCanvasVector(null); setActiveModal(null); setSelectedItem(null) }}
//         />
//       )}
//       {activeModal === 'bg' && (
//         <BgModal
//           onClose={() => setActiveModal(null)}
//           currentBg={canvasBg}
//           onConfirm={(bg) => { setCanvasBg(bg); setActiveModal(null) }}
//         />
//       )}
//       {activeModal === 'frame' && (
//         <FrameModal
//           onClose={() => setActiveModal(null)}
//           currentFrame={canvasFrame}
//           onConfirm={(frame) => { setCanvasFrame(frame); setActiveModal(null) }}
//         />
//       )}
//     </PostCreationWrapper>
//   )
// }

// const CanvasArea = styled.div`
//   width: 100%;
//   aspect-ratio: ${({ $ratio }) => $ratio === 'portrait' ? '4 / 5' : '1 / 1'};
//   border-radius: 12px;
//   border: 1.5px solid #ECEFF3;
//   overflow: hidden;
//   position: relative;
//   transition: aspect-ratio 0.3s ease;

//   .canvas_image {
//     position: absolute;
//     inset: 0;
//     width: 100%;
//     height: 100%;
//     object-fit: cover;
//     z-index: 1;
//   }

//   .remove_image_btn {
//     position: absolute;
//     top: 8px;
//     right: 8px;
//     z-index: 5;
//     width: 26px;
//     height: 26px;
//     border-radius: 50%;
//     background: rgba(0,0,0,0.55);
//     border: none;
//     color: #fff;
//     font-size: 1em;
//     display: flex;
//     align-items: center;
//     justify-content: center;
//     cursor: pointer;
//     backdrop-filter: blur(4px);
//     transition: background 0.2s, transform 0.15s;
//     &:hover { background: rgba(239,90,66,0.85); transform: scale(1.1); }
//   }

//   .canvas_empty {
//     position: absolute;
//     inset: 0;
//     display: flex;
//     flex-direction: column;
//     align-items: center;
//     justify-content: center;
//     gap: 0.5rem;
//     color: #9CA3AF;
//     .empty_icon { font-size: 1.8em; }
//     span { font-size: 0.85em; }
//   }
// `

// const PostCreationWrapper = styled.div`
//   display: flex;
//   flex-direction: column;
//   gap: 0.75rem;
//   width: 100%;

//   .tab_switcher {
//     display: flex;
//     background: #F3F4F6;
//     border-radius: 99px;
//     padding: 4px;
//     gap: 2px;
//   }

//   .tab_btn {
//     flex: 1;
//     display: flex;
//     align-items: center;
//     justify-content: center;
//     gap: 0.4rem;
//     height: 36px;
//     border: none;
//     border-radius: 99px;
//     background: transparent;
//     color: var(--light-text-color, #6B7280);
//     font-size: 0.9em;
//     cursor: pointer;
//     transition: background 0.2s, color 0.2s;
//     &.active {
//       background: #fff;
//       color: var(--text-color, #111);
//       font-weight: 600;
//       box-shadow: 0 1px 4px rgba(0,0,0,0.08);
//     }
//     svg { font-size: 0.95em; }
//   }

//   .select_row {
//     display: flex;
//     align-items: center;
//     justify-content: space-between;
//     padding: 0 1rem;
//     height: 50px;
//     background: #F9FAFB;
//     border-radius: 10px;
//     border: 1.5px solid #ECEFF3;
//     cursor: pointer;
//     transition: border-color 0.2s;
//     &:hover { border-color: var(--primary-color); }
//     .select_placeholder { font-size: 0.95em; color: #9CA3AF; flex: 1; }
//     .select_event_emoji { font-size: 1.1em; margin-right: 0.5rem; flex-shrink: 0; }
//     .select_value { flex: 1; font-size: 0.95em; font-weight: 500; color: var(--text-color, #111); }
//     .select_arrow { color: #9CA3AF; font-size: 0.9em; flex-shrink: 0; }
//   }

//   .input_row {
//     .send_input {
//       width: 100%;
//       height: 50px;
//       padding: 0 1rem;
//       background: #F9FAFB;
//       border: 1.5px solid #ECEFF3;
//       border-radius: 10px;
//       font-size: 0.95em;
//       color: var(--text-color, #111);
//       outline: none;
//       transition: border-color 0.2s;
//       box-sizing: border-box;
//       &::placeholder { color: #9CA3AF; }
//       &:focus { border-color: var(--primary-color); background: #fff; }
//     }
//   }

//   .aspect_row {
//     display: flex;
//     align-items: center;
//     gap: 0.5rem;
//     padding: 0 0.25rem;

//     .aspect_label {
//       flex: 1;
//       font-size: 0.95em;
//       color: var(--text-color, #111);
//       font-weight: 500;
//     }

//     .ratio_toggles {
//       display: flex;
//       gap: 6px;
//       align-items: center;
//     }

//     .ratio_btn {
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       border: 1.5px solid #ECEFF3;
//       background: #F9FAFB;
//       cursor: pointer;
//       color: var(--primary-color);
//       font-size: 0.8em;
//       border-radius: 5px;
//       transition: border-color 0.2s, background 0.2s;

//       &.square_btn  { width: 28px; height: 28px; }
//       &.portrait_btn { width: 22px; height: 28px; }

//       &.active {
//         border-color: var(--primary-color);
//         background: rgba(239,90,66,0.06);
//       }
//       &:hover:not(.active) { border-color: #D1D5DB; }
//     }
//   }

//   .toolbar {
//     display: flex;
//     gap: 6px;

//     .tool_btn {
//       flex: 1;
//       display: flex;
//       flex-direction: column;
//       align-items: center;
//       justify-content: center;
//       gap: 4px;
//       padding: 0.6rem 0.25rem;
//       background: transparent;
//       border: 1.5px dashed #D1D5DB;
//       border-radius: 10px;
//       color: var(--light-text-color, #6B7280);
//       font-size: 0.75em;
//       cursor: pointer;
//       transition: border-color 0.2s, color 0.2s, background 0.2s;
//       svg { font-size: 1.2em; }
//       &:hover { border-color: var(--primary-color); color: var(--primary-color); }
//       &.set {
//         border-style: solid;
//         border-color: var(--primary-color);
//         color: var(--primary-color);
//         background: rgba(239,90,66,0.04);
//       }
//     }
//   }

//   .preview_btn {
//     width: 100%;
//     height: 50px;
//     border: none;
//     border-radius: 25px;
//     background: var(--primary-color, #EF5A42);
//     color: #fff;
//     font-size: 1em;
//     font-weight: 600;
//     cursor: not-allowed;
//     opacity: 0.4;
//     transition: opacity 0.2s;
//     &.ready { opacity: 1; cursor: pointer; &:hover { opacity: 0.88; } }
//   }
// `

// // ─── Post Message Page ────────────────────────────────────────────────────────

// const PostMessagePage = ({ onClose }) => {
//   useFonts()

//   return (
//     <Wrapper>
//       <div className="page_header">
//         <button className="close_btn" onClick={onClose}><BsX /></button>
//         <h2 className="page_title">Board your appreciation</h2>
//         <div className="tier_badge">Free Tier</div>
//       </div>

//       <div className="page_body">
//         <div className="setup_outline">
//           <PostCreationComponent type="board" />
//         </div>
//       </div>
//     </Wrapper>
//   )
// }

// const Wrapper = styled.div`
//   width: 100vw;
//   min-height: 100vh;
//   display: flex;
//   flex-direction: column;
//   background: var(--bg-color, #F7F5F0);

//   .page_header {
//     position: sticky;
//     top: 0;
//     z-index: 10;
//     width: 100%;
//     height: 64px;
//     display: flex;
//     align-items: center;
//     justify-content: space-between;
//     padding: 0 1.5rem;
//     background: var(--bg-color, #F7F5F0);
//     border-bottom: 1px solid rgba(0,0,0,0.06);
//     box-sizing: border-box;
//   }

//   .close_btn {
//     width: 36px;
//     height: 36px;
//     border-radius: 50%;
//     border: 1.5px solid #ECEFF3;
//     background: transparent;
//     display: flex;
//     align-items: center;
//     justify-content: center;
//     font-size: 1.3em;
//     color: var(--text-color, #111);
//     cursor: pointer;
//     transition: border-color 0.2s, color 0.2s;
//     &:hover { border-color: var(--primary-color); color: var(--primary-color); }
//   }

//   .page_title {
//     font-size: 1.1em;
//     font-weight: 700;
//     color: var(--text-color, #111);
//     margin: 0;
//     position: absolute;
//     left: 50%;
//     transform: translateX(-50%);
//   }

//   .tier_badge {
//     padding: 0.35rem 1rem;
//     border-radius: 99px;
//     border: 1.5px solid #ECEFF3;
//     background: #fff;
//     font-size: 0.85em;
//     font-weight: 500;
//     color: var(--text-color, #111);
//     white-space: nowrap;
//   }

//   .page_body {
//     flex: 1;
//     display: flex;
//     flex-direction: column;
//     align-items: center;
//     padding: 2rem 1rem 4rem;
//     overflow-y: auto;
//   }

//   .setup_outline {
//     width: 100%;
//     max-width: 480px;
//     background: #fff;
//     border-radius: 16px;
//     display: flex;
//     flex-direction: column;
//     padding: 1.5rem;
//     gap: 1rem;
//     box-shadow: 0 4px 24px rgba(0,0,0,0.06);
//   }

//   @media only screen and (min-width: 768px) {
//     .setup_outline { padding: 2rem; }
//     .page_body { justify-content: center; }
//   }
// `

// export default PostMessagePage


// import React, { useState, useRef, useEffect, useCallback } from 'react'
// import styled from 'styled-components'
// import {
//   BsX, BsPencil, BsMic, BsCameraVideo,
//   BsImage, BsTypeBold, BsBezier2, BsPalette2, BsBorderOuter,
//   BsPerson, BsLayoutWtf, BsCheck2, BsChevronRight,
//   BsChevronDown, BsChevronUp, BsCheckLg,
//   BsHeart, BsHandThumbsUp, BsEmojiSmile, BsStar,
//   BsSun, BsFire, BsMusicNote, BsMusicNoteBeamed,
//   BsHeadphones, BsTrophy, BsBalloon, BsGift,
//   BsDiamond, BsAward, BsClock, BsBriefcase,
//   BsCameraFill, BsSearch, BsUpload, BsCheckCircleFill,
// } from 'react-icons/bs'
// import { useDispatch, useSelector } from 'react-redux'
// import { createBoard } from '../../slices/boardSlice'
// import { postMessage } from '../../slices/messageSlice'
// import { uploadFile } from '../../slices/uploadSlice'
// import { createBoardUpgrade, CAPACITY_OPTIONS, PRIVACY_OPTIONS } from '../../slices/boardPaymentSlice'

// // ─── Google Fonts Injection ──────────────────────────────────────────────────

// const useFonts = () => {
//   useEffect(() => {
//     const link = document.createElement('link')
//     link.rel = 'stylesheet'
//     link.href =
//       'https://fonts.googleapis.com/css2?family=Anton&family=Anaheim&family=Inter:wght@400;600&family=Playfair+Display:ital@0;1&family=Pacifico&display=swap'
//     document.head.appendChild(link)
//     return () => { document.head.removeChild(link) }
//   }, [])
// }

// // ─── Constants ───────────────────────────────────────────────────────────────

// const FONTS = [
//   { label: 'Playfair Display', family: "'Playfair Display', serif",  style: { fontStyle: 'italic' } },
//   { label: 'Inter',            family: "'Inter', sans-serif",         style: {} },
//   { label: 'Anton',            family: "'Anton', sans-serif",         style: { fontWeight: 900 } },
//   { label: 'Anaheim',          family: "'Anaheim', sans-serif",       style: {} },
//   { label: 'Pacifico',         family: "'Pacifico', cursive",         style: {} },
//   { label: 'Impact',           family: 'Impact, sans-serif',          style: { fontWeight: 900 } },
//   { label: 'Brush Script MT',  family: "'Brush Script MT', cursive",  style: {} },
//   { label: 'Georgia',          family: 'Georgia, serif',              style: {} },
// ]

// const VECTOR_ICONS = [
//   { id: 'heart',     label: 'Heart',     icon: BsHeart },
//   { id: 'thumbsup',  label: 'Thumbs Up', icon: BsHandThumbsUp },
//   { id: 'smile',     label: 'Smile',     icon: BsEmojiSmile },
//   { id: 'star',      label: 'Star',      icon: BsStar },
//   { id: 'sun',       label: 'Sun',       icon: BsSun },
//   { id: 'fire',      label: 'Fire',      icon: BsFire },
//   { id: 'music',     label: 'Music',     icon: BsMusicNote },
//   { id: 'music2',    label: 'Music 2',   icon: BsMusicNoteBeamed },
//   { id: 'headphones',label: 'Headphones',icon: BsHeadphones },
//   { id: 'trophy',    label: 'Trophy',    icon: BsTrophy },
//   { id: 'balloon',   label: 'Balloon',   icon: BsBalloon },
//   { id: 'gift',      label: 'Gift',      icon: BsGift },
//   { id: 'diamond',   label: 'Diamond',   icon: BsDiamond },
//   { id: 'award',     label: 'Award',     icon: BsAward },
//   { id: 'clock',     label: 'Clock',     icon: BsClock },
//   { id: 'briefcase', label: 'Briefcase', icon: BsBriefcase },
// ]

// const BG_OPTIONS = [
//   { id: 'bg1',  label: 'Marble',    value: 'linear-gradient(135deg, #f5f5f0 0%, #e8e4df 50%, #f0ede8 100%)' },
//   { id: 'bg2',  label: 'Lines',     value: 'repeating-linear-gradient(0deg, #f9f9f9 0px, #f9f9f9 18px, #e5e5e5 18px, #e5e5e5 20px)' },
//   { id: 'bg3',  label: 'Sky',       value: 'linear-gradient(180deg, #dbeafe 0%, #eff6ff 100%)' },
//   { id: 'bg4',  label: 'Dusk',      value: 'linear-gradient(135deg, #3d2c1e 0%, #6b4226 50%, #3d2c1e 100%)' },
//   { id: 'bg5',  label: 'Sand',      value: 'linear-gradient(135deg, #e8d5b0 0%, #d4b896 50%, #e8d5b0 100%)' },
//   { id: 'bg6',  label: 'Blush',     value: 'linear-gradient(135deg, #fce4ec 0%, #f8bbd0 100%)' },
//   { id: 'bg7',  label: 'Mint',      value: 'linear-gradient(135deg, #e0f2f1 0%, #b2dfdb 100%)' },
//   { id: 'bg8',  label: 'Lavender',  value: 'linear-gradient(135deg, #ede7f6 0%, #d1c4e9 100%)' },
//   { id: 'bg9',  label: 'Peach',     value: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)' },
//   { id: 'bg10', label: 'Forest',    value: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)' },
//   { id: 'bg11', label: 'Ocean',     value: 'linear-gradient(135deg, #e1f5fe 0%, #b3e5fc 100%)' },
//   { id: 'bg12', label: 'Sunset',    value: 'linear-gradient(135deg, #fff9c4 0%, #ffccbc 50%, #f8bbd0 100%)' },
//   { id: 'bg13', label: 'Night',     value: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' },
//   { id: 'bg14', label: 'Rose Gold', value: 'linear-gradient(135deg, #f4c2c2 0%, #e8a598 50%, #d4846a 100%)' },
//   { id: 'bg15', label: 'Arctic',    value: 'linear-gradient(135deg, #f0f4ff 0%, #dce8ff 100%)' },
//   { id: 'bg16', label: 'Cream',     value: 'linear-gradient(135deg, #fffef7 0%, #faf8ee 100%)' },
// ]

// const SWATCHES = ['#111111','#EF5A42','#3B82F6','#10B981','#F59E0B','#8B5CF6','#EC4899','#FFFFFF']

// // ─── Shared Styled Shells ─────────────────────────────────────────────────────

// const ModalBackdrop = styled.div`
//   position: fixed;
//   inset: 0;
//   background: rgba(0,0,0,0.5);
//   z-index: 100;
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   padding: 1rem;
// `

// const ModalBox = styled.div`
//   background: #fff;
//   border-radius: 20px;
//   width: 100%;
//   max-width: 380px;
//   padding: 1.5rem;
//   display: flex;
//   flex-direction: column;
//   gap: 0.85rem;
//   max-height: 88vh;
//   overflow-y: auto;

//   .modal_header {
//     display: flex;
//     align-items: center;
//     justify-content: space-between;
//     margin-bottom: 0.15rem;

//     h3 {
//       font-size: 1.1em;
//       font-weight: 700;
//       color: var(--text-color, #111);
//       margin: 0;
//     }

//     .modal_close {
//       width: 30px;
//       height: 30px;
//       border-radius: 50%;
//       border: 1.5px solid #ECEFF3;
//       background: transparent;
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       font-size: 1.1em;
//       cursor: pointer;
//       color: var(--text-color, #111);
//       transition: border-color 0.2s;
//       &:hover { border-color: var(--primary-color, #EF5A42); color: var(--primary-color, #EF5A42); }
//     }
//   }

//   .modal_continue {
//     width: 100%;
//     height: 50px;
//     border: none;
//     border-radius: 25px;
//     background: var(--primary-color, #EF5A42);
//     color: #fff;
//     font-size: 1em;
//     font-weight: 600;
//     cursor: pointer;
//     transition: opacity 0.2s;
//     flex-shrink: 0;
//     &:hover { opacity: 0.88; }
//     &:disabled { opacity: 0.4; cursor: not-allowed; }
//   }
// `

// const AccordionRow = styled.button`
//   width: 100%;
//   display: flex;
//   align-items: center;
//   justify-content: space-between;
//   padding: 0.85rem 1rem;
//   border-radius: 10px;
//   background: #F9FAFB;
//   border: 1.5px solid #ECEFF3;
//   font-size: 0.95em;
//   font-weight: 500;
//   color: var(--text-color, #111);
//   cursor: pointer;
//   transition: border-color 0.2s;
//   &:hover { border-color: var(--primary-color, #EF5A42); }
//   svg { color: #9CA3AF; font-size: 0.9em; }
// `

// const ColorSection = styled.div`
//   padding: 0.75rem;
//   background: #FAFAFA;
//   border-radius: 10px;
//   border: 1.5px solid #ECEFF3;
//   display: flex;
//   flex-direction: column;
//   gap: 0.75rem;

//   .swatches {
//     display: flex;
//     flex-wrap: wrap;
//     gap: 14px;
//     padding: 6px 4px;
//   }

//   .swatch {
//     width: 26px;
//     height: 26px;
//     border-radius: 50%;
//     cursor: pointer;
//     display: flex;
//     align-items: center;
//     justify-content: center;
//     flex-shrink: 0;
//     transition: transform 0.15s, box-shadow 0.15s;
//     &.active {
//       box-shadow: 0 0 0 2.5px #fff, 0 0 0 4.5px var(--primary-color, #EF5A42);
//     }
//     &:hover:not(.active) { transform: scale(1.12); }
//   }

//   .custom_color_row {
//     display: flex;
//     align-items: center;
//     justify-content: space-between;
//     padding: 0 0.25rem;
//     label { font-size: 0.9em; color: var(--light-text-color, #6B7280); }
//     input[type="color"] {
//       width: 36px;
//       height: 36px;
//       border-radius: 8px;
//       border: 1.5px solid #ECEFF3;
//       background: none;
//       cursor: pointer;
//       padding: 2px;
//     }
//   }
// `

// const SearchInput = styled.div`
//   display: flex;
//   align-items: center;
//   gap: 0.5rem;
//   padding: 0 1rem;
//   height: 44px;
//   background: #F3F4F6;
//   border-radius: 99px;
//   border: 1.5px solid transparent;
//   transition: border-color 0.2s;
//   &:focus-within { border-color: var(--primary-color, #EF5A42); background: #fff; }
//   .search_icon { color: #9CA3AF; font-size: 0.95em; flex-shrink: 0; }
//   input {
//     flex: 1;
//     border: none;
//     background: transparent;
//     outline: none;
//     font-size: 0.95em;
//     color: var(--text-color, #111);
//     &::placeholder { color: #9CA3AF; }
//   }
// `

// // ─── Image Modal ─────────────────────────────────────────────────────────────

// const ImageModal = ({ onClose, onConfirm, currentImage }) => {
//   const [previewSrc, setPreviewSrc] = useState(currentImage || null)
//   const [rawFile, setRawFile]       = useState(null)
//   const fileRef = useRef()

//   const handleFile = (e) => {
//     const file = e.target.files[0]
//     if (!file) return
//     setRawFile(file)
//     const reader = new FileReader()
//     reader.onload = (ev) => setPreviewSrc(ev.target.result)
//     reader.readAsDataURL(file)
//   }

//   return (
//     <ModalBackdrop onClick={onClose}>
//       <ModalBox onClick={(e) => e.stopPropagation()}>
//         <div className="modal_header">
//           <h3>Image</h3>
//           <button className="modal_close" onClick={onClose}><BsX /></button>
//         </div>

//         <ImagePreviewBox onClick={() => fileRef.current.click()}>
//           {previewSrc
//             ? <img src={previewSrc} alt="preview" />
//             : <div className="placeholder">
//                 <BsImage className="ph_icon" />
//                 <span>Preview image here</span>
//               </div>
//           }
//         </ImagePreviewBox>

//         <input type="file" accept="image/*" ref={fileRef} style={{ display: 'none' }} onChange={handleFile} />

//         <UploadRowBtn onClick={() => fileRef.current.click()}>
//           <BsUpload />
//           <span>Upload Image</span>
//         </UploadRowBtn>

//         <button className="modal_continue" disabled={!previewSrc} onClick={() => onConfirm(previewSrc, rawFile)}>
//           Continue
//         </button>
//       </ModalBox>
//     </ModalBackdrop>
//   )
// }

// const ImagePreviewBox = styled.div`
//   width: 100%;
//   aspect-ratio: 1;
//   border-radius: 12px;
//   background: #F3F4F6;
//   overflow: hidden;
//   cursor: pointer;
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   img { width: 100%; height: 100%; object-fit: cover; }
//   .placeholder {
//     display: flex;
//     flex-direction: column;
//     align-items: center;
//     gap: 0.5rem;
//     color: #9CA3AF;
//     .ph_icon { font-size: 1.6em; }
//     span { font-size: 0.9em; }
//   }
// `

// const UploadRowBtn = styled.button`
//   width: 100%;
//   height: 50px;
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   gap: 0.5rem;
//   border: 1.5px solid #ECEFF3;
//   border-radius: 12px;
//   background: #FAFAFA;
//   font-size: 0.95em;
//   color: var(--text-color, #111);
//   cursor: pointer;
//   transition: border-color 0.2s;
//   &:hover { border-color: var(--primary-color, #EF5A42); }
// `

// // ─── Text Modal ──────────────────────────────────────────────────────────────

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
//               min="10"
//               max="48"
//               step="1"
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

// // ─── Vector Modal ─────────────────────────────────────────────────────────────

// const VectorModal = ({ onClose, onConfirm }) => {
//   const [search, setSearch]     = useState('')
//   const [selected, setSelected] = useState(null)

//   const filtered = VECTOR_ICONS.filter(v =>
//     v.label.toLowerCase().includes(search.toLowerCase())
//   )

//   return (
//     <ModalBackdrop onClick={onClose}>
//       <ModalBox onClick={(e) => e.stopPropagation()}>
//         <div className="modal_header">
//           <h3>Vector</h3>
//           <button className="modal_close" onClick={onClose}><BsX /></button>
//         </div>

//         <SearchInput>
//           <BsSearch className="search_icon" />
//           <input placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
//         </SearchInput>

//         <VectorGrid>
//           {filtered.map((v) => {
//             const Icon = v.icon
//             return (
//               <div
//                 key={v.id}
//                 className={`vector_cell ${selected?.id === v.id ? 'active' : ''}`}
//                 onClick={() => setSelected(v)}
//               >
//                 <Icon />
//               </div>
//             )
//           })}
//         </VectorGrid>

//         <button
//           className="modal_continue"
//           disabled={!selected}
//           onClick={() => onConfirm({ ...selected, color: '#2d3748', opacity: 1 })}
//         >
//           Continue
//         </button>
//       </ModalBox>
//     </ModalBackdrop>
//   )
// }

// const VectorGrid = styled.div`
//   display: grid;
//   grid-template-columns: repeat(4, 1fr);
//   gap: 8px;

//   .vector_cell {
//     aspect-ratio: 1;
//     background: #F3F4F6;
//     border-radius: 12px;
//     display: flex;
//     align-items: center;
//     justify-content: center;
//     font-size: 1.6em;
//     color: var(--text-color, #2d3748);
//     cursor: pointer;
//     border: 2px solid transparent;
//     transition: border-color 0.2s, background 0.2s;
//     &:hover { background: #E9ECEF; }
//     &.active {
//       border-color: var(--primary-color, #EF5A42);
//       background: rgba(239,90,66,0.06);
//     }
//   }
// `

// // ─── Edit Vector Modal ────────────────────────────────────────────────────────

// const EditVectorModal = ({ onClose, vector, onUpdate, onRemove }) => {
//   const [opacity, setOpacity]     = useState(vector.opacity ?? 1)
//   const [color, setColor]         = useState(vector.color ?? '#2d3748')
//   const [size, setSize]           = useState(vector.size ?? 48)
//   const [colorOpen, setColorOpen] = useState(false)
//   const Icon = vector.icon

//   return (
//     <ModalBackdrop onClick={onClose}>
//       <ModalBox onClick={(e) => e.stopPropagation()}>
//         <div className="modal_header">
//           <h3>Edit Vector</h3>
//           <button className="modal_close" onClick={onClose}><BsX /></button>
//         </div>

//         <VectorPreviewBox>
//           <Icon style={{ color, opacity, fontSize: size }} />
//         </VectorPreviewBox>

//         <OpacityRow>
//           <span className="label">Size</span>
//           <div className="slider_wrap">
//             <input
//               type="range"
//               min="20"
//               max="120"
//               step="4"
//               value={size}
//               onChange={(e) => setSize(Number(e.target.value))}
//             />
//           </div>
//           <span className="val">{size}px</span>
//         </OpacityRow>

//         <OpacityRow>
//           <span className="label">Opacity</span>
//           <div className="slider_wrap">
//             <input
//               type="range"
//               min="0.1"
//               max="1"
//               step="0.05"
//               value={opacity}
//               onChange={(e) => setOpacity(parseFloat(e.target.value))}
//             />
//           </div>
//           <span className="val">{Math.round(opacity * 100)}%</span>
//         </OpacityRow>

//         <AccordionRow onClick={() => setColorOpen(o => !o)}>
//           <span>Choose Colour</span>
//           {colorOpen ? <BsChevronUp /> : <BsChevronDown />}
//         </AccordionRow>

//         {colorOpen && (
//           <ColorSection>
//             <div className="swatches">
//               {['#2d3748','#EF5A42','#3B82F6','#10B981','#F59E0B','#8B5CF6','#EC4899','#FFFFFF'].map((c) => (
//                 <div
//                   key={c}
//                   className={`swatch ${color === c ? 'active' : ''}`}
//                   style={{ background: c, border: c === '#FFFFFF' ? '1.5px solid #E5E7EB' : 'none' }}
//                   onClick={() => setColor(c)}
//                 >
//                   {color === c && (
//                     <BsCheck2 style={{ color: c === '#FFFFFF' || c === '#F59E0B' ? '#333' : '#fff', fontSize: '0.75em' }} />
//                   )}
//                 </div>
//               ))}
//             </div>
//             <div className="custom_color_row">
//               <label>Custom colour</label>
//               <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
//             </div>
//           </ColorSection>
//         )}

//         <button
//           className="modal_continue"
//           onClick={() => { onUpdate({ color, opacity, size }); onClose() }}
//         >
//           Save Changes
//         </button>

//         <RemoveBtn onClick={onRemove}>
//           Remove Vector
//         </RemoveBtn>
//       </ModalBox>
//     </ModalBackdrop>
//   )
// }

// const VectorPreviewBox = styled.div`
//   width: 100%;
//   aspect-ratio: 16/9;
//   border-radius: 12px;
//   background: #F3F4F6;
//   display: flex;
//   align-items: center;
//   justify-content: center;
// `

// const OpacityRow = styled.div`
//   display: flex;
//   align-items: center;
//   gap: 0.75rem;

//   .label {
//     font-size: 0.9em;
//     font-weight: 500;
//     color: var(--text-color, #111);
//     white-space: nowrap;
//     min-width: 52px;
//   }

//   .val {
//     font-size: 0.8em;
//     color: var(--light-text-color, #6B7280);
//     min-width: 36px;
//     text-align: right;
//   }

//   .slider_wrap { flex: 1; }

//   input[type="range"] {
//     -webkit-appearance: none;
//     appearance: none;
//     width: 100%;
//     height: 6px;
//     border-radius: 3px;
//     background: #E5E7EB;
//     outline: none;
//     cursor: pointer;

//     &::-webkit-slider-thumb {
//       -webkit-appearance: none;
//       appearance: none;
//       width: 20px;
//       height: 20px;
//       border-radius: 50%;
//       background: #F59E0B;
//       cursor: pointer;
//       box-shadow: 0 2px 6px rgba(0,0,0,0.2);
//     }
//   }
// `

// const RemoveBtn = styled.button`
//   width: 100%;
//   height: 44px;
//   background: transparent;
//   border: 1.5px solid #ECEFF3;
//   border-radius: 22px;
//   cursor: pointer;
//   font-size: 0.95em;
//   color: #9CA3AF;
//   transition: border-color 0.2s, color 0.2s;
//   &:hover { border-color: #EF5A42; color: #EF5A42; }
// `

// // ─── Background Modal ─────────────────────────────────────────────────────────

// const BgModal = ({ onClose, onConfirm, onRemove, currentBg }) => {
//   const [search, setSearch]     = useState('')
//   const [selected, setSelected] = useState(currentBg || null)

//   const filtered = BG_OPTIONS.filter(b =>
//     b.label.toLowerCase().includes(search.toLowerCase())
//   )

//   const handleCellClick = (bg) => {
//     // clicking the already-selected bg toggles it off
//     setSelected(prev => prev?.id === bg.id ? null : bg)
//   }

//   return (
//     <ModalBackdrop onClick={onClose}>
//       <ModalBox onClick={(e) => e.stopPropagation()}>
//         <div className="modal_header">
//           <h3>Background</h3>
//           <button className="modal_close" onClick={onClose}><BsX /></button>
//         </div>

//         <SearchInput>
//           <BsSearch className="search_icon" />
//           <input placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
//         </SearchInput>

//         <BgGrid>
//           {filtered.map((bg) => (
//             <div
//               key={bg.id}
//               className={`bg_cell ${selected?.id === bg.id ? 'active' : ''}`}
//               style={{ background: bg.value }}
//               onClick={() => handleCellClick(bg)}
//             >
//               {selected?.id === bg.id && (
//                 <div className="bg_check"><BsX /></div>
//               )}
//             </div>
//           ))}
//         </BgGrid>

//         <button
//           className="modal_continue"
//           onClick={() => onConfirm(selected)}
//         >
//           {selected ? 'Apply Background' : 'Remove Background'}
//         </button>
//       </ModalBox>
//     </ModalBackdrop>
//   )
// }

// const BgGrid = styled.div`
//   display: grid;
//   grid-template-columns: repeat(4, 1fr);
//   gap: 8px;

//   .bg_cell {
//     aspect-ratio: 1;
//     border-radius: 10px;
//     cursor: pointer;
//     border: 2px solid transparent;
//     position: relative;
//     overflow: hidden;
//     transition: transform 0.15s, border-color 0.2s;
//     &:hover { transform: scale(1.04); }
//     &.active { border-color: var(--primary-color, #EF5A42); }

//     .bg_check {
//       position: absolute;
//       bottom: 4px;
//       right: 4px;
//       width: 18px;
//       height: 18px;
//       border-radius: 50%;
//       background: var(--primary-color, #EF5A42);
//       color: #fff;
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       font-size: 0.8em;
//     }
//   }
// `

// // ─── Frame Modal ──────────────────────────────────────────────────────────────

// const FRAME_STYLES = [
//   { id: 'solid',  label: 'Solid' },
//   { id: 'dashed', label: 'Dashed' },
//   { id: 'dotted', label: 'Dotted' },
//   { id: 'double', label: 'Double' },
// ]

// const FRAME_SWATCHES = ['#111111','#EF5A42','#3B82F6','#10B981','#F59E0B','#8B5CF6','#EC4899','#FFFFFF']

// const FrameModal = ({ onClose, onConfirm, currentFrame }) => {
//   const [style,     setStyle]     = useState(currentFrame?.style     ?? 'solid')
//   const [thickness, setThickness] = useState(currentFrame?.thickness ?? 4)
//   const [radius,    setRadius]    = useState(currentFrame?.radius    ?? 0)
//   const [color,     setColor]     = useState(currentFrame?.color     ?? '#111111')
//   const [colorOpen, setColorOpen] = useState(false)

//   const previewBorder = `${thickness}px ${style} ${color}`
//   const previewRadius = `${radius}px`

//   const frame = { style, thickness, radius, color,
//     border: previewBorder, borderRadius: previewRadius }

//   return (
//     <ModalBackdrop onClick={onClose}>
//       <ModalBox onClick={(e) => e.stopPropagation()}>
//         <div className="modal_header">
//           <h3>Frame</h3>
//           <button className="modal_close" onClick={onClose}><BsX /></button>
//         </div>

//         {/* Live Preview */}
//         <FramePreview style={{ border: previewBorder, borderRadius: previewRadius }} />

//         {/* Style Pills */}
//         <FrameSection>
//           <span className="section_label">Style</span>
//           <div className="style_pills">
//             {FRAME_STYLES.map(s => (
//               <button
//                 key={s.id}
//                 className={`style_pill ${style === s.id ? 'active' : ''}`}
//                 onClick={() => setStyle(s.id)}
//               >
//                 {s.label}
//               </button>
//             ))}
//           </div>
//         </FrameSection>

//         {/* Thickness */}
//         <OpacityRow>
//           <span className="label">Thickness</span>
//           <div className="slider_wrap">
//             <input
//               type="range" min="1" max="20" step="1"
//               value={thickness}
//               onChange={(e) => setThickness(Number(e.target.value))}
//             />
//           </div>
//           <span className="val">{thickness}px</span>
//         </OpacityRow>

//         {/* Radius */}
//         <OpacityRow>
//           <span className="label">Radius</span>
//           <div className="slider_wrap">
//             <input
//               type="range" min="0" max="48" step="2"
//               value={radius}
//               onChange={(e) => setRadius(Number(e.target.value))}
//             />
//           </div>
//           <span className="val">{radius}px</span>
//         </OpacityRow>

//         {/* Color */}
//         <AccordionRow onClick={() => setColorOpen(o => !o)}>
//           <span>Colour</span>
//           <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
//             <span style={{
//               width: 16, height: 16, borderRadius: '50%',
//               background: color,
//               border: color === '#FFFFFF' ? '1.5px solid #E5E7EB' : 'none',
//               display: 'inline-block', flexShrink: 0,
//             }} />
//             {colorOpen ? <BsChevronUp /> : <BsChevronDown />}
//           </div>
//         </AccordionRow>

//         {colorOpen && (
//           <ColorSection>
//             <div className="swatches">
//               {FRAME_SWATCHES.map(c => (
//                 <div
//                   key={c}
//                   className={`swatch ${color === c ? 'active' : ''}`}
//                   style={{ background: c, border: c === '#FFFFFF' ? '1.5px solid #E5E7EB' : 'none' }}
//                   onClick={() => setColor(c)}
//                 >
//                   {color === c && (
//                     <BsCheck2 style={{ color: c === '#FFFFFF' || c === '#F59E0B' ? '#333' : '#fff', fontSize: '0.75em' }} />
//                   )}
//                 </div>
//               ))}
//             </div>
//             <div className="custom_color_row">
//               <label>Custom colour</label>
//               <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
//             </div>
//           </ColorSection>
//         )}

//         <button className="modal_continue" onClick={() => onConfirm(frame)}>
//           Apply Frame
//         </button>

//         {currentFrame && (
//           <RemoveBtn onClick={() => onConfirm(null)}>
//             Remove Frame
//           </RemoveBtn>
//         )}
//       </ModalBox>
//     </ModalBackdrop>
//   )
// }

// const FramePreview = styled.div`
//   width: 100%;
//   aspect-ratio: 4/3;
//   background: #F3F4F6;
//   transition: border 0.15s, border-radius 0.15s;
// `

// const FrameSection = styled.div`
//   display: flex;
//   flex-direction: column;
//   gap: 0.5rem;

//   .section_label {
//     font-size: 0.9em;
//     font-weight: 500;
//     color: var(--text-color, #111);
//   }

//   .style_pills {
//     display: flex;
//     gap: 6px;
//   }

//   .style_pill {
//     flex: 1;
//     height: 36px;
//     border-radius: 99px;
//     border: 1.5px solid #ECEFF3;
//     background: #F9FAFB;
//     font-size: 0.82em;
//     font-weight: 500;
//     color: var(--light-text-color, #6B7280);
//     cursor: pointer;
//     transition: border-color 0.2s, color 0.2s, background 0.2s;

//     &.active {
//       border-color: var(--primary-color, #EF5A42);
//       color: var(--primary-color, #EF5A42);
//       background: rgba(239,90,66,0.06);
//     }
//     &:hover:not(.active) { border-color: #D1D5DB; }
//   }
// `

// // ─── Decision Component ───────────────────────────────────────────────────────

// const DecisionComponent = ({ selected, setSelected }) => {
//   const options = [
//     {
//       id: 'board',
//       label: 'Create a Board',
//       icon: <BsLayoutWtf />,
//       features: [
//         'Let multiple people contribute messages',
//         'Curate a collection of appreciations',
//         'Perfect for group celebrations',
//       ],
//     },
//     {
//       id: 'direct',
//       label: 'Direct Message',
//       icon: <BsPerson />,
//       features: [
//         'Send a personal message directly',
//         'Private one-to-one appreciation',
//       ],
//     },
//   ]

//   return (
//     <DecisionWrapper>
//       {options.map((opt) => (
//         <div
//           key={opt.id}
//           className={`option_card ${selected === opt.id ? 'active' : ''}`}
//           onClick={() => setSelected(opt.id)}
//         >
//           <div className="option_header">
//             <div className={`icon_circle ${selected === opt.id ? 'active' : ''}`}>
//               {opt.icon}
//             </div>
//             <span className="option_label">{opt.label}</span>
//             <div className={`radio ${selected === opt.id ? 'active' : ''}`}>
//               {selected === opt.id && <div className="radio_dot" />}
//             </div>
//           </div>
//           <ul className="feature_list">
//             {opt.features.map((f, i) => (
//               <li key={i} className="feature_item">
//                 <BsCheckLg className="check" />
//                 <span>{f}</span>
//               </li>
//             ))}
//           </ul>
//         </div>
//       ))}
//     </DecisionWrapper>
//   )
// }

// const DecisionWrapper = styled.div`
//   display: flex;
//   flex-direction: column;
//   gap: 0.75rem;

//   .option_card {
//     border-radius: 12px;
//     border: 1.5px solid #ECEFF3;
//     padding: 1rem 1.2rem;
//     cursor: pointer;
//     background: #FAFAFA;
//     transition: border-color 0.2s, background 0.2s;
//     &.active {
//       border-color: var(--primary-color);
//       background: rgba(239,90,66,0.04);
//     }
//     &:hover:not(.active) { border-color: var(--primary-color); }
//   }

//   .option_header {
//     display: flex;
//     align-items: center;
//     gap: 0.75rem;
//     margin-bottom: 0.75rem;
//   }

//   .icon_circle {
//     width: 36px;
//     height: 36px;
//     border-radius: 50%;
//     background: #F3F4F6;
//     color: var(--light-text-color, #6B7280);
//     display: flex;
//     align-items: center;
//     justify-content: center;
//     font-size: 1.1em;
//     transition: background 0.2s, color 0.2s;
//     flex-shrink: 0;
//     &.active { background: var(--primary-color); color: #fff; }
//   }

//   .option_label {
//     flex: 1;
//     font-size: 1em;
//     font-weight: 600;
//     color: var(--text-color, #111);
//   }

//   .radio {
//     width: 20px;
//     height: 20px;
//     border-radius: 50%;
//     border: 2px solid #D1D5DB;
//     display: flex;
//     align-items: center;
//     justify-content: center;
//     flex-shrink: 0;
//     transition: border-color 0.2s;
//     &.active { border-color: var(--primary-color); }

//     .radio_dot {
//       width: 10px;
//       height: 10px;
//       border-radius: 50%;
//       background: var(--primary-color);
//     }
//   }

//   .feature_list {
//     list-style: none;
//     padding: 0;
//     margin: 0;
//     display: flex;
//     flex-direction: column;
//     gap: 0.4rem;
//   }

//   .feature_item {
//     display: flex;
//     align-items: center;
//     gap: 0.5rem;
//     font-size: 0.9em;
//     color: var(--light-text-color, #6B7280);
//     .check { font-size: 0.8em; flex-shrink: 0; }
//   }
// `

// // ─── Draggable Canvas Item ────────────────────────────────────────────────────

// const DraggableCanvasItem = ({ position, onPositionChange, onTap, selected, onSelect, children }) => {
//   const elRef       = useRef(null)
//   const dragRef     = useRef({ dragging: false, startX: 0, startY: 0, origX: 0, origY: 0, moved: false })

//   const getClientXY = (e) => {
//     if (e.touches) return { cx: e.touches[0].clientX, cy: e.touches[0].clientY }
//     return { cx: e.clientX, cy: e.clientY }
//   }

//   const onPointerDown = (e) => {
//     e.stopPropagation()
//     onSelect()
//     const { cx, cy } = getClientXY(e)
//     dragRef.current = { dragging: true, startX: cx, startY: cy, origX: position.x, origY: position.y, moved: false }

//     const canvas = elRef.current?.closest('[data-canvas]')
//     if (!canvas) return
//     const rect = canvas.getBoundingClientRect()

//     const onMove = (ev) => {
//       if (!dragRef.current.dragging) return
//       const { cx: mx, cy: my } = getClientXY(ev)
//       const dx = mx - dragRef.current.startX
//       const dy = my - dragRef.current.startY
//       if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragRef.current.moved = true
//       const nx = Math.min(95, Math.max(5, dragRef.current.origX + (dx / rect.width) * 100))
//       const ny = Math.min(95, Math.max(5, dragRef.current.origY + (dy / rect.height) * 100))
//       onPositionChange({ x: nx, y: ny })
//     }

//     const onUp = () => {
//       if (!dragRef.current.moved) onTap()
//       dragRef.current.dragging = false
//       window.removeEventListener('mousemove', onMove)
//       window.removeEventListener('touchmove', onMove)
//       window.removeEventListener('mouseup', onUp)
//       window.removeEventListener('touchend', onUp)
//     }

//     window.addEventListener('mousemove', onMove)
//     window.addEventListener('touchmove', onMove, { passive: true })
//     window.addEventListener('mouseup', onUp)
//     window.addEventListener('touchend', onUp)
//   }

//   return (
//     <DraggableItem
//       ref={elRef}
//       $x={position.x}
//       $y={position.y}
//       $selected={selected}
//       onMouseDown={onPointerDown}
//       onTouchStart={onPointerDown}
//     >
//       {children}
//       {selected && <div className="drag_hint">drag • tap to edit</div>}
//     </DraggableItem>
//   )
// }

// const DraggableItem = styled.div`
//   position: absolute;
//   left: ${({ $x }) => $x}%;
//   top: ${({ $y }) => $y}%;
//   transform: translate(-50%, -50%);
//   cursor: grab;
//   user-select: none;
//   touch-action: none;
//   z-index: 10;
//   transition: left 0.05s linear, top 0.05s linear;

//   &:active { cursor: grabbing; }

//   ${({ $selected }) => $selected && `
//     outline: 2px dashed rgba(239,90,66,0.7);
//     outline-offset: 6px;
//     border-radius: 4px;
//   `}

//   .drag_hint {
//     position: absolute;
//     bottom: calc(100% + 8px);
//     left: 50%;
//     transform: translateX(-50%);
//     background: rgba(0,0,0,0.65);
//     color: #fff;
//     font-size: 0.62rem;
//     padding: 3px 8px;
//     border-radius: 99px;
//     white-space: nowrap;
//     pointer-events: none;
//     letter-spacing: 0.4px;
//   }
// `

// // ─── Event Modal ──────────────────────────────────────────────────────────────

// const EVENTS = [
//   { id: 'others',     label: 'Others',     emoji: '🌟' },
//   { id: 'birthday',   label: 'Birthday',   emoji: '🎂' },
//   { id: 'sport',      label: 'Sport',      emoji: '🏅' },
//   { id: 'groove',     label: 'Groove',     emoji: '🎉' },
//   { id: 'wedding',    label: 'Wedding',    emoji: '💍' },
//   { id: 'graduation', label: 'Graduation', emoji: '🎓' },
//   { id: 'retirement', label: 'Retirement', emoji: '🏖️' },
//   { id: 'getwell',    label: 'Get well',   emoji: '💐' },
//   { id: 'funeral',    label: 'Funeral',    emoji: '🕊️' },
//   { id: 'promotion',  label: 'Promotion',  emoji: '🎊' },
//   { id: 'newbaby',    label: 'New Baby',   emoji: '👶' },
//   { id: 'anniversary',label: 'Anniversary',emoji: '❤️' },
// ]

// const EventModal = ({ onClose, onConfirm, currentEvent }) => {
//   const [selected, setSelected]       = useState(currentEvent || null)
//   const [customEvent, setCustomEvent] = useState(currentEvent?.custom || '')

//   const canContinue = selected?.id !== 'others' || customEvent.trim().length > 0

//   return (
//     <ModalBackdrop onClick={onClose}>
//       <ModalBox onClick={(e) => e.stopPropagation()}>
//         <div className="modal_header">
//           <h3>Choose Event</h3>
//           <button className="modal_close" onClick={onClose}><BsX /></button>
//         </div>

//         <EventGrid>
//           {EVENTS.map((ev) => {
//             const isActive = selected?.id === ev.id
//             return (
//               <div
//                 key={ev.id}
//                 className={`event_cell ${isActive ? 'active' : ''}`}
//                 onClick={() => setSelected(isActive ? null : ev)}
//               >
//                 <div className={`event_radio ${isActive ? 'active' : ''}`}>
//                   {isActive && <BsCheck2 className="radio_check" />}
//                 </div>
//                 <span className="event_emoji">{ev.emoji}</span>
//                 <span className="event_label">{ev.label}</span>
//               </div>
//             )
//           })}
//         </EventGrid>

//         {selected?.id === 'others' && (
//           <OthersInput
//             type="text"
//             placeholder="Describe your event..."
//             value={customEvent}
//             onChange={(e) => setCustomEvent(e.target.value)}
//             autoFocus
//           />
//         )}

//         <button
//           className="modal_continue"
//           disabled={!canContinue}
//           onClick={() => onConfirm(
//             selected
//               ? { ...selected, ...(selected.id === 'others' && { custom: customEvent.trim(), label: customEvent.trim() || 'Others' }) }
//               : null
//           )}
//         >
//           Continue
//         </button>
//       </ModalBox>
//     </ModalBackdrop>
//   )
// }

// const OthersInput = styled.input`
//   width: 100%;
//   height: 48px;
//   padding: 0 1rem;
//   border: 1.5px solid var(--primary-color, #EF5A42);
//   border-radius: 10px;
//   background: rgba(239,90,66,0.03);
//   font-size: 0.95em;
//   color: var(--text-color, #111);
//   outline: none;
//   box-sizing: border-box;
//   transition: border-color 0.2s;

//   &::placeholder { color: #9CA3AF; }
//   &:focus { background: #fff; }
// `

// const EventGrid = styled.div`
//   display: grid;
//   grid-template-columns: 1fr 1fr;
//   gap: 8px;
//   max-height: 380px;
//   overflow-y: auto;
//   padding-right: 2px;

//   &::-webkit-scrollbar { width: 4px; }
//   &::-webkit-scrollbar-track { background: transparent; }
//   &::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 99px; }

//   .event_cell {
//     display: flex;
//     align-items: center;
//     gap: 0.5rem;
//     padding: 0.7rem 0.85rem;
//     border-radius: 12px;
//     background: #F9FAFB;
//     border: 1.5px solid #ECEFF3;
//     cursor: pointer;
//     transition: border-color 0.2s, background 0.2s;

//     &:hover:not(.active) { border-color: #D1D5DB; }
//     &.active {
//       border-color: var(--primary-color, #EF5A42);
//       background: rgba(239,90,66,0.04);
//     }
//   }

//   .event_radio {
//     width: 18px;
//     height: 18px;
//     border-radius: 50%;
//     border: 1.5px solid #D1D5DB;
//     flex-shrink: 0;
//     display: flex;
//     align-items: center;
//     justify-content: center;
//     transition: border-color 0.2s, background 0.2s;

//     &.active {
//       border-color: var(--primary-color, #EF5A42);
//       background: var(--primary-color, #EF5A42);
//     }

//     .radio_check {
//       font-size: 0.65em;
//       color: #fff;
//     }
//   }

//   .event_emoji {
//     font-size: 1.05em;
//     flex-shrink: 0;
//     line-height: 1;
//   }

//   .event_label {
//     font-size: 0.88em;
//     font-weight: 500;
//     color: var(--text-color, #111);
//     white-space: nowrap;
//     overflow: hidden;
//     text-overflow: ellipsis;
//   }
// `

// // ─── Audio Tab ────────────────────────────────────────────────────────────────

// const AudioTab = () => {
//   const [recording, setRecording]         = useState(false)
//   const [elapsed, setElapsed]             = useState(0)
//   const [audioBlob, setAudioBlob]         = useState(null)
//   const [audioURL, setAudioURL]           = useState(null)
//   const [uploadedName, setUploadedName]   = useState(null)

//   const mediaRecorderRef = useRef(null)
//   const chunksRef        = useRef([])
//   const timerRef         = useRef(null)
//   const fileRef          = useRef(null)

//   const formatTime = (s) => {
//     const m = Math.floor(s / 60).toString().padStart(2, '0')
//     const sec = (s % 60).toString().padStart(2, '0')
//     return `${m}:${sec}`
//   }

//   const startRecording = async () => {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
//       const mr = new MediaRecorder(stream)
//       mediaRecorderRef.current = mr
//       chunksRef.current = []

//       mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
//       mr.onstop = () => {
//         const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
//         setAudioBlob(blob)
//         setAudioURL(URL.createObjectURL(blob))
//         setUploadedName('Recorded audio')
//         stream.getTracks().forEach(t => t.stop())
//       }

//       mr.start()
//       setRecording(true)
//       setElapsed(0)
//       timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
//     } catch {
//       alert('Microphone access denied. Please allow microphone access to record.')
//     }
//   }

//   const stopRecording = () => {
//     if (mediaRecorderRef.current) mediaRecorderRef.current.stop()
//     clearInterval(timerRef.current)
//     setRecording(false)
//   }

//   const handleUpload = (e) => {
//     const file = e.target.files[0]
//     if (!file) return
//     setAudioBlob(file)
//     setAudioURL(URL.createObjectURL(file))
//     setUploadedName(file.name)
//     setElapsed(0)
//     setRecording(false)
//   }

//   const removeAudio = () => {
//     setAudioBlob(null)
//     setAudioURL(null)
//     setUploadedName(null)
//     setElapsed(0)
//   }

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
//             >
//               {recording
//                 ? <span className="stop_square" />
//                 : <BsMic className="mic_icon" />
//               }
//             </button>
//             <span className="timer">{formatTime(elapsed)}</span>
//             {recording && <div className="pulse_ring" />}
//           </div>

//           <input
//             type="file"
//             accept="audio/*"
//             ref={fileRef}
//             style={{ display: 'none' }}
//             onChange={handleUpload}
//           />
//           <button className="upload_sound_btn" onClick={() => fileRef.current.click()}>
//             <BsUpload />
//             <span>Upload / Extract sound</span>
//           </button>
//         </>
//       )}

//       <button
//         className={`send_btn ${audioURL ? 'ready' : ''}`}
//         disabled={!audioURL}
//       >
//         Send appreciation
//       </button>
//     </AudioWrapper>
//   )
// }

// const AudioWrapper = styled.div`
//   display: flex;
//   flex-direction: column;
//   align-items: center;
//   gap: 1.25rem;
//   padding: 0.5rem 0 0.25rem;
//   width: 100%;

//   .record_area {
//     position: relative;
//     display: flex;
//     flex-direction: column;
//     align-items: center;
//     gap: 0.85rem;
//     padding: 1.5rem 0 0.5rem;
//   }

//   .record_btn {
//     width: 110px;
//     height: 110px;
//     border-radius: 50%;
//     border: none;
//     background: var(--primary-color, #EF5A42);
//     color: #fff;
//     display: flex;
//     align-items: center;
//     justify-content: center;
//     cursor: pointer;
//     position: relative;
//     z-index: 2;
//     transition: transform 0.15s, background 0.2s;
//     box-shadow: 0 8px 24px rgba(239,90,66,0.35);

//     &:hover { transform: scale(1.04); }
//     &:active { transform: scale(0.97); }

//     &.recording {
//       background: #d94030;
//     }

//     .mic_icon { font-size: 2.4rem; }

//     .stop_square {
//       width: 28px;
//       height: 28px;
//       border-radius: 5px;
//       background: #fff;
//     }
//   }

//   .pulse_ring {
//     position: absolute;
//     width: 130px;
//     height: 130px;
//     border-radius: 50%;
//     border: 3px solid rgba(239,90,66,0.4);
//     animation: pulse 1.4s ease-out infinite;
//     top: 50%;
//     left: 50%;
//     transform: translate(-50%, -68%);
//     pointer-events: none;
//   }

//   @keyframes pulse {
//     0%   { transform: translate(-50%, -68%) scale(1);   opacity: 0.8; }
//     100% { transform: translate(-50%, -68%) scale(1.5); opacity: 0; }
//   }

//   .timer {
//     font-size: 1.05em;
//     font-weight: 500;
//     color: var(--light-text-color, #6B7280);
//     letter-spacing: 1px;
//     font-variant-numeric: tabular-nums;
//   }

//   .upload_sound_btn {
//     display: flex;
//     align-items: center;
//     gap: 0.5rem;
//     padding: 0.65rem 1.5rem;
//     border: 1.5px solid #ECEFF3;
//     border-radius: 99px;
//     background: #fff;
//     font-size: 0.92em;
//     color: var(--text-color, #111);
//     cursor: pointer;
//     transition: border-color 0.2s;
//     &:hover { border-color: var(--primary-color, #EF5A42); }
//     svg { font-size: 0.95em; color: var(--light-text-color, #6B7280); }
//   }

//   .audio_result {
//     width: 100%;
//     display: flex;
//     flex-direction: column;
//     gap: 0.75rem;
//   }

//   .audio_file_row {
//     display: flex;
//     align-items: center;
//     gap: 0.65rem;
//     padding: 0.75rem 1rem;
//     background: #F9FAFB;
//     border: 1.5px solid #ECEFF3;
//     border-radius: 12px;

//     .audio_icon {
//       color: var(--primary-color, #EF5A42);
//       font-size: 1.1em;
//       flex-shrink: 0;
//     }

//     .audio_name {
//       flex: 1;
//       font-size: 0.9em;
//       color: var(--text-color, #111);
//       overflow: hidden;
//       text-overflow: ellipsis;
//       white-space: nowrap;
//     }

//     .audio_remove {
//       width: 26px;
//       height: 26px;
//       border-radius: 50%;
//       border: 1.5px solid #ECEFF3;
//       background: transparent;
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       font-size: 1em;
//       color: #9CA3AF;
//       cursor: pointer;
//       transition: border-color 0.2s, color 0.2s;
//       flex-shrink: 0;
//       &:hover { border-color: #EF5A42; color: #EF5A42; }
//     }
//   }

//   .audio_player {
//     width: 100%;
//     border-radius: 8px;
//     outline: none;
//     height: 40px;
//   }

//   .send_btn {
//     width: 100%;
//     height: 50px;
//     border: none;
//     border-radius: 25px;
//     background: var(--primary-color, #EF5A42);
//     color: #fff;
//     font-size: 1em;
//     font-weight: 600;
//     opacity: 0.4;
//     cursor: not-allowed;
//     transition: opacity 0.2s;
//     margin-top: 0.25rem;

//     &.ready {
//       opacity: 1;
//       cursor: pointer;
//       &:hover { opacity: 0.88; }
//     }
//   }
// `

// // ─── Video Tab ────────────────────────────────────────────────────────────────

// const VideoTab = () => (
//   <VideoWrapper>
//     <div className="coming_soon_icon">
//       <BsCameraVideo />
//     </div>
//     <h3>Coming Soon</h3>
//     <p>Video messages are on the way. Stay tuned for updates!</p>
//   </VideoWrapper>
// )

// const VideoWrapper = styled.div`
//   display: flex;
//   flex-direction: column;
//   align-items: center;
//   justify-content: center;
//   gap: 0.6rem;
//   padding: 2.5rem 1rem;
//   text-align: center;

//   .coming_soon_icon {
//     width: 64px;
//     height: 64px;
//     border-radius: 50%;
//     background: #F3F4F6;
//     display: flex;
//     align-items: center;
//     justify-content: center;
//     font-size: 1.8rem;
//     color: #9CA3AF;
//     margin-bottom: 0.25rem;
//   }

//   h3 {
//     font-size: 1.1em;
//     font-weight: 700;
//     color: var(--text-color, #111);
//     margin: 0;
//   }

//   p {
//     font-size: 0.88em;
//     color: var(--light-text-color, #6B7280);
//     margin: 0;
//     max-width: 220px;
//     line-height: 1.5;
//   }
// `

// // ─── Mock Users & Tag Input ───────────────────────────────────────────────────

// const MOCK_USERS = [
//   { id: 1,  username: 'alex_johnson',   name: 'Alex Johnson',   avatar: '👨‍💼' },
//   { id: 2,  username: 'sarah_williams', name: 'Sarah Williams', avatar: '👩‍🎨' },
//   { id: 3,  username: 'mike_chen',      name: 'Mike Chen',      avatar: '👨‍💻' },
//   { id: 4,  username: 'priya_patel',    name: 'Priya Patel',    avatar: '👩‍🔬' },
//   { id: 5,  username: 'james_okafor',   name: 'James Okafor',   avatar: '👨‍🎤' },
//   { id: 6,  username: 'emma_walsh',     name: 'Emma Walsh',     avatar: '👩‍🏫' },
//   { id: 7,  username: 'david_kim',      name: 'David Kim',      avatar: '👨‍🍳' },
//   { id: 8,  username: 'fatima_ali',     name: 'Fatima Ali',     avatar: '👩‍⚕️' },
//   { id: 9,  username: 'carlos_reyes',   name: 'Carlos Reyes',   avatar: '👨‍🎸' },
//   { id: 10, username: 'nina_brown',     name: 'Nina Brown',     avatar: '👩‍💼' },
// ]

// const TagInput = () => {
//   const [inputValue, setInputValue]   = useState('')
//   const [tags, setTags]               = useState([])
//   const [suggestions, setSuggestions] = useState([])
//   const [suggestType, setSuggestType] = useState(null)
//   const inputRef                      = useRef(null)
//   const wrapperRef                    = useRef(null)

//   const hasMention = tags.some(t => t.type === 'user')

//   useEffect(() => {
//     const handler = (e) => {
//       if (wrapperRef.current && !wrapperRef.current.contains(e.target))
//         setSuggestions([])
//     }
//     document.addEventListener('mousedown', handler)
//     return () => document.removeEventListener('mousedown', handler)
//   }, [])

//   const getLastWord = (val) => val.split(/\s+/).pop()

//   const handleChange = (e) => {
//     const val = e.target.value
//     setInputValue(val)
//     const last = getLastWord(val)

//     if (last.startsWith('@') && last.length > 1) {
//       // Block second @ suggestion if a mention already exists
//       if (hasMention) { setSuggestions([]); setSuggestType(null); return }
//       const q = last.slice(1).toLowerCase()
//       setSuggestions(MOCK_USERS.filter(u =>
//         u.username.toLowerCase().includes(q) || u.name.toLowerCase().includes(q)
//       ))
//       setSuggestType('user')
//     } else if (last.startsWith('#') && last.length > 1) {
//       const q = last.slice(1).toLowerCase()
//       setSuggestions(EVENTS.filter(ev => ev.label.toLowerCase().includes(q)))
//       setSuggestType('event')
//     } else {
//       setSuggestions([])
//       setSuggestType(null)
//     }
//   }

//   const handleKeyDown = (e) => {
//     if ((e.key === ' ' || e.key === 'Enter') && inputValue.trim()) {
//       e.preventDefault()
//       commitInput(inputValue.trim())
//     }
//     if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
//       setTags(prev => prev.slice(0, -1))
//     }
//   }

//   const commitInput = (value) => {
//     if (!value) return
//     const type = value.startsWith('@') ? 'user' : value.startsWith('#') ? 'event' : 'plain'
//     // Enforce single mention
//     if (type === 'user' && hasMention) return
//     if (!tags.find(t => t.value === value)) {
//       setTags(prev => [...prev, { id: Date.now(), value, type }])
//     }
//     setInputValue('')
//     setSuggestions([])
//     setSuggestType(null)
//   }

//   const pickUser = (user) => { commitInput(`@${user.username}`); inputRef.current?.focus() }
//   const pickEvent = (ev)  => { commitInput(`#${ev.label}`);      inputRef.current?.focus() }

//   // Hint shown inside the field
//   const placeholder = tags.length === 0
//     ? 'Send to: @mention · #event tags'
//     : hasMention ? 'Add #event tags...' : '@mention or #event tags'

//   return (
//     <TagInputWrapper ref={wrapperRef}>
//       <div className="tag_field" onClick={() => inputRef.current?.focus()}>
//         {tags.map((tag) => (
//           <span key={tag.id} className={`tag_chip ${tag.type}`}>
//             {tag.value}
//             <button className="chip_remove" onClick={(e) => { e.stopPropagation(); setTags(p => p.filter(t => t.id !== tag.id)) }}>
//               <BsX />
//             </button>
//           </span>
//         ))}
//         <input
//           ref={inputRef}
//           value={inputValue}
//           onChange={handleChange}
//           onKeyDown={handleKeyDown}
//           onBlur={() => { if (inputValue.trim()) commitInput(inputValue.trim()) }}
//           placeholder={tags.length === 0 ? placeholder : ''}
//           className="tag_bare_input"
//         />
//       </div>

//       {/* Hint row */}
//       {tags.length > 0 && (
//         <div className="tag_hint">
//           {hasMention
//             ? <span>✓ Recipient set · Add more <strong>#event</strong> tags</span>
//             : <span>Type <strong>@name</strong> to set recipient · <strong>#tag</strong> for events</span>
//           }
//         </div>
//       )}

//       {suggestions.length > 0 && (
//         <SuggestionBox>
//           {suggestType === 'user' && suggestions.map((user) => (
//             <div key={user.id} className="suggestion_item" onMouseDown={(e) => { e.preventDefault(); pickUser(user) }}>
//               <span className="s_avatar">{user.avatar}</span>
//               <div className="s_info">
//                 <span className="s_name">{user.name}</span>
//                 <span className="s_sub">@{user.username}</span>
//               </div>
//             </div>
//           ))}
//           {suggestType === 'event' && suggestions.map((ev) => (
//             <div key={ev.id} className="suggestion_item" onMouseDown={(e) => { e.preventDefault(); pickEvent(ev) }}>
//               <span className="s_avatar s_emoji">{ev.emoji}</span>
//               <div className="s_info">
//                 <span className="s_name">{ev.label}</span>
//                 <span className="s_sub">#{ev.label}</span>
//               </div>
//             </div>
//           ))}
//         </SuggestionBox>
//       )}
//     </TagInputWrapper>
//   )
// }

// const TagInputWrapper = styled.div`
//   position: relative;
//   width: 100%;

//   .tag_field {
//     min-height: 50px;
//     padding: 0.4rem 0.75rem;
//     background: #F9FAFB;
//     border: 1.5px solid #ECEFF3;
//     border-radius: 10px;
//     display: flex;
//     flex-wrap: wrap;
//     align-items: center;
//     gap: 6px;
//     cursor: text;
//     transition: border-color 0.2s;
//     box-sizing: border-box;

//     &:focus-within {
//       border-color: var(--primary-color, #EF5A42);
//       background: #fff;
//     }

//     .tag_chip {
//       display: inline-flex;
//       align-items: center;
//       gap: 3px;
//       padding: 3px 8px 3px 10px;
//       border-radius: 99px;
//       font-size: 0.82em;
//       font-weight: 500;
//       white-space: nowrap;
//       line-height: 1;

//       &.user {
//         background: rgba(59,130,246,0.1);
//         color: #3B82F6;
//       }
//       &.event {
//         background: rgba(239,90,66,0.1);
//         color: var(--primary-color, #EF5A42);
//       }
//       &.plain {
//         background: #F3F4F6;
//         color: var(--text-color, #111);
//       }
//       .chip_remove {
//         border: none;
//         background: transparent;
//         cursor: pointer;
//         display: flex;
//         align-items: center;
//         padding: 0;
//         font-size: 0.95em;
//         color: inherit;
//         opacity: 0.55;
//         &:hover { opacity: 1; }
//       }
//     }

//     .tag_bare_input {
//       flex: 1;
//       min-width: 100px;
//       border: none;
//       background: transparent;
//       outline: none;
//       font-size: 0.92em;
//       color: var(--text-color, #111);
//       padding: 4px 0;
//       &::placeholder { color: #9CA3AF; }
//     }
//   }

//   .tag_hint {
//     margin-top: 5px;
//     font-size: 0.76em;
//     color: #9CA3AF;
//     padding: 0 0.25rem;
//     line-height: 1.4;

//     strong { color: var(--primary-color, #EF5A42); font-weight: 600; }
//   }`

// const SuggestionBox = styled.div`
//   position: absolute;
//   top: calc(100% + 6px);
//   left: 0;
//   right: 0;
//   background: #fff;
//   border: 1.5px solid #ECEFF3;
//   border-radius: 12px;
//   box-shadow: 0 8px 24px rgba(0,0,0,0.1);
//   z-index: 50;
//   overflow: hidden;
//   max-height: 200px;
//   overflow-y: auto;

//   &::-webkit-scrollbar { width: 4px; }
//   &::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 99px; }

//   .suggestion_item {
//     display: flex;
//     align-items: center;
//     gap: 0.65rem;
//     padding: 0.6rem 1rem;
//     cursor: pointer;
//     transition: background 0.15s;
//     border-bottom: 1px solid #F3F4F6;

//     &:last-child { border-bottom: none; }
//     &:hover { background: #F9FAFB; }

//     .s_avatar {
//       font-size: 1.3em;
//       flex-shrink: 0;
//       width: 32px;
//       height: 32px;
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       background: #F3F4F6;
//       border-radius: 50%;
//     }

//     .s_emoji { background: transparent; font-size: 1.4em; }

//     .s_info {
//       flex: 1;
//       display: flex;
//       flex-direction: column;
//       gap: 1px;
//       min-width: 0;

//       .s_name {
//         font-size: 0.88em;
//         font-weight: 600;
//         color: var(--text-color, #111);
//         white-space: nowrap;
//         overflow: hidden;
//         text-overflow: ellipsis;
//       }

//       .s_sub {
//         font-size: 0.76em;
//         color: var(--light-text-color, #6B7280);
//       }
//     }
//   }
// `

// // ─── Post Creation Component ──────────────────────────────────────────────────

// const PostCreationComponent = ({ type }) => {
//   const dispatch = useDispatch()
//   const { createBoardLoad, createBoardError, createBoardErrorMsg, createdBoard } = useSelector(s => s.board)
//   const { postMessageLoad, postMessageError, postMessageErrorMsg, postedMessage } = useSelector(s => s.message)
//   const { imageUploadLoad, audioUploadLoad, imageUploadError, audioUploadError } = useSelector(s => s.upload)

//   // ── canvas state ────────────────────────────────────────────────────────────
//   const [activeTab, setActiveTab]         = useState('text')
//   const [aspectRatio, setAspectRatio]     = useState('square')
//   const [activeModal, setActiveModal]     = useState(null)
//   const [selectedItem, setSelectedItem]   = useState(null)
//   const [selectedEvent, setSelectedEvent] = useState(null)

//   const [canvasBg, setCanvasBg]           = useState(null)
//   const [canvasImage, setCanvasImage]     = useState(null)   // base64 preview
//   const [canvasImageFile, setCanvasImageFile] = useState(null) // raw File for upload
//   const [canvasText, setCanvasText]       = useState(null)
//   const [canvasVector, setCanvasVector]   = useState(null)
//   const [canvasFrame, setCanvasFrame]     = useState(null)

//   // ── preview / post state ────────────────────────────────────────────────────
//   const [showPreview, setShowPreview]     = useState(false)
//   const [caption, setCaption]             = useState('')
//   const [previewSubModal, setPreviewSubModal] = useState(null) // 'capacity' | 'privacy'
//   const [selectedCapacity, setSelectedCapacity] = useState(CAPACITY_OPTIONS[1]) // default: 20 curation (Free)
//   const [selectedPrivacy, setSelectedPrivacy]   = useState(PRIVACY_OPTIONS[0])  // default: Public
//   const [postSuccess, setPostSuccess]     = useState(false)
//   const [postError, setPostError]         = useState('')

//   // tags from TagInput — read from sibling; we'll get mention/tags via state lift
//   const [mentionedUser, setMentionedUser] = useState(null) // the @username chip value

//   const tabs = [
//     { id: 'text',  label: 'Text',  icon: <BsPencil /> },
//     { id: 'audio', label: 'Audio', icon: <BsMic /> },
//     { id: 'video', label: 'Video', icon: <BsCameraVideo /> },
//   ]

//   const tools = [
//     { id: 'image',  label: 'Image',  icon: <BsImage /> },
//     { id: 'text',   label: 'Text',   icon: <BsTypeBold /> },
//     { id: 'vector', label: 'Vector', icon: <BsBezier2 /> },
//     { id: 'bg',     label: 'BG',     icon: <BsPalette2 /> },
//     { id: 'frame',  label: 'Frame',  icon: <BsBorderOuter /> },
//   ]

//   const handleToolClick = (toolId) => {
//     if (toolId === 'vector' && canvasVector) {
//       setActiveModal('editVector')
//     } else {
//       setActiveModal(toolId)
//     }
//   }

//   const hasContent = canvasBg || canvasImage || canvasText || canvasVector || canvasFrame
//   const VectorIcon = canvasVector?.icon
//   const canvasStyle = { background: canvasBg ? canvasBg.value : '#F9FAFB' }

//   const isPosting = createBoardLoad || postMessageLoad || imageUploadLoad || audioUploadLoad

//   // ── full post handler ───────────────────────────────────────────────────────
//   const handlePost = useCallback(async () => {
//     setPostError('')
//     try {
//       let finalImageUrl  = null
//       let finalAudioUrl  = null

//       // 1. Upload canvas image if present
//       if (canvasImageFile) {
//         const uploadResult = await dispatch(uploadFile({ file: canvasImageFile, type: 'image' })).unwrap()
//         if (uploadResult.status !== 'success') {
//           setPostError(uploadResult.response?.message || 'Image upload failed')
//           return
//         }
//         finalImageUrl = uploadResult.response.url || uploadResult.response.secure_url
//       }

//       // 2. Build event value — map to backend enum
//       const eventMap = {
//         birthday: 'birthday', wedding: 'wedding', anniversary: 'anniversary',
//         graduation: 'graduation', sport: 'sport', retirement: 'retirement',
//         promotion: 'promotion', others: 'other', other: 'other',
//       }
//       const eventValue = selectedEvent?.id ? (eventMap[selectedEvent.id] ?? 'other') : null

//       // 3. Extract recipient username from @mention tag in TagInput
//       const recipient = mentionedUser?.replace('@', '') || undefined

//       // 4. Create board
//       const boardResult = await dispatch(createBoard({
//         title:       caption.trim() || 'My Appreciation Board',
//         description: canvasText?.content || '',
//         visibility:  selectedPrivacy.value,
//         receipent:   recipient,
//         event:       eventValue,
//       })).unwrap()

//       if (boardResult.status !== 'success') {
//         setPostError(boardResult.response?.message || 'Failed to create board')
//         return
//       }

//       const boardSlug = boardResult.response.board.slug

//       // 5. Post message to board
//       const content = {
//         text:      canvasText?.content   || null,
//         font:      canvasText?.font?.family || null,
//         color:     canvasText?.color     || null,
//         background:canvasBg?.value       || null,
//         frame:     canvasFrame ? `${canvasFrame.thickness}px ${canvasFrame.style} ${canvasFrame.color}` : null,
//         imageUrls: finalImageUrl ? [finalImageUrl] : [],
//         vectorKey: canvasVector?.id      || null,
//         audioUrl:  finalAudioUrl,
//         duration:  null,
//       }

//       const msgResult = await dispatch(postMessage({
//         slug:    boardSlug,
//         type:    'text',
//         content,
//       })).unwrap()

//       if (msgResult.status !== 'success') {
//         setPostError(msgResult.response?.message || 'Failed to post message')
//         return
//       }

//       // 6. If capacity requires upgrade, redirect to payment
//       if (selectedCapacity.price && boardResult.response.board._id) {
//         await dispatch(createBoardUpgrade({
//           boardId: boardResult.response.board._id,
//           toTier:  selectedCapacity.tier,
//         }))
//         // Stripe redirect handled inside slice
//         return
//       }

//       setPostSuccess(true)
//     } catch (err) {
//       setPostError('Something went wrong. Please try again.')
//     }
//   }, [
//     dispatch, canvasImageFile, caption, selectedEvent, mentionedUser,
//     selectedPrivacy, selectedCapacity, canvasText, canvasBg, canvasFrame, canvasVector,
//   ])

//   return (
//     <PostCreationWrapper>
//       {/* Tab Switcher */}
//       <div className="tab_switcher">
//         {tabs.map((tab) => (
//           <button
//             key={tab.id}
//             className={`tab_btn ${activeTab === tab.id ? 'active' : ''}`}
//             onClick={() => setActiveTab(tab.id)}
//           >
//             {tab.icon}
//             <span>{tab.label}</span>
//           </button>
//         ))}
//       </div>

//       {/* Select Event — board only */}
//       {type === 'board' && (
//         <div className="select_row" onClick={() => setActiveModal('event')}>
//           {selectedEvent ? (
//             <>
//               <span className="select_event_emoji">{selectedEvent.emoji}</span>
//               <span className="select_value">{selectedEvent.label}</span>
//             </>
//           ) : (
//             <span className="select_placeholder">Select Event</span>
//           )}
//           <BsChevronRight className="select_arrow" />
//         </div>
//       )}

//       {/* Send To */}
//       <TagInput />

//       {/* ── Tab Content ── */}
//       {activeTab === 'text' && (
//         <>
//           {/* Aspect Ratio */}
//           <div className="aspect_row">
//             <span className="aspect_label">Aspect Ratio</span>
//             <div className="ratio_toggles">
//               <button
//                 className={`ratio_btn square_btn ${aspectRatio === 'square' ? 'active' : ''}`}
//                 onClick={() => setAspectRatio('square')}
//                 title="Square (1:1)"
//               >
//                 {aspectRatio === 'square' && <BsCheck2 />}
//               </button>
//               <button
//                 className={`ratio_btn portrait_btn ${aspectRatio === 'portrait' ? 'active' : ''}`}
//                 onClick={() => setAspectRatio('portrait')}
//                 title="Portrait (4:5)"
//               >
//                 {aspectRatio === 'portrait' && <BsCheck2 />}
//               </button>
//             </div>
//           </div>

//           {/* Canvas Preview */}
//           <CanvasArea
//             $ratio={aspectRatio}
//             style={{
//               ...canvasStyle,
//               ...(canvasFrame ? {
//                 border: canvasFrame.border,
//                 borderRadius: canvasFrame.borderRadius,
//               } : {})
//             }}
//             data-canvas="true"
//             onClick={() => setSelectedItem(null)}
//           >
//             {canvasImage && (
//               <>
//                 <img src={canvasImage} alt="canvas bg" className="canvas_image" />
//                 <button
//                   className="remove_image_btn"
//                   onClick={(e) => { e.stopPropagation(); setCanvasImage(null) }}
//                   title="Remove image"
//                 >
//                   <BsX />
//                 </button>
//               </>
//             )}

//             {canvasVector && VectorIcon && (
//               <DraggableCanvasItem
//                 position={canvasVector.position}
//                 onPositionChange={(pos) => setCanvasVector(prev => ({ ...prev, position: pos }))}
//                 selected={selectedItem === 'vector'}
//                 onSelect={() => setSelectedItem('vector')}
//                 onTap={() => setActiveModal('editVector')}
//               >
//                 <VectorIcon style={{ color: canvasVector.color, opacity: canvasVector.opacity, fontSize: canvasVector.size ?? 48, display: 'block' }} />
//               </DraggableCanvasItem>
//             )}

//             {canvasText && (
//               <DraggableCanvasItem
//                 position={canvasText.position}
//                 onPositionChange={(pos) => setCanvasText(prev => ({ ...prev, position: pos }))}
//                 selected={selectedItem === 'text'}
//                 onSelect={() => setSelectedItem('text')}
//                 onTap={() => setActiveModal('text')}
//               >
//                 <div
//                   style={{
//                     fontFamily: canvasText.font.family,
//                     color: canvasText.color,
//                     fontSize: canvasText.fontSize ?? 16,
//                     fontWeight: 600,
//                     textAlign: 'center',
//                     maxWidth: 180,
//                     wordBreak: 'break-word',
//                     textShadow: '0 1px 4px rgba(0,0,0,0.12)',
//                     lineHeight: 1.4,
//                     ...canvasText.font.style,
//                   }}
//                 >
//                   {canvasText.content}
//                 </div>
//               </DraggableCanvasItem>
//             )}

//             {!hasContent && (
//               <div className="canvas_empty">
//                 <BsCameraFill className="empty_icon" />
//                 <span>Your canvas</span>
//               </div>
//             )}
//           </CanvasArea>

//           {/* Toolbar */}
//           <div className="toolbar">
//             {tools.map((tool) => {
//               const isSet =
//                 (tool.id === 'image' && canvasImage) ||
//                 (tool.id === 'text' && canvasText) ||
//                 (tool.id === 'vector' && canvasVector) ||
//                 (tool.id === 'bg' && canvasBg) ||
//                 (tool.id === 'frame' && canvasFrame)
//               return (
//                 <button
//                   key={tool.id}
//                   className={`tool_btn ${isSet ? 'set' : ''}`}
//                   onClick={() => handleToolClick(tool.id)}
//                 >
//                   {tool.icon}
//                   <span>{tool.label}</span>
//                 </button>
//               )
//             })}
//           </div>

//           {/* Send / Preview */}
//           <button
//             className={`preview_btn ${hasContent ? 'ready' : ''}`}
//             disabled={!hasContent}
//             onClick={() => hasContent && setShowPreview(true)}
//           >
//             {hasContent ? 'Send appreciation' : 'Preview'}
//           </button>
//         </>
//       )}

//       {activeTab === 'audio' && <AudioTab />}
//       {activeTab === 'video' && <VideoTab />}

//       {/* ── Modals ── */}
//       {activeModal === 'event' && (
//         <EventModal
//           onClose={() => setActiveModal(null)}
//           currentEvent={selectedEvent}
//           onConfirm={(ev) => { setSelectedEvent(ev); setActiveModal(null) }}
//         />
//       )}
//       {activeModal === 'image' && (
//         <ImageModal
//           onClose={() => setActiveModal(null)}
//           currentImage={canvasImage}
//           onConfirm={(src, file) => {
//             setCanvasImage(src)
//             if (file) setCanvasImageFile(file)
//             setActiveModal(null)
//           }}
//         />
//       )}
//       {activeModal === 'text' && (
//         <TextModal
//           onClose={() => setActiveModal(null)}
//           currentText={canvasText}
//           onConfirm={(t) => {
//             setCanvasText(prev => ({ ...t, position: prev?.position ?? { x: 50, y: 75 } }))
//             setActiveModal(null)
//           }}
//         />
//       )}
//       {activeModal === 'vector' && (
//         <VectorModal
//           onClose={() => setActiveModal(null)}
//           onConfirm={(v) => {
//             setCanvasVector({ ...v, size: 48, position: { x: 75, y: 20 } })
//             setActiveModal(null)
//           }}
//         />
//       )}
//       {activeModal === 'editVector' && canvasVector && (
//         <EditVectorModal
//           onClose={() => setActiveModal(null)}
//           vector={canvasVector}
//           onUpdate={(updates) => setCanvasVector(prev => ({ ...prev, ...updates }))}
//           onRemove={() => { setCanvasVector(null); setActiveModal(null); setSelectedItem(null) }}
//         />
//       )}
//       {activeModal === 'bg' && (
//         <BgModal
//           onClose={() => setActiveModal(null)}
//           currentBg={canvasBg}
//           onConfirm={(bg) => { setCanvasBg(bg); setActiveModal(null) }}
//         />
//       )}
//       {activeModal === 'frame' && (
//         <FrameModal
//           onClose={() => setActiveModal(null)}
//           currentFrame={canvasFrame}
//           onConfirm={(frame) => { setCanvasFrame(frame); setActiveModal(null) }}
//         />
//       )}

//       {/* ── Preview Panel ── */}
//       {showPreview && !postSuccess && (
//         <PreviewOverlay>
//           <PreviewCard>
//             {/* Header */}
//             <div className="preview_header">
//               <span className="preview_title">Preview</span>
//               <button className="preview_close" onClick={() => { setShowPreview(false); setPreviewSubModal(null); setPostError('') }}>
//                 <BsX />
//               </button>
//             </div>

//             {/* Canvas thumbnail */}
//             <PreviewThumb
//               style={{
//                 background: canvasBg ? canvasBg.value : '#F3F4F6',
//                 ...(canvasFrame ? { border: canvasFrame.border, borderRadius: canvasFrame.borderRadius } : {}),
//               }}
//             >
//               {canvasImage && <img src={canvasImage} alt="preview" className="thumb_img" />}
//               {canvasText && (
//                 <span className="thumb_text" style={{
//                   fontFamily: canvasText.font?.family,
//                   color: canvasText.color,
//                   fontSize: Math.min(canvasText.fontSize ?? 16, 13),
//                   ...canvasText.font?.style,
//                 }}>
//                   {canvasText.content}
//                 </span>
//               )}
//               {!canvasImage && !canvasText && !canvasBg && (
//                 <span className="thumb_placeholder"><BsCameraFill /></span>
//               )}
//             </PreviewThumb>

//             {/* Capacity sub-modal */}
//             {previewSubModal === 'capacity' && (
//               <SubModal>
//                 <div className="sub_title">Board Capacity</div>
//                 {CAPACITY_OPTIONS.map(opt => {
//                   const isActive = selectedCapacity.id === opt.id
//                   return (
//                     <div
//                       key={opt.id}
//                       className={`sub_option ${isActive ? 'active' : ''}`}
//                       onClick={() => { setSelectedCapacity(opt); setPreviewSubModal(null) }}
//                     >
//                       <div className={`sub_radio ${isActive ? 'filled' : ''}`}>
//                         {isActive && <BsCheckCircleFill className="radio_icon" />}
//                       </div>
//                       <span className="sub_label">{opt.label}</span>
//                       {opt.badge && (
//                         <span className={`sub_badge ${opt.price ? 'pay' : 'free'}`}>
//                           {opt.badge}
//                         </span>
//                       )}
//                     </div>
//                   )
//                 })}
//               </SubModal>
//             )}

//             {/* Privacy sub-modal */}
//             {previewSubModal === 'privacy' && (
//               <SubModal>
//                 <div className="sub_title">Privacy</div>
//                 {PRIVACY_OPTIONS.map(opt => {
//                   const isActive = selectedPrivacy.id === opt.id
//                   return (
//                     <div
//                       key={opt.id}
//                       className={`sub_option ${isActive ? 'active' : ''}`}
//                       onClick={() => { setSelectedPrivacy(opt); setPreviewSubModal(null) }}
//                     >
//                       <div className={`sub_radio ${isActive ? 'filled' : ''}`}>
//                         {isActive && <BsCheckCircleFill className="radio_icon" />}
//                       </div>
//                       <span className="sub_label">{opt.label}</span>
//                     </div>
//                   )
//                 })}
//               </SubModal>
//             )}

//             {/* Caption */}
//             <input
//               className="caption_input"
//               placeholder="Caption"
//               value={caption}
//               onChange={e => setCaption(e.target.value)}
//             />

//             {/* Board Capacity row */}
//             <div
//               className="preview_row"
//               onClick={() => setPreviewSubModal(prev => prev === 'capacity' ? null : 'capacity')}
//             >
//               <span className="row_label">Select board capacity</span>
//               <span className="row_value">{selectedCapacity.label} <BsChevronRight /></span>
//             </div>

//             {/* Privacy row */}
//             <div
//               className="preview_row"
//               onClick={() => setPreviewSubModal(prev => prev === 'privacy' ? null : 'privacy')}
//             >
//               <span className="row_label">Privacy</span>
//               <span className="row_value">{selectedPrivacy.label} <BsChevronRight /></span>
//             </div>

//             {postError && <p className="post_error">{postError}</p>}

//             {/* Post button */}
//             <button
//               className={`post_btn ${isPosting ? 'loading' : ''}`}
//               onClick={handlePost}
//               disabled={isPosting}
//             >
//               {isPosting ? 'Posting…' : 'Post'}
//             </button>
//           </PreviewCard>
//         </PreviewOverlay>
//       )}

//       {/* ── Success Screen ── */}
//       {postSuccess && (
//         <PreviewOverlay>
//           <PreviewCard style={{ alignItems: 'center', textAlign: 'center', gap: '1rem', padding: '2rem 1.5rem' }}>
//             <BsCheckCircleFill style={{ fontSize: '3rem', color: '#10B981' }} />
//             <h3 style={{ margin: 0, fontSize: '1.1em', fontWeight: 700 }}>Board Posted!</h3>
//             <p style={{ margin: 0, color: '#6B7280', fontSize: '0.9em' }}>
//               Your appreciation board has been created and your message has been posted.
//               {selectedCapacity.price && ' You will be redirected to complete payment.'}
//             </p>
//             <button className="post_btn" onClick={() => { setPostSuccess(false); setShowPreview(false) }}>
//               Done
//             </button>
//           </PreviewCard>
//         </PreviewOverlay>
//       )}
//     </PostCreationWrapper>
//   )
// }

// // ─── Preview Panel Styled Components ─────────────────────────────────────────

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

//     .preview_title {
//       font-size: 1em;
//       font-weight: 700;
//       color: var(--text-color, #111);
//     }

//     .preview_close {
//       width: 28px;
//       height: 28px;
//       border-radius: 50%;
//       border: 1.5px solid #ECEFF3;
//       background: transparent;
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       font-size: 1.1em;
//       cursor: pointer;
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

//     .row_label {
//       font-size: 0.93em;
//       font-weight: 500;
//       color: var(--text-color, #111);
//     }

//     .row_value {
//       display: flex;
//       align-items: center;
//       gap: 4px;
//       font-size: 0.87em;
//       color: #9CA3AF;
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
//     position: absolute;
//     inset: 0;
//     width: 100%;
//     height: 100%;
//     object-fit: cover;
//   }

//   .thumb_text {
//     position: relative;
//     z-index: 1;
//     max-width: 80%;
//     text-align: center;
//     word-break: break-word;
//     line-height: 1.4;
//     font-weight: 600;
//   }

//   .thumb_placeholder {
//     color: #D1D5DB;
//     font-size: 2em;
//   }
// `

// const SubModal = styled.div`
//   background: #fff;
//   border-radius: 16px;
//   border: 1.5px solid #ECEFF3;
//   padding: 1rem 1rem 0.5rem;
//   display: flex;
//   flex-direction: column;
//   gap: 0;
//   box-shadow: 0 4px 20px rgba(0,0,0,0.08);

//   .sub_title {
//     font-size: 1em;
//     font-weight: 700;
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
//       width: 20px;
//       height: 20px;
//       border-radius: 50%;
//       border: 1.5px solid #D1D5DB;
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       flex-shrink: 0;
//       transition: border-color 0.15s;

//       &.filled {
//         border-color: transparent;
//         .radio_icon { color: #10B981; font-size: 1.15em; }
//       }
//     }

//     .sub_label {
//       flex: 1;
//       font-size: 0.9em;
//       font-weight: 500;
//       color: var(--text-color, #111);
//     }

//     .sub_badge {
//       font-size: 0.78em;
//       font-weight: 600;
//       padding: 3px 10px;
//       border-radius: 99px;

//       &.free { color: #6B7280; background: transparent; }
//       &.pay  { color: var(--primary-color, #EF5A42); background: rgba(239,90,66,0.1); }
//     }
//   }
// `

// const CanvasArea = styled.div`
//   width: 100%;
//   aspect-ratio: ${({ $ratio }) => $ratio === 'portrait' ? '4 / 5' : '1 / 1'};
//   border-radius: 12px;
//   border: 1.5px solid #ECEFF3;
//   overflow: hidden;
//   position: relative;
//   transition: aspect-ratio 0.3s ease;

//   .canvas_image {
//     position: absolute;
//     inset: 0;
//     width: 100%;
//     height: 100%;
//     object-fit: cover;
//     z-index: 1;
//   }

//   .remove_image_btn {
//     position: absolute;
//     top: 8px;
//     right: 8px;
//     z-index: 5;
//     width: 26px;
//     height: 26px;
//     border-radius: 50%;
//     background: rgba(0,0,0,0.55);
//     border: none;
//     color: #fff;
//     font-size: 1em;
//     display: flex;
//     align-items: center;
//     justify-content: center;
//     cursor: pointer;
//     backdrop-filter: blur(4px);
//     transition: background 0.2s, transform 0.15s;
//     &:hover { background: rgba(239,90,66,0.85); transform: scale(1.1); }
//   }

//   .canvas_empty {
//     position: absolute;
//     inset: 0;
//     display: flex;
//     flex-direction: column;
//     align-items: center;
//     justify-content: center;
//     gap: 0.5rem;
//     color: #9CA3AF;
//     .empty_icon { font-size: 1.8em; }
//     span { font-size: 0.85em; }
//   }
// `

// const PostCreationWrapper = styled.div`
//   display: flex;
//   flex-direction: column;
//   gap: 0.75rem;
//   width: 100%;

//   .tab_switcher {
//     display: flex;
//     background: #F3F4F6;
//     border-radius: 99px;
//     padding: 4px;
//     gap: 2px;
//   }

//   .tab_btn {
//     flex: 1;
//     display: flex;
//     align-items: center;
//     justify-content: center;
//     gap: 0.4rem;
//     height: 36px;
//     border: none;
//     border-radius: 99px;
//     background: transparent;
//     color: var(--light-text-color, #6B7280);
//     font-size: 0.9em;
//     cursor: pointer;
//     transition: background 0.2s, color 0.2s;
//     &.active {
//       background: #fff;
//       color: var(--text-color, #111);
//       font-weight: 600;
//       box-shadow: 0 1px 4px rgba(0,0,0,0.08);
//     }
//     svg { font-size: 0.95em; }
//   }

//   .select_row {
//     display: flex;
//     align-items: center;
//     justify-content: space-between;
//     padding: 0 1rem;
//     height: 50px;
//     background: #F9FAFB;
//     border-radius: 10px;
//     border: 1.5px solid #ECEFF3;
//     cursor: pointer;
//     transition: border-color 0.2s;
//     &:hover { border-color: var(--primary-color); }
//     .select_placeholder { font-size: 0.95em; color: #9CA3AF; flex: 1; }
//     .select_event_emoji { font-size: 1.1em; margin-right: 0.5rem; flex-shrink: 0; }
//     .select_value { flex: 1; font-size: 0.95em; font-weight: 500; color: var(--text-color, #111); }
//     .select_arrow { color: #9CA3AF; font-size: 0.9em; flex-shrink: 0; }
//   }

//   .input_row {
//     .send_input {
//       width: 100%;
//       height: 50px;
//       padding: 0 1rem;
//       background: #F9FAFB;
//       border: 1.5px solid #ECEFF3;
//       border-radius: 10px;
//       font-size: 0.95em;
//       color: var(--text-color, #111);
//       outline: none;
//       transition: border-color 0.2s;
//       box-sizing: border-box;
//       &::placeholder { color: #9CA3AF; }
//       &:focus { border-color: var(--primary-color); background: #fff; }
//     }
//   }

//   .aspect_row {
//     display: flex;
//     align-items: center;
//     gap: 0.5rem;
//     padding: 0 0.25rem;

//     .aspect_label {
//       flex: 1;
//       font-size: 0.95em;
//       color: var(--text-color, #111);
//       font-weight: 500;
//     }

//     .ratio_toggles {
//       display: flex;
//       gap: 6px;
//       align-items: center;
//     }

//     .ratio_btn {
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       border: 1.5px solid #ECEFF3;
//       background: #F9FAFB;
//       cursor: pointer;
//       color: var(--primary-color);
//       font-size: 0.8em;
//       border-radius: 5px;
//       transition: border-color 0.2s, background 0.2s;

//       &.square_btn  { width: 28px; height: 28px; }
//       &.portrait_btn { width: 22px; height: 28px; }

//       &.active {
//         border-color: var(--primary-color);
//         background: rgba(239,90,66,0.06);
//       }
//       &:hover:not(.active) { border-color: #D1D5DB; }
//     }
//   }

//   .toolbar {
//     display: flex;
//     gap: 6px;

//     .tool_btn {
//       flex: 1;
//       display: flex;
//       flex-direction: column;
//       align-items: center;
//       justify-content: center;
//       gap: 4px;
//       padding: 0.6rem 0.25rem;
//       background: transparent;
//       border: 1.5px dashed #D1D5DB;
//       border-radius: 10px;
//       color: var(--light-text-color, #6B7280);
//       font-size: 0.75em;
//       cursor: pointer;
//       transition: border-color 0.2s, color 0.2s, background 0.2s;
//       svg { font-size: 1.2em; }
//       &:hover { border-color: var(--primary-color); color: var(--primary-color); }
//       &.set {
//         border-style: solid;
//         border-color: var(--primary-color);
//         color: var(--primary-color);
//         background: rgba(239,90,66,0.04);
//       }
//     }
//   }

//   .preview_btn {
//     width: 100%;
//     height: 50px;
//     border: none;
//     border-radius: 25px;
//     background: var(--primary-color, #EF5A42);
//     color: #fff;
//     font-size: 1em;
//     font-weight: 600;
//     cursor: not-allowed;
//     opacity: 0.4;
//     transition: opacity 0.2s;
//     &.ready { opacity: 1; cursor: pointer; &:hover { opacity: 0.88; } }
//   }
// `

// // ─── Post Message Page ────────────────────────────────────────────────────────

// const PostMessagePage = ({ onClose }) => {
//   useFonts()

//   return (
//     <Wrapper>
//       <div className="page_header">
//         <button className="close_btn" onClick={onClose}><BsX /></button>
//         <h2 className="page_title">Board your appreciation</h2>
//         <div className="tier_badge">Free Tier</div>
//       </div>

//       <div className="page_body">
//         <div className="setup_outline">
//           <PostCreationComponent type="board" />
//         </div>
//       </div>
//     </Wrapper>
//   )
// }

// const Wrapper = styled.div`
//   width: 100vw;
//   min-height: 100vh;
//   display: flex;
//   flex-direction: column;
//   background: var(--bg-color, #F7F5F0);

//   .page_header {
//     position: sticky;
//     top: 0;
//     z-index: 10;
//     width: 100%;
//     height: 64px;
//     display: flex;
//     align-items: center;
//     justify-content: space-between;
//     padding: 0 1.5rem;
//     background: var(--bg-color, #F7F5F0);
//     border-bottom: 1px solid rgba(0,0,0,0.06);
//     box-sizing: border-box;
//   }

//   .close_btn {
//     width: 36px;
//     height: 36px;
//     border-radius: 50%;
//     border: 1.5px solid #ECEFF3;
//     background: transparent;
//     display: flex;
//     align-items: center;
//     justify-content: center;
//     font-size: 1.3em;
//     color: var(--text-color, #111);
//     cursor: pointer;
//     transition: border-color 0.2s, color 0.2s;
//     &:hover { border-color: var(--primary-color); color: var(--primary-color); }
//   }

//   .page_title {
//     font-size: 1.1em;
//     font-weight: 700;
//     color: var(--text-color, #111);
//     margin: 0;
//     position: absolute;
//     left: 50%;
//     transform: translateX(-50%);
//   }

//   .tier_badge {
//     padding: 0.35rem 1rem;
//     border-radius: 99px;
//     border: 1.5px solid #ECEFF3;
//     background: #fff;
//     font-size: 0.85em;
//     font-weight: 500;
//     color: var(--text-color, #111);
//     white-space: nowrap;
//   }

//   .page_body {
//     flex: 1;
//     display: flex;
//     flex-direction: column;
//     align-items: center;
//     padding: 2rem 1rem 4rem;
//     overflow-y: auto;
//   }

//   .setup_outline {
//     width: 100%;
//     max-width: 480px;
//     background: #fff;
//     border-radius: 16px;
//     display: flex;
//     flex-direction: column;
//     padding: 1.5rem;
//     gap: 1rem;
//     box-shadow: 0 4px 24px rgba(0,0,0,0.06);
//   }

//   @media only screen and (min-width: 768px) {
//     .setup_outline { padding: 2rem; }
//     .page_body { justify-content: center; }
//   }
// `

// export default PostMessagePage


import React from 'react'
import styled from 'styled-components'
import { BsX } from 'react-icons/bs'
import useFonts from '../../hooks/UseFonts'
import PostCreationComponent from '../../components/message/PostCreationComponent'

const PostMessagePage = ({ onClose }) => {
  useFonts()

  return (
    <Wrapper>
      <div className="page_header">
        <button className="close_btn" onClick={onClose}><BsX /></button>
        <h2 className="page_title">Board your appreciation</h2>
        <div className="tier_badge">Free Tier</div>
      </div>

      <div className="page_body">
        <div className="setup_outline">
          <PostCreationComponent type="board" />
        </div>
      </div>
    </Wrapper>
  )
}

const Wrapper = styled.div`
  width: 100vw;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-color, #F7F5F0);

  .page_header {
    position: sticky;
    top: 0;
    z-index: 10;
    width: 100%;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 1.5rem;
    background: var(--bg-color, #F7F5F0);
    border-bottom: 1px solid rgba(0,0,0,0.06);
    box-sizing: border-box;
  }

  .close_btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 1.5px solid #ECEFF3;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.3em;
    color: var(--text-color, #111);
    cursor: pointer;
    transition: border-color 0.2s, color 0.2s;
    &:hover { border-color: var(--primary-color, #EF5A42); color: var(--primary-color, #EF5A42); }
  }

  .page_title {
    font-size: 1.1em;
    font-weight: 700;
    color: var(--text-color, #111);
    margin: 0;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
  }

  .tier_badge {
    padding: 0.35rem 1rem;
    border-radius: 99px;
    border: 1.5px solid #ECEFF3;
    background: #fff;
    font-size: 0.85em;
    font-weight: 500;
    color: var(--text-color, #111);
    white-space: nowrap;
  }

  .page_body {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem 1rem 4rem;
    overflow-y: auto;
  }

  .setup_outline {
    width: 100%;
    max-width: 480px;
    background: #fff;
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    padding: 1.5rem;
    gap: 1rem;
    box-shadow: 0 4px 24px rgba(0,0,0,0.06);
  }

  @media only screen and (min-width: 768px) {
    .setup_outline { padding: 2rem; }
    .page_body { justify-content: center; }
  }
`

export default PostMessagePage