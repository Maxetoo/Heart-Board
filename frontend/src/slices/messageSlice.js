// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
// import axios from 'axios'
// import { URL } from '../paths/url'

// const initialState = {
//   // post message to board
//   postMessageLoad:    false,
//   postMessageError:   false,
//   postMessageErrorMsg:'',
//   postedMessage:      null,

//   // board messages list
//   boardMessages:      [],
//   boardMessagesLoad:  false,
//   boardMessagesError: false,
//   boardMessagesPagination: null,

//   // my messages
//   myMessages:         [],
//   myMessagesLoad:     false,
//   myMessagesError:    false,
//   myMessagesPagination: null,

//   // single message
//   message:            null,
//   messageLoad:        false,
//   messageError:       false,
//   messageErrorMsg:    '',

//   // delete
//   deleteMessageLoad:  false,
//   deleteMessageError: false,

//   // moderate board message
//   moderateLoad:       false,
//   moderateError:      false,

//   // direct message
//   postDirectLoad:     false,
//   postDirectError:    false,
//   postDirectErrorMsg: '',

//   // wall messages
//   wallMessages:       [],
//   wallMessagesLoad:   false,
//   wallMessagesError:  false,
//   wallMessagesPagination: null,

//   // edit message
//   editMessageLoad:    false,
//   editMessageError:   false,
//   editMessageErrorMsg:'',
// }



// export const postMessage = createAsyncThunk(
//   'message/postMessage',
//   async ({ slug, type, content, cloudinaryPublicId, fileType }) => {
//     try {
//       const resp = await axios.post(
//         `${URL}/api/v1/message/${slug}`, 
//         { type, content, cloudinaryPublicId, fileType },
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

// export const getBoardMessages = createAsyncThunk(
//   'message/getBoardMessages',
//   async ({ slug, page = 1, limit = 20, type, status }) => {
//     try {
//       const resp = await axios.get(
//         `${URL}/api/v1/message/${slug}/board`,
//         {
//           params: { page, limit, type, status },
//           withCredentials: true,
//         }
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

// export const moderateBoardMessage = createAsyncThunk(
//   'message/moderateBoardMessage',
//   async ({ id, status }) => {
//     try {
//       const resp = await axios.patch(
//         `${URL}/api/v1/message/board/${id}/moderate`,
//         { status },
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

// export const postDirectMessage = createAsyncThunk(
//   'message/postDirectMessage',
//   async ({ username, type, content }) => {
//     try {
//       const resp = await axios.post(
//         `${URL}/api/v1/message/${username}`,
//         { type, content },
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

// export const getUserWallMessages = createAsyncThunk(
//   'message/getUserWallMessages',
//   async ({ username, page = 1, limit = 20, type, status }) => {
//     try {
//       const resp = await axios.get(
//         `${URL}/api/v1/message/${username}`,
//         {
//           params: { page, limit, type, status },
//           withCredentials: true,
//         }
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

// export const getMessage = createAsyncThunk(
//   'message/getMessage',
//   async (id) => {
//     try {
//       const resp = await axios.get(`${URL}/api/v1/message/${id}`, {
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

// export const deleteMessage = createAsyncThunk(
//   'message/deleteMessage',
//   async (id) => {
//     try {
//       const resp = await axios.delete(`${URL}/api/v1/message/${id}`, {
//         withCredentials: true,
//       })
//       return { response: resp.data, status: 'success', id }
//     } catch (error) {
//       return {
//         response: error.response?.data || { message: 'Network error occurred' },
//         status: 'error',
//         code: error.response?.status || 500,
//       }
//     }
//   }
// )

// export const getMyMessages = createAsyncThunk(
//   'message/getMyMessages',
//   async (params = {}) => {
//     const { page = 1, limit = 20, context } = params
//     try {
//       const resp = await axios.get(`${URL}/api/v1/message/mine`, {
//         params: { page, limit, context },
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

// export const editMessage = createAsyncThunk(
//   'message/editMessage',
//   async ({ id, content, canvasData }) => {
//     try {
//       const resp = await axios.patch(
//         `${URL}/api/v1/message/${id}`,
//         { content, canvasData },
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


// // Helper: replace a message by _id in a list, or return the list unchanged.
// const replaceInList = (list, updated) =>
//   list.map(m => (m._id === updated._id ? updated : m))


