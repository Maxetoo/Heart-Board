import React, { useState } from 'react'
import styled, { keyframes } from 'styled-components'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { resendVerificationLink } from '../../slices/authSlice'
import { BsEnvelopeExclamation, BsX, BsCheckCircle } from 'react-icons/bs'

const EmailVerificationBanner = () => {
  const dispatch = useDispatch()
  const { userCookie, verificationSendLoad, verificationSendSuccessMsg, verificationSendError, verificationSendErrorMsg } = useSelector(s => s.auth)
  const { myProfile } = useSelector(s => s.user)
  const [dismissed, setDismissed] = useState(false)
  const [sent, setSent] = useState(false)

  // Only show when profile is loaded and email is NOT verified
  if (!myProfile || myProfile.isEmailVerified || dismissed) return null

  const handleResend = () => {
    if (!myProfile.email || verificationSendLoad) return
    dispatch(resendVerificationLink({ email: myProfile.email })).then(res => {
      if (res?.payload?.status === 'success') setSent(true)
    })
  }

  const isConfirmed = sent || !!verificationSendSuccessMsg

  return (
    <Banner>
      <Inner>
        <span className="banner_text">
          {isConfirmed
            ? 'Verification email sent! Check your inbox.'
            : 'Your email address is not verified.'}
        </span>

        {!isConfirmed && (
          userCookie ? (
            <button className="banner_btn" onClick={handleResend} disabled={verificationSendLoad}>
              {verificationSendLoad ? 'Sending…' : 'Resend verification email'}
            </button>
          ) : (
            <Link to="/confirm-account" className="banner_btn">Verify email</Link>
          )
        )}

        {isConfirmed && <BsCheckCircle className="sent_icon" />}
        {verificationSendError && <span className="banner_error">{verificationSendErrorMsg}</span>}
      </Inner>

      <DismissBtn onClick={() => setDismissed(true)}><BsX /></DismissBtn>
    </Banner>
  )
}

const slideDown = keyframes`
  from { transform: translateY(-100%); opacity: 0; }
  to   { transform: translateY(0);     opacity: 1; }
`

const Banner = styled.div`
  position: fixed; top: 0; left: 0; right: 0; z-index: 9999;
  background: #FFF3CD; border-bottom: 1.5px solid #F5C842;
  padding: 0.65rem 1rem;
  display: flex; align-items: center; justify-content: space-between; gap: 0.75rem;
  animation: ${slideDown} 0.3s ease forwards;
`

const Inner = styled.div`
  display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; flex: 1;

  .banner_icon { color: #92660A; font-size: 1.1em; flex-shrink: 0; }
  .banner_text { font-size: 0.88em; font-weight: 500; color: #92660A; }

  .banner_btn {
    font-size: 0.82em; font-weight: 600; color: var(--primary-color, #EF5A42);
    background: none; border: 1.5px solid var(--primary-color, #EF5A42);
    border-radius: 99px; padding: 3px 12px; cursor: pointer; text-decoration: none;
    transition: background 0.15s, color 0.15s;
    &:hover { background: var(--primary-color, #EF5A42); color: #fff; }
    &:disabled { opacity: 0.6; cursor: not-allowed; }
  }

  .sent_icon { color: #22c55e; font-size: 1.1em; }
  .banner_error { font-size: 0.8em; color: #E05A42; font-weight: 500; }
`

const DismissBtn = styled.button`
  background: none; border: none; cursor: pointer;
  color: #92660A; font-size: 1.25em; flex-shrink: 0;
  display: flex; align-items: center;
  &:hover { color: #111; }
`

export default EmailVerificationBanner