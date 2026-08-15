// ======================================================
// SOCIALHUB - POST SHARE SYSTEM (Facebook-style)
// Share to your timeline with a thought, copy link,
// share counts on posts, shared cards in the feed.
//
// Setup SQL (run once in Supabase SQL Editor):
//   create table if not exists public.post_shares (
//     id uuid primary key default gen_random_uuid(),
//     post_id uuid not null references public.posts (id) on delete cascade,
//     user_id uuid not null references public.profiles (id) on delete cascade,
//     thought text not null default '',
//     created_at timestamptz not null default now()
//   );
//   alter table public.post_shares enable row level security;
//   create policy "post_shares_select" on public.post_shares
//     for select using (true);
//   create policy "post_shares_insert" on public.post_shares
//     for insert with check (auth.uid() = user_id);
//   create policy "post_shares_delete" on public.post_shares
//     for delete using (auth.uid() = user_id);
// ======================================================

var db = window.db || supabaseClient;

let socialhubSharesCSSAdded = false;

function socialhubSharesInjectStyles() {

    if (socialhubSharesCSSAdded) {
        return;
    }

    socialhubSharesCSSAdded = true;

    const style = document.createElement("style");

    style.textContent = `

.socialhub-share-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.55);
    z-index: 21000;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: Arial, Helvetica, sans-serif;
}

.socialhub-share-dialog {
    width: min(92vw, 500px);
    max-height: 88vh;
    overflow-y: auto;
    background: var(--card-bg, #ffffff);
    color: var(--text, #1c1e21);
    border-radius: 16px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    padding: 18px;
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.socialhub-share-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.socialhub-share-head strong {
    font-size: 18px;
}

.socialhub-share-close {
    background: var(--hover, #f2f3f5);
    border: none;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    font-size: 14px;
    cursor: pointer;
    color: var(--text, #1c1e21);
}

.socialhub-share-box {
    display: flex;
    gap: 10px;
    align-items: flex-start;
}

.socialhub-share-box .avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--hover, #e4e6eb);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    flex: 0 0 auto;
    overflow: hidden;
}

.socialhub-share-box .avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.socialhub-share-box textarea {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    color: var(--text, #1c1e21);
    font-size: 15px;
    font-family: inherit;
    resize: none;
    padding: 8px 0;
    min-height: 60px;
}

.socialhub-share-preview {
    border: 1px solid var(--border, #dddfe2);
    border-radius: 12px;
    overflow: hidden;
    background: var(--hover, #f2f3f5);
}

.socialhub-share-preview-body {
    padding: 12px 14px;
}

.socialhub-share-preview-head {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-bottom: 8px;
}

.socialhub-share-preview-head .sp-avatar {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: #e4e6eb;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    overflow: hidden;
    flex: 0 0 auto;
}

.socialhub-share-preview-head .sp-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.socialhub-share-preview-head strong {
    font-size: 13px;
    display: block;
}

.socialhub-share-preview-head small {
    font-size: 11px;
    color: var(--muted, #65676b);
}

.socialhub-share-preview-text {
    font-size: 14px;
    white-space: pre-wrap;
    overflow-wrap: break-word;
}

.socialhub-share-preview-media img,
.socialhub-share-preview-media video {
    width: 100%;
    max-height: 320px;
    object-fit: cover;
    display: block;
}

.socialhub-share-buttons {
    display: flex;
    gap: 10px;
}

.socialhub-share-buttons .socialhub-share-postbtn {
    flex: 1;
    background: #1877f2;
    border: none;
    color: #fff;
    font-weight: 700;
    font-size: 15px;
    padding: 11px;
    border-radius: 10px;
    cursor: pointer;
}

.socialhub-share-buttons .socialhub-share-postbtn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.socialhub-share-buttons .socialhub-share-copybtn {
    flex: 1;
    background: var(--hover, #e4e6eb);
    border: none;
    color: var(--text, #1c1e21);
    font-weight: 600;
    font-size: 14px;
    padding: 11px;
    border-radius: 10px;
    cursor: pointer;
}

.socialhub-shared-card {
    border: 1px solid var(--border, #dddfe2);
    border-radius: 12px;
    margin: 8px 0 0;
    background: var(--hover, #f2f3f5);
    overflow: hidden;
    text-align: left;
}

.socialhub-shared-card-head {
    display: flex;
    gap: 8px;
    align-items: center;
    padding: 10px 12px;
}

.socialhub-shared-card-head .sc-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #e4e6eb;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    overflow: hidden;
    flex: 0 0 auto;
}

.socialhub-shared-card-head .sc-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.socialhub-shared-card-head strong {
    font-size: 13px;
    display: block;
}

.socialhub-shared-card-head small {
    font-size: 11px;
    color: var(--muted, #65676b);
}

.socialhub-shared-card-content {
    padding: 0 12px 12px;
    font-size: 14px;
    white-space: pre-wrap;
    overflow-wrap: break-word;
}

.socialhub-shared-card-media img,
.socialhub-shared-card-media video {
    width: 100%;
    max-height: 300px;
    object-fit: cover;
    display: block;
}

.socialhub-share-count {
    cursor: default;
}

.socialhub-share-audience {
    position: relative;
    padding: 0 14px 10px;
}

.socialhub-share-audience-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #e4e6eb;
    border: none;
    border-radius: 16px;
    padding: 6px 12px;
    font-size: 13px;
    font-weight: 700;
    color: #050505;
    cursor: pointer;
}

.socialhub-share-audience-btn:hover {
    background: #d8dadf;
}

.socialhub-share-audience-menu {
    position: absolute;
    left: 14px;
    top: 34px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    padding: 6px;
    z-index: 60;
    min-width: 210px;
}

.socialhub-share-audience-menu button {
    display: block;
    width: 100%;
    text-align: left;
    background: none;
    border: none;
    border-radius: 8px;
    padding: 9px 12px;
    font-size: 14px;
    font-weight: 600;
    color: #050505;
    cursor: pointer;
}

.socialhub-share-audience-menu button:hover {
    background: #f0f2f5;
}

body.dark-mode .socialhub-share-audience-btn {
    background: #3a3b3c;
    color: #e4e6eb;
}

body.dark-mode .socialhub-share-audience-menu {
    background: #242526;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
}

body.dark-mode .socialhub-share-audience-menu button {
    color: #e4e6eb;
}

body.dark-mode .socialhub-share-audience-menu button:hover {
    background: #3a3b3c;
}

body.dark-mode .socialhub-share-dialog {
    background: #242526;
    color: #e4e6eb;
}

body.dark-mode .socialhub-share-close {
    background: #3a3b3c;
    color: #e4e6eb;
}

body.dark-mode .socialhub-share-box textarea {
    color: #e4e6eb;
}

body.dark-mode .socialhub-share-preview {
    border-color: #3e4042;
    background: #18191a;
}

body.dark-mode .socialhub-share-preview-head small {
    color: #b0b3b8;
}

body.dark-mode .socialhub-share-buttons .socialhub-share-copybtn {
    background: #3a3b3c;
    color: #e4e6eb;
}

body.dark-mode .socialhub-shared-card {
    border-color: #3e4042;
    background: #18191a;
}

`;

    document.head.appendChild(style);
}


