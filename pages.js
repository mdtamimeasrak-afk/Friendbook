// ======================================================
// SOCIALHUB - PAGES (🏢 Communities)
// ======================================================
// pages.html  -> page list + create
// page.html   -> page feed + follow + post as page
//
// Page posts live in the posts table (page_id column).
// The post card shows the PAGE name via a synthetic
// profile entry in the profile map.
// ======================================================

(function socialhubPagesInjectStyles() {

    const style =
        document.createElement("style");

    style.textContent = `

.pages-main {
    max-width: 900px;
    margin: 0 auto;
    padding: 18px 14px 40px;
}

.pages-head {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 4px;
}

.pages-head .pages-head-icon {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: #e7f3ff;
    color: #1877f2;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
}

.pages-main h1 {
    margin: 0;
    font-size: 22px;
}

.pages-main .pages-sub {
    margin: 0 0 16px 56px;
    color: #65676b;
    font-size: 13.5px;
}

.pages-top-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 14px;
}

.pages-count-pill {
    font-size: 13.5px;
    font-weight: 600;
    color: #65676b;
    background: #fff;
    padding: 8px 16px;
    border-radius: 20px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.pages-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 14px;
}

.page-card {
    background: #fff;
    border-radius: 12px;
    padding: 18px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    transition: 0.15s;
    display: flex;
    flex-direction: column;
}

.page-card:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.14);
    transform: translateY(-1px);
}

.page-card-top {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 10px;
}

.page-card-logo {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 21px;
    font-weight: 800;
    background: linear-gradient(135deg, #25a56a, #63d9a8);
    color: #fff;
    flex-shrink: 0;
}

.page-card h3 {
    margin: 0;
    font-size: 15.5px;
}

.page-card p {
    margin: 0;
    font-size: 13px;
    color: #65676b;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    flex-grow: 1;
}

.page-card-bottom {
    border-top: 1px solid #e4e6eb;
    margin-top: 12px;
    padding-top: 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.page-card-bottom .page-card-meta {
    font-size: 12.5px;
    color: #65676b;
    font-weight: 600;
}

.page-card-bottom .page-card-meta i {
    color: #1877f2;
    margin-right: 4px;
}

.page-card-follow {
    border: none;
    background: #e7f3ff;
    color: #1877f2;
    font-size: 12.5px;
    font-weight: 700;
    padding: 7px 14px;
    border-radius: 18px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: 0.12s;
}

.page-card-follow:hover {
    background: #d4e7ff;
}

.page-card-follow.following {
    background: #e4e6eb;
    color: #65676b;
}

/* Page page */
.page-page {
    max-width: 780px;
    margin: 0 auto;
    padding: 18px 14px 40px;
}

.page-cover {
    height: 150px;
    border-radius: 12px 12px 0 0;
    background: linear-gradient(135deg, #25a56a, #3ecfa3);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 52px;
    color: rgba(255, 255, 255, 0.95);
    position: relative;
    overflow: hidden;
}

.page-cover::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(0,0,0,0.08), rgba(0,0,0,0.28));
}

.page-cover i {
    filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3));
}

.page-hero {
    background: #fff;
    border-radius: 0 0 12px 12px;
    padding: 20px 22px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    margin-bottom: 16px;
}

.page-hero .page-hero-top {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 10px;
}

.page-hero .page-hero-logo {
    width: 68px;
    height: 68px;
    border-radius: 50%;
    background: linear-gradient(135deg, #25a56a, #63d9a8);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 30px;
    font-weight: 800;
    color: #fff;
    flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.page-hero h1 {
    margin: 0 0 3px;
    font-size: 22px;
}

.page-hero .page-hero-meta {
    margin: 0;
    font-size: 13px;
    color: #65676b;
}

.page-hero .page-hero-meta i {
    color: #1877f2;
    margin-right: 4px;
}

.page-hero .page-hero-desc {
    margin: 8px 0 14px;
    font-size: 14px;
    color: #65676b;
}

.page-hero .page-hero-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
}

.page-follow-btn {
    border: none;
    background: #1877f2;
    color: #fff;
    padding: 11px 24px;
    border-radius: 22px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transition: 0.12s;
}

.page-follow-btn:hover {
    background: #166fe5;
}

.page-follow-btn.following {
    background: #e4e6eb;
    color: #65676b;
}

.page-feed-title {
    font-size: 17px;
    font-weight: 700;
    margin: 20px 0 10px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.page-feed-title i {
    color: #1877f2;
}

.page-composer {
    background: #fff;
    border-radius: 12px;
    padding: 14px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    margin-bottom: 14px;
}

.page-composer .page-composer-as {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
    font-size: 13px;
    font-weight: 600;
    color: #65676b;
}

.page-composer .page-composer-as .as-logo {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: linear-gradient(135deg, #25a56a, #63d9a8);
    color: #fff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 800;
}

.page-composer textarea {
    width: 100%;
    box-sizing: border-box;
    border: none;
    outline: none;
    font-size: 14.5px;
    font-family: inherit;
    resize: none;
    min-height: 54px;
    background: transparent;
}

.page-composer .page-composer-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 8px;
    border-top: 1px solid #e4e6eb;
    padding-top: 10px;
}

.page-composer .page-composer-row label {
    cursor: pointer;
    font-size: 14px;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    color: #65676b;
    font-weight: 600;
}

.page-composer .page-composer-row label:hover {
    color: #1877f2;
}

.page-composer .page-composer-row img {
    width: 42px;
    height: 42px;
    border-radius: 8px;
    object-fit: cover;
}

/* Create modal (FB style) */
.socialhub-cr-modal {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    padding: 20px;
}

.socialhub-cr-box {
    background: #fff;
    border-radius: 10px;
    width: 100%;
    max-width: 460px;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
    overflow: hidden;
}

.socialhub-cr-box .cr-head {
    padding: 16px 18px;
    border-bottom: 1px solid #e4e6eb;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.socialhub-cr-box .cr-head h2 {
    margin: 0;
    font-size: 18px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.socialhub-cr-box .cr-head .cr-close {
    border: none;
    background: #e4e6eb;
    color: #050505;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    font-size: 14px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
}

.cr-body {
    padding: 16px 18px;
}

.cr-body label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: #65676b;
    margin: 10px 0 6px;
}

.cr-body label:first-child {
    margin-top: 0;
}

.cr-body input,
.cr-body textarea {
    width: 100%;
    box-sizing: border-box;
    padding: 11px 13px;
    border: 1px solid #d4d7dd;
    border-radius: 8px;
    font-size: 14px;
    font-family: inherit;
    outline: none;
    transition: 0.12s;
}

.cr-body input:focus,
.cr-body textarea:focus {
    border-color: #1877f2;
    box-shadow: 0 0 0 3px rgba(24, 119, 242, 0.15);
}

.cr-actions {
    display: flex;
    gap: 10px;
    padding: 14px 18px;
    border-top: 1px solid #e4e6eb;
    justify-content: flex-end;
}

.socialhub-cr-cancel {
    border: none;
    background: #e4e6eb;
    color: #1c1e21;
    padding: 10px 20px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
}

.socialhub-cr-cancel:hover {
    background: #d8dadf;
}

.socialhub-create-btn {
    border: none;
    background: #1877f2;
    color: #fff;
    padding: 10px 22px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    transition: 0.12s;
}

.socialhub-create-btn:hover {
    background: #166fe5;
}

.socialhub-danger-btn {
    border: none;
    background: #e41e3f;
    color: #fff;
    padding: 10px 20px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    transition: 0.12s;
}

.socialhub-danger-btn:hover {
    background: #c81233;
}

body.dark-mode .page-card,
body.dark-mode .page-hero,
body.dark-mode .page-composer,
body.dark-mode .socialhub-cr-box,
body.dark-mode .pages-count-pill {
    background: #242526;
}

body.dark-mode .page-card p,
body.dark-mode .page-hero .page-hero-meta,
body.dark-mode .pages-main .pages-sub,
body.dark-mode .page-composer .page-composer-as,
body.dark-mode .pages-count-pill,
body.dark-mode .page-card-bottom .page-card-meta,
body.dark-mode .page-hero .page-hero-desc,
body.dark-mode .page-composer .page-composer-row label {
    color: #b0b3b8;
}

body.dark-mode .page-card-bottom {
    border-top-color: #3a3b3c;
}

body.dark-mode .page-composer textarea {
    color: #e4e6eb;
}

body.dark-mode .page-composer .page-composer-row {
    border-top-color: #3a3b3c;
}

body.dark-mode .page-card-follow.following,
body.dark-mode .page-follow-btn.following {
    background: #3a3b3c;
    color: #b0b3b8;
}

body.dark-mode .cr-body input,
body.dark-mode .cr-body textarea {
    background: #3a3b3c;
    border-color: #4e4f50;
    color: #e4e6eb;
}

body.dark-mode .socialhub-cr-box .cr-head {
    border-bottom-color: #3a3b3c;
}

body.dark-mode .cr-actions {
    border-top-color: #3a3b3c;
}
`;

    document.head.appendChild(style);
})();


