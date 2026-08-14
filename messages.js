// ======================================================
// SOCIALHUB - MESSAGES (PRIVATE CHAT)
// ======================================================
// Facebook Messenger-style messaging:
//   1. Topbar 💬 opens a SMALL chat popup (bottom-right
//      corner, just like Facebook Messenger).
//   2. Sidebar "Messages" item opens the FULL page
//      messages.html (conversation list + chat).
//   3. The popup has an expand button (⤢) that opens
//      the full page too.
//   4. Real-time: new messages arrive instantly.
//   5. Unread badge on the Messages button.
//   6. "💬 Message" on user-profile.html starts a chat
//      with that user directly (in the popup).
//
// Setup:
//   - Run setup-all.sql (section 7 creates the
//     messages table + realtime publication).
//   - Add this script to index.html, profile.html,
//     user-profile.html, search.html and messages.html
//     AFTER notifications.js.
// ======================================================

var db = window.db || supabaseClient;

let socialhubMsgState = null;


function socialhubEscape(text) {

    const div =
        document.createElement("div");

    div.innerText =
        text || "";

    return div.innerHTML;
}


async function socialhubGetMe() {

    const {
        data,
        error
    } = await db.auth.getUser();

    if (error || !data.user) {

        return null;
    }

    return data.user;
}


function socialhubAvatarHTML(profile) {

    const name =
        profile?.full_name || "User";

    if (profile?.avatar_url) {

        return `
            <img
                src="${socialhubEscape(profile.avatar_url)}"
                alt="${socialhubEscape(name)}"
            >
        `;
    }

    return "👤";
}


