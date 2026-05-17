import React, { useEffect, useRef, useState, useCallback } from 'react'
import html2canvas from 'html2canvas'
import styled, { keyframes } from 'styled-components'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import {
  BsHeart, BsHeartFill, BsFlag,
  BsMicFill, BsPlayFill, BsPauseFill,
  BsCheckCircleFill, BsHouseFill,
} from 'react-icons/bs'
import { PiShareFat, PiHandsClapping, PiSmileyFill, PiFireFill, PiPlusBold, PiShareFatBold } from 'react-icons/pi'
import { RiDeleteBinLine, RiEdit2Line } from 'react-icons/ri'
import { AiFillLike } from 'react-icons/ai'
import { IoHeart } from 'react-icons/io5'
import { likeBoard, shareBoard, getBoardLikes, optimisticToggleLike, deleteBoard, invalidateBoardCaches } from '../../slices/boardSlice'
import { deleteMessage } from '../../slices/messageSlice'
import { invalidateMsgCache } from '../../utils/msgCache'
import { URL } from '../../paths/url'
import CanvasRenderer from '../../canvas/CanvasRenderer'
import LoginPopup from '../auth/LoginPopup'
import DefaultAvatar   from '../../assets/Vector.svg'
import shareFrame     from '../../assets/share profile/share profile frame.svg'
import heartboardLogo from '../../assets/Heartboard logo 2.svg'
import shareRect1     from '../../assets/share profile/share profile rectangle 1.svg'
import shareRect2     from '../../assets/share profile/share profile rectangle 2.svg'

const FLAG_REASONS = ['Deceitful', 'Derogatory', 'Evil', 'Spam', 'Inappropriate']

const REACTIONS = [
  { key: 'clap',   Icon: PiHandsClapping, color: '#fff' },
  { key: 'heart',  Icon: IoHeart,         color: '#fff' },
  { key: 'thumbs', Icon: AiFillLike,      color: '#fff' },
  { key: 'smile',  Icon: PiSmileyFill,    color: '#fff' },
  { key: 'fire',   Icon: PiFireFill,      color: '#fff' },
]

const SPONSOR_OPTIONS = [
  { id: 'sponsor_200',  label: 'Sponsor 200 curation',  price: 1,    display: 'Pay $1'    },
  { id: 'sponsor_1000', label: 'Sponsor 1000 curation', price: 100,  display: 'Pay $100'  },
  { id: 'unlimited',    label: 'Sponsor Unlimited',     price: 1000, display: 'Pay $1000' },
]

// ── Audio player ──────────────────────────────────────────────────────────────
const AudioPlayer = ({ src, senderUsername, onSenderClick, hideUsername, large = false }) => {
  const audioRef = useRef(null)
  const [playing,  setPlaying]  = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)

  const toggle = () => {
    const el = audioRef.current
    if (!el) return
    if (playing) { el.pause(); setPlaying(false) }
    else         { el.play();  setPlaying(true)  }
  }

  const onTimeUpdate = () => {
    const el = audioRef.current
    if (!el || !el.duration) return
    setProgress((el.currentTime / el.duration) * 100)
  }

  const onEnded = () => { setPlaying(false); setProgress(0) }
  const onLoadedMetadata = () => { if (audioRef.current) setDuration(audioRef.current.duration) }

  const seek = (e) => {
    const el = audioRef.current
    if (!el || !el.duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    el.currentTime = pct * el.duration
    setProgress(pct * 100)
  }

  const fmt = (s) => {
    if (!s || isNaN(s)) return '0:00'
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
  }

  return (
    <AudioWrap $large={large}>
      <audio ref={audioRef} src={src}
        onTimeUpdate={onTimeUpdate} onEnded={onEnded} onLoadedMetadata={onLoadedMetadata} />
      <span className="ripple" />
      <span className="ripple" />
      <span className="ripple" />
      <MicBtn onClick={toggle} $large={large}>
        <MicIconWrap $large={large}><BsMicFill /></MicIconWrap>
        <PlayIcon $large={large}>{playing ? <BsPauseFill /> : <BsPlayFill />}</PlayIcon>
      </MicBtn>
      <AudioBottom $large={large}>
        <AudioPlayBtn onClick={toggle}>
          {playing ? <BsPauseFill /> : <BsPlayFill />}
        </AudioPlayBtn>
        <AudioTrack onClick={seek} $visible={playing || progress > 0}>
          <AudioFill style={{ width: `${progress}%` }} />
        </AudioTrack>
        <AudioTime $visible={playing || progress > 0}>{fmt(duration)}</AudioTime>
      </AudioBottom>
      {!hideUsername && senderUsername && (
        <AudioSender
          $large={large}
          $clickable={!!onSenderClick}
          onClick={onSenderClick ?? undefined}
        >
          @{senderUsername}
        </AudioSender>
      )}
    </AudioWrap>
  )
}

