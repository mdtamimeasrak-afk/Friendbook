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
// SOCIALHUB - MAIN JAVASCRIPT
// ======================================================


// ======================================================
// 1. LOGIN PROTECTION
// ======================================================

async function checkLoginProtection() {

    const protectedPages = [
        "home/index.html",
        "profile/index.html",
        "messages/index.html",
        "search/index.html",
        "profile/user-profile.html",
        "settings/index.html",
        "reels/index.html"
    ];

    const currentPage =
        socialhubPageId() || "home/index.html";


    const { data, error } =
        await supabaseClient.auth.getSession();


    if (
        protectedPages.includes(currentPage) &&
        (error || !data.session)
    ) {

        window.location.href = "../auth/index.html";

        return;
    }
}


// Run protection
checkLoginProtection();



// ======================================================
// 2. GET CURRENT USER + PROFILE
// ======================================================

async function getCurrentProfile() {

    const {
        data,
        error
    } = await supabaseClient.auth.getUser();


    if (error || !data.user) {

        return null;
    }


    const user = data.user;


    const {
        data: profile,
        error: profileError
    } = await supabaseClient
        .from("profiles")
        .select(`
            id,
            username,
            full_name,
            bio,
            avatar_url,
            cover_url,
            extra,
            location,
            work,
            education,
            website,
            birthday
        `)
        .eq("id", user.id)
        .single();


    if (profileError) {

        console.log(
            "Profile error:",
            profileError.message
        );

        return {
            user: user,
            profile: null
        };
    }


    return {
        user: user,
        profile: profile
    };
}



// ======================================================
// 3. SHOW CURRENT USER DATA
// ======================================================

async function showCurrentUserData() {

    // Never write MY data onto another user's profile page
    // (upName/upUsername/upBio/upPhoto/cover all match the
    //  generic selectors below and would overwrite them)
    if (
        socialhubPageId() === "profile/user-profile.html"
    ) {
        return;
    }

    const result =
        await getCurrentProfile();


    if (!result) {

        return;
    }


    const user =
        result.user;


    const profile =
        result.profile;


    if (!profile) {

        return;
    }


    // ------------------------------------------
    // USER NAME
    // ------------------------------------------

    document
        .querySelectorAll(".user-name")
        .forEach(element => {

            element.innerText =
                profile.full_name || "User";

        });


    // ------------------------------------------
    // PROFILE NAME
    // ------------------------------------------

    document
        .querySelectorAll(".profile-name")
        .forEach(element => {

            element.innerText =
                profile.full_name || "User";

        });


    // ------------------------------------------
    // USERNAME
    // ------------------------------------------

    document
        .querySelectorAll(".profile-username")
        .forEach(element => {

            element.innerText =
                `@${profile.username || "username"}`;

        });


    // ------------------------------------------
    // EMAIL
    // ------------------------------------------

    document
        .querySelectorAll(".user-email")
        .forEach(element => {

            element.innerText =
                user.email || "";

        });


    // ------------------------------------------
    // BIO
    // ------------------------------------------

    document
        .querySelectorAll(".profile-bio")
        .forEach(element => {

            element.innerText =
                profile.bio || "No bio added yet.";

        });


    // ------------------------------------------
    // LOCATION
    // ------------------------------------------

    document
        .querySelectorAll(".profile-location")
        .forEach(element => {

            element.innerText =
                profile.location || "Not added";

        });


    // ------------------------------------------
    // WORK
    // ------------------------------------------

    document
        .querySelectorAll(".profile-work")
        .forEach(element => {

            element.innerText =
                profile.work || "Not added";

        });


    // ------------------------------------------
    // EDUCATION
    // ------------------------------------------

    document
        .querySelectorAll(".profile-education")
        .forEach(element => {

            element.innerText =
                profile.education || "Not added";

        });


    // ------------------------------------------
    // WEBSITE
    // ------------------------------------------

    document
        .querySelectorAll(".profile-website")
        .forEach(element => {

            if (profile.website) {

                element.innerText =
                    profile.website;

                if (element.tagName === "A") {

                    element.href =
                        profile.website.startsWith("http")
                            ? profile.website
                            : `https://${profile.website}`;

                }

            } else {

                element.innerText =
                    "Not added";
            }

        });


    // ------------------------------------------
    // BIRTHDAY
    // ------------------------------------------

    document
        .querySelectorAll(".profile-birthday")
        .forEach(element => {

            element.innerText =
                profile.birthday || "Not added";

        });


    // ------------------------------------------
    // EXTRA INFO (Facebook About sections)
    // ------------------------------------------

    const extra =
        profile.extra || {};


    const extraDisplay = {

        gender: ".profile-gender",

        languages: ".profile-languages",

        high_school: ".profile-highschool",

        hometown: ".profile-hometown",

        email: ".profile-email",

        phone: ".profile-phone",

        social_links: ".profile-sociallinks",

        other_names: ".profile-othernames",

        hobbies: ".profile-hobbies",

        sports: ".profile-sports",

        favorite_teams: ".profile-teams",

        favorite_athletes: ".profile-athletes",

        favorite_artists: ".profile-artists",

        favorite_tv: ".profile-tvshows",

        favorite_movies: ".profile-movies",

        favorite_games: ".profile-games",

        favorite_quotes: ".profile-quotes",

        religious_views: ".profile-religion",

        political_views: ".profile-politics",

        relationship: ".profile-relationship"

    };


    for (const key in extraDisplay) {

        document
            .querySelectorAll(extraDisplay[key])
            .forEach(element => {

                element.innerText =
                    (extra[key] || "").trim() || "Not added";

            });

    }


    // ------------------------------------------
    // PROFILE PHOTO / AVATAR
    // ------------------------------------------

    if (profile.avatar_url) {

        document
            .querySelectorAll(".profile-photo")
            .forEach(element => {

                element.innerHTML = "";

                const image =
                    document.createElement("img");

                image.src =
                    profile.avatar_url;

                image.alt =
                    profile.full_name || "Profile";

                image.onerror = () => {

                    element.innerHTML = "👤";
                };

                image.style.width = "100%";
                image.style.height = "100%";
                image.style.objectFit = "cover";
                image.style.borderRadius = "50%";

                element.appendChild(image);

            });


        document
            .querySelectorAll(".avatar, .sidebar-avatar, .side-avatar")
            .forEach(element => {

                element.innerHTML = "";

                const image =
                    document.createElement("img");

                image.src =
                    profile.avatar_url;

                image.alt =
                    profile.full_name || "Profile";

                image.onerror = () => {

                    element.innerHTML = "👤";
                };

                image.style.width = "100%";
                image.style.height = "100%";
                image.style.objectFit = "cover";
                image.style.borderRadius = "50%";

                element.appendChild(image);
            });


    } else {

        document
            .querySelectorAll(".profile-photo")
            .forEach(element => {

                element.innerHTML = "👤";

            });
    }


    // ------------------------------------------
    // COVER PHOTO
    // ------------------------------------------

    if (profile.cover_url) {

        const extra =
            profile.extra || {};

        const coverPos =
            extra.cover_position || null;

        document
            .querySelectorAll(".cover-photo")
            .forEach(element => {

                element.style.backgroundImage =
                    `url(${profile.cover_url})`;

                element.style.backgroundSize = "cover";

                element.style.backgroundPosition =
                    coverPos
                        ? `${coverPos.x || 0}% ${coverPos.y || 0}%`
                        : "center";
            });

    } else {

        document
            .querySelectorAll(".cover-photo")
            .forEach(element => {

                element.style.backgroundImage = "";
                element.style.backgroundSize = "";
                element.style.backgroundPosition = "";
            });
    }


    // ------------------------------------------
    // FILL EDIT PROFILE FORM
    // ------------------------------------------

    fillEditProfileForm(profile);


    // ------------------------------------------
    // REBUILD PHOTO EDIT CONTROLS
    // (showCurrentUserData replaces the avatar
    //  innerHTML, which removes the camera
    //  buttons added by image-upload.js)
    // ------------------------------------------

    if (
        typeof setupProfilePhotoUpload ===
        "function"
    ) {

        setupProfilePhotoUpload();
    }

    if (
        typeof setupProfileCoverUpload ===
        "function"
    ) {

        setupProfileCoverUpload();
    }
}