function socialhubMsgTime(dateString) {

    const date =
        new Date(dateString);

    const now =
        new Date();

    const sameDay =
        date.toDateString() === now.toDateString();

    if (sameDay) {

        return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    return date.toLocaleDateString([], {
        month: "short",
        day: "numeric"
    });
}


// ======================================================
// 1. INJECTED STYLES
// ======================================================

(function socialhubMessagesInjectStyles() {

    const style =
        document.createElement("style");

    style.textContent = `

.top-icons button[title="Messages"] {
    position: relative;
}

/* ---------- CHAT POPUP (corner widget) ---------- */

.socialhub-chat-popup {
    position: fixed;
    right: 18px;
    bottom: 18px;
    top: auto;
    left: auto;
    width: 350px;
    max-width: calc(100vw - 24px);
    height: 480px;
    max-height: calc(100vh - 24px);
    min-width: 0;
    min-height: 0;
    background: var(--card-bg, #ffffff);
    border-radius: 14px;
    box-shadow: 0 14px 44px rgba(0,0,0,0.32);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    z-index: 10000;
    animation: socialhubPopupIn 0.25s ease;
}

@keyframes socialhubPopupIn {
    from {
        opacity: 0;
        transform: translateY(18px) scale(0.96);
    }
    to {
        opacity: 1;
        transform: none;
    }
}

.socialhub-chat-popup-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 13px 16px;
    border-bottom: 1px solid #e4e6eb;
}

.socialhub-chat-popup-head h3 {
    margin: 0;
    font-size: 17px;
}

.socialhub-chat-popup-actions {
    display: flex;
    gap: 6px;
}

.socialhub-chat-popup-actions button {
    width: 30px;
    height: 30px;
    border: none;
    border-radius: 50%;
    background: #e4e6eb;
    cursor: pointer;
    font-size: 14px;
}

/* ---------- SHARED BODY (list + chat) ---------- */

.socialhub-msg-body {
    display: flex;
    flex: 1;
    min-height: 0;
}

.socialhub-msg-list {
    width: 100%;
    overflow-y: auto;
}

.socialhub-msg-chat {
    display: none;
    grid-template-rows: auto 1fr auto;
    grid-template-columns: minmax(0, 1fr);
    min-width: 0;
    min-height: 0;
}

.socialhub-msg-body.chat-open .socialhub-msg-list {
    display: none;
}

.socialhub-msg-body.chat-open .socialhub-msg-chat {
    display: grid;
}

/* ---------- CONVERSATION ITEM (Messenger style) ---------- */

.socialhub-msg-conv {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 14px;
    margin: 0 8px;
    border-radius: 10px;
    cursor: pointer;
    transition: background 0.15s;
}

.socialhub-msg-body .socialhub-msg-conv {
    background: transparent;
    border: none;
    border-radius: 10px;
    box-shadow: none;
}

.socialhub-msg-conv:hover {
    background: var(--glass-bg-strong);
}

.socialhub-msg-conv.active {
    background: #e7f3ff;
}

.socialhub-msg-conv-avatar {
    width: 56px;
    height: 56px;
    flex-shrink: 0;
    border-radius: 50%;
    overflow: hidden;
    background: #e4e6eb;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 26px;
    position: relative;
    transition: box-shadow 0.15s;
}

.socialhub-msg-conv.unread .socialhub-msg-conv-avatar {
    box-shadow: 0 0 0 2px #0084ff;
}

.socialhub-msg-conv-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.socialhub-msg-conv-main {
    flex: 1;
    min-width: 0;
}

.socialhub-msg-conv-name {
    font-size: 15px;
    font-weight: 400;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.socialhub-msg-conv.unread .socialhub-msg-conv-name {
    font-weight: 700;
}

.socialhub-msg-conv-preview {
    font-size: 13.5px;
    color: #65676b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.socialhub-msg-conv.unread .socialhub-msg-conv-preview {
    color: #050505;
    font-weight: 500;
}

.socialhub-msg-conv-side {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 5px;
    flex-shrink: 0;
}

.socialhub-msg-conv-time {
    font-size: 11px;
    color: #65676b;
}

.socialhub-msg-conv.unread .socialhub-msg-conv-time {
    color: #0084ff;
    font-weight: 700;
}

.socialhub-msg-conv-unread {
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    border-radius: 9px;
    background: #0084ff;
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
}

/* ---------- CHAT PANE (Messenger style) ---------- */

.socialhub-msg-chat-head {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    flex-shrink: 0;
    border-bottom: 1px solid var(--glass-border-soft);
}

.socialhub-msg-back {
    display: none;
    border: none;
    background: transparent;
    font-size: 18px;
    cursor: pointer;
    padding: 2px 6px;
}

.socialhub-msg-chat-head .socialhub-msg-conv-avatar {
    width: 40px;
    height: 40px;
    font-size: 19px;
}

.socialhub-msg-chat-meta {
    flex: 1;
    min-width: 0;
}

.socialhub-msg-chat-name {
    font-size: 16px;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.socialhub-msg-chat-status {
    font-size: 13px;
    color: #65676b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.socialhub-msg-chat-status.online {
    color: #31a24c;
    font-weight: 600;
}

.socialhub-msg-chat-actions {
    display: flex;
    gap: 6px;
    flex-shrink: 0;
}

.socialhub-msg-chat-actions button {
    width: 38px;
    height: 38px;
    border: none;
    border-radius: 50%;
    background: var(--glass-bg-soft);
    cursor: pointer;
    font-size: 16px;
}

.socialhub-msg-thread {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
}

.socialhub-msg-daysep {
    align-self: center;
    padding: 4px 12px;
    margin: 6px 0;
    border-radius: 10px;
    background: var(--glass-bg-strong);
    -webkit-backdrop-filter: blur(12px);
    backdrop-filter: blur(12px);
    border: 1px solid var(--glass-border-soft);
    color: #65676b;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.5px;
    text-transform: uppercase;
}

.socialhub-msg-bubble {
    max-width: 75%;
    padding: 9px 14px;
    border-radius: 18px;
    font-size: 14.5px;
    line-height: 1.45;
    word-wrap: break-word;
}

.socialhub-msg-bubble.mine {
    align-self: flex-end;
    background: #0084ff;
    color: #fff;
    border-bottom-right-radius: 4px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
}

.socialhub-msg-bubble.theirs {
    align-self: flex-start;
    background: rgba(255, 255, 255, 0.85);
    -webkit-backdrop-filter: blur(8px);
    backdrop-filter: blur(8px);
    color: #1c1e21;
    border-bottom-left-radius: 4px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}

.socialhub-msg-bubble-time {
    display: block;
    margin-top: 3px;
    font-size: 10px;
    opacity: 0.65;
    text-align: right;
}

.socialhub-msg-inputbar {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 8px 14px;
    padding: 6px 8px;
    flex-shrink: 0;
    border-radius: 24px;
    background: var(--glass-bg-strong);
    -webkit-backdrop-filter: blur(14px) saturate(180%);
    backdrop-filter: blur(14px) saturate(180%);
    border: 1px solid var(--glass-border);
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.35),
        0 2px 10px rgba(31, 38, 135, 0.08);
}

.socialhub-msg-inputbar input {
    flex: 1;
    min-width: 0;
    border: none;
    background: transparent;
    outline: none;
    padding: 7px 8px;
    font-size: 15px;
    font-family: inherit;
    color: inherit;
    box-shadow: none;
}

.socialhub-msg-inputbar button {
    border: none;
    border-radius: 50%;
    width: 38px;
    height: 38px;
    flex-shrink: 0;
    background: transparent;
    color: #0084ff;
    font-size: 17px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
}

.socialhub-msg-inputbar .socialhub-msg-send {
    background: #0084ff;
    color: #fff;
    font-size: 14px;
    box-shadow: 0 2px 6px rgba(0, 132, 255, 0.4);
}

.socialhub-msg-emoji-panel {
    position: absolute;
    bottom: 66px;
    right: 16px;
    width: 288px;
    max-height: 220px;
    overflow-y: auto;
    background: var(--glass-bg-strong);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    backdrop-filter: blur(20px) saturate(180%);
    border: 1px solid var(--glass-border);
    border-radius: 16px;
    box-shadow: var(--glass-shadow);
    padding: 10px;
    display: none;
    grid-template-columns: repeat(8, 1fr);
    gap: 4px;
    z-index: 20;
}

.socialhub-msg-emoji-panel button {
    background: transparent;
    border: none;
    font-size: 20px;
    padding: 4px;
    border-radius: 8px;
    cursor: pointer;
}

.socialhub-msg-emoji-panel button:hover {
    background: var(--glass-bg-soft);
}

.socialhub-msg-empty {
    padding: 20px;
    color: #65676b;
    text-align: center;
    font-size: 14px;
    line-height: 1.6;
}

/* ---------- FULL PAGE (messages.html, Messenger style) ---------- */

.socialhub-msg-page-wrap {
    padding: 20px 14px 40px;
}

.socialhub-msg-page {
    max-width: 1150px;
    margin: 0 auto;
    height: calc(100vh - 130px);
    min-height: 460px;
    border-radius: 18px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.socialhub-msg-page .socialhub-msg-body {
    flex: 1;
    height: auto;
    min-height: 0;
}

.socialhub-msg-page .socialhub-msg-list {
    width: 360px;
    flex-shrink: 0;
    border-right: 1px solid var(--glass-border-soft);
    height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.socialhub-msg-page .socialhub-msg-list-items {
    flex: 1;
    overflow-y: auto;
    padding: 4px 0 12px;
}

.socialhub-msg-page .socialhub-msg-chat {
    display: grid;
    grid-template-rows: auto 1fr auto;
    grid-template-columns: minmax(0, 1fr);
    height: 100%;
    position: relative;
}

.socialhub-msg-page .socialhub-msg-list,
.socialhub-msg-page .socialhub-msg-body.chat-open .socialhub-msg-list {
    display: flex;
}

.socialhub-msg-page .socialhub-msg-chat,
.socialhub-msg-page .socialhub-msg-body.chat-open .socialhub-msg-chat {
    display: grid;
    grid-template-rows: auto 1fr auto;
    grid-template-columns: minmax(0, 1fr);
}

/* ---------- PAGE SIDEBAR (Chats head + search) ---------- */

.socialhub-msg-list-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 18px 8px;
}

.socialhub-msg-list-head h1 {
    margin: 0;
    font-size: 24px;
    font-weight: 800;
}

.socialhub-msg-newchat {
    width: 38px;
    height: 38px;
    border: none;
    border-radius: 50%;
    background: #e7f3ff;
    color: #0084ff;
    font-size: 18px;
    cursor: pointer;
}

.socialhub-msg-search {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 12px 10px;
    padding: 0 12px;
    height: 38px;
    border-radius: 19px;
    background: var(--glass-bg-soft);
    border: 1px solid var(--glass-border-soft);
}

.socialhub-msg-search span {
    font-size: 14px;
    opacity: 0.7;
}

.socialhub-msg-search input {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    font-size: 14px;
    font-family: inherit;
    color: inherit;
}

/* ---------- DARK MODE ---------- */

body.dark-mode .socialhub-chat-popup-head,
body.dark-mode .socialhub-msg-chat-head {
    border-color: #3a3b3c;
}

body.dark-mode .socialhub-msg-conv:hover {
    background: var(--glass-bg-strong);
}

body.dark-mode .socialhub-msg-conv.active {
    background: rgba(0, 132, 255, 0.2);
}

body.dark-mode .socialhub-msg-bubble.theirs {
    background: rgba(58, 59, 60, 0.85);
    color: #e4e6eb;
}

body.dark-mode .socialhub-msg-newchat {
    background: rgba(0, 132, 255, 0.2);
    color: #4cb3ff;
}

body.dark-mode .socialhub-chat-popup-actions button {
    background: #3a3b3c;
    color: #e4e6eb;
}

body.dark-mode .socialhub-msg-conv-preview,
body.dark-mode .socialhub-msg-conv-time,
body.dark-mode .socialhub-msg-chat-status {
    color: #b0b3b8;
}

body.dark-mode .socialhub-msg-conv.unread .socialhub-msg-conv-preview {
    color: #e4e6eb;
}

/* ---------- RESPONSIVE ---------- */

@media (max-width: 640px) {

    .socialhub-chat-popup {
        right: 10px;
        left: 10px;
        bottom: 10px;
        width: auto;
        height: 72vh;
    }

    .socialhub-msg-page .socialhub-msg-list {
        width: 100%;
        border-right: none;
    }

    .socialhub-msg-page .socialhub-msg-chat,
    .socialhub-msg-page .socialhub-msg-body.chat-open .socialhub-msg-chat {
        display: none;
    }

    .socialhub-msg-page .socialhub-msg-body.chat-open .socialhub-msg-list {
        display: none;
    }

    .socialhub-msg-page .socialhub-msg-body.chat-open .socialhub-msg-chat {
        display: grid;
        grid-template-rows: auto 1fr auto;
        grid-template-columns: minmax(0, 1fr);
    }

    .socialhub-msg-back {
        display: block;
    }

    .socialhub-msg-emoji-panel {
        width: 250px;
        right: 10px;
    }
}

/* ---------- TYPING INDICATOR ---------- */

.socialhub-msg-typing {
    display: none;
    font-size: 12px;
    font-weight: 600;
    color: #1877f2;
    padding: 0 4px;
}

.socialhub-msg-typing.visible {
    display: block;
}

/* ---------- ONLINE DOT ---------- */

.socialhub-msg-conv-avatar {
    position: relative;
}

.socialhub-msg-conv-avatar.online::after {
    content: "";
    position: absolute;
    bottom: 0;
    right: 0;
    width: 10px;
    height: 10px;
    background: #31a24c;
    border-radius: 50%;
    border: 2px solid #fff;
}

/* ---------- READ TICKS ---------- */

.socialhub-msg-tick {
    font-size: 11px;
    opacity: 0.75;
    margin-left: 5px;
    font-style: normal;
}

.socialhub-msg-tick.read {
    opacity: 1;
    color: #ffffff;
}

/* ---------- CHAT MEDIA ---------- */

.socialhub-msg-bubble-media img,
.socialhub-msg-bubble-media video {
    width: 100%;
    max-width: 260px;
    max-height: 240px;
    object-fit: cover;
    border-radius: 12px;
    display: block;
    margin-bottom: 4px;
    background: #000;
}

.socialhub-msg-photo-btn {
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    flex-shrink: 0;
    background: #e4e6eb;
    color: #1c1e21;
    font-size: 16px;
    cursor: pointer;
}
`;

    document.head.appendChild(style);
})();


// ======================================================
// 2. OPEN THE CHAT POPUP (corner widget)
// ======================================================

async function socialhubOpenChatPopup(startUserId) {

    const existing =
        document.querySelector(".socialhub-chat-popup");

    if (existing) {
        existing.remove();
    }

    const popup =
        document.createElement("div");

    popup.className = "socialhub-chat-popup";

    popup.innerHTML = `

        <div class="socialhub-chat-popup-head">

            <h3>Chats</h3>

            <div class="socialhub-chat-popup-actions">

                <button
                    type="button"
                    class="socialhub-chat-popup-expand"
                    title="Open Messages page"
                >
                    ⤢
                </button>

                <button
                    type="button"
                    class="socialhub-chat-popup-close"
                    title="Close"
                >
                    ✕
                </button>

            </div>

        </div>

        <div class="socialhub-msg-body">

            <div class="socialhub-msg-list">

                <p class="socialhub-msg-empty">
                    Loading...
                </p>

            </div>

            <div class="socialhub-msg-chat"></div>

        </div>
    `;

    document.body.appendChild(popup);

    popup
        .querySelector(".socialhub-chat-popup-close")
        .addEventListener("click", () => {

            popup.remove();

            socialhubMsgState = null;

            socialhubUpdateMsgBadge();
        });

    popup
        .querySelector(".socialhub-chat-popup-expand")
        .addEventListener("click", () => {

            window.location.href = "messages.html";
        });

    const me =
        await socialhubGetMe();

    if (!me) {

        popup.querySelector(".socialhub-msg-list").innerHTML = `
            <p class="socialhub-msg-empty">
                Please login to see your messages.
            </p>
        `;

        return;
    }

    socialhubMsgState = {
        me: me,
        body: popup.querySelector(".socialhub-msg-body"),
        mode: "popup",
        currentChatUserId: null
    };

    await socialhubRenderConversations();

    if (startUserId) {

        await socialhubOpenChat(startUserId);
    }
}


// ======================================================
// 3. FULL MESSAGES PAGE (messages.html)
// ======================================================

async function socialhubSetupMessagesPage() {

    const wrap =
        document.getElementById("messagesPage");

    if (!wrap) {
        return;
    }

    wrap.innerHTML = `
        <div class="socialhub-msg-page">

            <div class="socialhub-msg-body">

                <div class="socialhub-msg-list">

                    <div class="socialhub-msg-list-head">

                        <h1>Chats</h1>

                        <button
                            type="button"
                            class="socialhub-msg-newchat"
                            title="New message"
                        >✎</button>

                    </div>

                    <div class="socialhub-msg-search">

                        <span>🔍</span>

                        <input
                            type="text"
                            placeholder="Search Messenger"
                        >

                    </div>

                    <div class="socialhub-msg-list-items">

                        <p class="socialhub-msg-empty">
                            Loading...
                        </p>

                    </div>

                </div>

                <div class="socialhub-msg-chat"></div>

            </div>

        </div>
    `;

    wrap
        .querySelector(".socialhub-msg-newchat")
        .addEventListener("click", () => {

            socialhubOpenChatPopup(null);
        });

    const me =
        await socialhubGetMe();

    if (!me) {

        wrap.querySelector(
            ".socialhub-msg-list-items"
        ).innerHTML = `
            <p class="socialhub-msg-empty">
                Please login to see your messages.
            </p>
        `;

        return;
    }

    socialhubMsgState = {
        me: me,
        body: wrap.querySelector(".socialhub-msg-body"),
        mode: "page",
        currentChatUserId: null
    };

    await socialhubRenderConversations();

    // Search filter (Messenger style)
    const searchInput =
        wrap.querySelector(
            ".socialhub-msg-search input"
        );

    searchInput.addEventListener("input", () => {

        const query =
            searchInput.value
                .trim()
                .toLowerCase();

        wrap
            .querySelectorAll(".socialhub-msg-conv")
            .forEach(item => {

                item.style.display =
                    (item.dataset.name || "")
                        .includes(query)
                        ? ""
                        : "none";
            });
    });

    // Auto-open the most recent conversation
    const list =
        socialhubMsgState.body.querySelector(
            ".socialhub-msg-conv"
        );

    if (list) {
        list.click();
    }
}


// ======================================================
// 4. CONVERSATION LIST
// ======================================================

async function socialhubFetchConversations() {

    if (!socialhubMsgState) {
        return { conversations: [], profileMap: new Map() };
    }

    const me =
        socialhubMsgState.me;

    const {
        data: messages
    } = await db
        .from("messages")
        .select("sender_id, receiver_id, content, created_at, read")
        .or(
            `sender_id.eq.${me.id},` +
            `receiver_id.eq.${me.id}`
        )
        .order("created_at", {
            ascending: false
        })
        .limit(200);

    const map = new Map();

    (messages || []).forEach(message => {

        const otherId =
            message.sender_id === me.id
                ? message.receiver_id
                : message.sender_id;

        if (!otherId) {
            return;
        }

        let conversation =
            map.get(otherId);

        if (!conversation) {

            conversation = {
                otherId: otherId,
                lastMessage: message,
                unread: 0
            };

            map.set(otherId, conversation);
        }

        if (
            message.sender_id !== me.id &&
            !message.read
        ) {

            conversation.unread++;
        }
    });

    const otherIds =
        [...map.keys()];

    let profileMap = new Map();

    if (otherIds.length > 0) {

        const {
            data: profiles
        } = await db
            .from("profiles")
            .select("id, full_name, username, avatar_url")
            .in("id", otherIds);

        (profiles || []).forEach(profile => {

            profileMap.set(profile.id, profile);
        });
    }

    const conversations =
        [...map.values()].sort(
            (a, b) =>
                new Date(b.lastMessage.created_at) -
                new Date(a.lastMessage.created_at)
        );

    return { conversations, profileMap };
}


async function socialhubRenderConversations() {

    if (!socialhubMsgState) {
        return;
    }

    const list =
        socialhubMsgState.body.querySelector(
            ".socialhub-msg-list"
        );

    const items =
        list.querySelector(
            ".socialhub-msg-list-items"
        ) || list;

    items.innerHTML = `
        <p class="socialhub-msg-empty">
            Loading...
        </p>
    `;

    const {
        conversations,
        profileMap
    } = await socialhubFetchConversations();

    if (conversations.length === 0) {

        items.innerHTML = `
            <p class="socialhub-msg-empty">
                No messages yet.
                Open a user profile and
                tap the Message button!
            </p>
        `;

        return;
    }

    items.innerHTML = "";

    conversations.forEach(conversation => {

        const other =
            profileMap.get(conversation.otherId);

        const mine =
            conversation.lastMessage.sender_id ===
            socialhubMsgState.me.id;

        const preview =
            (mine ? "You: " : "") +
            (conversation.lastMessage.content || "📷 Photo");

        const unread =
            conversation.unread > 0;

        const item =
            document.createElement("div");

        item.className =
            "socialhub-msg-conv" +
            (unread ? " unread" : "");

        item.dataset.name =
            (other?.full_name || "User")
                .toLowerCase();

        item.innerHTML = `

            <div class="socialhub-msg-conv-avatar">
                ${socialhubAvatarHTML(other)}
            </div>

            <div class="socialhub-msg-conv-main">

                <div class="socialhub-msg-conv-name">
                    ${socialhubEscape(other?.full_name || "User")}
                </div>

                <div class="socialhub-msg-conv-preview">
                    ${socialhubEscape(preview)}
                </div>

            </div>

            <div class="socialhub-msg-conv-side">

                <span class="socialhub-msg-conv-time">
                    ${socialhubMsgTime(
                        conversation.lastMessage.created_at
                    )}
                </span>

                ${
                    unread
                        ? `
                            <span class="socialhub-msg-conv-unread">
                                ${conversation.unread}
                            </span>
                        `
                        : ""
                }

            </div>
        `;

        item.addEventListener("click", () => {

            socialhubOpenChat(conversation.otherId);
        });

        item.dataset.userId = conversation.otherId;

        items.appendChild(item);
    });
}


// ======================================================
// 5. OPEN A CHAT THREAD
// ======================================================

async function socialhubOpenChat(userId) {

    if (!socialhubMsgState) {
        return;
    }

    const state =
        socialhubMsgState;

    state.currentChatUserId =
        userId;

    const body =
        state.body;

    body.classList.add("chat-open");

    const chat =
        body.querySelector(".socialhub-msg-chat");

    const me =
        state.me;

    chat.innerHTML = `
        <p class="socialhub-msg-empty">
            Loading...
        </p>
    `;

    const {
        data: profile
    } = await db
        .from("profiles")
        .select("id, full_name, username, avatar_url, last_seen")
        .eq("id", userId)
        .single();

    window.socialhubMsgLastSeenLabel =
        socialhubLastSeenLabel(profile?.last_seen);

    const {
        data: messages
    } = await db
        .from("messages")
        .select("id, sender_id, receiver_id, content, media_url, read, created_at")
        .or(
            `and(sender_id.eq.${me.id},receiver_id.eq.${userId}),` +
            `and(sender_id.eq.${userId},receiver_id.eq.${me.id})`
        )
        .order("created_at", {
            ascending: true
        });

    chat.innerHTML = `

        <div class="socialhub-msg-chat-head">

            <button
                type="button"
                class="socialhub-msg-back"
                title="Back"
            >
                ←
            </button>

            <div class="socialhub-msg-conv-avatar">
                ${socialhubAvatarHTML(profile)}
            </div>

            <div class="socialhub-msg-chat-meta">

                <div class="socialhub-msg-chat-name">
                    ${socialhubEscape(profile?.full_name || "User")}
                </div>

                <div class="socialhub-msg-chat-status" id="socialhubMsgChatStatus">
                    ${socialhubLastSeenLabel(profile?.last_seen)}
                </div>
                <div class="socialhub-msg-typing">
                    typing<span class="socialhub-msg-typing-dots">…</span>
                </div>

            </div>

            <div class="socialhub-msg-chat-actions">

                <button
                    type="button"
                    title="Voice call"
                >📞</button>

                <button
                    type="button"
                    title="Video call"
                >🎥</button>

                <button
                    type="button"
                    title="Details"
                >ⓘ</button>

            </div>

        </div>

        <div class="socialhub-msg-thread">
        </div>

        <div class="socialhub-msg-inputbar">

            <button
                type="button"
                class="socialhub-msg-plus"
                title="Send photo"
            >＋</button>

            <input
                type="text"
                placeholder="Aa"
                maxlength="1000"
            >

            <button
                type="button"
                class="socialhub-msg-emoji"
                title="Emoji"
            >😊</button>

            <button
                type="button"
                class="socialhub-msg-send"
                title="Send"
            >➤</button>

        </div>
    `;

    const thread =
        chat.querySelector(".socialhub-msg-thread");

    (messages || []).forEach(message => {

        socialhubAppendBubble(
            thread,
            message,
            me.id
        );
    });

    // Mark received messages as read
    await db
        .from("messages")
        .update({ read: true })
        .eq("sender_id", userId)
        .eq("receiver_id", me.id)
        .eq("read", false);

    // Highlight the active conversation (page mode)
    body
        .querySelectorAll(".socialhub-msg-conv")
        .forEach(item => {
            item.classList.toggle(
                "active",
                item.dataset.userId === userId
            );
        });

    // Back button (popup + mobile page)
    chat
        .querySelector(".socialhub-msg-back")
        .addEventListener("click", () => {

            state.currentChatUserId = null;

            body.classList.remove("chat-open");

            socialhubRenderConversations();
        });

    // Send message
    const input =
        chat.querySelector(".socialhub-msg-inputbar input");

    const send = () => {

        socialhubSendMessage(input, thread, me);
    };

    chat
        .querySelector(".socialhub-msg-send")
        .addEventListener("click", send);

    input.addEventListener("keydown", event => {

        if (event.key === "Enter") {

            event.preventDefault();

            send();
        }

        // Typing indicator
        const now =
            Date.now();

        if (now - (window.socialhubLastTypingSent || 0) > 900) {

            window.socialhubLastTypingSent = now;

            socialhubSendTyping(me.id, userId);
        }
    });

    // ---------- SEND PHOTO ----------

    const photoButton =
        chat.querySelector(".socialhub-msg-plus");

    const photoInput =
        document.createElement("input");

    photoInput.type = "file";
    photoInput.accept = "image/*";
    photoInput.style.display = "none";

    document.body.appendChild(photoInput);

    photoButton.addEventListener("click", () => {

        photoInput.click();
    });

    photoInput.addEventListener("change", async () => {

        const file =
            photoInput.files[0];

        if (!file) {
            return;
        }

        if (!file.type.startsWith("image/")) {

            alert("Please choose an image file.");

            return;
        }

        if (file.size > 5 * 1024 * 1024) {

            alert("Image is too big. Maximum size is 5MB.");

            return;
        }

        const ext =
            (file.name.split(".").pop() || "jpg").toLowerCase();

        const path =
            `${me.id}-${Date.now()}.${ext}`;

        try {

            const {
                error: uploadError
            } = await db
                .storage
                .from("chat-images")
                .upload(path, file, {
                    upsert: true,
                    contentType: file.type
                });

            if (uploadError) {
                throw uploadError;
            }

            const {
                data: urlData
            } = db
                .storage
                .from("chat-images")
                .getPublicUrl(path);

            const {
                data: message,
                error: insertError
            } = await db
                .from("messages")
                .insert({
                    sender_id: me.id,
                    receiver_id: userId,
                    content: "",
                    media_url: urlData.publicUrl
                })
                .select()
                .single();

            if (insertError) {
                throw insertError;
            }

            photoInput.value = "";

            socialhubAppendBubble(
                thread,
                message,
                me.id
            );

            thread.scrollTop =
                thread.scrollHeight;

            socialhubRenderConversations();

        } catch (error) {

            console.error(
                "❌ Photo send error:",
                error
            );

            alert(
                "Could not send photo.\n\n" +
                error.message
            );
        }
    });

    // ---------- EMOJI PANEL (Messenger style) ----------

    const emojiButton =
        chat.querySelector(".socialhub-msg-emoji");

    const emojiPanel =
        document.createElement("div");

    emojiPanel.className =
        "socialhub-msg-emoji-panel";

    const emojis = [
        "😀", "😁", "😂", "🤣",
        "😊", "😍", "🥰", "😘",
        "😎", "🤔", "😅", "😉",
        "🙃", "😢", "😭", "😡",
        "👍", "👎", "👏", "🙏",
        "💪", "🤝", "❤️", "💔",
        "💯", "🔥", "✨", "🎉",
        "🎂", "🚀", "👀", "😴"
    ];

    emojis.forEach(emoji => {

        const button =
            document.createElement("button");

        button.type = "button";

        button.textContent = emoji;

        button.addEventListener("click", () => {

            input.value += emoji;

            input.focus();
        });

        emojiPanel.appendChild(button);
    });

    chat.appendChild(emojiPanel);

    emojiButton.addEventListener("click", event => {

        event.stopPropagation();

        const visible =
            emojiPanel.style.display === "grid";

        emojiPanel.style.display =
            visible ? "none" : "grid";
    });

    if (!window.socialhubEmojiOutsideBound) {

        window.socialhubEmojiOutsideBound = true;

        document.addEventListener("click", event => {

            if (
                !event.target.closest(".socialhub-msg-inputbar")
            ) {

                document
                    .querySelectorAll(".socialhub-msg-emoji-panel")
                    .forEach(panel => {

                        panel.style.display = "none";
                    });
            }
        });
    }

    // Online dot + status for the open chat
    socialhubRefreshOnlineDots();

    thread.scrollTop =
        thread.scrollHeight;

    // Refresh the conversation list previews
    socialhubRenderConversations();

    socialhubUpdateMsgBadge();
}


// ======================================================
// 6. SEND + BUBBLE HELPERS
// ======================================================

async function socialhubSendMessage(input, thread, me) {

    const content =
        input.value.trim();

    if (content === "") {
        return;
    }

    const receiverId =
        socialhubMsgState.currentChatUserId;

    if (!receiverId) {
        return;
    }

    const {
        data: message,
        error
    } = await db
        .from("messages")
        .insert({
            sender_id: me.id,
            receiver_id: receiverId,
            content: content
        })
        .select()
        .single();

    if (error) {

        console.error(
            "❌ Message send error:",
            error
        );

        alert(
            "Could not send message.\n\n" +
            error.message
        );

        return;
    }

    input.value = "";

    socialhubAppendBubble(
        thread,
        message,
        me.id
    );

    thread.scrollTop =
        thread.scrollHeight;

    socialhubRenderConversations();
}


function socialhubDayLabel(dateString) {

    const date =
        new Date(dateString);

    const now =
        new Date();

    const startToday =
        new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
        );

    const startDay =
        new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate()
        );

    const diff =
        Math.round(
            (startToday - startDay) / 86400000
        );

    if (diff === 0) {
        return "Today";
    }

    if (diff === 1) {
        return "Yesterday";
    }

    return date.toLocaleDateString([], {
        weekday: "long",
        month: "short",
        day: "numeric"
    });
}


