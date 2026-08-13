// ======================================================
// SOCIALHUB - REAL LIKES + COMMENTS + REACTIONS (STEP 17.3)
// ======================================================
// This is a NEW file. Old code is untouched.
//
// What it does:
//   1. Likes and comments are saved to Supabase.
//   2. Facebook-style reactions: hover the like button
//      to pick 👍 ❤️ 😂 😮 😢 😡 (desktop) - the
//      reaction is saved in the likes table.
//   3. Double-tap a post to like it (heart burst is
//      handled by premium-ui.js).
//   4. Font Awesome icons in stats and buttons.
//
// Setup:
//   - Run this SQL once in the Supabase SQL Editor:
//
//     alter table public.likes
//       add column if not exists reaction text default 'like';
//
//   - Add this script in index.html AFTER script.js:
//
//     <script src="likes-comments.js"></script>
// ======================================================

var db = window.db || supabaseClient;

const REACTION_EMOJI = {
    like: "👍",
    love: "❤️",
    care: "🥰",
    haha: "😂",
    wow: "😮",
    sad: "😢",
    angry: "😡"
};

const REACTION_COLOR = {
    like: "#1877f2",
    love: "#fa3e3e",
    care: "#f7b928",
    haha: "#f7b928",
    wow: "#f7b928",
    sad: "#f7b928",
    angry: "#e9710f"
};

const REACTION_PICKER = [
    { label: "like", emoji: "👍" },
    { label: "love", emoji: "❤️" },
    { label: "care", emoji: "🥰" },
    { label: "haha", emoji: "😂" },
    { label: "wow", emoji: "😮" },
    { label: "sad", emoji: "😢" },
    { label: "angry", emoji: "😡" }
];


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
// 2. MATCH DOM POSTS WITH DATABASE POST IDS
// ======================================================

let socialhubMappingRunning = false;

let socialhubMappingQueued = false;


async function socialhubMapPostIds() {

    if (socialhubMappingRunning) {

        socialhubMappingQueued = true;

        return;
    }

    socialhubMappingRunning = true;

    try {

        await socialhubMapPostIdsCore();

    } catch (error) {

        console.error(
            "❌ Post mapping error:",
            error
        );

    } finally {

        socialhubMappingRunning = false;

        if (socialhubMappingQueued) {

            socialhubMappingQueued = false;

            setTimeout(
                socialhubMapPostIds,
                80
            );
        }
    }
}


async function socialhubMapPostIdsCore() {

    const containers =
        document.querySelectorAll(
            "#posts, #upPosts, #profilePosts"
        );

    if (containers.length === 0) {
        return;
    }

    const articles =
        [...containers]
            .map(container =>
                [...container.querySelectorAll(".post")]
            )
            .flat();

    if (articles.length === 0) {
        return;
    }

    const {
        data: posts,
        error
    } = await db
        .from("posts")
        .select("id, content")
        .order("created_at", {
            ascending: false
        });

    if (error || !posts) {

        console.error(
            "❌ Could not fetch post ids:",
            error
        );

        return;
    }

    articles.forEach((article, index) => {

        // Already mapped (profile posts have their id
        // set directly in the template)
        if (article.dataset.postId) {
            return;
        }

        const articleText =
            (
                article.querySelector(".post-text")
                    ?.innerText || ""
            ).trim();

        let matched = null;

        const candidate =
            posts[index];

        if (
            candidate &&
            (
                articleText === "" ||
                articleText ===
                    (candidate.content || "").trim()
            )
        ) {

            matched = candidate;
        }

        if (!matched && articleText !== "") {

            matched =
                posts.find(
                    post =>
                        (post.content || "").trim() ===
                        articleText
                ) || null;
        }

        if (matched) {

            article.dataset.postId =
                matched.id;
        }
    });

    await socialhubLoadInteractions();
}


// ======================================================
// 3. RESOLVE A POST ID
// ======================================================

async function socialhubWaitForMapping() {

    let tries = 0;

    while (
        socialhubMappingRunning &&
        tries < 20
    ) {

        await new Promise(
            resolve => setTimeout(resolve, 100)
        );

        tries++;
    }
}


