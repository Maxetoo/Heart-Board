import React, { useState } from 'react'
import styled from 'styled-components'
import { BsSearch, BsSliders, BsPerson } from 'react-icons/bs'
import Logo from '../../assets/logo.svg';
import NavComponent from '../../components/global/NavComponent'


const FEED = [
  {
    id: 1,
    type: 'image',
    borderColor: '#FADADD',
    bg: '#FFF0F2',
    img: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80',
    tall: true,
  },
  {
    id: 2,
    type: 'video',
    borderColor: 'transparent',
    bg: '#111',
    img: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=400&q=80',
    tall: false,
  },
  {
    id: 3,
    type: 'stack',
    borderColor: 'transparent',
    bg: '#E8F4FD',
    imgs: [
      'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=400&q=80',
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80',
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&q=80',
    ],
    tall: false,
  },
  {
    id: 4,
    type: 'image',
    borderColor: '#C9D4F5',
    bg: '#EEF2FF',
    img: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&q=80',
    label: 'I Love this moment',
    tall: false,
  },
  {
    id: 5,
    type: 'note',
    borderColor: '#F5C842',
    bg: '#FFF8E7',
    tall: false,
    title: 'Happy birthday grandpa James.',
    body: 'Thank you for being there for me.',
    sign: 'Your grandson, Tyler',
    imgThumb: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&q=80',
  },
  {
    id: 6,
    type: 'card',
    borderColor: '#4CAF9A',
    bg: '#2E9E82',
    tall: true,
    note: 'I love you ronaldo!\nHappy retirement,\nYour cousin Amino',
    img: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=200&q=80',
  },
  {
    id: 7,
    type: 'stack',
    borderColor: 'transparent',
    bg: '#F3E8FF',
    imgs: [
      'https://images.unsplash.com/photo-1551958219-acbc49b08da8?w=400&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
    ],
    tall: false,
  },
  {
    id: 8,
    type: 'audio',
    borderColor: 'transparent',
    bg: '#FDECEA',
    tall: false,
  },
  {
    id: 9,
    type: 'image',
    borderColor: 'transparent',
    bg: '#111',
    img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
    tall: true,
  },
  {
    id: 10,
    type: 'note',
    borderColor: '#B5EAD7',
    bg: '#E8F8F2',
    tall: false,
    title: 'Congrats on your graduation!',
    body: 'So proud of everything you have achieved. This is just the beginning.',
    sign: 'Love, Mum & Dad',
    imgThumb: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=80&q=80',
  },
  {
    id: 11,
    type: 'image',
    borderColor: '#FADADD',
    bg: '#FFF0F2',
    img: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=400&q=80',
    tall: false,
  },
  {
    id: 12,
    type: 'stack',
    borderColor: 'transparent',
    bg: '#FFF3E0',
    imgs: [
      'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400&q=80',
      'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=400&q=80',
      'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=400&q=80',
    ],
    tall: false,
  },
  {
    id: 13,
    type: 'note',
    borderColor: '#C9D4F5',
    bg: '#EEF2FF',
    tall: false,
    title: 'To my best friend Sarah,',
    body: 'Ten years of friendship and countless memories. Here is to many more adventures together!',
    sign: '— Emma 🌸',
    imgThumb: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=80&q=80',
  },
  {
    id: 14,
    type: 'video',
    borderColor: 'transparent',
    bg: '#1a1a2e',
    img: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400&q=80',
    tall: false,
  },
  {
    id: 15,
    type: 'image',
    borderColor: '#B5EAD7',
    bg: '#E8F8F2',
    img: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80',
    tall: true,
  },
  {
    id: 16,
    type: 'audio',
    borderColor: 'transparent',
    bg: '#E8F4FD',
    tall: false,
  },
  {
    id: 17,
    type: 'note',
    borderColor: '#FADADD',
    bg: '#FFF0F2',
    tall: false,
    title: 'Happy Anniversary!',
    body: 'Five years ago you said yes. Best decision of my life.',
    sign: 'Forever yours, Jake',
    imgThumb: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=80&q=80',
  },
  {
    id: 18,
    type: 'image',
    borderColor: 'transparent',
    bg: '#222',
    img: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&q=80',
    tall: false,
  },
]

// ── sub-components ──────────────────────────────────────────────────
const VideoCard = ({ item }) => (
  <CardWrap style={{ background: item.bg, borderColor: item.borderColor }}>
    <img src={item.img} alt="" className="card_img" />
    <div className="play_btn">▶</div>
  </CardWrap>
)

