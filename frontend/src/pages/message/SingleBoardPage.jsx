// import React, { useEffect, useRef, useState, useCallback } from 'react'
// import { createPortal } from 'react-dom'
// import styled, { keyframes } from 'styled-components'
// import { useDispatch, useSelector } from 'react-redux'
// import { useNavigate, useParams, Link } from 'react-router-dom'
// import axios from 'axios'
// import {
//   BsHeart, BsHeartFill, PiShareFat, BsFlag, BsPencil, BsTrash,
//   BsChevronLeft, BsChevronRight, BsArrowsFullscreen,
//   BsPlusCircle, BsStarFill, BsThreeDotsVertical, BsLink45Deg,
//   BsMicFill, BsPlayFill, BsPauseFill, BsInfoCircle, BsArrowLeft,
//   BsCheckCircleFill, BsHouseFill,
// } from 'react-icons/bs'
// import { likeBoard, shareBoard, deleteBoard, getBoardLikes, optimisticToggleLike } from '../../slices/boardSlice'
// import { deleteMessage } from '../../slices/messageSlice'
// import { URL } from '../../paths/url'
// import CanvasRenderer from '../../canvas/CanvasRenderer'
// import LoginPopup from '../../components/auth/LoginPopup'

// const FLAG_REASONS = ['Deceitful', 'Derogatory', 'Evil', 'Spam', 'Inappropriate']

// const SPONSOR_OPTIONS = [
//   { id: 'sponsor_200',  label: 'Sponsor 200 curation',  price: 1,    display: 'Pay $1'    },
//   { id: 'sponsor_1000', label: 'Sponsor 1000 curation', price: 100,  display: 'Pay $100'  },
//   { id: 'unlimited',    label: 'Sponsor Unlimited',     price: 1000, display: 'Pay $1000' },
// ]

// // ── Audio player ──────────────────────────────────────────────────────────────
// const AudioPlayer = ({ src, senderUsername, onSenderClick, hideUsername, large = false }) => {
//   const audioRef = useRef(null)
//   const [playing,  setPlaying]  = useState(false)
//   const [progress, setProgress] = useState(0)
//   const [duration, setDuration] = useState(0)
//   const [current,  setCurrent]  = useState(0)

//   const toggle = () => {
//     const el = audioRef.current
//     if (!el) return
//     if (playing) { el.pause(); setPlaying(false) }
//     else         { el.play();  setPlaying(true)  }
//   }

//   const onTimeUpdate = () => {
//     const el = audioRef.current
//     if (!el || !el.duration) return
//     setCurrent(el.currentTime)
//     setProgress((el.currentTime / el.duration) * 100)
//   }

//   const onEnded = () => { setPlaying(false); setProgress(0); setCurrent(0) }
//   const onLoadedMetadata = () => { if (audioRef.current) setDuration(audioRef.current.duration) }

//   const seek = (e) => {
//     const el = audioRef.current
//     if (!el || !el.duration) return
//     const rect = e.currentTarget.getBoundingClientRect()
//     const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
//     el.currentTime = pct * el.duration
//     setProgress(pct * 100)
//   }

//   const fmt = (s) => {
//     if (!s || isNaN(s)) return '0:00'
//     return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
//   }

//   return (
//     <AudioWrap $large={large}>
//       <audio ref={audioRef} src={src}
//         onTimeUpdate={onTimeUpdate} onEnded={onEnded} onLoadedMetadata={onLoadedMetadata} />
//       <MicBtn onClick={toggle} $large={large}>
//         <MicIconWrap $large={large}><BsMicFill /></MicIconWrap>
//         <PlayIconWrap $large={large}>{playing ? <BsPauseFill /> : <BsPlayFill />}</PlayIconWrap>
//       </MicBtn>
//       <AudioBottom $large={large}>
//         <AudioTrack onClick={seek}>
//           <AudioFill style={{ width: `${progress}%` }} />
//           <AudioThumb style={{ left: `${progress}%` }} />
//         </AudioTrack>
//         <AudioTimes><span>{fmt(current)}</span><span>{fmt(duration)}</span></AudioTimes>
//       </AudioBottom>
//       {!hideUsername && senderUsername && (
//         <AudioSender
//           $large={large}
//           $clickable={!!onSenderClick}
//           onClick={onSenderClick ?? undefined}
//         >
//           @{senderUsername}
//         </AudioSender>
//       )}
//     </AudioWrap>
//   )
// }

// // ── Main page ─────────────────────────────────────────────────────────────────
// const SingleBoardPage = () => {
//   const { slug }    = useParams()
//   const dispatch    = useDispatch()
//   const navigate    = useNavigate()
//   const { userCookie }    = useSelector(s => s.auth)
//   const { myProfile }     = useSelector(s => s.user)
//   const { likedBoardIds } = useSelector(s => s.board)
//   const isLoggedIn = !!userCookie

//   const [fullBoard,       setFullBoard]       = useState(null)
//   const [messages,        setMessages]        = useState([])
//   const [msgIdx,          setMsgIdx]          = useState(0)
//   const [likeCount,       setLikeCount]       = useState(0)
//   const [boardLoading,    setBoardLoading]    = useState(true)
//   const [messagesLoading, setMessagesLoading] = useState(true)
//   const [notFound,        setNotFound]        = useState(false)
//   const [forbidden,       setForbidden]       = useState(false)

//   const [showFlag,      setShowFlag]      = useState(false)
//   const [,             setShowSponsor]   = useState(false)
//   const [showDelete,    setShowDelete]    = useState(false)
//   const [showDeleteMsg, setShowDeleteMsg] = useState(false)
//   const [showLogin,     setShowLogin]     = useState(false)
//   const [showFullImg,   setShowFullImg]   = useState(false)
//   const [showActions,   setShowActions]   = useState(false)
//   const [showShare,     setShowShare]     = useState(false)
//   const [linkCopied,    setLinkCopied]    = useState(false)

//   const [flagReason,    setFlagReason]    = useState('')
//   const [flagLoading,   setFlagLoading]   = useState(false)
//   const [flagDone,      setFlagDone]      = useState(false)
  
//   const [deleteLoading, setDeleteLoading] = useState(false)
//   const [menuPos,       setMenuPos]       = useState({ top: 0, right: 0 })
//   const [showMsgMenu,   setShowMsgMenu]   = useState(false)
//   const [msgMenuPos,    setMsgMenuPos]    = useState({ top: 0, right: 0 })

//   const dotsRef    = useRef(null)
//   const msgDotsRef = useRef(null)
//   const touchStart  = useRef(null)
//   const touchStartY = useRef(null)

//   const currentUserId = myProfile?._id?.toString()

//   const isOwner = !!(currentUserId &&
//     fullBoard?.owner?._id?.toString() === currentUserId)

//   const isReceipent = !!(currentUserId && (
//     fullBoard?.receipent?.toString() === currentUserId ||
//     fullBoard?.receipent?._id?.toString() === currentUserId
//   ))

//   const canManage = isOwner || isReceipent
//   const isAnonymous = fullBoard?.visibility === 'anonymous'

//   // Optimistic like — update count + set immediately, revert on failure
//   const liked = fullBoard ? likedBoardIds.includes(fullBoard._id?.toString()) : false

//   const currentMsg  = messages[msgIdx] ?? null
//   const isEmblem    = currentMsg?.type === 'emblem' && !!currentMsg?.canvasData
//   const isAudio     = currentMsg?.type === 'audio'
//   const isMsgSender = !!(currentUserId && currentMsg?.sender?._id?.toString() === currentUserId)

//   const fullscreenSrc =
//     currentMsg?.content?.imageUrls?.[0] ||
//     fullBoard?.coverImage ||
//     messages.find(m => m.content?.imageUrls?.[0])?.content?.imageUrls?.[0] ||
//     null

//   // ── Fetch board + messages ────────────────────────────────────────────────
//   useEffect(() => {
//     if (!slug) return
//     setBoardLoading(true)
//     setMessagesLoading(true)
//     setNotFound(false)
//     setForbidden(false)

//     axios.get(`${URL}/api/v1/board/${slug}`, { withCredentials: true })
//       .then(r => {
//         setFullBoard(r.data.board)
//         setLikeCount(r.data.board?.stats?.likes ?? 0)
//         setBoardLoading(false)
//       })
//       .catch(err => {
//         if (err.response?.status === 404) setNotFound(true)
//         else if (err.response?.status === 403) setForbidden(true)
//         setBoardLoading(false)
//       })

//     axios.get(`${URL}/api/v1/message/${slug}/board`, {
//       params: { page: 1, limit: 50 }, withCredentials: true,
//     })
//       .then(r => { setMessages(r.data.messages ?? []); setMessagesLoading(false) })
//       .catch(() => setMessagesLoading(false))
//   }, [slug])

//   useEffect(() => {
//     if (isLoggedIn) dispatch(getBoardLikes())
//   }, [isLoggedIn, dispatch])

//   // ── Keyboard ──────────────────────────────────────────────────────────────
//   useEffect(() => {
//     const h = e => {
//       if (e.key !== 'Escape') return
//       setShowFlag(false); setShowSponsor(false); setShowDelete(false)
//       setShowLogin(false); setShowFullImg(false)
//     }
//     window.addEventListener('keydown', h)
//     return () => window.removeEventListener('keydown', h)
//   }, [])

