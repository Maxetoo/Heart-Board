import React, { useEffect, useState, useCallback } from "react";
import styled, { keyframes } from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  BsMicFill,
  BsPlayFill,
  BsEye,
  BsChevronLeft,
  BsPersonX,
} from "react-icons/bs";
import {
  getPublicProfile,
  clearPublicProfile,
} from "../../slices/userSlice";
import { getHashtagBoards } from "../../slices/boardSlice";
import { URL } from "../../paths/url";
import NavComponent from "../../components/global/NavComponent";
import CanvasRenderer from "../../canvas/CanvasRenderer";
import BoardViewModal from "../../components/message/BoardViewModel";
import DefaultAvatar from "../../assets/Vector.svg";
import { userProfileFirstMsgCache } from "../../utils/msgCache";

const EmblemCard = ({ msg, isMulti, onClick }) => (
  <CardWrap onClick={onClick}>
    <CanvasRenderer canvasData={msg.canvasData} />
    {isMulti && (
      <MultiIndicator>
        <BsPlayFill />
      </MultiIndicator>
    )}
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
      {isMulti && (
        <MultiIndicator>
          <BsPlayFill />
        </MultiIndicator>
      )}
    </CardWrap>
  );
};

const AudioCard = ({ isMulti, onClick }) => (
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
  </AudioOuter>
);

const NoteCard = ({ board, isMulti, onClick }) => (
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
    </div>
    {isMulti && (
      <MultiIndicator>
        <BsPlayFill />
      </MultiIndicator>
    )}
  </CardWrap>
);

const BoardCard = ({ board, msg, onOpen }) => {
  const isMulti = (board.stats?.messages ?? 0) > 1;
  const type = msg?.type;
  const open = () => onOpen(board);

  if (type === "emblem" && msg?.canvasData)
    return <EmblemCard msg={msg} isMulti={isMulti} onClick={open} />;
  if (type === "audio") return <AudioCard isMulti={isMulti} onClick={open} />;
  if (msg?.content?.imageUrls?.[0])
    return <StackCard msg={msg} isMulti={isMulti} onClick={open} />;
  return <NoteCard board={board} isMulti={isMulti} onClick={open} />;
};

// ─── Main page ────────────────────────────────────────────────────────────────

const UserProfilePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { username } = useParams();

  const {
    myProfile,
    publicProfile,
    publicProfileBoards: boards,
    publicProfileLoad,
    publicProfileError,
    publicProfileErrorMsg,
    publicProfileNotFound,
  } = useSelector((s) => s.user);

  const currentUserId = myProfile?._id?.toString();

  const [activeTab, setActiveTab] = useState("boards");
  const [firstMessages, setFirstMessages] = useState(() => ({
    ...userProfileFirstMsgCache,
  }));
  const [activeBoard, setActiveBoard] = useState(null);
  const [hashtagBoards, setHashtagBoards] = useState([]);
  const [hashtagLoad, setHashtagLoad] = useState(false);
  const [isHashtagProfile, setIsHashtagProfile] = useState(false);

  const isOwnProfile = !!(
    currentUserId && publicProfile?._id?.toString() === currentUserId
  );

  // ── Fetch on mount and tab switch ─────────────────────────────────────────
  useEffect(() => {
    if (!username) return;
    setFirstMessages({ ...userProfileFirstMsgCache });
    setIsHashtagProfile(false);
    dispatch(
      getPublicProfile({
        username,
        view: activeTab === "tagged" ? "tagged" : "owned",
      }),
    );
  }, [dispatch, username, activeTab]);

  // ── If user not found, try as hashtag profile ─────────────────────────────
  useEffect(() => {
    if (!publicProfileNotFound) return;
    setIsHashtagProfile(true);
    setHashtagLoad(true);
    dispatch(getHashtagBoards({ tag: username.toLowerCase() }))
      .unwrap()
      .then(res => { setHashtagBoards(res.response?.boards ?? []); })
      .catch(() => { setHashtagBoards([]); })
      .finally(() => setHashtagLoad(false));
  }, [publicProfileNotFound, username, dispatch]);


  useEffect(
    () => () => {
      dispatch(clearPublicProfile());
    },
    [dispatch],
  );

  // ── Fetch first message per board card ────────────────────────────────────
  useEffect(() => {
    if (!boards.length) {
      setFirstMessages({});
      return;
    }
    // Populate state from cache for boards already fetched
    const cached = {};
    boards.forEach((b) => {
      if (b._id in userProfileFirstMsgCache)
        cached[b._id] = userProfileFirstMsgCache[b._id];
    });
    if (Object.keys(cached).length)
      setFirstMessages((prev) => ({ ...prev, ...cached }));

    const toFetch = boards.filter((b) => !(b._id in userProfileFirstMsgCache));
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
          userProfileFirstMsgCache[r.value.boardId] = r.value.message;
          updates[r.value.boardId] = r.value.message;
        }
      });
      setFirstMessages((prev) => ({ ...prev, ...updates }));
    });
  }, [boards]);

  // ── Fetch first message per hashtag board card ────────────────────────────
  useEffect(() => {
    if (!hashtagBoards.length) return;
    const cached = {};
    hashtagBoards.forEach((b) => {
      if (b._id in userProfileFirstMsgCache)
        cached[b._id] = userProfileFirstMsgCache[b._id];
    });
    if (Object.keys(cached).length)
      setFirstMessages((prev) => ({ ...prev, ...cached }));

    const toFetch = hashtagBoards.filter((b) => !(b._id in userProfileFirstMsgCache));
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
          userProfileFirstMsgCache[r.value.boardId] = r.value.message;
          updates[r.value.boardId] = r.value.message;
        }
      });
      setFirstMessages((prev) => ({ ...prev, ...updates }));
    });
  }, [hashtagBoards]);

  // ── Handlers ──────────────────────────────────────────────────────────────