// ======================================================
// 1. HELPERS
// ======================================================

function socialhubPagesEscape(text) {

    const div =
        document.createElement("div");

    div.innerText =
        text || "";

    return div.innerHTML;
}


async function socialhubPagesGetMe() {

    const {
        data,
        error
    } = await db.auth.getUser();

    if (error || !data.user) {

        return null;
    }

    return data.user;
}


function socialhubPagesToast(message) {

    const old =
        document.querySelector(".socialhub-pages-toast");

    if (old) {
        old.remove();
    }

    const toast =
        document.createElement("div");

    toast.className = "socialhub-pages-toast";

    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #1c1e21;
        color: #fff;
        padding: 10px 20px;
        border-radius: 24px;
        font-size: 14px;
        font-weight: 600;
        z-index: 10001;
        box-shadow: 0 6px 20px rgba(0,0,0,0.3);
    `;

    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 2400);
}


// ======================================================
// 2. CREATE MODAL
// ======================================================

function socialhubPagesOpenCreateModal() {

    const modal =
        document.createElement("div");

    modal.className = "socialhub-cr-modal";

    modal.innerHTML = `
        <div class="socialhub-cr-box">
            <div class="cr-head">
                <h2>
                    <i class="fa-solid fa-flag"></i>
                    Create Page
                </h2>
                <button class="cr-close" type="button" title="Close">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>

            <div class="cr-body">
                <label>Page name</label>
                <input type="text" id="pgName" placeholder="e.g. Friendbook Official" maxlength="60">

                <label>Description</label>
                <textarea id="pgDesc" rows="3" placeholder="What is this page about?"></textarea>
            </div>

            <div class="cr-actions">
                <button class="socialhub-cr-cancel" type="button">Cancel</button>
                <button class="socialhub-create-btn" type="button">
                    <i class="fa-solid fa-flag"></i>
                    Create Page
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    modal
        .querySelector(".cr-close")
        .addEventListener("click", () => modal.remove());

    modal
        .querySelector(".socialhub-cr-cancel")
        .addEventListener("click", () => modal.remove());

    modal.addEventListener("click", event => {

        if (event.target === modal) {
            modal.remove();
        }
    });

    modal
        .querySelector(".socialhub-create-btn")
        .addEventListener("click", async () => {

            const name =
                modal.querySelector("#pgName").value.trim();

            const description =
                modal.querySelector("#pgDesc").value.trim();

            if (!name) {

                socialhubPagesToast("Page name is required.");

                return;
            }

            const me =
                await socialhubPagesGetMe();

            if (!me) {

                socialhubPagesToast("Please login first.");

                return;
            }

            const { data, error } =
                await db
                    .from("pages")
                    .insert({
                        name,
                        description,
                        created_by: me.id
                    })
                    .select("id")
                    .single();

            if (error) {

                socialhubPagesToast("Could not create page: " + error.message);

                return;
            }

            await db
                .from("page_followers")
                .insert({
                    page_id: data.id,
                    user_id: me.id
                });

            modal.remove();

            socialhubPagesToast("✅ Page created!");

            setTimeout(() => {

                location.href = `page.html?id=${data.id}`;
            }, 700);
        });
}