async function socialhubResolvePostId(post) {

    if (post.dataset.postId) {

        return post.dataset.postId;
    }

    await socialhubWaitForMapping();

    await socialhubMapPostIds();

    if (post.dataset.postId) {

        return post.dataset.postId;
    }

    const text =
        (
            post.querySelector(".post-text")
                ?.innerText || ""
        ).trim();

    if (text !== "") {

        const {
            data: posts,
            error
        } = await db
            .from("posts")
            .select("id, content")
            .order("created_at", {
                ascending: false
            });

        if (!error && posts) {

            const match =
                posts.find(
                    post => (post.content || "").trim() === text
                );

            if (match) {

                post.dataset.postId = match.id;

                return match.id;
            }
        }
    }

    return "";
}


// ======================================================
// 4. REACTION PICKER UI
// ======================================================

function socialhubReactionPickerHTML() {

    return `
        <div class="socialhub-reactions">
            ${REACTION_PICKER.map(reaction => `
                <button
                    type="button"
                    data-reaction="${reaction.label}"
                    title="${reaction.label}"
                >
                    ${reaction.emoji}
                    <span class="socialhub-reaction-label">
                        ${reaction.label.charAt(0).toUpperCase() + reaction.label.slice(1)}
                    </span>
                </button>
            `).join("")}
        </div>
    `;
}


function socialhubLikeButtonHTML(liked, reactionLabel) {

    if (liked) {

        const emoji =
            REACTION_EMOJI[reactionLabel] || "👍";

        const label =
            reactionLabel
                ? reactionLabel.charAt(0).toUpperCase() +
                  reactionLabel.slice(1)
                : "Like";

        const color =
            REACTION_COLOR[reactionLabel] || "#1877f2";

        return `
            <span class="socialhub-reaction-emoji">
                ${emoji}
            </span>
            <span
                class="socialhub-reaction-name"
                style="color: ${color};"
            >
                ${label}
            </span>
        `;
    }

    return `
        <i class="fa-regular fa-thumbs-up"></i>
        Like
    `;
}


function socialhubBindReactionPicker(button, post) {

    button
        .querySelectorAll(".socialhub-reactions button")
        .forEach(pickerButton => {

            pickerButton.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    event.stopPropagation();

                    socialhubReact(
                        post,
                        button,
                        pickerButton.dataset.reaction
                    );
                }
            );
        });
}


function socialhubAttachReactionUI() {

    document
        .querySelectorAll(
            "#posts .post, #upPosts .post, #profilePosts .post"
        )
        .forEach(post => {

            const button =
                post.querySelector(
                    '.post-actions button[onclick="likePost(this)"]'
                );

            if (!button) {
                return;
            }

            if (
                button.querySelector(
                    ".socialhub-reactions"
                )
            ) {
                return;
            }

            button.classList.add(
                "socialhub-like-btn"
            );

            button.insertAdjacentHTML(
                "beforeend",
                socialhubReactionPickerHTML()
            );

            socialhubBindReactionPicker(
                button,
                post
            );
        });
}


// ======================================================
// 5. LOAD LIKES + COMMENTS FOR ALL POSTS
// ======================================================