const handleSendAppreciation = useCallback(() => {
    if (publicProfile?.username) {
      navigate(`/create?mention=${publicProfile.username}`);
    }
  }, [publicProfile, navigate]);

  const fmtCount = (n) => {
    if (!n && n !== 0) return "0";
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
    return String(n);
  };

  const isTall = (i) => i % 5 === 0 || i % 5 === 3;

  // ── Loading ───────────────────────────────────────────────────────────────
  if (publicProfileLoad && !publicProfile) {
    return (
      <Page>
        <Header>
          <button className="back_btn" onClick={() => navigate(-1)}>
            <BsChevronLeft />
          </button>
          <div className="header_profile">
            <span className="header_username">Profile</span>
          </div>
          <div style={{ width: 36 }} />
        </Header>
        <LoadingWrap>
          <Spinner />
        </LoadingWrap>
        <NavComponent />
      </Page>
    );
  }

  // ── Hashtag profile ───────────────────────────────────────────────────────
  if (isHashtagProfile) {
    const filtered = hashtagBoards.filter(b => b._id in firstMessages)
    const totalBoards = hashtagBoards.length
    const totalMessages = hashtagBoards.reduce((sum, b) => sum + (b.stats?.messages ?? 0), 0)
    const totalCurators = new Set(hashtagBoards.map(b => b.owner?._id).filter(Boolean)).size
    return (
      <Page>
        <Header>
          <button className="back_btn" onClick={() => navigate(-1)}><BsChevronLeft /></button>
          <span className="header_username">Profile</span>
          <div style={{ width: 36 }} />
        </Header>
        <Hero>
          <AvatarWrap>
            <img src={DefaultAvatar} alt="avatar" style={{ width: "83px", height: "83px", objectFit: "contain" }} />
          </AvatarWrap>
          <HeroInfo>
            <HeroUsername>#{username}</HeroUsername>
            <StatsRow>
              <span className="stat">{fmtCount(totalBoards)} Board</span>
              <span className="divider">|</span>
              <span className="stat">{fmtCount(totalMessages)} Message</span>
              <span className="divider">|</span>
              <span className="stat">{fmtCount(totalCurators)} Curator</span>
            </StatsRow>
            <HeroBtns>
              <SendBtn onClick={() => navigate(`/create?mention=%23${username}`)}>Create Board</SendBtn>
            </HeroBtns>
          </HeroInfo>
        </Hero>
        <Feed>
          {hashtagLoad ? (
            <MasonryGrid>
              {[...Array(6)].map((_, i) => <GridItem key={i}><SkeletonWrap $tall={isTall(i)} /></GridItem>)}
            </MasonryGrid>
          ) : filtered.length === 0 ? (
            <EmptyMsg>No boards yet for #{username}.</EmptyMsg>
          ) : (
            <MasonryGrid>
              {filtered.map(board => (
                <GridItem key={board._id}>
                  <BoardCard board={board} msg={firstMessages[board._id]} onOpen={setActiveBoard} />
                </GridItem>
              ))}
            </MasonryGrid>
          )}
        </Feed>
        <NavComponent />
        {activeBoard && (() => {
          const idx = hashtagBoards.findIndex(b => b._id === activeBoard._id)
          return (
            <BoardViewModal
              board={activeBoard}
              onClose={() => setActiveBoard(null)}
              onPrev={idx > 0 ? () => setActiveBoard(hashtagBoards[idx - 1]) : undefined}
              onNext={idx < hashtagBoards.length - 1 ? () => setActiveBoard(hashtagBoards[idx + 1]) : undefined}
            />
          )
        })()}
      </Page>
    )
  }

  // ── Real user not found ───────────────────────────────────────────────────
  if (publicProfileError && !publicProfile && !isHashtagProfile) {
    return (
      <Page>
        <Header>
          <button className="back_btn" onClick={() => navigate(-1)}><BsChevronLeft /></button>
          <span className="header_username">Profile</span>
          <div style={{ width: 36 }} />
        </Header>
        <NotFoundWrap>
          <BsPersonX className="icon" />
          <h2>Something went wrong</h2>
          <p>{publicProfileErrorMsg || "Unable to load this profile."}</p>
          <GoHomeBtn onClick={() => navigate("/")}>Go to Home</GoHomeBtn>
        </NotFoundWrap>
        <NavComponent />
      </Page>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <Page>
      <Header>
        <button className="back_btn" onClick={() => navigate(-1)}>
          <BsChevronLeft />
        </button>
        <span className="header_username">Profile</span>
        <div style={{ width: 36 }} />
      </Header>

      {/* Hero */}
      <Hero>
        <AvatarWrap>
          {publicProfile?.profileImage ? (
            <img src={publicProfile.profileImage} alt="avatar" />
          ) : (
            <img
              src={DefaultAvatar}
              alt="avatar"
              style={{ width: "83px", height: "83px", objectFit: "contain" }}
            />
          )}
        </AvatarWrap>
        <HeroInfo>
          <HeroUsername>@{publicProfile?.username ?? username}</HeroUsername>
          <StatsRow>
            <span className="stat">{fmtCount(publicProfile?.stats?.totalBoards)} Board</span>
            <span className="divider">|</span>
            <span className="stat">{fmtCount(publicProfile?.stats?.totalMessages)} Message</span>
            <span className="divider">|</span>
            <span className="stat">{fmtCount(publicProfile?.stats?.totalCurators)} Curator</span>
          </StatsRow>
          {!isOwnProfile && (
            <HeroBtns>
              <SendBtn onClick={handleSendAppreciation}>Create Board</SendBtn>
            </HeroBtns>
          )}
        </HeroInfo>
      </Hero>

      {/* Tabs */}
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

      {/* Grid */}
      {(() => {
        const msgsSettled =
          boards.length === 0 || boards.every((b) => b._id in firstMessages);
        const filtered = boards.filter((b) => b._id in firstMessages);
        return (
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
              <EmptyMsg>No boards yet.</EmptyMsg>
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
        );
      })()}

      <NavComponent />

      {activeBoard &&
        (() => {
          const idx = boards.findIndex((b) => b._id === activeBoard._id);
          return (
            <BoardViewModal
              board={activeBoard}
              onClose={() => setActiveBoard(null)}
              onPrev={
                idx > 0 ? () => setActiveBoard(boards[idx - 1]) : undefined
              }
              onNext={
                idx < boards.length - 1
                  ? () => setActiveBoard(boards[idx + 1])
                  : undefined
              }
            />
          );
        })()}
    </Page>
  );
};

