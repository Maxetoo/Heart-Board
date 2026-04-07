// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
// import axios from 'axios'
// import { URL } from '../paths/url'

// const initialState = {
//   upgradeLoad:    false,
//   upgradeError:   false,
//   upgradeErrorMsg:'',
//   paymentUrl:     null,        
//   pendingPayment: null,     

//   // board payment history
//   paymentsLoad:   false,
//   paymentsError:  false,
//   payments:       [],
//   currentTier:    'basic',

//   // admin: all payments
//   allPaymentsLoad: false,
//   allPaymentsError:false,
//   allPayments:     [],
//   allPaymentsPagination: null,
// }

// // Tier labels shown in the UI
// export const CAPACITY_OPTIONS = [
//   { id: 'only_me',   label: 'Only me',        messages: 1,    price: null,   tier: 'basic' },
//   { id: 'basic',     label: '20 curation',    messages: 20,   price: null,   tier: 'basic',    badge: 'Free' },
//   { id: 'standard',  label: '200 curation',   messages: 200,  price: 10,     tier: 'standard', badge: 'Pay $10' },
//   { id: 'premium_1', label: '1000 curation',  messages: 1000, price: 100,    tier: 'premium',  badge: 'Pay $100' },
//   { id: 'premium_2', label: 'Unlimited',      messages: -1,   price: 1000,   tier: 'premium',  badge: 'Pay $1000' },
// ]

// export const PRIVACY_OPTIONS = [
//   { id: 'public',     label: 'Public',             value: 'public' },
//   { id: 'link-only',  label: 'Only recipient',     value: 'link-only' },
//   { id: 'private',    label: 'Anonymous Curator',  value: 'private' },
// ]


// export const createBoardUpgrade = createAsyncThunk(
//   'boardPayment/createBoardUpgrade',
//   async ({ boardId, toTier }) => {
//     try {
//       const resp = await axios.post(
//         `${URL}/api/v1/board-payments/${boardId}/upgrade`,
//         { toTier },
//         { withCredentials: true }
//       )
//       return { response: resp.data, status: 'success' }
//     } catch (error) {
//       return {
//         response: error.response?.data || { message: 'Network error occurred' },
//         status: 'error',
//         code: error.response?.status || 500,
//       }
//     }
//   }
// )

// export const getBoardPayments = createAsyncThunk(
//   'boardPayment/getBoardPayments',
//   async (boardId) => {
//     try {
//       const resp = await axios.get(
//         `${URL}/api/v1/board-payments/${boardId}`,
//         { withCredentials: true }
//       )
//       return { response: resp.data, status: 'success' }
//     } catch (error) {
//       return {
//         response: error.response?.data || { message: 'Network error occurred' },
//         status: 'error',
//         code: error.response?.status || 500,
//       }
//     }
//   }
// )

// export const listAllBoardPayments = createAsyncThunk(
//   'boardPayment/listAllBoardPayments',
//   async (params = {}) => {
//     const { page = 1, limit = 20, status } = params
//     try {
//       const resp = await axios.get(`${URL}/api/v1/board-payments`, {
//         params: { page, limit, status },
//         withCredentials: true,
//       })
//       return { response: resp.data, status: 'success' }
//     } catch (error) {
//       return {
//         response: error.response?.data || { message: 'Network error occurred' },
//         status: 'error',
//         code: error.response?.status || 500,
//       }
//     }
//   }
// )



// const boardPaymentSlice = createSlice({
//   name: 'boardPayment',
//   initialState,
//   reducers: {
//     clearUpgradeState: (state) => {
//       state.upgradeError   = false
//       state.upgradeErrorMsg= ''
//       state.paymentUrl     = null
//       state.pendingPayment = null
//     },
//   },
//   extraReducers(builder) {
//     builder
//       // createBoardUpgrade
//       .addCase(createBoardUpgrade.pending, (state) => {
//         state.upgradeLoad    = true
//         state.upgradeError   = false
//         state.upgradeErrorMsg= ''
//         state.paymentUrl     = null
//         state.pendingPayment = null
//       })
//       .addCase(createBoardUpgrade.fulfilled, (state, action) => {
//         const { status, code, response } = action.payload
//         state.upgradeLoad = false
//         if (code === 500) {
//           state.upgradeError    = true
//           state.upgradeErrorMsg = "Can't start upgrade due to network"
//         } else if (status === 'success') {
//           state.upgradeError   = false
//           state.paymentUrl     = response.paymentUrl
//           state.pendingPayment = response.payment
//           // Redirect to Stripe checkout
//           if (response.paymentUrl) window.location.href = response.paymentUrl
//         } else {
//           state.upgradeError    = true
//           state.upgradeErrorMsg = response.msg || response.message || 'Upgrade failed'
//         }
//       })
//       .addCase(createBoardUpgrade.rejected, (state) => {
//         state.upgradeLoad    = false
//         state.upgradeError   = true
//         state.upgradeErrorMsg= 'Unable to start upgrade'
//       })