//   // ── Touch swipe ───────────────────────────────────────────────────────────
//   const onTouchStart = useCallback(e => {
//     touchStart.current  = e.touches[0].clientX
//     touchStartY.current = e.touches[0].clientY
//   }, [])

//   const onTouchEnd = useCallback(e => {
//     if (touchStart.current === null) return
//     const dx = e.changedTouches[0].clientX - touchStart.current
//     const dy = e.changedTouches[0].clientY - touchStartY.current
//     if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50 && messages.length > 1) {
//       if (dx < 0) setMsgIdx(i => Math.min(messages.length - 1, i + 1))
//       else        setMsgIdx(i => Math.max(0, i - 1))
//     }
//     touchStart.current = null
//   }, [messages.length])

//   // ── Action handlers ───────────────────────────────────────────────────────

//   const likeCountRef     = useRef(likeCount)
//   const likedBoardIdsRef = useRef(likedBoardIds)
//   likeCountRef.current     = likeCount
//   likedBoardIdsRef.current = likedBoardIds

//   const isLiking = useRef(false)

//   const handleLike = useCallback(async () => {
//     if (!isLoggedIn) { setShowLogin(true); return }
//     if (!fullBoard?._id) return
//     if (isLiking.current) return

//     isLiking.current = true

//     const boardId      = fullBoard._id.toString()
//     const prevCount    = likeCountRef.current
//     const wasLiked     = likedBoardIdsRef.current.includes(boardId)
//     const nextCount    = wasLiked ? prevCount - 1 : prevCount + 1

//     setLikeCount(nextCount)
//     dispatch(optimisticToggleLike(boardId))

//     try {
//       const res = await dispatch(likeBoard(fullBoard._id))
//       if (res?.payload?.status === 'success') {
//         const serverCount = res.payload.response?.likeCount
//         if (serverCount !== undefined) setLikeCount(serverCount)
//       } else {
//         setLikeCount(prevCount)
//         dispatch(optimisticToggleLike(boardId))
//       }
//     } finally {
//       isLiking.current = false
//     }
//   }, [isLoggedIn, fullBoard, dispatch])

//   const handleShare = useCallback(() => {
//     if (!isLoggedIn) { setShowLogin(true); return }
//     setShowShare(true)
//   }, [isLoggedIn])

//   const handleCopyLink = useCallback(async () => {
//     try {
//       await navigator.clipboard.writeText(window.location.href)
//       setLinkCopied(true)
//       setTimeout(() => setLinkCopied(false), 2500)
//       if (fullBoard?._id) dispatch(shareBoard(fullBoard._id))
//     } catch (err) { console.error(err) }
//   }, [fullBoard, dispatch])

//   const handleFlag = useCallback(async () => {
//     if (!flagReason) return
//     setFlagLoading(true)
//     try {
//       await axios.patch(`${URL}/api/v1/board/${slug}/flag`, { reason: flagReason }, { withCredentials: true })
//       setFlagDone(true)
//       navigate('/profile')
//     } catch (err) { console.error(err) }
//     setFlagLoading(false)
//   }, [flagReason, slug, navigate])

//   const handleDelete = useCallback(async () => {
//     if (!fullBoard?._id) return
//     setDeleteLoading(true)
//     const res = await dispatch(deleteBoard(fullBoard._id))
//     setDeleteLoading(false)
//     if (res?.payload?.status === 'success') navigate('/')
//   }, [fullBoard, dispatch, navigate])

//   const handleDeleteMessage = useCallback(async () => {
//     if (!currentMsg?._id) return
//     setShowDeleteMsg(false)
//     const res = await dispatch(deleteMessage(currentMsg._id))
//     if (res?.payload?.status === 'success') {
//       setMessages(prev => {
//         const next = prev.filter(m => m._id !== currentMsg._id)
//         setMsgIdx(i => Math.min(i, Math.max(0, next.length - 1)))
//         return next
//       })
//     }
//   }, [currentMsg, dispatch])

//   const openDotsMenu = () => {
//     if (dotsRef.current) {
//       const r = dotsRef.current.getBoundingClientRect()
//       setMenuPos({ top: r.bottom + 6, right: window.innerWidth - r.right })
//     }
//     setShowActions(v => !v)
//   }

//   const openMsgMenu = () => {
//     if (msgDotsRef.current) {
//       const r = msgDotsRef.current.getBoundingClientRect()
//       setMsgMenuPos({ top: r.bottom + 6, right: window.innerWidth - r.right })
//     }
//     setShowMsgMenu(v => !v)
//   }

//   // ── Render media ──────────────────────────────────────────────────────────
//   const renderMedia = (msg) => {
//     if (!msg) return null
//     const sender   = msg.sender?.username ?? null
//     const hideName = isAnonymous && !isMsgSender
//     const onSenderClick = (!hideName && sender)
//       ? () => navigate(`/profile/${sender}`)
//       : null

//     if (msg.type === 'emblem' && msg.canvasData) {
//       return (
//         <>
//           <CanvasRenderer canvasData={msg.canvasData} style={{ width: '100%', height: '100%' }} />
//           {!hideName && sender && (
//             <SenderBadge $clickable onClick={() => navigate(`/profile/${sender}`)}>
//               @{sender}
//             </SenderBadge>
//           )}
//         </>
//       )
//     }

//     if (msg.type === 'audio') {
//       return (
//         <AudioPlayer
//           src={msg.content?.audioUrl}
//           senderUsername={sender}
//           hideUsername={hideName}
//           onSenderClick={onSenderClick}
//         />
//       )
//     }

//     if (msg.content?.imageUrls?.[0]) {
//       return (
//         <>
//           <MessageImg src={msg.content.imageUrls[0]} alt="" />
//           {!hideName && sender && (
//             <SenderBadge $clickable onClick={() => navigate(`/profile/${sender}`)}>
//               @{sender}
//             </SenderBadge>
//           )}
//         </>
//       )
//     }

//     if (msg.content?.text) {
//       return (
//         <TextDisplay style={{
//           background: msg.content.background || '#1C2030',
//           color:      msg.content.color       || '#fff',
//           fontFamily: msg.content.font         || 'inherit',
//         }}>
//           <TextContent>{msg.content.text}</TextContent>
//           {!hideName && sender && (
//             <SenderBadge $clickable onClick={() => navigate(`/profile/${sender}`)}>
//               @{sender}
//             </SenderBadge>
//           )}
//         </TextDisplay>
//       )
//     }

//     return null
//   }

//   const isPrivateAndBlocked =
//     !boardLoading && fullBoard &&
//     fullBoard.visibility === 'private' &&
//     !isOwner && !isReceipent

//   if (!boardLoading && (notFound || forbidden || isPrivateAndBlocked)) {
//     return (
//       <Page>
//         <TopBar>
//           <BackButton onClick={() => navigate('/')}><BsArrowLeft /></BackButton>
//           <TopBarTitle>{(forbidden || isPrivateAndBlocked) ? 'Private Board' : 'Not Found'}</TopBarTitle>
//           <div style={{ width: 32 }} />
//         </TopBar>
//         <NotFoundWrap>
//           <NotFoundTitle>
//             {(forbidden || isPrivateAndBlocked) ? 'This board is private' : 'Board not found'}
//           </NotFoundTitle>
//           <NotFoundSub>
//             {(forbidden || isPrivateAndBlocked)
//               ? 'Only the board owner and recipient can view this board.'
//               : 'This board may have been deleted or made private.'
//             }
//           </NotFoundSub>
//           <BackBtn onClick={() => navigate('/')}>Go home</BackBtn>
//         </NotFoundWrap>
//       </Page>
//     )
//   }

//   if (boardLoading) {
//     return (
//       <Page>
//         <LoadWrap><Spinner /></LoadWrap>
//       </Page>
//     )
//   }

//   return (
//     <Page>
//       {/* Top bar */}
//       <TopBar>
//         <BackButton onClick={() => navigate('/')}><BsArrowLeft /></BackButton>
//         <TopBarTitle>{fullBoard?.title ?? ''}</TopBarTitle>
//         <ExpandButton onClick={() => setShowFullImg(true)}><BsArrowsFullscreen /></ExpandButton>
//       </TopBar>

//       {/* Media */}
//       <MediaWrap>
//         <MediaArea onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
//           {messagesLoading
//             ? <MediaLoader><Spinner /></MediaLoader>
//             : messages.length === 0
//               ? (
//                 <EmptyBoard onClick={() => navigate(`/board/${slug}/add-message`)}>
//                   <EmptyBoardText>Board is currently empty.</EmptyBoardText>
//                   <EmptyBoardCta>Click to add a message</EmptyBoardCta>
//                 </EmptyBoard>
//               )
//               : renderMedia(currentMsg)
//           }

//           {!messagesLoading && isMsgSender && currentMsg && (
//             <MsgDotsBtn ref={msgDotsRef} onClick={openMsgMenu}>
//               <BsInfoCircle />
//             </MsgDotsBtn>
//           )}

//           {messages.length > 1 && (
//             <MsgDots>
//               {messages.map((_, i) => (
//                 <Dot key={i} $active={i === msgIdx} onClick={() => setMsgIdx(i)} />
//               ))}
//             </MsgDots>
//           )}

