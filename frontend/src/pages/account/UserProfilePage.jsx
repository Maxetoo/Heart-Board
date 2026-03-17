import React, { useEffect, useRef, useState, useCallback } from 'react'
import styled, { keyframes } from 'styled-components'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import {
  BsHeart, BsHeartFill, BsMicFill, BsPlayFill, BsEye,
  BsChevronLeft, BsGear, BsPersonX,
} from 'react-icons/bs'
import {
  getPublicProfile, likeProfile, getLikedProfiles, clearPublicProfile,
} from '../../slices/userSlice'
import { URL } from '../../paths/url'
import NavComponent from '../../components/global/NavComponent'
import CanvasRenderer from '../../canvas/CanvasRenderer'
import BoardViewModal from '../../components/message/BoardViewModel'



const EmblemCard = ({ msg, isMulti, onClick }) => (
  <CardWrap onClick={onClick}>
    <CanvasRenderer canvasData={msg.canvasData} style={{ borderRadius: 0 }} />
    {isMulti && <MultiIndicator><BsPlayFill /></MultiIndicator>}
  </CardWrap>
)

const StackCard = ({ msg, isMulti, onClick }) => {
  const src = msg?.content?.imageUrls?.[0] || null
  return (
    <CardWrap onClick={onClick}>
      {src ? <img src={src} alt="" className="card_img" /> : <div className="card_placeholder" />}
      {isMulti && <MultiIndicator><BsPlayFill /></MultiIndicator>}
    </CardWrap>
  )
}

const AudioCard = ({ isMulti, onClick }) => (
  <AudioOuter onClick={onClick}>
    <div className="mic_ring"><BsMicFill className="mic_icon" /></div>
    {isMulti && <MultiIndicator><BsPlayFill /></MultiIndicator>}
  </AudioOuter>
)

const NoteCard = ({ board, isMulti, onClick }) => (
  <CardWrap onClick={onClick} style={{ background: '#FFF8E7', borderColor: '#F5C842' }} className="note_card">
    <div className="note_paper">
      <p className="note_title">{board.title}</p>
      {board.description
        ? <p className="note_body">{board.description}</p>
        : <p className="note_body note_body_empty">No description</p>
      }
    </div>
    {isMulti && <MultiIndicator><BsPlayFill /></MultiIndicator>}
  </CardWrap>
)

const BoardCard = ({ board, msg, onOpen }) => {
  const isMulti = (board.stats?.messages ?? 0) > 1
  const type    = msg?.type
  const open    = () => onOpen(board)

  if (type === 'emblem' && msg?.canvasData)
    return <EmblemCard msg={msg} isMulti={isMulti} onClick={open} />
  if (type === 'audio')
    return <AudioCard isMulti={isMulti} onClick={open} />
  if (msg?.content?.imageUrls?.[0])
    return <StackCard msg={msg} isMulti={isMulti} onClick={open} />
  return <NoteCard board={board} isMulti={isMulti} onClick={open} />
}

// ─── Main page ────────────────────────────────────────────────────────────────

