import React from 'react'
import {
  Route,
  Routes,
} from 'react-router-dom'
// import { useDispatch, useSelector } from 'react-redux'
// import {Header, NavMenu, Footer, CookiePrompt} from './components/globals'
// import {ScrollToTop, AuthRoute, HomeRedirectRoute, AdminRoute} from './helpers'
import { ErrorPage, LoginPage, SignupPage, ForgotPasswordPage, RecoveryPasswordPage, ResetPasswordPage, AccountSetupPage} from './pages'
import styled from 'styled-components'


const App = () => {
  
  
  return (
      <Wrapper>
      <Routes>
      
      <Route path="/login" element={
        <LoginPage />
      } />
      <Route path="/signup" element={
        <SignupPage />
      } />
      <Route path="/forgot-password" element={
        <ForgotPasswordPage />
      } />
      <Route path="/recovery-password" element={
        <RecoveryPasswordPage />
      } />
      <Route path="/reset-password" element={
        <ResetPasswordPage />
      } />
      <Route path="/account-setup" element={
        <AccountSetupPage />
      } />
      <Route path="*" element={<ErrorPage />} />
      </Routes>
    </Wrapper>
  )
}

const Wrapper = styled.main`
  position: relative;
  width: 100vw;
  height: auto;
`

export default App