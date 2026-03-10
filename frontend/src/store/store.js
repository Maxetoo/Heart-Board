import { configureStore } from '@reduxjs/toolkit'
import eventSlice from '../slices/eventSlice'
import authSlice from '../slices/authSlice'
import userSlice from '../slices/userSlice'
import subscriptionSlice from '../slices/subscriptionSlice'
import boardSlice from '../slices/boardSlice'
import boardPaymentSlice from '../slices/boardPaymentSlice'
import uploadSlice from '../slices/uploadSlice'
import messageSlice from '../slices/messageSlice'




export const store = configureStore({
    reducer: {
        event: eventSlice,
        auth: authSlice,
        user: userSlice,
        subscription: subscriptionSlice,
        board: boardSlice,
        boardPayment: boardPaymentSlice, 
        upload: uploadSlice,
        message: messageSlice,
    }
})