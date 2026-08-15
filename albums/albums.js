function socialhubPageId() {
    const segs =
        window.location.pathname
            .replace(/\/+$/, "")
            .split("/")
            .filter(Boolean);
    const last =
        segs[segs.length - 1] || "";
    const folder =
        segs.length >= 2 ? segs[segs.length - 2] : "";
    if (last && last.endsWith(".html") && last !== "index.html") {
        return folder + "/" + last;
    }
    return (last && last !== "index.html" ? last : folder) + "/index.html";
}


// ======================================================
// SOCIALHUB - PHOTO ALBUMS (📸)
// ======================================================
// albums.html  -> album list + create
// album.html   -> album photos + upload + lightbox
// Uses albums + album_photos tables (owner + friends view)
// ======================================================

(function socialhubAlbumsInjectStyles() {

    const style =
        document.createElement("style");

    style.textContent = `

.albums-main {
    max-width: 900px;
    margin: 0 auto;
    padding: 18px 14px 40px;
}

.albums-head {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 4px;
}

.albums-head .albums-head-icon {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: #e7f3ff;
    color: #1877f2;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
}

.albums-main h1 {
    margin: 0;
    font-size: 22px;
}

.albums-main .albums-sub {
    margin: 0 0 16px 56px;
    color: #65676b;
    font-size: 13.5px;
}

.albums-top-row {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 14px;
}

.albums-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 14px;
}

.album-card {
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    cursor: pointer;
    transition: 0.15s;
}

.album-card:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.14);
    transform: translateY(-1px);
}

.album-cover {
    width: 100%;
    aspect-ratio: 4 / 3;
    object-fit: cover;
    display: block;
    background: linear-gradient(135deg, #1877f2, #42b0ff);
    position: relative;
}

.album-cover-empty {
    width: 100%;
    aspect-ratio: 4 / 3;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #1877f2, #42b0ff);
    color: #fff;
    font-size: 40px;
}

.album-card-body {
    padding: 10px 14px 12px;
}

.album-card-body b {
    display: block;
    font-size: 14px;
    margin-bottom: 2px;
}

.album-card-body small {
    color: #65676b;
    font-size: 12px;
}

/* Album page */
.album-page {
    max-width: 860px;
    margin: 0 auto;
    padding: 18px 14px 40px;
}

.album-hero {
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    padding: 18px 20px;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 14px;
    flex-wrap: wrap;
}

.album-hero-icon {
    width: 56px;
    height: 56px;
    border-radius: 14px;
    background: linear-gradient(135deg, #1877f2, #42b0ff);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    flex-shrink: 0;
}

.album-hero-info {
    flex: 1;
    min-width: 200px;
}

.album-hero-info h1 {
    margin: 0 0 2px;
    font-size: 19px;
}

.album-hero-info p {
    margin: 0;
    font-size: 13px;
    color: #65676b;
}

.album-hero-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.album-photos {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 10px;
}

.album-photo {
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
    border-radius: 10px;
    cursor: pointer;
    transition: 0.15s;
    background: #e4e6eb;
}

.album-photo:hover {
    transform: scale(1.02);
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.18);
}

.album-photo-wrap {
    position: relative;
}

.album-photo-del {
    position: absolute;
    top: 8px;
    right: 8px;
    border: none;
    background: rgba(0, 0, 0, 0.55);
    color: #fff;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    cursor: pointer;
    display: none;
    align-items: center;
    justify-content: center;
    z-index: 2;
}

.album-photo-wrap:hover .album-photo-del {
    display: flex;
}

.album-photo-del:hover {
    background: #e41e3f;
}

/* Lightbox */
.albums-lightbox {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.88);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    flex-direction: column;
    padding: 20px;
}

.albums-lightbox img {
    max-width: 90vw;
    max-height: 75vh;
    border-radius: 10px;
    object-fit: contain;
}

.albums-lightbox-caption {
    color: #fff;
    font-size: 14px;
    margin-top: 12px;
    max-width: 80%;
    text-align: center;
}

.albums-lightbox-count {
    color: #b0b3b8;
    font-size: 13px;
    margin-top: 4px;
}

.albums-lb-btn {
    position: fixed;
    top: 50%;
    transform: translateY(-50%);
    border: none;
    background: rgba(255, 255, 255, 0.15);
    color: #fff;
    width: 46px;
    height: 46px;
    border-radius: 50%;
    font-size: 18px;
    cursor: pointer;
    z-index: 10001;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: 0.12s;
}

.albums-lb-btn:hover {
    background: rgba(255, 255, 255, 0.3);
}

.albums-lb-prev {
    left: 16px;
}

.albums-lb-next {
    right: 16px;
}

.albums-lb-close {
    position: fixed;
    top: 16px;
    right: 16px;
    border: none;
    background: rgba(255, 255, 255, 0.15);
    color: #fff;
    width: 42px;
    height: 42px;
    border-radius: 50%;
    font-size: 17px;
    cursor: pointer;
    z-index: 10001;
    display: flex;
    align-items: center;
    justify-content: center;
}

.albums-lb-close:hover {
    background: #e41e3f;
}

body.dark-mode .album-card,
body.dark-mode .album-hero {
    background: #242526;
}

body.dark-mode .album-card-body b,
body.dark-mode .album-hero-info h1 {
    color: #e4e6eb;
}

body.dark-mode .album-card-body small,
body.dark-mode .album-hero-info p {
    color: #b0b3b8;
}
`;

    document.head.appendChild(style);
})();


