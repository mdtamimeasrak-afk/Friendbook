// ======================================================
// SOCIALHUB - MY PROFILE PAGE (profile.html)
// Instagram-style profile with the home-page topbar:
//   1. Instagram header: ring avatar + username +
//      buttons + stats + bio + icon tabs
//   2. My posts (Instagram square grid + lightbox
//      viewer with full reactions/comments)
//   3. Real photos from my posts
//   4. Real friends grid
// ======================================================

var db = window.db || supabaseClient;


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
// 1. BUILD A POST ARTICLE (same template as the feed)
// ======================================================

function socialhubCreatePostArticle(post, profile) {

    const background =
        post.background || null;

    let textStyle = `
        margin: 0;
        line-height: 1.6;
        white-space: pre-wrap;
        overflow-wrap: break-word;
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
        `;
    }

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
                    ${socialhubEscape(profile?.full_name || "User")}
                </h3>

                <small>
                    @${socialhubEscape(profile?.username || "user")}
                    ·
                    ${new Date(post.created_at).toLocaleString()}
                    ·
                    ${socialhubAudienceIcon(post.audience)}
                </small>

            </div>

        </div>

        <p
            class="post-text"
            style="${textStyle}"
        >${socialhubEscape(post.content || "")}</p>

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

    article.dataset.postId = post.id;

    return article;
}


// ======================================================
// 2. MY POSTS (Instagram square grid)
// ======================================================

let socialhubMyPostsCache = {
    posts: [],
    profile: null
};


function socialhubCreateProfileTile(post) {

    const tile =
        document.createElement("div");

    tile.className = "profile-post-tile";

    let media = "";

    if (post.image_url) {

        media = `
            <img
                src="${socialhubEscape(post.image_url)}"
                alt="Post photo"
                loading="lazy"
            >
        `;

    } else if (post.video_url) {

        media = `
            <video
                src="${socialhubEscape(post.video_url)}"
                muted
                playsinline
                preload="metadata"
            ></video>
        `;

    } else {

        media = `
            <div class="tile-text">
                ${socialhubEscape(post.content || "")}
            </div>
        `;
    }

    tile.innerHTML = `

        <div class="tile-media">
            ${media}
        </div>

        <div class="tile-overlay">
            <span>
                <i class="fa-solid fa-heart"></i>
            </span>
            <span>
                <i class="fa-solid fa-comment"></i>
            </span>
        </div>
    `;

    tile.addEventListener("click", () => {

        socialhubOpenPostLightbox(post.id);
    });

    return tile;
}


async function socialhubLoadMyPosts() {

    const container =
        document.getElementById("profilePosts");

    if (!container) {
        return;
    }

    const me =
        await socialhubGetMe();

    if (!me) {
        return;
    }

    const {
        data: profile
    } = await db
        .from("profiles")
        .select("id, full_name, username, avatar_url")
        .eq("id", me.id)
        .single();

    const {
        data: posts,
        error
    } = await db
        .from("posts")
        .select("*")
        .eq("user_id", me.id)
        .order("created_at", {
            ascending: false
        });

    if (error) {

        console.error(
            "❌ My posts error:",
            error
        );

        return;
    }

    socialhubMyPostsCache = {
        posts: posts || [],
        profile
    };

    socialhubRenderMyPosts();
}


// ======================================================
// 2a. POST FILTERS (Recents / Photos / Videos)
// ======================================================

let socialhubProfilePostFilter = "all";


function socialhubRenderMyPosts() {

    const container =
        document.getElementById("profilePosts");

    if (!container) {
        return;
    }

    const cache =
        socialhubMyPostsCache;

    let posts =
        cache.posts || [];

    const filter =
        socialhubProfilePostFilter;

    if (filter === "photos") {

        posts =
            posts.filter(post => post.image_url);

    } else if (filter === "videos") {

        posts =
            posts.filter(post => post.video_url);
    }

    container.innerHTML = "";

    if (!posts.length) {

        const messages = {
            all: "You haven't created any posts yet. Go to the home feed and share something!",
            photos: "No photos yet. Post a photo to see it here!",
            videos: "No videos yet. Post a video to see it here!"
        };

        container.innerHTML = `
            <p class="empty-message">
                ${messages[filter] || messages.all}
            </p>
        `;

        return;
    }

    posts.forEach(post => {

        container.appendChild(
            socialhubCreatePostArticle(
                post,
                cache.profile
            )
        );
    });
}


function socialhubProfileSetPostFilter(filter) {

    socialhubProfilePostFilter = filter;

    document
        .querySelectorAll("#fbPostFilters [data-filter]")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.filter === filter
            );
        });

    socialhubRenderMyPosts();
}


// ======================================================
// 2b. PROFILE POST COMPOSER (Facebook style)
// ======================================================

const socialhubProfileComposer = {
    image: null
};


