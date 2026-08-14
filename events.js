// ======================================================
// SOCIALHUB - EVENTS (📅 Communities)
// ======================================================
// events.html  -> event list + create
// event.html   -> event detail + RSVP (Going/Maybe/Declined)
// ======================================================

(function socialhubEventsInjectStyles() {

    const style =
        document.createElement("style");

    style.textContent = `

.events-main {
    max-width: 860px;
    margin: 0 auto;
    padding: 18px 14px 40px;
}

.events-main h1 {
    margin: 0 0 4px;
    font-size: 22px;
}

.events-main .events-sub {
    margin: 0 0 16px;
    color: #65676b;
    font-size: 13.5px;
}

.events-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 12px;
    margin-top: 16px;
}

.event-card {
    background: #fff;
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    cursor: pointer;
    transition: 0.15s;
}

.event-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
}

.event-card-banner {
    height: 84px;
    background: linear-gradient(135deg, #f02849, #a940dc);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 30px;
    color: #fff;
}

.event-card-banner.blue {
    background: linear-gradient(135deg, #1877f2, #66a6ff);
}

.event-card-banner.green {
    background: linear-gradient(135deg, #25a56a, #7bdcb5);
}

.event-card-body {
    padding: 14px;
}

.event-card-body h3 {
    margin: 0 0 4px;
    font-size: 15.5px;
}

.event-card-body p {
    margin: 0 0 8px;
    font-size: 13px;
    color: #65676b;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.event-card-body .event-card-date {
    font-size: 12.5px;
    font-weight: 700;
    color: #1877f2;
}

/* Event page */
.event-page {
    max-width: 760px;
    margin: 0 auto;
    padding: 18px 14px 40px;
}

.event-hero {
    background: #fff;
    border-radius: 16px;
    padding: 22px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    margin-bottom: 16px;
}

.event-hero .event-hero-icon {
    width: 64px;
    height: 64px;
    border-radius: 18px;
    background: linear-gradient(135deg, #f02849, #a940dc);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    color: #fff;
    margin-bottom: 12px;
}

.event-hero h1 {
    margin: 0 0 6px;
    font-size: 20px;
}

.event-hero .event-info-row {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    font-size: 14px;
    color: #050505;
    margin: 6px 0;
}

.event-hero .event-info-row span {
    font-size: 17px;
}

.event-hero .event-hero-desc {
    margin: 12px 0 16px;
    font-size: 14px;
    color: #65676b;
}

.event-rsvp-row {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
}

.event-rsvp-btn {
    border: none;
    padding: 10px 20px;
    border-radius: 22px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    background: #e4e6eb;
    color: #1c1e21;
    transition: 0.15s;
}

.event-rsvp-btn:hover {
    background: #d8dadf;
}

.event-rsvp-btn.going {
    background: #31a24c;
    color: #fff;
}

.event-rsvp-btn.maybe {
    background: #f7b928;
    color: #1c1e21;
}

.event-rsvp-btn.declined {
    background: #e41e3f;
    color: #fff;
}

.event-attendees-title {
    font-size: 16px;
    font-weight: 700;
    margin: 20px 0 10px;
}

.event-attendees {
    background: #fff;
    border-radius: 14px;
    padding: 12px 14px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.event-attendees .event-attendee-group {
    margin-bottom: 12px;
}

.event-attendees .event-attendee-group:last-child {
    margin-bottom: 0;
}

.event-attendees h4 {
    margin: 0 0 8px;
    font-size: 13px;
    color: #65676b;
}

.event-attendees .attendee-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.attendee-chip {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-size: 13px;
    font-weight: 600;
    background: #f0f2f5;
    padding: 5px 12px;
    border-radius: 20px;
    cursor: pointer;
}

.attendee-chip:hover {
    background: #e4e6eb;
}

.attendee-chip img,
.attendee-chip .attendee-avatar {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    object-fit: cover;
    background: #1877f2;
    color: #fff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
}

body.dark-mode .event-card,
body.dark-mode .event-hero,
body.dark-mode .event-attendees,
body.dark-mode .socialhub-cr-box {
    background: #242526;
}

body.dark-mode .event-card-body p,
body.dark-mode .events-main .events-sub,
body.dark-mode .event-hero .event-hero-desc,
body.dark-mode .event-attendees h4 {
    color: #b0b3b8;
}

body.dark-mode .attendee-chip {
    background: #3a3b3c;
    color: #e4e6eb;
}

body.dark-mode .event-rsvp-btn {
    background: #3a3b3c;
    color: #e4e6eb;
}

body.dark-mode .socialhub-cr-box input,
body.dark-mode .socialhub-cr-box textarea {
    background: #3a3b3c;
    border-color: #4e4f50;
    color: #e4e6eb;
}
`;

    document.head.appendChild(style);
})();


