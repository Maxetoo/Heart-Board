import React, { useState, useRef, useEffect, useCallback } from 'react'
import styled from 'styled-components'
import { useDispatch, useSelector } from 'react-redux'
import { BsX, BsCheckCircleFill, BsExclamationCircleFill } from 'react-icons/bs'
import { checkUsername, receipentInputChange} from '../../slices/userSlice'
import { EVENTS } from '../../constants/messageConstant'


const TagInput = ({ onMentionChange, onTagsChange }) => {
  const dispatch = useDispatch()
  const { usernameCheckLoad, usernameAvailable } = useSelector(s => s.user)

  const [inputValue, setInputValue]     = useState('')
  const [tags, setTags]                 = useState([])
  const [suggestions, setSuggestions]   = useState([])
  const [suggestType, setSuggestType]   = useState(null)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionStatus, setMentionStatus] = useState(null) 

  const inputRef    = useRef(null)
  const wrapperRef  = useRef(null)
  const debounceRef = useRef(null)

  const hasMention = tags.some(t => t.type === 'user')

  // Notify parent of @mention change
  useEffect(() => {
    const mentionTag = tags.find(t => t.type === 'user')
    onMentionChange?.(mentionTag?.value ?? null)
  }, [tags, onMentionChange])

  useEffect(() => {
    const eventTags = tags
      .filter(t => t.type === 'event')
      .map(t => t.value.replace(/^#/, '').toLowerCase())
    onTagsChange?.(eventTags)
  }, [tags, onTagsChange])

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target))
        setSuggestions([])
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  
  useEffect(() => {
    if (!mentionQuery || usernameCheckLoad) return
    if (usernameAvailable === false) {
      setMentionStatus('found')
      setSuggestions([{ username: mentionQuery }])
    } else if (usernameAvailable === true) {
      setMentionStatus('notfound')
      setSuggestions([])
    }
    // intentionally omit mentionQuery — we only want this to fire
    // when the API response lands (usernameCheckLoad flips to false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usernameCheckLoad, usernameAvailable])

  const getLastWord = (val) => val.split(/\s+/).pop()

  const handleChange = (e) => {
    const val  = e.target.value
    setInputValue(val)
    const last = getLastWord(val)

    if (last.startsWith('@') && last.length > 1) {
      if (hasMention) { setSuggestions([]); setSuggestType(null); setMentionQuery(''); return }
      const q = last.slice(1).toLowerCase()
      setMentionQuery(q) 
      setSuggestType('user') 
      dispatch(receipentInputChange(val))


      // Need at least 3 characters before hitting the API
      if (q.length < 3) {
        setMentionStatus(null)
        setSuggestions([])
        return
      }

      setMentionStatus('checking')
      clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        dispatch(checkUsername({ username: q }))
      }, 400)
    } else if (last.startsWith('#') && last.length > 1) {
      const q = last.slice(1).toLowerCase()
      setSuggestions(EVENTS.filter(ev => ev.label.toLowerCase().includes(q)))
      setSuggestType('event')
      setMentionQuery('')
    } else {
      setSuggestions([])
      setSuggestType(null)
      setMentionQuery('')
      dispatch(receipentInputChange(""))
    }
  }

  const commitInput = useCallback((value) => {
    if (!value) return
    const type = value.startsWith('@') ? 'user' : value.startsWith('#') ? 'event' : 'plain'
    if (type === 'user' && hasMention) return
    // Block @mention unless API confirmed the user exists
    if (type === 'user' && mentionStatus !== 'found') return
    if (tags.find(t => t.value === value)) {
      setInputValue(''); setSuggestions([]); setSuggestType(null); setMentionQuery(''); return
    }
    setTags(prev => [...prev, { id: Date.now(), value, type }])
    setInputValue('')
    setSuggestions([])
    setSuggestType(null)
    setMentionQuery('')
  }, [hasMention, mentionStatus, tags])

  const handleKeyDown = (e) => {
    if ((e.key === ' ' || e.key === 'Enter') && inputValue.trim()) {
      e.preventDefault()
      commitInput(inputValue.trim())
    }
    if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      setTags(prev => prev.slice(0, -1))
    }
  }

  const removeTag  = (id)  => setTags(prev => prev.filter(t => t.id !== id))
  const pickUser   = (user) => { commitInput(`@${user.username}`); inputRef.current?.focus() }
  const pickEvent  = (ev)   => { commitInput(`#${ev.label}`);      inputRef.current?.focus() }

  const placeholder = tags.length === 0
    ? 'Send to: @username · #event tags'
    : hasMention ? 'Add #event tags...' : 'Add #event tags or @username'

  return (
    <TagInputWrapper ref={wrapperRef}>
      <div className="tag_field" onClick={() => inputRef.current?.focus()}>
        {tags.map((tag) => (
          <span key={tag.id} className={`tag_chip ${tag.type}`}>
            {tag.value}
            <button className="chip_remove" onClick={(e) => { e.stopPropagation(); removeTag(tag.id) }}>
              <BsX />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            const val = inputValue.trim()
            if (val && !val.startsWith('@')) commitInput(val)
          }}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="tag_bare_input"
        />
        {suggestType === 'user' && mentionQuery && (
          <span className="mention_status">
            {usernameCheckLoad && <span className="status_checking">checking…</span>}
            {!usernameCheckLoad && mentionStatus === 'found'    && <BsCheckCircleFill    className="status_found"    />}
            {!usernameCheckLoad && mentionStatus === 'notfound' && <BsExclamationCircleFill className="status_notfound" />}
          </span>
        )}
      </div>

      {tags.length > 0 && (
        <div className="tag_hint">
          {hasMention
            ? <span>✓ Recipient set · Add more <strong>#event</strong> tags</span>
            : <span>Type <strong>@username</strong> to set recipient · <strong>#tag</strong> for events</span>
          }
        </div>
      )}

      {suggestType === 'user' && mentionStatus === 'notfound' && mentionQuery && (
        <div className="tag_hint error_hint">No user found with username <strong>@{mentionQuery}</strong></div>
      )}

      {suggestions.length > 0 && (
        <SuggestionBox>
          {suggestType === 'user' && suggestions.map((user) => (
            <div key={user.username} className="suggestion_item" onMouseDown={(e) => { e.preventDefault(); pickUser(user) }}>
              <span className="s_avatar">👤</span>
              <div className="s_info">
                <span className="s_name">@{user.username}</span>
                <span className="s_sub">Tap to mention</span>
              </div>
              <BsCheckCircleFill className="s_check" />
            </div>
          ))}
          {suggestType === 'event' && suggestions.map((ev) => (
            <div key={ev.id} className="suggestion_item" onMouseDown={(e) => { e.preventDefault(); pickEvent(ev) }}>
              <span className="s_avatar s_emoji">{ev.emoji}</span>
              <div className="s_info">
                <span className="s_name">{ev.label}</span>
                <span className="s_sub">#{ev.label.toLowerCase()}</span>
              </div>
            </div>
          ))}
        </SuggestionBox>
      )}
    </TagInputWrapper>
  )
}

