import React from 'react'
import styled from 'styled-components'
import { BsHouseFill, BsPlusLg, BsPersonFill } from 'react-icons/bs'
import { Link, useLocation } from 'react-router-dom'

const NavComponent = () => {
  const location = useLocation()

  return (
    <BottomNav>
      <Link to="/" className={`nav_item ${location.pathname === '/' ? 'active' : ''}`}>
        <BsHouseFill />
      </Link>

      <Link to="/create" className="nav_item">
          <BsPlusLg />
      </Link>

      <Link to="/profile" className={`nav_item ${location.pathname === '/profile' ? 'active' : ''}`}>
        <BsPersonFill />
      </Link>
    </BottomNav>
  )
}

const BottomNav = styled.nav`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: #fff;
  border-top: 0.5px solid #F0F0F0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3.5rem;
  z-index: 100;

  .nav_item {
    color: #333;
    font-size: 1.4em;
    display: flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    transition: color 0.2s;

    &.active {
      color: #333;
    }

    &:hover {
      color: #555;
    }
  }

  .plus_btn {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    background: #111;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75em;
  }
`

export default NavComponent