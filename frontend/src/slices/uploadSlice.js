import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'
import { URL } from '../paths/url'

const initialState = {
  // image upload
  imageUploadLoad:    false,
  imageUploadError:   false,
  imageUploadErrorMsg:'',
  imageUrl:           null,

  // audio upload
  audioUploadLoad:    false,
  audioUploadError:   false,
  audioUploadErrorMsg:'',
  audioUrl:           null,
  audioDuration:      null,

  // generic last upload result
  lastUpload:         null,
}


export const uploadFile = createAsyncThunk(
  'upload/uploadFile',
  async ({ file, type }) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      if (type) formData.append('type', type)

      const resp = await axios.post(
        `${URL}/api/v1/upload`,
        formData,
        {
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      )
      return { response: resp.data, status: 'success', uploadType: type || resp.data.type }
    } catch (error) {
      return {
        response: error.response?.data || { message: 'Network error occurred' },
        status: 'error',
        code: error.response?.status || 500,
        uploadType: type,
      }
    }
  }
)



const uploadSlice = createSlice({
  name: 'upload',
  initialState,
  reducers: {
    clearUploadState: (state) => {
      state.imageUploadError    = false
      state.imageUploadErrorMsg = ''
      state.imageUrl            = null
      state.audioUploadError    = false
      state.audioUploadErrorMsg = ''
      state.audioUrl            = null
      state.audioDuration       = null
      state.lastUpload          = null
    },
    clearImageUpload: (state) => {
      state.imageUrl          = null
      state.imageUploadError  = false
      state.imageUploadErrorMsg = ''
    },
    clearAudioUpload: (state) => {
      state.audioUrl          = null
      state.audioDuration     = null
      state.audioUploadError  = false
      state.audioUploadErrorMsg = ''
    },
  },
  extraReducers(builder) {
    builder
      .addCase(uploadFile.pending, (state, action) => {
        const uploadType = action.meta.arg?.type
        if (uploadType === 'audio') {
          state.audioUploadLoad     = true
          state.audioUploadError    = false
          state.audioUploadErrorMsg = ''
        } else {
          state.imageUploadLoad     = true
          state.imageUploadError    = false
          state.imageUploadErrorMsg = ''
        }
      })
      .addCase(uploadFile.fulfilled, (state, action) => {
        const { status, code, response, uploadType } = action.payload

        if (uploadType === 'audio') {
          state.audioUploadLoad = false
          if (code === 500) {
            state.audioUploadError    = true
            state.audioUploadErrorMsg = "Can't upload audio due to network"
          } else if (status === 'success') {
            state.audioUploadError = false
            state.audioUrl         = response.url || response.secure_url
            state.audioDuration    = response.duration || null
            state.lastUpload       = response
          } else {
            state.audioUploadError    = true
            state.audioUploadErrorMsg = response.msg || response.message || 'Audio upload failed'
          }
        } else {
          state.imageUploadLoad = false
          if (code === 500) {
            state.imageUploadError    = true
            state.imageUploadErrorMsg = "Can't upload image due to network"
          } else if (status === 'success') {
            state.imageUploadError = false
            state.imageUrl         = response.url || response.secure_url
            state.lastUpload       = response
          } else {
            state.imageUploadError    = true
            state.imageUploadErrorMsg = response.msg || response.message || 'Image upload failed'
          }
        }
      })
      .addCase(uploadFile.rejected, (state, action) => {
        const uploadType = action.meta.arg?.type
        if (uploadType === 'audio') {
          state.audioUploadLoad     = false
          state.audioUploadError    = true
          state.audioUploadErrorMsg = 'Unable to upload audio'
        } else {
          state.imageUploadLoad     = false
          state.imageUploadError    = true
          state.imageUploadErrorMsg = 'Unable to upload image'
        }
      })
  },
})

export default uploadSlice.reducer
export const { clearUploadState, clearImageUpload, clearAudioUpload } = uploadSlice.actions