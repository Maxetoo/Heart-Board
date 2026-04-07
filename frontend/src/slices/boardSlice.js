// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
// import axios from 'axios'
// import { URL } from '../paths/url'

// const initialState = {
//   // create
//   createBoardLoad:    false,
//   createBoardError:   false,
//   createBoardErrorMsg:'',
//   createdBoard:       null,

//   // my boards list
//   boards:             [],
//   boardsLoad:         false,
//   boardsError:        false,
//   boardsErrorMsg:     '',
//   boardsPagination:   null,

//   // single board
//   board:              null,
//   boardLoad:          false,
//   boardError:         false,
//   boardErrorMsg:      '',

//   // update
//   updateBoardLoad:    false,
//   updateBoardError:   false,
//   updateBoardErrorMsg:'',

//   // delete
//   deleteBoardLoad:    false,
//   deleteBoardError:   false,
//   deleteBoardErrorMsg:'',

//   // like
//   likeBoardLoad:      false,
//   likeBoardError:     false,

//   // share
//   shareBoardLoad:     false,
//   shareUrl:           '',

//   // discover
//   discoverBoards:     [],
//   discoverLoad:       false,
//   discoverError:      false,
//   discoverPagination: null,

//   // liked board ids (for persistent like state)
//   likedBoardIds:      [],
//   likedBoardIdsLoad:  false,
// }

// // ─── Thunks ───────────────────────────────────────────────────────────────────

// export const createBoard = createAsyncThunk(
//   'board/createBoard',
//   async (payload) => {
//     const { title, description, visibility, receipent, event, coverImage, coverImagePublicId, tags } = payload
//     try {
//       const resp = await axios.post(
//         `${URL}/api/v1/board`,
//         { title, description, visibility, receipent, event, coverImage, coverImagePublicId, tags },
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

// export const getMyBoards = createAsyncThunk(
//   'board/getMyBoards',
//   async (params = {}) => {
//     const { page = 1, limit = 12, view = 'owned', tier, visibility, status, event } = params
//     try {
//       const resp = await axios.get(`${URL}/api/v1/board`, {
//         params: { page, limit, view, tier, visibility, status, event },
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

// export const getBoardBySlug = createAsyncThunk(
//   'board/getBoardBySlug',
//   async (slug) => {
//     try {
//       const resp = await axios.get(`${URL}/api/v1/board/${slug}`, {
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

// export const updateBoard = createAsyncThunk(
//   'board/updateBoard',
//   async ({ id, ...fields }) => {
//     try {
//       const resp = await axios.patch(
//         `${URL}/api/v1/board/${id}`,
//         fields,
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

// export const deleteBoard = createAsyncThunk(
//   'board/deleteBoard',
//   async (id, thunkApi) => {
//     try {
//       const resp = await axios.delete(`${URL}/api/v1/board/${id}`, {
//         withCredentials: true,
//       })
//       thunkApi.dispatch(discoverBoards())
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

// export const likeBoard = createAsyncThunk(
//   'board/likeBoard',
//   async (id) => {
//     try {
//       const resp = await axios.post(`${URL}/api/v1/board/${id}/like`, {}, {
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

// export const shareBoard = createAsyncThunk(
//   'board/shareBoard',
//   async (id) => {
//     try {
//       const resp = await axios.post(`${URL}/api/v1/board/${id}/share`, {}, {
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

// export const discoverBoards = createAsyncThunk(
//   'board/discoverBoards',
//   async (params = {}) => {
//     const { page = 1, limit = 12, sort = 'latest' } = params
//     try {
//       const resp = await axios.get(`${URL}/api/v1/board/discover`, {
//         params: { page, limit, sort },
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


// export const getBoardLikes = createAsyncThunk(
//   'board/getBoardLikes',
//   async () => {
//     try {
//       const resp = await axios.get(`${URL}/api/v1/board/likes/me`, {
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

// const boardSlice = createSlice({
//   name: 'board',
//   initialState,
//   reducers: {
//     clearBoardNotifications: (state) => {
//       state.createBoardError    = false
//       state.createBoardErrorMsg = ''
//       state.updateBoardError    = false
//       state.updateBoardErrorMsg = ''
//       state.deleteBoardError    = false
//       state.deleteBoardErrorMsg = ''
//       state.boardError          = false
//       state.boardErrorMsg       = ''
//     },
//     clearCreatedBoard: (state) => {
//       state.createdBoard = null
//     },
//   },
//   extraReducers(builder) {
//     builder
//       // createBoard
//       .addCase(createBoard.pending, (state) => {
//         state.createBoardLoad     = true
//         state.createBoardError    = false
//         state.createBoardErrorMsg = ''
//         state.createdBoard        = null
//       })
//       .addCase(createBoard.fulfilled, (state, action) => {
//         const { status, code, response } = action.payload
//         state.createBoardLoad = false
//         if (code === 500) {
//           state.createBoardError    = true
//           state.createBoardErrorMsg = "Can't create board due to network"
//         } else if (status === 'success') {
//           state.createBoardError = false
//           state.createdBoard     = response.board
//         } else {
//           state.createBoardError    = true
//           state.createBoardErrorMsg = response.msg || response.message || 'Failed to create board'
//         }
//       })
//       .addCase(createBoard.rejected, (state) => {
//         state.createBoardLoad     = false
//         state.createBoardError    = true
//         state.createBoardErrorMsg = 'Unable to create board'
//       })

//       // getMyBoards
//       .addCase(getMyBoards.pending, (state) => {
//         state.boardsLoad  = true
//         state.boardsError = false
//       })
//       .addCase(getMyBoards.fulfilled, (state, action) => {
//         const { status, response } = action.payload
//         state.boardsLoad = false
//         if (status === 'success') {
//           state.boardsError      = false
//           state.boards           = response.boards
//           state.boardsPagination = response.pagination
//         } else {
//           state.boardsError    = true
//           state.boardsErrorMsg = response.msg || response.message || 'Failed to fetch boards'
//         }
//       })
//       .addCase(getMyBoards.rejected, (state) => {
//         state.boardsLoad     = false
//         state.boardsError    = true
//         state.boardsErrorMsg = 'Unable to fetch boards'
//       })

//       // getBoardBySlug
//       .addCase(getBoardBySlug.pending, (state) => {
//         state.boardLoad  = true
//         state.boardError = false
//         state.board      = null
//       })
//       .addCase(getBoardBySlug.fulfilled, (state, action) => {
//         const { status, response } = action.payload
//         state.boardLoad = false
//         if (status === 'success') {
//           state.boardError = false
//           state.board      = response.board
//         } else {
//           state.boardError    = true
//           state.boardErrorMsg = response.msg || response.message || 'Board not found'
//         }
//       })
//       .addCase(getBoardBySlug.rejected, (state) => {
//         state.boardLoad     = false
//         state.boardError    = true
//         state.boardErrorMsg = 'Unable to fetch board'
//       })

