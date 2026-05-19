import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'
import { IoSearch } from 'react-icons/io5'
import { LuSlidersHorizontal } from 'react-icons/lu'
import { BsChevronLeft, BsX, BsCheck2, BsHeart, BsMicFill } from 'react-icons/bs'
import { PiShareFat } from 'react-icons/pi'
import { TfiWorld } from 'react-icons/tfi'
import { useDispatch, useSelector } from 'react-redux'
import axios from 'axios'
import Logo from '../../assets/Heartboard logo 2.svg'
import DefaultAvatar from '../../assets/Vector.svg'
import shareRect1 from '../../assets/share profile/share profile rectangle 1.svg'
import shareRect2 from '../../assets/share profile/share profile rectangle 2.svg'
import waves from '../../assets/waves.svg';
import NavComponent from '../../components/global/NavComponent'
import CanvasRenderer from '../../canvas/CanvasRenderer'
import { discoverBoards } from '../../slices/boardSlice'
import { homeFirstMsgCache } from '../../utils/msgCache'
import { URL } from '../../paths/url'
import { EVENTS } from '../../constants/messageConstant'

const CAROUSEL_COUNT = 8

const shuffled = (arr) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}


const CANVAS_NATURAL_W = 210;
const THUMB_INNER_W = 62;
const CANVAS_SCALE = (THUMB_INNER_W * 0.72) / CANVAS_NATURAL_W;

const BoardDropThumb = ({ msg }) => {
  if (msg?.type === 'emblem' && msg?.canvasData) {
    const frameBg = msg.canvasData.canvasFrame?.color || '#e0e0e0';
    const canvasData = { ...msg.canvasData, canvasFrame: undefined };
    return (
      <ThumbOuter>
        <ThumbFrame style={{ background: frameBg }}>
          <div style={{
            position: 'absolute',
            top: '50%', left: '50%',
            width: CANVAS_NATURAL_W,
            transformOrigin: 'center center',
            transform: `translate(-50%, -50%) scale(${CANVAS_SCALE})`,
            pointerEvents: 'none',
          }}>
            <CanvasRenderer canvasData={canvasData} />
          </div>
        </ThumbFrame>
      </ThumbOuter>
    );
  }
  if (msg?.type === 'audio') {
    return (
      <AudioThumb>
        <BsMicFill className="mic_icon" />
      </AudioThumb>
    );
  }
  const src = msg?.content?.imageUrls?.[0] || null;
  return <BoardThumb>{src ? <img src={src} alt="" /> : null}</BoardThumb>;
};

