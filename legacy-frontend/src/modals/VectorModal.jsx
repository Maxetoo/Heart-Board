import { useState } from 'react'
import styled from 'styled-components'
import { BsCheckLg } from 'react-icons/bs'
import { RxCross2 } from 'react-icons/rx'
import { IoSearch } from 'react-icons/io5'
import { ModalBackdrop, ModalBox, SearchInput } from '../sharedStyles/index'
import { VECTOR_ICONS } from '../constants/messageConstant'

const VectorModal = ({ onClose, onConfirm }) => {
  const [search, setSearch]     = useState('')
  const [selected, setSelected] = useState(null)

  const filtered = VECTOR_ICONS.filter(v =>
    v.label.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <ModalBackdrop onClick={onClose}>
      <ModalBox onClick={e => e.stopPropagation()}>
        <div className="modal_header">
          <h3>Vector</h3>
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

        <VectorGrid>
          {filtered.map(v => {
            const Icon = v.icon
            const isActive = selected?.id === v.id
            return (
              <div
                key={v.id}
                className={`vector_cell ${isActive ? 'active' : ''}`}
                onClick={() => setSelected(v)}
              >
                <Icon />
                {isActive && (
                  <span className="vector_check">
                    <BsCheckLg />
                  </span>
                )}
              </div>
            )
          })}
        </VectorGrid>

        <button
          className="modal_continue"
          disabled={!selected}
          onClick={() => onConfirm({ ...selected, color: '#2d3748', opacity: 1 })}
        >
          Continue
        </button>
      </ModalBox>
    </ModalBackdrop>
  )
}

const VectorGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;

  .vector_cell {
    aspect-ratio: 1;
    background: #F3F4F6;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.6em;
    color: var(--text-color, #2d3748);
    cursor: pointer;
    position: relative;
    border: 2px solid transparent;

    &.active {
      background: #F3F4F6;
    }

    .vector_check {
      position: absolute;
      top: 4px;
      right: 4px;
      width: 15px;
      height: 15px;
      border-radius: 50%;
      background: #22c55e;
      border: 2px solid #22c55e;
      display: flex;
      align-items: center;
      justify-content: center;
      svg { font-size: 0.45em; color: #fff; }
    }
  }
`

export default VectorModal
