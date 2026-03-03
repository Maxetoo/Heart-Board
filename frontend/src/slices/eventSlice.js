import { createSlice } from '@reduxjs/toolkit'


const loadCookieState = () => {
    const saved = localStorage.getItem('acceptedCookies');
    return saved ? JSON.parse(saved) : false;
};


const initialState = {
    navMenuOpen: false,
    acceptedCookies: loadCookieState(),
}

const authSlice = createSlice({
    name: 'event',
    initialState,
    reducers: {
        toggleNavMenu: (state) => {
            state.navMenuOpen = !state.navMenuOpen
        },
        closeNavMenu: (state) => {
            state.navMenuOpen = false
        },
        setUserCookies: (state) => {
            state.acceptedCookies = true
            localStorage.setItem('acceptedCookies', JSON.stringify(true))
        }
    },
})

export default authSlice.reducer
export const { toggleNavMenu, closeNavMenu, setUserCookies } = authSlice.actions