const UserProfilePage = () => {
  const dispatch     = useDispatch()
  const navigate     = useNavigate()
  const { username } = useParams()

  const {
    myProfile,
    likedProfileIds,
    publicProfile,
    publicProfileBoards: boards,
    publicProfileLoad,
    publicProfileError,
    publicProfileErrorMsg,
    publicProfileNotFound,
  } = useSelector(s => s.user)

  const isLoggedIn    = !!useSelector(s => s.auth.userCookie)
  const currentUserId = myProfile?._id?.toString()

  const [activeTab,     setActiveTab]     = useState('boards')
  const [firstMessages, setFirstMessages] = useState({})
  const [activeBoard,   setActiveBoard]   = useState(null)
  const [likeLoading,   setLikeLoading]   = useState(false)
  const [tabLoading,    setTabLoading]    = useState(false)

  const fetchedSlugs = useRef(new Set())

  const isLiked = publicProfile
    ? likedProfileIds.includes(publicProfile._id?.toString())
    : false

  const isOwnProfile = !!(currentUserId && publicProfile?._id?.toString() === currentUserId)

  // ── Fetch on mount and tab switch ─────────────────────────────────────────
  useEffect(() => {
    if (!username) return
    setTabLoading(true)
    fetchedSlugs.current = new Set()
    setFirstMessages({})
    dispatch(getPublicProfile({ username, view: activeTab === 'tagged' ? 'tagged' : 'owned' }))
  }, [dispatch, username, activeTab])

  useEffect(() => {
    if (!publicProfileLoad) setTabLoading(false)
  }, [publicProfileLoad])

  useEffect(() => {
    if (isLoggedIn) dispatch(getLikedProfiles())
  }, [isLoggedIn, dispatch])

  useEffect(() => () => { dispatch(clearPublicProfile()) }, [dispatch])

  // ── Fetch first message per board card ────────────────────────────────────
  useEffect(() => {
    if (!boards.length) {
      fetchedSlugs.current = new Set()
      setFirstMessages({})
      return
    }
    const toFetch = boards.filter(b => !fetchedSlugs.current.has(b.slug))
    if (!toFetch.length) return
    toFetch.forEach(b => fetchedSlugs.current.add(b.slug))

    Promise.allSettled(
      toFetch.map(b =>
        axios.get(`${URL}/api/v1/message/${b.slug}/board`, {
          params: { page: 1, limit: 1 }, withCredentials: true,
        })
          .then(res => ({ boardId: b._id, message: res.data.messages?.[0] || null }))
          .catch(() => ({ boardId: b._id, message: null }))
      )
    ).then(results => {
      const updates = {}
      results.forEach(r => {
        if (r.status === 'fulfilled') updates[r.value.boardId] = r.value.message
      })
      setFirstMessages(prev => ({ ...prev, ...updates }))
    })
  }, [boards])

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleLike = useCallback(async () => {
    if (!isLoggedIn || !publicProfile?._id) return
    setLikeLoading(true)
    await dispatch(likeProfile(publicProfile._id))
    await dispatch(getLikedProfiles())
    setLikeLoading(false)
  }, [isLoggedIn, publicProfile, dispatch])

  const handleSendAppreciation = useCallback(() => {
    if (publicProfile?.username) {
      navigate(`/create?mention=${publicProfile.username}`)
    }
  }, [publicProfile, navigate])

  const fmtCount = n => {
    if (!n && n !== 0) return '0'
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
    if (n >= 1_000)     return (n / 1_000).toFixed(1)     + 'k'
    return String(n)
  }

  const isTall = i => i % 5 === 0 || i % 5 === 3

  // ── Loading ───────────────────────────────────────────────────────────────
  if (publicProfileLoad && !publicProfile) {
    return (
      <Page>
        <Header>
          <button className="back_btn" onClick={() => navigate(-1)}><BsChevronLeft /></button>
          <div className="header_profile"><span className="header_username">Profile</span></div>
          <div style={{ width: 36 }} />
        </Header>
        <LoadingWrap><Spinner /></LoadingWrap>
        <NavComponent />
      </Page>
    )
  }

  // ── Not found ─────────────────────────────────────────────────────────────
  if (publicProfileNotFound || (publicProfileError && !publicProfile)) {
    return (
      <Page>
        <Header>
          <button className="back_btn" onClick={() => navigate(-1)}><BsChevronLeft /></button>
          <div className="header_profile"><span className="header_username">Profile</span></div>
          <div style={{ width: 36 }} />
        </Header>
        <NotFoundWrap>
          <BsPersonX className="icon" />
          <h2>{publicProfileNotFound ? 'User not found' : 'Something went wrong'}</h2>
          <p>
            {publicProfileNotFound
              ? `@${username} doesn't exist or may have been removed.`
              : publicProfileErrorMsg || 'Unable to load this profile.'
            }
          </p>
          <GoHomeBtn onClick={() => navigate('/')}>Go to Home</GoHomeBtn>
        </NotFoundWrap>
        <NavComponent />
      </Page>
    )
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <Page>
      {/* Header — ProfilePage style */}
      <Header>
        <button className="back_btn" onClick={() => navigate(-1)}>
          <BsChevronLeft />
        </button>
        <div className="header_profile">
          <span className="header_username">
            @{publicProfile?.username ?? username}'s Profile
          </span>
        </div>
        {isOwnProfile
          ? <button className="settings_btn" onClick={() => navigate('/profile')}><BsGear /></button>
          : <div style={{ width: 36 }} />
        }
      </Header>

      {/* Hero */}
      <Hero>
        <AvatarWrap>
          {publicProfile?.profileImage
            ? <img src={publicProfile.profileImage} alt="avatar" />
            : <AvatarPlaceholder />
          }
        </AvatarWrap>
        <HeroUsername>@{publicProfile?.username ?? username}</HeroUsername>

        {!isOwnProfile && (
          <HeroBtns>
            <SendBtn onClick={handleSendAppreciation}>Send Appreciation</SendBtn>
            <LikeBtn
              onClick={handleLike}
              $liked={isLiked}
              disabled={likeLoading || !isLoggedIn}
            >
              {isLiked ? <BsHeartFill /> : <BsHeart />}
            </LikeBtn>
          </HeroBtns>
        )}

        <StatsRow>
          <StatItem>
            <span className="val">{fmtCount(publicProfile?.stats?.totalBoards)}</span>
            <span className="lbl">Board</span>
          </StatItem>
          <StatDivider />
          <StatItem>
            <span className="val">{fmtCount(publicProfile?.stats?.totalMessages)}</span>
            <span className="lbl">Message</span>
          </StatItem>
          <StatDivider />
          <StatItem>
            <span className="val">{fmtCount(publicProfile?.stats?.totalCurators)}</span>
            <span className="lbl">Curator</span>
          </StatItem>
        </StatsRow>
      </Hero>

      {/* Tabs */}
      <TabRow>
        <Tab $active={activeTab === 'boards'} onClick={() => setActiveTab('boards')}>Board</Tab>
        <Tab $active={activeTab === 'tagged'} onClick={() => setActiveTab('tagged')}>Tagged</Tab>
      </TabRow>

      {/* Grid */}
      <Feed>
        {tabLoading ? (
          <MasonryGrid>
            {[...Array(12)].map((_, i) => (
              <GridItem key={i}><SkeletonWrap $tall={isTall(i)} /></GridItem>
            ))}
          </MasonryGrid>
        ) : boards.length === 0 ? (
          <EmptyMsg>No boards yet.</EmptyMsg>
        ) : (
          <MasonryGrid>
            {boards.map((board, i) => (
              <GridItem key={board._id}>
                {!(board._id in firstMessages)
                  ? <SkeletonWrap $tall={isTall(i)} />
                  : <BoardCard
                      board={board}
                      msg={firstMessages[board._id]}
                      onOpen={setActiveBoard}
                    />
                }
              </GridItem>
            ))}
          </MasonryGrid>
        )}
      </Feed>

      <NavComponent />

      {activeBoard && (
        <BoardViewModal board={activeBoard} onClose={() => setActiveBoard(null)} />
      )}
    </Page>
  )
}

