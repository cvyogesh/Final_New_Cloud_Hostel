async function apiFetch(url, method = 'GET', data = null) {
    const options = { method, headers: { 'Content-Type': 'application/json' } };
    if (data) options.body = JSON.stringify(data);
    
    // Use a try-catch block for network errors
    try {
        // const res = await fetch(`http://127.0.0.1:8000${url}`, options);
        const res = await fetch(`http://localhost:31202${url}`, options);
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || `API Error: ${res.statusText}`);
        }
        // Handle cases where the response body might be empty
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await res.json();
        }
        return {}; // Return an empty object for non-JSON or empty responses
    } catch (error) {
        console.error('Fetch Error:', error);
        throw new Error('Could not connect to the server. Please check your connection.');
    }
}

/**
 * Renders the room and bed status grid into a specified container.
 * @param {Array} roomsData - The array of room/bed objects from the API.
 * @param {HTMLElement} container - The container element to render the grid into.
 */
function renderRoomGrid(roomsData, container) {
    container.innerHTML = ''; // Clear previous content

    roomsData.forEach(bed => {
        let bgColor, textColor, occupantInfo;

        if (bed.RoomType === 'Emergency') {
            bgColor = 'bg-gray-700';
            textColor = 'text-white';
            occupantInfo = 'EMERGENCY USE ONLY';
        } else if (bed.IsOccupied) {
            bgColor = 'bg-red-200';
            textColor = 'text-red-800';
            occupantInfo = bed.Occupant ? `Occupant: ${bed.Occupant}` : 'Allocated';
        } else {
            bgColor = 'bg-green-200';
            textColor = 'text-green-800';
            occupantInfo = 'Status: Vacant';
        }

        const bedDiv = document.createElement('div');
        bedDiv.className = `p-3 rounded-lg ${bgColor} ${textColor} text-sm shadow`;
        bedDiv.innerHTML = `
            <div class="font-bold">${bed.BlockName}</div>
            <div>Room: ${bed.RoomNumber} | Bed: ${bed.BedLabel}</div>
            <div class="text-xs mt-1">${occupantInfo}</div>
        `;
        container.appendChild(bedDiv);
    });
}