function socialhubProfileOpenComposer() {

    const modal =
        document.getElementById("profileComposerModal");

    if (!modal) {
        return;
    }

    modal.style.display = "flex";

    setTimeout(() => {

        document
            .getElementById("profilePostInput")
            ?.focus();
    }, 80);
}


function socialhubProfileCloseComposer() {

    document.getElementById("profileComposerModal").style.display =
        "none";
}


function socialhubProfilePickPhoto() {

    document.getElementById("profilePostFile")?.click();
}


function socialhubProfileToggleAudience(event) {

    event.stopPropagation();

    const menu =
        document.getElementById("profileAudienceMenu");

    if (!menu) {
        return;
    }

    menu.style.display =
        menu.style.display === "none"
            ? "flex"
            : "none";
}


function socialhubProfileSetAudience(value) {

    localStorage.setItem(
        "socialhubProfileAudience",
        value
    );

    const label =
        document.getElementById("profileAudienceLabel");

    if (label) {

        label.textContent =
            SOCIALHUB_AUDIENCE_LABELS[value] ||
            "🌎 Public";
    }

    const label2 =
        document.getElementById("profileAudienceLabel2");

    if (label2) {

        label2.textContent =
            SOCIALHUB_AUDIENCE_LABELS[value] ||
            "🌎 Public";
    }

    document.getElementById("profileAudienceMenu").style.display =
        "none";
}


function socialhubProfileComposerRemovePhoto() {

    socialhubProfileComposer.image = null;

    const preview =
        document.getElementById("profilePostPreview");

    if (preview) {

        preview.style.display = "none";

        document.getElementById("profilePostPreviewImg").src = "";
    }

    document.getElementById("profilePostFile").value = "";
}


async function socialhubProfileSubmitPost() {

    const input =
        document.getElementById("profilePostInput");

    const content =
        (input?.value || "").trim();

    const image =
        socialhubProfileComposer.image;

    if (!content && !image) {

        socialhubToast(
            "Write something or attach a photo first.",
            "info"
        );

        return;
    }

    const me =
        await socialhubGetMe();

    if (!me) {

        alert("Please login first.");

        return;
    }

    const button =
        document.getElementById("profileComposerPostBtn");

    button.disabled = true;

    button.innerText = "Posting...";

    let imageUrl = null;

    try {

        if (image) {

            const ext =
                socialhubFileExtension(image);

            const path =
                `${me.id}-${Date.now()}.${ext}`;

            const { error: uploadError } =
                await db
                    .storage
                    .from("post-images")
                    .upload(path, image, {
                        upsert: true,
                        contentType: image.type
                    });

            if (uploadError) {
                throw uploadError;
            }

            const { data: urlData } =
                db
                    .storage
                    .from("post-images")
                    .getPublicUrl(path);

            imageUrl = urlData.publicUrl;
        }

        const audience =
            localStorage.getItem(
                "socialhubProfileAudience"
            ) || "public";

        const { error } =
            await db
                .from("posts")
                .insert({
                    user_id: me.id,
                    content: content,
                    image_url: imageUrl,
                    audience: audience
                });

        if (error) {
            throw error;
        }
    }
    catch (err) {

        console.error(
            "❌ Profile post error:",
            err
        );

        button.disabled = false;

        button.innerText = "Post";

        alert(
            "Could not create the post.\n\n" +
            err.message
        );

        return;
    }

    socialhubProfileCloseComposer();

    if (input) {
        input.value = "";
    }

    socialhubProfileComposerRemovePhoto();

    button.disabled = false;

    button.innerText = "Post";

    socialhubToast(
        "Posted! 🎉",
        "success"
    );

    await socialhubLoadMyPosts();

    socialhubLoadMyStats();
}


// ======================================================
// 2c. HEADER / TABS MORE MENU (▾ / More ▼ / •••)
// ======================================================

function socialhubProfileToggleMore(event) {

    event.stopPropagation();

    const wrap =
        event.currentTarget.closest(
            ".fb-more-wrap"
        );

    if (!wrap) {
        return;
    }

    const menu =
        wrap.querySelector(".fb-more-menu");

    if (!menu) {
        return;
    }

    document
        .querySelectorAll(".fb-more-wrap .fb-more-menu")
        .forEach(other => {

            if (other !== menu) {

                other.style.display = "none";
            }
        });

    menu.style.display =
        menu.style.display === "none"
            ? "block"
            : "none";

    if (
        menu.style.display === "block" &&
        typeof window.socialhubProfileMoreRefreshLabels === "function"
    ) {

        window.socialhubProfileMoreRefreshLabels();
    }
}


// ======================================================
// 2b. POST LIGHTBOX (open a tile as a full post)
// ======================================================

