// ======================================================
// SOCIALHUB - NOTIFICATIONS (STEP 15)
// ======================================================
// This is a NEW file. Old code is untouched.
//
// What it does:
//   1. The topbar 🔔 button opens a Notifications
//      panel with an unread count badge.
//   2. socialhubNotify() creates a notification:
//      - like / comment on your post
//      - friend request sent to you
//      - friend request accepted
//   3. Clicking a notification marks it read and
//      opens the right page. "Mark all read" button
//      is included.
//
// Setup:
//   - Run the SQL below once in the Supabase SQL Editor:
//
//     create table if not exists public.notifications (
//       id uuid primary key default gen_random_uuid(),
//       user_id uuid not null references auth.users(id) on delete cascade,
//       actor_id uuid not null references auth.users(id) on delete cascade,
//       type text not null,
//       post_id uuid references public.posts(id) on delete cascade,
//       content text,
//       is_read boolean not null default false,
//       created_at timestamptz not null default now()
//     );
//
//     alter table public.notifications enable row level security;
//
//     create policy "notifications_select" on public.notifications
//       for select using (auth.uid() = user_id);
//
//     create policy "notifications_insert" on public.notifications
//       for insert with check (auth.uid() = actor_id);
//
//     create policy "notifications_update" on public.notifications
//       for update using (auth.uid() = user_id);
//
//     create policy "notifications_delete" on public.notifications
//       for delete using (auth.uid() = user_id);
//
//     create index if not exists notifications_user_idx
//       on public.notifications (user_id, created_at desc);
//
//   - Add this script to index.html, profile.html,
//     user-profile.html and search.html AFTER
//     friends.js:
//
//     <script src="notifications.js"></script>
// ======================================================

var db = window.db || supabaseClient;


// ======================================================
// 1. INJECTED STYLES
// ======================================================

(function socialhubNotificationsInjectStyles() {

    const style =
        document.createElement("style");

    style.textContent = `

.top-icons button[title="Notifications"] {
    position: relative;
}

.socialhub-notif-badge {
    position: absolute;
    top: -2px;
    right: -2px;
    min-width: 17px;
    height: 17px;
    padding: 0 4px;
    border-radius: 10px;
    background: #fa3e3e;
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    display: none;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
}

.socialhub-notif-badge.visible {
    display: flex;
}

.socialhub-notif-modal {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    z-index: 9999;
}

.socialhub-notif-box {
    width: 100%;
    max-width: 440px;
    max-height: 85vh;
    overflow-y: auto;
    background: var(--card-bg, #ffffff);
    border-radius: 14px;
    padding: 22px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
}

.socialhub-notif-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
}

.socialhub-notif-header h2 {
    margin: 0;
    font-size: 22px;
}

.socialhub-notif-header-actions {
    display: flex;
    gap: 6px;
    align-items: center;
}

.socialhub-notif-close {
    width: 36px;
    height: 36px;
    border: none;
    border-radius: 50%;
    background: #e4e6eb;
    cursor: pointer;
    font-size: 17px;
}

.socialhub-notif-mark-all {
    border: none;
    border-radius: 8px;
    padding: 8px 12px;
    background: #e7f3ff;
    color: #1877f2;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
}

.socialhub-notif-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.socialhub-notif-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px;
    border-radius: 10px;
    cursor: pointer;
    background: var(--hover, #f2f3f5);
}

.socialhub-notif-item.unread {
    background: #e7f3ff;
}

.socialhub-notif-item .avatar {
    width: 40px;
    height: 40px;
    font-size: 19px;
    flex-shrink: 0;
}

.socialhub-notif-text {
    flex: 1;
    min-width: 0;
}

.socialhub-notif-text p {
    margin: 0;
    font-size: 13px;
    line-height: 1.4;
}

.socialhub-notif-text small {
    color: var(--muted, #65676b);
    font-size: 11px;
    margin-top: 3px;
    display: block;
}

.socialhub-notif-dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: #1877f2;
    flex-shrink: 0;
}

body.dark-mode .socialhub-notif-close,
body.dark-mode .socialhub-notif-mark-all {
    background: #3a3b3c;
}

body.dark-mode .socialhub-notif-box {
    border: 1px solid var(--border, #3e4042);
}

body.dark-mode .socialhub-notif-item.unread {
    background: #26334d;
}

body.dark-mode .socialhub-notif-item.unread .socialhub-notif-text p,
body.dark-mode .socialhub-notif-text p {
    color: #e4e6eb;
}

body.dark-mode .socialhub-notif-mark-all {
    background: #26334d;
    color: #6ea8ff;
}
`;

    document.head.appendChild(style);

})();


// ======================================================
// 2. HELPERS
// ======================================================

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


