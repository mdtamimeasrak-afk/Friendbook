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
    max-width: 900px;
    margin: 0 auto;
    padding: 18px 14px 40px;
}

.events-head {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 4px;
}

.events-head .events-head-icon {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: #e7f3ff;
    color: #1877f2;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
}

.events-main h1 {
    margin: 0;
    font-size: 22px;
}

.events-main .events-sub {
    margin: 0 0 16px 56px;
    color: #65676b;
    font-size: 13.5px;
}

.events-top-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 14px;
}

.events-count-pill {
    font-size: 13.5px;
    font-weight: 600;
    color: #65676b;
    background: #fff;
    padding: 8px 16px;
    border-radius: 20px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.events-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 14px;
}

.event-card {
    background: #fff;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    transition: 0.15s;
}

.event-card:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.14);
    transform: translateY(-1px);
}

.event-card-banner {
    height: 110px;
    background: linear-gradient(135deg, #f02849, #a940dc);
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.92);
    font-size: 34px;
    position: relative;
}

.event-card-banner::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(0,0,0,0.05), rgba(0,0,0,0.25));
}

.event-card-banner i {
    z-index: 1;
    filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.25));
}

.event-card-banner.blue {
    background: linear-gradient(135deg, #1877f2, #42b0ff);
}

.event-card-banner.green {
    background: linear-gradient(135deg, #25a56a, #63d9a8);
}

.event-card-body {
    padding: 14px 14px 12px;
}

.event-card-body h3 {
    margin: 0 0 6px;
    font-size: 15.5px;
    line-height: 1.3;
}

.event-card-body p {
    margin: 0 0 10px;
    font-size: 13px;
    color: #65676b;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.event-card-meta {
    border-top: 1px solid #e4e6eb;
    padding-top: 10px;
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.event-card-meta .meta-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #65676b;
}

.event-card-meta .meta-row i {
    width: 16px;
    color: #1877f2;
    font-size: 13px;
}

.event-card-meta .meta-row.going-row i {
    color: #31a24c;
}

.event-card-meta .meta-row.going-row strong {
    color: #31a24c;
}

/* Event page */
.event-page {
    max-width: 780px;
    margin: 0 auto;
    padding: 18px 14px 40px;
}

.event-cover {
    height: 150px;
    border-radius: 12px 12px 0 0;
    background: linear-gradient(135deg, #f02849, #a940dc);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 52px;
    color: rgba(255, 255, 255, 0.95);
    position: relative;
    overflow: hidden;
}

.event-cover::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(0,0,0,0.08), rgba(0,0,0,0.28));
}

.event-cover i {
    filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3));
}

.event-hero {
    background: #fff;
    border-radius: 0 0 12px 12px;
    padding: 20px 22px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    margin-bottom: 16px;
}

.event-hero h1 {
    margin: 0 0 14px;
    font-size: 24px;
    line-height: 1.25;
}

.event-hero .event-info-row {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    font-size: 14.5px;
    color: #050505;
    margin: 9px 0;
}

.event-hero .event-info-row .info-icon {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: #e7f3ff;
    color: #1877f2;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    flex-shrink: 0;
    margin-top: 1px;
}

.event-hero .event-info-row .info-text b {
    display: block;
    font-size: 13px;
    color: #65676b;
    font-weight: 600;
    margin-bottom: 1px;
}

.event-hero .event-hero-desc {
    margin: 14px 0 18px;
    font-size: 14px;
    color: #65676b;
    border-top: 1px solid #e4e6eb;
    padding-top: 14px;
    white-space: pre-line;
}

.event-rsvp-row {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
}

.event-rsvp-btn {
    border: none;
    padding: 11px 22px;
    border-radius: 22px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    background: #e4e6eb;
    color: #1c1e21;
    transition: 0.15s;
    display: inline-flex;
    align-items: center;
    gap: 7px;
}

.event-rsvp-btn:hover {
    background: #d8dadf;
}

.event-rsvp-btn.going,
.event-rsvp-btn[data-active="going"] {
    background: #31a24c;
    color: #fff;
}

.event-rsvp-btn.maybe,
.event-rsvp-btn[data-active="maybe"] {
    background: #f7b928;
    color: #1c1e21;
}

.event-rsvp-btn.declined,
.event-rsvp-btn[data-active="declined"] {
    background: #e41e3f;
    color: #fff;
}

.event-attendees-title {
    font-size: 17px;
    font-weight: 700;
    margin: 20px 0 10px;
}