//       // updateBoard
//       .addCase(updateBoard.pending, (state) => {
//         state.updateBoardLoad  = true
//         state.updateBoardError = false
//       })
//       .addCase(updateBoard.fulfilled, (state, action) => {
//         const { status, response } = action.payload
//         state.updateBoardLoad = false
//         if (status === 'success') {
//           state.updateBoardError = false
//           state.board            = response.board
//         } else {
//           state.updateBoardError    = true
//           state.updateBoardErrorMsg = response.msg || response.message || 'Failed to update board'
//         }
//       })
//       .addCase(updateBoard.rejected, (state) => {
//         state.updateBoardLoad     = false
//         state.updateBoardError    = true
//         state.updateBoardErrorMsg = 'Unable to update board'
//       })

//       // deleteBoard
//       .addCase(deleteBoard.pending, (state) => {
//         state.deleteBoardLoad  = true
//         state.deleteBoardError = false
//       })
//       .addCase(deleteBoard.fulfilled, (state, action) => {
//         const { status, response } = action.payload
//         state.deleteBoardLoad = false
//         if (status === 'success') {
//           state.deleteBoardError = false
//           state.boards = state.boards.filter(b => b._id !== action.meta.arg)
//         } else {
//           state.deleteBoardError    = true
//           state.deleteBoardErrorMsg = response.msg || response.message || 'Failed to delete board'
//         }
//       })
//       .addCase(deleteBoard.rejected, (state) => {
//         state.deleteBoardLoad     = false
//         state.deleteBoardError    = true
//         state.deleteBoardErrorMsg = 'Unable to delete board'
//       })

//       // likeBoard
//       .addCase(likeBoard.pending, (state) => {
//         state.likeBoardLoad  = true
//         state.likeBoardError = false
//       })
//       .addCase(likeBoard.fulfilled, (state, action) => {
//         const { status, response } = action.payload
//         state.likeBoardLoad = false
//         if (status === 'success' && state.board) {
//           state.board.stats.likes = response.likeCount
//         } else {
//           state.likeBoardError = true
//         }
//       })
//       .addCase(likeBoard.rejected, (state) => {
//         state.likeBoardLoad  = false
//         state.likeBoardError = true
//       })

//       // shareBoard
//       .addCase(shareBoard.pending, (state) => {
//         state.shareBoardLoad = true
//       })
//       .addCase(shareBoard.fulfilled, (state, action) => {
//         const { status, response } = action.payload
//         state.shareBoardLoad = false
//         if (status === 'success') {
//           state.shareUrl = response.shareUrl
//         }
//       })
//       .addCase(shareBoard.rejected, (state) => {
//         state.shareBoardLoad = false
//       })

//       // discoverBoards
//       .addCase(discoverBoards.pending, (state) => {
//         state.discoverLoad  = true
//         state.discoverError = false
//       })
//       .addCase(discoverBoards.fulfilled, (state, action) => {
//         const { status, response } = action.payload
//         state.discoverLoad = false
//         if (status === 'success') {
//           state.discoverBoards     = response.boards
//           state.discoverPagination = response.pagination
//         } else {
//           state.discoverError = true
//         }
//       })
//       .addCase(discoverBoards.rejected, (state) => {
//         state.discoverLoad  = false
//         state.discoverError = true
//       })

//       // getBoardLikes
//       .addCase(getBoardLikes.pending, (state) => {
//         state.likedBoardIdsLoad = true
//       })
//       .addCase(getBoardLikes.fulfilled, (state, action) => {
//         const { status, response } = action.payload
//         state.likedBoardIdsLoad = false
//         if (status === 'success') {
//           state.likedBoardIds = response.likedBoardIds
//         }
//       })
//       .addCase(getBoardLikes.rejected, (state) => {
//         state.likedBoardIdsLoad = false
//       })
//   },
// })

// export default boardSlice.reducer
// export const { clearBoardNotifications, clearCreatedBoard } = boardSlice.actions

// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
// import axios from 'axios'
// import { URL } from '../paths/url'
 
// const initialState = {
//   // create
//   createBoardLoad:    false,
//   createBoardError:   false,
//   createBoardErrorMsg:'',
//   createdBoard:       null,
 
//   // my boards list
//   boards:             [],
//   boardsLoad:         false,
//   boardsError:        false,
//   boardsErrorMsg:     '',
//   boardsPagination:   null,
 
//   // single board
//   board:              null,
//   boardLoad:          false,
//   boardError:         false,
//   boardErrorMsg:      '',
 
//   // update
//   updateBoardLoad:    false,
//   updateBoardError:   false,
//   updateBoardErrorMsg:'',
 
//   // delete
//   deleteBoardLoad:    false,
//   deleteBoardError:   false,
//   deleteBoardErrorMsg:'',
 
//   // like
//   likeBoardLoad:      false,
//   likeBoardError:     false,
 
//   // share
//   shareBoardLoad:     false,
//   shareUrl:           '',
 
//   // discover
//   discoverBoards:     [],
//   discoverLoad:       false,
//   discoverError:      false,
//   discoverPagination: null,
 
//   // liked board ids (for persistent like state)
//   likedBoardIds:      [],
//   likedBoardIdsLoad:  false,
// }
 
// // ─── Thunks ───────────────────────────────────────────────────────────────────
 
// export const createBoard = createAsyncThunk(
//   'board/createBoard',
//   async (payload) => {
//     const { title, description, visibility, receipent, event, coverImage, coverImagePublicId, tags } = payload
//     try {
//       const resp = await axios.post(
//         `${URL}/api/v1/board`,
//         { title, description, visibility, receipent, event, coverImage, coverImagePublicId, tags },
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
 
// export const getMyBoards = createAsyncThunk(
//   'board/getMyBoards',
//   async (params = {}) => {
//     const { page = 1, limit = 12, view = 'owned', tier, visibility, status, event } = params
//     try {
//       const resp = await axios.get(`${URL}/api/v1/board`, {
//         params: { page, limit, view, tier, visibility, status, event },
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
 
// export const getBoardBySlug = createAsyncThunk(
//   'board/getBoardBySlug',
//   async (slug) => {
//     try {
//       const resp = await axios.get(`${URL}/api/v1/board/${slug}`, {
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
 
// export const updateBoard = createAsyncThunk(
//   'board/updateBoard',
//   async ({ id, ...fields }) => {
//     try {
//       const resp = await axios.patch(
//         `${URL}/api/v1/board/${id}`,
//         fields,
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
 
