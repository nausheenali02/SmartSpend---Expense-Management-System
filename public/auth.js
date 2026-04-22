// Remove the old localhost line entirely
const API_BASE_URL = window.location.origin; 

let isLoginMode = true;

function toggleForm() {
    isLoginMode = !isLoginMode;
    document.getElementById("formTitle").innerText = isLoginMode ? "Login" : "Sign Up";
    document.querySelector(".toggle").innerText = isLoginMode ? "Don't have an account? Sign up" : "Already have an account? Login";
    document.getElementById("username").style.display = isLoginMode ? "none" : "block";
}

async function handleAuth() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const username = document.getElementById("username").value;

    const endpoint = isLoginMode ? "/api/auth/login" : "/api/auth/signup";
    const body = isLoginMode ? { email, password } : { username, email, password };

    try {
        // We combine the base URL with the specific endpoint
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        const data = await response.json();
        if (response.ok) {
            if (isLoginMode) {
                localStorage.setItem("userId", data.userId);
                localStorage.setItem("username", data.username);
                window.location.href = "dashboard.html";
            } else {
                alert("Account created! Please login.");
                toggleForm();
            }
        } else {
            alert(data.error || "Authentication failed");
        }
    } catch (error) {
        console.error("Connection Error:", error);
        alert("Could not connect to server. Ensure it is live.");
    }
}