//           {messages.length > 1 && (
//             <>
//               <MsgNav $side="left" disabled={msgIdx === 0}
//                 onClick={() => setMsgIdx(i => Math.max(0, i - 1))}>
//                 <BsChevronLeft />
//               </MsgNav>
//               <MsgNav $side="right" disabled={msgIdx === messages.length - 1}
//                 onClick={() => setMsgIdx(i => Math.min(messages.length - 1, i + 1))}>
//                 <BsChevronRight />
//               </MsgNav>
//             </>
//           )}
//         </MediaArea>
//       </MediaWrap>

//       {/* Meta */}
//       <Meta>
//         <ActionsRow>
//           <ActionBtn onClick={handleLike}>
//             {liked ? <BsHeartFill style={{ color: '#E05A42' }} /> : <BsHeart />}
//             <span>{likeCount}</span>
//           </ActionBtn>

//           <ActionBtn onClick={handleShare}>
//             <PiShareFat />
//             <span>{fullBoard?.stats?.shares ?? 0}</span>
//           </ActionBtn>

//           {isReceipent && (
//             <ActionBtn onClick={() => setShowFlag(true)}><BsFlag /></ActionBtn>
//           )}

//           <Spacer />

//           {isLoggedIn && (
//             <ActionBtn $accent onClick={() => navigate(`/board/${slug}/add-message`)}>
//               <BsPlusCircle /><span>Add Post</span>
//             </ActionBtn>
//           )}

//           {canManage && (
//             <ActionsMenuWrap>
//               <ActionBtn ref={dotsRef} onClick={openDotsMenu}>
//                 <BsThreeDotsVertical />
//               </ActionBtn>
//             </ActionsMenuWrap>
//           )}
//         </ActionsRow>

//         <BoardTitle>{fullBoard?.title}</BoardTitle>
//         {fullBoard?.event && <BoardTag>{fullBoard.event}</BoardTag>}

//         {fullBoard?.owner && (
//           <OwnerRow>
//             <Link to={`/profile/${fullBoard.owner.username}`}>
//               <OwnerName>@{fullBoard.owner.username}</OwnerName>
//               <CuratorBadge>Curator</CuratorBadge>
//             </Link>
//           </OwnerRow>
//         )}

//         {fullBoard?.receipent && (
//           <ReceipentRow>
//             <span className="for_label">For</span>
//             <Link to={`/profile/${fullBoard.receipent.username}`}>
//               <ReceipentBadge>@{fullBoard.receipent.username}</ReceipentBadge>
//             </Link>
//           </ReceipentRow>
//         )}
//       </Meta>

//       {/* ── Flag ── */}
//       {showFlag && (
//         <ModalOverlay onClick={() => setShowFlag(false)}>
//           <ModalCard onClick={e => e.stopPropagation()}>
//             {flagDone ? (
//               <FlagSuccess>
//                 <BsCheckCircleFill className="icon" />
//                 <h3>Board Flagged</h3>
//                 <p>Thank you. We've received your report and will review this board.</p>
//                 <FlagSuccessActions>
//                   <SubmitBtn onClick={() => { setShowFlag(false); setFlagDone(false) }}>
//                     Close
//                   </SubmitBtn>
//                   <HomeBtn onClick={() => navigate('/')}>
//                     <BsHouseFill /><span>Go home</span>
//                   </HomeBtn>
//                 </FlagSuccessActions>
//               </FlagSuccess>
//             ) : (
//               <>
//                 <ModalTitle>Flag Board</ModalTitle>
//                 <ModalBody style={{ margin: '0 0 14px' }}>
//                   Why are you flagging this board? We'll review it and take action if needed.
//                 </ModalBody>
//                 <RadioGroup>
//                   {FLAG_REASONS.map(r => (
//                     <RadioRow key={r} $selected={flagReason === r} onClick={() => setFlagReason(r)}>
//                       <RadioDot $selected={flagReason === r} /><span>{r}</span>
//                     </RadioRow>
//                   ))}
//                 </RadioGroup>
//                 <SubmitBtn onClick={handleFlag} disabled={!flagReason || flagLoading}>
//                   {flagLoading ? 'Submitting…' : 'Submit Report'}
//                 </SubmitBtn>
//               </>
//             )}
//           </ModalCard>
//         </ModalOverlay>
//       )}

//       {/* ── Share ── */}
//       {showShare && (
//         <ModalOverlay onClick={() => setShowShare(false)}>
//           <ModalCard onClick={e => e.stopPropagation()}>
//             <ModalTitle>Share Board</ModalTitle>
//             {fullscreenSrc && <ShareThumb src={fullscreenSrc} alt="" />}
//             <ShareBoardName>{fullBoard?.title}</ShareBoardName>
//             {fullBoard?.owner?.username && <ShareBoardOwner>by {fullBoard.owner.username}</ShareBoardOwner>}
//             <ShareLinkRow>
//               <ShareLinkText>{window.location.href}</ShareLinkText>
//               <CopyBtn onClick={handleCopyLink}>
//                 <BsLink45Deg /><span>{linkCopied ? 'Copied!' : 'Copy'}</span>
//               </CopyBtn>
//             </ShareLinkRow>
//           </ModalCard>
//         </ModalOverlay>
//       )}

//       {/* ── Delete board ── */}
//       {showDelete && (
//         <ModalOverlay onClick={() => setShowDelete(false)}>
//           <ModalCard onClick={e => e.stopPropagation()}>
//             <ModalTitle>Delete Board</ModalTitle>
//             <ModalBody>Are you sure you want to delete <strong>{fullBoard?.title}</strong>? This cannot be undone.</ModalBody>
//             <DeleteRow>
//               <CancelBtn onClick={() => setShowDelete(false)}>Cancel</CancelBtn>
//               <SubmitBtn onClick={handleDelete} disabled={deleteLoading}>
//                 {deleteLoading ? 'Deleting…' : 'Delete'}
//               </SubmitBtn>
//             </DeleteRow>
//           </ModalCard>
//         </ModalOverlay>
//       )}

//       {/* ── Delete message ── */}
//       {showDeleteMsg && currentMsg && (
//         <ModalOverlay onClick={() => setShowDeleteMsg(false)}>
//           <ModalCard onClick={e => e.stopPropagation()}>
//             <ModalTitle>Delete Message</ModalTitle>
//             <ModalBody>Are you sure you want to delete this message? This cannot be undone.</ModalBody>
//             <DeleteRow>
//               <CancelBtn onClick={() => setShowDeleteMsg(false)}>Cancel</CancelBtn>
//               <SubmitBtn onClick={handleDeleteMessage}>Delete</SubmitBtn>
//             </DeleteRow>
//           </ModalCard>
//         </ModalOverlay>
//       )}

//       {/* ── Login ── */}
//       {showLogin && (
//         <LoginPopup onClose={() => setShowLogin(false)} message="Sign in to like, share, and interact with boards" />
//       )}

//       {/* ── Fullscreen ── */}
//       {showFullImg && currentMsg && (
//         <FullOverlay onClick={() => setShowFullImg(false)} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
//           {isEmblem
//             ? (
//               <FullCanvasWrap onClick={e => e.stopPropagation()}>
//                 <CanvasRenderer canvasData={currentMsg.canvasData} style={{ width: '100%', height: '100%' }} />
//               </FullCanvasWrap>
//             )
//             : isAudio
//               ? (
//                 <FullAudioWrap onClick={e => e.stopPropagation()}>
//                   <AudioPlayer
//                     src={currentMsg.content?.audioUrl}
//                     senderUsername={currentMsg.sender?.username}
//                     hideUsername={isAnonymous && !isMsgSender}
//                     onSenderClick={(!isAnonymous || isMsgSender) && currentMsg.sender?.username
//                       ? () => navigate(`/profile/${currentMsg.sender.username}`) : null}
//                     large
//                   />
//                 </FullAudioWrap>
//               )
//               : fullscreenSrc
//                 ? <FullImg src={fullscreenSrc} alt="" onClick={e => e.stopPropagation()} />
//                 : null
//           }
//         </FullOverlay>
//       )}

//       {/* ── Message menu portal ── */}
//       {showMsgMenu && isMsgSender && currentMsg && createPortal(
//         <>
//           <ActionsMenuBackdrop onClick={() => setShowMsgMenu(false)} />
//           <ActionsMenuPortal style={{ top: msgMenuPos.top, right: msgMenuPos.right }}>
//             <ActionsMenuItem onClick={() => { setShowMsgMenu(false); navigate(`/message/${currentMsg._id}/edit`) }}>
//               <BsPencil /><span>Edit message</span>
//             </ActionsMenuItem>
//             <ActionsMenuItem $danger onClick={() => { setShowMsgMenu(false); setShowDeleteMsg(true) }}>
//               <BsTrash /><span>Delete message</span>
//             </ActionsMenuItem>
//           </ActionsMenuPortal>
//         </>,
//         document.body
//       )}

