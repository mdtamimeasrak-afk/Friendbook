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


// ======================================================
// 2. STORY CREATOR MODAL (Instagram-style: photo/video/
//    text, drawing, emoji stickers, caption, share)
// ======================================================

let socialhubStoryCSSAdded = false;

function socialhubAddStoryCSS() {

    if (socialhubStoryCSSAdded) {
        return;
    }

    socialhubStoryCSSAdded = true;

    const style = document.createElement("style");

    style.textContent = `

.socialhub-story-creator {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.88);
    z-index: 20000;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: Arial, Helvetica, sans-serif;
}

.socialhub-sc-box {
    width: min(100vw, 420px);
    height: 100vh;
    max-height: 100vh;
    display: flex;
    flex-direction: column;
    background: #000;
    color: #fff;
    position: relative;
    overflow: hidden;
}

.socialhub-sc-start {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 18px;
    padding: 24px;
}

.socialhub-sc-start h2 {
    font-size: 22px;
    margin: 0 0 8px;
    color: #fff;
}

.socialhub-sc-start p {
    color: rgba(255, 255, 255, 0.7);
    font-size: 13px;
    margin: 0;
}

.socialhub-sc-startbtn {
    width: 100%;
    max-width: 300px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    background: rgba(255, 255, 255, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.25);
    color: #fff;
    font-size: 16px;
    font-weight: 700;
    padding: 16px;
    border-radius: 14px;
    cursor: pointer;
    transition: background 0.2s;
}

.socialhub-sc-startbtn:hover {
    background: rgba(255, 255, 255, 0.22);
}

.socialhub-sc-close {
    position: absolute;
    top: 10px;
    right: 12px;
    background: rgba(255, 255, 255, 0.15);
    border: none;
    color: #fff;
    width: 38px;
    height: 38px;
    border-radius: 50%;
    font-size: 16px;
    cursor: pointer;
    z-index: 5;
}

.socialhub-sc-back {
    position: absolute;
    top: 10px;
    left: 12px;
    background: rgba(255, 255, 255, 0.15);
    border: none;
    color: #fff;
    width: 38px;
    height: 38px;
    border-radius: 50%;
    font-size: 16px;
    cursor: pointer;
    z-index: 5;
    display: none;
    align-items: center;
    justify-content: center;
}

.socialhub-sc-editor {
    flex: 1;
    display: none;
    flex-direction: column;
    min-height: 0;
    position: relative;
}

.socialhub-sc-canvaswrap {
    flex: 1;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    background: #000;
    padding: 0;
}

.socialhub-sc-canvas {
    width: auto;
    height: auto;
    max-width: 100%;
    max-height: 100%;
    touch-action: none;
    cursor: crosshair;
    border-radius: 2px;
}

.socialhub-sc-tools {
    position: absolute;
    right: 10px;
    top: 55px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    z-index: 4;
}

.socialhub-sc-toolbtn {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: none;
    background: rgba(30, 30, 30, 0.75);
    color: #fff;
    font-size: 19px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.15s, background 0.15s;
}

.socialhub-sc-toolbtn.active {
    background: #3897f0;
    transform: scale(1.08);
}

.socialhub-sc-toolbtn:hover {
    background: rgba(60, 60, 60, 0.9);
}

.socialhub-sc-toolbtn.active:hover {
    background: #3897f0;
}

.socialhub-sc-panel {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(20, 20, 20, 0.97);
    border-top: 1px solid rgba(255, 255, 255, 0.15);
    padding: 14px 16px;
    z-index: 6;
    display: none;
    gap: 10px;
    flex-direction: column;
}

.socialhub-sc-panel.show {
    display: flex;
}

.socialhub-sc-colorrow {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
}

.socialhub-sc-swatch {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    border: 2px solid transparent;
    cursor: pointer;
    flex: 0 0 auto;
}

.socialhub-sc-swatch.active {
    border-color: #fff;
}

.socialhub-sc-panel input[type="text"] {
    flex: 1;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.25);
    color: #fff;
    padding: 10px 12px;
    border-radius: 10px;
    font-size: 15px;
    outline: none;
}

.socialhub-sc-panel select {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.25);
    color: #fff;
    padding: 9px;
    border-radius: 10px;
    font-size: 14px;
}

.socialhub-sc-panel input[type="range"] {
    flex: 1;
    accent-color: #3897f0;
}

.socialhub-sc-panel .socialhub-sc-done {
    background: #3897f0;
    border: none;
    color: #fff;
    font-weight: 700;
    padding: 10px 18px;
    border-radius: 10px;
    cursor: pointer;
    font-size: 14px;
}

.socialhub-sc-emojirow {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    max-height: 150px;
    overflow-y: auto;
}

.socialhub-sc-emojirow button {
    width: 40px;
    height: 40px;
    font-size: 24px;
    background: none;
    border: none;
    cursor: pointer;
    border-radius: 8px;
}

.socialhub-sc-emojirow button:hover {
    background: rgba(255, 255, 255, 0.15);
}

.socialhub-sc-bottom {
    display: none;
    flex-direction: column;
    gap: 10px;
    padding: 10px 14px 16px;
    background: #000;
    border-top: 1px solid rgba(255, 255, 255, 0.12);
}

.socialhub-sc-caption {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #fff;
    padding: 10px 12px;
    border-radius: 10px;
    font-size: 14px;
    outline: none;
    width: 100%;
    box-sizing: border-box;
}

.socialhub-sc-share {
    background: linear-gradient(135deg, #405de6, #833ab4, #fd1d1d);
    border: none;
    color: #fff;
    font-size: 16px;
    font-weight: 800;
    padding: 13px;
    border-radius: 12px;
    cursor: pointer;
    width: 100%;
}

.socialhub-sc-share:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.socialhub-sc-selected-box {
    position: absolute;
    border: 2px dashed rgba(255, 255, 255, 0.9);
    pointer-events: none;
    display: none;
    z-index: 3;
}

`;

    document.head.appendChild(style);
}

