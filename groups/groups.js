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
// SOCIALHUB - GROUPS (👥 Communities)
// ======================================================
// groups.html  -> group list + create
// group.html   -> group feed + join/leave + members
//
// Group posts live in the posts table (group_id column)
// and reuse the normal post card + interactions.
// ======================================================

(function socialhubGroupsInjectStyles() {

    const style =
        document.createElement("style");

    style.textContent = `

.groups-main {
    max-width: 900px;
    margin: 0 auto;
    padding: 18px 14px 40px;
}

.groups-head {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 4px;
}

.groups-head .groups-head-icon {
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

.groups-main h1 {
    margin: 0;
    font-size: 22px;
}

.groups-main .groups-sub {
    margin: 0 0 16px 56px;
    color: #65676b;
    font-size: 13.5px;
}

.groups-top-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 14px;
}

.groups-count-pill {
    font-size: 13.5px;
    font-weight: 600;
    color: #65676b;
    background: #fff;
    padding: 8px 16px;
    border-radius: 20px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.groups-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 14px;
}

.group-card {
    background: #fff;
    border-radius: 12px;
    padding: 18px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    transition: 0.15s;
    display: flex;
    flex-direction: column;
}

.group-card:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.14);
    transform: translateY(-1px);
}

.group-card-top {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 10px;
}

.group-avatar {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #1877f2, #42b0ff);
    color: #fff;
    font-size: 22px;
    flex-shrink: 0;
}

.group-card h3 {
    margin: 0;
    font-size: 15.5px;
}

.group-card p {
    margin: 0;
    font-size: 13px;
    color: #65676b;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    flex-grow: 1;
}

.group-card-bottom {
    border-top: 1px solid #e4e6eb;
    margin-top: 12px;
    padding-top: 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.group-card-bottom .group-card-meta {
    font-size: 12.5px;
    color: #65676b;
    font-weight: 600;
}

.group-card-bottom .group-card-meta i {
    color: #1877f2;
    margin-right: 4px;
}

.group-public-pill {
    font-size: 12px;
    font-weight: 700;
    color: #31a24c;
    background: #e9f9ef;
    padding: 5px 12px;
    border-radius: 14px;
    display: inline-flex;
    align-items: center;
    gap: 5px;
}

/* Group page */
.group-page {
    max-width: 780px;
    margin: 0 auto;
    padding: 18px 14px 40px;
}

.group-cover {
    height: 150px;
    border-radius: 12px 12px 0 0;
    background: linear-gradient(135deg, #1877f2, #42b0ff);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 52px;
    color: rgba(255, 255, 255, 0.95);
    position: relative;
    overflow: hidden;
}

.group-cover::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(0,0,0,0.08), rgba(0,0,0,0.28));
}

.group-cover i {
    filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3));
}

.group-hero {
    background: #fff;
    border-radius: 0 0 12px 12px;
    padding: 20px 22px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    margin-bottom: 16px;
}

.group-hero .group-hero-top {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 10px;
}

.group-hero .group-hero-avatar {
    width: 68px;
    height: 68px;
    border-radius: 50%;
    background: linear-gradient(135deg, #1877f2, #42b0ff);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 30px;
    color: #fff;
    flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.group-hero h1 {
    margin: 0 0 3px;
    font-size: 22px;
}

.group-hero .group-hero-meta {
    margin: 0;
    font-size: 13px;
    color: #65676b;
}

.group-hero .group-hero-meta i {
    color: #1877f2;
    margin-right: 4px;
}

.group-hero .group-hero-desc {
    margin: 8px 0 14px;
    font-size: 14px;
    color: #65676b;
}

.group-hero .group-hero-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
}

.group-join-btn {
    border: none;
    background: #1877f2;
    color: #fff;
    padding: 11px 24px;
    border-radius: 22px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transition: 0.12s;
}

.group-join-btn:hover {
    background: #166fe5;
}

.group-join-btn.leave {
    background: #e4e6eb;
    color: #1c1e21;
}

.group-join-btn.leave:hover {
    background: #d8dadf;
}

.group-feed-title {
    font-size: 17px;
    font-weight: 700;
    margin: 20px 0 10px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.group-feed-title i {
    color: #1877f2;
}

.group-composer {
    background: #fff;
    border-radius: 12px;
    padding: 14px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    margin-bottom: 14px;
}

.group-composer textarea {
    width: 100%;
    box-sizing: border-box;
    border: none;
    outline: none;
    font-size: 14.5px;
    font-family: inherit;
    resize: none;
    min-height: 54px;
    background: transparent;
}

.group-composer .group-composer-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 8px;
    border-top: 1px solid #e4e6eb;
    padding-top: 10px;
}

.group-composer .group-composer-row label {
    cursor: pointer;
    font-size: 14px;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    color: #65676b;
    font-weight: 600;
}

.group-composer .group-composer-row label:hover {
    color: #1877f2;
}

.group-composer .group-composer-row img {
    width: 42px;
    height: 42px;
    border-radius: 8px;
    object-fit: cover;
}

.group-members-title {
    font-size: 17px;
    font-weight: 700;
    margin: 20px 0 10px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.group-members-title i {
    color: #1877f2;
}

.group-members {
    background: #fff;
    border-radius: 12px;
    padding: 14px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}

.group-member {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    padding: 6px 12px;
    border-radius: 20px;
    background: #f0f2f5;
    transition: 0.12s;
}

.group-member:hover {
    background: #e4e6eb;
}

.group-member img,
.group-member .group-member-avatar {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    object-fit: cover;
    background: #1877f2;
    color: #fff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
}

.group-member .fa-crown {
    color: #f7b928;
    font-size: 12px;
}

.group-member .fa-user-shield {
    color: #1877f2;
    font-size: 12px;
}

.group-member.manageable {
    flex-wrap: wrap;
    row-gap: 4px;
}

.group-member-actions {
    display: inline-flex;
    gap: 5px;
    align-items: center;
}

.gm-role-btn {
    border: none;
    background: #e4e6eb;
    color: #1c1e21;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    font-size: 11px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.gm-role-btn:hover {
    background: #1877f2;
    color: #fff;
}

.gm-role-btn.danger:hover {
    background: #e41e3f;
}

.group-cover {
    position: relative;
}

.group-cover-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: inherit;
}

.group-cover-btn {
    position: absolute;
    right: 12px;
    bottom: 12px;
    border: none;
    background: rgba(0, 0, 0, 0.65);
    color: #fff;
    width: 38px;
    height: 38px;
    border-radius: 50%;
    font-size: 15px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;
}

.group-cover-btn:hover {
    background: rgba(0, 0, 0, 0.85);
}

.group-invite-btn {
    border: none;
    background: #1877f2;
    color: #fff;
    padding: 9px 18px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 7px;
}

.group-invite-btn:hover {
    background: #166fe5;
}

body.dark-mode .gm-role-btn {
    background: #3a3b3c;
    color: #e4e6eb;
}

body.dark-mode .gm-role-btn:hover {
    background: #1877f2;
    color: #fff;
}

/* Invite modal */
.group-invite-modal {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    padding: 20px;
}

.group-invite-box {
    background: #fff;
    border-radius: 10px;
    width: 100%;
    max-width: 430px;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
    overflow: hidden;
    max-height: 82vh;
    display: flex;
    flex-direction: column;
}

.group-invite-head {
    padding: 14px 16px;
    border-bottom: 1px solid #e4e6eb;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.group-invite-head h3 {
    margin: 0;
    font-size: 16px;
}

.group-invite-close {
    border: none;
    background: #e4e6eb;
    color: #050505;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    font-size: 14px;
    cursor: pointer;
}

.group-invite-body {
    padding: 12px 16px;
    overflow-y: auto;
    flex: 1;
}

.group-invite-person {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 0;
    border-bottom: 1px solid #f0f2f5;
}

.group-invite-person:last-child {
    border-bottom: none;
}

.group-invite-person .group-member-avatar,
.group-invite-person img {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
}

.group-invite-person .gi-name {
    flex: 1;
    font-size: 14px;
    font-weight: 600;
}

.group-invite-person .gi-btn {
    border: none;
    background: #1877f2;
    color: #fff;
    padding: 7px 16px;
    border-radius: 18px;
    font-size: 12.5px;
    font-weight: 700;
    cursor: pointer;
}

.group-invite-person .gi-btn:disabled {
    background: #e4e6eb;
    color: #65676b;
    cursor: default;
}

body.dark-mode .group-invite-box {
    background: #242526;
}

body.dark-mode .group-invite-head {
    border-bottom-color: #3a3b3c;
}

body.dark-mode .group-invite-head h3 {
    color: #e4e6eb;
}

body.dark-mode .group-invite-close {
    background: #3a3b3c;
    color: #e4e6eb;
}

body.dark-mode .group-invite-person {
    border-bottom-color: #3a3b3c;
}

body.dark-mode .group-invite-person .gi-name {
    color: #e4e6eb;
}

body.dark-mode .group-invite-person .gi-btn:disabled {
    background: #3a3b3c;
    color: #b0b3b8;
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

body.dark-mode .group-card,
body.dark-mode .group-hero,
body.dark-mode .group-composer,
body.dark-mode .group-members,
body.dark-mode .socialhub-cr-box,
body.dark-mode .groups-count-pill {
    background: #242526;
}

body.dark-mode .group-card p,
body.dark-mode .group-hero .group-hero-meta,
body.dark-mode .groups-main .groups-sub,
body.dark-mode .groups-count-pill,
body.dark-mode .group-card-bottom .group-card-meta,
body.dark-mode .group-hero .group-hero-desc,
body.dark-mode .group-composer .group-composer-row label {
    color: #b0b3b8;
}

body.dark-mode .group-card-bottom {
    border-top-color: #3a3b3c;
}

body.dark-mode .group-composer textarea {
    color: #e4e6eb;
}

body.dark-mode .group-composer .group-composer-row {
    border-top-color: #3a3b3c;
}

body.dark-mode .group-member {
    background: #3a3b3c;
    color: #e4e6eb;
}

body.dark-mode .group-member:hover {
    background: #4e4f50;
}

body.dark-mode .group-join-btn.leave {
    background: #3a3b3c;
    color: #e4e6eb;
}

body.dark-mode .cr-body input,
body.dark-mode .cr-body textarea {
    background: #3a3b3c;
    border-color: #4e4f50;
    color: #e4e6eb;
}

body.dark-mode .socialhub-cr-box .cr-head {
    border-bottom-color: #3a3b3c;
}

body.dark-mode .cr-actions {
    border-top-color: #3a3b3c;
}
`;

    document.head.appendChild(style);
})();