// ======================================================
// 1. HELPERS
// ======================================================

function socialhubEventsEscape(text) {

    const div =
        document.createElement("div");

    div.innerText =
        text || "";

    return div.innerHTML;
}


async function socialhubEventsGetMe() {

    const {
        data,
        error
    } = await db.auth.getUser();

    if (error || !data.user) {

        return null;
    }

    return data.user;
}


function socialhubEventsFormatDate(value) {

    if (!value) {

        return "No date set";
    }

    const date =
        new Date(value);

    if (isNaN(date.getTime())) {

        return "No date set";
    }

    const options = {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    };

    return date.toLocaleString(undefined, options);
}


function socialhubEventsToast(message) {

    const old =
        document.querySelector(".socialhub-events-toast");

    if (old) {
        old.remove();
    }

    const toast =
        document.createElement("div");

    toast.className = "socialhub-events-toast";

    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #1c1e21;
        color: #fff;
        padding: 10px 20px;
        border-radius: 24px;
        font-size: 14px;
        font-weight: 600;
        z-index: 10001;
        box-shadow: 0 6px 20px rgba(0,0,0,0.3);
    `;

    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 2400);
}


function socialhubEventsAvatarHTML(profile) {

    if (profile && profile.avatar_url) {

        return `
            <img
                src="${socialhubEventsEscape(profile.avatar_url)}"
                alt=""
            >
        `;
    }

    const letter =
        (
            profile && profile.full_name
                ? profile.full_name
                : "U"
        ).charAt(0).toUpperCase();

    return `
        <span class="attendee-avatar">
            ${socialhubEventsEscape(letter)}
        </span>
    `;
}


// ======================================================
// 2. CREATE MODAL
// ======================================================

function socialhubEventsOpenCreateModal() {

    const modal =
        document.createElement("div");

    modal.className = "socialhub-cr-modal";

    const minDate =
        new Date(Date.now() + 3600000)
            .toISOString()
            .slice(0, 16);

    modal.innerHTML = `
        <div class="socialhub-cr-box">
            <h2>📅 Create Event</h2>

            <label>Event title</label>
            <input type="text" id="evTitle" placeholder="e.g. Gaming Night" maxlength="80">

            <label>Description</label>
            <textarea id="evDesc" rows="3" placeholder="What will happen at this event?"></textarea>

            <label>Location</label>
            <input type="text" id="evLocation" placeholder="e.g. Online / Dhaka" maxlength="100">

            <label>Date &amp; time</label>
            <input type="datetime-local" id="evDate" min="${minDate}">

            <div class="socialhub-cr-actions">
                <button class="socialhub-cr-cancel" type="button">Cancel</button>
                <button class="socialhub-create-btn" type="button">Create Event</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

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
                modal.querySelector("#evTitle").value.trim();

            const description =
                modal.querySelector("#evDesc").value.trim();

            const location =
                modal.querySelector("#evLocation").value.trim();

            const dateValue =
                modal.querySelector("#evDate").value;

            if (!title) {

                socialhubEventsToast("Event title is required.");

                return;
            }

            if (!dateValue) {

                socialhubEventsToast("Please pick a date &amp; time.");

                return;
            }

            const me =
                await socialhubEventsGetMe();

            if (!me) {

                socialhubEventsToast("Please login first.");

                return;
            }

            const { data, error } =
                await db
                    .from("events")
                    .insert({
                        title,
                        description,
                        location,
                        event_date: new Date(dateValue).toISOString(),
                        created_by: me.id
                    })
                    .select("id")
                    .single();

            if (error) {

                socialhubEventsToast("Could not create event: " + error.message);

                return;
            }

            await db
                .from("event_rsvps")
                .insert({
                    event_id: data.id,
                    user_id: me.id,
                    status: "going"
                });

            modal.remove();

            socialhubEventsToast("✅ Event created!");

            setTimeout(() => {

                location.href = `event.html?id=${data.id}`;
            }, 700);
        });
}


// ======================================================
// 3. EVENT LIST PAGE (events.html)
// ======================================================

