// ======================================================
// SOCIALHUB - BIRTHDAYS (🎂 calendar)
// ======================================================
// birthdays.html -> friends + own birthdays:
//  - "Birthdays today" section
//  - "This month" section
//  - Wish button opens the chat thread
// ======================================================

(function socialhubBirthdaysInjectStyles() {

    const style =
        document.createElement("style");

    style.textContent = `

.birthdays-main {
    max-width: 680px;
    margin: 0 auto;
    padding: 18px 14px 40px;
}

.birthdays-head {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 18px;
}

.birthdays-head .birthdays-head-icon {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: #ffe7f0;
    color: #e91e63;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 21px;
    flex-shrink: 0;
}

.birthdays-head h1 {
    margin: 0;
    font-size: 21px;
}

.birthdays-head .birthdays-sub {
    margin: 2px 0 0;
    font-size: 13.5px;
    color: #65676b;
}

.birthdays-section-title {
    font-size: 15px;
    font-weight: 800;
    margin: 18px 0 10px;
    display: flex;
    align-items: center;
    gap: 8px;
    color: #1c1e21;
}

.birthdays-section-title i {
    color: #e91e63;
}

.birthdays-section-title small {
    font-weight: 600;
    color: #65676b;
    background: #f0f2f5;
    padding: 3px 10px;
    border-radius: 12px;
    font-size: 11.5px;
}

.birthday-card {
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    padding: 12px 14px;
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 10px;
}

.birthday-avatar {
    width: 46px;
    height: 46px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
    background: #1877f2;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 19px;
    font-weight: 800;
    cursor: pointer;
}

.birthday-info {
    flex: 1;
    min-width: 0;
}

.birthday-info b {
    font-size: 14.5px;
    cursor: pointer;
    display: block;
}

.birthday-info b:hover {
    text-decoration: underline;
    color: #1877f2;
}

.birthday-info small {
    color: #65676b;
    font-size: 12.5px;
}

.birthday-info small .age {
    color: #1877f2;
    font-weight: 700;
}

.birthday-actions {
    display: flex;
    gap: 8px;
}

.birthday-wish-btn {
    border: none;
    background: #1877f2;
    color: #fff;
    padding: 9px 16px;
    border-radius: 18px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    transition: 0.12s;
    font-family: inherit;
}

.birthday-wish-btn:hover {
    background: #166fe5;
}

.birthday-today-badge {
    background: linear-gradient(135deg, #ff9a9e, #fad0c4);
    color: #c2185b;
    font-size: 11px;
    font-weight: 800;
    padding: 3px 10px;
    border-radius: 12px;
}

body.dark-mode .birthday-card {
    background: #242526;
}

body.dark-mode .birthdays-section-title {
    color: #e4e6eb;
}

body.dark-mode .birthdays-head .birthdays-sub,
body.dark-mode .birthday-info small {
    color: #b0b3b8;
}

body.dark-mode .birthdays-section-title small {
    background: #3a3b3c;
    color: #b0b3b8;
}
`;

    document.head.appendChild(style);
})();


// ======================================================
// HELPERS
// ======================================================

async function socialhubBirthdaysGetMe() {

    const {
        data,
        error
    } = await db.auth.getUser();

    if (error || !data.user) {
        return null;
    }

    return data.user;
}


async function socialhubBirthdaysFriendIds(meId) {

    const {
        data
    } = await db
        .from("friendships")
        .select("requester_id, addressee_id")
        .eq("status", "accepted");

    const ids = new Set();

    (data || []).forEach(f => {

        if (f.requester_id === meId) {

            ids.add(f.addressee_id);

        } else if (f.addressee_id === meId) {

            ids.add(f.requester_id);
        }
    });

    return [...ids];
}


function socialhubBirthdaysEscape(text) {

    const div =
        document.createElement("div");

    div.innerText =
        text || "";

    return div.innerHTML;
}


function socialhubBirthdaysParse(birthday) {

    if (!birthday) {
        return null;
    }

    const m =
        String(birthday).match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (!m) {
        return null;
    }

    return {
        year: parseInt(m[1], 10),
        month: parseInt(m[2], 10),
        day: parseInt(m[3], 10)
    };
}


function socialhubBirthdaysFormatDate(month, day) {

    const date =
        new Date(2000, month - 1, day);

    return date.toLocaleDateString(undefined, {
        month: "long",
        day: "numeric"
    });
}


function socialhubBirthdaysAge(birthYear) {

    if (!birthYear) {
        return null;
    }

    const age =
        new Date().getFullYear() - birthYear;

    return age >= 0 ? age : null;
}


// ======================================================
// LOAD
// ======================================================

