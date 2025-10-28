document.getElementById("registerBtn").onclick = async () => {
    const data = {
        fullName: document.getElementById("fullName").value,
        email: document.getElementById("email").value,
        password: document.getElementById("password").value,
        department: document.getElementById("department").value,
        year: parseInt(document.getElementById("year").value),
        gender: document.getElementById("gender").value,
        physicallyDisabled: document.getElementById("pd").checked ? 1 : 0
    };
    try {
        const res = await apiFetch('/api/register', 'POST', data);
        alert(res.message);
        window.location.href = 'login.html';
    } catch(e) { alert(e); }
};