// ======================================================
// HELPERS
// ======================================================

async function socialhubAlbumsGetMe() {

    const {
        data,
        error
    } = await db.auth.getUser();

    if (error || !data.user) {
        return null;
    }

    return data.user;
}


function socialhubAlbumsEscape(text) {

    const div =
        document.createElement("div");

    div.innerText =
        text || "";

    return div.innerHTML;
}


function socialhubAlbumsToast(message) {

    const toast =
        document.createElement("div");

    toast.style.cssText =
        "position:fixed;bottom:24px;left:50%;transform:translateX(-50%);" +
        "background:#1c1e21;color:#fff;padding:12px 20px;border-radius:22px;" +
        "font-size:14px;font-weight:600;z-index:100001;box-shadow:0 6px 24px rgba(0,0,0,0.3);";

    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 2400);
}


// ======================================================
// 1. ALBUM LIST (albums.html)
// ======================================================

async function socialhubAlbumsLoad() {

    const grid =
        document.getElementById("albumsGrid");

    if (!grid) {
        return;
    }

    const me =
        await socialhubAlbumsGetMe();

    if (!me) {

        location.href = "../auth/index.html";

        return;
    }

    const params =
        new URLSearchParams(window.location.search);

    if (params.get("new") === "1") {

        socialhubAlbumsOpenCreate();
    }

    const {
        data: albums,
        error
    } = await db
        .from("albums")
        .select("*")
        .eq("user_id", me.id)
        .order("created_at", { ascending: false });

    if (error) {

        console.error("Albums load error:", error);

        grid.innerHTML =
            '<p class="empty-message" style="grid-column:1/-1;">Could not load albums.</p>';

        return;
    }

    if (!albums || albums.length === 0) {

        grid.innerHTML = `
            <p class="empty-message" style="grid-column:1/-1;">
                No albums yet. Create your first album!
            </p>
        `;

        return;
    }

    // Counts + covers
    const albumIds =
        albums.map(a => a.id);

    const {
        data: photos
    } = await db
        .from("album_photos")
        .select("album_id, image_url, created_at")
        .in("album_id", albumIds)
        .order("created_at", { ascending: false });

    const photoMap = {};

    (photos || []).forEach(photo => {

        if (!photoMap[photo.album_id]) {

            photoMap[photo.album_id] = {
                count: 0,
                cover: photo.image_url
            };
        }

        photoMap[photo.album_id].count += 1;
    });

    grid.innerHTML = "";

    albums.forEach(album => {

        const info =
            photoMap[album.id] || { count: 0, cover: null };

        const card =
            document.createElement("div");

        card.className = "album-card";

        card.innerHTML = `

            ${
                info.cover
                    ? `<img class="album-cover" src="${socialhubAlbumsEscape(info.cover)}" alt="">`
                    : `<div class="album-cover-empty"><i class="fa-solid fa-images"></i></div>`
            }

            <div class="album-card-body">

                <b>${socialhubAlbumsEscape(album.name)}</b>

                <small>
                    ${info.count} photo${info.count === 1 ? "" : "s"} · ${socialhubAlbumsEscape(album.description || "No description")}
                </small>

            </div>
        `;

        card.addEventListener("click", () => {

            location.href = `../albums/album.html?id=${album.id}`;
        });

        grid.appendChild(card);
    });
}


