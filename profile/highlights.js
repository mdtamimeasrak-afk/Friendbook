// ======================================================
// Friendio - HIGHLIGHTS (Instagram-style)
// ======================================================
// Create / edit / view profile highlights. Stories-like
// full-screen viewer with auto-advance + progress bars.
//
// SQL (run once in Supabase SQL Editor):
//   create table if not exists public.highlights (
//     id uuid primary key default gen_random_uuid(),
//     user_id uuid not null references auth.users(id) on delete cascade,
//     name text not null default 'Highlight',
//     cover_url text,
//     post_ids text[] not null default '{}',
//     created_at timestamptz not null default now()
//   );
//   alter table public.highlights enable row level security;
//   create policy "highlights select" on public.highlights
//     for select using (true);
//   create policy "highlights insert" on public.highlights
//     for insert with check (auth.uid() = user_id);
//   create policy "highlights update" on public.highlights
//     for update using (auth.uid() = user_id);
//   create policy "highlights delete" on public.highlights
//     for delete using (auth.uid() = user_id);
// ======================================================

var db = window.db || supabaseClient;


var socialhubHighlightUserCache = null;

var socialhubHighlightCreateMode = null;

var socialhubHighlightAllPosts = [];

var socialhubHighlightPicked = [];

var socialhubHighlightViewerState = {
    highlight: null,
    posts: [],
    profile: null,
    index: 0,
    timer: null
};



// ======================================================
// HELPERS
// ======================================================

async function socialhubHighlightGetUser() {

    if (socialhubHighlightUserCache) {

        return socialhubHighlightUserCache;

    }


    const result =
        await db.auth.getUser();


    const user =
        result && result.data
            ? result.data.user
            : null;


    socialhubHighlightUserCache = user;

    return socialhubHighlightUserCache;

}


function socialhubHighlightEsc(text) {

    return String(
        text || ""
    ).replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

}


function socialhubHighlightFindPost(id) {

    return socialhubHighlightAllPosts.find(
        function(post) {

            return post.id === id;

        }
    );

}



// ======================================================
// LOAD HIGHLIGHTS BAR
// ======================================================

async function socialhubLoadHighlights() {

    const me =
        await socialhubHighlightGetUser();


    const bar =
        document.getElementById(
            "highlightsBar"
        );


    if (!bar || !me) {

        return;

    }


    const result =
        await db
            .from("highlights")
            .select("*")
            .eq("user_id", me.id)
            .order("created_at", {
                ascending: true
            });


    const list =
        (result && result.data) || [];


    let html =
        '<div class="highlight-tile new" onclick="socialhubOpenHighlightCreate()">' +
            '<div class="highlight-ring">' +
                '<div class="highlight-cover">+</div>' +
            '</div>' +
            '<span>New</span>' +
        '</div>';


    list.forEach(function(item) {

        const coverUrl =
            item.cover_url;


        let coverInner =
            '<div class="highlight-cover" style="background:' +
            "linear-gradient(135deg, #f09433, #dc2743, #7c3aed)" +
            '">' +
                socialhubHighlightEsc(
                    item.name
                        ? item.name.charAt(0).toUpperCase()
                        : "H"
                ) +
            '</div>';


        if (coverUrl) {

            coverInner =
                '<div class="highlight-cover">' +
                    '<img src="' + coverUrl + '" alt="">' +
                '</div>';

        }


        html +=
            '<div class="highlight-tile" onclick="socialhubOpenHighlightViewer(\'' +
            item.id +
            '\')">' +
                '<div class="highlight-ring">' +
                    coverInner +
                '</div>' +
                '<span>' +
                socialhubHighlightEsc(item.name) +
                '</span>' +
            '</div>';

    });


    bar.innerHTML = html;

}



// ======================================================
// CREATE / EDIT MODAL
// ======================================================

