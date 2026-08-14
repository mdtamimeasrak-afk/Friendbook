// ======================================================
// SOCIALHUB - WATCH (📺 Video feed + player)
// ======================================================
// watch.html loads this file.
//
// Features:
//   1. Video grid (all posts with video_url)
//   2. Player modal: autoplay, fullscreen, next video
//   3. Like / reaction / comment / share inside player
//      (reuses likes-comments.js + shares.js handlers)
// ======================================================

(function socialhubWatchInjectStyles() {

    const style =
        document.createElement("style");

    style.textContent = `

.watch-main {
    max-width: 960px;
    margin: 0 auto;
    padding: 18px 14px 40px;
}

.watch-header h1 {
    margin: 0 0 4px;
    font-size: 22px;
}

.watch-header p {
    margin: 0 0 16px;
    color: #65676b;
    font-size: 13.5px;
}

.watch-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 12px;
}

.watch-card {
    position: relative;
    border-radius: 14px;
    overflow: hidden;
    background: #000;
    cursor: pointer;
    aspect-ratio: 9 / 13;
}

.watch-card video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    pointer-events: none;
}

.watch-card .watch-card-play {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 42px;
    color: #fff;
    text-shadow: 0 2px 12px rgba(0, 0, 0, 0.6);
    pointer-events: none;
}

.watch-card-info {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 26px 10px 8px;
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.75));
    color: #fff;
    font-size: 12.5px;
    pointer-events: none;
}

.watch-card-info strong {
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.watch-card-info span {
    opacity: 0.85;
}

.watch-load-more {
    display: block;
    margin: 22px auto 0;
    border: none;
    background: #1877f2;
    color: #fff;
    padding: 10px 26px;
    border-radius: 24px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
}

.watch-load-more:hover {
    background: #166fe5;
}

/* ------- PLAYER MODAL ------- */

.watch-player {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.92);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 10px;
    overflow-y: auto;
}

.watch-player-box {
    background: #fff;
    border-radius: 16px;
    width: 100%;
    max-width: 460px;
    max-height: 94vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.watch-player-video {
    position: relative;
    background: #000;
    aspect-ratio: 9 / 16;
}

.watch-player-video video {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.watch-player-top {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px;
    background: linear-gradient(rgba(0, 0, 0, 0.6), transparent);
}

.watch-player-top button {
    border: none;
    background: rgba(255, 255, 255, 0.92);
    border-radius: 50%;
    width: 34px;
    height: 34px;
    font-size: 14px;
    cursor: pointer;
}

.watch-player-top .watch-player-close {
    margin-left: auto;
}

.watch-player-owner {
    color: #fff;
    font-size: 13.5px;
    font-weight: 700;
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
}

.watch-player-owner img,
.watch-player-owner .watch-avatar {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    object-fit: cover;
    background: #fff;
    color: #1877f2;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 13px;
    flex-shrink: 0;
}

.watch-player-caption {
    padding: 12px 14px 4px;
    font-size: 14px;
    color: #1c1e21;
}

.watch-player-time {
    padding: 0 14px 10px;
    font-size: 12px;
    color: #65676b;
}

/* Reuse post card interaction styles inside player */
.watch-player-box .post {
    border: none;
    border-top: 1px solid #e4e6eb;
    border-radius: 0;
    padding: 0;
}

.watch-player-box .post-stats {
    padding: 10px 14px 6px;
}

.watch-player-box .post-actions {
    padding: 0 10px;
}

.watch-player-box .comments {
    padding: 0 14px 12px;
}

.watch-player-comment-row {
    display: flex;
    gap: 8px;
    padding: 8px 14px 12px;
    border-top: 1px solid #e4e6eb;
}

.watch-player-comment-row input {
    flex: 1;
    border: 1px solid #d4d7dd;
    border-radius: 20px;
    padding: 8px 14px;
    font-size: 13.5px;
    background: #f0f2f5;
    outline: none;
}

.watch-player-comment-row button {
    border: none;
    background: #1877f2;
    color: #fff;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 13.5px;
    font-weight: 700;
    cursor: pointer;
}

.watch-player-next {
    display: block;
    margin: 10px 14px 14px;
    border: 1.5px solid #1877f2;
    background: transparent;
    color: #1877f2;
    padding: 8px;
    border-radius: 20px;
    font-size: 13.5px;
    font-weight: 700;
    cursor: pointer;
}

.watch-player-next:hover {
    background: #e7f3ff;
}

body.dark-mode .watch-player-box {
    background: #242526;
}

body.dark-mode .watch-player-caption {
    color: #e4e6eb;
}

body.dark-mode .watch-player-time {
    color: #b0b3b8;
}

body.dark-mode .watch-player-box .post {
    border-top-color: #3a3b3c;
}

body.dark-mode .watch-player-comment-row {
    border-top-color: #3a3b3c;
}

body.dark-mode .watch-player-comment-row input {
    background: #3a3b3c;
    border-color: #4e4f50;
    color: #e4e6eb;
}

body.dark-mode .watch-player-next {
    color: #4d9bff;
    border-color: #4d9bff;
}

@media (max-width: 640px) {
    .watch-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
    }

    .watch-player {
        padding: 0;
    }

    .watch-player-box {
        max-width: 100%;
        height: 100vh;
        max-height: 100vh;
        border-radius: 0;
    }
}
`;

    document.head.appendChild(style);
})();


