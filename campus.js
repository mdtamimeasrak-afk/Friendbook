// ======================================================
// TRIYA - CAMPUS COMMUNITY (Step 3)
// Campus data from Supabase + functional Join/Leave.
// ======================================================

// ------------------------------------------------------
// Fallback demo data (shown when DB is unreachable or
// the user is logged out - Supabase is the source of truth)
// ------------------------------------------------------

const SOCIALHUB_CAMPUS_DEMO = {
    id: "demo-bpi",
    name: "Bogra Polytechnic Institute",
    location: "Bogra, Bangladesh",
    students: "12,450",
    verified: true
};


// ------------------------------------------------------
// Campus state
// ------------------------------------------------------

const socialhubCampusState = {
    campus: null,
    joined: false,
    count: 0,
    loading: false
};


// ======================================================
// 1. INIT
// ======================================================

function socialhubCampusInit() {

    const tabs =
        document.querySelectorAll(".campus-tab");

    tabs.forEach(tab => {

        tab.addEventListener(
            "click",
            () => {

                socialhubCampusSwitchTab(
                    tab.dataset.tab
                );
            }
        );
    });

    socialhubCampusBindComposer();

    socialhubCampusLoad();
}


// ======================================================
// 2. TAB SWITCHING
// ======================================================

function socialhubCampusSwitchTab(tabName) {

    document
        .querySelectorAll(".campus-tab")
        .forEach(tab => {

            tab.classList.toggle(
                "active",
                tab.dataset.tab === tabName
            );
        });

    document
        .querySelectorAll(".campus-pane")
        .forEach(pane => {

            pane.classList.toggle(
                "active",
                pane.id === "campusPane-" + tabName
            );
        });
}


// ======================================================
// 3. LOAD CAMPUS FROM SUPABASE
// ======================================================

async function socialhubCampusLoad() {

    try {

        const {
            data: sessionData
        } =
            await supabaseClient.auth.getSession();

        if (!sessionData || !sessionData.session) {

            socialhubCampusRenderDemo();

            return;
        }

        const user =
            sessionData.session.user;

        const {
            data: campus,
            error: campusError
        } =
            await supabaseClient
                .from("campuses")
                .select(`
                    id,
                    name,
                    short_name,
                    location,
                    description,
                    logo_url,
                    verified
                `)
                .order("created_at", { ascending: true })
                .limit(1);

        if (campusError) {

            socialhubCampusRenderDemo();

            return;
        }

        if (!campus || !campus.length) {

            socialhubCampusRenderDemo();

            return;
        }

        const current =
            campus[0];

        const {
            count
        } =
            await supabaseClient
                .from("campus_members")
                .select("*", { count: "exact", head: true })
                .eq("campus_id", current.id);

        const {
            data: mine
        } =
            await supabaseClient
                .from("campus_members")
                .select("id")
                .eq("campus_id", current.id)
                .eq("user_id", user.id)
                .limit(1);

        socialhubCampusState.campus = current;

        socialhubCampusState.count = count || 0;

        socialhubCampusState.joined =
            !!(mine && mine.length);

        socialhubCampusRender(current);

        await socialhubCampusLoadPosts();
    }
    catch (err) {

        socialhubCampusRenderDemo();
    }
}


// ======================================================
// 4. RENDER (Supabase data)
// ======================================================

function socialhubCampusRender(campus) {

    const name =
        document.getElementById("campusName");

    const location =
        document.getElementById("campusLocation");

    const verified =
        document.getElementById("campusVerified");

    const count =
        document.getElementById("campusStudentCount");

    if (name) {
        name.textContent = campus.name;
    }

    if (location) {
        location.textContent = campus.location || "";
    }

    if (verified) {

        verified.style.display =
            campus.verified ? "inline-flex" : "none";
    }

    if (count) {

        const n = socialhubCampusState.count;

        count.textContent = n.toLocaleString();

        const label =
            document.getElementById("campusStudentsLabel");

        if (label) {

            label.textContent =
                n === 1 ? "Student" : "Students";
        }
    }

    if (campus.logo_url) {

        socialhubCampusSetLogo(campus.logo_url);
    }

    socialhubCampusSetButton(
        socialhubCampusState.joined
    );

    socialhubCampusSetComposerAvatar();
}