// ======================================================
// 4. FILL EDIT PROFILE FORM
// ======================================================

function setInputValue(id, value) {

    const element =
        document.getElementById(id);


    if (element) {

        element.value =
            value || "";

    }
}


function fillEditProfileForm(profile) {

    if (!profile) {
        return;
    }


    setInputValue(
    "editFullName",
    profile.full_name
);


    setInputValue(
        "editUsername",
        profile.username
    );


    setInputValue(
        "editBio",
        profile.bio
    );


    setInputValue(
        "editLocation",
        profile.location
    );


    setInputValue(
        "editWork",
        profile.work
    );


    setInputValue(
        "editEducation",
        profile.education
    );


    setInputValue(
        "editWebsite",
        profile.website
    );


    setInputValue(
        "editBirthday",
        profile.birthday
    );


    const extra =
        profile.extra || {};


    setInputValue(
        "editGender",
        extra.gender || ""
    );

    setInputValue(
        "editLanguages",
        extra.languages
    );

    setInputValue(
        "editHighSchool",
        extra.high_school
    );

    setInputValue(
        "editHometown",
        extra.hometown
    );

    setInputValue(
        "editEmail",
        extra.email
    );

    setInputValue(
        "editPhone",
        extra.phone
    );

    setInputValue(
        "editSocialLinks",
        extra.social_links
    );

    setInputValue(
        "editOtherNames",
        extra.other_names
    );

    setInputValue(
        "editHobbies",
        extra.hobbies
    );

    setInputValue(
        "editSports",
        extra.sports
    );

    setInputValue(
        "editTeams",
        extra.favorite_teams
    );

    setInputValue(
        "editAthletes",
        extra.favorite_athletes
    );

    setInputValue(
        "editArtists",
        extra.favorite_artists
    );

    setInputValue(
        "editTvShows",
        extra.favorite_tv
    );

    setInputValue(
        "editMovies",
        extra.favorite_movies
    );

    setInputValue(
        "editGames",
        extra.favorite_games
    );

    setInputValue(
        "editQuotes",
        extra.favorite_quotes
    );

    setInputValue(
        "editReligion",
        extra.religious_views
    );

    setInputValue(
        "editPolitics",
        extra.political_views
    );

    setInputValue(
        "editRelationship",
        extra.relationship || ""
    );
}



// ======================================================
// 5. OPEN EDIT PROFILE
// ======================================================

async function openEditProfile() {

    const modal =
        document.getElementById(
            "editProfileModal"
        );


    if (!modal) {

        console.log(
            "Edit Profile modal not found."
        );

        return;
    }


    const result =
        await getCurrentProfile();


    if (!result || !result.profile) {

        alert(
            "Unable to load your profile."
        );

        return;
    }


    fillEditProfileForm(
        result.profile
    );


    switchEditSection(
        "general"
    );


    modal.classList.add("active");
}



// ======================================================
// 5B. SWITCH EDIT PROFILE SECTION (Facebook style)
// ======================================================

function switchEditSection(section) {

    const buttons =
        document.querySelectorAll(
            ".edit-profile-section"
        );


    buttons.forEach(function(button) {

        const active =
            button.getAttribute(
                "data-section"
            ) === section;


        button.classList.toggle(
            "active",
            active
        );

    });


    const panels =
        document.querySelectorAll(
            ".edit-profile-fields"
        );


    panels.forEach(function(panel) {

        const panelName =
            "editSection" +
            section
                .charAt(0)
                .toUpperCase() +
            section.slice(1);


        panel.classList.toggle(
            "active",
            panel.id === panelName
        );

    });

}



// ======================================================
// 6. CLOSE EDIT PROFILE
// ======================================================

function closeEditProfile() {

    const modal =
        document.getElementById(
            "editProfileModal"
        );


    if (modal) {

        modal.classList.remove(
            "active"
        );

    }
}



// ======================================================
// 7. SAVE EDIT PROFILE
// ======================================================

async function saveProfile(event) {

    if (event) {

        event.preventDefault();

    }


    const result =
        await getCurrentProfile();


    if (!result || !result.user) {

        alert(
            "You are not logged in."
        );

        return;
    }


    const userId =
        result.user.id;


    // ------------------------------------------
    // GET FORM VALUES
    // ------------------------------------------

    const name =
    document
        .getElementById("editFullName")
        ?.value
        .trim() || "";


    const username =
        document
            .getElementById("editUsername")
            ?.value
            .trim()
            .toLowerCase() || "";


    const bio =
        document
            .getElementById("editBio")
            ?.value
            .trim() || "";


    const location =
        document
            .getElementById("editLocation")
            ?.value
            .trim() || "";


    const work =
        document
            .getElementById("editWork")
            ?.value
            .trim() || "";


    const education =
        document
            .getElementById("editEducation")
            ?.value
            .trim() || "";


    const website =
        document
            .getElementById("editWebsite")
            ?.value
            .trim() || "";


    const birthday =
        document
            .getElementById("editBirthday")
            ?.value || null;



    // ------------------------------------------
    // EXTRA FIELDS (Facebook About sections)
    // ------------------------------------------

    const extraFields = {

        editGender: "gender",

        editLanguages: "languages",

        editHighSchool: "high_school",

        editHometown: "hometown",

        editEmail: "email",

        editPhone: "phone",

        editSocialLinks: "social_links",

        editOtherNames: "other_names",

        editHobbies: "hobbies",

        editSports: "sports",

        editTeams: "favorite_teams",

        editAthletes: "favorite_athletes",

        editArtists: "favorite_artists",

        editTvShows: "favorite_tv",

        editMovies: "favorite_movies",

        editGames: "favorite_games",

        editQuotes: "favorite_quotes",

        editReligion: "religious_views",

        editPolitics: "political_views",

        editRelationship: "relationship"

    };


    const extra =
        Object.assign(
            {},
            (result.profile && result.profile.extra) || {}
        );


    for (const id in extraFields) {

        const value =
            document
                .getElementById(id)
                ?.value.trim() || "";


        extra[extraFields[id]] = value;

    }



    // ------------------------------------------
    // VALIDATION
    // ------------------------------------------

    if (name === "") {

        alert(
            "Please enter your name."
        );

        return;
    }


    if (username === "") {

        alert(
            "Please enter a username."
        );

        return;
    }


    // Username validation

    const usernamePattern =
        /^[a-z0-9._]+$/;


    if (!usernamePattern.test(username)) {

        alert(
            "Username can only contain lowercase letters, numbers, dot and underscore."
        );

        return;
    }



    // ------------------------------------------
    // UPDATE PROFILE
    // ------------------------------------------

    const {
        error
    } = await supabaseClient
        .from("profiles")
        .update({

            full_name: name,

            username: username,

            bio: bio || null,

            location: location || null,

            work: work || null,

            education: education || null,

            website: website || null,

            birthday: birthday || null,

            extra: extra

        })
        .eq("id", userId);



    // ------------------------------------------
    // UPDATE ERROR
    // ------------------------------------------

    if (error) {

        console.log(
            "Profile update error:",
            error
        );


        if (
            error.code === "23505"
        ) {

            alert(
                "This username is already taken. Please choose another one."
            );

        } else {

            alert(
                "Could not save your profile.\n\n" +
                error.message
            );

        }

        return;
    }



    // ------------------------------------------
    // SUCCESS
    // ------------------------------------------

    alert(
        "Profile updated successfully! 🎉"
    );


    closeEditProfile();


    // Reload fresh data

    await showCurrentUserData();
}