function socialhubAppendBubble(thread, message, myId) {

    const mine =
        message.sender_id === myId;

    const dateKey =
        (message.created_at || "")
            .slice(0, 10);

    const lastBubble =
        thread.querySelector(
            ".socialhub-msg-bubble:last-child"
        );

    if (
        !lastBubble ||
        lastBubble.dataset.date !== dateKey
    ) {

        const separator =
            document.createElement("div");

        separator.className =
            "socialhub-msg-daysep";

        separator.textContent =
            socialhubDayLabel(message.created_at);

        thread.appendChild(separator);
    }

    const bubble =
        document.createElement("div");

    bubble.className =
        `socialhub-msg-bubble ${mine ? "mine" : "theirs"}`;

    bubble.dataset.date = dateKey;

    if (message.id) {

        bubble.dataset.messageId =
            message.id;
    }

    let mediaHTML = "";

    if (message.media_url) {

        const isVideo =
            /\.(mp4|webm|ogg)(\?|$)/i.test(message.media_url);

        mediaHTML = `

            <div class="socialhub-msg-bubble-media">

                ${
                    isVideo
                        ? `
                            <video
                                src="${socialhubEscape(message.media_url)}"
                                controls
                                playsinline
                                preload="metadata"
                            ></video>
                        `
                        : `
                            <img
                                src="${socialhubEscape(message.media_url)}"
                                alt="Photo"
                            >
                        `
                }

            </div>
        `;
    }

    const tickHTML =
        mine
            ? `
                <span class="socialhub-msg-tick${message.read ? " read" : ""}">
                    ${message.read ? "✓✓" : "✓"}
                </span>
            `
            : "";

    bubble.innerHTML = `

        ${mediaHTML}

        ${socialhubEscape(message.content)}

        <span class="socialhub-msg-bubble-time">
            ${socialhubMsgTime(message.created_at)}
            ${tickHTML}
        </span>
    `;

    thread.appendChild(bubble);
}


