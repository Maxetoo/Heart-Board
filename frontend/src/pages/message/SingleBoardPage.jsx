import React, { useEffect, useRef, useState, useCallback } from 'react'
import styled, { keyframes } from 'styled-components'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams, Link } from 'react-router-dom'
import axios from 'axios'
import html2canvas from 'html2canvas'
import {
  BsHeart, BsHeartFill, BsFlag,
  BsMicFill, BsPlayFill, BsPauseFill,
  BsCheckCircleFill, BsHouseFill,
  BsArrowLeft,
} from 'react-icons/bs'
import { PiShareFat, PiHandsClapping, PiSmileyFill, PiFireFill, PiPlusBold, PiShareFatBold } from 'react-icons/pi'
import { AiFillLike } from 'react-icons/ai'
import { IoHeart } from 'react-icons/io5'
import { likeBoard, shareBoard, getBoardLikes, optimisticToggleLike } from '../../slices/boardSlice'
import { URL } from '../../paths/url'
import CanvasRenderer from '../../canvas/CanvasRenderer'
import LoginPopup from '../../components/auth/LoginPopup'
import DefaultAvatar   from '../../assets/Vector.svg'
import shareFrameImg  from '../../assets/share profile/share profile frame.svg'
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
        <AudioSender $large={large} $clickable={!!onSenderClick} onClick={onSenderClick ?? undefined}>
          @{senderUsername}
        </AudioSender>
      )}
    </AudioWrap>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