async function socialhubLoadInteractions() {

    const articles =
        document.querySelectorAll(
            "#posts .post, #upPosts .post, " +
            "#profilePosts .post, #postLightbox .post"
        );

    const posts = [];

    articles.forEach(article => {

        if (article.dataset.postId) {

            posts.push({
                el: article,
                id: article.dataset.postId
            });
        }
    });

    if (posts.length === 0) {
        return;
    }

    const ids =
        posts.map(post => post.id);

    const [likesResult, commentsResult] =
        await Promise.all([

            db
                .from("likes")
                .select("post_id, user_id, reaction")
                .in("post_id", ids),

            db
                .from("comments")
                .select("*")
                .in("post_id", ids)
                .order("created_at", {
                    ascending: true
                })
        ]);

    const likes =
        likesResult.data || [];

    const allComments =
        commentsResult.data || [];

    const likeCount = {};

    const myReaction = {};

    const me =
        await socialhubGetMe();

    likes.forEach(like => {

        likeCount[like.post_id] =
            (likeCount[like.post_id] || 0) + 1;

        if (me && like.user_id === me.id) {

            myReaction[like.post_id] =
                like.reaction || "like";
        }
    });

    const commentMap = {};

    allComments.forEach(comment => {

        if (!commentMap[comment.post_id]) {

            commentMap[comment.post_id] = [];
        }

        commentMap[comment.post_id].push(comment);
    });

    const commentUserIds = [
        ...new Set(
            allComments
                .map(comment => comment.user_id)
                .filter(Boolean)
        )
    ];

    let profiles = [];

    if (commentUserIds.length > 0) {

        const {
            data,
            error: profileError
        } = await db
            .from("profiles")
            .select("id, full_name, username, avatar_url")
            .in("id", commentUserIds);

        if (!profileError && data) {

            profiles = data;
        }
    }

    const profileMap = new Map();

    profiles.forEach(profile => {

        profileMap.set(profile.id, profile);
    });


    // Update the DOM
    posts.forEach(({ el, id }) => {

        // Stats
        const stats =
            el.querySelectorAll(".post-stats span");

        if (stats[0]) {

            stats[0].innerHTML = `
                <i class="fa-solid fa-heart"></i>
                ${likeCount[id] || 0} Likes
            `;
        }

        if (stats[1]) {

            stats[1].innerHTML = `
                <i class="fa-solid fa-comment"></i>
                ${(commentMap[id] || []).length} Comments
            `;
        }

        // Like button
        const likeButton =
            el.querySelector(
                '.post-actions button[onclick="likePost(this)"]'
            );

        if (likeButton) {

            const reacted =
                myReaction[id] ? true : false;

            likeButton.classList.add(
                "socialhub-like-btn"
            );

            likeButton.classList.toggle(
                "liked",
                reacted
            );

            likeButton.innerHTML =
                socialhubLikeButtonHTML(
                    reacted,
                    myReaction[id] || "like"
                ) +
                socialhubReactionPickerHTML();

            socialhubBindReactionPicker(
                likeButton,
                el
            );
        }

        // Comments
        const commentsDiv =
            el.querySelector(".comments");

        if (commentsDiv) {

            commentsDiv.innerHTML = "";

            (commentMap[id] || []).forEach(comment => {

                socialhubRenderComment(
                    commentsDiv,
                    comment,
                    profileMap
                );
            });
        }
    });
}


// ======================================================
// 6. RENDER A SINGLE COMMENT
// ======================================================

function socialhubRenderComment(container, comment, profileMap) {

    const profile =
        profileMap.get(comment.user_id);

    const name =
        profile?.full_name || "User";

    const commentDiv =
        document.createElement("div");

    commentDiv.className = "comment";

    commentDiv.innerHTML = `

        <div class="avatar">
            ${socialhubAvatarHTML(profile)}
        </div>

        <div class="comment-content">

            <strong>
                ${socialhubEscape(name)}
            </strong>

            <p>
                ${socialhubEscape(comment.content)}
            </p>

            <small style="
                display:block;
                color:var(--muted,#65676b);
                font-size:11px;
                margin-top:4px;
            ">
                ${new Date(comment.created_at).toLocaleString()}
            </small>

        </div>
    `;

    container.appendChild(commentDiv);
}


// ======================================================
// 7. LIKE / REACT FUNCTIONS
// ======================================================

async function socialhubNotifyOwner(postId, actorId, type, content) {

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
            "❌ Notification error:",
            error
        );
    }
}


async function likePost(button) {

    const post =
        button.closest(".post");

    if (!post) {
        return;
    }

    const postId =
        await socialhubResolvePostId(post);

    if (!postId) {

        console.error(
            "❌ Could not resolve post id"
        );

        alert(
            "Could not find this post. Please refresh."
        );

        return;
    }

    const me =
        await socialhubGetMe();

    if (!me) {

        alert("Please login first.");

        return;
    }

    const stats =
        post.querySelector(".post-stats span");

    const wasLiked =
        button.classList.contains("liked");

    // Update UI first (optimistic)
    if (stats) {

        const match =
            stats.innerText.match(/\d+/);

        const count =
            match ? parseInt(match[0]) : 0;

        stats.innerHTML = `
            <i class="fa-solid fa-heart"></i>
            ${Math.max(0, count + (wasLiked ? -1 : 1))} Likes
        `;
    }

    if (wasLiked) {

        button.classList.remove("liked");

        button.innerHTML =
            socialhubLikeButtonHTML(false) +
            socialhubReactionPickerHTML();

        socialhubBindReactionPicker(button, post);

        await db
            .from("likes")
            .delete()
            .eq("post_id", postId)
            .eq("user_id", me.id);

    } else {

        button.classList.add("liked");

        button.innerHTML =
            socialhubLikeButtonHTML(true, "like") +
            socialhubReactionPickerHTML();

        socialhubBindReactionPicker(button, post);

        await db
            .from("likes")
            .insert({
                post_id: postId,
                user_id: me.id,
                reaction: "like"
            });

        // Notify the post owner
        socialhubNotifyOwner(
            postId,
            me.id,
            "like",
            null
        );
    }
}