// ======================================================
// 2. CREATE ALBUM
// ======================================================

function socialhubAlbumsOpenCreate() {

    const modal =
        document.createElement("div");

    modal.className = "socialhub-cr-modal";

    modal.style.cssText =
        "position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:10000;padding:20px;";

    modal.innerHTML = `
        <div class="socialhub-cr-box" style="background:#fff;border-radius:10px;width:100%;max-width:440px;box-shadow:0 12px 40px rgba(0,0,0,0.25);overflow:hidden;">

            <div class="cr-head" style="padding:16px 18px;border-bottom:1px solid #e4e6eb;display:flex;align-items:center;justify-content:space-between;">

                <h2 style="margin:0;font-size:18px;display:flex;align-items:center;gap:8px;">
                    <i class="fa-solid fa-images" style="color:#1877f2;"></i>
                    Create Album
                </h2>

                <button class="cr-close" type="button" title="Close" style="border:none;background:#e4e6eb;width:32px;height:32px;border-radius:50%;cursor:pointer;">
                    <i class="fa-solid fa-xmark"></i>
                </button>

            </div>

            <div class="cr-body" style="padding:16px 18px;">

                <label>Album name</label>
                <input type="text" id="albName" placeholder="e.g. Trip to Cox's Bazar" maxlength="60">

                <label>Description</label>
                <textarea id="albDesc" rows="2" placeholder="What is this album about?"></textarea>

            </div>

            <div class="cr-actions" style="padding:14px 18px;border-top:1px solid #e4e6eb;display:flex;gap:10px;justify-content:flex-end;">

                <button class="socialhub-cr-cancel" type="button">Cancel</button>

                <button class="socialhub-create-btn" type="button">
                    <i class="fa-solid fa-plus"></i>
                    Create
                </button>

            </div>

        </div>
    `;

    document.body.appendChild(modal);

    modal
        .querySelector(".cr-close")
        .addEventListener("click", () => modal.remove());

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
                modal.querySelector("#albName").value.trim();

            if (!name) {

                socialhubAlbumsToast("Album name is required.");

                return;
            }

            const me =
                await socialhubAlbumsGetMe();

            if (!me) {
                return;
            }

            const description =
                modal.querySelector("#albDesc").value.trim();

            const { data, error } =
                await db
                    .from("albums")
                    .insert({
                        user_id: me.id,
                        name,
                        description
                    })
                    .select("id")
                    .single();

            if (error) {

                alert("Could not create album: " + error.message);

                return;
            }

            modal.remove();

            socialhubAlbumsToast("✅ Album created!");

            location.href = `../albums/album.html?id=${data.id}`;
        });
}


// ======================================================
// 3. ALBUM PAGE (album.html?id=X)
// ======================================================

let socialhubAlbumState = {
    album: null,
    photos: [],
    lightboxIndex: 0
};