const ImageCard = ({ item }) => (
  <CardWrap style={{ background: item.bg, borderColor: item.borderColor }}>
    <img src={item.img} alt="" className="card_img" />
    {item.label && <p className="img_label">{item.label}</p>}
  </CardWrap>
)

const StackCard = ({ item }) => (
  <CardWrap style={{ background: item.bg, borderColor: item.borderColor }} className="stack_card">
    <div className="stack_wrapper">
      {item.imgs.slice(0, 3).map((src, i) => (
        <div key={i} className={`stack_item stack_item_${i}`}>
          <img src={src} alt="" />
        </div>
      ))}
    </div>
    <div className="stack_pause">
    </div>
  </CardWrap>
)

const NoteCard = ({ item }) => (
  <CardWrap style={{ background: item.bg, borderColor: item.borderColor }} className="note_card">
    <div className="note_paper">
      <p className="note_title">{item.title}</p>
      <p className="note_body">{item.body}</p>
      <p className="note_sign">{item.sign}</p>
      {item.imgThumb && <img src={item.imgThumb} alt="" className="note_thumb" />}
    </div>
  </CardWrap>
)

const GreenCard = ({ item }) => (
  <CardWrap style={{ background: item.bg, borderColor: item.borderColor }} className="green_card">
    <div className="lined_paper">
      <span className="heart_emoji">❤️</span>
      <span className="star_emoji">⭐</span>
      <pre className="green_note">{item.note}</pre>
    </div>
    <img src={item.img} alt="" className="green_player_img" />
  </CardWrap>
)

const AudioCard = ({ item }) => (
  <CardWrap style={{ background: item.bg, borderColor: item.borderColor }} className="audio_card">
    <div className="audio_waves">
      {[...Array(12)].map((_, i) => (
        <div key={i} className="wave_bar" style={{ animationDelay: `${i * 0.08}s` }} />
      ))}
    </div>
    <div className="mic_btn">🎤</div>
  </CardWrap>
)

const renderCard = (item) => {
  switch (item.type) {
    case 'video':   return <VideoCard key={item.id} item={item} />
    case 'note':    return <NoteCard key={item.id} item={item} />
    case 'card':    return <GreenCard key={item.id} item={item} />
    case 'audio':   return <AudioCard key={item.id} item={item} />
    case 'stack':   return <StackCard key={item.id} item={item} />
    default:        return <ImageCard key={item.id} item={item} />
  }
}

const HomePage = () => {
  const [query, setQuery] = useState('')

  return (
    <Page>
      <TopBar>
        <div className="logo">
          <img src={Logo} alt="logo" />
        </div>
        <div className="search_bar">
          <BsSearch className="search_icon" />
          <input
            type="text"
            placeholder="Search name, location event..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="top_actions">
          <button className="icon_btn"><BsSliders /></button>
        </div>
      </TopBar>

      <Feed>
        <MasonryGrid>
          {FEED.map((item) => (
            <GridItem key={item.id} tall={item.tall}>
              {renderCard(item)}
            </GridItem>
          ))}
        </MasonryGrid>
      </Feed>

      <NavComponent />
    </Page>
  )
}

// ── styles ──────────────────────────────────────────────────────────
const Page = styled.div`
  min-height: 100vh;
  background: #fff;
  padding-bottom: 5rem;
`

const TopBar = styled.header`
  position: sticky;
  top: 0;
  z-index: 100;
  background: #fff;
  padding: 0.85rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;

  .logo {
    flex-shrink: 0;
    display: flex;
    align-items: center;
  }

  .search_bar {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 0.6rem;
    background: #F5F6F8;
    border-radius: 99px;
    padding: 1rem;

    .search_icon {
      color: #aaa;
      font-size: 0.9em;
      flex-shrink: 0;
    }

    input {
      border: none;
      background: transparent;
      outline: none;
      font-size: 0.88em;
      color: #333;
      width: 100%;

      &::placeholder { color: #bbb; }
    }
  }

  .top_actions {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-shrink: 0;
  }

  .icon_btn {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    border: none;
    background: #F5F6F8;
    color: #555;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.95em;
    cursor: pointer;
    transition: background 0.2s;

    &:hover { background: #ECEEF2; }
  }

  @media (max-width: 600px) {
    padding: 0.75rem 1rem;
  }
`

const Feed = styled.main`
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.5rem 1.5rem 2rem;
`

const MasonryGrid = styled.div`
  columns: 4;
  column-gap: 0.85rem;

  @media (max-width: 1100px) { columns: 3; }
  @media (max-width: 720px)  { columns: 2; }
  @media (max-width: 420px)  { columns: 1; }
`

