import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'
import Cookies from 'js-cookie'
import { URL } from '../paths/url'

const storeProfileSetup = () => {
    const profileSetupData = JSON.parse(localStorage.getItem('profileSetupData'))
    return profileSetupData ? profileSetupData : false
}

const initialState = {
    loading: false,

    // signup terms 
    agreeTermsAndCondition: false,

    // login 
    loginInputs: { email: '', password: '' },
    loginLoad: false,
    loginError: false,
    loginErrorMsg: '',
    loginSuccessMsg: '',

    // signup 
    signupInputs: { email: '', password: '' },
    signupLoad: false,
    signupError: false,
    signupErrorMsg: '',
    signupSuccessMsg: '',
    setProfile: storeProfileSetup(),
    verificationRequired: false,
    verificationLink: '',

    // reset-password 
    resetPasswordEmail: '',
    resetPasswordLoad: false,
    resetPasswordError: false,
    resetPasswordSent: false,
    passwordResetMessage: '',

    // change password 
    changePasswordInputs: { newPassword: '', confirmPassword: '' },
    changePasswordLoad: false,
    changePasswordError: false,
    changePasswordErrorMsg: '',
    changePasswordSuccessMsg: '',
    changePasswordSuccess: false,

    // logout 
    logoutLoad: false,
    logoutError: false,
    logoutErrorMsg: '',

    // verification 
    verificationEmail: '',
    verificationSendLoad: false,
    verificationSendError: false,
    verificationSendErrorMsg: '',
    verificationSendSuccessMsg: '',

    // verify email (token from URL)
    verifyEmailLoad:    false,
    verifyEmailSuccess: false,
    verifyEmailError:   false,
    verifyEmailMsg:     '',

    // user
    user: [],
    isAuthenticated: false,
    token: '',
    userCookie: Cookies.get('token') && true,
}

export const updateNestedField = (obj, path, value) => {
    const keys = path.split('.')
    let current = obj
    keys.forEach((key, index) => {
        if (index === keys.length - 1) current[key] = value
        else current = current[key]
    })
}

export const signup = createAsyncThunk('actions/signup', async (payload) => {
    try {
        const { email, password } = payload
        const resp = await axios.post(`${URL}/api/v1/auth/register`, { email, password }, { withCredentials: true })
        return { response: resp.data, status: 'success' }
    } catch (error) {
        return { response: error.response?.data || { message: 'Network error occurred' }, status: 'error', code: error.response?.status || 500 }
    }
})

export const login = createAsyncThunk('actions/login', async (payload) => {
    const { email, password } = payload
    try {
        const resp = await axios.post(`${URL}/api/v1/auth/login`, { email, password }, { withCredentials: true })
        return { response: resp.data, status: 'success' }
    } catch (error) {
        return { response: error.response?.data || { msg: 'Network error occurred' }, status: 'error', code: error.response?.status || 500 }
    }
})

export const loginWithGoogle = createAsyncThunk('actions/loginWithGoogle', async () => {
    try {
        window.location.href = `${URL}/api/v1/auth/google`
        return { status: 'success' }
    } catch (error) {
        return { response: error.response?.data || { msg: 'Network error occurred' }, status: 'error', code: error.response?.status || 500 }
    }
})

export const resetPassword = createAsyncThunk('actions/resetPassword', async (payload) => {
    const { email } = payload
    try {
        const resp = await axios.post(`${URL}/api/v1/auth/forgot-password`, { email }, { withCredentials: true })
        return { response: resp.data, status: 'success' }
    } catch (error) {
        return { response: error.response?.data || { msg: 'Network error occurred' }, status: 'error', code: error.response?.status || 500 }
    }
})

export const changePassword = createAsyncThunk('actions/changePassword', async (payload) => {
    const { token, newPassword, confirmPassword } = payload
    try {
        const resp = await axios.patch(`${URL}/api/v1/auth/reset-password`, { token, newPassword, confirmPassword }, { withCredentials: true })
        return { response: resp.data, status: 'success' }
    } catch (error) {
        return { response: error.response?.data || { msg: 'Network error occurred' }, status: 'error', code: error.response?.status || 500 }
    }
})

export const logout = createAsyncThunk('actions/logout', async () => {
    try {
        const resp = await axios.post(`${URL}/api/v1/auth/logout`, {}, { withCredentials: true })
        return { response: resp.data, status: 'success' }
    } catch (error) {
        return { response: error.response?.data || { msg: 'Network error occurred' }, status: 'error', code: error.response?.status || 500 }
    }
})

export const resendVerificationLink = createAsyncThunk('actions/resendVerificationLink', async (payload) => {
    const { email } = payload
    try {
        const resp = await axios.post(`${URL}/api/v1/auth/resend-verification-email`, { email }, { withCredentials: true })
        return { response: resp.data, status: 'success' }
    } catch (error) {
        return { response: error.response?.data || { msg: 'Network error occurred' }, status: 'error', code: error.response?.status || 500 }
    }
})

