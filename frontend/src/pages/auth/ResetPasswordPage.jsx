import React, { useState } from 'react'
import styled from 'styled-components'
import { Link, useSearchParams} from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux'
import { handleChangePasswordInputs, changePassword} from '../../slices/authSlice';
import {PasswordResetSuccess} from '../../components/auth';
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { ErrorNotificationPopup } from '../../helpers';

const ResetPasswordPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const { 
      changePasswordInputs: {
        newPassword,
        confirmPassword
    },
      changePasswordLoad,
      changePasswordError,
      changePasswordErrorMsg,
      changePasswordSuccess
    } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
     
    const handleSubmit = (e) => {
      e.preventDefault()
      dispatch(changePassword({newPassword, confirmPassword, token}))
    }


  return (
    <Wrapper>
       <ErrorNotificationPopup trigger={changePasswordError} message={changePasswordErrorMsg || 'An error occured'} />
      <h1>Enter New Password</h1>
      <p className='header_desc'>This is the password you would use to access your account from now</p>

      <div className="login_outline">
        <form>
          <label htmlFor="password">
            <div className="password_wrapper">
              <input 
                type={showPassword ? 'text' : 'password'}
                placeholder='New Password' 
                name='password'
                className='password_input'
                required 
                value={newPassword}
                onChange={(e) => dispatch(handleChangePasswordInputs({newPassword: e.target.value, confirmPassword}))}
              />
              <span className="eye_icon" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
              </span>
            </div>
          </label>

          <label htmlFor="confirm_password">
            <div className="password_wrapper">
              <input 
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder='Confirm Password' 
                name='confirm_password'
                className='password_input'
                required 
                value={confirmPassword}
                onChange={(e) => dispatch(handleChangePasswordInputs({confirmPassword: e.target.value, newPassword}))}
              />
              <span className="eye_icon" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                {showConfirmPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
              </span>
            </div>
          </label>

          <button type="submit" 
          className={`${changePasswordLoad ? 'btn_load' : ''}`} 
          onClick={(e) => handleSubmit(e)}
          onSubmit={(e) => handleSubmit(e)}
          >Save Password</button>
        </form>
      </div>

      <PasswordResetSuccess isVisible={changePasswordSuccess} />
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

  .login_outline {
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

  /* Password field wrapper */
  .password_wrapper {
    position: relative;
    width: 100%;
    margin-top: 1rem;

    .password_input {
      margin-top: 0;
      padding-right: 3rem;
    }

    .eye_icon {
      position: absolute;
      right: 1rem;
      top: 50%;
      transform: translateY(-50%);
      cursor: pointer;
      color: var(--light-text-color);
      font-size: 1.3em;
      display: flex;
      align-items: center;

      &:hover {
        color: var(--primary-color);
      }
    }
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

  .divider {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 1.5rem 0;
    color: var(--light-text-color);
    font-size: 0.9em;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .divider::before,
  .divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background-color: #ECEFF3;
    margin: 0 10px;
  }

  .google_auth {
    width: 100%;
    height: 55px;
    border: solid 1px #ECEFF3;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    cursor: pointer;

    .icon {
      font-size: 1.5em;
    }
  }

  .signup {
    margin-top: 1.5rem;
    color: var(--light-text-color);
    text-align: center;
  }

  @media only screen and (min-width: 768px) {
    .login_outline {
      padding: 2.5rem 3rem;
    }
  }

  @media only screen and (min-width: 992px) {
    .login_outline {
      padding: 3rem 3.5rem;
    }
  }
`

export default ResetPasswordPage