// ======================================================
// OPEN THE SHARE DIALOG
// ======================================================

async function socialhubShareDialog(postId) {

    socialhubSharesInjectStyles();

    const me =
        await socialhubGetMe();

    if (!me) {
        alert("Please login first.");
        return;
    }

    const {
        data: post,
        error
    } = await db
        .from("posts")
        .select("*")
        .eq("id", postId)
        .maybeSingle();

    if (error || !post) {

        alert(
            "Could not load this post.\n\n" +
            (error ? error.message : "Not found")
        );

        return;
    }

    const {
        data: author
    } = await db
        .from("profiles")
        .select("id, full_name, username, avatar_url")
        .eq("id", post.user_id)
        .maybeSingle();

    const overlay =
        document.createElement("div");

    overlay.className = "socialhub-share-overlay";

    const avatarHTML =
        author?.avatar_url
            ? `<img src="${socialhubEscape(author.avatar_url)}" alt="">`
            : "👤";

    const mediaHTML =
        post.image_url
            ? `<div class="socialhub-share-preview-media"><img src="${socialhubEscape(post.image_url)}" alt=""></div>`
            : post.video_url
                ? `<div class="socialhub-share-preview-media"><video src="${socialhubEscape(post.video_url)}" muted playsinline controls></video></div>`
                : "";

    const textStyle =
        post.background
            ? `style="background:${socialhubEscape(post.background)};color:#fff;padding:20px;border-radius:10px;font-size:17px;font-weight:600;text-align:center;margin-top:8px;"`
            : "";

    overlay.innerHTML = `
        <div class="socialhub-share-dialog">

            <div class="socialhub-share-head">
                <strong>Share</strong>
                <button type="button" class="socialhub-share-close">✕</button>
            </div>

            <div class="socialhub-share-box">
                <div class="avatar">${avatarHTML}</div>
                <textarea class="socialhub-share-thought" maxlength="300" placeholder="Say something about this..."></textarea>
            </div>

            <div class="socialhub-share-audience">
                <button type="button" class="socialhub-share-audience-btn">
                    <span class="socialhub-share-audience-label">🌎 Public</span>
                    <span>▾</span>
                </button>
                <div class="socialhub-share-audience-menu" style="display:none">
                    <button type="button" data-audience="public">🌎 Public</button>
                    <button type="button" data-audience="friends">👥 Friends</button>
                    <button type="button" data-audience="friends_of_friends">🤝 Friends of Friends</button>
                    <button type="button" data-audience="only_me">🔒 Only Me</button>
                </div>
            </div>

            <div class="socialhub-share-preview">

                <div class="socialhub-share-preview-body">

                    <div class="socialhub-share-preview-head">
                        <div class="sp-avatar">${avatarHTML}</div>
                        <div>
                            <strong>${socialhubEscape(author?.full_name || "User")}</strong>
                            <small>${new Date(post.created_at).toLocaleString()}</small>
                        </div>
                    </div>

                    <div class="socialhub-share-preview-text" ${textStyle}>
                        ${socialhubEscape(post.content || "")}
                    </div>

                </div>

                ${mediaHTML}

            </div>

            <div class="socialhub-share-buttons">
                <button type="button" class="socialhub-share-postbtn">Share now</button>
                <button type="button" class="socialhub-share-copybtn">🔗 Copy link</button>
            </div>

        </div>
    `;

    document.body.appendChild(overlay);

    overlay
        .querySelector(".socialhub-share-close")
        .addEventListener("click", () => overlay.remove());

    overlay.addEventListener("click", event => {

        if (event.target === overlay) {
            overlay.remove();
        }
    });

    let shareAudience =
        window.socialhubAudience ||
        "public";

    const audienceBtn =
        overlay.querySelector(".socialhub-share-audience-btn");

    const audienceMenu =
        overlay.querySelector(".socialhub-share-audience-menu");

    const audienceLabel =
        overlay.querySelector(".socialhub-share-audience-label");

    if (audienceBtn && audienceMenu) {

        audienceBtn.addEventListener("click", event => {

            event.stopPropagation();

            audienceMenu.style.display =
                audienceMenu.style.display === "none"
                    ? "block"
                    : "none";
        });

        audienceMenu
            .querySelectorAll("button")
            .forEach(option => {

                option.addEventListener("click", () => {

                    shareAudience =
                        option.dataset.audience;

                    if (audienceLabel) {

                        audienceLabel.textContent =
                            SOCIALHUB_AUDIENCE_LABELS[
                                shareAudience
                            ] || "🌎 Public";
                    }

                    audienceMenu.style.display = "none";
                });
            });

        overlay.addEventListener("click", () => {

            audienceMenu.style.display = "none";
        });
    }

    overlay
        .querySelector(".socialhub-share-copybtn")
        .addEventListener("click", async () => {

            const url =
                `${location.origin}/user-profile.html?user=${post.user_id}#post-${post.id}`;

            try {

                await navigator.clipboard.writeText(url);

                const btn =
                    overlay.querySelector(".socialhub-share-copybtn");

                btn.textContent = "✅ Link copied!";

                setTimeout(() => {

                    btn.textContent = "🔗 Copy link";
                }, 1800);

            } catch (copyError) {

                alert(
                    "Could not copy the link.\n\n" +
                    copyError.message
                );
            }
        });

    overlay
        .querySelector(".socialhub-share-postbtn")
        .addEventListener("click", async () => {

            const button =
                overlay.querySelector(".socialhub-share-postbtn");

            const thought =
                overlay.querySelector(".socialhub-share-thought").value.trim();

            button.disabled = true;

            button.textContent = "Sharing...";

            try {

                const {
                    error: insertError
                } = await db
                    .from("post_shares")
                    .insert({
                        post_id: postId,
                        user_id: me.id,
                        thought: thought,
                        audience: shareAudience
                    });

                if (insertError) {
                    throw insertError;
                }

                overlay.remove();

                alert("Shared to your timeline! 🎉");

                if (
                    typeof loadPostsWithUserNames ===
                    "function"
                ) {
                    await loadPostsWithUserNames();
                }

            } catch (error) {

                console.error(
                    "❌ Share error:",
                    error
                );

                alert(
                    "Could not share the post.\n\n" +
                    error.message
                );

                button.disabled = false;

                button.textContent = "Share now";
            }
        });
}


