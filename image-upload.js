// ======================================================
// SOCIALHUB - IMAGE UPLOAD (STEP 12)
// ======================================================
// This is a NEW file. Old code is untouched.
//
// What it does:
//   1. Profile page: camera button on the profile
//      photo -> uploads to the "avatars" bucket and
//      saves the public URL in profiles.avatar_url.
//   2. Home page: the "📷 Photo" button opens a file
//      picker, shows a preview, and when the user
//      clicks Post the image is uploaded to the
//      "post-images" bucket and saved in posts.image_url.
//   3. Every post that has an image_url gets its
//      photo shown in the feed automatically.
//
// Setup:
//   - Run the SQL below once in the Supabase SQL Editor:
//
//     insert into storage.buckets (id, name, public)
//     values ('avatars', 'avatars', true),
//            ('post-images', 'post-images', true)
//     on conflict (id) do nothing;
//
//     alter table public.posts
//       add column if not exists image_url text;
//
//     create policy "avatars_public_read"
//       on storage.objects for select
//       using (bucket_id = 'avatars');
//
//     create policy "avatars_insert"
//       on storage.objects for insert
//       with check (bucket_id = 'avatars' and auth.uid() = owner);
//
//     create policy "avatars_update"
//       on storage.objects for update
//       using (bucket_id = 'avatars' and auth.uid() = owner);
//
//     create policy "avatars_delete"
//       on storage.objects for delete
//       using (bucket_id = 'avatars' and auth.uid() = owner);
//
//     create policy "post_images_public_read"
//       on storage.objects for select
//       using (bucket_id = 'post-images');
//
//     create policy "post_images_insert"
//       on storage.objects for insert
//       with check (bucket_id = 'post-images' and auth.uid() = owner);
//
//     create policy "post_images_update"
//       on storage.objects for update
//       using (bucket_id = 'post-images' and auth.uid() = owner);
//
//     create policy "post_images_delete"
//       on storage.objects for delete
//       using (bucket_id = 'post-images' and auth.uid() = owner);
//
//   - Add this script in index.html AND profile.html
//     AFTER likes-comments.js (or after script.js):
//
//     <script src="image-upload.js"></script>
// ======================================================

var db = window.db || supabaseClient;

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB


// ======================================================
// 1. HELPERS
// ======================================================

function socialhubEscape(text) {

    const div =
        document.createElement("div");

    div.innerText =
        text || "";

    return div.innerHTML;
}


async function socialhubGetMe() {

    const {
        data,
        error
    } = await db.auth.getUser();

    if (error || !data.user) {

        return null;
    }

    return data.user;
}


function socialhubFileExtension(file) {

    const name =
        file.name || "image.png";

    const parts =
        name.split(".");

    const ext =
        parts.length > 1
            ? parts.pop().toLowerCase()
            : "png";

    return ext;
}


function socialhubValidateImage(file) {

    if (!file.type.startsWith("image/")) {

        alert("Please choose an image file.");

        return false;
    }

    if (file.size > MAX_IMAGE_SIZE) {

        alert(
            "Image is too big. Maximum size is 5MB."
        );

        return false;
    }

    return true;
}


// ======================================================
// 2. PROFILE PHOTO UPLOAD (PROFILE PAGE)
// ======================================================

let avatarFileInput = null;


function socialhubClosePhotoMenus() {

    document
        .querySelectorAll(".socialhub-photo-menu")
        .forEach(menu => menu.remove());
}


document.addEventListener("click", (event) => {

    if (
        !event.target.closest(".socialhub-photo-trigger") &&
        !event.target.closest(".socialhub-photo-menu")
    ) {

        socialhubClosePhotoMenus();
    }
});


function socialhubPhotoMenuItem(icon, label, subtext, action) {

    const item =
        document.createElement("div");

    item.className = "socialhub-menu-item";

    const iconEl =
        document.createElement("span");

    iconEl.className = "socialhub-menu-icon";

    iconEl.textContent = icon;

    const textEl =
        document.createElement("span");

    textEl.className = "socialhub-menu-text";

    const title =
        document.createElement("strong");

    title.textContent = label;

    textEl.appendChild(title);

    if (subtext) {

        const detail =
            document.createElement("small");

        detail.textContent = subtext;

        textEl.appendChild(detail);
    }

    item.appendChild(iconEl);

    item.appendChild(textEl);

    item.addEventListener("click", (event) => {

        event.stopPropagation();

        socialhubClosePhotoMenus();

        action();
    });

    return item;
}