// const messageSlice = createSlice({
//   name: 'message',
//   initialState,
//   reducers: {
//     clearMessageNotifications: (state) => {
//       state.postMessageError    = false
//       state.postMessageErrorMsg = ''
//       state.postDirectError     = false
//       state.postDirectErrorMsg  = ''
//       state.messageError        = false
//       state.messageErrorMsg     = ''
//       state.deleteMessageError  = false
//       state.moderateError       = false
//       state.editMessageError    = false
//       state.editMessageErrorMsg = ''
//     },
//     clearPostedMessage: (state) => {
//       state.postedMessage = null
//     },
//   },
//   extraReducers(builder) {
//     builder
//       // postMessage
//       .addCase(postMessage.pending, (state) => {
//         state.postMessageLoad     = true
//         state.postMessageError    = false
//         state.postMessageErrorMsg = ''
//         state.postedMessage       = null
//       })
//       .addCase(postMessage.fulfilled, (state, action) => {
//         const { status, code, response } = action.payload
//         state.postMessageLoad = false
//         if (code === 500) {
//           state.postMessageError    = true
//           state.postMessageErrorMsg = "Can't post message due to network"
//         } else if (status === 'success') {
//           state.postMessageError = false
//           state.postedMessage    = response.data
//         } else {
//           state.postMessageError    = true
//           state.postMessageErrorMsg = response.msg || response.message || 'Failed to post message'
//         }
//       })
//       .addCase(postMessage.rejected, (state) => {
//         state.postMessageLoad     = false
//         state.postMessageError    = true
//         state.postMessageErrorMsg = 'Unable to post message'
//       })

//       // getBoardMessages
//       .addCase(getBoardMessages.pending, (state) => {
//         state.boardMessagesLoad  = true
//         state.boardMessagesError = false
//       })
//       .addCase(getBoardMessages.fulfilled, (state, action) => {
//         const { status, response } = action.payload
//         state.boardMessagesLoad = false
//         if (status === 'success') {
//           state.boardMessages           = response.messages
//           state.boardMessagesPagination = response.pagination
//         } else {
//           state.boardMessagesError = true
//         }
//       })
//       .addCase(getBoardMessages.rejected, (state) => {
//         state.boardMessagesLoad  = false
//         state.boardMessagesError = true
//       })

//       // moderateBoardMessage
//       .addCase(moderateBoardMessage.pending, (state) => {
//         state.moderateLoad  = true
//         state.moderateError = false
//       })
//       .addCase(moderateBoardMessage.fulfilled, (state, action) => {
//         const { status, response } = action.payload
//         state.moderateLoad = false
//         if (status === 'success') {
//           const updated = response.data
//           state.boardMessages = state.boardMessages.map(m =>
//             m._id === updated._id ? updated : m
//           )
//         } else {
//           state.moderateError = true
//         }
//       })
//       .addCase(moderateBoardMessage.rejected, (state) => {
//         state.moderateLoad  = false
//         state.moderateError = true
//       })

//       // postDirectMessage
//       .addCase(postDirectMessage.pending, (state) => {
//         state.postDirectLoad     = true
//         state.postDirectError    = false
//         state.postDirectErrorMsg = ''
//       })
//       .addCase(postDirectMessage.fulfilled, (state, action) => {
//         const { status, code, response } = action.payload
//         state.postDirectLoad = false
//         if (code === 500) {
//           state.postDirectError    = true
//           state.postDirectErrorMsg = "Can't send message due to network"
//         } else if (status === 'success') {
//           state.postDirectError = false
//         } else {
//           state.postDirectError    = true
//           state.postDirectErrorMsg = response.msg || response.message || 'Failed to send message'
//         }
//       })
//       .addCase(postDirectMessage.rejected, (state) => {
//         state.postDirectLoad     = false
//         state.postDirectError    = true
//         state.postDirectErrorMsg = 'Unable to send message'
//       })