// export const deleteBoard = createAsyncThunk(
//   'board/deleteBoard',
//   async (id) => {
//     try {
//       const resp = await axios.delete(`${URL}/api/v1/board/${id}`, {
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
 
// export const likeBoard = createAsyncThunk(
//   'board/likeBoard',
//   async (id) => {
//     try {
//       const resp = await axios.post(`${URL}/api/v1/board/${id}/like`, {}, {
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
 
// export const shareBoard = createAsyncThunk(
//   'board/shareBoard',
//   async (id) => {
//     try {
//       const resp = await axios.post(`${URL}/api/v1/board/${id}/share`, {}, {
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
 
// export const discoverBoards = createAsyncThunk(
//   'board/discoverBoards',
//   async (params = {}) => {
//     const { page = 1, limit = 12, sort = 'latest' } = params
//     try {
//       const resp = await axios.get(`${URL}/api/v1/board/discover`, {
//         params: { page, limit, sort },
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
 
 
// export const getBoardLikes = createAsyncThunk(
//   'board/getBoardLikes',
//   async () => {
//     try {
//       const resp = await axios.get(`${URL}/api/v1/board/likes/me`, {
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
 
// const boardSlice = createSlice({
//   name: 'board',
//   initialState,
//   reducers: {
//     clearBoardNotifications: (state) => {
//       state.createBoardError    = false
//       state.createBoardErrorMsg = ''
//       state.updateBoardError    = false
//       state.updateBoardErrorMsg = ''
//       state.deleteBoardError    = false
//       state.deleteBoardErrorMsg = ''
//       state.boardError          = false
//       state.boardErrorMsg       = ''
//     },
//     clearCreatedBoard: (state) => {
//       state.createdBoard = null
//     },
//     // Optimistic like toggle — called before server responds, reverted on failure
//     optimisticToggleLike: (state, action) => {
//       const boardId = action.payload
//       const idx = state.likedBoardIds.indexOf(boardId)
//       if (idx === -1) {
//         state.likedBoardIds.push(boardId)
//       } else {
//         state.likedBoardIds.splice(idx, 1)
//       }
//     },
//   },
//   extraReducers(builder) {
//     builder
//       // createBoard
//       .addCase(createBoard.pending, (state) => {
//         state.createBoardLoad     = true
//         state.createBoardError    = false
//         state.createBoardErrorMsg = ''
//         state.createdBoard        = null
//       })
//       .addCase(createBoard.fulfilled, (state, action) => {
//         const { status, code, response } = action.payload
//         state.createBoardLoad = false
//         if (code === 500) {
//           state.createBoardError    = true
//           state.createBoardErrorMsg = "Can't create board due to network"
//         } else if (status === 'success') {
//           state.createBoardError = false
//           state.createdBoard     = response.board
//         } else {
//           state.createBoardError    = true
//           state.createBoardErrorMsg = response.msg || response.message || 'Failed to create board'
//         }
//       })
//       .addCase(createBoard.rejected, (state) => {
//         state.createBoardLoad     = false
//         state.createBoardError    = true
//         state.createBoardErrorMsg = 'Unable to create board'
//       })
 
//       // getMyBoards
//       .addCase(getMyBoards.pending, (state) => {
//         state.boardsLoad  = true
//         state.boardsError = false
//         state.boards      = []
//       })
//       .addCase(getMyBoards.fulfilled, (state, action) => {
//         const { status, response } = action.payload
//         state.boardsLoad = false
//         if (status === 'success') {
//           state.boardsError      = false
//           state.boards           = response.boards
//           state.boardsPagination = response.pagination
//         } else {
//           state.boardsError    = true
//           state.boardsErrorMsg = response.msg || response.message || 'Failed to fetch boards'
//         }
//       })
//       .addCase(getMyBoards.rejected, (state) => {
//         state.boardsLoad     = false
//         state.boardsError    = true
//         state.boardsErrorMsg = 'Unable to fetch boards'
//       })
 
//       // getBoardBySlug
//       .addCase(getBoardBySlug.pending, (state) => {
//         state.boardLoad  = true
//         state.boardError = false
//         state.board      = null
//       })
//       .addCase(getBoardBySlug.fulfilled, (state, action) => {
//         const { status, response } = action.payload
//         state.boardLoad = false
//         if (status === 'success') {
//           state.boardError = false
//           state.board      = response.board
//         } else {
//           state.boardError    = true
//           state.boardErrorMsg = response.msg || response.message || 'Board not found'
//         }
//       })
//       .addCase(getBoardBySlug.rejected, (state) => {
//         state.boardLoad     = false
//         state.boardError    = true
//         state.boardErrorMsg = 'Unable to fetch board'
//       })
 
//       // updateBoard
//       .addCase(updateBoard.pending, (state) => {
//         state.updateBoardLoad  = true
//         state.updateBoardError = false
//       })
//       .addCase(updateBoard.fulfilled, (state, action) => {
//         const { status, response } = action.payload
//         state.updateBoardLoad = false
//         if (status === 'success') {
//           state.updateBoardError = false
//           state.board            = response.board
//         } else {
//           state.updateBoardError    = true
//           state.updateBoardErrorMsg = response.msg || response.message || 'Failed to update board'
//         }
//       })
//       .addCase(updateBoard.rejected, (state) => {
//         state.updateBoardLoad     = false
//         state.updateBoardError    = true
//         state.updateBoardErrorMsg = 'Unable to update board'
//       })
 
//       // deleteBoard
//       .addCase(deleteBoard.pending, (state) => {
//         state.deleteBoardLoad  = true
//         state.deleteBoardError = false
//       })
//       .addCase(deleteBoard.fulfilled, (state, action) => {
//         const { status, response } = action.payload
//         state.deleteBoardLoad = false
//         if (status === 'success') {
//           state.deleteBoardError = false
//           state.boards = state.boards.filter(b => b._id !== action.meta.arg)
//         } else {
//           state.deleteBoardError    = true
//           state.deleteBoardErrorMsg = response.msg || response.message || 'Failed to delete board'
//         }
//       })
//       .addCase(deleteBoard.rejected, (state) => {
//         state.deleteBoardLoad     = false
//         state.deleteBoardError    = true
//         state.deleteBoardErrorMsg = 'Unable to delete board'
//       })
 
//       // likeBoard
//       .addCase(likeBoard.pending, (state) => {
//         state.likeBoardLoad  = true
//         state.likeBoardError = false
//       })
//       .addCase(likeBoard.fulfilled, (state, action) => {
//         const { status, response } = action.payload
//         state.likeBoardLoad = false
//         if (status === 'success' && state.board) {
//           state.board.stats.likes = response.likeCount
//         } else {
//           state.likeBoardError = true
//         }
//       })
//       .addCase(likeBoard.rejected, (state) => {
//         state.likeBoardLoad  = false
//         state.likeBoardError = true
//       })
 