const MomentPage = () => {
  const dispatch  = useDispatch()
  const navigate  = useNavigate()
  const { discoverBoards: boards = [], discoverLoad } = useSelector(s => s.board)

  const [firstMessages, setFirstMessages] = useState(() => ({ ...homeFirstMsgCache }))
  const [carouselIdx, setCarouselIdx]     = useState(0)
  const [slides, setSlides]               = useState([])
  const [showSearch, setShowSearch]       = useState(false)
  const [query, setQuery]                 = useState('')
  const [debouncedQ, setDebouncedQ]       = useState('')
  const [showFilter, setShowFilter]       = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null) // null = Moments
  const searchInputRef                    = useRef(null)
  const slidesBuilt                       = useRef(false)
  
  useEffect(() => {
    dispatch(discoverBoards({ page: 1, limit: 20 }))
  }, [dispatch])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(query), 280)
    return () => clearTimeout(t)
  }, [query]) 

  useEffect(() => {
    if (showSearch) setTimeout(() => searchInputRef.current?.focus(), 50)
    else { setQuery(''); setDebouncedQ('') }
  }, [showSearch])

  useEffect(() => {
    if (!boards.length) return
    const toFetch = boards.filter(b => !(b._id in homeFirstMsgCache))
    if (!toFetch.length) return
    Promise.allSettled(
      toFetch.map(b =>
        axios
          .get(`${URL}/api/v1/message/${b.slug}/board`, {
            params: { page: 1, limit: 1 },
            withCredentials: true,
          })
          .then(r => ({ boardId: b._id, message: r.data.messages?.[0] || null }))
          .catch(() => ({ boardId: b._id, message: null }))
      )
    ).then(results => {
      const updates = {}
      results.forEach(r => {
        if (r.status === 'fulfilled') {
          homeFirstMsgCache[r.value.boardId] = r.value.message
          updates[r.value.boardId]           = r.value.message
        }
      })
      setFirstMessages(prev => ({ ...prev, ...updates }))
    })
  }, [boards])

  const isAtMode = debouncedQ.startsWith('@')
  const q = isAtMode ? debouncedQ.slice(1).trim().toLowerCase() : debouncedQ.trim().toLowerCase()

  const ownerResults = q
    ? Object.values(boards.reduce((acc, b) => {
        const un = b.owner?.username?.toLowerCase() || ''
        if (un.includes(q) && !acc[un]) acc[un] = b.owner
        return acc
      }, {})).slice(0, 3)
    : []

  const boardResults = q && !isAtMode
    ? boards.filter(b => {
        const hasMsg = firstMessages[b._id] !== undefined && firstMessages[b._id] !== null
        return hasMsg && (b.title?.toLowerCase().includes(q) || b.description?.toLowerCase().includes(q))
      }).slice(0, 4)
    : []

  // Derive sorted board lists + accurate per-category counts
  const byLikes    = [...boards].sort((a, b) => (b.stats?.likes    ?? 0) - (a.stats?.likes    ?? 0))
  const byShares   = [...boards].sort((a, b) => (b.stats?.shares   ?? 0) - (a.stats?.shares   ?? 0))
  const byVisits   = [...boards].sort((a, b) => (b.stats?.visits   ?? 0) - (a.stats?.visits   ?? 0))
  const byMessages    = [...boards].sort((a, b) => (b.stats?.messages ?? 0) - (a.stats?.messages ?? 0))

  const totalLikes    = boards.reduce((s, b) => s + (b.stats?.likes    ?? 0), 0)
  const totalShares   = boards.reduce((s, b) => s + (b.stats?.shares   ?? 0), 0)
  const totalVisits   = boards.reduce((s, b) => s + (b.stats?.visits   ?? 0), 0)
  const totalMessages = boards.reduce((s, b) => s + (b.stats?.messages ?? 0), 0)

  const categories = boards.length === 0 ? [] : [
    { id: 'loved',   sort: 'likes',    emoji: '❤️',  label: 'Most Loved Today',                 sorted: byLikes,    count: `${totalLikes} likes`    },
    { id: 'cry',     sort: 'shares',   emoji: '🥺',  label: 'This Made People Cry',             sorted: byShares,   count: `${totalShares} shares`  },
    { id: 'tribute', sort: 'popular',  emoji: '🔥',  label: 'Trending Tribute Boards',          sorted: byVisits,   count: `${totalVisits} visits`  },
    { id: 'near',    sort: 'messages', emoji: '👀',  label: 'Someone Near You Was Appreciated', sorted: byMessages, count: `${totalMessages} messages` },
  ]

  // Reset slides when a new boards batch arrives
  useEffect(() => {
    slidesBuilt.current = false
    setSlides([])
    setCarouselIdx(0)
  }, [boards])

  // Build shuffled slides once candidates (boards with canvas texts) are available
  useEffect(() => {
    if (slidesBuilt.current) return
    const candidates = boards
      .filter(b => firstMessages[b._id]?.canvasData?.canvasTexts?.length > 0)
      .slice(0, CAROUSEL_COUNT * 3)
    if (!candidates.length) return
    slidesBuilt.current = true
    setSlides(shuffled(candidates).slice(0, CAROUSEL_COUNT))
  }, [boards, firstMessages])

  const slidesLen = slides.length
  useEffect(() => {
    if (slidesLen < 2) return
    const t = setInterval(() => setCarouselIdx(i => (i + 1) % slidesLen), 5000)
    return () => clearInterval(t)
  }, [slidesLen])

  const touchStartX = useRef(null)
  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX
  }, [])
  const handleTouchEnd = useCallback((e) => {
    if (touchStartX.current === null || slidesLen < 2) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(dx) < 40) return
    setCarouselIdx(i => dx < 0 ? (i + 1) % slidesLen : (i - 1 + slidesLen) % slidesLen)
  }, [slidesLen])

  const activeBoard = slides[carouselIdx % Math.max(slides.length, 1)] || null
  const activeMsg   = activeBoard ? firstMessages[activeBoard._id] : null

  const heroCanvasText = activeMsg?.canvasData?.canvasTexts?.[0] || null
  const heroText       = heroCanvasText?.content || null

  const pageBg =
    activeMsg?.canvasData?.canvasBg?.value ||
    activeMsg?.canvasData?.canvasBg?.color ||
    '#f5f6f8'

  return (
    <Page>
      <HeroBg style={{ background: pageBg, transition: 'background 0.6s ease' }} />
      <TopBar>
        <div className="logo">
          <img src={Logo} alt="logo" />
        </div>
        <SearchWrap>
          <SearchBar onClick={() => setShowSearch(true)}>
            <IoSearch className="si" />
            <span className="placeholder_text">Search name, event…</span>
          </SearchBar>
        </SearchWrap>
        <FilterBtn onClick={() => setShowFilter(true)}>
          <LuSlidersHorizontal />
        </FilterBtn>
      </TopBar>

      <HeroSection onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        {discoverLoad
          ? <SkeletonHeroText />
          : heroText && (
              <HeroText
                $align={heroCanvasText?.textAlign || 'left'}
                style={{
                  fontFamily: heroCanvasText?.font?.family  || 'inherit',
                  fontWeight: heroCanvasText?.font?.style?.fontWeight || 800,
                  fontStyle:  heroCanvasText?.font?.style?.fontStyle  || 'normal',
                  color:      heroCanvasText?.color || '#111',
                  fontSize:   '3em',
                }}
              >
                {heroText}
              </HeroText>
            )
        }
        <DotsRow>
          {(slides.length > 0 ? slides : Array(5).fill(null)).map((_, i) => (
            <Dot key={i} $active={i === carouselIdx % Math.max(slides.length, 1)} onClick={() => setCarouselIdx(i)} />
          ))}
        </DotsRow>
      </HeroSection>

      <CategoriesSection>
        <CatGrid>
          {discoverLoad
            ? Array(4).fill(null).map((_, i) => <SkeletonCard key={i} />)
            : (() => {
            const usedIds = new Set()
            return categories.map(cat => {
              const displayBoard = cat.sorted.find(b => {
                if (usedIds.has(b._id)) return false
                const m = firstMessages[b._id]
                return m?.type === 'emblem' && m?.canvasData
              }) || null
              if (displayBoard) usedIds.add(displayBoard._id)

              const msg        = displayBoard ? firstMessages[displayBoard._id] : null
              const frameBg    = msg?.canvasData?.canvasFrame?.color || '#f5f5f5'
              const canvasData = msg?.canvasData ? { ...msg.canvasData, canvasFrame: null } : null
              const ratio      = canvasData?.aspectRatio || 'portrait'

              return (
                <CategoryCard
                  key={cat.id}
                  onClick={() => navigate('/discover', { state: { categoryLabel: cat.label, sort: cat.sort } })}
                >
                  
                  <div className="cat_header">
                    <span className="cat_emoji">{cat.emoji}</span>
                    <span className="cat_label">{cat.label}</span>
                  </div>
                  <span className="cat_count">{cat.count}</span>
                  <CatPreview>
                    <img src={shareRect1} alt="" className="rect rect_left" />
                    <img src={shareRect2} alt="" className="rect rect_right" />
                    <CanvasBg $color={frameBg}>
                      <CanvasWrap $ratio={ratio}>
                        {canvasData
                          ? <CanvasRenderer
                              canvasData={canvasData}
                              style={{ width: '100%', height: '100%' }}
                            />
                          : <SkeletonCanvas />}
                      </CanvasWrap>
                    </CanvasBg>
                  </CatPreview>
                </CategoryCard>
              )
            })
          })()
          }
        </CatGrid>
      </CategoriesSection>

      <NavComponent />

      {/* Search portal */}
      {showSearch && createPortal(
        <SearchPage>
          <SearchPageHeader>
            <BackBtn onClick={() => setShowSearch(false)}><BsChevronLeft /></BackBtn>
            <SearchPageInput>
              <IoSearch className="si" />
              <input
                ref={searchInputRef}
                value={query}
                placeholder="Search boards, people…"
                onChange={e => setQuery(e.target.value)}
              />
              {query && <ClearBtn onClick={() => { setQuery(''); setDebouncedQ('') }}><BsX /></ClearBtn>}
            </SearchPageInput>
          </SearchPageHeader>
          <SearchPageBody>
            {!debouncedQ.trim() ? null : ownerResults.length === 0 && boardResults.length === 0 ? (
              <EmptySearch>No results for "{debouncedQ}"</EmptySearch>
            ) : (
              <>
                {ownerResults.length > 0 && (
                  <>
                    <SectionLabel>People</SectionLabel>
                    {ownerResults.map((owner, i) => (
                      <ResultRow key={i} onClick={() => { setShowSearch(false); navigate(`/profile/${owner.username}`) }}>
                        <AvatarCircle><img src={owner?.profileImage || DefaultAvatar} alt="" /></AvatarCircle>
                        <ResultName>@{owner?.username}</ResultName>
                      </ResultRow>
                    ))}
                  </>
                )}
                {boardResults.length > 0 && (
                  <>
                    <SectionLabel>Boards</SectionLabel>
                    {boardResults.map(b => (
                      <ResultRow key={b._id} onClick={() => setShowSearch(false)}>
                        <BoardDropThumb msg={firstMessages[b._id]} />
                        <ResultInfo>
                          <ResultName>{b.title}</ResultName>
                          <ResultMeta>
                            <span><BsHeart /> {b.stats?.likes ?? 0}</span>
                            <span><PiShareFat /> {b.stats?.shares ?? 0}</span>
                            <span><TfiWorld /> {b.stats?.visits ?? 0}</span>
                          </ResultMeta>
                        </ResultInfo>
                      </ResultRow>
                    ))}
                  </>
                )} 
              </>
            )}
          </SearchPageBody>
        </SearchPage>,
        document.body
      )}

      {/* Filter portal */}
      {showFilter && createPortal(
        <Backdrop onClick={() => setShowFilter(false)}>
          <FilterBox onClick={e => e.stopPropagation()}>
            <FilterTitle>Filter</FilterTitle>
            <FilterDivider />
            <EventGrid>
              <EventCell $active={selectedEvent === null} onClick={() => setSelectedEvent(null)}>
                <CheckCircle $active={selectedEvent === null}>{selectedEvent === null && <BsCheck2 />}</CheckCircle>
                <span className="ev_emoji">🥰</span>
                <span className="ev_label">Moments</span>
              </EventCell>
              {EVENTS.filter(e => e.id !== 'others').map(ev => (
                <EventCell key={ev.id} $active={selectedEvent === ev.id} onClick={() => setSelectedEvent(ev.id)}>
                  <CheckCircle $active={selectedEvent === ev.id}>{selectedEvent === ev.id && <BsCheck2 />}</CheckCircle>
                  <span className="ev_emoji">{ev.emoji}</span>
                  <span className="ev_label">{ev.label}</span>
                </EventCell>
              ))}
            </EventGrid>
            <ContinueBtn onClick={() => {
              setShowFilter(false)
              if (selectedEvent === null) navigate('/')
              else {
                const ev = EVENTS.find(e => e.id === selectedEvent)
                navigate('/discover', { state: { categoryLabel: ev?.label ?? selectedEvent, event: selectedEvent } })
              }
            }}>
              Continue
            </ContinueBtn>
          </FilterBox>
        </Backdrop>,
        document.body
      )}
    </Page>
  )
}

