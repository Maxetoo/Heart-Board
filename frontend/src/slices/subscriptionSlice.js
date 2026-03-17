import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'
import { URL } from '../paths/url'


export const getMySubscription = createAsyncThunk(
    'subscription/getMySubscription',
    async () => {
        try {
            const resp = await axios.get(
                `${URL}/api/v1/subscription/mine`,
                { withCredentials: true }
            )
            return { response: resp.data, status: 'success' }
        } catch (error) {
            return {
                response: error.response?.data || { message: 'Network error occurred' },
                status: 'error',
                code: error.response?.status || 500,
            }
        }
    }
)


export const verifyPurchase = createAsyncThunk(
    'subscription/verifyPurchase',
    async ({ appUserId, plan }) => {
        try {
            const resp = await axios.post(
                `${URL}/api/v1/subscription/verify`,
                { appUserId, plan },
                { withCredentials: true }
            )
            return { response: resp.data, status: 'success' }
        } catch (error) {
            return {
                response: error.response?.data || { message: 'Network error occurred' },
                status: 'error',
                code: error.response?.status || 500,
            }
        }
    }
)


// ── Cancel subscription ───────────────────────────────────────────────────────
export const cancelSubscription = createAsyncThunk(
    'subscription/cancelSubscription',
    async () => {
        try {
            const resp = await axios.post(
                `${URL}/api/v1/subscription/cancel`,
                {},
                { withCredentials: true }
            )
            return { response: resp.data, status: 'success' }
        } catch (error) {
            return {
                response: error.response?.data || { message: 'Network error occurred' },
                status: 'error',
                code: error.response?.status || 500,
            }
        }
    }
)


export const listSubscriptions = createAsyncThunk(
    'subscription/listSubscriptions',
    async (payload = {}) => {
        const { plan = '', status = '', page = 1, limit = 20 } = payload
        try {
            const resp = await axios.get(
                `${URL}/api/v1/subscription`,
                {
                    params: { plan, status, page, limit },
                    withCredentials: true,
                }
            )
            return { response: resp.data, status: 'success' }
        } catch (error) {
            return {
                response: error.response?.data || { message: 'Network error occurred' },
                status: 'error',
                code: error.response?.status || 500,
            }
        }
    }
)


const initialState = {
    // my subscription
    subscription:        null,
    subscriptionLimits:  null,
    subscriptionLoad:    false,
    subscriptionError:   false,
    subscriptionErrorMsg:'',

    // verify purchase (replaces checkout)
    verifyLoad:    false,
    verifyError:   false,
    verifyErrorMsg:'',
    verifySuccess: false,

    // cancel
    cancelLoad:       false,
    cancelError:      false,
    cancelErrorMsg:   '',
    cancelSuccessMsg: '',

    // admin
    subscriptions:            [],
    subscriptionsPagination:  null,
    listSubscriptionsLoad:    false,
    listSubscriptionsError:   false,
    listSubscriptionsErrorMsg:'',
}


const subscriptionSlice = createSlice({
    name: 'subscription',
    initialState,
    reducers: {
        clearSubscriptionNotifications: (state) => {
            state.subscriptionError    = false
            state.subscriptionErrorMsg = ''
            state.verifyError          = false
            state.verifyErrorMsg       = ''
            state.verifySuccess        = false
            state.cancelError          = false
            state.cancelErrorMsg       = ''
            state.cancelSuccessMsg     = ''
            state.listSubscriptionsError    = false
            state.listSubscriptionsErrorMsg = ''
        },
    },
    extraReducers(builder) {
        builder

            // getMySubscription
            .addCase(getMySubscription.pending, (state) => {
                state.subscriptionLoad    = true
                state.subscriptionError   = false
                state.subscriptionErrorMsg= ''
            })
            .addCase(getMySubscription.fulfilled, (state, action) => {
                const { status, code, response } = action.payload
                state.subscriptionLoad = false
                if (code === 500) {
                    state.subscriptionError    = true
                    state.subscriptionErrorMsg = 'Bad connection'
                } else if (status === 'success') {
                    state.subscription       = response.subscription
                    state.subscriptionLimits = response.limits
                } else {
                    state.subscriptionError    = true
                    state.subscriptionErrorMsg = response.message || 'Failed to fetch subscription'
                }
            })
            .addCase(getMySubscription.rejected, (state) => {
                state.subscriptionLoad    = false
                state.subscriptionError   = true
                state.subscriptionErrorMsg= 'Unable to fetch subscription'
            })

            // verifyPurchase
            .addCase(verifyPurchase.pending, (state) => {
                state.verifyLoad    = true
                state.verifyError   = false
                state.verifyErrorMsg= ''
                state.verifySuccess = false
            })
            .addCase(verifyPurchase.fulfilled, (state, action) => {
                const { status, code, response } = action.payload
                state.verifyLoad = false
                if (code === 500) {
                    state.verifyError    = true
                    state.verifyErrorMsg = 'Bad connection'
                } else if (status === 'success') {
                    state.verifySuccess      = true
                    state.subscription       = response.subscription
                    state.subscriptionLimits = response.limits
                } else {
                    state.verifyError    = true
                    state.verifyErrorMsg = response.message || 'Failed to verify purchase'
                }
            })
            .addCase(verifyPurchase.rejected, (state) => {
                state.verifyLoad    = false
                state.verifyError   = true
                state.verifyErrorMsg= 'Unable to verify purchase'
            })

            // cancelSubscription
            .addCase(cancelSubscription.pending, (state) => {
                state.cancelLoad       = true
                state.cancelError      = false
                state.cancelErrorMsg   = ''
                state.cancelSuccessMsg = ''
            })
            .addCase(cancelSubscription.fulfilled, (state, action) => {
                const { status, code, response } = action.payload
                state.cancelLoad = false
                if (code === 500) {
                    state.cancelError    = true
                    state.cancelErrorMsg = 'Bad connection'
                } else if (status === 'success') {
                    state.cancelSuccessMsg = response.message || 'Subscription cancelled'
                    if (state.subscription) state.subscription.status = 'cancelled'
                } else {
                    state.cancelError    = true
                    state.cancelErrorMsg = response.message || 'Failed to cancel subscription'
                }
            })
            .addCase(cancelSubscription.rejected, (state) => {
                state.cancelLoad    = false
                state.cancelError   = true
                state.cancelErrorMsg= 'Unable to cancel subscription'
            })

            // listSubscriptions (admin)
            .addCase(listSubscriptions.pending, (state) => {
                state.listSubscriptionsLoad  = true
                state.listSubscriptionsError = false
            })
            .addCase(listSubscriptions.fulfilled, (state, action) => {
                const { status, response } = action.payload
                state.listSubscriptionsLoad = false
                if (status === 'success') {
                    state.subscriptions           = response.subscriptions
                    state.subscriptionsPagination = response.pagination
                } else {
                    state.listSubscriptionsError    = true
                    state.listSubscriptionsErrorMsg = response.message || 'Failed to fetch subscriptions'
                }
            })
            .addCase(listSubscriptions.rejected, (state) => {
                state.listSubscriptionsLoad  = false
                state.listSubscriptionsError = true
            })
    }
})

export default subscriptionSlice.reducer
export const { clearSubscriptionNotifications } = subscriptionSlice.actions