// ======================================================
// 6b. TYPING INDICATOR + ONLINE PRESENCE
// ======================================================

let socialhubTypingChannel = null;

let socialhubPresenceChannel = null;

let socialhubTypingTimeout = null;

window.socialhubOnlineUsers =
    new Set();


function socialhubSendTyping(fromId, toId) {

    if (!socialhubTypingChannel) {
        return;
    }

    socialhubTypingChannel
        .send({
            type: "broadcast",
            event: "typing",
            payload: {
                from: fromId,
                to: toId
            }
        })
        .catch(() => {});
}


function socialhubSetupTypingChannel(me) {

    if (socialhubTypingChannel) {
        return;
    }

    socialhubTypingChannel =
        db.channel("socialhub-typing-live");

    socialhubTypingChannel
        .on(
            "broadcast",
            { event: "typing" },
            ({ payload }) => {

                if (
                    !payload ||
                    payload.to !== me.id ||
                    !socialhubMsgState ||
                    socialhubMsgState.currentChatUserId !== payload.from
                ) {
                    return;
                }

                const typing =
                    socialhubMsgState.body
                        ?.querySelector(".socialhub-msg-typing");

                if (!typing) {
                    return;
                }

                typing.classList.add("visible");

                clearTimeout(socialhubTypingTimeout);

                socialhubTypingTimeout =
                    setTimeout(() => {

                        typing.classList.remove("visible");

                    }, 1800);
            }
        )
        .subscribe();
}


