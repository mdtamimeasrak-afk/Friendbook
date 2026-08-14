// ======================================================
// ADMIN DASHBOARD (admin.html)
// Requires profiles.is_admin = true (set in Supabase)
// Lists reported posts; admin can delete posts or dismiss reports.
// ======================================================

(function () {

    function injectStyles() {

        const style = document.createElement("style");

        style.textContent = `

            .adm-section {
                background: #fff;
                border-radius: 12px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                padding: 16px;
                margin-bottom: 14px;
            }

            .adm-section-title {
                margin: 0 0 12px;
                font-size: 15px;
                font-weight: 800;
                color: #1c1e21;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .adm-section-title i {
                color: #9d00ff;
            }

            .adm-post {
                border: 1px solid #e4e6eb;
                border-radius: 10px;
                padding: 12px;
                margin-bottom: 12px;
            }

            .adm-post:last-child {
                margin-bottom: 0;
            }

            .adm-post-content {
                font-size: 13.5px;
                color: #1c1e21;
                white-space: pre-wrap;
                word-break: break-word;
                margin: 0 0 8px;
            }

            .adm-post-img {
                max-width: 100%;
                max-height: 200px;
                border-radius: 8px;
                margin-bottom: 8px;
                object-fit: cover;
            }

            .adm-report-list {
                margin: 0 0 10px;
                padding: 0;
                list-style: none;
            }

            .adm-report-list li {
                font-size: 12.5px;
                color: #65676b;
                padding: 3px 0;
            }

            .adm-report-list li strong {
                color: #1c1e21;
            }

            .adm-actions {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
            }

            .adm-delete {
                border: none;
                background: #e41e3f;
                color: #fff;
                padding: 8px 18px;
                border-radius: 20px;
                font-size: 13px;
                font-weight: 700;
                cursor: pointer;
            }

            .adm-dismiss {
                border: none;
                background: #e4e6eb;
                color: #1c1e21;
                padding: 8px 18px;
                border-radius: 20px;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
            }

            .adm-denied {
                background: #fff;
                border-radius: 12px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                padding: 28px 20px;
                text-align: center;
            }

            .adm-denied i {
                font-size: 34px;
                color: #e41e3f;
                display: block;
                margin-bottom: 10px;
            }

            .adm-denied p {
                margin: 0;
                color: #65676b;
                font-size: 14px;
            }

            .adm-badge {
                display: inline-block;
                background: #1b74e4;
                color: #fff;
                border-radius: 20px;
                padding: 4px 12px;
                font-size: 12px;
                font-weight: 700;
                margin-left: 6px;
            }

            body.dark-mode .adm-section,
            body.dark-mode .adm-denied {
                background: #242526;
            }

            body.dark-mode .adm-section-title,
            body.dark-mode .adm-post-content {
                color: #e4e6eb;
            }

            body.dark-mode .adm-post {
                border-color: #3a3b3c;
            }

            body.dark-mode .adm-report-list li,
            body.dark-mode .adm-denied p {
                color: #b0b3b8;
            }

            body.dark-mode .adm-report-list li strong {
                color: #e4e6eb;
            }

            body.dark-mode .adm-dismiss {
                background: #3a3b3c;
                color: #e4e6eb;
            }

        `;

        document.head.appendChild(style);
    }


    function admEscape(text) {

        const div = document.createElement("div");

        div.textContent = text || "";

        return div.innerHTML;
    }


    function admToast(message) {

        const toast = document.createElement("div");

        toast.style.cssText =
            "position:fixed;bottom:24px;left:50%;transform:translateX(-50%);" +
            "background:#1c1e21;color:#fff;padding:12px 20px;border-radius:22px;" +
            "font-size:14px;font-weight:600;z-index:100001;box-shadow:0 6px 24px rgba(0,0,0,0.3);";

        toast.textContent = message;

        document.body.appendChild(toast);

        setTimeout(() => toast.remove(), 2400);
    }


    async function admLoad() {

        injectStyles();

        const body =
            document.getElementById("adminBody");

        if (!body) {
            return;
        }

        const { data: authData } = await db.auth.getUser();

        const me = authData && authData.user;

        if (!me) {

            body.innerHTML = `
                <div class="adm-section">
                    <p class="empty-message" style="margin:0;">Please login to open the admin dashboard.</p>
                </div>
            `;

            return;
        }

        const { data: profile } = await db
            .from("profiles")
            .select("id, full_name, is_admin")
            .eq("id", me.id)
            .maybeSingle();

        if (!profile || profile.is_admin !== true) {

            body.innerHTML = `
                <div class="adm-denied">
                    <i class="fa-solid fa-ban"></i>
                    <p>You don't have permission to view this page.<br>
                    Only TRIYA admins can access the dashboard.</p>
                </div>
            `;

            return;
        }

        // Load all reports (admin policy 6.6)
        const { data: reports, error } = await db
            .from("reports")
            .select("id, reason, created_at, post_id, reporter_id")
            .order("created_at", { ascending: false })
            .limit(200);

        if (error) {

            body.innerHTML = `
                <div class="adm-section">
                    <p class="empty-message" style="margin:0;">Could not load reports: ${admEscape(error.message)}</p>
                </div>
            `;

            return;
        }

        if (!reports || reports.length === 0) {

            body.innerHTML = `
                <div class="adm-section">
                    <p class="empty-message" style="margin:0;">
                        No reports yet — the community is behaving! 🎉
                    </p>
                </div>
            `;

            return;
        }

        // Group reports by post
        const byPost = new Map();

        reports.forEach(report => {

            const key = report.post_id || "none";

            if (!byPost.has(key)) {
                byPost.set(key, []);
            }

            byPost.get(key).push(report);
        });

        const postIds = [...byPost.keys()].filter(id => id !== "none");

        const postMap = {};

        if (postIds.length > 0) {

            const { data: posts } = await db
                .from("posts")
                .select("id, content, image_url, created_at, user_id")
                .in("id", postIds);

            (posts || []).forEach(p => {
                postMap[p.id] = p;
            });
        }

        const userIds = [...new Set([
            ...reports.map(r => r.reporter_id),
            ...Object.values(postMap).map(p => p.user_id)
        ])];

        const profileMap = {};

        if (userIds.length > 0) {

            const { data: profiles } = await db
                .from("profiles")
                .select("id, full_name, username")
                .in("id", userIds);

            (profiles || []).forEach(p => {
                profileMap[p.id] = p;
            });
        }

        let html =
            `<div class="adm-section">
                <h3 class="adm-section-title">
                    <i class="fa-solid fa-flag"></i>
                    Reported Content (${reports.length} reports on ${byPost.size} posts)
                    <span class="adm-badge">ADMIN</span>
                </h3>
            `;

        for (const [postId, list] of byPost) {

            const post = postMap[postId];

            if (!post && postId !== "none") {
                continue;
            }

            if (postId === "none") {

                html += `
                    <div class="adm-post">
                        <p class="adm-post-content"><i>Report without a post (deleted or unknown).</i></p>
                `;

            } else {

                const owner = profileMap[post.user_id] || {};

                html += `
                    <div class="adm-post" data-post="${postId}">
                        <p class="adm-post-content">${admEscape(post.content || "(Image post)")}</p>
                `;

                if (post.image_url) {

                    html +=
                        `<img class="adm-post-img" src="${admEscape(post.image_url)}" alt="">`;
                }

                html +=
                    `<div class="adm-report-list"><li><strong>Post owner:</strong> ${admEscape(owner.full_name || "Unknown")}</li></div>`;
            }

            html += `<ul class="adm-report-list">`;

            list.forEach(report => {

                const reporter = profileMap[report.reporter_id] || {};

                html += `
                    <li>
                        <strong>${admEscape(reporter.full_name || "Unknown")}:</strong>
                        ${admEscape(report.reason)}
                    </li>
                `;
            });

            html += `</ul>`;

            html += `
                <div class="adm-actions">
                    <button class="adm-delete" type="button" data-post="${admEscape(postId)}">Delete Post</button>
                    <button class="adm-dismiss" type="button" data-post="${admEscape(postId)}">Dismiss Reports</button>
                </div>
            </div>
            `;
        }

        html += `</div>`;

        body.innerHTML = html;

        // Delete post (reports cascade via FK)
        body.querySelectorAll(".adm-delete").forEach(btn => {

            btn.addEventListener("click", async () => {

                const postId = btn.dataset.post;

                if (!postId || postId === "none") {
                    return;
                }

                const { error } = await db
                    .from("posts")
                    .delete()
                    .eq("id", postId);

                if (error) {

                    admToast("Could not delete: " + error.message);

                    return;
                }

                admToast("Post deleted.");

                btn.closest(".adm-post").remove();

                if (!body.querySelector(".adm-post")) {

                    body.innerHTML = `
                        <div class="adm-section">
                            <p class="empty-message" style="margin:0;">No pending reports.</p>
                        </div>
                    `;
                }
            });
        });

        // Dismiss reports (keep the post)
        body.querySelectorAll(".adm-dismiss").forEach(btn => {

            btn.addEventListener("click", async () => {

                const postId = btn.dataset.post;

                const query = db
                    .from("reports")
                    .delete();

                if (postId && postId !== "none") {

                    query.eq("post_id", postId);

                } else {

                    query.is("post_id", null);
                }

                const { error } = await query;

                if (error) {

                    admToast("Could not dismiss: " + error.message);

                    return;
                }

                admToast("Reports dismissed.");

                btn.closest(".adm-post").remove();

                if (!body.querySelector(".adm-post")) {

                    body.innerHTML = `
                        <div class="adm-section">
                            <p class="empty-message" style="margin:0;">No pending reports.</p>
                        </div>
                    `;
                }
            });
        });
    }


    document.addEventListener("DOMContentLoaded", () => {

        admLoad();
    });

})();