// ======================================================
// 8. CREATE POST
// ======================================================

async function createPost() {

    const input =
        document.getElementById(
            "postInput"
        );


    if (!input) {
        return;
    }


    const text =
        input.value.trim();


    if (text === "") {

        alert(
            "Please write something first!"
        );

        return;
    }


    const result =
        await getCurrentProfile();


    if (!result || !result.profile) {

        alert(
            "Please login first."
        );

        return;
    }


    const profile =
        result.profile;


    const posts =
        document.getElementById(
            "posts"
        );


    if (!posts) {
        return;
    }


    const newPost =
        document.createElement(
            "article"
        );


    newPost.className =
        "post";


    newPost.innerHTML = `

        <div class="post-header">

            <div class="avatar">

                👤

            </div>

            <div>

                <h3 class="post-user-name">

                    ${escapeHTML(
                        profile.full_name || "User"
                    )}

                </h3>

                <small>

                    Just now · 🌎

                </small>

            </div>

        </div>


        <p class="post-text">

            ${escapeHTML(text)}

        </p>


        <div class="post-stats">

            <span class="fb-stats-reactions">
                <i class="fa-solid fa-heart"></i>
                0 Likes
            </span>

            <span class="fb-stats-comments">
                <i class="fa-solid fa-comment"></i>
                0 Comments
            </span>

        </div>


        <div class="post-actions">

            <button
                class="fb-action-btn fb-like-slot"
                onclick="likePost(this)"
            >
                <i class="fa-solid fa-thumbs-up"></i>
                <span class="fb-action-label">Like</span>
            </button>

            <button
                class="fb-action-btn"
                onclick="this.closest('.post').querySelector('.comment-input').focus()"
            >
                <i class="fa-solid fa-comment"></i>
                <span class="fb-action-label">Comment</span>
            </button>

            <button
                class="fb-action-btn"
                onclick="socialhubShareDialog('${post.id}')"
            >
                <i class="fa-solid fa-share-from-square"></i>
                <span class="fb-action-label">Share</span>
            </button>

        </div>


        <div class="comment-box">

            <input
                type="text"
                placeholder="Write a comment..."
                class="comment-input"
            >

            <button
                onclick="addComment(this)"
            >
                Send
            </button>

        </div>


        <div class="comments"></div>

    `;


    posts.prepend(
        newPost
    );


    input.value = "";
}



// ======================================================
// 9. LIKE SYSTEM
// ======================================================

function likePost(button) {

    const post =
        button.closest(".post");


    if (!post) {
        return;
    }


    const stats =
        post.querySelector(
            ".post-stats span"
        );


    if (!stats) {
        return;
    }


    const match =
        stats.innerText.match(/\d+/);


    let likes =
        match
            ? parseInt(match[0])
            : 0;


    if (
        button.classList.contains(
            "liked"
        )
    ) {

        likes--;

        button.classList.remove(
            "liked"
        );

        button.innerHTML =
            '<i class="fa-solid fa-thumbs-up"></i>' +
            '<span class="fb-action-label">Like</span>';

    } else {

        likes++;

        button.classList.add(
            "liked"
        );

        button.innerHTML =
            '<i class="fa-solid fa-thumbs-up"></i>' +
            '<span class="fb-action-label">Liked</span>';
    }


    stats.innerHTML =
        `<i class="fa-solid fa-heart"></i> ${likes} Likes`;
}



// ======================================================
// 10. COMMENT SYSTEM
// ======================================================

async function addComment(button) {

    const post =
        button.closest(".post");


    if (!post) {
        return;
    }


    const input =
        post.querySelector(
            ".comment-input"
        );


    const comments =
        post.querySelector(
            ".comments"
        );


    const text =
        input.value.trim();


    if (text === "") {

        return;
    }


    const result =
        await getCurrentProfile();


    const userName =
        result?.profile?.full_name ||
        "User";


    const comment =
        document.createElement(
            "div"
        );


    comment.className =
        "comment";


    comment.innerHTML = `

        <div class="avatar">

            👤

        </div>

        <div class="comment-content">

            <strong>

                ${escapeHTML(userName)}

            </strong>

            <p>

                ${escapeHTML(text)}

            </p>

        </div>

    `;


    comments.appendChild(
        comment
    );


    const counter =
        post.querySelector(
            ".post-stats span:nth-child(2)"
        );


    if (counter) {

        const match =
            counter.innerText.match(
                /\d+/
            );


        let count =
            match
                ? parseInt(match[0])
                : 0;


        count++;


        counter.innerText =
            `💬 ${count} Comments`;
    }


    input.value = "";
}



// ======================================================
// 11. SIGN UP
// ======================================================

async function signupUser(event) {

    event.preventDefault();


    const name =
        document
            .getElementById(
                "signupName"
            )
            .value
            .trim();


    const email =
        document
            .getElementById(
                "signupEmail"
            )
            .value
            .trim();


    const password =
        document
            .getElementById(
                "signupPassword"
            )
            .value;


    const confirmPassword =
        document
            .getElementById(
                "signupConfirm"
            )
            .value;


    if (name === "") {

        alert(
            "Please enter your name."
        );

        return;
    }


    if (email === "") {

        alert(
            "Please enter your email."
        );

        return;
    }


    if (password.length < 6) {

        alert(
            "Password must be at least 6 characters."
        );

        return;
    }


    if (
        password !==
        confirmPassword
    ) {

        alert(
            "Passwords do not match!"
        );

        return;
    }



    // Create account

    const {
        data,
        error
    } = await supabaseClient.auth.signUp({

        email: email,

        password: password

    });


    if (error) {

        alert(
            error.message
        );

        return;
    }


    if (!data.user) {

        alert(
            "Account could not be created."
        );

        return;
    }


    // Generate username

    const username =
        name
            .toLowerCase()
            .replace(/\s+/g, "")
            .replace(
                /[^a-z0-9._]/g,
                ""
            );


    // Email confirmation ON -> no session yet,
    // so save the profile for the first login
    // (RLS blocks profile writes before confirm)

    if (!data.session) {

        localStorage.setItem(
            "socialhubPendingProfile",
            JSON.stringify({
                id: data.user.id,
                username: username,
                full_name: name
            })
        );

        alert(
            "Account created! 🎉\n\n" +
            "Check your email to confirm,\n" +
            "then log in."
        );

        window.location.href =
            "../auth/index.html";

        return;
    }


    // Create profile

    const {
        error: profileError
    } = await supabaseClient
        .from("profiles")
        .upsert({

            id: data.user.id,

            username: username,

            full_name: name

        });


    if (profileError) {

        alert(
            "Account created, but profile could not be saved.\n\n" +
            profileError.message
        );

        return;
    }


    alert(
        "Account created successfully! 🎉"
    );


    window.location.href =
        "../auth/index.html";
}



// ======================================================
// 12. LOGIN
// ======================================================