//       {/* ── Board actions menu portal ── */}
//       {showActions && canManage && createPortal(
//         <>
//           <ActionsMenuBackdrop onClick={() => setShowActions(false)} />
//           <ActionsMenuPortal style={{ top: menuPos.top, right: menuPos.right }}>
//             <ActionsMenuItem onClick={() => { setShowActions(false); navigate(`/board/${slug}/edit`) }}>
//               <BsPencil /><span>Edit board</span>
//             </ActionsMenuItem>
//             <ActionsMenuItem $danger onClick={() => { setShowActions(false); setShowDelete(true) }}>
//               <BsTrash /><span>Delete board</span>
//             </ActionsMenuItem>
//           </ActionsMenuPortal>
//         </>,
//         document.body
//       )}
//     </Page>
//   )
// }

// // ── Keyframes ─────────────────────────────────────────────────────────────────
// const spin      = keyframes`to { transform: rotate(360deg) }`
// const fadeIn    = keyframes`from { opacity: 0 } to { opacity: 1 }`
// const modalFade = keyframes`from { opacity: 0; transform: scale(0.96) } to { opacity: 1; transform: scale(1) }`
// const pulse     = keyframes`
//   0%, 100% { box-shadow: 0 0 0 0    rgba(220,150,135,0.7) }
//   50%       { box-shadow: 0 0 0 16px rgba(220,150,135,0)   }
// `

// const Page = styled.div`
//   min-height: 100vh; background: #111827;
//   padding-bottom: 5rem;
//   animation: ${fadeIn} 0.2s ease forwards;
// `

// const TopBar = styled.div`
//   position: sticky; top: 0; z-index: 50;
//   background: #1C2030;
//   display: flex; align-items: center; gap: 0.75rem;
//   padding: 0.75rem 1rem;
//   border-bottom: 1px solid rgba(255,255,255,0.06);
// `

// const BackButton = styled.button`
//   background: none; border: none; color: #ccc; font-size: 1.1em;
//   width: 32px; height: 32px; border-radius: 50%;
//   display: flex; align-items: center; justify-content: center;
//   cursor: pointer; flex-shrink: 0;
//   transition: color 0.15s, background 0.15s;
//   &:hover { color: #fff; background: rgba(255,255,255,0.08); }
// `

// const TopBarTitle = styled.h1`
//   flex: 1; font-size: 0.95em; font-weight: 600; color: #fff; margin: 0;
//   white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
// `

// const ExpandButton = styled.button`
//   background: none; border: none; color: #ccc; font-size: 1em;
//   width: 32px; height: 32px; border-radius: 50%;
//   display: flex; align-items: center; justify-content: center;
//   cursor: pointer; flex-shrink: 0;
//   transition: color 0.15s, background 0.15s;
//   &:hover { color: #fff; background: rgba(255,255,255,0.08); }
// `

// const MediaWrap = styled.div`max-width: 560px; margin: 1.25rem auto 0; padding: 0 1rem;`

// const MediaArea = styled.div`
//   position: relative; width: 100%; aspect-ratio: 1 / 1;
//   background: #0d0f1a; border-radius: 18px; overflow: hidden;
// `

// const MessageImg = styled.img`width: 100%; height: 100%; object-fit: cover; display: block;`

// const MediaLoader = styled.div`
//   width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
// `

// const Spinner = styled.div`
//   width: 36px; height: 36px; border-radius: 50%;
//   border: 3px solid rgba(255,255,255,0.12);
//   border-top-color: rgba(255,255,255,0.7);
//   animation: ${spin} 0.75s linear infinite;
// `

// const LoadWrap = styled.div`
//   display: flex; align-items: center; justify-content: center; height: 60vh;
// `

// const EmptyBoard = styled.div`
//   width: 100%; height: 100%;
//   display: flex; flex-direction: column; align-items: center; justify-content: center;
//   gap: 8px; cursor: pointer; padding: 24px;
//   &:hover { background: rgba(255,255,255,0.04); }
// `

// const EmptyBoardText = styled.p`font-size: 0.88em; color: rgba(255,255,255,0.5); margin: 0;`
// const EmptyBoardCta  = styled.p`font-size: 0.78em; color: #E05A42; margin: 0; font-weight: 600;`

// const TextDisplay = styled.div`
//   width: 100%; height: 100%;
//   display: flex; align-items: center; justify-content: center;
//   padding: 24px; position: relative;
// `

// const TextContent = styled.p`
//   font-size: 1.1em; line-height: 1.55; text-align: center;
//   word-break: break-word; margin: 0;
// `

// const SenderBadge = styled.span`
//   position: absolute; bottom: 10px; left: 10px;
//   background: rgba(0,0,0,0.52); backdrop-filter: blur(6px);
//   color: #fff; font-size: 0.68em; font-weight: 600;
//   padding: 3px 10px; border-radius: 99px;
//   pointer-events: ${({ $clickable }) => $clickable ? 'auto' : 'none'};
//   cursor: ${({ $clickable }) => $clickable ? 'pointer' : 'default'};
//   z-index: 3; transition: background 0.15s;
//   ${({ $clickable }) => $clickable && `&:hover { background: rgba(0,0,0,0.75); }`}
// `

// const MsgDotsBtn = styled.button`
//   position: absolute; top: 10px; right: 10px; z-index: 5;
//   background: rgba(0,0,0,0.45); backdrop-filter: blur(6px);
//   border: none; border-radius: 50%; width: 28px; height: 28px;
//   display: flex; align-items: center; justify-content: center;
//   color: #fff; font-size: 0.9em; cursor: pointer;
//   &:hover { background: rgba(0,0,0,0.7); }
// `

// const MsgDots = styled.div`
//   position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%);
//   display: flex; gap: 5px; z-index: 4;
// `

// const Dot = styled.div`
//   width: 6px; height: 6px; border-radius: 50%;
//   background: ${({ $active }) => $active ? '#fff' : 'rgba(255,255,255,0.35)'};
//   cursor: pointer;
// `

// const MsgNav = styled.button`
//   position: absolute; top: 50%; transform: translateY(-50%);
//   ${({ $side }) => $side === 'left' ? 'left: 10px;' : 'right: 10px;'}
//   background: rgba(0,0,0,0.55); border: 1px solid rgba(255,255,255,0.15);
//   color: #fff; width: 30px; height: 30px; border-radius: 50%;
//   display: flex; align-items: center; justify-content: center;
//   font-size: 0.85em; cursor: pointer; z-index: 4; backdrop-filter: blur(4px);
//   &:hover:not(:disabled) { background: rgba(0,0,0,0.8); }
//   &:disabled { opacity: 0.2; cursor: default; }
// `

// const Meta = styled.div`
//   max-width: 560px; margin: 1rem auto 0; padding: 0 1rem; color: #fff;
// `

// const ActionsRow = styled.div`
//   display: flex; align-items: center; gap: 14px;
//   margin-bottom: 14px; flex-wrap: wrap;
// `

// const ActionBtn = styled.button`
//   display: flex; align-items: center; gap: 6px;
//   background: none; border: none;
//   color: ${({ $danger }) => $danger ? '#E05A42' : '#ccc'};
//   font-size: ${({ $accent }) => $accent ? '0.9em' : '1.1em'};
//   font-weight: ${({ $accent }) => $accent ? '600' : 'normal'};
//   cursor: pointer; padding: 0; transition: color 0.15s;
//   span { font-size: 0.82em; }
//   &:hover { color: #fff; }
// `

// const Spacer = styled.div`flex: 1;`

// const BoardTitle = styled.h2`font-size: 1.15em; font-weight: 700; color: #fff; margin: 0 0 4px;`
// const BoardTag   = styled.p`font-size: 0.78em; color: #9CA3AF; margin: 0 0 4px; text-transform: capitalize;`

// const OwnerRow = styled.div`
//   display: flex; align-items: center; gap: 6px; margin-top: 6px;
//   a { display: flex; align-items: center; gap: 6px; text-decoration: none; }
// `

// const OwnerName    = styled.span`font-size: 0.78em; color: #9CA3AF; font-weight: 500;`
// const CuratorBadge = styled.span`
//   font-size: 0.62em; background: #E05A42; color: #fff;
//   padding: 2px 6px; border-radius: 99px; font-weight: 600;
// `

// const ReceipentRow = styled.div`
//   display: flex; align-items: center; gap: 6px; margin-top: 6px;
//   a { text-decoration: none; }
//   .for_label { font-size: 0.75em; color: rgba(255,255,255,0.35); font-weight: 500; }
// `

// const ReceipentBadge = styled.span`
//   font-size: 0.78em; font-weight: 600; color: #F5C842;
//   background: rgba(245,200,66,0.12); border: 1px solid rgba(245,200,66,0.25);
//   padding: 3px 10px; border-radius: 99px; transition: background 0.15s;
//   &:hover { background: rgba(245,200,66,0.22); }
// `

// const NotFoundWrap = styled.div`
//   display: flex; flex-direction: column; align-items: center; justify-content: center;
//   min-height: 70vh; gap: 0.75rem; padding: 2rem;
// `
// const NotFoundTitle = styled.h2`font-size: 1.2em; color: #fff; margin: 0;`
// const NotFoundSub   = styled.p`font-size: 0.88em; color: #9CA3AF; margin: 0; text-align: center;`
// const BackBtn = styled.button`
//   margin-top: 0.5rem; padding: 0.6rem 1.5rem; border: none; border-radius: 99px;
//   background: #E05A42; color: #fff; font-weight: 600; cursor: pointer; font-size: 0.9em;
// `