async function socialhubCampusSetComposerAvatar() {

    const avatarEl =
        document.getElementById("campusComposerAvatar");

    if (!avatarEl) {
        return;
    }

    try {

        const profile =
            typeof getCurrentProfile === "function"
                ? await getCurrentProfile()
                : null;

        if (profile && profile.avatar_url) {

            avatarEl.innerHTML = `
                <img
                    src="${socialhubCampusEscape(profile.avatar_url)}"
                    alt=""
                >
            `;
        }
    }
    catch (err) {
        /* keep the default avatar */
    }
}


// ======================================================
// 5. DEMO RENDER (fallback)
// ======================================================

function socialhubCampusRenderDemo() {

    const demo =
        SOCIALHUB_CAMPUS_DEMO;

    socialhubCampusState.campus = null;

    socialhubCampusRender({
        name: demo.name,
        location: demo.location,
        verified: demo.verified,
        logo_url: null
    });

    const count =
        document.getElementById("campusStudentCount");

    if (count) {

        count.textContent = demo.students;
    }
}


// ======================================================
// 6. JOIN / LEAVE BUTTON
// ======================================================

function socialhubCampusSetButton(joined, loading) {

    const btn =
        document.getElementById("campusJoinBtn");

    if (!btn) {
        return;
    }

    btn.classList.toggle("joined", joined);

    btn.disabled = !!loading;

    btn.innerHTML = loading
        ? '<i class="fa-solid fa-spinner fa-spin"></i><span>Please wait...</span>'
        : joined
            ? '<i class="fa-solid fa-check"></i><span>Joined ✓</span>'
            : '<i class="fa-solid fa-user-plus"></i><span>Join Campus</span>';
}


async function socialhubCampusJoinClick() {

    const campus =
        socialhubCampusState.campus;

    if (!campus) {

        socialhubToast(
            "Campus data is not ready yet.",
            "info"
        );

        return;
    }

    if (socialhubCampusState.loading) {
        return;
    }

    let user = null;

    try {

        const {
            data: sessionData
        } =
            await supabaseClient.auth.getSession();

        if (sessionData && sessionData.session) {

            user = sessionData.session.user;
        }
    }
    catch (err) {
        user = null;
    }

    if (!user) {

        socialhubToast(
            "Please login first to join the campus.",
            "error"
        );

        return;
    }

    socialhubCampusState.loading = true;

    socialhubCampusSetButton(
        socialhubCampusState.joined,
        true
    );

    try {

        if (!socialhubCampusState.joined) {

            const { error } =
                await supabaseClient
                    .from("campus_members")
                    .insert({
                        campus_id: campus.id,
                        user_id: user.id
                    });

            if (error) {

                if (error.code === "23505") {

                    socialhubCampusState.joined = true;

                    socialhubToast(
                        "You are already a member of this campus.",
                        "info"
                    );
                }
                else {

                    socialhubToast(
                        "Could not join the campus. Please try again.",
                        "error"
                    );
                }
            }
            else {

                socialhubCampusState.joined = true;

                socialhubCampusState.count += 1;

                socialhubCampusRender(campus);

                socialhubToast(
                    "You joined the campus! 🎉",
                    "success"
                );
            }
        }
        else {

            const sure =
                confirm(
                    "Leave this campus?"
                );

            if (!sure) {

                return;
            }

            const { error } =
                await supabaseClient
                    .from("campus_members")
                    .delete()
                    .eq("campus_id", campus.id)
                    .eq("user_id", user.id);

            if (error) {

                socialhubToast(
                    "Could not leave the campus. Please try again.",
                    "error"
                );
            }
            else {

                socialhubCampusState.joined = false;

                socialhubCampusState.count =
                    Math.max(0, socialhubCampusState.count - 1);

                socialhubCampusRender(campus);

                socialhubToast(
                    "You left the campus.",
                    "info"
                );
            }
        }
    }
    finally {

        socialhubCampusState.loading = false;

        socialhubCampusSetButton(
            socialhubCampusState.joined
        );
    }
}


// ======================================================
// 7. LOGO (image or emoji fallback)
// ======================================================

function socialhubCampusSetLogo(url) {

    const img =
        document.getElementById("campusLogoImg");

    const emoji =
        document.getElementById("campusLogoEmoji");

    if (!img || !url) {
        return;
    }

    img.onload = () => {

        img.style.display = "block";

        if (emoji) {
            emoji.style.display = "none";
        }
    };

    img.onerror = () => {

        img.style.display = "none";

        if (emoji) {
            emoji.style.display = "flex";
        }
    };

    img.src = url;
}


