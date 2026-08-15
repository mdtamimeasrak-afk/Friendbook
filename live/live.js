function socialhubPageId() {
    const segs =
        window.location.pathname
            .replace(/\/+$/, "")
            .split("/")
            .filter(Boolean);
    const last =
        segs[segs.length - 1] || "";
    const folder =
        segs.length >= 2 ? segs[segs.length - 2] : "";
    if (last && last.endsWith(".html") && last !== "index.html") {
        return folder + "/" + last;
    }
    return (last && last !== "index.html" ? last : folder) + "/index.html";
}


// ======================================================
// SOCIALHUB - LIVE VIDEO (📡 experimental)
// ======================================================
// live.html     -> active live directory + Go Live
// live-room.html?id=X -> host camera preview / viewer
// Experimental: no WebRTC fan-out - presence shows
// viewer counts and heartbeat keeps streams alive.
// ======================================================

(function socialhubLiveInjectStyles() {

    const style =
        document.createElement("style");

    style.textContent = `

.live-main {
    max-width: 900px;
    margin: 0 auto;
    padding: 18px 14px 40px;
}

.live-head {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 4px;
}

.live-head .live-head-icon {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: #ffe0e0;
    color: #e41e3f;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
}

.live-main h1 {
    margin: 0;
    font-size: 22px;
}

.live-main .live-sub {
    margin: 0 0 16px 56px;
    color: #65676b;
    font-size: 13.5px;
}

.live-top-row {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 14px;
}

.live-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 14px;
}

.live-card {
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    cursor: pointer;
    transition: 0.15s;
}

.live-card:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.14);
    transform: translateY(-1px);
}

.live-card-preview {
    position: relative;
    aspect-ratio: 16 / 9;
    background: linear-gradient(135deg, #e41e3f, #7a1f2b);
    display: flex;
    align-items: center;
    justify-content: center;
}

.live-card-preview .live-cam-icon {
    color: rgba(255, 255, 255, 0.85);
    font-size: 40px;
}

.live-badge {
    position: absolute;
    top: 10px;
    left: 10px;
    background: #e41e3f;
    color: #fff;
    font-size: 11px;
    font-weight: 800;
    padding: 4px 10px;
    border-radius: 10px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    letter-spacing: 0.5px;
}

.live-badge .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #fff;
    animation: socialhubLivePulse 1.2s infinite;
}

@keyframes socialhubLivePulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.25; }
}

.live-viewers {
    position: absolute;
    bottom: 10px;
    right: 10px;
    background: rgba(0, 0, 0, 0.6);
    color: #fff;
    font-size: 11.5px;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 12px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
}

.live-card-body {
    padding: 10px 14px 12px;
    display: flex;
    align-items: center;
    gap: 10px;
}

.live-host-avatar {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    object-fit: cover;
    background: #1877f2;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: 800;
    flex-shrink: 0;
}

.live-card-body b {
    display: block;
    font-size: 13.5px;
    margin-bottom: 1px;
}

.live-card-body small {
    color: #65676b;
    font-size: 12px;
}

/* Live room */
.live-room-main {
    max-width: 820px;
    margin: 0 auto;
    padding: 18px 14px 40px;
}

.live-room {
    background: #000;
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 0 8px 40px rgba(0, 0, 0, 0.4);
}

.live-room-video {
    width: 100%;
    aspect-ratio: 16 / 9;
    background: #111;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
}

.live-room-video video {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.live-room-video .live-placeholder {
    color: rgba(255, 255, 255, 0.8);
    font-size: 52px;
}

.live-room-badge {
    position: absolute;
    top: 12px;
    left: 12px;
    background: #e41e3f;
    color: #fff;
    font-size: 12px;
    font-weight: 800;
    padding: 5px 12px;
    border-radius: 12px;
    display: inline-flex;
    align-items: center;
    gap: 7px;
}

.live-room-badge .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #fff;
    animation: socialhubLivePulse 1.2s infinite;
}

.live-room-viewers {
    position: absolute;
    bottom: 12px;
    right: 12px;
    background: rgba(0, 0, 0, 0.65);
    color: #fff;
    font-size: 12px;
    font-weight: 700;
    padding: 5px 12px;
    border-radius: 14px;
    display: inline-flex;
    align-items: center;
    gap: 7px;
}

.live-room-info {
    background: #fff;
    padding: 14px 18px;
}

.live-room-info h1 {
    margin: 0 0 4px;
    font-size: 17px;
}

.live-room-host {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
}

.live-room-host .live-host-avatar {
    width: 44px;
    height: 44px;
    font-size: 18px;
}

.live-room-host b {
    display: block;
    font-size: 14px;
}

.live-room-host small {
    color: #65676b;
    font-size: 12px;
}

.live-end-btn {
    border: none;
    background: #e41e3f;
    color: #fff;
    padding: 12px 26px;
    border-radius: 22px;
    font-size: 14px;
    font-weight: 800;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-family: inherit;
    transition: 0.12s;
}

.live-end-btn:hover {
    background: #c81233;
}

.live-ended {
    text-align: center;
    padding: 60px 20px;
    color: #fff;
}

.live-ended i {
    font-size: 46px;
    margin-bottom: 12px;
    display: block;
    opacity: 0.8;
}

body.dark-mode .live-card {
    background: #242526;
}

body.dark-mode .live-room-info {
    background: #242526;
}

body.dark-mode .live-room-info h1 {
    color: #e4e6eb;
}

body.dark-mode .live-main .live-sub,
body.dark-mode .live-card-body small,
body.dark-mode .live-room-host small {
    color: #b0b3b8;
}
`;

    document.head.appendChild(style);
})();