const shimmer = keyframes`
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
`

const SkeletonBase = styled.div`
  background: linear-gradient(90deg, #e8e8e8 25%, #f0f0f0 50%, #e8e8e8 75%);
  background-size: 200% 100%;
  animation: ${shimmer} 1.4s ease-in-out infinite;
`

const SkeletonCard = styled(SkeletonBase)`
  height: 400px;
  border-radius: 30px;

  @media (max-width: 480px) {
    height: 280px;
    border-radius: 18px;
  }
`

const SkeletonCanvas = styled(SkeletonBase)`
  width: 100%;
  height: 100%;
  border-radius: 10px;
`

const SkeletonHeroText = styled.div`
  width: 72%;
  height: 3.2rem;
  margin: 0 0 2rem 3rem;
  border-radius: 12px;
  background: linear-gradient(
    90deg,
    rgba(255,255,255,0.25) 25%,
    rgba(255,255,255,0.55) 50%,
    rgba(255,255,255,0.25) 75%
  );
  background-size: 200% 100%;
  animation: ${shimmer} 1.4s ease-in-out infinite;

  @media (max-width: 768px) {
    height: 2.4rem;
  }

  @media (max-width: 600px) {
    margin: 0 0 1rem 1rem;
    width: 80%;
    height: 2.2rem;
  }
`