.event-attendees {
    background: #fff;
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.event-attendees .event-attendee-group {
    margin-bottom: 14px;
}

.event-attendees .event-attendee-group:last-child {
    margin-bottom: 0;
}

.event-attendees h4 {
    margin: 0 0 10px;
    font-size: 13px;
    color: #65676b;
    display: flex;
    align-items: center;
    gap: 6px;
}

.event-attendees h4 i {
    color: #31a24c;
}

.event-attendees h4 .h4-maybe i {
    color: #f7b928;
}

.event-attendees h4 .h4-declined i {
    color: #e41e3f;
}

.event-attendees .attendee-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.attendee-chip {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 600;
    background: #f0f2f5;
    padding: 6px 14px;
    border-radius: 20px;
    cursor: pointer;
    transition: 0.12s;
}

.attendee-chip:hover {
    background: #e4e6eb;
}

.attendee-chip img,
.attendee-chip .attendee-avatar {
    width: 26px;
    height: 26px;
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

/* Create modal (FB style) */
.socialhub-cr-modal {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    padding: 20px;
}

.socialhub-cr-box {
    background: #fff;
    border-radius: 10px;
    width: 100%;
    max-width: 460px;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
    overflow: hidden;
}

.socialhub-cr-box .cr-head {
    padding: 16px 18px;
    border-bottom: 1px solid #e4e6eb;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.socialhub-cr-box .cr-head h2 {
    margin: 0;
    font-size: 18px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.socialhub-cr-box .cr-head .cr-close {
    border: none;
    background: #e4e6eb;
    color: #050505;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    font-size: 14px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
}

.socialhub-cr-box .cr-head .cr-close:hover {
    background: #d8dadf;
}

.cr-body {
    padding: 16px 18px;
}

.cr-body label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: #65676b;
    margin: 10px 0 6px;
}

.cr-body label:first-child {
    margin-top: 0;
}

.cr-body input,
.cr-body textarea {
    width: 100%;
    box-sizing: border-box;
    padding: 11px 13px;
    border: 1px solid #d4d7dd;
    border-radius: 8px;
    font-size: 14px;
    font-family: inherit;
    outline: none;
    transition: 0.12s;
}

.cr-body input:focus,
.cr-body textarea:focus {
    border-color: #1877f2;
    box-shadow: 0 0 0 3px rgba(24, 119, 242, 0.15);
}

.cr-body input[type="datetime-local"] {
    color: #1c1e21;
}

.cr-actions {
    display: flex;
    gap: 10px;
    padding: 14px 18px;
    border-top: 1px solid #e4e6eb;
    justify-content: flex-end;
}

.socialhub-cr-cancel {
    border: none;
    background: #e4e6eb;
    color: #1c1e21;
    padding: 10px 20px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
}

.socialhub-cr-cancel:hover {
    background: #d8dadf;
}

.socialhub-create-btn {
    border: none;
    background: #1877f2;
    color: #fff;
    padding: 10px 22px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    transition: 0.12s;
}

.socialhub-create-btn:hover {
    background: #166fe5;
}

.socialhub-danger-btn {
    border: none;
    background: #e41e3f;
    color: #fff;
    padding: 10px 20px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    transition: 0.12s;
}

.socialhub-danger-btn:hover {
    background: #c81233;
}

body.dark-mode .event-card,
body.dark-mode .event-hero,
body.dark-mode .event-attendees,
body.dark-mode .socialhub-cr-box,
body.dark-mode .events-count-pill {
    background: #242526;
}

body.dark-mode .event-card-body p,
body.dark-mode .events-main .events-sub,
body.dark-mode .event-hero .event-hero-desc,
body.dark-mode .event-attendees h4,
body.dark-mode .events-count-pill,
body.dark-mode .event-card-meta .meta-row {
    color: #b0b3b8;
}

body.dark-mode .event-card-meta {
    border-top-color: #3a3b3c;
}

body.dark-mode .event-hero .event-hero-desc {
    border-top-color: #3a3b3c;
}

body.dark-mode .event-hero .event-info-row {
    color: #e4e6eb;
}

body.dark-mode .attendee-chip {
    background: #3a3b3c;
    color: #e4e6eb;
}

body.dark-mode .attendee-chip:hover {
    background: #4e4f50;
}

body.dark-mode .event-rsvp-btn:not(.going):not(.maybe):not(.declined):not([data-active]) {
    background: #3a3b3c;
    color: #e4e6eb;
}

body.dark-mode .cr-body input,
body.dark-mode .cr-body textarea {
    background: #3a3b3c;
    border-color: #4e4f50;
    color: #e4e6eb;
}

body.dark-mode .cr-body input[type="datetime-local"] {
    color: #e4e6eb;
}

body.dark-mode .socialhub-cr-box .cr-head {
    border-bottom-color: #3a3b3c;
}

body.dark-mode .cr-actions {
    border-top-color: #3a3b3c;
}

body.dark-mode .event-hero .info-icon {
    background: rgba(24, 119, 242, 0.2);
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
            <div class="cr-head">
                <h2>
                    <i class="fa-solid fa-calendar-plus"></i>
                    Create Event
                </h2>
                <button class="cr-close" type="button" title="Close">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>

            <div class="cr-body">
                <label>Event title</label>
                <input type="text" id="evTitle" placeholder="e.g. Gaming Night" maxlength="80">

                <label>Description</label>
                <textarea id="evDesc" rows="3" placeholder="What will happen at this event?"></textarea>

                <label>Location</label>
                <input type="text" id="evLocation" placeholder="e.g. Online / Dhaka" maxlength="100">

                <label>Date &amp; time</label>
                <input type="datetime-local" id="evDate" min="${minDate}">
            </div>

            <div class="cr-actions">
                <button class="socialhub-cr-cancel" type="button">Cancel</button>
                <button class="socialhub-create-btn" type="button">
                    <i class="fa-solid fa-calendar-check"></i>
                    Create Event
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
                modal.querySelector("#evTitle").value.trim();

            const description =
                modal.querySelector("#evDesc").value.trim();

            const eventLocation =
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
                        location: eventLocation,
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

    const countPill =
        document.getElementById("eventsCount");

    if (countPill) {

        countPill.textContent =
            events.length + " events";
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
            <div class="event-card-banner${bannerClass}">
                <i class="fa-solid fa-calendar-days"></i>
            </div>

            <div class="event-card-body">
                <h3>${socialhubEventsEscape(event.title)}</h3>
                <p>${socialhubEventsEscape(event.description || "")}</p>
                <div class="event-card-meta">
                    <div class="meta-row">
                        <i class="fa-regular fa-clock"></i>
                        ${socialhubEventsEscape(socialhubEventsFormatDate(event.event_date))}
                    </div>
                    ${
                        event.location
                            ? `
                                <div class="meta-row">
                                    <i class="fa-solid fa-location-dot"></i>
                                    ${socialhubEventsEscape(event.location)}
                                </div>
                            `
                            : ""
                    }
                    <div class="meta-row going-row">
                        <i class="fa-solid fa-user-group"></i>
                        <strong>${goingCount[event.id] || 0} going</strong>
                    </div>
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

        <div class="event-cover">
            <i class="fa-solid fa-calendar-days"></i>
        </div>

        <div class="event-hero">

            <h1>${socialhubEventsEscape(event.title)}</h1>

            <div class="event-info-row">
                <div class="info-icon">
                    <i class="fa-regular fa-calendar"></i>
                </div>
                <div class="info-text">
                    <b>Date &amp; time</b>
                    <div>${socialhubEventsEscape(socialhubEventsFormatDate(event.event_date))}</div>
                </div>
            </div>

            ${
                event.location
                    ? `
                        <div class="event-info-row">
                            <div class="info-icon">
                                <i class="fa-solid fa-location-dot"></i>
                            </div>
                            <div class="info-text">
                                <b>Location</b>
                                <div>${socialhubEventsEscape(event.location)}</div>
                            </div>
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
                                <i class="fa-solid fa-trash-can"></i>
                                Delete Event
                            </button>
                        `
                        : `
                            <button
                                class="event-rsvp-btn"
                                data-active="${myStatus === "going" ? "going" : ""}"
                                onclick="socialhubEventRsvp('${event.id}', 'going', this)"
                            >
                                <i class="fa-solid fa-check"></i>
                                Going
                            </button>

                            <button
                                class="event-rsvp-btn"
                                data-active="${myStatus === "maybe" ? "maybe" : ""}"
                                onclick="socialhubEventRsvp('${event.id}', 'maybe', this)"
                            >
                                <i class="fa-solid fa-question"></i>
                                Maybe
                            </button>

                            <button
                                class="event-rsvp-btn"
                                data-active="${myStatus === "declined" ? "declined" : ""}"
                                onclick="socialhubEventRsvp('${event.id}', 'declined', this)"
                            >
                                <i class="fa-solid fa-xmark"></i>
                                Declined
                            </button>

                            ${
                                myStatus
                                    ? `
                                        <button
                                            class="event-rsvp-btn"
                                            onclick="socialhubEventCancelRsvp('${event.id}', this)"
                                        >
                                            <i class="fa-solid fa-ban"></i>
                                            Remove RSVP
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
            <h4><i class="fa-solid fa-check"></i> Going (${going.length})</h4>
            <div class="attendee-row">${
                going.length
                    ? going.map(g => g.html).join("")
                    : '<span style="font-size:13px;color:#65676b;">No one yet</span>'
            }</div>
        </div>

        <div class="event-attendee-group">
            <h4 class="h4-maybe"><i class="fa-solid fa-question"></i> Maybe (${maybe.length})</h4>
            <div class="attendee-row">${
                maybe.length
                    ? maybe.map(g => g.html).join("")
                    : '<span style="font-size:13px;color:#65676b;">No one yet</span>'
            }</div>
        </div>

        <div class="event-attendee-group">
            <h4 class="h4-declined"><i class="fa-solid fa-xmark"></i> Declined (${declined.length})</h4>
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