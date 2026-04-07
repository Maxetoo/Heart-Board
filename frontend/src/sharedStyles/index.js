import styled from 'styled-components'

export const ModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
`

export const ModalBox = styled.div`
  background: #fff;
  border-radius: 20px;
  width: 100%;
  max-width: 380px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  max-height: 88vh;
  overflow-y: auto;

  .modal_header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.15rem;

    h3 {
      font-size: 1.1em;
      font-weight: 700;
      color: var(--text-color, #111);
      margin: 0;
    }

    .modal_close {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      border: 1.5px solid #ECEFF3;
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1em;
      cursor: pointer;
      color: var(--text-color, #111);
      transition: border-color 0.2s;
      &:hover { border-color: var(--primary-color, #EF5A42); color: var(--primary-color, #EF5A42); }
    }
  }

  .modal_continue {
    width: 100%;
    height: 50px;
    border: none;
    border-radius: 25px;
    background: var(--primary-color, #EF5A42);
    color: #fff;
    font-size: 1em;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s;
    flex-shrink: 0;
    &:hover { opacity: 0.88; }
    &:disabled { opacity: 0.4; cursor: not-allowed; }
  }
`

export const AccordionRow = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 1rem;
  border-radius: 10px;
  background: #F9FAFB;
  border: 1.5px solid #ECEFF3;
  font-size: 0.95em;
  font-weight: 500;
  color: var(--text-color, #111);
  cursor: pointer;
  transition: border-color 0.2s;
  &:hover { border-color: var(--primary-color, #EF5A42); }
  svg { color: #9CA3AF; font-size: 0.9em; }
`

export const ColorSection = styled.div`
  padding: 0.75rem;
  background: #FAFAFA;
  border-radius: 10px;
  border: 1.5px solid #ECEFF3;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  .swatches {
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
    padding: 6px 4px;
  }

  .swatch {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: transform 0.15s;
    &.active {
      outline: 2.5px solid var(--primary-color, #EF5A42);
      outline-offset: 2px;
    }
    &:hover:not(.active) { transform: scale(1.12); }
  }

  .custom_color_row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 0.25rem;
    label { font-size: 0.9em; color: var(--light-text-color, #6B7280); }
    input[type="color"] {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      border: 1.5px solid #ECEFF3;
      background: none;
      cursor: pointer;
      padding: 2px;
    }
  }
`

export const SearchInput = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0 1rem;
  height: 44px;
  background: #F3F4F6;
  border-radius: 99px;
  border: 1.5px solid transparent;
  transition: border-color 0.2s;
  &:focus-within { border-color: var(--primary-color, #EF5A42); background: #fff; }
  .search_icon { color: #9CA3AF; font-size: 1.15em; flex-shrink: 0; }
  input {
    flex: 1;
    border: none;
    background: transparent;
    outline: none;
    font-size: 0.95em;
    color: var(--text-color, #111);
    &::placeholder { color: #9CA3AF; }
  }
`

export const OpacityRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;

  .label {
    font-size: 0.9em;
    font-weight: 500;
    color: var(--text-color, #111);
    white-space: nowrap;
    min-width: 52px;
  }

  .val {
    font-size: 0.8em;
    color: var(--light-text-color, #6B7280);
    min-width: 36px;
    text-align: right;
  }

  .slider_wrap { flex: 1; }

  input[type="range"] {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 6px;
    border-radius: 3px;
    background: #E5E7EB;
    outline: none;
    cursor: pointer;

    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #F59E0B;
      cursor: pointer;
    }
  }
`

export const RemoveBtn = styled.button`
  width: 100%;
  height: 44px;
  flex-shrink: 0;
  background: transparent;
  border: 1.5px solid #ECEFF3;
  border-radius: 22px;
  cursor: pointer;
  font-size: 0.95em;
  color: #9CA3AF;
  transition: border-color 0.2s, color 0.2s;
  &:hover { border-color: #EF5A42; color: #EF5A42; }
`