const SingleBoardPage = () => {
  const { slug }    = useParams()
  const dispatch    = useDispatch()
  const navigate    = useNavigate()
  const { userCookie }    = useSelector(s => s.auth)
  const { myProfile }     = useSelector(s => s.user)
  const { likedBoardIds } = useSelector(s => s.board)
  const isLoggedIn = !!userCookie

  const [fullBoard,       setFullBoard]       = useState(null)
  const [messages,        setMessages]        = useState([])
  const [msgIdx,          setMsgIdx]          = useState(0)
  const [likeCount,       setLikeCount]       = useState(0)
  const [boardLoading,    setBoardLoading]    = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(true)
  const [notFound,        setNotFound]        = useState(false)
  const [forbidden,       setForbidden]       = useState(false)

  const [showReactions,    setShowReactions]    = useState(false)
  const [selectedReaction, setSelectedReaction] = useState(null)
  const [showActionMenu,   setShowActionMenu]   = useState(false)
  const [showEditHint,     setShowEditHint]     = useState(() => !localStorage.getItem('board_edit_hint_dismissed'))

  const [showFlag,    setShowFlag]    = useState(false)
  const [showLogin,   setShowLogin]   = useState(false)
  const [showFullImg, setShowFullImg] = useState(false)
  const [showShare,   setShowShare]   = useState(false)
  const [linkCopied,  setLinkCopied]  = useState(false)

  const [flagReason,  setFlagReason]  = useState('')
  const [flagLoading, setFlagLoading] = useState(false)
  const [flagDone,    setFlagDone]    = useState(false)

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

  const isAnonymous    = fullBoard?.visibility === 'anonymous'
  const isOwner        = !!(currentUserId && fullBoard?.owner?._id?.toString() === currentUserId)
  const myMessages     = messages.filter(m => m.sender?._id?.toString() === currentUserId)
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

  // ── Fetch board + messages ─────────────────────────────────────────────────
  useEffect(() => {
    if (!slug) return
    let cancelled = false
    setBoardLoading(true); setMessagesLoading(true)
    setNotFound(false); setForbidden(false)
    setFullBoard(null); setMessages([]); setMsgIdx(0); setLikeCount(0)

    axios.get(`${URL}/api/v1/board/${slug}`, { withCredentials: true })
      .then(r => {
        if (cancelled) return
        setFullBoard(r.data.board)
        setLikeCount(r.data.board?.stats?.likes ?? 0)
        setSelectedReaction(r.data.board?.lastReaction || null)
        setBoardLoading(false)
      })
      .catch(err => {
        if (cancelled) return
        if (err.response?.status === 404) setNotFound(true)
        else if (err.response?.status === 403) setForbidden(true)
        setBoardLoading(false)
      })

    axios.get(`${URL}/api/v1/message/${slug}/board`, {
      params: { page: 1, limit: 50 }, withCredentials: true,
    })
      .then(r => { if (!cancelled) { setMessages(r.data.messages ?? []); setMessagesLoading(false) } })
      .catch(() => { if (!cancelled) setMessagesLoading(false) })

    return () => { cancelled = true }
  }, [slug])

  useEffect(() => {
    if (isLoggedIn) dispatch(getBoardLikes())
  }, [isLoggedIn, dispatch])

  useEffect(() => {
    const h = e => {
      if (e.key !== 'Escape') return
      if (showFlag || showLogin || showFullImg || showShare) {
        setShowFlag(false); setShowLogin(false); setShowFullImg(false); setShowShare(false)
      } else {
        navigate(-1)
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [showFlag, showLogin, showFullImg, showShare, navigate])

  const dismissEditHint = useCallback(() => {
    localStorage.setItem('board_edit_hint_dismissed', '1')
    setShowEditHint(false)
  }, [])

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
      if (dx < 0 && msgIdx < messages.length - 1) setMsgIdx(i => i + 1)
      else if (dx > 0 && msgIdx > 0)              setMsgIdx(i => i - 1)
    } else if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
      const now = Date.now()
      if (now - lastTapTime.current < 300) {
        openActionMenu()
        lastTapTime.current = 0
      } else {
        lastTapTime.current = now
      }
    }
    touchStart.current = null; touchStartY.current = null
  }, [msgIdx, messages.length, openActionMenu])

  const likeCountRef     = useRef(likeCount)
  const likedBoardIdsRef = useRef(likedBoardIds)
  useEffect(() => { likeCountRef.current = likeCount },         [likeCount])
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
      ).catch(console.error)
    }
    sync().catch(console.error)
  }, [isLoggedIn, fullBoard, dispatch])

  const handleShare = useCallback(() => {
    if (!isLoggedIn) { setShowLogin(true); return }
    setShowShare(true)
  }, [isLoggedIn])

  const handleDownload = useCallback(async () => {
    try {
      const link = `${window.location.origin}/board/${slug}`
      if (shareFrameRef.current) {
        const canvas = await html2canvas(shareFrameRef.current, {
          useCORS: true, allowTaint: true, backgroundColor: null, scale: 2,
        })
        const dataUrl = canvas.toDataURL('image/png')
        const a = document.createElement('a')
        a.href = dataUrl
        a.download = `${slug || 'board'}-share.png`
        a.click()
        await navigator.clipboard.writeText(link)
      } else {
        await navigator.clipboard.writeText(link)
      }
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2500)
      if (fullBoard?._id) dispatch(shareBoard(fullBoard._id))
    } catch (err) { console.error(err) }
  }, [slug, fullBoard, dispatch])

  const handleFlag = useCallback(async () => {
    if (!flagReason) return
    setFlagLoading(true)
    try {
      await axios.patch(`${URL}/api/v1/board/${slug}/flag`, { reason: flagReason }, { withCredentials: true })
      setFlagDone(true)
    } catch (err) { console.error(err) }
    setFlagLoading(false)
  }, [flagReason, slug])

  // ── Render media ──────────────────────────────────────────────────────────
  const renderMedia = (msg) => {
    if (!msg) return null

    if (msg.type === 'emblem' && msg.canvasData) {
      const frameBg = msg.canvasData.canvasFrame?.color || 'transparent'
      return (
        <EmblemWrap key={msg._id} style={{ background: frameBg }}>
          <CanvasRenderer
            key={msg._id}
            canvasData={{ ...msg.canvasData, canvasFrame: undefined }}
            style={{ width: '72%' }}
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

  // ── Error / loading states ─────────────────────────────────────────────────
  if (boardLoading) {
    return <Page><LoadWrap><Spinner /></LoadWrap></Page>
  }

  if (notFound || forbidden) {
    return (
      <Page>
        <BackFloatBtn onClick={() => navigate('/')}><BsArrowLeft /></BackFloatBtn>
        <LoadWrap style={{ flexDirection: 'column', gap: '1rem' }}>
          <NotFoundTitle>{forbidden ? 'This board is private' : 'Board not found'}</NotFoundTitle>
          <NotFoundSub>
            {forbidden
              ? 'Only the board owner and recipient can view this board.'
              : 'This board may have been deleted or made private.'}
          </NotFoundSub>
          <GoHomeBtn onClick={() => navigate('/')}>Go home</GoHomeBtn>
        </LoadWrap>
      </Page>
    )
  }

  return (
    <Page>
      <BackFloatBtn onClick={() => navigate(-1)}><BsArrowLeft /></BackFloatBtn>

      <ContentCol>
        {/* Media area */}
        <MediaWrap>
          <MediaArea onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onDoubleClick={openActionMenu}>
            {messagesLoading
              ? <MediaLoader><Spinner /></MediaLoader>
              : messages.length === 0
                ? (
                  <EmptyBoard onClick={() => navigate(`/board/${slug}/add-message`)}>
                    <EmptyBoardText>Board is currently empty.</EmptyBoardText>
                    <EmptyBoardCta>Click to add a message</EmptyBoardCta>
                  </EmptyBoard>
                )
                : renderMedia(currentMsg)
            }
          </MediaArea>

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
                {REACTIONS.map(rxn => (
                  <ReactionBtn key={rxn.key} onClick={() => { handleReaction(rxn.key); setShowReactions(false) }}>
                    <rxn.Icon style={{ color: rxn.color }} />
                  </ReactionBtn>
                ))}
              </ReactionPicker>
            </>
          )}
        </MediaWrap>

        {/* Meta */}
        {!(messagesLoading || !fullBoard) && (
          <Meta>
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

            <BoardTitle>{fullBoard?.title ?? ''}</BoardTitle>

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
          </Meta>
        )}

        {/* ── Action menu overlay ── */}
        {showActionMenu && (
          <ActionMenuOverlay onClick={() => setShowActionMenu(false)}>
            <ActionMenuSheet onClick={e => e.stopPropagation()} $hasEditActions={hasEditActions}>
              <ActionMenuTitle>Action Menu</ActionMenuTitle>

              <ActionMenuBtns $hasEditActions={hasEditActions}>
                <ActionMenuPill onClick={() => { setShowActionMenu(false); if (!isLoggedIn) { setShowLogin(true); return } navigate(`/board/${slug}/add-message`) }}>
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
                    <ActionMenuRow onClick={() => { setShowActionMenu(false); navigate(`/board/${slug}/edit`) }}>
                      <ActionMenuThumb style={{ background: currentMsg.canvasData.canvasFrame?.color || '#e0e0e0' }}>
                        <CanvasRenderer canvasData={{ ...currentMsg.canvasData, canvasFrame: undefined }} radius={4} style={{ width: '82%' }} />
                      </ActionMenuThumb>
                      <ActionMenuRowLabel>Board</ActionMenuRowLabel>
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
                      </ActionMenuRow>
                    )
                  })}
                </>
              )}
            </ActionMenuSheet>
          </ActionMenuOverlay>
        )}
      </ContentCol>

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
                  <SubmitBtn onClick={() => { setShowFlag(false); setFlagDone(false) }}>Close</SubmitBtn>
                  <HomeBtn onClick={() => navigate('/')}><BsHouseFill /><span>Go home</span></HomeBtn>
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

      {/* ── Share ── */}
      {showShare && (
        <ShareOverlay onClick={() => setShowShare(false)}>
          <ShareCard onClick={e => e.stopPropagation()}>
            <div className="share_frame_part">
              <div className="share_canvas_frame" ref={shareFrameRef}>
                <img
                  src={shareRect1} alt=""
                  className="share_rect share_rect_left"
                  style={currentMsg?.canvasData?.aspectRatio === 'landscape' ? { width: '28%' } : {}}
                />
                <img
                  src={shareRect2} alt=""
                  className="share_rect share_rect_right"
                  style={currentMsg?.canvasData?.aspectRatio === 'landscape' ? { width: '28%' } : {}}
                />
                <img src={heartboardLogo} alt="Heartboard" className="share_logo" />
                <img src={shareFrameImg} alt="" className="share_frame_img" />
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
                    <h3 className="share_board_title">{fullBoard?.title ?? ''}</h3>
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
        <LoginPopup onClose={() => setShowLogin(false)} message="Sign in to like, share, and interact with boards" />
      )}

      {/* ── Fullscreen ── */}
      {showFullImg && currentMsg && (
        <FullOverlay onClick={() => setShowFullImg(false)} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          {isEmblem
            ? (
              <FullCanvasWrap onClick={e => e.stopPropagation()}>
                <CanvasRenderer canvasData={currentMsg.canvasData} style={{ width: '100%', height: '100%', borderRadius: 12 }} />
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
    </Page>
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

// ── Layout ────────────────────────────────────────────────────────────────────
const Page = styled.div`
  min-height: 100dvh;
  background: #1C2030;
  position: relative;
  animation: ${fadeIn} 0.2s ease forwards;
`

const BackFloatBtn = styled.button`
  position: fixed;
  top: 1rem; left: 1rem;
  z-index: 10;
  width: 36px; height: 36px; border-radius: 50%;
  border: none;
  background: rgba(255,255,255,0.12);
  color: #fff; font-size: 1.05em;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; backdrop-filter: blur(6px);
  transition: background 0.15s;
  &:hover { background: rgba(255,255,255,0.22); }
`

const ContentCol = styled.div`
  width: min(720px, 100vw);
  margin: 0 auto;
  height: 100dvh;
  overflow: hidden;
  display: flex; flex-direction: column;
  padding: 4.5rem 150px 2rem;

  @media (max-width: 600px) {
    height: auto;
    min-height: 100dvh;
    overflow: visible;
    padding: 4rem 0.65rem 3rem;
    gap: 0.75rem;
  }
`

const MediaWrap = styled.div`
  position: relative;
  flex: 1; min-height: 0;

  @media (max-width: 600px) {
    flex: none;
    height: 500px;
  }
`

const MediaArea = styled.div`
  position: relative;
  width: 100%; height: 100%;
  overflow: hidden;
  border-radius: 25px;

  @media (max-width: 600px) {
    width: 90%; margin: 0 auto;
    border-radius: 20px;
  }
`

const EmblemWrap = styled.div`
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
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

const LoadWrap = styled.div`
  display: flex; align-items: center; justify-content: center;
  height: 100dvh;
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

const MsgDots = styled.div`
  position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%);
  display: flex; gap: 5px; z-index: 4; pointer-events: none;
`
const Dot = styled.div`
  width: 6px; height: 6px; border-radius: 50%;
  background: ${({ $active }) => $active ? '#fff' : 'rgba(255,255,255,0.35)'};
  cursor: pointer; transition: background 0.15s; pointer-events: auto;
`

const EditHint = styled.div`
  position: absolute; top: 12px; left: 50%; transform: translateX(-50%);
  z-index: 6; background: #fff; color: #111;
  font-size: 0.75em; font-weight: bold; line-height: 1.45;
  text-align: start; padding: 14px; border-radius: 12px; max-width: 200px;
  filter: drop-shadow(0 2px 10px rgba(0,0,0,0.18));
  cursor: default; user-select: none; animation: ${fadeIn} 0.25s ease forwards;
  &::after {
    content: ''; position: absolute; bottom: -11px; left: 80%; transform: translateX(-50%);
    width: 0; height: 0;
    border-top: 12px solid #fff;
    border-left: 14px solid transparent; border-right: 2px solid transparent;
  }
  @media (max-width: 600px) { font-size: 0.72em; max-width: 170px; padding: 9px 12px; }
`

const ReactionBackdrop = styled.div`position: fixed; inset: 0; z-index: 10;`
const ReactionPicker = styled.div`
  position: absolute; bottom: 0; left: 0; z-index: 50;
  display: flex; align-items: center; gap: 4px;
  background: #1C2030; border-radius: 99px; padding: 8px 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.5); white-space: nowrap;
`
const ReactionBtn = styled.button`
  background: none; border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  padding: 4px; border-radius: 50%; font-size: 1.3em; color: #fff;
  transition: transform 0.15s;
  &:hover { transform: scale(1.3); }
`

// ── Meta ──────────────────────────────────────────────────────────────────────
const Meta = styled.div`
  flex-shrink: 0; padding: 0.75rem 0 0; color: #fff; overflow-y: auto;
  @media (max-width: 600px) { padding: 0.75rem 5% 0; }
`

const ActionsRow = styled.div`
  display: flex; align-items: center; gap: 14px; margin-bottom: 0; flex-wrap: wrap;
  @media (max-width: 600px) { gap: 18px; }
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

const Spacer   = styled.div`flex: 1; min-width: 8px;`
const LikeWrap = styled.div`position: relative;`

const BoardTitle = styled.h2`
  font-size: 1.05em; font-weight: 700; color: #fff; margin: 0.75rem 0 0;
  @media (max-width: 600px) { font-size: 1.15em; }
`
const SenderName = styled.span`
  display: inline-block; margin-top: 6px;
  font-size: 0.78em; font-weight: 500; color: rgba(255,255,255,0.45);
  cursor: ${({ $clickable }) => $clickable ? 'pointer' : 'default'};
  &:hover { color: rgba(255,255,255,0.7); }
`
const OwnerRow = styled.div`
  display: flex; align-items: center; gap: 6px; margin-top: 0.75rem;
  a { display: flex; align-items: center; gap: 6px; text-decoration: none; }
`
const OwnerAvatar = styled.img`
  width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0;
  border: 1.5px solid rgba(255,255,255,0.2); object-fit: cover;
`
const OwnerAvatarDefault = styled.div`
  position: relative; width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0;
  border: 1.5px solid rgba(255,255,255,0.2); background: #fff; overflow: hidden;
  display: flex; align-items: flex-end; justify-content: center;
  img { position: absolute; width: 100%; object-fit: contain; display: block; bottom: -1px; }
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

// ── Action menu overlay ────────────────────────────────────────────────────────
const ActionMenuOverlay = styled.div`
  position: fixed; inset: 0; z-index: 20;
  background: rgba(0,0,0,0.7);
  display: flex; align-items: center; justify-content: center;
  padding: 0 1.25rem;
`
const ActionMenuSheet = styled.div`
  width: 100%; max-width: 420px; background: #fff; border-radius: 30px;
  padding: 20px; max-height: 70dvh; overflow-y: auto; -webkit-overflow-scrolling: touch;
`
const ActionMenuTitle = styled.h3`font-size: 1.1em; font-weight: 700; color: #111; margin: 0 0 16px;`
const ActionMenuBtns  = styled.div`
  display: flex; gap: 12px;
  margin-bottom: ${({ $hasEditActions }) => $hasEditActions ? '20px' : '5px'};
`
const ActionMenuPill = styled.button`
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 7px;
  padding: 12px 10px; border: none; border-radius: 10px;
  background: #F8F9FB; color: #111; font-size: 0.95em; font-weight: 600; cursor: pointer;
  transition: background 0.15s;
  &:hover { background: #eef0f4; }
`
const ActionMenuDivider      = styled.hr`border: none; border-top: 1.5px solid #ebebeb; margin: 0 0 16px;`
const ActionMenuSectionLabel = styled.p`
  font-size: 0.7em; font-weight: 700; letter-spacing: 0.08em; color: #888; margin: 0 0 10px;
`
const ActionMenuRow = styled.button`
  display: flex; align-items: center; gap: 14px; width: 100%;
  background: #F8F9FB; border: none; border-radius: 10px; padding: 8px 6px;
  cursor: pointer; text-align: left; transition: background 0.15s; margin-bottom: 8px;
  &:hover { background: #eef0f4; }
`
const ActionMenuThumb = styled.div`
  width: 64px; height: 80px; border-radius: 8px; overflow: hidden; flex-shrink: 0;
  background: #e0e0e0; display: flex; align-items: center; justify-content: center;
  img { width: 100%; height: 100%; object-fit: cover; display: block; }
`
const ActionMenuThumbFallback = styled.div`width: 100%; height: 100%; border-radius: 10px;`
const ActionMenuThumbText     = styled.div`
  width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
  font-size: 0.6em; padding: 4px; text-align: center; line-height: 1.3; overflow: hidden;
`
const ActionMenuRowLabel = styled.span`font-size: 0.95em; font-weight: 600; color: #111;`

// ── Modals ────────────────────────────────────────────────────────────────────
const ModalOverlay = styled.div`
  position: fixed; inset: 0; background: rgba(0,0,0,0.65); z-index: 300;
  display: flex; align-items: center; justify-content: center; padding: 16px;
`
const ModalCard = styled.div`
  background: #fff; border-radius: 20px; width: min(400px,100%); padding: 28px 24px 24px;
  animation: ${modalFade} 0.18s ease forwards;
`
const ModalTitle = styled.h3`font-size: 1.05em; font-weight: 700; color: #111; margin: 0 0 14px;`
const ModalBody  = styled.p`font-size: 0.88em; color: #555; margin: 0 0 20px;`

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
  border: 2px solid ${({ $selected }) => $selected ? '#E05A42' : '#ccc'};
  background: ${({ $selected }) => $selected ? '#E05A42' : 'transparent'};
  transition: all 0.15s;
`
const SubmitBtn = styled.button`
  width: 100%; padding: 14px; background: #E05A42; color: #fff;
  border: none; border-radius: 99px; font-size: 0.92em; font-weight: 600; cursor: pointer;
  transition: opacity 0.15s;
  &:disabled { opacity: 0.6; cursor: default; }
  &:hover:not(:disabled) { opacity: 0.88; }
`

// ── Share modal ───────────────────────────────────────────────────────────────
const ShareOverlay = styled.div`
  position: fixed; inset: 0; z-index: 300;
  background: rgba(0,0,0,0.7);
  display: flex; align-items: center; justify-content: center; padding: 1rem;
`
const ShareCard = styled.div`
  background: #fff; border-radius: 30px; padding: 1.5rem;
  width: 100%; max-width: 400px;
  display: flex; flex-direction: column; gap: 1.5rem;
  animation: ${modalFade} 0.18s ease forwards;

  .share_frame_part { display: flex; flex-direction: column; gap: 1rem; }

  .share_canvas_frame {
    position: relative; width: 100%; overflow: hidden; border-radius: 30px;
  }

  .share_logo {
    position: absolute; top: -10%; right: -30%; width: 280px; height: auto;
    z-index: 15; pointer-events: none;
  }

  .share_rect { position: absolute; top: 15%; width: 45%; pointer-events: none; z-index: 5; }
  .share_rect_left  { left: 10%; }
  .share_rect_right { right: 10%; }

  .share_frame_img {
    width: 100%; height: auto; display: block; position: relative; z-index: 1; pointer-events: none;
  }

  .share_canvas_and_text {
    position: absolute; top: 10%; left: 50%; transform: translateX(-50%);
    width: 50%; z-index: 10; display: flex; flex-direction: column;
  }

  .share_canvas_inner {
    width: 100%; display: flex; align-items: center; justify-content: center;
    border-radius: 14px; overflow: hidden;
  }

  .share_text_container {
    margin-top: 2rem; display: flex; flex-direction: column; gap: 0.25rem; text-align: center;
  }
  .share_board_title {
    margin: 0; font-size: 1.05em; font-weight: 700; color: #111; line-height: 1.3;
  }
  .share_board_caption {
    margin: 0; font-size: 0.9em; color: #272835; opacity: 0.5; line-height: 1.5;
  }

  .share_btn_part { display: flex; flex-direction: column; gap: 0.75rem; }

  .share_primary_btn {
    width: 100%; height: 50px; border: none; border-radius: 25px;
    background: #E05A42; color: #fff; font-size: 1em; font-weight: 600; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: opacity 0.2s;
    &:hover { opacity: 0.88; }
  }
  .share_secondary_btn {
    width: 100%; height: 50px; border: 1px solid #111; border-radius: 25px;
    background: transparent; color: #111; font-size: 1em; font-weight: 500; cursor: pointer;
    transition: opacity 0.2s;
    &:hover { opacity: 0.7; }
  }
`

// ── Fullscreen ────────────────────────────────────────────────────────────────
const FullOverlay    = styled.div`position: fixed; inset: 0; z-index: 400; background: rgba(0,0,0,0.94); display: flex; align-items: center; justify-content: center;`
const FullImg        = styled.img`max-width: 95vw; max-height: 95vh; object-fit: contain; border-radius: 8px;`
const FullCanvasWrap = styled.div`width: min(92vw,560px); aspect-ratio: 1/1; border-radius: 12px; overflow: hidden;`
const FullAudioWrap  = styled.div`width: min(92vw,420px); aspect-ratio: 1/1; border-radius: 16px; overflow: hidden;`

// ── Audio ─────────────────────────────────────────────────────────────────────
const AudioWrap = styled.div`
  width: 100%; height: 100%; position: relative;
  background: #FDDDD7; border-radius: 16px;
  display: flex; align-items: center; justify-content: center; overflow: hidden;

  .ripple {
    position: absolute; top: 50%; left: 50%; border-radius: 50%;
    background: rgba(201,79,56,0.12);
    transform: translate(-50%,-50%) scale(0);
    animation: ${audioRipple} 3s ease-out infinite both;
  }
  .ripple:nth-child(1) { width: 160%; padding-top: 160%; animation-delay: 0s; }
  .ripple:nth-child(2) { width: 110%; padding-top: 110%; animation-delay: 1s; }
  .ripple:nth-child(3) { width: 60%;  padding-top: 60%;  animation-delay: 2s; }
`
const MicBtn = styled.button`
  position: relative; z-index: 2;
  width:  ${({ $large }) => $large ? '110px' : '70px'};
  height: ${({ $large }) => $large ? '110px' : '70px'};
  border-radius: 50%; background: #fff; border: none;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: transform 0.15s;
  &:hover { transform: scale(1.06); }
`
const MicIconWrap = styled.span`
  color: #C94F38; font-size: ${({ $large }) => $large ? '2.8em' : '1.7em'};
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
  position: absolute; bottom: 12px; left: 7.5%; right: 7.5%; z-index: 2;
  display: flex; align-items: center; gap: 8px;
  padding: ${({ $large }) => $large ? '12px 0' : '8px 0'};
`
const AudioPlayBtn = styled.button`
  flex-shrink: 0; width: 32px; height: 32px; border: none; background: none; padding: 0;
  display: flex; align-items: center; justify-content: center;
  color: #C94F38; font-size: 1.3em; cursor: pointer;
`
const AudioTrack = styled.div`
  flex: 1; position: relative; height: 14px;
  background: ${({ $visible }) => $visible ? '#fff' : 'transparent'};
  border-radius: 99px; cursor: pointer; overflow: hidden; transition: background 0.2s;
`
const AudioFill   = styled.div`height: 100%; background: #F08468; border-radius: 99px; transition: width 0.1s linear; pointer-events: none;`
const AudioTime   = styled.span`
  flex-shrink: 0; font-size: 0.8em; color: #9CA3AF; font-weight: 500;
  opacity: ${({ $visible }) => $visible ? 1 : 0}; transition: opacity 0.2s;
`
const AudioSender = styled.span`
  position: absolute;
  top: ${({ $large }) => $large ? '16px' : '10px'};
  left: ${({ $large }) => $large ? '16px' : '10px'};
  z-index: 2; background: rgba(201,79,56,0.15); color: #C94F38;
  font-size: 0.67em; font-weight: 600; padding: 3px 9px; border-radius: 99px;
  cursor: ${({ $clickable }) => $clickable ? 'pointer' : 'default'};
  pointer-events: ${({ $clickable }) => $clickable ? 'auto' : 'none'};
  ${({ $clickable }) => $clickable && `&:hover { background: rgba(201,79,56,0.28); }`}
`

// ── Error state ───────────────────────────────────────────────────────────────
const NotFoundTitle = styled.h2`color: #fff; font-size: 1.1em; margin: 0; text-align: center;`
const NotFoundSub   = styled.p`color: rgba(255,255,255,0.5); font-size: 0.88em; margin: 0; text-align: center; max-width: 300px;`
const GoHomeBtn     = styled.button`
  padding: 0.7em 2em; background: #E05A42; color: #fff; border: none;
  border-radius: 99px; font-size: 0.9em; font-weight: 600; cursor: pointer;
  margin-top: 0.5rem;
`

export default SingleBoardPage
