import { useState } from 'react'
import styled from 'styled-components'
import { BsCheckLg } from 'react-icons/bs'
import { RxCross2 } from 'react-icons/rx'
import { IoSearch } from 'react-icons/io5'
import { ModalBackdrop, ModalBox, SearchInput } from '../sharedStyles/index'
import { BG_OPTIONS } from '../constants/messageConstant'

const BgModal = ({ onClose, onConfirm, currentBg }) => {
  const [search, setSearch]     = useState('')
  const [selected, setSelected] = useState(currentBg || null)

  const filtered = BG_OPTIONS.filter(b =>
    b.label.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <ModalBackdrop onClick={onClose}>
      <ModalBox onClick={e => e.stopPropagation()}>
        <div className="modal_header">
          <h3>Background</h3>
          <button className="modal_close" onClick={onClose}><RxCross2 /></button>
        </div>

        <SearchInput>
          <IoSearch className="search_icon" />
          <input
            placeholder="Search"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </SearchInput>

        <BgGrid>
          {filtered.map(bg => {
            const isActive = selected?.id === bg.id
            return (
              <div
                key={bg.id}
                className={`bg_cell ${isActive ? 'active' : ''}`}
                style={{ background: bg.value }}
                onClick={() => setSelected(prev => prev?.id === bg.id ? null : bg)}
              >
                {isActive && (
                  <span className="bg_check">
                    <BsCheckLg />
                  </span>
                )}
              </div>
            )
          })}
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

    .bg_check {
      position: absolute;
      top: 4px;
      right: 4px;
      width: 15px;
      height: 15px;
      border-radius: 50%;
      background: #22c55e;
      display: flex;
      align-items: center;
      justify-content: center;
      svg { font-size: 0.45em; color: #fff; }
    }
  }
`

export default BgModal