function socialhubOpenPostLightbox(postId) {

    const cache =
        socialhubMyPostsCache;

    const post =
        (cache?.posts || [])
            .find(item => item.id === postId);

    if (!post) {
        return;
    }

    const modal =
        document.getElementById("postLightbox");

    const box =
        document.getElementById("postLightboxBox");

    if (!modal || !box) {
        return;
    }

    box.innerHTML = "";

    const close =
        document.createElement("button");

    close.className = "post-lightbox-close";

    close.innerHTML = "✕";

    close.addEventListener("click", () => {

        modal.classList.remove("open");

        document.body.style.overflow = "";
    });

    const article =
        socialhubCreatePostArticle(
            post,
            cache.profile
        );

    article.style.margin = "0";

    socialhubEnhanceLightboxPost(article);

    box.appendChild(article);

    if (post.image_url) {

        const download =
            document.createElement("a");

        download.className =
            "post-lightbox-download";

        download.href =
            post.image_url;

        download.download =
            "socialhub-photo";

        download.title =
            "Download photo";

        download.innerHTML =
            '<i class="fa-solid fa-download"></i>';

        box.appendChild(download);
    }

    box.appendChild(close);

    modal.classList.add("open");

    document.body.style.overflow = "hidden";

    // Wire up reactions + comments inside the lightbox
    if (
        typeof socialhubAttachReactionUI === "function"
    ) {

        socialhubAttachReactionUI();
    }

    if (
        typeof socialhubLoadInteractions === "function"
    ) {

        socialhubLoadInteractions();
    }
}


function socialhubClosePostLightbox(event) {

    const modal =
        document.getElementById("postLightbox");

    if (!modal) {
        return;
    }

    if (event && event.target !== modal) {
        return;
    }

    modal.classList.remove("open");

    document.body.style.overflow = "";
}


// ======================================================
// 2c. LIGHTBOX EXTRA FEATURES (share link + save)
// ======================================================

function socialhubEnhanceLightboxPost(article) {

    const postId =
        article.dataset.postId;

    if (!postId) {
        return;
    }

    // ---------- SHARE: copy the post link ----------

    const shareButton =
        [...article.querySelectorAll(".post-actions button")]
            .find(button =>
                button.innerText
                    .toLowerCase()
                    .includes("share")
            );

    if (shareButton) {

        shareButton.addEventListener("click", () => {

            const link =
                window.location.origin +
                "/index.html?post=" +
                postId;

            const copied = () => {

                shareButton.innerHTML =
                    '<i class="fa-solid fa-check"></i> Link copied!';

                setTimeout(() => {

                    shareButton.innerHTML =
                        '<i class="fa-solid fa-share"></i> Share';
                }, 2000);
            };

            if (
                navigator.clipboard &&
                navigator.clipboard.writeText
            ) {

                navigator.clipboard
                    .writeText(link)
                    .then(copied)
                    .catch(() => {

                        window.prompt(
                            "Copy the post link:",
                            link
                        );
                    });

            } else {

                window.prompt(
                    "Copy the post link:",
                    link
                );
            }
        });
    }

    // ---------- SAVE: bookmark toggle ----------

    const actions =
        article.querySelector(".post-actions");

    if (
        !actions ||
        actions.querySelector(".socialhub-save-btn")
    ) {
        return;
    }

    const saveButton =
        document.createElement("button");

    saveButton.className = "socialhub-save-btn";

    saveButton.title = "Save post";

    saveButton.innerHTML =
        '<i class="fa-regular fa-bookmark"></i>';

    saveButton.addEventListener("click", async () => {

        const me =
            await socialhubGetMe();

        if (!me) {
            return;
        }

        const saved =
            saveButton.classList.contains("saved");

        if (saved) {

            const {
                error
            } = await db
                .from("saved_posts")
                .delete()
                .eq("user_id", me.id)
                .eq("post_id", postId);

            if (!error) {

                saveButton.classList.remove("saved");

                saveButton.innerHTML =
                    '<i class="fa-regular fa-bookmark"></i>';
            }

        } else {

            const {
                error
            } = await db
                .from("saved_posts")
                .insert({
                    user_id: me.id,
                    post_id: postId
                });

            if (!error) {

                saveButton.classList.add("saved");

                saveButton.innerHTML =
                    '<i class="fa-solid fa-bookmark"></i>';
            }
        }
    });

    actions.appendChild(saveButton);
}


// ======================================================
// 3. MY PHOTOS (from my posts with images)
// ======================================================

let socialhubPhotoFilter = "all";


