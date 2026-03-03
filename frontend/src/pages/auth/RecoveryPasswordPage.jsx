import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { Link } from 'react-router-dom';
import {URL} from '../../paths/url';

const RecoveryPasswordPage = () => {
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (canResend) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [canResend]);

  const handleResend = () => {
    setTimeLeft(60);
    setCanResend(false);
  };
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <Wrapper>
      <h1>Recover your password</h1>
      <p className='header_desc'>Enter the recovery code sent to your email</p>

      <div className="form_outline">
        <form>
          <label htmlFor="number">
            <input type="number" 
            placeholder='Recovery Code' 
            name='recovery_code'
            required />
          </label>

          <button type="submit">Enter Code</button>

          <div className="resend_row">
            {canResend ? (
              <span className="resend_link" onClick={handleResend}>
                Resend code
              </span>
            ) : (
              <h3>Resend code in <span className="timer">{formatTime(timeLeft)}</span></h3>
            )}
          </div>
        </form>
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

  h1 {
    font-size: 32px;
    text-align: center;
  }

  .header_desc {
    margin-top: 0.5rem;
    color: var(--light-text-color);
    font-size: 16px;
    text-align: center;
    width: 350px;
  }

  .form_outline {
    width: 100%;
    max-width: 480px;
    background: #ffffff;
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1.5rem;
    margin-top: 1.5rem;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  }

  form {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  h3 {
    text-align: center;
    margin-top: 1rem;
    color: var(--light-text-color);
    font-size: 1em;
    font-weight: 500;
  }

  .timer {
    font-weight: 600;
  }

  .resend_row {
    margin-top: 1rem;
    width: 100%;
  }

  .resend_link {
    color: var(--primary-color);
    font-size: 1em;
    font-weight: 600;
    cursor: pointer;

    &:hover {
      text-decoration: underline;
    }
  }

  label {
    width: 100%;
  }

  input {
    width: 100%;
    height: 55px;
    padding: 0 2rem 0 1rem;
    border: none;
    border-radius: 10px;
    font-size: 1em;
    outline: none;
    background: var(--secondary-color);
  }

  input:focus, select:focus, textarea:focus {
    border-color: var(--primary-color);
  }

  a {
    width: 100%;
  }

  button {
    width: 100%;
    height: 50px;
    display: grid;
    place-content: center;
    font-size: 1em;
    border: none;
    background: var(--primary-color);
    border-radius: 25px;
    color: var(--white-color);
    margin-top: 2rem;
    cursor: pointer;
  }

  .btn_load {
    opacity: 0.8;
  }

  @media only screen and (min-width: 768px) {
    .form_outline {
      padding: 2.5rem 3rem;
    }
  }

  @media only screen and (min-width: 992px) {
    .form_outline {
      padding: 3rem 3.5rem;
    }
  }
`

export default RecoveryPasswordPage