// ======================================================
// 1. HELPERS
// ======================================================

function socialhubGroupsEscape(text) {

    const div =
        document.createElement("div");

    div.innerText =
        text || "";

    return div.innerHTML;
}


async function socialhubGroupsGetMe() {

    const {
        data,
        error
    } = await db.auth.getUser();

    if (error || !data.user) {

        return null;
    }

    return data.user;
}


function socialhubGroupsAvatarHTML(profile) {

    if (profile && profile.avatar_url) {

        return `
            <img
                src="${socialhubGroupsEscape(profile.avatar_url)}"
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
        <span class="group-member-avatar">
            ${socialhubGroupsEscape(letter)}
        </span>
    `;
}


function socialhubGroupsToast(message) {

    const old =
        document.querySelector(".socialhub-groups-toast");

    if (old) {
        old.remove();
    }

    const toast =
        document.createElement("div");

    toast.className = "socialhub-groups-toast";

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


// ======================================================
// 2. CREATE MODAL
// ======================================================

function socialhubGroupsOpenCreateModal() {

    const modal =
        document.createElement("div");

    modal.className = "socialhub-cr-modal";

    modal.innerHTML = `
        <div class="socialhub-cr-box">

            <div class="cr-head">

                <h2>
                    <i class="fa-solid fa-users" style="color:#1877f2;"></i>
                    Create Group
                </h2>

                <button class="cr-close" type="button" title="Close">
                    <i class="fa-solid fa-xmark"></i>
                </button>

            </div>

            <div class="cr-body">

                <label>Group name</label>
                <input type="text" id="grName" placeholder="e.g. Web Developers BD" maxlength="60">

                <label>Description</label>
                <textarea id="grDesc" rows="3" placeholder="What is this group about?"></textarea>

            </div>

            <div class="cr-actions">
                <button class="socialhub-cr-cancel" type="button">Cancel</button>
                <button class="socialhub-create-btn" type="button">
                    <i class="fa-solid fa-plus"></i>
                    Create Group
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

            const name =
                modal.querySelector("#grName").value.trim();

            const description =
                modal.querySelector("#grDesc").value.trim();

            if (!name) {

                socialhubGroupsToast("Group name is required.");

                return;
            }

            const me =
                await socialhubGroupsGetMe();

            if (!me) {

                socialhubGroupsToast("Please login first.");

                return;
            }

            const {
                data,
                error
            } = await db
                .from("groups")
                .insert({
                    name,
                    description,
                    created_by: me.id
                })
                .select("id")
                .single();

            if (error) {

                socialhubGroupsToast("Could not create group: " + error.message);

                return;
            }

            await db
                .from("group_members")
                .insert({
                    group_id: data.id,
                    user_id: me.id,
                    role: "admin"
                });

            modal.remove();

            socialhubGroupsToast("✅ Group created!");

            setTimeout(() => {

                location.href = `../groups/group.html?id=${data.id}`;
            }, 700);
        });
}


// ======================================================
// 3. GROUP LIST PAGE (groups.html)
// ======================================================

async function socialhubGroupsLoad() {

    const grid =
        document.getElementById("groupsGrid");

    if (!grid) {
        return;
    }

    const {
        data: groups,
        error
    } = await db
        .from("groups")
        .select("id, name, description, created_by, created_at")
        .order("created_at", { ascending: false });

    if (error) {

        console.error("❌ Groups load error:", error);

        grid.innerHTML = `
            <p class="empty-message" style="grid-column:1/-1;">
                Could not load groups.
            </p>
        `;

        return;
    }

    if (!groups || groups.length === 0) {

        grid.innerHTML = `
            <p class="empty-message" style="grid-column:1/-1;">
                No groups yet. Create the first one!
            </p>
        `;

        return;
    }

    const countPill =
        document.getElementById("groupsCount");

    if (countPill) {

        countPill.textContent =
            groups.length + " groups";
    }

    const {
        data: members
    } = await db
        .from("group_members")
        .select("group_id");

    const memberCount = {};

    (members || []).forEach(m => {

        memberCount[m.group_id] =
            (memberCount[m.group_id] || 0) + 1;
    });

    grid.innerHTML = "";

    groups.forEach(group => {

        const card =
            document.createElement("div");

        card.className = "group-card";

        card.innerHTML = `

            <div class="group-card-top">

                <div class="group-avatar">
                    <i class="fa-solid fa-users"></i>
                </div>

                <h3>${socialhubGroupsEscape(group.name)}</h3>

            </div>

            <p>${socialhubGroupsEscape(group.description || "")}</p>

            <div class="group-card-bottom">

                <div class="group-card-meta">
                    <i class="fa-solid fa-user-group"></i>
                    ${memberCount[group.id] || 1} members
                </div>

                <span class="group-public-pill">
                    <i class="fa-solid fa-globe"></i>
                    Public
                </span>

            </div>
        `;

        card.addEventListener("click", () => {

            location.href = `../groups/group.html?id=${group.id}`;
        });

        grid.appendChild(card);
    });
}


// ======================================================
// 4. GROUP PAGE (group.html?id=X)
// ======================================================

let socialhubGroupCache = null;


async function socialhubGroupLoad() {

    const params =
        new URLSearchParams(window.location.search);

    const groupId =
        params.get("id");

    if (!groupId) {

        location.href = "../groups/index.html";

        return;
    }

    const me =
        await socialhubGroupsGetMe();

    if (!me) {

        location.href = "../auth/index.html";

        return;
    }

    const {
        data: group,
        error
    } = await db
        .from("groups")
        .select("*")
        .eq("id", groupId)
        .single();

    if (error || !group) {

        document.querySelector(".group-page").innerHTML =
            '<p class="empty-message">Group not found.</p>';

        return;
    }

    socialhubGroupCache = group;

    document.title = group.name + " - Friendio";

    const isCreator =
        group.created_by === me.id;

    const {
        data: myMembership
    } = await db
        .from("group_members")
        .select("*")
        .eq("group_id", groupId)
        .eq("user_id", me.id)
        .maybeSingle();

    const isManager =
        isCreator ||
        (myMembership && myMembership.role === "admin");

    const {
        data: memberRows
    } = await db
        .from("group_members")
        .select("user_id, role, created_at")
        .eq("group_id", groupId)
        .order("created_at", { ascending: false });

    const memberIds =
        (memberRows || []).map(m => m.user_id);

    let memberProfiles = [];

    if (memberIds.length > 0) {

        const {
            data: profiles
        } = await db
            .from("profiles")
            .select("id, full_name, username, avatar_url")
            .in("id", memberIds);

        memberProfiles = profiles || [];
    }

    const memberMap = new Map();

    memberProfiles.forEach(p => {

        memberMap.set(p.id, p);
    });

    const memberCount =
        memberRows?.length || 1;

    const hero =
        document.getElementById("groupHero");

    hero.innerHTML = `

        <div class="group-cover">
            ${
                group.cover_url
                    ? `<img class="group-cover-img" src="${socialhubGroupsEscape(group.cover_url)}" alt="">`
                    : '<i class="fa-solid fa-users"></i>'
            }
            ${
                isCreator
                    ? `
                        <button
                            class="group-cover-btn"
                            type="button"
                            title="Upload cover photo"
                            onclick="document.getElementById('groupCoverFile').click()"
                        >
                            <i class="fa-solid fa-camera"></i>
                        </button>
                        <input type="file" id="groupCoverFile" accept="image/*" hidden onchange="socialhubGroupPickCover(this)">
                    `
                    : ""
            }
        </div>

        <div class="group-hero">

            <div class="group-hero-top">

                <div class="group-hero-avatar">
                    <i class="fa-solid fa-users"></i>
                </div>

                <div>
                    <h1>${socialhubGroupsEscape(group.name)}</h1>
                    <p class="group-hero-meta">
                        <i class="fa-solid fa-user-group"></i>
                        ${memberCount} members ·
                        <i class="fa-solid fa-globe"></i>
                        Public group
                        ${
                            isCreator
                                ? " · You created this group"
                                : " · Admin: " + socialhubGroupsEscape(
                                    memberMap.get(group.created_by)?.full_name || "Admin"
                                )
                        }
                    </p>
                </div>

            </div>

            <p class="group-hero-desc">
                ${socialhubGroupsEscape(group.description || "No description yet.")}
            </p>

            <div class="group-hero-actions">

                ${
                    isManager
                        ? `
                            <button
                                class="group-invite-btn"
                                onclick="socialhubGroupInviteOpen('${group.id}')"
                            >
                                <i class="fa-solid fa-user-plus"></i>
                                Invite Friends
                            </button>
                        `
                        : ""
                }

                ${
                    isCreator
                        ? `
                            <button
                                class="socialhub-danger-btn"
                                onclick="socialhubGroupDelete('${group.id}', this)"
                            >
                                <i class="fa-solid fa-trash-can"></i>
                                Delete Group
                            </button>
                        `
                        : myMembership
                            ? `
                                <button
                                    class="group-join-btn leave"
                                    onclick="socialhubGroupLeave('${group.id}', this)"
                                >
                                    <i class="fa-solid fa-user-minus"></i>
                                    Leave Group
                                </button>
                            `
                            : `
                                <button
                                    class="group-join-btn"
                                    onclick="socialhubGroupJoin('${group.id}', this)"
                                >
                                    <i class="fa-solid fa-user-plus"></i>
                                    Join Group
                                </button>
                            `
                }

            </div>

        </div>
    `;

    // Members
    const membersBox =
        document.getElementById("groupMembers");

    membersBox.innerHTML = "";

    (memberRows || []).forEach(member => {

        const profile =
            memberMap.get(member.user_id);

        if (!profile) {
            return;
        }

        const isOwner =
            member.user_id === group.created_by;

        const roleLabel =
            member.role === "owner"
                ? "Owner"
                : member.role === "admin"
                    ? "Admin"
                    : "";

        const chip =
            document.createElement("div");

        chip.className = "group-member";

        if (isManager && !isOwner && member.user_id !== me.id) {

            chip.classList.add("manageable");
        }

        chip.innerHTML = `
            ${socialhubGroupsAvatarHTML(profile)}
            ${socialhubGroupsEscape(profile.full_name || "@" + profile.username || "User")}
            ${
                isOwner
                    ? '<i class="fa-solid fa-crown" title="Owner"></i>'
                    : roleLabel === "Admin"
                        ? '<i class="fa-solid fa-user-shield" title="Admin"></i>'
                        : ""
            }
            ${
                isManager && !isOwner && member.user_id !== me.id
                    ? `
                        <span class="group-member-actions" onclick="event.stopPropagation()">
                            ${
                                member.role === "admin"
                                    ? `<button class="gm-role-btn" title="Remove admin" onclick="socialhubGroupSetRole('${group.id}', '${member.user_id}', 'member', this)">
                                        <i class="fa-solid fa-user-minus"></i>
                                    </button>`
                                    : `<button class="gm-role-btn" title="Make admin" onclick="socialhubGroupSetRole('${group.id}', '${member.user_id}', 'admin', this)">
                                        <i class="fa-solid fa-user-shield"></i>
                                    </button>`
                            }
                            <button class="gm-role-btn danger" title="Remove from group" onclick="socialhubGroupRemoveMember('${group.id}', '${member.user_id}', this)">
                                <i class="fa-solid fa-xmark"></i>
                            </button>
                        </span>
                    `
                    : ""
            }
        `;

        chip.addEventListener("click", () => {

            location.href = `../profile/user-profile.html?user=${member.user_id}`;
        });

        membersBox.appendChild(chip);
    });

    // Posts
    await socialhubGroupLoadPosts(groupId, me.id);
}


async function socialhubGroupLoadPosts(groupId, myId) {

    const container =
        document.getElementById("groupPosts");

    const {
        data: posts,
        error
    } = await db
        .from("posts")
        .select("*")
        .eq("group_id", groupId)
        .order("created_at", { ascending: false });

    if (error) {

        console.error("❌ Group posts error:", error);

        return;
    }

    container.innerHTML = "";

    if (!posts || posts.length === 0) {

        container.innerHTML = `
            <p class="empty-message">
                No posts in this group yet. Be the first to post!
            </p>
        `;

        return;
    }

    const userIds =
        [...new Set(
            posts.map(p => p.user_id)
        )];

    const {
        data: profiles
    } = await db
        .from("profiles")
        .select("id, full_name, username, avatar_url")
        .in("id", userIds);

    const profileMap = new Map();

    (profiles || []).forEach(p => {

        profileMap.set(p.id, p);
    });

    posts.forEach(post => {

        if (
            typeof socialhubBuildPostArticle ===
            "function"
        ) {

            container.appendChild(
                socialhubBuildPostArticle(
                    post,
                    profileMap
                )
            );

        } else {

            container.innerHTML += `
                <div class="post">
                    <p>${socialhubGroupsEscape(post.content || "")}</p>
                </div>
            `;
        }
    });

    if (typeof socialhubLoadInteractions === "function") {

        socialhubLoadInteractions();
    }
}


async function socialhubGroupJoin(groupId, button) {

    const me =
        await socialhubGroupsGetMe();

    if (!me) {
        return;
    }

    const { error } =
        await db
            .from("group_members")
            .insert({
                group_id: groupId,
                user_id: me.id
            });

    if (error) {

        alert("Could not join: " + error.message);

        return;
    }

    socialhubGroupsToast("✅ Joined!");

    button.disabled = true;

    setTimeout(() => location.reload(), 700);
}


async function socialhubGroupLeave(groupId, button) {

    const me =
        await socialhubGroupsGetMe();

    if (!me) {
        return;
    }

    const ok =
        confirm("Leave this group?");

    if (!ok) {
        return;
    }

    await db
        .from("group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", me.id);

    socialhubGroupsToast("You left the group.");

    setTimeout(() => location.reload(), 700);
}


async function socialhubGroupDelete(groupId, button) {

    const ok =
        confirm(
            "Delete this group permanently?\n\n" +
            "All group posts will be removed."
        );

    if (!ok) {
        return;
    }

    const { error } =
        await db
            .from("groups")
            .delete()
            .eq("id", groupId);

    if (error) {

        alert("Could not delete: " + error.message);

        return;
    }

    location.href = "../groups/index.html";
}


async function socialhubGroupPost(button) {

    const params =
        new URLSearchParams(window.location.search);

    const groupId =
        params.get("id");

    const me =
        await socialhubGroupsGetMe();

    if (!me) {
        return;
    }

    const composer =
        document.getElementById("groupComposer");

    const input =
        composer.querySelector("textarea");

    const fileInput =
        composer.querySelector('input[type="file"]');

    const text =
        input.value.trim();

    if (!text && (!fileInput.files || fileInput.files.length === 0)) {

        socialhubGroupsToast("Write something first.");

        return;
    }

    button.disabled = true;

    button.textContent = "Posting...";

    let imageUrl = null;

    if (fileInput.files && fileInput.files.length > 0) {

        const file =
            fileInput.files[0];

        const path =
            `group/${me.id}/${Date.now()}-${file.name}`;

        const { error: uploadError } =
            await db.storage
                .from("post-images")
                .upload(path, file);

        if (uploadError) {

            alert("Image upload failed: " + uploadError.message);

            button.disabled = false;

            button.textContent = "Post";

            return;
        }

        const { data: pub } =
            db.storage
                .from("post-images")
                .getPublicUrl(path);

        imageUrl = pub.publicUrl;
    }

    const { error } =
        await db
            .from("posts")
            .insert({
                user_id: me.id,
                content: text,
                image_url: imageUrl,
                group_id: groupId,
                audience: "public"
            });

    button.disabled = false;

    button.textContent = "Post";

    if (error) {

        alert("Could not post: " + error.message);

        return;
    }

    input.value = "";

    fileInput.value = "";

    const preview =
        composer.querySelector(".group-composer-preview");

    if (preview) {
        preview.remove();
    }

    socialhubGroupsToast("✅ Posted in group!");

    socialhubGroupLoadPosts(groupId, me.id);
}


function socialhubGroupPickImage(input) {

    const composer =
        document.getElementById("groupComposer");

    if (!composer) {
        return;
    }

    composer
        .querySelectorAll(".group-composer-preview")
        .forEach(el => el.remove());

    if (!input.files || input.files.length === 0) {
        return;
    }

    const file =
        input.files[0];

    if (!file.type.startsWith("image/")) {

        alert("Please choose an image.");

        input.value = "";

        return;
    }

    const reader =
        new FileReader();

    reader.onload = event => {

        const img =
            document.createElement("img");

        img.className = "group-composer-preview";

        img.src = event.target.result;

        img.style.cssText = `
            width: 56px;
            height: 56px;
            border-radius: 10px;
            object-fit: cover;
            margin-left: 4px;
        `;

        composer.querySelector(".group-composer-row").appendChild(img);
    };

    reader.readAsDataURL(file);
}


// ======================================================
// GROUP COVER UPLOAD (creator only)
// ======================================================

function socialhubGroupPickCover(input) {

    if (!input.files || input.files.length === 0) {
        return;
    }

    const file =
        input.files[0];

    if (!file.type.startsWith("image/")) {

        alert("Please choose an image.");

        input.value = "";

        return;
    }

    const reader =
        new FileReader();

    reader.onload = async () => {

        const dataUrl =
            reader.result;

        const groupId =
            new URLSearchParams(window.location.search).get("id");

        if (!groupId) {
            return;
        }

        const { data: authData } = await db.auth.getUser();

        const me = authData && authData.user;

        if (!me) {
            return;
        }

        const { error } = await db
            .from("groups")
            .update({ cover_url: dataUrl })
            .eq("id", groupId)
            .eq("created_by", me.id);

        if (error) {

            alert("Could not upload cover: " + error.message);

            input.value = "";

            return;
        }

        socialhubGroupsToast("✅ Cover updated!");

        input.value = "";

        setTimeout(() => {
            socialhubGroupLoad();
        }, 400);
    };

    reader.onerror = () => {

        alert("Could not read that file.");

        input.value = "";
    };

    reader.readAsDataURL(file);
}


// ======================================================
// INVITE FRIENDS TO GROUP (owner/admin only)
// ======================================================

async function socialhubGroupInviteOpen(groupId) {

    const { data: authData } = await db.auth.getUser();

    const me = authData && authData.user;

    if (!me) {
        return;
    }

    // Existing members
    const { data: members } = await db
        .from("group_members")
        .select("user_id")
        .eq("group_id", groupId);

    const memberSet =
        new Set((members || []).map(m => m.user_id));

    // My accepted friends
    const { data: f1 } = await db
        .from("friendships")
        .select("requester_id")
        .eq("addressee_id", me.id)
        .eq("status", "accepted");

    const { data: f2 } = await db
        .from("friendships")
        .select("addressee_id")
        .eq("requester_id", me.id)
        .eq("status", "accepted");

    const friendIds = [
        ...new Set([
            ...(f1 || []).map(r => r.requester_id),
            ...(f2 || []).map(r => r.addressee_id)
        ])
    ].filter(id => !memberSet.has(id));

    const modal =
        document.createElement("div");

    modal.className = "group-invite-modal";

    modal.innerHTML = `
        <div class="group-invite-box">

            <div class="group-invite-head">
                <h3><i class="fa-solid fa-user-plus" style="color:#1877f2;"></i> Invite Friends</h3>
                <button class="group-invite-close" type="button">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>

            <div class="group-invite-body" id="groupInviteBody">
                <p class="empty-message">Loading friends...</p>
            </div>

        </div>
    `;

    modal.addEventListener("click", event => {

        if (event.target === modal) {
            modal.remove();
        }
    });

    modal
        .querySelector(".group-invite-close")
        .addEventListener("click", () => modal.remove());

    document.body.appendChild(modal);

    const body =
        modal.querySelector("#groupInviteBody");

    let profiles = [];

    if (friendIds.length > 0) {

        const { data: rows } = await db
            .from("profiles")
            .select("id, full_name, username, avatar_url")
            .in("id", friendIds);

        profiles = rows || [];
    }

    if (profiles.length === 0) {

        body.innerHTML =
            '<p class="empty-message">No friends to invite — add some friends first!</p>';

        return;
    }

    body.innerHTML = "";

    profiles.forEach(profile => {

        const row =
            document.createElement("div");

        row.className = "group-invite-person";

        row.innerHTML = `
            ${
                profile.avatar_url
                    ? `<img src="${socialhubGroupsEscape(profile.avatar_url)}" alt="">`
                    : `<span class="group-member-avatar">${socialhubGroupsEscape((profile.full_name || "U").charAt(0).toUpperCase())}</span>`
            }
            <span class="gi-name">${socialhubGroupsEscape(profile.full_name || "@" + (profile.username || "user"))}</span>
            <button class="gi-btn" type="button">Invite</button>
        `;

        row
            .querySelector(".gi-btn")
            .addEventListener("click", async event => {

                const btn =
                    event.currentTarget;

                btn.disabled = true;

                const { error } = await db
                    .from("group_members")
                    .insert({
                        group_id: groupId,
                        user_id: profile.id,
                        role: "member"
                    });

                if (error) {

                    btn.disabled = false;

                    socialhubGroupsToast("Could not invite: " + error.message);

                    return;
                }

                btn.textContent = "Invited ✓";

                if (typeof socialhubNotify === "function") {

                    await socialhubNotify(
                        profile.id,
                        me.id,
                        "group_invite",
                        null,
                        null
                    );
                }

                socialhubGroupsToast(`Invited ${socialhubGroupsEscape(profile.full_name || "friend")}! 🎉`);

                setTimeout(() => {
                    socialhubGroupLoad();
                }, 600);
            });

        body.appendChild(row);
    });
}


// ======================================================
// ROLE MANAGEMENT (owner/admin only)
// ======================================================

async function socialhubGroupSetRole(groupId, userId, role, button) {

    const { error } = await db
        .from("group_members")
        .update({ role: role })
        .eq("group_id", groupId)
        .eq("user_id", userId);

    if (error) {

        socialhubGroupsToast("Could not change role: " + error.message);

        return;
    }

    socialhubGroupsToast(
        role === "admin"
            ? "✅ Made admin!"
            : "ℹ️ Admin removed."
    );

    setTimeout(() => {
        socialhubGroupLoad();
    }, 400);
}


async function socialhubGroupRemoveMember(groupId, userId, button) {

    const { error } = await db
        .from("group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", userId);

    if (error) {

        socialhubGroupsToast("Could not remove member: " + error.message);

        return;
    }

    socialhubGroupsToast("Member removed.");

    setTimeout(() => {
        socialhubGroupLoad();
    }, 400);
}


// ======================================================
// 5. AUTO-SYNC
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

    const page =
        socialhubPageId();

    const savedDarkMode =
        localStorage.getItem("darkMode");

    if (savedDarkMode === "true") {

        document.body.classList.add("dark-mode");
    }

    if (page === "../groups/index.html") {

        socialhubGroupsLoad();
    }

    if (page === "../groups/group.html") {

        socialhubGroupLoad();
    }

    console.log("✅ Groups activated!");
});