// ======================================================
// 3. PAGE LIST (pages.html)
// ======================================================

async function socialhubPagesLoad() {

    const grid =
        document.getElementById("pagesGrid");

    if (!grid) {
        return;
    }

    const {
        data: pages,
        error
    } = await db
        .from("pages")
        .select("id, name, description, created_by, created_at")
        .order("created_at", { ascending: false });

    if (error) {

        console.error("❌ Pages load error:", error);

        grid.innerHTML = `
            <p class="empty-message" style="grid-column:1/-1;">
                Could not load pages.
            </p>
        `;

        return;
    }

    if (!pages || pages.length === 0) {

        grid.innerHTML = `
            <p class="empty-message" style="grid-column:1/-1;">
                No pages yet. Create the first one!
            </p>
        `;

        return;
    }

    const countPill =
        document.getElementById("pagesCount");

    if (countPill) {

        countPill.textContent =
            pages.length + " pages";
    }

    const {
        data: followers
    } = await db
        .from("page_followers")
        .select("page_id");

    const followCount = {};

    (followers || []).forEach(f => {

        followCount[f.page_id] =
            (followCount[f.page_id] || 0) + 1;
    });

    grid.innerHTML = "";

    const pageIds =
        pages.map(p => p.id);

    const me =
        await socialhubPagesGetMe();

    const myFollowed =
        new Set();

    if (me && pageIds.length > 0) {

        const {
            data: myF
        } = await db
            .from("page_followers")
            .select("page_id")
            .eq("user_id", me.id)
            .in("page_id", pageIds);

        (myF || []).forEach(f => {

            myFollowed.add(f.page_id);
        });
    }

    pages.forEach(page => {

        const card =
            document.createElement("div");

        card.className = "page-card";

        const letter =
            (page.name || "P").charAt(0).toUpperCase();

        const following =
            myFollowed.has(page.id);

        const count =
            followCount[page.id] || 1;

        card.innerHTML = `

            <div class="page-card-top">

                <div class="page-card-logo">
                    ${socialhubPagesEscape(letter)}
                </div>

                <h3>${socialhubPagesEscape(page.name)}</h3>

            </div>

            <p>${socialhubPagesEscape(page.description || "")}</p>

            <div class="page-card-bottom">

                <div class="page-card-meta" data-count="${count}">
                    <i class="fa-solid fa-user-group"></i>
                    ${count} followers
                </div>

                ${
                    me
                        ? `
                            <button
                                class="page-card-follow ${following ? "following" : ""}"
                                data-following="${following}"
                                onclick="event.stopPropagation(); socialhubPageCardToggle('${page.id}', this, ${following});"
                            >
                                <i class="fa-solid ${following ? "fa-check" : "fa-plus"}"></i>
                                ${following ? "Following" : "Follow"}
                            </button>
                        `
                        : ""
                }

            </div>
        `;

        card.addEventListener("click", () => {

            location.href = `page.html?id=${page.id}`;
        });

        grid.appendChild(card);
    });
}