async function socialhubEventsLoad() {

    const grid =
        document.getElementById("eventsGrid");

    if (!grid) {
        return;
    }

    const {
        data: events,
        error
    } = await db
        .from("events")
        .select("id, title, description, location, event_date, created_by, created_at")
        .order("event_date", { ascending: false });

    if (error) {

        console.error("❌ Events load error:", error);

        grid.innerHTML = `
            <p class="empty-message" style="grid-column:1/-1;">
                Could not load events.
            </p>
        `;

        return;
    }

    if (!events || events.length === 0) {

        grid.innerHTML = `
            <p class="empty-message" style="grid-column:1/-1;">
                No events yet. Create the first one!
            </p>
        `;

        return;
    }

    const {
        data: rsvps
    } = await db
        .from("event_rsvps")
        .select("event_id, status");

    const goingCount = {};

    (rsvps || []).forEach(r => {

        if (r.status === "going") {

            goingCount[r.event_id] =
                (goingCount[r.event_id] || 0) + 1;
        }
    });

    grid.innerHTML = "";

    events.forEach((event, index) => {

        const card =
            document.createElement("div");

        card.className = "event-card";

        const bannerClass =
            index % 3 === 0 ? "" :
            index % 3 === 1 ? " blue" : " green";

        card.innerHTML = `
            <div class="event-card-banner${bannerClass}">📅</div>

            <div class="event-card-body">
                <h3>${socialhubEventsEscape(event.title)}</h3>
                <p>${socialhubEventsEscape(event.description || "")}</p>
                <div class="event-card-date">
                    🕐 ${socialhubEventsFormatDate(event.event_date)}
                </div>
                <div class="event-card-date" style="margin-top:4px; color:#65676b;">
                    ${goingCount[event.id] || 0} going
                </div>
            </div>
        `;

        card.addEventListener("click", () => {

            location.href = `event.html?id=${event.id}`;
        });

        grid.appendChild(card);
    });
}


// ======================================================
// 4. EVENT PAGE (event.html?id=X)
// ======================================================

