// ======================================================
// HOME THEME — Friendio homepage (index.html)
// Dark premium UI: search overlay, create post modal,
// help modal, menu dropdown, birthdays widget, bottom nav
// ======================================================

var db = window.db || supabaseClient;

const SOCIALHUB_HOME_RECENTS_KEY = "socialhubHomeSearchRecents";

const SOCIALHUB_HOME_AUDIENCE_LABELS = {
    public: "🌎 Public",
    friends: "👥 Friends",
    friends_of_friends: "🤝 Friends of Friends",
    only_me: "🔒 Only me"
};

const SOCIALHUB_HOME_FEELINGS = [
    { emoji: "😊", label: "happy" },
    { emoji: "😍", label: "loved" },
    { emoji: "😎", label: "cool" },
    { emoji: "🥳", label: "celebrating" },
    { emoji: "😢", label: "sad" },
    { emoji: "😡", label: "angry" },
    { emoji: "🤩", label: "amazed" },
    { emoji: "🙏", label: "grateful" },
    { emoji: "🤔", label: "confused" },
    { emoji: "😴", label: "sleepy" },
    { emoji: "😇", label: "blessed" },
    { emoji: "😜", label: "silly" }
];

const SOCIALHUB_HOME_EMOJIS = [
    "😀", "😂", "😍", "😎", "🤔", "😢", "😡", "🥳",
    "❤️", "🔥", "👍", "🎉", "😅", "🙏", "😴", "🤩",
    "😇", "😜"
];

const SOCIALHUB_HOME_BGS = [
    "linear-gradient(135deg,#6366f1,#22d3ee)",
    "linear-gradient(135deg,#f43f5e,#f59e0b)",
    "linear-gradient(135deg,#10b981,#22d3ee)",
    "linear-gradient(135deg,#8b5cf6,#ec4899)",
    "linear-gradient(135deg,#f97316,#f43f5e)",
    "linear-gradient(135deg,#0ea5e9,#6366f1)",
    "linear-gradient(135deg,#1f2937,#4b5563)",
    "linear-gradient(135deg,#22c55e,#eab308)"
];



// ======================================================
// ESCAPE HELPER
// ======================================================

function socialhubEscape(text) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        text == null
            ? ""
            : String(text);

    return div.innerHTML;
}



// ======================================================
// THEME + LUCIDE ICONS
// ======================================================

function socialhubHomeApplyTheme() {

    if (
        localStorage.getItem(
            "darkMode"
        ) !== "false"
    ) {

        document.body.classList.add(
            "dark-mode"
        );

        localStorage.setItem(
            "darkMode",
            "true"
        );
    }

    socialhubHomeMenuRefreshDark();
}


function socialhubHomeInitIcons() {

    if (
        window.lucide &&
        typeof lucide.createIcons === "function"
    ) {

        try {
            lucide.createIcons();
        } catch (e) {
            // ignore
        }
    }
}


function socialhubHomeInitIconsObserver() {

    const body =
        document.body;

    if (!body) {
        return;
    }

    let timer = null;

    const observer =
        new MutationObserver(() => {

            clearTimeout(timer);

            timer = setTimeout(
                () => socialhubHomeInitIcons(),
                120
            );
        });

    observer.observe(
        body,
        {
            childList: true,
            subtree: true
        }
    );
}



// ======================================================
// TOPBAR MENU DROPDOWN
// ======================================================

function socialhubHomeMenuRefreshDark() {

    const sw =
        document.getElementById(
            "homeDarkSwitch"
        );

    if (!sw) {
        return;
    }

    sw.checked =
        document.body.classList.contains(
            "dark-mode"
        );
}


function socialhubHomeMenuToggle(event) {

    if (event) {
        event.stopPropagation();
    }

    const menu =
        document.getElementById(
            "homeMenuDropdown"
        );

    if (!menu) {
        return;
    }

    menu.style.display =
        menu.style.display === "none"
            ? "block"
            : "none";

    socialhubHomeMenuRefreshDark();
}



// ======================================================
// SIDEBAR — SEE MORE / SEE LESS
// ======================================================