function socialhubSetupPresence(me) {

    if (socialhubPresenceChannel) {
        return;
    }

    // Last-seen heartbeat (FB-style "last active" fallback)
    const beat = async () => {

        try {

            await db
                .from("profiles")
                .update({ last_seen: new Date().toISOString() })
                .eq("id", me.id);

        } catch (beatError) {

            // Column missing - ignore
        }
    };

    beat();

    const heartbeat = setInterval(beat, 30000);

    if (typeof window.addEventListener === "function") {

        window.addEventListener("pagehide", () => {

            clearInterval(heartbeat);
        });
    }

    socialhubPresenceChannel =
        db.channel("socialhub-online-live");

    socialhubPresenceChannel
        .on("presence", { event: "sync" }, socialhubRefreshOnlineUsers)
        .on("presence", { event: "join" }, socialhubRefreshOnlineUsers)
        .on("presence", { event: "leave" }, socialhubRefreshOnlineUsers)
        .subscribe(status => {

            if (status === "SUBSCRIBED") {

                socialhubPresenceChannel.track({
                    user_id: me.id
                });
            }
        });
}


function socialhubRefreshOnlineUsers() {

    if (!socialhubPresenceChannel) {
        return;
    }

    const state =
        socialhubPresenceChannel.presenceState();

    const set =
        new Set();

    Object
        .values(state)
        .forEach(list => {

            list.forEach(item => {

                if (item.user_id) {

                    set.add(item.user_id);
                }
            });
        });

    window.socialhubOnlineUsers =
        set;

    socialhubRefreshOnlineDots();

    if (typeof socialhubRefreshFriendsDots === "function") {

        socialhubRefreshFriendsDots();
    }
}