// ── Main modal ────────────────────────────────────────────────────────────────
const BoardViewModal = ({ board: initialBoard, onClose, onPrev, onNext }) => {
  const dispatch  = useDispatch()
  const navigate  = useNavigate()
  const { userCookie }    = useSelector(s => s.auth)
  const { myProfile }     = useSelector(s => s.user)
  const { likedBoardIds } = useSelector(s => s.board)
  const isLoggedIn = !!userCookie

  const board = initialBoard

  const [fullBoard,       setFullBoard]       = useState(null)
  const [messages,        setMessages]        = useState([])
  const [msgIdx,          setMsgIdx]          = useState(0)
  const [likeCount,       setLikeCount]       = useState(0)
  const [messagesLoading, setMessagesLoading] = useState(true)

  const [showReactions,  setShowReactions]  = useState(false)
  const [selectedReaction, setSelectedReaction] = useState(null)

  const [showActionMenu, setShowActionMenu] = useState(false)

  const [showEditHint, setShowEditHint] = useState(() => !localStorage.getItem('board_edit_hint_dismissed'))

  const dismissEditHint = useCallback(() => {
    localStorage.setItem('board_edit_hint_dismissed', '1')
    setShowEditHint(false)
  }, [])

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteTarget,    setDeleteTarget]    = useState(null)
  const [deleteLoading,   setDeleteLoading]   = useState(false)

  const [showFlag,    setShowFlag]    = useState(false)
  const [showSponsor, setShowSponsor] = useState(false)
  const [showLogin,   setShowLogin]   = useState(false)
  const [showFullImg, setShowFullImg] = useState(false)
  const [showShare,   setShowShare]   = useState(false)
  const [linkCopied,  setLinkCopied]  = useState(false)

  const [flagReason,    setFlagReason]    = useState('')
  const [flagLoading,   setFlagLoading]   = useState(false)
  const [flagDone,      setFlagDone]      = useState(false)
  const [sponsorChoice, setSponsorChoice] = useState(SPONSOR_OPTIONS[0].id)

  const touchStart    = useRef(null)
  const touchStartY   = useRef(null)
  const lastTapTime   = useRef(0)
  const hintLastTap   = useRef(0)
  const shareFrameRef = useRef(null)

  const currentUserId = myProfile?._id?.toString()

  const isReceipent = !!(currentUserId && (
    fullBoard?.receipent?.toString() === currentUserId ||
    fullBoard?.receipent?._id?.toString() === currentUserId
  ))

  const isAnonymous = fullBoard?.visibility === 'anonymous'
  const isOwner     = !!(currentUserId && fullBoard?.owner?._id?.toString() === currentUserId)
  const myMessages  = messages.filter(m => m.sender?._id?.toString() === currentUserId)
  const hasEditActions = isOwner || myMessages.length > 0

  const currentMsg  = messages[msgIdx] ?? null
  const isEmblem    = currentMsg?.type === 'emblem' && !!currentMsg?.canvasData
  const isAudio     = currentMsg?.type === 'audio'
  const isMsgSender = !!(currentUserId && currentMsg?.sender?._id?.toString() === currentUserId)

  const fullscreenSrc =
    currentMsg?.content?.imageUrls?.[0] ||
    fullBoard?.coverImage ||
    messages.find(m => m.content?.imageUrls?.[0])?.content?.imageUrls?.[0] ||
    null

  const closeAllModals = useCallback(() => {
    setShowFlag(false); setShowSponsor(false); setShowLogin(false)
    setShowFullImg(false); setShowShare(false)
  }, [])

  useEffect(() => {
    if (!board?.slug) return
    let cancelled = false
    const t = setTimeout(() => {
      if (cancelled) return
      setFullBoard(null); setMessages([]); setMsgIdx(0); setLikeCount(0)
      setMessagesLoading(true)
    }, 0)

    axios.get(`${URL}/api/v1/board/${board.slug}`, { withCredentials: true })
      .then(r => {
        if (cancelled) return
        setFullBoard(r.data.board)
        setLikeCount(r.data.board?.stats?.likes ?? 0)
        setSelectedReaction(r.data.board?.lastReaction || null)
      })
      .catch(() => {})

    axios.get(`${URL}/api/v1/message/${board.slug}/board`, {
      params: { page: 1, limit: 50 }, withCredentials: true,
    })
      .then(r => { if (!cancelled) { setMessages(r.data.messages ?? []); setMessagesLoading(false) } })
      .catch(() => { if (!cancelled) setMessagesLoading(false) })

    return () => { cancelled = true; clearTimeout(t) }
  }, [board?.slug])

  useEffect(() => {
    if (isLoggedIn) dispatch(getBoardLikes())
  }, [isLoggedIn, dispatch])

  useEffect(() => {
    const h = e => {
      if (e.key !== 'Escape') return
      if (showFlag || showSponsor || showLogin || showFullImg) closeAllModals()
      else onClose()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [showFlag, showSponsor, showLogin, showFullImg, closeAllModals, onClose])

  const openActionMenu = useCallback(() => {
    if (!messagesLoading && fullBoard) {
      setShowActionMenu(true)
      dismissEditHint()
    }
  }, [messagesLoading, fullBoard, dismissEditHint])

  const onTouchStart = useCallback(e => {
    touchStart.current  = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }, [])

  const onTouchEnd = useCallback(e => {
    if (touchStart.current === null) return
    const dx = e.changedTouches[0].clientX - touchStart.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      if (dx < 0 && onNext) onNext()
      else if (dx > 0 && onPrev) onPrev()
    } else if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
      const now = Date.now()
      if (now - lastTapTime.current < 300) {
        openActionMenu()
        lastTapTime.current = 0
      } else {
        lastTapTime.current = now
      }
    }
    touchStart.current = null
    touchStartY.current = null
  }, [onNext, onPrev, openActionMenu])

  const likeCountRef     = useRef(likeCount)
  const likedBoardIdsRef = useRef(likedBoardIds)

  useEffect(() => { likeCountRef.current = likeCount },     [likeCount])
  useEffect(() => { likedBoardIdsRef.current = likedBoardIds }, [likedBoardIds])

  const handleReaction = useCallback((reactionKey) => {
    if (!isLoggedIn) { setShowLogin(true); return }
    if (!fullBoard?._id) return

    const boardId = fullBoard._id.toString()
    const wasLiked = likedBoardIdsRef.current.includes(boardId)

    setSelectedReaction(reactionKey)
    if (!wasLiked) {
      setLikeCount(likeCountRef.current + 1)
      dispatch(optimisticToggleLike(boardId))
    }

    const sync = async () => {
      if (!wasLiked) {
        const res = await dispatch(likeBoard(fullBoard._id))
        if (res?.payload?.status !== 'success') {
          setSelectedReaction(null)
          setLikeCount(likeCountRef.current - 1)
          dispatch(optimisticToggleLike(boardId))
          return
        }
        const serverCount = res.payload.response?.likeCount
        if (serverCount !== undefined) setLikeCount(serverCount)
      }
      axios.patch(
        `${URL}/api/v1/board/${boardId}/reaction`,
        { reaction: reactionKey },
        { withCredentials: true }
      ).then(r => {
        if (r.data?.lastReaction !== undefined) setSelectedReaction(r.data.lastReaction)
      }).catch(console.error)
    }
    sync().catch(console.error)
  }, [isLoggedIn, fullBoard, dispatch])

  const handleShare = useCallback(() => {
    if (!isLoggedIn) { setShowLogin(true); return }
    setShowShare(true)
  }, [isLoggedIn])

  const handleDownload = useCallback(async () => {
    try {
      const link = `${window.location.origin}/board/${board.slug}`

      // Capture the share frame as an image
      if (shareFrameRef.current) {
        const canvas = await html2canvas(shareFrameRef.current, {
          useCORS: true,
          allowTaint: true,
          backgroundColor: null,
          scale: 2,
        })
        const dataUrl = canvas.toDataURL('image/png')

        // Download the image
        const a = document.createElement('a')
        a.href = dataUrl
        a.download = `${board.slug || 'board'}-share.png`
        a.click()

        // Copy link to clipboard
        await navigator.clipboard.writeText(link)
      } else {
        await navigator.clipboard.writeText(link)
      }

      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2500)
      if (fullBoard?._id) dispatch(shareBoard(fullBoard._id))
    } catch (err) { console.error(err) }
  }, [board, fullBoard, dispatch])

  const handleFlag = useCallback(async () => {
    if (!flagReason) return
    setFlagLoading(true)
    try {
      await axios.patch(
        `${URL}/api/v1/board/${board.slug}/flag`,
        { reason: flagReason },
        { withCredentials: true }
      )
      setFlagDone(true)
    } catch (err) { console.error(err) }
    setFlagLoading(false)
  }, [flagReason, board])

  const handleDelete = useCallback(async () => {
    if (!deleteTarget || deleteLoading) return
    setDeleteLoading(true)
    if (deleteTarget.type === 'board') {
      await dispatch(deleteBoard(deleteTarget.id))
      setDeleteLoading(false)
      setShowDeleteModal(false)
      onClose()
    } else {
      await dispatch(deleteMessage(deleteTarget.id))
      if (fullBoard?._id) {
        invalidateMsgCache(fullBoard._id.toString())
        dispatch(invalidateBoardCaches())
      }
      setDeleteLoading(false)
      setShowDeleteModal(false)
      setMsgIdx(0)
      setMessagesLoading(true)
      axios.get(`${URL}/api/v1/message/${board.slug}/board`, {
        params: { page: 1, limit: 50 }, withCredentials: true,
      })
        .then(r => { setMessages(r.data.messages ?? []); setMessagesLoading(false) })
        .catch(() => setMessagesLoading(false))
    }
  }, [deleteTarget, deleteLoading, dispatch, onClose, board.slug, fullBoard])

  const renderMedia = (msg) => {
    if (!msg) return null

    if (msg.type === 'emblem' && msg.canvasData) {
      const frameBg = msg.canvasData.canvasFrame?.color || 'transparent'
      const isPortrait = (msg.canvasData.aspectRatio ?? 'portrait') === 'portrait'
      return (
        <EmblemWrap key={msg._id} style={{ background: frameBg }}>
          <CanvasRenderer
            key={msg._id}
            canvasData={{ ...msg.canvasData, canvasFrame: undefined }}
            style={isPortrait ? { width: '72%', height: '72%' } : { width: '72%' }}
          />
        </EmblemWrap>
      )
    }

    if (msg.type === 'audio') {
      return (
        <AudioPlayer
          key={msg._id}
          src={msg.content?.audioUrl}
          senderUsername={null}
          hideUsername
          onSenderClick={null}
        />
      )
    }

    if (msg.content?.imageUrls?.[0]) {
      return <MessageImg key={msg._id} src={msg.content.imageUrls[0]} alt="" />
    }

    if (msg.content?.text) {
      return (
        <TextDisplay key={msg._id} style={{
          background: msg.content.background || '#1C2030',
          color:      msg.content.color       || '#fff',
          fontFamily: msg.content.font         || 'inherit',
        }}>
          <TextContent>{msg.content.text}</TextContent>
        </TextDisplay>
      )
    }

    return null
  }

  return (
    <>
      <Backdrop onClick={onClose} />

      <Panel>
        {/* Media area */}
        <MediaWrap>
          <MediaArea
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            onDoubleClick={openActionMenu}
          >
            {messagesLoading
              ? <MediaLoader><Spinner /></MediaLoader>
              : messages.length === 0
                ? (
                  <EmptyBoard onClick={() => navigate(`/board/${board.slug}/add-message`)}>
                    <EmptyBoardText>Board is currently empty.</EmptyBoardText>
                    <EmptyBoardCta>Click to add a message</EmptyBoardCta>
                  </EmptyBoard>
                )
                : renderMedia(currentMsg)
            }
          </MediaArea>

          {/* ── FIX: MsgDots moved OUT of MediaArea into MediaWrap ──
              MediaArea (position:relative) was the containing block for both
              EmblemWrap (inset:0) and MsgDots. The dot element's presence
              triggered browser layout re-evaluation of that containing block,
              corrupting Canvas's percentage-width and aspect-ratio resolution.
              MediaWrap is also position:relative and the same height as
              MediaArea (100%), so bottom/left positioning is visually identical. */}
          {messages.length > 1 && (
            <MsgDots>
              {messages.map((_, i) => (
                <Dot key={i} $active={i === msgIdx} onClick={() => setMsgIdx(i)} />
              ))}
            </MsgDots>
          )}

          {showEditHint && (
            <EditHint
              onDoubleClick={dismissEditHint}
              onTouchEnd={() => {
                const now = Date.now()
                if (now - hintLastTap.current < 300) dismissEditHint()
                hintLastTap.current = now
              }}
            >
              Double Tap to access edit function on any message sent or board created
            </EditHint>
          )}

          {showReactions && (
            <>
              <ReactionBackdrop onClick={() => setShowReactions(false)} />
              <ReactionPicker>
                {REACTIONS.map((rxn) => (
                  <ReactionBtn
                    key={rxn.key}
                    onClick={() => {
                      handleReaction(rxn.key)
                      setShowReactions(false)
                    }}
                  >
                    <rxn.Icon style={{ color: rxn.color }} />
                  </ReactionBtn>
                ))}
              </ReactionPicker>
            </>
          )}
        </MediaWrap>

        {/* Meta — hidden while loading */}
        {!(messagesLoading || !fullBoard) && (<Meta>
          <ActionsRow>
            <LikeWrap>
              <ActionBtn
                onClick={() => {
                  if (!isLoggedIn) { setShowLogin(true); return }
                  setShowReactions(v => !v)
                }}
              >
                {(() => {
                  const r = REACTIONS.find(r => r.key === selectedReaction)
                  return r ? <r.Icon style={{ color: '#fff' }} /> : <BsHeart />
                })()}
                <span>{likeCount}</span>
              </ActionBtn>
            </LikeWrap>

            <ActionBtn onClick={handleShare}>
              <PiShareFat />
              <span>{fullBoard?.stats?.shares ?? 0}</span>
            </ActionBtn>

            {isReceipent && (
              <ActionBtn onClick={() => setShowFlag(true)}>
                <BsFlag />
              </ActionBtn>
            )}

            <Spacer />
          </ActionsRow>

          <BoardTitle>{fullBoard?.title ?? board.title}</BoardTitle>

          {/* Receipent — user or hashtag */}
          {(fullBoard?.receipent || fullBoard?.receipentHashtag) && (
            <ReceipentRow>
              {fullBoard.receipentHashtag
                ? (
                  <Link to={`/profile/${fullBoard.receipentHashtag}`}>
                    <ReceipentBadge>#{fullBoard.receipentHashtag}</ReceipentBadge>
                  </Link>
                )
                : (
                  <Link to={`/profile/${fullBoard.receipent.username}`}>
                    <ReceipentBadge>@{fullBoard.receipent.username}</ReceipentBadge>
                  </Link>
                )
              }
            </ReceipentRow>
          )}

          {currentMsg?.sender?.username
            && !(isAnonymous && !isMsgSender)
            && currentMsg.sender.username !== fullBoard?.owner?.username
            && (
            <SenderName
              $clickable
              onClick={() => navigate(`/profile/${currentMsg.sender.username}`)}
            >
              @{currentMsg.sender.username}
            </SenderName>
          )}

          {fullBoard?.owner && (
            <OwnerRow>
              <Link to={`/profile/${fullBoard.owner.username}`}>
                {fullBoard.owner.profileImage
                  ? <OwnerAvatar src={fullBoard.owner.profileImage} alt={fullBoard.owner.username} />
                  : (
                    <OwnerAvatarDefault>
                      <img src={DefaultAvatar} alt="" />
                    </OwnerAvatarDefault>
                  )
                }
                <OwnerName>{fullBoard.owner.username.charAt(0).toUpperCase() + fullBoard.owner.username.slice(1)}</OwnerName>
                <CuratorBadge>Curator</CuratorBadge>
              </Link>
            </OwnerRow>
          )}
        </Meta>)}

        {/* ── Action Menu overlay ── */}
        {showActionMenu && (
          <ActionMenuOverlay onClick={() => setShowActionMenu(false)}>
            <ActionMenuSheet onClick={e => e.stopPropagation()} $hasEditActions={hasEditActions}>
              <ActionMenuTitle>Action Menu</ActionMenuTitle>

              <ActionMenuBtns $hasEditActions={hasEditActions}>
                <ActionMenuPill onClick={() => { setShowActionMenu(false); if (!isLoggedIn) { setShowLogin(true); return } navigate(`/board/${board.slug}/add-message`) }}>
                  <PiPlusBold style={{ fontSize: '1.3em' }} /> Add Post
                </ActionMenuPill>
                <ActionMenuPill onClick={() => { setShowActionMenu(false); handleShare() }}>
                  <PiShareFatBold style={{ fontSize: '1.3em' }} /> Share
                </ActionMenuPill>
              </ActionMenuBtns>

              {hasEditActions && (
                <>
                  <ActionMenuDivider />
                  <ActionMenuSectionLabel>EDIT ACTIONS</ActionMenuSectionLabel>

                  {isOwner && currentMsg?.canvasData && (
                    <ActionMenuRow onClick={() => { setShowActionMenu(false); navigate(`/board/${board.slug}/edit`) }}>
                      <ActionMenuThumb style={{ background: currentMsg.canvasData.canvasFrame?.color || '#e0e0e0' }}>
                        <CanvasRenderer canvasData={{ ...currentMsg.canvasData, canvasFrame: undefined }} radius={4} style={{ width: '82%' }} />
                      </ActionMenuThumb>
                      <ActionMenuRowLabel>Board</ActionMenuRowLabel>
                      <ActionMenuIconsGroup>
                        <RiEdit2Line style={{ color: '#000', opacity: 0.4 }} />
                        <RiDeleteBinLine style={{ color: '#000', opacity: 0.4 }} onClick={e => { e.stopPropagation(); setShowActionMenu(false); setDeleteTarget({ type: 'board', id: fullBoard?._id || board._id }); setShowDeleteModal(true) }} />
                      </ActionMenuIconsGroup>
                    </ActionMenuRow>
                  )}

                  {myMessages.map(msg => {
                    const thumbSrc = msg.content?.imageUrls?.[0] || null
                    const isEmblemMsg = msg.type === 'emblem' && msg.canvasData
                    return (
                      <ActionMenuRow key={msg._id} onClick={() => { setShowActionMenu(false); navigate(`/message/${msg._id}/edit`) }}>
                        <ActionMenuThumb style={isEmblemMsg ? { background: msg.canvasData.canvasFrame?.color || '#e0e0e0' } : {}}>
                          {isEmblemMsg
                            ? <CanvasRenderer canvasData={{ ...msg.canvasData, canvasFrame: undefined }} radius={4} style={{ width: '82%' }} />
                            : thumbSrc
                              ? <img src={thumbSrc} alt="" />
                              : msg.content?.text
                                ? <ActionMenuThumbText style={{ background: msg.content.background || '#2a2f45', color: msg.content.color || '#fff' }}>
                                    {msg.content.text.slice(0, 40)}
                                  </ActionMenuThumbText>
                                : <ActionMenuThumbFallback style={{ background: '#2a2f45' }} />
                          }
                        </ActionMenuThumb>
                        <ActionMenuRowLabel>Message</ActionMenuRowLabel>
                        <ActionMenuIconsGroup>
                          <RiEdit2Line style={{ color: '#000', opacity: 0.4 }} />
                          <RiDeleteBinLine style={{ color: '#000', opacity: 0.4 }} onClick={e => { e.stopPropagation(); setShowActionMenu(false); setDeleteTarget({ type: 'message', id: msg._id }); setShowDeleteModal(true) }} />
                        </ActionMenuIconsGroup>
                      </ActionMenuRow>
                    )
                  })}
                </>
              )}
            </ActionMenuSheet>
          </ActionMenuOverlay>
        )}
      </Panel>

      {/* ── Flag ── */}
      {showFlag && (
        <ModalOverlay onClick={() => setShowFlag(false)}>
          <ModalCard onClick={e => e.stopPropagation()}>
            {flagDone ? (
              <FlagSuccess>
                <BsCheckCircleFill className="icon" />
                <h3>Board Flagged</h3>
                <p>Thank you. We've received your report and will review this board.</p>
                <FlagSuccessActions>
                  <SubmitBtn onClick={() => { setShowFlag(false); setFlagDone(false) }}>
                    Close
                  </SubmitBtn>
                  <HomeBtn onClick={() => { onClose(); navigate('/profile') }}>
                    <BsHouseFill /><span>Go to profile</span>
                  </HomeBtn>
                </FlagSuccessActions>
              </FlagSuccess> 
            ) : (
              <>
                <ModalTitle>Flag Board</ModalTitle>
                <ModalBody style={{ margin: '0 0 14px' }}>
                  Why are you flagging this board? We'll review it and take action if needed.
                </ModalBody>
                <RadioGroup>
                  {FLAG_REASONS.map(r => (
                    <RadioRow key={r} $selected={flagReason === r} onClick={() => setFlagReason(r)}>
                      <RadioDot $selected={flagReason === r} /><span>{r}</span>
                    </RadioRow>
                  ))}
                </RadioGroup>
                <SubmitBtn onClick={handleFlag} disabled={!flagReason || flagLoading}>
                  {flagLoading ? 'Submitting…' : 'Submit Report'}
                </SubmitBtn>
              </>
            )}
          </ModalCard>
        </ModalOverlay>
      )}

      {/* ── Delete ── */}
      {showDeleteModal && (
        <ModalOverlay onClick={() => setShowDeleteModal(false)}>
          <DeleteModalCard onClick={e => e.stopPropagation()}>
            <DeleteIconCircle>
              <RiDeleteBinLine />
            </DeleteIconCircle>
            <DeleteModalTitle>Delete Message</DeleteModalTitle>
            <DeleteModalDesc>
              This message will be removed from your board completely and you won't be able to recover it
            </DeleteModalDesc>
            <DeleteModalBtns>
              <DeleteModalBtn $cancel onClick={() => setShowDeleteModal(false)}>Nevermind</DeleteModalBtn>
              <DeleteModalBtn $confirm onClick={handleDelete} disabled={deleteLoading} style={{ opacity: deleteLoading ? 0.5 : 1 }}>
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </DeleteModalBtn>
            </DeleteModalBtns>
          </DeleteModalCard>
        </ModalOverlay>
      )}

      {/* ── Sponsor ── */}
      {showSponsor && (
        <ModalOverlay onClick={() => setShowSponsor(false)}>
          <ModalCard onClick={e => e.stopPropagation()}>
            <ModalCaption>Board space max out {fullBoard?.stats?.messages ?? 0}/1000</ModalCaption>
            <SectionLabel>BUY MORE SPACE</SectionLabel>
            <RadioGroup>
              {SPONSOR_OPTIONS.map(opt => (
                <RadioRow key={opt.id} $selected={sponsorChoice === opt.id} onClick={() => setSponsorChoice(opt.id)}>
                  <RadioDot $selected={sponsorChoice === opt.id} $green={sponsorChoice === opt.id} />
                  <span style={{ flex: 1 }}>{opt.label}</span>
                  <PriceTag>{opt.display}</PriceTag>
                </RadioRow>
              ))}
            </RadioGroup>
            <SubmitBtn onClick={() => setShowSponsor(false)}>Continue</SubmitBtn>
          </ModalCard>
        </ModalOverlay>
      )}

      {/* ── Share ── */}
      {showShare && (
        <ShareOverlay onClick={() => setShowShare(false)}>
          <ShareCard onClick={e => e.stopPropagation()}>
            <div className="share_frame_part">
              <div className="share_canvas_frame" ref={shareFrameRef}>
                <img
                  src={shareRect1} alt=""
                  className="share_rect share_rect_left"
                  style={currentMsg?.canvasData?.aspectRatio === 'landscape' ? { width: '28%', left: '17%' } : {}}
                /> 
                <img
                  src={shareRect2} alt=""
                  className="share_rect share_rect_right"
                  style={currentMsg?.canvasData?.aspectRatio === 'landscape' ? { width: '28%', right: '17%' } : {}}
                />
                <img src={heartboardLogo} alt="Heartboard" className="share_logo" />
                <img src={shareFrame} alt="" className="share_frame_img" />
                <div className="share_canvas_and_text">
                  {!isAudio && currentMsg?.canvasData && (
                    <div
                      className="share_canvas_inner"
                      style={{
                        background:  currentMsg.canvasData.canvasFrame?.color || '#f0f0f0',
                        aspectRatio: currentMsg.canvasData.aspectRatio === 'landscape' ? '5/4'
                                   : currentMsg.canvasData.aspectRatio === 'portrait'  ? '4/5'
                                   : '1/1',
                      }}
                    >
                      <CanvasRenderer
                        canvasData={{ ...currentMsg.canvasData, canvasFrame: undefined }}
                        style={{ width: '72%' }}
                      />
                    </div>
                  )}
                  <div className="share_text_container">
                    <h3 className="share_board_title">{fullBoard?.title ?? board.title}</h3>
                    <p className="share_board_caption">
                      Go drop yours with other{(fullBoard?.stats?.messages ?? 0) >= 100 ? ` ${fullBoard.stats.messages}` : ''} contributors.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="share_btn_part">
              <button className="share_primary_btn" onClick={handleDownload}>
                {linkCopied ? 'Link Copied!' : 'Download & Copy Link'}
              </button>
              <button className="share_secondary_btn" onClick={() => setShowShare(false)}>
                Close
              </button>
            </div>
          </ShareCard>
        </ShareOverlay>
      )}

      {/* ── Login ── */}
      {showLogin && (
        <LoginPopup
          onClose={() => setShowLogin(false)}
          message="Sign in to like, share, and interact with boards"
        />
      )}

      {/* ── Fullscreen expand ── */}
      {showFullImg && currentMsg && (
        <FullOverlay onClick={() => setShowFullImg(false)} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          {isEmblem
            ? (
              <FullCanvasWrap onClick={e => e.stopPropagation()}>
                <CanvasRenderer
                  canvasData={currentMsg.canvasData}
                  style={{ width: '100%', height: '100%', borderRadius: 12 }}
                />
              </FullCanvasWrap>
            )
            : isAudio
              ? (
                <FullAudioWrap onClick={e => e.stopPropagation()}>
                  <AudioPlayer
                    src={currentMsg.content?.audioUrl}
                    senderUsername={currentMsg.sender?.username}
                    hideUsername={isAnonymous && !isMsgSender}
                    onSenderClick={(!isAnonymous || isMsgSender) && currentMsg.sender?.username
                      ? () => navigate(`/profile/${currentMsg.sender.username}`) : null}
                    large
                  />
                </FullAudioWrap>
              )
              : fullscreenSrc
                ? <FullImg src={fullscreenSrc} alt="" onClick={e => e.stopPropagation()} />
                : null
          }
        </FullOverlay>
      )}

    </>
  )
}

