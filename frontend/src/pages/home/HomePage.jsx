import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  lazy,
  Suspense,
} from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import {
  BsSearch,
  BsSliders,
  BsMicFill,
  BsPlayFill,
  BsX,
  BsCheck2,
  BsHeart,
} from "react-icons/bs";
import Logo from "../../assets/logo.svg";
import NavComponent from "../../components/global/NavComponent";
import { discoverBoards } from "../../slices/boardSlice";
import { URL } from "../../paths/url";
import CanvasRenderer from "../../canvas/CanvasRenderer";
import { EVENTS } from "../../constants/messageConstant";

const BoardViewModal = lazy(() =>
  import("../../components/message/BoardViewModel").catch(() => ({
    default: () => null,
  })),
);

const shimmer = keyframes`
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
`;

const Page = styled.div`
  min-height: 100vh;
  background: #fff;
  padding-bottom: 5rem;
`;

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
    height: 35px;
    width: 35px;
  }

  img {
    height: 100%;
    width: 100%;
  }


  .top_actions {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-shrink: 0;
  }
`;

const SearchWrap = styled.div`
  flex: 1;
  position: relative;
`;

const SearchBar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: #f5f6f8;
  border-radius: 99px;
  padding: 0.7rem 1rem;
  .si {
    color: #aaa;
    font-size: 0.9em;
  }
  input {
    border: none;
    background: transparent;
    outline: none;
    font-size: 0.88em;
    color: #333;
    width: 100%;
    &::placeholder {
      color: #bbb;
    }
  }
`;

const ClearBtn = styled.button`
  background: none;
  border: none;
  color: #aaa;
  font-size: 1.1em;
  cursor: pointer;
  display: flex;
  align-items: center;
`;

const FilterBtn = styled.button`
  position: relative;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: ${(p) => (p.$active ? "rgba(239,90,66,0.12)" : "#F5F6F8")};
  color: ${(p) => (p.$active ? "#EF5A42" : "#555")};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
`;

const FilterDot = styled.span`
  position: absolute;
  top: 5px;
  right: 5px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef5a42;
  border: 2px solid #fff;
`;

const Dropdown = styled.div`
  position: fixed;
  z-index: 999999;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  padding: 0.5rem 0 0.75rem;
  overflow: hidden;
  width: ${(p) => p.$width}px;
  left: ${(p) => p.$left}px;
  top: ${(p) => p.$top}px;
`;

const DropLabel = styled.p`
  font-size: 0.75em;
  font-weight: 700;
  color: #9ca3af;
  padding: 0.5rem 1.2rem 0.2rem;
  margin: 0;
  text-transform: uppercase;
`;

const DropRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1.2rem;
  cursor: pointer;
  transition: background 0.15s;
  &:hover {
    background: #f5f6f8;
  }
`;

const DropAvatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const AvatarFallback = styled.div`
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at 50% 38%, #f5b8ad 32%, #fde8e5 32%);
`;

const DropThumb = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  background: #f0f0f0;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

const DropBoardInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const DropName = styled.span`
  font-size: 0.9em;
  font-weight: 600;
  color: #111;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const DropMeta = styled.div`
  display: flex;
  gap: 0.75rem;
  font-size: 0.75em;
  color: #9ca3af;
  align-items: center;
  span {
    display: flex;
    align-items: center;
    gap: 3px;
  }
`;

const Feed = styled.main`
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.5rem 1.5rem 2rem;
`;

const MasonryGrid = styled.div`
  columns: 4;
  column-gap: 0.85rem;
  @media (max-width: 1100px) {
    columns: 3;
  }
  @media (max-width: 720px) {
    columns: 2;
  }
  @media (max-width: 420px) {
    columns: 1;
  }
`;

const GridItem = styled.div`
  break-inside: avoid;
  margin-bottom: 0.85rem;
