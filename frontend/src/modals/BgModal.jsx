import React, { useState } from 'react'
import styled from 'styled-components'
import { BsX } from 'react-icons/bs'
import { IoSearch } from 'react-icons/io5'
import { ModalBackdrop, ModalBox, SearchInput } from '../sharedStyles/index'
import { BG_OPTIONS } from '../constants/messageConstant'

const BgModal = ({ onClose, onConfirm, currentBg }) => {
  const [search, setSearch]     = useState('')
  const [selected, setSelected] = useState(currentBg || null)

  const filtered = BG_OPTIONS.filter(b =>
    b.label.toLowerCase().includes(search.toLowerCase())
  )

  const handleCellClick = (bg) => {
    setSelected(prev => prev?.id === bg.id ? null : bg)
  }

  return (
    <ModalBackdrop onClick={onClose}>
      <ModalBox onClick={(e) => e.stopPropagation()}>
        <div className="modal_header">
          <h3>Background</h3>
          <button className="modal_close" onClick={onClose}><BsX /></button>
        </div>

        <SearchInput>
          <IoSearch className="search_icon" />
          <input
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </SearchInput>

        <BgGrid>
          {filtered.map((bg) => (
            <div
              key={bg.id}
              className={`bg_cell ${selected?.id === bg.id ? 'active' : ''}`}
              style={{ background: bg.value }}
              onClick={() => handleCellClick(bg)}
            >
              {selected?.id === bg.id && (
                <div className="bg_check"><BsX /></div>
              )}
            </div>
          ))}
        </BgGrid>

        <button className="modal_continue" onClick={() => onConfirm(selected)}>
          {selected ? 'Apply Background' : 'Remove Background'}
        </button>
      </ModalBox>
    </ModalBackdrop>
  )
}

const BgGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;

  .bg_cell {
    aspect-ratio: 1;
    border-radius: 10px;
    cursor: pointer;
    border: 2px solid transparent;
    position: relative;
    overflow: hidden;
    transition: transform 0.15s, border-color 0.2s;
    &:hover { transform: scale(1.04); }
    &.active { border-color: var(--primary-color, #EF5A42); }

    .bg_check {
      position: absolute;
      bottom: 4px;
      right: 4px;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: var(--primary-color, #EF5A42);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8em;
    }
  }
`

export default BgModal