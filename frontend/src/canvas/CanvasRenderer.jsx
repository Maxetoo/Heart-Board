import React, { useRef, useState, useEffect } from 'react'
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

// The width at which content was originally authored
const REFERENCE_WIDTH = 300

const CanvasRenderer = ({ canvasData, style, className }) => {
  const outerRef = useRef(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    if (!outerRef.current) return
    const obs = new ResizeObserver(entries => {
      const w = entries[0].contentRect.width
      if (w > 0) setScale(w / REFERENCE_WIDTH)
    })
    obs.observe(outerRef.current)
    return () => obs.disconnect()
  }, [])

  if (!canvasData) return null

  const {
    canvasBg,
    canvasFrame,
    aspectRatio = 'portrait',
  } = canvasData

  // Support both plural-array format (current) and singular-key format (legacy)
  const canvasImages = canvasData.canvasImages?.length
    ? canvasData.canvasImages
    : canvasData.canvasImage
      ? [{ id: 'img_0', src: canvasData.canvasImage, size: canvasData.imageSize ?? 80, position: canvasData.imagePosition ?? { x: 50, y: 50 } }]
      : []

  const canvasTexts = canvasData.canvasTexts?.length
    ? canvasData.canvasTexts
    : canvasData.canvasText
      ? [canvasData.canvasText]
      : []

  const canvasVectors = canvasData.canvasVectors?.length
    ? canvasData.canvasVectors
    : canvasData.canvasVector
      ? [canvasData.canvasVector]
      : []

  const ratioMultiplier = aspectRatio === 'landscape' ? 3 / 4 : aspectRatio === 'portrait' ? 4 / 3 : 1
  const stageHeight = REFERENCE_WIDTH * ratioMultiplier

  return (
    <Canvas
      ref={outerRef}
      $ratio={aspectRatio}
      className={className}
      style={{
        background: canvasBg?.value || '#FFFFFF',
        ...(canvasFrame
          ? { border: canvasFrame.border, borderRadius: canvasFrame.borderRadius }
          : {}),
        ...style,
      }}
    >
      <InnerStage
        style={{
          width:  REFERENCE_WIDTH,
          height: stageHeight,
          transform: `scale(${scale})`,
        }}
      >
        {canvasImages.map(img => (
          <Layer key={img.id} style={{ left: `${img.position?.x ?? 50}%`, top: `${img.position?.y ?? 50}%` }}>
            <img
              src={img.src}
              alt=""
              style={{
                width:  `${img.size * 2}px`,
                height: `${img.size * 2}px`,
                objectFit: 'cover',
                borderRadius: 6,
                display: 'block',
              }}
            />
          </Layer>
        ))}

        {canvasVectors.map(vec => {
          const iconId = vec.icon || vec.vectorId
          const VIcon  = iconId ? VECTOR_ICON_MAP[iconId] : null
          return VIcon ? (
            <Layer key={vec.id} style={{ left: `${vec.position?.x ?? 50}%`, top: `${vec.position?.y ?? 30}%` }}>
              <VIcon style={{
                color:    vec.color,
                opacity:  vec.opacity,
                fontSize: vec.size ?? 48,
                display:  'block',
              }} />
            </Layer>
          ) : null
        })}

        {canvasTexts.map(txt => (
          <Layer key={txt.id} style={{ left: `${txt.position?.x ?? 50}%`, top: `${txt.position?.y ?? 50}%` }}>
            <p style={{
              margin:     0,
              fontFamily: txt.font?.family,
              color:      txt.color,
              fontSize:   txt.fontSize ?? 16,
              maxWidth:   200,
              textAlign:  'center',
              lineHeight: 1.35,
              wordBreak:  'break-word',
              ...txt.font?.style,
            }}>
              {txt.content}
            </p>
          </Layer>
        ))}
      </InnerStage>
    </Canvas>
  )
}

const Canvas = styled.div`
  width: 100%;
  aspect-ratio: ${({ $ratio }) => {
    if ($ratio === 'landscape') return '4 / 3'
    if ($ratio === 'portrait')  return '3 / 4'
    return '1 / 1'
  }};
  border-radius: 30px;
  overflow: hidden;
  position: relative;
  flex-shrink: 0;
  clip-path: inset(0 round 30px);
`

const InnerStage = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: top left;
`

const Layer = styled.div`
  position: absolute;
  transform: translate(-50%, -50%);
  pointer-events: none;
`

export default CanvasRenderer
