import React from 'react'
import styled from 'styled-components'
import { Link } from 'react-router-dom';


const ErrorPage = () => {
  return (
    <Wrapper>
      <h1>Error Page</h1>
      <p>You seem to be lost</p>

      <Link to={'/'} className='btn-link'>
      <button type="button">Go back</button>
      </Link>
    </Wrapper>
  )
}

const Wrapper = styled.div`
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;


    p {
      margin-top: 1rem;
      color: var(--light-text-color);
    }

    .btn-link {
      width: 50%;
    }

    button {
      height: 55px;
      width: 100%;
      background: var(--primary-color);
      border: none;
      border-radius: 10px;
      color: var(--white-color);
      font-size: 1em;
      margin-top: 3rem;
    }

  @media only screen and (min-width: 600px) {
    .route-container {
        width: 80%;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
    }
  }


  @media only screen and (min-width: 768px) {
      .btn-link {
        width: 20%;
      }
  }

`
export default ErrorPage