async function socialhubLoadMyPhotos() {

    const grid =
        document.getElementById("profilePhotos");

    if (!grid) {
        return;
    }

    const me =
        await socialhubGetMe();

    if (!me) {
        return;
    }

    const filter =
        socialhubPhotoFilter;

    grid.innerHTML = "";

    // ---------- PROFILE PICTURE / COVER PHOTOS ----------

    if (
        filter === "profile" ||
        filter === "cover"
    ) {

        const field =
            filter === "profile"
                ? "avatar_url"
                : "cover_url";

        const {
            data: profile
        } = await db
            .from("profiles")
            .select(field)
            .eq("id", me.id)
            .single();

        const url =
            profile?.[field] || null;

        if (url) {

            const tile =
                document.createElement("div");

            tile.className = "profile-photo-item";

            tile.style.cursor = "pointer";

            tile.innerHTML = `
                <img
                    src="${socialhubEscape(url)}"
                    alt="Photo"
                    loading="lazy"
                >
            `;

            tile.addEventListener("click", () => {

                socialhubViewFullImage(url);
            });

            grid.appendChild(tile);

        } else {

            grid.innerHTML = `
                <p class="empty-message" style="grid-column:1/-1;">
                    ${filter === "profile"
                        ? "No profile picture yet. Click the camera on your avatar to add one!"
                        : "No cover photo yet. Click 'Edit cover photo' to add one!"}
                </p>
            `;
        }

        document
            .querySelectorAll(".fb-mini-photos")
            .forEach(mini => {

                mini.innerHTML = "";

                mini.innerHTML = `
                    <p class="empty-message" style="grid-column:1/-1;">
                        Switch to All Photos to see your uploads.
                    </p>
                `;
            });

        return;
    }

    // ---------- ALL PHOTOS (from my posts) ----------

    const {
        data: posts,
        error
    } = await db
        .from("posts")
        .select("id, image_url, video_url")
        .eq("user_id", me.id)
        .or(
            "image_url.not.is.null," +
            "video_url.not.is.null"
        )
        .order("created_at", {
            ascending: false
        })
        .limit(30);

    if (error) {
        return;
    }

    if (!posts || posts.length === 0) {

        const emptyHTML = `
            <p class="empty-message" style="grid-column:1/-1;">
                No photos or videos yet. Post a photo or video to see it here!
            </p>
        `;

        grid.innerHTML = emptyHTML;

        document
            .querySelectorAll(".fb-mini-photos")
            .forEach(mini => {

                mini.innerHTML = emptyHTML;
            });

        return;
    }

    posts.forEach(post => {

        const tile =
            document.createElement("div");

        tile.className = "profile-photo-item";

        tile.style.cursor = "pointer";

        if (
            post.video_url &&
            !post.image_url
        ) {

            tile.innerHTML = `
                <video
                    src="${socialhubEscape(post.video_url)}"
                    muted
                    playsinline
                    preload="metadata"
                ></video>

                <span class="profile-photo-video-badge">🎥</span>
            `;

            tile.addEventListener("click", () => {

                if (
                    typeof socialhubWatchOpen ===
                    "function"
                ) {

                    socialhubWatchOpen(post.id);

                } else {

                    location.href =
                        `watch.html?video=${post.id}`;
                }
            });

        } else {

            tile.innerHTML = `
                <img
                    src="${socialhubEscape(post.image_url)}"
                    alt="Photo"
                    loading="lazy"
                >
            `;

            tile.addEventListener("click", () => {

                socialhubOpenPostLightbox(post.id);
            });
        }

        grid.appendChild(tile);
    });

    const miniHTML =
        [...grid.children]
            .slice(0, 6)
            .map(node => node.outerHTML)
            .join("");

    document
        .querySelectorAll(".fb-mini-photos")
        .forEach(mini => {

            mini.innerHTML = miniHTML;
        });
}


// Photos tab filter chips (All / Profile Pictures / Cover Photos)

function socialhubProfileSetPhotoFilter(filter) {

    socialhubPhotoFilter = filter;

    document
        .querySelectorAll("#fbPhotoChips [data-photo-filter]")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.photoFilter === filter
            );
        });

    socialhubLoadMyPhotos();
}


// ======================================================
// 3b. MY VIDEOS (from my posts with video_url)
// ======================================================

async function socialhubLoadMyVideos() {

    const grid =
        document.getElementById("profileVideos");

    if (!grid) {
        return;
    }

    const me =
        await socialhubGetMe();

    if (!me) {
        return;
    }

    const {
        data: posts,
        error
    } = await db
        .from("posts")
        .select("id, image_url, video_url, content")
        .eq("user_id", me.id)
        .not("video_url", "is", null)
        .order("created_at", {
            ascending: false
        })
        .limit(30);

    if (error) {
        return;
    }

    grid.innerHTML = "";

    if (!posts || posts.length === 0) {

        grid.innerHTML = `
            <p class="empty-message" style="grid-column:1/-1;">
                No videos yet. Post a video to see it here!
            </p>
        `;

        return;
    }

    posts.forEach(post => {

        const tile =
            document.createElement("div");

        tile.className = "profile-photo-item";

        tile.style.cursor = "pointer";

        tile.innerHTML = `
            <video
                src="${socialhubEscape(post.video_url)}"
                muted
                playsinline
                preload="metadata"
            ></video>

            <span class="profile-photo-video-badge">
                <i class="fa-solid fa-play"></i>
            </span>

            ${
                (post.content || "").trim()
                    ? `
                        <p class="profile-photo-video-caption">
                            ${socialhubEscape(
                                (post.content || "").trim()
                            )}
                        </p>
                    `
                    : ""
            }
        `;

        tile.addEventListener("click", () => {

            if (
                typeof socialhubWatchOpen ===
                "function"
            ) {

                socialhubWatchOpen(post.id);

            } else {

                location.href =
                    `watch.html?video=${post.id}`;
            }
        });

        grid.appendChild(tile);
    });
}


