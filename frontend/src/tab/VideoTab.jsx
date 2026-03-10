import React from 'react'
import styled from 'styled-components'
import { BsCameraFill } from 'react-icons/bs'

const VideoTab = () => (
  <VideoWrapper>
    <div className="coming_soon_icon"><BsCameraFill /></div>
    <h3 className="coming_soon_title">Video Messages</h3>
    <p className="coming_soon_desc">Record or upload a video message. Coming soon!</p>
  </VideoWrapper>
)

const VideoWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2.5rem 1rem;
  text-align: center;

  .coming_soon_icon {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: #F3F4F6;
    color: #9CA3AF;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.6em;
  }

  .coming_soon_title {
    font-size: 1em;
    font-weight: 700;
    color: var(--text-color, #111);
    margin: 0;
  }

  .coming_soon_desc {
    font-size: 0.9em;
    color: var(--light-text-color, #6B7280);
    margin: 0;
    max-width: 220px;
    line-height: 1.5;
  }
`

export default VideoTab