async function socialhubReact(post, button, reactionLabel) {

    const postId =
        await socialhubResolvePostId(post);

    if (!postId) {
        return;
    }

    const me =
        await socialhubGetMe();

    if (!me) {

        alert("Please login first.");

        return;
    }

    const stats =
        post.querySelector(".post-stats span");

    const wasLiked =
        button.classList.contains("liked");

    const {
        data: existing,
        error: checkError
    } = await db
        .from("likes")
        .select("*")
        .eq("post_id", postId)
        .eq("user_id", me.id)
        .maybeSingle();

    if (checkError) {

        console.error(
            "❌ Reaction check error:",
            checkError
        );

        return;
    }

    if (existing) {

        await db
            .from("likes")
            .update({ reaction: reactionLabel })
            .eq("id", existing.id);

    } else {

        const {
            error: insertError
        } = await db
            .from("likes")
            .insert({
                post_id: postId,
                user_id: me.id,
                reaction: reactionLabel
            });

        if (insertError) {

            alert(
                "Could not react.\n\n" +
                insertError.message
            );

            return;
        }

        // Notify the post owner (only when it's a new like)
        socialhubNotifyOwner(
            postId,
            me.id,
            "like",
            null
        );
    }

    // UI
    if (!wasLiked && stats) {

        const match =
            stats.innerText.match(/\d+/);

        const count =
            match ? parseInt(match[0]) : 0;

        stats.innerHTML = `
            <i class="fa-solid fa-heart"></i>
            ${count + 1} Likes
        `;
    }

    button.classList.add("liked");

    button.innerHTML =
        socialhubLikeButtonHTML(true, reactionLabel) +
        socialhubReactionPickerHTML();

    socialhubBindReactionPicker(button, post);
}


// ======================================================
// 8. COMMENT FUNCTION
// ======================================================

async function addComment(button) {

    const post =
        button.closest(".post");

    if (!post) {
        return;
    }

    const postId =
        await socialhubResolvePostId(post);

    if (!postId) {

        console.error(
            "❌ Could not resolve post id"
        );

        alert(
            "Could not find this post. Please refresh."
        );

        return;
    }

    const input =
        post.querySelector(".comment-input");

    const comments =
        post.querySelector(".comments");

    const text =
        input.value.trim();

    if (text === "") {

        return;
    }

    const me =
        await socialhubGetMe();

    if (!me) {

        alert("Please login first.");

        return;
    }

    const {
        data: newComment,
        error
    } = await db
        .from("comments")
        .insert({
            post_id: postId,
            user_id: me.id,
            content: text
        })
        .select()
        .single();

    if (error) {

        console.error(
            "❌ Comment save error:",
            error
        );

        alert(
            "Could not post comment.\n\n" +
            error.message
        );

        return;
    }

    // Get the commenter's profile
    let profileMap = new Map();

    const {
        data: profile,
        error: profileError
    } = await db
        .from("profiles")
        .select("id, full_name, username, avatar_url")
        .eq("id", me.id)
        .single();

    if (!profileError && profile) {

        profileMap.set(me.id, profile);
    }

    socialhubRenderComment(
        comments,
        newComment,
        profileMap
    );

    // Notify the post owner
    socialhubNotifyOwner(
        postId,
        me.id,
        "comment",
        text.slice(0, 120)
    );

    // Update comment counter
    const counter =
        post.querySelector(
            ".post-stats span:nth-child(2)"
        );

    if (counter) {

        const match =
            counter.innerText.match(/\d+/);

        const count =
            match ? parseInt(match[0]) : 0;

        counter.innerHTML = `
            <i class="fa-solid fa-comment"></i>
            ${count + 1} Comments
        `;
    }

    input.value = "";
}


// ======================================================
// 9. AUTO-SYNC
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

    const containers =
        ["posts", "upPosts", "profilePosts"]
            .map(id =>
                document.getElementById(id)
            )
            .filter(Boolean);

    if (containers.length === 0) {
        return;
    }

    const observer =
        new MutationObserver(() => {

            socialhubAttachReactionUI();

            socialhubMapPostIds();
        });

    containers.forEach(container => {

        observer.observe(container, {
            childList: true,
            subtree: false
        });
    });

    // Safety net for the first load
    setTimeout(() => {

        socialhubAttachReactionUI();

        socialhubMapPostIds();

    }, 2500);

    console.log(
        "✅ Likes + Comments + Reactions activated!"
    );
});