// ======================================================
// 4. MY FRIENDS GRID
// ======================================================

async function socialhubLoadMyFriends() {

    const grid =
        document.getElementById("profileFriends");

    if (!grid) {
        return;
    }

    const me =
        await socialhubGetMe();

    if (!me) {
        return;
    }

    const {
        data: friendships,
        error
    } = await db
        .from("friendships")
        .select("requester_id, addressee_id")
        .eq("status", "accepted")
        .or(
            `requester_id.eq.${me.id},` +
            `addressee_id.eq.${me.id}`
        );

    if (error) {
        return;
    }

    grid.innerHTML = "";

    if (!friendships || friendships.length === 0) {

        const emptyFriends = `
            <p class="empty-message">
                No friends to show yet.
            </p>
        `;

        grid.innerHTML = emptyFriends;

        document
            .querySelectorAll(".fb-mini-friends")
            .forEach(mini => {

                mini.innerHTML = emptyFriends;
            });

        return;
    }

    const friendIds =
        friendships.map(friendship =>
            friendship.requester_id === me.id
                ? friendship.addressee_id
                : friendship.requester_id
        );

    const {
        data: profiles
    } = await db
        .from("profiles")
        .select("id, full_name, username, avatar_url")
        .in("id", friendIds);

    (profiles || [])
        .slice(0, 6)
        .forEach(friend => {

            const item =
                document.createElement("div");

            item.className = "friend-mini";

            item.innerHTML = `

                <button
                    type="button"
                    class="socialhub-friend-menu-btn"
                    title="Friend options"
                >
                    ⋯
                </button>

                <div class="friend-mini-avatar">
                    ${socialhubAvatarHTML(friend)}
                </div>

                <span>
                    ${socialhubEscape(friend.full_name || "User")}
                </span>
            `;

            item.addEventListener("click", () => {

                window.location.href =
                    `user-profile.html?user=${friend.id}`;
            });

            const menuButton =
                item.querySelector(
                    ".socialhub-friend-menu-btn"
                );

            menuButton.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    socialhubFriendCardMenu(
                        menuButton,
                        friend
                    );
                }
            );

            grid.appendChild(item);
        });

    document
        .querySelectorAll(".fb-mini-friends")
        .forEach(mini => {

            mini.innerHTML = grid.innerHTML;
        });
}


// ======================================================
// 4b. FRIEND CARD MENU (⋯ on each friend card)
// ======================================================

function socialhubFriendCardMenu(button, friend) {

    document
        .querySelectorAll(".socialhub-friend-menu.open")
        .forEach(menu => menu.remove());

    const menu =
        document.createElement("div");

    menu.className =
        "socialhub-post-menu socialhub-friend-menu open";

    menu.innerHTML = `

        <button type="button" data-action="view">
            <i class="fa-solid fa-user"></i>
            View Profile
        </button>

        <button type="button" data-action="message">
            <i class="fa-solid fa-comment"></i>
            Message
        </button>

        <button type="button" data-action="unfriend">
            <i class="fa-solid fa-user-minus"></i>
            Remove Friend
        </button>

        <button type="button" data-action="block">
            <i class="fa-solid fa-ban"></i>
            Block
        </button>
    `;

    document.body.appendChild(menu);

    const rect =
        button.getBoundingClientRect();

    menu.style.top =
        `${rect.bottom + 4}px`;

    menu.style.left =
        `${rect.right}px`;

    menu
        .querySelector('[data-action="view"]')
        .addEventListener("click", () => {

            menu.remove();

            window.location.href =
                `user-profile.html?user=${friend.id}`;
        });

    menu
        .querySelector('[data-action="message"]')
        .addEventListener("click", () => {

            menu.remove();

            if (
                typeof socialhubOpenChat ===
                "function"
            ) {

                socialhubOpenChat(friend.id);

            } else {

                window.location.href =
                    `messages.html?user=${friend.id}`;
            }
        });

    menu
        .querySelector('[data-action="unfriend"]')
        .addEventListener("click", async () => {

            menu.remove();

            if (
                confirm(
                    `Remove ${friend.full_name || "this user"} from your friends?`
                )
            ) {

                await socialhubUnfriend(friend.id);

                await socialhubLoadMyFriends();

                await socialhubLoadMyStats();
            }
        });

    menu
        .querySelector('[data-action="block"]')
        .addEventListener("click", async () => {

            menu.remove();

            await socialhubToggleBlock(
                friend.id,
                null
            );

            await socialhubLoadMyFriends();

            await socialhubLoadMyStats();
        });

    const close = event => {

        if (
            event.target !== button &&
            !menu.contains(event.target)
        ) {

            menu.remove();

            document.removeEventListener(
                "click",
                close
            );
        }
    };

    setTimeout(
        () => document.addEventListener(
            "click",
            close
        ),
        0
    );
}


