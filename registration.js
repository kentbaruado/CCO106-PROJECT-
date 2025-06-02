import { signUp, createUserProfile } from './supabase-config.js';

document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("registrationForm");
    const dobInput = document.getElementById("dob");
    const errorMsg = document.getElementById("dob-error");

    const password = document.getElementById("password");
    const repassword = document.getElementById("repassword");
    const passwordError = document.getElementById("password-error");

    const togglePassword = document.getElementById("toggle-password");
    const emailInput = document.getElementById("email"); // Get the new email input

    
    togglePassword.addEventListener("click", function () {
        const type = repassword.getAttribute("type") === "password" ? "text" : "password";
        repassword.setAttribute("type", type);

   
        togglePassword.textContent = type === "password" ? "👁️" : "🙈";
    });

   
    form.addEventListener("submit", async function (e) {
        e.preventDefault(); // Prevent default form submission

        let valid = true;

        // Existing date of birth validation
        const dob = new Date(dobInput.value);
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
            age--;
        }

        if (age < 18) {
            errorMsg.textContent = "Age not suitable. You must be at least 18 years old.";
            dobInput.style.border = "2px solid red";
            valid = false;
        } else {
            errorMsg.textContent = "";
            dobInput.style.border = "";
        }

        // Validate password match
        if (password.value !== repassword.value) {
            passwordError.textContent = "Passwords do not match.";
            repassword.style.border = "2px solid red";
            valid = false;
        } else {
            passwordError.textContent = "";
            repassword.style.border = "";
        }

        // Validate password strength
        if (password.value.length < 6) {
            passwordError.textContent = "Password must be at least 6 characters long.";
            password.style.border = "2px solid red";
            valid = false;
        } else {
            passwordError.textContent = "";
            password.style.border = "";
        }

        if (!valid) {
            return; // Stop if frontend validation fails
        }

        // Supabase Registration
        const name = document.getElementById("name").value;
        const mobile = document.getElementById("mobile").value;
        const email = emailInput.value; // Use the value from the new email input

        console.log("Attempting registration with:", { email, name, mobile });

        const { data: authData, error: authError } = await signUp(email, password.value);

        if (authError) {
            console.error("Registration error:", authError);
            document.getElementById("success-message").textContent = "Registration failed: " + authError.message;
            document.getElementById("success-message").style.color = "red";
            return;
        }

        console.log("Auth successful, creating profile...");

        // Add a small delay to ensure auth.uid() is fully available
        // await new Promise(resolve => setTimeout(resolve, 1000)); // Added delay

        // Create user profile after successful registration
        // const userId = authData.user.id;
        // console.log("User ID obtained after authentication:", userId);
        // const { data: profileData, error: profileError } = await createUserProfile(userId, {
        //     full_name: name,
        //     dob: dobInput.value,
        //     mobile: mobile
        // });

        // if (profileError) {
        //     console.error("Profile creation error:", profileError);
        //     document.getElementById("success-message").textContent = "Profile creation failed: " + profileError.message;
        //     document.getElementById("success-message").style.color = "red";
        //     return;
        // }

        console.log("Registration and profile creation successful!");
        document.getElementById("success-message").textContent = "Registration successful! You can now log in.";
        document.getElementById("success-message").style.color = "green";
        setTimeout(() => {
            window.location.href = "login.html"; // Redirect to login page after a short delay
        }, 3000); // Delay for 3 seconds (adjust as needed)
    });
});