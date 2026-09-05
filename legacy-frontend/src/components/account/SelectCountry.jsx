import { useState } from 'react'
import styled from 'styled-components'
import { IoSearch } from "react-icons/io5"
import { BsCheckLg } from "react-icons/bs"

const COUNTRIES = [
  'Afghanistan','Albania','Algeria','Andorra','Angola','Argentina','Armenia','Australia',
  'Austria','Azerbaijan','Bahamas','Bahrain','Bangladesh','Belarus','Belgium','Belize',
  'Benin','Bolivia','Bosnia','Botswana','Brazil','Brunei','Bulgaria','Burkina Faso',
  'Burundi','Cambodia','Cameroon','Canada','Chile','China','Colombia','Congo','Croatia',
  'Cuba','Cyprus','Czech Republic','Denmark','Ecuador','Egypt','El Salvador','Estonia',
  'Ethiopia','Finland','France','Gabon','Georgia','Germany','Ghana','Greece','Guatemala',
  'Guinea','Haiti','Honduras','Hungary','Iceland','India','Indonesia','Iran','Iraq',
  'Ireland','Israel','Italy','Jamaica','Japan','Jordan','Kazakhstan','Kenya','Kuwait',
  'Kyrgyzstan','Latvia','Lebanon','Libya','Lithuania','Luxembourg','Malaysia','Mali',
  'Malta','Mexico','Moldova','Mongolia','Montenegro','Morocco','Mozambique','Myanmar',
  'Namibia','Nepal','Netherlands','New Zealand','Nicaragua','Niger','Nigeria','Norway',
  'Oman','Pakistan','Panama','Paraguay','Peru','Philippines','Poland','Portugal','Qatar',
  'Romania','Russia','Rwanda','Saudi Arabia','Senegal','Serbia','Singapore','Slovakia',
  'Slovenia','Somalia','South Africa','South Korea','Spain','Sri Lanka','Sudan','Sweden',
  'Switzerland','Syria','Taiwan','Tajikistan','Tanzania','Thailand','Togo','Tunisia',
  'Turkey','Uganda','Ukraine','United Arab Emirates','United Kingdom','United States',
  'Uruguay','Uzbekistan','Venezuela','Vietnam','Yemen','Zambia','Zimbabwe',
]

const SelectCountry = ({ selected, setSelected }) => {
  const [search, setSearch] = useState('')
  const filtered = COUNTRIES.filter(c =>
    c.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Wrapper>
      <div className="search_wrapper">
        <IoSearch className="search_icon" />
        <input
          type="text"
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <ul className="country_list">
        {filtered.length === 0 && (
          <p className="no_result">No countries found</p>
        )}
        {filtered.map((country) => (
          <li
            key={country}
            className={`country_item ${selected === country ? 'active' : ''}`}
            onClick={() => setSelected(country)}
          >
            <span>{country}</span>
            <div className={`check_circle ${selected === country ? 'active' : ''}`}>
              {selected === country && <BsCheckLg className="check_icon" />}
            </div>
          </li>
        ))}
      </ul>
    </Wrapper>
  )
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;

  .search_wrapper {
    display: flex;
    align-items: center;
    background: var(--secondary-color);
    border-radius: 25px;
    padding: 0 1rem;
    height: 40px;
    margin-bottom: 0.75rem;
    gap: 0.6rem;
    opacity: 0.8;

    .search_icon {
      color: var(--light-text-color);
      font-size: 1.15em;
      flex-shrink: 0;
    }

    input {
      flex: 1;
      border: none;
      outline: none;
      font-size: 0.95em;
      background: transparent;
      color: var(--text-color);
    }
  }

  .country_list {
    list-style: none;
    padding: 0;
    margin: 0;
    max-height: 260px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 2px;

    &::-webkit-scrollbar { width: 4px; }
    &::-webkit-scrollbar-track { background: transparent; }
    &::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 99px; }
  }

  .country_item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.5rem;
    padding: 1rem;
    border-radius: 10px;
    font-size: 0.9em;
    cursor: pointer;
    color: var(--text-color);
    transition: background 0.15s;
    background: var(--secondary-color);

    &:hover {
      background: #F3F4F6;
    }

    .check_circle {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      border: 2px solid #D1D5DB;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: border-color 0.2s, background 0.2s;

      &.active {
        border-color: #22c55e;
        background: #22c55e;
      }

      .check_icon {
        color: #fff;
        font-size: 0.55em;
        font-weight: 700;
      }
    }
  }

  .no_result {
    text-align: center;
    color: var(--light-text-color);
    font-size: 0.9em;
    padding: 1rem 0;
  }
`

export default SelectCountry