// ======================================================
// 1. HELPERS
// ======================================================

let socialhubWatchList = [];
let socialhubWatchProfiles = new Map();
let socialhubWatchOffset = 0;
let socialhubWatchLimit = 12;
let socialhubWatchLoading = false;


function socialhubWatchEscape(text) {

    const div =
        document.createElement("div");

    div.innerText =
        text || "";

    return div.innerHTML;
}


function socialhubWatchTimeAgo(dateString) {

    const seconds =
        Math.floor(
            (Date.now() - new Date(dateString).getTime()) / 1000
        );

    if (seconds < 60) {
        return "Just now";
    }

    const minutes =
        Math.floor(seconds / 60);

    if (minutes < 60) {
        return minutes + "m ago";
    }

    const hours =
        Math.floor(minutes / 60);

    if (hours < 24) {
        return hours + "h ago";
    }

    const days =
        Math.floor(hours / 24);

    if (days < 7) {
        return days + "d ago";
    }

    return new Date(dateString).toLocaleDateString();
}


function socialhubWatchAvatarHTML(profile) {

    if (profile && profile.avatar_url) {

        return `
            <img
                src="${socialhubWatchEscape(profile.avatar_url)}"
                alt=""
            >
        `;
    }

    const letter =
        (
            profile && profile.full_name
                ? profile.full_name
                : "U"
        ).charAt(0).toUpperCase();

    return `
        <span class="watch-avatar">
            ${socialhubWatchEscape(letter)}
        </span>
    `;
}


// ======================================================
// 2. LOAD VIDEO GRID
// ======================================================