// const ActionsMenuWrap     = styled.div`position: relative;`
// const ActionsMenuBackdrop = styled.div`position: fixed; inset: 0; z-index: 500;`
// const ActionsMenuPortal   = styled.div`
//   position: fixed; z-index: 501; background: #fff; border-radius: 12px;
//   box-shadow: 0 8px 28px rgba(0,0,0,0.22); overflow: hidden; min-width: 160px;
//   animation: ${modalFade} 0.15s ease forwards;
// `
// const ActionsMenuItem = styled.button`
//   width: 100%; display: flex; align-items: center; gap: 10px;
//   background: none; border: none; padding: 12px 16px;
//   font-size: 0.88em; font-weight: 500;
//   color: ${({ $danger }) => $danger ? '#E05A42' : '#222'};
//   cursor: pointer; text-align: left;
//   &:hover { background: #F5F6F8; }
//   svg { font-size: 1em; flex-shrink: 0; }
// `

// const ModalOverlay = styled.div`
//   position: fixed; inset: 0; background: rgba(0,0,0,0.65); z-index: 300;
//   display: flex; align-items: center; justify-content: center; padding: 16px;
// `
// const ModalCard = styled.div`
//   background: #fff; border-radius: 20px; width: min(400px, 100%); padding: 28px 24px 24px;
//   animation: ${modalFade} 0.18s ease forwards;
// `
// const ModalTitle   = styled.h3`font-size: 1.05em; font-weight: 700; color: #111; margin: 0 0 14px;`
// const ModalBody    = styled.p`font-size: 0.88em; color: #555; margin: 0 0 20px;`
// const ModalCaption = styled.p`font-size: 0.82em; color: #888; text-align: center; margin: 0 0 14px;`
// const SectionLabel = styled.p`font-size: 0.72em; font-weight: 700; letter-spacing: 0.08em; color: #999; text-transform: uppercase; margin: 0 0 10px;`

// // Flag success state — more polished
// const FlagSuccess = styled.div`
//   display: flex; flex-direction: column; align-items: center;
//   text-align: center; gap: 0.6rem; padding: 0.5rem 0;

//   .icon {
//     font-size: 2.5rem; color: #22c55e; margin-bottom: 0.25rem;
//   }

//   h3 {
//     font-size: 1.05em; font-weight: 700; color: #111; margin: 0;
//   }

//   p {
//     font-size: 0.86em; color: #6B7280; margin: 0; line-height: 1.5;
//   }
// `

// const FlagSuccessActions = styled.div`
//   display: flex; flex-direction: column; gap: 8px; width: 100%; margin-top: 0.75rem;
// `

// const HomeBtn = styled.button`
//   width: 100%; padding: 13px; display: flex; align-items: center; justify-content: center; gap: 6px;
//   background: #F5F6F8; color: #333; border: none; border-radius: 99px;
//   font-size: 0.9em; font-weight: 600; cursor: pointer; transition: background 0.15s;
//   &:hover { background: #ECEEF2; }
// `

// const RadioGroup = styled.div`display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px;`
// const RadioRow   = styled.div`
//   display: flex; align-items: center; gap: 12px;
//   background: #F5F6F8; border-radius: 10px; padding: 12px 14px;
//   cursor: pointer; font-size: 0.88em; color: #222;
//   &:hover { background: #ECEEF2; }
// `
// const RadioDot = styled.div`
//   width: 18px; height: 18px; border-radius: 50%; flex-shrink: 0;
//   border: 2px solid ${({ $selected, $green }) => $selected ? ($green ? '#22c55e' : '#E05A42') : '#ccc'};
//   background: ${({ $selected, $green }) => $selected ? ($green ? '#22c55e' : '#E05A42') : 'transparent'};
// `
// const PriceTag = styled.span`
//   font-size: 0.78em; background: #FFE8E5; color: #E05A42;
//   padding: 3px 10px; border-radius: 99px; font-weight: 600; white-space: nowrap;
// `
// const SubmitBtn = styled.button`
//   width: 100%; padding: 14px; background: #E05A42; color: #fff;
//   border: none; border-radius: 99px; font-size: 0.92em; font-weight: 600; cursor: pointer;
//   &:disabled { opacity: 0.6; cursor: default; }
//   &:hover:not(:disabled) { opacity: 0.88; }
// `
// const CancelBtn = styled.button`
//   width: 100%; padding: 14px; background: #F5F6F8; color: #333;
//   border: none; border-radius: 99px; font-size: 0.92em; font-weight: 600; cursor: pointer;
//   &:hover { background: #ECEEF2; }
// `
// const DeleteRow = styled.div`display: flex; gap: 10px; button { flex: 1; }`

// const ShareThumb      = styled.img`width: 100%; aspect-ratio: 4/3; object-fit: cover; border-radius: 12px; margin-bottom: 12px;`
// const ShareBoardName  = styled.h4`font-size: 0.95em; font-weight: 700; color: #111; margin: 0 0 2px;`
// const ShareBoardOwner = styled.p`font-size: 0.8em; color: #888; margin: 0 0 16px;`
// const ShareLinkRow    = styled.div`
//   display: flex; align-items: center; gap: 8px;
//   background: #F5F6F8; border-radius: 10px; padding: 10px 12px;
// `
// const ShareLinkText = styled.span`
//   flex: 1; font-size: 0.78em; color: #555;
//   white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
// `
// const CopyBtn = styled.button`
//   display: flex; align-items: center; gap: 5px; background: #E05A42; color: #fff;
//   border: none; border-radius: 8px; padding: 6px 12px;
//   font-size: 0.8em; font-weight: 600; cursor: pointer; flex-shrink: 0;
//   &:hover { opacity: 0.88; }
// `

// const FullOverlay    = styled.div`position: fixed; inset: 0; z-index: 400; background: rgba(0,0,0,0.94); display: flex; align-items: center; justify-content: center;`
// const FullImg        = styled.img`max-width: 95vw; max-height: 95vh; object-fit: contain; border-radius: 8px;`
// const FullCanvasWrap = styled.div`width: min(92vw, 560px); aspect-ratio: 1/1; border-radius: 12px; overflow: hidden;`
// const FullAudioWrap  = styled.div`width: min(92vw, 420px); aspect-ratio: 1/1; background: #F0E0DC; border-radius: 20px; overflow: hidden; display: flex; align-items: center; justify-content: center;`

// const AudioWrap = styled.div`
//   width: 100%; height: 100%;
//   display: flex; flex-direction: column; align-items: center; justify-content: center;
//   gap: ${({ $large }) => $large ? '28px' : '16px'};
//   background: #F0E0DC; position: relative;
//   padding: ${({ $large }) => $large ? '32px' : '16px'};
// `
// const MicBtn = styled.button`
//   position: relative;
//   width:  ${({ $large }) => $large ? '130px' : '84px'};
//   height: ${({ $large }) => $large ? '130px' : '84px'};
//   border-radius: 50%; background: rgba(220,150,135,0.55); border: none;
//   display: flex; align-items: center; justify-content: center;
//   cursor: pointer; animation: ${pulse} 2.4s ease-in-out infinite;
//   &:hover { transform: scale(1.06); }
// `
// const MicIconWrap = styled.span`
//   color: #C94F38;
//   font-size: ${({ $large }) => $large ? '2.6em' : '1.75em'};
//   display: flex; align-items: center; justify-content: center;
// `
// const PlayIconWrap = styled.span`
//   position: absolute;
//   bottom: ${({ $large }) => $large ? '-6px' : '-3px'};
//   right:  ${({ $large }) => $large ? '-6px' : '-3px'};
//   width:  ${({ $large }) => $large ? '42px' : '26px'};
//   height: ${({ $large }) => $large ? '42px' : '26px'};
//   border-radius: 50%; background: #E05A42; color: #fff;
//   display: flex; align-items: center; justify-content: center;
//   font-size: ${({ $large }) => $large ? '1.15em' : '0.78em'};
//   box-shadow: 0 2px 8px rgba(0,0,0,0.4);
// `
// const AudioBottom = styled.div`
//   width: ${({ $large }) => $large ? '78%' : '72%'};
//   display: flex; flex-direction: column; gap: 5px;
// `
// const AudioTrack = styled.div`
//   position: relative; height: 5px; background: rgba(201,79,56,0.2);
//   border-radius: 99px; cursor: pointer; overflow: visible;
// `
// const AudioFill  = styled.div`height: 100%; background: #E05A42; border-radius: 99px; transition: width 0.1s linear; pointer-events: none;`
// const AudioThumb = styled.div`position: absolute; top: 50%; transform: translate(-50%, -50%); width: 13px; height: 13px; border-radius: 50%; background: #fff; box-shadow: 0 1px 5px rgba(0,0,0,0.45); pointer-events: none;`
// const AudioTimes = styled.div`display: flex; justify-content: space-between; font-size: 0.67em; color: rgba(180,80,60,0.7);`
// const AudioSender = styled.span`
//   position: absolute;
//   bottom: ${({ $large }) => $large ? '20px' : '10px'};
//   left:   ${({ $large }) => $large ? '20px' : '10px'};
//   background: rgba(201,79,56,0.15); color: #C94F38;
//   font-size: 0.67em; font-weight: 600;
//   padding: 3px 9px; border-radius: 99px;
//   cursor: ${({ $clickable }) => $clickable ? 'pointer' : 'default'};
//   pointer-events: ${({ $clickable }) => $clickable ? 'auto' : 'none'};
//   ${({ $clickable }) => $clickable && `&:hover { background: rgba(201,79,56,0.28); }`}
// `