async function socialhubPageCardToggle(pageId, button, following) {

    const me =
        await socialhubPagesGetMe();

    if (!me) {
        return;
    }

    if (following) {

        await db
            .from("page_followers")
            .delete()
            .eq("page_id", pageId)
            .eq("user_id", me.id);

    } else {

        const { error } =
            await db
                .from("page_followers")
                .insert({
                    page_id: pageId,
                    user_id: me.id
                });

        if (error) {

            alert("Could not follow: " + error.message);

            return;
        }
    }

    const card =
        button.closest(".page-card");

    const meta =
        card.querySelector(".page-card-meta");

    const oldCount =
        parseInt(meta.dataset.count || "1", 10) || 1;

    const newCount =
        following ? oldCount - 1 : oldCount + 1;

    meta.dataset.count = newCount;

    meta.innerHTML =
        '<i class="fa-solid fa-user-group"></i> ' +
        newCount + " followers";

    const nowFollowing =
        !following;

    button.classList.toggle("following", nowFollowing);

    button.dataset.following = String(nowFollowing);

    button.innerHTML =
        `<i class="fa-solid ${nowFollowing ? "fa-check" : "fa-plus"}"></i> ` +
        (nowFollowing ? "Following" : "Follow");

    button.onclick = null;

    button.addEventListener("click", event => {

        event.stopPropagation();

        socialhubPageCardToggle(
            pageId,
            button,
            nowFollowing
        );
    });
}


// ======================================================
// 4. PAGE PAGE (page.html?id=X)
// ======================================================