//       // shareBoard
//       .addCase(shareBoard.pending, (state) => {
//         state.shareBoardLoad = true
//       })
//       .addCase(shareBoard.fulfilled, (state, action) => {
//         const { status, response } = action.payload
//         state.shareBoardLoad = false
//         if (status === 'success') {
//           state.shareUrl = response.shareUrl
//         }
//       })
//       .addCase(shareBoard.rejected, (state) => {
//         state.shareBoardLoad = false
//       })
 
//       // discoverBoards
//       .addCase(discoverBoards.pending, (state) => {
//         state.discoverLoad  = true
//         state.discoverError = false
//       })
//       .addCase(discoverBoards.fulfilled, (state, action) => {
//         const { status, response } = action.payload
//         state.discoverLoad = false
//         if (status === 'success') {
//           state.discoverBoards     = response.boards
//           state.discoverPagination = response.pagination
//         } else {
//           state.discoverError = true
//         }
//       })
//       .addCase(discoverBoards.rejected, (state) => {
//         state.discoverLoad  = false
//         state.discoverError = true
//       })
 
//       // getBoardLikes
//       .addCase(getBoardLikes.pending, (state) => {
//         state.likedBoardIdsLoad = true
//       })
//       .addCase(getBoardLikes.fulfilled, (state, action) => {
//         const { status, response } = action.payload
//         state.likedBoardIdsLoad = false
//         if (status === 'success') {
//           state.likedBoardIds = response.likedBoardIds
//         }
//       })
//       .addCase(getBoardLikes.rejected, (state) => {
//         state.likedBoardIdsLoad = false
//       })
//   },
// })
 
// export default boardSlice.reducer
// export const { clearBoardNotifications, clearCreatedBoard, optimisticToggleLike } = boardSlice.actions


// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
// import axios from 'axios'
// import { URL } from '../paths/url'

// const initialState = {
//   // create
//   createBoardLoad:    false,
//   createBoardError:   false,
//   createBoardErrorMsg:'',
//   createdBoard:       null,

//   // my boards list
//   boards:             [],
//   boardsLoad:         false,
//   boardsError:        false,
//   boardsErrorMsg:     '',
//   boardsPagination:   null,

//   // single board
//   board:              null,
//   boardLoad:          false,
//   boardError:         false,
//   boardErrorMsg:      '',

//   // update
//   updateBoardLoad:    false,
//   updateBoardError:   false,
//   updateBoardErrorMsg:'',

//   // delete
//   deleteBoardLoad:    false,
//   deleteBoardError:   false,
//   deleteBoardErrorMsg:'',

//   // like
//   likeBoardLoad:      false,
//   likeBoardError:     false,

//   // share
//   shareBoardLoad:     false,
//   shareUrl:           '',

//   // discover
//   discoverBoards:     [],
//   discoverLoad:       false,
//   discoverError:      false,
//   discoverPagination: null,
// }



// export const createBoard = createAsyncThunk(
//   'board/createBoard',
//   async (payload) => {
//     const { title, description, visibility, receipent, event, coverImage} = payload
//     try {
//       const resp = await axios.post(
//         `${URL}/api/v1/board`,
//         { title, description, visibility, receipent, event, coverImage},
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

// export const getMyBoards = createAsyncThunk(
//   'board/getMyBoards',
//   async (params = {}) => {
//     const { page = 1, limit = 12, view = 'owned', tier, visibility, status, event } = params
//     try {
//       const resp = await axios.get(`${URL}/api/v1/board`, {
//         params: { page, limit, view, tier, visibility, status, event },
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

// export const getBoardBySlug = createAsyncThunk(
//   'board/getBoardBySlug',
//   async (slug) => {
//     try {
//       const resp = await axios.get(`${URL}/api/v1/board/${slug}`, {
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

// export const updateBoard = createAsyncThunk(
//   'board/updateBoard',
//   async ({ id, ...fields }) => {
//     try {
//       const resp = await axios.patch(
//         `${URL}/api/v1/board/${id}`,
//         fields,
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

// export const deleteBoard = createAsyncThunk(
//   'board/deleteBoard',
//   async (id) => {
//     try {
//       const resp = await axios.delete(`${URL}/api/v1/board/${id}`, {
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

// export const likeBoard = createAsyncThunk(
//   'board/likeBoard',
//   async (id) => {
//     try {
//       const resp = await axios.post(`${URL}/api/v1/board/${id}/like`, {}, {
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

// export const shareBoard = createAsyncThunk(
//   'board/shareBoard',
//   async (id) => {
//     try {
//       const resp = await axios.post(`${URL}/api/v1/board/${id}/share`, {}, {
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

// export const discoverBoards = createAsyncThunk(
//   'board/discoverBoards',
//   async (params = {}) => {
//     const { page = 1, limit = 12, sort = 'latest' } = params
//     try {
//       const resp = await axios.get(`${URL}/api/v1/board/discover`, {
//         params: { page, limit, sort },
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



// const boardSlice = createSlice({
//   name: 'board',
//   initialState,
//   reducers: {
//     clearBoardNotifications: (state) => {
//       state.createBoardError    = false
//       state.createBoardErrorMsg = ''
//       state.updateBoardError    = false
//       state.updateBoardErrorMsg = ''
//       state.deleteBoardError    = false
//       state.deleteBoardErrorMsg = ''
//       state.boardError          = false
//       state.boardErrorMsg       = ''
//     },
//     clearCreatedBoard: (state) => {
//       state.createdBoard = null
//     },
//   },
//   extraReducers(builder) {
//     builder
//       // createBoard
//       .addCase(createBoard.pending, (state) => {
//         state.createBoardLoad     = true
//         state.createBoardError    = false
//         state.createBoardErrorMsg = ''
//         state.createdBoard        = null
//       })
//       .addCase(createBoard.fulfilled, (state, action) => {
//         const { status, code, response } = action.payload
//         state.createBoardLoad = false
//         if (code === 500) {
//           state.createBoardError    = true
//           state.createBoardErrorMsg = "Can't create board due to network"
//         } else if (status === 'success') {
//           state.createBoardError = false
//           state.createdBoard     = response.board
//         } else {
//           state.createBoardError    = true
//           state.createBoardErrorMsg = response.msg || response.message || 'Failed to create board'
//         }
//       })
//       .addCase(createBoard.rejected, (state) => {
//         state.createBoardLoad     = false
//         state.createBoardError    = true
//         state.createBoardErrorMsg = 'Unable to create board'
//       })