// ======================================================
// SHARE COUNTS ON POSTS
// ======================================================

async function socialhubApplyShareCounts(container) {

    if (!container) {
        return;
    }

    const postIds = [
        ...new Set(
            [...container.querySelectorAll(".post")]
                .map(post => post.dataset.postId)
                .filter(Boolean)
        )
    ];

    if (postIds.length === 0) {
        return;
    }

    try {

        const {
            data
        } = await db
            .from("post_shares")
            .select("post_id")
            .in("post_id", postIds);

        const counts = new Map();

        (data || []).forEach(share => {

            counts.set(
                share.post_id,
                (counts.get(share.post_id) || 0) + 1
            );
        });

        container
            .querySelectorAll(".post")
            .forEach(post => {

                const count =
                    counts.get(post.dataset.postId) || 0;

                if (count > 0) {

                    const span =
                        document.createElement("span");

                    span.className = "socialhub-share-count";

                    span.textContent =
                        `↗️ ${count} Share${count > 1 ? "s" : ""}`;

                    const stats =
                        post.querySelector(".post-stats");

                    if (stats) {
                        stats.appendChild(span);
                    }
                }
            });

    } catch (error) {

        console.error(
            "❌ Share count error:",
            error
        );
    }
}


// ======================================================
// SHARE CARD FOR THE FEED
// ======================================================

