import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
    CreateUsername,
    SelectAccountTier,
    SelectAccountType,
    SelectCountry
} from '../../components/account'
import {updateProfileStatus} from '../../slices/authSlice';
import { updateProfile, clearUserNotifications } from '../../slices/userSlice'
import { createCheckoutSession, clearSubscriptionNotifications } from '../../slices/subscriptionSlice'
import { ErrorNotificationPopup } from '../../helpers'

const STEPS = [
  { title: 'Select Account Type' },
  { title: 'Create Username' },
  { title: 'Select Country' },
  { title: 'Select Account Tier' },
]

const AccountSetupPage = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const {
    updateProfileLoad,
    updateProfileError,
    updateProfileErrorMsg,
    updateProfileSuccess,
  } = useSelector((state) => state.user)

  const {
    checkoutLoad,
    checkoutError,
    checkoutErrorMsg,
  } = useSelector((state) => state.subscription)

  const [step, setStep] = useState(0)
  const [accountType, setAccountType] = useState('')
  const [username, setUsername] = useState('')
  const [country, setCountry] = useState('')
  const [tier, setTier] = useState('')

  // Once profile update succeeds, handle tier selection
  useEffect(() => {
    if (!updateProfileSuccess) return

    dispatch(clearUserNotifications())

    if (tier === 'free') {
      // Free plan — no checkout needed, go straight to dashboard
      navigate('/dashboard')
    } else {
      // Paid plan — open Stripe checkout (slice handles the redirect)
      dispatch(createCheckoutSession({ plan: tier }))
    }
  }, [dispatch, updateProfileSuccess])

  const isStepValid = () => {
    if (step === 0) return !!accountType
    if (step === 1) return username.length >= 3
    if (step === 2) return !!country
    if (step === 3) return !!tier
    return false
  }

  const isLoading = updateProfileLoad || checkoutLoad

  const handleContinue = () => {
    if (!isStepValid() || isLoading) return

    if (step < STEPS.length - 1) {
      setStep(step + 1)
      return
    }

    dispatch(updateProfile({ username, accountType, country }))
    dispatch(updateProfileStatus())
  }

  const handleBack = () => {
    if (step > 0) {
      dispatch(clearUserNotifications())
      dispatch(clearSubscriptionNotifications())
      setStep(step - 1)
    }
  }

  const errorVisible = updateProfileError || checkoutError
  const errorMsg = updateProfileErrorMsg || checkoutErrorMsg || 'An error occurred'

  const buttonLabel = () => {
    if (updateProfileLoad) return 'Saving...'
    if (checkoutLoad) return 'Redirecting...'
    if (step === STEPS.length - 1) return 'Finish Setup'
    return 'Continue'
  }

  return (
    <Wrapper>
      <ErrorNotificationPopup trigger={errorVisible} message={errorMsg} />

      <p className="step_label">STEP {step + 1}/{STEPS.length}</p>
      <h1>{STEPS[step].title}</h1>

      <div className="setup_outline">

        <div className="progress_bar">
          {STEPS.map((_, i) => (
            <div key={i} className={`progress_dot ${i <= step ? 'done' : ''}`} />
          ))}
        </div>

        <div className="step_content">
          {step === 0 && (
            <SelectAccountType selected={accountType} setSelected={setAccountType} />
          )}
          {step === 1 && (
            <CreateUsername username={username} setUsername={setUsername} />
          )}
          {step === 2 && (
            <SelectCountry selected={country} setSelected={setCountry} />
          )}
          {step === 3 && (
            <SelectAccountTier selected={tier} setSelected={setTier} />
          )}
        </div>

        <div className="actions">
          {step > 0 && (
            <button
              className="back_btn"
              onClick={handleBack}
              disabled={isLoading}
            >
              Back
            </button>
          )}
          <button
            className={`continue_btn ${isStepValid() && !isLoading ? 'valid' : 'disabled'}`}
            onClick={handleContinue}
            disabled={!isStepValid() || isLoading}
          >
            {buttonLabel()}
          </button>
        </div>

      </div>
    </Wrapper>
  )
}

const Wrapper = styled.div`
  width: 100vw;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem 4rem;
  background: var(--bg-color);

  .step_label {
    font-size: 0.85em;
    font-weight: 600;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--light-text-color);
    margin-bottom: 0.4rem;
  }

  h1 {
    font-size: 2em;
    font-weight: 700;
    text-align: center;
    margin-bottom: 1.5rem;
  }

  .setup_outline {
    width: 100%;
    max-width: 480px;
    background: #ffffff;
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    padding: 1.5rem;
    gap: 1rem;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  }

  .progress_bar {
    display: flex;
    gap: 6px;

    .progress_dot {
      flex: 1;
      height: 4px;
      border-radius: 99px;
      background: #E5E7EB;
      transition: background 0.3s;

      &.done {
        background: var(--primary-color);
      }
    }
  }

  .step_content {
    width: 100%;
  }

  .actions {
    display: flex;
    gap: 0.75rem;
    margin-top: 0.5rem;

    .back_btn {
      height: 50px;
      padding: 0 1.5rem;
      border: 1.5px solid #ECEFF3;
      border-radius: 25px;
      background: transparent;
      color: var(--light-text-color);
      font-size: 1em;
      cursor: pointer;
      transition: border-color 0.2s;

      &:hover:not(:disabled) {
        border-color: var(--primary-color);
        color: var(--primary-color);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .continue_btn {
      flex: 1;
      height: 50px;
      display: grid;
      place-content: center;
      font-size: 1em;
      font-weight: 600;
      border: none;
      border-radius: 25px;
      color: #ffffff;
      cursor: pointer;
      transition: opacity 0.2s;
      background: var(--primary-color);
      opacity: 0.4;

      &.valid {
        opacity: 1;

        &:hover {
          opacity: 0.88;
        }
      }

      &.disabled {
        cursor: not-allowed;
      }
    }
  }

  @media only screen and (min-width: 768px) {
    .setup_outline {
      padding: 2.5rem 3rem;
    }
  }

  @media only screen and (min-width: 992px) {
    .setup_outline {
      padding: 3rem 3.5rem;
    }
  }
`

export default AccountSetupPage