async function socialhubAlbumLoad() {

    const params =
        new URLSearchParams(window.location.search);

    const albumId =
        params.get("id");

    if (!albumId) {

        location.href = "../albums/index.html";

        return;
    }

    const me =
        await socialhubAlbumsGetMe();

    if (!me) {

        location.href = "../auth/index.html";

        return;
    }

    const {
        data: album,
        error
    } = await db
        .from("albums")
        .select("*")
        .eq("id", albumId)
        .single();

    if (error || !album) {

        document.querySelector(".album-page").innerHTML =
            '<p class="empty-message">Album not found.</p>';

        return;
    }

    socialhubAlbumState.album = album;

    document.title = album.name + " - Friendbook";

    const isMine =
        album.user_id === me.id;

    const hero =
        document.getElementById("albumHero");

    hero.innerHTML = `

        <div class="album-hero-icon">
            <i class="fa-solid fa-images"></i>
        </div>

        <div class="album-hero-info">

            <h1>${socialhubAlbumsEscape(album.name)}</h1>

            <p>${socialhubAlbumsEscape(album.description || "No description")}</p>

        </div>

        <div class="album-hero-actions">

            ${
                isMine
                    ? `

                        <label
                            class="socialhub-create-btn"
                            style="cursor:pointer;"
                        >
                            <i class="fa-solid fa-plus"></i>
                            Add Photos
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                style="display:none;"
                                onchange="socialhubAlbumAddPhotos(this)"
                            >
                        </label>

                        <button
                            class="socialhub-danger-btn"
                            onclick="socialhubAlbumDelete()"
                        >
                            <i class="fa-solid fa-trash-can"></i>
                            Delete Album
                        </button>
                    `
                    : ""
            }

        </div>
    `;

    await socialhubAlbumLoadPhotos();
}


async function socialhubAlbumLoadPhotos() {

    const container =
        document.getElementById("albumPhotos");

    const album =
        socialhubAlbumState.album;

    const me =
        await socialhubAlbumsGetMe();

    if (!container || !album) {
        return;
    }

    const {
        data: photos,
        error
    } = await db
        .from("album_photos")
        .select("*")
        .eq("album_id", album.id)
        .order("created_at", { ascending: false });

    if (error) {

        console.error("Album photos error:", error);

        container.innerHTML =
            '<p class="empty-message">Could not load photos.</p>';

        return;
    }

    socialhubAlbumState.photos = photos || [];

    container.innerHTML = "";

    if (socialhubAlbumState.photos.length === 0) {

        container.innerHTML =
            '<p class="empty-message" style="grid-column:1/-1;">No photos yet.</p>';

        return;
    }

    socialhubAlbumState.photos.forEach((photo, index) => {

        const wrap =
            document.createElement("div");

        wrap.className = "album-photo-wrap";

        wrap.innerHTML = `

            <img
                class="album-photo"
                src="${socialhubAlbumsEscape(photo.image_url)}"
                alt=""
                onclick="socialhubAlbumLightbox(${index})"
            >

            ${
                album.user_id === me.id
                    ? `
                        <button
                            class="album-photo-del"
                            type="button"
                            title="Delete photo"
                            onclick="socialhubAlbumDeletePhoto('${photo.id}', this)"
                        >
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    `
                    : ""
            }
        `;

        container.appendChild(wrap);
    });
}


// ======================================================
// 4. ADD / DELETE PHOTOS
// ======================================================

async function socialhubAlbumAddPhotos(input) {

    if (!input.files || input.files.length === 0) {
        return;
    }

    const me =
        await socialhubAlbumsGetMe();

    if (!me) {
        return;
    }

    const album =
        socialhubAlbumState.album;

    const files =
        [...input.files].slice(0, 20);

    socialhubAlbumsToast("Uploading " + files.length + " photo(s)...");

    let uploaded = 0;

    for (const file of files) {

        const path =
            `albums/${album.user_id}/${album.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${file.name}`;

        const { error: uploadError } =
            await db.storage
                .from("post-images")
                .upload(path, file);

        if (uploadError) {
            continue;
        }

        const { data: pub } =
            db.storage
                .from("post-images")
                .getPublicUrl(path);

        const { error: insertError } =
            await db
                .from("album_photos")
                .insert({
                    album_id: album.id,
                    image_url: pub.publicUrl
                });

        if (!insertError) {
            uploaded += 1;
        }
    }

    input.value = "";

    if (uploaded === 0) {

        socialhubAlbumsToast("Upload failed. Try again.");

        return;
    }

    socialhubAlbumsToast("✅ " + uploaded + " photo(s) added!");

    await socialhubAlbumLoadPhotos();
}


