import React, { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import styled, { keyframes } from 'styled-components'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import {
  BsHeart, BsHeartFill, BsFlag, BsPencil, BsTrash,
  BsChevronLeft, BsChevronRight,
  BsThreeDotsVertical, BsLink45Deg,
  BsMicFill, BsPlayFill, BsPauseFill, BsInfoCircle,
  BsCheckCircleFill, BsHouseFill, 
} from 'react-icons/bs'
import { PiShareFat } from 'react-icons/pi'
import { likeBoard, shareBoard, deleteBoard, getBoardLikes, optimisticToggleLike, invalidateBoardCaches } from '../../slices/boardSlice'
import { deleteMessage } from '../../slices/messageSlice'
import { invalidateMsgCache } from '../../utils/msgCache'
import { URL } from '../../paths/url'
import CanvasRenderer from '../../canvas/CanvasRenderer'
import LoginPopup from '../auth/LoginPopup'
import { FaExpandAlt } from 'react-icons/fa'
import { RiHeartAdd2Fill } from 'react-icons/ri'

const FLAG_REASONS = ['Deceitful', 'Derogatory', 'Evil', 'Spam', 'Inappropriate']

const MENU_WIDTH = 168

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
        <AudioTrack onClick={seek}>
          <AudioFill style={{ width: `${progress}%` }} />
        </AudioTrack>
        <AudioTime>{fmt(duration)}</AudioTime>
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

  const [showFlag,      setShowFlag]      = useState(false)
  const [showSponsor,   setShowSponsor]   = useState(false)
  const [showDelete,    setShowDelete]    = useState(false)
  const [showDeleteMsg, setShowDeleteMsg] = useState(false)
  const [showLogin,     setShowLogin]     = useState(false)
  const [showFullImg,   setShowFullImg]   = useState(false)
  const [showActions,   setShowActions]   = useState(false)
  const [showShare,     setShowShare]     = useState(false)
  const [linkCopied,    setLinkCopied]    = useState(false)

  const [flagReason,    setFlagReason]    = useState('')
  const [flagLoading,   setFlagLoading]   = useState(false)
  const [flagDone,      setFlagDone]      = useState(false)
  const [sponsorChoice, setSponsorChoice] = useState(SPONSOR_OPTIONS[0].id)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [menuPos,       setMenuPos]       = useState({ top: 0, left: 0 })
  const [showMsgMenu,   setShowMsgMenu]   = useState(false)
  const [msgMenuPos,    setMsgMenuPos]    = useState({ top: 0, left: 0 })

  const dotsRef    = useRef(null)
  const msgDotsRef = useRef(null)
  const touchStart  = useRef(null)
  const touchStartY = useRef(null)

  const currentUserId = myProfile?._id?.toString()

  const isOwner = !!(currentUserId &&
    fullBoard?.owner?._id?.toString() === currentUserId)

  const isReceipent = !!(currentUserId && (
    fullBoard?.receipent?.toString() === currentUserId ||
    fullBoard?.receipent?._id?.toString() === currentUserId
  ))

  const canManage   = isOwner || isReceipent
  const isAnonymous = fullBoard?.visibility === 'anonymous'
  const liked       = fullBoard ? likedBoardIds.includes(fullBoard._id?.toString()) : false

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
    setShowFlag(false); setShowSponsor(false); setShowDelete(false)
    setShowDeleteMsg(false); setShowLogin(false); setShowFullImg(false)
    setShowActions(false); setShowShare(false); setShowMsgMenu(false)
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
      if (showFlag || showSponsor || showDelete || showLogin || showFullImg) closeAllModals()
      else onClose()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [showFlag, showSponsor, showDelete, showLogin, showFullImg, closeAllModals, onClose])

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
    }
    touchStart.current = null
    touchStartY.current = null
  }, [onNext, onPrev])

  const likeCountRef     = useRef(likeCount)
  const likedBoardIdsRef = useRef(likedBoardIds)
  likeCountRef.current     = likeCount
  likedBoardIdsRef.current = likedBoardIds
  const isLiking = useRef(false)

  const handleLike = useCallback(async () => {
    if (!isLoggedIn) { setShowLogin(true); return }
    if (!fullBoard?._id) return
    if (isLiking.current) return

    isLiking.current = true

    const boardId   = fullBoard._id.toString()
    const prevCount = likeCountRef.current
    const wasLiked  = likedBoardIdsRef.current.includes(boardId)
    const nextCount = wasLiked ? prevCount - 1 : prevCount + 1

    setLikeCount(nextCount)
    dispatch(optimisticToggleLike(boardId))

    try {
      const res = await dispatch(likeBoard(fullBoard._id))
      if (res?.payload?.status === 'success') {
        const serverCount = res.payload.response?.likeCount
        if (serverCount !== undefined) setLikeCount(serverCount)
      } else {
        setLikeCount(prevCount)
        dispatch(optimisticToggleLike(boardId))
      }
    } finally {
      isLiking.current = false
    }
  }, [isLoggedIn, fullBoard, dispatch])

  const handleShare = useCallback(() => {
    if (!isLoggedIn) { setShowLogin(true); return }
    setShowShare(true)
  }, [isLoggedIn])

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/board/${board.slug}`)
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
    if (!fullBoard?._id) return
    setDeleteLoading(true)
    const res = await dispatch(deleteBoard(fullBoard._id))
    setDeleteLoading(false)
    if (res?.payload?.status === 'success') {
      invalidateMsgCache(String(fullBoard._id))
      dispatch(invalidateBoardCaches())
      onClose()
    }
  }, [fullBoard, dispatch, onClose])

  const handleDeleteMessage = useCallback(async () => {
    if (!currentMsg?._id) return
    setShowDeleteMsg(false)
    const res = await dispatch(deleteMessage(currentMsg._id))
    if (res?.payload?.status === 'success') {
      const boardId = fullBoard?._id
      if (boardId) invalidateMsgCache(String(boardId))
      dispatch(invalidateBoardCaches())
      if (res.payload.response?.boardDeleted) {
        onClose()
        return
      }
      setMessages(prev => {
        const next = prev.filter(m => m._id !== currentMsg._id)
        setMsgIdx(i => Math.min(i, Math.max(0, next.length - 1)))
        return next
      })
    }
  }, [currentMsg, fullBoard, dispatch, onClose])

  const MENU_WIDTH = 168

  const openMsgMenu = () => {
    if (msgDotsRef.current) {
      const r = msgDotsRef.current.getBoundingClientRect()
      const left = Math.min(
        Math.max(8, r.right - MENU_WIDTH),
        window.innerWidth - MENU_WIDTH - 8
      )
      setMsgMenuPos({ top: r.top - 6, left })
    }
    setShowMsgMenu(v => !v)
  }

  const openDotsMenu = () => {
    if (dotsRef.current) {
      const r = dotsRef.current.getBoundingClientRect()
      const left = Math.min(
        Math.max(8, r.right - MENU_WIDTH),
        window.innerWidth - MENU_WIDTH - 8
      )
      setMenuPos({ top: r.top - 6, left })
    }
    setShowActions(v => !v)
  }

  const renderMedia = (msg) => {
    if (!msg) return null

    if (msg.type === 'emblem' && msg.canvasData) {
      return <CanvasRenderer canvasData={msg.canvasData} style={{ width: '100%', height: '100%' }} />
    }

    if (msg.type === 'audio') {
      return (
        <AudioPlayer
          src={msg.content?.audioUrl}
          senderUsername={null}
          hideUsername
          onSenderClick={null}
        />
      )
    }

    if (msg.content?.imageUrls?.[0]) {
      return <MessageImg src={msg.content.imageUrls[0]} alt="" />
    }

    if (msg.content?.text) {
      return (
        <TextDisplay style={{
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
        <PanelHeader>
          <ExpandBtn onClick={() => setShowFullImg(true)}>
            <FaExpandAlt />
          </ExpandBtn>
        </PanelHeader>

        {/* Media area */}
        <MediaWrap>
          <MediaArea onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
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

            {!messagesLoading && isMsgSender && currentMsg && (
              <MsgDotsBtn ref={msgDotsRef} onClick={openMsgMenu}>
                <BsInfoCircle />
              </MsgDotsBtn>
            )}

            {messages.length > 1 && (
              <MsgDots>
                {messages.map((_, i) => (
                  <Dot key={i} $active={i === msgIdx} onClick={() => setMsgIdx(i)} />
                ))}
              </MsgDots>
            )}
          </MediaArea>

          <>
            <MsgNav $side="left" disabled={!onPrev} onClick={onPrev}>
              <BsChevronLeft />
            </MsgNav>
            <MsgNav $side="right" disabled={!onNext} onClick={onNext}>
              <BsChevronRight />
            </MsgNav>
          </>
        </MediaWrap>

        {/* Meta */}
        <Meta style={{ visibility: messagesLoading ? 'hidden' : 'visible' }}>
          <ActionsRow>
            <ActionBtn onClick={handleLike}>
              {liked ? <BsHeartFill style={{ color: '#E05A42' }} /> : <BsHeart />}
              <span>{likeCount}</span>
            </ActionBtn>

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

            {isLoggedIn && (
              <ActionBtn onClick={() => navigate(`/board/${board.slug}/add-message`)}>
                <RiHeartAdd2Fill style={{ color: '#FDDDD7' }} />
              </ActionBtn>
            )}

            {canManage && (
              <ActionsMenuWrap>
                <ActionBtn ref={dotsRef} onClick={openDotsMenu}>
                  <BsThreeDotsVertical />
                </ActionBtn>
              </ActionsMenuWrap>
            )}
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
                <OwnerName>@{fullBoard.owner.username}</OwnerName>
                <CuratorBadge>Curator</CuratorBadge>
              </Link>
            </OwnerRow>
          )}
        </Meta>
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
        <ModalOverlay onClick={() => setShowShare(false)}>
          <ModalCard onClick={e => e.stopPropagation()}>
            <ModalTitle>Share Board</ModalTitle>
            {fullscreenSrc && <ShareThumb src={fullscreenSrc} alt="" />}
            <ShareBoardName>{fullBoard?.title ?? board.title}</ShareBoardName>
            {fullBoard?.owner?.username && <ShareBoardOwner>by {fullBoard.owner.username}</ShareBoardOwner>}
            <ShareLinkRow>
              <ShareLinkText>{`${window.location.origin}/board/${board.slug}`}</ShareLinkText>
              <CopyBtn onClick={handleCopyLink}>
                <BsLink45Deg /><span>{linkCopied ? 'Copied!' : 'Copy'}</span>
              </CopyBtn>
            </ShareLinkRow>
          </ModalCard>
        </ModalOverlay>
      )}

      {/* ── Delete board ── */}
      {showDelete && (
        <ModalOverlay onClick={() => setShowDelete(false)}>
          <ModalCard onClick={e => e.stopPropagation()}>
            <ModalTitle>Delete Board</ModalTitle>
            <ModalBody>
              Are you sure you want to delete <strong>{fullBoard?.title}</strong>? This cannot be undone.
            </ModalBody>
            <DeleteRow>
              <CancelBtn onClick={() => setShowDelete(false)}>Cancel</CancelBtn>
              <SubmitBtn onClick={handleDelete} disabled={deleteLoading}>
                {deleteLoading ? 'Deleting…' : 'Delete'}
              </SubmitBtn>
            </DeleteRow>
          </ModalCard>
        </ModalOverlay>
      )}

      {/* ── Delete message ── */}
      {showDeleteMsg && currentMsg && (
        <ModalOverlay onClick={() => setShowDeleteMsg(false)}>
          <ModalCard onClick={e => e.stopPropagation()}>
            <ModalTitle>Delete Message</ModalTitle>
            <ModalBody>
              Are you sure you want to delete this message? This cannot be undone.
            </ModalBody>
            <DeleteRow>
              <CancelBtn onClick={() => setShowDeleteMsg(false)}>Cancel</CancelBtn>
              <SubmitBtn onClick={handleDeleteMessage}>Delete</SubmitBtn>
            </DeleteRow>
          </ModalCard>
        </ModalOverlay>
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

      {/* ── Message menu portal ── */}
      {showMsgMenu && isMsgSender && currentMsg && createPortal(
        <>
          <ActionsMenuBackdrop onClick={() => setShowMsgMenu(false)} />
          <ActionsMenuPortal style={{ top: msgMenuPos.top, left: msgMenuPos.left }}>
            <ActionsMenuItem onClick={() => { setShowMsgMenu(false); navigate(`/message/${currentMsg._id}/edit`) }}>
              <BsPencil /><span>Edit message</span>
            </ActionsMenuItem>
            <ActionsMenuItem $danger onClick={() => { setShowMsgMenu(false); setShowDeleteMsg(true) }}>
              <BsTrash /><span>Delete message</span>
            </ActionsMenuItem>
          </ActionsMenuPortal>
        </>,
        document.body
      )}

      {/* ── Board actions portal ── */}
      {showActions && canManage && createPortal(
        <>
          <ActionsMenuBackdrop onClick={() => setShowActions(false)} />
          <ActionsMenuPortal style={{ top: menuPos.top, left: menuPos.left }}>
            <ActionsMenuItem onClick={() => { setShowActions(false); navigate(`/board/${board.slug}/edit`) }}>
              <BsPencil /><span>Edit board</span>
            </ActionsMenuItem>
            <ActionsMenuItem $danger onClick={() => { setShowActions(false); setShowDelete(true) }}>
              <BsTrash /><span>Delete board</span>
            </ActionsMenuItem>
          </ActionsMenuPortal>
        </>,
        document.body
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
  max-height: 92vh;
  background: #1C2030;
  border-radius: 20px;
  display: flex; flex-direction: column;
  overflow: hidden;
  animation: ${fadeIn} 0.2s ease forwards;

  @media (min-width: 601px) {
    padding: 2.5rem 150px 2rem;
  }

  @media (max-width: 600px) {
    width: 100vw;
    max-height: 92dvh;
    top: auto; bottom: 0; left: 0;
    transform: none;
    border-radius: 20px 20px 0 0;
    padding: 1.25rem 1.25rem 2rem;
    overflow-y: auto;
    gap: 1rem;
  }
`