async function socialhubOpenHighlightCreate(editId) {

    const me =
        await socialhubHighlightGetUser();


    if (!me) {

        alert(
            "Please login first."
        );

        return;

    }


    socialhubHighlightCreateMode =
        editId || null;


    const title =
        document.getElementById(
            "highlightCreateTitle"
        );


    const deleteBtn =
        document.getElementById(
            "highlightDeleteBtn"
        );


    if (title) {

        title.textContent =
            editId
                ? "Edit Highlight"
                : "New Highlight";

    }


    if (deleteBtn) {

        deleteBtn.style.display =
            editId ? "inline-block" : "none";

    }


    const nameInput =
        document.getElementById(
            "highlightNameInput"
        );


    if (nameInput) {

        nameInput.value = "";

    }


    // Load own posts

    const postsResult =
        await db
            .from("posts")
            .select("id, content, image_url, background, background_color")
            .eq("user_id", me.id)
            .order("created_at", {
                ascending: false
            })
            .limit(100);


    socialhubHighlightAllPosts =
        (postsResult && postsResult.data) || [];


    socialhubHighlightPicked = [];


    // Edit mode: prefill picked posts + name

    if (editId) {

        const highlightResult =
            await db
                .from("highlights")
                .select("*")
                .eq("id", editId)
                .maybeSingle();


        const highlight =
            highlightResult && highlightResult.data;


        if (highlight) {

            if (nameInput) {

                nameInput.value =
                    highlight.name || "";

            }


            (highlight.post_ids || []).forEach(
                function(id) {

                    const post =
                        socialhubHighlightFindPost(id);


                    if (post) {

                        socialhubHighlightPicked.push(
                            post
                        );

                    }

                }
            );

        }

    }


    socialhubRenderHighlightGrid();

    socialhubUpdateHighlightGridSelection();


    const modal =
        document.getElementById(
            "highlightCreateModal"
        );


    if (modal) {

        modal.classList.add("active");

    }

}


function socialhubCloseHighlightCreate() {

    const modal =
        document.getElementById(
            "highlightCreateModal"
        );


    if (modal) {

        modal.classList.remove(
            "active"
        );

    }


    socialhubHighlightCreateMode = null;

}


function socialhubRenderHighlightGrid() {

    const grid =
        document.getElementById(
            "highlightPostsGrid"
        );


    if (!grid) {

        return;

    }


    if (!socialhubHighlightAllPosts.length) {

        grid.innerHTML =
            '<p class="highlight-posts-empty">' +
            "No posts yet. Create a post with a photo first!" +
            '</p>';

        return;

    }


    grid.innerHTML =
        socialhubHighlightAllPosts.map(
            function(post) {

                let inner;


                if (post.image_url) {

                    inner =
                        '<img src="' +
                        post.image_url +
                        '" alt="">';

                } else {

                    const bgStyle =
                        post.background
                            ? "background:" + post.background + ";"
                            : (post.background_color
                                ? "background-color:" + post.background_color + ";"
                                : "background:#7c3aed;");


                    inner =
                        '<div class="highlight-post-pick-text" style="' +
                        bgStyle +
                        '">' +
                        socialhubHighlightEsc(post.content) +
                        '</div>';

                }


                return (
                    '<div class="highlight-post-pick" id="highlightPick_' +
                    post.id +
                    '" onclick="socialhubTogglePostPick(\'' +
                    post.id +
                    '\')">' +
                        '<span class="highlight-check">✓</span>' +
                        inner +
                    '</div>'
                );

            }
        ).join("");

}


function socialhubUpdateHighlightGridSelection() {

    socialhubHighlightPicked.forEach(
        function(post) {

            const tile =
                document.getElementById(
                    "highlightPick_" + post.id
                );


            if (tile) {

                tile.classList.add(
                    "selected"
                );

            }

        }
    );

}


function socialhubTogglePostPick(id) {

    const post =
        socialhubHighlightFindPost(id);


    if (!post) {

        return;

    }


    const index =
        socialhubHighlightPicked.findIndex(
            function(picked) {

                return picked.id === id;

            }
        );


    if (index >= 0) {

        socialhubHighlightPicked.splice(
            index,
            1
        );

    } else {

        socialhubHighlightPicked.push(
            post
        );

    }


    const tile =
        document.getElementById(
            "highlightPick_" + id
        );


    if (tile) {

        tile.classList.toggle(
            "selected",
            index < 0
        );

    }

}



// ======================================================
// SAVE / DELETE
// ======================================================