`;

const CardWrap = styled.div`
  position: relative;
  border-radius: 16px;
  border: 2.5px solid transparent;
  overflow: hidden;
  width: 100%;
  cursor: pointer;
  transition: box-shadow 0.2s;
  &:hover {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  }
  .card_img {
    width: 100%;
    display: block;
    object-fit: cover;
  }
  .card_placeholder {
    width: 100%;
    aspect-ratio: 1/1;
    background: #f0f0f0;
  }
  &.note_card {
    padding: 2rem;
    min-height: 160px;
    .note_paper {
      position: relative;
      background: #fff;
      border-radius: 10px;
      padding: 1rem 1rem 3.5rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
      min-height: 100px;
    }
    .note_title {
      font-size: 0.85em;
      font-weight: 600;
      margin: 0 0 0.35rem;
      color: #333;
    }
    .note_body {
      font-size: 0.82em;
      color: #555;
      margin: 0 0 0.5rem;
      line-height: 1.5;
    }
    .note_body_empty {
      color: #bbb;
      font-style: italic;
    }
    .note_sign {
      font-size: 0.82em;
      color: #888;
      margin: 0;
    }
    .note_thumb {
      position: absolute;
      bottom: 0.75rem;
      right: 0.75rem;
      width: 48px;
      height: 48px;
      border-radius: 8px;
      object-fit: cover;
    }
  }
`;

const PlayWrap = styled.div`
  position: absolute;
  bottom: 12px;
  left: 12px;
  z-index: 4;
  color: #fff;
  font-size: 1.1em;
  filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.45));
`;

const AudioOuter = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 4/3;
  background: #f0e0dc;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: box-shadow 0.2s;
  &:hover {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  }
  .mic_ring {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: rgba(220, 150, 135, 0.55);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .mic_icon {
    font-size: 1.25em;
    color: #c94f38;
  }
`;

const SkeletonWrap = styled.div`
  border-radius: 16px;
  height: ${(p) => (p.$tall ? "240px" : "160px")};
  background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: ${shimmer} 1.4s infinite linear;
`;

const EmptyMsg = styled.p`
  text-align: center;
  color: #9ca3af;
  padding: 4rem 0;
  font-size: 0.95em;
`;

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 2147483647;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
`;

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
`;

const FilterTitle = styled.h3`
  font-size: 1.1em;
  font-weight: 700;
  color: #111;
  margin: 0;
`;
const FilterDivider = styled.hr`
  border: none;
  border-top: 1.5px solid #f0f0f0;
  margin: 0;
`;
const EventGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
`;

const EventCell = styled.div`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.65rem;
  border-radius: 12px;
  background: ${(p) => (p.$active ? "rgba(239,90,66,0.05)" : "#f9fafb")};
  border: 1.5px solid ${(p) => (p.$active ? "#EF5A42" : "#eceff3")};
  cursor: pointer;
  .ev_emoji {
    font-size: 1em;
    line-height: 1;
  }
  .ev_label {
    font-size: 0.86em;
    font-weight: 500;
    color: #111;
  }
`;

const Radio = styled.div`
  width: 17px;
  height: 17px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 1.5px solid ${(p) => (p.$active ? "#EF5A42" : "#d1d5db")};
  background: ${(p) => (p.$active ? "#EF5A42" : "transparent")};
  display: flex;
  align-items: center;
  justify-content: center;
  svg {
    font-size: 0.6em;
    color: #fff;
  }
`;

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
`;

const PlayIcon = () => (
  <PlayWrap>
    <BsPlayFill />
  </PlayWrap>
);

const EmblemCard = ({ msg, isMulti, onClick }) => (
  <CardWrap onClick={onClick}>
    <CanvasRenderer canvasData={msg.canvasData} style={{ borderRadius: 0 }} />
    {isMulti && <PlayIcon />}
  </CardWrap>
);

const StackCard = ({ msg, isMulti, onClick }) => {
  const src = msg?.content?.imageUrls?.[0] || null;
  return (
    <CardWrap onClick={onClick}>
      {src ? (
        <img src={src} alt="" className="card_img" />
      ) : (
        <div className="card_placeholder" />
      )}
      {isMulti && <PlayIcon />}
    </CardWrap>
  );
};