//       // getUserWallMessages
//       .addCase(getUserWallMessages.pending, (state) => {
//         state.wallMessagesLoad  = true
//         state.wallMessagesError = false
//       })
//       .addCase(getUserWallMessages.fulfilled, (state, action) => {
//         const { status, response } = action.payload
//         state.wallMessagesLoad = false
//         if (status === 'success') {
//           state.wallMessages           = response.messages
//           state.wallMessagesPagination = response.pagination
//         } else {
//           state.wallMessagesError = true
//         }
//       })
//       .addCase(getUserWallMessages.rejected, (state) => {
//         state.wallMessagesLoad  = false
//         state.wallMessagesError = true
//       })

//       // getMessage
//       .addCase(getMessage.pending, (state) => {
//         state.messageLoad  = true
//         state.messageError = false
//         state.message      = null
//       })
//       .addCase(getMessage.fulfilled, (state, action) => {
//         const { status, response } = action.payload
//         state.messageLoad = false
//         if (status === 'success') {
//           state.messageError = false
//           state.message      = response.message
//         } else {
//           state.messageError    = true
//           state.messageErrorMsg = response.msg || response.message || 'Message not found'
//         }
//       })
//       .addCase(getMessage.rejected, (state) => {
//         state.messageLoad     = false
//         state.messageError    = true
//         state.messageErrorMsg = 'Unable to fetch message'
//       })

//       // deleteMessage
//       .addCase(deleteMessage.pending, (state) => {
//         state.deleteMessageLoad  = true
//         state.deleteMessageError = false
//       })
//       .addCase(deleteMessage.fulfilled, (state, action) => {
//         const { status, id } = action.payload
//         state.deleteMessageLoad = false
//         if (status === 'success') {
//           state.boardMessages = state.boardMessages.filter(m => m._id !== id)
//           state.myMessages    = state.myMessages.filter(m => m._id !== id)
//         } else {
//           state.deleteMessageError = true
//         }
//       })
//       .addCase(deleteMessage.rejected, (state) => {
//         state.deleteMessageLoad  = false
//         state.deleteMessageError = true
//       })

//       // getMyMessages
//       .addCase(getMyMessages.pending, (state) => {
//         state.myMessagesLoad  = true
//         state.myMessagesError = false
//       })
//       .addCase(getMyMessages.fulfilled, (state, action) => {
//         const { status, response } = action.payload
//         state.myMessagesLoad = false
//         if (status === 'success') {
//           state.myMessages           = response.messages
//           state.myMessagesPagination = response.pagination
//         } else {
//           state.myMessagesError = true
//         }
//       })
//       .addCase(getMyMessages.rejected, (state) => {
//         state.myMessagesLoad  = false
//         state.myMessagesError = true
//       })

//       // editMessage
//       .addCase(editMessage.pending, (state) => {
//         state.editMessageLoad     = true
//         state.editMessageError    = false
//         state.editMessageErrorMsg = ''
//       })
//       .addCase(editMessage.fulfilled, (state, action) => {
//         const { status, code, response } = action.payload
//         state.editMessageLoad = false
//         if (code === 500) {
//           state.editMessageError    = true
//           state.editMessageErrorMsg = "Can't edit message due to network"
//         } else if (status === 'success') {
//           const updated = response.data
//           // Sync the updated message across every list that may contain it
//           state.boardMessages  = replaceInList(state.boardMessages,  updated)
//           state.myMessages     = replaceInList(state.myMessages,     updated)
//           state.wallMessages   = replaceInList(state.wallMessages,   updated)
//           // If the single-message view is open for this message, update it too
//           if (state.message?._id === updated._id) {
//             state.message = updated
//           }
//         } else {
//           state.editMessageError    = true
//           state.editMessageErrorMsg = response.msg || response.message || 'Failed to edit message'
//         }
//       })
//       .addCase(editMessage.rejected, (state) => {
//         state.editMessageLoad     = false
//         state.editMessageError    = true
//         state.editMessageErrorMsg = 'Unable to edit message'
//       })
//   },
// })

// export default messageSlice.reducer
// export const { clearMessageNotifications, clearPostedMessage } = messageSlice.actions

// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
// import axios from 'axios'
// import { URL } from '../paths/url'

// const initialState = {
//   // post message to board
//   postMessageLoad:    false,
//   postMessageError:   false,
//   postMessageErrorMsg:'',
//   postedMessage:      null,

//   // board messages list
//   boardMessages:      [],
//   boardMessagesLoad:  false,
//   boardMessagesError: false,
//   boardMessagesPagination: null,