function socialhubLastSeenLabel(lastSeen) {

    if (!lastSeen) {

        return "Active recently";
    }

    const diff =
        Date.now() - new Date(lastSeen).getTime();

    if (diff < 60000) {

        return "Active now";
    }

    const mins =
        Math.floor(diff / 60000);

    if (mins < 60) {

        return `Last active ${mins}m ago`;
    }

    const hours =
        Math.floor(mins / 60);

    if (hours < 24) {

        return `Last active ${hours}h ago`;
    }

    const days =
        Math.floor(hours / 24);

    if (days === 1) {

        return "Last active yesterday";
    }

    return `Last active ${days}d ago`;
}


function socialhubRefreshOnlineDots() {

    const online =
        window.socialhubOnlineUsers || new Set();

    document
        .querySelectorAll(".socialhub-msg-conv")
        .forEach(conv => {

            const avatar =
                conv.querySelector(".socialhub-msg-conv-avatar");

            if (avatar) {

                avatar.classList.toggle(
                    "online",
                    online.has(conv.dataset.userId)
                );
            }
        });

    const headAvatar =
        document.querySelector(
            ".socialhub-msg-chat .socialhub-msg-conv-avatar"
        );

    if (
        headAvatar &&
        socialhubMsgState &&
        socialhubMsgState.currentChatUserId
    ) {

        headAvatar.classList.toggle(
            "online",
            online.has(socialhubMsgState.currentChatUserId)
        );
    }

    const statusEl =
        document.querySelector(
            ".socialhub-msg-chat-status"
        );

    if (
        statusEl &&
        socialhubMsgState &&
        socialhubMsgState.currentChatUserId
    ) {

        const isOnline =
            online.has(
                socialhubMsgState.currentChatUserId
            );

        statusEl.textContent =
            isOnline
                ? "Active now"
                : (window.socialhubMsgLastSeenLabel || "Active recently");

        statusEl.classList.toggle(
            "online",
            isOnline
        );
    }
}


