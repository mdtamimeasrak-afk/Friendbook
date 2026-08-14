// ======================================================
// TRIYA - CAMPUS COMMUNITY (Step 1)
// Basic campus page: hero + tabs + tab switching.
// Join button is UI-only for now (Supabase wiring = Step 3).
// ======================================================

// ------------------------------------------------------
// DEMO campus data (Step 2 replaces this with Supabase)
// ------------------------------------------------------

const SOCIALHUB_CAMPUS_DEMO = {
    id: "demo-bpi",
    name: "Bogra Polytechnic Institute",
    location: "Bogra, Bangladesh",
    students: "12,450",
    verified: true
};


// ======================================================
// 1. INIT
// ======================================================

function socialhubCampusInit() {

    const tabs =
        document.querySelectorAll(".campus-tab");

    tabs.forEach(tab => {

        tab.addEventListener(
            "click",
            () => {

                socialhubCampusSwitchTab(
                    tab.dataset.tab
                );
            }
        );
    });
}


// ======================================================
// 2. TAB SWITCHING
// ======================================================

function socialhubCampusSwitchTab(tabName) {

    document
        .querySelectorAll(".campus-tab")
        .forEach(tab => {

            tab.classList.toggle(
                "active",
                tab.dataset.tab === tabName
            );
        });

    document
        .querySelectorAll(".campus-pane")
        .forEach(pane => {

            pane.classList.toggle(
                "active",
                pane.id === "campusPane-" + tabName
            );
        });
}


// ======================================================
// 3. JOIN BUTTON (UI only - Step 3 wires Supabase)
// ======================================================

function socialhubCampusJoinClick() {

    const btn =
        document.getElementById("campusJoinBtn");

    if (!btn) {
        return;
    }

    if (typeof socialhubToast === "function") {

        socialhubToast(
            "🎓 Join Campus will work in Step 3 (Supabase).",
            "info"
        );

    } else {

        alert(
            "Join Campus will work in Step 3 (Supabase)."
        );
    }
}


// ======================================================
// 4. START
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    socialhubCampusInit
);

if (
    document.readyState === "interactive" ||
    document.readyState === "complete"
) {

    socialhubCampusInit();
}
