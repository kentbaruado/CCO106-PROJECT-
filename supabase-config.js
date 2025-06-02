import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
import { config } from './config.js'

// Initialize Supabase client
export const supabase = createClient(config.supabase.url, config.supabase.anonKey)

// Error handling utility
const handleError = (error, context) => {
    console.error(`Error in ${context}:`, error)
    return { data: null, error: error.message || 'An unexpected error occurred' }
}

// Sign up function
export async function signUp(email, password, isAdmin = false) {
    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
        })
        if (error) throw error
        return { data, error: null }
    } catch (error) {
        return handleError(error, 'signUp')
    }
}

// Create user profile function
export async function createUserProfile(supabaseClient, userId, profileData, isAdmin = false) {
    try {
        const { data, error } = await supabaseClient
            .from('profiles')
            .upsert([
                {
                    id: userId,
                    full_name: profileData.full_name,
                    dob: profileData.dob,
                    mobile: profileData.mobile,
                    is_admin: isAdmin
                }
            ])
        return { data, error }
    } catch (error) {
        console.error('Error in createUserProfile:', error)
        return { data: null, error }
    }
}

// Create admin account function
export async function createAdminAccount(email, password, profileData) {
    try {
        // First create the auth user
        console.log('Attempting to create auth user:', email);
        const { data: authData, error: authError } = await signUp(email, password);
        console.log('signUp result:', { authData, authError });

        if (authError) {
             console.error('Supabase signUp error:', authError);
             throw new Error(authError.message);
        }

        console.log('Admin authentication signup successful.');

        // Return the auth data from the signup attempt
        return { data: authData, error: null };

    } catch (error) {
        console.error('Error creating admin account:', error);
        throw error;
    }
}

// Check if user is admin
export async function isUserAdmin() {
    try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError) throw userError

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single()

        if (profileError) throw profileError

        return { isAdmin: profile?.is_admin || false, error: null }
    } catch (error) {
        console.error('Error checking admin status:', error)
        return { isAdmin: false, error }
    }
}

// Sign in function
export async function signIn(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        })
        return { data, error }
    } catch (error) {
        console.error('Error in signIn:', error)
        return { data: null, error }
    }
}

// Sign out function
export async function signOut() {
    try {
        const { error } = await supabase.auth.signOut()
        return { error }
    } catch (error) {
        console.error('Error in signOut:', error)
        return { error }
    }
}

// Get current user function
export async function getCurrentUser() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser()
        return { user, error }
    } catch (error) {
        console.error('Error in getCurrentUser:', error)
        return { user: null, error }
    }
}

// Add rate limiting for authentication
let authAttempts = new Map()
const MAX_ATTEMPTS = 5
const LOCKOUT_TIME = 15 * 60 * 1000 // 15 minutes

export function checkAuthAttempts(email) {
    const now = Date.now()
    const attempts = authAttempts.get(email) || { count: 0, timestamp: now }
    
    if (attempts.count >= MAX_ATTEMPTS && now - attempts.timestamp < LOCKOUT_TIME) {
        return false
    }
    
    if (now - attempts.timestamp >= LOCKOUT_TIME) {
        attempts.count = 0
        attempts.timestamp = now
    }
    
    attempts.count++
    authAttempts.set(email, attempts)
    return true
} 