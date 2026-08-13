// ======================================================
// SOCIALHUB - SETTINGS (SIDEBAR ⚙️)
// ======================================================
// Sidebar "Settings" button -> settings modal with tabs:
//   1. Account      - edit profile info
//   2. Appearance   - dark mode toggle
//   3. Notifications- mute toggle + mark all read
//
// Add this script in index.html (and any page with a
// sidebar menu), AFTER script.js:
//
//     <script src="settings.js"></script>
// ======================================================

(function socialhubSettingsInjectStyles() {

    const style =
        document.createElement("style");

    style.textContent = `

.socialhub-settings-modal {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    padding: 20px;
}

.socialhub-settings-box {
    background: #fff;
    border-radius: 16px;
    width: 100%;
    max-width: 620px;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
}

.socialhub-settings-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid #e4e6eb;
}

.socialhub-settings-header h2 {
    margin: 0;
    font-size: 20px;
}

.socialhub-settings-close {
    border: none;
    background: #e4e6eb;
    border-radius: 50%;
    width: 34px;
    height: 34px;
    font-size: 15px;
    cursor: pointer;
    color: #1c1e21;
}

.socialhub-settings-tabs {
    display: flex;
    gap: 6px;
    padding: 12px 20px 0;
    border-bottom: 1px solid #e4e6eb;
}

.socialhub-settings-tabs button {
    border: none;
    background: transparent;
    padding: 10px 16px;
    font-size: 14px;
    font-weight: 600;
    color: #65676b;
    cursor: pointer;
    border-bottom: 3px solid transparent;
}

.socialhub-settings-tabs button.active {
    color: #1877f2;
    border-bottom-color: #1877f2;
}

.socialhub-settings-pane {
    padding: 20px;
    overflow-y: auto;
}

.socialhub-settings-pane.hidden {
    display: none;
}

.socialhub-settings-field {
    margin-bottom: 14px;
}

.socialhub-settings-field label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: #65676b;
    margin-bottom: 6px;
}

.socialhub-settings-field input,
.socialhub-settings-field textarea {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #d4d7dd;
    border-radius: 8px;
    font-size: 14px;
    background: #fff;
    color: #1c1e21;
    box-sizing: border-box;
}

.socialhub-settings-field textarea {
    resize: vertical;
    min-height: 70px;
}

.socialhub-settings-field input:focus,
.socialhub-settings-field textarea:focus {
    outline: none;
    border-color: #1877f2;
}

.socialhub-settings-save {
    background: #1877f2;
    color: #fff;
    border: none;
    padding: 10px 22px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
}

.socialhub-settings-save:hover {
    background: #166fe5;
}

.socialhub-settings-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 0;
    border-bottom: 1px solid #e4e6eb;
}

.socialhub-settings-row:last-child {
    border-bottom: none;
}

.socialhub-settings-row-title {
    font-size: 15px;
    font-weight: 600;
    margin: 0 0 2px;
}

.socialhub-settings-row-desc {
    font-size: 13px;
    color: #65676b;
    margin: 0;
}

.socialhub-toggle {
    position: relative;
    width: 46px;
    height: 26px;
    flex-shrink: 0;
}

.socialhub-toggle input {
    opacity: 0;
    width: 0;
    height: 0;
}

.socialhub-toggle-slider {
    position: absolute;
    inset: 0;
    background: #ccced2;
    border-radius: 26px;
    cursor: pointer;
    transition: 0.2s;
}

.socialhub-toggle-slider::before {
    content: "";
    position: absolute;
    width: 20px;
    height: 20px;
    left: 3px;
    top: 3px;
    background: #fff;
    border-radius: 50%;
    transition: 0.2s;
}

.socialhub-toggle input:checked + .socialhub-toggle-slider {
    background: #1877f2;
}

.socialhub-toggle input:checked + .socialhub-toggle-slider::before {
    transform: translateX(20px);
}

body.dark-mode .socialhub-settings-box {
    background: #242526;
}

body.dark-mode .socialhub-settings-header {
    border-bottom-color: #3a3b3c;
}

body.dark-mode .socialhub-settings-close {
    background: #3a3b3c;
    color: #e4e6eb;
}

body.dark-mode .socialhub-settings-tabs {
    border-bottom-color: #3a3b3c;
}

body.dark-mode .socialhub-settings-tabs button {
    color: #b0b3b8;
}

body.dark-mode .socialhub-settings-field input,
body.dark-mode .socialhub-settings-field textarea {
    background: #3a3b3c;
    border-color: #4e4f50;
    color: #e4e6eb;
}

body.dark-mode .socialhub-settings-row {
    border-bottom-color: #3a3b3c;
}

body.dark-mode .socialhub-settings-row-desc {
    color: #b0b3b8;
}
`;

    document.head.appendChild(style);
})();