//       // getMyBoards
//       .addCase(getMyBoards.pending, (state) => {
//         state.boardsLoad  = true
//         state.boardsError = false
//       })
//       .addCase(getMyBoards.fulfilled, (state, action) => {
//         const { status, response } = action.payload
//         state.boardsLoad = false
//         if (status === 'success') {
//           state.boardsError      = false
//           state.boards           = response.boards
//           state.boardsPagination = response.pagination
//         } else {
//           state.boardsError    = true
//           state.boardsErrorMsg = response.msg || response.message || 'Failed to fetch boards'
//         }
//       })
//       .addCase(getMyBoards.rejected, (state) => {
//         state.boardsLoad     = false
//         state.boardsError    = true
//         state.boardsErrorMsg = 'Unable to fetch boards'
//       })

//       // getBoardBySlug
//       .addCase(getBoardBySlug.pending, (state) => {
//         state.boardLoad  = true
//         state.boardError = false
//         state.board      = null
//       })
//       .addCase(getBoardBySlug.fulfilled, (state, action) => {
//         const { status, response } = action.payload
//         state.boardLoad = false
//         if (status === 'success') {
//           state.boardError = false
//           state.board      = response.board
//         } else {
//           state.boardError    = true
//           state.boardErrorMsg = response.msg || response.message || 'Board not found'
//         }
//       })
//       .addCase(getBoardBySlug.rejected, (state) => {
//         state.boardLoad     = false
//         state.boardError    = true
//         state.boardErrorMsg = 'Unable to fetch board'
//       })

//       // updateBoard
//       .addCase(updateBoard.pending, (state) => {
//         state.updateBoardLoad  = true
//         state.updateBoardError = false
//       })
//       .addCase(updateBoard.fulfilled, (state, action) => {
//         const { status, response } = action.payload
//         state.updateBoardLoad = false
//         if (status === 'success') {
//           state.updateBoardError = false
//           state.board            = response.board
//         } else {
//           state.updateBoardError    = true
//           state.updateBoardErrorMsg = response.msg || response.message || 'Failed to update board'
//         }
//       })
//       .addCase(updateBoard.rejected, (state) => {
//         state.updateBoardLoad     = false
//         state.updateBoardError    = true
//         state.updateBoardErrorMsg = 'Unable to update board'
//       })

//       // deleteBoard
//       .addCase(deleteBoard.pending, (state) => {
//         state.deleteBoardLoad  = true
//         state.deleteBoardError = false
//       })
//       .addCase(deleteBoard.fulfilled, (state, action) => {
//         const { status, response } = action.payload
//         state.deleteBoardLoad = false
//         if (status === 'success') {
//           state.deleteBoardError = false
//           state.boards = state.boards.filter(b => b._id !== action.meta.arg)
//         } else {
//           state.deleteBoardError    = true
//           state.deleteBoardErrorMsg = response.msg || response.message || 'Failed to delete board'
//         }
//       })
//       .addCase(deleteBoard.rejected, (state) => {
//         state.deleteBoardLoad     = false
//         state.deleteBoardError    = true
//         state.deleteBoardErrorMsg = 'Unable to delete board'
//       })

//       // likeBoard
//       .addCase(likeBoard.pending, (state) => {
//         state.likeBoardLoad  = true
//         state.likeBoardError = false
//       })
//       .addCase(likeBoard.fulfilled, (state, action) => {
//         const { status, response } = action.payload
//         state.likeBoardLoad = false
//         if (status === 'success' && state.board) {
//           state.board.stats.likes = response.likeCount
//         } else {
//           state.likeBoardError = true
//         }
//       })
//       .addCase(likeBoard.rejected, (state) => {
//         state.likeBoardLoad  = false
//         state.likeBoardError = true
//       })

//       // shareBoard
//       .addCase(shareBoard.pending, (state) => {
//         state.shareBoardLoad = true
//       })
//       .addCase(shareBoard.fulfilled, (state, action) => {
//         const { status, response } = action.payload
//         state.shareBoardLoad = false
//         if (status === 'success') {
//           state.shareUrl = response.shareUrl
//         }
//       })
//       .addCase(shareBoard.rejected, (state) => {
//         state.shareBoardLoad = false
//       })

//       // discoverBoards
//       .addCase(discoverBoards.pending, (state) => {
//         state.discoverLoad  = true
//         state.discoverError = false
//       })
//       .addCase(discoverBoards.fulfilled, (state, action) => {
//         const { status, response } = action.payload
//         state.discoverLoad = false
//         if (status === 'success') {
//           state.discoverBoards     = response.boards
//           state.discoverPagination = response.pagination
//         } else {
//           state.discoverError = true
//         }
//       })
//       .addCase(discoverBoards.rejected, (state) => {
//         state.discoverLoad  = false
//         state.discoverError = true
//       })
//   },
// })

// export default boardSlice.reducer
// export const { clearBoardNotifications, clearCreatedBoard } = boardSlice.actions


// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
// import axios from 'axios'
// import { URL } from '../paths/url'

// const initialState = {
//   // create
//   createBoardLoad:    false,
//   createBoardError:   false,
//   createBoardErrorMsg:'',
//   createdBoard:       null,

//   // my boards list
//   boards:             [],
//   boardsLoad:         false,
//   boardsError:        false,
//   boardsErrorMsg:     '',
//   boardsPagination:   null,

//   // single board
//   board:              null,
//   boardLoad:          false,
//   boardError:         false,
//   boardErrorMsg:      '',

//   // update
//   updateBoardLoad:    false,
//   updateBoardError:   false,
//   updateBoardErrorMsg:'',

//   // delete
//   deleteBoardLoad:    false,
//   deleteBoardError:   false,
//   deleteBoardErrorMsg:'',

//   // like
//   likeBoardLoad:      false,
//   likeBoardError:     false,

//   // share
//   shareBoardLoad:     false,
//   shareUrl:           '',

//   // discover
//   discoverBoards:     [],
//   discoverLoad:       false,
//   discoverError:      false,
//   discoverPagination: null,
// }

// // ─── Thunks ───────────────────────────────────────────────────────────────────

// export const createBoard = createAsyncThunk(
//   'board/createBoard',
//   async (payload) => {
//     const { title, description, visibility, receipent, event, coverImage, tags } = payload
//     try {
//       const resp = await axios.post(
//         `${URL}/api/v1/board`,
//         { title, description, visibility, receipent, event, coverImage, tags },
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

// export const getMyBoards = createAsyncThunk(
//   'board/getMyBoards',
//   async (params = {}) => {
//     const { page = 1, limit = 12, view = 'owned', tier, visibility, status, event } = params
//     try {
//       const resp = await axios.get(`${URL}/api/v1/board`, {
//         params: { page, limit, view, tier, visibility, status, event },
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