// ======================================================
// HELPERS
// ======================================================

async function socialhubLiveGetMe() {

    const {
        data,
        error
    } = await db.auth.getUser();

    if (error || !data.user) {
        return null;
    }

    return data.user;
}


function socialhubLiveEscape(text) {

    const div =
        document.createElement("div");

    div.innerText =
        text || "";

    return div.innerHTML;
}


function socialhubLiveToast(message) {

    const toast =
        document.createElement("div");

    toast.style.cssText =
        "position:fixed;bottom:24px;left:50%;transform:translateX(-50%);" +
        "background:#1c1e21;color:#fff;padding:12px 20px;border-radius:22px;" +
        "font-size:14px;font-weight:600;z-index:100001;box-shadow:0 6px 24px rgba(0,0,0,0.3);";

    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 2400);
}


async function socialhubLiveProfileMap(userIds) {

    const map = {};

    if (userIds.length > 0) {

        const {
            data
        } = await db
            .from("profiles")
            .select("id, full_name, avatar_url")
            .in("id", userIds);

        (data || []).forEach(p => {

            map[p.id] = p;
        });
    }

    return map;
}


function socialhubLiveAvatarHTML(profile, cls) {

    const name =
        profile?.full_name || "User";

    if (profile?.avatar_url) {

        return `
            <img
                class="${cls}"
                src="${socialhubLiveEscape(profile.avatar_url)}"
                alt=""
            >
        `;
    }

    return `
        <div class="${cls}">
            ${socialhubLiveEscape(name.charAt(0).toUpperCase())}
        </div>
    `;
}


function socialhubLiveElapsed(startedAt) {

    const mins =
        Math.floor(
            (Date.now() - new Date(startedAt).getTime()) / 60000
        );

    if (mins < 1) {
        return "just started";
    }

    const hours =
        Math.floor(mins / 60);

    if (hours < 1) {
        return mins + " min";
    }

    return hours + "h " + (mins % 60) + "m";
}


// ======================================================
// 1. LIVE DIRECTORY (live.html)
// ======================================================

