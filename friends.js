// ======================================================
// SOCIALHUB - FRIEND SYSTEM + PROFILE VISIT (STEP 13)
// ======================================================
// This is a NEW file. Old code is untouched.
//
// What it does:
//   1. Sidebar "Friends" button opens a Friends modal
//      with three tabs: Friends / Requests / Sent.
//   2. Right sidebar "People You May Know" shows real
//      users with an Add Friend button.
//   3. Clicking a post header (or avatar) opens that
//      user's public profile (user-profile.html).
//   4. user-profile.html shows the user's info, a
//      friend button and their posts.
//   5. Friend count on profile.html is updated.
//
// Setup:
//   - Run the SQL below once in the Supabase SQL Editor:
//
//     create table if not exists public.friendships (
//       id uuid primary key default gen_random_uuid(),
//       requester_id uuid not null references auth.users(id) on delete cascade,
//       addressee_id uuid not null references auth.users(id) on delete cascade,
//       status text not null default 'pending'
//         check (status in ('pending','accepted','declined')),
//       created_at timestamptz not null default now(),
//       unique (requester_id, addressee_id)
//     );
//
//     alter table public.friendships enable row level security;
//
//     create policy "friendships_select" on public.friendships
//       for select using (true);
//
//     create policy "friendships_insert" on public.friendships
//       for insert with check (auth.uid() = requester_id);
//
//     create policy "friendships_update" on public.friendships
//       for update using (auth.uid() = requester_id or auth.uid() = addressee_id);
//
//     create policy "friendships_delete" on public.friendships
//       for delete using (auth.uid() = requester_id or auth.uid() = addressee_id);
//
//   - Add this script to index.html, profile.html and
//     user-profile.html AFTER script.js:
//
//     <script src="friends.js"></script>
// ======================================================

var db = window.db || supabaseClient;


// ======================================================
// 0. INJECTED STYLES
// ======================================================

(function socialhubInjectStyles() {

    const style =
        document.createElement("style");

    style.textContent = `

/* Friends modal */
.socialhub-friends-modal {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    z-index: 9999;
}

.socialhub-friends-box {
    width: 100%;
    max-width: 480px;
    max-height: 85vh;
    overflow-y: auto;
    background: var(--card-bg, #ffffff);
    border-radius: 14px;
    padding: 22px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
}

.socialhub-friends-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
}

.socialhub-friends-header h2 {
    margin: 0;
    font-size: 22px;
}

.socialhub-friends-close {
    width: 36px;
    height: 36px;
    border: none;
    border-radius: 50%;
    background: #e4e6eb;
    cursor: pointer;
    font-size: 17px;
}

.socialhub-friends-tabs {
    display: flex;
    gap: 6px;
    margin-bottom: 16px;
    border-bottom: 1px solid var(--border, #dddfe2);
    padding-bottom: 10px;
}

.socialhub-friends-tabs button {
    border: none;
    background: transparent;
    padding: 9px 14px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    font-size: 13px;
    color: var(--muted, #65676b);
}

.socialhub-friends-tabs button.active {
    background: #e7f3ff;
    color: #1877f2;
}

.socialhub-friends-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.socialhub-user-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px;
    border-radius: 10px;
    background: var(--hover, #f2f3f5);
}

.socialhub-user-row .avatar {
    cursor: pointer;
}

.socialhub-user-info {
    flex: 1;
    min-width: 0;
    cursor: pointer;
}

.socialhub-user-info strong {
    display: block;
    font-size: 14px;
}

.socialhub-user-info small {
    display: block;
    color: var(--muted, #65676b);
    font-size: 12px;
    margin-top: 2px;
}

.socialhub-user-actions {
    display: flex;
    gap: 6px;
    flex-shrink: 0;
}

.socialhub-user-actions button {
    border: none;
    border-radius: 8px;
    padding: 8px 12px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
}

.socialhub-btn-primary {
    background: #1877f2;
    color: #fff;
}

.socialhub-btn-danger {
    background: #ff4d4f;
    color: #fff;
}

.socialhub-btn-soft {
    background: #e4e6eb;
    color: #1c1e21;
}

/* Suggestion buttons */
.suggestion .socialhub-add-friend {
    border: none;
    background: #e7f3ff;
    color: #1877f2;
    width: 32px;
    height: 32px;
    border-radius: 7px;
    cursor: pointer;
    font-size: 15px;
}

/* Post header link */
.socialhub-profile-link {
    cursor: pointer;
}

.socialhub-profile-link:hover .post-user-name {
    color: #1877f2;
}

body.dark-mode .socialhub-friends-close,
body.dark-mode .socialhub-btn-soft {
    background: #3a3b3c;
    color: #e4e6eb;
}

/* Posts / Videos tabs on user profile */
.up-posts-tabs {
    display: flex;
    gap: 8px;
    padding: 0 16px 10px;
    border-bottom: 1px solid #e4e6eb;
}

.up-posts-tab {
    border: none;
    background: #e4e6eb;
    color: #1c1e21;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
}

.up-posts-tab.active {
    background: #1877f2;
    color: #fff;
}

body.dark-mode .up-posts-tabs {
    border-bottom-color: #3a3b3c;
}

body.dark-mode .up-posts-tab {
    background: #3a3b3c;
    color: #e4e6eb;
}

body.dark-mode .up-posts-tab.active {
    background: #1877f2;
    color: #fff;
}

/* Block button on user profile */
.socialhub-block-btn {
    border: 1.5px solid #d4d7dd;
    background: transparent;
    color: #1c1e21;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 13.5px;
    font-weight: 700;
    cursor: pointer;
}

.socialhub-block-btn:hover {
    background: #f0f2f5;
}

.socialhub-block-btn.blocked {
    background: #e7f3ff;
    border-color: #1877f2;
    color: #1877f2;
}

.socialhub-blocked-note {
    color: #e41e3f;
    font-size: 14px;
    font-weight: 700;
    margin: 0;
}

body.dark-mode .socialhub-block-btn {
    border-color: #4e4f50;
    color: #e4e6eb;
}

body.dark-mode .socialhub-block-btn:hover {
    background: #3a3b3c;
}
`;

    document.head.appendChild(style);

})();