async function socialhubWatchLoad(reset) {

    if (socialhubWatchLoading) {
        return;
    }

    socialhubWatchLoading = true;

    const grid =
        document.getElementById("watchGrid");

    const loadMoreBtn =
        document.getElementById("watchLoadMore");

    if (!grid) {
        return;
    }

    if (reset) {

        socialhubWatchList = [];
        socialhubWatchProfiles = new Map();
        socialhubWatchOffset = 0;
        grid.innerHTML = `
            <p class="empty-message">
                Loading videos...
            </p>
        `;
    }

    const {
        data: posts,
        error
    } = await db
        .from("posts")
        .select(
            "id, user_id, content, video_url, created_at"
        )
        .not("video_url", "is", null)
        .order("created_at", { ascending: false })
        .range(
            socialhubWatchOffset,
            socialhubWatchOffset + socialhubWatchLimit - 1
        );

    socialhubWatchLoading = false;

    if (error) {

        console.error(
            "❌ Watch load error:",
            error
        );

        grid.innerHTML = `
            <p class="empty-message">
                Could not load videos.
            </p>
        `;

        return;
    }

    if (!posts || posts.length === 0) {

        if (reset) {

            grid.innerHTML = `
                <p class="empty-message">
                    No videos yet. Post a video to see it here!
                </p>
            `;
        }

        loadMoreBtn.style.display = "none";

        return;
    }

    const userIds =
        [...new Set(
            posts.map(p => p.user_id)
        )];

    const {
        data: profiles
    } = await db
        .from("profiles")
        .select("id, full_name, username, avatar_url")
        .in("id", userIds);

    const profileMap = new Map();

    (profiles || []).forEach(profile => {

        profileMap.set(profile.id, profile);

        socialhubWatchProfiles.set(
            profile.id,
            profile
        );
    });

    if (reset) {

        grid.innerHTML = "";
    }

    posts.forEach(post => {

        socialhubWatchList.push(post);

        grid.appendChild(
            socialhubWatchCard(
                post,
                profileMap.get(post.user_id)
            )
        );
    });

    socialhubWatchOffset += posts.length;

    loadMoreBtn.style.display =
        posts.length >= socialhubWatchLimit
            ? ""
            : "none";
}


function socialhubWatchCard(post, profile) {

    profile =
        profile || {};

    const card =
        document.createElement("div");

    card.className = "watch-card";

    card.innerHTML = `
        <video
            src="${socialhubWatchEscape(post.video_url)}"
            muted
            playsinline
            preload="metadata"
        ></video>

        <div class="watch-card-play">▶️</div>

        <div class="watch-card-info">
            <strong>
                ${socialhubWatchEscape(profile.full_name || "@" + (profile.username || "user"))}
            </strong>
            <span>
                ${socialhubWatchEscape(post.content || "")}
            </span>
        </div>
    `;

    card.addEventListener(
        "click",
        () => {

            socialhubWatchOpen(
                post.id,
                socialhubWatchList.length - 1
            );
        }
    );

    return card;
}


// ======================================================
// 3. PLAYER MODAL
// ======================================================

let socialhubWatchCurrentIndex = -1;