// export const getBoardBySlug = createAsyncThunk(
//   'board/getBoardBySlug',
//   async (slug) => {
//     try {
//       const resp = await axios.get(`${URL}/api/v1/board/${slug}`, {
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

// export const updateBoard = createAsyncThunk(
//   'board/updateBoard',
//   async ({ id, ...fields }) => {
//     try {
//       const resp = await axios.patch(
//         `${URL}/api/v1/board/${id}`,
//         fields,
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

// export const deleteBoard = createAsyncThunk(
//   'board/deleteBoard',
//   async (id) => {
//     try {
//       const resp = await axios.delete(`${URL}/api/v1/board/${id}`, {
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

// export const likeBoard = createAsyncThunk(
//   'board/likeBoard',
//   async (id) => {
//     try {
//       const resp = await axios.post(`${URL}/api/v1/board/${id}/like`, {}, {
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

// export const shareBoard = createAsyncThunk(
//   'board/shareBoard',
//   async (id) => {
//     try {
//       const resp = await axios.post(`${URL}/api/v1/board/${id}/share`, {}, {
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

// export const discoverBoards = createAsyncThunk(
//   'board/discoverBoards',
//   async (params = {}) => {
//     const { page = 1, limit = 12, sort = 'latest' } = params
//     try {
//       const resp = await axios.get(`${URL}/api/v1/board/discover`, {
//         params: { page, limit, sort },
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


// const boardSlice = createSlice({
//   name: 'board',
//   initialState,
//   reducers: {
//     clearBoardNotifications: (state) => {
//       state.createBoardError    = false
//       state.createBoardErrorMsg = ''
//       state.updateBoardError    = false
//       state.updateBoardErrorMsg = ''
//       state.deleteBoardError    = false
//       state.deleteBoardErrorMsg = ''
//       state.boardError          = false
//       state.boardErrorMsg       = ''
//     },
//     clearCreatedBoard: (state) => {
//       state.createdBoard = null
//     },
//   },
//   extraReducers(builder) {
//     builder
//       // createBoard
//       .addCase(createBoard.pending, (state) => {
//         state.createBoardLoad     = true
//         state.createBoardError    = false
//         state.createBoardErrorMsg = ''
//         state.createdBoard        = null
//       })
//       .addCase(createBoard.fulfilled, (state, action) => {
//         const { status, code, response } = action.payload
//         state.createBoardLoad = false
//         if (code === 500) {
//           state.createBoardError    = true
//           state.createBoardErrorMsg = "Can't create board due to network"
//         } else if (status === 'success') {
//           state.createBoardError = false
//           state.createdBoard     = response.board
//         } else {
//           state.createBoardError    = true
//           state.createBoardErrorMsg = response.msg || response.message || 'Failed to create board'
//         }
//       })
//       .addCase(createBoard.rejected, (state) => {
//         state.createBoardLoad     = false
//         state.createBoardError    = true
//         state.createBoardErrorMsg = 'Unable to create board'
//       })

//       // getMyBoards
//       .addCase(getMyBoards.pending, (state) => {
//         state.boardsLoad  = true
//         state.boardsError = false
//       })
//       .addCase(getMyBoards.fulfilled, (state, action) => {
//         const { status, response } = action.payload
//         state.boardsLoad = false
//         if (status === 'success') {
//           state.boardsError      = false
//           state.boards           = response.boards
//           state.boardsPagination = response.pagination
//         } else {
//           state.boardsError    = true
//           state.boardsErrorMsg = response.msg || response.message || 'Failed to fetch boards'
//         }
//       })
//       .addCase(getMyBoards.rejected, (state) => {
//         state.boardsLoad     = false
//         state.boardsError    = true
//         state.boardsErrorMsg = 'Unable to fetch boards'
//       })

//       // getBoardBySlug
//       .addCase(getBoardBySlug.pending, (state) => {
//         state.boardLoad  = true
//         state.boardError = false
//         state.board      = null
//       })
//       .addCase(getBoardBySlug.fulfilled, (state, action) => {
//         const { status, response } = action.payload
//         state.boardLoad = false
//         if (status === 'success') {
//           state.boardError = false
//           state.board      = response.board
//         } else {
//           state.boardError    = true
//           state.boardErrorMsg = response.msg || response.message || 'Board not found'
//         }
//       })
//       .addCase(getBoardBySlug.rejected, (state) => {
//         state.boardLoad     = false
//         state.boardError    = true
//         state.boardErrorMsg = 'Unable to fetch board'
//       })

//       // updateBoard
//       .addCase(updateBoard.pending, (state) => {
//         state.updateBoardLoad  = true
//         state.updateBoardError = false
//       })
//       .addCase(updateBoard.fulfilled, (state, action) => {
//         const { status, response } = action.payload
//         state.updateBoardLoad = false
//         if (status === 'success') {
//           state.updateBoardError = false
//           state.board            = response.board
//         } else {
//           state.updateBoardError    = true
//           state.updateBoardErrorMsg = response.msg || response.message || 'Failed to update board'
//         }
//       })
//       .addCase(updateBoard.rejected, (state) => {
//         state.updateBoardLoad     = false
//         state.updateBoardError    = true
//         state.updateBoardErrorMsg = 'Unable to update board'
//       })

//       // deleteBoard
//       .addCase(deleteBoard.pending, (state) => {
//         state.deleteBoardLoad  = true
//         state.deleteBoardError = false
//       })
//       .addCase(deleteBoard.fulfilled, (state, action) => {
//         const { status, response } = action.payload
//         state.deleteBoardLoad = false
//         if (status === 'success') {
//           state.deleteBoardError = false
//           state.boards = state.boards.filter(b => b._id !== action.meta.arg)
//         } else {
//           state.deleteBoardError    = true
//           state.deleteBoardErrorMsg = response.msg || response.message || 'Failed to delete board'
//         }
//       })
//       .addCase(deleteBoard.rejected, (state) => {
//         state.deleteBoardLoad     = false
//         state.deleteBoardError    = true
//         state.deleteBoardErrorMsg = 'Unable to delete board'
//       })

//       // likeBoard
//       .addCase(likeBoard.pending, (state) => {
//         state.likeBoardLoad  = true
//         state.likeBoardError = false
//       })
//       .addCase(likeBoard.fulfilled, (state, action) => {
//         const { status, response } = action.payload
//         state.likeBoardLoad = false
//         if (status === 'success' && state.board) {
//           state.board.stats.likes = response.likeCount
//         } else {
//           state.likeBoardError = true
//         }
//       })
//       .addCase(likeBoard.rejected, (state) => {
//         state.likeBoardLoad  = false
//         state.likeBoardError = true
//       })

