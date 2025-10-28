// ---- DOM ELEMENTS ----
const authSection = document.getElementById('auth-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginTab = document.getElementById('login-tab');
const registerTab = document.getElementById('register-tab');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const logoutBtn = document.getElementById('logoutBtn');
const welcomeMsg = document.getElementById('welcome-msg');
const statusDisplay = document.getElementById('status-display');
const roomGrid = document.getElementById('room-grid');

// ---- AI CHAT DOM ELEMENTS ----
const openChatBtn = document.getElementById('open-chat-button');
const chatContainer = document.getElementById('chat-container');
const closeChatBtn = document.getElementById('close-chat');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendChatBtn = document.getElementById('send-chat');

// ---- TAB SWITCHING LOGIC ----
loginTab.addEventListener('click', () => {
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    loginTab.classList.add('border-blue-500', 'text-blue-600');
    registerTab.classList.remove('border-blue-500', 'text-blue-600');
});

registerTab.addEventListener('click', () => {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    loginTab.classList.remove('border-blue-500', 'text-blue-600');
    registerTab.classList.add('border-blue-500', 'text-blue-600');
});

// ---- CORE FUNCTIONS ----
const checkLoginState = async () => {
    const userEmail = localStorage.getItem('userEmail');
    if (userEmail) {
        try {
            await loadDashboardData(userEmail);
            authSection.classList.add('hidden');
            dashboardSection.classList.remove('hidden');
            openChatBtn.classList.remove('hidden');
            welcomeMsg.textContent = `Welcome, ${userEmail}!`;
        } catch (error) {
            console.error("Auto-login failed:", error.message);
            handleLogout();
        }
    } else {
        authSection.classList.remove('hidden');
        dashboardSection.classList.add('hidden');
        openChatBtn.classList.add('hidden');
    }
};

const loadDashboardData = async (email) => {
    const [statusData, roomsData] = await Promise.all([
        apiFetch(`/api/status?email=${email}`),
        apiFetch('/api/admin/rooms-status')
    ]);
    renderStatus(statusData);
    renderRoomGrid(roomsData, roomGrid);
};

const renderStatus = (data) => {
    let content = '';
    if (data.Status === 'Allocated') {
        content = `
            <h3 class="text-xl font-semibold text-green-700 mb-2">Status: Allocated</h3>
            <p><strong>Block:</strong> ${data.BlockName}</p>
            <p><strong>Room:</strong> ${data.RoomNumber}</p>
            <p><strong>Bed:</strong> ${data.BedLabel}</p>
        `;
    } else if (data.Status === 'Pending') {
        content = `<h3 class="text-xl font-semibold text-yellow-700">Status: Pending</h3><p>Your application is under review. Allocation will be done by the admin.</p>`;
    } else {
        content = `
            <h3 class="text-xl font-semibold text-gray-700 mb-2">Apply for a Room</h3>
            <p class="mb-4">You have not applied for a hostel room yet.</p>
            <select id="roomType" class="w-full md:w-1/2 p-2 border rounded">
                <option>Single</option><option>Double</option><option>Triple</option>
            </select>
            <button id="applyBtn" class="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Submit Application</button>
        `;
    }
    statusDisplay.innerHTML = content;
    const applyBtn = document.getElementById('applyBtn');
    if (applyBtn) {
        applyBtn.addEventListener('click', handleApply);
    }
};

// ---- EVENT HANDLERS ----
const handleLogin = async () => {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    try {
        const data = await apiFetch('/api/login', 'POST', { email, password });
        localStorage.setItem('userEmail', data.email);
        localStorage.setItem('studentID', data.studentID);
        await checkLoginState();
    } catch (e) {
        alert(e.message);
    }
};

const handleRegister = async () => {
    const data = {
        fullName: document.getElementById('register-fullName').value,
        email: document.getElementById('register-email').value,
        password: document.getElementById('register-password').value,
        department: document.getElementById('register-department').value,
        year: parseInt(document.getElementById('register-year').value),
        gender: document.getElementById('register-gender').value,
        physicallyDisabled: document.getElementById('register-pd').checked ? 1 : 0
    };
    try {
        const res = await apiFetch('/api/register', 'POST', data);
        alert(res.message);
        loginTab.click();
        document.getElementById('login-email').value = data.email;
    } catch (e) {
        alert(e.message);
    }
};

const handleApply = async () => {
    const studentID = localStorage.getItem('studentID');
    const roomType = document.getElementById('roomType').value;
    try {
        const res = await apiFetch('/api/apply', 'POST', { studentID, roomType });
        alert(res.message);
        await loadDashboardData(localStorage.getItem('userEmail'));
    } catch(e) {
        alert(e.message);
    }
};

const handleLogout = () => {
    localStorage.removeItem('userEmail');
    localStorage.removeItem('studentID');
    checkLoginState();
};

// ---- AI CHAT FUNCTIONS ----
const addMessageToChat = (message, sender) => {
    const messageDiv = document.createElement('div');
    messageDiv.className = `p-2 rounded-lg mb-2 max-w-xs text-sm ${
        sender === 'user' ? 'bg-blue-100 self-end' : 'bg-gray-200 self-start'
    }`;
    // Basic markdown for lists
    message = message.replace(/\* /g, '• ');
    messageDiv.innerText = message;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
};

const handleSendMessage = async () => {
    const query = chatInput.value.trim();
    if (!query) return;

    addMessageToChat(query, 'user');
    chatInput.value = '';
    
    const thinkingDiv = document.createElement('div');
    thinkingDiv.className = 'p-2 rounded-lg mb-2 max-w-xs bg-gray-200 self-start animate-pulse';
    thinkingDiv.innerText = '...';
    chatMessages.appendChild(thinkingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    try {
        const res = await apiFetch('/api/ai-chat', 'POST', { query });
        thinkingDiv.remove();
        addMessageToChat(res.reply, 'ai');
    } catch (e) {
        thinkingDiv.remove();
        addMessageToChat(`Error: ${e.message}`, 'ai');
    }
};

// ---- INITIALIZATION ----
loginBtn.addEventListener('click', handleLogin);
registerBtn.addEventListener('click', handleRegister);
logoutBtn.addEventListener('click', handleLogout);
window.addEventListener('DOMContentLoaded', checkLoginState);

openChatBtn.addEventListener('click', () => chatContainer.classList.remove('hidden'));
closeChatBtn.addEventListener('click', () => chatContainer.classList.add('hidden'));
sendChatBtn.addEventListener('click', handleSendMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSendMessage();
});

openChatBtn.addEventListener('click', async () => {
    if (chatMessages.children.length === 0) {
        const dummyQuery = { query: 'Introduce yourself' };
        const thinkingDiv = document.createElement('div');
        thinkingDiv.className = 'p-2 rounded-lg mb-2 max-w-xs bg-gray-200 self-start animate-pulse';
        thinkingDiv.innerText = '...';
        chatMessages.appendChild(thinkingDiv);

        try {
            const res = await apiFetch('/api/ai-chat', 'POST', dummyQuery);
            thinkingDiv.remove();
            addMessageToChat(res.reply, 'ai');
        } catch(e) {
            thinkingDiv.remove();
            addMessageToChat(`Error: ${e.message}`, 'ai');
        }
    }
}, { once: true });