//   // my messages
//   myMessages:         [],
//   myMessagesLoad:     false,
//   myMessagesError:    false,
//   myMessagesPagination: null,

//   // single message
//   message:            null,
//   messageLoad:        false,
//   messageError:       false,
//   messageErrorMsg:    '',

//   // delete
//   deleteMessageLoad:  false,
//   deleteMessageError: false,

//   // moderate board message
//   moderateLoad:       false,
//   moderateError:      false,

//   // direct message
//   postDirectLoad:     false,
//   postDirectError:    false,
//   postDirectErrorMsg: '',

//   // wall messages
//   wallMessages:       [],
//   wallMessagesLoad:   false,
//   wallMessagesError:  false,
//   wallMessagesPagination: null,
// }



// export const postMessage = createAsyncThunk(
//   'message/postMessage',
//   async ({ slug, type, content, cloudinaryPublicId, fileType }) => {
//     try {
//       const resp = await axios.post(
//         `${URL}/api/v1/message/${slug}`, 
//         { type, content, cloudinaryPublicId, fileType },
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

// export const getBoardMessages = createAsyncThunk(
//   'message/getBoardMessages',
//   async ({ slug, page = 1, limit = 20, type, status }) => {
//     try {
//       const resp = await axios.get(
//         `${URL}/api/v1/message/${slug}/board`,
//         {
//           params: { page, limit, type, status },
//           withCredentials: true,
//         }
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

// export const moderateBoardMessage = createAsyncThunk(
//   'message/moderateBoardMessage',
//   async ({ id, status }) => {
//     try {
//       const resp = await axios.patch(
//         `${URL}/api/v1/message/board/${id}/moderate`,
//         { status },
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

// export const postDirectMessage = createAsyncThunk(
//   'message/postDirectMessage',
//   async ({ username, type, content }) => {
//     try {
//       const resp = await axios.post(
//         `${URL}/api/v1/message/${username}`,
//         { type, content },
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

// export const getUserWallMessages = createAsyncThunk(
//   'message/getUserWallMessages',
//   async ({ username, page = 1, limit = 20, type, status }) => {
//     try {
//       const resp = await axios.get(
//         `${URL}/api/v1/message/${username}`,
//         {
//           params: { page, limit, type, status },
//           withCredentials: true,
//         }
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

// export const getMessage = createAsyncThunk(
//   'message/getMessage',
//   async (id) => {
//     try {
//       const resp = await axios.get(`${URL}/api/v1/message/${id}`, {
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

// export const deleteMessage = createAsyncThunk(
//   'message/deleteMessage',
//   async (id) => {
//     try {
//       const resp = await axios.delete(`${URL}/api/v1/message/${id}`, {
//         withCredentials: true,
//       })
//       return { response: resp.data, status: 'success', id }
//     } catch (error) {
//       return {
//         response: error.response?.data || { message: 'Network error occurred' },
//         status: 'error',
//         code: error.response?.status || 500,
//       }
//     }
//   }
// )

// export const getMyMessages = createAsyncThunk(
//   'message/getMyMessages',
//   async (params = {}) => {
//     const { page = 1, limit = 20, context } = params
//     try {
//       const resp = await axios.get(`${URL}/api/v1/message/mine`, {
//         params: { page, limit, context },
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



// const messageSlice = createSlice({
//   name: 'message',
//   initialState,
//   reducers: {
//     clearMessageNotifications: (state) => {
//       state.postMessageError    = false
//       state.postMessageErrorMsg = ''
//       state.postDirectError     = false
//       state.postDirectErrorMsg  = ''
//       state.messageError        = false
//       state.messageErrorMsg     = ''
//       state.deleteMessageError  = false
//       state.moderateError       = false
//     },
//     clearPostedMessage: (state) => {
//       state.postedMessage = null
//     },
//   },
//   extraReducers(builder) {
//     builder
//       // postMessage
//       .addCase(postMessage.pending, (state) => {
//         state.postMessageLoad     = true
//         state.postMessageError    = false
//         state.postMessageErrorMsg = ''
//         state.postedMessage       = null
//       })
//       .addCase(postMessage.fulfilled, (state, action) => {
//         const { status, code, response } = action.payload
//         state.postMessageLoad = false
//         if (code === 500) {
//           state.postMessageError    = true
//           state.postMessageErrorMsg = "Can't post message due to network"
//         } else if (status === 'success') {
//           state.postMessageError = false
//           state.postedMessage    = response.data
//         } else {
//           state.postMessageError    = true
//           state.postMessageErrorMsg = response.msg || response.message || 'Failed to post message'
//         }
//       })
//       .addCase(postMessage.rejected, (state) => {
//         state.postMessageLoad     = false
//         state.postMessageError    = true
//         state.postMessageErrorMsg = 'Unable to post message'
//       })

