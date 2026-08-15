function socialhubPageId() {
    const segs =
        window.location.pathname
            .replace(/\/+$/, "")
            .split("/")
            .filter(Boolean);
    const last =
        segs[segs.length - 1] || "";
    const folder =
        segs.length >= 2 ? segs[segs.length - 2] : "";
    if (last && last.endsWith(".html") && last !== "index.html") {
        return folder + "/" + last;
    }
    return (last && last !== "index.html" ? last : folder) + "/index.html";
}


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

.search-tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
}

.search-tab {
    border: none;
    background: var(--card-bg, #ffffff);
    color: var(--text, #1c1e21);
    padding: 9px 20px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    transition: 0.12s;
}

.search-tab:hover {
    background: var(--hover, #f2f3f5);
}

.search-tab.active {
    background: #1877f2;
    color: #fff;
}

.search-section-title {
    font-size: 15px;
    font-weight: 700;
    margin: 18px 0 10px;
    color: var(--muted, #65676b);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.search-section-title i {
    color: #1877f2;
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

.socialhub-post-result {
    background: var(--card-bg, #ffffff);
    border-radius: 12px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    padding: 12px 14px;
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    transition: 0.12s;
}

.socialhub-post-result:hover {
    box-shadow: 0 4px 16px rgba(0,0,0,0.12);
}

.socialhub-post-result .pr-img {
    width: 64px;
    height: 64px;
    border-radius: 8px;
    object-fit: cover;
    flex-shrink: 0;
    background: var(--hover, #f2f3f5);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--muted, #65676b);
    font-size: 22px;
}

.socialhub-post-result .pr-body {
    flex: 1;
    min-width: 0;
}

.socialhub-post-result .pr-author {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 13px;
    font-weight: 700;
}

.socialhub-post-result .pr-author img,
.socialhub-post-result .pr-author .pr-avatar {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    object-fit: cover;
    background: #1877f2;
    color: #fff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
}

.socialhub-post-result .pr-author small {
    color: var(--muted, #65676b);
    font-weight: 400;
}

.socialhub-post-result .pr-text {
    margin: 3px 0 0;
    font-size: 13.5px;
    color: var(--text, #1c1e21);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.socialhub-post-result .pr-text em {
    color: #1877f2;
    font-style: normal;
    font-weight: 700;
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
// 3b. SEARCH POSTS
// ======================================================

async function socialhubSearchPosts(query, limit) {

    const clean =
        socialhubCleanSearchQuery(query);

    if (clean === "") {

        return [];
    }

    const {
        data,
        error
    } = await db
        .from("posts")
        .select("*")
        .ilike("content", `%${clean}%`)
        .order("created_at", { ascending: false })
        .limit(limit || 6);

    if (error) {

        console.error(
            "❌ Post search error:",
            error
        );

        return [];
    }

    const visible = [];

    for (const post of (data || [])) {

        // Skip posts by deactivated users (graceful)
        if (post.user_id) {

            try {

                const hidden =
                    await db
                        .from("profiles")
                        .select("id")
                        .eq("id", post.user_id)
                        .eq("deactivated", true)
                        .maybeSingle();

                if (
                    hidden.data &&
                    !hidden.error
                ) {
                    continue;
                }

            } catch (deactError) {

                // Column missing - ignore
            }
        }

        visible.push(post);

        if (visible.length >= (limit || 6)) {
            break;
        }
    }

    return visible;
}


async function socialhubPostResultMeta(posts) {

    const userIds =
        [...new Set(
            posts
                .map(p => p.user_id)
                .filter(Boolean)
        )];

    const pageIds =
        [...new Set(
            posts
                .map(p => p.page_id)
                .filter(Boolean)
        )];

    const profileMap = {};

    const pageMap = {};

    if (userIds.length > 0) {

        const {
            data
        } = await db
            .from("profiles")
            .select("id, full_name, avatar_url")
            .in("id", userIds);

        (data || []).forEach(p => {

            profileMap[p.id] = p;
        });
    }

    if (pageIds.length > 0) {

        const {
            data
        } = await db
            .from("pages")
            .select("id, name")
            .in("id", pageIds);

        (data || []).forEach(p => {

            pageMap[p.id] = p;
        });
    }

    return { profileMap, pageMap };
}


function socialhubPostResultHTML(post, profileMap, pageMap, query) {

    const profile =
        profileMap[post.user_id] || {};

    const page =
        pageMap[post.page_id] || null;

    const name =
        page
            ? page.name
            : profile.full_name || "@" + profile.username || "Someone";

    const isPagePost =
        Boolean(page);

    const avatar =
        isPagePost
            ? `<span class="pr-avatar">${(name || "P").charAt(0).toUpperCase()}</span>`
            : profile.avatar_url
                ? `<img src="${socialhubEscape(profile.avatar_url)}" alt="">`
                : `<span class="pr-avatar">${(name || "U").charAt(0).toUpperCase()}</span>`;

    const time =
        new Date(post.created_at).toLocaleString();

    let text =
        post.content || "";

    const cleanQuery =
        socialhubCleanSearchQuery(query);

    if (cleanQuery && text.toLowerCase().includes(cleanQuery.toLowerCase())) {

        const lower =
            text.toLowerCase();

        const idx =
            lower.indexOf(cleanQuery.toLowerCase());

        if (idx >= 0) {

            text =
                text.slice(0, idx) +
                "<em>" +
                socialhubEscape(
                    text.slice(idx, idx + cleanQuery.length)
                ) +
                "</em>" +
                socialhubEscape(
                    text.slice(idx + cleanQuery.length)
                );
        }

    } else {

        text =
            socialhubEscape(text);
    }

    const thumb =
        post.image_url
            ? `<img class="pr-img" src="${socialhubEscape(post.image_url)}" alt="">`
            : post.video_url
                ? `<div class="pr-img"><i class="fa-solid fa-play"></i></div>`
                : `<div class="pr-img"><i class="fa-solid fa-file-lines"></i></div>`;

    const target =
        isPagePost
            ? `../pages/page.html?id=${post.page_id}`
            : `../profile/user-profile.html?user=${post.user_id}`;

    return `
        <div
            class="socialhub-post-result"
            onclick="location.href='${target}'"
        >
            ${thumb}

            <div class="pr-body">

                <div class="pr-author">
                    ${avatar}
                    ${socialhubEscape(name)}
                    <small>· ${time}</small>
                </div>

                <p class="pr-text">${text || "(Photo post)"}</p>

            </div>
        </div>
    `;
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

                const [users, posts] =
                    await Promise.all([
                        socialhubSearchUsers(value, 5),
                        socialhubSearchPosts(value, 3)
                    ]);

                socialhubRenderDropdown(
                    dropdown,
                    users,
                    posts,
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
                `../profile/user-profile.html?user=${first.dataset.userId}`;

        } else {

            window.location.href =
                `../search/index.html?q=${encodeURIComponent(value)}`;
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


async function socialhubRenderDropdown(dropdown, users, posts, query) {

    if ((users.length + posts.length) === 0) {

        dropdown.innerHTML = `
            <div class="socialhub-search-empty">
                No results for "${socialhubEscape(query)}"
            </div>
        `;

        dropdown.style.display = "block";

        return;
    }

    dropdown.innerHTML = "";

    const { profileMap, pageMap } =
        await socialhubPostResultMeta(posts || []);

    // Posts first (content matches)
    if (posts && posts.length > 0) {

        const postTitle =
            document.createElement("div");

        postTitle.className = "socialhub-search-empty";

        postTitle.style.cssText =
            "text-align:left;font-weight:700;font-size:12px;color:#1877f2;padding:10px 12px 4px;";

        postTitle.textContent = "POSTS";

        dropdown.appendChild(postTitle);

        posts.forEach(post => {

            const div =
                document.createElement("div");

            div.className = "socialhub-search-result";

            div.innerHTML = `

                <div class="avatar">
                    ${
                        post.image_url
                            ? `<img src="${socialhubEscape(post.image_url)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:10px;">`
                            : '<i class="fa-solid fa-file-lines" style="color:#65676b;font-size:16px;"></i>'
                    }
                </div>

                <div>
                    <strong>
                        ${
                            socialhubEscape(
                                (post.page_id ? (pageMap[post.page_id]?.name || "Page") : (profileMap[post.user_id]?.full_name || "Someone"))
                            )
                        }
                    </strong>

                    <small>
                        ${socialhubEscape((post.content || "(Photo post)").slice(0, 60))}
                    </small>
                </div>
            `;

            const target =
                post.page_id
                    ? `../pages/page.html?id=${post.page_id}`
                    : `../profile/user-profile.html?user=${post.user_id}`;

            div.addEventListener("click", () => {

                window.location.href = target;
            });

            dropdown.appendChild(div);
        });
    }

    // Users
    if (users.length > 0) {

        const userTitle =
            document.createElement("div");

        userTitle.className = "socialhub-search-empty";

        userTitle.style.cssText =
            "text-align:left;font-weight:700;font-size:12px;color:#1877f2;padding:10px 12px 4px;";

        userTitle.textContent = "PEOPLE";

        dropdown.appendChild(userTitle);

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
                    `../profile/user-profile.html?user=${user.id}`;
            });

            dropdown.appendChild(result);
        });
    }

    // See all
    const allLink =
        document.createElement("div");

    allLink.className = "socialhub-search-empty";

    allLink.style.cssText =
        "cursor:pointer;font-weight:700;color:#1877f2;padding:10px;border-top:1px solid var(--hover,#f2f3f5);";

    allLink.textContent = `See all results for "${socialhubEscape(query)}"`;

    allLink.addEventListener("click", () => {

        window.location.href =
            `../search/index.html?q=${encodeURIComponent(query)}`;
    });

    dropdown.appendChild(allLink);

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

        window.location.href = "../auth/index.html";

        return;
    }

    window.socialhubSearchState =
        window.socialhubSearchState || {
            tab: "all",
            query: "",
            users: [],
            posts: [],
            profileMap: {},
            pageMap: {}
        };

    window.socialhubSearchState.query = query;

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
                ? "Search Friendbook"
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
                Type a name or keyword in the search box above.
            </div>
        `;

        return;
    }

    container.innerHTML = `
        <div class="socialhub-search-empty">
            Searching...
        </div>
    `;

    const [users, posts] =
        await Promise.all([
            socialhubSearchUsers(query, 30),
            socialhubSearchPosts(query, 30)
        ]);

    window.socialhubSearchState.users = users;

    window.socialhubSearchState.posts = posts;

    const { profileMap, pageMap } =
        await socialhubPostResultMeta(posts);

    window.socialhubSearchState.profileMap = profileMap;

    window.socialhubSearchState.pageMap = pageMap;

    socialhubSearchRenderResults();
}


function socialhubSearchSetTab(tab) {

    if (!window.socialhubSearchState) {
        return;
    }

    window.socialhubSearchState.tab = tab;

    document
        .querySelectorAll(".search-tab")
        .forEach(btn => {

            btn.classList.toggle(
                "active",
                btn.dataset.tab === tab
            );
        });

    socialhubSearchRenderResults();
}


function socialhubSearchRenderResults() {

    const container =
        document.getElementById("searchResults");

    if (!container) {
        return;
    }

    const state =
        window.socialhubSearchState;

    const { users, posts, profileMap, pageMap } =
        state;

    if (users.length === 0 && posts.length === 0) {

        container.innerHTML = `
            <div class="socialhub-search-empty">
                No results found.
            </div>
        `;

        return;
    }

    const showUsers =
        state.tab === "all" || state.tab === "people";

    const showPosts =
        state.tab === "all" || state.tab === "posts";

    container.innerHTML = "";

    // ---------- PEOPLE ----------
    if (showUsers && users.length > 0) {

        const sectionTitle =
            document.createElement("div");

        sectionTitle.className = "search-section-title";

        sectionTitle.innerHTML =
            '<i class="fa-solid fa-user-group"></i> People';

        container.appendChild(sectionTitle);

        socialhubRenderUserRows(container, users);
    }

    // ---------- POSTS ----------
    if (showPosts && posts.length > 0) {

        const sectionTitle =
            document.createElement("div");

        sectionTitle.className = "search-section-title";

        sectionTitle.innerHTML =
            '<i class="fa-solid fa-newspaper"></i> Posts';

        container.appendChild(sectionTitle);

        posts.forEach(post => {

            const div =
                document.createElement("div");

            div.innerHTML =
                socialhubPostResultHTML(
                    post,
                    profileMap,
                    pageMap,
                    socialhubSearchState.query || ""
                );

            container.appendChild(div.firstElementChild);
        });
    }
}


async function socialhubRenderUserRows(container, users) {

    const me =
        await socialhubGetMe();

    const {
        related,
        requestedByMe,
        incomingSet
    } = await socialhubGetFriendRelationInfo();

    users.forEach(user => {

        const row =
            document.createElement("div");

        row.className = "socialhub-user-row";

        let actionHTML = "";

        if (user.id === me.id) {

            actionHTML = `
                <button
                    class="socialhub-btn-soft"
                    onclick="location.href='../profile/index.html'"
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
                onclick="location.href='../profile/user-profile.html?user=${user.id}'"
            >
                ${socialhubAvatarHTML(user)}
            </div>

            <div
                class="socialhub-user-info"
                onclick="location.href='../profile/user-profile.html?user=${user.id}'"
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
        socialhubPageId() || "home/index.html";

    if (currentPage === "search/index.html") {

        loadSearchResultsPage();

        return;
    }

    setupLiveSearch();

    console.log(
        "✅ User Search activated!"
    );
});
