document.getElementById("loginBtn").onclick = async () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    try {
        const data = await apiFetch('/api/login', 'POST', {email, password});
        alert('Login successful!');
        localStorage.setItem('userEmail', data.email);
        localStorage.setItem('studentID', data.studentID);
        window.location.href = 'dashboard.html';
    } catch(e) { alert(e); }
};