const SOCIALHUB_STORY_BGS = [
    "linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)",
    "linear-gradient(135deg, #405de6, #5851db, #833ab4)",
    "linear-gradient(135deg, #00c6ff, #0072ff)",
    "linear-gradient(135deg, #f7971e, #ffd200)",
    "linear-gradient(135deg, #11998e, #38ef7d)",
    "linear-gradient(135deg, #fc466b, #3f5efb)",
    "linear-gradient(135deg, #000000, #434343)",
    "linear-gradient(135deg, #ffffff, #e6e6e6)"
];

const SOCIALHUB_STORY_COLORS = [
    "#ffffff", "#000000", "#ff3040", "#3b82f6",
    "#22c55e", "#facc15", "#f97316", "#e879f9"
];

const SOCIALHUB_STORY_FONTS = [
    ["Arial", "Arial, Helvetica, sans-serif"],
    ["Georgia", "Georgia, serif"],
    ["Courier", "'Courier New', monospace"],
    ["Impact", "Impact, sans-serif"],
    ["Comic", "'Comic Sans MS', cursive"],
    ["Brush", "'Brush Script MT', cursive"]
];

const SOCIALHUB_STORY_EMOJIS = [
    "😀", "😂", "😍", "😎", "🥳", "😢",
    "😡", "🤩", "😴", "🤔", "👍", "👏",
    "🙏", "💪", "🔥", "❤️", "💯", "🎉",
    "✨", "⭐", "🎵", "🌹", "🐱", "🌈"
];