async function socialhubSaveHighlight() {

    const me =
        await socialhubHighlightGetUser();


    if (!me) {

        alert(
            "Please login first."
        );

        return;

    }


    const nameInput =
        document.getElementById(
            "highlightNameInput"
        );


    const name =
        (nameInput && nameInput.value.trim()) || "Highlight";


    const postIds =
        socialhubHighlightPicked.map(
            function(post) {

                return post.id;

            }
        );


    const coverPost =
        socialhubHighlightPicked.find(
            function(post) {

                return post.image_url;

            }
        );


    const payload = {

        name: name,

        cover_url:
            coverPost ? coverPost.image_url : null,

        post_ids: postIds

    };


    if (socialhubHighlightCreateMode) {

        const updateResult =
            await db
                .from("highlights")
                .update(payload)
                .eq(
                    "id",
                    socialhubHighlightCreateMode
                );


        if (updateResult && updateResult.error) {

            alert(
                "Could not save highlight."
            );

            return;

        }

    } else {

        const insertResult =
            await db
                .from("highlights")
                .insert({

                    ...payload,

                    user_id: me.id

                });


        if (insertResult && insertResult.error) {

            alert(
                "Could not create highlight."
            );

            return;

        }

    }


    socialhubCloseHighlightCreate();

    socialhubLoadHighlights();

}


async function socialhubDeleteHighlight() {

    if (!socialhubHighlightCreateMode) {

        return;

    }


    if (
        !confirm(
            "Delete this highlight?"
        )
    ) {

        return;

    }


    await db
        .from("highlights")
        .delete()
        .eq(
            "id",
            socialhubHighlightCreateMode
        );


    socialhubCloseHighlightCreate();

    socialhubLoadHighlights();

}



// ======================================================
// VIEWER
// ======================================================

async function socialhubOpenHighlightViewer(id) {

    const highlightResult =
        await db
            .from("highlights")
            .select("*")
            .eq("id", id)
            .maybeSingle();


    const highlight =
        highlightResult && highlightResult.data;


    if (!highlight) {

        alert(
            "Could not load highlight."
        );

        return;

    }


    const postIds =
        highlight.post_ids || [];


    let posts = [];


    if (postIds.length) {

        const postsResult =
            await db
                .from("posts")
                .select("id, content, image_url, background, background_color")
                .in("id", postIds);


        posts =
            (postsResult && postsResult.data) || [];

    }


    if (!posts.length) {

        alert(
            "This highlight has no posts yet."
        );

        return;
    }


    const me =
        await socialhubHighlightGetUser();


    let profile = null;


    if (me) {

        const profileResult =
            await db
                .from("profiles")
                .select("avatar_url, full_name")
                .eq("id", me.id)
                .maybeSingle();


        profile =
            profileResult && profileResult.data
                ? profileResult.data
                : null;

    }


    socialhubHighlightViewerState.highlight =
        highlight;

    socialhubHighlightViewerState.posts =
        posts;

    socialhubHighlightViewerState.profile =
        profile;

    socialhubHighlightViewerState.index = 0;

    socialhubHighlightViewerState.timer = null;


    const viewer =
        document.getElementById(
            "highlightViewer"
        );


    if (viewer) {

        viewer.classList.add(
            "active"
        );

    }


    socialhubRenderHighlightViewer();

    socialhubHighlightViewerState.timer =
        setTimeout(
            socialhubHighlightAutoNext,
            4000
        );

}