async function socialhubBirthdaysLoad() {

    const body =
        document.getElementById("birthdaysBody");

    if (!body) {
        return;
    }

    const me =
        await socialhubBirthdaysGetMe();

    if (!me) {

        location.href = "../auth/index.html";

        return;
    }

    const friendIds =
        await socialhubBirthdaysFriendIds(me.id);

    const userIds =
        [me.id, ...friendIds];

    const { data: profiles, error } =
        await db
            .from("profiles")
            .select("id, full_name, avatar_url, birthday")
            .in("id", userIds);

    if (error) {

        console.error("Birthdays load error:", error);

        body.innerHTML =
            '<p class="empty-message">Could not load birthdays.</p>';

        return;
    }

    const now =
        new Date();

    const todayMonth =
        now.getMonth() + 1;

    const todayDay =
        now.getDate();

    const monthName =
        now.toLocaleDateString(undefined, { month: "long" });

    const todayList = [];

    const monthList = [];

    (profiles || []).forEach(profile => {

        const parsed =
            socialhubBirthdaysParse(profile.birthday);

        if (!parsed) {
            return;
        }

        const item = {
            id: profile.id,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
            birthday: parsed
        };

        if (
            parsed.month === todayMonth &&
            parsed.day === todayDay
        ) {

            todayList.push(item);

        } else if (parsed.month === todayMonth) {

            monthList.push(item);
        }
    });

    monthList.sort((a, b) => a.birthday.day - b.birthday.day);

    body.innerHTML = "";

    if (todayList.length === 0 && monthList.length === 0) {

        body.innerHTML = `
            <div class="birthday-card" style="justify-content:center;padding:40px 20px;">
                <div style="text-align:center;color:#65676b;">
                    <i class="fa-solid fa-cake-candles" style="font-size:34px;color:#c9ccd1;margin-bottom:10px;display:block;"></i>
                    <b>No birthdays ${todayList.length === 0 ? "this month" : ""}</b>
                    <br>
                    <small>Your friends' birthdays will show up here.</small>
                </div>
            </div>
        `;

        return;
    }

    // ---------- TODAY ----------
    if (todayList.length > 0) {

        const title =
            document.createElement("div");

        title.className = "birthdays-section-title";

        title.innerHTML =
            '<i class="fa-solid fa-cake-candles"></i> Birthdays today <small>🎉</small>';

        body.appendChild(title);

        todayList.forEach(item => {

            const age =
                socialhubBirthdaysAge(item.birthday.year);

            body.appendChild(
                socialhubBirthdaysCard(item, true, age)
            );
        });
    }

    // ---------- THIS MONTH ----------
    if (monthList.length > 0) {

        const title =
            document.createElement("div");

        title.className = "birthdays-section-title";

        title.innerHTML =
            `<i class="fa-solid fa-calendar-days"></i> This month — ${socialhubBirthdaysEscape(monthName)} <small>${monthList.length}</small>`;

        body.appendChild(title);

        monthList.forEach(item => {

            const age =
                socialhubBirthdaysAge(item.birthday.year);

            body.appendChild(
                socialhubBirthdaysCard(item, false, age)
            );
        });
    }
}


function socialhubBirthdaysCard(item, isToday, age) {

    const card =
        document.createElement("div");

    card.className = "birthday-card";

    const avatar =
        item.avatar_url
            ? `<img class="birthday-avatar" src="${socialhubBirthdaysEscape(item.avatar_url)}" alt="" onclick="location.href='../profile/user-profile.html?user=${item.id}'">`
            : `<div class="birthday-avatar" onclick="location.href='../profile/user-profile.html?user=${item.id}'">${socialhubBirthdaysEscape((item.full_name || "U").charAt(0).toUpperCase())}</div>`;

    card.innerHTML = `

        ${avatar}

        <div class="birthday-info">

            <b onclick="location.href='../profile/user-profile.html?user=${item.id}'">
                ${socialhubBirthdaysEscape(item.full_name || "User")}
                ${isToday ? '<span class="birthday-today-badge">TODAY</span>' : ""}
            </b>

            <small>
                ${socialhubBirthdaysFormatDate(item.birthday.month, item.birthday.day)}
                ${age !== null ? `<span class="age">· turning ${age}</span>` : ""}
            </small>

        </div>

        <div class="birthday-actions">

            <button class="birthday-wish-btn" type="button">
                <i class="fa-solid fa-heart"></i>
                ${isToday ? "Wish" : "Birthday"}
            </button>

        </div>
    `;

    card
        .querySelector(".birthday-wish-btn")
        .addEventListener("click", () => {

            location.href =
                `../messages/index.html?thread=${item.id}`;
        });

    return card;
}


document.addEventListener("DOMContentLoaded", () => {

    socialhubBirthdaysLoad();
});