// ─── Keyframes ────────────────────────────────────────────────────────────────
const shimmer  = keyframes`0%{background-position:-200% 0}100%{background-position:200% 0}`
const spinAnim = keyframes`to{transform:rotate(360deg)}`
const fadeUp   = keyframes`from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}`

// ─── Styled components ────────────────────────────────────────────────────────

const Page = styled.div`min-height:100vh;background:#fff;padding-bottom:5rem;`

const Header = styled.div`
  position: sticky; top: 0; z-index: 50;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.85rem 1.25rem;
  background: #fff; border-bottom: 1px solid #ECEFF3;

  .back_btn, .settings_btn {
    width: 36px; height: 36px; border-radius: 50%;
    border: 1.5px solid #ECEFF3; background: transparent; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.05em; color: var(--text-color, #111); flex-shrink: 0;
    transition: border-color 0.15s;
    &:hover { border-color: var(--primary-color, #EF5A42); color: var(--primary-color, #EF5A42); }
  }

  .header_profile {
    display: flex; align-items: center; justify-content: center; flex: 1;
  }

  .header_username {
    font-size: 0.95em; font-weight: 700; color: #111;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    max-width: 200px;
  }
`

const LoadingWrap = styled.div`
  display: flex; align-items: center; justify-content: center; height: 60vh;
`

const Spinner = styled.div`
  width: 36px; height: 36px; border-radius: 50%;
  border: 3px solid #F0F0F0; border-top-color: #E05A42;
  animation: ${spinAnim} 0.75s linear infinite;
`

const NotFoundWrap = styled.div`
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  height: 60vh; padding: 2rem; text-align: center; gap: 10px;
  .icon { font-size: 3.5em; color: #D1D5DB; margin-bottom: 8px; }
  h2 { font-size: 1.25em; font-weight: 800; color: #111; margin: 0; }
  p  { font-size: 0.88em; color: #888; margin: 0; }
`

const GoHomeBtn = styled.button`
  margin-top: 8px; padding: 11px 28px; background: #111; color: #fff;
  border: none; border-radius: 99px; font-size: 0.9em; font-weight: 600;
  cursor: pointer; transition: opacity 0.15s;
  &:hover { opacity: 0.85; }
`

const Hero = styled.section`
  display: flex; flex-direction: column; align-items: center;
  padding: 1.5rem 1.5rem 0.8rem; gap: 10px;
  animation: ${fadeUp} 0.3s ease forwards;
`

const AvatarWrap = styled.div`
  width: 110px; height: 110px; border-radius: 50%;
  background: #fde8e5; overflow: hidden;
  img { width: 100%; height: 100%; object-fit: cover; }
`

const AvatarPlaceholder = styled.div`
  width: 100%; height: 100%;
  background: radial-gradient(circle at 50% 38%, #f5b8ad 32%, #fde8e5 32%);
`