function socialhubHomeSidebarMore() {

    const extra =
        document.querySelector(
            ".sidebar-extra"
        );

    const btn =
        document.querySelector(
            ".sidebar-see-more"
        );

    if (!extra || !btn) {
        return;
    }

    const open =
        extra.style.display !== "none";

    extra.style.display =
        open
            ? "none"
            : "block";

    const label =
        btn.querySelector("span");

    if (label) {
        label.textContent =
            open
                ? "See more"
                : "See less";
    }

    const icon =
        btn.querySelector(
            ".lucide, i[data-lucide]"
        );

    if (icon) {

        icon.remove();

        const fresh =
            document.createElement(
                "i"
            );

        fresh.setAttribute(
            "data-lucide",
            open
                ? "ellipsis"
                : "ellipsis"
        );

        btn.insertBefore(
            fresh,
            label
        );

        socialhubHomeInitIcons();
    }
}



// ======================================================
// HELP MODAL
// ======================================================

function socialhubHomeHelpOpen() {

    const modal =
        document.getElementById(
            "homeHelpModal"
        );

    if (!modal) {
        return;
    }

    modal.style.display =
        "flex";
}


function socialhubHomeHelpClose() {

    const modal =
        document.getElementById(
            "homeHelpModal"
        );

    if (!modal) {
        return;
    }

    modal.style.display =
        "none";
}



// ======================================================
// SEARCH OVERLAY
// ======================================================

function socialhubHomeSearchOpen() {

    const overlay =
        document.getElementById(
            "homeSearchOverlay"
        );

    if (!overlay) {
        return;
    }

    overlay.style.display =
        "flex";

    const input =
        document.getElementById(
            "homeSearchInput"
        );

    if (input) {

        input.value =
            "";

        setTimeout(
            () => input.focus(),
            50
        );
    }

    socialhubHomeSearchRenderRecents();

    socialhubHomeSearchSuggest();
}


function socialhubHomeSearchClose() {

    const overlay =
        document.getElementById(
            "homeSearchOverlay"
        );

    if (overlay) {
        overlay.style.display = "none";
    }

    const results =
        document.getElementById(
            "homeSearchResults"
        );

    const recents =
        document.getElementById(
            "homeSearchRecents"
        );

    if (results) {
        results.style.display = "none";
    }

    if (recents) {
        recents.style.display = "block";
    }
}


function socialhubHomeSearchClear() {

    const input =
        document.getElementById(
            "homeSearchInput"
        );

    if (input) {
        input.value = "";
    }

    socialhubHomeSearchRenderRecents();

    const results =
        document.getElementById(
            "homeSearchResults"
        );

    if (results) {
        results.style.display = "none";
    }
}


function socialhubHomeSearchGetRecents() {

    try {

        const raw =
            JSON.parse(
                localStorage.getItem(
                    SOCIALHUB_HOME_RECENTS_KEY
                ) || "[]"
            );

        return Array.isArray(raw)
            ? raw
            : [];

    } catch (e) {
        return [];
    }
}


function socialhubHomeSearchSaveRecent(item) {

    const recents =
        socialhubHomeSearchGetRecents()
            .filter(r =>
                !(r.type === item.type && r.id === item.id)
            );

    recents.unshift(item);

    localStorage.setItem(
        SOCIALHUB_HOME_RECENTS_KEY,
        JSON.stringify(
            recents.slice(0, 6)
        )
    );
}


function socialhubHomeSearchRenderRecents() {

    const box =
        document.getElementById(
            "homeSearchRecents"
        );

    if (!box) {
        return;
    }

    const recents =
        socialhubHomeSearchGetRecents();

    if (!recents.length) {

        box.innerHTML =
            '<div class="home-search-note">Search people, groups, posts, photos and videos.</div>';

        return;
    }

    box.innerHTML =
        '<h4>Recent</h4>' +
        '<div class="home-search-chips">' +
        recents.map(item => {

            const icon =
                item.type === "person"
                    ? "user"
                    : item.type === "group"
                        ? "users-round"
                        : "message-square";

            return (
                '<button type="button" class="home-search-chip" ' +
                'onclick="socialhubHomeSearchGoRecent(\'' +
                socialhubEscape(item.type) +
                '\',\'' +
                socialhubEscape(item.id) +
                '\',\'' +
                socialhubEscape(item.label || "") +
                '\')">' +
                '<i data-lucide="' + icon + '"></i>' +
                socialhubEscape(item.label || item.term || "") +
                '</button>'
            );
        }).join("") +
        '</div>';
}