// ======================================================
// 1. HELPERS
// ======================================================

function socialhubSettingsEscape(text) {

    const div =
        document.createElement("div");

    div.innerText =
        text || "";

    return div.innerHTML;
}


async function socialhubSettingsGetMe() {

    const {
        data,
        error
    } = await window.db.auth.getUser();

    if (error || !data.user) {

        return null;
    }

    return data.user;
}


function socialhubSettingsToast(message) {

    const old =
        document.querySelector(".socialhub-settings-toast");

    if (old) {
        old.remove();
    }

    const toast =
        document.createElement("div");

    toast.className = "socialhub-settings-toast";

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

    setTimeout(() => toast.remove(), 2600);
}


// ======================================================
// 2. OPEN SETTINGS MODAL
// ======================================================

async function socialhubOpenSettings() {

    const existing =
        document.querySelector(".socialhub-settings-modal");

    if (existing) {
        existing.remove();
    }

    const modal =
        document.createElement("div");

    modal.className = "socialhub-settings-modal";

    modal.innerHTML = `

        <div class="socialhub-settings-box">

            <div class="socialhub-settings-header">

                <h2>⚙️ Settings</h2>

                <button
                    type="button"
                    class="socialhub-settings-close"
                >
                    ✕
                </button>

            </div>

            <div class="socialhub-settings-tabs">

                <button type="button" class="active" data-tab="account">
                    👤 Account
                </button>

                <button type="button" data-tab="appearance">
                    🎨 Appearance
                </button>

                <button type="button" data-tab="notifications">
                    🔔 Notifications
                </button>

            </div>

            <div class="socialhub-settings-pane" data-pane="account">

                <div class="socialhub-settings-field">
                    <label>Full name</label>
                    <input type="text" data-field="full_name" placeholder="Your full name">
                </div>

                <div class="socialhub-settings-field">
                    <label>Username</label>
                    <input type="text" data-field="username" placeholder="username">
                </div>

                <div class="socialhub-settings-field">
                    <label>Bio</label>
                    <textarea data-field="bio" placeholder="Tell people about yourself..."></textarea>
                </div>

                <div class="socialhub-settings-field">
                    <label>Location</label>
                    <input type="text" data-field="location" placeholder="City, Country">
                </div>

                <div class="socialhub-settings-field">
                    <label>Work</label>
                    <input type="text" data-field="work" placeholder="What do you do?">
                </div>

                <div class="socialhub-settings-field">
                    <label>Education</label>
                    <input type="text" data-field="education" placeholder="Where did you study?">
                </div>

                <div class="socialhub-settings-field">
                    <label>Website</label>
                    <input type="text" data-field="website" placeholder="https://...">
                </div>

                <button
                    type="button"
                    class="socialhub-settings-save"
                    data-action="save-account"
                >
                    💾 Save Changes
                </button>

            </div>

            <div class="socialhub-settings-pane hidden" data-pane="appearance">

                <div class="socialhub-settings-row">

                    <div>
                        <p class="socialhub-settings-row-title">Dark Mode</p>
                        <p class="socialhub-settings-row-desc">Use a darker look across the app.</p>
                    </div>

                    <label class="socialhub-toggle">
                        <input type="checkbox" data-action="dark-toggle">
                        <span class="socialhub-toggle-slider"></span>
                    </label>

                </div>

            </div>

            <div class="socialhub-settings-pane hidden" data-pane="notifications">

                <div class="socialhub-settings-row">

                    <div>
                        <p class="socialhub-settings-row-title">Mute Notifications</p>
                        <p class="socialhub-settings-row-desc">Stop live badge updates and alerts.</p>
                    </div>

                    <label class="socialhub-toggle">
                        <input type="checkbox" data-action="mute-toggle">
                        <span class="socialhub-toggle-slider"></span>
                    </label>

                </div>

                <div class="socialhub-settings-row">

                    <div>
                        <p class="socialhub-settings-row-title">Mark all as read</p>
                        <p class="socialhub-settings-row-desc">Clear every unread notification.</p>
                    </div>

                    <button
                        type="button"
                        class="socialhub-settings-save"
                        data-action="mark-all-read"
                    >
                        Mark All Read
                    </button>

                </div>

            </div>

        </div>
    `;

    document.body.appendChild(modal);

    // Close
    modal
        .querySelector(".socialhub-settings-close")
        .addEventListener("click", () => modal.remove());

    modal.addEventListener("click", event => {

        if (event.target === modal) {

            modal.remove();
        }
    });

    // Tabs
    modal
        .querySelectorAll(".socialhub-settings-tabs button")
        .forEach(tab => {

            tab.addEventListener("click", () => {

                modal
                    .querySelectorAll(".socialhub-settings-tabs button")
                    .forEach(btn => btn.classList.remove("active"));

                tab.classList.add("active");

                modal
                    .querySelectorAll(".socialhub-settings-pane")
                    .forEach(pane => {

                        pane.classList.toggle(
                            "hidden",
                            pane.dataset.pane !== tab.dataset.tab
                        );
                    });
            });
        });

    // Load profile data
    const me =
        await socialhubSettingsGetMe();

    if (me) {

        const {
            data: profile
        } = await window.db
            .from("profiles")
            .select("full_name, username, bio, location, work, education, website")
            .eq("id", me.id)
            .single();

        if (profile) {

            modal
                .querySelectorAll("[data-field]")
                .forEach(input => {

                    input.value =
                        profile[input.dataset.field] || "";
                });
        }
    }

    // Dark mode state
    const darkToggle =
        modal.querySelector('[data-action="dark-toggle"]');

    darkToggle.checked =
        document.body.classList.contains("dark-mode");

    darkToggle.addEventListener("change", () => {

        const dark =
            darkToggle.checked;

        document.body.classList.toggle("dark-mode", dark);

        localStorage.setItem("darkMode", String(dark));
    });

    // Mute state
    const muteToggle =
        modal.querySelector('[data-action="mute-toggle"]');

    muteToggle.checked =
        localStorage.getItem("socialhubNotifMuted") === "1";

    muteToggle.addEventListener("change", () => {

        localStorage.setItem(
            "socialhubNotifMuted",
            muteToggle.checked ? "1" : "0"
        );

        socialhubSettingsToast(
            muteToggle.checked
                ? "🔕 Notifications muted"
                : "🔔 Notifications on"
        );

        if (typeof socialhubUpdateNotifBadge === "function") {

            socialhubUpdateNotifBadge();
        }
    });

    // Mark all read
    modal
        .querySelector('[data-action="mark-all-read"]')
        .addEventListener("click", async () => {

            if (!me) {
                return;
            }

            await window.db
                .from("notifications")
                .update({ is_read: true })
                .eq("user_id", me.id)
                .eq("is_read", false);

            if (typeof socialhubUpdateNotifBadge === "function") {

                socialhubUpdateNotifBadge();
            }

            socialhubSettingsToast("✓ All notifications marked as read");
        });

    // Save account
    modal
        .querySelector('[data-action="save-account"]')
        .addEventListener("click", async () => {

            if (!me) {

                socialhubSettingsToast("Please login first.");

                return;
            }

            const data = {};

            modal
                .querySelectorAll("[data-field]")
                .forEach(input => {

                    data[input.dataset.field] =
                        input.value.trim() || null;
                });

            if (data.username) {

                if (!/^[a-z0-9._]+$/.test(data.username)) {

                    socialhubSettingsToast(
                        "Username: lowercase letters, numbers, dot, underscore only."
                    );

                    return;
                }

                const {
                    data: clash
                } = await window.db
                    .from("profiles")
                    .select("id")
                    .eq("username", data.username)
                    .neq("id", me.id)
                    .limit(1);

                if (clash && clash.length > 0) {

                    socialhubSettingsToast("That username is already taken.");

                    return;
                }
            }

            const {
                error
            } = await window.db
                .from("profiles")
                .update(data)
                .eq("id", me.id);

            if (error) {

                socialhubSettingsToast("Could not save: " + error.message);

                return;
            }

            socialhubSettingsToast("✅ Profile saved!");

            if (typeof showCurrentUserData === "function") {

                await showCurrentUserData();
            }
        });
}


// ======================================================
// 3. AUTO-SYNC
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

    document
        .querySelectorAll(".sidebar-menu button")
        .forEach(button => {

            if (
                button.textContent.includes("Settings") &&
                !button.hasAttribute("onclick") &&
                !button.dataset.socialhubSettingsReady
            ) {

                button.dataset.socialhubSettingsReady = "1";

                button.addEventListener(
                    "click",
                    socialhubOpenSettings
                );
            }
        });

    console.log(
        "✅ Settings activated!"
    );
});