const Page = styled.div`
  min-height: 100vh;
  background: #f5f6f8;
  padding-bottom: 5rem;
  position: relative;
`

const HeroBg = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 70vh;
  background-size: cover;
  background-position: center;
  z-index: 0;
  pointer-events: none;
`

const TopBar = styled.header`
  position: sticky;
  top: 0;
  z-index: 100;
  background: transparent;
  /* backdrop-filter: blur(8px); */
  /* background: #fff; */
  padding: 0.85rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.85rem;

  @media (max-width: 480px) {
    padding: 0.65rem 0.85rem;
    gap: 0.55rem;
  }

  .logo {
    flex-shrink: 0;
    width: 35px;
    height: 35px;
    overflow: visible;
    display: flex;
    align-items: center;
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transform: scale(2.5);
    }
  }
`

const SearchWrap = styled.div`
  flex: 1;
`

const SearchBar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: #ffffff;
  border-radius: 99px;
  padding: 0.7rem 1rem;
  cursor: pointer;

  .si {
    color: #aaa;
    font-size: 1.1em;
    flex-shrink: 0;
  }

  .placeholder_text {
    font-size: 0.88em;
    color: #bbb;
    user-select: none;
  }
`

const FilterBtn = styled.button`
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: #ffffff;
  color: #555;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
`

