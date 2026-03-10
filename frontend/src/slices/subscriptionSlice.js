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

export const createCheckoutSession = createAsyncThunk(
    'subscription/createCheckoutSession',
    async (payload) => {
        const { plan } = payload
        try {
            const resp = await axios.post(
                `${URL}/api/v1/subscription/checkout`,
                { plan },
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

// Admin
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
    subscription: null,
    subscriptionLimits: null,
    subscriptionLoad: false,
    subscriptionError: false,
    subscriptionErrorMsg: '',

    // checkout
    checkoutUrl: '',
    checkoutLoad: false,
    checkoutError: false,
    checkoutErrorMsg: '',

    // cancel
    cancelLoad: false,
    cancelError: false,
    cancelErrorMsg: '',
    cancelSuccessMsg: '',

    // admin: list subscriptions
    subscriptions: [],
    subscriptionsPagination: null,
    listSubscriptionsLoad: false,
    listSubscriptionsError: false,
    listSubscriptionsErrorMsg: '',
}


const subscriptionSlice = createSlice({
    name: 'subscription',
    initialState,
    reducers: {
        clearSubscriptionNotifications: (state) => {
            state.subscriptionError = false
            state.subscriptionErrorMsg = ''
            state.checkoutError = false
            state.checkoutErrorMsg = ''
            state.checkoutUrl = ''
            state.cancelError = false
            state.cancelErrorMsg = ''
            state.cancelSuccessMsg = ''
            state.listSubscriptionsError = false
            state.listSubscriptionsErrorMsg = ''
        },
    },
    extraReducers(builder) {
        builder
            .addCase(getMySubscription.pending, (state) => {
                state.subscriptionLoad = true
                state.subscriptionError = false
                state.subscriptionErrorMsg = ''
            })
            .addCase(getMySubscription.fulfilled, (state, action) => {
                const { status, code, response } = action.payload
                state.subscriptionLoad = false

                if (code === 500) {
                    state.subscriptionError = true
                    state.subscriptionErrorMsg = `Bad connection`
                } else if (status === 'success') {
                    state.subscriptionError = false
                    state.subscription = response.subscription
                    state.subscriptionLimits = response.limits
                } else {
                    state.subscriptionError = true
                    state.subscriptionErrorMsg = response.msg || response.message || 'Failed to fetch subscription'
                }
            })
            .addCase(getMySubscription.rejected, (state) => {
                state.subscriptionLoad = false
                state.subscriptionError = true
                state.subscriptionErrorMsg = 'Unable to fetch subscription'
            })

            .addCase(createCheckoutSession.pending, (state) => {
                state.checkoutLoad = true
                state.checkoutError = false
                state.checkoutErrorMsg = ''
                state.checkoutUrl = ''
            })
            .addCase(createCheckoutSession.fulfilled, (state, action) => {
                const { status, code, response } = action.payload
                state.checkoutLoad = false

                if (code === 500) {
                    state.checkoutError = true
                    state.checkoutErrorMsg = `Bad connection`
                } else if (status === 'success') {
                    state.checkoutError = false
                    state.checkoutUrl = response.url
                    // redirect to Stripe checkout
                    window.location.href = response.url
                } else {
                    state.checkoutError = true
                    state.checkoutErrorMsg = response.msg || response.message || 'Failed to create checkout session'
                }
            })
            .addCase(createCheckoutSession.rejected, (state) => {
                state.checkoutLoad = false
                state.checkoutError = true
                state.checkoutErrorMsg = 'Unable to create checkout session'
            })

            .addCase(cancelSubscription.pending, (state) => {
                state.cancelLoad = true
                state.cancelError = false
                state.cancelErrorMsg = ''
                state.cancelSuccessMsg = ''
            })
            .addCase(cancelSubscription.fulfilled, (state, action) => {
                const { status, code, response } = action.payload
                state.cancelLoad = false

                if (code === 500) {
                    state.cancelError = true
                    state.cancelErrorMsg = `Bad connection`
                } else if (status === 'success') {
                    state.cancelError = false
                    state.cancelSuccessMsg = response.message || 'Subscription cancelled successfully'
                    if (state.subscription) {
                        state.subscription.status = 'cancelled'
                    }
                } else {
                    state.cancelError = true
                    state.cancelErrorMsg = response.msg || response.message || 'Failed to cancel subscription'
                }
            })
            .addCase(cancelSubscription.rejected, (state) => {
                state.cancelLoad = false
                state.cancelError = true
                state.cancelErrorMsg = 'Unable to cancel subscription'
            })

            .addCase(listSubscriptions.pending, (state) => {
                state.listSubscriptionsLoad = true
                state.listSubscriptionsError = false
                state.listSubscriptionsErrorMsg = ''
            })
            .addCase(listSubscriptions.fulfilled, (state, action) => {
                const { status, code, response } = action.payload
                state.listSubscriptionsLoad = false

                if (code === 500) {
                    state.listSubscriptionsError = true
                    state.listSubscriptionsErrorMsg = `Bad connection`
                } else if (status === 'success') {
                    state.listSubscriptionsError = false
                    state.subscriptions = response.subscriptions
                    state.subscriptionsPagination = response.pagination
                } else {
                    state.listSubscriptionsError = true
                    state.listSubscriptionsErrorMsg = response.msg || response.message || 'Failed to fetch subscriptions'
                }
            })
            .addCase(listSubscriptions.rejected, (state) => {
                state.listSubscriptionsLoad = false
                state.listSubscriptionsError = true
                state.listSubscriptionsErrorMsg = 'Unable to fetch subscriptions'
            })
    }
})

export default subscriptionSlice.reducer
export const { clearSubscriptionNotifications } = subscriptionSlice.actions