async function socialhubPageLoad() {

    const params =
        new URLSearchParams(window.location.search);

    const pageId =
        params.get("id");

    if (!pageId) {

        location.href = "pages.html";

        return;
    }

    const me =
        await socialhubPagesGetMe();

    if (!me) {

        location.href = "login.html";

        return;
    }

    const {
        data: page,
        error
    } = await db
        .from("pages")
        .select("*")
        .eq("id", pageId)
        .single();

    if (error || !page) {

        document.querySelector(".page-page").innerHTML =
            '<p class="empty-message">Page not found.</p>';

        return;
    }

    document.title = page.name + " - Friendbook";

    const isCreator =
        page.created_by === me.id;

    const {
        data: myFollow
    } = await db
        .from("page_followers")
        .select("*")
        .eq("page_id", pageId)
        .eq("user_id", me.id)
        .maybeSingle();

    const {
        data: followerRows
    } = await db
        .from("page_followers")
        .select("user_id")
        .eq("page_id", pageId);

    const followerCount =
        followerRows?.length || 1;

    const hero =
        document.getElementById("pageHero");

    const pageLetter =
        (page.name || "P").charAt(0).toUpperCase();

    const asLogo =
        document.getElementById("pageAsLogo");

    if (asLogo) {

        asLogo.textContent = pageLetter;
    }

    hero.innerHTML = `

        <div class="page-cover">
            <i class="fa-solid fa-flag"></i>
        </div>

        <div class="page-hero">

            <div class="page-hero-top">

                <div class="page-hero-logo">
                    ${socialhubPagesEscape((page.name || "P").charAt(0).toUpperCase())}
                </div>

                <div>
                    <h1>${socialhubPagesEscape(page.name)}</h1>
                    <p class="page-hero-meta">
                        <i class="fa-solid fa-user-group"></i>
                        ${followerCount} followers
                        ${isCreator ? " · You manage this page" : ""}
                    </p>
                </div>

            </div>

            <p class="page-hero-desc">
                ${socialhubPagesEscape(page.description || "No description yet.")}
            </p>

            <div class="page-hero-actions">

                ${
                    isCreator
                        ? `
                            <button
                                class="socialhub-danger-btn"
                                onclick="socialhubPageDelete('${page.id}', this)"
                            >
                                <i class="fa-solid fa-trash-can"></i>
                                Delete Page
                            </button>
                        `
                        : myFollow
                            ? `
                                <button
                                    class="page-follow-btn following"
                                    onclick="socialhubPageUnfollow('${page.id}', this)"
                                >
                                    <i class="fa-solid fa-check"></i>
                                    Following
                                </button>
                            `
                            : `
                                <button
                                    class="page-follow-btn"
                                    onclick="socialhubPageFollow('${page.id}', this)"
                                >
                                    <i class="fa-solid fa-plus"></i>
                                    Follow
                                </button>
                            `
                }

            </div>

        </div>
    `;

    // Composer: only the page creator posts as the page
    const composer =
        document.getElementById("pageComposer");

    if (!isCreator) {

        composer.style.display = "none";
    }

    await socialhubPageLoadPosts(page, me.id);
}


async function socialhubPageLoadPosts(page, myId) {

    const container =
        document.getElementById("pagePosts");

    const {
        data: posts,
        error
    } = await db
        .from("posts")
        .select("*")
        .eq("page_id", page.id)
        .order("created_at", { ascending: false });

    if (error) {

        console.error("❌ Page posts error:", error);

        return;
    }

    container.innerHTML = "";

    if (!posts || posts.length === 0) {

        container.innerHTML = `
            <p class="empty-message">
                No posts yet on this page.
            </p>
        `;

        return;
    }

    // Synthetic profile map: post card shows the PAGE name
    const profileMap = new Map();

    posts.forEach(post => {

        profileMap.set(post.user_id, {
            full_name: page.name,
            username: "page",
            avatar_url: null
        });
    });

    posts.forEach(post => {

        if (
            typeof socialhubBuildPostArticle ===
            "function"
        ) {

            container.appendChild(
                socialhubBuildPostArticle(
                    post,
                    profileMap
                )
            );

        } else {

            container.innerHTML += `
                <div class="post">
                    <p>${socialhubPagesEscape(post.content || "")}</p>
                </div>
            `;
        }
    });

    if (typeof socialhubLoadInteractions === "function") {

        socialhubLoadInteractions();
    }
}