// ======================================================
// 8. START
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    socialhubCampusInit
);

if (
    document.readyState === "interactive" ||
    document.readyState === "complete"
) {

    socialhubCampusInit();
}


// ======================================================
// 9. STEP 4 - CAMPUS POSTS
// ======================================================

const socialhubCampusComposer = {
    image: null
};


function socialhubCampusEscape(text) {

    return String(text || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}


function socialhubCampusFileExt(file) {

    const name = file.name || "";

    const dot = name.lastIndexOf(".");

    const ext =
        dot >= 0 ? name.slice(dot + 1) : "jpg";

    return /^[a-z0-9]{2,5}$/i.test(ext)
        ? ext.toLowerCase()
        : "jpg";
}


function socialhubCampusTime(ts) {

    const diff =
        Date.now() - new Date(ts).getTime();

    const minutes =
        Math.floor(diff / 60000);

    if (minutes < 1) {
        return "just now";
    }

    if (minutes < 60) {
        return minutes + "m";
    }

    const hours =
        Math.floor(minutes / 60);

    if (hours < 24) {
        return hours + "h";
    }

    const days =
        Math.floor(hours / 24);

    if (days < 7) {
        return days + "d";
    }

    return new Date(ts).toLocaleDateString();
}


// ======================================================
// 10. COMPOSER
// ======================================================

function socialhubCampusBindComposer() {

    const postBtn =
        document.getElementById("campusPostBtn");

    if (postBtn && !postBtn.dataset.bound) {

        postBtn.dataset.bound = "1";

        postBtn.addEventListener(
            "click",
            event => {

                event.preventDefault();

                socialhubCampusCreatePost();
            }
        );
    }

    const fileInput =
        document.getElementById("campusPostImage");

    if (fileInput) {

        fileInput.addEventListener(
            "change",
            () => {

                const file =
                    fileInput.files && fileInput.files[0];

                if (!file) {
                    return;
                }

                if (!file.type.startsWith("image/")) {

                    socialhubToast(
                        "Please choose an image file.",
                        "error"
                    );

                    fileInput.value = "";

                    return;
                }

                if (file.size > 5 * 1024 * 1024) {

                    socialhubToast(
                        "Image is too big. Maximum size is 5MB.",
                        "error"
                    );

                    fileInput.value = "";

                    return;
                }

                socialhubCampusComposer.image = file;

                const name =
                    document.getElementById("campusImageName");

                if (name) {

                    name.textContent = "📷 " + file.name;

                    name.style.display = "inline";
                }

                socialhubToast(
                    "Image attached.",
                    "success"
                );
            }
        );
    }
}


async function socialhubCampusCreatePost() {

    const campus =
        socialhubCampusState.campus;

    if (!campus) {

        socialhubToast(
            "Campus data is not ready yet.",
            "info"
        );

        return;
    }

    if (!socialhubCampusState.joined) {

        socialhubToast(
            "Please join the campus first to post.",
            "error"
        );

        return;
    }

    const input =
        document.getElementById("campusPostInput");

    const content =
        input ? input.value.trim() : "";

    const image =
        socialhubCampusComposer.image;

    if (!content && !image) {

        socialhubToast(
            "Write something or attach a photo first.",
            "info"
        );

        return;
    }

    let user = null;

    try {

        const { data: sessionData } =
            await supabaseClient.auth.getSession();

        if (sessionData && sessionData.session) {

            user = sessionData.session.user;
        }
    }
    catch (err) {
        user = null;
    }

    if (!user) {

        socialhubToast(
            "Please login first.",
            "error"
        );

        return;
    }

    let imageUrl = null;

    if (image) {

        const path =
            "campus-" + campus.id + "/" +
            user.id + "-" + Date.now() + "." +
            socialhubCampusFileExt(image);

        try {

            const { error: uploadError } =
                await supabaseClient
                    .storage
                    .from("post-images")
                    .upload(path, image, {
                        upsert: true,
                        contentType: image.type
                    });

            if (uploadError) {

                socialhubToast(
                    "Could not upload image. " +
                    uploadError.message,
                    "error"
                );

                return;
            }

            const { data: urlData } =
                supabaseClient
                    .storage
                    .from("post-images")
                    .getPublicUrl(path);

            imageUrl = urlData.publicUrl;
        }
        catch (err) {

            socialhubToast(
                "Image upload failed.",
                "error"
            );

            return;
        }
    }

    const { error } =
        await supabaseClient
            .from("campus_posts")
            .insert({
                campus_id: campus.id,
                user_id: user.id,
                content: content,
                image_url: imageUrl
            });

    if (error) {

        socialhubToast(
            "Could not create post. " + error.message,
            "error"
        );

        return;
    }

    if (input) {
        input.value = "";
    }

    socialhubCampusComposer.image = null;

    const fileInput =
        document.getElementById("campusPostImage");

    if (fileInput) {
        fileInput.value = "";
    }

    const name =
        document.getElementById("campusImageName");

    if (name) {
        name.style.display = "none";
    }

    socialhubToast(
        "Posted to campus! 🎉",
        "success"
    );

    await socialhubCampusLoadPosts();
}


// ======================================================
// 11. LOAD POSTS
// ======================================================

async function socialhubCampusLoadPosts() {

    const feed =
        document.getElementById("campusFeed");

    if (!feed) {
        return;
    }

    const campus =
        socialhubCampusState.campus;

    if (!campus) {
        return;
    }

    feed.innerHTML =
        '<div class="campus-feed-loading">Loading posts...</div>';

    const {
        data: posts,
        error
    } =
        await supabaseClient
            .from("campus_posts")
            .select(`
                id,
                campus_id,
                user_id,
                content,
                image_url,
                created_at,
                profiles (
                    id,
                    full_name,
                    username,
                    avatar_url
                )
            `)
            .eq("campus_id", campus.id)
            .order("created_at", { ascending: false })
            .limit(50);

    if (error) {

        feed.innerHTML = "";

        socialhubToast(
            "Could not load posts.",
            "error"
        );

        return;
    }

    const ids =
        (posts || []).map(post => post.id);

    let likes = [];

    let comments = [];

    if (ids.length > 0) {

        const [
            likesResult,
            commentsResult
        ] =
            await Promise.all([

                supabaseClient
                    .from("campus_post_likes")
                    .select("campus_post_id, user_id, reaction")
                    .in("campus_post_id", ids),

                supabaseClient
                    .from("campus_post_comments")
                    .select(`
                        id,
                        campus_post_id,
                        user_id,
                        content,
                        created_at,
                        profiles (
                            id,
                            full_name,
                            username,
                            avatar_url
                        )
                    `)
                    .in("campus_post_id", ids)
                    .order("created_at", {
                        ascending: true
                    })
            ]);

        likes = likesResult.data || [];

        comments = commentsResult.data || [];
    }

    let me = null;

    try {

        const { data: sessionData } =
            await supabaseClient.auth.getSession();

        if (sessionData && sessionData.session) {

            me = sessionData.session.user;
        }
    }
    catch (err) {
        me = null;
    }

    const likeCounts = {};

    const commentCounts = {};

    const myLikes = {};

    likes.forEach(like => {

        likeCounts[like.campus_post_id] =
            (likeCounts[like.campus_post_id] || 0) + 1;

        if (me && like.user_id === me.id) {

            myLikes[like.campus_post_id] = like.reaction;
        }
    });

    comments.forEach(comment => {

        commentCounts[comment.campus_post_id] =
            (commentCounts[comment.campus_post_id] || 0) + 1;
    });

    if (!posts || posts.length === 0) {

        feed.innerHTML = `
            <div class="campus-empty-card">
                <div class="campus-empty-icon">
                    <i class="fa-solid fa-people-group"></i>
                </div>
                <h3>No posts yet</h3>
                <p>
                    Be the first to share something with your campus.
                </p>
            </div>
        `;

        return;
    }

    feed.innerHTML = "";

    posts.forEach(post => {

        const article =
            socialhubCampusPostHTML(
                post,
                post.profiles || {},
                likeCounts[post.id] || 0,
                myLikes[post.id] || null,
                comments.filter(
                    comment =>
                        comment.campus_post_id === post.id
                ),
                me ? me.id : null
            );

        feed.appendChild(article);
    });
}


// ======================================================
// 12. POST HTML
// ======================================================

function socialhubCampusPostHTML(
    post,
    profile,
    likeCount,
    myReaction,
    comments,
    meId
) {

    const article =
        document.createElement("article");

    article.className = "post";

    article.dataset.postId = post.id;

    const displayName =
        profile.full_name ||
        profile.username ||
        "Student";

    const username =
        profile.username || "";

    const avatarUrl =
        profile.avatar_url || "";

    const avatarHTML =
        avatarUrl
            ? `
                <img
                    src="${socialhubCampusEscape(avatarUrl)}"
                    alt="${socialhubCampusEscape(displayName)}"
                    style="
                        width:100%;
                        height:100%;
                        object-fit:cover;
                        border-radius:50%;
                    "
                >
            `
            : "👤";

    const reacted =
        !!myReaction;

    const myPost =
        meId && post.user_id === meId;

    const imageHTML =
        post.image_url
            ? `
                <img
                    class="campus-post-img"
                    src="${socialhubCampusEscape(post.image_url)}"
                    alt="Post photo"
                    loading="lazy"
                >
            `
            : "";

    const commentRows =
        socialhubCampusCommentsHTML(comments, meId);

    const commentsCount =
        comments.length;

    article.innerHTML = `

<div class="post-header">

    <div class="avatar">
        ${avatarHTML}
    </div>

    <div>

        <h3 class="post-user-name">
            ${socialhubCampusEscape(displayName)}
        </h3>

        <small>
            @${socialhubCampusEscape(username)}
            ·
            ${socialhubCampusTime(post.created_at)}
        </small>

    </div>

    ${
        myPost
            ? `
                <button
                    type="button"
                    class="campus-post-delete"
                    title="Delete post"
                    onclick="socialhubCampusDeletePost(
                        '${post.id}',
                        this
                    )"
                >
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            `
            : ""
    }

</div>

${
    post.content
        ? `
            <p
                class="post-text"
                style="
                    margin: 0;
                    line-height: 1.6;
                    white-space: pre-wrap;
                    overflow-wrap: break-word;
                    padding: 0;
                    text-align: left;
                    font-size: 16px;
                    font-weight: 400;
                "
            >${socialhubCampusEscape(post.content)}</p>
        `
        : ""
}

${imageHTML}

<div class="post-stats">

    <span class="fb-stats-reactions">
        ${socialhubStatsHTML(myReaction || "like", likeCount)}
    </span>

    <span class="fb-stats-comments">
        <i class="fa-solid fa-comment"></i>
        ${commentsCount} Comment${commentsCount === 1 ? "" : "s"}
    </span>

</div>

<div class="post-actions">

    <button
        type="button"
        class="fb-action-btn socialhub-like-btn ${reacted ? "liked" : ""}"
    >
        ${socialhubLikeButtonHTML(reacted, myReaction || "like")}
        ${socialhubReactionPickerHTML()}
    </button>

    <button
        type="button"
        class="fb-action-btn"
        onclick="socialhubCampusToggleComments(this)"
    >
        <i class="fa-regular fa-comment"></i>
        <span class="fb-action-label">Comment</span>
    </button>

</div>

<div class="comment-box">

    <input
        type="text"
        placeholder="Write a comment..."
        class="comment-input"
        onkeydown="if(event.key==='Enter')socialhubCampusSendComment(this)"
    >

    <button
        type="button"
        onclick="socialhubCampusSendComment(this)"
    >
        Send
    </button>

</div>

<div class="campus-comments" data-open="1">
    ${commentRows}
</div>

`;

    const likeButton =
        article.querySelector(".post-actions .socialhub-like-btn");

    if (likeButton) {

        socialhubCampusBindPicker(likeButton, article);
    }

    return article;
}