function socialhubHomeSearchGoRecent(type, id, label) {

    socialhubHomeSearchOpenResult(
        type,
        id,
        label
    );
}


async function socialhubHomeSearchSuggest() {

    const box =
        document.getElementById(
            "homeSearchRecents"
        );

    if (!box) {
        return;
    }

    const { data: people, error } =
        await db
            .from("profiles")
            .select("id, full_name, username")
            .limit(5);

    if (error || !people || !people.length) {
        return;
    }

    const recents =
        socialhubHomeSearchGetRecents();

    const existing =
        new Set(
            recents
                .filter(r => r.type === "person")
                .map(r => r.id)
        );

    const suggest =
        people.filter(p =>
            !existing.has(p.id)
        );

    if (!suggest.length) {
        return;
    }

    box.insertAdjacentHTML(
        "beforeend",
        '<div style="margin-top:14px">' +
        '<h4>Suggested</h4>' +
        '<div class="home-search-suggest">' +
        suggest.map(p => {

            return (
                '<button type="button" class="home-search-chip" ' +
                'onclick="socialhubHomeSearchOpenResult(\'person\',\'' +
                socialhubEscape(p.id) +
                '\',\'' +
                socialhubEscape(p.full_name || p.username || "") +
                '\')">' +
                '<i data-lucide="user-plus"></i>' +
                socialhubEscape(p.full_name || p.username || "") +
                '</button>'
            );
        }).join("") +
        '</div>' +
        '</div>'
    );
}


