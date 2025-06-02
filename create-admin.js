import { createAdminAccount } from './supabase-config.js';

document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("adminRegistrationForm");
    
    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        const repassword = document.getElementById("repassword").value;
        const name = document.getElementById("name").value;
        const mobile = document.getElementById("mobile").value;

        // Validate passwords match
        if (password !== repassword) {
            alert("Passwords do not match!");
            return;
        }

        // Validate password strength
        if (password.length < 8) {
            alert("Password must be at least 8 characters long!");
            return;
        }

        try {
            const { data, error } = await createAdminAccount(email, password, {
                full_name: name,
                mobile: mobile,
                dob: new Date().toISOString().split('T')[0] // Set current date as DOB for admin
            });

            if (error) {
                alert("Error creating admin account: " + error.message);
                return;
            }

            alert("Admin account created successfully!");
            window.location.href = "login.html";
        } catch (error) {
            alert("Error creating admin account: " + error.message);
        }
    });
}); 