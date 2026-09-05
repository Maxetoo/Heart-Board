import React, { useEffect } from 'react'
import styled from 'styled-components'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams, Link } from 'react-router-dom'
import { BsXCircleFill } from 'react-icons/bs'
import { verifyEmail } from '../../slices/authSlice'
import CheckIcon from '../../assets/account-creation-success.png'
import Confetti1 from '../../assets/confetti 1.svg'
import Confetti2 from '../../assets/confetti 2.svg'

const SuccessCard = () => (
  <Overlay>
    <img src={Confetti1} alt="" className="confetti_left" />
    <img src={Confetti2} alt="" className="confetti_right" />
    <Card>
      <div className="check_icon">
        <img src={CheckIcon} alt="success" className="check_img" />
      </div>
      <h2>Email Verified!</h2>
      <p>Your email has been verified successfully. You can now log in.</p>
      <Link to="/login" className="cta_button">Go to Login</Link>
    </Card>
  </Overlay>
)

const VerifyEmailPage = () => {
  const dispatch = useDispatch()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('verificationToken')

  const { verifyEmailLoad, verifyEmailSuccess, verifyEmailError, verifyEmailMsg } =
    useSelector(s => s.auth)
  const { myProfile } = useSelector(s => s.user)

  useEffect(() => {
    if (token) dispatch(verifyEmail({ verificationToken: token }))
  }, [token, dispatch])

  // already verified — show success immediately, no token needed 
  if (myProfile?.isEmailVerified) {
    return <SuccessCard />
  }

  // Token dispatch succeeded 
  if (verifyEmailSuccess) {
    return <SuccessCard />
  }

  // Loading / waiting 
  if (verifyEmailLoad || (!verifyEmailSuccess && !verifyEmailError && token)) {
    return (
      <Overlay $neutral>
        <Card>
          <Spinner />
          <h2>Verifying your email…</h2>
          <p>Please wait a moment.</p>
        </Card>
      </Overlay>
    )
  }

  // No token in URL 
  if (!token) {
    return (
      <Overlay $error>
        <Card>
          <BsXCircleFill className="status_icon" />
          <h2>Invalid Link</h2>
          <p>This verification link is invalid or has expired.</p>
          <Link to="/confirm-account" className="cta_button outline">Resend verification email</Link>
        </Card>
      </Overlay>
    )
  }

  // Verification failed 
  return (
    <Overlay $error>
      <Card>
        <BsXCircleFill className="status_icon" />
        <h2>Verification Failed</h2>
        <p>{verifyEmailMsg || 'The verification link is invalid or has expired.'}</p>
        <Link to="/confirm-account" className="cta_button outline">Resend verification email</Link>
      </Card>
    </Overlay>
  )
}

const Spinner = styled.div`
  width: 52px; height: 52px; border-radius: 50%;
  border: 4px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  animation: spin 0.8s linear infinite;
  @keyframes spin { to { transform: rotate(360deg) } }
`

const Overlay = styled.div`
  position: fixed; inset: 0;
  background: ${({ $error, $neutral }) =>
    $error ? '#E05A42' : $neutral ? '#6B7280' : 'var(--primary-color, #EF5A42)'};
  color: #fff;
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; padding: 1rem;

  .confetti_left  { position: absolute; top: 0; left: 0;  max-width: 45vw; }
  .confetti_right { position: absolute; top: 0; right: 0; max-width: 45vw; }
`

const Card = styled.div`
  width: 100%; max-width: 400px;
  display: flex; flex-direction: column; align-items: center;
  gap: 1rem; text-align: center; position: relative; z-index: 1;

  .check_icon { margin-bottom: 0.5rem; }
  .check_img  { height: 140px; }

  .status_icon { font-size: 4rem; color: #fff; }

  h2 { font-size: 1.7em; font-weight: 700; margin: 0; }
  p  { font-size: 0.95em; margin: 0; line-height: 1.5; opacity: 0.9; }

  .cta_button {
    margin-top: 0.5rem; padding: 0.9rem 2rem;
    background: #fff; color: var(--primary-color, #EF5A42);
    border: none; border-radius: 25px;
    font-size: 1em; font-weight: 600; cursor: pointer;
    text-decoration: none; display: inline-block;
    &.outline {
      background: transparent; color: #fff;
      border: 2px solid #fff;
    }
  }
`

export default VerifyEmailPage