// ======================================================
// SOCIALHUB - POST MANAGE (EDIT + DELETE)
// ======================================================
// Adds a ⋯ menu to YOUR OWN posts (home feed, profile,
// user profile). Lets you edit the text/background or
// delete the post.
//
// Setup:
//   - Run setup-all.sql (posts_update + posts_delete
//     policies already exist in section 5).
//   - Add this script AFTER script.js on index.html,
//     profile.html and user-profile.html.
// ======================================================

var db = window.db || supabaseClient;

let socialhubOwnerCache =
    new Map();

let socialhubOwnerLoading =
    false;


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


// ======================================================
// 1. INJECTED STYLES
// ======================================================

(function socialhubPostManageInjectStyles() {

    const style =
        document.createElement("style");

    style.textContent = `

/* ---------- POST MENU BUTTON ---------- */

.post-header {
    position: relative;
}

.socialhub-post-menu-btn {
    margin-left: auto;
    width: 34px;
    height: 34px;
    border: none;
    border-radius: 50%;
    background: transparent;
    color: inherit;
    font-size: 19px;
    font-weight: 700;
    line-height: 1;
    cursor: pointer;
    flex-shrink: 0;
}

.socialhub-post-menu-btn:hover {
    background: rgba(128, 128, 128, 0.15);
}

/* ---------- DROPDOWN MENU ---------- */

.socialhub-post-menu {
    position: fixed;
    min-width: 170px;
    background: var(--card-bg, #ffffff);
    border-radius: 12px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.25);
    padding: 6px;
    z-index: 99999;
    opacity: 0;
    transform: translateX(-100%) scale(0.95);
    pointer-events: none;
    transition: 0.15s ease;
    transform-origin: top right;
}

.socialhub-post-menu.open {
    opacity: 1;
    transform: translateX(-100%) scale(1);
    pointer-events: auto;
}

.socialhub-post-menu button {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    border: none;
    background: transparent;
    padding: 10px 12px;
    border-radius: 8px;
    font-size: 14px;
    font-family: inherit;
    cursor: pointer;
    color: inherit;
    text-align: left;
}

.socialhub-post-menu button:hover {
    background: rgba(128, 128, 128, 0.12);
}

.socialhub-post-menu button[data-action="delete"] {
    color: #e0245e;
}

/* ---------- EDIT MODAL ---------- */

.socialhub-edit-modal {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    z-index: 100000;
}

.socialhub-edit-box {
    width: 100%;
    max-width: 480px;
    background: var(--card-bg, #ffffff);
    border-radius: 14px;
    padding: 20px;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
    animation: socialhubEditPop 0.18s ease;
}

@keyframes socialhubEditPop {
    from {
        transform: scale(0.95);
        opacity: 0;
    }
    to {
        transform: scale(1);
        opacity: 1;
    }
}

.socialhub-edit-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
}

.socialhub-edit-head h3 {
    margin: 0;
    font-size: 19px;
}

.socialhub-edit-close {
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 50%;
    background: rgba(128, 128, 128, 0.15);
    cursor: pointer;
    font-size: 14px;
    color: inherit;
}

.socialhub-edit-box textarea {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid rgba(128, 128, 128, 0.25);
    border-radius: 10px;
    padding: 12px 14px;
    font-size: 15px;
    font-family: inherit;
    resize: vertical;
    min-height: 110px;
    outline: none;
    background: rgba(128, 128, 128, 0.08);
    color: inherit;
    margin-bottom: 12px;
}

.socialhub-edit-bg-label {
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 8px;
    display: block;
}

.socialhub-edit-bg-options {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 16px;
}

.socialhub-edit-bg-option {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    border: 2px solid transparent;
    cursor: pointer;
    outline: none;
}

.socialhub-edit-bg-option.selected {
    border-color: #1877f2;
    box-shadow: 0 0 0 2px #fff inset;
}

.socialhub-edit-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
}

.socialhub-edit-actions button {
    padding: 10px 18px;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
}

.socialhub-edit-cancel {
    background: rgba(128, 128, 128, 0.15);
    color: inherit;
}

.socialhub-edit-save {
    background: linear-gradient(135deg, #1877f2, #8b5cf6);
    color: #fff;
}

body.dark-mode .socialhub-edit-box {
    background: #242526;
    border: 1px solid #3a3b3c;
}

/* ---------- EDIT AUDIENCE SELECT ---------- */

.socialhub-edit-audience {
    width: 100%;
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px solid rgba(128, 128, 128, 0.3);
    background: rgba(128, 128, 128, 0.1);
    color: inherit;
    font-family: inherit;
    font-size: 14px;
    margin-bottom: 16px;
    cursor: pointer;
}

/* ---------- SAVED POST MENU STATE ---------- */

.socialhub-post-menu button[data-action="save"].saved {
    color: #1877f2;
}

/* ---------- PRIVACY MODAL ---------- */

.socialhub-privacy-modal {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    z-index: 100001;
}

.socialhub-privacy-box {
    width: 100%;
    max-width: 380px;
    background: var(--card-bg, #ffffff);
    border-radius: 14px;
    padding: 20px;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
    animation: socialhubEditPop 0.18s ease;
}

.socialhub-privacy-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
}

.socialhub-privacy-head h3 {
    margin: 0;
    font-size: 19px;
}

.socialhub-privacy-close {
    width: 34px;
    height: 34px;
    border: none;
    border-radius: 50%;
    background: rgba(128, 128, 128, 0.15);
    color: inherit;
    font-size: 15px;
    cursor: pointer;
}

.socialhub-privacy-hint {
    margin: 0 0 12px;
    font-size: 14px;
    opacity: 0.7;
}

.socialhub-privacy-options {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.socialhub-privacy-options button {
    width: 100%;
    border: none;
    background: rgba(128, 128, 128, 0.1);
    border-radius: 10px;
    padding: 12px 14px;
    font-size: 14px;
    font-weight: 600;
    font-family: inherit;
    color: inherit;
    cursor: pointer;
    text-align: left;
    transition: background 0.15s;
}

.socialhub-privacy-options button:hover {
    background: rgba(128, 128, 128, 0.2);
}

body.dark-mode .socialhub-privacy-box {
    background: #242526;
    border: 1px solid #3a3b3c;
}
`;

    document.head.appendChild(style);
})();