const HeroUsername = styled.h2`font-size:1.1em;font-weight:700;color:#111;margin:0;`

const HeroBtns = styled.div`display:flex;align-items:center;gap:10px;margin-top:4px;`

const SendBtn = styled.button`
  background: #111; color: #fff; border: none; border-radius: 99px;
  padding: 11px 28px; font-size: 0.9em; font-weight: 700;
  cursor: pointer; transition: opacity 0.15s;
  &:hover { opacity: 0.85; }
`

const LikeBtn = styled.button`
  width: 44px; height: 44px; border-radius: 50%;
  background: #111; color: ${({ $liked }) => $liked ? '#E05A42' : '#fff'};
  border: none; font-size: 1.15em;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: background 0.15s, color 0.15s;
  &:disabled { opacity: 0.45; cursor: default; }
  &:hover:not(:disabled) { background: #333; }
`

const StatsRow = styled.div`display:flex;align-items:center;gap:12px;margin-top:4px;`

const StatItem = styled.div`
  display: flex; flex-direction: column; align-items: center; gap: 1px;
  .val { font-size: 0.9em; font-weight: 700; color: #111; }
  .lbl { font-size: 0.72em; color: #888; }
`

const StatDivider = styled.div`width:1px;height:24px;background:#E5E7EB;`

const TabRow = styled.div`
  display: flex; gap: 8px;
  padding: 0.6rem 1.5rem 0.8rem;
  border-bottom: 1px solid #F0F0F0;
`

const Tab = styled.button`
  padding: 7px 18px; border-radius: 99px;
  border: 1.5px solid ${({ $active }) => $active ? '#111' : '#E5E7EB'};
  background: ${({ $active }) => $active ? '#111' : 'transparent'};
  color: ${({ $active }) => $active ? '#fff' : '#555'};
  font-size: 0.85em; font-weight: 600; cursor: pointer; transition: all 0.15s;
`

const Feed = styled.main`max-width:1400px;margin:0 auto;padding:0.8rem 1.5rem 2rem;`

const MasonryGrid = styled.div`
  columns: 4; column-gap: 0.85rem;
  @media (max-width: 1100px) { columns: 3; }
  @media (max-width: 720px)  { columns: 2; }
  @media (max-width: 420px)  { columns: 1; }
`

const GridItem = styled.div`break-inside:avoid;margin-bottom:0.85rem;`

const CardWrap = styled.div`
  position: relative; border-radius: 16px;
  border: 2.5px solid transparent; overflow: hidden;
  width: 100%; cursor: pointer; transition: box-shadow 0.2s;
  &:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.12); }
  .card_img { width: 100%; display: block; object-fit: cover; }
  .card_placeholder { width: 100%; aspect-ratio: 1/1; background: #F0F0F0; }
  &.note_card {
    padding: 1.4rem; min-height: 130px; background: #FFF8E7; border-color: #F5C842;
    .note_paper {
      background: #fff; border-radius: 10px;
      padding: 0.85rem 0.85rem 2rem; box-shadow: 0 2px 8px rgba(0,0,0,0.07);
    }
    .note_title { font-size: 0.82em; font-weight: 600; margin: 0 0 0.3rem; color: #333; }
    .note_body  { font-size: 0.78em; color: #555; margin: 0; line-height: 1.5; }
    .note_body_empty { color: #bbb; font-style: italic; }
  }
`

const MultiIndicator = styled.div`
  position: absolute; bottom: 10px; left: 10px; z-index: 3;
  color: #fff; font-size: 1em;
  filter: drop-shadow(0 1px 3px rgba(0,0,0,0.5));
`

const AudioOuter = styled.div`
  position: relative; width: 100%; aspect-ratio: 4/3;
  background: #F0E0DC; border-radius: 16px; overflow: hidden;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: box-shadow 0.2s;
  &:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.12); }
  .mic_ring {
    width: 56px; height: 56px; border-radius: 50%;
    background: rgba(220,150,135,0.55);
    display: flex; align-items: center; justify-content: center;
  }
  .mic_icon { font-size: 1.25em; color: #C94F38; }
`

const SkeletonWrap = styled.div`
  border-radius: 16px;
  height: ${({ $tall }) => $tall ? '240px' : '160px'};
  background: linear-gradient(90deg, #F0F0F0 25%, #E8E8E8 50%, #F0F0F0 75%);
  background-size: 200% 100%;
  animation: ${shimmer} 1.4s infinite linear;
`

const EmptyMsg = styled.p`text-align:center;color:#9CA3AF;padding:4rem 0;font-size:0.95em;`

export default UserProfilePage