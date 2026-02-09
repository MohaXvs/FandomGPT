/*************************************************
 CONFIG
**************************************************/
const MODERATORS = ["mohammadcavusoglu@gmail.com"];

/*************************************************
 GLOBAL STATE
**************************************************/
let currentUser = null;
let currentChatId = null;

/*************************************************
 UTIL STORAGE HELPERS
**************************************************/
function getUsers() {
  return JSON.parse(localStorage.getItem("users")) || [];
}

function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

function getBannedUsers() {
  return JSON.parse(localStorage.getItem("bannedUsers")) || [];
}

function saveBannedUsers(list) {
  localStorage.setItem("bannedUsers", JSON.stringify(list));
}

function getTempKeys() {
  return JSON.parse(localStorage.getItem("tempKeys")) || [];
}

function saveTempKeys(keys) {
  localStorage.setItem("tempKeys", JSON.stringify(keys));
}

/*************************************************
 LOGIN LOGIC
**************************************************/
loginBtn.onclick = () => {
  const email = emailInput.value.trim();
  if (!email) return alert("Enter email");

  // Ban check
  if (getBannedUsers().includes(email)) {
    return alert("You are banned.");
  }

  // Temp key check (optional)
  const key = passwordInput.value.trim();
  if (key) {
    const keys = getTempKeys();
    const validKey = keys.find(k => k.key === key && !k.used);
    if (!validKey) return alert("Invalid key");
    validKey.used = true;
    saveTempKeys(keys);
  }

  let users = getUsers();
  let user = users.find(u => u.email === email);

  if (!user) {
    user = {
      email,
      chats: [],
      lastActive: Date.now(),
      isOnline: true
    };
    users.push(user);
  }

  user.isOnline = true;
  user.lastActive = Date.now();
  saveUsers(users);

  currentUser = user;
  localStorage.setItem("currentUser", email);

  userEmail.textContent = email;
  loginScreen.classList.add("hidden");
  app.classList.remove("hidden");

  if (MODERATORS.includes(email)) {
    openModeratorBtn.classList.remove("hidden");
  }

  loadChats();
};

/*************************************************
 LOGOUT
**************************************************/
logoutBtn.onclick = () => {
  if (!currentUser) return;
  let users = getUsers();
  const u = users.find(u => u.email === currentUser.email);
  if (u) u.isOnline = false;
  saveUsers(users);
  localStorage.removeItem("currentUser");
  location.reload();
};

/*************************************************
 CHAT MANAGEMENT
**************************************************/
newChatBtn.onclick = () => {
  const chatId = "chat_" + Date.now();
  currentUser.chats.push({ id: chatId, messages: [] });
  currentChatId = chatId;
  updateUser();
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
  chat.messages.forEach(m => addMessage(m.text, m.sender, false));
}

/*************************************************
 MESSAGE HANDLING
**************************************************/
sendBtn.onclick = sendMessage;

function sendMessage() {
  const text = messageInput.value.trim();
  if (!text || !currentChatId) return;

  addMessage(text, "user", true);
  messageInput.value = "";
  getBotResponse(text);
}

function addMessage(text, sender, save) {
  const div = document.createElement("div");
  div.className = `message ${sender}`;
  div.textContent = text;
  chatWindow.appendChild(div);

  if (save) {
    const chat = currentUser.chats.find(c => c.id === currentChatId);
    chat.messages.push({ text, sender });
    updateUser();
  }
}

/*************************************************
 MOCK FANDOM BOT
**************************************************/
function getBotResponse(query) {
  setTimeout(() => {
    addMessage(
      `According to the fandom wiki, "${query}" is a documented topic. (Mock response)`,
      "bot",
      true
    );
  }, 600);
}

/*************************************************
 SPEECH TO TEXT
**************************************************/
if ("webkitSpeechRecognition" in window) {
  const rec = new webkitSpeechRecognition();
  rec.onresult = e => {
    messageInput.value = e.results[0][0].transcript;
  };
  micBtn.onclick = () => rec.start();
}

/*************************************************
 USER SAVE
**************************************************/
function updateUser() {
  let users = getUsers();
  const i = users.findIndex(u => u.email === currentUser.email);
  currentUser.lastActive = Date.now();
  users[i] = currentUser;
  saveUsers(users);
}

/*************************************************
 MODERATOR PANEL
**************************************************/
openModeratorBtn.onclick = () => {
  moderatorPanel.classList.remove("hidden");
  renderModeratorTable();
};

closeModPanel.onclick = () => {
  moderatorPanel.classList.add("hidden");
};

function renderModeratorTable() {
  modTable.innerHTML = "";
  getUsers().forEach(u => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${u.email}</td>
      <td>${u.chats.length}</td>
      <td>${u.isOnline ? "Online" : "Offline"}</td>
      <td>
        <button onclick="kickUser('${u.email}')">Kick</button>
        <button onclick="banUser('${u.email}')">Ban</button>
      </td>
    `;
    modTable.appendChild(tr);
  });
}

/*************************************************
 MOD ACTIONS
**************************************************/
function kickUser(email) {
  let users = getUsers();
  const u = users.find(x => x.email === email);
  if (u) u.isOnline = false;
  saveUsers(users);
  alert(email + " kicked");
  renderModeratorTable();
}

function banUser(email) {
  let banned = getBannedUsers();
  if (!banned.includes(email)) banned.push(email);
  saveBannedUsers(banned);
  kickUser(email);
  alert(email + " banned");
}

/*************************************************
 TEMP KEY GENERATOR
**************************************************/
function generateTempKey() {
  const key = Math.random().toString(36).substring(2, 10);
  const keys = getTempKeys();
  keys.push({ key, used: false, created: Date.now() });
  saveTempKeys(keys);
  alert("Temp key: " + key);
}
