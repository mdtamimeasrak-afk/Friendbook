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
    max-width: 860px;
    margin: 0 auto;
    padding: 18px 14px 40px;
}

.groups-main h1 {
    margin: 0 0 4px;
    font-size: 22px;
}

.groups-main .groups-sub {
    margin: 0 0 16px;
    color: #65676b;
    font-size: 13.5px;
}

.groups-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 12px;
}

.group-card {
    background: #fff;
    border-radius: 14px;
    padding: 16px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    cursor: pointer;
    transition: 0.15s;
}

.group-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
}

.group-avatar {
    width: 52px;
    height: 52px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    background: linear-gradient(135deg, #1877f2, #66a6ff);
    color: #fff;
    margin-bottom: 10px;
}

.group-card h3 {
    margin: 0 0 4px;
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
}

.group-card .group-card-meta {
    margin-top: 10px;
    font-size: 12.5px;
    color: #1877f2;
    font-weight: 700;
}

.socialhub-create-btn {
    border: none;
    background: #1877f2;
    color: #fff;
    padding: 10px 22px;
    border-radius: 24px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
}

.socialhub-create-btn:hover {
    background: #166fe5;
}

.socialhub-danger-btn {
    border: none;
    background: #e41e3f;
    color: #fff;
    padding: 8px 18px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
}

.socialhub-danger-btn:hover {
    background: #c81233;
}

/* Create modal */
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
    border-radius: 16px;
    width: 100%;
    max-width: 440px;
    padding: 22px;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
}

.socialhub-cr-box h2 {
    margin: 0 0 16px;
    font-size: 19px;
}

.socialhub-cr-box label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: #65676b;
    margin: 10px 0 6px;
}

.socialhub-cr-box input,
.socialhub-cr-box textarea {
    width: 100%;
    box-sizing: border-box;
    padding: 10px 12px;
    border: 1px solid #d4d7dd;
    border-radius: 8px;
    font-size: 14px;
    font-family: inherit;
    outline: none;
}

.socialhub-cr-box input:focus,
.socialhub-cr-box textarea:focus {
    border-color: #1877f2;
}

.socialhub-cr-actions {
    display: flex;
    gap: 10px;
    margin-top: 18px;
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

/* Group page */
.group-page {
    max-width: 760px;
    margin: 0 auto;
    padding: 18px 14px 40px;
}

.group-hero {
    background: #fff;
    border-radius: 16px;
    padding: 22px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    margin-bottom: 16px;
}

.group-hero .group-hero-top {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 10px;
}

.group-hero h1 {
    margin: 0 0 2px;
    font-size: 20px;
}

.group-hero .group-hero-meta {
    margin: 0;
    font-size: 13px;
    color: #65676b;
}

.group-hero .group-hero-desc {
    margin: 8px 0 14px;
    font-size: 14px;
}

.group-hero .group-hero-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
}

.group-feed-title {
    font-size: 16px;
    font-weight: 700;
    margin: 18px 0 10px;
}

.group-composer {
    background: #fff;
    border-radius: 14px;
    padding: 14px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
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
}

.group-composer .group-composer-row img {
    width: 42px;
    height: 42px;
    border-radius: 8px;
    object-fit: cover;
}

.group-members-title {
    font-size: 16px;
    font-weight: 700;
    margin: 18px 0 10px;
}

.group-members {
    background: #fff;
    border-radius: 14px;
    padding: 10px 14px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
}

.group-member {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    padding: 6px 10px;
    border-radius: 20px;
    background: #f0f2f5;
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

body.dark-mode .group-card,
body.dark-mode .group-hero,
body.dark-mode .group-composer,
body.dark-mode .group-members,
body.dark-mode .socialhub-cr-box {
    background: #242526;
}

body.dark-mode .group-card p,
body.dark-mode .group-hero .group-hero-meta,
body.dark-mode .groups-main .groups-sub {
    color: #b0b3b8;
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
            <h2>👥 Create Group</h2>

            <label>Group name</label>
            <input type="text" id="grName" placeholder="e.g. Web Developers BD" maxlength="60">

            <label>Description</label>
            <textarea id="grDesc" rows="3" placeholder="What is this group about?"></textarea>

            <div class="socialhub-cr-actions">
                <button class="socialhub-cr-cancel" type="button">Cancel</button>
                <button class="socialhub-create-btn" type="button">Create Group</button>
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

                location.href = `group.html?id=${data.id}`;
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

    const creatorIds =
        [...new Set(
            groups.map(g => g.created_by)
        )];

    const {
        data: profiles
    } = await db
        .from("profiles")
        .select("id, full_name")
        .in("id", creatorIds);

    const nameMap = {};

    (profiles || []).forEach(p => {

        nameMap[p.id] = p.full_name;
    });

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
            <div class="group-avatar">👥</div>

            <h3>${socialhubGroupsEscape(group.name)}</h3>

            <p>${socialhubGroupsEscape(group.description || "")}</p>

            <div class="group-card-meta">
                ${memberCount[group.id] || 1} members ·
                Created by ${socialhubGroupsEscape(nameMap[group.created_by] || "Someone")}
            </div>
        `;

        card.addEventListener("click", () => {

            location.href = `group.html?id=${group.id}`;
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

        location.href = "groups.html";

        return;
    }

    const me =
        await socialhubGroupsGetMe();

    if (!me) {

        location.href = "login.html";

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

    document.title = group.name + " - TRIYA";

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

        <div class="group-hero-top">

            <div class="group-avatar">👥</div>

            <div>
                <h1>${socialhubGroupsEscape(group.name)}</h1>
                <p class="group-hero-meta">
                    ${memberCount} members ·
                    ${
                        isCreator
                            ? "You created this group"
                            : "Admin: " + socialhubGroupsEscape(
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
                isCreator
                    ? `
                        <button
                            class="socialhub-danger-btn"
                            onclick="socialhubGroupDelete('${group.id}', this)"
                        >
                            🗑️ Delete Group
                        </button>
                    `
                    : myMembership
                        ? `
                            <button
                                class="socialhub-danger-btn"
                                onclick="socialhubGroupLeave('${group.id}', this)"
                            >
                                🚪 Leave Group
                            </button>
                        `
                        : `
                            <button
                                class="socialhub-create-btn"
                                onclick="socialhubGroupJoin('${group.id}', this)"
                            >
                                ➕ Join Group
                            </button>
                        `
            }

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

        const chip =
            document.createElement("div");

        chip.className = "group-member";

        chip.innerHTML = `
            ${socialhubGroupsAvatarHTML(profile)}
            ${socialhubGroupsEscape(profile.full_name || "@" + profile.username || "User")}
            ${member.role === "admin" ? " 👑" : ""}
        `;

        chip.addEventListener("click", () => {

            location.href = `user-profile.html?user=${member.user_id}`;
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

    location.href = "groups.html";
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

    if (page === "groups.html") {

        socialhubGroupsLoad();
    }

    if (page === "group.html") {

        socialhubGroupLoad();
    }

    console.log("✅ Groups activated!");
});