// ======================================================
// 5. STAT STRIP (Posts / Photos / Friends)
// ======================================================

async function socialhubLoadMyStats() {

    const me =
        await socialhubGetMe();

    if (!me) {
        return;
    }

    const [postsResult, photosResult, friendsResult] =
        await Promise.all([

            db
                .from("posts")
                .select("id", { count: "exact", head: true })
                .eq("user_id", me.id),

            db
                .from("posts")
                .select("id", { count: "exact", head: true })
                .eq("user_id", me.id)
                .not("image_url", "is", null),

            db
                .from("friendships")
                .select("id", { count: "exact", head: true })
                .eq("status", "accepted")
                .or(
                    `requester_id.eq.${me.id},` +
                    `addressee_id.eq.${me.id}`
                )
        ]);

    const setCount = (id, value) => {

        const element =
            document.getElementById(id);

        if (element) {

            element.innerText =
                String(value || 0);
        }
    };

    setCount("statPosts", postsResult.count);

    setCount("statPhotos", photosResult.count);

    setCount("statFriends", friendsResult.count);

    const friendCount =
        friendsResult.count || 0;

    const summary =
        document.getElementById("fbFriendSummary");

    if (summary) {

        const countSpan =
            summary.querySelector("span");

        if (countSpan) {

            countSpan.innerText =
                `${friendCount} friends`;

        }
    }

    const countEl =
        document.getElementById("fbFriendCount");

    if (countEl) {

        countEl.innerText =
            String(friendCount);
    }
}


// ======================================================
// 6. COVER TEXT + FACEBOOK TABS (scroll anchors)
// ======================================================

const socialhubFbScrollTargets = {

    posts: "#fbPostsStack",

    about: "#aboutSection",

    photos: "#photosCard",

    videos: "#videosCard",

    friends: "#friendsCard",

    events: "#eventsCard",

    groups: "#groupsCard"

};


function socialhubSwitchFbTab(name) {

    document
        .querySelectorAll(".fb-tabs-bar button")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.fbTab === name
            );

        });

    const target =
        document.querySelector(
            socialhubFbScrollTargets[name] || ""
        );

    if (target) {

        target.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
}


function socialhubSetupProfileTabs() {

    const tabs =
        document.querySelectorAll(
            ".fb-tabs-bar button"
        );


    tabs.forEach(button => {

        if (!button.dataset.fbTab) {

            return;
        }

        button.addEventListener(
            "click",
            () => {

                socialhubSwitchFbTab(
                    button.dataset.fbTab
                );
            }
        );
    });
}


function socialhubHideEmptyAboutRows() {

    const rows =
        document.querySelectorAll(
            ".fb-about-card .about-row, " +
            ".fb-intro-details .about-row"
        );

    rows.forEach(row => {

        const value =
            (row.querySelector("span:last-child, a:last-child")?.innerText || "")
                .trim();

        if (
            value === "" ||
            value === "Not added" ||
            value === "No bio added yet."
        ) {

            row.style.display = "none";
        }
    });
}


// ======================================================
// 7. AUTO-SYNC
// ======================================================