// export default SingleBoardPage

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import styled, { keyframes } from 'styled-components'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams, Link } from 'react-router-dom'
import axios from 'axios'
import {
  BsHeart, BsHeartFill, BsFlag, BsPencil, BsTrash,
  BsChevronLeft, BsChevronRight, BsArrowsFullscreen,
  BsPlusCircle, BsStarFill, BsThreeDotsVertical, BsLink45Deg,
  BsMicFill, BsPlayFill, BsPauseFill, BsInfoCircle, BsArrowLeft,
  BsCheckCircleFill, BsHouseFill,
} from 'react-icons/bs'
import { PiShareFat } from 'react-icons/pi'
import { likeBoard, shareBoard, deleteBoard, getBoardLikes, optimisticToggleLike } from '../../slices/boardSlice'
import { deleteMessage } from '../../slices/messageSlice'
import { URL } from '../../paths/url'
import CanvasRenderer from '../../canvas/CanvasRenderer'
import LoginPopup from '../../components/auth/LoginPopup'

const FLAG_REASONS = ['Deceitful', 'Derogatory', 'Evil', 'Spam', 'Inappropriate']

const SPONSOR_OPTIONS = [
  { id: 'sponsor_200',  label: 'Sponsor 200 curation',  price: 1,    display: 'Pay $1'    },
  { id: 'sponsor_1000', label: 'Sponsor 1000 curation', price: 100,  display: 'Pay $100'  },
  { id: 'unlimited',    label: 'Sponsor Unlimited',     price: 1000, display: 'Pay $1000' },
]

const MENU_WIDTH = 168