async function loginUser(event) {

    event.preventDefault();


    const email =
        document
            .getElementById(
                "loginEmail"
            )
            .value
            .trim();


    const password =
        document
            .getElementById(
                "loginPassword"
            )
            .value;


    if (email === "") {

        alert(
            "Please enter your email."
        );

        return;
    }


    if (password === "") {

        alert(
            "Please enter your password."
        );

        return;
    }


    const {
        data,
        error
    } = await supabaseClient.auth
        .signInWithPassword({

            email: email,

            password: password

        });


    if (error) {

        alert(
            error.message
        );

        return;
    }


    if (!data.session) {

        alert(
            "Login failed. Please try again."
        );

        return;
    }

    // Reactivate account on login
    try {

        await supabaseClient
            .from("profiles")
            .update({ deactivated: false })
            .eq("id", data.user.id);

    } catch (reactivateError) {

        console.warn(
            "⚠️ Reactivation skipped:",
            reactivateError
        );
    }


    // First login after email confirm:
    // save the pending profile (name/username)

    const pendingProfile =
        localStorage.getItem(
            "socialhubPendingProfile"
        );

    if (pendingProfile) {

        try {

            const pending =
                JSON.parse(pendingProfile);

            await supabaseClient
                .from("profiles")
                .upsert({
                    id: pending.id,
                    username: pending.username,
                    full_name: pending.full_name
                });

            localStorage.removeItem(
                "socialhubPendingProfile"
            );

        } catch (ignore) {}
    }


    alert(
        "Login successful! 🎉"
    );


    window.location.href =
        "../home/index.html";
}



// ======================================================
// 13. LOGOUT
// ======================================================

async function logoutUser() {

    const {
        error
    } = await supabaseClient.auth.signOut();


    if (error) {

        console.log(
            "Logout error:",
            error.message
        );

    }


    localStorage.removeItem(
        "currentUser"
    );


    localStorage.removeItem(
        "isLoggedIn"
    );


    window.location.href =
        "../auth/index.html";
}



// ======================================================
// 14. DARK MODE
// ======================================================

function toggleDarkMode() {

    document.body.classList.toggle(
        "dark-mode"
    );


    const isDark =
        document.body.classList.contains(
            "dark-mode"
        );


    localStorage.setItem(
        "darkMode",
        isDark
    );
}



// ======================================================
// 15. LOAD DARK MODE
// ======================================================

function loadDarkMode() {

    const darkMode =
        localStorage.getItem(
            "darkMode"
        );


    if (
        darkMode === "true"
    ) {

        document.body.classList.add(
            "dark-mode"
        );

    }
}



// ======================================================
// 16. HTML SECURITY HELPER
// ======================================================

function escapeHTML(text) {

    const div =
        document.createElement(
            "div"
        );


    div.innerText =
        text;


    return div.innerHTML;
}



// ======================================================
// 17. EDIT PROFILE BUTTON SETUP
// ======================================================

function setupEditProfileButtons() {

    // Buttons with these classes can open Edit Profile

    const buttons =
        document.querySelectorAll(
            ".edit-profile-btn, .edit-profile-button"
        );


    buttons.forEach(button => {

        button.addEventListener(
            "click",
            openEditProfile
        );

    });


    // Edit Intro can also open the editor

    const introButton =
        document.querySelector(
            ".edit-intro"
        );


    if (introButton) {

        introButton.addEventListener(
            "click",
            openEditProfile
        );

    }


    // Close buttons

    const closeButtons =
        document.querySelectorAll(
            ".close-modal, .close-edit-profile"
        );


    closeButtons.forEach(button => {

        button.addEventListener(
            "click",
            closeEditProfile
        );

    });


    // Save form

    const form =
        document.getElementById(
            "editProfileForm"
        );


    if (form) {

        form.addEventListener(
            "submit",
            saveProfile
        );

    }


    // Close when clicking outside modal

    const modal =
        document.getElementById(
            "editProfileModal"
        );


    if (modal) {

        modal.addEventListener(
            "click",
            function(event) {

                if (
                    event.target === modal
                ) {

                    closeEditProfile();

                }

            }
        );

    }
}



// ======================================================
// 18. PAGE LOAD
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    async function() {

        loadDarkMode();

        setupEditProfileButtons();

        await showCurrentUserData();

    }
);

// Step 10.15 - Database Test

async function testDB() {
    const { data, error } = await db
        .from("profiles")
        .select("*")
        .limit(1);

    if (error) {
        console.error("❌ Database Error:", error);
    } else {
        console.log("✅ Database Connected!", data);
    }
}

testDB();

// ==========================================
// Friendio - Step 10.18
// Sync Profile Name with Auth Metadata
// ==========================================

async function syncAuthDisplayName() {

    try {

        const {
            data: userData,
            error: userError
        } = await db.auth.getUser();

        if (userError || !userData.user) {
            console.log("No logged-in user found.");
            return;
        }

        const user = userData.user;

        // Get profile
        const {
            data: profile,
            error: profileError
        } = await db
            .from("profiles")
            .select("full_name")
            .eq("id", user.id)
            .single();

        if (profileError || !profile) {
            console.log("Profile not found.");
            return;
        }

        const fullName = profile.full_name;

        if (!fullName) {
            return;
        }

        // Update Auth metadata
        const {
            error: updateError
        } = await db.auth.updateUser({
            data: {
                full_name: fullName,
                display_name: fullName
            }
        });

        if (updateError) {

            console.error(
                "❌ Auth name sync error:",
                updateError
            );

            return;
        }

        console.log(
            "✅ Auth Display Name synced:",
            fullName
        );

    } catch (error) {

        console.error(
            "❌ Auth sync failed:",
            error
        );

    }
}


// Run after page loads
document.addEventListener(
    "DOMContentLoaded",
    function() {

        setTimeout(
            syncAuthDisplayName,
            1000
        );

    }
);

// ==========================================
// Friendio - Step 10.19
// Sync Edited Name with Auth Metadata
// ==========================================

async function syncEditedNameWithAuth() {

    try {

        const {
            data: userData,
            error: userError
        } = await db.auth.getUser();

        if (userError || !userData.user) {
            return;
        }

        const user = userData.user;

        const {
            data: profile,
            error: profileError
        } = await db
            .from("profiles")
            .select("full_name")
            .eq("id", user.id)
            .single();

        if (profileError || !profile) {
            return;
        }

        if (!profile.full_name) {
            return;
        }

        const {
            error: updateError
        } = await db.auth.updateUser({
            data: {
                full_name: profile.full_name,
                display_name: profile.full_name
            }
        });

        if (updateError) {
            console.error(
                "❌ Auth name sync failed:",
                updateError
            );
            return;
        }

        console.log(
            "✅ Auth name updated:",
            profile.full_name
        );

    } catch (error) {

        console.error(
            "❌ Sync error:",
            error
        );

    }
}
// ==========================================
// Friendio - Step 10.20
// Run Auth Sync After Profile Save
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    const editForm =
        document.getElementById("editProfileForm");

    if (!editForm) {
        return;
    }

    editForm.addEventListener("submit", () => {

        // Wait for the existing saveProfile()
        // to update the profiles table first.
        setTimeout(async () => {

            await syncEditedNameWithAuth();

            console.log(
                "✅ Profile → Auth sync completed!"
            );

        }, 1200);

    });

});
// ==========================================
// Friendio - Step 10.21
// Profile Session Refresh
// ==========================================

async function refreshFriendioProfile() {

    try {

        const {
            data,
            error
        } = await db.auth.getSession();

        if (error) {
            console.error(
                "❌ Session check failed:",
                error
            );
            return;
        }

        if (!data.session) {
            console.log("No active session.");
            return;
        }

        console.log(
            "✅ Active session:",
            data.session.user.email
        );

        // Refresh profile data
        await showCurrentUserData();

        console.log(
            "✅ Friendio profile refreshed!"
        );

    } catch (error) {

        console.error(
            "❌ Profile refresh failed:",
            error
        );

    }
}


