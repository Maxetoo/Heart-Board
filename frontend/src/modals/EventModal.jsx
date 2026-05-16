import { useState } from 'react'
import styled from 'styled-components'
import { BsCheckLg } from 'react-icons/bs'
import { RxCross2 } from 'react-icons/rx'
import { ModalBackdrop } from '../sharedStyles/index'
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
      <FilterBox onClick={e => e.stopPropagation()}>
        <FilterTitle>Choose Event</FilterTitle>
        <FilterDivider />

        <EventGrid>
          {EVENTS.map(ev => {
            const isActive = selected?.id === ev.id
            return (
              <EventCell key={ev.id} onClick={() => setSelected(isActive ? null : ev)}>
                <span className="ev_emoji">{ev.emoji}</span>
                <span className="ev_label">{ev.label}</span>
                <CheckCircle $active={isActive}>
                  {isActive && <BsCheckLg />}
                </CheckCircle>
              </EventCell>
            )
          })}
        </EventGrid>

        {selected?.id === 'others' && (
          <OthersInput
            type="text"
            placeholder="Describe your event..."
            value={customEvent}
            onChange={e => setCustomEvent(e.target.value)}
            autoFocus
          />
        )}

        <ContinueBtn disabled={!canContinue} onClick={handleConfirm}>
          Continue
        </ContinueBtn>
      </FilterBox>
    </ModalBackdrop>
  )
}

const FilterBox = styled.div`
  background: #fff;
  border-radius: 24px;
  padding: 1.75rem;
  width: 100%;
  max-width: 420px;
  max-height: 85vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const FilterTitle = styled.h3`
  font-size: 1.1em;
  font-weight: 700;
  color: #111;
  margin: 0;
`

const FilterDivider = styled.hr`
  border: none;
  border-top: 1.5px solid #f0f0f0;
  margin: 0;
`

const EventGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
`

const EventCell = styled.div`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 1rem 0.65rem;
  margin: 2px;
  border-radius: 12px;
  background: #f9fafb;
  border: none;
  cursor: pointer;

  .ev_emoji {
    font-size: 1em;
    line-height: 1;
  }

  .ev_label {
    font-size: 0.86em;
    font-weight: 500;
    color: #111;
    flex: 1;
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
  svg {
    font-size: 0.55em;
    color: #fff;
  }
`

const ContinueBtn = styled.button`
  width: 100%;
  height: 52px;
  border: none;
  border-radius: 99px;
  background: #ef5a42;
  color: #fff;
  font-weight: 600;
  font-size: 1em;
  cursor: pointer;
  opacity: ${p => p.disabled ? 0.45 : 1};
`

const OthersInput = styled.input`
  width: 100%;
  height: 55px;
  padding: 0 1rem;
  border: none;
  border-radius: 10px;
  background: var(--secondary-color);
  font-size: 1em;
  color: var(--text-color, #111);
  outline: none;
  box-sizing: border-box;
  &::placeholder { color: #9CA3AF; }
`

export default EventModal
