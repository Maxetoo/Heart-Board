import React, {useState} from 'react'
import styled from 'styled-components'
import { BsX, BsPencil, BsMic, BsCameraVideo } from 'react-icons/bs'
import { AiOutlineAudio } from "react-icons/ai";
import { PiPencilSimpleLineLight } from "react-icons/pi";

import { useSearchParams, useNavigate} from 'react-router-dom'
import useFonts from '../../hooks/UseFonts'
import PostCreationComponent from '../../components/message/PostCreationComponent'

const PostMessagePage = () => {
  const [activeTab, setActiveTab] = useState('text')
  const navigate = useNavigate()
  useFonts()
  const [searchParams] = useSearchParams()
  const mention = searchParams.get('mention') || null
  
  const tabs = [
    { id: 'audio', label: 'Audio', icon: <AiOutlineAudio /> },
    { id: 'text',  label: 'Text',  icon: <PiPencilSimpleLineLight /> },
    { id: 'video', label: 'Video', icon: <BsCameraVideo /> },
  ]

  return (
    <Wrapper>
      <div className="page_header">
        <button className="close_btn" onClick={() => navigate(-1)}><BsX /></button>
        <h2 className="page_title">
          {mention ? `Appreciate ${mention.startsWith('#') ? mention : `@${mention}`}` : 'Create Board'}
        </h2>
        <div className="tab_switcher">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab_btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}<span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="page_body">
        <PostCreationComponent type="board" initialMention={mention} activeTab={activeTab} />
      </div>
    </Wrapper>
  )
}

const Wrapper = styled.div`
  width: 100vw;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #FCF9F8;

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
    border-bottom: 1px solid rgba(0,0,0,0.06);
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
    transition: border-color 0.2s, color 0.2s;
    &:hover { border-color: var(--primary-color, #EF5A42); color: var(--primary-color, #EF5A42); }
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
    color: var(--light-text-color, #6B7280);
    font-size: 0.95em;
    cursor: pointer;
    transition: color 0.2s;
    border-bottom: 2px solid transparent;
    
    &.active {
      color: var(--text-color, #111);
      font-weight: 600;
      border-bottom-color: var(--text-color, #111);
    }
    
    svg { font-size: 1.1em; }
  }

  .page_body {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem 1rem 4rem;
    overflow-y: auto;
  }

  @media only screen and (min-width: 768px) {
    .page_body { justify-content: flex-start; }
  }
`

export default PostMessagePage