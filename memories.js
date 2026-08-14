// ======================================================
// SOCIALHUB - MEMORIES (🕰️ On this day)
// ======================================================
// Shows posts from the same date in previous years
// (own posts + friends' posts) at the top of the feed.
// ======================================================

(function socialhubMemoriesInjectStyles() {

    const style =
        document.createElement("style");

    style.textContent = `

#memoriesWidget {
    margin-bottom: 14px;
}

.memory-card {
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    padding: 14px;
    display: flex;
    align-items: center;
    gap: 14px;
    position: relative;
}

.memory-card + .memory-card {
    margin-top: 10px;
}

.memory-icon {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: linear-gradient(135deg, #6a11cb, #2575fc);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    flex-shrink: 0;
    box-shadow: 0 3px 10px rgba(37, 117, 252, 0.35);
}

.memory-body {
    flex: 1;
    min-width: 0;
}

.memory-title {
    margin: 0 0 2px;
    font-size: 14px;
    font-weight: 800;
    color: #1c1e21;
    display: flex;
    align-items: center;
    gap: 8px;
}

.memory-title .memory-ago {
    font-size: 11.5px;
    font-weight: 600;
    color: #65676b;
    background: #f0f2f5;
    padding: 3px 10px;
    border-radius: 12px;
}

.memory-text {
    margin: 2px 0 0;
    font-size: 13px;
    color: #65676b;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.memory-thumb {
    width: 64px;
    height: 64px;
    border-radius: 10px;
    object-fit: cover;
    flex-shrink: 0;
}

.memory-close {
    position: absolute;
    top: 10px;
    right: 10px;
    border: none;
    background: #f0f2f5;
    color: #65676b;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: 0.12s;
}

.memory-close:hover {
    background: #e41e3f;
    color: #fff;
}

body.dark-mode .memory-card {
    background: #242526;
}

body.dark-mode .memory-title {
    color: #e4e6eb;
}

body.dark-mode .memory-text {
    color: #b0b3b8;
}

body.dark-mode .memory-title .memory-ago {
    background: #3a3b3c;
    color: #b0b3b8;
}

body.dark-mode .memory-close {
    background: #3a3b3c;
    color: #b0b3b8;
}
`;

    document.head.appendChild(style);
})();


// ======================================================
// HELPERS
// ======================================================

async function socialhubMemoriesGetMe() {

    const {
        data,
        error
    } = await db.auth.getUser();

    if (error || !data.user) {
        return null;
    }

    return data.user;
}


async function socialhubMemoriesFriendIds(meId) {

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


function socialhubMemoriesEscape(text) {

    const div =
        document.createElement("div");

    div.innerText =
        text || "";

    return div.innerHTML;
}


function socialhubMemoriesYearsAgo(dateStr) {

    const then =
        new Date(dateStr);

    const now =
        new Date();

    let years =
        now.getFullYear() - then.getFullYear();

    const thenThisYear =
        new Date(now.getFullYear(), then.getMonth(), then.getDate());

    if (thenThisYear > now) {
        years -= 1;
    }

    return Math.max(years, 1);
}


// ======================================================
// LOAD MEMORIES
// ======================================================

async function socialhubLoadMemories() {

    const widget =
        document.getElementById("memoriesWidget");

    if (!widget) {
        return;
    }

    const me =
        await socialhubMemoriesGetMe();

    if (!me) {
        return;
    }

    try {

        const hidden =
            new Set(
                JSON.parse(
                    localStorage.getItem("socialhub-memories-hidden") || "[]"
                )
            );

        const friendIds =
            await socialhubMemoriesFriendIds(me.id);

        const scopeIds =
            [me.id, ...friendIds];

        const { data: posts } =
            await db
                .from("posts")
                .select("*")
                .lt("created_at", new Date().toISOString())
                .order("created_at", { ascending: false })
                .limit(400);

        if (!posts || posts.length === 0) {
            return;
        }

        const todayMonth =
            new Date().getMonth();

        const todayDay =
            new Date().getDate();

        // Same month/day, any previous year
        const memories =
            (posts || [])
                .filter(post => {

                    const d =
                        new Date(post.created_at);

                    const isSameDate =
                        d.getMonth() === todayMonth &&
                        d.getDate() === todayDay;

                    if (!isSameDate) {
                        return false;
                    }

                    if (!scopeIds.includes(post.user_id)) {
                        return false;
                    }

                    if (hidden.has(post.id)) {
                        return false;
                    }

                    return true;
                })
                .sort(
                    (a, b) =>
                        new Date(b.created_at) - new Date(a.created_at)
                )
                .slice(0, 3);

        if (memories.length === 0) {
            return;
        }

        // Profiles for authors
        const userIds =
            [...new Set(
                memories.map(m => m.user_id).filter(Boolean)
            )];

        const profileMap = {};

        if (userIds.length > 0) {

            const {
                data: profiles
            } = await db
                .from("profiles")
                .select("id, full_name, avatar_url")
                .in("id", userIds);

            (profiles || []).forEach(p => {

                profileMap[p.id] = p;
            });
        }

        memories.forEach(memory => {

            const profile =
                profileMap[memory.user_id] || {};

            const name =
                profile.full_name || "Someone";

            const years =
                socialhubMemoriesYearsAgo(memory.created_at);

            const agoLabel =
                years === 1
                    ? "1 year ago"
                    : years + " years ago";

            const card =
                document.createElement("div");

            card.className = "memory-card";

            card.innerHTML = `

                <div class="memory-icon">
                    <i class="fa-solid fa-clock-rotate-left"></i>
                </div>

                <div class="memory-body">

                    <p class="memory-title">
                        <span>🕰️ On this day — ${socialhubMemoriesEscape(name)}</span>
                        <span class="memory-ago">${agoLabel}</span>
                    </p>

                    <p class="memory-text">
                        ${socialhubMemoriesEscape(memory.content || "(Photo memory)")}
                    </p>

                </div>

                ${
                    memory.image_url
                        ? `<img class="memory-thumb" src="${socialhubMemoriesEscape(memory.image_url)}" alt="">`
                        : ""
                }

                <button class="memory-close" type="button" title="Hide">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            `;

            card
                .querySelector(".memory-close")
                .addEventListener("click", () => {

                    hidden.add(memory.id);

                    localStorage.setItem(
                        "socialhub-memories-hidden",
                        JSON.stringify([...hidden])
                    );

                    card.remove();

                    if (widget.querySelectorAll(".memory-card").length === 0) {
                        widget.innerHTML = "";
                    }
                });

            widget.appendChild(card);
        });

    } catch (err) {

        console.warn("⚠️ Memories skipped:", err);
    }
}


document.addEventListener("DOMContentLoaded", () => {

    socialhubLoadMemories();
});