import React, { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import styled, { keyframes } from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  BsSliders,
  BsGear,
  BsPencil,
  BsEye,
  BsMicFill,
  BsPlayFill,
  BsX,
  BsChevronRight,
  BsChevronLeft,
  BsCheck2,
  BsHeart,
} from "react-icons/bs";
import { IoSearch } from "react-icons/io5";
import { PiShareFat } from "react-icons/pi";
import { getMyBoards } from "../../slices/boardSlice";
import { updateProfile } from "../../slices/userSlice";
import { URL } from "../../paths/url";
import NavComponent from "../../components/global/NavComponent";
import CanvasRenderer from "../../canvas/CanvasRenderer";
import BoardViewModal from "../../components/message/BoardViewModel";
import DefaultAvatar from "../../assets/Vector.svg";
import { profileFirstMsgCache } from "../../utils/msgCache";
// Board events — must match boardModel enum values exactly
const BOARD_EVENTS = [
  { id: "birthday", label: "Birthday", emoji: "🎂" },
  { id: "wedding", label: "Wedding", emoji: "💍" },
  { id: "anniversary", label: "Anniversary", emoji: "❤️" },
  { id: "graduation", label: "Graduation", emoji: "🎓" },
  { id: "sport", label: "Sport", emoji: "🏅" },
  { id: "retirement", label: "Retirement", emoji: "🏖️" },
  { id: "promotion", label: "Promotion", emoji: "🎊" },
  { id: "other", label: "Other", emoji: "🌟" },
];

// ─── Board card sub-components ────────────────────────────────────────────────

const EmblemCard = ({ msg, isMulti, isPrivate, onClick }) => (
  <CardWrap onClick={onClick}>
    <CanvasRenderer canvasData={msg.canvasData} />
    {isMulti && (
      <MultiIndicator>
        <BsPlayFill />
      </MultiIndicator>
    )}
    {isPrivate && (
      <PrivateBadge>
        <BsEye />
      </PrivateBadge>
    )}
  </CardWrap>
);

const StackCard = ({ msg, isMulti, isPrivate, onClick }) => {
  const src = msg?.content?.imageUrls?.[0] || null;
  return (
    <CardWrap onClick={onClick}>
      {src ? (
        <img src={src} alt="" className="card_img" />
      ) : (
        <div className="card_placeholder" />
      )}
      {isMulti && (
        <MultiIndicator>
          <BsPlayFill />
        </MultiIndicator>
      )}
      {isPrivate && (
        <PrivateBadge>
          <BsEye />
        </PrivateBadge>
      )}
    </CardWrap>
  );
};

const AudioCard = ({ isMulti, isPrivate, onClick }) => (
  <AudioOuter onClick={onClick}>
    <span className="ripple" />
    <span className="ripple" />
    <span className="ripple" />
    <div className="mic_center">
      <BsMicFill className="mic_icon" />
    </div>
    {isMulti && (
      <MultiIndicator>
        <BsPlayFill />
      </MultiIndicator>
    )}
    {isPrivate && (
      <PrivateBadge>
        <BsEye />
      </PrivateBadge>
    )}
  </AudioOuter>
);

const NoteCard = ({ board, isMulti, isPrivate, onClick }) => (
  <CardWrap
    onClick={onClick}
    style={{ background: "#FFF8E7", borderColor: "#F5C842" }}
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
    </div>
    {isMulti && (
      <MultiIndicator>
        <BsPlayFill />
      </MultiIndicator>
    )}
    {isPrivate && (
      <PrivateBadge>
        <BsEye />
      </PrivateBadge>
    )}
  </CardWrap>
);

const BoardDropThumb = ({ msg }) => {
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
  const src = msg?.content?.imageUrls?.[0] || null;
  return <DropThumb>{src && <img src={src} alt="" />}</DropThumb>;
};

const BoardCard = ({ board, msg, onOpen }) => {
  const isMulti = (board.stats?.messages ?? 0) > 1;
  const isPrivate =
    board.visibility === "private" || board.visibility === "anonymous";
  const open = () => onOpen(board);
  const type = msg?.type;

  if (type === "emblem" && msg?.canvasData)
    return (
      <EmblemCard
        msg={msg}
        isMulti={isMulti}
        isPrivate={isPrivate}
        onClick={open}
      />
    );
  if (type === "audio")
    return <AudioCard isMulti={isMulti} isPrivate={isPrivate} onClick={open} />;
  if (msg?.content?.imageUrls?.[0])
    return (
      <StackCard
        msg={msg}
        isMulti={isMulti}
        isPrivate={isPrivate}
        onClick={open}
      />
    );
  return (
    <NoteCard
      board={board}
      isMulti={isMulti}
      isPrivate={isPrivate}
      onClick={open}
    />
  );
};