const PanelHeader = styled.div`
  position: absolute;
  top: 0.6rem;
  right: 0.6rem;
  z-index: 10;
`

const ExpandBtn = styled.button`
  background: none; border: none; color: #e4dede;
  width: 30px; height: 30px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 1em; cursor: pointer; transition: color 0.15s;
  &:hover { color: #fff; }
`

const MediaWrap = styled.div`
  position: relative;
  flex-shrink: 0;
`

const MediaArea = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  flex-shrink: 0;
  border-radius: 25px;

  @media (max-width: 600px) {
    width: 80%;
    margin: 0 auto;
    border-radius: 20px;
  }
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

const MsgDotsBtn = styled.button`
  position: absolute; top: 10px; right: 10px; z-index: 5;
  background: rgba(0,0,0,0.45); backdrop-filter: blur(6px);
  border: none; border-radius: 50%; width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 0.9em; cursor: pointer;
  transition: background 0.15s;
  &:hover { background: rgba(0,0,0,0.7); }
`

const MsgDots = styled.div`
  position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%);
  display: flex; gap: 5px; z-index: 4;
`

const Dot = styled.div`
  width: 6px; height: 6px; border-radius: 50%;
  background: ${({ $active }) => $active ? '#fff' : 'rgba(255,255,255,0.35)'};
  cursor: pointer; transition: background 0.15s;
`