// ======================================================
// 7. UNREAD BADGE ON THE MESSAGES BUTTON
// ======================================================

async function socialhubUpdateMsgBadge() {

    const button =
        document.querySelector(
            '.top-icons button[title="Messages"]'
        );

    if (!button) {
        return;
    }

    const me =
        await socialhubGetMe();

    if (!me) {

        const badge =
            button.querySelector(".socialhub-notif-badge");

        if (badge) {
            badge.classList.remove("visible");
        }

        return;
    }

    const {
        count,
        error
    } = await db
        .from("messages")
        .select("id", {
            count: "exact",
            head: true
        })
        .eq("receiver_id", me.id)
        .eq("read", false);

    let badge =
        button.querySelector(".socialhub-notif-badge");

    if (!badge) {

        badge =
            document.createElement("span");

        badge.className = "socialhub-notif-badge";

        button.appendChild(badge);
    }

    const unread =
        error ? 0 : (count || 0);

    if (unread > 0) {

        badge.innerText =
            unread > 99 ? "99+" : String(unread);

        badge.classList.add("visible");

    } else {

        badge.classList.remove("visible");
    }
}


// ======================================================
// 8. REAL-TIME MESSAGE DELIVERY
// ======================================================

function socialhubSetupMessageRealtime() {

    const channel =
        db.channel("socialhub-messages-live");

    channel
        .on(
            "postgres_changes",
            {
                event: "INSERT",
                schema: "public",
                table: "messages"
            },
            payload => {

                const message =
                    payload.new;

                if (
                    !socialhubMsgState ||
                    !socialhubMsgState.me
                ) {
                    return;
                }

                const me =
                    socialhubMsgState.me;

                const mine =
                    message.sender_id === me.id;

                const related =
                    mine ||
                    message.receiver_id === me.id;

                if (!related) {
                    return;
                }

                socialhubUpdateMsgBadge();

                if (
                    !socialhubMsgState.body ||
                    !socialhubMsgState.body.isConnected
                ) {
                    return;
                }

                socialhubRenderConversations();

                socialhubRenderChatWidget();

                const chatOpen =
                    socialhubMsgState.currentChatUserId ===
                    message.sender_id;

                if (!chatOpen) {
                    return;
                }

                const thread =
                    socialhubMsgState.body.querySelector(
                        ".socialhub-msg-thread"
                    );

                if (thread) {

                    socialhubAppendBubble(
                        thread,
                        message,
                        me.id
                    );

                    thread.scrollTop =
                        thread.scrollHeight;
                }

                // Mark the freshly received message read
                db
                    .from("messages")
                    .update({ read: true })
                    .eq("id", message.id);
            }
        )
        .on(
            "postgres_changes",
            {
                event: "UPDATE",
                schema: "public",
                table: "messages"
            },
            payload => {

                const message =
                    payload.new;

                if (
                    !message ||
                    !message.id ||
                    !socialhubMsgState ||
                    !socialhubMsgState.me
                ) {
                    return;
                }

                if (message.sender_id !== socialhubMsgState.me.id) {
                    return;
                }

                if (!message.read) {
                    return;
                }

                // Update the read tick (✓ -> ✓✓)
                const tick =
                    document.querySelector(
                        `.socialhub-msg-bubble[data-message-id="${message.id}"] .socialhub-msg-tick`
                    );

                if (tick) {

                    tick.classList.add("read");

                    tick.innerText = "✓✓";
                }
            }
        )
        .subscribe();
}


