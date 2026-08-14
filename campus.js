// ======================================================
// TRIYA - CAMPUS COMMUNITY (Step 3)
// Campus data from Supabase + functional Join/Leave.
// ======================================================

// ------------------------------------------------------
// Fallback demo data (shown when DB is unreachable or
// the user is logged out - Supabase is the source of truth)
// ------------------------------------------------------

const SOCIALHUB_CAMPUS_DEMO = {
    id: "demo-bpi",
    name: "Bogra Polytechnic Institute",
    location: "Bogra, Bangladesh",
    students: "12,450",
    verified: true
};


// ------------------------------------------------------
// Campus state
// ------------------------------------------------------

const socialhubCampusState = {
    campus: null,
    joined: false,
    count: 0,
    loading: false
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

    socialhubCampusLoad();
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
// 3. LOAD CAMPUS FROM SUPABASE
// ======================================================

async function socialhubCampusLoad() {

    try {

        const {
            data: sessionData
        } =
            await supabaseClient.auth.getSession();

        if (!sessionData || !sessionData.session) {

            socialhubCampusRenderDemo();

            return;
        }

        const user =
            sessionData.session.user;

        const {
            data: campus,
            error: campusError
        } =
            await supabaseClient
                .from("campuses")
                .select(`
                    id,
                    name,
                    short_name,
                    location,
                    description,
                    logo_url,
                    verified
                `)
                .order("created_at", { ascending: true })
                .limit(1);

        if (campusError) {

            socialhubCampusRenderDemo();

            return;
        }

        if (!campus || !campus.length) {

            socialhubCampusRenderDemo();

            return;
        }

        const current =
            campus[0];

        const {
            count
        } =
            await supabaseClient
                .from("campus_members")
                .select("*", { count: "exact", head: true })
                .eq("campus_id", current.id);

        const {
            data: mine
        } =
            await supabaseClient
                .from("campus_members")
                .select("id")
                .eq("campus_id", current.id)
                .eq("user_id", user.id)
                .limit(1);

        socialhubCampusState.campus = current;

        socialhubCampusState.count = count || 0;

        socialhubCampusState.joined =
            !!(mine && mine.length);

        socialhubCampusRender(current);
    }
    catch (err) {

        socialhubCampusRenderDemo();
    }
}


// ======================================================
// 4. RENDER (Supabase data)
// ======================================================

function socialhubCampusRender(campus) {

    const name =
        document.getElementById("campusName");

    const location =
        document.getElementById("campusLocation");

    const verified =
        document.getElementById("campusVerified");

    const count =
        document.getElementById("campusStudentCount");

    if (name) {
        name.textContent = campus.name;
    }

    if (location) {
        location.textContent = campus.location || "";
    }

    if (verified) {

        verified.style.display =
            campus.verified ? "inline-flex" : "none";
    }

    if (count) {

        const n = socialhubCampusState.count;

        count.textContent = n.toLocaleString();

        const label =
            document.getElementById("campusStudentsLabel");

        if (label) {

            label.textContent =
                n === 1 ? "Student" : "Students";
        }
    }

    if (campus.logo_url) {

        socialhubCampusSetLogo(campus.logo_url);
    }

    socialhubCampusSetButton(
        socialhubCampusState.joined
    );
}


// ======================================================
// 5. DEMO RENDER (fallback)
// ======================================================

function socialhubCampusRenderDemo() {

    const demo =
        SOCIALHUB_CAMPUS_DEMO;

    socialhubCampusState.campus = null;

    socialhubCampusRender({
        name: demo.name,
        location: demo.location,
        verified: demo.verified,
        logo_url: null
    });

    const count =
        document.getElementById("campusStudentCount");

    if (count) {

        count.textContent = demo.students;
    }
}


// ======================================================
// 6. JOIN / LEAVE BUTTON
// ======================================================

function socialhubCampusSetButton(joined, loading) {

    const btn =
        document.getElementById("campusJoinBtn");

    if (!btn) {
        return;
    }

    btn.classList.toggle("joined", joined);

    btn.disabled = !!loading;

    btn.innerHTML = loading
        ? '<i class="fa-solid fa-spinner fa-spin"></i><span>Please wait...</span>'
        : joined
            ? '<i class="fa-solid fa-check"></i><span>Joined ✓</span>'
            : '<i class="fa-solid fa-user-plus"></i><span>Join Campus</span>';
}


async function socialhubCampusJoinClick() {

    const campus =
        socialhubCampusState.campus;

    if (!campus) {

        socialhubToast(
            "Campus data is not ready yet.",
            "info"
        );

        return;
    }

    if (socialhubCampusState.loading) {
        return;
    }

    let user = null;

    try {

        const {
            data: sessionData
        } =
            await supabaseClient.auth.getSession();

        if (sessionData && sessionData.session) {

            user = sessionData.session.user;
        }
    }
    catch (err) {
        user = null;
    }

    if (!user) {

        socialhubToast(
            "Please login first to join the campus.",
            "error"
        );

        return;
    }

    socialhubCampusState.loading = true;

    socialhubCampusSetButton(
        socialhubCampusState.joined,
        true
    );

    try {

        if (!socialhubCampusState.joined) {

            const { error } =
                await supabaseClient
                    .from("campus_members")
                    .insert({
                        campus_id: campus.id,
                        user_id: user.id
                    });

            if (error) {

                if (error.code === "23505") {

                    socialhubCampusState.joined = true;

                    socialhubToast(
                        "You are already a member of this campus.",
                        "info"
                    );
                }
                else {

                    socialhubToast(
                        "Could not join the campus. Please try again.",
                        "error"
                    );
                }
            }
            else {

                socialhubCampusState.joined = true;

                socialhubCampusState.count += 1;

                socialhubCampusRender(campus);

                socialhubToast(
                    "You joined the campus! 🎉",
                    "success"
                );
            }
        }
        else {

            const sure =
                confirm(
                    "Leave this campus?"
                );

            if (!sure) {

                return;
            }

            const { error } =
                await supabaseClient
                    .from("campus_members")
                    .delete()
                    .eq("campus_id", campus.id)
                    .eq("user_id", user.id);

            if (error) {

                socialhubToast(
                    "Could not leave the campus. Please try again.",
                    "error"
                );
            }
            else {

                socialhubCampusState.joined = false;

                socialhubCampusState.count =
                    Math.max(0, socialhubCampusState.count - 1);

                socialhubCampusRender(campus);

                socialhubToast(
                    "You left the campus.",
                    "info"
                );
            }
        }
    }
    finally {

        socialhubCampusState.loading = false;

        socialhubCampusSetButton(
            socialhubCampusState.joined
        );
    }
}


// ======================================================
// 7. LOGO (image or emoji fallback)
// ======================================================

function socialhubCampusSetLogo(url) {

    const img =
        document.getElementById("campusLogoImg");

    const emoji =
        document.getElementById("campusLogoEmoji");

    if (!img || !url) {
        return;
    }

    img.onload = () => {

        img.style.display = "block";

        if (emoji) {
            emoji.style.display = "none";
        }
    };

    img.onerror = () => {

        img.style.display = "none";

        if (emoji) {
            emoji.style.display = "flex";
        }
    };

    img.src = url;
}


// ======================================================
// 8. START
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
