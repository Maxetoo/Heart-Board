import React, { useState, useCallback, useRef } from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import {
  BsX,
  BsPencil,
  BsMic,
  BsCameraVideo,
  BsImage,
  BsTypeBold,
  BsBezier2,
  BsPalette2,
  BsBorderOuter,
  BsCheck2,
  BsCheckCircleFill,
  BsPlayFill,
  BsPauseFill,
} from "react-icons/bs";

import { PiPerspective } from "react-icons/pi";
import { postMessage } from "../../slices/messageSlice";
import { uploadFile } from "../../slices/uploadSlice";

import ImageModal from "../../modals/ImageModal";
import TextModal from "../../modals/TextModal";
import VectorModal from "../../modals/VectorModal";
import EditVectorModal from "../../modals/EditVectorModal";
import BgModal from "../../modals/BgModal";
import FrameModal from "../../modals/FrameModal";
import DraggableCanvasItem from "../../canvas/DraggableCanvasItem";
import AudioTab from "../../tab/AudioTab";

const CreateMessagePage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const canvasRef = useRef(null);

  const { postMessageLoad } = useSelector((s) => s.message);
  const { imageUploadLoad, audioUploadLoad } = useSelector((s) => s.upload);

  // ── canvas state 
  const [activeTab, setActiveTab] = useState("text");
  const [aspectRatio, setAspectRatio] = useState(() =>
    Math.random() < 0.5 ? "portrait" : "landscape",
  );
  const [activeModal, setActiveModal] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  const [canvasBg, setCanvasBg] = useState(null);
  const [canvasImage, setCanvasImage] = useState(null);
  const [imageSize, setImageSize] = useState(80);
  const [imagePosition, setImagePosition] = useState({ x: 50, y: 50 });
  const [canvasText, setCanvasText] = useState(null);
  const [canvasVector, setCanvasVector] = useState(null);
  const DEFAULT_FRAME = {
    style: "solid",
    thickness: 25,
    radius: 30,
    color: "#111111",
    border: "25px solid #111111",
    borderRadius: "30px",
  };
  const [canvasFrame, setCanvasFrame] = useState(DEFAULT_FRAME);

  // ── preview / post state 
  const [showPreview, setShowPreview] = useState(false);
  const [canvasSnapshot, setCanvasSnapshot] = useState(null);
  const [pendingCanvasFile, setPendingCanvasFile] = useState(null);
  const [pendingAudioFile, setPendingAudioFile] = useState(null);
  const [pendingAudioURL, setPendingAudioURL] = useState(null);
  const [pendingAudioName, setPendingAudioName] = useState(null);
  const [postError, setPostError] = useState("");
  const [postSuccess, setPostSuccess] = useState(false);

  // ── derived
  const tabs = [
    { id: "text", label: "Text", icon: <BsPencil /> },
    { id: "audio", label: "Audio", icon: <BsMic /> },
    { id: "video", label: "Video", icon: <BsCameraVideo /> },
  ];
  const tools = [
    { id: "image", label: "Image", icon: <BsImage /> },
    { id: "text", label: "Text", icon: <BsTypeBold /> },
    { id: "vector", label: "Vector", icon: <BsBezier2 /> },
    { id: "bg", label: "BG", icon: <BsPalette2 /> },
    { id: "frame", label: "Frame", icon: <BsBorderOuter /> },
  ];

  const hasContent =
    canvasBg || canvasImage || canvasText || canvasVector || canvasFrame;
  const VectorIcon = canvasVector?.icon;
  const canvasStyle = { background: canvasBg ? canvasBg.value : "#F9FAFB" };
  const isPosting = postMessageLoad || imageUploadLoad || audioUploadLoad;

  const handleToolClick = (toolId) =>
    setActiveModal(toolId === "vector" && canvasVector ? "editVector" : toolId);

  // ── canvas capture 
  const captureCanvasAsFile = useCallback(async () => {
    if (!canvasRef.current) throw new Error("Canvas element not found");
    const html2canvas = (await import("html2canvas")).default;
    const uiOnly = canvasRef.current.querySelectorAll(
      ".drag_hint, .remove_image_btn, .image_resize_bar",
    );
    uiOnly.forEach((el) => {
      el.style.visibility = "hidden";
    });
    let canvasEl;
    try {
      canvasEl = await html2canvas(canvasRef.current, {
        useCORS: true,
        allowTaint: false,
        backgroundColor: null,
        scale: 2,
        logging: false,
      });
    } finally {
      uiOnly.forEach((el) => {
        el.style.visibility = "";
      });
    }
    return new Promise((resolve, reject) => {
      canvasEl.toBlob(
        (blob) =>
          blob
            ? resolve(
                new File([blob], `canvas_${Date.now()}.png`, {
                  type: "image/png",
                }),
              )
            : reject(new Error("Canvas toBlob failed")),
        "image/png",
        0.95,
      );
    });
  }, []);

  // ── handlePost
  const handlePost = useCallback(async () => {
    setPostError("");
    try {
      // Audio branch
      if (pendingAudioFile) {
        const uploadResult = await dispatch(
          uploadFile({ file: pendingAudioFile, type: "audio" }),
        ).unwrap();
        if (uploadResult.status !== "success") {
          setPostError(uploadResult.response?.message || "Audio upload failed");
          return;
        }
        const audioUrl =
          uploadResult.response.url || uploadResult.response.secure_url;
        const publicId = uploadResult.response.public_id;

        const msgResult = await dispatch(
          postMessage({
            slug,
            type: "audio",
            content: { audioUrl, duration: null, text: null, imageUrls: [] },
            cloudinaryPublicId: publicId,
            fileType: "audio",
          }),
        ).unwrap();
        if (msgResult.status !== "success") {
          setPostError(msgResult.response?.message || "Failed to post message");
          return;
        }
        setPostSuccess(true);
        return;
      }

      // Canvas / emblem branch
      if (!hasContent) {
        setPostError("Add something to your canvas first.");
        return;
      }
      if (!pendingCanvasFile) {
        setPostError("Preview render missing. Please close and try again.");
        return;
      }

      const uploadResult = await dispatch(
        uploadFile({ file: pendingCanvasFile, type: "image" }),
      ).unwrap();
      if (uploadResult.status !== "success") {
        setPostError(uploadResult.response?.message || "Image upload failed");
        return;
      }
      const renderedImageUrl =
        uploadResult.response.url || uploadResult.response.secure_url;
      const publicId = uploadResult.response.public_id;

      const msgResult = await dispatch(
        postMessage({
          slug,
          type: "emblem",
          content: {
            text: canvasText?.content || null,
            font: canvasText?.font?.family || null,
            color: canvasText?.color || null,
            background: canvasBg?.value || null,
            frame: canvasFrame
              ? `${canvasFrame.thickness}px ${canvasFrame.style} ${canvasFrame.color}`
              : null,
            imageUrls: renderedImageUrl ? [renderedImageUrl] : [],
            vectorKey: canvasVector?.id || null,
            audioUrl: null,
            duration: null,
          },
          cloudinaryPublicId: publicId,
          fileType: "image",
        }),
      ).unwrap();

      if (msgResult.status !== "success") {
        setPostError(msgResult.response?.message || "Failed to post message");
        return;
      }
      setPostSuccess(true);
    } catch {
      setPostError("Something went wrong. Please try again.");
    }
  }, [
    dispatch,
    slug,
    hasContent,
    pendingCanvasFile,
    pendingAudioFile,
    canvasText,
    canvasBg,
    canvasFrame,
    canvasVector,
  ]);

  const closePreview = () => {
    setShowPreview(false);
    setPostError("");
    setPendingCanvasFile(null);
    setCanvasSnapshot(null);
    setPendingAudioFile(null);
    setPendingAudioURL(null);
    setPendingAudioName(null);
  };

  if (postSuccess) {
    return (
      <Wrapper>
        <SuccessCard>
          <BsCheckCircleFill className="success_icon" />
          <h2>Message Posted!</h2>
          <p>Your message has been added to the board.</p>
          <button
            className="done_btn"
            onClick={() => navigate(`/board/${slug}`)}
          >
            View Board
          </button>
        </SuccessCard>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      {/* Header */}
      <div className="page_header">
        <button className="close_btn" onClick={() => navigate(-1)}>
          <BsX />
        </button>
        <h2 className="page_title">Add Message</h2>
        <div className="tab_switcher">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab_btn ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="page_body">
        <div className="setup_outline">
          {/* Canvas tab */}
          {activeTab === "text" && (
            <>
              {/* Aspect ratio + canvas */}
              <div className="canvas_unit">
                <div className="aspect_header">
                  <span className="aspect_label">
                    <PiPerspective /> Aspect Ratio
                  </span>
                  <div className="ratio_toggles">
                    <button
                      className={`ratio_btn portrait_btn ${aspectRatio === "portrait" ? "active" : ""}`}
                      onClick={() => setAspectRatio("portrait")}
                      title="Portrait (3:4)"
                    >
                      {aspectRatio === "portrait" && <BsCheck2 />}
                    </button>
                    <button
                      className={`ratio_btn landscape_btn ${aspectRatio === "landscape" ? "active" : ""}`}
                      onClick={() => setAspectRatio("landscape")}
                      title="Landscape (4:3)"
                    >
                      {aspectRatio === "landscape" && <BsCheck2 />}
                    </button>
                  </div>
                </div>

                <div className="aspect_container">
                  <div className="canvas_wrap">
                    <CanvasArea
                      ref={canvasRef}
                      $ratio={aspectRatio}
                      style={{
                        ...canvasStyle,
                        ...(canvasFrame
                          ? {
                              border: canvasFrame.border,
                              borderRadius: canvasFrame.borderRadius,
                            }
                          : {}),
                      }}
                      data-canvas="true"
                      onClick={() => setSelectedItem(null)}
                    >
                      {canvasImage && (
                        <DraggableCanvasItem
                          position={imagePosition}
                          onPositionChange={setImagePosition}
                          selected={selectedItem === "image"}
                          onSelect={() => setSelectedItem("image")}
                          onTap={() => setActiveModal("image")}
                        >
                          <div style={{ position: "relative" }}>
                            <img
                              src={canvasImage}
                              alt="canvas"
                              className="canvas_image"
                              style={{
                                width: `${imageSize * 2}px`,
                                height: `${imageSize * 2}px`,
                              }}
                            />
                            <button
                              className="remove_image_btn"
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.stopPropagation();
                                setCanvasImage(null);
                                setImageSize(80);
                                setImagePosition({ x: 50, y: 50 });
                              }}
                            >
                              <BsX />
                            </button>
                            {selectedItem === "image" && (
                              <div
                                className="image_resize_bar"
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <input
                                  type="range"
                                  min="30"
                                  max="180"
                                  step="2"
                                  value={imageSize}
                                  onChange={(e) =>
                                    setImageSize(Number(e.target.value))
                                  }
                                />
                              </div>
                            )}
                          </div>
                        </DraggableCanvasItem>
                      )}

                      {canvasVector && VectorIcon && (
                        <DraggableCanvasItem
                          position={canvasVector.position}
                          onPositionChange={(pos) =>
                            setCanvasVector((prev) => ({
                              ...prev,
                              position: pos,
                            }))
                          }
                          selected={selectedItem === "vector"}
                          onSelect={() => setSelectedItem("vector")}
                          onTap={() => setActiveModal("editVector")}
                        >
                          <VectorIcon
                            style={{
                              color: canvasVector.color,
                              opacity: canvasVector.opacity,
                              fontSize: canvasVector.size ?? 48,
                              display: "block",
                            }}
                          />
                        </DraggableCanvasItem>
                      )}

                      {canvasText && (
                        <DraggableCanvasItem
                          position={canvasText.position}
                          onPositionChange={(pos) =>
                            setCanvasText((prev) => ({
                              ...prev,
                              position: pos,
                            }))
                          }
                          selected={selectedItem === "text"}
                          onSelect={() => setSelectedItem("text")}
                          onTap={() => setActiveModal("text")}
                        >
                          <p
                            style={{
                              margin: 0,
                              fontFamily: canvasText.font?.family,
                              color: canvasText.color,
                              fontSize: canvasText.fontSize ?? 16,
                              maxWidth: 200,
                              textAlign: "center",
                              lineHeight: 1.35,
                              wordBreak: "break-word",
                              ...canvasText.font?.style,
                            }}
                          >
                            {canvasText.content}
                          </p>
                        </DraggableCanvasItem>
                      )}
                    </CanvasArea>
                  </div>
                  {/* canvas_wrap */}
                </div>
                {/* aspect_container */}
              </div>
              {/* canvas_unit */}

              {/* Toolbar */}
              <div className="toolbar">
                {tools.map((tool) => (
                  <button
                    key={tool.id}
                    className="tool_btn"
                    onClick={() => handleToolClick(tool.id)}
                  >
                    {tool.icon}
                    <span>{tool.label}</span>
                  </button>
                ))}
              </div>

              {/* Send button */}
              <button
                className={`send_btn ${hasContent ? "ready" : ""}`}
                disabled={!hasContent}
                onClick={async () => {
                  if (!hasContent) return;
                  try {
                    const file = await captureCanvasAsFile();
                    setPendingCanvasFile(file);
                    setCanvasSnapshot(URL.createObjectURL(file));
                    setShowPreview(true);
                  } catch {
                    setPostError("Failed to render canvas. Please try again.");
                  }
                }}
              >
                {hasContent ? "Preview message" : "Preview"}
              </button>

              {postError && <ErrorMsg>{postError}</ErrorMsg>}
            </>
          )}

          {/* Audio tab */}
          {activeTab === "audio" && (
            <AudioTab
              onSend={(audioFile, audioName) => {
                setPendingAudioFile(audioFile);
                setPendingAudioURL(URL.createObjectURL(audioFile));
                setPendingAudioName(audioName);
                setShowPreview(true);
              }}
            />
          )}

          {/* Video tab — placeholder */}
          {activeTab === "video" && (
            <div
              style={{
                padding: "2rem 0",
                textAlign: "center",
                color: "#9CA3AF",
                fontSize: "0.9em",
              }}
            >
              Video messages coming soon
            </div>
          )}

          {/* Modals */}
          {activeModal === "image" && (
            <ImageModal
              onClose={() => setActiveModal(null)}
              currentImage={canvasImage}
              onConfirm={(src) => {
                setCanvasImage(src);
                setImagePosition({ x: 50, y: 50 });
                setImageSize(80);
                setActiveModal(null);
              }}
            />
          )}
          {activeModal === "text" && (
            <TextModal
              onClose={() => setActiveModal(null)}
              currentText={canvasText}
              onConfirm={(t) => {
                setCanvasText((prev) => ({
                  ...t,
                  position: prev?.position ?? { x: 50, y: 75 },
                }));
                setActiveModal(null);
              }}
            />
          )}
          {activeModal === "vector" && (
            <VectorModal
              onClose={() => setActiveModal(null)}
              onConfirm={(v) => {
                setCanvasVector({ ...v, size: 48, position: { x: 75, y: 20 } });
                setActiveModal(null);
              }}
            />
          )}
          {activeModal === "editVector" && canvasVector && (
            <EditVectorModal
              onClose={() => setActiveModal(null)}
              vector={canvasVector}
              onUpdate={(updates) =>
                setCanvasVector((prev) => ({ ...prev, ...updates }))
              }
              onRemove={() => {
                setCanvasVector(null);
                setActiveModal(null);
                setSelectedItem(null);
              }}
            />
          )}
          {activeModal === "bg" && (
            <BgModal
              onClose={() => setActiveModal(null)}
              currentBg={canvasBg}
              onConfirm={(bg) => {
                setCanvasBg(bg);
                setActiveModal(null);
              }}
            />
          )}
          {activeModal === "frame" && (
            <FrameModal
              onClose={() => setActiveModal(null)}
              currentFrame={canvasFrame}
              onConfirm={(frame) => {
                setCanvasFrame(frame);
                setActiveModal(null);
              }}
            />
          )}
        </div>
      </div>

      {/* ── Preview overlay ── */}
      {showPreview && (
        <PreviewOverlay>
          <PreviewCard>
            <div className="preview_header">
              <span className="preview_title">Preview</span>
              <button className="preview_close" onClick={closePreview}>
                <BsX />
              </button>
            </div>

            {/* Thumbnail */}
            {pendingAudioURL ? (
              <AudioPreview
                audioURL={pendingAudioURL}
                audioName={pendingAudioName}
              />
            ) : (
              <div className="snapshot_wrap">
                {canvasSnapshot && (
                  <img
                    src={canvasSnapshot}
                    alt="preview"
                    className="snapshot_img"
                  />
                )}
              </div>
            )}

            {postError && <p className="preview_error">{postError}</p>}

            <button
              className={`post_btn ${isPosting ? "loading" : ""}`}
              onClick={handlePost}
              disabled={isPosting}
            >
              {isPosting ? "Posting…" : "Post Message"}
            </button>
          </PreviewCard>
        </PreviewOverlay>
      )}
    </Wrapper>
  );
};