//       // getBoardMessages
//       .addCase(getBoardMessages.pending, (state) => {
//         state.boardMessagesLoad  = true
//         state.boardMessagesError = false
//       })
//       .addCase(getBoardMessages.fulfilled, (state, action) => {
//         const { status, response } = action.payload
//         state.boardMessagesLoad = false
//         if (status === 'success') {
//           state.boardMessages           = response.messages
//           state.boardMessagesPagination = response.pagination
//         } else {
//           state.boardMessagesError = true
//         }
//       })
//       .addCase(getBoardMessages.rejected, (state) => {
//         state.boardMessagesLoad  = false
//         state.boardMessagesError = true
//       })

//       // moderateBoardMessage
//       .addCase(moderateBoardMessage.pending, (state) => {
//         state.moderateLoad  = true
//         state.moderateError = false
//       })
//       .addCase(moderateBoardMessage.fulfilled, (state, action) => {
//         const { status, response } = action.payload
//         state.moderateLoad = false
//         if (status === 'success') {
//           const updated = response.data
//           state.boardMessages = state.boardMessages.map(m =>
//             m._id === updated._id ? updated : m
//           )
//         } else {
//           state.moderateError = true
//         }
//       })
//       .addCase(moderateBoardMessage.rejected, (state) => {
//         state.moderateLoad  = false
//         state.moderateError = true
//       })

//       // postDirectMessage
//       .addCase(postDirectMessage.pending, (state) => {
//         state.postDirectLoad     = true
//         state.postDirectError    = false
//         state.postDirectErrorMsg = ''
//       })
//       .addCase(postDirectMessage.fulfilled, (state, action) => {
//         const { status, code, response } = action.payload
//         state.postDirectLoad = false
//         if (code === 500) {
//           state.postDirectError    = true
//           state.postDirectErrorMsg = "Can't send message due to network"
//         } else if (status === 'success') {
//           state.postDirectError = false
//         } else {
//           state.postDirectError    = true
//           state.postDirectErrorMsg = response.msg || response.message || 'Failed to send message'
//         }
//       })
//       .addCase(postDirectMessage.rejected, (state) => {
//         state.postDirectLoad     = false
//         state.postDirectError    = true
//         state.postDirectErrorMsg = 'Unable to send message'
//       })

//       // getUserWallMessages
//       .addCase(getUserWallMessages.pending, (state) => {
//         state.wallMessagesLoad  = true
//         state.wallMessagesError = false
//       })
//       .addCase(getUserWallMessages.fulfilled, (state, action) => {
//         const { status, response } = action.payload
//         state.wallMessagesLoad = false
//         if (status === 'success') {
//           state.wallMessages           = response.messages
//           state.wallMessagesPagination = response.pagination
//         } else {
//           state.wallMessagesError = true
//         }
//       })
//       .addCase(getUserWallMessages.rejected, (state) => {
//         state.wallMessagesLoad  = false
//         state.wallMessagesError = true
//       })

//       // getMessage
//       .addCase(getMessage.pending, (state) => {
//         state.messageLoad  = true
//         state.messageError = false
//         state.message      = null
//       })
//       .addCase(getMessage.fulfilled, (state, action) => {
//         const { status, response } = action.payload
//         state.messageLoad = false
//         if (status === 'success') {
//           state.messageError = false
//           state.message      = response.message
//         } else {
//           state.messageError    = true
//           state.messageErrorMsg = response.msg || response.message || 'Message not found'
//         }
//       })
//       .addCase(getMessage.rejected, (state) => {
//         state.messageLoad     = false
//         state.messageError    = true
//         state.messageErrorMsg = 'Unable to fetch message'
//       })

