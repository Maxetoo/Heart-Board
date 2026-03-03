import React from 'react'
import styled from 'styled-components'

const CreateUserName = ({ username, setUsername }) => {
  return (
    <Wrapper>
      <div className="field_card">
        <p className="field_desc">
          This is how others will find and identify you on the platform.
        </p>
        <div className="input_wrapper">
          <span className="at">@</span>
          <input
            type="text"
            placeholder="username"
            value={username}
            onChange={(e) => setUsername(e.target.value.replace(/\s/g, '').toLowerCase())}
          />
        </div>

        {username.length > 0 && username.length < 3 && (
          <p className="hint error">Username must be at least 3 characters</p>
        )}
        {username.length >= 3 && (
          <p className="hint success">Looks good!</p>
        )}
      </div>
    </Wrapper>
  )
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;

  .field_card {
    border-radius: 12px;
  }

  h3 {
    font-size: 1em;
    font-weight: 600;
    color: var(--text-color);
    margin: 0 0 0.3rem;
  }

  .field_desc {
    font-size: 0.88em;
    color: var(--light-text-color);
    margin: 0 0 1rem;
    line-height: 1.5;
  }

  .input_wrapper {
    display: flex;
    align-items: center;
    background: #fff;
    border: 1.5px solid #ECEFF3;
    border-radius: 10px;
    overflow: hidden;
    height: 50px;

    .at {
      padding: 0 0.75rem;
      font-size: 1.1em;
      color: var(--light-text-color);
      border-right: 1.5px solid #ECEFF3;
      height: 100%;
      display: flex;
      align-items: center;
    }

    input {
      flex: 1;
      height: 100%;
      border: none;
      outline: none;
      padding: 0 1rem;
      font-size: 1em;
      background: transparent;
      color: var(--text-color);
    }
  }

  .hint {
    margin: 0.5rem 0 0;
    font-size: 0.82em;

    &.error { color: #EF4444; }
    &.success { color: #22C55E; }
  }
`

export default CreateUserName