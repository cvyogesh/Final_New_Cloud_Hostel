const authSection = document.getElementById('auth-section');
const dashboardSection = document.getElementById('dashboard-section');
const authBtn = document.getElementById('authBtn');
const adminKeyInput = document.getElementById('admin-key');
const roomGrid = document.getElementById('room-grid');
const allocateBtn = document.getElementById('allocateBtn');
const logoutBtn = document.getElementById('logoutBtn');

const checkAuthState = async () => {
    const adminKey = sessionStorage.getItem('adminKey');
    if (adminKey) {
        // Validate key silently on page load
        try {
            const roomsData = await apiFetch(`/api/admin/rooms-status?key=${adminKey}`);
            showDashboard(roomsData);
        } catch (e) {
            sessionStorage.removeItem('adminKey');
            showAuth();
        }
    } else {
        showAuth();
    }
};

const showDashboard = (roomsData) => {
    authSection.classList.add('hidden');
    dashboardSection.classList.remove('hidden');
    renderRoomGrid(roomsData, roomGrid);
};

const showAuth = () => {
    authSection.classList.remove('hidden');
    dashboardSection.classList.add('hidden');
};

const handleAuth = async () => {
    const key = adminKeyInput.value;
    if (!key) return alert('Please enter an admin key.');
    try {
        const roomsData = await apiFetch(`/api/admin/rooms-status?key=${key}`);
        sessionStorage.setItem('adminKey', key); // Use sessionStorage to remember key for the session
        showDashboard(roomsData);
    } catch (e) {
        alert('Invalid Admin Key.');
    }
};

const handleAllocation = async () => {
    const key = sessionStorage.getItem('adminKey');
    if (!confirm('Are you sure you want to run the allocation process? This cannot be undone.')) return;
    
    try {
        const res = await apiFetch(`/api/admin/auto-allocate?key=${key}`, 'POST');
        alert(res.message);
        // Refresh the room grid after allocation
        const roomsData = await apiFetch(`/api/admin/rooms-status?key=${key}`);
        renderRoomGrid(roomsData, roomGrid);
    } catch (e) {
        alert(e.message);
    }
};

const handleLogout = () => {
    sessionStorage.removeItem('adminKey');
    showAuth();
};

authBtn.addEventListener('click', handleAuth);
allocateBtn.addEventListener('click', handleAllocation);
logoutBtn.addEventListener('click', handleLogout);
window.addEventListener('DOMContentLoaded', checkAuthState);