function socialhubRenderHighlightViewer() {

    const state =
        socialhubHighlightViewerState;


    const stage =
        document.getElementById(
            "highlightViewerStage"
        );


    if (!stage) {

        return;

    }


    const posts =
        state.posts;

    const post =
        posts[state.index];


    // Progress row

    let progressHtml =
        '<div class="highlight-progress-row">';


    posts.forEach(function(item, i) {

        let fill = "";


        if (i < state.index) {

            fill =
                '<div class="highlight-progress-fill" style="width:100%"></div>';

        } else if (i === state.index) {

            fill =
                '<div class="highlight-progress-fill"></div>';

        }


        progressHtml +=
            '<div class="highlight-progress-seg' +
            (i === state.index ? " active" : "") +
            '">' +
            fill +
            '</div>';

    });


    progressHtml +=
        '</div>';


    // Top bar

    const profile =
        state.profile;

    const avatarUrl =
        profile && profile.avatar_url
            ? profile.avatar_url
            : null;


    const displayName =
        profile && profile.full_name
            ? profile.full_name
            : "You";


    const avatarHtml =
        avatarUrl
            ? '<img src="' + avatarUrl + '" alt="">'
            : '<div class="hv-user-fallback">' +
                socialhubHighlightEsc(
                    displayName.charAt(0).toUpperCase()
                ) +
              '</div>';


    const topHtml =
        '<div class="highlight-viewer-top">' +
            '<div class="highlight-viewer-user">' +
                avatarHtml +
                '<div>' +
                    '<strong>' +
                    socialhubHighlightEsc(displayName) +
                    '</strong>' +
                    '<span>' +
                    socialhubHighlightEsc(
                        state.highlight.name || "Highlight"
                    ) +
                    '</span>' +
                '</div>' +
            '</div>' +
            '<button onclick="socialhubEditHighlightFromViewer()" title="Edit">✏️</button>' +
            '<button onclick="socialhubCloseHighlightViewer(event)" title="Close">✕</button>' +
        '</div>';


    // Slide content

    let slideHtml;


    if (post.image_url) {

        slideHtml =
            '<div class="highlight-slide">' +
                '<img class="highlight-slide-img" src="' +
                post.image_url +
                '" alt="">' +
            '</div>';

    } else {

        const bgStyle =
            post.background
                ? "background:" + post.background + ";"
                : (post.background_color
                    ? "background-color:" + post.background_color + ";"
                    : "background:#7c3aed;");


        slideHtml =
            '<div class="highlight-slide">' +
                '<div class="highlight-slide-text" style="' +
                bgStyle +
                '">' +
                socialhubHighlightEsc(post.content) +
                '</div>' +
            '</div>';

    }


    // Nav zones

    let navHtml = "";


    if (posts.length > 1) {

        navHtml =
            '<div class="highlight-nav-left" onclick="socialhubHighlightNav(-1, event)"></div>' +
            '<div class="highlight-nav-right" onclick="socialhubHighlightNav(1, event)"></div>';

    }


    stage.innerHTML =
        progressHtml +
        topHtml +
        slideHtml +
        navHtml;

}


function socialhubHighlightAutoNext() {

    const state =
        socialhubHighlightViewerState;


    state.index += 1;


    if (state.index >= state.posts.length) {

        socialhubCloseHighlightViewer();

        return;

    }


    socialhubRenderHighlightViewer();

    state.timer =
        setTimeout(
            socialhubHighlightAutoNext,
            4000
        );

}


function socialhubHighlightNav(direction, event) {

    if (event) {

        event.stopPropagation();

    }


    const state =
        socialhubHighlightViewerState;


    clearTimeout(state.timer);


    state.index += direction;


    if (state.index < 0) {

        state.index =
            state.posts.length - 1;

    }


    if (state.index >= state.posts.length) {

        socialhubCloseHighlightViewer();

        return;

    }


    socialhubRenderHighlightViewer();

    state.timer =
        setTimeout(
            socialhubHighlightAutoNext,
            4000
        );

}


function socialhubCloseHighlightViewer(event) {

    if (event) {

        event.stopPropagation();

    }


    clearTimeout(
        socialhubHighlightViewerState.timer
    );


    const viewer =
        document.getElementById(
            "highlightViewer"
        );


    if (!viewer) {

        return;

    }


    const clickedButton =
        event &&
        event.target &&
        event.target.closest &&
        event.target.closest("button");


    if (
        !event ||
        event.target === viewer ||
        clickedButton
    ) {

        viewer.classList.remove(
            "active"
        );

    }

}


function socialhubEditHighlightFromViewer() {

    const state =
        socialhubHighlightViewerState;


    const id =
        state.highlight
            ? state.highlight.id
            : null;


    socialhubCloseHighlightViewer();


    if (id) {

        socialhubOpenHighlightCreate(id);

    }

}



// ======================================================
// INIT
// ======================================================

socialhubHighlightGetUser().then(
    function(me) {

        if (me) {

            socialhubLoadHighlights();

        }

    }
);