//       // getBoardPayments
//       .addCase(getBoardPayments.pending, (state) => {
//         state.paymentsLoad  = true
//         state.paymentsError = false
//       })
//       .addCase(getBoardPayments.fulfilled, (state, action) => {
//         const { status, response } = action.payload
//         state.paymentsLoad = false
//         if (status === 'success') {
//           state.payments    = response.payments
//           state.currentTier = response.currentTier
//         } else {
//           state.paymentsError = true
//         }
//       })
//       .addCase(getBoardPayments.rejected, (state) => {
//         state.paymentsLoad  = false
//         state.paymentsError = true
//       })

//       // listAllBoardPayments
//       .addCase(listAllBoardPayments.pending, (state) => {
//         state.allPaymentsLoad  = true
//         state.allPaymentsError = false
//       })
//       .addCase(listAllBoardPayments.fulfilled, (state, action) => {
//         const { status, response } = action.payload
//         state.allPaymentsLoad = false
//         if (status === 'success') {
//           state.allPayments           = response.payments
//           state.allPaymentsPagination = response.pagination
//         } else {
//           state.allPaymentsError = true
//         }
//       })
//       .addCase(listAllBoardPayments.rejected, (state) => {
//         state.allPaymentsLoad  = false
//         state.allPaymentsError = true
//       })
//   },
// })

// export default boardPaymentSlice.reducer
// export const { clearUpgradeState } = boardPaymentSlice.actions


// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
// import axios from 'axios'
// import { URL } from '../paths/url'

// const initialState = {
//   // create upgrade (Stripe checkout session)
//   upgradeLoad:    false,
//   upgradeError:   false,
//   upgradeErrorMsg:'',
//   paymentUrl:     null,        // Stripe checkout URL to redirect to
//   pendingPayment: null,        // { id, fromTier, toTier, amount }

//   // board payment history
//   paymentsLoad:   false,
//   paymentsError:  false,
//   payments:       [],
//   currentTier:    'basic',

//   // admin: all payments
//   allPaymentsLoad: false,
//   allPaymentsError:false,
//   allPayments:     [],
//   allPaymentsPagination: null,
// }

// // Tier labels shown in the UI
// export const CAPACITY_OPTIONS = [
//   { id: 'only_me',   label: 'Only me',        messages: 1,    price: null,   tier: 'basic' },
//   { id: 'basic',     label: '20 curation',    messages: 20,   price: null,   tier: 'basic',    badge: 'Free' },
//   { id: 'standard',  label: '200 curation',   messages: 200,  price: 10,     tier: 'standard', badge: 'Pay $10' },
//   { id: 'premium_1', label: '1000 curation',  messages: 1000, price: 100,    tier: 'premium',  badge: 'Pay $100' },
//   { id: 'premium_2', label: 'Unlimited',      messages: -1,   price: 1000,   tier: 'premium',  badge: 'Pay $1000' },
// ]

// export const PRIVACY_OPTIONS = [
//   { id: 'public',    label: 'Public',             value: 'public' },
//   { id: 'anonymous', label: 'Only recipient',     value: 'anonymous' },
//   { id: 'private',   label: 'Anonymous Curator',  value: 'private' },
// ]

// // ─── Thunks ───────────────────────────────────────────────────────────────────

// export const createBoardUpgrade = createAsyncThunk(
//   'boardPayment/createBoardUpgrade',
//   async ({ boardId, toTier }) => {
//     try {
//       const resp = await axios.post(
//         `${URL}/api/v1/board-payments/${boardId}/upgrade`,
//         { toTier },
//         { withCredentials: true }
//       )
//       return { response: resp.data, status: 'success' }
//     } catch (error) {
//       return {
//         response: error.response?.data || { message: 'Network error occurred' },
//         status: 'error',
//         code: error.response?.status || 500,
//       }
//     }
//   }
// )

// export const getBoardPayments = createAsyncThunk(
//   'boardPayment/getBoardPayments',
//   async (boardId) => {
//     try {
//       const resp = await axios.get(
//         `${URL}/api/v1/board-payments/${boardId}`,
//         { withCredentials: true }
//       )
//       return { response: resp.data, status: 'success' }
//     } catch (error) {
//       return {
//         response: error.response?.data || { message: 'Network error occurred' },
//         status: 'error',
//         code: error.response?.status || 500,
//       }
//     }
//   }
// )

