window.onload = async () => {
    const userEmail = localStorage.getItem('userEmail');
    if (!userEmail) {
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('welcome-msg').textContent = `Welcome, ${userEmail}!`;
    
    try {
        const data = await apiFetch(`/api/status?email=${userEmail}`);
        
        if (data.Status === 'Pending' || data.Status === 'Allocated') {
            document.getElementById('status-display').style.display = 'block';
            document.getElementById('status-text').textContent = data.Status;
            if (data.Status === 'Allocated') {
                document.getElementById('allocation-details').innerHTML = `
                    <p>Block: <strong>${data.BlockName}</strong></p>
                    <p>Room Number: <strong>${data.RoomNumber}</strong></p>
                    <p>Bed: <strong>${data.BedLabel}</strong></p>
                `;
            }
        } else {
            document.getElementById('apply-form').style.display = 'block';
        }
    } catch (e) {
        alert(e);
    }
};

document.getElementById('applyBtn').onclick = async () => {
    const studentID = localStorage.getItem('studentID');
    const roomType = document.getElementById('roomType').value;
    try {
        const res = await apiFetch('/api/apply', 'POST', { studentID, roomType });
        alert(res.message);
        window.location.reload();
    } catch(e) {
        alert(e);
    }
};