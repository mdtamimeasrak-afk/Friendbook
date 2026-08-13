// ======================================================
// SOCIALHUB - USER SEARCH (STEP 14)
// ======================================================
// This is a NEW file. Old code is untouched.
//
// What it does:
//   1. Typing in the topbar search box shows a live
//      dropdown with matching users (by name or
//      username). Clicking a result opens that
//      user's profile.
//   2. Pressing Enter opens search.html with full
//      results and Add Friend buttons.
//
// Setup:
//   - Add this script to index.html, profile.html,
//     user-profile.html and search.html AFTER
//     friends.js:
//
//     <script src="user-search.js"></script>
// ======================================================

var db = window.db || supabaseClient;


// ======================================================
// 1. INJECTED STYLES
// ======================================================

(function socialhubSearchInjectStyles() {

    const style =
        document.createElement("style");

    style.textContent = `

.search-box {
    position: relative;
}

.socialhub-search-dropdown {
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    width: 100%;
    min-width: 300px;
    background: var(--card-bg, #ffffff);
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
    z-index: 2000;
    overflow: hidden;
    max-height: 360px;
    overflow-y: auto;
}

.socialhub-search-result {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    cursor: pointer;
}

.socialhub-search-result:hover {
    background: var(--hover, #f2f3f5);
}

.socialhub-search-result .avatar {
    width: 38px;
    height: 38px;
    font-size: 18px;
}

.socialhub-search-result strong {
    display: block;
    font-size: 14px;
}

.socialhub-search-result small {
    display: block;
    color: var(--muted, #65676b);
    font-size: 12px;
    margin-top: 2px;
}

.socialhub-search-empty {
    padding: 14px;
    color: var(--muted, #65676b);
    font-size: 13px;
    text-align: center;
}

/* Search results page */
.search-container {
    width: 100%;
    max-width: 680px;
    margin: 0 auto;
    padding: 25px 15px 50px;
}

.search-title {
    font-size: 22px;
    margin-bottom: 18px;
}

.search-results {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.search-results .socialhub-user-row {
    background: var(--card-bg, #ffffff);
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
`;

    document.head.appendChild(style);

})();


// ======================================================
// 2. HELPERS
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


function socialhubCleanSearchQuery(value) {

    return value
        .replace(/[%_,]/g, "")
        .trim();
}


// ======================================================
// 3. SEARCH USERS
// ======================================================

async function socialhubSearchUsers(query, limit) {

    const clean =
        socialhubCleanSearchQuery(query);

    if (clean === "") {

        return [];
    }

    const {
        data,
        error
    } = await db
        .from("profiles")
        .select("id, full_name, username, avatar_url")
        .or(
            `full_name.ilike.%${clean}%,` +
            `username.ilike.%${clean}%`
        )
        .limit(limit || 6);

    if (error) {

        console.error(
            "❌ Search error:",
            error
        );

        return [];
    }

    // Hide deactivated accounts (graceful if column missing)
    let visible = data || [];

    try {

        const deactivatedData =
            await db
                .from("profiles")
                .select("id")
                .in(
                    "id",
                    visible.map(u => u.id)
                )
                .eq("deactivated", true);

        if (
            !deactivatedData.error &&
            deactivatedData.data &&
            deactivatedData.data.length > 0
        ) {

            const hidden =
                new Set(
                    deactivatedData.data.map(u => u.id)
                );

            visible =
                visible.filter(u => !hidden.has(u.id));
        }

    } catch (deactError) {

        console.warn(
            "⚠️ Deactivated filter skipped:",
            deactError
        );
    }

    return visible;
}


// ======================================================
// 4. LIVE SEARCH DROPDOWN
// ======================================================

let socialhubSearchDebounceTimer = null;


function setupLiveSearch() {

    const input =
        document.querySelector(".search-box input");

    if (!input) {
        return;
    }

    if (input.dataset.socialhubSearch) {
        return;
    }

    input.dataset.socialhubSearch = "1";

    // Dropdown container
    const dropdown =
        document.createElement("div");

    dropdown.className = "socialhub-search-dropdown";

    dropdown.style.display = "none";

    dropdown.style.width = "100%";

    input.parentNode.appendChild(dropdown);

    // Typing
    input.addEventListener("input", () => {

        clearTimeout(socialhubSearchDebounceTimer);

        const value =
            input.value.trim();

        if (value === "") {

            dropdown.style.display = "none";

            return;
        }

        socialhubSearchDebounceTimer =
            setTimeout(async () => {

                const users =
                    await socialhubSearchUsers(value, 6);

                socialhubRenderDropdown(
                    dropdown,
                    users,
                    value
                );

            }, 300);
    });

    // Enter -> search results page
    input.addEventListener("keydown", event => {

        if (event.key !== "Enter") {
            return;
        }

        const value =
            input.value.trim();

        if (value === "") {
            return;
        }

        // Open first result if shown
        const first =
            dropdown.querySelector(
                ".socialhub-search-result"
            );

        if (first && first.dataset.userId) {

            window.location.href =
                `user-profile.html?user=${first.dataset.userId}`;

        } else {

            window.location.href =
                `search.html?q=${encodeURIComponent(value)}`;
        }
    });

    // Close when clicking outside
    document.addEventListener("click", event => {

        if (
            !input.parentNode.contains(event.target)
        ) {

            dropdown.style.display = "none";
        }
    });

    // Close on Escape
    input.addEventListener("keydown", event => {

        if (event.key === "Escape") {

            dropdown.style.display = "none";

            input.blur();
        }
    });
}


