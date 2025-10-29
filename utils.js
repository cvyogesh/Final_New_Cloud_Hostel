async function apiFetch(url, method = 'GET', data = null) {
    // Use relative paths - SWA will proxy requests starting with /api/
    // Ensure the URL always starts with /api/ for backend calls
    const fullUrl = url.startsWith('/api/') ? url : `/api${url.startsWith('/') ? '' : '/'}${url}`;
    const options = { method, headers: { 'Content-Type': 'application/json' } };
    if (data) options.body = JSON.stringify(data);

    try {
        // No need for the base URL like http://localhost:port anymore
        const res = await fetch(fullUrl, options);

        if (!res.ok) {
            // Try to parse error detail from backend
            let errorDetail = 'API Request Failed';
            try {
                // Use .text() first to avoid errors if the body isn't valid JSON
                const errorText = await res.text();
                if (errorText) {
                    const err = JSON.parse(errorText);
                    errorDetail = err.detail || `HTTP Error ${res.status}`;
                } else {
                     errorDetail = res.statusText || `HTTP Error ${res.status}`;
                }
            } catch (e) {
                // If parsing JSON fails or body is empty, use the status text
                errorDetail = res.statusText || `HTTP Error ${res.status}`;
            }
            throw new Error(errorDetail);
        }

        // Handle cases where the response might be empty (e.g., 204 No Content)
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            // Handle potentially empty JSON response body
             const text = await res.text();
             return text ? JSON.parse(text) : {}; // Return empty object if body is empty
        } else {
            return {}; // Return empty object for non-JSON or empty responses
        }
    } catch (error) {
        console.error('API Fetch Error:', error);
        // Rethrow the error so the calling function can handle it (e.g., show an alert)
        throw error;
    }
}

// --- Shared function to render the room grid ---
function renderRoomGrid(roomsData, gridElement) {
    if (!gridElement) return;
    gridElement.innerHTML = ''; // Clear previous grid

    // Group beds by room
    const rooms = {};
    roomsData.forEach(bed => {
        // Use a consistent Room ID format
        const roomId = `${bed.BlockName}-${bed.RoomNumber}`;
        if (!rooms[roomId]) {
            rooms[roomId] = {
                block: bed.BlockName,
                room: bed.RoomNumber,
                floor: bed.Floor !== null ? bed.Floor : 'N/A', // Handle potential null floor
                type: bed.RoomType || 'N/A', // Handle potential null type
                beds: []
            };
        }
        rooms[roomId].beds.push({
            label: bed.BedLabel || 'N/A', // Handle potential null label
            occupied: bed.IsOccupied,
            occupant: bed.Occupant
        });
    });

    // Sort rooms for consistent display: Block -> Floor -> Room Number
    const sortedRoomKeys = Object.keys(rooms).sort((a, b) => {
        const roomA = rooms[a];
        const roomB = rooms[b];
        // Sort by Block Name first
        if (roomA.block !== roomB.block) {
            return (roomA.block || '').localeCompare(roomB.block || '');
        }
        // Then sort by Floor Number (treat N/A as lowest)
        const floorA = typeof roomA.floor === 'number' ? roomA.floor : -1;
        const floorB = typeof roomB.floor === 'number' ? roomB.floor : -1;
        if (floorA !== floorB) {
            return floorA - floorB;
        }
        // Finally, sort by Room Number
        return (roomA.room || '').localeCompare(roomB.room || '');
    });

    // Render each room
    sortedRoomKeys.forEach(roomId => {
        const room = rooms[roomId];
        // Skip rendering specific room types if needed, e.g., Emergency rooms
        if (room.type === 'Emergency') {
            return;
        }

        const roomDiv = document.createElement('div');
        roomDiv.className = 'border border-gray-300 rounded-lg p-3 shadow-sm bg-white text-sm'; // Ensure consistent text size

        // Sort beds within the room (e.g., A, B, C)
        room.beds.sort((bedA, bedB) => (bedA.label || '').localeCompare(bedB.label || ''));

        let bedsHtml = room.beds.map(bed => `
            <div class="mt-1 p-1 rounded ${bed.occupied ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} text-xs">
                Bed ${bed.label}: ${bed.occupied ? (bed.occupant || 'Allocated') : 'Vacant'}
            </div>
        `).join('');

        roomDiv.innerHTML = `
            <div class="font-semibold">${room.block} - ${room.room}</div>
            <div class="text-xs text-gray-600 mb-1">Floor ${room.floor} - ${room.type}</div>
            ${bedsHtml}
        `;
        gridElement.appendChild(roomDiv);
    });
}