// export const listAllBoardPayments = createAsyncThunk(
//   'boardPayment/listAllBoardPayments',
//   async (params = {}) => {
//     const { page = 1, limit = 20, status } = params
//     try {
//       const resp = await axios.get(`${URL}/api/v1/board-payments`, {
//         params: { page, limit, status },
//         withCredentials: true,
//       })
//       return { response: resp.data, status: 'success' }
//     } catch (error) {
//       return {
//         response: error.response?.data || { message: 'Network error occurred' },
//         status: 'error',
//         code: error.response?.status || 500,
//       }
//     }
//   }
// )

// // ─── Slice ────────────────────────────────────────────────────────────────────

// const boardPaymentSlice = createSlice({
//   name: 'boardPayment',
//   initialState,
//   reducers: {
//     clearUpgradeState: (state) => {
//       state.upgradeError   = false
//       state.upgradeErrorMsg= ''
//       state.paymentUrl     = null
//       state.pendingPayment = null
//     },
//   },
//   extraReducers(builder) {
//     builder
//       // createBoardUpgrade
//       .addCase(createBoardUpgrade.pending, (state) => {
//         state.upgradeLoad    = true
//         state.upgradeError   = false
//         state.upgradeErrorMsg= ''
//         state.paymentUrl     = null
//         state.pendingPayment = null
//       })
//       .addCase(createBoardUpgrade.fulfilled, (state, action) => {
//         const { status, code, response } = action.payload
//         state.upgradeLoad = false
//         if (code === 500) {
//           state.upgradeError    = true
//           state.upgradeErrorMsg = "Can't start upgrade due to network"
//         } else if (status === 'success') {
//           state.upgradeError   = false
//           state.paymentUrl     = response.paymentUrl
//           state.pendingPayment = response.payment
//           // Redirect to Stripe checkout
//           if (response.paymentUrl) window.location.href = response.paymentUrl
//         } else {
//           state.upgradeError    = true
//           state.upgradeErrorMsg = response.msg || response.message || 'Upgrade failed'
//         }
//       })
//       .addCase(createBoardUpgrade.rejected, (state) => {
//         state.upgradeLoad    = false
//         state.upgradeError   = true
//         state.upgradeErrorMsg= 'Unable to start upgrade'
//       })

//       // getBoardPayments
//       .addCase(getBoardPayments.pending, (state) => {
//         state.paymentsLoad  = true
//         state.paymentsError = false
//       })
//       .addCase(getBoardPayments.fulfilled, (state, action) => {
//         const { status, response } = action.payload
//         state.paymentsLoad = false
//         if (status === 'success') {
//           state.payments    = response.payments
//           state.currentTier = response.currentTier
//         } else {
//           state.paymentsError = true
//         }
//       })
//       .addCase(getBoardPayments.rejected, (state) => {
//         state.paymentsLoad  = false
//         state.paymentsError = true
//       })

//       // listAllBoardPayments
//       .addCase(listAllBoardPayments.pending, (state) => {
//         state.allPaymentsLoad  = true
//         state.allPaymentsError = false
//       })
//       .addCase(listAllBoardPayments.fulfilled, (state, action) => {
//         const { status, response } = action.payload
//         state.allPaymentsLoad = false
//         if (status === 'success') {
//           state.allPayments           = response.payments
//           state.allPaymentsPagination = response.pagination
//         } else {
//           state.allPaymentsError = true
//         }
//       })
//       .addCase(listAllBoardPayments.rejected, (state) => {
//         state.allPaymentsLoad  = false
//         state.allPaymentsError = true
//       })
//   },
// })

// export default boardPaymentSlice.reducer
// export const { clearUpgradeState } = boardPaymentSlice.actions


import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'
import { URL } from '../paths/url'