const GridItem = styled.div`
  break-inside: avoid;
  margin-bottom: 0.85rem;
`

const CardWrap = styled.div`
  position: relative;
  border-radius: 16px;
  border: 2.5px solid transparent;
  overflow: hidden;
  width: 100%;

  .card_img {
    width: 100%;
    display: block;
    object-fit: cover;
  }

  .play_btn {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.8em;
    color: #fff;
    background: rgba(0,0,0,0.25);
  }

  .img_label {
    position: absolute;
    bottom: 0.6rem;
    left: 0.75rem;
    font-size: 0.82em;
    font-weight: 600;
    color: #333;
    margin: 0;
  }

  /* note card */
  &.note_card {
    padding: 2rem;
    min-height: 160px;

    .note_paper {
      position: relative;
      background: #fff;
      border-radius: 10px;
      padding: 1rem 1rem 3.5rem 1rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.07);
      min-height: 100px;
    }

    .note_title { font-size: 0.85em; font-weight: 600; margin: 0 0 0.35rem; color: #333; }
    .note_body  { font-size: 0.82em; color: #555; margin: 0 0 0.5rem; line-height: 1.5; }
    .note_sign  { font-size: 0.82em; color: #888; margin: 0; }
    .note_thumb {
      position: absolute;
      bottom: 0.75rem;
      right: 0.75rem;
      width: 48px;
      height: 48px;
      border-radius: 8px;
      object-fit: cover;
      box-shadow: 0 2px 6px rgba(0,0,0,0.12);
    }
  }

  /* stack card */
  &.stack_card {
    padding: 1.25rem;
    min-height: 180px;
    position: relative;

    .stack_wrapper {
      position: relative;
      height: 150px;
    }

    .stack_item {
      position: absolute;
      width: 100%;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 4px 14px rgba(0,0,0,0.13);

      img {
        width: 100%;
        height: 130px;
        object-fit: cover;
        display: block;
      }
    }

    .stack_item_0 {
      top: 16px;
      left: 8px;
      right: 8px;
      width: auto;
      z-index: 1;
      transform: rotate(3.5deg);
      filter: brightness(0.88);
    }

    .stack_item_1 {
      top: 8px;
      left: 4px;
      right: 4px;
      width: auto;
      z-index: 2;
      transform: rotate(-2deg);
      filter: brightness(0.94);
    }

    .stack_item_2 {
      top: 0;
      left: 0;
      right: 0;
      width: auto;
      z-index: 3;
      transform: rotate(0deg);
    }

    .stack_pause {
      position: absolute;
      bottom: 1rem;
      left: 1rem;
      z-index: 10;

      .pause_icon {
        width: 30px;
        height: 30px;
        background: rgba(0,0,0,0.45);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 3px;

        span {
          display: block;
          width: 3px;
          height: 10px;
          background: #fff;
          border-radius: 2px;
        }
      }
    }
  }

  /* green card */
  &.green_card {
    padding: 0.75rem;
    min-height: 260px;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    .lined_paper {
      position: relative;
      background: #fff;
      border-radius: 8px;
      padding: 0.75rem 0.75rem 0.5rem;
      flex: 1;
      font-family: 'Caveat', cursive;
      background-image: repeating-linear-gradient(transparent, transparent 23px, #e0e0e0 23px, #e0e0e0 24px);
    }

    .heart_emoji { position: absolute; top: 0.5rem; left: 0.75rem; font-size: 1.2em; }
    .star_emoji  { position: absolute; top: 0.25rem; right: 0.75rem; font-size: 1.6em; }

    .green_note {
      font-family: 'Caveat', cursive;
      font-size: 0.95em;
      margin: 1.5rem 0 0;
      white-space: pre-wrap;
      color: #333;
    }

    .green_player_img {
      width: 70%;
      margin: 0 auto;
      display: block;
      border-radius: 8px;
      object-fit: contain;
    }
  }

  /* audio card */
  &.audio_card {
    min-height: 140px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 1.5rem;

    .audio_waves {
      display: flex;
      align-items: center;
      gap: 3px;
      height: 32px;
    }

    .wave_bar {
      width: 3px;
      border-radius: 99px;
      background: rgba(200,80,80,0.25);
      animation: wave 0.8s ease-in-out infinite alternate;
      height: 8px;

      &:nth-child(odd)  { height: 18px; }
      &:nth-child(3n)   { height: 28px; }
    }

    @keyframes wave {
      to { transform: scaleY(2.2); opacity: 0.7; }
    }

    .mic_btn {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: rgba(200,80,80,0.18);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2em;
    }
  }
`

export default HomePage