// ── Keyframes ─────────────────────────────────────────────────────────────────
const spin        = keyframes`to { transform: rotate(360deg) }`
const fadeIn      = keyframes`from { opacity: 0 } to { opacity: 1 }`
const modalFade   = keyframes`from { opacity: 0; transform: scale(0.96) } to { opacity: 1; transform: scale(1) }`
const audioRipple = keyframes`
  0%   { transform: translate(-50%, -50%) scale(0); opacity: 0.8; }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
`

const Backdrop = styled.div`
  position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 200;
`

const Panel = styled.div`
  position: fixed;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  z-index: 201;
  width: min(720px, 96vw);
  height: 80vh;
  background: #1C2030;
  border-radius: 20px;
  display: flex; flex-direction: column;
  overflow: hidden;
  animation: ${fadeIn} 0.2s ease forwards;

  @media (min-width: 601px) {
    padding: 2rem 150px 2rem;
  }

  @media (max-width: 600px) {
    width: 100vw;
    height: 88dvh;
    top: auto; bottom: 0; left: 0;
    transform: none;
    border-radius: 20px 20px 0 0;
    padding: 1.25rem 0.65rem 2rem;
    overflow-y: auto;
    gap: 0.75rem;
  }
`

const MediaWrap = styled.div`
  position: relative;
  flex: 1;
  min-height: 0;

  @media (max-width: 600px) {
    flex: none;
    min-height: 500px;
  }
`

