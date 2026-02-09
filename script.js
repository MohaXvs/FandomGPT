/*************************************************
 MOCK DATABASE & USERS
**************************************************/
const MODERATORS = ["mod@fandom.com"];
let currentUser = null;
let currentChatId = null;

/*************************************************
 LOGIN LOGIC
**************************************************/
document.getElementById("loginBtn").onclick = () => {
  const email = emailInput.value;
  if (!email) return alert("Enter email");

  currentUser = {
    email,
    id: "user_" + Date.now(),
    isMod: MODERATORS.includes(email),
    chats: []
  };

  localStorage.setItem("currentUser", JSON.stringify(currentUser));
  userEmail.textContent = email;
  loginScreen.classList.add("hidden");
  app.classList.remove("hidden");

  if (currentUser.isMod) {
    openModeratorBtn.classList.remove("hidden");
  }

  loadChats();
};

/*************************************************
 CHAT MANAGEMENT
**************************************************/
newChatBtn.onclick = () => {
  const chatId = "chat_" + Date.now();
  currentUser.chats.push({ id: chatId, messages: [] });
  currentChatId = chatId;
  saveUser();
  loadChats();
};

function loadChats() {
  chatList.innerHTML = "";
  currentUser.chats.forEach(chat => {
    const li = document.createElement("li");
    li.textContent = chat.messages[0]?.text || "New Chat";
    li.onclick = () => openChat(chat.id);
    chatList.appendChild(li);
  });
}

function openChat(id) {
  currentChatId = id;
  chatWindow.innerHTML = "";
  const chat = currentUser.chats.find(c => c.id === id);
  chat.messages.forEach(m => addMessage(m.text, m.sender));
}

/*************************************************
 MESSAGE HANDLING
**************************************************/
sendBtn.onclick = sendMessage;

function sendMessage() {
  const text = messageInput.value;
  if (!text) return;

  addMessage(text, "user");
  getBotResponse(text);
  messageInput.value = "";
}

function addMessage(text, sender) {
  const div = document.createElement("div");
  div.className = `message ${sender}`;
  div.textContent = text;
  chatWindow.appendChild(div);

  const chat = currentUser.chats.find(c => c.id === currentChatId);
  chat.messages.push({ text, sender });
  saveUser();
}

/*************************************************
 FANDOM WIKI MOCK API
**************************************************/
function getBotResponse(query) {
  // Placeholder fandom logic
  const response =
    "According to the fandom wiki, \"" +
    query +
    "\" relates to a known concept. (Mock summary from wiki)";

  setTimeout(() => addMessage(response, "bot"), 500);
}

/*************************************************
 SPEECH TO TEXT
**************************************************/
if ("webkitSpeechRecognition" in window) {
  const recognition = new webkitSpeechRecognition();
  recognition.onresult = e => {
    messageInput.value = e.results[0][0].transcript;
  };
  micBtn.onclick = () => recognition.start();
}

/*************************************************
 MODERATOR PANEL
**************************************************/
openModeratorBtn.onclick = () => {
  moderatorPanel.classList.remove("hidden");
  modTable.innerHTML = "";

  const users = JSON.parse(localStorage.getItem("users")) || [];
  users.forEach(u => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${u.email}</td>
      <td>${u.chats.length}</td>
      <td>${new Date().toLocaleTimeString()}</td>
    `;
    modTable.appendChild(row);
  });
};

closeModPanel.onclick = () =>
  moderatorPanel.classList.add("hidden");

/*************************************************
 STORAGE
**************************************************/
function saveUser() {
  localStorage.setItem("currentUser", JSON.stringify(currentUser));
  const users = JSON.parse(localStorage.getItem("users")) || [];
  const idx = users.findIndex(u => u.email === currentUser.email);
  if (idx >= 0) users[idx] = currentUser;
  else users.push(currentUser);
  localStorage.setItem("users", JSON.stringify(users));
}