export const verifyEmail = createAsyncThunk('actions/verifyEmail', async (payload) => {
    const { verificationToken } = payload
    try {
        const resp = await axios.post(
            `${URL}/api/v1/auth/verify-email`,
            {},
            { params: { verificationToken }, withCredentials: true }
        )
        return { response: resp.data, status: 'success' }
    } catch (error) {
        return { response: error.response?.data || { message: 'Network error occurred' }, status: 'error', code: error.response?.status || 500 }
    }
})

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        fillLoginInputs: (state, action) => {
            const { name, value } = action.payload
            if (name === 'email' || name === 'password') state.loginInputs[name] = value
        },
        updateSignupInputs: (state, action) => {
            state.signupInputs = { ...state.signupInputs, ...action.payload }
        },
        handleAgreeTermsAndConditions: (state, action) => {
            state.agreeTermsAndCondition = action.payload
        },
        handleVerificationEmailInput: (state, action) => {
            state.verificationEmail = action.payload
        },
        handleResetPasswordInput: (state, action) => {
            state.resetPasswordEmail = action.payload
        },
        resetSignupState: (state) => {
            state.signupError = false
            state.signupErrorMsg = ''
            state.signupSuccessMsg = ''
            state.verificationRequired = false
            state.verificationLink = ''
        },
        handleSignupInputChange: (state, action) => {
            const { name, value } = action.payload
            updateNestedField(state.signupInputs, name, value)
        },
        handleChangePasswordInputs: (state, action) => {
            const { newPassword, confirmPassword } = action.payload
            state.changePasswordInputs.newPassword = newPassword
            state.changePasswordInputs.confirmPassword = confirmPassword
        },
        updateProfileImage: (state, action) => {
            state.signupInputs.serviceProvider.profileImage = action.payload
        },
        clearAuthNotifications: (state) => {
            state.loginError = false
            state.loginErrorMsg = ''
            state.loginSuccessMsg = ''
            state.signupError = false
            state.signupErrorMsg = ''
            state.signupSuccessMsg = ''
            state.verificationRequired = false
            state.verificationLink = ''
            state.resetPasswordError = false
            state.resetPasswordSent = false
            state.passwordResetMessage = ''
            state.changePasswordError = false
            state.changePasswordErrorMsg = ''
            state.changePasswordSuccessMsg = ''
        },
        resetSignupForm: (state) => {
            state.signupInputs = { email: '', password: '' }
        },
        updateProfileStatus: (state) => {
            state.setProfile = false
            localStorage.setItem('profileSetupData', JSON.stringify(false))
        },
    },
    extraReducers(builder) {
        builder
            // login
            .addCase(login.pending, (state) => {
                state.loginLoad = true; state.loginError = false
                state.loginSuccessMsg = ''; state.loginErrorMsg = ''
            })
            .addCase(login.fulfilled, (state, action) => {
                const { status, code, response } = action.payload
                state.loginLoad = false
                if (code === 500) {
                    state.loginError = true
                    state.loginErrorMsg = `Can't login due to network`
                } else if (status === 'success') {
                    state.loginError = false
                    state.loginSuccessMsg = 'Login successful'
                    state.isAuthenticated = true
                    state.user = response.user
                    window.location.href = '/'
                } else {
                    state.loginError = true
                    state.loginErrorMsg = response.msg || response.message || 'Login failed'
                }
            })
            .addCase(login.rejected, (state) => {
                state.loginLoad = false; state.loginError = true
                state.loginErrorMsg = 'Unable to login'
            })

            // signup
            .addCase(signup.pending, (state) => {
                state.signupLoad = true; state.signupError = false
                state.signupErrorMsg = ''; state.signupSuccessMsg = ''
            })
            .addCase(signup.fulfilled, (state, action) => {
                const { status, code, response } = action.payload
                state.signupLoad = false
                if (code === 500) {
                    state.signupError = true
                    state.signupErrorMsg = `Can't signup due to network`
                } else if (status === 'success') {
                    state.signupError = false
                    state.signupSuccessMsg = response.message || 'Registration successful'
                    state.user = response.user
                    state.isAuthenticated = true
                    state.setProfile = true
                    localStorage.setItem('profileSetupData', JSON.stringify(true))
                } else {
                    state.signupError = true
                    state.signupErrorMsg = response.msg || response.message || 'Signup failed'
                }
            })
            .addCase(signup.rejected, (state) => {
                state.signupLoad = false; state.signupError = true
                state.signupErrorMsg = 'Unable to signup'
            })

            // reset password
            .addCase(resetPassword.pending, (state) => {
                state.resetPasswordLoad = true; state.resetPasswordError = false
                state.resetPasswordSent = false
            })
            .addCase(resetPassword.fulfilled, (state, action) => {
                const { status, code, response } = action.payload
                state.resetPasswordLoad = false
                if (code === 500) {
                    state.resetPasswordError = true
                    state.passwordResetMessage = 'Bad connection'
                } else if (status === 'success') {
                    state.resetPasswordError = false
                    state.resetPasswordSent = true
                    state.passwordResetMessage = response.msg || response.message
                } else {
                    state.resetPasswordError = true
                    state.passwordResetMessage = response.msg || response.message
                }
            })
            .addCase(resetPassword.rejected, (state) => {
                state.resetPasswordLoad = false; state.resetPasswordError = true
                state.passwordResetMessage = 'Unable to reset password'
            })

            // change password
            .addCase(changePassword.pending, (state) => {
                state.changePasswordLoad = true; state.changePasswordError = false
                state.changePasswordErrorMsg = ''; state.changePasswordSuccessMsg = ''
                state.changePasswordSuccess = false
            })
            .addCase(changePassword.fulfilled, (state, action) => {
                const { status, code, response } = action.payload
                state.changePasswordLoad = false
                if (code === 500) {
                    state.changePasswordError = true
                    state.changePasswordErrorMsg = 'Bad connection'
                } else if (status === 'success') {
                    state.changePasswordError = false
                    state.changePasswordSuccessMsg = 'Password updated successfully'
                    state.changePasswordSuccess = true
                    setTimeout(() => { window.location.href = '/login'; state.changePasswordSuccess = false }, 1000)
                } else {
                    state.changePasswordError = true
                    state.changePasswordErrorMsg = response.msg || response.message
                }
            })
            .addCase(changePassword.rejected, (state) => {
                state.changePasswordLoad = false; state.changePasswordError = true
                state.changePasswordErrorMsg = 'Unable to update password'
            })

            // logout
            .addCase(logout.pending, (state) => {
                state.logoutLoad = true; state.logoutError = false
            })
            .addCase(logout.fulfilled, (state, action) => {
                const { status, code, response } = action.payload
                state.logoutLoad = false
                if (code === 500) {
                    state.logoutError = true; state.logoutErrorMsg = 'Bad connection'
                } else if (status === 'success') {
                    state.logoutError = false; state.isAuthenticated = false
                    state.user = []; window.location.href = '/'
                } else {
                    state.logoutError = true
                    state.logoutErrorMsg = response.msg || response.message
                }
            })
            .addCase(logout.rejected, (state) => {
                state.logoutLoad = false; state.logoutError = true
                state.logoutErrorMsg = 'Unable to logout'
            })

            // resend verification link
            .addCase(resendVerificationLink.pending, (state) => {
                state.verificationSendLoad = true; state.verificationSendError = false
                state.verificationSendErrorMsg = ''; state.verificationSendSuccessMsg = ''
            })
            .addCase(resendVerificationLink.fulfilled, (state, action) => {
                const { status, code, response } = action.payload
                state.verificationSendLoad = false
                if (code === 500) {
                    state.verificationSendError = true
                    state.verificationSendErrorMsg = 'Bad connection'
                } else if (status === 'success') {
                    state.verificationSendError = false
                    state.verificationSendSuccessMsg = response.msg || response.message
                } else {
                    state.verificationSendError = true
                    state.verificationSendErrorMsg = response.msg || response.message
                }
            })
            .addCase(resendVerificationLink.rejected, (state) => {
                state.verificationSendLoad = false; state.verificationSendError = true
                state.verificationSendErrorMsg = 'Unable to send verification email'
            })

            // verify email (token from URL)
            .addCase(verifyEmail.pending, (state) => {
                state.verifyEmailLoad = true
                state.verifyEmailSuccess = false
                state.verifyEmailError = false
                state.verifyEmailMsg = ''
            })
            .addCase(verifyEmail.fulfilled, (state, action) => {
                const { status, code, response } = action.payload
                state.verifyEmailLoad = false
                if (code === 500) {
                    state.verifyEmailError = true
                    state.verifyEmailMsg = 'Bad connection'
                } else if (status === 'success') {
                    state.verifyEmailSuccess = true
                    state.verifyEmailError = false
                    state.verifyEmailMsg = response.message || 'Email verified successfully'
                } else {
                    state.verifyEmailError = true
                    state.verifyEmailMsg = response.msg || response.message || 'Verification failed'
                }
            })
            .addCase(verifyEmail.rejected, (state) => {
                state.verifyEmailLoad = false
                state.verifyEmailError = true
                state.verifyEmailMsg = 'Unable to verify email'
            })
    },
})

export default authSlice.reducer
export const {
    fillLoginInputs,
    updateSignupInputs,
    resetSignupState,
    handleSignupInputChange,
    updateProfileImage,
    addPortfolioImages,
    removePortfolioImage,
    clearAuthNotifications,
    resetSignupForm,
    handleAgreeTermsAndConditions,
    handleVerificationEmailInput,
    handleResetPasswordInput,
    handleChangePasswordInputs,
    updateProfileStatus,
} = authSlice.actions