function socialhubRenderDropdown(dropdown, users, query) {

    if (users.length === 0) {

        dropdown.innerHTML = `
            <div class="socialhub-search-empty">
                No users found for "${socialhubEscape(query)}"
            </div>
        `;

        dropdown.style.display = "block";

        return;
    }

    dropdown.innerHTML = "";

    users.forEach(user => {

        const result =
            document.createElement("div");

        result.className = "socialhub-search-result";

        result.dataset.userId = user.id;

        result.innerHTML = `

            <div class="avatar">
                ${socialhubAvatarHTML(user)}
            </div>

            <div>
                <strong>
                    ${socialhubEscape(user.full_name || "User")}
                </strong>

                <small>
                    @${socialhubEscape(user.username || "user")}
                </small>
            </div>
        `;

        result.addEventListener("click", () => {

            window.location.href =
                `user-profile.html?user=${user.id}`;
        });

        dropdown.appendChild(result);
    });

    dropdown.style.display = "block";
}


// ======================================================
// 5. SEARCH RESULTS PAGE (search.html)
// ======================================================

async function loadSearchResultsPage() {

    const params =
        new URLSearchParams(window.location.search);

    const query =
        params.get("q") || "";

    const me =
        await socialhubGetMe();

    if (!me) {

        window.location.href = "login.html";

        return;
    }

    const input =
        document.getElementById("searchInput");

    if (input) {

        input.value = query;
    }

    const title =
        document.getElementById("searchTitle");

    if (title) {

        title.innerText =
            query === ""
                ? "Search SocialHub"
                : `Results for "${query}"`;
    }

    const container =
        document.getElementById("searchResults");

    if (!container) {
        return;
    }

    if (query === "") {

        container.innerHTML = `
            <div class="socialhub-search-empty">
                Type a name in the search box above.
            </div>
        `;

        return;
    }

    container.innerHTML = `
        <div class="socialhub-search-empty">
            Searching...
        </div>
    `;

    const users =
        await socialhubSearchUsers(query, 30);

    if (users.length === 0) {

        container.innerHTML = `
            <div class="socialhub-search-empty">
                No users found.
            </div>
        `;

        return;
    }

    // Friend relation info (for the buttons)
    const {
        related,
        requestedByMe,
        incomingSet
    } = await socialhubGetFriendRelationInfo();

    container.innerHTML = "";

    users.forEach(user => {

        const row =
            document.createElement("div");

        row.className = "socialhub-user-row";

        let actionHTML = "";

        if (user.id === me.id) {

            actionHTML = `
                <button
                    class="socialhub-btn-soft"
                    onclick="location.href='profile.html'"
                >
                    You
                </button>
            `;

        } else if (requestedByMe.has(user.id)) {

            actionHTML = `
                <button
                    class="socialhub-btn-soft"
                    disabled
                >
                    ✓ Requested
                </button>
            `;

        } else if (incomingSet.has(user.id)) {

            actionHTML = `
                <button
                    class="socialhub-btn-primary"
                    onclick="socialhubAcceptFriend(
                        '${user.id}',
                        this
                    )"
                >
                    ✓ Accept
                </button>
            `;

        } else if (related.has(user.id)) {

            actionHTML = `
                <button
                    class="socialhub-btn-soft"
                    disabled
                >
                    ✓ Friends
                </button>
            `;

        } else {

            actionHTML = `
                <button
                    class="socialhub-btn-primary"
                    onclick="socialhubAddFriend(
                        '${user.id}',
                        this
                    )"
                >
                    ➕ Add Friend
                </button>
            `;
        }

        row.innerHTML = `

            <div
                class="avatar"
                style="cursor:pointer"
                onclick="location.href='user-profile.html?user=${user.id}'"
            >
                ${socialhubAvatarHTML(user)}
            </div>

            <div
                class="socialhub-user-info"
                onclick="location.href='user-profile.html?user=${user.id}'"
            >
                <strong>
                    ${socialhubEscape(user.full_name || "User")}
                </strong>

                <small>
                    @${socialhubEscape(user.username || "user")}
                </small>
            </div>

            <div class="socialhub-user-actions">
                ${actionHTML}
            </div>
        `;

        container.appendChild(row);
    });
}


async function socialhubGetFriendRelationInfo() {

    const related = new Set();

    const requestedByMe = new Set();

    const incomingSet = new Set();

    const me =
        await socialhubGetMe();

    if (!me) {

        return { related, requestedByMe, incomingSet };
    }

    const {
        data
    } = await db
        .from("friendships")
        .select("*")
        .or(
            `requester_id.eq.${me.id},` +
            `addressee_id.eq.${me.id}`
        );

    (data || []).forEach(friendship => {

        if (friendship.status !== "declined") {

            related.add(friendship.requester_id);
            related.add(friendship.addressee_id);
        }

        if (
            friendship.status === "pending" &&
            friendship.requester_id === me.id
        ) {

            requestedByMe.add(friendship.addressee_id);
        }

        if (
            friendship.status === "pending" &&
            friendship.addressee_id === me.id
        ) {

            incomingSet.add(friendship.requester_id);
        }
    });

    return { related, requestedByMe, incomingSet };
}


// ======================================================
// 6. AUTO-SYNC
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

    const currentPage =
        window.location.pathname
            .split("/")
            .pop() || "index.html";

    if (currentPage === "search.html") {

        loadSearchResultsPage();

        return;
    }

    setupLiveSearch();

    console.log(
        "✅ User Search activated!"
    );
});