async function socialhubHomeSearchQuery(q) {

    const resultsEl =
        document.getElementById(
            "homeSearchResults"
        );

    const recentsEl =
        document.getElementById(
            "homeSearchRecents"
        );

    if (!resultsEl || !recentsEl) {
        return;
    }

    const term =
        (q || "").trim();

    if (!term) {

        resultsEl.style.display =
            "none";

        recentsEl.style.display =
            "block";

        return;
    }

    resultsEl.style.display =
        "block";

    recentsEl.style.display =
        "none";

    resultsEl.innerHTML =
        '<div class="home-search-note">Searching…</div>';

    const like =
        "%" + term + "%";

    let html =
        "";

    const { data: people, error: peopleError } =
        await db
            .from("profiles")
            .select("id, full_name, username, avatar_url")
            .or(
                "full_name.ilike." + like +
                ",username.ilike." + like
            )
            .limit(6);

    if (peopleError) {

        resultsEl.innerHTML =
            '<div class="home-search-note">Search failed. Try again.</div>';

        return;
    }

    if (people && people.length) {

        html +=
            '<div class="home-search-section">' +
            '<h4><i data-lucide="users"></i>People</h4>' +
            people.map(p => {

                const avatar =
                    p.avatar_url
                        ? '<img src="' + socialhubEscape(p.avatar_url) + '" alt="" />'
                        : '<div class="home-search-row-icon"><i data-lucide="user"></i></div>';

                return (
                    '<button type="button" class="home-search-row" ' +
                    'onclick="socialhubHomeSearchOpenResult(\'person\',\'' +
                    socialhubEscape(p.id) +
                    '\',\'' +
                    socialhubEscape(p.full_name || p.username || "") +
                    '\')">' +
                    avatar +
                    '<span class="home-search-row-info">' +
                    '<strong>' + socialhubEscape(p.full_name || "User") + '</strong>' +
                    '<span>@' + socialhubEscape(p.username || "") + '</span>' +
                    '</span>' +
                    '</button>'
                );
            }).join("") +
            '</div>';
    }

    let groups = [];

    try {

        const { data: groupData } =
            await db
                .from("groups")
                .select("id, name, description")
                .ilike("name", like)
                .limit(4);

        groups =
            groupData || [];

    } catch (e) {
        groups = [];
    }

    if (groups.length) {

        html +=
            '<div class="home-search-section">' +
            '<h4><i data-lucide="users-round"></i>Groups</h4>' +
            groups.map(g => {

                return (
                    '<button type="button" class="home-search-row" ' +
                    'onclick="socialhubHomeSearchOpenResult(\'group\',\'' +
                    socialhubEscape(g.id) +
                    '\',\'' +
                    socialhubEscape(g.name || "") +
                    '\')">' +
                    '<div class="home-search-row-icon"><i data-lucide="users-round"></i></div>' +
                    '<span class="home-search-row-info">' +
                    '<strong>' + socialhubEscape(g.name || "Group") + '</strong>' +
                    '<span>' + socialhubEscape(g.description || "") + '</span>' +
                    '</span>' +
                    '</button>'
                );
            }).join("") +
            '</div>';
    }

    const { data: posts, error: postsError } =
        await db
            .from("posts")
            .select("id, content, image_url, video_url")
            .ilike("content", like)
            .order(
                "created_at",
                {
                    ascending: false
                }
            )
            .limit(10);

    if (!postsError && posts && posts.length) {

        const videos =
            posts.filter(p => p.video_url);

        const photos =
            posts.filter(p =>
                !p.video_url && p.image_url
            );

        const texts =
            posts.filter(p =>
                !p.video_url && !p.image_url
            );

        if (videos.length) {

            html +=
                '<div class="home-search-section">' +
                '<h4><i data-lucide="clapperboard"></i>Videos</h4>' +
                videos.slice(0, 4).map(p => {

                    return (
                        '<button type="button" class="home-search-row" ' +
                        'onclick="socialhubHomeSearchOpenResult(\'post\',\'' +
                        socialhubEscape(p.id) +
                        '\',\'' +
                        socialhubEscape((p.content || "").slice(0, 60)) +
                        '\')">' +
                        '<div class="home-search-row-icon"><i data-lucide="clapperboard"></i></div>' +
                        '<span class="home-search-row-info">' +
                        '<strong>' + socialhubEscape((p.content || "Video").slice(0, 60)) + '</strong>' +
                        '<span>Video</span>' +
                        '</span>' +
                        '</button>'
                    );
                }).join("") +
                '</div>';
        }

        if (photos.length) {

            html +=
                '<div class="home-search-section">' +
                '<h4><i data-lucide="image"></i>Photos</h4>' +
                photos.slice(0, 4).map(p => {

                    return (
                        '<button type="button" class="home-search-row" ' +
                        'onclick="socialhubHomeSearchOpenResult(\'post\',\'' +
                        socialhubEscape(p.id) +
                        '\',\'' +
                        socialhubEscape((p.content || "").slice(0, 60)) +
                        '\')">' +
                        '<img class="home-search-row-thumb" src="' + socialhubEscape(p.image_url) + '" alt="" />' +
                        '<span class="home-search-row-info">' +
                        '<strong>' + socialhubEscape((p.content || "Photo").slice(0, 60)) + '</strong>' +
                        '<span>Photo</span>' +
                        '</span>' +
                        '</button>'
                    );
                }).join("") +
                '</div>';
        }

        if (texts.length) {

            html +=
                '<div class="home-search-section">' +
                '<h4><i data-lucide="message-square"></i>Posts</h4>' +
                texts.slice(0, 4).map(p => {

                    return (
                        '<button type="button" class="home-search-row" ' +
                        'onclick="socialhubHomeSearchOpenResult(\'post\',\'' +
                        socialhubEscape(p.id) +
                        '\',\'' +
                        socialhubEscape((p.content || "").slice(0, 60)) +
                        '\')">' +
                        '<div class="home-search-row-icon"><i data-lucide="message-square"></i></div>' +
                        '<span class="home-search-row-info">' +
                        '<strong>' + socialhubEscape((p.content || "Post").slice(0, 60)) + '</strong>' +
                        '<span>Post</span>' +
                        '</span>' +
                        '</button>'
                    );
                }).join("") +
                '</div>';
        }
    }

    if (!html) {

        html =
            '<div class="home-search-note">No results for “' +
            socialhubEscape(term) +
            '”.</div>';
    }

    resultsEl.innerHTML =
        html;

    socialhubHomeInitIcons();
}