async function socialhubOpenStoryCreator() {

    socialhubAddStoryCSS();

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
        <div class="socialhub-sc-box">

            <button type="button" class="socialhub-sc-close">✕</button>

            <div class="socialhub-sc-start">

                <h2>Create a Story</h2>

                <p>Choose a photo or video, or create a text story</p>

                <button type="button" class="socialhub-sc-startbtn socialhub-sc-pick-photo">
                    📷 Photo
                </button>

                <button type="button" class="socialhub-sc-startbtn socialhub-sc-pick-video">
                    🎥 Video
                </button>

                <button type="button" class="socialhub-sc-startbtn socialhub-sc-pick-text">
                    🎨 Create text story
                </button>

            </div>

            <div class="socialhub-sc-editor">

                <button type="button" class="socialhub-sc-back">←</button>

                <div class="socialhub-sc-canvaswrap">

                    <canvas
                        class="socialhub-sc-canvas"
                        width="1080"
                        height="1920"
                    ></canvas>

                    <div class="socialhub-sc-selected-box"></div>

                </div>

                <div class="socialhub-sc-tools">

                    <button type="button" class="socialhub-sc-toolbtn socialhub-sc-tool-text" title="Add text">T</button>
                    <button type="button" class="socialhub-sc-toolbtn socialhub-sc-tool-draw" title="Draw">✏️</button>
                    <button type="button" class="socialhub-sc-toolbtn socialhub-sc-tool-sticker" title="Emoji sticker">😊</button>
                    <button type="button" class="socialhub-sc-toolbtn socialhub-sc-tool-bg" title="Background color">🎨</button>
                    <button type="button" class="socialhub-sc-toolbtn socialhub-sc-tool-undo" title="Undo">↩️</button>
                    <button type="button" class="socialhub-sc-toolbtn socialhub-sc-tool-delete" title="Delete selected">🗑️</button>

                </div>

                <div class="socialhub-sc-panel socialhub-sc-panel-text">
                    <div class="socialhub-sc-colorrow">
                        <input type="text" class="socialhub-sc-text-input" placeholder="Type text..." maxlength="80">
                        <select class="socialhub-sc-font-select"></select>
                        <input type="range" class="socialhub-sc-size-range" min="30" max="160" value="72">
                    </div>
                    <div class="socialhub-sc-colorrow socialhub-sc-text-colors"></div>
                    <div class="socialhub-sc-colorrow">
                        <button type="button" class="socialhub-sc-done">Add text</button>
                    </div>
                </div>

                <div class="socialhub-sc-panel socialhub-sc-panel-draw">
                    <div class="socialhub-sc-colorrow socialhub-sc-draw-colors"></div>
                    <div class="socialhub-sc-colorrow">
                        <span>Size</span>
                        <input type="range" class="socialhub-sc-draw-size" min="4" max="80" value="18">
                        <button type="button" class="socialhub-sc-done">Done</button>
                    </div>
                </div>

                <div class="socialhub-sc-panel socialhub-sc-panel-sticker">
                    <div class="socialhub-sc-emojirow"></div>
                    <button type="button" class="socialhub-sc-done">Done</button>
                </div>

                <div class="socialhub-sc-panel socialhub-sc-panel-bg">
                    <div class="socialhub-sc-colorrow socialhub-sc-bg-swatches"></div>
                    <button type="button" class="socialhub-sc-done">Done</button>
                </div>

            </div>

            <div class="socialhub-sc-bottom">

                <input
                    type="text"
                    class="socialhub-sc-caption"
                    placeholder="Add caption..."
                    maxlength="120"
                >

                <button type="button" class="socialhub-sc-share">
                    Share Story
                </button>

            </div>

        </div>
    `;

    document.body.appendChild(modal);

    // ---------------- STATE ----------------

    const W = 1080;
    const H = 1920;

    const canvas =
        modal.querySelector(".socialhub-sc-canvas");

    const ctx = canvas.getContext("2d");

    const state = {
        image: null,
        isVideo: false,
        videoFile: null,
        bg: SOCIALHUB_STORY_BGS[0],
        elements: [],
        tool: null,
        textColor: "#ffffff",
        textSize: 72,
        font: SOCIALHUB_STORY_FONTS[0][1],
        drawColor: "#ff3040",
        drawSize: 18,
        selected: null,
        dragTarget: null,
        dragOffset: { x: 0, y: 0 },
        strokePoints: null
    };

    // ---------------- HELPERS ----------------

    function fitCanvas(target) {

        const wrap =
            modal.querySelector(".socialhub-sc-canvaswrap");

        const wrapRect =
            wrap.getBoundingClientRect();

        const maxW =
            wrapRect.width - 2;

        const maxH =
            wrapRect.height - 2;

        let w = maxW;
        let h = w * (16 / 9);

        if (h > maxH) {

            h = maxH;
            w = h * (9 / 16);
        }

        target.style.width = Math.round(w) + "px";
        target.style.height = Math.round(h) + "px";
    }

    window.addEventListener("resize", () => {

        if (modal.isConnected) {
            fitCanvas(canvas);
        }
    });

    function canvasPos(clientX, clientY) {

        const rect =
            canvas.getBoundingClientRect();

        const x =
            (clientX - rect.left) * (W / rect.width);

        const y =
            (clientY - rect.top) * (H / rect.height);

        return {
            x: Math.round(x),
            y: Math.round(y)
        };
    }

    function drawImageCover() {

        if (!state.image) {
            return;
        }

        const iw = state.image.width;
        const ih = state.image.height;

        const scale =
            Math.max(W / iw, H / ih);

        const dw = iw * scale;
        const dh = ih * scale;

        ctx.drawImage(
            state.image,
            (W - dw) / 2,
            (H - dh) / 2,
            dw,
            dh
        );
    }

    function elementBounds(el) {

        if (el.type === "stroke") {

            let minX = Infinity;
            let minY = Infinity;
            let maxX = -Infinity;
            let maxY = -Infinity;

            el.points.forEach(p => {

                minX = Math.min(minX, p.x);
                minY = Math.min(minY, p.y);
                maxX = Math.max(maxX, p.x);
                maxY = Math.max(maxY, p.y);
            });

            const pad = el.width / 2 + 10;

            return {
                x: minX - pad,
                y: minY - pad,
                w: maxX - minX + pad * 2,
                h: maxY - minY + pad * 2
            };
        }

        const size =
            el.type === "text"
                ? el.size
                : el.size;

        const w =
            el.type === "text"
                ? (() => {
                    ctx.font = `${el.size}px ${el.font}`;
                    return ctx.measureText(el.text).width + 40;
                })()
                : size * 1.4;

        return {
            x: el.x - 20,
            y: el.y - size - 10,
            w: Math.max(w, size * 1.4),
            h: size + 40
        };
    }

    function hitTest(clientX, clientY) {

        const pos =
            canvasPos(clientX, clientY);

        for (let i = state.elements.length - 1; i >= 0; i--) {

            const el =
                state.elements[i];

            const b =
                elementBounds(el);

            if (
                pos.x >= b.x &&
                pos.x <= b.x + b.w &&
                pos.y >= b.y &&
                pos.y <= b.y + b.h
            ) {
                return el;
            }
        }

        return null;
    }

    function redraw() {

        ctx.clearRect(0, 0, W, H);

        if (state.image) {

            drawImageCover();

        } else {

            ctx.fillStyle = state.bg;
            ctx.fillRect(0, 0, W, H);
        }

        state.elements.forEach(el => {

            if (el.type === "stroke") {

                ctx.strokeStyle = el.color;
                ctx.lineWidth = el.width;
                ctx.lineCap = "round";
                ctx.lineJoin = "round";

                ctx.beginPath();

                el.points.forEach((p, i) => {

                    if (i === 0) {
                        ctx.moveTo(p.x, p.y);
                    } else {
                        ctx.lineTo(p.x, p.y);
                    }
                });

                ctx.stroke();

            } else if (el.type === "sticker") {

                ctx.font = `${el.size}px Arial`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(el.emoji, el.x, el.y);

            } else if (el.type === "text") {

                ctx.font = `${el.size}px ${el.font}`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.strokeStyle = "rgba(0,0,0,0.55)";
                ctx.lineWidth = 6;
                ctx.strokeText(el.text, el.x, el.y);
                ctx.fillStyle = el.color;
                ctx.fillText(el.text, el.x, el.y);
            }
        });

        showSelectionBox();
    }

    function showSelectionBox() {

        const box =
            modal.querySelector(".socialhub-sc-selected-box");

        const canvasRect =
            canvas.getBoundingClientRect();

        if (
            !state.selected ||
            state.selected.type === "stroke"
        ) {

            box.style.display = "none";
            return;
        }

        const el = state.selected;
        const b = elementBounds(el);

        const scaleX = canvasRect.width / W;
        const scaleY = canvasRect.height / H;

        box.style.display = "block";
        box.style.left = (canvasRect.left + b.x * scaleX) + "px";
        box.style.top = (canvasRect.top + b.y * scaleY) + "px";
        box.style.width = (b.w * scaleX) + "px";
        box.style.height = (b.h * scaleY) + "px";
    }

    // ---------------- PANELS ----------------

    function hidePanels() {

        modal
            .querySelectorAll(".socialhub-sc-panel")
            .forEach(panel => panel.classList.remove("show"));
    }

    function showPanel(className) {

        hidePanels();

        const panel =
            modal.querySelector(className);

        if (panel) {
            panel.classList.add("show");
        }
    }

    function setTool(tool) {

        state.tool = tool;

        modal
            .querySelectorAll(".socialhub-sc-toolbtn")
            .forEach(btn => btn.classList.remove("active"));

        if (tool) {

            const btn =
                modal.querySelector(
                    `.socialhub-sc-tool-${tool}`
                );

            if (btn) {
                btn.classList.add("active");
            }
        }

        hidePanels();

        if (tool === "text") {

            showPanel(".socialhub-sc-panel-text");
            modal.querySelector(".socialhub-sc-text-input").focus();

        } else if (tool === "draw") {

            showPanel(".socialhub-sc-panel-draw");

        } else if (tool === "sticker") {

            showPanel(".socialhub-sc-panel-sticker");

        } else if (tool === "bg") {

            showPanel(".socialhub-sc-panel-bg");
        }
    }

    function openEditor() {

        modal
            .querySelector(".socialhub-sc-start")
            .style.display = "none";

        modal
            .querySelector(".socialhub-sc-editor")
            .style.display = "flex";

        modal
            .querySelector(".socialhub-sc-bottom")
            .style.display = "flex";

        modal
            .querySelector(".socialhub-sc-back")
            .style.display = "flex";

        fitCanvas(canvas);

        redraw();
    }

    function backToStart() {

        modal.querySelector(".socialhub-sc-start").style.display = "flex";

        modal.querySelector(".socialhub-sc-editor").style.display = "none";

        modal.querySelector(".socialhub-sc-bottom").style.display = "none";

        modal.querySelector(".socialhub-sc-back").style.display = "none";

        state.image = null;
        state.isVideo = false;
        state.videoFile = null;
        state.elements = [];
        state.selected = null;
        state.tool = null;

        hidePanels();

        modal
            .querySelectorAll(".socialhub-sc-toolbtn")
            .forEach(btn => btn.classList.remove("active"));

        const previewHint =
            modal.querySelector(".socialhub-sc-video-hint");

        if (previewHint) {
            previewHint.remove();
        }
    }

    // ---------------- UI SETUP ----------------

    const fontSelect =
        modal.querySelector(".socialhub-sc-font-select");

    SOCIALHUB_STORY_FONTS.forEach(([label, value]) => {

        const option =
            document.createElement("option");

        option.value = value;
        option.textContent = label;

        fontSelect.appendChild(option);
    });

    const textColors =
        modal.querySelector(".socialhub-sc-text-colors");

    const drawColors =
        modal.querySelector(".socialhub-sc-draw-colors");

    SOCIALHUB_STORY_COLORS.forEach(color => {

        const textSwatch =
            document.createElement("button");

        textSwatch.type = "button";
        textSwatch.className = "socialhub-sc-swatch";
        textSwatch.style.background = color;
        textSwatch.dataset.color = color;

        textSwatch.addEventListener("click", () => {

            state.textColor = color;

            textColors
                .querySelectorAll(".socialhub-sc-swatch")
                .forEach(s => s.classList.remove("active"));

            textSwatch.classList.add("active");
        });

        if (color === state.textColor) {
            textSwatch.classList.add("active");
        }

        textColors.appendChild(textSwatch);

        const drawSwatch =
            document.createElement("button");

        drawSwatch.type = "button";
        drawSwatch.className = "socialhub-sc-swatch";
        drawSwatch.style.background = color;
        drawSwatch.dataset.color = color;

        drawSwatch.addEventListener("click", () => {

            state.drawColor = color;

            drawColors
                .querySelectorAll(".socialhub-sc-swatch")
                .forEach(s => s.classList.remove("active"));

            drawSwatch.classList.add("active");
        });

        if (color === state.drawColor) {
            drawSwatch.classList.add("active");
        }

        drawColors.appendChild(drawSwatch);
    });

    const bgSwatches =
        modal.querySelector(".socialhub-sc-bg-swatches");

    SOCIALHUB_STORY_BGS.forEach((bg, index) => {

        const swatch =
            document.createElement("button");

        swatch.type = "button";
        swatch.className = "socialhub-sc-swatch";
        swatch.style.background = bg;
        swatch.dataset.bg = bg;

        swatch.addEventListener("click", () => {

            state.bg = bg;
            state.image = null;
            state.isVideo = false;
            state.videoFile = null;

            modal
                .querySelectorAll(".socialhub-sc-video-hint")
                .forEach(h => h.remove());

            bgSwatches
                .querySelectorAll(".socialhub-sc-swatch")
                .forEach(s => s.classList.remove("active"));

            swatch.classList.add("active");

            redraw();
        });

        if (index === 0) {
            swatch.classList.add("active");
        }

        bgSwatches.appendChild(swatch);
    });

    const emojiRow =
        modal.querySelector(".socialhub-sc-emojirow");

    SOCIALHUB_STORY_EMOJIS.forEach(emoji => {

        const btn =
            document.createElement("button");

        btn.type = "button";
        btn.textContent = emoji;

        btn.addEventListener("click", () => {

            state.elements.push({
                type: "sticker",
                emoji: emoji,
                x: W / 2,
                y: H / 2,
                size: 130,
                selected: false
            });

            state.selected = null;
            redraw();
        });

        emojiRow.appendChild(btn);
    });

    // ---------------- FILE PICKING ----------------

    const fileInput =
        document.createElement("input");

    fileInput.type = "file";
    fileInput.accept = "image/*,video/*";
    fileInput.style.display = "none";

    document.body.appendChild(fileInput);

    fileInput.addEventListener("change", async () => {

        const file =
            fileInput.files[0];

        fileInput.value = "";

        if (!file) {
            return;
        }

        if (file.size > 100 * 1024 * 1024) {

            alert(
                "File is too big. Maximum size is 100MB."
            );

            return;
        }

        const isVideo =
            file.type.startsWith("video/");

        if (
            !file.type.startsWith("image/") &&
            !isVideo
        ) {
            alert("Please choose a photo or video.");
            return;
        }

        if (!isVideo) {

            // Convert iPhone HEIC photos
            const converted =
                await socialhubHeicToJpeg(file);

            if (!converted) {
                return;
            }

            const img =
                new Image();

            img.onload = () => {

                state.image = img;
                state.isVideo = false;
                state.videoFile = null;
                state.elements = [];
                state.selected = null;
                openEditor();
            };

            img.onerror = () => {

                alert(
                    "Could not read this image.\n\n" +
                    "Please choose another photo."
                );
            };

            img.src =
                URL.createObjectURL(converted);
            state.imageFile = converted;

        } else {

            state.isVideo = true;
            state.videoFile = file;
            state.image = null;
            state.elements = [];

            const canvasWrap =
                modal.querySelector(".socialhub-sc-canvaswrap");

            canvasWrap
                .querySelectorAll(".socialhub-sc-video-hint")
                .forEach(h => h.remove());

            const hint =
                document.createElement("video");

            hint.className = "socialhub-sc-video-hint";
            hint.src = URL.createObjectURL(file);
            hint.muted = true;
            hint.playsInline = true;
            hint.loop = true;
            hint.controls = true;

            hint.style.cssText = `
                position: absolute;
                max-width: 100%;
                max-height: 100%;
                width: auto;
                height: auto;
                object-fit: contain;
                background: #000;
            `;

            fitCanvas(hint);

            canvasWrap.appendChild(hint);

            canvas.style.display = "none";

            openEditor();
        }
    });

    modal
        .querySelector(".socialhub-sc-pick-photo")
        .addEventListener("click", () => {
            fileInput.accept = "image/*";
            fileInput.click();
        });

    modal
        .querySelector(".socialhub-sc-pick-video")
        .addEventListener("click", () => {
            fileInput.accept = "video/*";
            fileInput.click();
        });

    modal
        .querySelector(".socialhub-sc-pick-text")
        .addEventListener("click", () => {

            state.image = null;
            state.isVideo = false;
            state.videoFile = null;
            state.elements = [];
            state.selected = null;

            openEditor();
        });

    // ---------------- TOOL BUTTONS ----------------

    modal
        .querySelector(".socialhub-sc-tool-text")
        .addEventListener("click", () => setTool("text"));

    modal
        .querySelector(".socialhub-sc-tool-draw")
        .addEventListener("click", () => setTool("draw"));

    modal
        .querySelector(".socialhub-sc-tool-sticker")
        .addEventListener("click", () => setTool("sticker"));

    modal
        .querySelector(".socialhub-sc-tool-bg")
        .addEventListener("click", () => setTool("bg"));

    modal
        .querySelector(".socialhub-sc-tool-undo")
        .addEventListener("click", () => {

            if (state.elements.length > 0) {

                state.elements.pop();
                state.selected = null;
                redraw();
            }
        });

    modal
        .querySelector(".socialhub-sc-tool-delete")
        .addEventListener("click", () => {

            if (!state.selected) {
                return;
            }

            state.elements =
                state.elements.filter(
                    el => el !== state.selected
                );

            state.selected = null;
            redraw();
        });

    // ---------------- TEXT PANEL ----------------

    const textInput =
        modal.querySelector(".socialhub-sc-text-input");

    const sizeRange =
        modal.querySelector(".socialhub-sc-size-range");

    sizeRange.addEventListener("input", () => {

        state.textSize =
            parseInt(sizeRange.value, 10);
    });

    fontSelect.addEventListener("change", () => {

        state.font =
            fontSelect.value;
    });

    function addText() {

        const value =
            textInput.value.trim();

        if (!value) {
            return;
        }

        state.elements.push({
            type: "text",
            text: value,
            x: W / 2,
            y: H / 2 - 100,
            color: state.textColor,
            size: state.textSize,
            font: state.font,
            selected: false
        });

        textInput.value = "";

        state.selected = null;

        redraw();
    }

    modal
        .querySelector(".socialhub-sc-panel-text .socialhub-sc-done")
        .addEventListener("click", addText);

    textInput.addEventListener("keydown", event => {

        if (event.key === "Enter") {
            addText();
        }
    });

    // ---------------- CANVAS POINTERS ----------------

    canvas.addEventListener("pointerdown", event => {

        event.preventDefault();

        canvas.setPointerCapture(event.pointerId);

        const hit =
            hitTest(event.clientX, event.clientY);

        if (hit && hit.type !== "stroke") {

            state.selected = hit;
            state.dragTarget = hit;

            const pos =
                canvasPos(event.clientX, event.clientY);

            state.dragOffset = {
                x: pos.x - hit.x,
                y: pos.y - hit.y
            };

            showSelectionBox();

            return;
        }

        if (state.selected) {

            state.selected = null;
            showSelectionBox();
        }

        if (state.tool === "draw") {

            const pos =
                canvasPos(event.clientX, event.clientY);

            state.strokePoints = {
                color: state.drawColor,
                width: state.drawSize,
                points: [pos]
            };
        }
    });

    canvas.addEventListener("pointermove", event => {

        if (
            state.dragTarget &&
            state.dragTarget.type !== "stroke"
        ) {

            const pos =
                canvasPos(event.clientX, event.clientY);

            state.dragTarget.x =
                Math.max(0, Math.min(W, pos.x - state.dragOffset.x));

            state.dragTarget.y =
                Math.max(0, Math.min(H, pos.y - state.dragOffset.y));

            redraw();

        } else if (
            state.strokePoints &&
            state.tool === "draw"
        ) {

            const pos =
                canvasPos(event.clientX, event.clientY);

            state.strokePoints.points.push(pos);

            redraw();
        }
    });

    function endPointer(event) {

        if (state.strokePoints) {

            if (state.strokePoints.points.length > 1) {

                state.elements.push(state.strokePoints);
            }

            state.strokePoints = null;
            state.selected = null;
            redraw();
        }

        state.dragTarget = null;
    }

    canvas.addEventListener("pointerup", endPointer);
    canvas.addEventListener("pointercancel", endPointer);

    // ---------------- CLOSE ----------------

    modal
        .querySelector(".socialhub-sc-close")
        .addEventListener("click", () => {
            modal.remove();
        });

    modal
        .querySelector(".socialhub-sc-back")
        .addEventListener("click", backToStart);

    modal.addEventListener("click", event => {

        if (event.target === modal) {
            modal.remove();
        }
    });

    // ---------------- SHARE ----------------

    modal
        .querySelector(".socialhub-sc-share")
        .addEventListener("click", async () => {

            const shareButton =
                modal.querySelector(".socialhub-sc-share");

            if (
                !state.isVideo &&
                !state.image
            ) {
                alert("Add a photo first.");
                return;
            }

            const caption =
                modal.querySelector(".socialhub-sc-caption").value.trim() || null;

            shareButton.disabled = true;

            shareButton.innerText = "Uploading...";

            try {

                let uploadFile = null;

                if (state.isVideo) {

                    uploadFile =
                        state.videoFile;

                } else {

                    // Compose the full design into one image
                    const blob =
                        await new Promise(resolve => {

                            canvas.toBlob(
                                resolve,
                                "image/jpeg",
                                0.92
                            );
                        });

                    const name =
                        `story-${Date.now()}.jpg`;

                    uploadFile =
                        new File(
                            [blob],
                            name,
                            { type: "image/jpeg" }
                        );
                }

                const ext =
                    uploadFile.name
                        .split(".")
                        .pop()
                        .toLowerCase() ||
                    (state.isVideo ? "mp4" : "jpg");

                const path =
                    `${me.id}-${Date.now()}.${ext}`;

                const {
                    error: uploadError
                } = await db
                    .storage
                    .from("stories")
                    .upload(path, uploadFile, {
                        upsert: true,
                        contentType: uploadFile.type
                    });

                if (uploadError) {
                    throw uploadError;
                }

                shareButton.innerText = "Sharing...";

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
                        media_type:
                            state.isVideo
                                ? "video"
                                : "image",
                        caption: caption
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