async function socialhubFillProfileHeader() {

    const result =
        await getCurrentProfile();

    if (!result) {
        return;
    }

    const profile =
        result.profile;

    if (!profile) {
        return;
    }

    const nameEl =
        document.getElementById("coverName");

    if (nameEl) {

        nameEl.firstChild.textContent =
            profile.full_name || "User";
    }

    const nick =
        (profile.extra || {}).other_names || "";

    const nickEl =
        document.getElementById("headerNickname");

    if (nickEl) {

        if (String(nick).trim()) {

            nickEl.textContent =
                `(${String(nick).trim()})`;

            nickEl.style.display = "";
        } else {

            nickEl.style.display = "none";
        }
    }

    // ---------- LEFT COLUMN INTRO CARD ----------

    const introAvatar =
        document.querySelector(
            ".fb-intro-avatar"
        );

    if (introAvatar) {

        introAvatar.innerHTML =
            socialhubAvatarHTML(profile);
    }

    const introName =
        document.querySelector(
            ".fb-intro-id strong"
        );

    if (introName) {

        introName.textContent =
            profile.full_name || "User";
    }

    const introUser =
        document.querySelector(
            ".fb-intro-id .profile-username"
        );

    if (introUser) {

        introUser.textContent =
            "@" + (profile.username || "user");
    }

    const introBio =
        document.querySelector(
            ".fb-intro-bio"
        );

    if (introBio) {

        const bio = (profile.bio || "").trim();

        if (bio) {

            introBio.textContent = bio;

            introBio.style.display = "";
        } else {

            introBio.style.display = "none";
        }
    }

    // ---------- HEADER BIO (hide completely when empty) ----------

    const headerBio =
        document.querySelector(
            ".fb-header-bio"
        );

    if (headerBio) {

        const bio = (profile.bio || "").trim();

        if (bio) {

            headerBio.textContent = bio;

            headerBio.style.display = "";
        } else {

            headerBio.style.display = "none";
        }
    }

    // ---------- COMPOSER MODAL (avatar + name) ----------

    const composerAvatar =
        document.querySelector(
            "#profileComposerModal .fb-composer-top .avatar"
        );

    if (composerAvatar) {

        composerAvatar.innerHTML =
            socialhubAvatarHTML(profile);
    }

    const composerName =
        document.querySelector(
            ".fb-composer-name"
        );

    if (composerName) {

        composerName.textContent =
            profile.full_name || "User";
    }

    // ---------- ABOUT: bio + names (master layout) ----------

    document
        .querySelectorAll(".fb-about-bio")
        .forEach(el => {

            const bio = (profile.bio || "").trim();

            if (bio) {

                el.textContent = bio;

                el.style.display = "";

            } else {

                el.textContent = "Not added";

                el.style.display = "none";
            }
        });

    document
        .querySelectorAll(".fb-names-full")
        .forEach(el => {

            el.textContent =
                profile.full_name || "Not added";
        });

    document
        .querySelectorAll(".fb-names-nick")
        .forEach(el => {

            el.textContent =
                profile.nickname || "Not added";
        });

    document
        .querySelectorAll(".fb-names-user")
        .forEach(el => {

            el.textContent =
                "@" + (profile.username || "user");
        });

    // ---------- JOINED SOCIALHUB (About → Overview) ----------

    const joinedEl =
        document.querySelector(
            ".profile-joined"
        );

    if (joinedEl) {

        const {
            data: joinedData
        } = await db
            .from("profiles")
            .select("created_at")
            .eq("id", profile.id)
            .single();

        if (joinedData && joinedData.created_at) {

            joinedEl.textContent =
                new Date(
                    joinedData.created_at
                ).toLocaleDateString(
                    undefined,
                    {
                        year: "numeric",
                        month: "long"
                    }
                );

        } else {

            joinedEl.textContent =
                "Not added";
        }
    }
}


// Hide header info items that have no value yet
// (keeps the reference layout clean instead of "Not added")

function socialhubTrimInfoRow() {

    document
        .querySelectorAll(".fb-info-item")
        .forEach(item => {

            const value =
                (item.querySelector(
                    "span:last-child"
                )?.innerText || "")
                    .trim();

            if (
                !value ||
                value === "Not added"
            ) {

                item.style.display = "none";
            }
        });
}


// Hide left-column cards (Education / Interests) whose rows
// all have no data — keeps the layout clean

function socialhubTrimSideCards() {

    document
        .querySelectorAll(
            ".fb-left .fb-side-card .fb-intro-details"
        )
        .forEach(details => {

            const card =
                details.closest(".profile-card");

            if (!card) {
                return;
            }

            const rows =
                [...details.querySelectorAll(".about-row")];

            if (
                rows.length &&
                rows.every(row => row.style.display === "none")
            ) {

                card.style.display = "none";
            }
        });
}


function socialhubRenderAboutChips() {

    document
        .querySelectorAll(".fb-chip-wrap")
        .forEach(wrap => {

            const source =
                wrap.querySelector(".fb-chip-source");

            if (!source) {
                return;
            }

            const text =
                (source.innerText || "").trim();

            const parts =
                text
                    .split(/[,،|;]+/)
                    .map(part => part.trim())
                    .filter(Boolean);

            if (!parts.length) {

                wrap.style.display = "none";

                return;
            }

            source.style.display = "none";

            parts.forEach(part => {

                const chip =
                    document.createElement("span");

                chip.className = "fb-chip";

                chip.textContent = part;

                wrap.appendChild(chip);
            });
        });
}