//       // shareBoard
//       .addCase(shareBoard.pending, (state) => {
//         state.shareBoardLoad = true
//       })
//       .addCase(shareBoard.fulfilled, (state, action) => {
//         const { status, response } = action.payload
//         state.shareBoardLoad = false
//         if (status === 'success') {
//           state.shareUrl = response.shareUrl
//         }
//       })
//       .addCase(shareBoard.rejected, (state) => {
//         state.shareBoardLoad = false
//       })

//       // discoverBoards
//       .addCase(discoverBoards.pending, (state) => {
//         state.discoverLoad  = true
//         state.discoverError = false
//       })
//       .addCase(discoverBoards.fulfilled, (state, action) => {
//         const { status, response } = action.payload
//         state.discoverLoad = false
//         if (status === 'success') {
//           state.discoverBoards     = response.boards
//           state.discoverPagination = response.pagination
//         } else {
//           state.discoverError = true
//         }
//       })
//       .addCase(discoverBoards.rejected, (state) => {
//         state.discoverLoad  = false
//         state.discoverError = true
//       })
//   },
// })

// export default boardSlice.reducer
// export const { clearBoardNotifications, clearCreatedBoard } = boardSlice.actions


import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'
import { URL } from '../paths/url'
 
const initialState = {
  // create
  createBoardLoad:    false,
  createBoardError:   false,
  createBoardErrorMsg:'',
  createdBoard:       null,
 
  // my boards list
  boards:             [],
  boardsLoad:         false,
  boardsError:        false,
  boardsErrorMsg:     '',
  boardsPagination:   null,
 
  // single board
  board:              null,
  boardLoad:          false,
  boardError:         false,
  boardErrorMsg:      '',
 
  // update
  updateBoardLoad:    false,
  updateBoardError:   false,
  updateBoardErrorMsg:'',
 
  // delete
  deleteBoardLoad:    false,
  deleteBoardError:   false,
  deleteBoardErrorMsg:'',
 
  // like
  likeBoardLoad:      false,
  likeBoardError:     false,
 
  // share
  shareBoardLoad:     false,
  shareUrl:           '',
 
  // discover
  discoverBoards:     [],
  discoverLoad:       false,
  discoverError:      false,
  discoverPagination: null,
  discoverLastEvent:  undefined, // tracks event param used in last successful fetch

  // my boards last fetch params (for cache-busting on tab/filter change)
  myBoardsLastParams: null,

  // increments whenever board/message caches are invalidated — listeners re-fetch
  boardCacheVersion: 0,
 
  // liked board ids (for persistent like state)
  likedBoardIds:      [],
  likedBoardIdsLoad:  false,
}
 
// ─── Thunks ───────────────────────────────────────────────────────────────────
 
