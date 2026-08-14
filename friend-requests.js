// ======================================================
// FRIEND REQUESTS page (friend-requests.html)
// Incoming requests + sent requests
// ======================================================

(function () {

    function injectStyles() {

        const style = document.createElement("style");

        style.textContent = `

            .fr-section {
                background: #fff;
                border-radius: 12px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                padding: 16px;
                margin-bottom: 14px;
            }

            .fr-section-title {
                margin: 0 0 10px;
                font-size: 15px;
                font-weight: 800;
                color: #1c1e21;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .fr-section-title i {
                color: #9d00ff;
            }

            .fr-card {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 10px 0;
                border-bottom: 1px solid #f0f2f5;
            }

            .fr-card:last-child {
                border-bottom: none;
            }

            .fr-avatar {
                width: 52px;
                height: 52px;
                border-radius: 50%;
                object-fit: cover;
                background: #e4e6eb;
                color: #65676b;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 800;
                font-size: 20px;
                overflow: hidden;
                flex-shrink: 0;
            }

            .fr-avatar img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }

            .fr-info {
                flex: 1;
                min-width: 0;
            }

            .fr-name {
                font-size: 14.5px;
                font-weight: 700;
                color: #1c1e21;
                text-decoration: none;
                display: block;
            }

            .fr-name:hover {
                text-decoration: underline;
            }

            .fr-meta {
                font-size: 12.5px;
                color: #65676b;
            }

            .fr-actions {
                display: flex;
                gap: 8px;
                flex-shrink: 0;
            }

            .fr-accept {
                border: none;
                background: #1b74e4;
                color: #fff;
                padding: 8px 18px;
                border-radius: 20px;
                font-size: 13px;
                font-weight: 700;
                cursor: pointer;
            }

            .fr-decline,
            .fr-cancel {
                border: none;
                background: #e4e6eb;
                color: #1c1e21;
                padding: 8px 18px;
                border-radius: 20px;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
            }

            .fr-accept:hover {
                background: #1871d8;
            }

            .fr-decline:hover,
            .fr-cancel:hover {
                background: #d8dadf;
            }

            body.dark-mode .fr-section {
                background: #242526;
            }

            body.dark-mode .fr-section-title,
            body.dark-mode .fr-name {
                color: #e4e6eb;
            }

            body.dark-mode .fr-card {
                border-bottom-color: #3a3b3c;
            }

            body.dark-mode .fr-meta {
                color: #b0b3b8;
            }

            body.dark-mode .fr-avatar {
                background: #3a3b3c;
                color: #b0b3b8;
            }

            body.dark-mode .fr-decline,
            body.dark-mode .fr-cancel {
                background: #3a3b3c;
                color: #e4e6eb;
            }

        `;

        document.head.appendChild(style);
    }


    function socialhubFrEscape(text) {

        const div = document.createElement("div");

        div.textContent = text || "";

        return div.innerHTML;
    }


    function socialhubFrAvatar(profile) {

        if (profile && profile.avatar_url) {

            return `<img class="fr-avatar" src="${socialhubFrEscape(profile.avatar_url)}" alt="">`;
        }

        const letter = (profile && profile.full_name || "U").charAt(0).toUpperCase();

        return `<div class="fr-avatar">${letter}</div>`;
    }


    async function socialhubLoadRequests() {

        injectStyles();

        const body =
            document.getElementById("requestsBody");

        if (!body) {
            return;
        }

        const { data: authData } = await db.auth.getUser();

        const me = authData && authData.user;

        if (!me) {

            body.innerHTML =
                '<p class="empty-message">Please login to see your friend requests.</p>';

            return;
        }

        // Incoming pending requests
        const { data: incoming } = await db
            .from("friendships")
            .select("requester_id, created_at")
            .eq("addressee_id", me.id)
            .eq("status", "pending")
            .order("created_at", { ascending: false });

        // Sent pending requests
        const { data: sent } = await db
            .from("friendships")
            .select("addressee_id, created_at")
            .eq("requester_id", me.id)
            .eq("status", "pending")
            .order("created_at", { ascending: false });

        const ids = [
            ...new Set([
                ...(incoming || []).map(r => r.requester_id),
                ...(sent || []).map(r => r.addressee_id)
            ])
        ];

        const profileMap = {};

        if (ids.length > 0) {

            const { data: profiles } = await db
                .from("profiles")
                .select("id, full_name, username, avatar_url")
                .in("id", ids);

            (profiles || []).forEach(p => {
                profileMap[p.id] = p;
            });
        }

        if ((!incoming || incoming.length === 0) && (!sent || sent.length === 0)) {

            body.innerHTML = `
                <div class="fr-section">
                    <p class="empty-message" style="margin:0;">
                        You have no pending friend requests.
                    </p>
                </div>
            `;

            return;
        }

        let html = "";

        if (incoming && incoming.length > 0) {

            html += `
                <div class="fr-section">
                    <h3 class="fr-section-title">
                        <i class="fa-solid fa-inbox"></i>
                        Incoming (${incoming.length})
                    </h3>
            `;

            incoming.forEach(request => {

                const profile = profileMap[request.requester_id] || {};

                html += `
                    <div class="fr-card" data-uid="${request.requester_id}">
                        ${socialhubFrAvatar(profile)}
                        <div class="fr-info">
                            <a class="fr-name" href="user-profile.html?user=${request.requester_id}">
                                ${socialhubFrEscape(profile.full_name || "@" + (profile.username || "user"))}
                            </a>
                            <div class="fr-meta">Wants to be your friend</div>
                        </div>
                        <div class="fr-actions">
                            <button class="fr-accept" type="button">Confirm</button>
                            <button class="fr-decline" type="button">Delete</button>
                        </div>
                    </div>
                `;
            });

            html += `</div>`;
        }

        if (sent && sent.length > 0) {

            html += `
                <div class="fr-section">
                    <h3 class="fr-section-title">
                        <i class="fa-solid fa-paper-plane"></i>
                        Sent (${sent.length})
                    </h3>
            `;

            sent.forEach(request => {

                const profile = profileMap[request.addressee_id] || {};

                html += `
                    <div class="fr-card" data-uid="${request.addressee_id}">
                        ${socialhubFrAvatar(profile)}
                        <div class="fr-info">
                            <a class="fr-name" href="user-profile.html?user=${request.addressee_id}">
                                ${socialhubFrEscape(profile.full_name || "@" + (profile.username || "user"))}
                            </a>
                            <div class="fr-meta">Request sent</div>
                        </div>
                        <div class="fr-actions">
                            <button class="fr-cancel" type="button">Cancel Request</button>
                        </div>
                    </div>
                `;
            });

            html += `</div>`;
        }

        body.innerHTML = html;

        // Accept
        body.querySelectorAll(".fr-accept").forEach(btn => {

            btn.addEventListener("click", async () => {

                const card =
                    btn.closest(".fr-card");

                const uid =
                    card.dataset.uid;

                if (typeof socialhubAcceptFriend === "function") {

                    await socialhubAcceptFriend(uid, btn);
                }

                card.remove();

                const remaining =
                    body.querySelectorAll(".fr-card").length;

                if (remaining === 0) {

                    body.innerHTML = `
                        <div class="fr-section">
                            <p class="empty-message" style="margin:0;">
                                You have no pending friend requests.
                            </p>
                        </div>
                    `;
                }
            });
        });

        // Decline
        body.querySelectorAll(".fr-decline").forEach(btn => {

            btn.addEventListener("click", async () => {

                const card =
                    btn.closest(".fr-card");

                const uid =
                    card.dataset.uid;

                if (typeof socialhubDeclineFriend === "function") {

                    await socialhubDeclineFriend(uid, btn);
                }

                card.remove();

                const remaining =
                    body.querySelectorAll(".fr-card").length;

                if (remaining === 0) {

                    body.innerHTML = `
                        <div class="fr-section">
                            <p class="empty-message" style="margin:0;">
                                You have no pending friend requests.
                            </p>
                        </div>
                    `;
                }
            });
        });

        // Cancel sent request
        body.querySelectorAll(".fr-cancel").forEach(btn => {

            btn.addEventListener("click", async () => {

                const card =
                    btn.closest(".fr-card");

                const uid =
                    card.dataset.uid;

                const { data: authData } = await db.auth.getUser();

                const me = authData && authData.user;

                if (!me) {
                    return;
                }

                await db
                    .from("friendships")
                    .delete()
                    .eq("requester_id", me.id)
                    .eq("addressee_id", uid);

                card.remove();

                const remaining =
                    body.querySelectorAll(".fr-card").length;

                if (remaining === 0) {

                    body.innerHTML = `
                        <div class="fr-section">
                            <p class="empty-message" style="margin:0;">
                                You have no pending friend requests.
                            </p>
                        </div>
                    `;
                }
            });
        });
    }


    document.addEventListener("DOMContentLoaded", () => {

        socialhubLoadRequests();
    });

})();