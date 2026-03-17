import React from 'react'
import styled from 'styled-components'
import { BsCheckLg, BsPerson } from 'react-icons/bs'
import { RiVipCrownLine } from 'react-icons/ri'

const SelectAccountTier = ({ selected, setSelected }) => {
  const tiers = [
    {
      id:       'free',
      label:    'Free',
      price:    '$0',
      period:   '',
      icon:     <BsPerson />,
      features: [
        '10 boards',
        '30 messages per month',
        'Basic board tiers',
      ],
    },
    {
      id:       'pro',
      label:    'Pro',
      price:    '$12',
      period:   'per month',
      icon:     <RiVipCrownLine />,
      badge:    'Most Popular',
      disabled: true,
      features: [
        'Unlimited boards',
        'Unlimited messages per month',
        'All board tiers (standard & premium)',
        'Priority support',
      ],
    },
  ]

  return (
    <Wrapper>
      {tiers.map((tier) => (
        <div
          key={tier.id}
          className={`tier_card ${selected === tier.id ? 'active' : ''} ${tier.disabled ? 'disabled' : ''}`}
          onClick={() => !tier.disabled && setSelected(tier.id)}
        >
          {tier.badge && !tier.disabled && <span className="pro_badge">{tier.badge}</span>}

          <div className="tier_header">
            <div className="tier_info">
              <p className="tier_label">{tier.label}</p>
              {tier.period && (
                <p className="tier_price">
                  <span className="amount">{tier.price}</span>
                  <span className="period"> / {tier.period}</span>
                </p>
              )}
            </div>
            {tier.disabled
              ? <span className="coming_soon">Coming soon</span>
              : (
                <div className={`radio ${selected === tier.id ? 'active' : ''}`}>
                  {selected === tier.id && <div className="radio_dot" />}
                </div>
              )
            }
          </div>

          <ul className="feature_list">
            {tier.features.map((f, i) => (
              <li key={i} className="feature_item">
                <BsCheckLg className="check" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </Wrapper>
  )
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  .tier_card {
    position: relative;
    border-radius: 12px;
    padding: 1rem 1.2rem;
    cursor: pointer;
    background: #FAFAFA;
    border: solid 0.5px transparent;
    transition: border-color 0.2s;

    &.active {
      border-color: var(--primary-color);
      background: rgba(var(--primary-rgb, 248, 113, 113), 0.04);
    }

    &:hover:not(.disabled) { border-color: var(--primary-color); }

    &.disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }
  }

  .pro_badge {
    position: absolute;
    top: -11px;
    left: 1.2rem;
    background: var(--primary-color);
    color: #fff;
    font-size: 0.72em;
    font-weight: 700;
    padding: 2px 10px;
    border-radius: 99px;
    letter-spacing: 0.5px;
  }

  .coming_soon {
    font-size: 0.7em;
    font-weight: 600;
    color: #9CA3AF;
    background: #F3F4F6;
    padding: 3px 8px;
    border-radius: 99px;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .tier_header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .tier_info {
    flex: 1;
    .tier_label {
      font-size: 1em;
      font-weight: 600;
      color: var(--text-color);
      margin: 0;
    }
    .tier_price {
      margin: 0.4rem 0 0;
      .amount { font-size: 1.3em; font-weight: 600; color: var(--text-color); }
      .period { font-size: 0.82em; color: var(--light-text-color); }
    }
  }

  .radio {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 2px solid #D1D5DB;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    align-self: flex-start;
    transition: border-color 0.2s;
    &.active { border-color: var(--primary-color); }
    .radio_dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--primary-color);
    }
  }

  .feature_list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .feature_item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9em;
    color: var(--light-text-color);
    .check { font-size: 0.8em; flex-shrink: 0; }
  }
`

export default SelectAccountTier