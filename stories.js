// ======================================================
// SOCIALHUB - REAL STORIES (Instagram-style)
// ======================================================
//   1. Stories bar shows real stories from users
//      (last 24 hours). "Your story" is first.
//   2. "+" or "Your story" opens the story creator
//      (upload a photo or video + optional caption).
//   3. Clicking a user's story opens the full-screen
//      viewer: real media, progress bars, auto-advance
//      (4s images, video plays to the end), arrows/ESC.
//   4. New stories appear in real-time.
//   5. React to a story with emojis (👍 ❤️ 😂 😮 😢 😡) -
//      saved in story_views.reaction (Facebook style).
//
// Setup:
//   - Run setup-all.sql (section 8 creates the
//     stories table + bucket + policies).
//   - For story reactions run this once in the
//     Supabase SQL Editor:
//
//     alter table public.story_views
//       add column if not exists reaction text;
//
//   - Add this script to index.html and profile.html.
// ======================================================

var db = window.db || supabaseClient;


// ======================================================
// CUSTOM LOGO CONFIG
// ======================================================
// Ekhane nijer logo image URL ta diye din.
// URL khali thakle default SocialHub "SH" mark use hobe.
// Logo use hobe: story viewer head, "Your story" ring
// ar story media r watermark hishebe.
// ======================================================

const SOCIALHUB_STORY_LOGO_URL = "";


function socialhubStoryLogoHTML(size = "") {

    const style =
        size
            ? `width:${size}px;height:${size}px;`
            : "";

    if (SOCIALHUB_STORY_LOGO_URL) {

        return `
            <div
                class="socialhub-story-logo"
                style="${style}"
            >
                <img
                    src="${socialhubEscape(SOCIALHUB_STORY_LOGO_URL)}"
                    alt="SocialHub"
                >
            </div>
        `;
    }

    return `
        <div
            class="socialhub-story-logo"
            style="${style}"
        >
            SH
        </div>
    `;
}


// ======================================================
// INJECTED STYLES (logo)
// ======================================================