function socialhubRelativeTime(date) {

    const seconds =
        Math.floor(
            (Date.now() - new Date(date).getTime()) / 1000
        );

    if (seconds < 60) {

        return "just now";
    }

    const minutes =
        Math.floor(seconds / 60);

    if (minutes < 60) {

        return `${minutes}m ago`;
    }

    const hours =
        Math.floor(minutes / 60);

    if (hours < 24) {

        return `${hours}h ago`;
    }

    const days =
        Math.floor(hours / 24);

    if (days < 7) {

        return `${days}d ago`;
    }

    return new Date(date).toLocaleDateString();
}


// ======================================================
// 3. CREATE A NOTIFICATION
// ======================================================
// Called from likes-comments.js and friends.js.

async function socialhubNotify(userId, actorId, type, postId, content) {

    if (
        !userId ||
        !actorId ||
        userId === actorId
    ) {

        return;
    }

    try {

        const {
            error
        } = await db
            .from("notifications")
            .insert({
                user_id: userId,
                actor_id: actorId,
                type: type || "general",
                post_id: postId || null,
                content: content || null
            });

        if (error) {

            console.error(
                "❌ Notification insert error:",
                error
            );
        }

    } catch (error) {

        console.error(
            "❌ Notification error:",
            error
        );
    }
}


// ======================================================
// 4. FETCH NOTIFICATIONS
// ======================================================

async function socialhubFetchNotifications() {

    const me =
        await socialhubGetMe();

    if (!me) {

        return { list: [], profileMap: new Map() };
    }

    const {
        data: list,
        error
    } = await db
        .from("notifications")
        .select("*")
        .eq("user_id", me.id)
        .order("created_at", {
            ascending: false
        })
        .limit(30);

    if (error) {

        console.error(
            "❌ Fetch notifications error:",
            error
        );

        return { list: [], profileMap: new Map() };
    }

    // Actor profiles
    const actorIds = [
        ...new Set(
            (list || [])
                .map(item => item.actor_id)
                .filter(Boolean)
        )
    ];

    let profiles = [];

    if (actorIds.length > 0) {

        const {
            data,
            error: profileError
        } = await db
            .from("profiles")
            .select("id, full_name, username, avatar_url")
            .in("id", actorIds);

        if (!profileError && data) {

            profiles = data;
        }
    }

    const profileMap = new Map();

    profiles.forEach(profile => {

        profileMap.set(profile.id, profile);
    });

    return { list: list || [], profileMap: profileMap };
}


// ======================================================
// 5. NOTIFICATION TEXT
// ======================================================

function socialhubNotificationText(notification, profile) {

    const name =
        profile?.full_name || "Someone";

    switch (notification.type) {

        case "like":
            return `${name} liked your post`;

        case "comment":
            return `${name} commented: "${
                (notification.content || "").slice(0, 80)
            }"`;

        case "friend_request":
            return `${name} sent you a friend request`;

        case "friend_accepted":
            return `${name} accepted your friend request`;

        case "group_invite":
            return `${name} invited you to join their group`;

        case "event_invite":
            return `${name} invited you to an event`;

        default:
            return `${name} interacted with you`;
    }
}


function socialhubNotificationTarget(notification) {

    if (
        notification.type === "friend_request" ||
        notification.type === "friend_accepted"
    ) {

        return `user-profile.html?user=${notification.actor_id}`;
    }

    if (notification.type === "group_invite") {

        return "groups.html";
    }

    if (notification.type === "event_invite") {

        return "events.html";
    }

    // like / comment -> the home feed
    return "index.html";
}


// ======================================================
// 6. NOTIFICATIONS PANEL
// ======================================================

async function socialhubOpenNotifications() {

    const existing =
        document.querySelector(".socialhub-notif-modal");

    if (existing) {
        existing.remove();
    }

    const modal =
        document.createElement("div");

    modal.className = "socialhub-notif-modal";

    modal.innerHTML = `

        <div class="socialhub-notif-box">

            <div class="socialhub-notif-header">

                <h2>Notifications</h2>

                <div class="socialhub-notif-header-actions">

                    <button
                        type="button"
                        class="socialhub-notif-mark-all"
                    >
                        Mark all read
                    </button>

                    <button
                        type="button"
                        class="socialhub-notif-close"
                    >
                        ✕
                    </button>

                </div>

            </div>

            <div class="socialhub-notif-list">

                <p class="empty-message">
                    Loading...
                </p>

            </div>

        </div>
    `;

    document.body.appendChild(modal);

    modal
        .querySelector(".socialhub-notif-close")
        .addEventListener("click", () => {

            modal.remove();

            socialhubUpdateNotifBadge();
        });

    modal.addEventListener("click", event => {

        if (event.target === modal) {

            modal.remove();

            socialhubUpdateNotifBadge();
        }
    });

    modal
        .querySelector(".socialhub-notif-mark-all")
        .addEventListener("click", async () => {

            const me =
                await socialhubGetMe();

            if (me) {

                await db
                    .from("notifications")
                    .update({ is_read: true })
                    .eq("user_id", me.id)
                    .eq("is_read", false);
            }

            socialhubRenderNotificationList(modal);
        });

    await socialhubRenderNotificationList(modal);
}