function socialhubCampusCommentsHTML(comments, meId) {

    if (!comments.length) {
        return "";
    }

    const SHOW_TOP = 2;

    let html = "";

    comments.forEach((comment, index) => {

        const profile = comment.profiles || {};

        const avatarUrl = profile.avatar_url || "";

        const avatarHTML =
            avatarUrl
                ? `
                    <img
                        src="${socialhubCampusEscape(avatarUrl)}"
                        alt=""
                        style="
                            width:100%;
                            height:100%;
                            object-fit:cover;
                            border-radius:50%;
                        "
                    >
                `
                : "👤";

        const mine =
            meId && comment.user_id === meId;

        html += `
            <div
                class="comment"
                ${index >= SHOW_TOP ? 'data-hidden="1"' : ""}
            >
                <div class="avatar">
                    ${avatarHTML}
                </div>
                <div class="comment-content">
                    <strong>
                        ${socialhubCampusEscape(
                            profile.full_name ||
                            profile.username ||
                            "Student"
                        )}
                    </strong>
                    <p>${socialhubCampusEscape(comment.content)}</p>
                    ${
                        mine
                            ? `
                                <button
                                    type="button"
                                    class="campus-comment-del"
                                    onclick="socialhubCampusDeleteComment(
                                        '${comment.id}',
                                        this
                                    )"
                                >
                                    Delete
                                </button>
                            `
                            : ""
                    }
                </div>
            </div>
        `;
    });

    if (comments.length > SHOW_TOP) {

        html += `
            <button
                type="button"
                class="fb-comments-toggle"
                onclick="socialhubCampusExpandComments(this)"
            >
                View all ${comments.length} comments
            </button>
        `;
    }

    return html;
}