async function socialhubAlbumDeletePhoto(photoId, button) {

    if (!confirm("Delete this photo?")) {
        return;
    }

    const { error } =
        await db
            .from("album_photos")
            .delete()
            .eq("id", photoId);

    if (error) {

        alert("Could not delete: " + error.message);

        return;
    }

    const wrap =
        button.closest(".album-photo-wrap");

    if (wrap) {
        wrap.remove();
    }

    socialhubAlbumState.photos =
        socialhubAlbumState.photos.filter(p => p.id !== photoId);

    socialhubAlbumsToast("Photo deleted.");
}


async function socialhubAlbumDelete() {

    const album =
        socialhubAlbumState.album;

    if (!album) {
        return;
    }

    if (!confirm('Delete album "' + album.name + '" and all its photos?')) {
        return;
    }

    const { error } =
        await db
            .from("albums")
            .delete()
            .eq("id", album.id);

    if (error) {

        alert("Could not delete album: " + error.message);

        return;
    }

    socialhubAlbumsToast("Album deleted.");

    location.href = "../albums/index.html";
}


// ======================================================
// 5. LIGHTBOX
// ======================================================

function socialhubAlbumLightbox(index) {

    const photos =
        socialhubAlbumState.photos;

    if (!photos || photos.length === 0) {
        return;
    }

    socialhubAlbumState.lightboxIndex =
        (index + photos.length) % photos.length;

    const overlay =
        document.createElement("div");

    overlay.className = "albums-lightbox";

    const render = () => {

        const photo =
            photos[socialhubAlbumState.lightboxIndex];

        overlay.innerHTML = `

            <img src="${socialhubAlbumsEscape(photo.image_url)}" alt="">

            ${photo.caption ? `<p class="albums-lightbox-caption">${socialhubAlbumsEscape(photo.caption)}</p>` : ""}

            <p class="albums-lightbox-count">
                ${socialhubAlbumState.lightboxIndex + 1} of ${photos.length}
            </p>
        `;

        overlay.appendChild(prevBtn);

        overlay.appendChild(nextBtn);
    };

    const prevBtn =
        document.createElement("button");

    prevBtn.className = "albums-lb-btn albums-lb-prev";

    prevBtn.innerHTML =
        '<i class="fa-solid fa-chevron-left"></i>';

    prevBtn.addEventListener("click", event => {

        event.stopPropagation();

        socialhubAlbumState.lightboxIndex =
            (socialhubAlbumState.lightboxIndex - 1 + photos.length) % photos.length;

        render();
    });

    const nextBtn =
        document.createElement("button");

    nextBtn.className = "albums-lb-btn albums-lb-next";

    nextBtn.innerHTML =
        '<i class="fa-solid fa-chevron-right"></i>';

    nextBtn.addEventListener("click", event => {

        event.stopPropagation();

        socialhubAlbumState.lightboxIndex =
            (socialhubAlbumState.lightboxIndex + 1) % photos.length;

        render();
    });

    const closeBtn =
        document.createElement("button");

    closeBtn.className = "albums-lb-close";

    closeBtn.innerHTML =
        '<i class="fa-solid fa-xmark"></i>';

    closeBtn.addEventListener("click", () => overlay.remove());

    overlay.appendChild(closeBtn);

    overlay.addEventListener("click", event => {

        if (event.target === overlay) {
            overlay.remove();
        }
    });

    document.addEventListener("keydown", socialhubAlbumLightboxKey);

    function socialhubAlbumLightboxKey(event) {

        if (event.key === "Escape") {

            overlay.remove();

            document.removeEventListener("keydown", socialhubAlbumLightboxKey);
        }

        if (event.key === "ArrowLeft") {

            socialhubAlbumState.lightboxIndex =
                (socialhubAlbumState.lightboxIndex - 1 + photos.length) % photos.length;

            render();
        }

        if (event.key === "ArrowRight") {

            socialhubAlbumState.lightboxIndex =
                (socialhubAlbumState.lightboxIndex + 1) % photos.length;

            render();
        }
    }

    render();

    document.body.appendChild(overlay);
}


// ======================================================
// 6. INIT
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

    const currentPage =
        socialhubPageId() || "home/index.html";

    if (currentPage === "albums/album.html") {

        socialhubAlbumLoad();

    } else {

        socialhubAlbumsLoad();
    }
});