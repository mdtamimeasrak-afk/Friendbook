// ======================================================
// SOCIALHUB - SAVED POSTS (🔖 bookmarks)
// ======================================================
// saved.html -> list of all posts the user bookmarked
// Reuses the feed post card + interactions
// ======================================================

(function socialhubSavedInjectStyles() {

    const style =
        document.createElement("style");

    style.textContent = `

.saved-main {
    max-width: 680px;
    margin: 0 auto;
    padding: 18px 14px 40px;
}

.saved-head {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 18px;
}

.saved-head .saved-head-icon {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: #e7f3ff;
    color: #1877f2;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 21px;
    flex-shrink: 0;
}

.saved-head h1 {
    margin: 0;
    font-size: 21px;
}

.saved-head .saved-sub {
    margin: 2px 0 0;
    font-size: 13.5px;
    color: #65676b;
}

.saved-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.saved-card {
    position: relative;
}

.saved-remove-btn {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 5;
    border: none;
    background: rgba(0, 0, 0, 0.5);
    color: #fff;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: 0.12s;
}

.saved-remove-btn:hover {
    background: #e41e3f;
}

.saved-empty {
    text-align: center;
    padding: 60px 20px;
    color: #65676b;
}

.saved-empty i {
    font-size: 52px;
    color: #c9ccd1;
    margin-bottom: 14px;
    display: block;
}

.saved-empty h3 {
    margin: 0 0 6px;
    color: #1c1e21;
}

body.dark-mode .saved-empty,
body.dark-mode .saved-head .saved-sub {
    color: #b0b3b8;
}

body.dark-mode .saved-empty h3 {
    color: #e4e6eb;
}

body.dark-mode .saved-empty i {
    color: #3a3b3c;
}
`;

    document.head.appendChild(style);
})();


// ======================================================
// HELPERS
// ======================================================

async function socialhubSavedGetMe() {

    const {
        data,
        error
    } = await db.auth.getUser();

    if (error || !data.user) {
        return null;
    }

    return data.user;
}


function socialhubSavedToast(message) {

    const toast =
        document.createElement("div");

    toast.style.cssText =
        "position:fixed;bottom:24px;left:50%;transform:translateX(-50%);" +
        "background:#1c1e21;color:#fff;padding:12px 20px;border-radius:22px;" +
        "font-size:14px;font-weight:600;z-index:100001;box-shadow:0 6px 24px rgba(0,0,0,0.3);";

    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 2400);
}


function socialhubSavedEmptyState() {

    const list =
        document.getElementById("savedList");

    if (!list) {
        return;
    }

    list.innerHTML = `
        <div class="saved-empty">
            <i class="fa-regular fa-bookmark"></i>
            <h3>No saved posts yet</h3>
            <p>Tap the bookmark icon on any post to save it here.</p>
        </div>
    `;
}


// ======================================================
// LOAD SAVED POSTS
// ======================================================

