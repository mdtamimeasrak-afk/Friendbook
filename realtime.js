// ======================================================
// SOCIALHUB - REAL-TIME FEED (STEP 16)
// ======================================================
// This is a NEW file. Old code is untouched.
//
// What it does:
//   1. New posts appear in the feed instantly (no
//      refresh) - the new post is prepended on top.
//   2. Likes and comments update live: counts and
//      comments re-sync without a page reload.
//   3. New notifications update the 🔔 badge live.
//
// Setup:
//   - Run the SQL below once in the Supabase SQL
//     Editor to enable realtime for these tables:
//
//     alter publication supabase_realtime
//       add table public.posts;
//
//     alter publication supabase_realtime
//       add table public.likes;
//
//     alter publication supabase_realtime
//       add table public.comments;
//
//     alter publication supabase_realtime
//       add table public.notifications;
//
//     (If you get "publication does not exist" go to
//      Database -> Replication and toggle the tables
//      on there instead.)
//
//   - Add this script to index.html AFTER
//     notifications.js:
//
//     <script src="realtime.js"></script>
// ======================================================

var db = window.db || supabaseClient;


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


// ======================================================
// 2. PREPEND A NEW POST (NO FULL RELOAD)
// ======================================================

async function socialhubPrependNewPost(post) {

    const container =
        document.getElementById("posts");

    if (!container) {
        return;
    }

    if (!post || !post.id || !post.user_id) {
        return;
    }

    // Skip if this post is already in the feed
    // (content match, in case of a race with the loader)
    const content =
        post.content || "";

    const alreadyThere = [
        ...container.querySelectorAll(".post")
    ].some(article => {

        const text =
            article.querySelector(".post-text")
                ?.innerText.trim() || "";

        return text === content.trim();
    });

    if (alreadyThere) {
        return;
    }

    // Get the author's profile
    const {
        data: profile,
        error: profileError
    } = await db
        .from("profiles")
        .select("id, full_name, username, avatar_url")
        .eq("id", post.user_id)
        .single();

    if (profileError || !profile) {
        return;
    }

    const userName =
        profile.full_name || "SocialHub User";

    const username =
        profile.username || "user";

    // Background style (same as the normal loader)
    const background =
        post.background || null;

    let textStyle = `
        margin: 0;
        line-height: 1.6;
        white-space: pre-wrap;
        overflow-wrap: break-word;
        word-break: normal;
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

    // Post image (if any)
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

    // Post video (if any)
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
            ${socialhubEscape(userName)}
        </h3>

        <small>
            @${socialhubEscape(username)}
            ·
            ${new Date(post.created_at).toLocaleString()}
            · 🌎
        </small>

    </div>

</div>


<p
    class="post-text"
    style="${textStyle}"
>${socialhubEscape(content)}</p>

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

    container.prepend(article);

    console.log(
        "⚡ New post arrived in real-time!"
    );
}


// ======================================================
// 3. DEBOUNCED INTERACTION SYNC
// ======================================================
// When a like or comment changes, re-load counts and
// comments without touching the rest of the page.

let socialhubInteractionTimer = null;


function socialhubDebouncedReloadInteractions() {

    clearTimeout(socialhubInteractionTimer);

    socialhubInteractionTimer =
        setTimeout(() => {

            if (
                typeof socialhubLoadInteractions ===
                "function"
            ) {

                socialhubLoadInteractions();
            }

        }, 600);
}


// ======================================================
// 4. DEBOUNCED NOTIFICATION BADGE
// ======================================================

let socialhubBadgeTimer = null;


function socialhubDebouncedUpdateBadge() {

    clearTimeout(socialhubBadgeTimer);

    socialhubBadgeTimer =
        setTimeout(() => {

            if (
                typeof socialhubUpdateNotifBadge ===
                "function"
            ) {

                socialhubUpdateNotifBadge();
            }

        }, 500);
}


// ======================================================
// 5. SETUP REALTIME
// ======================================================

let socialhubRealtimeReady = false;


async function socialhubSetupRealtime() {

    const me =
        await socialhubGetMe();

    if (!me) {
        return;
    }

    if (socialhubRealtimeReady) {
        return;
    }

    socialhubRealtimeReady = true;

    // ---------- NEW POSTS ----------

    const postsChannel =
        db.channel("socialhub-realtime-posts");

    postsChannel
        .on(
            "postgres_changes",
            {
                event: "INSERT",
                schema: "public",
                table: "posts"
            },
            payload => {

                if (payload.new) {

                    socialhubPrependNewPost(payload.new);
                }
            }
        )
        .subscribe(status => {

            console.log(
                "⚡ Posts realtime:",
                status
            );
        });

    // ---------- LIKES + COMMENTS ----------

    const interactionChannel =
        db.channel("socialhub-realtime-interactions");

    interactionChannel
        .on(
            "postgres_changes",
            {
                event: "INSERT",
                schema: "public",
                table: "likes"
            },
            socialhubDebouncedReloadInteractions
        )
        .on(
            "postgres_changes",
            {
                event: "DELETE",
                schema: "public",
                table: "likes"
            },
            socialhubDebouncedReloadInteractions
        )
        .on(
            "postgres_changes",
            {
                event: "INSERT",
                schema: "public",
                table: "comments"
            },
            socialhubDebouncedReloadInteractions
        )
        .subscribe(status => {

            console.log(
                "⚡ Interactions realtime:",
                status
            );
        });

    // ---------- NOTIFICATIONS BADGE ----------

    const notificationChannel =
        db.channel("socialhub-realtime-notifications");

    notificationChannel
        .on(
            "postgres_changes",
            {
                event: "INSERT",
                schema: "public",
                table: "notifications"
            },
            socialhubDebouncedUpdateBadge
        )
        .subscribe(status => {

            console.log(
                "⚡ Notifications realtime:",
                status
            );
        });
}


// ======================================================
// 6. AUTO-SYNC
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

    // Only needed on the home feed page
    const postsContainer =
        document.getElementById("posts");

    if (!postsContainer) {
        return;
    }

    // Small delay so login state is ready
    setTimeout(
        socialhubSetupRealtime,
        1500
    );

    console.log(
        "✅ Real-time Feed activated!"
    );
});