const AudioCard = ({ isMulti, onClick }) => (
  <AudioOuter onClick={onClick}>
    <div className="mic_ring">
      <BsMicFill className="mic_icon" />
    </div>
    {isMulti && <PlayIcon />}
  </AudioOuter>
);

const NoteCard = ({ board, onClick }) => (
  <CardWrap
    onClick={onClick}
    style={{ background: "#fff8e7", borderColor: "#f5c842" }}
    className="note_card"
  >
    <div className="note_paper">
      <p className="note_title">{board.title}</p>
      {board.description ? (
        <p className="note_body">{board.description}</p>
      ) : (
        <p className="note_body note_body_empty">No description</p>
      )}
      {board.owner?.username && (
        <p className="note_sign">— @{board.owner.username}</p>
      )}
      {board.owner?.profileImage && (
        <img src={board.owner.profileImage} alt="" className="note_thumb" />
      )}
    </div>
  </CardWrap>
);

const BoardCard = ({ board, msg, onOpen }) => {
  const isMulti = board.stats?.messages > 1;
  const type = msg?.type;
  const open = () => onOpen(board);
  if (type === "emblem" && msg?.canvasData)
    return <EmblemCard msg={msg} isMulti={isMulti} onClick={open} />;
  if (type === "audio") return <AudioCard isMulti={isMulti} onClick={open} />;
  if (msg?.content?.imageUrls?.[0])
    return <StackCard msg={msg} isMulti={isMulti} onClick={open} />;
  return <NoteCard board={board} onClick={open} />;
};

const BoardDropThumb = ({ msg, coverImage }) => {
  if (msg?.type === "emblem" && msg?.canvasData) {
    return (
      <DropThumb>
        <CanvasRenderer
          canvasData={msg.canvasData}
          style={{ width: "100%", height: "100%", borderRadius: 0 }}
        />
      </DropThumb>
    );
  }
  const src = msg?.content?.imageUrls?.[0] || coverImage || null;
  return <DropThumb>{src ? <img src={src} alt="" /> : null}</DropThumb>;
};

const HomePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { discoverBoards: boards = [], discoverLoad } = useSelector(
    (s) => s.board,
  );

  const [query, setQuery] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [firstMessages, setFirstMessages] = useState({});
  const [activeBoard, setActiveBoard] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const [showFilter, setShowFilter] = useState(false);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [activeEvents, setActiveEvents] = useState([]);

  const fetchedSlugs = useRef(new Set());
  const searchRef = useRef(null);
  const dropdownRef = useRef(null);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(query), 280);
    return () => clearTimeout(t);
  }, [query]);

  // single effect — handles initial load AND filter changes
  useEffect(() => {
    dispatch(
      discoverBoards({
        page: 1,
        limit: 20,
        event: activeEvents.length === 1 ? activeEvents[0] : undefined,
      }),
    );
  }, [dispatch, activeEvents]);

  // fetch first message for each board card
  useEffect(() => {
    if (!boards.length) {
      fetchedSlugs.current = new Set();
      setFirstMessages({});
      return;
    }
    const toFetch = boards.filter((b) => !fetchedSlugs.current.has(b.slug));
    if (!toFetch.length) return;
    toFetch.forEach((b) => fetchedSlugs.current.add(b.slug));
    Promise.allSettled(
      toFetch.map((b) =>
        axios
          .get(`${URL}/api/v1/message/${b.slug}/board`, {
            params: { page: 1, limit: 1 },
            withCredentials: true,
          })
          .then((r) => ({
            boardId: b._id,
            message: r.data.messages?.[0] || null,
          }))
          .catch(() => ({ boardId: b._id, message: null })),
      ),
    ).then((results) => {
      const updates = {};
      results.forEach((r) => {
        if (r.status === "fulfilled")
          updates[r.value.boardId] = r.value.message;
      });
      setFirstMessages((prev) => ({ ...prev, ...updates }));
    });
  }, [boards]);

  // dropdown position
  useEffect(() => {
    if (!debouncedQ.trim()) {
      setShowDropdown(false);
      return;
    }
    if (searchRef.current) {
      const rect = searchRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width,
      });
    }
    setShowDropdown(true);
  }, [debouncedQ]);

  // close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      const inSearch = searchRef.current?.contains(e.target);
      const inDropdown = dropdownRef.current?.contains(e.target);
      if (!inSearch && !inDropdown) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleToggleEvent = useCallback((id) => {
    if (id === null) {
      setPendingEvents([]);
      return;
    }
    setPendingEvents((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id],
    );
  }, []);

  const isTall = (i) => i % 5 === 0 || i % 5 === 3;

  const isAtMode = debouncedQ.startsWith("@");
  const q = isAtMode
    ? debouncedQ.slice(1).trim().toLowerCase()
    : debouncedQ.trim().toLowerCase();

  const ownerResults = q
    ? Object.values(
        boards.reduce((acc, b) => {
          const un = b.owner?.username?.toLowerCase() || "";
          if (un.includes(q) && !acc[un]) acc[un] = b.owner;
          return acc;
        }, {}),
      ).slice(0, 3)
    : [];

  const boardResults =
    q && !isAtMode
      ? boards
          .filter((b) => {
            const hasMsg =
              firstMessages[b._id] !== undefined &&
              firstMessages[b._id] !== null;
            const matchTitle = b.title?.toLowerCase().includes(q);
            const matchDesc = b.description?.toLowerCase().includes(q);
            return hasMsg && (matchTitle || matchDesc);
          })
          .filter((b, i, arr) => arr.findIndex((x) => x._id === b._id) === i)
          .slice(0, 4)
      : [];

  // settled when all boards have had their first-message fetch attempted
  const msgsSettled =
    boards.length === 0 || boards.every((b) => b._id in firstMessages);

  const filtered = boards.filter((b) => {
    const hasMsg = b._id in firstMessages;
    const matchText =
      !q ||
      b.title?.toLowerCase().includes(q) ||
      b.owner?.username?.toLowerCase().includes(q) ||
      b.description?.toLowerCase().includes(q) ||
      b.event?.toLowerCase().includes(q);
    return hasMsg && matchText;
  });

  return (
    <Page>
      <TopBar>
        <div className="logo">
          <img src={Logo} alt="logo" />
        </div>

        <SearchWrap ref={searchRef}>
          <SearchBar>
            <BsSearch className="si" />
            <input
              value={query}
              placeholder="Search name, location event..."
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                if (debouncedQ.trim()) setShowDropdown(true);
              }}
            />
            {query && (
              <ClearBtn
                onClick={() => {
                  setQuery("");
                  setShowDropdown(false);
                }}
              >
                <BsX />
              </ClearBtn>
            )}
          </SearchBar>
        </SearchWrap>

        <div className="top_actions">
          <FilterBtn
            $active={activeEvents.length > 0}
            onClick={() => {
              setPendingEvents([...activeEvents]);
              setShowFilter(true);
            }}
          >
            <BsSliders />
            {activeEvents.length > 0 && <FilterDot />}
          </FilterBtn>
        </div>
      </TopBar>

      <Feed>
        {discoverLoad || !msgsSettled ? (
          <MasonryGrid>
            {[...Array(12)].map((_, i) => (
              <GridItem key={i}>
                <SkeletonWrap $tall={isTall(i)} />
              </GridItem>
            ))}
          </MasonryGrid>
        ) : filtered.length === 0 ? (
          <EmptyMsg>
            {q
              ? `No boards match "${debouncedQ}"`
              : activeEvents.length > 0
                ? "No boards found for this event."
                : "No boards yet."}
          </EmptyMsg>
        ) : (
          <MasonryGrid>
            {filtered.map((board, i) => (
              <GridItem key={board._id}>
                {!(board._id in firstMessages) ? (
                  <SkeletonWrap $tall={isTall(i)} />
                ) : (
                  <BoardCard
                    board={board}
                    msg={firstMessages[board._id]}
                    onOpen={setActiveBoard}
                  />
                )}
              </GridItem>
            ))}
          </MasonryGrid>
        )}
      </Feed>

      <NavComponent />

      {activeBoard && (
        <Suspense fallback={null}>
          <BoardViewModal
            board={activeBoard}
            onClose={() => setActiveBoard(null)}
          />
        </Suspense>
      )}

      {/* Search dropdown */}
      {showDropdown &&
        (ownerResults.length > 0 || boardResults.length > 0) &&
        createPortal(
          <Dropdown
            ref={dropdownRef}
            $top={dropdownPos.top}
            $left={dropdownPos.left}
            $width={dropdownPos.width}
          >
            {ownerResults.length > 0 && (
              <>
                <DropLabel>Account</DropLabel>
                {ownerResults.map((owner, i) => (
                  <DropRow
                    key={i}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setShowDropdown(false);
                      setQuery("");
                      navigate(`/profile/${owner.username}`);
                    }}
                  >
                    <DropAvatar>
                      {owner?.profileImage ? (
                        <img src={owner.profileImage} alt="" />
                      ) : (
                        <AvatarFallback />
                      )}
                    </DropAvatar>
                    <DropName>@{owner?.username}</DropName>
                  </DropRow>
                ))}
              </>
            )}
            {boardResults.length > 0 && (
              <>
                <DropLabel>Board</DropLabel>
                {boardResults.map((b) => (
                  <DropRow
                    key={b._id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setShowDropdown(false);
                      setQuery("");
                      setActiveBoard(b);
                    }}
                  >
                    <BoardDropThumb
                      msg={firstMessages[b._id]}
                      coverImage={b.coverImage}
                    />
                    <DropBoardInfo>
                      <DropName>{b.title}</DropName>
                      <DropMeta>
                        <span>
                          <BsHeart /> {b.stats?.likes ?? 0}
                        </span>
                        <span>⇄ {b.stats?.shares ?? 0}</span>
                        <span>◎ {b.stats?.visits ?? 0}</span>
                      </DropMeta>
                    </DropBoardInfo>
                  </DropRow>
                ))}
              </>
            )}
          </Dropdown>,
          document.body,
        )}

      {/* Filter modal */}
      {showFilter &&
        createPortal(
          <Backdrop onClick={() => setShowFilter(false)}>
            <FilterBox onClick={(e) => e.stopPropagation()}>
              <FilterTitle>Filter</FilterTitle>
              <FilterDivider />
              <EventGrid>
                <EventCell
                  $active={pendingEvents.length === 0}
                  onClick={() => handleToggleEvent(null)}
                >
                  <Radio $active={pendingEvents.length === 0}>
                    {pendingEvents.length === 0 && <BsCheck2 />}
                  </Radio>
                  <span className="ev_label">All Events</span>
                </EventCell>
                {EVENTS.filter((e) => e.id !== "others").map((ev) => {
                  const on = pendingEvents.includes(ev.id);
                  return (
                    <EventCell
                      key={ev.id}
                      $active={on}
                      onClick={() => handleToggleEvent(ev.id)}
                    >
                      <Radio $active={on}>{on && <BsCheck2 />}</Radio>
                      <span className="ev_emoji">{ev.emoji}</span>
                      <span className="ev_label">{ev.label}</span>
                    </EventCell>
                  );
                })}
              </EventGrid>
              <ContinueBtn
                onClick={() => {
                  setActiveEvents([...pendingEvents]);
                  setShowFilter(false);
                }}
              >
                Continue
              </ContinueBtn>
            </FilterBox>
          </Backdrop>,
          document.body,
        )}
    </Page>
  );
};

export default HomePage;