const MediaArea = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 25px;

  @media (max-width: 600px) {
    width: 90%;
    margin: 0 auto;
    border-radius: 20px;
  }
`

const EmblemWrap = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
`

const MessageImg = styled.img`width: 100%; height: 100%; object-fit: cover; display: block;`

const MediaLoader = styled.div`
  width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
`

const Spinner = styled.div`
  width: 36px; height: 36px; border-radius: 50%;
  border: 3px solid rgba(255,255,255,0.12);
  border-top-color: rgba(255,255,255,0.7);
  animation: ${spin} 0.75s linear infinite;
`

const EmptyBoard = styled.div`
  width: 100%; height: 100%;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 8px; cursor: pointer; padding: 24px;
  &:hover { background: rgba(255,255,255,0.04); }
`

const EmptyBoardText = styled.p`font-size: 0.88em; color: rgba(255,255,255,0.5); margin: 0; text-align: center;`
const EmptyBoardCta  = styled.p`font-size: 0.78em; color: #E05A42; margin: 0; font-weight: 600; text-align: center;`

const TextDisplay = styled.div`
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  padding: 24px; position: relative;
`

const TextContent = styled.p`
  font-size: 1.1em; line-height: 1.55; text-align: center; word-break: break-word; margin: 0;
`

const SenderName = styled.span`
  display: inline-block;
  margin-top: 6px;
  font-size: 0.78em;
  font-weight: 500;
  color: rgba(255,255,255,0.45);
  cursor: ${({ $clickable }) => $clickable ? 'pointer' : 'default'};
  &:hover { color: rgba(255,255,255,0.7); }
`

