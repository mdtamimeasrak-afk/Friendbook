// ======================================================
// PROFILE-MORE.JS
// Profile More (•••) menu: View as / Search /
// Edit highlights / Profile status (profile.html only)
// ======================================================

(function () {

    if (!document.querySelector(".fb-more-wrap")) {

        return;
    }

    var db = window.db || supabaseClient;

    var searchTimer = null;

    // ------------------------------------------
    // MENU
    // ------------------------------------------

    function socialhubProfileMoreClose() {

        document
            .querySelectorAll(".fb-more-wrap .fb-more-menu")
            .forEach(function (menu) {

                menu.style.display =
                    "none";
            });
    }

    // ======================================================
    // 1. VIEW AS
    // ======================================================

    function socialhubProfileViewAs() {

        socialhubProfileMoreClose();

        document.body.classList.add(
            "fb-viewing-as"
        );

        var bar =
            document
                .getElementById("fbViewAsBar");

        if (bar) {

            bar.style.display =
                "flex";
        }

        socialhubToast(
            "You're viewing your profile as a visitor.",
            "info"
        );
    }

    function socialhubProfileExitViewAs() {

        document.body.classList.remove(
            "fb-viewing-as"
        );

        var bar =
            document
                .getElementById("fbViewAsBar");

        if (bar) {

            bar.style.display =
                "none";
        }

        socialhubToast(
            "You're back to editing your profile.",
            "success"
        );
    }

    // ======================================================
    // 2. SEARCH THIS PROFILE
    // ======================================================

    var SEARCH_KEY =
        "socialhubProfileRecent";

    function socialhubProfileSearchOpen() {

        socialhubProfileMoreClose();

        var modal =
            document
                .getElementById("fbSearchModal");

        if (!modal) {

            return;
        }

        modal.style.display =
            "flex";

        var input =
            document
                .getElementById("fbSearchInput");

        if (input) {

            input.value =
                "";

            setTimeout(function () {

                input.focus();
            }, 60);
        }

        socialhubProfileSearchShowRecent();
    }

    function socialhubProfileSearchClose() {

        var modal =
            document
                .getElementById("fbSearchModal");

        if (modal) {

            modal.style.display =
                "none";
        }

        clearTimeout(searchTimer);

        var input =
            document
                .getElementById("fbSearchInput");

        if (input) {

            input.value =
                "";
        }

        document
            .getElementById("fbSearchClear")
            .style.display =
            "none";
    }

    function socialhubProfileRecentList() {

        try {

            var raw =
                localStorage.getItem(SEARCH_KEY);

            var list =
                raw
                    ? JSON.parse(raw)
                    : [];

            return Array.isArray(list)
                ? list
                : [];

        } catch (e) {

            return [];
        }
    }

    function socialhubProfileRecentAdd(term) {

        var list =
            socialhubProfileRecentList()
                .filter(function (item) {

                    return item !== term;
                });

        list.unshift(term);

        if (list.length > 5) {

            list.pop();
        }

        try {

            localStorage.setItem(
                SEARCH_KEY,
                JSON.stringify(list)
            );

        } catch (e) {

            // ignore
        }
    }

    function socialhubProfileSearchShowRecent() {

        var body =
            document
                .getElementById("fbSearchBody");

        if (!body) {

            return;
        }

        var list =
            socialhubProfileRecentList();

        if (list.length === 0) {

            body.innerHTML =
                '<p class="fb-search-section-title">Recent searches</p>' +
                '<p class="fb-search-empty">No recent searches</p>';

            return;
        }

        var html =
            '<p class="fb-search-section-title">Recent searches</p>';

        list.forEach(function (term) {

            html +=
                '<div class="fb-search-recent-row">' +
                '<i class="fa-solid fa-clock-rotate-left"></i>' +
                '<button type="button" class="fb-search-recent-term" data-term="' +
                socialhubEscape(term) + '">' +
                socialhubEscape(term) +
                "</button>" +
                '<button type="button" class="fb-search-recent-x" data-term="' +
                socialhubEscape(term) + '" title="Remove">' +
                '<i class="fa-solid fa-x"></i>' +
                "</button>" +
                "</div>";
        });

        body.innerHTML =
            html;

        body
            .querySelectorAll(".fb-search-recent-term")
            .forEach(function (btn) {

                btn.addEventListener("click", function () {

                    var input =
                        document
                            .getElementById("fbSearchInput");

                    input.value =
                        btn.getAttribute("data-term");

                    socialhubProfileSearchRun();
                });
            });

        body
            .querySelectorAll(".fb-search-recent-x")
            .forEach(function (btn) {

                btn.addEventListener("click", function () {

                    var term =
                        btn.getAttribute("data-term");

                    var list =
                        socialhubProfileRecentList()
                            .filter(function (item) {

                                return item !== term;
                            });

                    localStorage.setItem(
                        SEARCH_KEY,
                        JSON.stringify(list)
                    );

                    socialhubProfileSearchShowRecent();
                });
            });
    }

    async function socialhubProfileSearchRun() {

        var input =
            document
                .getElementById("fbSearchInput");

        var body =
            document
                .getElementById("fbSearchBody");

        var clearBtn =
            document
                .getElementById("fbSearchClear");

        if (!input || !body) {

            return;
        }

        var term =
            input.value.trim();

        clearBtn.style.display =
            term ? "" : "none";

        if (!term) {

            socialhubProfileSearchShowRecent();

            return;
        }

        socialhubProfileRecentAdd(term);

        body.innerHTML =
            '<p class="fb-search-loading">Searching...</p>';

        var me =
            await socialhubGetMe();

        if (!me) {

            body.innerHTML =
                '<p class="fb-search-empty">You are not logged in.</p>';

            return;
        }

        var lower =
            term.toLowerCase();

        // ---------- POSTS (text posts, photos, reels) ----------

        var {
            data: posts,
            error: postsError
        } = await db
            .from("posts")
            .select("id, content, image_url, video_url, created_at")
            .eq("user_id", me.id)
            .ilike("content", "%" + lower + "%")
            .order("created_at", {
                ascending: false
            })
            .limit(25);

        var results = [];

        (posts || []).forEach(function (post) {

            var content =
                (post.content || "").trim();

            var type;

            var icon;

            if (post.video_url && !post.image_url) {

                type =
                    "Reel";

                icon =
                    "fa-video";

            } else if (post.image_url) {

                type =
                    "Photo";

                icon =
                    "fa-image";

            } else {

                type =
                    "Post";

                icon =
                    "fa-file-lines";
            }

            results.push({

                type: type,
                icon: icon,
                title: content.slice(0, 80) || (type + " without caption"),
                id: post.id,
                imageUrl: post.image_url,
                videoUrl: post.video_url
            });
        });

        // ---------- PROFILE INFORMATION ----------

        var {
            data: profile,
            error: profileError
        } = await db
            .from("profiles")
            .select("full_name, username, bio, location, work, education, website, extra")
            .eq("id", me.id)
            .single();

        var infoFields =
            [];

        if (!profileError && profile) {

            var extra =
                profile.extra || {};

            var fields =
                {
                    "Current city": profile.location,
                    "Work": profile.work,
                    "Education": profile.education,
                    "Bio": profile.bio,
                    "Website": profile.website,
                    "Hometown": extra.hometown,
                    "Gender": extra.gender,
                    "Relationship status": extra.relationship,
                    "Languages": extra.languages,
                    "Hobbies": extra.hobbies,
                    "Interests": extra.interests
                };

            Object.keys(fields).forEach(function (label) {

                var value =
                    fields[label];

                if (
                    value &&
                    String(value).toLowerCase().indexOf(lower) !== -1
                ) {

                    infoFields.push({

                        label: label,
                        value: String(value)
                    });
                }
            });
        }

        // ---------- RENDER ----------

        var total =
            results.length +
            infoFields.length;

        if (total === 0) {

            body.innerHTML =
                '<p class="fb-search-section-title">Results for "' +
                socialhubEscape(term) + '"</p>' +
                '<p class="fb-search-empty">No results found for "' +
                socialhubEscape(term) + '".</p>';

            return;
        }

        var html =
            '<p class="fb-search-section-title">Results for "' +
            socialhubEscape(term) + '"</p>';

        results.forEach(function (result) {

            html +=
                '<button type="button" class="fb-search-result" data-post-id="' +
                result.id + '" data-type="' + result.type + '">' +
                '<i class="fa-solid ' + result.icon + '"></i>' +
                "<span>" +
                '<strong>' + result.type + "</strong>" +
                "<em>" + socialhubEscape(result.title) + "</em>" +
                "</span>" +
                "</button>";
        });

        infoFields.forEach(function (info) {

            html +=
                '<button type="button" class="fb-search-result fb-search-info" data-type="info">' +
                '<i class="fa-solid fa-circle-info"></i>' +
                "<span>" +
                '<strong>' + socialhubEscape(info.label) + "</strong>" +
                "<em>" + socialhubEscape(info.value) + "</em>" +
                "</span>" +
                "</button>";
        });

        body.innerHTML =
            html;

        body
            .querySelectorAll(".fb-search-result[data-post-id]")
            .forEach(function (btn) {

                btn.addEventListener("click", function () {

                    var id =
                        btn.getAttribute("data-post-id");

                    var inCache =
                        (
                            typeof socialhubMyPostsCache !== "undefined" &&
                            socialhubMyPostsCache &&
                            socialhubMyPostsCache.posts
                        )
                            ? socialhubMyPostsCache.posts
                                .some(function (post) {

                                    return post.id === id;
                                })
                            : false;

                    if (
                        inCache &&
                        typeof socialhubOpenPostLightbox === "function"
                    ) {

                        socialhubProfileSearchClose();

                        socialhubOpenPostLightbox(id);

                        return;
                    }

                    socialhubProfileSearchClose();

                    if (
                        typeof socialhubSwitchFbTab === "function"
                    ) {

                        socialhubSwitchFbTab("posts");

                        socialhubToast(
                            "Found in your posts.",
                            "info"
                        );
                    }
                });
            });

        body
            .querySelectorAll(".fb-search-result[data-type='info']")
            .forEach(function (btn) {

                btn.addEventListener("click", function () {

                    socialhubProfileSearchClose();

                    if (
                        typeof socialhubSwitchFbTab === "function"
                    ) {

                        socialhubSwitchFbTab("about");
                    }
                });
            });
    }

    // ======================================================
    // 3. EDIT HIGHLIGHTS
    // ======================================================

    function socialhubProfileHighlightsEdit() {

        socialhubProfileMoreClose();

        var modal =
            document
                .getElementById("fbHighlightsEditModal");

        if (!modal) {

            return;
        }

        modal.style.display =
            "flex";

        socialhubProfileHighlightsLoad();
    }

    function socialhubProfileHighlightsClose() {

        var modal =
            document
                .getElementById("fbHighlightsEditModal");

        if (modal) {

            modal.style.display =
                "none";
        }
    }

    function socialhubProfileHighlightsNew() {

        if (
            typeof socialhubOpenHighlightCreate === "function"
        ) {

            socialhubOpenHighlightCreate();
        }
    }

    async function socialhubProfileHighlightsLoad() {

        var grid =
            document
                .getElementById("fbHighlightsEditGrid");

        if (!grid) {

            return;
        }

        var me =
            await socialhubGetMe();

        if (!me) {

            grid.innerHTML =
                '<p class="fb-search-empty">Not logged in.</p>';

            return;
        }

        var {
            data: list,
            error
        } = await db
            .from("highlights")
            .select("id, name, cover_url")
            .eq("user_id", me.id)
            .order("created_at", {
                ascending: true
            });

        if (error) {

            grid.innerHTML =
                '<p class="fb-search-empty">Could not load highlights.</p>';

            return;
        }

        if (!list || list.length === 0) {

            grid.innerHTML =
                '<p class="fb-search-empty">No highlights yet.</p>';

            return;
        }

        grid.innerHTML =
            "";

        list.forEach(function (item) {

            var cover =
                item.cover_url
                    ? '<img src="' + socialhubEscape(item.cover_url) + '" alt="" />'
                    : "<span>" +
                        socialhubEscape(
                            item.name
                                ? item.name.charAt(0).toUpperCase()
                                : "H"
                        ) +
                        "</span>";

            var tile =
                document.createElement("button");

            tile.type =
                "button";

            tile.className =
                "fb-hl-edit-tile";

            tile.innerHTML =
                '<span class="fb-hl-edit-cover">' + cover + "</span>" +
                "<span class=\"fb-hl-edit-name\">" +
                socialhubEscape(item.name || "Highlight") +
                "</span>";

            tile.title =
                "Edit highlight";

            tile.addEventListener("click", function () {

                socialhubProfileHighlightsClose();

                if (
                    typeof socialhubOpenHighlightCreate === "function"
                ) {

                    socialhubOpenHighlightCreate(item.id);
                }
            });

            grid.appendChild(tile);
        });
    }

    // ======================================================
    // 4. PROFILE STATUS
    // ======================================================

    function socialhubProfileStatusOpen() {

        socialhubProfileMoreClose();

        var modal =
            document
                .getElementById("fbStatusModal");

        if (!modal) {

            return;
        }

        modal.style.display =
            "flex";

        socialhubProfileStatusLoad();
    }

    function socialhubProfileStatusClose() {

        var modal =
            document
                .getElementById("fbStatusModal");

        if (modal) {

            modal.style.display =
                "none";
        }
    }

    async function socialhubProfileStatusLoad() {

        var body =
            document
                .getElementById("fbStatusBody");

        if (!body) {

            return;
        }

        body.innerHTML =
            '<p class="fb-search-loading">Checking...</p>';

        var me =
            await socialhubGetMe();

        if (!me) {

            socialhubProfileStatusWarning(
                body,
                "Your profile could not be verified."
            );

            return;
        }

        var {
            data: profile,
            error: profileError
        } = await db
            .from("profiles")
            .select("id, full_name, bio, location, avatar_url, extra")
            .eq("id", me.id)
            .single();

        if (profileError || !profile) {

            socialhubProfileStatusWarning(
                body,
                "Your profile could not be verified."
            );

            return;
        }

        var extra =
            profile.extra || {};

        var hasInfo =
            Boolean(
                profile.bio ||
                profile.location ||
                extra.hometown ||
                extra.gender ||
                extra.relationship ||
                extra.languages ||
                extra.hobbies
            );

        var {
            data: posts,
            error: postsError
        } = await db
            .from("posts")
            .select("id")
            .eq("user_id", me.id)
            .limit(1);

        var html =
            '<div class="fb-status-ok-card">' +
            '<i class="fa-solid fa-circle-check"></i>' +
            "<div>" +
            "<strong>Your profile is active</strong>" +
            "<span>Everything looks good.</span>" +
            "</div>" +
            "</div>" +
            '<p class="fb-status-features-title">Profile features</p>' +
            '<div class="fb-status-feature">' +
            '<i class="fa-solid fa-circle-check"></i>' +
            "<span>Profile visible</span>" +
            "</div>" +
            '<div class="fb-status-feature">' +
            '<i class="fa-solid fa-circle-check"></i>' +
            "<span>Posts " +
            (posts && !postsError
                ? "active"
                : "available") +
            "</span>" +
            "</div>" +
            '<div class="fb-status-feature">' +
            '<i class="fa-solid fa-circle-check"></i>' +
            "<span>Profile information " +
            (hasInfo
                ? "available"
                : "partially available") +
            "</span>" +
            "</div>" +
            '<p class="fb-status-note">No current restrictions</p>';

        body.innerHTML =
            html;
    }

    function socialhubProfileStatusWarning(body, message) {

        body.innerHTML =
            '<div class="fb-status-warn-card">' +
            '<i class="fa-solid fa-triangle-exclamation"></i>' +
            "<div>" +
            "<strong>Something needs your attention</strong>" +
            "<span>" + socialhubEscape(message) + "</span>" +
            "</div>" +
            "</div>" +
            '<div class="fb-status-warn-actions">' +
            '<button type="button" class="fb-btn fb-btn-primary" onclick="socialhubProfileStatusReview()">' +
            "Review" +
            "</button>" +
            "</div>";
    }

    function socialhubProfileStatusReview() {

        socialhubProfileStatusClose();

        if (
            typeof openEditProfile === "function"
        ) {

            openEditProfile();
        }
    }

    // ======================================================
    // 5. ACTIVITY LOG
    // ======================================================

    var activityCache =
        [];

    function socialhubProfileActivityLog() {

        socialhubProfileMoreClose();

        var modal =
            document
                .getElementById("fbActivityModal");

        if (!modal) {

            return;
        }

        modal.style.display =
            "flex";

        socialhubProfileActivityLoad();
    }

    function socialhubProfileActivityClose() {

        var modal =
            document
                .getElementById("fbActivityModal");

        if (modal) {

            modal.style.display =
                "none";
        }
    }

    function socialhubProfileRelativeTime(date) {

        var diff =
            Date.now() - new Date(date).getTime();

        var minutes =
            Math.floor(diff / 60000);

        if (minutes < 1) {

            return "just now";
        }

        if (minutes < 60) {

            return minutes + " minute" +
                (minutes === 1 ? "" : "s") +
                " ago";
        }

        var hours =
            Math.floor(minutes / 60);

        if (hours < 24) {

            return hours + " hour" +
                (hours === 1 ? "" : "s") +
                " ago";
        }

        var days =
            Math.floor(hours / 24);

        return days + " day" +
            (days === 1 ? "" : "s") +
            " ago";
    }

    function socialhubProfileDayLabel(date) {

        var now =
            new Date();

        var day =
            new Date(date);

        var today =
            new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate()
            );

        var target =
            new Date(
                day.getFullYear(),
                day.getMonth(),
                day.getDate()
            );

        var diffDays =
            Math.round(
                (today.getTime() - target.getTime()) / 86400000
            );

        if (diffDays === 0) {

            return "Today";
        }

        if (diffDays === 1) {

            return "Yesterday";
        }

        return day.toLocaleDateString(
            "en-GB",
            {
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );
    }

    async function socialhubProfileActivityLoad() {

        var body =
            document
                .getElementById("fbActivityBody");

        if (!body) {

            return;
        }

        var me =
            await socialhubGetMe();

        if (!me) {

            body.innerHTML =
                '<p class="fb-search-empty">You are not logged in.</p>';

            return;
        }

        var [
            postsResult,
            commentsResult,
            likesResult,
            storiesResult
        ] =
            await Promise.all([
                db
                    .from("posts")
                    .select("id, content, image_url, video_url, created_at")
                    .eq("user_id", me.id)
                    .order("created_at", { ascending: false })
                    .limit(50),
                db
                    .from("comments")
                    .select("id, post_id, content, created_at")
                    .eq("user_id", me.id)
                    .order("created_at", { ascending: false })
                    .limit(50),
                db
                    .from("likes")
                    .select("id, post_id, created_at")
                    .eq("user_id", me.id)
                    .order("created_at", { ascending: false })
                    .limit(50),
                db
                    .from("stories")
                    .select("id, media_type, created_at")
                    .eq("user_id", me.id)
                    .order("created_at", { ascending: false })
                    .limit(20)
            ]);

        var items =
            [];

        (postsResult.data || []).forEach(function (post) {

            var kind =
                post.video_url && !post.image_url
                    ? "reels"
                    : post.image_url
                        ? "photos"
                        : "posts";

            items.push({

                kind: kind,
                icon: post.video_url && !post.image_url
                    ? "fa-video"
                    : post.image_url
                        ? "fa-image"
                        : "fa-file-lines",
                text: "You created a " +
                    (post.video_url && !post.image_url
                        ? "reel"
                        : post.image_url
                            ? "photo post"
                            : "post"),
                time: post.created_at,
                postId: post.id
            });
        });

        (commentsResult.data || []).forEach(function (comment) {

            items.push({

                kind: "comments",
                icon: "fa-comment",
                text: "You commented: " +
                    (comment.content || "").slice(0, 60),
                time: comment.created_at,
                postId: comment.post_id
            });
        });

        (likesResult.data || []).forEach(function (like) {

            items.push({

                kind: "likes",
                icon: "fa-heart",
                text: "You liked a post",
                time: like.created_at,
                postId: like.post_id
            });
        });

        (storiesResult.data || []).forEach(function (story) {

            items.push({

                kind: "stories",
                icon: "fa-camera",
                text: "You shared a story",
                time: story.created_at,
                postId: null
            });
        });

        items.sort(function (a, b) {

            return (
                new Date(b.time).getTime() -
                new Date(a.time).getTime()
            );
        });

        activityCache =
            items;

        socialhubProfileActivityRender();
    }

    function socialhubProfileActivityRender() {

        var body =
            document
                .getElementById("fbActivityBody");

        if (!body) {

            return;
        }

        var typeFilter =
            document
                .getElementById("fbActivityType")
                .value;

        var dateFilter =
            document
                .getElementById("fbActivityDate")
                .value;

        var items =
            activityCache.filter(function (item) {

                if (
                    typeFilter !== "all" &&
                    item.kind !== typeFilter
                ) {

                    return false;
                }

                if (dateFilter === "today") {

                    var now =
                        new Date();

                    var start =
                        new Date(
                            now.getFullYear(),
                            now.getMonth(),
                            now.getDate()
                        );

                    if (new Date(item.time) < start) {

                        return false;
                    }

                } else if (dateFilter === "7") {

                    var cutoff =
                        Date.now() - 7 * 86400000;

                    if (new Date(item.time).getTime() < cutoff) {

                        return false;
                    }
                }

                return true;
            });

        if (items.length === 0) {

            body.innerHTML =
                '<p class="fb-search-empty">No activity found.</p>';

            return;
        }

        var html =
            "";

        var lastLabel =
            null;

        items.forEach(function (item) {

            var label =
                socialhubProfileDayLabel(item.time);

            if (label !== lastLabel) {

                html +=
                    '<p class="fb-search-section-title">' +
                    label +
                    "</p>";

                lastLabel =
                    label;
            }

            html +=
                '<button type="button" class="fb-search-result fb-activity-item" data-post-id="' +
                (item.postId || "") + '">' +
                '<i class="fa-solid ' + item.icon + '"></i>' +
                "<span>" +
                "<strong>" + socialhubEscape(item.text) + "</strong>" +
                "<em>" + socialhubProfileRelativeTime(item.time) + "</em>" +
                "</span>" +
                "</button>";
        });

        body.innerHTML =
            html;

        body
            .querySelectorAll(".fb-activity-item[data-post-id]:not([data-post-id=''])")
            .forEach(function (btn) {

                btn.addEventListener("click", function () {

                    var id =
                        btn.getAttribute("data-post-id");

                    var inCache =
                        (
                            typeof socialhubMyPostsCache !== "undefined" &&
                            socialhubMyPostsCache &&
                            socialhubMyPostsCache.posts
                        )
                            ? socialhubMyPostsCache.posts
                                .some(function (post) {

                                    return post.id === id;
                                })
                            : false;

                    if (
                        inCache &&
                        typeof socialhubOpenPostLightbox === "function"
                    ) {

                        socialhubProfileActivityClose();

                        socialhubOpenPostLightbox(id);

                        return;
                    }

                    socialhubProfileActivityClose();

                    if (
                        typeof socialhubSwitchFbTab === "function"
                    ) {

                        socialhubSwitchFbTab("posts");

                        socialhubToast(
                            "Found in your posts.",
                            "info"
                        );
                    }
                });
            });
    }

    // ======================================================
    // 6. PROFILE AND TAGGING SETTINGS
    // ======================================================

    var taggingDefaults = {

        who_can_post: "friends",
        who_can_see_others_posts: "friends",
        who_can_tag: "friends",
        review_tagged_posts: true,
        review_post_tags: false

    };

    function socialhubProfileTaggingSettings() {

        socialhubProfileMoreClose();

        var modal =
            document
                .getElementById("fbTaggingModal");

        if (!modal) {

            return;
        }

        modal.style.display =
            "flex";

        socialhubProfileTaggingLoad();
    }

    function socialhubProfileTaggingClose() {

        var modal =
            document
                .getElementById("fbTaggingModal");

        if (modal) {

            modal.style.display =
                "none";
        }
    }

    async function socialhubProfileTaggingLoad() {

        var me =
            await socialhubGetMe();

        if (!me) {

            return;
        }

        var {
            data: profile,
            error
        } = await db
            .from("profiles")
            .select("id, extra")
            .eq("id", me.id)
            .single();

        if (error || !profile) {

            return;
        }

        var extra =
            profile.extra || {};

        var settings =
            Object.assign(
                {},
                taggingDefaults,
                (extra.profile_settings && typeof extra.profile_settings === "object")
                    ? extra.profile_settings
                    : {}
            );

        document
            .querySelectorAll(".fb-tagging-select")
            .forEach(function (select) {

                var key =
                    select.getAttribute("data-tag-key");

                select.value =
                    settings[key] || "friends";
            });

        document
            .querySelectorAll(".fb-toggle input")
            .forEach(function (checkbox) {

                var key =
                    checkbox.getAttribute("data-tag-key");

                checkbox.checked =
                    Boolean(settings[key]);
            });
    }

    async function socialhubProfileTaggingSave() {

        var me =
            await socialhubGetMe();

        if (!me) {

            return;
        }

        var {
            data: profile,
            error
        } = await db
            .from("profiles")
            .select("id, extra")
            .eq("id", me.id)
            .single();

        if (error || !profile) {

            socialhubToast("Could not save settings.", "error");

            return;
        }

        var settings =
            Object.assign(
                {},
                taggingDefaults,
                (profile.extra && profile.extra.profile_settings) || {}
            );

        document
            .querySelectorAll(".fb-tagging-select")
            .forEach(function (select) {

                var key =
                    select.getAttribute("data-tag-key");

                settings[key] =
                    select.value;
            });

        document
            .querySelectorAll(".fb-toggle input")
            .forEach(function (checkbox) {

                var key =
                    checkbox.getAttribute("data-tag-key");

                settings[key] =
                    checkbox.checked;
            });

        var extra =
            Object.assign({}, profile.extra || {});

        extra.profile_settings =
            settings;

        var {
            error: saveError
        } = await db
            .from("profiles")
            .update({ extra: extra })
            .eq("id", me.id);

        if (saveError) {

            socialhubToast("Could not save settings.", "error");

            return;
        }

        socialhubToast("Settings saved.", "success");
    }

    // ------------------------------------------
    // WIRE
    // ------------------------------------------

    document.addEventListener("DOMContentLoaded", function () {

        var searchInput =
            document
                .getElementById("fbSearchInput");

        if (searchInput) {

            searchInput.addEventListener("input", function () {

                clearTimeout(searchTimer);

                searchTimer =
                    setTimeout(
                        socialhubProfileSearchRun,
                        300
                    );
            });

            searchInput.addEventListener("keydown", function (event) {

                if (event.key === "Enter") {

                    clearTimeout(searchTimer);

                    socialhubProfileSearchRun();
                }
            });
        }

        var clearBtn =
            document
                .getElementById("fbSearchClear");

        if (clearBtn) {

            clearBtn.addEventListener("click", function () {

                var input =
                    document
                        .getElementById("fbSearchInput");

                input.value =
                    "";

                clearBtn.style.display =
                    "none";

                socialhubProfileSearchShowRecent();

                input.focus();
            });
        }

        [
            "fbSearchModal",
            "fbHighlightsEditModal",
            "fbStatusModal",
            "fbActivityModal",
            "fbTaggingModal"
        ]
            .forEach(function (id) {

                var modal =
                    document
                        .getElementById(id);

                if (!modal) {

                    return;
                }

                modal.addEventListener("click", function (event) {

                    if (event.target !== modal) {

                        return;
                    }

                    if (id === "fbSearchModal") {

                        socialhubProfileSearchClose();

                    } else if (id === "fbHighlightsEditModal") {

                        socialhubProfileHighlightsClose();

                    } else if (id === "fbStatusModal") {

                        socialhubProfileStatusClose();

                    } else if (id === "fbActivityModal") {

                        socialhubProfileActivityClose();

                    } else {

                        socialhubProfileTaggingClose();
                    }
                });
            });

        document.addEventListener("keydown", function (event) {

            if (event.key !== "Escape") {

                return;
            }

            if (
                document
                    .getElementById("fbSearchModal")
                    .style.display !== "none"
            ) {

                socialhubProfileSearchClose();
            }

            if (
                document
                    .getElementById("fbHighlightsEditModal")
                    .style.display !== "none"
            ) {

                socialhubProfileHighlightsClose();
            }

            if (
                document
                    .getElementById("fbStatusModal")
                    .style.display !== "none"
            ) {

                socialhubProfileStatusClose();
            }

            if (
                document
                    .getElementById("fbActivityModal")
                    .style.display !== "none"
            ) {

                socialhubProfileActivityClose();
            }

            if (
                document
                    .getElementById("fbTaggingModal")
                    .style.display !== "none"
            ) {

                socialhubProfileTaggingClose();
            }
        });

        document
            .getElementById("fbActivityType")
            .addEventListener("change", socialhubProfileActivityRender);

        document
            .getElementById("fbActivityDate")
            .addEventListener("change", socialhubProfileActivityRender);

        document
            .querySelectorAll(".fb-tagging-select, .fb-toggle input")
            .forEach(function (control) {

                control.addEventListener("change", socialhubProfileTaggingSave);
            });
    });

})();