async function socialhubRenderNotificationList(modal) {

    const list =
        modal.querySelector(".socialhub-notif-list");

    list.innerHTML = `
        <p class="empty-message">
            Loading...
        </p>
    `;

    const {
        list: notifications,
        profileMap
    } = await socialhubFetchNotifications();

    if (notifications.length === 0) {

        list.innerHTML = `
            <p class="empty-message">
                No notifications yet.
            </p>
        `;

        return;
    }

    list.innerHTML = "";

    notifications.forEach(notification => {

        const profile =
            profileMap.get(notification.actor_id);

        const item =
            document.createElement("div");

        item.className = "socialhub-notif-item";

        if (!notification.is_read) {

            item.classList.add("unread");
        }

        item.innerHTML = `

            <div class="avatar">
                ${socialhubAvatarHTML(profile)}
            </div>

            <div class="socialhub-notif-text">

                <p>
                    ${socialhubEscape(
                        socialhubNotificationText(
                            notification,
                            profile
                        )
                    )}
                </p>

                <small>
                    ${socialhubRelativeTime(notification.created_at)}
                </small>

            </div>

            ${
                notification.is_read
                    ? ""
                    : '<div class="socialhub-notif-dot"></div>'
            }
        `;

        item.addEventListener("click", async () => {

            // Mark this one as read
            if (!notification.is_read) {

                await db
                    .from("notifications")
                    .update({ is_read: true })
                    .eq("id", notification.id);

                socialhubUpdateNotifBadge();
            }

            modal.remove();

            window.location.href =
                socialhubNotificationTarget(notification);
        });

        list.appendChild(item);
    });
}


// ======================================================
// 7. UNREAD BADGE
// ======================================================

async function socialhubUpdateNotifBadge() {

    // Respect the mute setting (settings.js)
    if (localStorage.getItem("socialhubNotifMuted") === "1") {

        const mutedBell =
            document.querySelector(
                '.top-icons button[title="Notifications"]'
            );

        if (mutedBell) {

            const hiddenBadge =
                mutedBell.querySelector(".socialhub-notif-badge");

            if (hiddenBadge) {

                hiddenBadge.classList.remove("visible");
            }
        }

        return;
    }

    const bell =
        document.querySelector(
            '.top-icons button[title="Notifications"]'
        );

    if (!bell) {
        return;
    }

    const me =
        await socialhubGetMe();

    if (!me) {
        return;
    }

    const {
        count,
        error
    } = await db
        .from("notifications")
        .select("id", {
            count: "exact",
            head: true
        })
        .eq("user_id", me.id)
        .eq("is_read", false);

    let badge =
        bell.querySelector(".socialhub-notif-badge");

    if (!badge) {

        badge =
            document.createElement("span");

        badge.className = "socialhub-notif-badge";

        bell.appendChild(badge);
    }

    const unread =
        error ? 0 : (count || 0);

    if (unread > 0) {

        badge.innerText =
            unread > 99 ? "99+" : String(unread);

        badge.classList.add("visible");

    } else {

        badge.classList.remove("visible");
    }
}


// ======================================================
// 8. AUTO-SYNC
// ======================================================

function socialhubSetupNotificationRealtime(me) {

    const channel =
        db.channel(`socialhub-notif-live-${me.id}`);

    channel
        .on(
            "postgres_changes",
            {
                event: "INSERT",
                schema: "public",
                table: "notifications",
                filter: `user_id=eq.${me.id}`
            },
            () => {

                // Respect the mute setting
                if (localStorage.getItem("socialhubNotifMuted") === "1") {
                    return;
                }

                // Live badge update
                socialhubUpdateNotifBadge();

                // If the panel is open, refresh it live
                const modal =
                    document.querySelector(".socialhub-notif-modal");

                if (modal) {

                    socialhubRenderNotificationList(modal);
                }
            }
        )
        .subscribe();
}


document.addEventListener("DOMContentLoaded", () => {

    const bell =
        document.querySelector(
            '.top-icons button[title="Notifications"]'
        );

    if (bell) {

        bell.addEventListener(
            "click",
            socialhubOpenNotifications
        );

        // Initial badge
        socialhubUpdateNotifBadge();

        // Refresh badge every 30 seconds
        setInterval(
            socialhubUpdateNotifBadge,
            30000
        );

        socialhubGetMe().then(me => {

            if (me) {

                socialhubSetupNotificationRealtime(me);
            }
        });
    }

    // Sidebar "Notifications" button -> same panel
    document
        .querySelectorAll(".sidebar-menu button")
        .forEach(button => {

            if (
                button.textContent.includes("Notifications") &&
                !button.dataset.socialhubNotifReady
            ) {

                button.dataset.socialhubNotifReady = "1";

                button.addEventListener(
                    "click",
                    socialhubOpenNotifications
                );
            }
        });

    console.log(
        "✅ Notifications activated!"
    );
});