(function socialhubStoriesInjectLogoStyles() {

    const style =
        document.createElement("style");

    style.textContent = `

/* ---------- STORY CREATOR MODAL ---------- */

.socialhub-story-creator {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.65);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    z-index: 10001;
}

.socialhub-story-creator-box {
    width: 100%;
    max-width: 440px;
    background: var(--card-bg, #ffffff);
    border-radius: 16px;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
    overflow: hidden;
    animation: socialhubCreatorPop 0.2s ease;
}

@keyframes socialhubCreatorPop {
    from {
        transform: scale(0.94);
        opacity: 0;
    }
    to {
        transform: scale(1);
        opacity: 1;
    }
}

.socialhub-story-creator-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid rgba(128, 128, 128, 0.18);
}

.socialhub-story-creator-head h3 {
    margin: 0;
    font-size: 18px;
}

.socialhub-story-creator-close {
    width: 34px;
    height: 34px;
    border: none;
    border-radius: 50%;
    background: rgba(128, 128, 128, 0.15);
    cursor: pointer;
    font-size: 15px;
    color: inherit;
}

.socialhub-story-creator-body {
    padding: 20px;
}

.socialhub-story-creator-actions {
    display: flex;
    gap: 10px;
    margin-bottom: 14px;
}

.socialhub-story-creator-actions button {
    flex: 1;
    padding: 12px;
    border: 2px dashed rgba(128, 128, 128, 0.4);
    border-radius: 12px;
    background: transparent;
    font-family: inherit;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    color: inherit;
    transition: 0.2s;
}

.socialhub-story-creator-actions button:hover {
    border-color: #1877f2;
    color: #1877f2;
}

.socialhub-story-creator-preview {
    margin-bottom: 14px;
    border-radius: 12px;
    overflow: hidden;
    background: #000;
    max-height: 320px;
    display: none;
}

.socialhub-story-creator-preview img,
.socialhub-story-creator-preview video {
    width: 100%;
    max-height: 320px;
    object-fit: cover;
    display: block;
    background: #000;
}

.socialhub-story-creator-body input[type="text"] {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid rgba(128, 128, 128, 0.25);
    border-radius: 10px;
    padding: 11px 14px;
    font-size: 14px;
    font-family: inherit;
    outline: none;
    background: rgba(128, 128, 128, 0.08);
    margin-bottom: 14px;
    color: inherit;
}

.socialhub-story-creator-body .socialhub-story-share {
    width: 100%;
    border: none;
    border-radius: 10px;
    padding: 12px;
    background: linear-gradient(135deg, #1877f2, #8b5cf6);
    color: #fff;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
}

.socialhub-story-creator-body .socialhub-story-share:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

body.dark-mode .socialhub-story-creator-box {
    background: #242526;
    border: 1px solid #3a3b3c;
}

/* ---------- STORY MEDIA (viewer) ---------- */

.socialhub-story-media {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
    background: #000;
}

.socialhub-story-logo {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: linear-gradient(135deg, #f09433, #dc2743, #667eea);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-weight: 800;
    font-size: 22px;
    overflow: hidden;
}

.socialhub-story-logo img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.socialhub-story-head-logo {
    width: 30px;
    height: 30px;
    flex-shrink: 0;
    margin-left: 6px;
    filter: drop-shadow(0 2px 5px rgba(0,0,0,0.35));
}

.socialhub-story-head-logo .socialhub-story-logo {
    font-size: 13px;
    border: 2px solid rgba(255,255,255,0.5);
}

.socialhub-story-watermark {
    position: absolute;
    right: 14px;
    bottom: 74px;
    width: 40px;
    height: 40px;
    z-index: 6;
    pointer-events: none;
    opacity: 0.9;
    border-radius: 50%;
    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
}

.socialhub-story-watermark .socialhub-story-logo {
    font-size: 16px;
    border: 2px solid rgba(255,255,255,0.45);
}
`;

    document.head.appendChild(style);
})();


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
            >
        `;
    }

    return "👤";
}


function socialhubStoryTime(dateString) {

    const diff =
        Date.now() - new Date(dateString).getTime();

    const minutes =
        Math.floor(diff / 60000);

    if (minutes < 60) {

        return `${Math.max(1, minutes)}m ago`;
    }

    const hours =
        Math.floor(minutes / 60);

    if (hours < 24) {

        return `${hours}h ago`;
    }

    return new Date(dateString).toLocaleDateString([], {
        month: "short",
        day: "numeric"
    });
}


// ======================================================
// 1. STORIES BAR
// ======================================================

async function socialhubLoadStories() {

    const feed =
        document.querySelector(".feed");

    if (!feed) {
        return;
    }

    const me =
        await socialhubGetMe();

    if (!me) {
        return;
    }

    const {
        data: stories,
        error
    } = await db
        .from("stories")
        .select("id, user_id, media_url, media_type, caption, created_at")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });

    if (error) {
        return;
    }

    // Group by user, keep the newest story per user
    const byUser =
        new Map();

    (stories || []).forEach(story => {

        if (!byUser.has(story.user_id)) {

            byUser.set(story.user_id, story);
        }
    });

    const userIds =
        [...byUser.keys()];

    let profileMap = new Map();

    if (userIds.length > 0) {

        const {
            data: profiles
        } = await db
            .from("profiles")
            .select("id, full_name, username, avatar_url")
            .in("id", userIds);

        (profiles || []).forEach(profile => {

            profileMap.set(profile.id, profile);
        });
    }

    // Build the bar
    const oldBar =
        document.querySelector(".socialhub-stories");

    if (oldBar) {
        oldBar.remove();
    }

    // My viewed stories (for seen rings)
    let mySeen =
        new Set();

    {
        const {
            data: myViews
        } = await db
            .from("story_views")
            .select("story_id")
            .eq("user_id", me.id);

        mySeen =
            new Set((myViews || []).map(view => view.story_id));
    }

    const bar =
        document.createElement("div");

    bar.className = "socialhub-stories";

    bar.dataset.socialhubStories = "1";

    const myStory =
        byUser.get(me.id);

    const storyUsers =
        [...byUser.entries()]
            .filter(([userId]) => userId !== me.id)
            .sort((a, b) => {
                const profileA =
                    profileMap.get(a[0])?.full_name || "";
                const profileB =
                    profileMap.get(b[0])?.full_name || "";
                return profileA.localeCompare(profileB);
            });

    // My story / add
    const myItem =
        document.createElement("div");

    myItem.className = "socialhub-story";

    if (myStory && mySeen.has(myStory.id)) {

        myItem.classList.add("seen");
    }

    myItem.innerHTML = `

        <div class="socialhub-story-ring">

            <div class="socialhub-story-avatar">
                ${socialhubStoryLogoHTML()}
            </div>

            <div class="socialhub-story-add">+</div>

        </div>

        <span class="socialhub-story-name">
            ${myStory ? "Your story" : "Add story"}
        </span>
    `;

    myItem.addEventListener("click", () => {

        if (myStory) {

            socialhubOpenStoryViewer(
                byUser.get(me.id),
                [myStory],
                profileMap
            );

        } else {

            socialhubOpenStoryCreator();
        }
    });

    // Gradient card background for "my story"
    const myRing =
        myItem.querySelector(".socialhub-story-ring");

    if (myRing) {

        myRing.style.backgroundImage =
            "linear-gradient(135deg, #8ab4f8, #a78bfa)";
    }

    bar.appendChild(myItem);

    // Other users' stories
    storyUsers.forEach(([userId, story]) => {

        const profile =
            profileMap.get(userId);

        const item =
            document.createElement("div");

        item.className = "socialhub-story";

        if (mySeen.has(story.id)) {

            item.classList.add("seen");
        }

        item.innerHTML = `

            <div class="socialhub-story-ring">

                <div class="socialhub-story-avatar">
                    ${socialhubAvatarHTML(profile)}
                </div>

            </div>

            <span class="socialhub-story-name">
                ${socialhubEscape(profile?.full_name || "User")}
            </span>
        `;

        item.addEventListener("click", () => {

            socialhubOpenStoryViewer(
                story,
                byUser.get(userId) ? [story] : [],
                profileMap
            );
        });

        // Portrait card background = user's avatar photo
        const ring =
            item.querySelector(".socialhub-story-ring");

        if (ring) {

            if (profile?.avatar_url) {

                ring.style.backgroundImage =
                    `linear-gradient(` +
                    `180deg, rgba(255,255,255,0.10), ` +
                    `rgba(0,0,0,0.30)), ` +
                    `url("${profile.avatar_url}")`;

            } else {

                ring.style.backgroundImage =
                    "linear-gradient(135deg, #8ab4f8, #a78bfa)";
            }
        }

        bar.appendChild(item);
    });

    if (storyUsers.length === 0 && !myStory) {

        const hint =
            document.createElement("div");

        hint.className = "socialhub-story";

        hint.innerHTML = `

            <div class="socialhub-story-ring">

                <div class="socialhub-story-avatar">
                    📸
                </div>

            </div>

            <span class="socialhub-story-name">
                Be the first!
            </span>
        `;

        bar.appendChild(hint);
    }

    feed.insertBefore(bar, feed.firstChild);
}


// ======================================================
// 2. STORY CREATOR MODAL
// ======================================================

async function socialhubOpenStoryCreator() {

    const existing =
        document.querySelector(".socialhub-story-creator");

    if (existing) {
        existing.remove();
    }

    const me =
        await socialhubGetMe();

    if (!me) {

        alert("Please login first.");

        return;
    }

    const modal =
        document.createElement("div");

    modal.className = "socialhub-story-creator";

    modal.innerHTML = `

        <div class="socialhub-story-creator-box">

            <div class="socialhub-story-creator-head">

                <h3>Create a Story</h3>

                <button
                    type="button"
                    class="socialhub-story-creator-close"
                >
                    ✕
                </button>

            </div>

            <div class="socialhub-story-creator-body">

                <div class="socialhub-story-creator-actions">

                    <button
                        type="button"
                        class="socialhub-story-pick-photo"
                    >
                        📷 Photo
                    </button>

                    <button
                        type="button"
                        class="socialhub-story-pick-video"
                    >
                        🎥 Video
                    </button>

                </div>

                <div class="socialhub-story-creator-preview"></div>

                <input
                    type="text"
                    class="socialhub-story-caption"
                    placeholder="Add a caption... (optional)"
                    maxlength="120"
                >

                <button
                    type="button"
                    class="primary-btn socialhub-story-share"
                >
                    Share Story
                </button>

            </div>

        </div>
    `;

    document.body.appendChild(modal);

    let pendingFile = null;

    const preview =
        modal.querySelector(".socialhub-story-creator-preview");

    const shareButton =
        modal.querySelector(".socialhub-story-share");

    const captionInput =
        modal.querySelector(".socialhub-story-caption");

    const fileInput =
        document.createElement("input");

    fileInput.type = "file";
    fileInput.accept = "image/*,video/*";
    fileInput.style.display = "none";

    document.body.appendChild(fileInput);

    modal
        .querySelector(".socialhub-story-creator-close")
        .addEventListener("click", () => {
            modal.remove();
        });

    modal.addEventListener("click", event => {

        if (event.target === modal) {
            modal.remove();
        }
    });

    modal
        .querySelector(".socialhub-story-pick-photo")
        .addEventListener("click", () => {
            fileInput.accept = "image/*";
            fileInput.click();
        });

    modal
        .querySelector(".socialhub-story-pick-video")
        .addEventListener("click", () => {
            fileInput.accept = "video/*";
            fileInput.click();
        });

    fileInput.addEventListener("change", () => {

        const file =
            fileInput.files[0];

        if (!file) {
            return;
        }

        if (
            !file.type.startsWith("image/") &&
            !file.type.startsWith("video/")
        ) {

            alert("Please choose a photo or video.");

            return;
        }

        if (file.size > 100 * 1024 * 1024) {

            alert(
                "File is too big. Maximum size is 100MB."
            );

            return;
        }

        pendingFile = file;

        const isVideo =
            file.type.startsWith("video/");

        preview.innerHTML = "";

        preview.style.display = "block";

        if (isVideo) {

            const video =
                document.createElement("video");

            video.src =
                URL.createObjectURL(file);

            video.muted = true;

            video.controls = true;

            preview.appendChild(video);

        } else {

            const img =
                document.createElement("img");

            img.src =
                URL.createObjectURL(file);

            preview.appendChild(img);
        }
    });

    shareButton.addEventListener("click", async () => {

        if (!pendingFile) {

            alert("Please pick a photo or video first.");

            return;
        }

        const isVideo =
            pendingFile.type.startsWith("video/");

        const ext =
            pendingFile.name
                .split(".")
                .pop()
                ?.toLowerCase() || (isVideo ? "mp4" : "jpg");

        const path =
            `${me.id}-${Date.now()}.${ext}`;

        shareButton.disabled = true;

        shareButton.innerText = "Uploading...";

        try {

            const {
                error: uploadError
            } = await db
                .storage
                .from("stories")
                .upload(path, pendingFile, {
                    upsert: true,
                    contentType: pendingFile.type
                });

            if (uploadError) {
                throw uploadError;
            }

            const {
                data: urlData
            } = db
                .storage
                .from("stories")
                .getPublicUrl(path);

            const {
                error: insertError
            } = await db
                .from("stories")
                .insert({
                    user_id: me.id,
                    media_url: urlData.publicUrl,
                    media_type: isVideo ? "video" : "image",
                    caption: captionInput.value.trim() || null
                });

            if (insertError) {
                throw insertError;
            }

            modal.remove();

            alert("Story shared! 🎉");

            socialhubLoadStories();

        } catch (error) {

            console.error(
                "❌ Story create error:",
                error
            );

            alert(
                "Could not create story.\n\n" +
                error.message
            );

            shareButton.disabled = false;

            shareButton.innerText = "Share Story";
        }
    });
}


// ======================================================
// 3. STORY VIEWER (full-screen, real media)
// ======================================================

// ======================================================
// 7. STORY REACTIONS (Facebook style)
// ======================================================

async function socialhubStoryReact(
    overlay,
    story,
    me,
    reaction
) {

    if (!me || !story) {
        return;
    }

    const {
        error
    } = await db
        .from("story_views")
        .upsert(
            {
                story_id: story.id,
                user_id: me.id,
                reaction: reaction
            },
            { onConflict: "story_id,user_id" }
        );

    if (error) {

        console.error(
            "❌ Story reaction error:",
            error
        );

        return;
    }

    overlay
        .querySelectorAll(".socialhub-story-react-btn")
        .forEach(btn => btn.classList.remove("active"));

    const button =
        overlay.querySelector(
            `.socialhub-story-react-btn[data-story-reaction="${reaction}"]`
        );

    if (button) {

        button.classList.add("active");
    }

    const emoji =
        button
            ? button.textContent.trim()
            : "❤️";

    // Flying emoji animation over the story
    const fly =
        document.createElement("span");

    fly.className = "socialhub-story-fly";

    fly.textContent = emoji;

    overlay
        .querySelector(".socialhub-story-stage")
        .appendChild(fly);

    setTimeout(() => fly.remove(), 1000);
}


async function socialhubOpenStoryViewer(
    profile,
    stories,
    profileMap
) {

    if (!stories || stories.length === 0) {
        return;
    }

    const me =
        await socialhubGetMe();

    let index = 0;

    let timer = null;

    let currentVideo = null;

    let storyStartTime = 0;

    let paused = false;

    const overlay =
        document.createElement("div");

    overlay.className = "socialhub-story-viewer";

    overlay.innerHTML = `

        <div class="socialhub-story-stage">

            <div class="socialhub-story-progress"></div>

            <div class="socialhub-story-head">

                <div class="socialhub-story-ring">
                    <div class="socialhub-story-avatar"></div>
                </div>

                <div class="socialhub-story-head-info">
                    <strong></strong>
                    <small></small>
                </div>

                <button
                    type="button"
                    class="socialhub-story-close"
                >
                    ✕
                </button>

                <div class="socialhub-story-head-logo"></div>

            </div>

            <div class="socialhub-story-content">

                <div class="socialhub-story-media"></div>

                <p class="socialhub-story-caption-text"></p>

            </div>

            <div class="socialhub-story-react">

                <button
                    type="button"
                    class="socialhub-story-react-btn"
                    data-story-reaction="like"
                    title="Like"
                >
                    👍
                </button>

                <button
                    type="button"
                    class="socialhub-story-react-btn"
                    data-story-reaction="love"
                    title="Love"
                >
                    ❤️
                </button>

                <button
                    type="button"
                    class="socialhub-story-react-btn"
                    data-story-reaction="haha"
                    title="Haha"
                >
                    😂
                </button>

                <button
                    type="button"
                    class="socialhub-story-react-btn"
                    data-story-reaction="wow"
                    title="Wow"
                >
                    😮
                </button>

                <button
                    type="button"
                    class="socialhub-story-react-btn"
                    data-story-reaction="sad"
                    title="Sad"
                >
                    😢
                </button>

                <button
                    type="button"
                    class="socialhub-story-react-btn"
                    data-story-reaction="angry"
                    title="Angry"
                >
                    😡
                </button>

            </div>

            <div class="socialhub-story-zone prev"></div>
            <div class="socialhub-story-zone next"></div>

        </div>
    `;

    document.body.appendChild(overlay);

    // ---------- STORY REACTIONS (Facebook style) ----------

    overlay
        .querySelector(".socialhub-story-react")
        .addEventListener("click", event => {

            const button =
                event.target.closest("[data-story-reaction]");

            if (!button) {
                return;
            }

            socialhubStoryReact(
                overlay,
                stories[index],
                me,
                button.dataset.storyReaction
            );
        });

    const progress =
        overlay.querySelector(".socialhub-story-progress");

    const headAvatar =
        overlay.querySelector(
            ".socialhub-story-head .socialhub-story-avatar"
        );

    const headName =
        overlay.querySelector(
            ".socialhub-story-head-info strong"
        );

    const headTime =
        overlay.querySelector(
            ".socialhub-story-head-info small"
        );

    const mediaBox =
        overlay.querySelector(".socialhub-story-media");

    const captionText =
        overlay.querySelector(".socialhub-story-caption-text");

    const content =
        overlay.querySelector(".socialhub-story-content");

    const headLogo =
        overlay.querySelector(".socialhub-story-head-logo");

    headLogo.innerHTML =
        socialhubStoryLogoHTML();

    const render = () => {

        const story =
            stories[index];

        clearTimeout(timer);

        storyStartTime =
            Date.now();

        if (currentVideo) {

            currentVideo.pause();

            currentVideo.removeAttribute("src");

            currentVideo = null;
        }

        // Progress segments
        progress.innerHTML = "";

        stories.forEach((_, i) => {

            const segment =
                document.createElement("div");

            segment.className = "socialhub-story-seg";

            if (i === index) {

                segment.classList.add("fill");

                segment.innerHTML =
                    '<div class="socialhub-story-seg-inner"></div>';
            }

            progress.appendChild(segment);
        });

        // Head
        headAvatar.innerHTML =
            socialhubAvatarHTML(profile);

        headName.innerText =
            profile?.full_name || "User";

        headTime.innerText =
            `${socialhubStoryTime(story.created_at)} · 🌎`;

        // Record my view + show the view count
        if (me) {

            db
                .from("story_views")
                .upsert(
                    {
                        story_id: story.id,
                        user_id: me.id
                    },
                    { onConflict: "story_id,user_id" }
                )
                .then(() => {});

            db
                .from("story_views")
                .select("id", {
                    count: "exact",
                    head: true
                })
                .eq("story_id", story.id)
                .then(({ count }) => {

                    headTime.innerText =
                        `${socialhubStoryTime(story.created_at)} · 👁 ${count || 0}`;
                });
        }

        // My reaction on this story (Facebook style)
        overlay
            .querySelectorAll(".socialhub-story-react-btn")
            .forEach(btn => btn.classList.remove("active"));

        if (me) {

            db
                .from("story_views")
                .select("reaction")
                .eq("story_id", story.id)
                .eq("user_id", me.id)
                .maybeSingle()
                .then(({ data }) => {

                    if (data && data.reaction) {

                        const active =
                            overlay.querySelector(
                                `.socialhub-story-react-btn[data-story-reaction="${data.reaction}"]`
                            );

                        if (active) {

                            active.classList.add("active");
                        }
                    }
                });
        }

        // Media
        mediaBox.innerHTML = "";

        captionText.innerText =
            story.caption || "";

        captionText.style.display =
            story.caption ? "block" : "none";

        const media =
            document.createElement(
                story.media_type === "video"
                    ? "video"
                    : "img"
            );

        if (story.media_type === "video") {

            media.src = story.media_url;

            media.controls = false;

            media.muted = false;

            media.playsInline = true;

            currentVideo = media;

            media.addEventListener("loadedmetadata", () => {

                const duration =
                    (media.duration || 5) * 1000;

                const inner =
                    progress.querySelector(
                        ".socialhub-story-seg-inner"
                    );

                if (inner) {

                    inner.style.animation =
                        `socialhubStoryProgress ${duration}ms linear forwards`;
                }

                media.play().catch(() => {});
            });

            media.addEventListener("ended", () => {

                if (index < stories.length - 1) {

                    index++;

                    render();

                } else {

                    close();
                }
            });

        } else {

            media.src = story.media_url;

            timer = setTimeout(() => {

                if (index < stories.length - 1) {

                    index++;

                    render();

                } else {

                    close();
                }

            }, 4000);
        }

        mediaBox.appendChild(media);

        // Watermark logo on the media
        content
            .querySelector(".socialhub-story-watermark")
            ?.remove();

        const watermark =
            document.createElement("div");

        watermark.className = "socialhub-story-watermark";

        watermark.innerHTML =
            socialhubStoryLogoHTML();

        content.appendChild(watermark);
    };

    const close = () => {

        clearTimeout(timer);

        if (currentVideo) {

            currentVideo.pause();
        }

        overlay.remove();

        document.removeEventListener(
            "keydown",
            onKey
        );

        // Refresh the stories bar (seen rings)
        socialhubLoadStories();
    };

    // ---------- HOLD TO PAUSE ----------

    const stage =
        overlay.querySelector(".socialhub-story-stage");

    const pauseStory = () => {

        paused = true;

        clearTimeout(timer);

        if (currentVideo && !currentVideo.paused) {

            currentVideo.pause();
        }

        const inner =
            progress.querySelector(".socialhub-story-seg-inner");

        if (inner) {

            inner.style.animationPlayState = "paused";
        }
    };

    const resumeStory = () => {

        if (!paused) {
            return;
        }

        paused = false;

        const inner =
            progress.querySelector(".socialhub-story-seg-inner");

        if (inner) {

            inner.style.animationPlayState = "running";
        }

        if (currentVideo && currentVideo.paused) {

            currentVideo.play().catch(() => {});

            return;
        }

        const elapsed =
            Date.now() - storyStartTime;

        const remaining =
            Math.max(600, 4000 - elapsed);

        timer = setTimeout(() => {

            if (index < stories.length - 1) {

                index++;

                render();

            } else {

                close();
            }

        }, remaining);
    };

    stage.addEventListener("pointerdown", pauseStory);
    stage.addEventListener("pointerup", resumeStory);
    stage.addEventListener("pointercancel", resumeStory);
    stage.addEventListener("pointerleave", resumeStory);

    const onKey = event => {

        if (event.key === "Escape") {

            close();

        } else if (event.key === "ArrowRight") {

            if (index < stories.length - 1) {

                index++;

                render();
            }

        } else if (event.key === "ArrowLeft") {

            if (index > 0) {

                index--;

                render();
            }
        }
    };

    document.addEventListener("keydown", onKey);

    overlay
        .querySelector(".socialhub-story-close")
        .addEventListener("click", close);

    overlay
        .querySelector(".socialhub-story-zone.next")
        .addEventListener("click", () => {

            if (index < stories.length - 1) {

                index++;

                render();

            } else {

                close();
            }
        });

    overlay
        .querySelector(".socialhub-story-zone.prev")
        .addEventListener("click", () => {

            if (index > 0) {

                index--;

                render();
            }
        });

    render();
}


// ======================================================
// 4. REAL-TIME STORY UPDATES
// ======================================================

function socialhubSetupStoryRealtime() {

    const channel =
        db.channel("socialhub-stories-live");

    channel
        .on(
            "postgres_changes",
            {
                event: "INSERT",
                schema: "public",
                table: "stories"
            },
            () => {

                socialhubLoadStories();
            }
        )
        .subscribe();
}


// ======================================================
// 5. AUTO-SYNC
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

    socialhubLoadStories();

    // "Add Story" buttons anywhere
    document
        .querySelectorAll("button")
        .forEach(button => {

            if (
                button.textContent.includes("Add Story") &&
                !button.dataset.socialhubStoryReady
            ) {

                button.dataset.socialhubStoryReady = "1";

                button.addEventListener(
                    "click",
                    socialhubOpenStoryCreator
                );
            }
        });

    socialhubGetMe().then(me => {

        if (me) {

            socialhubSetupStoryRealtime();
        }
    });

    console.log(
        "✅ Stories activated!"
    );
});