function setupProfilePhotoUpload() {

    const photo =
        document.querySelector(
            ".fb-avatar-wrap .profile-photo"
        ) ||
        document.querySelector(
            ".profile-photo"
        );

    if (!photo) {
        return;
    }

    photo.style.position = "relative";

    photo
        .querySelectorAll(
            ".socialhub-avatar-overlay, .socialhub-photo-menu"
        )
        .forEach(el => el.remove());

    // Camera button (Facebook style: bottom-right circle)
    const button =
        document.createElement("button");

    button.type = "button";

    button.className =
        "socialhub-avatar-overlay socialhub-photo-trigger";

    button.textContent = "📷";

    button.setAttribute(
        "aria-label",
        "Update profile picture"
    );

    button.addEventListener("click", (event) => {

        event.stopPropagation();

        socialhubClosePhotoMenus();

        const menu =
            document.createElement("div");

        menu.className =
            "socialhub-photo-menu socialhub-avatar-menu";

        menu.appendChild(
            socialhubPhotoMenuItem(
                "📷",
                "Update profile picture",
                "Upload a photo from your device",
                () => {

                    if (!avatarFileInput) {
                        return;
                    }

                    avatarFileInput.click();
                }
            )
        );

        if (photo.querySelector("img")) {

            menu.appendChild(
                socialhubPhotoMenuItem(
                    "🗑️",
                    "Remove picture",
                    "Remove your profile picture",
                    handleAvatarRemove
                )
            );
        }

        button.after(menu);
    });

    photo.appendChild(button);

    // Hidden file input (created only once)
    if (!avatarFileInput) {

        avatarFileInput =
            document.createElement("input");

        avatarFileInput.type = "file";
        avatarFileInput.accept = "image/*";
        avatarFileInput.style.display = "none";

        document.body.appendChild(
            avatarFileInput
        );

        avatarFileInput.addEventListener(
            "change",
            handleAvatarUpload
        );
    }
}


async function handleAvatarUpload() {

    let file =
        avatarFileInput.files[0];

    if (!file) {
        return;
    }

    if (!socialhubValidateImage(file)) {
        return;
    }

    // Convert iPhone HEIC photos so they display everywhere
    const converted =
        await socialhubHeicToJpeg(file);

    if (!converted) {
        return;
    }

    file = converted;

    // Facebook style: crop / reposition first
    openAvatarCropModal(file);
}


// ======================================================
// 2b. FB-STYLE AVATAR CROP MODAL
// ======================================================

let pendingAvatarFile = null;

let avatarCropImage = null;

let avatarCropState = { dx: 0, dy: 0, zoom: 1 };