// ======================================================
// 2. OWNERSHIP LOOKUP (one query per batch)
// ======================================================

async function socialhubEnsureOwners(posts) {

    const ids = [
        ...new Set(
            posts
                .map(post => post.dataset.postId)
                .filter(id => id && !socialhubOwnerCache.has(id))
        )
    ];

    if (ids.length === 0) {
        return;
    }

    if (socialhubOwnerLoading) {

        setTimeout(() => socialhubEnsureOwners(posts), 300);

        return;
    }

    socialhubOwnerLoading = true;

    try {

        const {
            data,
            error
        } = await db
            .from("posts")
            .select("id, user_id")
            .in("id", ids);

        if (error) {
            return;
        }

        (data || []).forEach(post => {

            socialhubOwnerCache.set(post.id, post.user_id);
        });

    } finally {

        socialhubOwnerLoading = false;
    }
}


// ======================================================
// 3. INJECT THE ⋯ MENU ON OWN POSTS
// ======================================================

function socialhubWatchPosts() {

    const posts = [
        ...document.querySelectorAll(
            "#posts .post, #profilePosts .post, #upPosts .post"
        )
    ];

    posts.forEach(post => {

        if (post.dataset.socialhubMenuReady) {
            return;
        }

        post.dataset.socialhubMenuReady = "1";

        socialhubMaybeAddMenu(post);
    });
}


async function socialhubMaybeAddMenu(post) {

    const postId =
        post.dataset.postId;

    if (!postId) {
        return;
    }

    await socialhubEnsureOwners([post]);

    const owner =
        socialhubOwnerCache.get(postId);

    if (!owner) {
        return;
    }

    const me =
        await socialhubGetMe();

    if (!me || owner !== me.id) {

        // Not the owner -> report-only menu
        socialhubInjectReportMenu(post, postId);

        return;
    }

    socialhubInjectMenu(post, postId);
}


