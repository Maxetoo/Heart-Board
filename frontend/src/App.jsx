import React, {useEffect} from 'react'
import {
  Route,
  Routes,
} from 'react-router-dom'
import RequireProfileSetup from './components/RequireProfileSetup'
import {NavigationHelper, ScrollToTop} from './helpers'
import { Toaster } from 'react-hot-toast';
import {getMyProfile} from './slices/userSlice';
import { useDispatch, useSelector } from 'react-redux'
import {EmailVerificationBanner} from './components/auth';
import { updateProfileStatus} from './slices/authSlice';
import { ErrorPage, LoginPage, SignupPage, ForgotPasswordPage, ResendVerificationLinkPage, ResetPasswordPage, AccountSetupPage, 
  HomePage, PostMessagePage, 
  CreateMessagePage,
    EditBoardPage,
    EditMessagePage, ProfilePage,
    UserProfilePage, SingleBoardPage, VerifyEmailPage
} from './pages'
import styled from 'styled-components'


const App = () => {
  const { myProfile} = useSelector((store) => store.user);
  const {_id: userId, username} = myProfile || {}
  const dispatch = useDispatch()

  // check userId 
  useEffect(() => {
    if (!userId) {
      dispatch(getMyProfile())
    }
  }, [userId, dispatch]);

  // status update 
  useEffect(() => {
    if (username) {
      dispatch(updateProfileStatus())
    }
  }, [username, dispatch]);
  
  return (
      <Wrapper>
      <ScrollToTop/>
        <Toaster position="top-center" reverseOrder={false} />
      <NavigationHelper>
      <EmailVerificationBanner/>
      <Routes>

      <Route path="/" element={
        <HomePage />
      } />

      <Route path="/create" element={
        <PostMessagePage />
      } />

      <Route path="/profile" element={
        <ProfilePage />
      } />

      
      <Route path="/login" element={
        <LoginPage />
      } />
      <Route path="/signup" element={
        <SignupPage />
      } />
      <Route path="/forgot-password" element={
        <ForgotPasswordPage />
      } />
      <Route path="/confirm-account" element={
        <ResendVerificationLinkPage />
      } />
      <Route path="/reset-password" element={
        <ResetPasswordPage />
      } />
      <Route path="/account-setup" element={
        <AccountSetupPage /> 
      } /> 
       <Route path="/verify-email" element={
        <VerifyEmailPage /> 
      } /> 

      <Route path="/board/:slug" element={<SingleBoardPage />} />

      <Route path="/profile/:username" element={
        <UserProfilePage /> 
      } /> 

      <Route path="/board/:slug/add-message" element={
        <CreateMessagePage />
      } /> 
      <Route path="/board/:slug/edit" element={ 
        <EditBoardPage />
      } />
      <Route path="/message/:id/edit" element={
        <EditMessagePage />
      } />
      <Route path="*" element={<ErrorPage />} />
      </Routes>
      </NavigationHelper>
    </Wrapper>
  )
}

const Wrapper = styled.main`
  position: relative;
  width: 100vw;
  height: auto;
`

export default App