async function socialhubWatchOpen(postId, index) {

    if (typeof index === "number") {

        socialhubWatchCurrentIndex = index;

    } else {

        socialhubWatchCurrentIndex =
            socialhubWatchList.findIndex(p => p.id === postId);
    }

    let post = null;

    if (socialhubWatchCurrentIndex >= 0) {

        post = socialhubWatchList[socialhubWatchCurrentIndex];
    }

    if (!post || post.id !== postId) {

        const {
            data,
            error
        } = await db
            .from("posts")
            .select(
                "id, user_id, content, video_url, created_at"
            )
            .eq("id", postId)
            .single();

        if (error || !data) {

            alert("Video not found.");

            return;
        }

        post = data;

        const {
            data: profileRows
        } = await db
            .from("profiles")
            .select("id, full_name, username, avatar_url")
            .eq("id", post.user_id)
            .maybeSingle();

        if (profileRows) {

            socialhubWatchProfiles.set(
                post.user_id,
                profileRows
            );
        }

        socialhubWatchCurrentIndex =
            socialhubWatchList.findIndex(p => p.id === postId);
    }

    const player =
        document.getElementById("watchPlayer");

    const profile =
        socialhubWatchProfiles.get(post.user_id) || {};

    player.innerHTML = `

        <div class="watch-player-box">

            <div class="watch-player-video">

                <video
                    src="${socialhubWatchEscape(post.video_url)}"
                    controls
                    autoplay
                    playsinline
                ></video>

                <div class="watch-player-top">

                    <a
                        class="watch-player-owner"
                        href="user-profile.html?user=${post.user_id}"
                    >
                        ${socialhubWatchAvatarHTML(profile)}
                        ${socialhubWatchEscape(profile.full_name || "@" + (profile.username || "user"))}
                    </a>

                    <button
                        class="watch-player-close"
                        title="Close"
                    >
                        ✕
                    </button>

                </div>

            </div>

            <p class="watch-player-caption">
                ${socialhubWatchEscape(post.content || "")}
            </p>

            <p class="watch-player-time">
                🕐 ${socialhubWatchTimeAgo(post.created_at)}
            </p>

            <article
                class="post"
                data-post-id="${post.id}"
            >

                <div class="post-stats">

                    <span>
                        <i class="fa-solid fa-heart"></i>
                        0 Likes
                    </span>

                    <span>
                        <i class="fa-solid fa-comment"></i>
                        0 Comments
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
                        onclick="socialhubWatchToggleComments(this)"
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

                <div class="comments"></div>

            </article>

            <div class="watch-player-comment-row">

                <input
                    type="text"
                    class="comment-input"
                    placeholder="Write a comment..."
                >

                <button onclick="addComment(this)">
                    Send
                </button>

            </div>

            <button
                class="watch-player-next"
                onclick="socialhubWatchNext()"
            >
                ⏭️ Next Video
            </button>

        </div>
    `;

    player.style.display = "";

    // Close
    player
        .querySelector(".watch-player-close")
        .addEventListener("click", () => {

            player.style.display = "none";

            const video =
                player.querySelector("video");

            if (video) {
                video.pause();
            }
        });

    player.addEventListener("click", event => {

        if (event.target === player) {

            player.style.display = "none";

            const video =
                player.querySelector("video");

            if (video) {
                video.pause();
            }
        }
    });

    document.addEventListener("keydown", function escapeClose(event) {

        if (event.key === "Escape" && player.style.display !== "none") {

            player.style.display = "none";

            const video =
                player.querySelector("video");

            if (video) {
                video.pause();
            }

            document.removeEventListener("keydown", escapeClose);
        }
    });

    // Load interactions (likes/comments/reactions) for the player card
    if (typeof socialhubLoadInteractions === "function") {

        socialhubLoadInteractions();
    }
}


function socialhubWatchNext() {

    if (socialhubWatchList.length === 0) {
        return;
    }

    let nextIndex =
        socialhubWatchCurrentIndex + 1;

    if (
        nextIndex >= socialhubWatchList.length
    ) {

        socialhubWatchOpen(
            socialhubWatchList[0].id,
            0
        );

        return;
    }

    const next =
        socialhubWatchList[nextIndex];

    socialhubWatchOpen(
        next.id,
        nextIndex
    );
}


function socialhubWatchToggleComments(button) {

    const post =
        button.closest(".post");

    if (!post) {
        return;
    }

    const comments =
        post.querySelector(".comments");

    const row =
        post.parentElement.querySelector(
            ".watch-player-comment-row"
        );

    const visible =
        comments.style.display !== "none";

    comments.style.display =
        visible ? "none" : "";

    if (row) {

        row.style.display =
            visible ? "none" : "";
    }

    if (!visible) {

        const input =
            row ? row.querySelector("input") : null;

        if (input) {
            input.focus();
        }
    }
}


// ======================================================
// 4. AUTO-SYNC
// ======================================================

document.addEventListener("DOMContentLoaded", async () => {

    if (
        window.location.pathname
            .split("/")
            .pop() !== "watch.html"
    ) {
        return;
    }

    // Dark mode
    const savedDarkMode =
        localStorage.getItem("darkMode");

    if (savedDarkMode === "true") {

        document.body.classList.add("dark-mode");
    }

    const loadMore =
        document.getElementById("watchLoadMore");

    if (loadMore) {

        loadMore.addEventListener(
            "click",
            () => socialhubWatchLoad(false)
        );
    }

    await socialhubWatchLoad(true);

    // Deep link: watch.html?video=<postId>
    const params =
        new URLSearchParams(window.location.search);

    const videoId =
        params.get("video");

    if (videoId) {

        await socialhubWatchOpen(videoId);
    }

    console.log("✅ Watch activated!");
});