// ======================================================
// STORY-ARCHIVE.JS
// story-archive.html -> expired stories management.
// Stories with archived = true (column added in setup-all.sql,
// cron keeps archived stories).
// Viewer: fullscreen media + date + views + more menu
// (Save / Delete / Add to highlight).
// ======================================================

(function () {

    if (!document.getElementById("storyArchiveGrid")) {

        return;
    }

    var db = window.db || supabaseClient;

    var currentFilter =
        "all";

    var stories =
        [];

    var viewerStory =
        null;

    var pendingDeleteStory =
        null;

    // ------------------------------------------
    // STYLES (self-contained)
    // ------------------------------------------

    var style =
        document.createElement("style");

    style.textContent = `

.story-archive-main {
    max-width: 900px;
    margin: 0 auto;
    padding: 18px 14px 40px;
}

.story-archive-head {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 4px;
}

.story-archive-back {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border: none;
    border-radius: 50%;
    background: var(--card-bg, #ffffff);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    color: var(--text, #050505);
    cursor: pointer;
}

.story-archive-back svg {
    width: 19px;
    height: 19px;
}

.story-archive-head h1 {
    font-size: 24px;
    font-weight: 800;
    margin: 0;
    color: var(--text, #050505);
}

.story-archive-sub {
    color: var(--muted, #65676b);
    font-size: 14px;
    margin: 2px 0 0 0;
}

.story-archive-filters {
    display: flex;
    gap: 8px;
    margin: 18px 0 16px 0;
}

.story-archive-filters button {
    padding: 9px 18px;
    border: none;
    border-radius: 20px;
    background: var(--card-bg, #ffffff);
    color: var(--muted, #65676b);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
}

.story-archive-filters button:hover {
    background: #e4e6eb;
}

.story-archive-filters button.active {
    background: #1877f2;
    color: #ffffff;
}

.story-archive-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
}

.story-tile {
    position: relative;
    border: none;
    padding: 0;
    background: transparent;
    cursor: pointer;
    border-radius: 12px;
    overflow: hidden;
    aspect-ratio: 9 / 16;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.story-tile img,
.story-tile video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.story-tile-info {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 20px 10px 10px 10px;
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.75));
    display: flex;
    flex-direction: column;
    gap: 2px;
    color: #ffffff;
    text-align: left;
}

.story-tile-info strong {
    font-size: 12px;
    font-weight: 700;
}

.story-tile-info span {
    font-size: 11px;
    opacity: 0.85;
}

.story-tile:hover {
    outline: 3px solid #1877f2;
}

/* Viewer */

.story-archive-viewer {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: rgba(0, 0, 0, 0.92);
    display: flex;
    flex-direction: column;
}

.story-archive-viewer-top {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    position: relative;
    z-index: 3;
}

.story-archive-viewer-close,
.story-archive-viewer-dots {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    border: none;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.12);
    color: #ffffff;
    cursor: pointer;
}

.story-archive-viewer-close:hover,
.story-archive-viewer-dots:hover {
    background: rgba(255, 255, 255, 0.22);
}

.story-archive-viewer-close svg,
.story-archive-viewer-dots svg {
    width: 19px;
    height: 19px;
}

.story-archive-viewer-meta {
    display: flex;
    flex-direction: column;
    flex: 1;
    color: #ffffff;
}

.story-archive-viewer-meta strong {
    font-size: 14px;
    font-weight: 700;
}

.story-archive-viewer-meta span {
    font-size: 12px;
    opacity: 0.75;
}

.story-archive-viewer-menu-wrap {
    position: relative;
}

.story-archive-viewer-menu {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    z-index: 5;
    width: 230px;
    padding: 6px;
    background: #242526;
    border: 1px solid #3e4042;
    border-radius: 10px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
}

.story-archive-viewer-menu button {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 11px 12px;
    border: none;
    background: transparent;
    color: #e4e6eb;
    font-size: 14px;
    text-align: left;
    border-radius: 6px;
    cursor: pointer;
}

.story-archive-viewer-menu button:hover {
    background: #3a3b3c;
}

.story-archive-viewer-menu button svg {
    width: 17px;
    height: 17px;
    color: #b0b3b8;
}

.story-archive-viewer-stage {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 20px 30px 20px;
    min-height: 0;
}

.story-archive-viewer-stage img,
.story-archive-viewer-stage video {
    max-width: 100%;
    max-height: 100%;
    border-radius: 10px;
    object-fit: contain;
}

/* Modals */

.story-archive-modal {
    position: fixed;
    inset: 0;
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.6);
    padding: 16px;
}

.story-archive-modal-box {
    width: 100%;
    max-width: 420px;
    background: var(--card-bg, #ffffff);
    border-radius: 12px;
    padding: 22px;
}

.story-archive-modal-box h3 {
    margin: 0 0 8px 0;
    font-size: 17px;
    color: var(--text, #050505);
}

.story-archive-modal-box p {
    margin: 0 0 16px 0;
    font-size: 14px;
    color: var(--muted, #65676b);
    line-height: 1.5;
}

.story-archive-modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
}

.story-highlight-input {
    width: 100%;
    padding: 11px 12px;
    border: 1px solid var(--border, #ced0d4);
    border-radius: 8px;
    background: var(--input-bg, #f0f2f5);
    color: var(--text, #050505);
    font-size: 14px;
    outline: none;
    box-sizing: border-box;
    margin-bottom: 16px;
}

.story-highlight-input:focus {
    border-color: #1877f2;
}

.archive-btn {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 9px 16px;
    border: none;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    justify-content: center;
}

.archive-btn-cancel {
    background: var(--hover-bg, #e4e6eb);
    color: var(--text, #050505);
}

.archive-btn-danger {
    background: #e41e3f;
    color: #ffffff;
}

.archive-btn-danger:hover {
    background: #c91836;
}

.archive-btn-primary {
    background: #1877f2;
    color: #ffffff;
}

.archive-btn-primary:hover {
    background: #0e66d6;
}

.archive-sql-notice {
    grid-column: 1 / -1;
    background: #fff3cd;
    color: #856404;
    border: 1px solid #ffeaa7;
    border-radius: 10px;
    padding: 14px 16px;
    font-size: 14px;
    line-height: 1.5;
}

body.dark-mode .archive-sql-notice {
    background: #3a2f1d;
    color: #f7b928;
    border-color: #57431f;
}

@media (max-width: 700px) {
    .story-archive-grid {
        grid-template-columns: repeat(3, 1fr);
    }
}

`;

    document.head.appendChild(style);

    // ------------------------------------------
    // LOAD
    // ------------------------------------------

    async function socialhubStoryArchiveLoad() {

        var grid =
            document.getElementById("storyArchiveGrid");

        if (!grid) {

            return;
        }

        var me =
            await socialhubStoryGetMe();

        if (!me) {

            grid.innerHTML =
                '<p class="empty-message" style="grid-column:1/-1;">' +
                "Please log in to view your story archive." +
                "</p>";

            return;
        }

        grid.innerHTML =
            '<p class="empty-message" style="grid-column:1/-1;">' +
            "Loading story archive..." +
            "</p>";

        var {
            data: rows,
            error
        } = await db
            .from("stories")
            .select("id, media_url, media_type, caption, created_at")
            .eq("user_id", me.id)
            .eq("archived", true)
            .order("created_at", { ascending: false })
            .limit(60);

        if (error) {

            if (
                (error.message || "").indexOf("archived") !== -1
            ) {

                grid.innerHTML =
                    '<div class="archive-sql-notice">' +
                    "Story archive needs the database update. " +
                    "Run <strong>setup-all.sql</strong> in the Supabase SQL Editor, " +
                    "then refresh this page." +
                    "</div>";

            } else {

                grid.innerHTML =
                    '<p class="empty-message" style="grid-column:1/-1;">' +
                    "Could not load story archive." +
                    "</p>";
            }

            return;
        }

        var list =
            (rows || []).filter(function (story) {

                if (currentFilter === "all") {

                    return true;
                }

                return story.media_type === "image";
            });

        stories =
            list;

        if (list.length === 0) {

            grid.innerHTML =
                '<p class="empty-message" style="grid-column:1/-1;">' +
                "No stories in your archive yet." +
                "</p>";

            return;
        }

        grid.innerHTML =
            "";

        for (var i = 0; i < list.length; i++) {

            var story =
                list[i];

            var views =
                await socialhubStoryViews(story.id);

            var tile =
                document.createElement("button");

            tile.type =
                "button";

            tile.className =
                "story-tile";

            tile.innerHTML =
                (
                    story.media_type === "video"
                        ? '<video src="' + socialhubStoryEscape(story.media_url) +
                            '" muted playsinline preload="metadata"></video>'
                        : '<img src="' + socialhubStoryEscape(story.media_url) +
                            '" alt="Story" loading="lazy" />'
                ) +
                '<div class="story-tile-info">' +
                "<strong>" + socialhubStoryFormatDate(story.created_at) + "</strong>" +
                "<span>" + views + " view" + (views === 1 ? "" : "s") + "</span>" +
                "</div>";

            tile.addEventListener("click", function () {

                socialhubStoryViewerOpen(
                    list[this.__index]
                );
            });

            tile.__index =
                i;

            grid.appendChild(tile);
        }

        if (
            window.lucide &&
            typeof window.lucide.createIcons === "function"
        ) {

            window.lucide.createIcons();
        }
    }

    async function socialhubStoryViews(storyId) {

        var {
            count,
            error
        } = await db
            .from("story_views")
            .select("id", { count: "exact", head: true })
            .eq("story_id", storyId);

        if (error) {

            return 0;
        }

        return count || 0;
    }

    // ------------------------------------------
    // VIEWER
    // ------------------------------------------

    function socialhubStoryViewerOpen(story) {

        if (!story) {

            return;
        }

        viewerStory =
            story;

        var viewer =
            document.getElementById("storyArchiveViewer");

        var stage =
            document.getElementById("storyArchiveViewerStage");

        var dateEl =
            document.getElementById("storyArchiveViewerDate");

        var viewsEl =
            document.getElementById("storyArchiveViewerViews");

        dateEl.textContent =
            socialhubStoryFormatDate(story.created_at, true);

        socialhubStoryViews(story.id).then(function (views) {

            viewsEl.textContent =
                views + " view" + (views === 1 ? "" : "s");
        });

        stage.innerHTML =
            story.media_type === "video"
                ? '<video src="' + socialhubStoryEscape(story.media_url) +
                    '" controls autoplay playsinline></video>'
                : '<img src="' + socialhubStoryEscape(story.media_url) +
                    '" alt="Story" />';

        document
            .getElementById("storyArchiveViewerMenu")
            .style.display =
            "none";

        viewer.style.display =
            "flex";

        document.body.style.overflow =
            "hidden";
    }

    function socialhubStoryArchiveViewerClose() {

        viewerStory =
            null;

        var viewer =
            document.getElementById("storyArchiveViewer");

        viewer.style.display =
            "none";

        document
            .getElementById("storyArchiveViewerStage")
            .innerHTML =
            "";

        document.body.style.overflow =
            "";
    }

    function socialhubStoryArchiveToggleMenu(event) {

        event.stopPropagation();

        var menu =
            document.getElementById("storyArchiveViewerMenu");

        menu.style.display =
            menu.style.display === "none" ? "block" : "none";
    }

    document.addEventListener("click", function () {

        var menu =
            document.getElementById("storyArchiveViewerMenu");

        if (menu && menu.style.display !== "none") {

            menu.style.display =
                "none";
        }
    });

    function socialhubStoryArchiveSave() {

        if (!viewerStory) {

            return;
        }

        var a =
            document.createElement("a");

        a.href =
            viewerStory.media_url;

        a.download =
            "story-" + viewerStory.id;

        a.target =
            "_blank";

        document.body.appendChild(a);

        a.click();

        a.remove();

        socialhubStoryToast("Downloading story...", "info");
    }

    function socialhubStoryArchiveDeleteAsk() {

        pendingDeleteStory =
            viewerStory;

        socialhubStoryArchiveViewerClose();

        document
            .getElementById("storyDeleteModal")
            .style.display =
            "flex";
    }

    function socialhubStoryDeleteCancel() {

        pendingDeleteStory =
            null;

        document
            .getElementById("storyDeleteModal")
            .style.display =
            "none";
    }

    async function socialhubStoryDeleteConfirm() {

        var me =
            await socialhubStoryGetMe();

        var storyId =
            pendingDeleteStory
                ? pendingDeleteStory.id
                : null;

        if (!me || !storyId) {

            socialhubStoryDeleteCancel();

            return;
        }

        var {
            error
        } = await db
            .from("stories")
            .delete()
            .eq("id", storyId)
            .eq("user_id", me.id);

        socialhubStoryDeleteCancel();

        if (error) {

            socialhubStoryToast("Could not delete story.", "error");

            return;
        }

        socialhubStoryToast("Story deleted.", "success");

        socialhubStoryArchiveLoad();
    }

    // ------------------------------------------
    // ADD TO HIGHLIGHT
    // ------------------------------------------

    function socialhubStoryArchiveHighlightOpen() {

        document
            .getElementById("storyArchiveViewerMenu")
            .style.display =
            "none";

        document
            .getElementById("storyHighlightName")
            .value =
            "";

        document
            .getElementById("storyHighlightModal")
            .style.display =
            "flex";

        setTimeout(function () {

            document
                .getElementById("storyHighlightName")
                .focus();
        }, 60);
    }

    function socialhubStoryHighlightCancel() {

        document
            .getElementById("storyHighlightModal")
            .style.display =
            "none";
    }

    async function socialhubStoryHighlightCreate() {

        var me =
            await socialhubStoryGetMe();

        if (!me || !viewerStory) {

            socialhubStoryHighlightCancel();

            return;
        }

        var name =
            document
                .getElementById("storyHighlightName")
                .value
                .trim();

        if (!name) {

            socialhubStoryToast("Give the highlight a name.", "info");

            return;
        }

        var {
            error
        } = await db
            .from("highlights")
            .insert({

                user_id: me.id,
                name: name,
                cover_url: viewerStory.media_url,
                post_ids: []
            });

        socialhubStoryHighlightCancel();

        if (error) {

            socialhubStoryToast("Could not create highlight.", "error");

            return;
        }

        socialhubStoryToast("Highlight created!", "success");

        socialhubStoryArchiveViewerClose();
    }

    // ------------------------------------------
    // HELPERS
    // ------------------------------------------

    async function socialhubStoryGetMe() {

        var {
            data,
            error
        } = await supabaseClient.auth.getUser();

        if (error || !data.user) {

            return null;
        }

        return data.user;
    }

    function socialhubStoryEscape(text) {

        return String(text == null ? "" : text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function socialhubStoryFormatDate(value, full) {

        var date =
            new Date(value);

        if (isNaN(date.getTime())) {

            return "";
        }

        return date.toLocaleDateString(
            "en-GB",
            full
                ? {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                }
                : {
                    day: "numeric",
                    month: "short"
                }
        );
    }

    function socialhubStoryToast(message, type) {

        if (
            typeof socialhubToast === "function"
        ) {

            socialhubToast(message, type);

            return;
        }

        alert(message);
    }

    // ------------------------------------------
    // WIRE
    // ------------------------------------------

    document.addEventListener("DOMContentLoaded", function () {

        document
            .querySelectorAll(".story-archive-filters button")
            .forEach(function (btn) {

                btn.addEventListener("click", function () {

                    document
                        .querySelectorAll(".story-archive-filters button")
                        .forEach(function (other) {

                            other.classList.remove("active");
                        });

                    btn.classList.add("active");

                    currentFilter =
                        btn.getAttribute("data-story-filter");

                    socialhubStoryArchiveLoad();
                });
            });

        document
            .getElementById("storyDeleteModal")
            .addEventListener("click", function (event) {

                if (event.target === this) {

                    socialhubStoryDeleteCancel();
                }
            });

        document
            .getElementById("storyHighlightModal")
            .addEventListener("click", function (event) {

                if (event.target === this) {

                    socialhubStoryHighlightCancel();
                }
            });

        document
            .getElementById("storyHighlightName")
            .addEventListener("keydown", function (event) {

                if (event.key === "Enter") {

                    socialhubStoryHighlightCreate();
                }
            });

        document
            .getElementById("storyArchiveViewer")
            .addEventListener("click", function (event) {

                if (event.target === this) {

                    socialhubStoryArchiveViewerClose();
                }
            });

        document.addEventListener("keydown", function (event) {

            if (event.key !== "Escape") {

                return;
            }

            if (
                document.getElementById("storyDeleteModal").style.display !== "none"
            ) {

                socialhubStoryDeleteCancel();
            }

            if (
                document.getElementById("storyHighlightModal").style.display !== "none"
            ) {

                socialhubStoryHighlightCancel();
            }

            if (
                document.getElementById("storyArchiveViewer").style.display !== "none"
            ) {

                socialhubStoryArchiveViewerClose();
            }
        });

        if (
            window.lucide &&
            typeof window.lucide.createIcons === "function"
        ) {

            window.lucide.createIcons();
        }

        socialhubStoryArchiveLoad();
    });

})();