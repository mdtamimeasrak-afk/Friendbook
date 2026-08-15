// ======================================================
// PROFILE ICONS - unified Lucide outline icon system
// Converts Font Awesome icons + leading emoji icons on
// the PROFILE page into one Lucide family (2px stroke).
// Runs on load + MutationObserver for JS-rendered icons.
// Self-contained: page guard + DOMContentLoaded wiring.
// ======================================================

(function () {

    var PAGE =
        window.location.pathname
            .split("/")
            .pop();

    if (
        PAGE !== "profile.html" &&
        PAGE !== "user-profile.html"
    ) {
        return;
    }

    var FA_TO_LUCIDE = {
        "fa-house": "house",
        "fa-clapperboard": "clapperboard",
        "fa-store": "store",
        "fa-user-group": "users",
        "fa-user": "user",
        "fa-table-cells-large": "layout-grid",
        "fa-circle-info": "info",
        "fa-images": "image",
        "fa-image": "image",
        "fa-video": "video",
        "fa-caret-down": "chevron-down",
        "fa-location-dot": "map-pin",
        "fa-school": "graduation-cap",
        "fa-graduation-cap": "graduation-cap",
        "fa-briefcase": "briefcase",
        "fa-heart": "heart",
        "fa-globe": "globe",
        "fa-instagram": "instagram",
        "fa-address-book": "book-user",
        "fa-film": "film",
        "fa-futbol": "trophy",
        "fa-gamepad": "gamepad",
        "fa-music": "music",
        "fa-quote-left": "quote",
        "fa-tv": "tv",
        "fa-star": "star",
        "fa-face-smile": "smile",
        "fa-thumbs-up": "thumbs-up",
        "fa-comment": "message-circle",
        "fa-comment-dots": "message-circle",
        "fa-share-nodes": "share-2",
        "fa-bookmark": "bookmark",
        "fa-magnifying-glass": "search",
        "fa-moon": "moon",
        "fa-gear": "settings",
        "fa-right-from-bracket": "log-out",
        "fa-bell": "bell",
        "fa-calendar-days": "calendar-days",
        "fa-cake-candles": "cake",
        "fa-building": "building-2",
        "fa-tower-broadcast": "radio-tower",
        "fa-palette": "palette",
        "fa-pen": "pen",
        "fa-pencil": "pencil",
        "fa-pin": "pin",
        "fa-share-from-square": "share-2",
        "fa-trash-can": "trash-2",
        "fa-xmark": "x",
        "fa-eye-slash": "eye-off",
        "fa-flag": "flag",
        "fa-link": "link",
        "fa-lock": "lock",
        "fa-badge-check": "badge-check",
        "fa-chart-line": "chart-line",
        "fa-plus": "plus",
        "fa-check": "check",
        "fa-ellipsis": "ellipsis",
        "fa-ellipsis-h": "ellipsis",
        "fa-chevron-down": "chevron-down",
        "fa-chevron-up": "chevron-up",
        "fa-chevron-left": "chevron-left",
        "fa-chevron-right": "chevron-right",
        "fa-arrow-left": "arrow-left",
        "fa-arrow-right": "arrow-right",
        "fa-camera": "camera",
        "fa-download": "download",
        "fa-copy": "copy",
        "fa-ban": "ban",
        "fa-user-plus": "user-plus",
        "fa-user-pen": "user-pen",
        "fa-users": "users",
        "fa-trash": "trash-2",
        "fa-x": "x",
        "fa-search": "search",
        "fa-message": "message-circle",
        "fa-user-check": "user-check",
        "fa-shield-halved": "shield",
        "fa-box-archive": "archive",
        "fa-wave-square": "activity",
        "fa-rotate-left": "rotate-ccw",
        "fa-clock-rotate-left": "history",
        "fa-circle-check": "circle-check",
        "fa-triangle-exclamation": "triangle-alert",
        "fa-file-lines": "file-text",
        "fa-paper-plane": "send",
        "fa-shield": "shield",
        "fa-fire": "flame",
        "fa-bolt": "zap",
        "fa-clock": "clock",
        "fa-smile": "smile",
        "fa-envelope": "mail",
        "fa-phone": "phone",
        "fa-language": "languages",
        "fa-venus-mars": "venus-mars",
        "fa-cake": "cake",
        "fa-hashtag": "hash",
        "fa-at": "at-sign",
        "fa-eye": "eye",
        "fa-user-check": "user-check",
        "fa-user-clock": "user-clock",
        "fa-user-xmark": "user-x",
        "fa-question": "circle-help",
        "fa-info": "info",
        "fa-exclamation": "circle-alert"
    };

    var EMOJI_TO_LUCIDE = {
        "🔍": "search",
        "💬": "message-circle",
        "🔔": "bell",
        "🌙": "moon",
        "⚙️": "settings",
        "➕": "plus",
        "✎": "pencil",
        "📷": "camera",
        "🖼️": "image",
        "🖼": "image",
        "🗑️": "trash-2",
        "🗑": "trash-2",
        "🎞️": "film",
        "🎞": "film",
        "🎥": "video",
        "😊": "smile",
        "🔖": "bookmark",
        "📅": "calendar-days",
        "👥": "users",
        "🤝": "handshake",
        "🌎": "globe",
        "🌍": "globe",
        "🌏": "globe",
        "🔒": "lock",
        "🔓": "lock-open",
        "▾": "chevron-down",
        "✕": "x",
        "❌": "x",
        "•••": "ellipsis",
        "🚪": "log-out",
        "🎬": "clapperboard",
        "👁️": "eye",
        "⭐": "star",
        "👍": "thumbs-up",
        "❤️": "heart",
        "❤": "heart",
        "🚀": "rocket",
        "🎉": "party-popper",
        "🏠": "house",
        "🛒": "store",
        "📍": "map-pin",
        "🎓": "graduation-cap",
        "💼": "briefcase",
        "🌐": "globe",
        "📞": "phone",
        "✉️": "mail",
        "✉": "mail",
        "✅": "check",
        "📝": "pencil",
        "🔗": "link",
        "📌": "pin",
        "📚": "book",
        "📄": "file-text",
        "🎨": "palette",
        "📊": "chart-bar",
        "🏆": "trophy",
        "🥇": "medal",
        "💡": "lightbulb",
        "⚡": "zap",
        "🔥": "flame",
        "✨": "sparkles",
        "💎": "gem",
        "💰": "coins",
        "🗂️": "folder",
        "📋": "clipboard",
        "📎": "paperclip",
        "🔑": "key",
        "🛡️": "shield",
        "📢": "megaphone",
        "🎁": "gift",
        "🍰": "cake",
        "🎂": "cake",
        "🏫": "school",
        "🏢": "building-2",
        "🏦": "bank",
        "🏥": "hospital",
        "✈️": "plane",
        "🚗": "car",
        "🚌": "bus",
        "🚲": "bike",
        "⏰": "alarm-clock",
        "🕐": "clock",
        "📱": "smartphone",
        "💻": "laptop",
        "🖥️": "monitor",
        "⌨️": "keyboard",
        "🖨️": "printer",
        "🎧": "headphones",
        "🎤": "mic",
        "📺": "tv",
        "📻": "radio",
        "📡": "radio-tower",
        "🎯": "target",
        "🎮": "gamepad",
        "🎲": "dice",
        "🏀": "basketball",
        "⚽": "circle",
        "🎾": "circle",
        "🏈": "circle",
        "⚾": "circle",
        "🏓": "circle",
        "🥅": "circle",
        "🏹": "crosshair",
        "🧘": "person-standing",
        "🏃": "person-running",
        "🚶": "person-standing",
        "💪": "dumbbell",
        "🏋️": "dumbbell",
        "⛰️": "mountain",
        "🏖️": "umbrella",
        "🌴": "palmtree",
        "🌊": "waves",
        "🌅": "sunrise",
        "🌄": "sunrise",
        "🌇": "sunset",
        "🌆": "sunset",
        "🏙️": "building-2",
        "🌃": "moon-star",
        "🌌": "sparkles",
        "🌠": "sparkles",
        "🌈": "rainbow",
        "☀️": "sun",
        "⛅": "cloud-sun",
        "☁️": "cloud",
        "🌧️": "cloud-rain",
        "⛈️": "cloud-lightning",
        "🌨️": "cloud-snow",
        "🌩️": "cloud-lightning",
        "🌪️": "cloud-fog",
        "🌫️": "cloud-fog",
        "🌤️": "cloud-sun",
        "🌥️": "cloud-sun",
        "🌦️": "cloud-sun-rain",
        "🌡️": "thermometer",
        "🧊": "box",
        "☔": "umbrella",
        "❄️": "snowflake",
        "⛄": "snowman",
        "☃️": "snowman",
        "💧": "droplet",
        "🍀": "clover",
        "🌹": "flower-2",
        "🥀": "flower-2",
        "🌺": "flower-2",
        "🌸": "flower-2",
        "🌼": "flower-2",
        "🌻": "flower-2",
        "🌷": "flower-2",
        "🌱": "sprout",
        "🌿": "sprout",
        "🍃": "leaf",
        "🍂": "leaf",
        "🍁": "leaf",
        "🌾": "sprout",
        "🌵": "cactus",
        "🌳": "tree-deciduous",
        "🌲": "tree-pine",
        "🍄": "mushroom",
        "🐝": "bee",
        "🦋": "butterfly",
        "🐞": "bug",
        "🐜": "bug",
        "🕷️": "spider",
        "🐢": "turtle",
        "🐍": "snake",
        "🐸": "frog",
        "🐙": "octopus",
        "🐟": "fish",
        "🐬": "dolphin",
        "🐳": "whale",
        "🐋": "whale",
        "🦈": "shark",
        "🦀": "crab",
        "🦐": "shrimp",
        "🐆": "leopard",
        "🐅": "tiger",
        "🐄": "cow",
        "🐎": "horse",
        "🐖": "pig",
        "🐏": "sheep",
        "🐑": "sheep",
        "🐐": "goat",
        "🐘": "elephant",
        "🦏": "rhinoceros",
        "🐭": "mouse",
        "🐹": "hamster",
        "🐰": "rabbit",
        "🐇": "rabbit",
        "🦔": "hedgehog",
        "🦇": "bat",
        "🐻": "bear",
        "🐨": "koala",
        "🐼": "panda",
        "🦘": "kangaroo",
        "🐔": "chicken",
        "🐧": "penguin",
        "🕊️": "dove",
        "🦅": "eagle",
        "🦆": "duck",
        "🦉": "owl",
        "🦜": "parrot",
        "🐦": "bird",
        "🐉": "dragon"
    };

    var PROTECTED_SELECTOR =
        ".socialhub-reactions, .fb-reaction-emoji, " +
        ".socialhub-reaction-emoji, .socialhub-sc-emojirow, " +
        ".socialhub-story-viewer, .socialhub-story-canvas, " +
        ".post-caption, .comment-content, " +
        ".socialhub-photo-viewer, .socialhub-crop-overlay";

    var SKIP_CLASS =
        /avatar|emoji|reaction|profile-photo/i;

    function socialhubLucideIconName(faClass) {
        return FA_TO_LUCIDE[faClass] || null;
    }

    function socialhubConvertFontAwesome(root) {
        root
            .querySelectorAll("i[class*='fa-']")
            .forEach(function (icon) {
                if (icon.closest(PROTECTED_SELECTOR)) {
                    return;
                }
                var classes =
                    icon.className.split(/\s+/);
                var name = null;
                for (var i = 0; i < classes.length; i++) {
                    name = socialhubLucideIconName(classes[i]);
                    if (name) {
                        break;
                    }
                }
                if (!name) {
                    return;
                }
                var tag =
                    icon.tagName.toLowerCase();
                var el =
                    document.createElement(tag);
                el.className = "socialhub-lucide";
                el.setAttribute("data-lucide", name);
                icon.replaceWith(el);
            });
    }

    function socialhubConvertEmoji(root) {
        root
            .querySelectorAll("button, a, span")
            .forEach(function (el) {
                if (SKIP_CLASS.test(el.className || "")) {
                    return;
                }
                if (el.closest(PROTECTED_SELECTOR)) {
                    return;
                }
                if (el.querySelector("i, img, svg")) {
                    return;
                }
                if (el.children.length > 1) {
                    return;
                }
                var first =
                    el.firstChild;
                if (!first || first.nodeType !== 3) {
                    return;
                }
                var text =
                    (first.nodeValue || "").trim();
                if (!text) {
                    return;
                }
                var key = null;
                var keys =
                    Object.keys(EMOJI_TO_LUCIDE);
                for (var i = 0; i < keys.length; i++) {
                    if (text.indexOf(keys[i]) === 0) {
                        key = keys[i];
                        break;
                    }
                }
                if (!key) {
                    return;
                }
                var idx =
                    first.nodeValue.indexOf(key);
                if (idx === -1) {
                    return;
                }
                var iconEl =
                    document.createElement("i");
                iconEl.className = "socialhub-lucide";
                iconEl.setAttribute(
                    "data-lucide",
                    EMOJI_TO_LUCIDE[key]
                );
                el.prepend(iconEl);
                first.nodeValue =
                    first.nodeValue.slice(0, idx).replace(/\s+$/, "") +
                    first.nodeValue.slice(idx + key.length);
            });
    }

    function socialhubIconify(root) {
        if (!root) {
            return;
        }
        socialhubConvertFontAwesome(root);
        socialhubConvertEmoji(root);
        if (
            window.lucide &&
            typeof window.lucide.createIcons === "function"
        ) {
            window.lucide.createIcons();
        }
    }

    var socialhubIconifyTimer = null;

    function socialhubWireIconify() {
        socialhubIconify(document.body);
        var observer =
            new MutationObserver(function () {
                clearTimeout(socialhubIconifyTimer);
                socialhubIconifyTimer =
                    setTimeout(function () {
                        socialhubIconify(document.body);
                    }, 250);
            });
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            socialhubWireIconify
        );
    } else {
        socialhubWireIconify();
    }

})();