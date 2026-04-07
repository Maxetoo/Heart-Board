import React, { useState } from 'react'
import styled from 'styled-components'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { resendVerificationLink } from '../../slices/authSlice'
import { ErrorNotificationPopup } from '../../helpers'

const ResendVerificationLinkPage = () => {
  const dispatch = useDispatch()
  const [email, setEmail] = useState('')

  const {
    verificationSendLoad,
    verificationSendError,
    verificationSendErrorMsg,
    verificationSendSuccessMsg,
  } = useSelector(s => s.auth)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!email.trim()) return
    dispatch(resendVerificationLink({ email: email.trim() }))
  }

  return (
    <Wrapper>
      <ErrorNotificationPopup
        trigger={verificationSendError}
        message={verificationSendErrorMsg || 'Something went wrong'}
      />

      <h1>Resend Verification Email</h1>
      <p className="header_desc">Enter the email you used to register and we'll resend the link.</p>

      <div className="form_outline">
        {verificationSendSuccessMsg ? (
          <div className="success_msg">
            <p>{verificationSendSuccessMsg}</p>
            <p className="sub">Check your inbox (and spam folder) for the verification email.</p>
            <Link to="/login" className="back_link">Back to Login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label htmlFor="email">
              <input
                type="email"
                id="email"
                placeholder="Email"
                name="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </label>

            <button
              type="submit"
              className={verificationSendLoad ? 'btn_load' : ''}
              disabled={verificationSendLoad}
            >
              {verificationSendLoad ? 'Sending…' : 'Send Verification Email'}
            </button>

            <p className="login_link">
              <Link to="/login">Back to Login</Link>
            </p>
          </form>
        )}
      </div>
    </Wrapper>
  )
}

const Wrapper = styled.div`
  width: 100vw; min-height: 100vh;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 2rem 1rem 4rem;
  background: var(--bg-color);

  h1 { font-size: 32px; text-align: center; }

  .header_desc {
    margin-top: 0.5rem; color: var(--light-text-color);
    font-size: 16px; text-align: center; width: 350px; max-width: 100%;
  }

  .form_outline {
    width: 100%; max-width: 480px;
    background: #fff; border-radius: 16px;
    display: flex; flex-direction: column; align-items: center;
    padding: 1.5rem; margin-top: 1.5rem;
  }

  form {
    width: 100%; display: flex; flex-direction: column; align-items: flex-start;
  }

  label { width: 100%; }

  input {
    width: 100%; height: 55px; padding: 0 1rem;
    border: none; border-radius: 10px; font-size: 1em;
    outline: none; background: var(--secondary-color);
    &:focus { border: 1.5px solid var(--primary-color); }
  }

  button {
    width: 100%; height: 50px; display: grid; place-content: center;
    font-size: 1em; border: none; background: var(--primary-color);
    border-radius: 25px; color: var(--white-color); margin-top: 2rem;
    cursor: pointer;
    &.btn_load { opacity: 0.7; cursor: not-allowed; }
  }

  .login_link {
    margin-top: 1.25rem; width: 100%; text-align: center;
    a { color: var(--primary-color); font-weight: 600; font-size: 0.95em; }
  }

  .success_msg {
    display: flex; flex-direction: column; align-items: center;
    gap: 0.75rem; text-align: center; padding: 1rem 0;
    p { font-size: 0.95em; color: #111; font-weight: 600; margin: 0; }
    .sub { font-size: 0.85em; color: var(--light-text-color); font-weight: 400; }
    .back_link {
      margin-top: 0.5rem; padding: 0.75rem 2rem;
      background: var(--primary-color); color: #fff;
      border-radius: 25px; font-weight: 600; font-size: 0.95em;
      text-decoration: none;
    }
  }

  @media (min-width: 768px)  { .form_outline { padding: 2.5rem 3rem; } }
  @media (min-width: 992px)  { .form_outline { padding: 3rem 3.5rem; } }
`

export default ResendVerificationLinkPage