//       // deleteMessage
//       .addCase(deleteMessage.pending, (state) => {
//         state.deleteMessageLoad  = true
//         state.deleteMessageError = false
//       })
//       .addCase(deleteMessage.fulfilled, (state, action) => {
//         const { status, id } = action.payload
//         state.deleteMessageLoad = false
//         if (status === 'success') {
//           state.boardMessages = state.boardMessages.filter(m => m._id !== id)
//           state.myMessages    = state.myMessages.filter(m => m._id !== id)
//         } else {
//           state.deleteMessageError = true
//         }
//       })
//       .addCase(deleteMessage.rejected, (state) => {
//         state.deleteMessageLoad  = false
//         state.deleteMessageError = true
//       })

//       // getMyMessages
//       .addCase(getMyMessages.pending, (state) => {
//         state.myMessagesLoad  = true
//         state.myMessagesError = false
//       })
//       .addCase(getMyMessages.fulfilled, (state, action) => {
//         const { status, response } = action.payload
//         state.myMessagesLoad = false
//         if (status === 'success') {
//           state.myMessages           = response.messages
//           state.myMessagesPagination = response.pagination
//         } else {
//           state.myMessagesError = true
//         }
//       })
//       .addCase(getMyMessages.rejected, (state) => {
//         state.myMessagesLoad  = false
//         state.myMessagesError = true
//       })
//   },
// })

// export default messageSlice.reducer
// export const { clearMessageNotifications, clearPostedMessage } = messageSlice.actions

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'
import { URL } from '../paths/url'

const initialState = {
  // post message to board
  postMessageLoad:    false,
  postMessageError:   false,
  postMessageErrorMsg:'',
  postedMessage:      null,

  // board messages list
  boardMessages:      [],
  boardMessagesLoad:  false,
  boardMessagesError: false,
  boardMessagesPagination: null,

  // my messages
  myMessages:         [],
  myMessagesLoad:     false,
  myMessagesError:    false,
  myMessagesPagination: null,

  // single message
  message:            null,
  messageLoad:        false,
  messageError:       false,
  messageErrorMsg:    '',

  // delete
  deleteMessageLoad:  false,
  deleteMessageError: false,

  // moderate board message
  moderateLoad:       false,
  moderateError:      false,

  // direct message
  postDirectLoad:     false,
  postDirectError:    false,
  postDirectErrorMsg: '',

  // wall messages
  wallMessages:       [],
  wallMessagesLoad:   false,
  wallMessagesError:  false,
  wallMessagesPagination: null,

  // edit message
  editMessageLoad:    false,
  editMessageError:   false,
  editMessageErrorMsg:'',
}



