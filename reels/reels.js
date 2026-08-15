// ======================================================
// SOCIALHUB - REELS (Instagram/Facebook style)
// ======================================================
// Full-screen vertical video feed:
//   1. Loads reels (posts with is_reel = true)
//   2. Scroll-snap autoplay (muted) with mute toggle
//   3. Like / comment / share / save / delete
//   4. Upload modal (vertical video + caption)
//
// Setup (run once in Supabase SQL Editor):
//
//     alter table public.posts
//       add column if not exists is_reel boolean
//       default false;
//
// Load this script ONLY on reels.html, AFTER script.js.
// ======================================================

var db = window.db || supabaseClient;

const socialhubReelMaxVideoSize = 100 * 1024 * 1024;


// ======================================================
// 1. HELPERS
// ======================================================

function socialhubReelEscape(text) {

    const div =
        document.createElement("div");

    div.innerText =
        text || "";

    return div.innerHTML;
}


async function socialhubReelGetMe() {

    const {
        data,
        error
    } = await db.auth.getUser();

    if (error || !data.user) {

        return null;
    }

    return data.user;
}


function socialhubReelToast(message) {

    const old =
        document.querySelector(".socialhub-reel-toast");

    if (old) {
        old.remove();
    }

    const toast =
        document.createElement("div");

    toast.className = "socialhub-reel-toast";

    toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        background: #1c1e21;
        color: #ffffff;
        padding: 10px 20px;
        border-radius: 24px;
        font-size: 14px;
        font-weight: 600;
        z-index: 10001;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
    `;

    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 2600);
}


function socialhubReelAvatarHTML(profile) {

    if (profile && profile.avatar_url) {

        return `
            <img
                src="${socialhubReelEscape(profile.avatar_url)}"
                alt="${socialhubReelEscape(profile.full_name || "User")}"
            >
        `;
    }

    return "👤";
}


function socialhubReelTimeAgo(dateString) {

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


// ======================================================
// 2. STATE
// ======================================================

let socialhubReelsMuted = true;

let socialhubReelsActiveId = null;

let socialhubReelsCommentId = null;

let socialhubReelsObserver = null;


// ======================================================
// 3. LOAD + RENDER REELS
// ======================================================

async function socialhubReelLoad() {

    const feed =
        document.getElementById("reelsFeed");

    if (!feed) {
        return;
    }

    const me =
        await socialhubReelGetMe();

    const {
        data: reels,
        error
    } = await db
        .from("posts")
        .select("id, user_id, content, video_url, created_at")
        .eq("is_reel", true)
        .order("created_at", {
            ascending: false
        });

    if (error) {

        feed.innerHTML = `
            <p class="reels-empty">
                Could not load reels.
            </p>
        `;

        return;
    }

    if (!reels || reels.length === 0) {

        feed.innerHTML = `
            <p class="reels-empty">
                No reels yet — tap ➕ to create the first one!
            </p>
        `;

        return;
    }

    const userIds = [
        ...new Set(reels.map(reel => reel.user_id))
    ];

    const {
        data: profiles
    } = await db
        .from("profiles")
        .select("id, full_name, username, avatar_url")
        .in("id", userIds);

    const profileMap = new Map();

    (profiles || []).forEach(profile => {

        profileMap.set(profile.id, profile);
    });

    socialhubReelsList = reels;

    feed.innerHTML = "";

    reels.forEach(reel => {

        feed.appendChild(
            socialhubReelBuild(
                reel,
                profileMap.get(reel.user_id),
                me
            )
        );
    });

    socialhubReelSetupObserver();

    socialhubReelLoadInteractions();

    console.log("✅ Reels loaded:", reels.length);
}


let socialhubReelsList = [];


function socialhubReelBuild(reel, profile, me) {

    const slide =
        document.createElement("article");

    slide.className = "reel-item";

    slide.dataset.reelId = reel.id;

    const isMine =
        me && reel.user_id === me.id;

    slide.innerHTML = `

        <div class="reel-frame">

            <video
                class="reel-video"
                src="${socialhubReelEscape(reel.video_url)}"
                playsinline
                muted
                loop
                preload="metadata"
            ></video>

            <div class="reel-gradient"></div>

            <div class="reel-info">

                <div class="reel-owner-avatar">
                    ${socialhubReelAvatarHTML(profile)}
                </div>

                <div>

                    <p class="reel-owner-name">
                        ${socialhubReelEscape(profile?.full_name || "Friendio User")}
                    </p>

                    <p class="reel-caption">
                        ${socialhubReelEscape(reel.content || "")}
                    </p>

                    <p class="reel-time">
                        ${socialhubReelTimeAgo(reel.created_at)}
                    </p>

                </div>

            </div>

            <div class="reel-rail">

                <button
                    type="button"
                    class="reel-rail-btn"
                    data-reel-action="like"
                    title="Like"
                >
                    <i class="fa-regular fa-heart"></i>
                    <span data-reel-count="likes">0</span>
                </button>

                <button
                    type="button"
                    class="reel-rail-btn"
                    data-reel-action="comment"
                    title="Comments"
                >
                    <i class="fa-regular fa-comment"></i>
                    <span data-reel-count="comments">0</span>
                </button>

                <button
                    type="button"
                    class="reel-rail-btn"
                    data-reel-action="share"
                    title="Share"
                >
                    <i class="fa-regular fa-paper-plane"></i>
                </button>

                <button
                    type="button"
                    class="reel-rail-btn"
                    data-reel-action="save"
                    title="Save"
                >
                    <i class="fa-regular fa-bookmark"></i>
                </button>

                ${isMine ? `
                <button
                    type="button"
                    class="reel-rail-btn delete"
                    data-reel-action="delete"
                    title="Delete reel"
                >
                    <i class="fa-solid fa-trash"></i>
                </button>
                ` : ""}

            </div>

            <button
                type="button"
                class="reel-mute"
                data-reel-action="mute"
                title="Sound"
            >
                🔇
            </button>

            <div class="reel-play-badge">
                ▶
            </div>

        </div>
    `;

    const video =
        slide.querySelector(".reel-video");

    video.addEventListener("click", () => {

        socialhubReelTogglePlay(slide);
    });

    return slide;
}


// ======================================================
// 4. AUTOPLAY ON SCROLL
// ======================================================

function socialhubReelSetupObserver() {

    const viewport =
        document.getElementById("reelsViewport");

    if (!viewport) {
        return;
    }

    if (socialhubReelsObserver) {

        socialhubReelsObserver.disconnect();
    }

    socialhubReelsObserver =
        new IntersectionObserver(
            entries => {

                entries.forEach(entry => {

                    const slide =
                        entry.target;

                    if (!slide.querySelector(".reel-video")) {

                        return;
                    }

                    if (entry.isIntersecting && entry.intersectionRatio >= 0.55) {

                        socialhubReelActivate(slide);

                    } else {

                        socialhubReelPause(slide);
                    }
                });
            },
            {
                root: viewport,
                threshold: [0.55, 0.75]
            }
        );

    viewport
        .querySelectorAll(".reel-item")
        .forEach(slide => {

            socialhubReelsObserver.observe(slide);
        });

    // Activate the first reel
    const first =
        viewport.querySelector(".reel-item");

    if (first) {

        socialhubReelActivate(first);
    }
}


function socialhubReelActivate(slide) {

    const id =
        slide.dataset.reelId;

    const video =
        slide.querySelector(".reel-video");

    if (video) {

        video.muted =
            socialhubReelsMuted;

        const playPromise =
            video.play();

        if (playPromise) {

            playPromise.catch(() => {});
        }
    }

    if (socialhubReelsActiveId !== id) {

        socialhubReelsActiveId = id;

        document
            .querySelectorAll(".reel-item")
            .forEach(other => {

                if (other !== slide) {

                    socialhubReelPause(other);
                }
            });

        socialhubReelUpdateMuteButton();
    }
}


function socialhubReelPause(slide) {

    const video =
        slide.querySelector(".reel-video");

    if (video) {

        video.pause();
    }
}


function socialhubReelTogglePlay(slide) {

    const video =
        slide.querySelector(".reel-video");

    if (!video) {
        return;
    }

    const badge =
        slide.querySelector(".reel-play-badge");

    if (video.paused) {

        video.play().catch(() => {});

        if (badge) {

            badge.classList.remove("show");

            void badge.offsetWidth;

            badge.classList.add("show");
        }

    } else {

        video.pause();

        if (badge) {

            badge.innerHTML = "▶";

            badge.classList.remove("show");

            void badge.offsetWidth;

            badge.classList.add("show");
        }
    }
}


function socialhubReelToggleMute() {

    socialhubReelsMuted =
        !socialhubReelsMuted;

    document
        .querySelectorAll(".reel-video")
        .forEach(video => {

            video.muted =
                socialhubReelsMuted;
        });

    socialhubReelUpdateMuteButton();
}


function socialhubReelUpdateMuteButton() {

    document
        .querySelectorAll(".reel-mute")
        .forEach(button => {

            button.textContent =
                socialhubReelsMuted ? "🔇" : "🔊";
        });
}


// ======================================================
// 5. INTERACTIONS (LIKE / COMMENT / SHARE / SAVE)
// ======================================================

async function socialhubReelLoadInteractions() {

    const slides =
        document.querySelectorAll(".reel-item");

    if (slides.length === 0) {
        return;
    }

    const ids =
        [...slides].map(slide => slide.dataset.reelId);

    const me =
        await socialhubReelGetMe();

    const [likesResult, commentsResult, savesResult] =
        await Promise.all([

            db
                .from("likes")
                .select("post_id, user_id")
                .in("post_id", ids),

            db
                .from("comments")
                .select("post_id")
                .in("post_id", ids),

            me
                ? db
                    .from("saved_posts")
                    .select("post_id")
                    .eq("user_id", me.id)
                    .in("post_id", ids)
                : Promise.resolve({ data: [] })
        ]);

    const likeCount = {};

    const myLikes = new Set();

    const commentCount = {};

    const mySaves = new Set();

    (likesResult.data || []).forEach(like => {

        likeCount[like.post_id] =
            (likeCount[like.post_id] || 0) + 1;

        if (me && like.user_id === me.id) {

            myLikes.add(like.post_id);
        }
    });

    (commentsResult.data || []).forEach(comment => {

        commentCount[comment.post_id] =
            (commentCount[comment.post_id] || 0) + 1;
    });

    (savesResult.data || []).forEach(save => {

        mySaves.add(save.post_id);
    });

    slides.forEach(slide => {

        const id =
            slide.dataset.reelId;

        const likeCountEl =
            slide.querySelector('[data-reel-count="likes"]');

        if (likeCountEl) {

            likeCountEl.textContent =
                likeCount[id] || 0;
        }

        const commentCountEl =
            slide.querySelector('[data-reel-count="comments"]');

        if (commentCountEl) {

            commentCountEl.textContent =
                commentCount[id] || 0;
        }

        const likeButton =
            slide.querySelector('[data-reel-action="like"]');

        if (likeButton && myLikes.has(id)) {

            likeButton.classList.add("liked");

            likeButton.querySelector("i").className =
                "fa-solid fa-heart";
        }

        const saveButton =
            slide.querySelector('[data-reel-action="save"]');

        if (saveButton && mySaves.has(id)) {

            saveButton.classList.add("saved");

            saveButton.querySelector("i").className =
                "fa-solid fa-bookmark";
        }
    });
}


async function socialhubReelLike(button, reelId) {

    const me =
        await socialhubReelGetMe();

    if (!me) {

        socialhubReelToast("Please login first.");

        return;
    }

    const liked =
        button.classList.contains("liked");

    const countEl =
        button.querySelector('[data-reel-count="likes"]');

    const count =
        countEl ? parseInt(countEl.textContent || "0", 10) : 0;

    if (liked) {

        button.classList.remove("liked");

        button.querySelector("i").className =
            "fa-regular fa-heart";

        if (countEl) {

            countEl.textContent =
                Math.max(0, count - 1);
        }

        await db
            .from("likes")
            .delete()
            .eq("post_id", reelId)
            .eq("user_id", me.id);

    } else {

        button.classList.add("liked");

        button.querySelector("i").className =
            "fa-solid fa-heart";

        if (countEl) {

            countEl.textContent =
                count + 1;
        }

        const {
            error
        } = await db
            .from("likes")
            .insert({
                post_id: reelId,
                user_id: me.id,
                reaction: "like"
            });

        if (error) {

            socialhubReelToast("Could not like: " + error.message);
        }

        socialhubReelNotifyOwner(
            reelId,
            me.id,
            "like",
            null
        );
    }
}


async function socialhubReelSave(button, reelId) {

    const me =
        await socialhubReelGetMe();

    if (!me) {

        socialhubReelToast("Please login first.");

        return;
    }

    const saved =
        button.classList.contains("saved");

    if (saved) {

        const {
            error
        } = await db
            .from("saved_posts")
            .delete()
            .eq("user_id", me.id)
            .eq("post_id", reelId);

        if (!error) {

            button.classList.remove("saved");

            button.querySelector("i").className =
                "fa-regular fa-bookmark";

            socialhubReelToast("Removed from saved");
        }

    } else {

        const {
            error
        } = await db
            .from("saved_posts")
            .insert({
                user_id: me.id,
                post_id: reelId
            });

        if (!error) {

            button.classList.add("saved");

            button.querySelector("i").className =
                "fa-solid fa-bookmark";

            socialhubReelToast("Saved ✓");
        }
    }
}


async function socialhubReelShare(reelId) {

    const url =
        window.location.origin +
        "/index.html?post=" +
        reelId;

    try {

        await navigator.clipboard.writeText(url);

        socialhubReelToast("🔗 Link copied!");

    } catch (error) {

        const input =
            document.createElement("input");

        input.value = url;

        document.body.appendChild(input);

        input.select();

        document.execCommand("copy");

        input.remove();

        socialhubReelToast("🔗 Link copied!");
    }
}


async function socialhubReelDelete(slide, reelId) {

    const me =
        await socialhubReelGetMe();

    if (!me) {
        return;
    }

    if (!confirm("Delete this reel?")) {
        return;
    }

    const {
        error
    } = await db
        .from("posts")
        .delete()
        .eq("id", reelId)
        .eq("user_id", me.id);

    if (error) {

        socialhubReelToast("Could not delete: " + error.message);

        return;
    }

    slide.remove();

    socialhubReelToast("Reel deleted");

    if (document.querySelectorAll(".reel-item").length === 0) {

        const feed =
            document.getElementById("reelsFeed");

        if (feed) {

            feed.innerHTML = `
                <p class="reels-empty">
                    No reels yet — tap ➕ to create the first one!
                </p>
            `;
        }
    }
}


async function socialhubReelNotifyOwner(postId, actorId, type, content) {

    try {

        const {
            data: postOwner
        } = await db
            .from("posts")
            .select("user_id")
            .eq("id", postId)
            .single();

        if (
            postOwner &&
            postOwner.user_id &&
            postOwner.user_id !== actorId &&
            typeof socialhubNotify === "function"
        ) {

            await socialhubNotify(
                postOwner.user_id,
                actorId,
                type,
                postId,
                content
            );
        }

    } catch (error) {

        console.error(
            "❌ Reel notification error:",
            error
        );
    }
}


// ======================================================
// 6. COMMENTS
// ======================================================

async function socialhubReelOpenComments(reelId) {

    socialhubReelsCommentId =
        reelId;

    const panel =
        document.getElementById("reelsComments");

    const list =
        document.getElementById("reelsCommentsList");

    list.innerHTML = `
        <p class="reels-empty">
            Loading comments...
        </p>
    `;

    panel.classList.add("open");

    await socialhubReelRenderComments();
}


function socialhubReelCloseComments() {

    socialhubReelsCommentId = null;

    document
        .getElementById("reelsComments")
        .classList.remove("open");
}


async function socialhubReelRenderComments() {

    const reelId =
        socialhubReelsCommentId;

    if (!reelId) {
        return;
    }

    const list =
        document.getElementById("reelsCommentsList");

    const {
        data: comments,
        error
    } = await db
        .from("comments")
        .select("id, user_id, content, created_at")
        .eq("post_id", reelId)
        .order("created_at", {
            ascending: true
        });

    if (error || !comments || comments.length === 0) {

        list.innerHTML = `
            <p class="reels-empty">
                No comments yet. Be the first!
            </p>
        `;

        return;
    }

    const userIds = [
        ...new Set(comments.map(comment => comment.user_id))
    ];

    const {
        data: profiles
    } = await db
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", userIds);

    const profileMap = new Map();

    (profiles || []).forEach(profile => {

        profileMap.set(profile.id, profile);
    });

    list.innerHTML = "";

    comments.forEach(comment => {

        const profile =
            profileMap.get(comment.user_id);

        const item =
            document.createElement("div");

        item.className = "reels-comment";

        item.innerHTML = `

            <div class="reels-comment-avatar">
                ${socialhubReelAvatarHTML(profile)}
            </div>

            <div class="reels-comment-body">

                <strong>
                    ${socialhubReelEscape(profile?.full_name || "User")}
                </strong>

                <p>
                    ${socialhubReelEscape(comment.content)}
                </p>

            </div>
        `;

        list.appendChild(item);
    });
}


async function socialhubReelAddComment() {

    const reelId =
        socialhubReelsCommentId;

    const input =
        document.getElementById("reelsCommentInput");

    if (!reelId || !input) {
        return;
    }

    const content =
        input.value.trim();

    if (content === "") {
        return;
    }

    const me =
        await socialhubReelGetMe();

    if (!me) {

        socialhubReelToast("Please login first.");

        return;
    }

    const {
        data: comment,
        error
    } = await db
        .from("comments")
        .insert({
            post_id: reelId,
            user_id: me.id,
            content: content
        })
        .select()
        .single();

    if (error) {

        socialhubReelToast("Could not comment: " + error.message);

        return;
    }

    input.value = "";

    await socialhubReelRenderComments();

    // Bump the comment count on the rail
    const slide =
        document.querySelector(
            `.reel-item[data-reel-id="${reelId}"]`
        );

    if (slide) {

        const countEl =
            slide.querySelector('[data-reel-count="comments"]');

        if (countEl) {

            countEl.textContent =
                parseInt(countEl.textContent || "0", 10) + 1;
        }
    }

    socialhubReelNotifyOwner(
        reelId,
        me.id,
        "comment",
        content
    );
}


// ======================================================
// 7. UPLOAD
// ======================================================

let socialhubReelFileInput = null;

let socialhubReelPendingFile = null;


function socialhubReelSetupUpload() {

    const fab =
        document.getElementById("reelsFab");

    const modal =
        document.getElementById("reelsUploadModal");

    const dropzone =
        document.getElementById("reelsDropzone");

    if (!fab || !modal || !dropzone) {
        return;
    }

    if (socialhubReelFileInput) {
        return;
    }

    socialhubReelFileInput =
        document.createElement("input");

    socialhubReelFileInput.type = "file";

    socialhubReelFileInput.accept = "video/*";

    socialhubReelFileInput.style.display = "none";

    document.body.appendChild(socialhubReelFileInput);

    socialhubReelFileInput.addEventListener(
        "change",
        socialhubReelHandleFile
    );

    fab.addEventListener("click", () => {

        modal.classList.add("open");
    });

    dropzone.addEventListener("click", () => {

        socialhubReelFileInput.click();
    });

    modal
        .querySelectorAll("[data-reels-close]")
        .forEach(button => {

            button.addEventListener("click", () => {

                modal.classList.remove("open");
            });
        });

    modal.addEventListener("click", event => {

        if (event.target === modal) {

            modal.classList.remove("open");
        }
    });

    document
        .getElementById("reelsUploadBtn")
        .addEventListener(
            "click",
            socialhubReelPost
        );
}


function socialhubReelHandleFile() {

    const file =
        socialhubReelFileInput.files[0];

    if (!file) {
        return;
    }

    if (!file.type.startsWith("video/")) {

        alert("Please choose a video file.");

        return;
    }

    if (file.size > socialhubReelMaxVideoSize) {

        alert("Video is too big. Maximum size is 100MB.");

        return;
    }

    socialhubReelPendingFile = file;

    const preview =
        document.getElementById("reelsPreview");

    const video =
        document.getElementById("reelsPreviewVideo");

    video.src =
        URL.createObjectURL(file);

    preview.classList.remove("hidden");

    document
        .getElementById("reelsDropzone")
        .classList.add("hidden");
}


async function socialhubReelPost() {

    const file =
        socialhubReelPendingFile;

    if (!file) {

        socialhubReelToast("Please choose a video first.");

        return;
    }

    const me =
        await socialhubReelGetMe();

    if (!me) {

        socialhubReelToast("Please login first.");

        return;
    }

    const button =
        document.getElementById("reelsUploadBtn");

    button.disabled = true;

    button.textContent = "⏳ Uploading...";

    try {

        const nameParts =
            file.name.split(".");

        const ext =
            nameParts.length > 1
                ? nameParts.pop().toLowerCase()
                : "mp4";

        const path =
            `reel-${me.id}-${Date.now()}.${ext}`;

        const {
            error: uploadError
        } = await db
            .storage
            .from("videos")
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
            .from("videos")
            .getPublicUrl(path);

        const caption =
            document
                .getElementById("reelsCaption")
                .value.trim();

        const {
            error: insertError
        } = await db
            .from("posts")
            .insert({
                user_id: me.id,
                content: caption || null,
                video_url: urlData.publicUrl,
                is_reel: true
            });

        if (insertError) {
            throw insertError;
        }

        socialhubReelPendingFile = null;

        socialhubReelFileInput.value = "";

        document
            .getElementById("reelsCaption")
            .value = "";

        document
            .getElementById("reelsPreview")
            .classList.add("hidden");

        document
            .getElementById("reelsDropzone")
            .classList.remove("hidden");

        document
            .getElementById("reelsUploadModal")
            .classList.remove("open");

        socialhubReelToast("🎬 Reel posted!");

        await socialhubReelLoad();

    } catch (error) {

        console.error(
            "❌ Reel upload error:",
            error
        );

        alert(
            "Could not post reel.\n\n" +
            error.message
        );

    } finally {

        button.disabled = false;

        button.textContent = "🚀 Post Reel";
    }
}


// ======================================================
// 8. EVENTS + KEYBOARD
// ======================================================

function socialhubReelBindEvents() {

    const feed =
        document.getElementById("reelsFeed");

    if (!feed) {
        return;
    }

    feed.addEventListener("click", async event => {

        const actionButton =
            event.target.closest("[data-reel-action]");

        if (!actionButton) {
            return;
        }

        const slide =
            actionButton.closest(".reel-item");

        if (!slide) {
            return;
        }

        const reelId =
            slide.dataset.reelId;

        const action =
            actionButton.dataset.reelAction;

        if (action === "like") {

            await socialhubReelLike(actionButton, reelId);

        } else if (action === "comment") {

            await socialhubReelOpenComments(reelId);

        } else if (action === "share") {

            await socialhubReelShare(reelId);

        } else if (action === "save") {

            await socialhubReelSave(actionButton, reelId);

        } else if (action === "delete") {

            await socialhubReelDelete(slide, reelId);

        } else if (action === "mute") {

            socialhubReelToggleMute();
        }
    });

    document
        .getElementById("reelsCommentSend")
        .addEventListener("click", socialhubReelAddComment);

    document
        .getElementById("reelsCommentInput")
        .addEventListener("keydown", event => {

            if (event.key === "Enter") {

                event.preventDefault();

                socialhubReelAddComment();
            }
        });

    document
        .querySelectorAll("[data-reels-comments-close]")
        .forEach(button => {

            button.addEventListener(
                "click",
                socialhubReelCloseComments
            );
        });

    document.addEventListener("keydown", event => {

        const modalOpen =
            document
                .getElementById("reelsUploadModal")
                .classList.contains("open");

        if (modalOpen) {
            return;
        }

        const slides = [
            ...document.querySelectorAll(".reel-item")
        ];

        if (slides.length === 0) {
            return;
        }

        const viewport =
            document.getElementById("reelsViewport");

        const activeIndex =
            slides.findIndex(
                slide => slide.dataset.reelId === socialhubReelsActiveId
            );

        if (event.key === "ArrowDown" && activeIndex < slides.length - 1) {

            slides[activeIndex + 1].scrollIntoView({
                behavior: "smooth"
            });

        } else if (event.key === "ArrowUp" && activeIndex > 0) {

            slides[activeIndex - 1].scrollIntoView({
                behavior: "smooth"
            });
        }
    });
}


// ======================================================
// 9. INIT
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

    socialhubReelSetupUpload();

    socialhubReelBindEvents();

    socialhubReelLoad();

    console.log("✅ Reels activated!");
});