// Run only on profile page
document.addEventListener(
    "DOMContentLoaded",
    function() {

        if (
            socialhubPageId() === "profile/index.html"
        ) {

            setTimeout(
                refreshFriendioProfile,
                500
            );

        }

    }
);


// Load user data on every page (fixes the home
// topbar/sidebar avatar not showing the photo)
document.addEventListener(
    "DOMContentLoaded",
    function() {

        if (
            socialhubPageId() === "profile/index.html" ||
            socialhubPageId() === "profile/user-profile.html"
        ) {
            return;
        }

        if (
            !document.querySelector(
                ".side-avatar, .sidebar-avatar"
            )
        ) {
            return;
        }

        setTimeout(
            showCurrentUserData,
            300
        );

    }
);


// Open a shared post link: index.html?post=<id>
document.addEventListener(
    "DOMContentLoaded",
    function() {

        const params =
            new URLSearchParams(
                window.location.search
            );

        const postId =
            params.get("post");

        if (!postId) {
            return;
        }

        // Inject the highlight animation once
        const style =
            document.createElement("style");

        style.textContent = `
            @keyframes socialhubFlashPost {
                0% {
                    box-shadow: 0 0 0 0 rgba(24, 119, 242, 0.55);
                }
                50% {
                    box-shadow: 0 0 0 14px rgba(24, 119, 242, 0);
                }
                100% {
                    box-shadow: 0 0 0 0 rgba(24, 119, 242, 0);
                }
            }
        `;

        document.head.appendChild(style);

        let tries = 0;

        const timer =
            setInterval(() => {

                tries++;

                const post =
                    document.querySelector(
                        `#posts .post[data-post-id="${postId}"]`
                    );

                if (post) {

                    clearInterval(timer);

                    post.scrollIntoView({
                        behavior: "smooth",
                        block: "center"
                    });

                    post.style.animation =
                        "socialhubFlashPost 2s ease";

                    setTimeout(() => {

                        post.style.animation = "";
                    }, 2200);

                    return;
                }

                if (tries > 12) {

                    clearInterval(timer);
                }

            }, 800);
    }
);
// ==========================================
// Friendio - Step 10.24
// Create Post -> Supabase
// ==========================================

async function createPostInSupabase(event) {

    if (event) {
        event.preventDefault();
    }

    const input = document.getElementById("postInput");

    if (!input) {
        return;
    }

    const content = input.value.trim();

    if (content === "") {
        alert("Please write something first!");
        return;
    }

    try {

        // Get logged-in user
        const {
            data: userData,
            error: userError
        } = await db.auth.getUser();

        if (userError || !userData.user) {
            alert("Please login first.");
            return;
        }

        const userId = userData.user.id;

        // Save post to Supabase
        const {
            data,
            error
        } = await db
            .from("posts")
            .insert({
                user_id: userId,
                content: content,
                audience:
                    window.socialhubAudience ||
                    "public"
            })
            .select()
            .single();

        if (error) {

            console.error(
                "❌ Post creation error:",
                error
            );

            alert(
                "Could not create post.\n\n" +
                error.message
            );

            return;
        }

        console.log(
            "✅ Post saved to Supabase:",
            data
        );

        input.value = "";

        alert("Post created successfully! 🎉");

    } catch (error) {

        console.error(
            "❌ Unexpected post error:",
            error
        );

        alert(
            "Something went wrong while creating the post."
        );
    }
}
// ==========================================
// Friendio - Step 10.25
// Connect Create Post to Supabase
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    const postButton =
        document.querySelector(
            'button[onclick="createPost()"]'
        );

    if (!postButton) {
        console.log(
            "Create Post button not found."
        );
        return;
    }

    // Remove old inline action
    postButton.removeAttribute("onclick");

    // Connect new Supabase function
    postButton.addEventListener(
        "click",
        createPostInSupabase
    );

    console.log(
        "✅ Create Post connected to Supabase!"
    );
});
// ==========================================
// Friendio - Step 10.26
// Load Posts From Supabase
// ==========================================

async function loadPostsFromSupabase() {

    const postsContainer =
        document.getElementById("posts");

    if (!postsContainer) {
        return;
    }

    try {

        const {
            data: posts,
            error
        } = await db
            .from("posts")
            .select("*")
            .order("created_at", {
                ascending: false
            });

        if (error) {

            console.error(
                "❌ Load posts error:",
                error
            );

            return;
        }

        console.log(
            "✅ Posts loaded from Supabase:",
            posts
        );

        if (!posts || posts.length === 0) {
            return;
        }

        // Remove existing demo posts
        postsContainer.innerHTML = "";

        posts.forEach(post => {

            const article =
                document.createElement("article");

            article.className = "post";

            article.innerHTML = `

                <div class="post-header">

                    <div class="avatar">
                        👤
                    </div>

                    <div>

                        <h3 class="post-user-name">
                            User
                        </h3>

                        <small>
                            ${new Date(
                                post.created_at
                            ).toLocaleString()} · 🌎
                        </small>

                    </div>

                </div>

                <p class="post-text">
                    ${escapeHTML(post.content)}
                </p>

                <div class="post-stats">

                    <span class="fb-stats-reactions">
                        <i class="fa-solid fa-heart"></i>
                        0 Likes
                    </span>

                    <span class="fb-stats-comments">
                        <i class="fa-solid fa-comment"></i>
                        0 Comments
                    </span>

                </div>

                <div class="post-actions">

                    <button
                        class="fb-action-btn fb-like-slot"
                        onclick="likePost(this)"
                    >
                        <i class="fa-solid fa-thumbs-up"></i>
                        <span class="fb-action-label">Like</span>
                    </button>

                    <button
                        class="fb-action-btn"
                        onclick="this.closest('.post').querySelector('.comment-input').focus()"
                    >
                        <i class="fa-solid fa-comment"></i>
                        <span class="fb-action-label">Comment</span>
                    </button>

                    <button
                        class="fb-action-btn"
                        onclick="socialhubShareDialog('${post.id}')"
                    >
                        <i class="fa-solid fa-share-from-square"></i>
                        <span class="fb-action-label">Share</span>
                    </button>

                </div>

                <div class="comment-box">

                    <input
                        type="text"
                        placeholder="Write a comment..."
                        class="comment-input"
                    >

                    <button
                        onclick="addComment(this)"
                    >
                        Send
                    </button>

                </div>

                <div class="comments"></div>

            `;

            postsContainer.appendChild(article);

        });

    } catch (error) {

        console.error(
            "❌ Unexpected posts loading error:",
            error
        );

    }
}


// Load posts after page loads
// (legacy auto-load removed: the Step 10.31
//  loader renders the feed with real names)
// ==========================================
// Friendio - Step 10.30
// Save Background Post to Supabase
// ==========================================

