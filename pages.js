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
    max-width: 860px;
    margin: 0 auto;
    padding: 18px 14px 40px;
}

.pages-main h1 {
    margin: 0 0 4px;
    font-size: 22px;
}

.pages-main .pages-sub {
    margin: 0 0 16px;
    color: #65676b;
    font-size: 13.5px;
}

.pages-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 12px;
    margin-top: 16px;
}

.page-card {
    background: #fff;
    border-radius: 14px;
    padding: 16px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    cursor: pointer;
    transition: 0.15s;
}

.page-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
}

.page-card-logo {
    width: 52px;
    height: 52px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    background: linear-gradient(135deg, #25a56a, #7bdcb5);
    color: #fff;
    margin-bottom: 10px;
}

.page-card h3 {
    margin: 0 0 4px;
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
}

.page-card .page-card-meta {
    margin-top: 10px;
    font-size: 12.5px;
    color: #1877f2;
    font-weight: 700;
}

/* Page page */
.page-page {
    max-width: 760px;
    margin: 0 auto;
    padding: 18px 14px 40px;
}

.page-hero {
    background: #fff;
    border-radius: 16px;
    padding: 22px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    margin-bottom: 16px;
}

.page-hero .page-hero-top {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 10px;
}

.page-hero .page-hero-logo {
    width: 64px;
    height: 64px;
    border-radius: 18px;
    background: linear-gradient(135deg, #25a56a, #7bdcb5);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 30px;
    color: #fff;
    flex-shrink: 0;
}

.page-hero h1 {
    margin: 0 0 2px;
    font-size: 20px;
}

.page-hero .page-hero-meta {
    margin: 0;
    font-size: 13px;
    color: #65676b;
}

.page-hero .page-hero-desc {
    margin: 8px 0 14px;
    font-size: 14px;
}

.page-hero .page-hero-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
}

.page-feed-title {
    font-size: 16px;
    font-weight: 700;
    margin: 18px 0 10px;
}

.page-composer {
    background: #fff;
    border-radius: 14px;
    padding: 14px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
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
}

.page-composer .page-composer-row img {
    width: 42px;
    height: 42px;
    border-radius: 8px;
    object-fit: cover;
}

body.dark-mode .page-card,
body.dark-mode .page-hero,
body.dark-mode .page-composer,
body.dark-mode .socialhub-cr-box {
    background: #242526;
}

body.dark-mode .page-card p,
body.dark-mode .page-hero .page-hero-meta,
body.dark-mode .pages-main .pages-sub,
body.dark-mode .page-composer .page-composer-as {
    color: #b0b3b8;
}

body.dark-mode .page-composer textarea {
    color: #e4e6eb;
}

body.dark-mode .page-composer .page-composer-row {
    border-top-color: #3a3b3c;
}

body.dark-mode .socialhub-cr-box input,
body.dark-mode .socialhub-cr-box textarea {
    background: #3a3b3c;
    border-color: #4e4f50;
    color: #e4e6eb;
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
            <h2>🏢 Create Page</h2>

            <label>Page name</label>
            <input type="text" id="pgName" placeholder="e.g. TRIYA Official" maxlength="60">

            <label>Description</label>
            <textarea id="pgDesc" rows="3" placeholder="What is this page about?"></textarea>

            <div class="socialhub-cr-actions">
                <button class="socialhub-cr-cancel" type="button">Cancel</button>
                <button class="socialhub-create-btn" type="button">Create Page</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

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

    const creatorIds =
        [...new Set(
            pages.map(p => p.created_by)
        )];

    const {
        data: profiles
    } = await db
        .from("profiles")
        .select("id, full_name")
        .in("id", creatorIds);

    const nameMap = {};

    (profiles || []).forEach(p => {

        nameMap[p.id] = p.full_name;
    });

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

    pages.forEach(page => {

        const card =
            document.createElement("div");

        card.className = "page-card";

        card.innerHTML = `
            <div class="page-card-logo">🏢</div>

            <h3>${socialhubPagesEscape(page.name)}</h3>

            <p>${socialhubPagesEscape(page.description || "")}</p>

            <div class="page-card-meta">
                ${followCount[page.id] || 1} followers ·
                Created by ${socialhubPagesEscape(nameMap[page.created_by] || "Someone")}
            </div>
        `;

        card.addEventListener("click", () => {

            location.href = `page.html?id=${page.id}`;
        });

        grid.appendChild(card);
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

    document.title = page.name + " - TRIYA";

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

    hero.innerHTML = `

        <div class="page-hero-top">

            <div class="page-hero-logo">🏢</div>

            <div>
                <h1>${socialhubPagesEscape(page.name)}</h1>
                <p class="page-hero-meta">
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
                            🗑️ Delete Page
                        </button>
                    `
                    : myFollow
                        ? `
                            <button
                                class="socialhub-danger-btn"
                                onclick="socialhubPageUnfollow('${page.id}', this)"
                            >
                                ✖️ Unfollow
                            </button>
                        `
                        : `
                            <button
                                class="socialhub-create-btn"
                                onclick="socialhubPageFollow('${page.id}', this)"
                            >
                                👍 Follow
                            </button>
                        `
            }

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