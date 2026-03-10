import React, {useEffect} from 'react'
import {
  Route,
  Routes,
} from 'react-router-dom'
import { Toaster } from 'react-hot-toast';
import {getMyProfile} from './slices/userSlice';
import { useDispatch, useSelector } from 'react-redux'
import { updateProfileStatus } from './slices/authSlice';
import { ErrorPage, LoginPage, SignupPage, ForgotPasswordPage, RecoveryPasswordPage, ResetPasswordPage, AccountSetupPage, 
  HomePage, PostMessagePage, 
  CreateMessagePage,
    EditBoardPage,
    EditMessagePage
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
        <Toaster position="top-center" reverseOrder={false} />
      <Routes>

      <Route path="/" element={
        <HomePage />
      } />

      <Route path="/create" element={
        <PostMessagePage />
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
      <Route path="/recovery-password" element={
        <RecoveryPasswordPage />
      } />
      <Route path="/reset-password" element={
        <ResetPasswordPage />
      } />
      <Route path="/account-setup" element={
        <AccountSetupPage />
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
    </Wrapper>
  )
}

const Wrapper = styled.main`
  position: relative;
  width: 100vw;
  height: auto;
`

export default App