const SenderBadge = styled.span`
  position: absolute; bottom: 10px; left: 10px;
  background: rgba(0,0,0,0.52); backdrop-filter: blur(6px);
  color: #fff; font-size: 0.68em; font-weight: 600;
  padding: 3px 10px; border-radius: 99px;
  pointer-events: ${({ $clickable }) => $clickable ? 'auto' : 'none'};
  cursor: ${({ $clickable }) => $clickable ? 'pointer' : 'default'};
  z-index: 3; transition: background 0.15s;
  ${({ $clickable }) => $clickable && `&:hover { background: rgba(0,0,0,0.75); }`}
`

const EditHint = styled.div`
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 6;
  background: #fff;
  color: #111;
  font-size: 0.75em;
  font-weight: bold;
  line-height: 1.45;
  text-align: start;
  padding: 14px 14px;
  border-radius: 12px;
  max-width: 200px;
  filter: drop-shadow(0 2px 10px rgba(0,0,0,0.18));
  cursor: default;
  user-select: none;
  animation: ${fadeIn} 0.25s ease forwards;

  &::after {
    content: '';
    position: absolute;
    bottom: -11px;
    left: 80%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-top: 12px solid #fff;
    border-left: 14px solid transparent;
    border-right: 2px solid transparent;
  }

  @media (max-width: 600px) {
    font-size: 0.72em;
    max-width: 170px;
    padding: 9px 12px;
  }
`