// ─── AudioPreview sub-component 


const AudioPreview = ({ audioURL, audioName }) => {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrent] = useState(0);

  const togglePlay = () => {
    if (!audioRef.current) return;
    playing ? audioRef.current.pause() : audioRef.current.play();
  };
  const fmt = (s) => {
    if (!s || isNaN(s)) return "0:00";
    return `${Math.floor(s / 60)}:${Math.floor(s % 60)
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <AudioThumb>
      <audio
        ref={audioRef}
        src={audioURL}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onTimeUpdate={() => setCurrent(audioRef.current?.currentTime || 0)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setCurrent(0);
        }}
      />
      <button className="play_btn" onClick={togglePlay}>
        {playing ? <BsPauseFill /> : <BsPlayFill />}
      </button>
      <div className="audio_meta">
        <span className="audio_label">{audioName || "Audio message"}</span>
        <span className="audio_dur">
          {fmt(currentTime)} / {fmt(duration)}
        </span>
      </div>
      <div className="progress_track">
        <div
          className="progress_fill"
          style={{
            width: duration ? `${(currentTime / duration) * 100}%` : "0%",
          }}
        />
      </div>
    </AudioThumb>
  );
};

// ─── Styled Components
const Wrapper = styled.div`
  width: 100vw;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #fcf9f8;

  .page_header {
    position: sticky;
    top: 0;
    z-index: 10;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1.5rem 1.5rem 0;
    background: var(--white-color, #fff);
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    box-sizing: border-box;
  }

  .close_btn {
    position: absolute;
    left: 1.5rem;
    top: 1rem;
    width: 36px;
    height: 36px;
    border: none;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2em;
    color: var(--text-color, #111);
    cursor: pointer;
    transition: color 0.2s;
    &:hover {
      color: var(--primary-color, #ef5a42);
    }
  }

  .page_title {
    font-size: 1.3em;
    font-weight: 700;
    color: var(--text-color, #111);
    margin: 0 0 1rem 0;
  }

  .tab_switcher {
    display: flex;
    gap: 3rem;
    margin-top: 1rem;
  }

  .tab_btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    padding: 0.5rem 0;
    width: 100px;
    border: none;
    background: transparent;
    color: var(--light-text-color, #6b7280);
    font-size: 0.95em;
    cursor: pointer;
    transition: color 0.2s;
    border-bottom: 2px solid transparent;
    &.active {
      color: var(--text-color, #111);
      font-weight: 600;
      border-bottom-color: var(--text-color, #111);
    }
    svg {
      font-size: 1.1em;
    }
  }

  .page_body {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem 1rem 4rem;
    overflow-y: auto;
  }

  .setup_outline {
    width: 100%;
    max-width: 480px;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .canvas_unit {
    display: flex;
    flex-direction: column;
  }

  .aspect_header {
    background: #f1e5df;
    border-radius: 12px 12px 0 0;
    padding: 0 1rem;
    height: 50px;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    .aspect_label {
      flex: 1;
      font-size: 0.95em;
      font-weight: 500;
      color: var(--text-color, #111);
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .ratio_toggles {
      display: flex;
      gap: 6px;
      align-items: center;
    }
    .ratio_btn {
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1.5px solid #eceff3;
      background: #fff;
      cursor: pointer;
      color: #10b981;
      font-size: 1em;
      border-radius: 5px;
      transition:
        border-color 0.2s,
        background 0.2s;
      &.portrait_btn {
        width: 24px;
        height: 36px;
      }
      &.landscape_btn {
        width: 40px;
        height: 26px;
      }
      &.active {
        border-color: #10b981;
        background: #fff;
      }
      &:hover:not(.active) {
        border-color: #d1d5db;
      }
    }
  }

  .aspect_container {
    background: #f7f0ed;
    border-radius: 0 0 12px 12px;
    overflow: hidden;
  }

  .canvas_wrap {
    display: flex;
    justify-content: center;
    padding: 0.75rem 3rem 1rem;
  }

  .toolbar {
    display: flex;
    gap: 6px;
    .tool_btn {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      padding: 0.6rem 0.25rem;
      background: #fff;
      border: 1.5px dashed #d1d5db;
      border-radius: 10px;
      color: var(--light-text-color, #6b7280);
      font-size: 0.75em;
      cursor: pointer;
      transition:
        border-color 0.2s,
        color 0.2s,
        background 0.2s;
      svg {
        font-size: 1.2em;
      }
      &:hover {
        border-color: var(--primary-color, #ef5a42);
        color: var(--primary-color, #ef5a42);
      }
      &.set {
        border-style: solid;
        border-color: var(--primary-color, #ef5a42);
        color: var(--primary-color, #ef5a42);
        background: rgba(239, 90, 66, 0.04);
      }
    }
  }

  .send_btn {
    width: 100%;
    height: 50px;
    border: none;
    border-radius: 25px;
    background: var(--primary-color, #ef5a42);
    color: #fff;
    font-size: 1em;
    font-weight: 600;
    cursor: not-allowed;
    opacity: 0.4;
    transition: opacity 0.2s;
    &.ready {
      opacity: 1;
      cursor: pointer;
      &:hover {
        opacity: 0.88;
      }
    }
  }

  @media only screen and (min-width: 768px) {
    .page_body {
      justify-content: flex-start;
    }
  }
`;

const CanvasArea = styled.div`
  aspect-ratio: ${({ $ratio }) => ($ratio === "landscape" ? "4 / 3" : "3 / 4")};
  width: ${({ $ratio }) => ($ratio === "landscape" ? "100%" : "82%")};
  border-radius: 30px;
  border: none;
  overflow: hidden;
  position: relative;
  transition:
    aspect-ratio 0.3s ease,
    width 0.3s ease;

  .canvas_image {
    display: block;
    object-fit: cover;
    border-radius: 6px;
    transition:
      width 0.08s,
      height 0.08s;
    pointer-events: none;
  }
  .remove_image_btn {
    position: absolute;
    top: -10px;
    right: -10px;
    z-index: 5;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.6);
    border: none;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.9em;
    cursor: pointer;
    &:hover {
      background: rgba(0, 0, 0, 0.85);
    }
  }
  .image_resize_bar {
    position: absolute;
    bottom: -28px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 5;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 99px;
    padding: 3px 10px;
    display: flex;
    align-items: center;
    input[type="range"] {
      width: 80px;
      height: 3px;
      accent-color: #fff;
      cursor: pointer;
    }
  }
`;

const PreviewOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
`;

const PreviewCard = styled.div`
  background: #fff;
  border-radius: 20px;
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.25rem;
  max-height: 90vh;
  overflow-y: auto;

  .preview_header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    .preview_title {
      font-size: 1em;
      font-weight: 700;
      color: var(--text-color, #111);
    }
    .preview_close {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 1.5px solid #eceff3;
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1em;
      cursor: pointer;
      color: var(--text-color, #111);
      &:hover {
        border-color: var(--primary-color, #ef5a42);
        color: var(--primary-color, #ef5a42);
      }
    }
  }

  .snapshot_wrap {
    width: 100%;
    aspect-ratio: 1 / 1;
    border-radius: 12px;
    overflow: hidden;
    border: 1.5px solid #eceff3;
    background: #f3f4f6;
    .snapshot_img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }
  }

  .preview_error {
    font-size: 0.83em;
    color: #ef5a42;
    margin: 0;
    text-align: center;
  }

  .post_btn {
    width: 100%;
    height: 52px;
    border: none;
    border-radius: 26px;
    background: var(--primary-color, #ef5a42);
    color: #fff;
    font-size: 1em;
    font-weight: 700;
    cursor: pointer;
    transition: opacity 0.2s;
    &:hover {
      opacity: 0.88;
    }
    &.loading {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
`;

const AudioThumb = styled.div`
  width: 100%;
  border-radius: 12px;
  border: 1.5px solid #eceff3;
  background: #f9fafb;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem 1.5rem;
  box-sizing: border-box;

  .play_btn {
    width: 68px;
    height: 68px;
    border-radius: 50%;
    border: none;
    background: var(--primary-color, #ef5a42);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.8em;
    cursor: pointer;
    padding-left: 4px;
    transition: transform 0.15s;
    &:hover {
      transform: scale(1.06);
    }
    svg {
      display: block;
    }
  }
  .audio_meta {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }
  .audio_label {
    font-size: 0.88em;
    font-weight: 500;
    color: var(--text-color, #111);
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .audio_dur {
    font-size: 0.82em;
    font-variant-numeric: tabular-nums;
    color: #9ca3af;
  }
  .progress_track {
    width: 100%;
    height: 4px;
    border-radius: 2px;
    background: #e5e7eb;
    overflow: hidden;
  }
  .progress_fill {
    height: 100%;
    border-radius: 2px;
    background: var(--primary-color, #ef5a42);
    transition: width 0.25s linear;
  }
`;

const SuccessCard = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 3rem 1.5rem;
  text-align: center;
  .success_icon {
    font-size: 3.5rem;
    color: #10b981;
  }
  h2 {
    margin: 0;
    font-size: 1.2em;
    font-weight: 700;
    color: var(--text-color, #111);
  }
  p {
    margin: 0;
    color: #6b7280;
    font-size: 0.9em;
    line-height: 1.5;
  }
  .done_btn {
    height: 50px;
    padding: 0 2rem;
    border: none;
    border-radius: 25px;
    background: var(--primary-color, #ef5a42);
    color: #fff;
    font-size: 1em;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s;
    &:hover {
      opacity: 0.88;
    }
  }
`;

const ErrorMsg = styled.p`
  font-size: 0.85em;
  color: #ef5a42;
  margin: 0;
  text-align: center;
`;

export default CreateMessagePage;