function socialhubCampusExpandComments(button) {

    const post =
        button.closest(".post");

    if (!post) {
        return;
    }

    post.querySelectorAll("[data-hidden]")
        .forEach(element => {
            element.removeAttribute("data-hidden");
        });

    button.remove();
}


// ======================================================
// 13. LIKE / REACT
// ======================================================

function socialhubCampusBindPicker(button, post) {

    button
        .querySelectorAll(".socialhub-reactions button")
        .forEach(pickerButton => {

            pickerButton.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    event.stopPropagation();

                    socialhubCampusReact(
                        post,
                        button,
                        pickerButton.dataset.reaction
                    );
                }
            );
        });
}


async function socialhubCampusReact(post, button, label) {

    const postId =
        post.dataset.postId;

    let me = null;

    try {

        const { data: sessionData } =
            await supabaseClient.auth.getSession();

        if (sessionData && sessionData.session) {

            me = sessionData.session.user;
        }
    }
    catch (err) {
        me = null;
    }

    if (!me) {

        socialhubToast(
            "Please login first.",
            "error"
        );

        return;
    }

    const liked =
        button.classList.contains("liked");

    const currentLabel =
        button.dataset.reaction || null;

    let newLabel = label;

    if (liked && currentLabel === label) {

        await supabaseClient
            .from("campus_post_likes")
            .delete()
            .eq("campus_post_id", postId)
            .eq("user_id", me.id);

        newLabel = null;
    }
    else {

        await supabaseClient
            .from("campus_post_likes")
            .upsert(
                {
                    campus_post_id: postId,
                    user_id: me.id,
                    reaction: label
                },
                {
                    onConflict: "campus_post_id,user_id"
                }
            );

        newLabel = label;
    }

    button.classList.toggle("liked", !!newLabel);

    button.dataset.reaction = newLabel || "";

    button.innerHTML =
        socialhubLikeButtonHTML(
            !!newLabel,
            newLabel || "like"
        ) +
        socialhubReactionPickerHTML();

    socialhubCampusBindPicker(button, post);

    const stats =
        post.querySelector(
            ".post-stats .fb-stats-reactions"
        );

    if (stats) {

        const b = stats.querySelector("b");

        const n = b ? parseInt(b.textContent) || 0 : 0;

        const delta =
            newLabel === null ? -1
            : liked ? 0
            : 1;

        stats.innerHTML =
            socialhubStatsHTML(
                newLabel || "like",
                Math.max(0, n + delta)
            );
    }
}