function socialhubHomeSearchOpenResult(type, id, label) {

    if (!id) {
        return;
    }

    socialhubHomeSearchSaveRecent({
        type: type,
        id: id,
        label: label || ""
    });

    socialhubHomeSearchClose();

    if (type === "person") {

        location.href =
            "../profile/user-profile.html?user=" + id;

    } else if (type === "group") {

        location.href =
            "../groups/group.html?id=" + id;

    } else {

        location.href =
            "../home/index.html?post=" + id;
    }
}



// ======================================================
// CREATE POST MODAL
// ======================================================

function socialhubHomeFillComposerUser() {

    const nameEl =
        document.querySelector(
            ".composer-name"
        );

    const modalName =
        document.querySelector(
            ".home-post-user-name"
        );

    if (!nameEl && !modalName) {
        return;
    }

    db.auth.getUser().then(({ data, error }) => {

        if (error || !data.user) {
            return;
        }

        return db
            .from("profiles")
            .select("full_name, username")
            .eq("id", data.user.id)
            .maybeSingle();

    }).then(({ data: profile } = {}) => {

        if (!profile) {
            return;
        }

        const fullName =
            profile.full_name ||
            profile.username ||
            "friend";

        const firstName =
            String(fullName).split(" ")[0];

        if (nameEl) {
            nameEl.textContent = firstName;
        }

        if (modalName) {
            modalName.textContent = fullName;
        }
    });
}


function socialhubHomeBgRender() {

    const picker =
        document.getElementById(
            "homePostBgPicker"
        );

    if (!picker) {
        return;
    }

    picker.innerHTML =
        SOCIALHUB_HOME_BGS.map((bg, index) => {

            return (
                '<button type="button" class="home-bg-swatch" ' +
                'style="background:' + bg + '" ' +
                'title="Background ' + (index + 1) + '" ' +
                'onclick="socialhubHomeBgSet(' + index + ')"></button>'
            );
        }).join("");
}


function socialhubHomeFeelingsRender() {

    const grid =
        document.getElementById(
            "homePostFeelings"
        );

    if (!grid) {
        return;
    }

    grid.innerHTML =
        SOCIALHUB_HOME_FEELINGS.map(f => {

            return (
                '<button type="button" class="home-feel-btn" ' +
                'onclick="socialhubHomeFeelingSet(\'' + f.emoji + '\',\'' + f.label + '\')">' +
                '<span class="home-feel-emoji">' + f.emoji + '</span>' +
                'Feeling ' + f.label +
                '</button>'
            );
        }).join("");
}


function socialhubHomeEmojiRender() {

    const box =
        document.getElementById(
            "homePostEmoji"
        );

    if (!box) {
        return;
    }

    box.innerHTML =
        SOCIALHUB_HOME_EMOJIS.map(emoji => {

            return (
                '<button type="button" class="home-post-emoji-btn" ' +
                'onclick="socialhubHomeEmojiAdd(\'' + emoji + '\')">' +
                emoji +
                '</button>'
            );
        }).join("");
}


function socialhubHomeAudienceRefresh() {

    const saved =
        window.socialhubAudience ||
        localStorage.getItem(
            "socialhubAudience"
        ) ||
        "public";

    const label =
        document.getElementById(
            "homePostAudienceLabel"
        );

    if (label) {
        label.textContent =
            SOCIALHUB_HOME_AUDIENCE_LABELS[saved] ||
            SOCIALHUB_HOME_AUDIENCE_LABELS.public;
    }

    const menu =
        document.getElementById(
            "homePostAudienceMenu"
        );

    if (menu) {

        menu
            .querySelectorAll(
                ".audience-option"
            )
            .forEach(option => {

                option.classList.toggle(
                    "active",
                    option.getAttribute(
                        "data-home-audience"
                    ) === saved
                );
            });
    }
}