const HeroSection = styled.section`
  padding: 2.5rem 1.5rem 1.75rem;
  min-height: 220px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  z-index: 1;

  @media (max-width: 480px) {
    padding: 1.5rem 1rem 1rem;
    min-height: 160px;
  }
`

const HeroText = styled.p`
  width: 100%;
  margin: 1.5rem 0 2rem;
  line-height: 1.25;
  text-align: ${p => p.$align};
  padding-left:  ${p => p.$align === 'left'  ? '3rem' : '1.5rem'};
  padding-right: ${p => p.$align === 'right' ? '3rem' : '1.5rem'};

  @media (max-width: 768px) {
    font-size: 2em !important;
  }

  @media (max-width: 600px) {
    margin: 0 0 1rem;
    font-size: 2em !important;
    padding-left:  ${p => p.$align === 'left'  ? '1rem' : '0.75rem'};
    padding-right: ${p => p.$align === 'right' ? '1rem' : '0.75rem'};
  }
`

const DotsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 7rem;
  transform: translateY(2rem);

  @media (max-width: 480px) {
    margin-top: 3rem;
    transform: translateY(1rem);
  }
`

const Dot = styled.button`
  width: ${({ $active }) => ($active ? '20px' : '7px')};
  height: 7px;
  border-radius: 99px;
  border: none;
  background: ${({ $active }) => ($active ? '#ffffff' : 'rgba(255,255,255,0.5)')};
  padding: 0;
  cursor: pointer;
  transition: width 0.3s, background 0.3s;
`

const CategoriesSection = styled.section`
  padding: 5rem 1rem 1rem;
  position: relative;
  z-index: 1;

  @media (max-width: 600px) {
    padding: 2rem 0.75rem 1rem;
  }
`

const CatGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: 600px) {
    gap: 0.5rem;
  }
`

const CategoryCard = styled.div`
  position: relative;
  background: #fff;
  background-image: url('${waves}');
  height: 400px;
  border-radius: 30px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  overflow: hidden;

  .cat_header {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }

  .cat_emoji {
    font-size: 1em;
    line-height: 1;
  }

  .cat_label {
    font-size: 1.2em;
    font-weight: 700;
    color: #111;
    line-height: 1.3;
  }

  .cat_count {
    font-size: 0.68em;
    color: #9ca3af;
    margin-bottom: 0.5rem;
  }

  @media (max-width: 480px) {
    height: 280px;
    border-radius: 18px;
    padding: 0.85rem;

    .cat_header {
      height: 2.4rem;
      overflow: hidden;
      align-items: flex-start;
      flex-shrink: 0;
    }

    .cat_label {
      font-size: 0.78em;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      margin-top: 0.25rem;
    }

    .cat_count {
      font-size: 0.6em;
      margin-bottom: 0.25rem;
      flex-shrink: 0;
    }
  }
`

const CatPreview = styled.div`
  position: relative;
  flex: 1;
  border-radius: 10px;
  overflow: hidden;

  .rect {
    position: absolute;
    width: 30%;
    z-index: 1;
    pointer-events: none;
  }

  .rect_left {
    left: 44%;
    top: 10%;
  }

  .rect_right {
    right: 4%;
    top: 10%;
  }

  @media (max-width: 768px) {

    .rect {
      width: 50%;
    }

    .rect_left {
      left: 5%;
      top: 30%;
    }

    .rect_right {
      right: 5%;
      top: 30%;
    }
  }
`