const MsgNav = styled.button`
  position: absolute;
  top: 50%; transform: translateY(-50%);
  ${({ $side }) => $side === 'left' ? 'left: -120px;' : 'right: -120px;'}
  background: rgba(255,255,255,0.12);
  border: none;
  color: #fff; width: 30px; height: 30px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.85em; cursor: pointer; z-index: 4; backdrop-filter: blur(4px);
  transition: background 0.15s;
  &:hover:not(:disabled) { background: rgba(255,255,255,0.22); }
  &:disabled { opacity: 0.2; cursor: default; }

  @media (max-width: 600px) {
    ${({ $side }) => $side === 'left' ? 'left: calc(10% - 18px);' : 'right: calc(10% - 18px);'}
    background: rgba(0,0,0,0.55);
    top: 50%;
  }
`

const Meta = styled.div`
  flex-shrink: 0; padding: 10px 0 0; color: #fff; overflow-y: auto;

  @media (max-width: 600px) {
    padding: 0;
    width: 80%;
    margin: 0 auto;
  }
`

const ActionsRow = styled.div`
  display: flex; align-items: center; gap: 14px; margin-bottom: 12px; flex-wrap: wrap;

  @media (max-width: 600px) {
    gap: 18px;
    margin-bottom: 16px;
  }
`