async function createPremiumPostInSupabase(event) {

    if (event) {
        event.preventDefault();
        event.stopImmediatePropagation();
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

    try {

        // Get logged-in user
        const {
            data: userData,
            error: userError
        } = await db.auth.getUser();

        if (
            userError ||
            !userData.user
        ) {
            alert("Please login first.");
            return;
        }

        const userId =
            userData.user.id;

        // Get selected background
        const background =
            input.dataset.background ||
            "none";

        // Save post
        const {
            data,
            error
        } = await db
            .from("posts")
            .insert({
                user_id: userId,
                content: content,
                background:
                    background === "none"
                        ? null
                        : background,
                audience:
                    window.socialhubAudience ||
                    "public"
            })
            .select()
            .single();

        if (error) {

            console.error(
                "❌ Premium post error:",
                error
            );

            alert(
                "Could not create post.\n\n" +
                error.message
            );

            return;
        }

        console.log(
            "✅ Premium post saved:",
            data
        );

        // Reset composer
        input.value = "";

        input.style.background = "";
        input.style.color = "";

        input.dataset.background =
            "none";

        const picker =
            document.querySelector(
                ".post-background-picker"
            );

        if (picker) {

            picker.classList.remove(
                "active"
            );

            picker
                .querySelectorAll(
                    ".post-bg-option"
                )
                .forEach(option => {

                    option.classList.remove(
                        "selected"
                    );

                });

            const firstOption =
                picker.querySelector(
                    ".post-bg-option"
                );

            if (firstOption) {
                firstOption.classList.add(
                    "selected"
                );
            }
        }

        alert(
            "Post created successfully! 🎉"
        );

        // Reload feed
        if (
            typeof loadPostsWithUserNames ===
            "function"
        ) {

            await loadPostsWithUserNames();

        }

    } catch (error) {

        console.error(
            "❌ Unexpected error:",
            error
        );

        alert(
            "Something went wrong."
        );
    }
}
// ==========================================
// Step 10.30
// Connect Premium Post Button
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const postButton =
            document.querySelector(
                ".create-post .post-btn"
            );

        if (!postButton) {
            return;
        }

        postButton.removeAttribute(
            "onclick"
        );

        postButton.addEventListener(
            "click",
            createPremiumPostInSupabase
        );

        console.log(
            "✅ Premium Post connected!"
        );
    }
);
// ==========================================
// Friendio - Step 10.30 FIX
// Prevent duplicate post creation
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    const postButton =
        document.querySelector(
            ".create-post .post-btn"
        );

    if (!postButton) return;

    // Clone button to remove ALL previous click listeners
    const cleanButton =
        postButton.cloneNode(true);

    postButton.parentNode.replaceChild(
        cleanButton,
        postButton
    );

    // Make sure old inline onclick is removed
    cleanButton.removeAttribute("onclick");

    // Only ONE post function
    cleanButton.addEventListener(
        "click",
        createPremiumPostInSupabase
    );

    console.log(
        "✅ Duplicate post protection enabled!"
    );

});
// ==========================================
// Friendio - Step 10.31
// Final Post Loader
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        setTimeout(
            async () => {

                // Use the new loader
                await loadPostsWithUserNames();

            },
            1000
        );

    }
);
// ======================================================
// Friendio - Step 10.31 FINAL
// Real User Name + Clean Text + Background
// ======================================================

async function loadPostsWithUserNames() {

    const postsContainer =
        document.getElementById("posts");

    if (!postsContainer) {
        return;
    }

    const PAGE_SIZE = 10;

    window.socialhubFeed =
        window.socialhubFeed || { page: 0, total: 0 };

    window.socialhubFeed.page = 0;

    try {

        // ------------------------------------------
        // GET POSTS (paginated)
        // ------------------------------------------

        const {
            data: posts,
            count,
            error
        } = await db
            .from("posts")
            .select("*", { count: "exact" })
            .is("group_id", null)
            .is("page_id", null)
            .order("created_at", {
                ascending: false
            })
            .range(0, PAGE_SIZE - 1);

        window.socialhubFeed.total = count || 0;

        if (error) {

            console.error(
                "❌ Post loading error:",
                error
            );

            return;
        }

        const visiblePosts =
            await socialhubFilterVisiblePosts(
                posts
            );

        // ------------------------------------------
        // SHARES (shared posts appear in the feed)
        // ------------------------------------------

        let shareItems = [];

        if (
            typeof socialhubFetchShareWindow ===
            "function"
        ) {

            const shares =
                await socialhubFetchShareWindow(
                    0,
                    PAGE_SIZE
                );

            const visibleOriginals =
                await socialhubFilterVisiblePosts(
                    (shares || [])
                        .map(share => share.posts)
                        .filter(Boolean)
                );

            const visibleOriginalIds =
                new Set(
                    (visibleOriginals || [])
                        .map(post => post.id)
                );

            shareItems =
                (shares || [])
                    .filter(
                        share =>
                            share.posts &&
                            visibleOriginalIds.has(
                                share.posts.id
                            )
                    )
                    .map(share => ({
                        type: "share",
                        created_at:
                            share.created_at,
                        share: share,
                        post: share.posts
                    }));
        }

        // Merge posts + shares, newest first
        const feedItems = [
            ...(visiblePosts || []).map(post => ({
                type: "post",
                created_at: post.created_at,
                post: post
            })),
            ...shareItems
        ].sort(
            (a, b) =>
                new Date(b.created_at) -
                new Date(a.created_at)
        );

        // Clear current posts
        postsContainer.innerHTML = "";

        if (feedItems.length === 0) {
            return;
        }


        // ------------------------------------------
        // GET UNIQUE USER IDS
        // ------------------------------------------

        const userIds = [
            ...new Set(
                feedItems
                    .map(item => item.post.user_id)
                    .filter(Boolean)
            )
        ];

        if (
            typeof socialhubFetchShareWindow ===
            "function"
        ) {

            shareItems.forEach(item => {

                userIds.push(item.share.user_id);
            });
        }


        // ------------------------------------------
        // GET PROFILES
        // ------------------------------------------

        let profiles = [];

        if (userIds.length > 0) {

            const {
                data,
                error: profileError
            } = await db
                .from("profiles")
                .select(
                    "id, full_name, username, avatar_url"
                )
                .in("id", userIds);

            if (profileError) {

                console.error(
                    "❌ Profile loading error:",
                    profileError
                );

            } else {

                profiles = data || [];

            }
        }


        // ------------------------------------------
        // PROFILE MAP
        // ------------------------------------------

        const profileMap = new Map();

        profiles.forEach(profile => {

            profileMap.set(
                profile.id,
                profile
            );

        });


        // ------------------------------------------
        // CREATE EACH POST / SHARE
        // ------------------------------------------

        feedItems.forEach(item => {

            if (
                item.type === "share" &&
                typeof socialhubBuildShareCard ===
                    "function"
            ) {

                postsContainer.appendChild(
                    socialhubBuildShareCard(
                        item.share,
                        item.post,
                        profileMap.get(item.post.user_id),
                        profileMap.get(item.share.user_id)
                    )
                );

            } else {

                postsContainer.appendChild(
                    socialhubBuildPostArticle(
                        item.post,
                        profileMap
                    )
                );
            }
        });

        // Share counts on visible posts
        if (
            typeof socialhubApplyShareCounts ===
            "function"
        ) {

            socialhubApplyShareCounts(
                postsContainer
            );
        }

        // Load More button when there are more posts
        socialhubMaybeShowLoadMore();

        // Activity log: track views + "Seen by" on own posts
        if (typeof socialhubTrackPostViews === "function") {

            socialhubTrackPostViews(
                feedItems,
                postsContainer
            );
        }

        console.log(
            "✅ FINAL POSTS LOADED:",
            feedItems.length
        );


    } catch (error) {

        console.error(
            "❌ Final post loader error:",
            error
        );

    }

}


