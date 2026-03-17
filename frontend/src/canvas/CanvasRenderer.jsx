import React from 'react'
import styled from 'styled-components'
import {
  BsHeart, BsHandThumbsUp, BsEmojiSmile, BsStar,
  BsSun, BsFire, BsMusicNote, BsMusicNoteBeamed,
  BsHeadphones, BsTrophy, BsBalloon, BsGift,
  BsDiamond, BsAward, BsClock, BsBriefcase,
} from 'react-icons/bs'

const VECTOR_ICON_MAP = {
  heart:      BsHeart,
  thumbsup:   BsHandThumbsUp,
  smile:      BsEmojiSmile,
  star:       BsStar,
  sun:        BsSun,
  fire:       BsFire,
  music:      BsMusicNote,
  music2:     BsMusicNoteBeamed,
  headphones: BsHeadphones,
  trophy:     BsTrophy,
  balloon:    BsBalloon,
  gift:       BsGift,
  diamond:    BsDiamond,
  award:      BsAward,
  clock:      BsClock,
  briefcase:  BsBriefcase,
}


const CanvasRenderer = ({ canvasData, style, className }) => {
  if (!canvasData) return null

  const {
    canvasBg,
    canvasImage,
    imageSize = 80,
    imagePosition = { x: 50, y: 50 },
    canvasText,
    canvasVector,
    canvasFrame,
    aspectRatio = 'square',
  } = canvasData

  const iconId     = canvasVector?.icon || canvasVector?.id
  const VectorIcon = iconId ? VECTOR_ICON_MAP[iconId] : null

  return (
    <Canvas
      $ratio={aspectRatio}
      className={className}
      style={{
        background: canvasBg?.value || '#F9FAFB',
        ...(canvasFrame
          ? { border: canvasFrame.border, borderRadius: canvasFrame.borderRadius }
          : {}),
        ...style,
      }}
    >
      {canvasImage && (
        <Layer style={{ left: `${imagePosition.x}%`, top: `${imagePosition.y}%` }}>
          <img
            src={canvasImage}
            alt=""
            style={{
              width: `${imageSize * 2}px`,
              height: `${imageSize * 2}px`,
              objectFit: 'cover',
              borderRadius: 6,
              display: 'block',
            }}
          />
        </Layer>
      )}

      {VectorIcon && canvasVector && (
        <Layer style={{
          left: `${canvasVector.position?.x ?? 75}%`,
          top:  `${canvasVector.position?.y ?? 20}%`,
        }}>
          <VectorIcon style={{
            color:     canvasVector.color,
            opacity:   canvasVector.opacity,
            fontSize:  canvasVector.size ?? 48,
            display:   'block',
          }} />
        </Layer>
      )}

      {canvasText && (
        <Layer style={{
          left: `${canvasText.position?.x ?? 50}%`,
          top:  `${canvasText.position?.y ?? 75}%`,
        }}>
          <p style={{
            margin:      0,
            fontFamily:  canvasText.font?.family,
            color:       canvasText.color,
            fontSize:    canvasText.fontSize ?? 16,
            maxWidth:    200,
            textAlign:   'center',
            lineHeight:  1.35,
            wordBreak:   'break-word',
            ...canvasText.font?.style,
          }}>
            {canvasText.content}
          </p>
        </Layer>
      )}
    </Canvas>
  )
}

const Canvas = styled.div`
  width: 100%;
  aspect-ratio: ${({ $ratio }) => $ratio === 'portrait' ? '4 / 5' : '1 / 1'};
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  flex-shrink: 0;
`

const Layer = styled.div`
  position: absolute;
  transform: translate(-50%, -50%);
  pointer-events: none;
`

export default CanvasRenderer