// ======================================================
// 1. HELPERS
// ======================================================

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
                style="
                    width:100%;
                    height:100%;
                    object-fit:cover;
                    border-radius:50%;
                "
            >
        `;
    }

    return "👤";
}


// Dark mode fallback for user-profile.html
if (typeof window.toggleDarkMode === "undefined") {

    window.toggleDarkMode = function() {

        document.body.classList.toggle("dark-mode");

        localStorage.setItem(
            "darkMode",
            document.body.classList.contains("dark-mode")
        );
    };
}


// ======================================================
// 2. FRIEND STATE + ACTIONS
// ======================================================

async function socialhubFriendState(userId) {

    const me =
        await socialhubGetMe();

    if (!me || userId === me.id) {

        return { state: "none", row: null };
    }

    const {
        data,
        error
    } = await db
        .from("friendships")
        .select("*")
        .in("requester_id", [me.id, userId])
        .in("addressee_id", [me.id, userId]);

    if (error || !data) {

        return { state: "none", row: null };
    }

    const row =
        data.find(
            friendship =>
                (friendship.requester_id === me.id &&
                 friendship.addressee_id === userId) ||
                (friendship.requester_id === userId &&
                 friendship.addressee_id === me.id)
        );

    if (!row) {

        return { state: "none", row: null };
    }

    if (row.status === "accepted") {

        return { state: "friends", row: row };
    }

    if (row.status === "pending") {

        if (row.requester_id === me.id) {

            return { state: "requested", row: row };
        }

        return { state: "received", row: row };
    }

    return { state: "none", row: row };
}


async function socialhubAddFriend(userId, button) {

    const me =
        await socialhubGetMe();

    if (!me) {

        alert("Please login first.");

        return;
    }

    if (userId === me.id) {

        alert("You can't add yourself.");

        return;
    }

    const {
        error
    } = await db
        .from("friendships")
        .insert({
            requester_id: me.id,
            addressee_id: userId,
            status: "pending"
        });

    if (error) {

        console.error(
            "❌ Add friend error:",
            error
        );

        if (error.code === "23505") {

            alert("Friend request already sent.");

        } else {

            alert(
                "Could not send request.\n\n" +
                error.message
            );
        }

        return;
    }

    alert("Friend request sent! ✅");

    if (button) {

        button.textContent = "✓ Requested";

        button.disabled = true;
    }

    // Notify the addressee
    if (typeof socialhubNotify === "function") {

        await socialhubNotify(
            userId,
            me.id,
            "friend_request",
            null,
            null
        );
    }

    socialhubUpdateFriendCounts();
}


async function socialhubCancelFriend(userId, button) {

    const me =
        await socialhubGetMe();

    if (!me) {
        return;
    }

    await db
        .from("friendships")
        .delete()
        .eq("requester_id", me.id)
        .eq("addressee_id", userId);

    alert("Request cancelled.");

    if (button) {

        button.textContent = "➕ Add Friend";

        button.disabled = false;
    }

    socialhubUpdateFriendCounts();
}


async function socialhubAcceptFriend(userId, button) {

    const me =
        await socialhubGetMe();

    if (!me) {
        return;
    }

    const {
        error
    } = await db
        .from("friendships")
        .update({ status: "accepted" })
        .eq("requester_id", userId)
        .eq("addressee_id", me.id);

    if (error) {

        alert(
            "Could not accept request.\n\n" +
            error.message
        );

        return;
    }

    alert("You are now friends! 🎉");

    // Notify the requester
    if (typeof socialhubNotify === "function") {

        await socialhubNotify(
            userId,
            me.id,
            "friend_accepted",
            null,
            null
        );
    }

    socialhubUpdateFriendCounts();
}


async function socialhubDeclineFriend(userId, button) {

    const me =
        await socialhubGetMe();

    if (!me) {
        return;
    }

    await db
        .from("friendships")
        .delete()
        .eq("requester_id", userId)
        .eq("addressee_id", me.id);

    alert("Request declined.");
}


async function socialhubUnfriend(userId, button) {

    const me =
        await socialhubGetMe();

    if (!me) {
        return;
    }

    await db
        .from("friendships")
        .delete()
        .or(
            `and(requester_id.eq.${me.id},addressee_id.eq.${userId}),` +
            `and(requester_id.eq.${userId},addressee_id.eq.${me.id})`
        );

    alert("Unfriended.");

    socialhubUpdateFriendCounts();
}


// ======================================================
// 2b. BLOCK / UNBLOCK
// ======================================================

async function socialhubToggleBlock(userId, button) {

    const me =
        await socialhubGetMe();

    if (!me) {
        return;
    }

    if (userId === me.id) {

        alert("You can't block yourself.");

        return;
    }

    const isBlocked =
        button && button.dataset.blocked === "1";

    if (isBlocked) {

        const { error } =
            await db
                .from("blocks")
                .delete()
                .eq("blocker_id", me.id)
                .eq("user_id", userId);

        if (error) {

            console.error("❌ Unblock error:", error);

            alert("Could not unblock: " + error.message);

            return;
        }

        alert("User unblocked.");

        if (button) {

            button.innerText = "🚫 Block";
            button.classList.remove("blocked");
            button.dataset.blocked = "";
        }

        return;
    }

    const ok =
        confirm(
            "Block this user?\n\n" +
            "They won't see your posts, and " +
            "their posts will be hidden from you."
        );

    if (!ok) {
        return;
    }

    // Remove any existing friendship between us
    await db
        .from("friendships")
        .delete()
        .or(
            `and(requester_id.eq.${me.id},addressee_id.eq.${userId}),` +
            `and(requester_id.eq.${userId},addressee_id.eq.${me.id})`
        );

    // Also remove any pending friend requests
    await db
        .from("friend_requests")
        .delete()
        .or(
            `and(sender_id.eq.${me.id},receiver_id.eq.${userId}),` +
            `and(sender_id.eq.${userId},receiver_id.eq.${me.id})`
        );

    const { error } =
        await db
            .from("blocks")
            .insert({
                blocker_id: me.id,
                user_id: userId
            });

    if (error) {

        console.error("❌ Block error:", error);

        alert("Could not block: " + error.message);

        return;
    }

    alert("User blocked.");

    if (button) {

        button.innerText = "🚫 Blocked";
        button.classList.add("blocked");
        button.dataset.blocked = "1";
    }
}


// ======================================================
// 3. FRIEND COUNT
// ======================================================

async function socialhubUpdateFriendCounts() {

    const counters =
        document.querySelectorAll(".friends-count");

    if (counters.length === 0) {
        return;
    }

    const me =
        await socialhubGetMe();

    if (!me) {
        return;
    }

    const {
        data,
        error
    } = await db
        .from("friendships")
        .select("id")
        .eq("status", "accepted")
        .or(
            `requester_id.eq.${me.id},` +
            `addressee_id.eq.${me.id}`
        );

    if (error) {
        return;
    }

    const count =
        (data || []).length;

    counters.forEach(counter => {

        counter.innerText = count;
    });
}


// ======================================================
// 4. FRIENDS MODAL
// ======================================================

function socialhubOpenFriendsModal() {

    const existing =
        document.querySelector(".socialhub-friends-modal");

    if (existing) {
        existing.remove();
    }

    const modal =
        document.createElement("div");

    modal.className = "socialhub-friends-modal";

    modal.innerHTML = `

        <div class="socialhub-friends-box">

            <div class="socialhub-friends-header">

                <h2>Friends</h2>

                <button
                    type="button"
                    class="socialhub-friends-close"
                >
                    ✕
                </button>

            </div>

            <div class="socialhub-friends-tabs">

                <button
                    type="button"
                    data-tab="accepted"
                    class="active"
                >
                    Friends
                </button>

                <button
                    type="button"
                    data-tab="received"
                >
                    Requests
                </button>

                <button
                    type="button"
                    data-tab="sent"
                >
                    Sent
                </button>

            </div>

            <div class="socialhub-friends-list">

                <p class="empty-message">
                    Loading...
                </p>

            </div>

        </div>
    `;

    document.body.appendChild(modal);

    // Close button
    modal
        .querySelector(".socialhub-friends-close")
        .addEventListener("click", () => modal.remove());

    // Close on outside click
    modal.addEventListener("click", event => {

        if (event.target === modal) {

            modal.remove();
        }
    });

    // Tabs
    modal
        .querySelectorAll(".socialhub-friends-tabs button")
        .forEach(tab => {

            tab.addEventListener("click", () => {

                modal
                    .querySelectorAll(".socialhub-friends-tabs button")
                    .forEach(item => item.classList.remove("active"));

                tab.classList.add("active");

                socialhubRenderFriendsTab(
                    tab.dataset.tab,
                    modal
                );
            });
        });

    socialhubRenderFriendsTab("accepted", modal);
}


async function socialhubRenderFriendsTab(status, modal) {

    const list =
        modal.querySelector(".socialhub-friends-list");

    list.innerHTML = `
        <p class="empty-message">
            Loading...
        </p>
    `;

    const me =
        await socialhubGetMe();

    if (!me) {

        list.innerHTML = `
            <p class="empty-message">
                Please login first.
            </p>
        `;

        return;
    }

    let query;

    if (status === "accepted") {

        query = db
            .from("friendships")
            .select("*")
            .eq("status", "accepted")
            .or(
                `requester_id.eq.${me.id},` +
                `addressee_id.eq.${me.id}`
            );

    } else if (status === "received") {

        query = db
            .from("friendships")
            .select("*")
            .eq("status", "pending")
            .eq("addressee_id", me.id);

    } else {

        query = db
            .from("friendships")
            .select("*")
            .eq("status", "pending")
            .eq("requester_id", me.id);
    }

    const {
        data: rows,
        error
    } = await query;

    if (error || !rows || rows.length === 0) {

        list.innerHTML = `
            <p class="empty-message">
                Nothing here yet.
            </p>
        `;

        return;
    }

    // Other user ids
    const otherIds =
        rows.map(row =>
            row.requester_id === me.id
                ? row.addressee_id
                : row.requester_id
        );

    const {
        data: profiles,
        error: profileError
    } = await db
        .from("profiles")
        .select("id, full_name, username, avatar_url")
        .in("id", otherIds);

    if (profileError || !profiles) {

        list.innerHTML = `
            <p class="empty-message">
                Could not load friends.
            </p>
        `;

        return;
    }

    const profileMap = new Map();

    profiles.forEach(profile => {

        profileMap.set(profile.id, profile);
    });

    list.innerHTML = "";

    rows.forEach(row => {

        const otherId =
            row.requester_id === me.id
                ? row.addressee_id
                : row.requester_id;

        const profile =
            profileMap.get(otherId);

        const name =
            profile?.full_name || "SocialHub User";

        const username =
            profile?.username || "user";

        const rowElement =
            document.createElement("div");

        rowElement.className = "socialhub-user-row";

        let actionHTML = "";

        if (status === "accepted") {

            actionHTML = `
                <button
                    class="socialhub-btn-danger"
                    onclick="socialhubUnfriend(
                        '${otherId}',
                        this
                    )"
                >
                    Unfriend
                </button>
            `;

        } else if (status === "received") {

            actionHTML = `
                <button
                    class="socialhub-btn-primary"
                    onclick="socialhubAcceptFriend(
                        '${otherId}',
                        this
                    )"
                >
                    ✓ Accept
                </button>

                <button
                    class="socialhub-btn-soft"
                    onclick="socialhubDeclineFriend(
                        '${otherId}',
                        this
                    )"
                >
                    ✕
                </button>
            `;

        } else {

            actionHTML = `
                <button
                    class="socialhub-btn-soft"
                    onclick="socialhubCancelFriend(
                        '${otherId}',
                        this
                    )"
                >
                    Cancel
                </button>
            `;
        }

        rowElement.innerHTML = `

            <div class="avatar">
                ${socialhubAvatarHTML(profile)}
            </div>

            <div
                class="socialhub-user-info"
                onclick="location.href='user-profile.html?user=${otherId}'"
            >
                <strong>
                    ${socialhubEscape(name)}
                </strong>

                <small>
                    @${socialhubEscape(username)}
                </small>
            </div>

            <div class="socialhub-user-actions">
                ${actionHTML}
            </div>
        `;

        list.appendChild(rowElement);
    });
}


// ======================================================
// 5. SUGGESTIONS (PEOPLE YOU MAY KNOW)
// ======================================================

async function socialhubLoadSuggestions() {

    const card =
        [...document.querySelectorAll(".side-card")]
            .find(
                element =>
                    element.querySelector(
                        ".side-card-title h3"
                    )?.textContent.includes(
                        "Suggested Friends"
                    ) ||
                    element.querySelector(
                        ".side-card-title h3"
                    )?.textContent.includes(
                        "People You May Know"
                    )
            );

    if (!card) {
        return;
    }

    if (card.dataset.socialhubSuggestions) {
        return;
    }

    card.dataset.socialhubSuggestions = "1";

    // Remove the static demo suggestions
    card
        .querySelectorAll(".suggestion")
        .forEach(element => element.remove());

    const me =
        await socialhubGetMe();

    if (!me) {
        return;
    }

    const {
        data: profiles,
        error
    } = await db
        .from("profiles")
        .select("id, full_name, username, avatar_url");

    if (error || !profiles) {
        return;
    }

    const {
        data: friendships
    } = await db
        .from("friendships")
        .select("*")
        .or(
            `requester_id.eq.${me.id},` +
            `addressee_id.eq.${me.id}`
        );

    const related = new Set();

    (friendships || []).forEach(friendship => {

        related.add(friendship.requester_id);
        related.add(friendship.addressee_id);
    });

    const candidates =
        profiles
            .filter(profile =>
                profile.id !== me.id &&
                !related.has(profile.id)
            )
            .slice(0, 5);

    if (candidates.length === 0) {

        const message =
            document.createElement("p");

        message.className = "empty-message";

        message.textContent =
            "No suggestions right now.";

        card.appendChild(message);

        return;
    }

    candidates.forEach(profile => {

        const suggestion =
            document.createElement("div");

        suggestion.className = "suggestion";

        suggestion.innerHTML = `

            <div
                class="suggestion-avatar"
                onclick="location.href='user-profile.html?user=${profile.id}'"
                style="cursor:pointer"
            >
                ${socialhubAvatarHTML(profile)}
            </div>

            <div
                class="suggestion-info"
                onclick="location.href='user-profile.html?user=${profile.id}'"
                style="cursor:pointer"
            >
                <strong>
                    ${socialhubEscape(profile.full_name || "User")}
                </strong>

                <small>
                    @${socialhubEscape(profile.username || "user")}
                </small>
            </div>

            <button
                type="button"
                class="socialhub-add-friend"
                title="Add Friend"
                onclick="socialhubAddFriend(
                    '${profile.id}',
                    this
                )"
            >
                ➕
            </button>
        `;

        card.appendChild(suggestion);
    });
}


// ======================================================
// 5b. YOUR FRIENDS WIDGET (dashboard feed side)
// ======================================================

function socialhubRefreshFriendsDots() {

    const online =
        window.socialhubOnlineUsers || new Set();

    document
        .querySelectorAll(".socialhub-friend-row")
        .forEach(row => {

            const avatar =
                row.querySelector(
                    ".socialhub-friend-avatar"
                );

            if (avatar) {

                avatar.classList.toggle(
                    "online",
                    online.has(row.dataset.userId)
                );
            }
        });
}


async function socialhubRenderFriendsWidget() {

    const widget =
        document.querySelector(".socialhub-friends-widget");

    if (!widget) {
        return;
    }

    if (widget.dataset.socialhubFriendsReady) {
        return;
    }

    widget.dataset.socialhubFriendsReady = "1";

    const me =
        await socialhubGetMe();

    if (!me) {
        return;
    }

    const {
        data: friendships
    } = await db
        .from("friendships")
        .select("*")
        .eq("status", "accepted")
        .or(
            `requester_id.eq.${me.id},` +
            `addressee_id.eq.${me.id}`
        );

    const friendIds =
        (friendships || [])
            .map(friendship =>
                friendship.requester_id === me.id
                    ? friendship.addressee_id
                    : friendship.requester_id
            )
            .filter(Boolean);

    if (friendIds.length === 0) {

        widget.innerHTML = `
            <p class="empty-message">
                No friends yet.
            </p>
        `;

        return;
    }

    const {
        data: profiles
    } = await db
        .from("profiles")
        .select("id, full_name, username, avatar_url")
        .in("id", friendIds);

    widget.innerHTML = "";

    const online =
        window.socialhubOnlineUsers || new Set();

    (profiles || [])
        .slice(0, 6)
        .forEach(profile => {

            const row =
                document.createElement("div");

            row.className = "socialhub-friend-row";

            row.dataset.userId = profile.id;

            row.innerHTML = `

                <div class="socialhub-friend-avatar${online.has(profile.id) ? " online" : ""}">
                    ${socialhubAvatarHTML(profile)}
                </div>

                <div class="socialhub-friend-info">
                    <strong>${socialhubEscape(profile.full_name || "User")}</strong>
                    <small>@${socialhubEscape(profile.username || "user")}</small>
                </div>

                <button
                    type="button"
                    class="socialhub-friend-chat"
                    title="Message"
                >
                    💬
                </button>
            `;

            row
                .querySelector(".socialhub-friend-chat")
                .addEventListener("click", event => {

                    event.stopPropagation();

                    if (typeof socialhubOpenChatPopup === "function") {

                        socialhubOpenChatPopup(profile.id);

                    } else {

                        window.location.href =
                            `user-profile.html?user=${profile.id}`;
                    }
                });

            row.addEventListener("click", () => {

                window.location.href =
                    `user-profile.html?user=${profile.id}`;
            });

            widget.appendChild(row);
        });
}


// ======================================================
// 6. POST HEADER -> PROFILE LINKS (HOME FEED)
// ======================================================

async function socialhubSetupPostLinks() {

    const container =
        document.getElementById("posts");

    if (!container) {
        return;
    }

    const articles =
        container.querySelectorAll(".post");

    if (articles.length === 0) {
        return;
    }

    const {
        data: posts,
        error
    } = await db
        .from("posts")
        .select("id, user_id")
        .order("created_at", {
            ascending: false
        });

    if (error || !posts) {
        return;
    }

    articles.forEach((article, index) => {

        const post =
            posts[index];

        if (!post) {
            return;
        }

        const header =
            article.querySelector(".post-header");

        if (!header || header.dataset.socialhubLinked) {
            return;
        }

        header.dataset.socialhubLinked = "1";

        header.classList.add("socialhub-profile-link");

        header.addEventListener("click", async () => {

            if (!post.user_id) {
                return;
            }

            const me =
                await socialhubGetMe();

            if (me && post.user_id === me.id) {

                window.location.href = "profile.html";

            } else {

                window.location.href =
                    `user-profile.html?user=${post.user_id}`;
            }
        });
    });
}


// ======================================================
// 7. USER PROFILE PAGE (user-profile.html)
// ======================================================

async function loadUserProfilePage() {

    const params =
        new URLSearchParams(window.location.search);

    const userId =
        params.get("user");

    const me =
        await socialhubGetMe();

    if (!me) {

        window.location.href = "login.html";

        return;
    }

    if (!userId) {

        window.location.href = "index.html";

        return;
    }

    const container =
        document.querySelector(".profile-container");

    if (!container) {
        return;
    }

    const {
        data: profile,
        error
    } = await db
        .from("profiles")
        .select(
            "id, username, full_name, bio, avatar_url, location, work, education, website"
        )
        .eq("id", userId)
        .single();

    if (error || !profile) {

        container.innerHTML = `
            <div class="profile-card">
                <p class="empty-message">
                    User not found.
                </p>
            </div>
        `;

        return;
    }

    // ---------- BASIC INFO ----------

    document.getElementById("upName").innerText =
        profile.full_name || "User";

    document.getElementById("upUsername").innerText =
        `@${profile.username || "user"}`;

    // ---------- COVER NAME (Facebook style) ----------

    const upCoverNameText =
        document.getElementById("upCoverNameText");

    if (upCoverNameText) {

        upCoverNameText.innerText =
            profile.full_name || "User";
    }

    const upCoverUsername =
        document.getElementById("upCoverUsername");

    if (upCoverUsername) {

        upCoverUsername.innerText =
            `@${profile.username || "user"}`;
    }

    document.getElementById("upBio").innerText =
        profile.bio || "No bio added yet.";

    document.getElementById("upLocation").innerText =
        profile.location || "Not added";

    document.getElementById("upWork").innerText =
        profile.work || "Not added";

    document.getElementById("upEducation").innerText =
        profile.education || "Not added";

    document.getElementById("upWebsite").innerText =
        profile.website || "Not added";

    if (profile.avatar_url) {

        const photo =
            document.getElementById("upPhoto");

        photo.innerHTML =
            socialhubAvatarHTML(profile);
    }

    // ---------- FRIEND BUTTON ----------

    const { state } =
        await socialhubFriendState(userId);

    let amIBlocked =
        false;

    let haveIBlocked =
        false;

    if (me && me.id !== userId) {

        const [
            a,
            b
        ] = await Promise.all([
            db
                .from("blocks")
                .select("id")
                .eq("blocker_id", me.id)
                .eq("user_id", userId)
                .limit(1),
            db
                .from("blocks")
                .select("id")
                .eq("blocker_id", userId)
                .eq("user_id", me.id)
                .limit(1)
        ]);

        haveIBlocked =
            a.data && a.data.length > 0;

        amIBlocked =
            b.data && b.data.length > 0;
    }

    const friendButtonArea =
        document.getElementById("upFriendButton");

    friendButtonArea.innerHTML = `

        ${
            amIBlocked
                ? `
                    <p class="socialhub-blocked-note">
                        🚫 This user has blocked you.
                    </p>
                `
                : state === "friends"
                    ? `
                        <button
                            class="fb-friends-btn"
                            onclick="socialhubUnfriend(
                                '${userId}',
                                this
                            )"
                            title="Friends"
                        >
                            ✓ Friends
                        </button>
                    `
                    : state === "requested"
                        ? `
                            <button
                                onclick="socialhubCancelFriend(
                                    '${userId}',
                                    this
                                )"
                            >
                                Cancel Request
                            </button>
                        `
                        : state === "received"
                            ? `
                                <button
                                    class="primary-btn"
                                    onclick="socialhubAcceptFriend(
                                        '${userId}',
                                        this
                                    )"
                                >
                                    ✓ Accept
                                </button>

                            <button
                                onclick="socialhubDeclineFriend(
                                    '${userId}',
                                    this
                                )"
                            >
                                ✕ Decline
                            </button>
                        `
                        : `
                            <button
                                class="primary-btn"
                                onclick="socialhubAddFriend(
                                    '${userId}',
                                    this
                                )"
                            >
                                ➕ Add Friend
                            </button>
                        `
        }

        ${
            me && userId === me.id
                ? `
                    <button
                        class="primary-btn"
                        onclick="location.href='profile.html'"
                    >
                        ✏️ Edit My Profile
                    </button>
                `
                : amIBlocked
                    ? ""
                    : `
                        <button
                            class="fb-white-btn"
                            onclick="socialhubOpenChatPopup('${userId}')"
                        >
                            💬 Message
                        </button>
                    `
        }
    `;

    // ---------- MORE (⋯) MENU ----------

    const moreWrap =
        document.getElementById("upMoreWrap");

    const moreMenu =
        document.getElementById("upMoreMenu");

    if (moreWrap && moreMenu) {

        const canBlock =
            !amIBlocked &&
            !(me && userId === me.id);

        const isFriend =
            state === "friends";

        if (canBlock || isFriend) {

            moreWrap.style.display = "inline-block";

            moreMenu.innerHTML = `
                ${
                    isFriend
                        ? `
                            <button
                                type="button"
                                onclick="socialhubUpMenuUnfriend(
                                    '${userId}'
                                )"
                            >
                                👋 Unfriend
                            </button>
                        `
                        : ""
                }
                ${
                    canBlock
                        ? `
                            <button
                                type="button"
                                class="socialhub-block-btn ${
                                    haveIBlocked ? "blocked" : ""
                                }"
                                data-blocked="${
                                    haveIBlocked ? "1" : ""
                                }"
                                onclick="socialhubToggleBlock(
                                    '${userId}',
                                    this
                                )"
                            >
                                ${
                                    haveIBlocked
                                        ? "🚫 Unblock"
                                        : "🚫 Block"
                                }
                            </button>
                        `
                        : ""
                }
            `;

        } else {

            moreWrap.style.display = "none";
        }
    }

    // ---------- FRIEND COUNT ----------

    const {
        data: friendshipRows
    } = await db
        .from("friendships")
        .select("*")
        .eq("status", "accepted")
        .or(
            `requester_id.eq.${userId},` +
            `addressee_id.eq.${userId}`
        );

    const friendCount =
        (friendshipRows || []).length;

    const upFriendsCount =
        document.getElementById("upFriendsCount");

    if (upFriendsCount) {

        upFriendsCount.innerText =
            friendCount;
    }

    const statFriends =
        document.getElementById("upStatFriends");

    if (statFriends) {

        statFriends.innerText =
            String(friendCount);
    }

    // ---------- MUTUAL FRIENDS ----------

    const mutualEl =
        document.getElementById("upMutual");

    if (mutualEl && me && me.id !== userId) {

        const {
            data: myRows
        } = await db
            .from("friendships")
            .select("requester_id, addressee_id")
            .eq("status", "accepted")
            .or(
                `requester_id.eq.${me.id},` +
                `addressee_id.eq.${me.id}`
            );

        const mySet = new Set();

        (myRows || []).forEach(row => {

            mySet.add(
                row.requester_id === me.id
                    ? row.addressee_id
                    : row.requester_id
            );
        });

        const {
            data: theirRows
        } = await db
            .from("friendships")
            .select("requester_id, addressee_id")
            .eq("status", "accepted")
            .or(
                `requester_id.eq.${userId},` +
                `addressee_id.eq.${userId}`
            );

        const theirSet = new Set();

        (theirRows || []).forEach(row => {

            theirSet.add(
                row.requester_id === userId
                    ? row.addressee_id
                    : row.requester_id
            );
        });

        let mutual = 0;

        mySet.forEach(id => {

            if (theirSet.has(id)) {
                mutual++;
            }
        });

        if (mutual > 0) {

            mutualEl.textContent =
                `${mutual} mutual ` +
                (mutual === 1 ? "friend" : "friends");

            mutualEl.style.display = "inline";
        }
    }

    // ---------- THEIR POSTS ----------

    await loadUserProfilePosts(userId);
}

async function loadUserProfilePosts(userId) {

    const postsContainer =
        document.getElementById("upPosts");

    if (!postsContainer) {
        return;
    }

    const {
        data: posts,
        error
    } = await db
        .from("posts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", {
            ascending: false
        });

    if (error) {

        console.error(
            "❌ User posts error:",
            error
        );

        return;
    }

    if (!posts || posts.length === 0) {

        postsContainer.innerHTML = `
            <p
                class="empty-message"
                style="grid-column:1/-1;"
            >
                No posts yet.
            </p>
        `;

        return;
    }

    const { data: upProfile, error: profileError } =
        await db
            .from("profiles")
            .select("id, full_name, username, avatar_url")
            .eq("id", userId)
            .single();

    if (profileError) {
        console.error("❌ User profile error:", profileError);
    }

    socialhubUpPostsCache = {
        posts,
        profile: upProfile || null
    };

    const statPosts =
        document.getElementById("upStatPosts");

    if (statPosts) {

        statPosts.innerText =
            String(posts.length);
    }

    postsContainer.innerHTML = "";

    postsContainer.classList.add("up-posts-list");

    const fallbackProfile = {
        full_name:
            document.getElementById("upName")?.innerText || "User",
        username:
            document.getElementById("upUsername")?.innerText || "@user",
        avatar_url: ""
    };

    const avatar =
        document.getElementById("upPhoto");

    const photoImg =
        avatar?.querySelector("img");

    if (photoImg) {

        fallbackProfile.avatar_url = photoImg.src;
    }

    posts.forEach(post => {

        postsContainer.appendChild(
            socialhubBuildUserPostArticle(
                post,
                upProfile || fallbackProfile
            )
        );
    });
}


// ======================================================
// 7c. USER PROFILE POSTS / VIDEOS TAB SWITCH
// ======================================================

let socialhubUpCurrentTab = "all";


function socialhubUpToggleMore(event) {

    event.stopPropagation();

    const menu =
        document.getElementById("upMoreMenu");

    if (!menu) {
        return;
    }

    menu.style.display =
        menu.style.display === "none"
            ? "block"
            : "none";
}


async function socialhubUpMenuUnfriend(userId) {

    const me =
        await socialhubGetMe();

    if (!me) {
        return;
    }

    if (!confirm("Unfriend this person?")) {
        return;
    }

    await db
        .from("friendships")
        .delete()
        .or(
            `and(requester_id.eq.${me.id},addressee_id.eq.${userId}),` +
            `and(requester_id.eq.${userId},addressee_id.eq.${me.id})`
        );

    socialhubUpdateFriendCounts();

    await loadUserProfilePage();
}


document.addEventListener("click", event => {

    const moreMenu =
        document.getElementById("upMoreMenu");

    if (
        moreMenu &&
        !event.target.closest("#upMoreWrap")
    ) {
        moreMenu.style.display = "none";
    }
});


function socialhubSwitchUpTab(name) {

    socialhubUpCurrentTab = name;

    document
        .querySelectorAll(".up-posts-tab")
        .forEach(tab => {

            tab.classList.toggle(
                "active",
                tab.dataset.upTab === name
            );
        });

    const userId =
        new URLSearchParams(
            window.location.search
        ).get("user");

    if (!userId) {
        return;
    }

    if (name === "videos") {

        socialhubLoadUserVideos(userId);

    } else {

        loadUserProfilePosts(userId);
    }
}


// ======================================================
// 7b. USER PROFILE POST TILES + LIGHTBOX (Instagram)
// ======================================================

let socialhubUpPostsCache = {
    posts: [],
    profile: null
};


async function socialhubLoadUserVideos(userId) {

    const postsContainer =
        document.getElementById("upPosts");

    if (!postsContainer) {
        return;
    }

    const {
        data: posts,
        error
    } = await db
        .from("posts")
        .select("*")
        .eq("user_id", userId)
        .not("video_url", "is", null)
        .order("created_at", {
            ascending: false
        });

    if (error) {

        console.error(
            "❌ User videos error:",
            error
        );

        return;
    }

    if (!posts || posts.length === 0) {

        postsContainer.innerHTML = `
            <p
                class="empty-message"
                style="grid-column:1/-1;"
            >
                No videos yet.
            </p>
        `;

        return;
    }

    const statPosts =
        document.getElementById("upStatPosts");

    if (statPosts) {

        statPosts.innerText =
            String(posts.length);
    }

    postsContainer.innerHTML = "";

    postsContainer.classList.remove("up-posts-list");

    posts.forEach(post => {

        postsContainer.appendChild(
            socialhubCreateUpTile(post)
        );
    });
}


function socialhubCreateUpTile(post) {

    const tile =
        document.createElement("div");

    tile.className = "profile-post-tile";

    let media = "";

    if (post.image_url) {

        media = `
            <img
                src="${socialhubEscape(post.image_url)}"
                alt="Post photo"
                loading="lazy"
            >
        `;

    } else if (post.video_url) {

        media = `
            <video
                src="${socialhubEscape(post.video_url)}"
                muted
                playsinline
                preload="metadata"
            ></video>
        `;

    } else {

        media = `
            <div class="tile-text">
                ${socialhubEscape(post.content || "")}
            </div>
        `;
    }

    tile.innerHTML = `

        <div class="tile-media">
            ${media}
        </div>

        ${
            post.video_url
                ? `<span class="profile-photo-video-badge">🎥</span>`
                : ""
        }

        <div class="tile-overlay">
            <span>
                <i class="fa-solid fa-heart"></i>
            </span>
            <span>
                <i class="fa-solid fa-comment"></i>
            </span>
        </div>
    `;

    tile.addEventListener("click", () => {

        if (post.video_url) {

            if (
                typeof socialhubWatchOpen ===
                "function"
            ) {

                socialhubWatchOpen(post.id);

                return;
            }

            location.href =
                `watch.html?video=${post.id}`;

            return;
        }

        socialhubOpenUpPostLightbox(post.id);
    });

    return tile;
}


function socialhubOpenUpPostLightbox(postId) {

    const cache =
        socialhubUpPostsCache;

    const post =
        (cache?.posts || [])
            .find(item => item.id === postId);

    if (!post) {
        return;
    }

    const modal =
        document.getElementById("upPostLightbox");

    const box =
        document.getElementById("upPostLightboxBox");

    if (!modal || !box) {
        return;
    }

    box.innerHTML = "";

    const close =
        document.createElement("button");

    close.className = "post-lightbox-close";

    close.innerHTML = "✕";

    close.addEventListener("click", () => {

        modal.classList.remove("open");

        document.body.style.overflow = "";
    });

    const article =
        socialhubBuildUserPostArticle(
            post,
            cache.profile
        );

    article.style.margin = "0";

    socialhubEnhanceUpLightboxPost(article);

    box.appendChild(article);

    box.appendChild(close);

    modal.classList.add("open");

    document.body.style.overflow = "hidden";

    // Wire up reactions + comments + manage menu
    if (
        typeof socialhubAttachReactionUI === "function"
    ) {

        socialhubAttachReactionUI();
    }

    if (
        typeof socialhubLoadInteractions === "function"
    ) {

        socialhubLoadInteractions();
    }

    if (
        typeof socialhubWatchPosts === "function"
    ) {

        socialhubWatchPosts();
    }
}


function socialhubCloseUpPostLightbox(event) {

    const modal =
        document.getElementById("upPostLightbox");

    if (!modal) {
        return;
    }

    if (event && event.target !== modal) {
        return;
    }

    modal.classList.remove("open");

    document.body.style.overflow = "";
}


// ======================================================
// 7c. USER PROFILE LIGHTBOX EXTRA FEATURES
//     (share link + save bookmark)
// ======================================================

function socialhubEnhanceUpLightboxPost(article) {

    const postId =
        article.dataset.postId;

    if (!postId) {
        return;
    }

    // ---------- SHARE: copy the post link ----------

    const shareButton =
        [...article.querySelectorAll(".post-actions button")]
            .find(button =>
                button.innerText
                    .toLowerCase()
                    .includes("share")
            );

    if (shareButton) {

        shareButton.addEventListener("click", () => {

            const link =
                window.location.origin +
                "/index.html?post=" +
                postId;

            const copied = () => {

                shareButton.innerHTML =
                    '<i class="fa-solid fa-check"></i> Link copied!';

                setTimeout(() => {

                    shareButton.innerHTML =
                        '<i class="fa-solid fa-share"></i> Share';
                }, 2000);
            };

            if (
                navigator.clipboard &&
                navigator.clipboard.writeText
            ) {

                navigator.clipboard
                    .writeText(link)
                    .then(copied)
                    .catch(() => {

                        window.prompt(
                            "Copy the post link:",
                            link
                        );
                    });

            } else {

                window.prompt(
                    "Copy the post link:",
                    link
                );
            }
        });
    }

    // ---------- SAVE: bookmark toggle ----------

    const actions =
        article.querySelector(".post-actions");

    if (
        !actions ||
        actions.querySelector(".socialhub-save-btn")
    ) {
        return;
    }

    const saveButton =
        document.createElement("button");

    saveButton.className = "socialhub-save-btn";

    saveButton.title = "Save post";

    saveButton.innerHTML =
        '<i class="fa-regular fa-bookmark"></i>';

    saveButton.addEventListener("click", async () => {

        const me =
            await socialhubGetMe();

        if (!me) {
            return;
        }

        const saved =
            saveButton.classList.contains("saved");

        if (saved) {

            const {
                error
            } = await db
                .from("saved_posts")
                .delete()
                .eq("user_id", me.id)
                .eq("post_id", postId);

            if (!error) {

                saveButton.classList.remove("saved");

                saveButton.innerHTML =
                    '<i class="fa-regular fa-bookmark"></i>';
            }

        } else {

            const {
                error
            } = await db
                .from("saved_posts")
                .insert({
                    user_id: me.id,
                    post_id: postId
                });

            if (!error) {

                saveButton.classList.add("saved");

                saveButton.innerHTML =
                    '<i class="fa-solid fa-bookmark"></i>';
            }
        }
    });

    actions.appendChild(saveButton);
}


function socialhubBuildUserPostArticle(post, profile) {

    const background =
        post.background || null;

    let textStyle = `
        margin: 0;
        line-height: 1.6;
        white-space: pre-wrap;
        overflow-wrap: break-word;
    `;

    if (background) {

        textStyle += `
            background: ${background};
            color: #ffffff;
            padding: 45px 25px;
            border-radius: 16px;
            min-height: 150px;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            font-size: 24px;
            font-weight: 600;
            box-sizing: border-box;
        `;

    } else {

        textStyle += `
            padding: 0;
            text-align: left;
            font-size: 16px;
            font-weight: 400;
        `;
    }

    let imageHTML = "";

    if (post.image_url) {

        imageHTML = `
            <div
                class="socialhub-post-image"
                style="
                    margin-bottom:14px;
                    border-radius:12px;
                    overflow:hidden;
                "
            >
                <img
                    src="${socialhubEscape(post.image_url)}"
                    alt="Post photo"
                    loading="lazy"
                    style="
                        width:100%;
                        max-height:480px;
                        object-fit:cover;
                        display:block;
                    "
                >
            </div>
        `;
    }

    let videoHTML = "";

    if (post.video_url) {

        videoHTML = `
            <div
                class="socialhub-post-video"
                style="
                    margin-bottom:14px;
                    border-radius:12px;
                    overflow:hidden;
                "
            >
                <video
                    src="${socialhubEscape(post.video_url)}"
                    controls
                    playsinline
                    preload="metadata"
                    style="
                        width:100%;
                        max-height:480px;
                        display:block;
                        background:#000;
                    "
                ></video>
            </div>
        `;
    }

    const article =
        document.createElement("article");

    article.className = "post";

    article.innerHTML = `

        <div class="post-header">

            <div class="avatar">
                ${socialhubAvatarHTML(profile)}
            </div>

            <div>

                <h3 class="post-user-name">
                    ${socialhubEscape(profile.full_name)}
                </h3>

                <small>
                    ${profile.username}
                    ·
                    ${new Date(post.created_at).toLocaleString()}
                    · 🌎

                </small>

            </div>

        </div>

        <p
            class="post-text"
            style="${textStyle}"
        >${socialhubEscape(post.content || "")}</p>

        ${imageHTML}

        ${videoHTML}

        <div class="post-stats">

            <span>
                ❤️ 0 Likes
            </span>

            <span>
                💬 0 Comments
            </span>

        </div>

        <div class="post-actions">

            <button
                class="fb-action-btn fb-like-slot"
                onclick="likePost(this)"
            >
                <i class="fa-solid fa-thumbs-up"></i>
                <span class="fb-action-label">Like</span>
            </button>

            <button
                class="fb-action-btn"
                onclick="this.closest('.post').querySelector('.comment-input').focus()"
            >
                <i class="fa-solid fa-comment"></i>
                <span class="fb-action-label">Comment</span>
            </button>

            <button
                class="fb-action-btn"
                onclick="socialhubShareDialog('${post.id}')"
            >
                <i class="fa-solid fa-share-from-square"></i>
                <span class="fb-action-label">Share</span>
            </button>

        </div>

        <div class="comment-box">

            <input
                type="text"
                placeholder="Write a comment..."
                class="comment-input"
            >

            <button
                onclick="addComment(this)"
            >
                Send
            </button>

        </div>

        <div class="comments"></div>
    `;

    article.dataset.postId = post.id;

    return article;
}


// ======================================================
// 8. AUTO-SYNC
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

    const isUserProfilePage =
        window.location.pathname
            .split("/")
            .pop() === "user-profile.html";

    // Dark mode
    const savedDarkMode =
        localStorage.getItem("darkMode");

    if (savedDarkMode === "true") {

        document.body.classList.add("dark-mode");
    }

    // User profile page
    if (isUserProfilePage) {

        loadUserProfilePage();

        return;
    }

    // Sidebar Friends button
    const sidebarButtons =
        document.querySelectorAll(".sidebar-menu button");

    const friendsButton =
        [...sidebarButtons].find(
            button =>
                button.textContent.includes("Friends")
        );

    if (
        friendsButton &&
        !friendsButton.dataset.socialhubReady
    ) {

        friendsButton.dataset.socialhubReady = "1";

        friendsButton.addEventListener(
            "click",
            socialhubOpenFriendsModal
        );
    }

    // Suggestions
    socialhubLoadSuggestions();

    // Friends widget (dashboard)
    socialhubRenderFriendsWidget();

    // Friend counts
    socialhubUpdateFriendCounts();

    // Post header links (home feed)
    const postsContainer =
        document.getElementById("posts");

    if (postsContainer) {

        const observer =
            new MutationObserver(() => {

                socialhubSetupPostLinks();
            });

        observer.observe(postsContainer, {
            childList: true,
            subtree: false
        });

        setTimeout(
            socialhubSetupPostLinks,
            2600
        );
    }

    console.log(
        "✅ Friend System activated!"
    );
});