// ======================================================
// 14. COMMENTS
// ======================================================

function socialhubCampusToggleComments(button) {

    const post =
        button.closest(".post");

    if (!post) {
        return;
    }

    const input =
        post.querySelector(".comment-input");

    if (input) {
        input.focus();
    }
}


async function socialhubCampusSendComment(input) {

    const post =
        input.closest(".post");

    if (!post) {
        return;
    }

    const postId =
        post.dataset.postId;

    const content =
        input.value.trim();

    if (!content) {
        return;
    }

    let me = null;

    try {

        const { data: sessionData } =
            await supabaseClient.auth.getSession();

        if (sessionData && sessionData.session) {

            me = sessionData.session.user;
        }
    }
    catch (err) {
        me = null;
    }

    if (!me) {

        socialhubToast(
            "Please login first.",
            "error"
        );

        return;
    }

    const {
        data,
        error
    } =
        await supabaseClient
            .from("campus_post_comments")
            .insert({
                campus_post_id: postId,
                user_id: me.id,
                content: content
            })
            .select()
            .single();

    if (error) {

        socialhubToast(
            "Could not post your comment.",
            "error"
        );

        return;
    }

    input.value = "";

    let profile = null;

    try {

        profile =
            typeof getCurrentProfile === "function"
                ? await getCurrentProfile()
                : null;
    }
    catch (err) {
        profile = null;
    }

    const avatarUrl =
        (profile && profile.avatar_url) || "";

    const displayName =
        (profile && (profile.full_name || profile.username)) ||
        "You";

    const list =
        post.querySelector(".campus-comments");

    if (list) {

        list.insertAdjacentHTML(
            "beforeend",
            `
                <div class="comment">
                    <div class="avatar">
                        ${
                            avatarUrl
                                ? `
                                    <img
                                        src="${socialhubCampusEscape(avatarUrl)}"
                                        alt=""
                                        style="
                                            width:100%;
                                            height:100%;
                                            object-fit:cover;
                                            border-radius:50%;
                                        "
                                    >
                                `
                                : "👤"
                        }
                    </div>
                    <div class="comment-content">
                        <strong>${socialhubCampusEscape(displayName)}</strong>
                        <p>${socialhubCampusEscape(content)}</p>
                        <button
                            type="button"
                            class="campus-comment-del"
                            onclick="socialhubCampusDeleteComment(
                                '${data.id}',
                                this
                            )"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            `
        );

        const toggle =
            list.querySelector(".fb-comments-toggle");

        if (toggle) {

            const match =
                toggle.textContent.match(/\d+/);

            const total =
                match ? parseInt(match[0]) || 0 : 0;

            toggle.textContent =
                "View all " + (total + 1) + " comments";
        }
    }

    const stats =
        post.querySelector(".fb-stats-comments");

    if (stats) {

        const match =
            stats.textContent.match(/\d+/);

        const count =
            match ? parseInt(match[0]) || 0 : 0;

        stats.innerHTML =
            '<i class="fa-solid fa-comment"></i> ' +
            (count + 1) +
            " Comment" + (count + 1 === 1 ? "" : "s");
    }

    socialhubToast(
        "Comment posted.",
        "success"
    );
}


