// ======================================================
// SOCIALHUB - SETTINGS PAGE (Facebook style)
// ======================================================
// Full settings page with left menu and sections:
//   1. General      - edit profile info
//   2. Privacy      - profile visibility toggles
//   3. Security     - email + change password
//   4. Notifications- mute toggle + mark all read
//   5. Appearance   - dark mode toggle
//
// Load this script ONLY on settings.html, AFTER script.js.
// ======================================================

var db = window.db || supabaseClient;


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
        color: #ffffff;
        padding: 10px 20px;
        border-radius: 24px;
        font-size: 14px;
        font-weight: 600;
        z-index: 10001;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
    `;

    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 2600);
}


async function socialhubSettingsGetMe() {

    const {
        data,
        error
    } = await db.auth.getUser();

    if (error || !data.user) {

        return null;
    }

    return data.user;
}


// ======================================================
// 2. TAB SWITCHING
// ======================================================

function socialhubSettingsSwitchTab(tabName) {

    document
        .querySelectorAll(".settings-item")
        .forEach(item => {

            item.classList.toggle(
                "active",
                item.dataset.settingsTab === tabName
            );
        });

    document
        .querySelectorAll(".settings-pane")
        .forEach(pane => {

            pane.classList.toggle(
                "active",
                pane.dataset.settingsPane === tabName
            );
        });

    localStorage.setItem(
        "socialhubSettingsTab",
        tabName
    );
}


// ======================================================
// 3. GENERAL - LOAD + SAVE
// ======================================================

async function socialhubSettingsLoadGeneral(me) {

    const {
        data: profile,
        error
    } = await db
        .from("profiles")
        .select("full_name, username, bio, location, work, education, website")
        .eq("id", me.id)
        .single();

    if (error || !profile) {

        return;
    }

    document
        .querySelectorAll('[data-field]')
        .forEach(input => {

            const value =
                profile[input.dataset.field];

            if (input.dataset.field === "new_password" ||
                input.dataset.field === "confirm_password") {

                return;
            }

            input.value =
                value || "";
        });
}


async function socialhubSettingsSaveGeneral() {

    const me =
        await socialhubSettingsGetMe();

    if (!me) {

        socialhubSettingsToast("Please login first.");

        return;
    }

    const data = {};

    document
        .querySelectorAll('.settings-pane[data-settings-pane="general"] [data-field]')
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
        } = await db
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
    } = await db
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
}


// ======================================================
// 4. PRIVACY - LOCAL TOGGLES
// ======================================================

function socialhubSettingsLoadPrivacy() {

    document
        .querySelectorAll("[data-privacy]")
        .forEach(input => {

            input.checked =
                localStorage.getItem(
                    "socialhubPrivacy_" + input.dataset.privacy
                ) === "1";
        });
}


function socialhubSettingsBindPrivacy() {

    document
        .querySelectorAll("[data-privacy]")
        .forEach(input => {

            input.addEventListener("change", () => {

                localStorage.setItem(
                    "socialhubPrivacy_" + input.dataset.privacy,
                    input.checked ? "1" : "0"
                );

                socialhubSettingsToast(
                    input.checked
                        ? "✅ " + socialhubSettingsEscape(input.dataset.privacy) + " enabled"
                        : "⭕ " + socialhubSettingsEscape(input.dataset.privacy) + " disabled"
                );
            });
        });
}


// ======================================================
// 5. SECURITY - EMAIL + PASSWORD
// ======================================================

async function socialhubSettingsLoadSecurity(me) {

    document
        .querySelectorAll(".user-email")
        .forEach(element => {

            element.innerText =
                me.email || "";
        });
}


async function socialhubSettingsChangePassword() {

    const me =
        await socialhubSettingsGetMe();

    if (!me) {

        socialhubSettingsToast("Please login first.");

        return;
    }

    const pane =
        document.querySelector('.settings-pane[data-settings-pane="security"]');

    const newPassword =
        pane.querySelector('[data-field="new_password"]').value;

    const confirmPassword =
        pane.querySelector('[data-field="confirm_password"]').value;

    if (!newPassword || newPassword.length < 6) {

        socialhubSettingsToast("Password must be at least 6 characters.");

        return;
    }

    if (newPassword !== confirmPassword) {

        socialhubSettingsToast("Passwords do not match.");

        return;
    }

    const {
        error
    } = await db.auth.updateUser({
        password: newPassword
    });

    if (error) {

        socialhubSettingsToast("Could not update password: " + error.message);

        return;
    }

    pane.querySelector('[data-field="new_password"]').value = "";

    pane.querySelector('[data-field="confirm_password"]').value = "";

    socialhubSettingsToast("🔑 Password updated!");
}


// ======================================================
// 6. NOTIFICATIONS
// ======================================================

function socialhubSettingsLoadNotif() {

    const mute =
        document.querySelector('[data-notif="mute"]');

    if (mute) {

        mute.checked =
            localStorage.getItem("socialhubNotifMuted") === "1";

        mute.addEventListener("change", () => {

            localStorage.setItem(
                "socialhubNotifMuted",
                mute.checked ? "1" : "0"
            );

            socialhubSettingsToast(
                mute.checked
                    ? "🔕 Notifications muted"
                    : "🔔 Notifications on"
            );

            if (typeof socialhubUpdateNotifBadge === "function") {

                socialhubUpdateNotifBadge();
            }
        });
    }
}


async function socialhubSettingsMarkAllRead() {

    const me =
        await socialhubSettingsGetMe();

    if (!me) {

        socialhubSettingsToast("Please login first.");

        return;
    }

    await db
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", me.id)
        .eq("is_read", false);

    if (typeof socialhubUpdateNotifBadge === "function") {

        socialhubUpdateNotifBadge();
    }

    socialhubSettingsToast("✓ All notifications marked as read");
}


// ======================================================
// 7. APPEARANCE - DARK MODE
// ======================================================

function socialhubSettingsLoadAppearance() {

    const dark =
        document.querySelector('[data-appear="dark"]');

    if (!dark) {

        return;
    }

    dark.checked =
        document.body.classList.contains("dark-mode");

    dark.addEventListener("change", () => {

        document.body.classList.toggle(
            "dark-mode",
            dark.checked
        );

        localStorage.setItem(
            "darkMode",
            String(dark.checked)
        );
    });
}


// ======================================================
// 8. INIT
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

    document
        .querySelectorAll(".settings-item[data-settings-tab]")
        .forEach(item => {

            item.addEventListener("click", () => {

                socialhubSettingsSwitchTab(
                    item.dataset.settingsTab
                );
            });
        });

    const savedTab =
        localStorage.getItem("socialhubSettingsTab");

    if (savedTab && document.querySelector(`[data-settings-tab="${savedTab}"]`)) {

        socialhubSettingsSwitchTab(savedTab);
    }

    document
        .querySelector('[data-action="save-general"]')
        .addEventListener("click", socialhubSettingsSaveGeneral);

    document
        .querySelector('[data-action="change-password"]')
        .addEventListener("click", socialhubSettingsChangePassword);

    document
        .querySelector('[data-action="mark-all-read"]')
        .addEventListener("click", socialhubSettingsMarkAllRead);

    socialhubSettingsLoadPrivacy();

    socialhubSettingsBindPrivacy();

    socialhubSettingsLoadNotif();

    socialhubSettingsLoadAppearance();

    socialhubSettingsGetMe()
        .then(me => {

            if (!me) {

                return;
            }

            socialhubSettingsLoadGeneral(me);

            socialhubSettingsLoadSecurity(me);
        });

    console.log("✅ Settings page activated!");
});