const MsgDotsBtn = styled.button`
  position: absolute; top: 10px; right: 10px; z-index: 5;
  background: rgba(0,0,0,0.45); backdrop-filter: blur(6px);
  border: none; border-radius: 50%; width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 0.9em; cursor: pointer;
  transition: background 0.15s;
  &:hover { background: rgba(0,0,0,0.7); }
`

/* Positioned in MediaWrap (position:relative, same dimensions as MediaArea).
   bottom/left values produce the same visual result as before. */
const MsgDots = styled.div`
  position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%);
  display: flex; gap: 5px; z-index: 4;
  pointer-events: none;

  @media (max-width: 600px) {
    /* On mobile MediaArea is width:80% centered — keep dots centred over it */
    left: 50%;
  }
`

const Dot = styled.div`
  width: 6px; height: 6px; border-radius: 50%;
  background: ${({ $active }) => $active ? '#fff' : 'rgba(255,255,255,0.35)'};
  cursor: pointer; transition: background 0.15s;
  pointer-events: auto;
`

const Meta = styled.div`
  flex-shrink: 0; padding: 0.75rem 0 0; color: #fff; overflow-y: auto;

  @media (max-width: 600px) {
    padding: 0.75rem 0 0;
    width: 90%;
    margin: 0 auto;
  }
`

const ActionsRow = styled.div`
  display: flex; align-items: center; gap: 14px; margin-bottom: 0; flex-wrap: wrap;

  @media (max-width: 600px) {
    gap: 18px;
  }
`

const ActionBtn = styled.button`
  display: flex; align-items: center; gap: 5px;
  background: none; border: none;
  color: ${({ $danger }) => $danger ? '#E05A42' : '#ccc'};
  font-size: ${({ $accent }) => $accent ? '0.9em' : '1.1em'};
  font-weight: ${({ $accent }) => $accent ? '600' : 'normal'};
  cursor: pointer; padding: 0; transition: color 0.15s;
  svg { font-size: 1.3em; }
  span { font-size: 0.78em; }
  &:hover { color: ${({ $danger }) => $danger ? '#ff6b55' : '#fff'}; } 
`

const Spacer = styled.div`flex: 1; min-width: 8px;`

const LikeWrap = styled.div`position: relative;`

const ReactionBackdrop = styled.div`position: fixed; inset: 0; z-index: 10;`

const ReactionPicker = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  z-index: 50;
  display: flex; align-items: center; gap: 4px;
  background: #1C2030;
  border-radius: 99px;
  padding: 8px 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.5);
  white-space: nowrap;
`

const ReactionBtn = styled.button`
  background: none; border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  padding: 4px; border-radius: 50%;
  font-size: 1.3em; color: #fff;
  transition: transform 0.15s;
  &:hover { transform: scale(1.3); }
`

const ActionMenuOverlay = styled.div`
  position: absolute;
  inset: 0;
  border-radius: 20px;
  background: rgba(0, 0, 0, 0.8);
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 150px;

  @media (max-width: 600px) {
    padding: 0 1.25rem;
  }
`

const ActionMenuSheet = styled.div`
  width: 100%;
  background: #fff;
  border-radius: 30px;
  padding: 20px 20px ${({ $hasEditActions }) => $hasEditActions ? '20px' : '20px'};
  max-height: 70dvh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
`

const ActionMenuTitle = styled.h3`
  font-size: 1.1em;
  font-weight: 700;
  color: #111;
  margin: 0 0 16px;
`

const ActionMenuBtns = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: ${({ $hasEditActions }) => $hasEditActions ? '20px' : '5px'};
`