// ─── Main Page ────────────────────────────────────────────────────────────────

const ProfilePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    myProfile,
    updateProfileLoad,
    updateProfileSuccess,
    updateProfileError,
    updateProfileErrorMsg,
  } = useSelector((s) => s.user);
  const { boards, boardCacheVersion } = useSelector((s) => s.board);

  const [activeTab, setActiveTab] = useState("boards");
  const [query, setQuery] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [firstMessages, setFirstMessages] = useState(() => ({ ...profileFirstMsgCache }));
  const [activeBoard, setActiveBoard] = useState(null);

  // dropdown 
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });

  // filter
  const [showFilter, setShowFilter] = useState(false);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [activeEvents, setActiveEvents] = useState([]);

  // settings
  const [showSettings, setShowSettings] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");

  // share
  const [shareCopied, setShareCopied] = useState(false);

  const searchRef = useRef(null);
  const dropdownRef = useRef(null);

  // debounce query
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(query), 280);
    return () => clearTimeout(t);
  }, [query]);

  // re-fetch when caches are invalidated (after edit/delete)
  useEffect(() => {
    if (!boardCacheVersion) return;
    setFirstMessages({ ...profileFirstMsgCache });
    dispatch(
      getMyBoards({
        page: 1,
        limit: 50,
        view: activeTab === "tagged" ? "tagged" : "owned",
        event: activeEvents.length === 1 ? activeEvents[0] : undefined,
      }),
    );
  }, [boardCacheVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  // fetch boards on tab change or event filter change
  // resync from cache so cached boards show immediately, no full skeleton flash
  useEffect(() => {
    setFirstMessages({ ...profileFirstMsgCache });
    dispatch(
      getMyBoards({
        page: 1,
        limit: 50,
        view: activeTab === "tagged" ? "tagged" : "owned",
        event: activeEvents.length === 1 ? activeEvents[0] : undefined,
      }),
    );
  }, [dispatch, activeTab, activeEvents]);

  // fetch first messages for cards
  useEffect(() => {
    if (!boards.length) return;
    const toFetch = boards.filter((b) => !(b._id in profileFirstMsgCache));
    if (!toFetch.length) return;
    Promise.allSettled(
      toFetch.map((b) =>
        axios
          .get(`${URL}/api/v1/message/${b.slug}/board`, {
            params: { page: 1, limit: 1 },
            withCredentials: true,
          })
          .then((res) => ({
            boardId: b._id,
            message: res.data.messages?.[0] || null,
          }))
          .catch(() => ({ boardId: b._id, message: null })),
      ),
    ).then((results) => {
      const updates = {};
      results.forEach((r) => {
        if (r.status === "fulfilled") {
          profileFirstMsgCache[r.value.boardId] = r.value.message;
          updates[r.value.boardId] = r.value.message;
        }
      });
      setFirstMessages((prev) => ({ ...prev, ...updates }));
    });
  }, [boards]);

  // close edit on success
  useEffect(() => {
    if (updateProfileSuccess && editingUsername) {
      setEditingUsername(false);
      setUsernameError("");
    }
  }, [updateProfileSuccess, editingUsername]);

  // show dropdown when query present
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

  const handleSaveUsername = useCallback(() => {
    const trimmed = newUsername.trim();
    if (!trimmed || trimmed.length < 3) {
      setUsernameError("Username must be at least 3 characters.");
      return;
    }
    if (trimmed.length > 10) {
      setUsernameError("Username cannot exceed 10 characters.");
      return;
    }
    setUsernameError("");
    dispatch(updateProfile({ username: trimmed }));
  }, [newUsername, dispatch]);

  const handleShareProfile = useCallback(async () => {
    if (!myProfile?.username) return;
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/profile/${myProfile.username}`,
      );
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    } catch (err) { console.error(err) }
  }, [myProfile]);

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

  const q = debouncedQ.trim().toLowerCase();

  // board search results for dropdown
  const boardResults = q
    ? boards
        .filter((b) => {
          const hasMsg = firstMessages[b._id] !== undefined;
          const matchTitle = b.title?.toLowerCase().includes(q);
          const matchDesc = b.description?.toLowerCase().includes(q);
          return hasMsg && (matchTitle || matchDesc);
        })
        .slice(0, 4)
    : [];

  const msgsSettled =
    boards.length === 0 || boards.every((b) => b._id in firstMessages);

  // filtered grid — only boards with settled first-messages
  const filtered = boards.filter((b) => {
    const hasMsg = b._id in firstMessages;
    const matchText =
      !q ||
      b.title?.toLowerCase().includes(q) ||
      b.description?.toLowerCase().includes(q) ||
      b.event?.toLowerCase().includes(q);
    return hasMsg && matchText;
  });

  const fmtCount = (n) => {
    if (!n) return "0";
    if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
    if (n >= 1000) return (n / 1000).toFixed(1) + "k";
    return String(n);
  };

  return (
    <Page>
      {/* ── Header (CreateMessage style) ── */}
      <Header>
        <button className="back_btn" onClick={() => navigate(-1)}>
          <BsChevronLeft />
        </button>
        <span className="header_username">My Heartboard</span>
        <div style={{ width: 36 }} />
      </Header> 

      {/* ── Hero ── */}
      <Hero>
        <AvatarWrap>
          {myProfile?.profileImage
            ? <img src={myProfile.profileImage} alt="avatar" />
            : <img src={DefaultAvatar} alt="avatar" style={{ width: "68px", height: "68px", objectFit: "contain" }} />
          }
        </AvatarWrap>
        <HeroInfo>
          <HeroUsername>@{myProfile?.username ?? "…"}</HeroUsername>
          <HeroEmail>{myProfile?.email ?? ""}</HeroEmail>
          <HeroBtns>
            <HeroBtn onClick={handleShareProfile}>
              <PiShareFat />
              {shareCopied ? "Copied!" : "Share"}
            </HeroBtn>
            <FreePlanBadge onClick={() => setShowSettings(true)}>
              <BsGear />
              Settings
            </FreePlanBadge>
          </HeroBtns>
        </HeroInfo>
      </Hero>

      {/* ── Tabs ── */}
      <TabRow>
        <Tab
          $active={activeTab === "boards"}
          onClick={() => setActiveTab("boards")}
        >
          Board
        </Tab>
        <Tab
          $active={activeTab === "tagged"}
          onClick={() => setActiveTab("tagged")}
        >
          Tagged
        </Tab>
      </TabRow>

      {/* ── Search + filter ── */}
      <SearchRow>
        <SearchBar ref={searchRef}>
          <IoSearch className="icon" />
          <input
            type="text"
            placeholder="Search boards…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!e.target.value.trim()) setShowDropdown(false);
            }}
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
      </SearchRow>

      {/* ── Grid ── */}
      <Feed>
        {!msgsSettled ? (
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
                ? "No boards match this filter."
                : "No boards yet."}
          </EmptyMsg>
        ) : (
          <MasonryGrid>
            {filtered.map((board) => (
              <GridItem key={board._id}>
                <BoardCard
                  board={board}
                  msg={firstMessages[board._id]}
                  onOpen={setActiveBoard}
                />
              </GridItem>
            ))}
          </MasonryGrid>
        )}
      </Feed>

      <NavComponent />

      {/* ── Board modal ── */}
      {activeBoard && (() => {
        const idx = filtered.findIndex(b => b._id === activeBoard._id)
        return (
          <BoardViewModal
            board={activeBoard}
            onClose={() => setActiveBoard(null)}
            onPrev={idx > 0 ? () => setActiveBoard(filtered[idx - 1]) : undefined}
            onNext={idx < filtered.length - 1 ? () => setActiveBoard(filtered[idx + 1]) : undefined}
          />
        )
      })()}

      {/* ── Search dropdown ── */}
      {showDropdown &&
        boardResults.length > 0 &&
        createPortal(
          <Dropdown
            ref={dropdownRef}
            $top={dropdownPos.top}
            $left={dropdownPos.left}
            $width={dropdownPos.width}
          >
            <DropLabel>Boards</DropLabel>
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
                <BoardDropThumb msg={firstMessages[b._id]} />
                <DropBoardInfo>
                  <DropName>{b.title}</DropName>
                  <DropMeta>
                    <span>
                      <BsHeart /> {b.stats?.likes ?? 0}
                    </span>
                    <span>◎ {b.stats?.visits ?? 0}</span>
                    {b.event && <span>{b.event}</span>}
                  </DropMeta>
                </DropBoardInfo>
              </DropRow>
            ))}
          </Dropdown>,
          document.body,
        )}

      {/* ── Filter modal ── */}
      {showFilter &&
        createPortal(
          <FilterBackdrop onClick={() => setShowFilter(false)}>
            <FilterBox onClick={(e) => e.stopPropagation()}>
              <FilterTitle>Filter by Event</FilterTitle>
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
                {BOARD_EVENTS.map((ev) => {
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
                Apply Filter
              </ContinueBtn>
            </FilterBox>
          </FilterBackdrop>,
          document.body,
        )}

      {/* ── Settings panel ── */}
      {showSettings && (
        <>
          <SettingsBackdrop onClick={() => setShowSettings(false)} />
          <SettingsPanel>
            <SettingsHeader>
              <button
                className="back_btn"
                onClick={() => setShowSettings(false)}
              >
                ‹ Profile Settings
              </button>
            </SettingsHeader>

            <SettingsSection>
              <SectionTitle>Summary</SectionTitle>
              <StatsGrid>
                <StatCard>
                  <span className="label">Total Likes</span>
                  <span className="value">
                    {fmtCount(myProfile?.stats?.totalLikes)}
                  </span>
                </StatCard>
                <StatCard>
                  <span className="label">Total Boards</span>
                  <span className="value">
                    {fmtCount(myProfile?.stats?.totalBoards)}
                  </span>
                </StatCard>
                <StatCard>
                  <span className="label">Total Tagged</span>
                  <span className="value">
                    {fmtCount(myProfile?.stats?.totalMessages)}
                  </span>
                </StatCard>
              </StatsGrid>
            </SettingsSection>

            <SettingsSection>
              <SettingsRow
                onClick={() => {
                  setNewUsername(myProfile?.username ?? "");
                  setEditingUsername(true);
                  setUsernameError("");
                }}
              >
                <span className="row_icon">
                  <BsPencil />
                </span>
                <span className="row_label">Edit profile</span>
                <BsChevronRight className="row_arrow" />
              </SettingsRow>
            </SettingsSection>
          </SettingsPanel>
        </>
      )}

      {/* ── Edit username modal ── */}
      {editingUsername && (
        <ModalOverlay onClick={() => setEditingUsername(false)}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <ModalTitle>Edit Username</ModalTitle>
            <UsernameInput
              type="text"
              placeholder="New username"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              maxLength={10}
            />
            {usernameError && <FieldError>{usernameError}</FieldError>}
            {updateProfileError && (
              <FieldError>{updateProfileErrorMsg}</FieldError>
            )}
            <ModalBtns>
              <CancelBtnModal onClick={() => setEditingUsername(false)}>
                Cancel
              </CancelBtnModal>
              <SaveBtn
                onClick={handleSaveUsername}
                disabled={updateProfileLoad}
              >
                {updateProfileLoad ? "Saving…" : "Save"}
              </SaveBtn>
            </ModalBtns>
          </ModalCard>
        </ModalOverlay>
      )}
    </Page>
  );
};

// ── Keyframes ─────────────────────────────────────────────────────────────────
const shimmer = keyframes`0%{background-position:-200% 0}100%{background-position:200% 0}`;
const slideIn = keyframes`from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}`;
const fadeIn = keyframes`from{opacity:0}to{opacity:1}`;
const modalPop = keyframes`from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}`;
const audioRipple = keyframes`
  0%   { transform: translate(-50%, -50%) scale(0); opacity: 0.8; }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
`;

// ── Layout ────────────────────────────────────────────────────────────────────
const Page = styled.div`
  min-height: 100vh;
  background: #fff;
  padding-bottom: 5rem;
`;

// CreateMessage-style header
const Header = styled.div`
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1.25rem;
  background: #fff;

  .back_btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 1.5px solid #eceff3;
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.05em;
    color: var(--text-color, #111);
    flex-shrink: 0;
    transition: border-color 0.15s;
    &:hover {
      border-color: var(--primary-color, #ef5a42);
      color: var(--primary-color, #ef5a42);
    }
  }

  .header_username {
    font-size: 1.3em;
    font-weight: 700;
    color: #111;
  }
`;

const AvatarSmall = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;


const Hero = styled.section`
  display: flex;
  align-items: center;
  gap: 1.4rem;
  padding: 1.25rem 1.5rem 1.4rem;
  @media (max-width: 480px) {
    padding: 1rem;
    gap: 1rem;
  }
`;

const AvatarWrap = styled.div`
  position: relative;
  width: 90px;
  height: 90px;
  border-radius: 50%;
  flex-shrink: 0;
  background: #fde8e5;
  overflow: hidden;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  
  img {
    position: absolute;
    width: 100%;
    height: 100%;
    object-fit: cover;
    bottom: -5px;

  }
  @media (max-width: 480px) {
    width: 68px;
    height: 68px;
  }
`;


const HeroInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const HeroUsername = styled.h2`
  font-size: 1.25em;
  font-weight: 800;
  color: #111;
  margin: 0;
`;
const HeroEmail = styled.p`
  font-size: 0.82em;
  color: #888;
  margin: 0;
`;

const HeroBtns = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
  flex-wrap: wrap;
`;

const HeroBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f5f6f8;
  color: #333;
  border: none;
  border-radius: 99px;
  padding: 8px 16px;
  font-size: 0.82em;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
  svg {
    font-size: 0.9em;
  }
  &:hover {
    background: #eceef2;
  }
`;

const FreePlanBadge = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f5f6f8;
  color: #333;
  border: none;
  border-radius: 99px;
  padding: 8px 16px;
  font-size: 0.82em;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
  svg {
    font-size: 0.9em;
  }
  &:hover {
    background: #eceef2;
  }
`;

const TabRow = styled.div`
  display: flex;
  gap: 8px;
  padding: 0 1.5rem 0.8rem;
`;

const Tab = styled.button`
  padding: 7px 18px;
  border-radius: 99px;
  border: none;
  background: ${({ $active }) => ($active ? "#fff" : "#F6F8FA")};
  color: ${({ $active }) => ($active ? "#111" : "#555")};
  font-size: 0.85em;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
`;


// ── Search ────────────────────────────────────────────────────────────────────
const SearchRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0.85rem 1.5rem;
  @media (max-width: 480px) {
    padding: 0.75rem 1rem;
  }
`;

const SearchBar = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: #f5f6f8;
  border-radius: 99px;
  padding: 0.75rem 1rem;
  .icon {
    color: #aaa;
    font-size: 1.1em;
    flex-shrink: 0;
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
  font-size: 1em;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  &:hover {
    color: #555;
  }
`;

const FilterBtn = styled.button`
  position: relative;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: none;
  background: ${(p) => (p.$active ? "rgba(239,90,66,0.12)" : "#F5F6F8")};
  color: ${(p) => (p.$active ? "#EF5A42" : "#555")};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95em;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.2s;
  &:hover {
    background: #eceef2;
  }
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

// ── Search dropdown ───────────────────────────────────────────────────────────
const Dropdown = styled.div`
  position: fixed;
  z-index: 999999;
  background: #fff;
  border-radius: 16px;
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

// ── Filter modal ──────────────────────────────────────────────────────────────
const FilterBackdrop = styled.div`
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
  &:hover {
    opacity: 0.9;
  }
`;

// ── Feed ──────────────────────────────────────────────────────────────────────
const Feed = styled.main`
  max-width: 1400px;
  margin: 0 auto;
  padding: 0.5rem 1.5rem 2rem;
  @media (max-width: 480px) {
    padding: 0.5rem 1rem 2rem;
  }
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
  border-radius: 30px;
  border: 2.5px solid transparent;
  overflow: hidden;
  width: 100%;
  cursor: pointer;
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
    padding: 1.4rem;
    min-height: 140px;
    background: #fff8e7;
    border-color: #f5c842;
    .note_paper {
      background: #fff;
      border-radius: 10px;
      padding: 0.85rem 0.85rem 2.5rem;
      min-height: 90px;
    }
    .note_title {
      font-size: 0.82em;
      font-weight: 600;
      margin: 0 0 0.3rem;
      color: #333;
    }
    .note_body {
      font-size: 0.78em;
      color: #555;
      margin: 0 0 0.4rem;
      line-height: 1.5;
    }
    .note_body_empty {
      color: #bbb;
      font-style: italic;
    }
    .note_sign {
      font-size: 0.78em;
      color: #888;
      margin: 0;
    }
  }
`;

const MultiIndicator = styled.div`
  position: absolute;
  bottom: 10px;
  left: 10px;
  z-index: 3;
  color: #fff;
  font-size: 1em;
  filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.5));
`;

const PrivateBadge = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 3;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(6px);
  color: #fff;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.78em;
`;

const AudioOuter = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 4/3;
  background: #FDDDD7;
  border-radius: 30px;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  .ripple {
    position: absolute;
    top: 50%;
    left: 50%;
    border-radius: 50%;
    background: rgba(201, 79, 56, 0.12);
    transform: translate(-50%, -50%) scale(0);
    animation: ${audioRipple} 3s ease-out infinite both;
  }
  .ripple:nth-child(1) { width: 160%; padding-top: 160%; animation-delay: 0s; }
  .ripple:nth-child(2) { width: 110%; padding-top: 110%; animation-delay: 1s; }
  .ripple:nth-child(3) { width: 60%; padding-top: 60%; animation-delay: 2s; }

  .mic_center {
    position: relative;
    z-index: 2;
    width: 46px;
    height: 46px;
    border-radius: 50%;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .mic_icon {
    font-size: 1.1em;
    color: #C94F38;
  }
`;

const SkeletonWrap = styled.div`
  border-radius: 16px;
  height: ${({ $tall }) => ($tall ? "240px" : "160px")};
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

// ── Settings panel ────────────────────────────────────────────────────────────
const SettingsBackdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 300;
  background: rgba(0, 0, 0, 0.35);
  animation: ${fadeIn} 0.2s ease forwards;
`;

const SettingsPanel = styled.aside`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 301;
  width: min(400px, 100vw);
  background: #fff;
  overflow-y: auto;
  padding: 0 0 3rem;
  animation: ${slideIn} 0.25s ease forwards;
`;

const SettingsHeader = styled.div`
  padding: 1.4rem 1.5rem 1rem;
  border-bottom: 1px solid #f0f0f0;
  .back_btn {
    background: none;
    border: none;
    font-size: 1.05em;
    font-weight: 700;
    color: #111;
    cursor: pointer;
    padding: 0;
    display: flex;
    align-items: center;
    gap: 4px;
  }
`;

const SettingsSection = styled.div`
  padding: 1.2rem 1.5rem 0;
`;

const SectionTitle = styled.h3`
  font-size: 1em;
  font-weight: 800;
  color: #111;
  margin: 0 0 1rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 0.6rem;
`;

const StatCard = styled.div`
  background: #f5f6f8;
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  .label {
    font-size: 0.72em;
    color: #888;
  }
  .value {
    font-size: 1.15em;
    font-weight: 800;
    color: #111;
  }
`;

const SettingsRow = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f5f6f8;
  border: none;
  border-radius: 12px;
  padding: 14px 16px;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
  &:hover {
    background: #eceef2;
  }
  .row_icon {
    font-size: 1em;
    color: #555;
  }
  .row_label {
    flex: 1;
    font-size: 0.9em;
    font-weight: 500;
    color: #111;
  }
  .row_arrow {
    font-size: 0.85em;
    color: #aaa;
  }
`;

// ── Edit username modal ───────────────────────────────────────────────────────
const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 400;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
`;

const ModalCard = styled.div`
  background: #fff;
  border-radius: 20px;
  width: min(380px, 100%);
  padding: 28px 24px 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  animation: ${modalPop} 0.18s ease forwards;
`;

const ModalTitle = styled.h3`
  font-size: 1.05em;
  font-weight: 700;
  color: #111;
  margin: 0;
`;
const UsernameInput = styled.input`
  width: 100%;
  padding: 12px 14px;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  font-size: 0.92em;
  color: #111;
  outline: none;
  transition: border-color 0.15s;
  &:focus {
    border-color: #e05a42;
  }
`;
const FieldError = styled.p`
  font-size: 0.8em;
  color: #e05a42;
  margin: 0;
`;
const ModalBtns = styled.div`
  display: flex;
  gap: 10px;
  button {
    flex: 1;
  }
`;
const CancelBtnModal = styled.button`
  padding: 13px;
  background: #f5f6f8;
  color: #333;
  border: none;
  border-radius: 99px;
  font-size: 0.9em;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
  &:hover {
    background: #eceef2;
  }
`;
const SaveBtn = styled.button`
  padding: 13px;
  background: #e05a42;
  color: #fff;
  border: none;
  border-radius: 99px;
  font-size: 0.9em;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
  &:hover:not(:disabled) {
    opacity: 0.88;
  }
`;

export default ProfilePage;