export const createBoard = createAsyncThunk(
  'board/createBoard',
  async (payload) => {
    const { title, description, visibility, receipent, event, coverImage, coverImagePublicId, tags } = payload
    try {
      const resp = await axios.post(
        `${URL}/api/v1/board`,
        { title, description, visibility, receipent, event, coverImage, coverImagePublicId, tags },
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

export const getHashtagBoards = createAsyncThunk(
  'board/getHashtagBoards',
  async ({ tag, page = 1, limit = 20 }) => {
    try {
      const resp = await axios.get(`${URL}/api/v1/board/hashtag/${encodeURIComponent(tag)}`, {
        params: { page, limit },
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
 
export const getMyBoards = createAsyncThunk(
  'board/getMyBoards',
  async (params = {}) => {
    const { page = 1, limit = 12, view = 'owned', tier, visibility, status, event } = params
    try {
      const resp = await axios.get(`${URL}/api/v1/board`, {
        params: { page, limit, view, tier, visibility, status, event },
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
  },
  {
    condition: (params = {}, { getState }) => {
      const { boards, myBoardsLastParams } = getState().board
      if (!boards.length) return true
      const view  = params?.view  ?? 'owned'
      const event = params?.event ?? null
      if (myBoardsLastParams?.view === view && myBoardsLastParams?.event === event) return false
      return true
    },
  }
)
 
export const getBoardBySlug = createAsyncThunk(
  'board/getBoardBySlug',
  async (slug) => {
    try {
      const resp = await axios.get(`${URL}/api/v1/board/${slug}`, {
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
 
export const updateBoard = createAsyncThunk(
  'board/updateBoard',
  async ({ id, ...fields }) => {
    try {
      const resp = await axios.patch(
        `${URL}/api/v1/board/${id}`,
        fields,
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
 
export const deleteBoard = createAsyncThunk(
  'board/deleteBoard',
  async (id, thunkApi) => {
    try {
      const resp = await axios.delete(`${URL}/api/v1/board/${id}`, {
        withCredentials: true,
      })
      thunkApi.dispatch(discoverBoards())
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
 
export const likeBoard = createAsyncThunk(
  'board/likeBoard',
  async (id) => {
    try {
      const resp = await axios.post(`${URL}/api/v1/board/${id}/like`, {}, {
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
 
export const shareBoard = createAsyncThunk(
  'board/shareBoard',
  async (id) => {
    try {
      const resp = await axios.post(`${URL}/api/v1/board/${id}/share`, {}, {
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
 
export const discoverBoards = createAsyncThunk(
  'board/discoverBoards',
  async (params = {}) => {
    const { page = 1, limit = 12, sort = 'latest', event } = params
    try {
      const resp = await axios.get(`${URL}/api/v1/board/discover`, {
        params: { page, limit, sort, event },
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
  },
  {
    condition: (params = {}, { getState }) => {
      const { discoverBoards: dBoards, discoverLastEvent } = getState().board
      if (!dBoards.length) return true
      const event = params?.event ?? null
      if (discoverLastEvent === event) return false
      return true
    },
  }
)
 
 
export const getBoardLikes = createAsyncThunk(
  'board/getBoardLikes',
  async () => {
    try {
      const resp = await axios.get(`${URL}/api/v1/board/likes/me`, {
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
 
// ─── Slice ────────────────────────────────────────────────────────────────────
 
const boardSlice = createSlice({
  name: 'board',
  initialState,
  reducers: {
    clearBoardNotifications: (state) => {
      state.createBoardError    = false
      state.createBoardErrorMsg = ''
      state.updateBoardError    = false
      state.updateBoardErrorMsg = ''
      state.deleteBoardError    = false
      state.deleteBoardErrorMsg = ''
      state.boardError          = false
      state.boardErrorMsg       = ''
    },
    clearCreatedBoard: (state) => {
      state.createdBoard = null
    },
    // Invalidate board fetch caches so next visit to home/profile re-fetches
    invalidateBoardCaches: (state) => {
      state.myBoardsLastParams = null
      state.discoverLastEvent  = undefined
      state.boardCacheVersion  = (state.boardCacheVersion ?? 0) + 1
    },
    // Optimistic like toggle — called before server responds, reverted on failure
    optimisticToggleLike: (state, action) => {
      const boardId = action.payload
      const idx = state.likedBoardIds.indexOf(boardId)
      if (idx === -1) {
        state.likedBoardIds.push(boardId)
      } else {
        state.likedBoardIds.splice(idx, 1)
      }
    },
  },
  extraReducers(builder) {
    builder
      // createBoard
      .addCase(createBoard.pending, (state) => {
        state.createBoardLoad     = true
        state.createBoardError    = false
        state.createBoardErrorMsg = ''
        state.createdBoard        = null
      })
      .addCase(createBoard.fulfilled, (state, action) => {
        const { status, code, response } = action.payload
        state.createBoardLoad = false
        if (code === 500) {
          state.createBoardError    = true
          state.createBoardErrorMsg = "Can't create board due to network"
        } else if (status === 'success') {
          state.createBoardError = false
          state.createdBoard     = response.board
        } else {
          state.createBoardError    = true
          state.createBoardErrorMsg = response.msg || response.message || 'Failed to create board'
        }
      })
      .addCase(createBoard.rejected, (state) => {
        state.createBoardLoad     = false
        state.createBoardError    = true
        state.createBoardErrorMsg = 'Unable to create board'
      })
 
      // getMyBoards
      .addCase(getMyBoards.pending, (state) => {
        state.boardsLoad  = true
        state.boardsError = false
        state.boards      = []
      })
      .addCase(getMyBoards.fulfilled, (state, action) => {
        const { status, response } = action.payload
        state.boardsLoad = false
        if (status === 'success') {
          state.boardsError      = false
          state.boards           = response.boards
          state.boardsPagination = response.pagination
          state.myBoardsLastParams = {
            view:  action.meta.arg?.view  ?? 'owned',
            event: action.meta.arg?.event ?? null,
          }
        } else {
          state.boardsError    = true
          state.boardsErrorMsg = response.msg || response.message || 'Failed to fetch boards'
        }
      })
      .addCase(getMyBoards.rejected, (state) => {
        state.boardsLoad     = false
        state.boardsError    = true
        state.boardsErrorMsg = 'Unable to fetch boards'
      })
 
      // getBoardBySlug
      .addCase(getBoardBySlug.pending, (state) => {
        state.boardLoad  = true
        state.boardError = false
        state.board      = null
      })
      .addCase(getBoardBySlug.fulfilled, (state, action) => {
        const { status, response } = action.payload
        state.boardLoad = false
        if (status === 'success') {
          state.boardError = false
          state.board      = response.board
        } else {
          state.boardError    = true
          state.boardErrorMsg = response.msg || response.message || 'Board not found'
        }
      })
      .addCase(getBoardBySlug.rejected, (state) => {
        state.boardLoad     = false
        state.boardError    = true
        state.boardErrorMsg = 'Unable to fetch board'
      })
 
      // updateBoard
      .addCase(updateBoard.pending, (state) => {
        state.updateBoardLoad  = true
        state.updateBoardError = false
      })
      .addCase(updateBoard.fulfilled, (state, action) => {
        const { status, response } = action.payload
        state.updateBoardLoad = false
        if (status === 'success') {
          state.updateBoardError = false
          state.board            = response.board
        } else {
          state.updateBoardError    = true
          state.updateBoardErrorMsg = response.msg || response.message || 'Failed to update board'
        }
      })
      .addCase(updateBoard.rejected, (state) => {
        state.updateBoardLoad     = false
        state.updateBoardError    = true
        state.updateBoardErrorMsg = 'Unable to update board'
      })
 
      // deleteBoard
      .addCase(deleteBoard.pending, (state) => {
        state.deleteBoardLoad  = true
        state.deleteBoardError = false
      })
      .addCase(deleteBoard.fulfilled, (state, action) => {
        const { status, response } = action.payload
        state.deleteBoardLoad = false
        if (status === 'success') {
          state.deleteBoardError = false
          state.boards = state.boards.filter(b => b._id !== action.meta.arg)
        } else {
          state.deleteBoardError    = true
          state.deleteBoardErrorMsg = response.msg || response.message || 'Failed to delete board'
        }
      })
      .addCase(deleteBoard.rejected, (state) => {
        state.deleteBoardLoad     = false
        state.deleteBoardError    = true
        state.deleteBoardErrorMsg = 'Unable to delete board'
      })
 
      // likeBoard
      .addCase(likeBoard.pending, (state) => {
        state.likeBoardLoad  = true
        state.likeBoardError = false
      })
      .addCase(likeBoard.fulfilled, (state, action) => {
        const { status, response } = action.payload
        state.likeBoardLoad = false
        if (status === 'success' && state.board) {
          state.board.stats.likes = response.likeCount
        } else {
          state.likeBoardError = true
        }
      })
      .addCase(likeBoard.rejected, (state) => {
        state.likeBoardLoad  = false
        state.likeBoardError = true
      })
 
      // shareBoard
      .addCase(shareBoard.pending, (state) => {
        state.shareBoardLoad = true
      })
      .addCase(shareBoard.fulfilled, (state, action) => {
        const { status, response } = action.payload
        state.shareBoardLoad = false
        if (status === 'success') {
          state.shareUrl = response.shareUrl
        }
      })
      .addCase(shareBoard.rejected, (state) => {
        state.shareBoardLoad = false
      })
 
      // discoverBoards
      .addCase(discoverBoards.pending, (state) => {
        state.discoverLoad   = true
        state.discoverError  = false
        state.discoverBoards = []
      })
      .addCase(discoverBoards.fulfilled, (state, action) => {
        const { status, response } = action.payload
        state.discoverLoad = false
        if (status === 'success') {
          state.discoverBoards     = response.boards
          state.discoverPagination = response.pagination
          state.discoverLastEvent  = action.meta.arg?.event ?? null
        } else {
          state.discoverError = true
        }
      })
      .addCase(discoverBoards.rejected, (state) => {
        state.discoverLoad  = false
        state.discoverError = true
      })
 
      // getBoardLikes
      .addCase(getBoardLikes.pending, (state) => {
        state.likedBoardIdsLoad = true
      })
      .addCase(getBoardLikes.fulfilled, (state, action) => {
        const { status, response } = action.payload
        state.likedBoardIdsLoad = false
        if (status === 'success') {
          state.likedBoardIds = response.likedBoardIds
        }
      })
      .addCase(getBoardLikes.rejected, (state) => {
        state.likedBoardIdsLoad = false
      })
  },
})
 
export default boardSlice.reducer
export const { clearBoardNotifications, clearCreatedBoard, optimisticToggleLike, invalidateBoardCaches } = boardSlice.actions