// ======================================================
// 8b. LAST CHATS WIDGET (dashboard right sidebar)
// ======================================================

async function socialhubRenderChatWidget() {

    const list =
        document.querySelector(".socialhub-chat-list");

    if (!list) {
        return;
    }

    const {
        conversations,
        profileMap
    } = await socialhubFetchConversations();

    if (conversations.length === 0) {

        list.innerHTML = `
            <p class="socialhub-msg-empty">
                No chats yet.
            </p>
        `;

        return;
    }

    list.innerHTML = "";

    conversations
        .slice(0, 4)
        .forEach(conversation => {

            const other =
                profileMap.get(conversation.otherId);

            const mine =
                conversation.lastMessage.sender_id ===
                socialhubMsgState?.me?.id;

            const preview =
                (mine ? "You: " : "") +
                (conversation.lastMessage.content || "📷 Photo");

            const card =
                document.createElement("div");

            card.className = "socialhub-chat-card";

            card.innerHTML = `

                <div class="socialhub-chat-avatar">
                    ${socialhubAvatarHTML(other)}
                </div>

                <div class="socialhub-chat-main">
                    <strong>${socialhubEscape(other?.full_name || "User")}</strong>
                    <span>${socialhubEscape(preview)}</span>
                </div>

                <div class="socialhub-chat-side">
                    <span class="socialhub-chat-time">
                        ${socialhubMsgTime(conversation.lastMessage.created_at)}
                    </span>
                    <span class="socialhub-chat-msg-icon">💬</span>
                </div>
            `;

            card.addEventListener("click", () => {

                socialhubOpenChatPopup(conversation.otherId);
            });

            list.appendChild(card);
        });
}


// ======================================================
// 9. AUTO-SYNC
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

    const isMessagesPage =
        window.location.pathname
            .split("/")
            .pop() === "messages.html";

    // Topbar Messages button -> chat popup
    const button =
        document.querySelector(
            '.top-icons button[title="Messages"]'
        );

    if (button) {

        button.addEventListener(
            "click",
            () => socialhubOpenChatPopup(null)
        );

        socialhubUpdateMsgBadge();

        setInterval(
            socialhubUpdateMsgBadge,
            30000
        );
    }

    // Popup: raise above the mobile keyboard when it opens
    if (
        !window.socialhubVvBound &&
        window.visualViewport
    ) {

        window.socialhubVvBound = true;

        window.visualViewport.addEventListener(
            "resize",
            () => {

                const popup =
                    document.querySelector(
                        ".socialhub-chat-popup"
                    );

                if (!popup) {
                    return;
                }

                const vv =
                    window.visualViewport;

                const covered =
                    window.innerHeight - vv.height;

                popup.style.bottom =
                    covered > 0
                        ? `${covered + 10}px`
                        : "";
            }
        );
    }

    // Sidebar "Messages" item -> full messages page
    document
        .querySelectorAll(".sidebar-menu button")
        .forEach(item => {

            if (
                item.textContent.includes("Messages") &&
                !item.dataset.socialhubMsgReady
            ) {

                item.dataset.socialhubMsgReady = "1";

                item.addEventListener(
                    "click",
                    () => {
                        window.location.href = "messages.html";
                    }
                );
            }
        });

    // Full page mode
    if (isMessagesPage) {

        socialhubSetupMessagesPage();
    }

    // Last chats widget (dashboard right sidebar)
    socialhubRenderChatWidget();

    // Dark mode toggle fallback (messages.html has no script.js)
    const darkButton =
        document.querySelector(
            '.top-icons button[title="Dark Mode"]'
        );

    if (
        darkButton &&
        typeof toggleDarkMode !== "function"
    ) {

        darkButton.addEventListener("click", () => {

            const dark =
                document.body.classList.toggle("dark-mode");

            localStorage.setItem("darkMode", String(dark));
        });
    }

    socialhubGetMe().then(me => {

        if (me) {

            socialhubSetupMessageRealtime();

            socialhubSetupTypingChannel(me);

            socialhubSetupPresence(me);
        }
    });

    console.log(
        "✅ Messages activated!"
    );
});
