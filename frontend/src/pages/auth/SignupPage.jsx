import React, { useState } from 'react'
import styled from 'styled-components'
import { useDispatch, useSelector } from 'react-redux'
import { 
  signup,
  handleSignupInputChange,
  handleAgreeTermsAndConditions,
} from '../../slices/authSlice'
import { ErrorNotificationPopup} from '../../helpers';
import { Link } from 'react-router-dom';
import { FcGoogle } from "react-icons/fc";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { AccountCreationSuccess} from '../../components/auth'
import {URL} from '../../paths/url';

const SignupPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch()
  const {
    agreeTermsAndCondition,
    signupLoad,
    signupError,
    signupErrorMsg,
    signupInputs,
    setProfile

  } = useSelector((store) => store.auth)
  const { email, password } = signupInputs;

  const handleSignup = (e) => {
      e.preventDefault();
      dispatch(signup({email, password}))
  }
  
  const handleLoginWithGoogle = () => {
      window.location.href = `${URL}/api/v1/auth/google`;
  }


  return (
    <Wrapper>
      <ErrorNotificationPopup trigger={signupError} message={signupErrorMsg || 'An error occured'} />
      <h1>Let’s get you started</h1>
      <p className='header_desc'>Fill the form below with the right details and set yourself up really quick</p>

      <div className="login_outline">
        <div className="google_auth" onClick={handleLoginWithGoogle}>
          <FcGoogle className='icon' />
          <span>Continue with Google</span>
        </div>

        <div className="divider">
          <span>or</span>
        </div>

        <form>
          <label htmlFor="email">
            <input type="email" 
            placeholder='Email' 
            name='email'
            value={email}
            onChange={(e) => dispatch(handleSignupInputChange({
              name: e.target.name,
              value: e.target.value
            }))}
            required />
          </label>
          <label htmlFor="password">
            <div className="password_wrapper">
              <input 
                type={showPassword ? 'text' : 'password'}
                placeholder='Password' 
                name='password'
                className='password_input'
                value={password}
                onChange={(e) => dispatch(handleSignupInputChange({
                  name: e.target.name,
                  value: e.target.value
                }))}
                required 
              />
              <span className="eye_icon" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
              </span>
            </div>
          </label>
          <Link to="/forgot-password">
            <p className='forgot_password'>Forgot password?</p>
          </Link>

          <label className="terms_checkbox">
          <input
            type="checkbox"
            checked={agreeTermsAndCondition}
            onChange={(e) => dispatch(handleAgreeTermsAndConditions(e.target.checked))}
            required
          />
          <span className="terms_text">
            By continuing, you agree to our{' '}
            <a href="/terms" target="_blank" rel="noopener noreferrer">Terms & Conditions</a>
          </span>
        </label>

          <button type="submit" 
          className={`${signupLoad ? 'btn_load' : ''}`}
          onClick={(e) => handleSignup(e)}
          onSubmit={(e) => handleSignup(e)}
          disabled={!agreeTermsAndCondition}
          >Signup</button>
        </form>

        <p className='signup'>
          <Link to="/login">
          Already have an account? <strong>Signin</strong></Link>
        </p>
      </div>

      <AccountCreationSuccess isVisible={setProfile} />
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

  .forgot_password {
    margin-top: 1rem;
    width: 100%;
    color: var(--primary-color);
    text-align: right;
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

  button:disabled {
    background: var(--primary-color);
    opacity: 0.6;
    cursor: not-allowed;
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

  .terms_checkbox {
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 0.75rem;
  margin-top: 1rem;
}

.terms_checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  min-width: 18px;
  margin-top: 2px;
  cursor: pointer;
  accent-color: #000000;
}

.terms_text {
  font-size: 0.95em;
  color: var(--light-text-color);
  line-height: 1.5;
}

.terms_text a {
  color: var(--primary-color);
  text-decoration: underline;
  font-weight: 600;
}

.terms_text a:hover {
  opacity: 0.8;
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

export default SignupPage