const ActionBtn = styled.button`
  display: flex; align-items: center; gap: 6px;
  background: none; border: none;
  color: ${({ $danger }) => $danger ? '#E05A42' : '#ccc'};
  font-size: ${({ $accent }) => $accent ? '0.9em' : '1.1em'};
  font-weight: ${({ $accent }) => $accent ? '600' : 'normal'};
  cursor: pointer; padding: 0; transition: color 0.15s;
  span { font-size: 0.82em; }
  &:hover { color: ${({ $danger }) => $danger ? '#ff6b55' : '#fff'}; }
`

const Spacer = styled.div`flex: 1; min-width: 8px;`

const BoardTitle = styled.h2`
  font-size: 1.05em; font-weight: 700; color: #fff; margin: 0 0 2px;
  @media (max-width: 600px) { font-size: 1.15em; margin: 0 0 6px; }
`
const BoardTag   = styled.p`
  font-size: 0.78em; color: #9CA3AF; margin: 0 0 4px;
  @media (max-width: 600px) { font-size: 0.85em; margin: 0 0 8px; }
`

const OwnerRow = styled.div`
  display: flex; align-items: center; gap: 6px; margin-top: 6px;
  a { display: flex; align-items: center; gap: 6px; text-decoration: none; }
  @media (max-width: 600px) { margin-top: 10px; }
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

const ActionsMenuWrap     = styled.div`position: relative;`
const ActionsMenuBackdrop = styled.div`position: fixed; inset: 0; z-index: 500;`
const ActionsMenuPortal   = styled.div`
  position: fixed; z-index: 501; background: #fff; border-radius: 12px;
  overflow: hidden; min-width: ${MENU_WIDTH}px;
  transform: translateY(-100%);
  animation: ${modalFade} 0.15s ease forwards;