function socialhubBuildPostArticle(post, profileMap) {

            const profile =
                profileMap.get(post.user_id);

            const userName =
                profile?.full_name ||
                "Friendio User";

            const username =
                profile?.username ||
                "user";

            const avatarUrl =
                profile?.avatar_url ||
                "";


            const article =
                document.createElement("article");

            article.className = "post";

            article.dataset.postId =
                post.id;


            // --------------------------------------
            // AVATAR
            // --------------------------------------

            let avatarHTML = "👤";

            if (avatarUrl) {

                avatarHTML = `
                    <img
                        src="${escapeHTML(avatarUrl)}"
                        alt="${escapeHTML(userName)}"
                        style="
                            width:100%;
                            height:100%;
                            object-fit:cover;
                            border-radius:50%;
                        "
                    >
                `;

            }


            // --------------------------------------
            // BACKGROUND
            // --------------------------------------

            const background =
                post.background || null;


            let textStyle = `
                margin: 0;
                line-height: 1.6;
                white-space: pre-wrap;
                overflow-wrap: break-word;
                word-break: normal;
            `;


            if (background) {

                textStyle += `
                    background: ${background};
                    color: #ffffff;
                    padding: 45px 25px;
                    border-radius: 16px;
                    min-height: 150px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    font-size: 24px;
                    font-weight: 600;
                    box-sizing: border-box;
                `;

            } else {

                textStyle += `
                    padding: 0;
                    text-align: left;
                    font-size: 16px;
                    font-weight: 400;
                `;

            }


            // --------------------------------------
            // POST HTML
            // --------------------------------------

            article.innerHTML = `

<div class="post-header">

    <div class="avatar">
        ${avatarHTML}
    </div>

    <div>

        <h3 class="post-user-name">
            ${escapeHTML(userName)}
        </h3>

        <small>
            @${escapeHTML(username)}
            ·
            ${new Date(post.created_at).toLocaleString()}
            · ${socialhubAudienceIcon(post.audience)}
        </small>

    </div>

</div>


<p
    class="post-text"
    style="${textStyle}"
>${escapeHTML(post.content || "")}</p>


<div class="post-stats">

    <span class="fb-stats-reactions">
        <i class="fa-solid fa-heart"></i>
        0 Likes
    </span>

    <span class="fb-stats-comments">
        <i class="fa-solid fa-comment"></i>
        0 Comments
    </span>

</div>


<div class="post-actions">

    <button
        class="fb-action-btn fb-like-slot"
        onclick="likePost(this)"
    >
        <i class="fa-solid fa-thumbs-up"></i>
        <span class="fb-action-label">Like</span>
    </button>

    <button
        class="fb-action-btn"
        onclick="this.closest('.post').querySelector('.comment-input').focus()"
    >
        <i class="fa-solid fa-comment"></i>
        <span class="fb-action-label">Comment</span>
    </button>

    <button
        class="fb-action-btn"
        onclick="socialhubShareDialog('${post.id}')"
    >
        <i class="fa-solid fa-share-from-square"></i>
        <span class="fb-action-label">Share</span>
    </button>

</div>


<div class="comment-box">

    <input
        type="text"
        placeholder="Write a comment..."
        class="comment-input"
    >

    <button
        onclick="addComment(this)"
    >
        Send
    </button>

</div>


<div class="comments"></div>

`;


            return article;
    }


// ======================================================
// LOAD MORE POSTS (infinite scroll)
// ======================================================

async function socialhubFetchProfilesFor(posts) {

    const userIds = [
        ...new Set(
            (posts || [])
                .map(post => post.user_id)
                .filter(Boolean)
        )
    ];

    const profileMap = new Map();

    if (userIds.length > 0) {

        const {
            data
        } = await db
            .from("profiles")
            .select("id, full_name, username, avatar_url")
            .in("id", userIds);

        (data || []).forEach(profile => {

            profileMap.set(profile.id, profile);
        });
    }

    return profileMap;
}


function socialhubMaybeShowLoadMore() {

    const container =
        document.getElementById("posts");

    if (!container) {
        return;
    }

    const oldButton =
        container.querySelector(".socialhub-load-more");

    if (oldButton) {
        oldButton.remove();
    }

    const rendered =
        container.querySelectorAll(".post").length;

    if (rendered >= window.socialhubFeed.total) {
        return;
    }

    const button =
        document.createElement("button");

    button.className = "socialhub-load-more";

    button.textContent = "⬇️ Load More Posts";

    button.addEventListener("click", async () => {

        button.disabled = true;

        button.textContent = "Loading...";

        window.socialhubFeed.page++;

        const start =
            window.socialhubFeed.page * 10;

        const {
            data: posts,
            error
        } = await db
            .from("posts")
            .select("*")
            .is("group_id", null)
            .is("page_id", null)
            .order("created_at", {
                ascending: false
            })
            .range(start, start + 9);

        if (error) {

            alert(
                "Could not load more posts.\n\n" +
                error.message
            );

            socialhubMaybeShowLoadMore();

            return;
        }

        const profileMap =
            await socialhubFetchProfilesFor(posts);

        const visiblePosts =
            await socialhubFilterVisiblePosts(
                posts
            );

        // Shares in this window too
        let shareItems = [];

        if (
            typeof socialhubFetchShareWindow ===
            "function"
        ) {

            const shares =
                await socialhubFetchShareWindow(
                    start,
                    start + 10
                );

            const visibleOriginals =
                await socialhubFilterVisiblePosts(
                    (shares || [])
                        .map(share => share.posts)
                        .filter(Boolean)
                );

            const visibleOriginalIds =
                new Set(
                    (visibleOriginals || [])
                        .map(post => post.id)
                );

            shareItems =
                (shares || [])
                    .filter(
                        share =>
                            share.posts &&
                            visibleOriginalIds.has(
                                share.posts.id
                            )
                    )
                    .map(share => ({
                        type: "share",
                        created_at:
                            share.created_at,
                        share: share,
                        post: share.posts
                    }));
        }

        const feedItems = [
            ...(visiblePosts || []).map(post => ({
                type: "post",
                created_at: post.created_at,
                post: post
            })),
            ...shareItems
        ].sort(
            (a, b) =>
                new Date(b.created_at) -
                new Date(a.created_at)
        );

        const moreProfiles =
            await socialhubFetchProfilesFor(
                shareItems
                    .map(item => item.post)
                    .filter(Boolean)
            );

        (feedItems || []).forEach(item => {

            if (
                item.type === "share" &&
                typeof socialhubBuildShareCard ===
                    "function"
            ) {

                container.appendChild(
                    socialhubBuildShareCard(
                        item.share,
                        item.post,
                        moreProfiles.get(item.post.user_id) ||
                            profileMap.get(item.post.user_id),
                        moreProfiles.get(item.share.user_id)
                    )
                );

            } else {

                container.appendChild(
                    socialhubBuildPostArticle(
                        item.post,
                        profileMap
                    )
                );
            }
        });

        if (
            typeof socialhubApplyShareCounts ===
            "function"
        ) {

            socialhubApplyShareCounts(container);
        }

        if (typeof socialhubTrackPostViews === "function") {

            socialhubTrackPostViews(
                feedItems,
                container
            );
        }

        socialhubMaybeShowLoadMore();
    });

    container.appendChild(button);
}
document.addEventListener(
    "DOMContentLoaded",
    () => {

        setTimeout(
            async () => {

                await loadPostsWithUserNames();

            },
            1000
        );

    }
);
// ======================================================
// Friendio - Step 10.31.1
// Premium Feed Loading
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

    const postsContainer =
        document.getElementById("posts");

    if (!postsContainer) return;

    // Hide demo post immediately
    postsContainer.innerHTML = `
        <div class="socialhub-feed-loading">

            <div class="loading-post">

                <div class="loading-header">

                    <div class="loading-avatar"></div>

                    <div class="loading-user">

                        <div class="loading-line short"></div>

                        <div class="loading-line tiny"></div>

                    </div>

                </div>

                <div class="loading-content"></div>

                <div class="loading-content medium"></div>

                <div class="loading-actions">

                    <div></div>
                    <div></div>
                    <div></div>

                </div>

            </div>

        </div>
    `;

});

