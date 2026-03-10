// import React from 'react'
// import styled from 'styled-components'

// const CreateUserName = ({ username, setUsername }) => {
//   return (
//     <Wrapper>
//       <div className="field_card">
//         <p className="field_desc">
//           This is how others will find and identify you on the platform.
//         </p>
//         <div className="input_wrapper">
//           <span className="at">@</span>
//           <input
//             type="text"
//             placeholder="username"
//             value={username}
//             onChange={(e) => setUsername(e.target.value.replace(/\s/g, '').toLowerCase())}
//           />
//         </div>

//         {username.length > 0 && username.length < 3 && (
//           <p className="hint error">Username must be at least 3 characters</p>
//         )}
//         {username.length >= 3 && (
//           <p className="hint success">Looks good!</p>
//         )}
//       </div>
//     </Wrapper>
//   )
// }

// const Wrapper = styled.div`
//   display: flex;
//   flex-direction: column;

//   .field_card {
//     border-radius: 12px;
//   }

//   h3 {
//     font-size: 1em;
//     font-weight: 600;
//     color: var(--text-color);
//     margin: 0 0 0.3rem;
//   }

//   .field_desc {
//     font-size: 0.88em;
//     color: var(--light-text-color);
//     margin: 0 0 1rem;
//     line-height: 1.5;
//   }

//   .input_wrapper {
//     display: flex;
//     align-items: center;
//     background: #fff;
//     border: 1.5px solid #ECEFF3;
//     border-radius: 10px;
//     overflow: hidden;
//     height: 50px;

//     .at {
//       padding: 0 0.75rem;
//       font-size: 1.1em;
//       color: var(--light-text-color);
//       border-right: 1.5px solid #ECEFF3;
//       height: 100%;
//       display: flex;
//       align-items: center;
//     }

//     input {
//       flex: 1;
//       height: 100%;
//       border: none;
//       outline: none;
//       padding: 0 1rem;
//       font-size: 1em;
//       background: transparent;
//       color: var(--text-color);
//     }
//   }

//   .hint {
//     margin: 0.5rem 0 0;
//     font-size: 0.82em;

//     &.error { color: #EF4444; }
//     &.success { color: #22C55E; }
//   }
// `

// export default CreateUserName


import React, { useEffect, useRef } from 'react'
import styled from 'styled-components'
import { useDispatch, useSelector } from 'react-redux'
import { checkUsername, resetUsernameCheck } from '../../slices/userSlice'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'

const CreateUserName = ({ username, setUsername }) => {
  const dispatch = useDispatch()
  const debounceRef = useRef(null)

  const {
    usernameAvailable,
    usernameCheckLoad,
    usernameCheckMsg,
  } = useSelector((state) => state.user)

  useEffect(() => {
    dispatch(resetUsernameCheck())
    clearTimeout(debounceRef.current)

    if (username.trim().length < 3) return

    debounceRef.current = setTimeout(() => {
      dispatch(checkUsername({ username: username.trim() }))
    }, 800)

    return () => clearTimeout(debounceRef.current)
  }, [username])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      clearTimeout(debounceRef.current)
      dispatch(resetUsernameCheck())
    }
  }, [])

  const getBorderClass = () => {
    if (usernameAvailable === true) return 'available'
    if (usernameAvailable === false) return 'taken'
    return ''
  }

  return (
    <Wrapper>
      <div className="field_card">
        <p className="field_desc">
          This is how others will find and identify you on the platform.
        </p>

        <div className={`input_wrapper ${getBorderClass()}`}>
          <span className="at">@</span>
          <input
            type="text"
            placeholder="username"
            value={username}
            onChange={(e) => setUsername(e.target.value.replace(/\s/g, '').toLowerCase())}
            autoComplete="off"
            spellCheck={false}
            maxLength={30}
          />
          {usernameCheckLoad && (
            <span className="check_icon">
              <AiOutlineLoading3Quarters className="spinning" />
            </span>
          )}
        </div>

        {username.length > 0 && username.length < 3 && (
          <p className="hint error">Username must be at least 3 characters</p>
        )}
        {username.length >= 3 && !usernameCheckLoad && usernameAvailable === true && (
          <p className="hint success">{usernameCheckMsg || 'Username is available!'}</p>
        )}
        {username.length >= 3 && !usernameCheckLoad && usernameAvailable === false && (
          <p className="hint error">{usernameCheckMsg || 'Username is already taken.'}</p>
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
    transition: border-color 0.2s;

    &.available { border-color: #22C55E; }
    &.taken { border-color: #EF4444; }

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

    .check_icon {
      display: flex;
      align-items: center;
      padding-right: 0.85rem;
      color: var(--light-text-color);
      font-size: 1.1em;

      .spinning {
        animation: spin 0.7s linear infinite;
      }
    }
  }

  .hint {
    margin: 0.5rem 0 0;
    font-size: 0.82em;

    &.error { color: #EF4444; }
    &.success { color: #22C55E; }
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
`

export default CreateUserName