function socialhubInjectMenu(post, postId) {

    const header =
        post.querySelector(".post-header");

    if (!header) {
        return;
    }

    const button =
        document.createElement("button");

    button.type = "button";

    button.className = "socialhub-post-menu-btn";

    button.title = "Post options";

    button.innerText = "⋯";

    header.appendChild(button);

    const menu =
        document.createElement("div");

    menu.className = "socialhub-post-menu";

    menu.innerHTML = `

        <button type="button" data-action="save">
            <i class="fa-solid fa-bookmark"></i>
            <span>Save Post</span>
        </button>

        <button type="button" data-action="privacy">
            <i class="fa-solid fa-lock"></i>
            Edit Privacy
        </button>

        <button type="button" data-action="pin">
            <i class="fa-solid fa-pin"></i>
            Pin to top
        </button>

        <button type="button" data-action="copy-link">
            <i class="fa-solid fa-link"></i>
            Copy Link
        </button>

        <button type="button" data-action="hide">
            <i class="fa-solid fa-eye-slash"></i>
            Hide Post
        </button>

        <button type="button" data-action="edit">
            <i class="fa-solid fa-pen"></i>
            Edit Post
        </button>

        <button type="button" data-action="delete">
            <i class="fa-solid fa-trash-can"></i>
            Delete Post
        </button>
    `;

    document.body.appendChild(menu);

    const saveButton =
        menu.querySelector('[data-action="save"]');

    const refreshSaveState = async () => {

        const me =
            await socialhubGetMe();

        if (!me) {
            return;
        }

        const {
            data
        } = await db
            .from("saved_posts")
            .select("id")
            .eq("user_id", me.id)
            .eq("post_id", postId)
            .maybeSingle();

        const saved = !!data;

        saveButton.classList.toggle("saved", saved);

        saveButton.querySelector("span").textContent =
            saved ? "Saved" : "Save Post";

        saveButton.querySelector("i").className =
            saved
                ? "fa-solid fa-bookmark"
                : "fa-regular fa-bookmark";
    };

    const openMenu = event => {

        event.stopPropagation();

        document
            .querySelectorAll(".socialhub-post-menu.open")
            .forEach(item => item.classList.remove("open"));

        menu.classList.add("open");

        const rect =
            button.getBoundingClientRect();

        menu.style.top =
            `${rect.bottom + 4}px`;

        menu.style.left =
            `${rect.right}px`;

        refreshSaveState();
    };

    button.addEventListener("click", openMenu);

    menu
        .querySelector('[data-action="save"]')
        .addEventListener("click", async () => {

            const me =
                await socialhubGetMe();

            if (!me) {
                return;
            }

            const saved =
                saveButton.classList.contains("saved");

            if (saved) {

                await db
                    .from("saved_posts")
                    .delete()
                    .eq("user_id", me.id)
                    .eq("post_id", postId);

                socialhubToast(
                    "Post removed from saved.",
                    "info"
                );

            } else {

                await db
                    .from("saved_posts")
                    .insert({
                        user_id: me.id,
                        post_id: postId
                    });

                socialhubToast(
                    "Post saved! 🔖",
                    "success"
                );
            }

            refreshSaveState();
        });

    menu
        .querySelector('[data-action="pin"]')
        .addEventListener("click", async () => {

            menu.classList.remove("open");

            const {
                data: row,
                error: rowError
            } = await db
                .from("posts")
                .select("is_pinned")
                .eq("id", postId)
                .single();

            if (rowError || !row) {
                return;
            }

            const next =
                !row.is_pinned;

            const {
                error: upError
            } = await db
                .from("posts")
                .update({ is_pinned: next })
                .eq("id", postId);

            if (upError) {
                return;
            }

            socialhubToast(
                next
                    ? "Post pinned to top. 📌"
                    : "Post unpinned.",
                "success"
            );

            const container =
                post.closest("#profilePosts");

            if (container) {

                if (typeof socialhubLoadMyPosts === "function") {

                    socialhubLoadMyPosts();
                }

            } else if (typeof socialhubReloadFeed === "function") {

                socialhubReloadFeed();
            }
        });

    menu
        .querySelector('[data-action="copy-link"]')
        .addEventListener("click", () => {

            menu.classList.remove("open");

            const link =
                window.location.origin +
                "/index.html?post=" +
                postId;

            if (
                navigator.clipboard &&
                navigator.clipboard.writeText
            ) {

                navigator.clipboard
                    .writeText(link)
                    .then(() => {

                        socialhubToast(
                            "Link copied! 🔗",
                            "success"
                        );
                    });

            } else {

                window.prompt(
                    "Copy the post link:",
                    link
                );
            }
        });

    menu
        .querySelector('[data-action="hide"]')
        .addEventListener("click", () => {

            menu.classList.remove("open");

            post.style.display = "none";

            socialhubToast(
                "Post hidden.",
                "info"
            );
        });

    menu
        .querySelector('[data-action="privacy"]')
        .addEventListener("click", () => {

            menu.classList.remove("open");

            socialhubEditPrivacyModal(postId);
        });

    menu
        .querySelector('[data-action="edit"]')
        .addEventListener("click", () => {

            menu.classList.remove("open");

            socialhubOpenEditModal(postId, post);
        });

    menu
        .querySelector('[data-action="delete"]')
        .addEventListener("click", () => {

            menu.classList.remove("open");

            socialhubDeletePost(postId, post);
        });

    document.addEventListener("click", event => {

        if (
            event.target !== button &&
            !menu.contains(event.target)
        ) {

            menu.classList.remove("open");
        }
    });
}