async function socialhubLiveLoad() {

    const grid =
        document.getElementById("liveGrid");

    if (!grid) {
        return;
    }

    const me =
        await socialhubLiveGetMe();

    if (!me) {

        location.href = "../auth/index.html";

        return;
    }

    const {
        data: sessions,
        error
    } = await db
        .from("live_sessions")
        .select("*")
        .is("ended_at", null)
        .order("started_at", { ascending: false });

    if (error) {

        console.error("Live load error:", error);

        grid.innerHTML =
            '<p class="empty-message" style="grid-column:1/-1;">Could not load live streams.</p>';

        return;
    }

    if (!sessions || sessions.length === 0) {

        grid.innerHTML = `
            <p class="empty-message" style="grid-column:1/-1;">
                No one is live right now. Be the first to Go Live!
            </p>
        `;

        return;
    }

    const hostIds =
        [...new Set(sessions.map(s => s.host_id))];

    const hostMap =
        await socialhubLiveProfileMap(hostIds);

    // Stale sessions cleanup: ended > 3 min ago on the server
    sessions.forEach(session => {

        if (
            session.ended_at &&
            new Date(session.ended_at).getTime() < Date.now() - 180000
        ) {

            db.from("live_sessions")
                .delete()
                .eq("id", session.id)
                .then(() => {});
        }
    });

    grid.innerHTML = "";

    sessions.forEach(session => {

        const host =
            hostMap[session.host_id] || {};

        const card =
            document.createElement("div");

        card.className = "live-card";

        card.innerHTML = `

            <div class="live-card-preview">

                <span class="live-badge">
                    <span class="dot"></span>
                    LIVE
                </span>

                <i class="fa-solid fa-video live-cam-icon"></i>

                <span class="live-viewers" data-session="${session.id}">
                    <i class="fa-solid fa-eye"></i>
                    <span>1</span>
                </span>

            </div>

            <div class="live-card-body">

                ${socialhubLiveAvatarHTML(host, "live-host-avatar")}

                <div>
                    <b>${socialhubLiveEscape(session.title)}</b>
                    <small>
                        ${socialhubLiveEscape(host.full_name || "Someone")} · ${socialhubLiveElapsed(session.started_at)}
                    </small>
                </div>

            </div>
        `;

        card.addEventListener("click", () => {

            location.href = `../live/live-room.html?id=${session.id}`;
        });

        grid.appendChild(card);

        // Live viewer counts via presence
        socialhubLiveWatchViewers(session.id);
    });
}


function socialhubLiveWatchViewers(sessionId) {

    const channel =
        db.channel("socialhub-live-viewers-" + sessionId);

    const update = () => {

        const state =
            channel.presenceState();

        const count =
            Object.keys(state).length || 1;

        document
            .querySelectorAll(`[data-session="${sessionId}"] span`)
            .forEach(el => {

                el.textContent = count;
            });
    };

    channel
        .on("presence", { event: "sync" }, update)
        .on("presence", { event: "join" }, update)
        .on("presence", { event: "leave" }, update)
        .subscribe(status => {

            if (status === "SUBSCRIBED") {

                channel.track({
                    user_id: "viewer-" + Math.random().toString(36).slice(2, 8)
                });
            }
        });
}


// ======================================================
// 2. GO LIVE (start)
// ======================================================

