import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'
import { URL } from '../paths/url'


export const checkUsername = createAsyncThunk(
    'user/checkUsername',
    async (payload) => {
        const { username } = payload
        try {
            const resp = await axios.get(
                `${URL}/api/v1/user/check-username/${username}`,
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


export const getMyProfile = createAsyncThunk(
    'user/getMyProfile',
    async () => {
        try {
            const resp = await axios.get(
                `${URL}/api/v1/user/me`,
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

export const updateProfile = createAsyncThunk(
    'user/updateProfile',
    async (payload) => {
        const { username, profileImage, country, accountType } = payload
        try {
            const resp = await axios.patch(
                `${URL}/api/v1/user/profile`,
                { username, profileImage, country, accountType },
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

export const getPublicProfile = createAsyncThunk(
    'user/getPublicProfile',
    async (payload) => {
        const { username, view } = payload
        try {
            const resp = await axios.get(
                `${URL}/api/v1/user/profile/${username}`,
                {
                    params: { view },
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

export const changePassword = createAsyncThunk(
    'user/changePassword',
    async (payload) => {
        const { currentPassword, newPassword } = payload
        try {
            const resp = await axios.patch(
                `${URL}/api/v1/user/change-password`,
                { currentPassword, newPassword },
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

export const deleteAccount = createAsyncThunk(
    'user/deleteAccount',
    async () => {
        try {
            const resp = await axios.delete(
                `${URL}/api/v1/user/delete-account`,
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


export const listUsers = createAsyncThunk(
    'user/listUsers',
    async (payload = {}) => {
        const { page = 1, limit = 20, search = '' } = payload
        try {
            const resp = await axios.get(
                `${URL}/api/v1/user`,
                {
                    params: { page, limit, search },
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

export const updateUserRole = createAsyncThunk(
    'user/updateUserRole',
    async (payload) => {
        const { id, role } = payload
        try {
            const resp = await axios.patch(
                `${URL}/api/v1/user/${id}/role`,
                { role },
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


const initialState = {
    // check username
    usernameAvailable: null,
    usernameCheckLoad: false,
    usernameCheckMsg: '',
    receipentUser: '',
    checkReceipentUser: null,

    // my profile
    myProfile: null,
    myProfileLoad: false,
    myProfileError: false,
    myProfileErrorMsg: '',

    // update profile
    updateProfileLoad: false,
    updateProfileError: false,
    updateProfileErrorMsg: '',
    updateProfileSuccessMsg: '',
    updateProfileSuccess: false,

    // public profile
    publicProfile: null,
    publicProfileBoards: [],
    publicProfileView: 'owned',
    publicProfileLoad: false,
    publicProfileError: false,
    publicProfileErrorMsg: '',

    // change password
    changePasswordLoad: false,
    changePasswordError: false,
    changePasswordErrorMsg: '',
    changePasswordSuccessMsg: '',
    changePasswordSuccess: false,

    // delete account
    deleteAccountLoad: false,
    deleteAccountError: false,
    deleteAccountErrorMsg: '',

    // admin: list users
    users: [],
    usersPagination: null,
    listUsersLoad: false,
    listUsersError: false,
    listUsersErrorMsg: '',

    // admin: update user role
    updateRoleLoad: false,
    updateRoleError: false,
    updateRoleErrorMsg: '',
    updateRoleSuccessMsg: '',
}


const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        receipentInputChange: (state, action) => {
            state.receipentUser = action.payload
        },
        clearUserNotifications: (state) => {
            state.updateProfileError = false
            state.updateProfileErrorMsg = ''
            state.updateProfileSuccessMsg = ''
            state.updateProfileSuccess = false
            state.changePasswordError = false
            state.changePasswordErrorMsg = ''
            state.changePasswordSuccessMsg = ''
            state.changePasswordSuccess = false
            state.deleteAccountError = false
            state.deleteAccountErrorMsg = ''
            state.updateRoleError = false
            state.updateRoleErrorMsg = ''
            state.updateRoleSuccessMsg = ''
            state.publicProfileError = false
            state.publicProfileErrorMsg = ''
        },

        clearPublicProfile: (state) => {
            state.publicProfile = null
            state.publicProfileBoards = []
            state.publicProfileView = 'owned'
            state.publicProfileError = false
            state.publicProfileErrorMsg = ''
        },

        resetUsernameCheck: (state) => {
            state.usernameAvailable = null
            state.usernameCheckLoad = false
            state.usernameCheckMsg = ''
            state.checkReceipentUser = null
        },
    },
    extraReducers(builder) {
        builder
            .addCase(checkUsername.pending, (state) => {
                state.usernameCheckLoad = true
                state.usernameAvailable = null
                state.checkReceipentUser = null
                state.usernameCheckMsg = ''
            })
            .addCase(checkUsername.fulfilled, (state, action) => {
                const { status, code, response } = action.payload
                state.usernameCheckLoad = false

                if (code === 500) {
                    state.usernameAvailable = null
                    state.usernameCheckMsg = 'Bad connection'
                } else if (status === 'success') {
                    state.usernameAvailable = response.available
                    state.checkReceipentUser = !response.available
                    state.usernameCheckMsg = response.message
                } else {
                    state.usernameAvailable = null
                    state.usernameCheckMsg = response.msg || response.message || 'Check failed'
                }
            })
            .addCase(checkUsername.rejected, (state) => {
                state.usernameCheckLoad = false
                state.usernameAvailable = null
                state.checkReceipentUser = null
                state.usernameCheckMsg = 'Unable to check username'
            })

            .addCase(getMyProfile.pending, (state) => {
                state.myProfileLoad = true
                state.myProfileError = false
                state.myProfileErrorMsg = ''
            })
            .addCase(getMyProfile.fulfilled, (state, action) => {
                const { status, code, response } = action.payload
                state.myProfileLoad = false

                if (code === 500) {
                    state.myProfileError = true
                    state.myProfileErrorMsg = `Bad connection`
                } else if (status === 'success') {
                    state.myProfileError = false
                    state.myProfile = response.user
                } else {
                    state.myProfileError = true
                    state.myProfileErrorMsg = response.msg || response.message || 'Failed to fetch profile'
                }
            })
            .addCase(getMyProfile.rejected, (state) => {
                state.myProfileLoad = false
                state.myProfileError = true
                state.myProfileErrorMsg = 'Unable to fetch profile'
            })

            .addCase(updateProfile.pending, (state) => {
                state.updateProfileLoad = true
                state.updateProfileError = false
                state.updateProfileErrorMsg = ''
                state.updateProfileSuccessMsg = ''
                state.updateProfileSuccess = false
            })
            .addCase(updateProfile.fulfilled, (state, action) => {
                const { status, code, response } = action.payload
                state.updateProfileLoad = false

                if (code === 500) {
                    state.updateProfileError = true
                    state.updateProfileErrorMsg = `Bad connection`
                } else if (status === 'success') {
                    state.updateProfileError = false
                    state.updateProfileSuccessMsg = response.message || 'Profile updated successfully'
                    state.updateProfileSuccess = true
                    state.myProfile = response.user
                } else {
                    state.updateProfileError = true
                    state.updateProfileErrorMsg = response.msg || response.message || 'Failed to update profile'
                }
            })
            .addCase(updateProfile.rejected, (state) => {
                state.updateProfileLoad = false
                state.updateProfileError = true
                state.updateProfileErrorMsg = 'Unable to update profile'
            })

            .addCase(getPublicProfile.pending, (state) => {
                state.publicProfileLoad = true
                state.publicProfileError = false
                state.publicProfileErrorMsg = ''
            })
            .addCase(getPublicProfile.fulfilled, (state, action) => {
                const { status, code, response } = action.payload
                state.publicProfileLoad = false

                if (code === 500) {
                    state.publicProfileError = true
                    state.publicProfileErrorMsg = `Bad connection`
                } else if (status === 'success') {
                    state.publicProfileError = false
                    state.publicProfile = response.user
                    state.publicProfileBoards = response.boards
                    state.publicProfileView = response.view
                } else {
                    state.publicProfileError = true
                    state.publicProfileErrorMsg = response.msg || response.message || 'Failed to fetch profile'
                }
            })
            .addCase(getPublicProfile.rejected, (state) => {
                state.publicProfileLoad = false
                state.publicProfileError = true
                state.publicProfileErrorMsg = 'Unable to fetch profile'
            })

            .addCase(changePassword.pending, (state) => {
                state.changePasswordLoad = true
                state.changePasswordError = false
                state.changePasswordErrorMsg = ''
                state.changePasswordSuccessMsg = ''
                state.changePasswordSuccess = false
            })
            .addCase(changePassword.fulfilled, (state, action) => {
                const { status, code, response } = action.payload
                state.changePasswordLoad = false

                if (code === 500) {
                    state.changePasswordError = true
                    state.changePasswordErrorMsg = `Bad connection`
                } else if (status === 'success') {
                    state.changePasswordError = false
                    state.changePasswordSuccessMsg = response.message || 'Password changed successfully'
                    state.changePasswordSuccess = true
                } else {
                    state.changePasswordError = true
                    state.changePasswordErrorMsg = response.msg || response.message || 'Failed to change password'
                }
            })
            .addCase(changePassword.rejected, (state) => {
                state.changePasswordLoad = false
                state.changePasswordError = true
                state.changePasswordErrorMsg = 'Unable to change password'
            })

            .addCase(deleteAccount.pending, (state) => {
                state.deleteAccountLoad = true
                state.deleteAccountError = false
                state.deleteAccountErrorMsg = ''
            })
            .addCase(deleteAccount.fulfilled, (state, action) => {
                const { status, code, response } = action.payload
                state.deleteAccountLoad = false

                if (code === 500) {
                    state.deleteAccountError = true
                    state.deleteAccountErrorMsg = `Bad connection`
                } else if (status === 'success') {
                    state.deleteAccountError = false
                    window.location.href = '/'
                } else {
                    state.deleteAccountError = true
                    state.deleteAccountErrorMsg = response.msg || response.message || 'Failed to delete account'
                }
            })
            .addCase(deleteAccount.rejected, (state) => {
                state.deleteAccountLoad = false
                state.deleteAccountError = true
                state.deleteAccountErrorMsg = 'Unable to delete account'
            })

            .addCase(listUsers.pending, (state) => {
                state.listUsersLoad = true
                state.listUsersError = false
                state.listUsersErrorMsg = ''
            })
            .addCase(listUsers.fulfilled, (state, action) => {
                const { status, code, response } = action.payload
                state.listUsersLoad = false

                if (code === 500) {
                    state.listUsersError = true
                    state.listUsersErrorMsg = `Bad connection`
                } else if (status === 'success') {
                    state.listUsersError = false
                    state.users = response.users
                    state.usersPagination = response.pagination
                } else {
                    state.listUsersError = true
                    state.listUsersErrorMsg = response.msg || response.message || 'Failed to fetch users'
                }
            })
            .addCase(listUsers.rejected, (state) => {
                state.listUsersLoad = false
                state.listUsersError = true
                state.listUsersErrorMsg = 'Unable to fetch users'
            })

            .addCase(updateUserRole.pending, (state) => {
                state.updateRoleLoad = true
                state.updateRoleError = false
                state.updateRoleErrorMsg = ''
                state.updateRoleSuccessMsg = ''
            })
            .addCase(updateUserRole.fulfilled, (state, action) => {
                const { status, code, response } = action.payload
                state.updateRoleLoad = false

                if (code === 500) {
                    state.updateRoleError = true
                    state.updateRoleErrorMsg = `Bad connection`
                } else if (status === 'success') {
                    state.updateRoleError = false
                    state.updateRoleSuccessMsg = response.message || 'Role updated successfully'
                    // patch the updated user in the list in-place
                    state.users = state.users.map((u) =>
                        u._id === response.user._id ? response.user : u
                    )
                } else {
                    state.updateRoleError = true
                    state.updateRoleErrorMsg = response.msg || response.message || 'Failed to update role'
                }
            })
            .addCase(updateUserRole.rejected, (state) => {
                state.updateRoleLoad = false
                state.updateRoleError = true
                state.updateRoleErrorMsg = 'Unable to update role'
            })
    }
})

export default userSlice.reducer
export const {
    clearUserNotifications,
    clearPublicProfile,
    resetUsernameCheck,
    receipentInputChange
} = userSlice.actions