const CanvasBg = styled.div`
  position: absolute;
  z-index: 5;
  right: 10%;
  bottom: 8%;
  width: 40%;
  aspect-ratio: 1 / 1;
  border-radius: 14px;
  background: ${({ $color }) => $color};
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    top: 50%;
    left: 50%;
    right: auto;
    bottom: auto;
    width: 88%;
    transform: translate(-50%, -50%);
    padding: 12px;
  }
`

const CanvasWrap = styled.div`
  border-radius: 10px;
  overflow: hidden;

  width: ${({ $ratio }) => $ratio === 'landscape' ? '85%' : '80%'};
  ${({ $ratio }) => $ratio === 'portrait' ? 'height: 80%;' : ''}

  @media (max-width: 768px) {
    width: 88%;
    height: 88%;
  }

  .canvas_fallback {
    width: 100%;
    aspect-ratio: 3 / 4;
    background: #f0f0f0;
    border-radius: 10px;
  }
`

const FilterDot = styled.span`
  position: absolute;
  top: 5px;
  right: 5px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef5a42;
  border: 2px solid #fff;
`

const SearchPage = styled.div`
  position: fixed;
  inset: 0;
  z-index: 99999;
  background: #fff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`

const SearchPageHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  border-bottom: 1.5px solid #f0f0f0;
  flex-shrink: 0;
`

const BackBtn = styled.button`
  background: none;
  border: none;
  color: #333;
  font-size: 1.2em;
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 4px;
  flex-shrink: 0;
`

const SearchPageInput = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: #f5f6f8;
  border-radius: 99px;
  padding: 0.65rem 1rem;
  .si { color: #aaa; font-size: 1.1em; }
  input {
    border: none;
    background: transparent;
    outline: none;
    font-size: 0.9em;
    color: #333;
    width: 100%;
    &::placeholder { color: #bbb; }
  }
`

const SearchPageBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem 0 2rem;
`

const SectionLabel = styled.p`
  font-size: 0.72em;
  font-weight: 700;
  color: #9ca3af;
  padding: 0.75rem 1.25rem 0.3rem;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`

const ResultRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 0.65rem 1.25rem;
  cursor: pointer;
  transition: background 0.15s;
  &:hover { background: #f9fafb; }
`

const AvatarCircle = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: #f5f6f8;
  img { width: 100%; height: 100%; object-fit: cover; display: block; }
`

const ResultInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
`

const ResultName = styled.span`
  font-size: 0.92em;
  font-weight: 600;
  color: #111;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const ResultMeta = styled.div`
  display: flex;
  gap: 0.85rem;
  font-size: 0.76em;
  color: #9ca3af;
  align-items: center;
  span { display: flex; align-items: center; gap: 3px; }
`

const EmptySearch = styled.p`
  text-align: center;
  color: #9ca3af;
  padding: 3rem 1.5rem;
  font-size: 0.92em;
`

const ThumbOuter = styled.div`
  width: 70px;
  height: 90px;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
  position: relative;
`

const ThumbFrame = styled.div`
  position: absolute;
  inset: 0;
  border-radius: 10px;
  overflow: hidden;
`

const BoardThumb = styled.div`
  width: 70px;
  height: 90px;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
  background: #f0f0f0;
  position: relative;
  img { width: 100%; height: 100%; object-fit: cover; display: block; }
`

const AudioThumb = styled.div`
  width: 70px;
  height: 90px;
  border-radius: 10px;
  flex-shrink: 0;
  background: #FDDDD7;
  display: flex;
  align-items: center;
  justify-content: center;
  .mic_icon { font-size: 1.4em; color: #C94F38; }
`

const ClearBtn = styled.button`
  background: none;
  border: none;
  color: #aaa;
  font-size: 1.1em;
  cursor: pointer;
  display: flex;
  align-items: center;
`

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 2147483647;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
`

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
  cursor: pointer;
  .ev_emoji { font-size: 1em; line-height: 1; }
  .ev_label { font-size: 0.86em; font-weight: 500; color: #111; flex: 1; }
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
  svg { font-size: 0.55em; color: #fff; }
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
`

export default MomentPage
