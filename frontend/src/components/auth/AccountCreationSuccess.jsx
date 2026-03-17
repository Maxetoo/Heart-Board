import React from 'react'
import styled from 'styled-components'
import {Link} from 'react-router-dom';
import { BsCheckCircleFill } from "react-icons/bs";
import CheckIcon from '../../assets/account-creation-success.png';
import Confetti1 from '../../assets/confetti 1.svg';
import Confetti2 from '../../assets/confetti 2.svg';

const AccountCreationSuccess = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <Overlay>
        <img src={Confetti1} alt="confetti 1" className='confetti_left' />
        <img src={Confetti2} alt="confetti 2" className='confetti_right' />
      <Card>
        <div className="check_icon">
            <img src={CheckIcon} alt="icon" className='check_img'/>
        </div>
        <h2>You're In</h2>
        <p>Account created successfully. Let's customize your experience in just 90 seconds.</p>
        <Link to="/account-setup" className='cta_button '>
          Set up Profile
        </Link>
      </Card>
    </Overlay>
  )
}



const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: var(--primary-color);
  color: var(--white-color);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;

  .confetti_left {
    position: absolute;
    top: 0;
    left: 0;
    max-width: 45vw;
  }

  .confetti_right {
    position: absolute;
    top: 0;
    right: 0;
    max-width: 45vw;
  }
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

  .check_img {
    height: 150px;
    color: var(--white-color);
  }

  h2 {
    font-size: 1.7em;
    font-weight: 500;
    margin: 0;
  }

  p {
    font-size: 0.95em;
    margin: 0;
    line-height: 1.5;
  }
  
  .cta_button {
    margin-top: 1rem;
    padding: 1rem 2rem;
    background: var(--white-color);
    color: var(--primary-color);
    border: none;
    border-radius: 25px;
    font-size: 1em;
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
    display: inline-block;
  }
`

export default AccountCreationSuccess