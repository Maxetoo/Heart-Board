import React, { useState } from 'react'
import styled from 'styled-components'
import { BsX, BsCheck2 } from 'react-icons/bs'
import { ModalBackdrop, ModalBox } from '../sharedStyles/index'
import { EVENTS } from '../constants/messageConstant'

const EventModal = ({ onClose, onConfirm, currentEvent }) => {
  const [selected, setSelected]       = useState(currentEvent || null)
  const [customEvent, setCustomEvent] = useState(currentEvent?.custom || '')

  const canContinue = selected?.id !== 'others' || customEvent.trim().length > 0

  const handleConfirm = () => {
    if (!selected) { onConfirm(null); return }
    const payload = selected.id === 'others'
      ? { ...selected, custom: customEvent.trim(), label: customEvent.trim() || 'Others' }
      : selected
    onConfirm(payload)
  }

  return (
    <ModalBackdrop onClick={onClose}>
      <ModalBox onClick={(e) => e.stopPropagation()}>
        <div className="modal_header">
          <h3>Choose Event</h3>
          <button className="modal_close" onClick={onClose}><BsX /></button>
        </div>

        <EventGrid>
          {EVENTS.map((ev) => {
            const isActive = selected?.id === ev.id
            return (
              <div
                key={ev.id}
                className={`event_cell ${isActive ? 'active' : ''}`}
                onClick={() => setSelected(isActive ? null : ev)}
              >
                <div className={`event_radio ${isActive ? 'active' : ''}`}>
                  {isActive && <BsCheck2 className="radio_check" />}
                </div>
                <span className="event_emoji">{ev.emoji}</span>
                <span className="event_label">{ev.label}</span>
              </div>
            )
          })}
        </EventGrid>

        {selected?.id === 'others' && (
          <OthersInput
            type="text"
            placeholder="Describe your event..."
            value={customEvent}
            onChange={(e) => setCustomEvent(e.target.value)}
            autoFocus
          />
        )}

        <button
          className="modal_continue"
          disabled={!canContinue}
          onClick={handleConfirm}
        >
          Continue
        </button>
      </ModalBox>
    </ModalBackdrop>
  )
}

const OthersInput = styled.input`
  width: 100%;
  height: 48px;
  padding: 0 1rem;
  border: 1.5px solid var(--primary-color, #EF5A42);
  border-radius: 10px;
  background: rgba(239,90,66,0.03);
  font-size: 0.95em;
  color: var(--text-color, #111);
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s;
  &::placeholder { color: #9CA3AF; }
  &:focus { background: #fff; }
`

const EventGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  max-height: 380px;
  overflow-y: auto;
  padding-right: 2px;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 99px; }

  .event_cell {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.7rem 0.85rem;
    border-radius: 12px;
    background: #F9FAFB;
    border: 1.5px solid #ECEFF3;
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s;
    &:hover:not(.active) { border-color: #D1D5DB; }
    &.active {
      border-color: var(--primary-color, #EF5A42);
      background: rgba(239,90,66,0.04);
    }
  }

  .event_radio {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 1.5px solid #D1D5DB;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: border-color 0.2s, background 0.2s;
    &.active {
      border-color: var(--primary-color, #EF5A42);
      background: var(--primary-color, #EF5A42);
    }
    .radio_check { font-size: 0.65em; color: #fff; }
  }

  .event_emoji {
    font-size: 1.05em;
    flex-shrink: 0;
    line-height: 1;
  }

  .event_label {
    font-size: 0.88em;
    font-weight: 500;
    color: var(--text-color, #111);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`

export default EventModal