function socialhubLiveOpenStart() {

    const modal =
        document.createElement("div");

    modal.style.cssText =
        "position:fixed;inset:0;background:rgba(0,0,0,0.55);display:flex;align-items:center;justify-content:center;z-index:10000;padding:20px;";

    modal.innerHTML = `

        <div class="socialhub-cr-box" style="background:#fff;border-radius:10px;width:100%;max-width:440px;box-shadow:0 12px 40px rgba(0,0,0,0.25);overflow:hidden;">

            <div class="cr-head" style="padding:16px 18px;border-bottom:1px solid #e4e6eb;display:flex;align-items:center;justify-content:space-between;">

                <h2 style="margin:0;font-size:18px;display:flex;align-items:center;gap:8px;">
                    <i class="fa-solid fa-circle-dot" style="color:#e41e3f;"></i>
                    Go Live
                </h2>

                <button class="cr-close" type="button" title="Close" style="border:none;background:#e4e6eb;width:32px;height:32px;border-radius:50%;cursor:pointer;">
                    <i class="fa-solid fa-xmark"></i>
                </button>

            </div>

            <div class="cr-body" style="padding:16px 18px;">

                <label>Live title</label>

                <input type="text" id="lvTitle" placeholder="What are you live about?" maxlength="80">

            </div>

            <div class="cr-actions" style="padding:14px 18px;border-top:1px solid #e4e6eb;display:flex;gap:10px;justify-content:flex-end;">

                <button class="socialhub-cr-cancel" type="button">Cancel</button>

                <button class="socialhub-create-btn" type="button" style="background:#e41e3f;">
                    <i class="fa-solid fa-circle-dot"></i>
                    Start Live
                </button>

            </div>

        </div>
    `;

    document.body.appendChild(modal);

    modal
        .querySelector(".cr-close")
        .addEventListener("click", () => modal.remove());

    modal
        .querySelector(".socialhub-cr-cancel")
        .addEventListener("click", () => modal.remove());

    modal.addEventListener("click", event => {

        if (event.target === modal) {
            modal.remove();
        }
    });

    modal
        .querySelector(".socialhub-create-btn")
        .addEventListener("click", async () => {

            const title =
                modal.querySelector("#lvTitle").value.trim() || "Live";

            const me =
                await socialhubLiveGetMe();

            if (!me) {
                return;
            }

            const createBtn =
                modal.querySelector(".socialhub-create-btn");

            createBtn.disabled = true;

            const { data, error } =
                await db
                    .from("live_sessions")
                    .insert({
                        host_id: me.id,
                        title
                    })
                    .select("id")
                    .single();

            if (error) {

                alert("Could not start live: " + error.message);

                createBtn.disabled = false;

                return;
            }

            modal.remove();

            location.href = `../live/live-room.html?id=${data.id}`;
        });
}


// ======================================================
// 3. LIVE ROOM (live-room.html?id=X)
// ======================================================

let socialhubLiveRoomState = {
    session: null,
    host: null,
    stream: null,
    presence: null,
    ended: false
};