function socialhubHomeComposerOpen() {

    const modal =
        document.getElementById(
            "homePostModal"
        );

    if (!modal) {
        return;
    }

    const text =
        document.getElementById(
            "homePostText"
        );

    if (text) {

        text.value =
            "";

        text.style.background =
            "";

        setTimeout(
            () => text.focus(),
            50
        );
    }

    window.socialhubHomeBg =
        null;

    const tag =
        modal.querySelector(
            ".home-feel-tag"
        );

    if (tag) {
        tag.remove();
    }

    const grid =
        document.getElementById(
            "homePostFeelings"
        );

    if (grid) {
        grid.style.display = "none";
    }

    const picker =
        document.getElementById(
            "homePostBgPicker"
        );

    if (picker) {

        picker
            .querySelectorAll(
                ".home-bg-swatch"
            )
            .forEach(sw => {

                sw.classList.remove(
                    "active"
                );
            });
    }

    modal.style.display =
        "flex";

    socialhubHomeFillComposerUser();

    socialhubHomeAudienceRefresh();

    socialhubHomeBgRender();

    socialhubHomeFeelingsRender();

    socialhubHomeEmojiRender();
}


function socialhubHomeComposerClose() {

    const modal =
        document.getElementById(
            "homePostModal"
        );

    if (!modal) {
        return;
    }

    modal.style.display =
        "none";
}


function socialhubHomeAudienceToggle(event) {

    if (event) {
        event.stopPropagation();
    }

    const menu =
        document.getElementById(
            "homePostAudienceMenu"
        );

    if (!menu) {
        return;
    }

    menu.style.display =
        menu.style.display === "none"
            ? "flex"
            : "none";
}


function socialhubHomeAudienceSet(value) {

    if (!SOCIALHUB_HOME_AUDIENCE_LABELS[value]) {
        return;
    }

    window.socialhubAudience =
        value;

    localStorage.setItem(
        "socialhubAudience",
        value
    );

    const label =
        document.getElementById(
            "homePostAudienceLabel"
        );

    if (label) {
        label.textContent =
            SOCIALHUB_HOME_AUDIENCE_LABELS[value];
    }

    const menu =
        document.getElementById(
            "homePostAudienceMenu"
        );

    if (menu) {

        menu.style.display =
            "none";

        menu
            .querySelectorAll(
                ".audience-option"
            )
            .forEach(option => {

                option.classList.toggle(
                    "active",
                    option.getAttribute(
                        "data-home-audience"
                    ) === value
                );
            });
    }
}


function socialhubHomeModalPhoto() {

    socialhubHomeComposerClose();

    const btn =
        document.querySelector(
            ".create-post-actions button:first-child"
        );

    if (btn) {
        btn.click();
    }
}


function socialhubHomeModalVideo() {

    socialhubHomeComposerClose();

    const btn =
        document.querySelector(
            ".create-post-actions button:nth-child(2)"
        );

    if (btn) {
        btn.click();
    }
}


function socialhubHomeModalFeeling() {

    const grid =
        document.getElementById(
            "homePostFeelings"
        );

    if (!grid) {
        return;
    }

    grid.style.display =
        grid.style.display === "none"
            ? "grid"
            : "none";
}


function socialhubHomeModalLocation() {

    socialhubToast(
        "Location sharing is coming soon.",
        "info"
    );
}


function socialhubHomeFeelingOpen(event) {

    if (event) {
        event.preventDefault();
    }

    socialhubHomeComposerOpen();

    const grid =
        document.getElementById(
            "homePostFeelings"
        );

    if (grid) {
        grid.style.display = "grid";
    }
}


function socialhubHomeLocationOpen(event) {

    if (event) {
        event.preventDefault();
    }

    socialhubHomeComposerOpen();

    socialhubToast(
        "Add a location from the post editor.",
        "info"
    );
}


