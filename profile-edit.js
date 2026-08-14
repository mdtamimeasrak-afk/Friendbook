// ======================================================
// PROFILE-EDIT.JS
// Personal details edit system (profile.html only)
// Rows + visibility + edit modal per field type
// ======================================================

(function () {

    if (!document.querySelector(".pd-row")) {

        return;
    }

    var db = window.db || supabaseClient;

    // ------------------------------------------
    // CONFIG
    // ------------------------------------------

    var PD_FIELDS = {

        location: {

            label: "Current city",
            add: "Add current city",
            sub: "Current city",
            icon: "fa-location-dot",
            type: "text",
            extraKey: null,
            defVis: "public"

        },

        hometown: {

            label: "Hometown",
            add: "Add hometown",
            sub: "Hometown",
            icon: "fa-location-dot",
            type: "text",
            extraKey: "hometown",
            defVis: "public"

        },

        birthday: {

            label: "Birthday",
            add: "Add birthday",
            sub: "",
            icon: "fa-cake-candles",
            type: "birthday",
            extraKey: null,
            defVis: "public"

        },

        relationship: {

            label: "Relationship status",
            add: "Add relationship status",
            sub: "",
            icon: "fa-heart",
            type: "relationship",
            extraKey: "relationship",
            defVis: "public"

        },

        family: {

            label: "Family members",
            add: "Add family member",
            sub: "",
            icon: "fa-users",
            type: "family",
            extraKey: "family",
            defVis: "friends"

        },

        gender: {

            label: "Gender",
            add: "Add gender",
            sub: "Gender",
            icon: "fa-user",
            type: "gender",
            extraKey: "gender",
            defVis: "only_me"

        },

        pronouns: {

            label: "Pronouns",
            add: "Add pronouns",
            sub: "System pronouns",
            icon: "fa-message",
            type: "pronouns",
            extraKey: "pronouns",
            defVis: "public"

        },

        languages: {

            label: "Languages",
            add: "Add languages",
            sub: "Languages",
            icon: "fa-language",
            type: "languages",
            extraKey: "languages",
            defVis: "friends"

        }

    };

    var PD_VIS = {

        public: {

            label: "Public",
            icon: "fa-globe"

        },

        friends: {

            label: "Friends",
            icon: "fa-users"

        },

        only_me: {

            label: "Only me",
            icon: "fa-lock"

        },

        custom: {

            label: "Custom",
            icon: "fa-gear"

        }

    };

    var PD_MONTHS = [

        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"

    ];

    var PD_RELATIONS = [

        "Father", "Mother", "Brother", "Sister", "Grandfather",
        "Grandmother", "Uncle", "Aunt", "Cousin", "Spouse",
        "Child", "Other"

    ];

    var PD_RELATIONSHIPS = [

        "Single", "In a relationship", "Engaged", "Married",
        "It's complicated", "Separated", "Divorced", "Widowed"

    ];

    var PD_LANGUAGES = [

        "English", "Bangla", "Hindi", "Urdu", "Arabic", "Spanish",
        "French", "German", "Italian", "Portuguese", "Russian",
        "Chinese", "Japanese", "Korean", "Turkish", "Persian",
        "Nepali", "Indonesian", "Malay", "Thai", "Vietnamese",
        "Greek", "Dutch", "Swedish"

    ];

    // ------------------------------------------
    // STATE
    // ------------------------------------------

    var state = {

        field: null,
        profile: null,
        originalValue: "",
        originalVis: "public",
        vis: "public",
        family: [],
        friends: []

    };

    // ------------------------------------------
    // HELPERS
    // ------------------------------------------

    function socialhubPdGetMe() {

        return socialhubGetMe();
    }

    async function socialhubPdFetchProfile() {

        var me =
            await socialhubPdGetMe();

        if (!me) {

            return null;
        }

        var {
            data,
            error
        } = await db
            .from("profiles")
            .select("id, location, birthday, extra")
            .eq("id", me.id)
            .single();

        if (error || !data) {

            return null;
        }

        return data;
    }

    async function socialhubPdFetchFriends() {

        var me =
            await socialhubPdGetMe();

        if (!me) {

            return;
        }

        var {
            data: rows,
            error
        } = await db
            .from("friendships")
            .select("requester_id, addressee_id")
            .eq("status", "accepted")
            .or(
                "requester_id.eq." + me.id + "," +
                "addressee_id.eq." + me.id
            );

        if (error || !rows || rows.length === 0) {

            return;
        }

        var otherIds =
            rows.map(row =>
                row.requester_id === me.id
                    ? row.addressee_id
                    : row.requester_id
            );

        var {
            data: profiles,
            error: profileError
        } = await db
            .from("profiles")
            .select("full_name")
            .in("id", otherIds);

        if (profileError || !profiles) {

            return;
        }

        state.friends =
            profiles
                .map(p => p.full_name)
                .filter(Boolean);
    }

    function socialhubPdVisMap(profile) {

        var extra =
            (profile && profile.extra) || {};

        return (extra._visibility && typeof extra._visibility === "object")
            ? extra._visibility
            : {};
    }

    function socialhubPdGetVis(profile, field) {

        var map =
            socialhubPdVisMap(profile);

        return map[field] ||
            PD_FIELDS[field].defVis;
    }

    function socialhubPdGetValue(profile, field) {

        if (!profile) {

            return "";
        }

        var extra =
            profile.extra || {};

        var cfg =
            PD_FIELDS[field];

        var raw;

        if (cfg.extraKey) {

            raw =
                extra[cfg.extraKey];

        } else if (field === "location") {

            raw =
                profile.location;

        } else if (field === "birthday") {

            raw =
                profile.birthday;
        }

        if (field === "family") {

            if (!Array.isArray(raw)) {

                return "";
            }

            return raw
                .map(function (member) {

                    return member.relation + ": " + member.name;
                })
                .join(", ");
        }

        if (field === "birthday") {

            return socialhubPdFormatBirthday(raw);
        }

        return (typeof raw === "string") ? raw : "";
    }

    function socialhubPdFormatBirthday(value) {

        if (!value) {

            return "";
        }

        var parts =
            String(value).split("-");

        if (parts.length === 1) {

            return parts[0];
        }

        var year =
            parts[0];

        var monthIndex =
            parseInt(parts[1], 10);

        var day =
            parseInt(parts[2], 10);

        var text =
            "";

        if (day && day > 0) {

            text += day + " ";
        }

        if (monthIndex && monthIndex > 0) {

            text += PD_MONTHS[monthIndex - 1] + " ";
        }

        return (text + year).trim();
    }

    // ------------------------------------------
    // ROW RENDER
    // ------------------------------------------

    function socialhubPdRenderRow(field, profile) {

        var row =
            document.querySelector(
                ".pd-row[data-pd-field='" + field + "']"
            );

        if (!row) {

            return;
        }

        var cfg =
            PD_FIELDS[field];

        var value =
            socialhubPdGetValue(profile, field);

        var vis =
            socialhubPdGetVis(profile, field);

        var info =
            row.querySelector(".pd-info");

        var valueEl =
            row.querySelector(".pd-value");

        var oldAdd =
            row.querySelector(".pd-add");

        if (oldAdd) {

            oldAdd.remove();
        }

        if (value) {

            row.classList.remove("pd-empty");

            valueEl.textContent =
                value;

            valueEl.style.display = "";

        } else {

            row.classList.add("pd-empty");

            valueEl.style.display = "none";

            var addEl =
                document.createElement("a");

            addEl.className =
                "pd-add";

            addEl.href =
                "javascript:void(0)";

            addEl.innerHTML =
                '<i class="fa-solid fa-plus"></i> ' +
                cfg.add;

            addEl.title =
                cfg.add;

            addEl.addEventListener("click", function () {

                socialhubPdOpen(field);
            });

            info.appendChild(addEl);
        }

        var visBtn =
            row.querySelector(".pd-vis");

        visBtn.innerHTML =
            '<i class="fa-solid ' + PD_VIS[vis].icon + '"></i>';

        visBtn.setAttribute("data-pd-vis", vis);

        visBtn.title =
            PD_VIS[vis].label;

        visBtn.style.display =
            value ? "" : "none";
    }

    async function socialhubPdRender() {

        var profile =
            await socialhubPdFetchProfile();

        if (!profile) {

            return;
        }

        state.profile =
            profile;

        Object.keys(PD_FIELDS).forEach(function (field) {

            socialhubPdRenderRow(field, profile);
        });
    }

    // ------------------------------------------
    // ROW VISIBILITY MENU
    // ------------------------------------------

    function socialhubPdRowVisMenu(btn, field) {

        var existing =
            btn.parentNode.querySelector(".pd-vis-menu");

        if (existing) {

            existing.remove();

            return;
        }

        var menu =
            document.createElement("div");

        menu.className =
            "pd-vis-menu";

        Object.keys(PD_VIS).forEach(function (visKey) {

            var item =
                document.createElement("button");

            item.type =
                "button";

            item.setAttribute("data-vis", visKey);

            item.innerHTML =
                '<i class="fa-solid ' + PD_VIS[visKey].icon + '"></i> ' +
                PD_VIS[visKey].label;

            item.addEventListener("click", function () {

                menu.remove();

                socialhubPdSaveVisOnly(field, visKey);
            });

            menu.appendChild(item);
        });

        btn.parentNode.appendChild(menu);
    }

    document.addEventListener("click", function (event) {

        var inRow =
            event.target.closest(".pd-row");

        var inVisWrap =
            event.target.closest(".pd-vis-wrap");

        if (!inRow && !inVisWrap) {

            document
                .querySelectorAll(".pd-vis-menu")
                .forEach(function (menu) {

                    menu.remove();
                });

            document
                .querySelectorAll(".pd-vis-menu-modal")
                .forEach(function (menu) {

                    menu.style.display =
                        "none";
                });
        }
    });

    async function socialhubPdSaveVisOnly(field, vis) {

        var profile =
            state.profile ||
            await socialhubPdFetchProfile();

        if (!profile) {

            socialhubToast("Could not save visibility.", "error");

            return;
        }

        var extra =
            Object.assign({}, profile.extra || {});

        var map =
            Object.assign({}, socialhubPdVisMap(profile));

        map[field] =
            vis;

        extra._visibility =
            map;

        var {
            error
        } = await db
            .from("profiles")
            .update({ extra: extra })
            .eq("id", profile.id);

        if (error) {

            socialhubToast("Could not save visibility.", "error");

            return;
        }

        state.profile.extra =
            extra;

        socialhubPdRenderRow(field, state.profile);

        socialhubToast(
            "Visibility set to " + PD_VIS[vis].label + ".",
            "success"
        );
    }

    // ------------------------------------------
    // EDIT MODAL
    // ------------------------------------------

    function socialhubPdOpen(field) {

        var profile =
            state.profile;

        if (!profile) {

            socialhubPdRender().then(function () {

                socialhubPdOpen(field);
            });

            return;
        }

        var cfg =
            PD_FIELDS[field];

        var value =
            socialhubPdGetValue(profile, field);

        state.field =
            field;

        state.originalValue =
            value;

        state.originalVis =
            socialhubPdGetVis(profile, field);

        state.vis =
            state.originalVis;

        var visMap =
            socialhubPdVisMap(profile);

        state.family =
            Array.isArray(profile.extra && profile.extra.family)
                ? profile.extra.family.slice()
                : [];

        document
            .getElementById("pdModalTitle")
            .textContent =
            cfg.label;

        document
            .getElementById("pdModalBody")
            .innerHTML =
            socialhubPdBuildBody(field, value, state.originalVis, visMap);

        var removeBtn =
            document
                .getElementById("pdRemoveBtn");

        removeBtn.style.display =
            value ? "" : "none";

        document
            .getElementById("pdEditModal")
            .style.display =
            "flex";

        socialhubPdWireBody(field);

        socialhubPdSyncSaveBtn();

        socialhubPdRenderFamilyList();
    }

    function socialhubPdBuildBody(field, value, vis, visMap) {

        var cfg =
            PD_FIELDS[field];

        var visHtml =
            socialhubPdVisControl(vis);

        var body =
            "";

        body +=
            visHtml;

        if (cfg.type === "text") {

            body +=
                '<label class="pd-field-label">' + cfg.label + '</label>' +
                '<input type="text" class="pd-input" id="pdInput" value="' +
                socialhubEscape(value) + '" placeholder="Type here" />';

        } else if (cfg.type === "birthday") {

            body +=
                socialhubPdBirthdayControls(value);

        } else if (cfg.type === "relationship") {

            body +=
                '<label class="pd-field-label">Relationship status</label>' +
                '<select class="pd-input" id="pdInput">' +
                '<option value="">Select relationship status</option>' +
                PD_RELATIONSHIPS.map(function (item) {

                    return '<option value="' + item + '"' +
                        (item === value ? " selected" : "") + ">" +
                        item + "</option>";
                }).join("") +
                "</select>";

        } else if (cfg.type === "gender") {

            body +=
                '<label class="pd-field-label">Gender</label>' +
                socialhubPdRadioGroup(
                    ["Male", "Female", "Custom"],
                    value,
                    "pdInput"
                );

        } else if (cfg.type === "pronouns") {

            body +=
                '<label class="pd-field-label">Select pronouns</label>' +
                socialhubPdRadioGroup(
                    ["he/him", "she/her", "they/them"],
                    value,
                    "pdInput"
                );

        } else if (cfg.type === "family") {

            body +=
                '<label class="pd-field-label">Family members</label>' +
                '<div class="pd-family-list" id="pdFamilyList"></div>' +
                '<div class="pd-family-add">' +
                '<select class="pd-input pd-family-relation" id="pdFamilyRelation">' +
                PD_RELATIONS.map(function (item) {

                    return '<option value="' + item + '">' + item + "</option>";
                }).join("") +
                "</select>" +
                '<input type="text" class="pd-input pd-family-person" id="pdFamilyPerson" list="pdFriendsList" placeholder="Search person" />' +
                '<button type="button" class="pd-btn pd-btn-ghost" id="pdFamilyAddBtn"><i class="fa-solid fa-plus"></i> Add</button>' +
                "</div>" +
                '<datalist id="pdFriendsList">' +
                state.friends.map(function (name) {

                    return '<option value="' + socialhubEscape(name) + '"></option>';
                }).join("") +
                "</datalist>";

        } else if (cfg.type === "languages") {

            var selected =
                value
                    ? value.split(/\s*,\s*/)
                    : [];

            body +=
                '<label class="pd-field-label">Languages</label>' +
                '<div class="pd-search-box">' +
                '<i class="fa-solid fa-search"></i>' +
                '<input type="text" class="pd-input" id="pdLangSearch" placeholder="Search languages..." />' +
                "</div>" +
                '<div class="pd-opt-list" id="pdLangList">' +
                PD_LANGUAGES.map(function (lang) {

                    var checked =
                        selected.indexOf(lang) !== -1;

                    return '<label class="pd-opt-row">' +
                        '<input type="checkbox" value="' + lang + '"' +
                        (checked ? " checked" : "") + " />" +
                        "<span>" + lang + "</span>" +
                        "</label>";
                }).join("") +
                "</div>";
        }

        return body;
    }

    function socialhubPdVisControl(vis) {

        return (
            '<div class="pd-vis-wrap">' +
            '<span class="pd-vis-label">Visibility</span>' +
            '<button type="button" class="pd-vis-btn" id="pdVisBtn">' +
            '<i class="fa-solid ' + PD_VIS[vis].icon + '"></i>' +
            "<span>" + PD_VIS[vis].label + "</span>" +
            '<i class="fa-solid fa-chevron-down pd-vis-caret"></i>' +
            "</button>" +
            '<div class="pd-vis-menu pd-vis-menu-modal" style="display:none">' +
            Object.keys(PD_VIS).map(function (visKey) {

                return '<button type="button" data-vis="' + visKey + '">' +
                    '<i class="fa-solid ' + PD_VIS[visKey].icon + '"></i> ' +
                    PD_VIS[visKey].label +
                    "</button>";
            }).join("") +
            "</div>" +
            "</div>"
        );
    }

    function socialhubPdBirthdayControls(value) {

        var parts =
            value
                ? String(value).split("-")
                : [];

        var year =
            parts[0] || "";

        var monthIndex =
            parts[1] ? parseInt(parts[1], 10) : 0;

        var day =
            parts[2] ? parseInt(parts[2], 10) : 0;

        var currentYear =
            new Date().getFullYear();

        var years =
            "";

        for (var y = currentYear; y >= 1950; y--) {

            years +=
                '<option value="' + y + '"' +
                (String(y) === year ? " selected" : "") + ">" +
                y + "</option>";
        }

        var months =
            '<option value="">Month</option>' +
            PD_MONTHS.map(function (name, i) {

                return '<option value="' + (i + 1) + '"' +
                    ((i + 1) === monthIndex ? " selected" : "") + ">" +
                    name + "</option>";
            }).join("");

        var days =
            '<option value="">Day</option>';

        for (var d = 1; d <= 31; d++) {

            days +=
                '<option value="' + d + '"' +
                (d === day ? " selected" : "") + ">" +
                d + "</option>";
        }

        return (
            '<label class="pd-field-label">Birthday</label>' +
            '<div class="pd-birthday-row">' +
            '<select class="pd-input" id="pdBirthMonth">' + months + "</select>" +
            '<select class="pd-input" id="pdBirthDay">' + days + "</select>" +
            '<select class="pd-input" id="pdBirthYear">' + years + "</select>" +
            "</div>"
        );
    }

    function socialhubPdRadioGroup(options, value, id) {

        return options.map(function (option) {

            return (
                '<label class="pd-opt-row pd-radio-row">' +
                '<input type="radio" name="' + id + '" value="' + option + '"' +
                (option === value ? " checked" : "") + " />" +
                "<span>" + option + "</span>" +
                "</label>"
            );
        }).join("");
    }

    function socialhubPdWireBody(field) {

        var cfg =
            PD_FIELDS[field];

        var visBtn =
            document
                .getElementById("pdVisBtn");

        if (visBtn) {

            visBtn.addEventListener("click", function (event) {

                event.stopPropagation();

                var menu =
                    document.querySelector(".pd-vis-menu-modal");

                if (menu) {

                    menu.style.display =
                        menu.style.display === "flex" ? "none" : "flex";
                }
            });
        }

        var menu =
            document.querySelector(".pd-vis-menu-modal");

        if (menu) {

            menu.querySelectorAll("button").forEach(function (item) {

                item.addEventListener("click", function () {

                    var vis =
                        item.getAttribute("data-vis");

                    state.vis =
                        vis;

                    visBtn.innerHTML =
                        '<i class="fa-solid ' + PD_VIS[vis].icon + '"></i>' +
                        "<span>" + PD_VIS[vis].label + "</span>" +
                        '<i class="fa-solid fa-chevron-down pd-vis-caret"></i>';

                    menu.style.display =
                        "none";

                    socialhubPdSyncSaveBtn();
                });
            });
        }

        var input =
            document
                .getElementById("pdInput");

        if (input) {

            input.addEventListener("input", socialhubPdSyncSaveBtn);

            input.addEventListener("change", socialhubPdSyncSaveBtn);
        }

        document
            .querySelectorAll('input[name="pdInput"]')
            .forEach(function (radio) {

                radio.addEventListener("change", socialhubPdSyncSaveBtn);
            });

        if (cfg.type === "birthday") {

            ["pdBirthMonth", "pdBirthDay", "pdBirthYear"]
                .forEach(function (id) {

                    document
                        .getElementById(id)
                        .addEventListener("change", socialhubPdSyncSaveBtn);
                });
        }

        if (cfg.type === "languages") {

            var search =
                document
                    .getElementById("pdLangSearch");

            if (search) {

                search.addEventListener("input", function () {

                    var term =
                        search.value.trim().toLowerCase();

                    document
                        .querySelectorAll("#pdLangList .pd-opt-row")
                        .forEach(function (row) {

                            var lang =
                                row.querySelector("span").textContent.toLowerCase();

                            row.style.display =
                                term && lang.indexOf(term) === -1
                                    ? "none"
                                    : "";
                        });
                });
            }

            document
                .querySelectorAll("#pdLangList input[type='checkbox']")
                .forEach(function (box) {

                    box.addEventListener("change", socialhubPdSyncSaveBtn);
                });
        }

        if (cfg.type === "family") {

            var addBtn =
                document
                    .getElementById("pdFamilyAddBtn");

            if (addBtn) {

                addBtn.addEventListener("click", function () {

                    var relation =
                        document
                            .getElementById("pdFamilyRelation")
                            .value;

                    var person =
                        document
                            .getElementById("pdFamilyPerson")
                            .value
                            .trim();

                    if (!relation || !person) {

                        socialhubToast("Enter a relation and person name.", "info");

                        return;
                    }

                    state.family.push({

                        relation: relation,
                        name: person
                    });

                    document
                        .getElementById("pdFamilyPerson")
                        .value =
                        "";

                    socialhubPdRenderFamilyList();

                    socialhubPdSyncSaveBtn();
                });
            }

            socialhubPdRenderFamilyList();
        }
    }

    function socialhubPdRenderFamilyList() {

        var list =
            document
                .getElementById("pdFamilyList");

        if (!list) {

            return;
        }

        if (state.family.length === 0) {

            list.innerHTML =
                '<p class="pd-family-empty">No family members added yet.</p>';

            return;
        }

        list.innerHTML =
            state.family.map(function (member, index) {

                return (
                    '<div class="pd-family-row">' +
                    "<span>" +
                    socialhubEscape(member.relation) +
                    ": " +
                    socialhubEscape(member.name) +
                    "</span>" +
                    '<button type="button" class="pd-family-remove" data-index="' +
                    index + '" title="Remove"><i class="fa-solid fa-x"></i></button>' +
                    "</div>"
                );
            }).join("");

        list
            .querySelectorAll(".pd-family-remove")
            .forEach(function (btn) {

                btn.addEventListener("click", function () {

                    var index =
                        parseInt(btn.getAttribute("data-index"), 10);

                    state.family.splice(index, 1);

                    socialhubPdRenderFamilyList();

                    socialhubPdSyncSaveBtn();
                });
            });
    }

    // ------------------------------------------
    // SAVE / REMOVE / CLOSE
    // ------------------------------------------

    function socialhubPdGetCurrentValue() {

        var field =
            state.field;

        var cfg =
            PD_FIELDS[field];

        if (cfg.type === "text") {

            var input =
                document
                    .getElementById("pdInput");

            return input
                ? input.value.trim()
                : "";

        } else if (cfg.type === "relationship") {

            var select =
                document
                    .getElementById("pdInput");

            return select
                ? select.value
                : "";

        } else if (cfg.type === "gender" || cfg.type === "pronouns") {

            var radio =
                document
                    .querySelector('input[name="pdInput"]:checked');

            return radio
                ? radio.value
                : "";

        } else if (cfg.type === "languages") {

            var langs =
                [];

            document
                .querySelectorAll("#pdLangList input[type='checkbox']:checked")
                .forEach(function (box) {

                    langs.push(box.value);
                });

            return langs.join(", ");

        } else if (cfg.type === "family") {

            return state.family;

        } else if (cfg.type === "birthday") {

            var month =
                document
                    .getElementById("pdBirthMonth")
                    .value;

            var day =
                document
                    .getElementById("pdBirthDay")
                    .value;

            var year =
                document
                    .getElementById("pdBirthYear")
                    .value;

            if (!month && !day && !year) {

                return "";
            }

            if (year && !month && !day) {

                return year;
            }

            if (!year || !month || !day) {

                socialhubToast("Select a complete date.", "error");

                return null;
            }

            var pad =
                function (num) {

                    return String(num).padStart(2, "0");
                };

            return year + "-" + pad(month) + "-" + pad(day);
        }

        return "";
    }

    function socialhubPdSyncSaveBtn() {

        var saveBtn =
            document
                .getElementById("pdSaveBtn");

        if (!saveBtn) {

            return;
        }

        var current =
            socialhubPdGetCurrentValue();

        if (current === null) {

            saveBtn.disabled =
                true;

            return;
        }

        var same =
            (current === state.originalValue) &&
            (state.vis === state.originalVis);

        if (typeof current !== "string") {

            same =
                false;
        }

        if (state.field === "family") {

            var joined =
                current.map(function (member) {

                    return member.relation + ": " + member.name;
                }).join(", ");

            same =
                (joined === state.originalValue) &&
                (state.vis === state.originalVis);
        }

        saveBtn.disabled =
            same;
    }

    async function socialhubPdSave() {

        var field =
            state.field;

        if (!field) {

            return;
        }

        var value =
            socialhubPdGetCurrentValue();

        if (value === null) {

            return;
        }

        var profile =
            state.profile;

        var me =
            await socialhubPdGetMe();

        if (!me || !profile) {

            socialhubToast("You are not logged in.", "error");

            return;
        }

        var extra =
            Object.assign({}, profile.extra || {});

        var map =
            Object.assign({}, socialhubPdVisMap(profile));

        map[field] =
            state.vis;

        extra._visibility =
            map;

        var update =
            {
                extra: extra
            };

        var cfg =
            PD_FIELDS[field];

        if (cfg.extraKey) {

            extra[cfg.extraKey] =
                value;

        } else if (field === "location") {

            update.location =
                typeof value === "string" ? value : "";

        } else if (field === "birthday") {

            update.birthday =
                typeof value === "string" && value ? value : null;
        }

        var {
            error
        } = await db
            .from("profiles")
            .update(update)
            .eq("id", me.id);

        if (error) {

            socialhubToast("Could not save changes.", "error");

            return;
        }

        socialhubPdClose();

        socialhubToast("Saved.", "success");

        await socialhubPdRender();

        if (typeof showCurrentUserData === "function") {

            showCurrentUserData();
        }
    }

    function socialhubPdAskRemove() {

        var body =
            document
                .getElementById("pdModalBody");

        var original =
            body.innerHTML;

        var saveBtn =
            document
                .getElementById("pdSaveBtn");

        var cancelBtn =
            document
                .getElementById("pdCancelBtn");

        var removeBtn =
            document
                .getElementById("pdRemoveBtn");

        body.innerHTML =
            '<div class="pd-remove-confirm">' +
            "<h4>Remove this information?</h4>" +
            "<p>This information will be removed from your profile.</p>" +
            "</div>";

        saveBtn.style.display =
            "none";

        removeBtn.onclick =
            socialhubPdRemove;

        cancelBtn.onclick =
            function restore() {

                body.innerHTML =
                    original;

                saveBtn.style.display =
                    "";

                removeBtn.onclick =
                    socialhubPdAskRemove;

                cancelBtn.onclick =
                    socialhubPdClose;

                socialhubPdWireBody(state.field);

                socialhubPdSyncSaveBtn();
            };
    }

    async function socialhubPdRemove() {

        var field =
            state.field;

        if (!field) {

            return;
        }

        var profile =
            state.profile;

        var me =
            await socialhubPdGetMe();

        if (!me || !profile) {

            socialhubToast("You are not logged in.", "error");

            return;
        }

        var extra =
            Object.assign({}, profile.extra || {});

        var cfg =
            PD_FIELDS[field];

        if (cfg.extraKey) {

            delete extra[cfg.extraKey];

        }

        var update =
            {
                extra: extra
            };

        if (field === "location") {

            update.location =
                null;

        } else if (field === "birthday") {

            update.birthday =
                null;
        }

        var {
            error
        } = await db
            .from("profiles")
            .update(update)
            .eq("id", me.id);

        if (error) {

            socialhubToast("Could not remove.", "error");

            return;
        }

        socialhubPdClose();

        socialhubToast("Removed.", "success");

        await socialhubPdRender();

        if (typeof showCurrentUserData === "function") {

            showCurrentUserData();
        }
    }

    function socialhubPdClose() {

        state.field =
            null;

        document
            .getElementById("pdEditModal")
            .style.display =
            "none";

        var removeBtn =
            document
                .getElementById("pdRemoveBtn");

        removeBtn.onclick =
            socialhubPdAskRemove;

        document
            .querySelectorAll(".pd-vis-menu")
            .forEach(function (menu) {

                menu.remove();
            });
    }

    // ------------------------------------------
    // WIRE ROWS
    // ------------------------------------------

    function socialhubPdWireRows() {

        document
            .querySelectorAll(".pd-row")
            .forEach(function (row) {

                var field =
                    row.getAttribute("data-pd-field");

                var editBtn =
                    row.querySelector(".pd-edit");

                editBtn.addEventListener("click", function () {

                    socialhubPdOpen(field);
                });

                var visBtn =
                    row.querySelector(".pd-vis");

                visBtn.addEventListener("click", function (event) {

                    event.stopPropagation();

                    socialhubPdRowVisMenu(visBtn, field);
                });
            });

        var modal =
            document
                .getElementById("pdEditModal");

        var closeBtn =
            document
                .getElementById("pdModalClose");

        var cancelBtn =
            document
                .getElementById("pdCancelBtn");

        var saveBtn =
            document
                .getElementById("pdSaveBtn");

        var removeBtn =
            document
                .getElementById("pdRemoveBtn");

        closeBtn.onclick =
            socialhubPdClose;

        cancelBtn.onclick =
            socialhubPdClose;

        saveBtn.onclick =
            socialhubPdSave;

        removeBtn.onclick =
            socialhubPdAskRemove;

        modal.addEventListener("click", function (event) {

            if (event.target === modal) {

                socialhubPdClose();
            }
        });

        document.addEventListener("keydown", function (event) {

            if (event.key === "Escape" && modal.style.display !== "none") {

                socialhubPdClose();
            }
        });
    }

    // ------------------------------------------
    // INIT
    // ------------------------------------------

    document.addEventListener("DOMContentLoaded", function () {

        socialhubPdWireRows();

        socialhubPdFetchFriends();

        socialhubPdRender();
    });

})();