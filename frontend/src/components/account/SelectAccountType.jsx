import React from 'react'
import styled from 'styled-components'
import { BsCheckLg, BsBuildings, BsPerson } from "react-icons/bs"

const SelectAccountType = ({ selected, setSelected }) => {
  const options = [
    {
      id: 'personal',
      label: 'Personal',
      icon: <BsPerson />,
      features: [
        'Great for individual use',
        'Simple and easy to use',
      ],
    },
    {
      id: 'enterprise',
      label: 'Enterprise',
      icon: <BsBuildings />,
      disabled: true,
      features: [
        'Manage multiple team members',
        'Shared board ownership across team'
      ],
    },
  ]

  return (
    <Wrapper>
      {options.map((opt) => (
        <div
          key={opt.id}
          className={`option_card ${selected === opt.id ? 'active' : ''} ${opt.disabled ? 'disabled' : ''}`}
          onClick={() => !opt.disabled && setSelected(opt.id)}
        >
          <div className="option_header">
            <div className={`icon_circle ${selected === opt.id ? 'active' : ''} ${opt.disabled ? 'disabled' : ''}`}>
              {opt.icon}
            </div>
            <span className="option_label">{opt.label}</span>
            {opt.disabled
              ? <ComingSoon>Coming soon</ComingSoon>
              : (
                <div className={`radio ${selected === opt.id ? 'active' : ''}`}>
                  {selected === opt.id && <div className="radio_dot" />}
                </div>
              )
            }
          </div>

          <ul className="feature_list">
            {opt.features.map((f, i) => (
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

const ComingSoon = styled.span`
  font-size: 0.7em;
  font-weight: 600;
  color: #9CA3AF;
  background: #F3F4F6;
  padding: 3px 8px;
  border-radius: 99px;
  white-space: nowrap;
  flex-shrink: 0;
`

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  .option_card {
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

    &:hover:not(.disabled) {
      border-color: var(--primary-color);
    }

    &.disabled {
      cursor: not-allowed;
      opacity: 0.55;
      background: #F9FAFB;
    }
  }

  .option_header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .icon_circle {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #F3F4F6;
    color: var(--light-text-color);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1em;
    transition: background 0.2s, color 0.2s;
    flex-shrink: 0;

    &.active {
      background: var(--primary-color);
      color: #fff;
    }

    &.disabled {
      background: #F3F4F6;
      color: #D1D5DB;
    }
  }

  .option_label {
    flex: 1;
    font-size: 1em;
    font-weight: 600;
    color: var(--text-color);
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
    transition: border-color 0.2s;

    &.active {
      border-color: var(--primary-color);
    }

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

    .check {
      font-size: 0.8em;
      flex-shrink: 0;
    }
  }
`

export default SelectAccountType