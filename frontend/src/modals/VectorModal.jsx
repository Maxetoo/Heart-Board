import React, { useState } from 'react'
import styled from 'styled-components'
import { BsX, BsSearch } from 'react-icons/bs'
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
      <ModalBox onClick={(e) => e.stopPropagation()}>
        <div className="modal_header">
          <h3>Vector</h3>
          <button className="modal_close" onClick={onClose}><BsX /></button>
        </div>

        <SearchInput>
          <BsSearch className="search_icon" />
          <input
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </SearchInput>

        <VectorGrid>
          {filtered.map((v) => {
            const Icon = v.icon
            return (
              <div
                key={v.id}
                className={`vector_cell ${selected?.id === v.id ? 'active' : ''}`}
                onClick={() => setSelected(v)}
              >
                <Icon />
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
    border: 2px solid transparent;
    transition: border-color 0.2s, background 0.2s;
    &:hover { background: #E9ECEF; }
    &.active {
      border-color: var(--primary-color, #EF5A42);
      background: rgba(239,90,66,0.06);
    }
  }
`

export default VectorModal