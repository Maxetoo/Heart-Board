import React, { useState } from 'react'
import styled, { keyframes } from 'styled-components'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { FcGoogle } from 'react-icons/fc'
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai'
import { BsX } from 'react-icons/bs'
import { login, fillLoginInputs } from '../../slices/authSlice'
import { URL } from '../../paths/url'



const LoginPopup = ({ onClose, message }) => {
  const dispatch = useDispatch()
  const { loginInputs, loginLoad, loginError, loginErrorMsg } = useSelector(s => s.auth)
  const { email, password } = loginInputs
  const [showPw, setShowPw] = useState(false)

  const handleLogin = e => {
    e.preventDefault()
    dispatch(login({ email, password }))
  }

  return (
    <Overlay onClick={onClose}>
      <Card onClick={e => e.stopPropagation()}>

        <CloseBtn onClick={onClose}><BsX /></CloseBtn>

        <Title>Good to have you back</Title>
        <Sub>{message || 'Sign in to continue'}</Sub>

        <GoogleBtn type="button" onClick={() => { window.location.href = `${URL}/api/v1/auth/google` }}>
          <FcGoogle />
          <span>Continue with Google</span>
        </GoogleBtn>

        <Divider><span>or</span></Divider>

        {loginError && <ErrBox>{loginErrorMsg || 'An error occurred'}</ErrBox>}

        <Form onSubmit={handleLogin}>
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => dispatch(fillLoginInputs({ name: 'email', value: e.target.value }))}
            required
          />

          <PwWrap>
            <Input
              type={showPw ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={e => dispatch(fillLoginInputs({ name: 'password', value: e.target.value }))}
              required
            />
            <EyeBtn type="button" onClick={() => setShowPw(p => !p)}>
              {showPw ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
            </EyeBtn>
          </PwWrap>

          <ForgotLink to="/forgot-password">Forgot password?</ForgotLink>

          <SubmitBtn type="submit" disabled={loginLoad}>
            {loginLoad ? 'Signing in…' : 'Sign in'}
          </SubmitBtn>
        </Form>

        <SignupText>
          Don't have an account? <Link to="/signup"><strong>Sign up</strong></Link>
        </SignupText>

      </Card>
    </Overlay>
  )
}



const fadeIn = keyframes`
  from { opacity: 0; transform: scale(0.96) }
  to   { opacity: 1; transform: scale(1) }
`

const Overlay = styled.div`
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.55);
  z-index: 500;
  display: flex; align-items: center; justify-content: center;
`

const Card = styled.div`
  position: relative;
  background: #fff;
  border-radius: 20px;
  padding: 36px 32px 28px;
  width: min(420px, 94vw);
  animation: ${fadeIn} 0.18s ease;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
`

const CloseBtn = styled.button`
  position: absolute; top: 14px; right: 14px;
  background: #F5F6F8; border: none;
  width: 30px; height: 30px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.1em; color: #555; cursor: pointer;
  transition: background 0.15s;
  &:hover { background: #ECEEF2; }
`

const Title = styled.h2`
  font-size: 1.2em; font-weight: 700; color: #111;
  margin: 0 0 6px;
`

const Sub = styled.p`
  font-size: 0.85em; color: #888;
  margin: 0 0 22px;
`

const GoogleBtn = styled.button`
  width: 100%;
  display: flex; align-items: center; justify-content: center; gap: 10px;
  padding: 13px; border: 1.5px solid #E0E0E0; border-radius: 10px;
  background: #fff; font-size: 0.9em; cursor: pointer;
  transition: background 0.15s;
  &:hover { background: #F5F6F8; }
`

const Divider = styled.div`
  display: flex; align-items: center; gap: 12px;
  margin: 18px 0; color: #ccc; font-size: 0.82em;
  &::before, &::after { content: ''; flex: 1; height: 1px; background: #eee; }
`

const ErrBox = styled.div`
  background: #FFF0EE; color: #E05A42;
  font-size: 0.82em; padding: 10px 12px;
  border-radius: 8px; margin-bottom: 12px;
`

const Form = styled.form`
  display: flex; flex-direction: column; gap: 12px;
`

const Input = styled.input`
  width: 100%; padding: 13px 14px;
  border: 1.5px solid #E0E0E0; border-radius: 10px;
  font-size: 0.9em; outline: none; box-sizing: border-box;
  transition: border-color 0.15s;
  &:focus { border-color: #E05A42; }
`

const PwWrap = styled.div`
  position: relative;
  input { padding-right: 44px; }
`

const EyeBtn = styled.button`
  position: absolute; right: 13px; top: 50%; transform: translateY(-50%);
  background: none; border: none; cursor: pointer;
  color: #888; font-size: 1.1em;
  display: flex; align-items: center;
`

const ForgotLink = styled(Link)`
  font-size: 0.82em; color: #E05A42;
  text-align: right; text-decoration: none;
  &:hover { text-decoration: underline; }
`

const SubmitBtn = styled.button`
  width: 100%; padding: 14px;
  background: #E05A42; color: #fff;
  border: none; border-radius: 99px;
  font-size: 0.95em; font-weight: 600;
  cursor: pointer; margin-top: 4px;
  transition: opacity 0.15s;
  &:disabled { opacity: 0.65; cursor: default; }
  &:hover:not(:disabled) { opacity: 0.88; }
`

const SignupText = styled.p`
  margin: 18px 0 0; text-align: center;
  font-size: 0.85em; color: #888;
  a { color: #333; text-decoration: none; }
  a:hover { text-decoration: underline; }
`

export default LoginPopup