const ActionMenuPill = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 12px 10px;
  border: none;
  border-radius: 10px;
  background: #F8F9FB;
  color: #111;
  font-size: 0.95em;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
  &:hover { background: #eef0f4; }
`

const ActionMenuDivider = styled.hr`
  border: none;
  border-top: 1.5px solid #ebebeb;
  margin: 0 0 16px;
`

const ActionMenuSectionLabel = styled.p`
  font-size: 0.7em;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #888;
  margin: 0 0 10px;
`

const ActionMenuRow = styled.button`
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  background: #F8F9FB;
  border: none;
  border-radius: 10px;
  padding: 8px 6px;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
  margin-bottom: 8px;
  &:hover { background: #eef0f4; }
`

const ActionMenuThumb = styled.div`
  width: 64px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  background: #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  img { width: 100%; height: 100%; object-fit: cover; display: block; }
`

const ActionMenuThumbFallback = styled.div`
  width: 100%;
  height: 100%;
  border-radius: 10px;
`

const ActionMenuThumbText = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6em;
  padding: 4px;
  text-align: center;
  line-height: 1.3;
  overflow: hidden;
`

const ActionMenuRowLabel = styled.span`
  font-size: 0.95em;
  font-weight: 600;
  color: #111;
`

const ActionMenuIconsGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-left: auto;
  flex-shrink: 0;
  padding-right: 0.75rem;
  svg { font-size: 1.75em; }
`

const BoardTitle = styled.h2`
  font-size: 1.05em; font-weight: 700; color: #fff; margin: 0.75rem 0 0;
  @media (max-width: 600px) { font-size: 1.15em; margin: 0.75rem 0 0; }
`
const BoardTag   = styled.p`
  font-size: 0.78em; color: #9CA3AF; margin: 0 0 4px;
  @media (max-width: 600px) { font-size: 0.85em; margin: 0 0 8px; }
`

const OwnerRow = styled.div`
  display: flex; align-items: center; gap: 6px; margin-top: 0.75rem;
  a { display: flex; align-items: center; gap: 6px; text-decoration: none; }
  @media (max-width: 600px) { margin-top: 0.75rem; }
`

const OwnerAvatar = styled.img`
  width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0;
  border: 1.5px solid rgba(255,255,255,0.2);
  object-fit: cover;
`
const OwnerAvatarDefault = styled.div`
  position: relative;
  width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0;
  border: 1.5px solid rgba(255,255,255,0.2);
  background: #fff;
  overflow: hidden;
  display: flex; align-items: flex-end; justify-content: center;
  img {
    position: absolute;
    width: 100%;
    object-fit: contain;
    display: block;
    bottom: -1px;
  }
`
const OwnerName    = styled.span`font-size: 0.78em; color: #9CA3AF; font-weight: 500;`
const CuratorBadge = styled.span`
  font-size: 0.62em; background: #282A39; color: rgba(255,255,255,0.5);
  padding: 2px 6px; border-radius: 99px; font-weight: 600;
`

const ReceipentRow = styled.div`
  display: flex; align-items: center; gap: 6px; margin-top: 6px;
  a { text-decoration: none; }
`

const ReceipentBadge = styled.span`
  font-size: 0.78em; font-weight: 500; color: #9CA3AF;
  &:hover { background: rgba(245,200,66,0.22); }
`

const ModalOverlay = styled.div`
  position: fixed; inset: 0; background: rgba(0,0,0,0.65); z-index: 300;
  display: flex; align-items: center; justify-content: center; padding: 16px;
`
const ModalCard = styled.div`
  background: #fff; border-radius: 20px; width: min(400px, 100%); padding: 28px 24px 24px;
  animation: ${modalFade} 0.18s ease forwards;
`
const ModalTitle   = styled.h3`font-size: 1.05em; font-weight: 700; color: #111; margin: 0 0 14px;`
const ModalBody    = styled.p`font-size: 0.88em; color: #555; margin: 0 0 20px;`
const ModalCaption = styled.p`font-size: 0.82em; color: #888; text-align: center; margin: 0 0 14px;`
const SectionLabel = styled.p`font-size: 0.72em; font-weight: 700; letter-spacing: 0.08em; color: #999; text-transform: uppercase; margin: 0 0 10px;`

const FlagSuccess = styled.div`
  display: flex; flex-direction: column; align-items: center;
  text-align: center; gap: 0.6rem; padding: 0.5rem 0;
  .icon { font-size: 2.5rem; color: #22c55e; margin-bottom: 0.25rem; }
  h3 { font-size: 1.05em; font-weight: 700; color: #111; margin: 0; }
  p  { font-size: 0.86em; color: #6B7280; margin: 0; line-height: 1.5; }
`
const FlagSuccessActions = styled.div`
  display: flex; flex-direction: column; gap: 8px; width: 100%; margin-top: 0.75rem;
`
const HomeBtn = styled.button`
  width: 100%; padding: 13px; display: flex; align-items: center; justify-content: center; gap: 6px;
  background: #F5F6F8; color: #333; border: none; border-radius: 99px;
  font-size: 0.9em; font-weight: 600; cursor: pointer; transition: background 0.15s;
  &:hover { background: #ECEEF2; }
`

const RadioGroup = styled.div`display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px;`
const RadioRow   = styled.div`
  display: flex; align-items: center; gap: 12px;
  background: #F5F6F8; border-radius: 10px; padding: 12px 14px;
  cursor: pointer; font-size: 0.88em; color: #222; transition: background 0.15s;
  &:hover { background: #ECEEF2; }
`
const RadioDot = styled.div`
  width: 18px; height: 18px; border-radius: 50%; flex-shrink: 0;
  border: 2px solid ${({ $selected, $green }) => $selected ? ($green ? '#22c55e' : '#E05A42') : '#ccc'};
  background: ${({ $selected, $green }) => $selected ? ($green ? '#22c55e' : '#E05A42') : 'transparent'};
  transition: all 0.15s;
`
const PriceTag = styled.span`
  font-size: 0.78em; background: #FFE8E5; color: #E05A42;
  padding: 3px 10px; border-radius: 99px; font-weight: 600; white-space: nowrap;
`
const SubmitBtn = styled.button`
  width: 100%; padding: 14px; background: #E05A42; color: #fff;
  border: none; border-radius: 99px; font-size: 0.92em; font-weight: 600; cursor: pointer;
  transition: opacity 0.15s;
  &:disabled { opacity: 0.6; cursor: default; }
  &:hover:not(:disabled) { opacity: 0.88; }
`
const CancelBtn = styled.button`
  width: 100%; padding: 14px; background: #F5F6F8; color: #333;
  border: none; border-radius: 99px; font-size: 0.92em; font-weight: 600; cursor: pointer;
  transition: background 0.15s;
  &:hover { background: #ECEEF2; }
`
const DeleteRow = styled.div`display: flex; gap: 10px; button { flex: 1; }`

const DeleteModalCard = styled.div`
  background: #fff;
  border-radius: 30px;
  width: min(400px, 100%);
  padding: 32px 24px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  animation: ${modalFade} 0.18s ease forwards;
`

const DeleteIconCircle = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #F8F9FB;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5em;
  color: #000;
  margin-bottom: 4px;
`

const DeleteModalTitle = styled.h3`
  font-size: 1.2em;
  font-weight: 700;
  color: #111;
  margin: 0;
  text-align: center;
`

const DeleteModalDesc = styled.p`
  font-size: 0.88em;
  color: #808897;
  text-align: center;
  margin: 0;
  line-height: 1.55;
`

const DeleteModalBtns = styled.div`
  display: flex;
  gap: 12px;
  width: 100%;
  margin-top: 8px;
`

const DeleteModalBtn = styled.button`
  flex: 1;
  height: 55px;
  border: none;
  border-radius: 15px;
  font-size: 0.95em;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
  background: ${({ $confirm }) => $confirm ? '#F74441' : '#F8F9FB'};
  color: ${({ $confirm }) => $confirm ? '#fff' : '#111'};
  &:hover { opacity: 0.85; }
`

const ShareOverlay = styled.div`
  position: fixed; inset: 0; z-index: 300;
  background: rgba(0,0,0,0.7);
  display: flex; align-items: center; justify-content: center;
  padding: 1rem;
`

const ShareCard = styled.div`
  background: #fff;
  border-radius: 30px;
  padding: 1.5rem;
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  animation: ${modalFade} 0.18s ease forwards;

  .share_frame_part {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .share_canvas_frame {
    position: relative;
    width: 100%;
    overflow: hidden;
    border-radius: 30px;
  }

  .share_logo {
    position: absolute;
    top: -10%; right: -30%;
    width: 280px; height: auto;
    z-index: 15; pointer-events: none;
  }

  .share_rect {
    position: absolute;
    top: 15%; width: 45%;
    pointer-events: none; z-index: 5;
  }
  .share_rect_left  { left: 10%; }
  .share_rect_right { right: 10%; }

  .share_frame_img {
    width: 100%; height: auto;
    display: block; position: relative;
    z-index: 1; pointer-events: none;
  }

  .share_canvas_and_text {
    position: absolute;
    top: 10%; left: 50%;
    transform: translateX(-50%);
    width: 50%; z-index: 10;
    display: flex; flex-direction: column;
  }

  .share_canvas_inner {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 14px;
    overflow: hidden;
  }

  .share_audio_inner {
    aspect-ratio: 1 / 1;
    background: #FDDDD7;
    border-radius: 16px;
    overflow: hidden;
    position: relative;
    display: flex; align-items: center; justify-content: center;

    .audio_ripple {
      position: absolute; top: 50%; left: 50%;
      border-radius: 50%;
      background: rgba(201, 79, 56, 0.12);
      transform: translate(-50%, -50%) scale(0);
      animation: ${audioRipple} 3s ease-out infinite both;
      &:nth-child(1) { width: 160%; padding-top: 160%; animation-delay: 0s; }
      &:nth-child(2) { width: 110%; padding-top: 110%; animation-delay: 1s; }
      &:nth-child(3) { width: 60%;  padding-top: 60%;  animation-delay: 2s; }
    }

    .audio_mic_center {
      position: relative; z-index: 2;
      width: 46px; height: 46px; border-radius: 50%;
      background: #fff;
      display: flex; align-items: center; justify-content: center;
    }

    .audio_mic_icon { font-size: 1.1em; color: #C94F38; }
  }

  .share_text_container {
    margin-top: 2rem;
    display: flex; flex-direction: column;
    gap: 0.25rem; text-align: center;
  }

  .share_board_title {
    margin: 0; font-size: 1.05em; font-weight: 700;
    color: #111; line-height: 1.3;
  }

  .share_board_caption {
    margin: 0; font-size: 0.9em;
    color: #272835; opacity: 0.5; line-height: 1.5;
  }

  .share_btn_part {
    display: flex; flex-direction: column; gap: 0.75rem;
  }

  .share_primary_btn {
    width: 100%; height: 50px; border: none;
    border-radius: 25px; background: #E05A42; color: #fff;
    font-size: 1em; font-weight: 600; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: opacity 0.2s;
    &:hover { opacity: 0.88; }
  }

  .share_secondary_btn {
    width: 100%; height: 50px;
    border: 1px solid #111; border-radius: 25px;
    background: transparent; color: #111;
    font-size: 1em; font-weight: 500; cursor: pointer;
    transition: opacity 0.2s;
    &:hover { opacity: 0.7; }
  }
`

const FullOverlay    = styled.div`position: fixed; inset: 0; z-index: 400; background: rgba(0,0,0,0.94); display: flex; align-items: center; justify-content: center;`
const FullImg        = styled.img`max-width: 95vw; max-height: 95vh; object-fit: contain; border-radius: 8px;`
const FullCanvasWrap = styled.div`width: min(92vw, 560px); aspect-ratio: 1/1; border-radius: 12px; overflow: hidden;`
const FullAudioWrap  = styled.div`
  width: min(92vw, 420px); aspect-ratio: 1/1;
  border-radius: 16px; overflow: hidden;
`

const AudioWrap = styled.div`
  width: 100%; height: 100%;
  position: relative;
  background: #FDDDD7;
  border-radius: 16px;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;

  .ripple {
    position: absolute;
    top: 50%; left: 50%;
    border-radius: 50%;
    background: rgba(201, 79, 56, 0.12);
    transform: translate(-50%, -50%) scale(0);
    animation: ${audioRipple} 3s ease-out infinite both;
  }
  .ripple:nth-child(1) { width: 160%; padding-top: 160%; animation-delay: 0s; }
  .ripple:nth-child(2) { width: 110%; padding-top: 110%; animation-delay: 1s; }
  .ripple:nth-child(3) { width: 60%; padding-top: 60%; animation-delay: 2s; }
`
const MicBtn = styled.button`
  position: relative;
  z-index: 2;
  width:  ${({ $large }) => $large ? '110px' : '70px'};
  height: ${({ $large }) => $large ? '110px' : '70px'};
  border-radius: 50%; background: #fff; border: none;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: transform 0.15s;
  &:hover { transform: scale(1.06); }
`
const MicIconWrap = styled.span`
  color: #C94F38;
  font-size: ${({ $large }) => $large ? '2.8em' : '1.7em'};
  display: flex; align-items: center; justify-content: center;
`
const PlayIcon = styled.span`
  position: absolute;
  bottom: ${({ $large }) => $large ? '-6px' : '-3px'};
  right:  ${({ $large }) => $large ? '-6px' : '-3px'};
  width:  ${({ $large }) => $large ? '32px' : '22px'};
  height: ${({ $large }) => $large ? '32px' : '22px'};
  border-radius: 50%; background: #E05A42; color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: ${({ $large }) => $large ? '0.95em' : '0.65em'};
`
const AudioBottom = styled.div`
  position: absolute;
  bottom: 12px; left: 7.5%; right: 7.5%;
  z-index: 2;
  display: flex; align-items: center; gap: 8px;
  padding: ${({ $large }) => $large ? '12px 0' : '8px 0'};
  background: transparent;
`
const AudioPlayBtn = styled.button`
  flex-shrink: 0;
  width: 32px; height: 32px;
  border: none; background: none; padding: 0;
  display: flex; align-items: center; justify-content: center;
  color: #C94F38; font-size: 1.3em; cursor: pointer;
`
const AudioTrack = styled.div`
  flex: 1;
  position: relative; height: 14px;
  background: ${({ $visible }) => $visible ? '#fff' : 'transparent'};
  border-radius: 99px; cursor: pointer; overflow: hidden;
  transition: background 0.2s;
`
const AudioFill = styled.div`height: 100%; background: #F08468; border-radius: 99px; transition: width 0.1s linear; pointer-events: none;`
const AudioTime = styled.span`
  flex-shrink: 0;
  font-size: 0.8em; color: #9CA3AF; font-weight: 500;
  opacity: ${({ $visible }) => $visible ? 1 : 0};
  transition: opacity 0.2s;
`
const AudioSender = styled.span`
  position: absolute;
  top: ${({ $large }) => $large ? '16px' : '10px'};
  left: ${({ $large }) => $large ? '16px' : '10px'};
  z-index: 2;
  background: rgba(201,79,56,0.15); color: #C94F38;
  font-size: 0.67em; font-weight: 600; padding: 3px 9px; border-radius: 99px;
  cursor: ${({ $clickable }) => $clickable ? 'pointer' : 'default'};
  pointer-events: ${({ $clickable }) => $clickable ? 'auto' : 'none'};
  ${({ $clickable }) => $clickable && `&:hover { background: rgba(201,79,56,0.28); }`}
`

export default BoardViewModal