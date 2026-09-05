import React from 'react'
import styled from 'styled-components'
import { useDispatch, useSelector } from 'react-redux'
import { resetPassword, handleResetPasswordInput} from '../../slices/authSlice';
import { ErrorNotificationPopup, SuccessNotificationPopup } from '../../helpers';
import { Link } from 'react-router-dom';
import { FcGoogle } from "react-icons/fc";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import {URL} from '../../paths/url';

const ForgotPasswordPage = () => {
  const { 
        resetPasswordEmail,
        resetPasswordLoad,
        resetPasswordError,
        resetPasswordSent,
        passwordResetMessage,
    } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
  
    const handleSubmit = (e) => {
        e.preventDefault()
        dispatch(resetPassword({email: resetPasswordEmail }))
    }
  return (
    <Wrapper>
      <ErrorNotificationPopup trigger={resetPasswordError} message={passwordResetMessage || 'An error occured'} />
      <SuccessNotificationPopup trigger={resetPasswordSent} message={passwordResetMessage} />
      <h1>Recover your password</h1>
      <p className='header_desc'>Enter the email you use in registering to recovery your password</p>

      <div className="form_outline">
        <form>
          <label htmlFor="email">
            <input type="email" 
            placeholder='Email' 
            name='email'
            required 
            value={resetPasswordEmail}
            onChange={(e) => dispatch(handleResetPasswordInput(e.target.value))}
            />
          </label>

          <button type="submit" 
          className={`${resetPasswordLoad ? 'btn_load' : ''}`}
          onClick={(e) => handleSubmit(e)}
          onSubmit={(e) => handleSubmit(e)}
          >Send Recovery Code</button>
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
  }

  form {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  h3 {
    margin-top: 1rem;
    color: var(--light-text-color);
    font-size: 1em;
    font-weight: 600;
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

export default ForgotPasswordPage