async function socialhubEventLoad() {

    const params =
        new URLSearchParams(window.location.search);

    const eventId =
        params.get("id");

    if (!eventId) {

        location.href = "events.html";

        return;
    }

    const me =
        await socialhubEventsGetMe();

    if (!me) {

        location.href = "login.html";

        return;
    }

    const {
        data: event,
        error
    } = await db
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

    if (error || !event) {

        document.querySelector(".event-page").innerHTML =
            '<p class="empty-message">Event not found.</p>';

        return;
    }

    document.title = event.title + " - TRIYA";

    const isCreator =
        event.created_by === me.id;

    const {
        data: myRsvp
    } = await db
        .from("event_rsvps")
        .select("*")
        .eq("event_id", eventId)
        .eq("user_id", me.id)
        .maybeSingle();

    const {
        data: rsvpRows
    } = await db
        .from("event_rsvps")
        .select("user_id, status, created_at")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });

    const attendeeIds =
        (rsvpRows || []).map(r => r.user_id);

    let attendeeProfiles = [];

    if (attendeeIds.length > 0) {

        const {
            data: profiles
        } = await db
            .from("profiles")
            .select("id, full_name, username, avatar_url")
            .in("id", attendeeIds);

        attendeeProfiles = profiles || [];
    }

    const profileMap = new Map();

    attendeeProfiles.forEach(p => {

        profileMap.set(p.id, p);
    });

    const myStatus =
        myRsvp?.status || null;

    const hero =
        document.getElementById("eventHero");

    hero.innerHTML = `

        <div class="event-hero-icon">📅</div>

        <h1>${socialhubEventsEscape(event.title)}</h1>

        <div class="event-info-row">
            <span>🕐</span>
            <div>${socialhubEventsFormatDate(event.event_date)}</div>
        </div>

        ${
            event.location
                ? `
                    <div class="event-info-row">
                        <span>📍</span>
                        <div>${socialhubEventsEscape(event.location)}</div>
                    </div>
                `
                : ""
        }

        <p class="event-hero-desc">
            ${socialhubEventsEscape(event.description || "No description yet.")}
        </p>

        <div class="event-rsvp-row" id="eventRsvpRow">

            ${
                isCreator
                    ? `
                        <button
                            class="socialhub-danger-btn"
                            onclick="socialhubEventDelete('${event.id}', this)"
                        >
                            🗑️ Delete Event
                        </button>
                    `
                    : `
                        <button
                            class="event-rsvp-btn going ${myStatus === "going" ? "going" : ""}"
                            style="${myStatus === "going" ? "background:#31a24c;color:#fff;" : ""}"
                            onclick="socialhubEventRsvp('${event.id}', 'going', this)"
                        >
                            ✅ Going
                        </button>

                        <button
                            class="event-rsvp-btn"
                            style="${myStatus === "maybe" ? "background:#f7b928;color:#1c1e21;" : ""}"
                            onclick="socialhubEventRsvp('${event.id}', 'maybe', this)"
                        >
                            🤔 Maybe
                        </button>

                        <button
                            class="event-rsvp-btn"
                            style="${myStatus === "declined" ? "background:#e41e3f;color:#fff;" : ""}"
                            onclick="socialhubEventRsvp('${event.id}', 'declined', this)"
                        >
                            ❌ Declined
                        </button>

                        ${
                            myStatus
                                ? `
                                    <button
                                        class="event-rsvp-btn"
                                        onclick="socialhubEventCancelRsvp('${event.id}', this)"
                                    >
                                        ✖️ Remove RSVP
                                    </button>
                                `
                                : ""
                        }
                    `
            }

        </div>
    `;

    // Attendees
    const going = [];
    const maybe = [];
    const declined = [];

    (rsvpRows || []).forEach(r => {

        const profile =
            profileMap.get(r.user_id);

        if (!profile) {
            return;
        }

        const chip = {
            id: r.user_id,
            profile,
            html: `
                <span class="attendee-chip" data-uid="${r.user_id}">
                    ${socialhubEventsAvatarHTML(profile)}
                    ${socialhubEventsEscape(profile.full_name || "@" + profile.username || "User")}
                </span>
            `
        };

        if (r.status === "going") {
            going.push(chip);
        } else if (r.status === "maybe") {
            maybe.push(chip);
        } else {
            declined.push(chip);
        }
    });

    const box =
        document.getElementById("eventAttendees");

    box.innerHTML = `

        <div class="event-attendee-group">
            <h4>✅ Going (${going.length})</h4>
            <div class="attendee-row">${
                going.length
                    ? going.map(g => g.html).join("")
                    : '<span style="font-size:13px;color:#65676b;">No one yet</span>'
            }</div>
        </div>

        <div class="event-attendee-group">
            <h4>🤔 Maybe (${maybe.length})</h4>
            <div class="attendee-row">${
                maybe.length
                    ? maybe.map(g => g.html).join("")
                    : '<span style="font-size:13px;color:#65676b;">No one yet</span>'
            }</div>
        </div>

        <div class="event-attendee-group">
            <h4>❌ Declined (${declined.length})</h4>
            <div class="attendee-row">${
                declined.length
                    ? declined.map(g => g.html).join("")
                    : '<span style="font-size:13px;color:#65676b;">No one yet</span>'
            }</div>
        </div>
    `;

    box.querySelectorAll(".attendee-chip").forEach(chip => {

        chip.addEventListener("click", () => {

            location.href = `user-profile.html?user=${chip.dataset.uid}`;
        });
    });
}


async function socialhubEventRsvp(eventId, status, button) {

    const me =
        await socialhubEventsGetMe();

    if (!me) {
        return;
    }

    const { error } =
        await db
            .from("event_rsvps")
            .upsert({
                event_id: eventId,
                user_id: me.id,
                status
            }, {
                onConflict: "event_id,user_id"
            });

    if (error) {

        alert("Could not RSVP: " + error.message);

        return;
    }

    socialhubEventsToast("✅ RSVP updated!");

    setTimeout(() => location.reload(), 600);
}


async function socialhubEventCancelRsvp(eventId, button) {

    const me =
        await socialhubEventsGetMe();

    if (!me) {
        return;
    }

    await db
        .from("event_rsvps")
        .delete()
        .eq("event_id", eventId)
        .eq("user_id", me.id);

    socialhubEventsToast("RSVP removed.");

    setTimeout(() => location.reload(), 600);
}


async function socialhubEventDelete(eventId, button) {

    const ok =
        confirm("Delete this event permanently?");

    if (!ok) {
        return;
    }

    const { error } =
        await db
            .from("events")
            .delete()
            .eq("id", eventId);

    if (error) {

        alert("Could not delete: " + error.message);

        return;
    }

    location.href = "events.html";
}


// ======================================================
// 5. AUTO-SYNC
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

    const page =
        window.location.pathname.split("/").pop();

    const savedDarkMode =
        localStorage.getItem("darkMode");

    if (savedDarkMode === "true") {

        document.body.classList.add("dark-mode");
    }

    if (page === "events.html") {

        socialhubEventsLoad();
    }

    if (page === "event.html") {

        socialhubEventLoad();
    }

    console.log("✅ Events activated!");
});