function socialhubHomeFeelingSet(emoji, label) {

    const modal =
        document.getElementById(
            "homePostModal"
        );

    if (!modal) {
        return;
    }

    const existing =
        modal.querySelector(
            ".home-feel-tag"
        );

    if (existing) {
        existing.remove();
    }

    const tag =
        document.createElement(
            "div"
        );

    tag.className =
        "home-feel-tag";

    tag.textContent =
        emoji + " feeling " + label;

    const text =
        document.getElementById(
            "homePostText"
        );

    text.insertAdjacentElement(
        "afterend",
        tag
    );

    window.socialhubHomeFeeling =
        { emoji: emoji, label: label };

    const grid =
        document.getElementById(
            "homePostFeelings"
        );

    if (grid) {
        grid.style.display = "none";
    }
}


function socialhubHomeBgSet(index) {

    const picker =
        document.getElementById(
            "homePostBgPicker"
        );

    if (picker) {

        picker
            .querySelectorAll(
                ".home-bg-swatch"
            )
            .forEach((sw, i) => {

                sw.classList.toggle(
                    "active",
                    i === index
                );
            });
    }

    const bg =
        SOCIALHUB_HOME_BGS[index];

    window.socialhubHomeBg =
        bg;

    const text =
        document.getElementById(
            "homePostText"
        );

    if (text) {
        text.style.background = bg;
    }
}


function socialhubHomeEmojiAdd(emoji) {

    const text =
        document.getElementById(
            "homePostText"
        );

    if (!text) {
        return;
    }

    text.value +=
        emoji;

    text.focus();
}


function socialhubHomeComposerSubmit() {

    const modal =
        document.getElementById(
            "homePostModal"
        );

    const text =
        document.getElementById(
            "homePostText"
        );

    const input =
        document.getElementById(
            "postInput"
        );

    const btn =
        document.querySelector(
            ".create-post .post-btn"
        );

    if (!modal || !text || !input) {
        return;
    }

    const content =
        (text.value || "").trim();

    if (!content && !window.socialhubHomeBg) {

        socialhubToast(
            "Write something to post.",
            "error"
        );

        return;
    }

    input.value =
        content;

    input.dataset.background =
        window.socialhubHomeBg ||
        "none";

    input.style.background =
        window.socialhubHomeBg ||
        "";

    socialhubHomeComposerClose();

    if (btn) {
        btn.click();
    } else {

        socialhubToast(
            "Could not submit post.",
            "error"
        );
    }
}



// ======================================================
// BIRTHDAYS WIDGET
// ======================================================

async function socialhubHomeLoadBirthdays() {

    const widget =
        document.getElementById(
            "homeBirthdaysWidget"
        );

    const list =
        document.getElementById(
            "homeBirthdaysList"
        );

    if (!widget || !list) {
        return;
    }

    const { data: userData } =
        await db.auth.getUser();

    if (!userData || !userData.user) {
        return;
    }

    const me =
        userData.user;

    const { data: friendsData } =
        await db
            .from("friendships")
            .select("requester_id, addressee_id")
            .eq("status", "accepted");

    const ids =
        new Set();

    (friendsData || []).forEach(f => {

        if (f.requester_id === me.id) {

            ids.add(f.addressee_id);

        } else if (f.addressee_id === me.id) {

            ids.add(f.requester_id);
        }
    });

    if (!ids.size) {

        widget.style.display =
            "none";

        return;
    }

    const { data: profiles, error } =
        await db
            .from("profiles")
            .select("id, full_name, username, avatar_url, birthday")
            .in("id", [...ids]);

    if (error || !profiles || !profiles.length) {

        widget.style.display =
            "none";

        return;
    }

    const now =
        new Date();

    const todayMonth =
        now.getMonth() + 1;

    const todayDay =
        now.getDate();

    const today =
        profiles.filter(p => {

            const m =
                String(p.birthday || "")
                    .match(/^(\d{4})-(\d{2})-(\d{2})/);

            return (
                m &&
                parseInt(m[2], 10) === todayMonth &&
                parseInt(m[3], 10) === todayDay
            );
        });

    if (!today.length) {

        list.innerHTML =
            '<div class="home-birthday-note">No friends’ birthdays today.</div>';

        return;
    }

    list.innerHTML =
        today.map(p => {

            const avatar =
                p.avatar_url
                    ? '<img src="' + socialhubEscape(p.avatar_url) + '" alt="" />'
                    : '<div class="home-birthday-icon"><i data-lucide="cake"></i></div>';

            return (
                '<button type="button" class="home-birthday-row" ' +
                'onclick="location.href=\'../profile/user-profile.html?user=' +
                socialhubEscape(p.id) +
                '\'">' +
                avatar +
                '<span class="home-birthday-info">' +
                '<strong>' + socialhubEscape(p.full_name || "Friend") + '</strong>' +
                '<span>Birthday is today</span>' +
                '</span>' +
                '</button>'
            );
        }).join("");

    socialhubHomeInitIcons();
}