function socialhubBuildShareCard(share, originalPost, originalProfile, sharerProfile) {

    const article =
        document.createElement("article");

    article.className = "post";

    article.dataset.postId =
        originalPost.id;

    article.dataset.shareId =
        share.id;

    const sharerName =
        sharerProfile?.full_name || "User";

    const sharerUsername =
        sharerProfile?.username || "user";

    const sharerAvatar =
        sharerProfile?.avatar_url || "";

    const authorName =
        originalProfile?.full_name || "User";

    const authorAvatar =
        originalProfile?.avatar_url || "";

    const sharerAvatarHTML =
        sharerAvatar
            ? `<img src="${socialhubEscape(sharerAvatar)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
            : "👤";

    const authorAvatarHTML =
        authorAvatar
            ? `<img src="${socialhubEscape(authorAvatar)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
            : "👤";

    const originalMedia =
        originalPost.image_url
            ? `<div class="socialhub-shared-card-media"><img src="${socialhubEscape(originalPost.image_url)}" alt=""></div>`
            : originalPost.video_url
                ? `<div class="socialhub-shared-card-media"><video src="${socialhubEscape(originalPost.video_url)}" muted playsinline controls></video></div>`
                : "";

    const originalTextStyle =
        originalPost.background
            ? `style="background:${socialhubEscape(originalPost.background)};color:#fff;padding:16px;border-radius:10px;font-size:15px;font-weight:600;text-align:center;"`
            : "";

    article.innerHTML = `

        <div class="post-header">

            <div class="avatar">${sharerAvatarHTML}</div>

            <div>
                <h3 class="post-user-name">${socialhubEscape(sharerName)}</h3>
                <small>
                    @${socialhubEscape(sharerUsername)}
                    · shared ${socialhubEscape(authorName)}'s post
                    · ${new Date(share.created_at).toLocaleString()}
                    · ↗️
                </small>
            </div>

        </div>

        ${share.thought ? `<p class="post-text" style="margin:0 0 10px;line-height:1.6;white-space:pre-wrap;overflow-wrap:break-word;">${socialhubEscape(share.thought)}</p>` : ""}

        <div class="socialhub-shared-card">

            <div class="socialhub-shared-card-head">
                <div class="sc-avatar">${authorAvatarHTML}</div>
                <div>
                    <strong>${socialhubEscape(authorName)}</strong>
                    <small>${new Date(originalPost.created_at).toLocaleString()}</small>
                </div>
            </div>

            <div class="socialhub-shared-card-content" ${originalTextStyle}>
                ${socialhubEscape(originalPost.content || "")}
            </div>

            ${originalMedia}

        </div>

        <div class="post-stats">
            <span>❤️ 0 Likes</span>
            <span>💬 0 Comments</span>
        </div>

        <div class="post-actions">

            <button
                class="fb-action-btn fb-like-slot"
                onclick="socialhubReact(this, '${originalPost.id}', 'like')"
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
                onclick="socialhubShareDialog('${originalPost.id}')"
            >
                <i class="fa-solid fa-share-from-square"></i>
                <span class="fb-action-label">Share</span>
            </button>

        </div>

        <div class="comment-box">

            <input type="text" placeholder="Write a comment..." class="comment-input">

            <button onclick="addComment(this)">Send</button>

        </div>

        <div class="comments"></div>

    `;

    return article;
}


// ======================================================
// FETCH SHARES FOR A PAGE WINDOW (used by feed loader)
// ======================================================

async function socialhubFetchShareWindow(offset, limit) {

    const {
        data: shares,
        error
    } = await db
        .from("post_shares")
        .select("*, posts(*)")
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        console.error("❌ Shares load error:", error);
        return [];
    }

    return (shares || []).filter(
        share => share.posts
    );
}