async function socialhubPageFollow(pageId, button) {

    const me =
        await socialhubPagesGetMe();

    if (!me) {
        return;
    }

    const { error } =
        await db
            .from("page_followers")
            .insert({
                page_id: pageId,
                user_id: me.id
            });

    if (error) {

        alert("Could not follow: " + error.message);

        return;
    }

    socialhubPagesToast("👍 Following!");

    setTimeout(() => location.reload(), 600);
}


async function socialhubPageUnfollow(pageId, button) {

    const me =
        await socialhubPagesGetMe();

    if (!me) {
        return;
    }

    await db
        .from("page_followers")
        .delete()
        .eq("page_id", pageId)
        .eq("user_id", me.id);

    socialhubPagesToast("Unfollowed.");

    setTimeout(() => location.reload(), 600);
}


async function socialhubPageDelete(pageId, button) {

    const ok =
        confirm(
            "Delete this page permanently?\n\n" +
            "All page posts will be removed."
        );

    if (!ok) {
        return;
    }

    const { error } =
        await db
            .from("pages")
            .delete()
            .eq("id", pageId);

    if (error) {

        alert("Could not delete: " + error.message);

        return;
    }

    location.href = "pages.html";
}


async function socialhubPagePost(button) {

    const params =
        new URLSearchParams(window.location.search);

    const pageId =
        params.get("id");

    const me =
        await socialhubPagesGetMe();

    if (!me) {
        return;
    }

    const composer =
        document.getElementById("pageComposer");

    const input =
        composer.querySelector("textarea");

    const fileInput =
        composer.querySelector('input[type="file"]');

    const text =
        input.value.trim();

    if (!text && (!fileInput.files || fileInput.files.length === 0)) {

        socialhubPagesToast("Write something first.");

        return;
    }

    button.disabled = true;

    button.textContent = "Posting...";

    let imageUrl = null;

    if (fileInput.files && fileInput.files.length > 0) {

        const file =
            fileInput.files[0];

        const path =
            `page/${me.id}/${Date.now()}-${file.name}`;

        const { error: uploadError } =
            await db.storage
                .from("post-images")
                .upload(path, file);

        if (uploadError) {

            alert("Image upload failed: " + uploadError.message);

            button.disabled = false;

            button.textContent = "Post";

            return;
        }

        const { data: pub } =
            db.storage
                .from("post-images")
                .getPublicUrl(path);

        imageUrl = pub.publicUrl;
    }

    const { error } =
        await db
            .from("posts")
            .insert({
                user_id: me.id,
                content: text,
                image_url: imageUrl,
                page_id: pageId,
                audience: "public"
            });

    button.disabled = false;

    button.textContent = "Post";

    if (error) {

        alert("Could not post: " + error.message);

        return;
    }

    input.value = "";

    fileInput.value = "";

    const preview =
        composer.querySelector(".page-composer-preview");

    if (preview) {
        preview.remove();
    }

    socialhubPagesToast("✅ Posted on page!");

    const {
        data: page
    } = await db
        .from("pages")
        .select("*")
        .eq("id", pageId)
        .single();

    socialhubPageLoadPosts(page, me.id);
}


function socialhubPagePickImage(input) {

    const composer =
        document.getElementById("pageComposer");

    if (!composer) {
        return;
    }

    composer
        .querySelectorAll(".page-composer-preview")
        .forEach(el => el.remove());

    if (!input.files || input.files.length === 0) {
        return;
    }

    const file =
        input.files[0];

    if (!file.type.startsWith("image/")) {

        alert("Please choose an image.");

        input.value = "";

        return;
    }

    const reader =
        new FileReader();

    reader.onload = event => {

        const img =
            document.createElement("img");

        img.className = "page-composer-preview";

        img.src = event.target.result;

        img.style.cssText = `
            width: 56px;
            height: 56px;
            border-radius: 10px;
            object-fit: cover;
            margin-left: 4px;
        `;

        composer.querySelector(".page-composer-row").appendChild(img);
    };

    reader.readAsDataURL(file);
}


// ======================================================
// 5. AUTO-SYNC
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

    const page =
        window.location.pathname.split("/").pop();

    const savedDarkMode =
        localStorage.getItem("darkMode");

    if (savedDarkMode === "true") {

        document.body.classList.add("dark-mode");
    }

    if (page === "pages.html") {

        socialhubPagesLoad();
    }

    if (page === "page.html") {

        socialhubPageLoad();
    }

    console.log("✅ Pages activated!");
});