// ======================================================
// 3a2. EDIT PRIVACY MODAL (audience picker)
// ======================================================

function socialhubEditPrivacyModal(postId) {

    const existing =
        document.querySelector(".socialhub-privacy-modal");

    if (existing) {
        existing.remove();
    }

    const overlay =
        document.createElement("div");

    overlay.className = "socialhub-privacy-modal";

    const values = [
        "public",
        "friends",
        "friends_of_friends",
        "only_me"
    ];

    overlay.innerHTML = `

        <div class="socialhub-privacy-box">

            <div class="socialhub-privacy-head">

                <h3>Edit Privacy</h3>

                <button
                    type="button"
                    class="socialhub-privacy-close"
                >
                    ✕
                </button>

            </div>

            <p class="socialhub-privacy-hint">
                Who can see this post?
            </p>

            <div class="socialhub-privacy-options">

                ${values.map(value => `

                    <button type="button" data-value="${value}">
                        ${SOCIALHUB_AUDIENCE_LABELS[value] || value}
                    </button>
                `).join("")}

            </div>

        </div>
    `;

    document.body.appendChild(overlay);

    overlay
        .querySelectorAll("[data-value]")
        .forEach(button => {

            button.addEventListener("click", async () => {

                const value =
                    button.dataset.value;

                const {
                    error
                } = await db
                    .from("posts")
                    .update({
                        audience: value
                    })
                    .eq("id", postId);

                if (error) {

                    alert(
                        "Could not update privacy: " +
                        error.message
                    );

                    return;
                }

                overlay.remove();

                socialhubToast(
                    "Privacy updated! 🔒",
                    "success"
                );

                await socialhubReloadFeed();
            });
        });

    overlay
        .querySelector(".socialhub-privacy-close")
        .addEventListener("click", () => overlay.remove());

    overlay.addEventListener("click", event => {

        if (event.target === overlay) {

            overlay.remove();
        }
    });
}


// ======================================================
// 3b. REPORT POST (moderation)
// ======================================================

function socialhubInjectReportMenu(post, postId) {

    const header =
        post.querySelector(".post-header");

    if (!header) {
        return;
    }

    const button =
        document.createElement("button");

    button.type = "button";

    button.className = "socialhub-post-menu-btn";

    button.title = "Post options";

    button.innerText = "⋯";

    header.appendChild(button);

    const menu =
        document.createElement("div");

    menu.className = "socialhub-post-menu";

    menu.innerHTML = `

        <button type="button" data-action="report">
            <i class="fa-solid fa-flag"></i>
            Report Post
        </button>
    `;

    document.body.appendChild(menu);

    const openMenu = event => {

        event.stopPropagation();

        document
            .querySelectorAll(".socialhub-post-menu.open")
            .forEach(item => item.classList.remove("open"));

        menu.classList.add("open");

        const rect =
            button.getBoundingClientRect();

        menu.style.top =
            `${rect.bottom + 4}px`;

        menu.style.left =
            `${rect.right}px`;
    };

    button.addEventListener("click", openMenu);

    menu
        .querySelector('[data-action="report"]')
        .addEventListener("click", () => {

            menu.classList.remove("open");

            socialhubOpenReportModal(postId);
        });

    document.addEventListener("click", event => {

        if (
            event.target !== button &&
            !menu.contains(event.target)
        ) {

            menu.classList.remove("open");
        }
    });
}


const socialhubReportReasons = [
    "Spam or scam",
    "Harassment or bullying",
    "Hate speech",
    "Violence or dangerous behavior",
    "Nudity or sexual content",
    "False information",
    "Something else"
];