const TagInputWrapper = styled.div`
  position: relative;
  width: 100%;

  .tag_field {
    min-height: 50px;
    padding: 0.4rem 0.75rem;
    background: #F9FAFB;
    border: 1.5px solid #ECEFF3;
    border-radius: 10px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    cursor: text;
    transition: border-color 0.2s;
    box-sizing: border-box;
    &:focus-within { border-color: var(--primary-color, #EF5A42); background: #fff; }

    .tag_chip {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      padding: 3px 8px 3px 10px;
      border-radius: 99px;
      font-size: 0.82em;
      font-weight: 500;
      white-space: nowrap;
      line-height: 1;
      &.user  { background: rgba(59,130,246,0.1); color: #3B82F6; }
      &.event { background: rgba(239,90,66,0.1);  color: var(--primary-color, #EF5A42); }
      &.plain { background: #F3F4F6; color: var(--text-color, #111); }
      .chip_remove {
        border: none; background: transparent; cursor: pointer;
        display: flex; align-items: center; padding: 0;
        font-size: 0.95em; color: inherit; opacity: 0.55;
        &:hover { opacity: 1; }
      }
    }

    .tag_bare_input {
      flex: 1; min-width: 100px;
      border: none; background: transparent; outline: none;
      font-size: 0.92em; color: var(--text-color, #111); padding: 4px 0;
      &::placeholder { color: #9CA3AF; }
    }

    .mention_status {
      display: flex; align-items: center; font-size: 0.85em;
      .status_checking  { color: #9CA3AF; font-style: italic; font-size: 0.9em; }
      .status_found     { color: #10B981; }
      .status_notfound  { color: #EF5A42; }
    }
  }

  .tag_hint {
    margin-top: 5px;
    font-size: 0.76em;
    color: #9CA3AF;
    padding: 0 0.25rem;
    line-height: 1.4;
    strong { color: var(--primary-color, #EF5A42); font-weight: 600; }
    &.error_hint { color: #EF5A42; }
  }
`

const SuggestionBox = styled.div`
  position: absolute;
  top: calc(100% + 6px);
  left: 0; right: 0;
  background: #fff;
  border: 1.5px solid #ECEFF3;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
  z-index: 50;
  overflow: hidden;
  max-height: 200px;
  overflow-y: auto;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 99px; }

  .suggestion_item {
    display: flex; align-items: center; gap: 0.65rem;
    padding: 0.6rem 1rem; cursor: pointer;
    transition: background 0.15s;
    border-bottom: 1px solid #F3F4F6;
    &:last-child { border-bottom: none; }
    &:hover { background: #F9FAFB; }

    .s_avatar {
      font-size: 1.1em; flex-shrink: 0;
      width: 32px; height: 32px;
      display: flex; align-items: center; justify-content: center;
      background: #F3F4F6; border-radius: 50%;
    }
    .s_emoji { background: transparent; font-size: 1.4em; }

    .s_info {
      flex: 1; display: flex; flex-direction: column; gap: 1px; min-width: 0;
      .s_name {
        font-size: 0.88em; font-weight: 600; color: var(--text-color, #111);
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .s_sub { font-size: 0.76em; color: var(--light-text-color, #6B7280); }
    }
    .s_check { color: #10B981; font-size: 0.9em; flex-shrink: 0; }
  }
`

export default TagInput