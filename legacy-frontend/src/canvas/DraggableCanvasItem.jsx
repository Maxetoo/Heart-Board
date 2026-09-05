import React, { useRef } from 'react'
import styled from 'styled-components'

const DraggableCanvasItem = ({ position, onPositionChange, onTap, selected, onSelect, children }) => {
  const elRef   = useRef(null)
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, origX: 0, origY: 0, moved: false })

  const getClientXY = (e) => {
    if (e.touches) return { cx: e.touches[0].clientX, cy: e.touches[0].clientY }
    return { cx: e.clientX, cy: e.clientY }
  }

  const onPointerDown = (e) => {
    e.stopPropagation()
    onSelect()
    const { cx, cy } = getClientXY(e)
    dragRef.current = { dragging: true, startX: cx, startY: cy, origX: position.x, origY: position.y, moved: false }

    const canvas = elRef.current?.closest('[data-canvas]')
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()

    const onMove = (ev) => {
      if (!dragRef.current.dragging) return
      const { cx: mx, cy: my } = getClientXY(ev)
      const dx = mx - dragRef.current.startX
      const dy = my - dragRef.current.startY
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragRef.current.moved = true
      const nx = Math.min(95, Math.max(5, dragRef.current.origX + (dx / rect.width) * 100))
      const ny = Math.min(95, Math.max(5, dragRef.current.origY + (dy / rect.height) * 100))
      onPositionChange({ x: nx, y: ny })
    }

    const onUp = () => {
      if (!dragRef.current.moved) onTap()
      dragRef.current.dragging = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchend', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchend', onUp)
  }

  return (
    <DraggableItem
      ref={elRef}
      $x={position.x}
      $y={position.y}
      $selected={selected}
      onMouseDown={onPointerDown}
      onTouchStart={onPointerDown}
    >
      {children}
      {selected && <div className="drag_hint">drag • tap to edit</div>}
    </DraggableItem>
  )
}

const DraggableItem = styled.div`
  position: absolute;
  left: ${({ $x }) => $x}%;
  top: ${({ $y }) => $y}%;
  transform: translate(-50%, -50%);
  cursor: grab;
  user-select: none;
  touch-action: none;
  z-index: 10;
  transition: left 0.05s linear, top 0.05s linear;

  &:active { cursor: grabbing; }

  ${({ $selected }) => $selected && `
    outline: 2px dashed rgba(239,90,66,0.7);
    outline-offset: 6px;
    border-radius: 4px;
  `}

  .drag_hint {
    position: absolute;
    bottom: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0,0,0,0.65);
    color: #fff;
    font-size: 0.62rem;
    padding: 3px 8px;
    border-radius: 99px;
    white-space: nowrap;
    pointer-events: none;
    letter-spacing: 0.4px;
  }
`

export default DraggableCanvasItem