function socialhubOpenReportModal(postId) {

    const existing =
        document.querySelector(".socialhub-report-modal");

    if (existing) {
        existing.remove();
    }

    const modal =
        document.createElement("div");

    modal.className = "socialhub-report-modal";

    modal.style.cssText =
        "position:fixed;inset:0;background:rgba(0,0,0,0.55);display:flex;align-items:center;justify-content:center;z-index:10000;padding:20px;";

    modal.innerHTML = `

        <div class="socialhub-cr-box" style="background:#fff;border-radius:10px;width:100%;max-width:440px;box-shadow:0 12px 40px rgba(0,0,0,0.25);overflow:hidden;">

            <div class="cr-head" style="padding:16px 18px;border-bottom:1px solid #e4e6eb;display:flex;align-items:center;justify-content:space-between;">

                <h2 style="margin:0;font-size:18px;display:flex;align-items:center;gap:8px;">
                    <i class="fa-solid fa-flag" style="color:#e41e3f;"></i>
                    Report Post
                </h2>

                <button class="cr-close" type="button" title="Close" style="border:none;background:#e4e6eb;width:32px;height:32px;border-radius:50%;cursor:pointer;">
                    <i class="fa-solid fa-xmark"></i>
                </button>

            </div>

            <div class="cr-body" style="padding:16px 18px;">

                <label>Why are you reporting this post?</label>

                <select id="reportReason" style="width:100%;box-sizing:border-box;padding:11px 13px;border:1px solid #d4d7dd;border-radius:8px;font-size:14px;font-family:inherit;outline:none;background:#fff;">
                    ${socialhubReportReasons.map(r => `<option>${r}</option>`).join("")}
                </select>

                <label>Details (optional)</label>

                <textarea id="reportDetails" rows="3" placeholder="Tell us more..."></textarea>

            </div>

            <div class="cr-actions" style="padding:14px 18px;border-top:1px solid #e4e6eb;display:flex;gap:10px;justify-content:flex-end;">

                <button class="socialhub-cr-cancel" type="button">Cancel</button>

                <button class="socialhub-create-btn" type="button" style="background:#e41e3f;">
                    <i class="fa-solid fa-flag"></i>
                    Submit Report
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

            const reason =
                modal.querySelector("#reportReason").value;

            const details =
                modal.querySelector("#reportDetails").value.trim();

            const me =
                await socialhubGetMe();

            if (!me) {
                return;
            }

            const content =
                details
                    ? reason + " — " + details
                    : reason;

            const { error } =
                await db
                    .from("reports")
                    .insert({
                        reporter_id: me.id,
                        post_id: postId,
                        reason: content
                    });

            if (error) {

                alert("Could not submit report: " + error.message);

                return;
            }

            modal.remove();

            const toast =
                document.createElement("div");

            toast.style.cssText =
                "position:fixed;bottom:24px;left:50%;transform:translateX(-50%);" +
                "background:#1c1e21;color:#fff;padding:12px 20px;border-radius:22px;" +
                "font-size:14px;font-weight:600;z-index:100001;box-shadow:0 6px 24px rgba(0,0,0,0.3);";

            toast.textContent = "✅ Thanks — your report has been submitted.";

            document.body.appendChild(toast);

            setTimeout(() => toast.remove(), 2600);
        });
}


// ======================================================
// 4. EDIT POST MODAL
// ======================================================

const socialhubEditBackgrounds = [
    { name: "None", value: "" },
    { name: "Blue", value: "linear-gradient(135deg,#2563eb,#60a5fa)" },
    { name: "Purple", value: "linear-gradient(135deg,#7c3aed,#c084fc)" },
    { name: "Sunset", value: "linear-gradient(135deg,#f97316,#ec4899)" },
    { name: "Ocean", value: "linear-gradient(135deg,#0891b2,#2563eb)" },
    { name: "Emerald", value: "linear-gradient(135deg,#059669,#34d399)" },
    { name: "Rose", value: "linear-gradient(135deg,#e11d48,#fb7185)" },
    { name: "Dark", value: "linear-gradient(135deg,#111827,#374151)" }
];


async function socialhubOpenEditModal(postId) {

    const {
        data: post,
        error
    } = await db
        .from("posts")
        .select("content, background, audience")
        .eq("id", postId)
        .single();

    if (error || !post) {

        alert("Could not load the post.");

        return;
    }

    const existing =
        document.querySelector(".socialhub-edit-modal");

    if (existing) {
        existing.remove();
    }

    const modal =
        document.createElement("div");

    modal.className = "socialhub-edit-modal";

    modal.innerHTML = `

        <div class="socialhub-edit-box">

            <div class="socialhub-edit-head">

                <h3>Edit Post</h3>

                <button
                    type="button"
                    class="socialhub-edit-close"
                >
                    ✕
                </button>

            </div>

            <textarea
                maxlength="1000"
                placeholder="What's on your mind?"
            >${socialhubEscape(post.content || "")}</textarea>

            <label class="socialhub-edit-bg-label">
                Background
            </label>

            <div class="socialhub-edit-bg-options"></div>

            <label class="socialhub-edit-bg-label">
                Audience
            </label>

            <select class="socialhub-edit-audience">

                <option value="public">
                    🌎 Public
                </option>

                <option value="friends">
                    👥 Friends
                </option>

                <option value="friends_of_friends">
                    🤝 Friends of Friends
                </option>

                <option value="only_me">
                    🔒 Only Me
                </option>

            </select>

            <div class="socialhub-edit-actions">

                <button
                    type="button"
                    class="socialhub-edit-cancel"
                >
                    Cancel
                </button>

                <button
                    type="button"
                    class="socialhub-edit-save"
                >
                    Save Changes
                </button>

            </div>

        </div>
    `;

    document.body.appendChild(modal);

    const textarea =
        modal.querySelector("textarea");

    const optionsBox =
        modal.querySelector(".socialhub-edit-bg-options");

    let selectedBackground =
        post.background || "";

    const audienceSelect =
        modal.querySelector(".socialhub-edit-audience");

    if (audienceSelect) {

        audienceSelect.value =
            post.audience || "public";
    }

    socialhubEditBackgrounds.forEach(bg => {

        const option =
            document.createElement("button");

        option.type = "button";

        option.className = "socialhub-edit-bg-option";

        option.title = bg.name;

        option.style.background =
            bg.value || "#e4e6eb";

        if (bg.value === selectedBackground) {

            option.classList.add("selected");
        }

        option.addEventListener("click", () => {

            optionsBox
                .querySelectorAll(".socialhub-edit-bg-option")
                .forEach(item => item.classList.remove("selected"));

            option.classList.add("selected");

            selectedBackground = bg.value;
        });

        optionsBox.appendChild(option);
    });

    modal
        .querySelector(".socialhub-edit-close")
        .addEventListener("click", () => modal.remove());

    modal
        .querySelector(".socialhub-edit-cancel")
        .addEventListener("click", () => modal.remove());

    modal.addEventListener("click", event => {

        if (event.target === modal) {
            modal.remove();
        }
    });

    modal
        .querySelector(".socialhub-edit-save")
        .addEventListener("click", async () => {

            const content =
                textarea.value.trim();

            if (content === "") {

                alert("Post cannot be empty.");

                return;
            }

            const button =
                modal.querySelector(".socialhub-edit-save");

            button.disabled = true;

            button.innerText = "Saving...";

            const {
                error: updateError
            } = await db
                .from("posts")
                .update({
                    content: content,
                    background:
                        selectedBackground || null,
                    audience:
                        audienceSelect
                            ? audienceSelect.value
                            : undefined
                })
                .eq("id", postId);

            if (updateError) {

                alert(
                    "Could not update post.\n\n" +
                    updateError.message
                );

                button.disabled = false;

                button.innerText = "Save Changes";

                return;
            }

            modal.remove();

            alert("Post updated! ✨");

            await socialhubReloadFeed();
        });
}


// ======================================================
// 5. DELETE POST
// ======================================================

async function socialhubDeletePost(postId, article) {

    if (!confirm("Delete this post? This cannot be undone.")) {
        return;
    }

    const {
        error
    } = await db
        .from("posts")
        .delete()
        .eq("id", postId);

    if (error) {

        alert(
            "Could not delete post.\n\n" +
            error.message
        );

        return;
    }

    socialhubOwnerCache.delete(postId);

    article.remove();

    alert("Post deleted. 🗑️");

    await socialhubReloadFeed();
}


// ======================================================
// 6. RELOAD THE CURRENT FEED
// ======================================================

async function socialhubReloadFeed() {

    if (typeof loadPostsWithUserNames === "function" && document.getElementById("posts")) {

        await loadPostsWithUserNames();

    } else if (typeof socialhubLoadMyPosts === "function" && document.getElementById("profilePosts")) {

        await socialhubLoadMyPosts();

    } else if (typeof loadPostsFromSupabase === "function" && document.getElementById("posts")) {

        await loadPostsFromSupabase();

    } else {

        location.reload();
    }
}


// ======================================================
// 7. AUTO-SYNC
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

    socialhubWatchPosts();

    const observer =
        new MutationObserver(() => {

            clearTimeout(window.socialhubMenuWatchTimer);

            window.socialhubMenuWatchTimer =
                setTimeout(socialhubWatchPosts, 300);
        });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    console.log(
        "✅ Post Manage activated!"
    );
});