// ======================================================
// Friendio - POST AUDIENCE
// Public / Friends / Friends of Friends / Only Me
// ======================================================

const SOCIALHUB_AUDIENCE_LABELS = {
    public: "🌎 Public",
    friends: "👥 Friends",
    friends_of_friends: "🤝 Friends of Friends",
    only_me: "🔒 Only Me"
};

window.socialhubAudience =
    localStorage.getItem("socialhubAudience") ||
    "public";

function socialhubGetAudience() {

    const saved =
        localStorage.getItem(
            "socialhubAudience"
        );

    return SOCIALHUB_AUDIENCE_LABELS[saved]
        ? saved
        : "public";
}

function socialhubToggleAudienceMenu(event) {

    if (event) {
        event.stopPropagation();
    }

    const menu =
        document.getElementById(
            "audienceMenu"
        );

    if (!menu) {
        return;
    }

    menu.style.display =
        menu.style.display === "none"
            ? "flex"
            : "none";
}

function socialhubSetAudience(value) {

    if (!SOCIALHUB_AUDIENCE_LABELS[value]) {
        return;
    }

    window.socialhubAudience = value;

    localStorage.setItem(
        "socialhubAudience",
        value
    );

    const label =
        document.getElementById(
            "audienceLabel"
        );

    if (label) {
        label.textContent =
            SOCIALHUB_AUDIENCE_LABELS[value];
    }

    const menu =
        document.getElementById(
            "audienceMenu"
        );

    if (menu) {
        menu.style.display = "none";
    }

    document
        .querySelectorAll(
            ".audience-option"
        )
        .forEach(option => {

            option.classList.toggle(
                "selected",
                option.dataset.audience ===
                    value
            );
        });
}

function socialhubAudienceIcon(value) {

    switch (value || "public") {

        case "friends":
            return "👥";

        case "friends_of_friends":
            return "🤝";

        case "only_me":
            return "🔒";

        default:
            return "🌎";
    }
}

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const saved =
            socialhubGetAudience();

        window.socialhubAudience = saved;

        const label =
            document.getElementById(
                "audienceLabel"
            );

        if (label) {
            label.textContent =
                SOCIALHUB_AUDIENCE_LABELS[saved];
        }

        document
            .querySelectorAll(
                ".audience-option"
            )
            .forEach(option => {

                option.classList.toggle(
                    "selected",
                    option.dataset.audience ===
                        saved
                );
            });

        // Close menu on outside click
        document.addEventListener(
            "click",
            event => {

                const menu =
                    document.getElementById(
                        "audienceMenu"
                    );

                if (
                    menu &&
                    menu.style.display !==
                        "none" &&
                    !event.target.closest(
                        ".create-post-audience"
                    )
                ) {
                    menu.style.display =
                        "none";
                }
            }
        );
    }
);

async function socialhubFilterVisiblePosts(posts) {

    if (!posts || posts.length === 0) {
        return posts || [];
    }

    const {
        data: userData
    } = await db.auth.getUser();

    const me =
        userData && userData.user
            ? userData.user.id
            : null;

    if (!me) {

        // Not logged in: public posts only
        return posts.filter(
            post =>
                !post.audience ||
                post.audience === "public"
        );
    }

    try {

        const {
            data: fr1
        } = await db
            .from("friendships")
            .select(
                "requester_id, addressee_id"
            )
            .eq("requester_id", me)
            .eq("status", "accepted");

        const {
            data: fr2
        } = await db
            .from("friendships")
            .select(
                "requester_id, addressee_id"
            )
            .eq("addressee_id", me)
            .eq("status", "accepted");

        const friends = new Set();

        (fr1 || []).forEach(f => {
            friends.add(f.addressee_id);
        });

        (fr2 || []).forEach(f => {
            friends.add(f.requester_id);
        });

        const allowed = new Set(friends);

        // Blocked + deactivated users never appear
        const hiddenUsers = new Set();

        try {

            const {
                data: blockedData
            } = await db
                .from("blocks")
                .select("user_id")
                .eq("blocker_id", me);

            (blockedData || []).forEach(row => {

                hiddenUsers.add(row.user_id);
            });

            const authorIds =
                [...new Set(posts.map(p => p.user_id))].filter(
                    id => id && id !== me
                );

            if (authorIds.length > 0) {

                const {
                    data: deactivated
                } = await db
                    .from("profiles")
                    .select("id")
                    .in("id", authorIds)
                    .eq("deactivated", true);

                (deactivated || []).forEach(row => {

                    hiddenUsers.add(row.id);
                });
            }

        } catch (error) {

            console.error(
                "❌ Blocked/deactivated filter error:",
                error
            );
        }

        // Friends of friends (2-hop)
        const edgePool = [...friends];

        if (edgePool.length > 0) {

            const {
                data: foaf1
            } = await db
                .from("friendships")
                .select(
                    "requester_id, addressee_id"
                )
                .eq("status", "accepted")
                .in("requester_id", edgePool);

            const {
                data: foaf2
            } = await db
                .from("friendships")
                .select(
                    "requester_id, addressee_id"
                )
                .eq("status", "accepted")
                .in("addressee_id", edgePool);

            (foaf1 || []).forEach(f => {

                if (friends.has(f.requester_id)) {
                    allowed.add(f.addressee_id);
                }
            });

            (foaf2 || []).forEach(f => {

                if (friends.has(f.addressee_id)) {
                    allowed.add(f.requester_id);
                }
            });
        }

        return posts.filter(post => {

            const audience =
                post.audience || "public";

            if (post.user_id === me) {
                return true;
            }

            if (hiddenUsers.has(post.user_id)) {
                return false;
            }

            if (audience === "public") {
                return true;
            }

            if (audience === "only_me") {
                return false;
            }

            if (audience === "friends") {
                return friends.has(post.user_id);
            }

            if (audience === "friends_of_friends") {
                return allowed.has(post.user_id);
            }

            return true;
        });

    } catch (error) {

        console.error(
            "❌ Audience filter error:",
            error
        );

        return posts;
    }
}

// ======================================================
// Friendio - HEIC / HEIF → JPEG CONVERSION
// (iPhone photos don't display in most browsers)
// ======================================================

async function socialhubHeicToJpeg(file) {

    const isHeic =
        file &&
        (
            file.type === "image/heic" ||
            file.type === "image/heif" ||
            /\.(heic|heif)$/i.test(
                file.name || ""
            )
        );

    if (!isHeic) {
        return file;
    }

    if (typeof heic2any !== "function") {

        alert(
            "This iPhone HEIC photo can't be shown in browsers.\n\n" +
            "Please choose a JPG or PNG photo."
        );

        return null;
    }

    try {

        const output =
            await heic2any({
                blob: file,
                toType: "image/jpeg",
                quality: 0.92
            });

        const blob =
            Array.isArray(output)
                ? output[0]
                : output;

        const name =
            (file.name || "photo")
                .replace(/\.(heic|heif)$/i, "") +
            ".jpg";

        return new File(
            [blob],
            name,
            { type: blob.type || "image/jpeg" }
        );

    } catch (error) {

        console.error(
            "❌ HEIC conversion error:",
            error
        );

        alert(
            "Could not convert this HEIC photo.\n\n" +
            "Please choose a JPG or PNG photo."
        );

        return null;
    }
}