// ── Audio player ──────────────────────────────────────────────────────────────
const AudioPlayer = ({ src, senderUsername, onSenderClick, hideUsername, large = false }) => {
  const audioRef = useRef(null)
  const [playing,  setPlaying]  = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [current,  setCurrent]  = useState(0)

  const toggle = () => {
    const el = audioRef.current
    if (!el) return
    if (playing) { el.pause(); setPlaying(false) }
    else         { el.play();  setPlaying(true)  }
  }

  const onTimeUpdate = () => {
    const el = audioRef.current
    if (!el || !el.duration) return
    setCurrent(el.currentTime)
    setProgress((el.currentTime / el.duration) * 100)
  }

  const onEnded = () => { setPlaying(false); setProgress(0); setCurrent(0) }
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
      <MicBtn onClick={toggle} $large={large}>
        <MicIconWrap $large={large}><BsMicFill /></MicIconWrap>
        <PlayIconWrap $large={large}>{playing ? <BsPauseFill /> : <BsPlayFill />}</PlayIconWrap>
      </MicBtn>
      <AudioBottom $large={large}>
        <AudioTrack onClick={seek}>
          <AudioFill style={{ width: `${progress}%` }} />
          <AudioThumb style={{ left: `${progress}%` }} />
        </AudioTrack>
        <AudioTimes><span>{fmt(current)}</span><span>{fmt(duration)}</span></AudioTimes>
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

  const [showFlag,      setShowFlag]      = useState(false)
  const [,             setShowSponsor]   = useState(false)
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

  const canManage = isOwner || isReceipent
  const isAnonymous = fullBoard?.visibility === 'anonymous'
  const liked = fullBoard ? likedBoardIds.includes(fullBoard._id?.toString()) : false

  const currentMsg  = messages[msgIdx] ?? null
  const isEmblem    = currentMsg?.type === 'emblem' && !!currentMsg?.canvasData
  const isAudio     = currentMsg?.type === 'audio'
  const isMsgSender = !!(currentUserId && currentMsg?.sender?._id?.toString() === currentUserId)

  const fullscreenSrc =
    currentMsg?.content?.imageUrls?.[0] ||
    fullBoard?.coverImage ||
    messages.find(m => m.content?.imageUrls?.[0])?.content?.imageUrls?.[0] ||
    null

  // ── Fetch board + messages ────────────────────────────────────────────────
  useEffect(() => {
    if (!slug) return
    setBoardLoading(true)
    setMessagesLoading(true)
    setNotFound(false)
    setForbidden(false)

    axios.get(`${URL}/api/v1/board/${slug}`, { withCredentials: true })
      .then(r => {
        setFullBoard(r.data.board)
        setLikeCount(r.data.board?.stats?.likes ?? 0)
        setBoardLoading(false)
      })
      .catch(err => {
        if (err.response?.status === 404) setNotFound(true)
        else if (err.response?.status === 403) setForbidden(true)
        setBoardLoading(false)
      })

    axios.get(`${URL}/api/v1/message/${slug}/board`, {
      params: { page: 1, limit: 50 }, withCredentials: true,
    })
      .then(r => { setMessages(r.data.messages ?? []); setMessagesLoading(false) })
      .catch(() => setMessagesLoading(false))
  }, [slug])

  useEffect(() => {
    if (isLoggedIn) dispatch(getBoardLikes())
  }, [isLoggedIn, dispatch])

  useEffect(() => {
    const h = e => {
      if (e.key !== 'Escape') return
      setShowFlag(false); setShowSponsor(false); setShowDelete(false)
      setShowLogin(false); setShowFullImg(false)
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  const onTouchStart = useCallback(e => {
    touchStart.current  = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }, [])

  const onTouchEnd = useCallback(e => {
    if (touchStart.current === null) return
    const dx = e.changedTouches[0].clientX - touchStart.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50 && messages.length > 1) {
      if (dx < 0) setMsgIdx(i => Math.min(messages.length - 1, i + 1))
      else        setMsgIdx(i => Math.max(0, i - 1))
    }
    touchStart.current = null
  }, [messages.length])

  // ── Optimistic like ───────────────────────────────────────────────────────
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
      await navigator.clipboard.writeText(window.location.href)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2500)
      if (fullBoard?._id) dispatch(shareBoard(fullBoard._id))
    } catch (err) { console.error(err) }
  }, [fullBoard, dispatch])

  const handleFlag = useCallback(async () => {
    if (!flagReason) return
    setFlagLoading(true)
    try {
      await axios.patch(`${URL}/api/v1/board/${slug}/flag`, { reason: flagReason }, { withCredentials: true })
      setFlagDone(true)
      navigate('/profile')
    } catch (err) { console.error(err) }
    setFlagLoading(false)
  }, [flagReason, slug, navigate])

  const handleDelete = useCallback(async () => {
    if (!fullBoard?._id) return
    setDeleteLoading(true)
    const res = await dispatch(deleteBoard(fullBoard._id))
    setDeleteLoading(false)
    if (res?.payload?.status === 'success') navigate('/')
  }, [fullBoard, dispatch, navigate])

  const handleDeleteMessage = useCallback(async () => {
    if (!currentMsg?._id) return
    setShowDeleteMsg(false)
    const res = await dispatch(deleteMessage(currentMsg._id))
    if (res?.payload?.status === 'success') {
      setMessages(prev => {
        const next = prev.filter(m => m._id !== currentMsg._id)
        setMsgIdx(i => Math.min(i, Math.max(0, next.length - 1)))
        return next
      })
    }
  }, [currentMsg, dispatch])

  // ── Menu positioning — opens ABOVE the trigger button ─────────────────────
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

  // ── Render media ──────────────────────────────────────────────────────────
  const renderMedia = (msg) => {
    if (!msg) return null
    const sender   = msg.sender?.username ?? null
    const hideName = isAnonymous && !isMsgSender
    const onSenderClick = (!hideName && sender)
      ? () => navigate(`/profile/${sender}`)
      : null

    if (msg.type === 'emblem' && msg.canvasData) {
      return (
        <>
          <CanvasRenderer canvasData={msg.canvasData} style={{ width: '100%', height: '100%' }} />
          {!hideName && sender && (
            <SenderBadge $clickable onClick={() => navigate(`/profile/${sender}`)}>
              @{sender}
            </SenderBadge>
          )}
        </>
      )
    }

    if (msg.type === 'audio') {
      return (
        <AudioPlayer
          src={msg.content?.audioUrl}
          senderUsername={sender}
          hideUsername={hideName}
          onSenderClick={onSenderClick}
        />
      )
    }

    if (msg.content?.imageUrls?.[0]) {
      return (
        <>
          <MessageImg src={msg.content.imageUrls[0]} alt="" />
          {!hideName && sender && (
            <SenderBadge $clickable onClick={() => navigate(`/profile/${sender}`)}>
              @{sender}
            </SenderBadge>
          )}
        </>
      )
    }

    if (msg.content?.text) {
      return (
        <TextDisplay style={{
          background: msg.content.background || '#1C2030',
          color:      msg.content.color       || '#fff',
          fontFamily: msg.content.font         || 'inherit',
        }}>
          <TextContent>{msg.content.text}</TextContent>
          {!hideName && sender && (
            <SenderBadge $clickable onClick={() => navigate(`/profile/${sender}`)}>
              @{sender}
            </SenderBadge>
          )}
        </TextDisplay>
      )
    }

    return null
  }

  const isPrivateAndBlocked =
    !boardLoading && fullBoard &&
    fullBoard.visibility === 'private' &&
    !isOwner && !isReceipent

  if (!boardLoading && (notFound || forbidden || isPrivateAndBlocked)) {
    return (
      <Page>
        <TopBar>
          <BackButton onClick={() => navigate('/')}><BsArrowLeft /></BackButton>
          <TopBarTitle>{(forbidden || isPrivateAndBlocked) ? 'Private Board' : 'Not Found'}</TopBarTitle>
          <div style={{ width: 32 }} />
        </TopBar>
        <NotFoundWrap>
          <NotFoundTitle>
            {(forbidden || isPrivateAndBlocked) ? 'This board is private' : 'Board not found'}
          </NotFoundTitle>
          <NotFoundSub>
            {(forbidden || isPrivateAndBlocked)
              ? 'Only the board owner and recipient can view this board.'
              : 'This board may have been deleted or made private.'
            }
          </NotFoundSub>
          <BackBtn onClick={() => navigate('/')}>Go home</BackBtn>
        </NotFoundWrap>
      </Page>
    )
  }

  if (boardLoading) {
    return (
      <Page>
        <LoadWrap><Spinner /></LoadWrap>
      </Page>
    )
  }

  return (
    <Page>
      <TopBar>
        <BackButton onClick={() => navigate('/')}><BsArrowLeft /></BackButton>
        <TopBarTitle>{fullBoard?.title ?? ''}</TopBarTitle>
        <ExpandButton onClick={() => setShowFullImg(true)}><BsArrowsFullscreen /></ExpandButton>
      </TopBar>

      <MediaWrap>
        <MediaArea onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
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

          {messages.length > 1 && (
            <>
              <MsgNav $side="left" disabled={msgIdx === 0}
                onClick={() => setMsgIdx(i => Math.max(0, i - 1))}>
                <BsChevronLeft />
              </MsgNav>
              <MsgNav $side="right" disabled={msgIdx === messages.length - 1}
                onClick={() => setMsgIdx(i => Math.min(messages.length - 1, i + 1))}>
                <BsChevronRight />
              </MsgNav>
            </>
          )}
        </MediaArea>
      </MediaWrap>

      <Meta>
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
            <ActionBtn onClick={() => setShowFlag(true)}><BsFlag /></ActionBtn>
          )}

          <Spacer />

          {isLoggedIn && (
            <ActionBtn $accent onClick={() => navigate(`/board/${slug}/add-message`)}>
              <BsPlusCircle /><span>Add Post</span>
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

        <BoardTitle>{fullBoard?.title}</BoardTitle>
        {fullBoard?.event && <BoardTag>{fullBoard.event}</BoardTag>}

        {fullBoard?.owner && (
          <OwnerRow>
            <Link to={`/profile/${fullBoard.owner.username}`}>
              <OwnerName>@{fullBoard.owner.username}</OwnerName>
              <CuratorBadge>Curator</CuratorBadge>
            </Link>
          </OwnerRow>
        )}

        {fullBoard?.receipent && (
          <ReceipentRow>
            <span className="for_label">For</span>
            <Link to={`/profile/${fullBoard.receipent.username}`}>
              <ReceipentBadge>@{fullBoard.receipent.username}</ReceipentBadge>
            </Link>
          </ReceipentRow>
        )}
      </Meta>

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
                  <HomeBtn onClick={() => navigate('/')}>
                    <BsHouseFill /><span>Go home</span>
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

      {/* ── Share ── */}
      {showShare && (
        <ModalOverlay onClick={() => setShowShare(false)}>
          <ModalCard onClick={e => e.stopPropagation()}>
            <ModalTitle>Share Board</ModalTitle>
            {fullscreenSrc && <ShareThumb src={fullscreenSrc} alt="" />}
            <ShareBoardName>{fullBoard?.title}</ShareBoardName>
            {fullBoard?.owner?.username && <ShareBoardOwner>by {fullBoard.owner.username}</ShareBoardOwner>}
            <ShareLinkRow>
              <ShareLinkText>{window.location.href}</ShareLinkText>
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
            <ModalBody>Are you sure you want to delete <strong>{fullBoard?.title}</strong>? This cannot be undone.</ModalBody>
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
            <ModalBody>Are you sure you want to delete this message? This cannot be undone.</ModalBody>
            <DeleteRow>
              <CancelBtn onClick={() => setShowDeleteMsg(false)}>Cancel</CancelBtn>
              <SubmitBtn onClick={handleDeleteMessage}>Delete</SubmitBtn>
            </DeleteRow>
          </ModalCard>
        </ModalOverlay>
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
                <CanvasRenderer canvasData={currentMsg.canvasData} style={{ width: '100%', height: '100%' }} />
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

      {/* ── Board actions menu portal ── */}
      {showActions && canManage && createPortal(
        <>
          <ActionsMenuBackdrop onClick={() => setShowActions(false)} />
          <ActionsMenuPortal style={{ top: menuPos.top, left: menuPos.left }}>
            <ActionsMenuItem onClick={() => { setShowActions(false); navigate(`/board/${slug}/edit`) }}>
              <BsPencil /><span>Edit board</span>
            </ActionsMenuItem>
            <ActionsMenuItem $danger onClick={() => { setShowActions(false); setShowDelete(true) }}>
              <BsTrash /><span>Delete board</span>
            </ActionsMenuItem>
          </ActionsMenuPortal>
        </>,
        document.body
      )}
    </Page>
  )
}

// ── Keyframes ─────────────────────────────────────────────────────────────────
const spin      = keyframes`to { transform: rotate(360deg) }`
const fadeIn    = keyframes`from { opacity: 0 } to { opacity: 1 }`
const modalFade = keyframes`from { opacity: 0; transform: scale(0.96) } to { opacity: 1; transform: scale(1) }`
const pulse     = keyframes`
  0%, 100% { transform: scale(1) }
  50%       { transform: scale(1.06) }
`

const Page = styled.div`
  min-height: 100vh; background: #111827;
  padding-bottom: 5rem;
  animation: ${fadeIn} 0.2s ease forwards;
`
const TopBar = styled.div`
  position: sticky; top: 0; z-index: 50;
  background: #1C2030;
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(255,255,255,0.06);
`
const BackButton = styled.button`
  background: none; border: none; color: #ccc; font-size: 1.1em;
  width: 32px; height: 32px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; flex-shrink: 0;
  transition: color 0.15s, background 0.15s;
  &:hover { color: #fff; background: rgba(255,255,255,0.08); }
`
const TopBarTitle = styled.h1`
  flex: 1; font-size: 0.95em; font-weight: 600; color: #fff; margin: 0;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
`
const ExpandButton = styled.button`
  background: none; border: none; color: #ccc; font-size: 1em;
  width: 32px; height: 32px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; flex-shrink: 0;
  transition: color 0.15s, background 0.15s;
  &:hover { color: #fff; background: rgba(255,255,255,0.08); }
`
const MediaWrap = styled.div`max-width: 560px; margin: 1.25rem auto 0; padding: 0 1rem;`
const MediaArea = styled.div`
  position: relative; width: 100%; aspect-ratio: 1 / 1;
  background: #0d0f1a; border-radius: 18px; overflow: hidden;
`
const MessageImg = styled.img`width: 100%; height: 100%; object-fit: cover; display: block;`
const MediaLoader = styled.div`width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;`
const Spinner = styled.div`
  width: 36px; height: 36px; border-radius: 50%;
  border: 3px solid rgba(255,255,255,0.12);
  border-top-color: rgba(255,255,255,0.7);
  animation: ${spin} 0.75s linear infinite;
`
const LoadWrap = styled.div`display: flex; align-items: center; justify-content: center; height: 60vh;`
const EmptyBoard = styled.div`
  width: 100%; height: 100%;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 8px; cursor: pointer; padding: 24px;
  &:hover { background: rgba(255,255,255,0.04); }
`
const EmptyBoardText = styled.p`font-size: 0.88em; color: rgba(255,255,255,0.5); margin: 0;`
const EmptyBoardCta  = styled.p`font-size: 0.78em; color: #E05A42; margin: 0; font-weight: 600;`
const TextDisplay = styled.div`
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  padding: 24px; position: relative;
`
const TextContent = styled.p`font-size: 1.1em; line-height: 1.55; text-align: center; word-break: break-word; margin: 0;`
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
  &:hover { background: rgba(0,0,0,0.7); }
`
const MsgDots = styled.div`
  position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%);
  display: flex; gap: 5px; z-index: 4;
`
const Dot = styled.div`
  width: 6px; height: 6px; border-radius: 50%;
  background: ${({ $active }) => $active ? '#fff' : 'rgba(255,255,255,0.35)'};
  cursor: pointer;
`
const MsgNav = styled.button`
  position: absolute; top: 50%; transform: translateY(-50%);
  ${({ $side }) => $side === 'left' ? 'left: 10px;' : 'right: 10px;'}
  background: rgba(0,0,0,0.55); border: 1px solid rgba(255,255,255,0.15);
  color: #fff; width: 30px; height: 30px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.85em; cursor: pointer; z-index: 4; backdrop-filter: blur(4px);
  &:hover:not(:disabled) { background: rgba(0,0,0,0.8); }
  &:disabled { opacity: 0.2; cursor: default; }
`
const Meta = styled.div`max-width: 560px; margin: 1rem auto 0; padding: 0 1rem; color: #fff;`
const ActionsRow = styled.div`display: flex; align-items: center; gap: 14px; margin-bottom: 14px; flex-wrap: wrap;`
const ActionBtn = styled.button`
  display: flex; align-items: center; gap: 6px;
  background: none; border: none;
  color: ${({ $danger }) => $danger ? '#E05A42' : '#ccc'};
  font-size: ${({ $accent }) => $accent ? '0.9em' : '1.1em'};
  font-weight: ${({ $accent }) => $accent ? '600' : 'normal'};
  cursor: pointer; padding: 0; transition: color 0.15s;
  span { font-size: 0.82em; }
  &:hover { color: #fff; }
`
const Spacer = styled.div`flex: 1;`
const BoardTitle = styled.h2`font-size: 1.15em; font-weight: 700; color: #fff; margin: 0 0 4px;`
const BoardTag   = styled.p`font-size: 0.78em; color: #9CA3AF; margin: 0 0 4px; text-transform: capitalize;`
const OwnerRow = styled.div`
  display: flex; align-items: center; gap: 6px; margin-top: 6px;
  a { display: flex; align-items: center; gap: 6px; text-decoration: none; }
`
const OwnerName    = styled.span`font-size: 0.78em; color: #9CA3AF; font-weight: 500;`
const CuratorBadge = styled.span`font-size: 0.62em; background: #E05A42; color: #fff; padding: 2px 6px; border-radius: 99px; font-weight: 600;`
const ReceipentRow = styled.div`
  display: flex; align-items: center; gap: 6px; margin-top: 6px;
  a { text-decoration: none; }
  .for_label { font-size: 0.75em; color: rgba(255,255,255,0.35); font-weight: 500; }
`
const ReceipentBadge = styled.span`
  font-size: 0.78em; font-weight: 600; color: #F5C842;
  background: rgba(245,200,66,0.12); border: 1px solid rgba(245,200,66,0.25);
  padding: 3px 10px; border-radius: 99px; transition: background 0.15s;
  &:hover { background: rgba(245,200,66,0.22); }
`
const NotFoundWrap  = styled.div`display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 70vh; gap: 0.75rem; padding: 2rem;`
const NotFoundTitle = styled.h2`font-size: 1.2em; color: #fff; margin: 0;`
const NotFoundSub   = styled.p`font-size: 0.88em; color: #9CA3AF; margin: 0; text-align: center;`
const BackBtn = styled.button`
  margin-top: 0.5rem; padding: 0.6rem 1.5rem; border: none; border-radius: 99px;
  background: #E05A42; color: #fff; font-weight: 600; cursor: pointer; font-size: 0.9em;
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
  cursor: pointer; text-align: left;
  &:hover { background: #F5F6F8; }
  svg { font-size: 1em; flex-shrink: 0; }
`
const ModalOverlay = styled.div`
  position: fixed; inset: 0; background: rgba(0,0,0,0.65); z-index: 300;
  display: flex; align-items: center; justify-content: center; padding: 16px;
`
const ModalCard    = styled.div`background: #fff; border-radius: 20px; width: min(400px, 100%); padding: 28px 24px 24px; animation: ${modalFade} 0.18s ease forwards;`
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
const FlagSuccessActions = styled.div`display: flex; flex-direction: column; gap: 8px; width: 100%; margin-top: 0.75rem;`
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
  cursor: pointer; font-size: 0.88em; color: #222;
  &:hover { background: #ECEEF2; }
`
const RadioDot = styled.div`
  width: 18px; height: 18px; border-radius: 50%; flex-shrink: 0;
  border: 2px solid ${({ $selected, $green }) => $selected ? ($green ? '#22c55e' : '#E05A42') : '#ccc'};
  background: ${({ $selected, $green }) => $selected ? ($green ? '#22c55e' : '#E05A42') : 'transparent'};
`
const PriceTag = styled.span`font-size: 0.78em; background: #FFE8E5; color: #E05A42; padding: 3px 10px; border-radius: 99px; font-weight: 600; white-space: nowrap;`
const SubmitBtn = styled.button`
  width: 100%; padding: 14px; background: #E05A42; color: #fff;
  border: none; border-radius: 99px; font-size: 0.92em; font-weight: 600; cursor: pointer;
  &:disabled { opacity: 0.6; cursor: default; }
  &:hover:not(:disabled) { opacity: 0.88; }
`
const CancelBtn = styled.button`
  width: 100%; padding: 14px; background: #F5F6F8; color: #333;
  border: none; border-radius: 99px; font-size: 0.92em; font-weight: 600; cursor: pointer;
  &:hover { background: #ECEEF2; }
`
const DeleteRow = styled.div`display: flex; gap: 10px; button { flex: 1; }`
const ShareThumb      = styled.img`width: 100%; aspect-ratio: 4/3; object-fit: cover; border-radius: 12px; margin-bottom: 12px;`
const ShareBoardName  = styled.h4`font-size: 0.95em; font-weight: 700; color: #111; margin: 0 0 2px;`
const ShareBoardOwner = styled.p`font-size: 0.8em; color: #888; margin: 0 0 16px;`
const ShareLinkRow    = styled.div`display: flex; align-items: center; gap: 8px; background: #F5F6F8; border-radius: 10px; padding: 10px 12px;`
const ShareLinkText   = styled.span`flex: 1; font-size: 0.78em; color: #555; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`
const CopyBtn = styled.button`
  display: flex; align-items: center; gap: 5px; background: #E05A42; color: #fff;
  border: none; border-radius: 8px; padding: 6px 12px;
  font-size: 0.8em; font-weight: 600; cursor: pointer; flex-shrink: 0;
  &:hover { opacity: 0.88; }
`
const FullOverlay    = styled.div`position: fixed; inset: 0; z-index: 400; background: rgba(0,0,0,0.94); display: flex; align-items: center; justify-content: center;`
const FullImg        = styled.img`max-width: 95vw; max-height: 95vh; object-fit: contain; border-radius: 8px;`
const FullCanvasWrap = styled.div`width: min(92vw, 560px); aspect-ratio: 1/1; border-radius: 12px; overflow: hidden;`
const FullAudioWrap  = styled.div`width: min(92vw, 420px); aspect-ratio: 1/1; background: #F0E0DC; border-radius: 20px; overflow: hidden; display: flex; align-items: center; justify-content: center;`
const AudioWrap = styled.div`
  width: 100%; height: 100%;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: ${({ $large }) => $large ? '28px' : '16px'};
  background: #F0E0DC; position: relative;
  padding: ${({ $large }) => $large ? '32px' : '16px'};
`
const MicBtn = styled.button`
  position: relative;
  width:  ${({ $large }) => $large ? '130px' : '84px'};
  height: ${({ $large }) => $large ? '130px' : '84px'};
  border-radius: 50%; background: rgba(220,150,135,0.55); border: none;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; animation: ${pulse} 2.4s ease-in-out infinite;
  &:hover { transform: scale(1.06); }
`
const MicIconWrap = styled.span`
  color: #C94F38;
  font-size: ${({ $large }) => $large ? '2.6em' : '1.75em'};
  display: flex; align-items: center; justify-content: center;
`
const PlayIconWrap = styled.span`
  position: absolute;
  bottom: ${({ $large }) => $large ? '-6px' : '-3px'};
  right:  ${({ $large }) => $large ? '-6px' : '-3px'};
  width:  ${({ $large }) => $large ? '42px' : '26px'};
  height: ${({ $large }) => $large ? '42px' : '26px'};
  border-radius: 50%; background: #E05A42; color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: ${({ $large }) => $large ? '1.15em' : '0.78em'};
`
const AudioBottom = styled.div`width: ${({ $large }) => $large ? '78%' : '72%'}; display: flex; flex-direction: column; gap: 5px;`
const AudioTrack  = styled.div`position: relative; height: 5px; background: rgba(201,79,56,0.2); border-radius: 99px; cursor: pointer; overflow: visible;`
const AudioFill   = styled.div`height: 100%; background: #E05A42; border-radius: 99px; transition: width 0.1s linear; pointer-events: none;`
const AudioThumb  = styled.div`position: absolute; top: 50%; transform: translate(-50%, -50%); width: 13px; height: 13px; border-radius: 50%; background: #fff; pointer-events: none;`
const AudioTimes  = styled.div`display: flex; justify-content: space-between; font-size: 0.67em; color: rgba(180,80,60,0.7);`
const AudioSender = styled.span`
  position: absolute;
  bottom: ${({ $large }) => $large ? '20px' : '10px'};
  left:   ${({ $large }) => $large ? '20px' : '10px'};
  background: rgba(201,79,56,0.15); color: #C94F38;
  font-size: 0.67em; font-weight: 600; padding: 3px 9px; border-radius: 99px;
  cursor: ${({ $clickable }) => $clickable ? 'pointer' : 'default'};
  pointer-events: ${({ $clickable }) => $clickable ? 'auto' : 'none'};
  ${({ $clickable }) => $clickable && `&:hover { background: rgba(201,79,56,0.28); }`}
`

export default SingleBoardPage