async function socialhubLiveRoomLoad() {

    const room =
        document.getElementById("liveRoom");

    if (!room) {
        return;
    }

    const params =
        new URLSearchParams(window.location.search);

    const sessionId =
        params.get("id");

    if (!sessionId) {

        location.href = "../live/index.html";

        return;
    }

    const me =
        await socialhubLiveGetMe();

    if (!me) {

        location.href = "../auth/index.html";

        return;
    }

    const {
        data: session,
        error
    } = await db
        .from("live_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

    if (error || !session) {

        room.innerHTML =
            '<p class="empty-message">Live stream not found.</p>';

        return;
    }

    socialhubLiveRoomState.session = session;

    const isHost =
        session.host_id === me.id;

    document.title = session.title + " - Friendio Live";

    const hostMap =
        await socialhubLiveProfileMap([session.host_id]);

    socialhubLiveRoomState.host =
        hostMap[session.host_id] || {};

    if (session.ended_at) {

        socialhubLiveRenderEnded(room);

        return;
    }

    room.innerHTML = `

        <div class="live-room-video">

            <span class="live-room-badge">
                <span class="dot"></span>
                LIVE
            </span>

            ${isHost ? '<video id="liveCam" autoplay muted playsinline></video>' : '<i class="fa-solid fa-video live-placeholder"></i>'}

            <span class="live-room-viewers" id="liveRoomViewers">
                <i class="fa-solid fa-eye"></i>
                <span>1</span>
            </span>

        </div>

        <div class="live-room-info">

            <h1>${socialhubLiveEscape(session.title)}</h1>

            <div class="live-room-host">

                ${socialhubLiveAvatarHTML(socialhubLiveRoomState.host, "live-host-avatar")}

                <div>
                    <b>${socialhubLiveEscape(socialhubLiveRoomState.host.full_name || "Someone")}</b>
                    <small>Started ${socialhubLiveElapsed(session.started_at)} ago · Live on Friendio</small>
                </div>

            </div>

            ${
                isHost
                    ? `
                        <button class="live-end-btn" type="button" id="liveEndBtn">
                            <i class="fa-solid fa-circle-stop"></i>
                            End Live
                        </button>
                    `
                    : ""
            }

        </div>
    `;

    // Viewer count via presence
    const presence =
        db.channel("socialhub-live-viewers-" + session.id);

    socialhubLiveRoomState.presence = presence;

    const updateViewers = () => {

        const count =
            Object.keys(presence.presenceState()).length || 1;

        const el =
            document.querySelector("#liveRoomViewers span");

        if (el) {
            el.textContent = count;
        }
    };

    presence
        .on("presence", { event: "sync" }, updateViewers)
        .on("presence", { event: "join" }, updateViewers)
        .on("presence", { event: "leave" }, updateViewers)
        .subscribe(status => {

            if (status === "SUBSCRIBED") {

                presence.track({
                    user_id: isHost ? "host-" + me.id : "viewer-" + Math.random().toString(36).slice(2, 8)
                });
            }
        });

    // Watch for the stream ending
    db
        .channel("socialhub-live-end-" + session.id)
        .on(
            "postgres_changes",
            {
                event: "UPDATE",
                schema: "public",
                table: "live_sessions",
                filter: `id=eq.${session.id}`
            },
            payload => {

                if (payload.new.ended_at) {

                    socialhubLiveRenderEnded(room);
                }
            }
        )
        .subscribe();

    // Host: start the camera
    if (isHost) {

        const endBtn =
            document.getElementById("liveEndBtn");

        if (endBtn) {

            endBtn.addEventListener("click", async () => {

                if (socialhubLiveRoomState.stream) {

                    socialhubLiveRoomState.stream
                        .getTracks()
                        .forEach(track => track.stop());
                }

                await db
                    .from("live_sessions")
                    .update({ ended_at: new Date().toISOString() })
                    .eq("id", session.id);

                location.href = "../live/index.html";
            });
        }

        try {

            const stream =
                await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });

            socialhubLiveRoomState.stream = stream;

            const video =
                document.getElementById("liveCam");

            if (video) {

                video.srcObject = stream;

                await video.play().catch(() => {});
            }

        } catch (camError) {

            console.warn("Camera unavailable:", camError);

            socialhubLiveToast("Camera unavailable - stream is running without video.");
        }
    }
}


function socialhubLiveRenderEnded(room) {

    if (socialhubLiveRoomState.ended) {
        return;
    }

    socialhubLiveRoomState.ended = true;

    if (socialhubLiveRoomState.stream) {

        socialhubLiveRoomState.stream
            .getTracks()
            .forEach(track => track.stop());

        socialhubLiveRoomState.stream = null;
    }

    room.innerHTML = `

        <div class="live-ended">

            <i class="fa-solid fa-circle-stop"></i>

            <h2>This live has ended</h2>

            <p>Thanks for watching!</p>

            <button
                class="socialhub-create-btn"
                type="button"
                style="margin-top:8px;"
                onclick="location.href='../live/index.html'"
            >
                <i class="fa-solid fa-video"></i>
                Browse Live
            </button>

        </div>
    `;
}


// ======================================================
// 4. INIT
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

    const currentPage =
        socialhubPageId() || "home/index.html";

    if (currentPage === "live/live-room.html") {

        socialhubLiveRoomLoad();

    } else {

        socialhubLiveLoad();
    }
});