// ─── Keyframes ────────────────────────────────────────────────────────────────
const shimmer = keyframes`0%{background-position:-200% 0}100%{background-position:200% 0}`;
const spinAnim = keyframes`to{transform:rotate(360deg)}`;
const fadeUp = keyframes`from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}`;
const audioRipple = keyframes`
  0%   { transform: translate(-50%, -50%) scale(0); opacity: 0.8; }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
`;

// ─── Styled components ────────────────────────────────────────────────────────

const Page = styled.div`
  min-height: 100vh;
  background: #fff;
  padding-bottom: 5rem;
`;

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

const LoadingWrap = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 60vh;
`;

const Spinner = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 3px solid #f0f0f0;
  border-top-color: #e05a42;
  animation: ${spinAnim} 0.75s linear infinite;
`;

const NotFoundWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
  padding: 2rem;
  text-align: center;
  gap: 10px;
  .icon {
    font-size: 3.5em;
    color: #d1d5db;
    margin-bottom: 8px;
  }
  h2 {
    font-size: 1.25em;
    font-weight: 800;
    color: #111;
    margin: 0;
  }
  p {
    font-size: 0.88em;
    color: #888;
    margin: 0;
  }
`;

const GoHomeBtn = styled.button`
  margin-top: 8px;
  padding: 11px 28px;
  background: #111;
  color: #fff;
  border: none;
  border-radius: 99px;
  font-size: 0.9em;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
  &:hover {
    opacity: 0.85;
  }
`;

const Hero = styled.section`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 1.5rem 1.5rem 0.8rem;
  gap: 16px;
  animation: ${fadeUp} 0.3s ease forwards;
`;

const HeroInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
`;

const AvatarWrap = styled.div`
  position: relative;
  width: 110px;
  height: 110px;
  border-radius: 50%;
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
`;

const HeroUsername = styled.h2`
  font-size: 1.1em;
  font-weight: 700;
  color: #111;
  margin: 0;
`;

const HeroBtns = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 4px;
`;

const SendBtn = styled.button`
  background: var(--primary-color, #ef5a42);
  color: #fff;
  border: none;
  border-radius: 99px;
  padding: 11px 28px;
  font-size: 0.9em;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.15s;
  &:hover {
    opacity: 0.85;
  }
`;

const LikeBtn = styled.button`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #111;
  color: ${({ $liked }) => ($liked ? "#E05A42" : "#fff")};
  border: none;
  font-size: 1.15em;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;
  &:disabled {
    opacity: 0.45;
    cursor: default;
  }
  &:hover:not(:disabled) {
    background: #333;
  }
`;

const StatsRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  .stat {
    font-size: 0.82em;
    color: #555;
    font-weight: 500;
    white-space: nowrap;
  }
  .divider {
    color: #d1d5db;
    font-size: 0.8em;
  }
`;

const TabRow = styled.div`
  display: flex;
  gap: 8px;
  padding: 0.6rem 1.5rem 0.8rem;
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


const Feed = styled.main`
  max-width: 1400px;
  margin: 0 auto;
  padding: 0.8rem 1.5rem 2rem;
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
    min-height: 130px;
    background: #fff8e7;
    border-color: #f5c842;
    .note_paper {
      background: #fff;
      border-radius: 10px;
      padding: 0.85rem 0.85rem 2rem;
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
      margin: 0;
      line-height: 1.5;
    }
    .note_body_empty {
      color: #bbb;
      font-style: italic;
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

export default UserProfilePage;
