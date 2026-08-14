// ======================================================
// ACTIVITY LOG: post views + "Seen by" on own posts
// Phase 6
// ======================================================

(function () {

    let cssInjected = false;

    function injectStyles() {

        if (cssInjected) {
            return;
        }

        cssInjected = true;

        const style = document.createElement("style");

        style.textContent = `

            .socialhub-seenby-row {
                padding: 8px 14px 2px;
                font-size: 12.5px;
                color: #65676b;
            }

            .socialhub-seenby-btn {
                border: none;
                background: transparent;
                color: #65676b;
                font-size: 12.5px;
                font-weight: 600;
                padding: 4px 8px;
                border-radius: 14px;
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                gap: 6px;
            }

            .socialhub-seenby-btn:hover {
                background: #f0f2f5;
                text-decoration: none;
            }

            body.dark-mode .socialhub-seenby-row,
            body.dark-mode .socialhub-seenby-btn {
                color: #b0b3b8;
            }

            body.dark-mode .socialhub-seenby-btn:hover {
                background: #3a3b3c;
            }

            .socialhub-av-modal {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.55);
                z-index: 100000;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }

            .socialhub-av-box {
                width: 100%;
                max-width: 400px;
                max-height: 75vh;
                background: #fff;
                border-radius: 12px;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
            }

            .socialhub-av-head {
                padding: 14px 16px;
                border-bottom: 1px solid #e4e6eb;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }

            .socialhub-av-head h3 {
                margin: 0;
                font-size: 16px;
            }

            .socialhub-av-close {
                border: none;
                background: #e4e6eb;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                cursor: pointer;
                color: #1c1e21;
            }

            .socialhub-av-list {
                overflow-y: auto;
                padding: 8px 0;
            }

            .socialhub-av-item {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 8px 16px;
            }

            .socialhub-av-avatar {
                width: 36px;
                height: 36px;
                border-radius: 50%;
                object-fit: cover;
                background: #e4e6eb;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 700;
                color: #65676b;
                overflow: hidden;
                flex: none;
            }

            .socialhub-av-avatar img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }

            .socialhub-av-name {
                font-size: 14px;
                font-weight: 600;
            }

            .socialhub-av-empty {
                padding: 24px;
                text-align: center;
                color: #65676b;
                font-size: 14px;
            }

            body.dark-mode .socialhub-av-box {
                background: #242526;
            }

            body.dark-mode .socialhub-av-head {
                border-bottom-color: #3a3b3c;
            }

            body.dark-mode .socialhub-av-head h3 {
                color: #e4e6eb;
            }

            body.dark-mode .socialhub-av-close {
                background: #3a3b3c;
                color: #e4e6eb;
            }

            body.dark-mode .socialhub-av-item {
                color: #e4e6eb;
            }

            body.dark-mode .socialhub-av-avatar {
                background: #3a3b3c;
                color: #b0b3b8;
            }

            body.dark-mode .socialhub-av-empty {
                color: #b0b3b8;
            }

        `;

        document.head.appendChild(style);
    }


    function socialhubAvModal(title, contentHTML) {

        const modal = document.createElement("div");

        modal.className = "socialhub-av-modal";

        modal.innerHTML = `
            <div class="socialhub-av-box">

                <div class="socialhub-av-head">
                    <h3>${title}</h3>
                    <button class="socialhub-av-close" type="button">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>

                <div class="socialhub-av-list">${contentHTML}</div>

            </div>
        `;

        modal.addEventListener("click", event => {

            if (event.target === modal) {
                modal.remove();
            }
        });

        modal
            .querySelector(".socialhub-av-close")
            .addEventListener("click", () => modal.remove());

        document.body.appendChild(modal);

        return modal;
    }


    function socialhubAvAvatarHTML(profile) {

        if (profile && profile.avatar_url) {

            return `<div class="socialhub-av-avatar"><img src="${profile.avatar_url}" alt=""></div>`;
        }

        const letter = (profile && profile.full_name || "U").charAt(0).toUpperCase();

        return `<div class="socialhub-av-avatar">${letter}</div>`;
    }


    async function socialhubGetMeSafe() {

        try {

            const { data } = await db.auth.getUser();

            return (data && data.user) || null;

        } catch (e) {

            return null;
        }
    }


    // Track views for feed items + show "Seen by" on own posts
    async function socialhubTrackPostViews(feedItems, container) {

        try {

            const me = await socialhubGetMeSafe();

            if (!me) {

                // Session may not be restored yet on first load;
                // retry a couple of times (idempotent upsert).
                if (
                    !window.__socialhubTrackRetries
                ) {
                    window.__socialhubTrackRetries = 0;
                }

                if (
                    window.__socialhubTrackRetries < 2
                ) {
                    window.__socialhubTrackRetries++;

                    setTimeout(() => {

                        socialhubTrackPostViews(
                            feedItems,
                            container
                        );

                    }, 2500);
                }

                return;
            }

            const posts = (feedItems || [])
                .filter(item => item && item.type === "post" && item.post)
                .map(item => item.post);

            if (posts.length === 0) {
                return;
            }

            const ownPosts = posts.filter(post => post.user_id === me.id);
            const otherPosts = posts.filter(post => post.user_id !== me.id);

            // Record a view for every post we did not author
            if (otherPosts.length > 0) {

                await db
                    .from("post_views")
                    .upsert(
                        otherPosts.map(post => ({
                            post_id: post.id,
                            viewer_id: me.id
                        })),
                        {
                            onConflict: "post_id,viewer_id",
                            ignoreDuplicates: true
                        }
                    )
                    .catch(() => {});
            }

            // "Seen by N" on own posts
            if (ownPosts.length > 0) {

                const ownIds = ownPosts.map(post => post.id);

                const { data: views } = await db
                    .from("post_views")
                    .select("post_id")
                    .in("post_id", ownIds);

                const counts = {};

                (views || []).forEach(view => {

                    counts[view.post_id] = (counts[view.post_id] || 0) + 1;
                });

                if (!container) {
                    container = document;
                }

                ownPosts.forEach(post => {

                    const count = counts[post.id] || 0;

                    const article =
                        container.querySelector(
                            '[data-post-id="' + post.id + '"]'
                        );

                    if (!article) {
                        return;
                    }

                    const seen = document.createElement("div");

                    seen.className = "socialhub-seenby-row";

                    const label =
                        count === 0
                            ? "No one has seen this yet"
                            : (count === 1 ? "Seen by 1 person" : "Seen by " + count + " people");

                    seen.innerHTML = `
                        <button class="socialhub-seenby-btn" type="button">
                            <i class="fa-solid fa-eye"></i>
                            ${label}
                        </button>
                    `;

                    seen
                        .querySelector(".socialhub-seenby-btn")
                        .addEventListener("click", () => {

                            socialhubOpenViewers(post.id);
                        });

                    article.appendChild(seen);
                });
            }

        } catch (e) {
            // Views are non-critical; ignore all errors
        }
    }


    // "Seen by" modal with viewer list
    async function socialhubOpenViewers(postId) {

        injectStyles();

        const modal = socialhubAvModal(
            "Seen by",
            '<div class="socialhub-av-empty">Loading...</div>'
        );

        try {

            const { data, error } = await db
                .from("post_views")
                .select(
                    "viewer_id, created_at, profile:profiles(id, full_name, username, avatar_url)"
                )
                .eq("post_id", postId)
                .order("created_at", { ascending: false });

            const list = modal.querySelector(".socialhub-av-list");

            if (error || !data || data.length === 0) {

                list.innerHTML = '<div class="socialhub-av-empty">No one has seen this post yet.</div>';

                return;
            }

            list.innerHTML = data.map(view => {

                const profile = view.profile || {};

                const name = profile.full_name || "@" + profile.username || "User";

                const when = new Date(view.created_at).toLocaleString();

                return `
                    <div class="socialhub-av-item">
                        ${socialhubAvAvatarHTML(profile)}
                        <div>
                            <div class="socialhub-av-name">${name}</div>
                            <small style="color:#65676b;">${when}</small>
                        </div>
                    </div>
                `;
            }).join("");

        } catch (e) {

            const list = modal.querySelector(".socialhub-av-list");

            if (list) {
                list.innerHTML = '<div class="socialhub-av-empty">Could not load viewers.</div>';
            }
        }
    }


    window.socialhubTrackPostViews = socialhubTrackPostViews;
    window.socialhubOpenViewers = socialhubOpenViewers;

})();