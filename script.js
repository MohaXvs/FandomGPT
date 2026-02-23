/*************************************************
 CHAT STATE
*************************************************/

let chats = JSON.parse(localStorage.getItem("chats")) || [];
let currentChatId = null;
let currentFandom = "terraria";

/*************************************************
 DOM REFERENCES
*************************************************/

const chatList = document.getElementById("chatList");
const chatWindow = document.getElementById("chatWindow");
const messageInput = document.getElementById("messageInput");
const fandomSelect = document.getElementById("fandomSelect");

/*************************************************
 FANDOM SWITCHING
*************************************************/

fandomSelect.addEventListener("change", () => {
  currentFandom = fandomSelect.value;
});

/*************************************************
 NEW CHAT
*************************************************/

document.getElementById("newChatBtn").onclick = () => {
  const id = "chat_" + Date.now();
  chats.push({ id, messages: [] });
  currentChatId = id;
  saveChats();
  renderChats();
  openChat(id);
};

/*************************************************
 SAVE CHATS
*************************************************/

function saveChats() {
  localStorage.setItem("chats", JSON.stringify(chats));
}

/*************************************************
 RENDER CHAT LIST
*************************************************/

function renderChats() {
  chatList.innerHTML = "";
  chats.forEach(chat => {
    const li = document.createElement("li");
    li.textContent = chat.messages[0]?.text || "New Chat";
    li.onclick = () => openChat(chat.id);
    chatList.appendChild(li);
  });
}

/*************************************************
 OPEN CHAT
*************************************************/

function openChat(id) {
  currentChatId = id;
  chatWindow.innerHTML = "";
  const chat = chats.find(c => c.id === id);
  chat.messages.forEach(m => addMessage(m.text, m.sender, false));
}

/*************************************************
 ADD MESSAGE
*************************************************/

function addMessage(text, sender, save = true) {
  const div = document.createElement("div");
  div.className = "message " + sender;
  div.textContent = text;
  chatWindow.appendChild(div);

  if (save) {
    const chat = chats.find(c => c.id === currentChatId);
    chat.messages.push({ text, sender });
    saveChats();
  }

  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/*************************************************
 SEND MESSAGE
*************************************************/

document.getElementById("sendBtn").onclick = sendMessage;

function sendMessage() {
  const text = messageInput.value.trim();
  if (!text || !currentChatId) return;

  addMessage(text, "user");
  messageInput.value = "";
  fetchFandomData(text);
}

/*************************************************
 FANDOM API FETCH
*************************************************/

async function fetchFandomData(query) {

  addMessage("Searching wiki...", "bot");

  try {
    const searchRes = await fetch(
      `https://${currentFandom}.fandom.com/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`
    );

    const searchData = await searchRes.json();

    if (!searchData.query.search.length) {
      addMessage("No results found.", "bot");
      return;
    }

    const title = searchData.query.search[0].title;

    const pageRes = await fetch(
      `https://${currentFandom}.fandom.com/api.php?action=query&prop=extracts&exintro=true&explaintext=true&titles=${encodeURIComponent(title)}&format=json&origin=*`
    );

    const pageData = await pageRes.json();
    const page = Object.values(pageData.query.pages)[0];

    if (!page.extract) {
      addMessage("Page found but no summary available.", "bot");
      return;
    }

    const summary = page.extract.substring(0, 1000);

    addMessage(
`📖 ${title}

${summary}

🔎 Source:
https://${currentFandom}.fandom.com/wiki/${title.replace(/ /g, "_")}`,
      "bot"
    );

  } catch (err) {
    console.error(err);
    addMessage("Error contacting Fandom API.", "bot");
  }
}

/*************************************************
 SPEECH TO TEXT
*************************************************/

if ("webkitSpeechRecognition" in window) {
  const recognition = new webkitSpeechRecognition();
  recognition.onresult = e => {
    messageInput.value = e.results[0][0].transcript;
  };
  document.getElementById("micBtn").onclick = () => recognition.start();
}

/*************************************************
 INITIAL RENDER
*************************************************/

renderChats();
