// ======================================================
// ARCHIVE.JS
// archive.html -> archived posts management.
// Posts with archived = true (column added in setup-all.sql).
// Restore returns a post to the profile; Delete removes it.
// ======================================================

(function () {

    if (!document.getElementById("archiveGrid")) {

        return;
    }

    var db = window.db || supabaseClient;

    var currentFilter =
        "all";

    var pendingDelete =
        null;

    // ------------------------------------------
    // STYLES (self-contained)
    // ------------------------------------------

    var style =
        document.createElement("style");

    style.textContent = `

.archive-main {
    max-width: 900px;
    margin: 0 auto;
    padding: 18px 14px 40px;
}

.archive-head {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 4px;
}

.archive-back {
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

.archive-back svg {
    width: 19px;
    height: 19px;
}

.archive-head h1 {
    font-size: 24px;
    font-weight: 800;
    margin: 0;
    color: var(--text, #050505);
}

.archive-sub {
    color: var(--muted, #65676b);
    font-size: 14px;
    margin: 2px 0 0 0;
}

.archive-filters {
    display: flex;
    gap: 8px;
    margin: 18px 0 16px 0;
}

.archive-filters button {
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

.archive-filters button:hover {
    background: #e4e6eb;
}

.archive-filters button.active {
    background: #1877f2;
    color: #ffffff;
}

.archive-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
}

.archive-card {
    background: var(--card-bg, #ffffff);
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    display: flex;
    flex-direction: column;
}

.archive-card-media {
    width: 100%;
    aspect-ratio: 4 / 3;
    object-fit: cover;
    background: #d8dadf;
}

.archive-card-text {
    padding: 14px;
    min-height: 110px;
    background: #e7f3ff;
    color: #1c1e21;
    font-size: 14px;
    line-height: 1.45;
    display: flex;
    align-items: center;
    word-break: break-word;
}

.archive-card-body {
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    flex: 1;
}

.archive-card-content {
    color: var(--text, #050505);
    font-size: 14px;
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.archive-card-date {
    color: var(--muted, #65676b);
    font-size: 12px;
}

.archive-card-actions {
    display: flex;
    gap: 8px;
    margin-top: auto;
}

.archive-btn {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 8px 12px;
    border: none;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    flex: 1;
    justify-content: center;
}

.archive-btn svg {
    width: 14px;
    height: 14px;
}

.archive-btn-restore {
    background: #e7f3ff;
    color: #1877f2;
}

.archive-btn-restore:hover {
    background: #dbe7fd;
}

.archive-btn-delete {
    background: #fde7eb;
    color: #e41e3f;
}

.archive-btn-delete:hover {
    background: #fbd3da;
}

body.dark-mode .archive-btn-restore {
    background: #1d2f4d;
    color: #6db1ff;
}

body.dark-mode .archive-btn-restore:hover {
    background: #243c63;
}

body.dark-mode .archive-btn-delete {
    background: #4a1f2b;
    color: #ff7b93;
}

body.dark-mode .archive-btn-delete:hover {
    background: #5c2634;
}

body.dark-mode .archive-card-text {
    background: #1d2f4d;
    color: #e4e6eb;
}

.archive-modal {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.6);
    padding: 16px;
}

.archive-modal-box {
    width: 100%;
    max-width: 420px;
    background: var(--card-bg, #ffffff);
    border-radius: 12px;
    padding: 22px;
}

.archive-modal-box h3 {
    margin: 0 0 8px 0;
    font-size: 17px;
    color: var(--text, #050505);
}

.archive-modal-box p {
    margin: 0 0 18px 0;
    font-size: 14px;
    color: var(--muted, #65676b);
    line-height: 1.5;
}

.archive-modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
}

.archive-btn-cancel {
    background: var(--hover-bg, #e4e6eb);
    color: var(--text, #050505);
    flex: none;
    padding: 9px 16px;
}

.archive-btn-danger {
    background: #e41e3f;
    color: #ffffff;
    flex: none;
    padding: 9px 16px;
}

.archive-btn-danger:hover {
    background: #c91836;
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
    .archive-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

`;

    document.head.appendChild(style);

    // ------------------------------------------
    // LOAD
    // ------------------------------------------

    async function socialhubArchiveLoad() {

        var grid =
            document.getElementById("archiveGrid");

        if (!grid) {

            return;
        }

        var me =
            await socialhubArchiveGetMe();

        if (!me) {

            grid.innerHTML =
                '<p class="empty-message" style="grid-column:1/-1;">' +
                "Please log in to view your archive." +
                "</p>";

            return;
        }

        grid.innerHTML =
            '<p class="empty-message" style="grid-column:1/-1;">' +
            "Loading archive..." +
            "</p>";

        var {
            data: posts,
            error
        } = await db
            .from("posts")
            .select("id, content, image_url, video_url, created_at")
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
                    "Archive needs the database update. " +
                    "Run <strong>setup-all.sql</strong> in the Supabase SQL Editor, " +
                    "then refresh this page." +
                    "</div>";

            } else {

                grid.innerHTML =
                    '<p class="empty-message" style="grid-column:1/-1;">' +
                    "Could not load archive." +
                    "</p>";
            }

            return;
        }

        var list =
            (posts || []).filter(function (post) {

                if (currentFilter === "all") {

                    return true;
                }

                if (currentFilter === "photos") {

                    return Boolean(post.image_url);
                }

                if (currentFilter === "videos") {

                    return Boolean(post.video_url);
                }

                return !post.image_url && !post.video_url;
            });

        if (list.length === 0) {

            grid.innerHTML =
                '<p class="empty-message" style="grid-column:1/-1;">' +
                "Nothing in your archive yet." +
                "</p>";

            return;
        }

        grid.innerHTML =
            "";

        list.forEach(function (post) {

            var card =
                document.createElement("div");

            card.className =
                "archive-card";

            var media =
                "";

            if (post.image_url) {

                media =
                    '<img class="archive-card-media" src="' +
                    socialhubArchiveEscape(post.image_url) +
                    '" alt="Archived photo" loading="lazy" />';

            } else if (post.video_url) {

                media =
                    '<video class="archive-card-media" src="' +
                    socialhubArchiveEscape(post.video_url) +
                    '" muted playsinline preload="metadata"></video>';

            } else {

                media =
                    '<div class="archive-card-text">' +
                    socialhubArchiveEscape(
                        (post.content || "").slice(0, 140)
                    ) +
                    "</div>";
            }

            card.innerHTML =
                media +
                '<div class="archive-card-body">' +
                '<p class="archive-card-content">' +
                socialhubArchiveEscape(post.content || "") +
                "</p>" +
                '<span class="archive-card-date">' +
                socialhubArchiveFormatDate(post.created_at) +
                "</span>" +
                '<div class="archive-card-actions">' +
                '<button type="button" class="archive-btn archive-btn-restore">' +
                '<i data-lucide="rotate-ccw"></i> Restore' +
                "</button>" +
                '<button type="button" class="archive-btn archive-btn-delete">' +
                '<i data-lucide="trash-2"></i> Delete' +
                "</button>" +
                "</div>" +
                "</div>";

            card
                .querySelector(".archive-btn-restore")
                .addEventListener("click", function () {

                    socialhubArchiveRestore(post.id);
                });

            card
                .querySelector(".archive-btn-delete")
                .addEventListener("click", function () {

                    pendingDelete =
                        post.id;

                    document
                        .getElementById("archiveDeleteModal")
                        .style.display =
                        "flex";
                });

            grid.appendChild(card);
        });

        if (
            window.lucide &&
            typeof window.lucide.createIcons === "function"
        ) {

            window.lucide.createIcons();
        }
    }

    async function socialhubArchiveRestore(postId) {

        var me =
            await socialhubArchiveGetMe();

        if (!me) {

            return;
        }

        var {
            error
        } = await db
            .from("posts")
            .update({ archived: false })
            .eq("id", postId)
            .eq("user_id", me.id);

        if (error) {

            socialhubArchiveToast("Could not restore.", "error");

            return;
        }

        socialhubArchiveToast("Post restored to your profile.", "success");

        socialhubArchiveLoad();
    }

    function socialhubArchiveConfirmClose() {

        pendingDelete =
            null;

        document
            .getElementById("archiveDeleteModal")
            .style.display =
            "none";
    }

    async function socialhubArchiveConfirmDelete() {

        var postId =
            pendingDelete;

        var me =
            await socialhubArchiveGetMe();

        if (!me || !postId) {

            return;
        }

        var {
            error
        } = await db
            .from("posts")
            .delete()
            .eq("id", postId)
            .eq("user_id", me.id);

        socialhubArchiveConfirmClose();

        if (error) {

            socialhubArchiveToast("Could not delete.", "error");

            return;
        }

        socialhubArchiveToast("Post deleted.", "success");

        socialhubArchiveLoad();
    }

    // ------------------------------------------
    // HELPERS
    // ------------------------------------------

    async function socialhubArchiveGetMe() {

        var {
            data,
            error
        } = await supabaseClient.auth.getUser();

        if (error || !data.user) {

            return null;
        }

        return data.user;
    }

    function socialhubArchiveEscape(text) {

        return String(text == null ? "" : text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function socialhubArchiveFormatDate(value) {

        var date =
            new Date(value);

        if (isNaN(date.getTime())) {

            return "";
        }

        return date.toLocaleDateString(
            "en-GB",
            {
                day: "numeric",
                month: "short",
                year: "numeric"
            }
        );
    }

    function socialhubArchiveToast(message, type) {

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
            .querySelectorAll(".archive-filters button")
            .forEach(function (btn) {

                btn.addEventListener("click", function () {

                    document
                        .querySelectorAll(".archive-filters button")
                        .forEach(function (other) {

                            other.classList.remove("active");
                        });

                    btn.classList.add("active");

                    currentFilter =
                        btn.getAttribute("data-arch-filter");

                    socialhubArchiveLoad();
                });
            });

        document
            .getElementById("archiveDeleteModal")
            .addEventListener("click", function (event) {

                if (event.target === this) {

                    socialhubArchiveConfirmClose();
                }
            });

        document.addEventListener("keydown", function (event) {

            if (
                event.key === "Escape" &&
                document.getElementById("archiveDeleteModal").style.display !== "none"
            ) {

                socialhubArchiveConfirmClose();
            }
        });

        if (
            window.lucide &&
            typeof window.lucide.createIcons === "function"
        ) {

            window.lucide.createIcons();
        }

        socialhubArchiveLoad();
    });

})();