document.addEventListener("DOMContentLoaded", () => {

    const isProfilePage =
        window.location.pathname
            .split("/")
            .pop() === "profile.html";

    if (!isProfilePage) {
        return;
    }

    socialhubFillProfileHeader();

    socialhubSetupProfileTabs();

    // ---------- About two-column section switcher (visual) ----------

    const aboutBlocks =
        [...document.querySelectorAll("#aboutSection .fb-about-block")];

    const aboutSidebar =
        document.querySelector(".fb-about-side");

    if (aboutSidebar && aboutBlocks.length) {

        const aboutButtons =
            [...aboutSidebar.querySelectorAll("button")];

        aboutButtons.forEach(btn => {

            btn.addEventListener("click", () => {

                aboutButtons.forEach(b => b.classList.remove("active"));

                btn.classList.add("active");

                aboutBlocks.forEach(block => {

                    block.classList.toggle(
                        "active",
                        block.dataset.aboutIndex === btn.dataset.aboutBlock
                    );
                });
            });
        });

        aboutBlocks.forEach(block => {

            block.classList.toggle(
                "active",
                block.dataset.aboutIndex === "0"
            );
        });

        // Hide empty sidebar categories after the row-trim pass

        const syncAboutSidebar = () => {

            aboutButtons.forEach(btn => {

                const block =
                    aboutBlocks.find(
                        b => b.dataset.aboutIndex === btn.dataset.aboutBlock
                    );

                if (!block) {
                    return;
                }

                const rows =
                    [...block.querySelectorAll(".about-row, .pd-row")];

                const chips =
                    [...block.querySelectorAll(".fb-chip-wrap")];

                const hasContent =
                    (rows.length &&
                        rows.some(row => row.style.display !== "none")) ||
                    (chips.length &&
                        chips.some(chip => chip.style.display !== "none"));

                const isIntro =
                    btn.dataset.aboutBlock === "0";

                btn.style.display =
                    (isIntro || hasContent) ? "" : "none";
            });
        };

        setTimeout(syncAboutSidebar, 1600);

        setTimeout(syncAboutSidebar, 4500);
    }

    // ---------- Post filters (Recents / Photos / Videos) ----------

    document
        .querySelectorAll("#fbPostFilters [data-filter]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => socialhubProfileSetPostFilter(
                    button.dataset.filter
                )
            );
        });

    // ---------- Photos tab chips (All / Profile Pictures / Covers) ----------

    document
        .querySelectorAll("#fbPhotoChips [data-photo-filter]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => socialhubProfileSetPhotoFilter(
                    button.dataset.photoFilter
                )
            );
        });

    setTimeout(socialhubTrimInfoRow, 800);

    setTimeout(socialhubTrimInfoRow, 2500);

    // ---------- About chips (Hobbies / Interests) ----------

    setTimeout(socialhubRenderAboutChips, 1700);

    setTimeout(socialhubRenderAboutChips, 4500);

    // ---------- Default tab: About (stacked layout) ----------

    document
        .querySelectorAll(".fb-tabs-bar button")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.fbTab === "about"
            );
        });

    // ---------- Composer wiring ----------

    const fileInput =
        document.getElementById("profilePostFile");

    if (fileInput) {

        fileInput.addEventListener(
            "change",
            async event => {

                const file =
                    event.target.files?.[0];

                if (!file) {
                    return;
                }

                const preview =
                    document.getElementById("profilePostPreview");

                const img =
                    document.getElementById("profilePostPreviewImg");

                img.src =
                    URL.createObjectURL(file);

                preview.style.display = "flex";

                socialhubProfileComposer.image = file;
            }
        );
    }

    document
        .querySelectorAll(
            "#profileAudienceMenu [data-audience]"
        )
        .forEach(btn => {

            btn.addEventListener(
                "click",
                () => socialhubProfileSetAudience(
                    btn.dataset.audience
                )
            );
        });

    // Restore saved audience choice

    const savedAudience =
        localStorage.getItem(
            "socialhubProfileAudience"
        );

    if (savedAudience) {

        socialhubProfileSetAudience(savedAudience);
    }

    document.addEventListener(
        "click",
        event => {

            // Close more menus (▾ / More ▼ / •••)

            if (
                !event.target.closest(".fb-more-wrap")
            ) {

                document
                    .querySelectorAll(
                        ".fb-more-wrap .fb-more-menu"
                    )
                    .forEach(menu => {

                        menu.style.display = "none";
                    });
            }

            // Close audience menu

            const audienceMenu =
                document.getElementById("profileAudienceMenu");

            if (
                audienceMenu &&
                !event.target.closest(
                    ".fb-composer-audience-wrap"
                )
            ) {
                audienceMenu.style.display = "none";
            }
        }
    );

    // ---------- End composer wiring ----------

    // Hide empty About rows once the profile loads
    setTimeout(socialhubHideEmptyAboutRows, 1500);

    setTimeout(socialhubHideEmptyAboutRows, 4000);

    // Hide empty side cards (Education / Interests)
    setTimeout(socialhubTrimSideCards, 1800);

    setTimeout(socialhubTrimSideCards, 4500);

    socialhubLoadMyStats();

    socialhubLoadMyPhotos();

    socialhubLoadMyFriends();

    socialhubLoadMyVideos();

    socialhubLoadMyPosts();

    console.log(
        "✅ My Profile Page activated!"
    );
});