// ── Verify board upgrade purchase with backend ────────────────────────────────
// Called after RC SDK purchase succeeds on the frontend.
// Payload: { boardId: string, toTier: string, appUserId: string }
export const createBoardUpgrade = createAsyncThunk(
  'boardPayment/createBoardUpgrade',
  async ({ boardId, toTier, appUserId }) => {
    try {
      const resp = await axios.post(
        `${URL}/api/v1/board/payments/${boardId}/upgrade`,
        { toTier, appUserId },
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


// ── Get board payment history ─────────────────────────────────────────────────
export const getBoardPayments = createAsyncThunk(
  'boardPayment/getBoardPayments',
  async (boardId) => {
    try {
      const resp = await axios.get(
        `${URL}/api/v1/board/payments/${boardId}/payments`,
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


// ── Admin: list all board payments ────────────────────────────────────────────
export const listAllBoardPayments = createAsyncThunk(
  'boardPayment/listAllBoardPayments',
  async (params = {}) => {
    const { page = 1, limit = 20, status } = params
    try {
      const resp = await axios.get(`${URL}/api/v1/board/payments/all`, {
        params: { page, limit, status },
        withCredentials: true,
      })
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


// ── Tier / capacity options ────────────────────────────────────────────────────
// These are shown in the board creation / upgrade UI.
export const CAPACITY_OPTIONS = [
  { id: 'only_me',  label: 'Only me',             messages: 1,  price: null, tier: 'basic'                                          },
  { id: 'basic',    label: '20 curations',         messages: 20, price: null, tier: 'basic',    badge: 'Free'                        },
  { id: 'standard', label: '50 curations',         messages: 50, price: null, tier: 'standard', badge: null,   disabled: true },
  { id: 'premium',  label: 'Unlimited curations',  messages: -1, price: null, tier: 'premium',  badge: null,   disabled: true },
]

export const PRIVACY_OPTIONS = [
  { id: 'public',    label: 'Public',             value: 'public'    },
  { id: 'private',   label: 'Only recipient',     value: 'private'   },
  { id: 'anonymous', label: 'Anonymous Curator',  value: 'anonymous' },
]


const initialState = {
  // upgrade
  upgradeLoad:     false,
  upgradeError:    false,
  upgradeErrorMsg: '',
  upgradeSuccess:  false,
  upgradedBoard:   null,

  // board payment history
  paymentsLoad:  false,
  paymentsError: false,
  payments:      [],
  currentTier:   'basic',

  // admin
  allPaymentsLoad:       false,
  allPaymentsError:      false,
  allPayments:           [],
  allPaymentsPagination: null,
}


const boardPaymentSlice = createSlice({
  name: 'boardPayment',
  initialState,
  reducers: {
    clearUpgradeState: (state) => {
      state.upgradeError   = false
      state.upgradeErrorMsg= ''
      state.upgradeSuccess = false
      state.upgradedBoard  = null
    },
  },
  extraReducers(builder) {
    builder

      // createBoardUpgrade
      .addCase(createBoardUpgrade.pending, (state) => {
        state.upgradeLoad    = true
        state.upgradeError   = false
        state.upgradeErrorMsg= ''
        state.upgradeSuccess = false
        state.upgradedBoard  = null
      })
      .addCase(createBoardUpgrade.fulfilled, (state, action) => {
        const { status, code, response } = action.payload
        state.upgradeLoad = false
        if (code === 500) {
          state.upgradeError    = true
          state.upgradeErrorMsg = 'Bad connection'
        } else if (status === 'success') {
          state.upgradeSuccess = true
          state.upgradedBoard  = response.board
          state.currentTier    = response.board?.tier ?? state.currentTier
        } else {
          state.upgradeError    = true
          state.upgradeErrorMsg = response.message || 'Upgrade failed'
        }
      })
      .addCase(createBoardUpgrade.rejected, (state) => {
        state.upgradeLoad    = false
        state.upgradeError   = true
        state.upgradeErrorMsg= 'Unable to complete upgrade'
      })

      // getBoardPayments
      .addCase(getBoardPayments.pending, (state) => {
        state.paymentsLoad  = true
        state.paymentsError = false
      })
      .addCase(getBoardPayments.fulfilled, (state, action) => {
        const { status, response } = action.payload
        state.paymentsLoad = false
        if (status === 'success') {
          state.payments    = response.payments
          state.currentTier = response.currentTier
        } else {
          state.paymentsError = true
        }
      })
      .addCase(getBoardPayments.rejected, (state) => {
        state.paymentsLoad  = false
        state.paymentsError = true
      })

      // listAllBoardPayments (admin)
      .addCase(listAllBoardPayments.pending, (state) => {
        state.allPaymentsLoad  = true
        state.allPaymentsError = false
      })
      .addCase(listAllBoardPayments.fulfilled, (state, action) => {
        const { status, response } = action.payload
        state.allPaymentsLoad = false
        if (status === 'success') {
          state.allPayments           = response.payments
          state.allPaymentsPagination = response.pagination
        } else {
          state.allPaymentsError = true
        }
      })
      .addCase(listAllBoardPayments.rejected, (state) => {
        state.allPaymentsLoad  = false
        state.allPaymentsError = true
      })
  },
})

export default boardPaymentSlice.reducer
export const { clearUpgradeState } = boardPaymentSlice.actions