export const postMessage = createAsyncThunk(
  'message/postMessage',
  async ({ slug, type, content, cloudinaryPublicId, fileType, canvasData }) => {
    try {
      const resp = await axios.post(
        `${URL}/api/v1/message/${slug}`, 
        { type, content, cloudinaryPublicId, fileType, canvasData },
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

export const getBoardMessages = createAsyncThunk(
  'message/getBoardMessages',
  async ({ slug, page = 1, limit = 20, type, status }) => {
    try {
      const resp = await axios.get(
        `${URL}/api/v1/message/${slug}/board`,
        {
          params: { page, limit, type, status },
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

export const moderateBoardMessage = createAsyncThunk(
  'message/moderateBoardMessage',
  async ({ id, status }) => {
    try {
      const resp = await axios.patch(
        `${URL}/api/v1/message/board/${id}/moderate`,
        { status },
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

export const postDirectMessage = createAsyncThunk(
  'message/postDirectMessage',
  async ({ username, type, content }) => {
    try {
      const resp = await axios.post(
        `${URL}/api/v1/message/${username}`,
        { type, content },
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

export const getUserWallMessages = createAsyncThunk(
  'message/getUserWallMessages',
  async ({ username, page = 1, limit = 20, type, status }) => {
    try {
      const resp = await axios.get(
        `${URL}/api/v1/message/${username}`,
        {
          params: { page, limit, type, status },
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

export const getMessage = createAsyncThunk(
  'message/getMessage',
  async (id) => {
    try {
      const resp = await axios.get(`${URL}/api/v1/message/${id}`, {
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

export const deleteMessage = createAsyncThunk(
  'message/deleteMessage',
  async (id) => {
    try {
      const resp = await axios.delete(`${URL}/api/v1/message/${id}`, {
        withCredentials: true,
      })
      return { response: resp.data, status: 'success', id }
    } catch (error) {
      return {
        response: error.response?.data || { message: 'Network error occurred' },
        status: 'error',
        code: error.response?.status || 500,
      }
    }
  }
)

export const getMyMessages = createAsyncThunk(
  'message/getMyMessages',
  async (params = {}) => {
    const { page = 1, limit = 20, context } = params
    try {
      const resp = await axios.get(`${URL}/api/v1/message/mine`, {
        params: { page, limit, context },
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

export const editMessage = createAsyncThunk(
  'message/editMessage',
  async ({ id, content, cloudinaryPublicId, fileType, canvasData }) => {
    try {
      const resp = await axios.patch(
        `${URL}/api/v1/message/${id}`,
        { content, cloudinaryPublicId, fileType, canvasData },
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


// Helper: replace a message by _id in a list, or return the list unchanged.
const replaceInList = (list, updated) =>
  list.map(m => (m._id === updated._id ? updated : m))


const messageSlice = createSlice({
  name: 'message',
  initialState,
  reducers: {
    clearMessageNotifications: (state) => {
      state.postMessageError    = false
      state.postMessageErrorMsg = ''
      state.postDirectError     = false
      state.postDirectErrorMsg  = ''
      state.messageError        = false
      state.messageErrorMsg     = ''
      state.deleteMessageError  = false
      state.moderateError       = false
      state.editMessageError    = false
      state.editMessageErrorMsg = ''
    },
    clearPostedMessage: (state) => {
      state.postedMessage = null
    },
  },
  extraReducers(builder) {
    builder
      // postMessage
      .addCase(postMessage.pending, (state) => {
        state.postMessageLoad     = true
        state.postMessageError    = false
        state.postMessageErrorMsg = ''
        state.postedMessage       = null
      })
      .addCase(postMessage.fulfilled, (state, action) => {
        const { status, code, response } = action.payload
        state.postMessageLoad = false
        if (code === 500) {
          state.postMessageError    = true
          state.postMessageErrorMsg = "Can't post message due to network"
        } else if (status === 'success') {
          state.postMessageError = false
          state.postedMessage    = response.data
        } else {
          state.postMessageError    = true
          state.postMessageErrorMsg = response.msg || response.message || 'Failed to post message'
        }
      })
      .addCase(postMessage.rejected, (state) => {
        state.postMessageLoad     = false
        state.postMessageError    = true
        state.postMessageErrorMsg = 'Unable to post message'
      })

      // getBoardMessages
      .addCase(getBoardMessages.pending, (state) => {
        state.boardMessagesLoad  = true
        state.boardMessagesError = false
      })
      .addCase(getBoardMessages.fulfilled, (state, action) => {
        const { status, response } = action.payload
        state.boardMessagesLoad = false
        if (status === 'success') {
          state.boardMessages           = response.messages
          state.boardMessagesPagination = response.pagination
        } else {
          state.boardMessagesError = true
        }
      })
      .addCase(getBoardMessages.rejected, (state) => {
        state.boardMessagesLoad  = false
        state.boardMessagesError = true
      })

      // moderateBoardMessage
      .addCase(moderateBoardMessage.pending, (state) => {
        state.moderateLoad  = true
        state.moderateError = false
      })
      .addCase(moderateBoardMessage.fulfilled, (state, action) => {
        const { status, response } = action.payload
        state.moderateLoad = false
        if (status === 'success') {
          const updated = response.data
          state.boardMessages = state.boardMessages.map(m =>
            m._id === updated._id ? updated : m
          )
        } else {
          state.moderateError = true
        }
      })
      .addCase(moderateBoardMessage.rejected, (state) => {
        state.moderateLoad  = false
        state.moderateError = true
      })

      // postDirectMessage
      .addCase(postDirectMessage.pending, (state) => {
        state.postDirectLoad     = true
        state.postDirectError    = false
        state.postDirectErrorMsg = ''
      })
      .addCase(postDirectMessage.fulfilled, (state, action) => {
        const { status, code, response } = action.payload
        state.postDirectLoad = false
        if (code === 500) {
          state.postDirectError    = true
          state.postDirectErrorMsg = "Can't send message due to network"
        } else if (status === 'success') {
          state.postDirectError = false
        } else {
          state.postDirectError    = true
          state.postDirectErrorMsg = response.msg || response.message || 'Failed to send message'
        }
      })
      .addCase(postDirectMessage.rejected, (state) => {
        state.postDirectLoad     = false
        state.postDirectError    = true
        state.postDirectErrorMsg = 'Unable to send message'
      })

      // getUserWallMessages
      .addCase(getUserWallMessages.pending, (state) => {
        state.wallMessagesLoad  = true
        state.wallMessagesError = false
      })
      .addCase(getUserWallMessages.fulfilled, (state, action) => {
        const { status, response } = action.payload
        state.wallMessagesLoad = false
        if (status === 'success') {
          state.wallMessages           = response.messages
          state.wallMessagesPagination = response.pagination
        } else {
          state.wallMessagesError = true
        }
      })
      .addCase(getUserWallMessages.rejected, (state) => {
        state.wallMessagesLoad  = false
        state.wallMessagesError = true
      })

      // getMessage
      .addCase(getMessage.pending, (state) => {
        state.messageLoad  = true
        state.messageError = false
        state.message      = null
      })
      .addCase(getMessage.fulfilled, (state, action) => {
        const { status, response } = action.payload
        state.messageLoad = false
        if (status === 'success') {
          state.messageError = false
          state.message      = response.message
        } else {
          state.messageError    = true
          state.messageErrorMsg = response.msg || response.message || 'Message not found'
        }
      })
      .addCase(getMessage.rejected, (state) => {
        state.messageLoad     = false
        state.messageError    = true
        state.messageErrorMsg = 'Unable to fetch message'
      })

      // deleteMessage
      .addCase(deleteMessage.pending, (state) => {
        state.deleteMessageLoad  = true
        state.deleteMessageError = false
      })
      .addCase(deleteMessage.fulfilled, (state, action) => {
        const { status, id } = action.payload
        state.deleteMessageLoad = false
        if (status === 'success') {
          state.boardMessages = state.boardMessages.filter(m => m._id !== id)
          state.myMessages    = state.myMessages.filter(m => m._id !== id)
        } else {
          state.deleteMessageError = true
        }
      })
      .addCase(deleteMessage.rejected, (state) => {
        state.deleteMessageLoad  = false
        state.deleteMessageError = true
      })

      // getMyMessages
      .addCase(getMyMessages.pending, (state) => {
        state.myMessagesLoad  = true
        state.myMessagesError = false
      })
      .addCase(getMyMessages.fulfilled, (state, action) => {
        const { status, response } = action.payload
        state.myMessagesLoad = false
        if (status === 'success') {
          state.myMessages           = response.messages
          state.myMessagesPagination = response.pagination
        } else {
          state.myMessagesError = true
        }
      })
      .addCase(getMyMessages.rejected, (state) => {
        state.myMessagesLoad  = false
        state.myMessagesError = true
      })

      // editMessage
      .addCase(editMessage.pending, (state) => {
        state.editMessageLoad     = true
        state.editMessageError    = false
        state.editMessageErrorMsg = ''
      })
      .addCase(editMessage.fulfilled, (state, action) => {
        const { status, code, response } = action.payload
        state.editMessageLoad = false
        if (code === 500) {
          state.editMessageError    = true
          state.editMessageErrorMsg = "Can't edit message due to network"
        } else if (status === 'success') {
          const updated = response.data
          // Sync the updated message across every list that may contain it
          state.boardMessages  = replaceInList(state.boardMessages,  updated)
          state.myMessages     = replaceInList(state.myMessages,     updated)
          state.wallMessages   = replaceInList(state.wallMessages,   updated)
          // If the single-message view is open for this message, update it too
          if (state.message?._id === updated._id) {
            state.message = updated
          }
        } else {
          state.editMessageError    = true
          state.editMessageErrorMsg = response.msg || response.message || 'Failed to edit message'
        }
      })
      .addCase(editMessage.rejected, (state) => {
        state.editMessageLoad     = false
        state.editMessageError    = true
        state.editMessageErrorMsg = 'Unable to edit message'
      })
  },
})

export default messageSlice.reducer
export const { clearMessageNotifications, clearPostedMessage } = messageSlice.actions