async function postData(url = "", data = {}) {
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        showError(error.message);
        throw error;
    }
}

async function fetchChats(searchQuery = "") {
    try {
        const res = await fetch(`/api/chats?search=${encodeURIComponent(searchQuery)}`);
        if (!res.ok) throw new Error("Failed to fetch chats");
        const chats = await res.json();
        const chatContainer = document.querySelector(".chats");
        chatContainer.innerHTML = "";
        chats.forEach((chat, index) => {
            const date = chat.timestamp ? new Date(chat.timestamp).toLocaleString() : 'N/A';
            let div = document.createElement("div");
            div.className = "chat flex justify-between items-center space-x-2 w-full p-4 rounded-lg bg-gray-700 bg-opacity-50 cursor-pointer hover:bg-gray-600 hover:shadow-lg transition transform hover:scale-102 duration-200 animate-slide-in";
            div.style.animationDelay = `${index * 0.1}s`;
            div.dataset.id = chat._id;
            div.innerHTML = `
                <div class="flex items-center space-x-3">
                    <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" class="h-5 w-5">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 1 1 2 2z"></path>
                    </svg>
                    <span class="truncate">${chat.question}</span>
                </div>
                <div class="flex items-center space-x-2">
                    <div class="text-xs text-gray-400">${date}</div>
                    <button class="delete-chat text-red-400 hover:text-red-600 transition duration-200" data-id="${chat._id}">
                        <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" class="h-5 w-5">
                            <path d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
            `;
            div.addEventListener("click", (e) => {
                if (e.target.closest(".delete-chat")) return;
                document.getElementById("questionInput").value = chat.question;
                document.getElementById("questionInput2").value = chat.question;
                document.getElementById("question1").innerHTML = chat.question;
                document.getElementById("question2").innerHTML = chat.question;
                document.getElementById("solution").innerHTML = chat.answer;
                document.querySelector(".right2").style.display = "block";
                document.querySelector(".right1").style.display = "none";
                document.querySelector(".left").classList.remove("open");
            });
            chatContainer.appendChild(div);
        });
    } catch (error) {
        showError("Error fetching chats: " + error.message);
    }
}

async function deleteChat(chatId) {
    try {
        const res = await fetch(`/api/chats/${chatId}`, { method: "DELETE" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to delete chat");
        await fetchChats(document.getElementById("searchInput").value);
    } catch (error) {
        showError("Error deleting chat: " + error.message);
    }
}

async function clearChats() {
    if (!confirm("Are you sure you want to clear all chat history?")) return;
    try {
        const res = await fetch("/api/chats/clear", { method: "DELETE" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to clear chats");
        await fetchChats();
    } catch (error) {
        showError("Error clearing chats: " + error.message);
    }
}

function showError(message) {
    const errorModal = document.getElementById("errorModal");
    const errorMessage = document.getElementById("errorMessage");
    errorMessage.innerHTML = message;
    errorModal.classList.remove("hidden");
}

async function sendQuestion() {
    const inputBox = document.getElementById("questionInput").value.trim() ? document.getElementById("questionInput") : document.getElementById("questionInput2");
    const modelSelect = inputBox.id === "questionInput" ? document.getElementById("modelSelect") : document.getElementById("modelSelect2");
    const questionInput = inputBox.value.trim();
    const selectedModel = modelSelect.value;
    if (!questionInput) return;

    inputBox.value = "";
    document.getElementById("questionInput").value = "";
    document.getElementById("questionInput2").value = "";
    document.querySelector(".right2").style.display = "block";
    document.querySelector(".right1").style.display = "none";
    document.querySelector(".left").classList.remove("open");
    document.getElementById("question1").innerHTML = questionInput;
    document.getElementById("question2").innerHTML = questionInput;
    document.getElementById("solution").innerHTML = '<div class="loading-spinner mx-auto"></div>';

    try {
        const result = await postData("/api", { question: questionInput, model: selectedModel });
        document.getElementById("solution").innerHTML = result.answer;
        await fetchChats(document.getElementById("searchInput").value);
        document.getElementById("questionInput2").focus();
    } catch (error) {
        document.getElementById("solution").innerHTML = "Error loading response.";
    }
}

document.getElementById("sendButton").addEventListener("click", sendQuestion);
document.getElementById("sendButton2").addEventListener("click", sendQuestion);

document.getElementById("newChatBtn").addEventListener("click", () => {
    document.querySelector(".right2").style.display = "none";
    document.querySelector(".right1").style.display = "block";
    document.getElementById("questionInput").value = "";
    document.getElementById("questionInput2").value = "";
    document.querySelector(".left").classList.remove("open");
    document.getElementById("questionInput").focus();
});

document.getElementById("clearChatsBtn").addEventListener("click", clearChats);

document.getElementById("searchInput").addEventListener("input", async (e) => {
    await fetchChats(e.target.value);
});

document.getElementById("closeError").addEventListener("click", () => {
    document.getElementById("errorModal").classList.add("hidden");
});

document.getElementById("toggleSidebar").addEventListener("click", () => {
    document.querySelector(".left").classList.toggle("open");
});

// Auto-focus input on page load
document.getElementById("questionInput").focus();

// Enter key support for inputs
document.getElementById("questionInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendQuestion();
});
document.getElementById("questionInput2").addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendQuestion();
});

fetchChats();