`
const ActionsMenuItem = styled.button`
  width: 100%; display: flex; align-items: center; gap: 10px;
  background: none; border: none; padding: 12px 16px;
  font-size: 0.88em; font-weight: 500;
  color: ${({ $danger }) => $danger ? '#E05A42' : '#222'};
  cursor: pointer; text-align: left; transition: background 0.12s;
  &:hover { background: #F5F6F8; }
  svg { font-size: 1em; flex-shrink: 0; }
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

const ShareThumb      = styled.img`width: 100%; aspect-ratio: 4/3; object-fit: cover; border-radius: 12px; margin-bottom: 12px;`
const ShareBoardName  = styled.h4`font-size: 0.95em; font-weight: 700; color: #111; margin: 0 0 2px;`
const ShareBoardOwner = styled.p`font-size: 0.8em; color: #888; margin: 0 0 16px;`
const ShareLinkRow    = styled.div`
  display: flex; align-items: center; gap: 8px;
  background: #F5F6F8; border-radius: 10px; padding: 10px 12px;
`
const ShareLinkText = styled.span`
  flex: 1; font-size: 0.78em; color: #555;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
`
const CopyBtn = styled.button`
  display: flex; align-items: center; gap: 5px; background: #E05A42; color: #fff;
  border: none; border-radius: 8px; padding: 6px 12px;
  font-size: 0.8em; font-weight: 600; cursor: pointer; flex-shrink: 0;
  transition: opacity 0.15s;
  &:hover { opacity: 0.88; }
`

const FullOverlay    = styled.div`position: fixed; inset: 0; z-index: 400; background: rgba(0,0,0,0.94); display: flex; align-items: center; justify-content: center;`
const FullImg        = styled.img`max-width: 95vw; max-height: 95vh; object-fit: contain; border-radius: 8px;`
const FullCanvasWrap = styled.div`width: min(92vw, 560px); aspect-ratio: 1/1; border-radius: 12px; overflow: hidden;`
const FullAudioWrap  = styled.div`
  width: min(92vw, 420px); aspect-ratio: 1/1;
  border-radius: 30px; overflow: hidden;
`

const AudioWrap = styled.div`
  width: 100%; height: 100%;
  position: relative;
  background: #FDDDD7;
  border-radius: 30px;
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
  position: relative; height: 14px; background: #fff;
  border-radius: 99px; cursor: pointer; overflow: hidden;
`
const AudioFill = styled.div`height: 100%; background: #F08468; border-radius: 99px; transition: width 0.1s linear; pointer-events: none;`
const AudioTime = styled.span`
  flex-shrink: 0;
  font-size: 0.8em; color: #9CA3AF; font-weight: 500;
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