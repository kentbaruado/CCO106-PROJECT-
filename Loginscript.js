// Loginscript.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Initialize Supabase client
const supabaseUrl = 'https://ovteiceidxxurslhypqp.supabase.co'; // Replace with your actual Supabase URL
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92dGVpY2VpZHh4dXJzbGh5cHFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MzQ2ODcsImV4cCI6MjA2MzQxMDY4N30.m9hzZxkBM_8IBWgbkgXh7puCNTVmDe-v_AA3vP_R1ws'; // Replace with your actual Supabase anon key
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Function to handle email confirmation redirects
async function handleEmailConfirmation() {
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    const access_token = urlParams.get('access_token');
    const refresh_token = urlParams.get('refresh_token');

    if (type === 'signup' && access_token && refresh_token) {
        console.log('Handling email confirmation redirect...');
        // Supabase automatically handles the session storage if client is initialized
        // We can simply remove the URL parameters and optionally show a message
        // Then redirect to the clean login URL

        // Remove URL parameters
        urlParams.delete('type');
        urlParams.delete('access_token');
        urlParams.delete('refresh_token');
        // You might need to remove other parameters like 'expires_in', 'token_type', etc.

        const cleanUrl = window.location.origin + window.location.pathname;
        history.replaceState(null, '', cleanUrl); // Clean up the URL without reloading

        // Optionally, display a success message to the user on the login page
        const successMessageElement = document.getElementById('success-message'); // Assuming you have such an element on login.html
        if (successMessageElement) {
            successMessageElement.textContent = 'Email confirmed successfully! You can now log in.';
            successMessageElement.style.color = 'green';
        }

        console.log('Email confirmation handled. URL cleaned.');

        // No need to redirect if we are already on the login page, just clean URL and maybe show message
        // If login.html was NOT the redirect page, you would redirect here:
        // window.location.href = 'login.html';
    }
}

document.addEventListener("DOMContentLoaded", function () {
    // Call the handler on page load
    handleEmailConfirmation();

    const signupLink = document.getElementById("signup-link");
    const loginForm = document.querySelector("form");
    
    signupLink.addEventListener("click", function (e) {
        e.preventDefault();
        window.location.href = "registration.html";
    });

    loginForm.addEventListener("submit", async function(e) {
        e.preventDefault();
        
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        
        try {
            // Use supabase.auth.signInWithPassword directly as signIn
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            
            if (error) {
                alert(error.message);
                return;
            }
            
            // Check if user is admin
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('is_admin')
                .eq('id', data.user.id)
                .single();
            
            if (profileError) {
                console.error('Error fetching user profile for admin check:', profileError);
                // Redirect to user dashboard by default if profile fetch fails
                window.location.href = "userdashboard.html";
                return;
            }

            if (profile?.is_admin) {
                window.location.href = "admindashboard.html";
            } else {
                window.location.href = "userdashboard.html";
            }
        } catch (error) {
            alert("An error occurred during login. Please try again.");
            console.error(error);
        }
    });
});