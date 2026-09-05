import React from 'react'
import styled from 'styled-components'
import { BsCheckCircleFill } from "react-icons/bs";
import CheckIcon from '../../assets/success-icon.svg';

const PasswordResetSuccess = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <Overlay>
      <Card>
        <div className="check_icon">
            <img src={CheckIcon} alt="icon" />
        </div>
        <h2>Password Reset Successfully</h2>
        <p>Your new password has been saved, redirecting you to login page</p>
      </Card>
    </Overlay>
  )
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: var(--background-color);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`

const Card = styled.div`
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;

  .check_icon {
    font-size: 2em;
    color: var(--primary-color);
    margin-bottom: 1rem;
  }

  img {
    height: 150px;
  }

  h2 {
    font-size: 1.7em;
    font-weight: 500;
    color: var(--text-color);
    margin: 0;
  }

  p {
    font-size: 0.95em;
    color: var(--light-text-color);
    margin: 0;
    line-height: 1.5;
  }
`

export default PasswordResetSuccess