// ======================================================
// 15. DELETE POST (owner only)
// ======================================================
// 15. DELETE COMMENT (owner only)
// ======================================================

async function socialhubCampusDeleteComment(commentId, button) {

    const sure =
        confirm("Delete this comment?");

    if (!sure) {
        return;
    }

    const { error } =
        await supabaseClient
            .from("campus_post_comments")
            .delete()
            .eq("id", commentId);

    if (error) {

        socialhubToast(
            "Could not delete the comment.",
            "error"
        );

        return;
    }

    const row =
        button.closest(".comment");

    if (row) {
        row.remove();
    }

    const post =
        button.closest(".post");

    if (post) {

        const stats =
            post.querySelector(".fb-stats-comments");

        if (stats) {

            const match =
                stats.textContent.match(/\d+/);

            const count =
                match ? parseInt(match[0]) || 0 : 0;

            const next =
                Math.max(0, count - 1);

            stats.innerHTML =
                '<i class="fa-solid fa-comment"></i> ' +
                next +
                " Comment" + (next === 1 ? "" : "s");
        }

        const list =
            post.querySelector(".campus-comments");

        if (list) {

            const toggle =
                list.querySelector(".fb-comments-toggle");

            if (toggle) {

                const match =
                    toggle.textContent.match(/\d+/);

                const total =
                    match ? parseInt(match[0]) || 0 : 0;

                toggle.textContent =
                    "View all " + Math.max(0, total - 1) +
                    " comments";

                if (total - 1 <= 2) {
                    toggle.remove();
                }
            }
        }
    }

    socialhubToast(
        "Comment deleted.",
        "success"
    );
}


// ======================================================
// 16. DELETE POST (owner only)
// ======================================================

async function socialhubCampusDeletePost(postId, button) {

    const sure =
        confirm("Delete this post?");

    if (!sure) {
        return;
    }

    const { error } =
        await supabaseClient
            .from("campus_posts")
            .delete()
            .eq("id", postId);

    if (error) {

        socialhubToast(
            "Could not delete the post.",
            "error"
        );

        return;
    }

    const post =
        button.closest(".post");

    if (post) {
        post.remove();
    }

    socialhubToast(
        "Post deleted.",
        "success"
    );

    const feed =
        document.getElementById("campusFeed");

    if (feed && !feed.querySelector(".post")) {

        socialhubCampusLoadPosts();
    }
}
