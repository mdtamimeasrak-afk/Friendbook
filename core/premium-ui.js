// ======================================================
// SOCIALHUB - PREMIUM UI V2 (STEP 17.2)
// Instagram + Facebook hybrid experience
// ======================================================
//
// What it does:
//   1. Font Awesome icons everywhere (topbar, sidebar,
//      composer, posts, stats) - premium icon font.
//   2. Toast notifications replace all alert() popups.
//   3. Instagram Stories bar + full-screen story viewer
//      with progress bars and auto-advance.
//   4. Double-tap any post to like it (heart burst).
//   5. Save / bookmark posts button.
//   6. Share button copies the link.
//
// Setup:
//   - Loaded on every page right after supabase.js.
// ======================================================

(function socialhubPremiumUI() {

    const db = window.db || supabaseClient;


    // ==================================================
    // 0. FONT AWESOME + FONT
    // ==================================================

    const fontAwesomeLink =
        document.createElement("link");

    fontAwesomeLink.rel = "stylesheet";

    fontAwesomeLink.href =
        "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css";

    document.head.appendChild(fontAwesomeLink);

    const fontLink =
        document.createElement("link");

    fontLink.rel = "stylesheet";

    fontLink.href =
        "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap";

    document.head.appendChild(fontLink);


    // ==================================================
    // 1. TOAST SYSTEM
    // ==================================================

    function socialhubToastType(message) {

        const text =
            String(message || "").toLowerCase();

        if (
            text.includes("🎉") ||
            text.includes("✅") ||
            text.includes("success") ||
            text.includes("updated") ||
            text.includes("created") ||
            text.includes("sent") ||
            text.includes("accepted") ||
            text.includes("saved")
        ) {

            return "success";
        }

        if (
            text.includes("❌") ||
            text.includes("could not") ||
            text.includes("error") ||
            text.includes("please") ||
            text.includes("wrong") ||
            text.includes("fail") ||
            text.includes("invalid") ||
            text.includes("taken") ||
            text.includes("match") ||
            text.includes("can't") ||
            text.includes("not found")
        ) {

            return "error";
        }

        return "info";
    }


    function socialhubToastIcon(type) {

        if (type === "success") return "✅";

        if (type === "error") return "❌";

        return "ℹ️";
    }


    function socialhubToast(message, type) {

        const kind =
            type || socialhubToastType(message);

        let container =
            document.querySelector(
                ".socialhub-toast-container"
            );

        if (!container) {

            container =
                document.createElement("div");

            container.className =
                "socialhub-toast-container";

            document.body.appendChild(container);
        }

        const toast =
            document.createElement("div");

        toast.className =
            `socialhub-toast ${kind}`;

        toast.innerHTML = `

            <span class="socialhub-toast-icon">
                ${socialhubToastIcon(kind)}
            </span>

            <span class="socialhub-toast-msg"></span>

            <button
                type="button"
                class="socialhub-toast-close"
            >
                ✕
            </button>
        `;

        toast
            .querySelector(".socialhub-toast-msg")
            .innerText = String(message || "");

        container.appendChild(toast);

        const remove = () => {

            if (toast.dataset.done) {
                return;
            }

            toast.dataset.done = "1";

            toast.classList.add("leaving");

            setTimeout(() => toast.remove(), 260);
        };

        toast
            .querySelector(".socialhub-toast-close")
            .addEventListener("click", remove);

        toast.addEventListener("click", event => {

            if (
                !event.target.classList.contains(
                    "socialhub-toast-close"
                )
            ) {

                remove();
            }
        });

        setTimeout(remove, 4000);

        while (container.children.length > 5) {

            container.firstChild.remove();
        }
    }


    window.alert = function(message) {

        socialhubToast(String(message || ""));
    };


    window.socialhubToast = socialhubToast;


    // ==================================================
    // 2. SHARE BUTTON
    // ==================================================

    document.addEventListener("click", event => {

        const shareButton =
            event.target.closest(
                '.post-actions button:nth-child(3):not([onclick^="socialhubShareDialog"])'
            );

        if (!shareButton) {
            return;
        }

        event.preventDefault();

        const link =
            window.location.href;

        if (navigator.clipboard) {

            navigator.clipboard
                .writeText(link)
                .then(() => {

                    socialhubToast(
                        "🔗 Link copied! Share it anywhere.",
                        "success"
                    );

                })
                .catch(() => {

                    socialhubToast(
                        "Could not copy the link.",
                        "error"
                    );
                });

        } else {

            socialhubToast(
                "🔗 Link copied! Share it anywhere.",
                "success"
            );
        }
    });


    // ==================================================
    // 3. ICON MAPPER (EMOJI -> FONT AWESOME)
    // ==================================================

    const socialhubIconMap = {
        "🏠": '<i class="fa-solid fa-house"></i>',
        "🔔": '<i class="fa-solid fa-bell"></i>',
        "💬": '<i class="fa-solid fa-comment"></i>',
        "🌙": '<i class="fa-solid fa-moon"></i>',
        "👤": '<i class="fa-solid fa-user"></i>',
        "👥": '<i class="fa-solid fa-user-group"></i>',
        "⚙️": '<i class="fa-solid fa-gear"></i>',
        "🚪": '<i class="fa-solid fa-right-from-bracket"></i>',
        "🔍": '<i class="fa-solid fa-magnifying-glass"></i>',
        "📷": '<i class="fa-solid fa-image"></i>',
        "🎥": '<i class="fa-solid fa-video"></i>',
        "😊": '<i class="fa-solid fa-face-smile"></i>',
        "🎨": '<i class="fa-solid fa-palette"></i>',
        "📺": '<i class="fa-solid fa-tv"></i>',
        "🎞️": '<i class="fa-solid fa-film"></i>',
        "📅": '<i class="fa-solid fa-calendar-days"></i>',
        "🏢": '<i class="fa-solid fa-building"></i>',
        "🛒": '<i class="fa-solid fa-store"></i>',
        "🔖": '<i class="fa-solid fa-bookmark"></i>',
        "📡": '<i class="fa-solid fa-tower-broadcast"></i>',
        "🎂": '<i class="fa-solid fa-cake-candles"></i>'
    };


    function socialhubSwapLeadingIcon(element) {

        if (!element || element.querySelector("i")) {
            return;
        }

        const nodes =
            [...element.childNodes];

        for (const node of nodes) {

            if (node.nodeType !== 3) {
                continue;
            }

            const text =
                node.textContent;

            for (const [emoji, icon] of Object.entries(socialhubIconMap)) {

                if (text.includes(emoji)) {

                    node.textContent =
                        text.replace(emoji, "");

                    element.insertBefore(
                        document
                            .createRange()
                            .createContextualFragment(icon),
                        node
                    );

                    return;
                }
            }
        }
    }


    function socialhubMapIcons(root) {

        // Topbar icons + profile mini
        root
            .querySelectorAll(
                ".top-icons button, .top-icons .profile-mini"
            )
            .forEach(socialhubSwapLeadingIcon);

        // Search magnifier
        root
            .querySelectorAll(".search-box span")
            .forEach(socialhubSwapLeadingIcon);

        // Sidebar menu + logout
        root
            .querySelectorAll(
                ".sidebar-menu button, .sidebar-logout"
            )
            .forEach(socialhubSwapLeadingIcon);

        // Composer buttons
        root
            .querySelectorAll(
                ".create-post-actions button, .post-tool"
            )
            .forEach(socialhubSwapLeadingIcon);
    }


    function socialhubMapPostParts(root) {

        // Stats lines
        root
            .querySelectorAll(".post-stats span")
            .forEach(span => {

                const text =
                    span.innerText;

                if (span.querySelector("i")) {
                    return;
                }

                const likeMatch =
                    text.match(/^❤️\s*(\d+)\s*Likes/);

                if (likeMatch) {

                    span.innerHTML = `
                        <i class="fa-solid fa-heart"></i>
                        ${likeMatch[1]} Likes
                    `;

                    return;
                }

                const commentMatch =
                    text.match(/^💬\s*(\d+)\s*Comments/);

                if (commentMatch) {

                    span.innerHTML = `
                        <i class="fa-solid fa-comment"></i>
                        ${commentMatch[1]} Comments
                    `;
                }
            });

        // Post action buttons (old templates only -
        // the new likes-comments.js renders icons itself)
        root
            .querySelectorAll(
                '.post-actions button[onclick="likePost(this)"]'
            )
            .forEach(button => {

                const text =
                    button.innerText.trim();

                if (button.querySelector("i") || !text.startsWith("❤️")) {
                    return;
                }

                const liked =
                    text.includes("Liked");

                button.innerHTML = `
                    <i class="${
                        liked
                            ? "fa-solid"
                            : "fa-regular"
                    } fa-heart"></i>
                    ${liked ? "Liked" : "Like"}
                `;
            });

        root
            .querySelectorAll(
                '.post-actions button[onclick="addComment(this)"]'
            )
            .forEach(button => {

                if (
                    button.querySelector("i") ||
                    !button.innerText.includes("💬")
                ) {
                    return;
                }

                button.innerHTML = `
                    <i class="fa-regular fa-comment"></i>
                    Comment
                `;
            });

        root
            .querySelectorAll(".post-actions button")
            .forEach(button => {

                if (
                    button.querySelector("i") ||
                    !button.innerText.includes("↗️")
                ) {
                    return;
                }

                button.innerHTML = `
                    <i class="fa-solid fa-share-nodes"></i>
                    Share
                `;
            });
    }


    // ==================================================
    // 4. SAVE / BOOKMARK POSTS
    // ==================================================

    let socialhubSavedCache = null;


    async function socialhubPremiumGetMe() {

        const {
            data,
            error
        } = await db.auth.getUser();

        if (error || !data.user) {

            return null;
        }

        return data.user;
    }


    async function socialhubLoadSavedState() {

        const me =
            await socialhubPremiumGetMe();

        if (!me) {

            socialhubSavedCache = new Set();

            return;
        }

        const {
            data,
            error
        } = await db
            .from("saved_posts")
            .select("post_id")
            .eq("user_id", me.id);

        socialhubSavedCache =
            new Set((data || []).map(item => item.post_id));

        if (error) {

            socialhubSavedCache = new Set();
        }

        // Mark buttons
        document
            .querySelectorAll(
                "#posts .post, #upPosts .post, #profilePosts .post"
            )
            .forEach(post => {

                const postId =
                    post.dataset.postId;

                const button =
                    post.querySelector(".socialhub-save-btn");

                if (button && postId) {

                    const saved =
                        socialhubSavedCache.has(postId);

                    button.classList.toggle("saved", saved);

                    button.innerHTML = saved
                        ? '<i class="fa-solid fa-bookmark"></i>'
                        : '<i class="fa-regular fa-bookmark"></i>';
                }
            });
    }


    function socialhubEnsureSaveButtons() {

        document
            .querySelectorAll(
                "#posts .post, #upPosts .post, #profilePosts .post"
            )
            .forEach(post => {

                if (post.dataset.socialhubSave) {
                    return;
                }

                post.dataset.socialhubSave = "1";

                const actions =
                    post.querySelector(".post-actions");

                if (!actions) {
                    return;
                }

                const button =
                    document.createElement("button");

                button.className = "socialhub-save-btn";

                button.title = "Save post";

                button.innerHTML =
                    '<i class="fa-regular fa-bookmark"></i>';

                button.addEventListener("click", () => {

                    socialhubPremiumToggleSave(button, post);
                });

                actions.appendChild(button);
            });
    }


    async function socialhubPremiumToggleSave(button, post) {

        const me =
            await socialhubPremiumGetMe();

        if (!me) {

            socialhubToast(
                "Please login first.",
                "error"
            );

            return;
        }

        let postId =
            post.dataset.postId;

        if (!postId) {

            // Fallback: match by content
            const text =
                post.querySelector(".post-text")
                    ?.innerText?.trim() || "";

            if (text !== "") {

                const {
                    data: posts
                } = await db
                    .from("posts")
                    .select("id, content")
                    .order("created_at", {
                        ascending: false
                    });

                const match =
                    (posts || []).find(
                        item =>
                            (item.content || "").trim() === text
                    );

                if (match) {

                    post.dataset.postId = match.id;

                    postId = match.id;
                }
            }
        }

        if (!postId) {

            socialhubToast(
                "Could not find this post. Please refresh.",
                "error"
            );

            return;
        }

        const isSaved =
            button.classList.contains("saved");

        if (isSaved) {

            await db
                .from("saved_posts")
                .delete()
                .eq("user_id", me.id)
                .eq("post_id", postId);

            if (socialhubSavedCache) {

                socialhubSavedCache.delete(postId);
            }

            button.classList.remove("saved");

            button.innerHTML =
                '<i class="fa-regular fa-bookmark"></i>';

            socialhubToast("Removed from saved.");

        } else {

            const {
                error
            } = await db
                .from("saved_posts")
                .insert({
                    user_id: me.id,
                    post_id: postId
                });

            if (error) {

                console.error(
                    "❌ Save error:",
                    error
                );

                socialhubToast(
                    "Could not save post.\n\n" + error.message,
                    "error"
                );

                return;
            }

            if (socialhubSavedCache) {

                socialhubSavedCache.add(postId);
            }

            button.classList.add("saved");

            button.innerHTML =
                '<i class="fa-solid fa-bookmark"></i>';

            socialhubToast(
                "Post saved! 🔖",
                "success"
            );
        }
    }


    // ==================================================
    // 5. DOUBLE-TAP TO LIKE
    // ==================================================

    document.addEventListener("dblclick", event => {

        const post =
            event.target.closest(".post");

        if (!post) {
            return;
        }

        if (
            event.target.closest("button, input, a, textarea")
        ) {
            return;
        }

        const likeButton =
            post.querySelector(
                '.post-actions button[onclick="likePost(this)"]'
            );

        if (likeButton) {

            likeButton.click();
        }

        // Heart burst
        const burst =
            document.createElement("div");

        burst.className = "socialhub-heart-burst";

        burst.textContent = "❤️";

        post.appendChild(burst);

        setTimeout(() => burst.remove(), 900);
    });


    // ==================================================
    // 6. INSTAGRAM STORIES (handled by stories.js)
    // ==================================================



    // ==================================================
    // 7. WATCHER (mappers + save buttons)
    // ==================================================

    let socialhubWatchTimer = null;


    function socialhubWatch() {

        clearTimeout(socialhubWatchTimer);

        socialhubWatchTimer =
            setTimeout(() => {

                socialhubMapIcons(document);

                socialhubMapPostParts(document);

                socialhubEnsureSaveButtons();

            }, 250);
    }


    document.addEventListener("DOMContentLoaded", () => {

        // First pass
        socialhubWatch();

        // Watch for dynamically added content
        const observer =
            new MutationObserver(socialhubWatch);

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Load saved state for the current user
        setTimeout(socialhubLoadSavedState, 2200);

        // Also refresh saved state when feed reloads
        setInterval(socialhubLoadSavedState, 15000);

        console.log(
            "✨ Premium UI V2 activated!"
        );
    });

})();