function openAvatarCropModal(file) {

    pendingAvatarFile = file;

    avatarCropState = { dx: 0, dy: 0, zoom: 1 };

    const overlay =
        document.createElement("div");

    overlay.className = "socialhub-crop-overlay";

    overlay.innerHTML = `
        <div class="socialhub-crop-dialog">
            <div class="socialhub-crop-head">
                <strong>Update profile picture</strong>
                <button type="button" class="socialhub-crop-close">✕</button>
            </div>
            <div class="socialhub-crop-body">
                <div class="socialhub-crop-preview">
                    <img alt="Preview" draggable="false">
                </div>
                <div class="socialhub-crop-side">
                    <label>Zoom</label>
                    <input type="range" min="1" max="4" step="0.01" value="1">
                    <p>Drag the photo to position it</p>
                </div>
            </div>
            <div class="socialhub-crop-foot">
                <button type="button" class="socialhub-crop-cancel">Cancel</button>
                <button type="button" class="socialhub-crop-save">Use this photo</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    document.body.style.overflow = "hidden";

    const img =
        overlay.querySelector("img");

    img.src = URL.createObjectURL(file);

    const preview =
        overlay.querySelector(
            ".socialhub-crop-preview"
        );

    const slider =
        overlay.querySelector(
            "input[type=range]"
        );

    avatarCropImage = img;

    let previewSize = 320;

    img.onload = () => {

        previewSize = preview.clientWidth || 320;

        socialhubApplyAvatarCrop();
    };

    slider.addEventListener("input", () => {

        avatarCropState.zoom =
            parseFloat(slider.value);

        socialhubApplyAvatarCrop();
    });

    let dragging = false;

    let startX = 0;

    let startY = 0;

    preview.addEventListener("pointerdown", (event) => {

        dragging = true;

        startX =
            event.clientX - avatarCropState.dx;

        startY =
            event.clientY - avatarCropState.dy;

        preview.setPointerCapture(
            event.pointerId
        );

        preview.style.cursor = "grabbing";
    });

    preview.addEventListener("pointermove", (event) => {

        if (!dragging) {
            return;
        }

        avatarCropState.dx =
            event.clientX - startX;

        avatarCropState.dy =
            event.clientY - startY;

        socialhubApplyAvatarCrop();
    });

    preview.addEventListener("pointerup", () => {

        dragging = false;

        preview.style.cursor = "grab";
    });

    preview.addEventListener("pointercancel", () => {

        dragging = false;

        preview.style.cursor = "grab";
    });

    overlay
        .querySelector(".socialhub-crop-close")
        .addEventListener("click", () => {

            closeAvatarCropModal(overlay);
        });

    overlay
        .querySelector(".socialhub-crop-cancel")
        .addEventListener("click", () => {

            closeAvatarCropModal(overlay);
        });

    overlay
        .querySelector(".socialhub-crop-save")
        .addEventListener("click", async () => {

            const button =
                overlay.querySelector(
                    ".socialhub-crop-save"
                );

            button.disabled = true;

            button.textContent = "Uploading…";

            try {

                const blob =
                    await socialhubCropAvatarToBlob(
                        previewSize
                    );

                await socialhubUploadAvatarBlob(blob);

                closeAvatarCropModal(overlay);

            } catch (error) {

                console.error(
                    "❌ Avatar crop error:",
                    error
                );

                alert(
                    "Could not upload photo.\n\n" +
                    error.message
                );

                button.disabled = false;

                button.textContent = "Use this photo";
            }
        });

    overlay.addEventListener("click", (event) => {

        if (event.target === overlay) {

            closeAvatarCropModal(overlay);
        }
    });
}


function socialhubApplyAvatarCrop() {

    const img =
        avatarCropImage;

    const preview =
        img?.parentElement;

    if (!img || !img.naturalWidth) {
        return;
    }

    const size =
        preview.clientWidth || 320;

    const nw = img.naturalWidth;
    const nh = img.naturalHeight;

    const z =
        avatarCropState.zoom;

    const scale =
        (size / Math.min(nw, nh)) * z;

    const w = nw * scale;
    const h = nh * scale;

    const maxX =
        Math.max(0, (w - size) / 2);

    const maxY =
        Math.max(0, (h - size) / 2);

    avatarCropState.dx =
        Math.max(
            -maxX,
            Math.min(maxX, avatarCropState.dx)
        );

    avatarCropState.dy =
        Math.max(
            -maxY,
            Math.min(maxY, avatarCropState.dy)
        );

    img.style.width = `${w}px`;

    img.style.height = `${h}px`;

    img.style.marginLeft = `${-w / 2}px`;

    img.style.marginTop = `${-h / 2}px`;

    img.style.transform =
        `translate(${avatarCropState.dx}px, ${avatarCropState.dy}px)`;
}


function socialhubCropAvatarToBlob(previewSize) {

    const img =
        avatarCropImage;

    const nw = img.naturalWidth;
    const nh = img.naturalHeight;

    const size = previewSize || 320;

    const z =
        avatarCropState.zoom;

    const scale =
        (size / Math.min(nw, nh)) * z;

    const visW = size / scale;
    const visH = size / scale;

    const sx =
        nw / 2 + avatarCropState.dx / scale - visW / 2;

    const sy =
        nh / 2 + avatarCropState.dy / scale - visH / 2;

    const canvas =
        document.createElement("canvas");

    canvas.width = 600;

    canvas.height = 600;

    const ctx =
        canvas.getContext("2d");

    ctx.drawImage(
        img,
        sx, sy, visW, visH,
        0, 0, 600, 600
    );

    return new Promise(resolve => {

        canvas.toBlob(
            blob => resolve(blob),
            "image/jpeg",
            0.92
        );
    });
}


function closeAvatarCropModal(overlay) {

    overlay.remove();

    document.body.style.overflow = "";

    if (
        avatarCropImage &&
        avatarCropImage.src.startsWith("blob:")
    ) {

        URL.revokeObjectURL(
            avatarCropImage.src
        );
    }

    avatarCropImage = null;

    pendingAvatarFile = null;

    if (avatarFileInput) {
        avatarFileInput.value = "";
    }
}


async function socialhubUploadAvatarBlob(blob) {

    const me =
        await socialhubGetMe();

    if (!me) {

        alert("Please login first.");

        return;
    }

    try {

        const file =
            pendingAvatarFile;

        const ext =
            file
                ? socialhubFileExtension(file)
                : "jpg";

        const path =
            `${me.id}-${Date.now()}.${ext}`;

        const {
            error: uploadError
        } = await db
            .storage
            .from("avatars")
            .upload(path, blob, {
                upsert: true,
                contentType: "image/jpeg"
            });

        if (uploadError) {
            throw uploadError;
        }

        const {
            data: urlData
        } = db
            .storage
            .from("avatars")
            .getPublicUrl(path);

        const {
            error: updateError
        } = await db
            .from("profiles")
            .update({
                avatar_url: urlData.publicUrl
            })
            .eq("id", me.id);

        if (updateError) {
            throw updateError;
        }

        alert("Profile photo updated! 🎉");

        if (
            typeof showCurrentUserData ===
            "function"
        ) {

            await showCurrentUserData();
        }

        setupProfilePhotoUpload();

    } catch (error) {

        throw error;
    }
}


async function handleAvatarRemove() {

    const me =
        await socialhubGetMe();

    if (!me) {

        alert("Please login first.");

        return;
    }

    try {

        const {
            error
        } = await db
            .from("profiles")
            .update({
                avatar_url: null
            })
            .eq("id", me.id);

        if (error) {
            throw error;
        }

        if (
            typeof showCurrentUserData ===
            "function"
        ) {

            await showCurrentUserData();
        }

        setupProfilePhotoUpload();

    } catch (error) {

        console.error(
            "❌ Avatar remove error:",
            error
        );

        alert(
            "Could not remove photo.\n\n" +
            error.message
        );
    }
}


// ======================================================
// 3. POST IMAGE UPLOAD (HOME PAGE)
// ======================================================

let postFileInput = null;

let pendingPostImage = null;

let videoFileInput = null;

let pendingPostVideo = null;


function setupPostImageUpload() {

    const photoButton =
        document.querySelector(
            ".create-post-actions button:first-child"
        );

    const composer =
        document.querySelector(".create-post");

    if (!photoButton || !composer) {
        return;
    }

    if (photoButton.dataset.socialhubReady) {
        return;
    }

    photoButton.dataset.socialhubReady = "1";

    // Hidden file input
    postFileInput =
        document.createElement("input");

    postFileInput.type = "file";
    postFileInput.accept = "image/*";
    postFileInput.style.display = "none";

    document.body.appendChild(
        postFileInput
    );

    // Photo button opens the file picker
    photoButton.addEventListener(
        "click",
        event => {

            event.preventDefault();

            postFileInput.click();
        }
    );

    // On file selected -> show preview
    postFileInput.addEventListener(
        "change",
        async () => {

            let file =
                postFileInput.files[0];

            if (!file) {
                return;
            }

            if (!socialhubValidateImage(file)) {
                return;
            }

            // Convert iPhone HEIC photos so they display everywhere
            const converted =
                await socialhubHeicToJpeg(file);

            if (!converted) {
                return;
            }

            file = converted;

            // Remove pending video preview
            document
                .querySelectorAll(".socialhub-post-video-preview")
                .forEach(element => element.remove());

            if (videoFileInput) {
                videoFileInput.value = "";
            }

            pendingPostVideo = null;

            pendingPostImage = { file };

            socialhubShowPostImagePreview(file);
        }
    );

    // ---------- VIDEO BUTTON ----------

    const videoButton =
        document.querySelector(
            ".create-post-actions button:nth-child(2)"
        );

    if (!videoButton) {
        return;
    }

    videoButton.addEventListener(
        "click",
        event => {

            event.preventDefault();

            videoFileInput.click();
        }
    );

    videoFileInput =
        document.createElement("input");

    videoFileInput.type = "file";
    videoFileInput.accept = "video/*";
    videoFileInput.style.display = "none";

    document.body.appendChild(
        videoFileInput
    );

    videoFileInput.addEventListener(
        "change",
        () => {

            const file =
                videoFileInput.files[0];

            if (!file) {
                return;
            }

            if (!socialhubValidateVideo(file)) {
                return;
            }

            // Remove pending photo preview
            document
                .querySelectorAll(".socialhub-post-preview")
                .forEach(element => element.remove());

            if (postFileInput) {
                postFileInput.value = "";
            }

            pendingPostImage = null;

            pendingPostVideo = { file };

            socialhubShowPostVideoPreview(file);
        }
    );
}


function socialhubValidateVideo(file) {

    if (
        !file.type.startsWith("video/")
    ) {

        alert("Please choose a video file.");

        return false;
    }

    if (file.size > 100 * 1024 * 1024) {

        alert(
            "Video is too big. Maximum size is 100MB."
        );

        return false;
    }

    return true;
}


function socialhubShowPostVideoPreview(file) {

    const composer =
        document.querySelector(".create-post");

    if (!composer) {
        return;
    }

    document
        .querySelectorAll(".socialhub-post-video-preview")
        .forEach(element => element.remove());

    const wrap =
        document.createElement("div");

    wrap.className = "socialhub-post-video-preview";

    wrap.style.cssText = `
        display:flex;
        align-items:center;
        gap:10px;
        margin:12px 0;
        padding:8px;
        border-radius:12px;
        background:rgba(128,128,128,0.08);
    `;

    const video =
        document.createElement("video");

    video.src =
        URL.createObjectURL(file);

    video.muted = true;

    video.controls = true;

    video.style.cssText = `
        width:120px;
        height:72px;
        object-fit:cover;
        border-radius:10px;
        background:#000;
    `;

    const removeButton =
        document.createElement("button");

    removeButton.type = "button";

    removeButton.textContent = "×";

    removeButton.title = "Remove video";

    removeButton.style.cssText = `
        width:30px;
        height:30px;
        border:none;
        border-radius:50%;
        background:#ff4d4f;
        color:#fff;
        font-size:16px;
        cursor:pointer;
        margin-left:auto;
        flex-shrink:0;
    `;

    removeButton.addEventListener(
        "click",
        () => {

            pendingPostVideo = null;

            wrap.remove();

            if (videoFileInput) {

                videoFileInput.value = "";
            }
        }
    );

    wrap.appendChild(video);
    wrap.appendChild(removeButton);

    const top =
        composer.querySelector(".create-post-top");

    if (top) {

        top.insertAdjacentElement(
            "afterend",
            wrap
        );
    }
}


function socialhubShowPostImagePreview(file) {

    const composer =
        document.querySelector(".create-post");

    if (!composer) {
        return;
    }

    // Remove old preview
    document
        .querySelectorAll(".socialhub-post-preview")
        .forEach(element => element.remove());

    const wrap =
        document.createElement("div");

    wrap.className = "socialhub-post-preview";

    wrap.style.cssText = `
        display:flex;
        align-items:center;
        gap:10px;
        margin:12px 0;
        padding:8px;
        border-radius:12px;
        background:rgba(128,128,128,0.08);
    `;

    const image =
        document.createElement("img");

    image.src =
        URL.createObjectURL(file);

    image.alt = "Post photo preview";

    image.style.cssText = `
        width:72px;
        height:72px;
        object-fit:cover;
        border-radius:10px;
    `;

    const removeButton =
        document.createElement("button");

    removeButton.type = "button";

    removeButton.textContent = "×";

    removeButton.title = "Remove photo";

    removeButton.style.cssText = `
        width:30px;
        height:30px;
        border:none;
        border-radius:50%;
        background:#ff4d4f;
        color:#fff;
        font-size:16px;
        cursor:pointer;
        margin-left:auto;
        flex-shrink:0;
    `;

    removeButton.addEventListener(
        "click",
        () => {

            pendingPostImage = null;

            wrap.remove();

            if (postFileInput) {

                postFileInput.value = "";
            }
        }
    );

    wrap.appendChild(image);
    wrap.appendChild(removeButton);

    const top =
        composer.querySelector(".create-post-top");

    if (top) {

        top.insertAdjacentElement(
            "afterend",
            wrap
        );
    }
}


// ======================================================
// 4. POST WITH VIDEO (HOME PAGE)
// ======================================================

async function socialhubHandleVideoPost(event) {

    const input =
        document.getElementById("postInput");

    const me =
        await socialhubGetMe();

    if (!me) {

        alert("Please login first.");

        return;
    }

    const file =
        pendingPostVideo.file;

    const ext =
        socialhubFileExtension(file);

    const path =
        `${me.id}-${Date.now()}.${ext}`;

    try {

        // Upload the video
        const {
            error: uploadError
        } = await db
            .storage
            .from("videos")
            .upload(path, file, {
                upsert: true,
                contentType: file.type
            });

        if (uploadError) {
            throw uploadError;
        }

        const {
            data: urlData
        } = db
            .storage
            .from("videos")
            .getPublicUrl(path);

        const content =
            input ? input.value.trim() : "";

        // Save the post with the video
        const background =
            input &&
            input.dataset.background &&
            input.dataset.background !== "none"
                ? input.dataset.background
                : null;

        const {
            data,
            error
        } = await db
            .from("posts")
            .insert({
                user_id: me.id,
                content: content,
                background: background,
                video_url: urlData.publicUrl,
                audience:
                    window.socialhubAudience ||
                    "public"
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        console.log(
            "✅ Post with video saved:",
            data
        );

        // Reset composer
        pendingPostVideo = null;

        document
            .querySelectorAll(".socialhub-post-video-preview")
            .forEach(element => element.remove());

        if (videoFileInput) {

            videoFileInput.value = "";
        }

        if (input) {

            input.value = "";

            input.style.background = "";
            input.style.color = "";

            input.dataset.background = "none";
        }

        alert("Post created with video! 🎉");

        if (
            typeof loadPostsWithUserNames ===
            "function"
        ) {

            await loadPostsWithUserNames();
        }

    } catch (error) {

        console.error(
            "❌ Post video error:",
            error
        );

        alert(
            "Could not create post.\n\n" +
            error.message
        );
    }
}


// ======================================================
// 5. OVERRIDE POST BUTTON (WITH IMAGE SUPPORT)
// ======================================================

function overridePostButton() {

    const postButton =
        document.querySelector(
            ".create-post .post-btn"
        );

    if (!postButton) {
        return;
    }

    if (postButton.dataset.socialhubOverride) {
        return;
    }

    postButton.dataset.socialhubOverride = "1";

    // Clone the button to remove ALL old listeners
    const cleanButton =
        postButton.cloneNode(true);

    cleanButton.removeAttribute("onclick");

    postButton.parentNode.replaceChild(
        cleanButton,
        postButton
    );

    cleanButton.addEventListener(
        "click",
        socialhubHandlePost
    );
}


async function socialhubHandlePost(event) {

    event.preventDefault();

    // Video selected -> video flow
    if (pendingPostVideo) {

        await socialhubHandleVideoPost(event);

        return;
    }

    // No image selected -> use the old behavior
    if (!pendingPostImage) {

        if (
            typeof createPremiumPostInSupabase ===
            "function"
        ) {

            await createPremiumPostInSupabase(event);
        }

        return;
    }

    const input =
        document.getElementById("postInput");

    if (!input) {
        return;
    }

    const content =
        input.value.trim();

    if (content === "") {

        alert("Please write something first!");

        return;
    }

    const me =
        await socialhubGetMe();

    if (!me) {

        alert("Please login first.");

        return;
    }

    try {

        const file =
            pendingPostImage.file;

        const ext =
            socialhubFileExtension(file);

        const path =
            `${me.id}-${Date.now()}.${ext}`;

        // Upload the image
        const {
            error: uploadError
        } = await db
            .storage
            .from("post-images")
            .upload(path, file, {
                upsert: true,
                contentType: file.type
            });

        if (uploadError) {
            throw uploadError;
        }

        const {
            data: urlData
        } = db
            .storage
            .from("post-images")
            .getPublicUrl(path);

        // Save the post with the image
        const background =
            input.dataset.background &&
            input.dataset.background !== "none"
                ? input.dataset.background
                : null;

        const {
            data,
            error
        } = await db
            .from("posts")
            .insert({
                user_id: me.id,
                content: content,
                background: background,
                image_url: urlData.publicUrl,
                audience:
                    window.socialhubAudience ||
                    "public"
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        console.log(
            "✅ Post with image saved:",
            data
        );

        // Reset composer
        pendingPostImage = null;

        document
            .querySelectorAll(".socialhub-post-preview")
            .forEach(element => element.remove());

        if (postFileInput) {

            postFileInput.value = "";
        }

        input.value = "";

        input.style.background = "";
        input.style.color = "";

        input.dataset.background = "none";

        const picker =
            document.querySelector(
                ".post-background-picker"
            );

        if (picker) {

            picker.classList.remove("active");

            picker
                .querySelectorAll(".post-bg-option")
                .forEach(option => {

                    option.classList.remove("selected");
                });

            const firstOption =
                picker.querySelector(".post-bg-option");

            if (firstOption) {

                firstOption.classList.add("selected");
            }
        }

        alert("Post created with photo! 🎉");

        // Reload the feed (the image is added
        // automatically by the observer)
        if (
            typeof loadPostsWithUserNames ===
            "function"
        ) {

            await loadPostsWithUserNames();
        }

    } catch (error) {

        console.error(
            "❌ Post image error:",
            error
        );

        alert(
            "Could not create post.\n\n" +
            error.message
        );
    }
}


// ======================================================
// 5. SHOW POST IMAGES IN THE FEED
// ======================================================

let socialhubImageSyncRunning = false;

let socialhubImageSyncQueued = false;


async function socialhubRenderPostImages() {

    if (socialhubImageSyncRunning) {

        socialhubImageSyncQueued = true;

        return;
    }

    socialhubImageSyncRunning = true;

    try {

        await socialhubRenderPostImagesCore();

    } finally {

        socialhubImageSyncRunning = false;

        if (socialhubImageSyncQueued) {

            socialhubImageSyncQueued = false;

            setTimeout(
                socialhubRenderPostImages,
                80
            );
        }
    }
}


async function socialhubRenderPostImagesCore() {

    const container =
        document.getElementById("posts");

    if (!container) {
        return;
    }

    const articles =
        container.querySelectorAll(".post");

    if (articles.length === 0) {
        return;
    }

    const {
        data: posts,
        error
    } = await db
        .from("posts")
        .select("id, image_url, video_url")
        .order("created_at", {
            ascending: false
        })
        .limit(500);

    if (error || !posts) {
        return;
    }

    const postsById =
        new Map();

    posts.forEach(post => {

        postsById.set(post.id, post);
    });

    articles.forEach(article => {

        const postId =
            article.dataset.postId;

        if (!postId) {
            return;
        }

        const post =
            postsById.get(postId);

        if (!post) {
            return;
        }

        if (post.image_url) {

            socialhubInjectPostImage(
                article,
                post.image_url
            );
        }

        if (post.video_url) {

            socialhubInjectPostVideo(
                article,
                post.video_url
            );
        }
    });
}


function socialhubInjectPostImage(article, imageUrl) {

    // Already rendered?
    if (
        article.querySelector(
            ".socialhub-post-image"
        )
    ) {
        return;
    }

    const stats =
        article.querySelector(".post-stats");

    if (!stats) {
        return;
    }

    const wrap =
        document.createElement("div");

    wrap.className = "socialhub-post-image";

    wrap.style.cssText = `
        margin-bottom:14px;
        border-radius:12px;
        overflow:hidden;
    `;

    wrap.innerHTML = `

        <img
            src="${socialhubEscape(imageUrl)}"
            alt="Post photo"
            loading="lazy"
            style="
                width:100%;
                max-height:480px;
                object-fit:cover;
                display:block;
            "
        >
    `;

    stats.parentNode.insertBefore(
        wrap,
        stats
    );
}


function socialhubInjectPostVideo(article, videoUrl) {

    // Already rendered?
    if (
        article.querySelector(
            ".socialhub-post-video"
        )
    ) {
        return;
    }

    const stats =
        article.querySelector(".post-stats");

    if (!stats) {
        return;
    }

    const wrap =
        document.createElement("div");

    wrap.className = "socialhub-post-video";

    wrap.style.cssText = `
        margin-bottom:14px;
        border-radius:12px;
        overflow:hidden;
    `;

    wrap.innerHTML = `

        <video
            src="${socialhubEscape(videoUrl)}"
            controls
            playsinline
            preload="metadata"
            style="
                width:100%;
                max-height:480px;
                display:block;
                background:#000;
            "
        ></video>
    `;

    stats.parentNode.insertBefore(
        wrap,
        stats
    );
}


// ======================================================
// 5b. COVER PHOTO UPLOAD (PROFILE PAGE)
// ======================================================

let coverFileInput = null;


function setupProfileCoverUpload() {

    const cover =
        document.querySelector(
            ".fb-header .cover-photo"
        ) ||
        document.querySelector(
            ".cover-photo"
        );

    if (!cover) {
        return;
    }

    cover.style.position = "relative";

    cover
        .querySelectorAll(
            ".socialhub-cover-overlay, .socialhub-photo-menu"
        )
        .forEach(el => el.remove());

    // Edit cover photo button (Facebook style: top-right)
    const button =
        document.createElement("button");

    button.type = "button";

    button.className =
        "socialhub-cover-overlay socialhub-photo-trigger";

    button.textContent = "📷 Edit cover photo";

    button.addEventListener("click", (event) => {

        event.stopPropagation();

        socialhubClosePhotoMenus();

        const menu =
            document.createElement("div");

        menu.className =
            "socialhub-photo-menu socialhub-cover-menu";

        menu.appendChild(
            socialhubPhotoMenuItem(
                "📷",
                "Upload photo",
                "Choose a photo from your device",
                () => {

                    if (!coverFileInput) {
                        return;
                    }

                    coverFileInput.click();
                }
            )
        );

        if (
            cover.style.backgroundImage &&
            cover.style.backgroundImage !== "none"
        ) {

            menu.appendChild(
                socialhubPhotoMenuItem(
                    "🗑️",
                    "Remove photo",
                    "Remove your cover photo",
                    handleCoverRemove
                )
            );
        }

        button.after(menu);
    });

    cover.appendChild(button);

    // Hidden file input (created only once)
    if (!coverFileInput) {

        coverFileInput =
            document.createElement("input");

        coverFileInput.type = "file";
        coverFileInput.accept = "image/*";
        coverFileInput.style.display = "none";

        document.body.appendChild(
            coverFileInput
        );

        coverFileInput.addEventListener(
            "change",
            handleCoverUpload
        );
    }
}


async function handleCoverUpload() {

    const file =
        coverFileInput.files[0];

    if (!file) {
        return;
    }

    if (!socialhubValidateImage(file)) {
        return;
    }

    const me =
        await socialhubGetMe();

    if (!me) {

        alert("Please login first.");

        return;
    }

    try {

        const ext =
            socialhubFileExtension(file);

        const path =
            `cover-${me.id}-${Date.now()}.${ext}`;

        // Upload to avatars bucket
        const {
            error: uploadError
        } = await db
            .storage
            .from("avatars")
            .upload(path, file, {
                upsert: true,
                contentType: file.type
            });

        if (uploadError) {
            throw uploadError;
        }

        const {
            data: urlData
        } = db
            .storage
            .from("avatars")
            .getPublicUrl(path);

        // Save URL in the profile
        const {
            error: updateError
        } = await db
            .from("profiles")
            .update({
                cover_url: urlData.publicUrl
            })
            .eq("id", me.id);

        if (updateError) {
            throw updateError;
        }

        alert("Cover photo updated! 🎉");

        // Refresh the cover display
        if (
            typeof showCurrentUserData ===
            "function"
        ) {

            await showCurrentUserData();
        }

        // Re-add the camera overlay
        setupProfileCoverUpload();

    } catch (error) {

        console.error(
            "❌ Cover upload error:",
            error
        );

        alert(
            "Could not upload cover photo.\n\n" +
            error.message
        );
    }
}


async function handleCoverRemove() {

    const me =
        await socialhubGetMe();

    if (!me) {

        alert("Please login first.");

        return;
    }

    try {

        const {
            error
        } = await db
            .from("profiles")
            .update({
                cover_url: null
            })
            .eq("id", me.id);

        if (error) {
            throw error;
        }

        if (
            typeof showCurrentUserData ===
            "function"
        ) {

            await showCurrentUserData();
        }

        setupProfileCoverUpload();

    } catch (error) {

        console.error(
            "❌ Cover remove error:",
            error
        );

        alert(
            "Could not remove cover photo.\n\n" +
            error.message
        );
    }
}


// ======================================================
// 6. AUTO-SYNC
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

    // Profile page: avatar upload
    if (
        document.querySelector(".profile-photo")
    ) {

        setupProfilePhotoUpload();
    }

    // Profile page: cover upload
    if (
        document.querySelector(".cover-photo")
    ) {

        setupProfileCoverUpload();
    }

    // Home page: post image upload + post button
    if (
        document.querySelector(".create-post")
    ) {

        setupPostImageUpload();

        overridePostButton();
    }

    // Watch the feed for new posts
    const container =
        document.getElementById("posts");

    if (container) {

        const observer =
            new MutationObserver(() => {

                socialhubRenderPostImages();
            });

        observer.observe(container, {
            childList: true,
            subtree: false
        });

        setTimeout(
            socialhubRenderPostImages,
            2600
        );
    }

    console.log(
        "✅ Image Upload activated!"
    );
});