// ======================================================
// CLOSERS — OUTSIDE CLICK + ESCAPE + BACKDROP
// ======================================================

function socialhubHomeWireClosers() {

    document.addEventListener(
        "click",
        (event) => {

            const menu =
                document.getElementById(
                    "homeMenuDropdown"
                );

            if (
                menu &&
                menu.style.display !== "none" &&
                !menu.contains(event.target)
            ) {

                menu.style.display =
                    "none";
            }

            const audience =
                document.getElementById(
                    "homePostAudienceMenu"
                );

            if (
                audience &&
                audience.style.display !== "none" &&
                !audience.contains(event.target) &&
                !document.getElementById(
                    "homePostAudienceBtn"
                ).contains(event.target)
            ) {

                audience.style.display =
                    "none";
            }
        },
        true
    );

    document.addEventListener(
        "keydown",
        (event) => {

            if (event.key !== "Escape") {
                return;
            }

            socialhubHomeSearchClose();

            socialhubHomeComposerClose();

            socialhubHomeHelpClose();

            const menu =
                document.getElementById(
                    "homeMenuDropdown"
                );

            if (menu) {
                menu.style.display = "none";
            }
        }
    );

    const searchOverlay =
        document.getElementById(
            "homeSearchOverlay"
        );

    if (searchOverlay) {

        searchOverlay.addEventListener(
            "click",
            (event) => {

                if (event.target === searchOverlay) {
                    socialhubHomeSearchClose();
                }
            }
        );
    }

    const postModal =
        document.getElementById(
            "homePostModal"
        );

    if (postModal) {

        postModal.addEventListener(
            "click",
            (event) => {

                if (event.target === postModal) {
                    socialhubHomeComposerClose();
                }
            }
        );
    }

    const helpModal =
        document.getElementById(
            "homeHelpModal"
        );

    if (helpModal) {

        helpModal.addEventListener(
            "click",
            (event) => {

                if (event.target === helpModal) {
                    socialhubHomeHelpClose();
                }
            }
        );
    }
}



// ======================================================
// SEARCH INPUT
// ======================================================

function socialhubHomeWireSearchInput() {

    const input =
        document.getElementById(
            "homeSearchInput"
        );

    if (!input) {
        return;
    }

    let timer =
        null;

    input.addEventListener(
        "input",
        () => {

            clearTimeout(timer);

            timer =
                setTimeout(
                    () => socialhubHomeSearchQuery(input.value),
                    250
                );
        }
    );

    input.addEventListener(
        "keydown",
        (event) => {

            if (event.key === "Enter") {

                const term =
                    (input.value || "").trim();

                if (term) {

                    socialhubHomeSearchSaveRecent({
                        type: "term",
                        id: "term",
                        label: term
                    });

                    socialhubHomeSearchRenderRecents();
                }
            }
        }
    );
}



// ======================================================
// INIT
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        socialhubHomeApplyTheme();

        socialhubHomeInitIcons();

        socialhubHomeInitIconsObserver();

        socialhubHomeWireClosers();

        socialhubHomeWireSearchInput();

        socialhubHomeLoadBirthdays();

        socialhubHomeFillComposerUser();
    }
);