async function socialhubSavedLoad() {

    const list =
        document.getElementById("savedList");

    if (!list) {
        return;
    }

    const me =
        await socialhubSavedGetMe();

    if (!me) {

        location.href = "../auth/index.html";

        return;
    }

    const {
        data: saved,
        error
    } = await db
        .from("saved_posts")
        .select("post_id, created_at")
        .eq("user_id", me.id)
        .order("created_at", { ascending: false });

    if (error) {

        console.error("Saved load error:", error);

        list.innerHTML =
            '<p class="empty-message">Could not load saved posts.</p>';

        return;
    }

    if (!saved || saved.length === 0) {

        socialhubSavedEmptyState();

        return;
    }

    const postIds =
        saved.map(s => s.post_id);

    const {
        data: posts,
        error: postError
    } = await db
        .from("posts")
        .select("*")
        .in("id", postIds);

    if (postError) {

        console.error("Saved posts error:", postError);

        list.innerHTML =
            '<p class="empty-message">Could not load posts.</p>';

        return;
    }

    const orderMap = {};

    saved.forEach((s, i) => {

        orderMap[s.post_id] = i;
    });

    const ordered =
        (posts || [])
            .filter(p => orderMap[p.id] !== undefined)
            .sort(
                (a, b) =>
                    orderMap[a.id] - orderMap[b.id]
            );

    if (ordered.length === 0) {

        socialhubSavedEmptyState();

        return;
    }

    // Profiles for post authors
    const userIds =
        [...new Set(
            ordered.map(p => p.user_id).filter(Boolean)
        )];

    const profileMap = new Map();

    if (userIds.length > 0) {

        const {
            data: profiles
        } = await db
            .from("profiles")
            .select("id, full_name, username, avatar_url")
            .in("id", userIds);

        (profiles || []).forEach(p => {

            profileMap.set(p.id, p);
        });
    }

    // Page names for page posts
    const pageIds =
        [...new Set(
            ordered.map(p => p.page_id).filter(Boolean)
        )];

    const pageNameMap = {};

    if (pageIds.length > 0) {

        const {
            data: pages
        } = await db
            .from("pages")
            .select("id, name")
            .in("id", pageIds);

        (pages || []).forEach(p => {

            pageNameMap[p.id] = p.name;
        });
    }

    list.innerHTML = "";

    ordered.forEach(post => {

        const article =
            document.createElement("div");

        article.className = "saved-card";

        if (typeof socialhubBuildPostArticle === "function") {

            const built =
                socialhubBuildPostArticle(
                    post,
                    profileMap
                );

            if (built) {

                article.appendChild(built);

            } else {

                article.innerHTML =
                    socialhubSavedFallbackCard(
                        post,
                        profileMap,
                        pageNameMap
                    );
            }

        } else {

            article.innerHTML =
                socialhubSavedFallbackCard(
                    post,
                    profileMap,
                    pageNameMap
                );
        }

        const removeBtn =
            document.createElement("button");

        removeBtn.className = "saved-remove-btn";

        removeBtn.type = "button";

        removeBtn.title = "Remove from saved";

        removeBtn.innerHTML =
            '<i class="fa-solid fa-xmark"></i>';

        removeBtn.addEventListener("click", async () => {

            const { error: delError } =
                await db
                    .from("saved_posts")
                    .delete()
                    .eq("user_id", me.id)
                    .eq("post_id", post.id);

            if (delError) {

                alert("Could not unsave: " + delError.message);

                return;
            }

            article.remove();

            socialhubSavedToast("Removed from saved.");

            const remaining =
                list.querySelectorAll(".saved-card").length;

            if (remaining === 0) {

                socialhubSavedEmptyState();
            }
        });

        article.appendChild(removeBtn);

        list.appendChild(article);
    });
}


function socialhubSavedFallbackCard(post, profileMap, pageNameMap) {

    const author =
        profileMap[post.user_id] || {};

    const name =
        post.page_id
            ? pageNameMap[post.page_id] || "Page"
            : author.full_name || "@" + author.username || "Someone";

    const avatar =
        post.page_id
            ? `<div class="author-avatar">${(name || "P").charAt(0).toUpperCase()}</div>`
            : author.avatar_url
                ? `<img class="author-avatar" src="${author.avatar_url}" alt="">`
                : `<div class="author-avatar">${(name || "U").charAt(0).toUpperCase()}</div>`;

    const time =
        new Date(post.created_at).toLocaleString();

    return `
        <div class="post">

            <div class="post-header">

                ${avatar}

                <div class="post-header-info">

                    <a class="post-author" href="${post.page_id ? "../pages/page.html?id=" + post.page_id : "../profile/user-profile.html?user=" + post.user_id}">
                        ${name}
                    </a>

                    <span class="post-time">${time}</span>

                </div>

            </div>

            <p class="post-content">
                ${post.content || ""}
            </p>

            ${post.image_url ? `<img class="post-image" src="${post.image_url}" alt="">` : ""}

        </div>
    `;
}


document.addEventListener("DOMContentLoaded", () => {

    socialhubSavedLoad();
});