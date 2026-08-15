// ======================================================
// SOCIALHUB - MARKETPLACE (🛒 Buy & Sell)
// ======================================================
// marketplace.html -> listing grid + create + detail
// Uses marketplace_items table, images in post-images bucket
// ======================================================

(function socialhubMarketInjectStyles() {

    const style =
        document.createElement("style");

    style.textContent = `

.market-main {
    max-width: 900px;
    margin: 0 auto;
    padding: 18px 14px 40px;
}

.market-head {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 4px;
}

.market-head .market-head-icon {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: #f1dfff;
    color: #9d00ff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
}

.market-main h1 {
    margin: 0;
    font-size: 22px;
}

.market-main .market-sub {
    margin: 0 0 16px 56px;
    color: #65676b;
    font-size: 13.5px;
}

.market-top-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 12px;
}

.market-search {
    flex: 1;
    min-width: 220px;
    max-width: 380px;
    display: flex;
    align-items: center;
    gap: 8px;
    background: #fff;
    border-radius: 22px;
    padding: 10px 16px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    color: #65676b;
}

.market-search input {
    border: none;
    outline: none;
    flex: 1;
    font-size: 14px;
    font-family: inherit;
    background: transparent;
}

.market-cats {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 14px;
    align-items: center;
}

.market-toolbar {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    align-items: center;
    margin-left: auto;
}

.market-mine-chip {
    border: 1px solid #9d00ff;
    background: #fff;
    color: #9d00ff;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: 0.12s;
    font-family: inherit;
    display: inline-flex;
    align-items: center;
    gap: 6px;
}

.market-mine-chip.active {
    background: #9d00ff;
    color: #fff;
}

.market-price-select {
    border: 1px solid #d4d7dd;
    background: #fff;
    color: #1c1e21;
    padding: 8px 12px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    outline: none;
}

body.dark-mode .market-mine-chip {
    background: #242526;
}

body.dark-mode .market-mine-chip.active {
    background: #9d00ff;
}

body.dark-mode .market-price-select {
    background: #242526;
    border-color: #3a3b3c;
    color: #e4e6eb;
}

.market-cat-chip {
    border: 1px solid #d4d7dd;
    background: #fff;
    color: #1c1e21;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: 0.12s;
    font-family: inherit;
}

.market-cat-chip:hover {
    background: #f0f2f5;
}

.market-cat-chip.active {
    background: #1877f2;
    border-color: #1877f2;
    color: #fff;
}

.market-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 14px;
}

.market-card {
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    cursor: pointer;
    transition: 0.15s;
    display: flex;
    flex-direction: column;
}

.market-card:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.14);
    transform: translateY(-1px);
}

.market-card-img {
    width: 100%;
    aspect-ratio: 4 / 3;
    object-fit: cover;
    display: block;
    background: #e4e6eb;
    position: relative;
}

.market-card-noimg {
    width: 100%;
    aspect-ratio: 4 / 3;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #9d00ff, #ff5e62);
    color: #fff;
    font-size: 40px;
}

.market-card-sold-badge {
    position: absolute;
    top: 8px;
    left: 8px;
    background: #e41e3f;
    color: #fff;
    font-size: 11px;
    font-weight: 800;
    padding: 4px 10px;
    border-radius: 12px;
    letter-spacing: 0.5px;
}

.market-card-body {
    padding: 12px 14px 14px;
}

.market-card-price {
    font-size: 17px;
    font-weight: 800;
    color: #1877f2;
    margin: 0 0 2px;
}

.market-card-title {
    margin: 0 0 8px;
    font-size: 14px;
    font-weight: 600;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.market-card-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 12px;
    color: #65676b;
}

.market-card-meta .cat-pill {
    color: #9d00ff;
    font-weight: 700;
}

.market-card-sold-overlay {
    filter: grayscale(1);
    opacity: 0.6;
}

.market-card-sold .market-card-body {
    position: relative;
}

/* Detail modal */
.market-modal {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.55);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    padding: 20px;
}

.market-modal-box {
    background: #fff;
    border-radius: 12px;
    width: 100%;
    max-width: 560px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.3);
}

.market-modal-img {
    width: 100%;
    aspect-ratio: 4 / 3;
    object-fit: cover;
    display: block;
    background: #e4e6eb;
}

.market-modal-noimg {
    width: 100%;
    aspect-ratio: 4 / 3;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #9d00ff, #ff5e62);
    color: #fff;
    font-size: 56px;
}

.market-modal-body {
    padding: 16px 20px 20px;
}

.market-modal-price {
    font-size: 24px;
    font-weight: 800;
    color: #1877f2;
    margin: 0 0 4px;
}

.market-modal-title {
    margin: 0 0 8px;
    font-size: 18px;
}

.market-modal-tags {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 12px;
}

.market-modal-tags span {
    font-size: 12px;
    font-weight: 700;
    padding: 5px 12px;
    border-radius: 14px;
    background: #f0f2f5;
    color: #65676b;
}

.market-modal-tags .cat {
    background: #f1dfff;
    color: #9d00ff;
}

.market-modal-desc {
    font-size: 14px;
    color: #65676b;
    margin: 0 0 14px;
    white-space: pre-wrap;
}

.market-seller-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px;
    border-radius: 10px;
    background: #f0f2f5;
    margin-bottom: 14px;
    cursor: pointer;
}

.market-seller-row:hover {
    background: #e4e6eb;
}

.market-seller-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
    background: #1877f2;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 17px;
    font-weight: 800;
    flex-shrink: 0;
}

.market-seller-row b {
    display: block;
    font-size: 14px;
}

.market-seller-row small {
    color: #65676b;
    font-size: 12px;
}

.market-modal-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
}

.market-modal-actions .socialhub-create-btn {
    flex: 1;
    justify-content: center;
}

.market-msg-btn {
    border: none;
    background: #e4e6eb;
    color: #1c1e21;
    padding: 11px 18px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    justify-content: center;
    transition: 0.12s;
    font-family: inherit;
}

.market-msg-btn:hover {
    background: #d8dadf;
}

.market-sold-btn {
    border: none;
    background: #31a24c;
    color: #fff;
    padding: 11px 18px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    justify-content: center;
    transition: 0.12s;
    font-family: inherit;
}

.market-sold-btn:hover {
    background: #2b8c42;
}

body.dark-mode .market-search,
body.dark-mode .market-card,
body.dark-mode .market-modal-box,
body.dark-mode .market-cat-chip {
    background: #242526;
}

body.dark-mode .market-card-title,
body.dark-mode .market-main h1,
body.dark-mode .market-modal-title {
    color: #e4e6eb;
}

body.dark-mode .market-main .market-sub,
body.dark-mode .market-card-meta,
body.dark-mode .market-modal-desc,
body.dark-mode .market-seller-row small {
    color: #b0b3b8;
}

body.dark-mode .market-cat-chip {
    border-color: #3a3b3c;
    color: #e4e6eb;
}

body.dark-mode .market-cat-chip:hover {
    background: #3a3b3c;
}

body.dark-mode .market-cat-chip.active {
    background: #1877f2;
    color: #fff;
}

body.dark-mode .market-search input {
    color: #e4e6eb;
}

body.dark-mode .market-seller-row {
    background: #3a3b3c;
}

body.dark-mode .market-seller-row:hover {
    background: #4e4f50;
}

body.dark-mode .market-modal-tags span {
    background: #3a3b3c;
    color: #b0b3b8;
}

body.dark-mode .market-msg-btn {
    background: #3a3b3c;
    color: #e4e6eb;
}

body.dark-mode .market-msg-btn:hover {
    background: #4e4f50;
}
`;

    document.head.appendChild(style);
})();


// ======================================================
// 1. HELPERS
// ======================================================

const SOCIALHUB_MARKET_CATEGORIES = [
    "Electronics",
    "Vehicles",
    "Home & Garden",
    "Clothing",
    "Toys",
    "Sports",
    "Books",
    "Other"
];

const SOCIALHUB_MARKET_CONDITIONS = [
    "New",
    "Like New",
    "Good",
    "Fair",
    "Used"
];

let socialhubMarketState = {
    items: [],
    sellers: {},
    category: "All",
    query: "",
    mine: false,
    priceMax: null,
    me: null
};


function socialhubMarketEscape(text) {

    const div =
        document.createElement("div");

    div.innerText =
        text || "";

    return div.innerHTML;
}


async function socialhubMarketGetMe() {

    const {
        data,
        error
    } = await db.auth.getUser();

    if (error || !data.user) {
        return null;
    }

    return data.user;
}


function socialhubMarketToast(message) {

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


function socialhubMarketFormatPrice(price) {

    const num =
        parseFloat(price) || 0;

    if (Number.isInteger(num)) {

        return "৳" + num.toLocaleString();
    }

    return "৳" + num.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}


function socialhubMarketTimeAgo(dateStr) {

    const diff =
        Date.now() - new Date(dateStr).getTime();

    const mins =
        Math.floor(diff / 60000);

    if (mins < 1) {
        return "just now";
    }

    if (mins < 60) {
        return mins + "m ago";
    }

    const hours =
        Math.floor(mins / 60);

    if (hours < 24) {
        return hours + "h ago";
    }

    const days =
        Math.floor(hours / 24);

    if (days < 7) {
        return days + "d ago";
    }

    return new Date(dateStr).toLocaleDateString();
}


// ======================================================
// 2. CATEGORY CHIPS
// ======================================================

function socialhubMarketRenderCats() {

    const box =
        document.getElementById("marketCats");

    if (!box) {
        return;
    }

    const chips =
        ["All", ...SOCIALHUB_MARKET_CATEGORIES];

    box.innerHTML =
        chips.map(cat => `
            <button
                class="market-cat-chip ${socialhubMarketState.category === cat && !socialhubMarketState.mine ? "active" : ""}"
                onclick="socialhubMarketSetCat('${socialhubMarketEscape(cat).replace(/'/g, "\\'")}')"
            >
                ${socialhubMarketEscape(cat)}
            </button>
        `).join("");

    // Toolbar: My Listings toggle + price filter
    const toolbar =
        document.createElement("div");

    toolbar.className = "market-toolbar";

    toolbar.innerHTML = `
        <button
            type="button"
            class="market-mine-chip ${socialhubMarketState.mine ? "active" : ""}"
            onclick="socialhubMarketToggleMine()"
        >
            <i class="fa-solid fa-tag"></i>
            My Listings
        </button>

        <select
            class="market-price-select"
            onchange="socialhubMarketSetPrice(this.value)"
            aria-label="Max price"
        >
            <option value="">Any price</option>
            <option value="25" ${socialhubMarketState.priceMax === 25 ? "selected" : ""}>Up to $25</option>
            <option value="50" ${socialhubMarketState.priceMax === 50 ? "selected" : ""}>Up to $50</option>
            <option value="100" ${socialhubMarketState.priceMax === 100 ? "selected" : ""}>Up to $100</option>
            <option value="250" ${socialhubMarketState.priceMax === 250 ? "selected" : ""}>Up to $250</option>
            <option value="500" ${socialhubMarketState.priceMax === 500 ? "selected" : ""}>Up to $500</option>
            <option value="1000" ${socialhubMarketState.priceMax === 1000 ? "selected" : ""}>Up to $1000</option>
        </select>
    `;

    box.appendChild(toolbar);
}


function socialhubMarketToggleMine() {

    socialhubMarketState.mine =
        !socialhubMarketState.mine;

    socialhubMarketRenderCats();

    socialhubMarketRenderGrid();
}


function socialhubMarketSetPrice(value) {

    socialhubMarketState.priceMax =
        value ? Number(value) : null;

    socialhubMarketRenderGrid();
}


function socialhubMarketSetCat(cat) {

    socialhubMarketState.category = cat;

    socialhubMarketRenderCats();

    socialhubMarketRenderGrid();
}


function socialhubMarketFilter() {

    socialhubMarketState.query =
        document.getElementById("marketSearch").value.trim().toLowerCase();

    socialhubMarketRenderGrid();
}


// ======================================================
// 3. LIST PAGE
// ======================================================

async function socialhubMarketLoad() {

    const grid =
        document.getElementById("marketGrid");

    if (!grid) {
        return;
    }

    const me =
        await socialhubMarketGetMe();

    if (!me) {

        location.href = "../auth/index.html";

        return;
    }

    socialhubMarketState.me = me.id;

    const {
        data: items,
        error
    } = await db
        .from("marketplace_items")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {

        console.error("Marketplace load error:", error);

        grid.innerHTML =
            '<p class="empty-message" style="grid-column:1/-1;">Could not load marketplace.</p>';

        return;
    }

    socialhubMarketState.items = items || [];

    const sellerIds =
        [...new Set(
            socialhubMarketState.items.map(i => i.seller_id)
        )];

    socialhubMarketState.sellers = {};

    if (sellerIds.length > 0) {

        const {
            data: profiles
        } = await db
            .from("profiles")
            .select("id, full_name, avatar_url")
            .in("id", sellerIds);

        (profiles || []).forEach(p => {

            socialhubMarketState.sellers[p.id] = p;
        });
    }

    socialhubMarketRenderCats();

    socialhubMarketRenderGrid();
}


function socialhubMarketVisibleItems() {

    const { items, category, query, mine, priceMax, me } =
        socialhubMarketState;

    return items.filter(item => {

        if (mine) {

            if (!me || item.seller_id !== me) {
                return false;
            }
        }

        if (category !== "All" && item.category !== category) {
            return false;
        }

        if (priceMax !== null) {

            const price =
                Number(item.price);

            if (!isFinite(price) || price > priceMax) {
                return false;
            }
        }

        if (query) {

            const hay =
                (item.title + " " + (item.description || "")).toLowerCase();

            if (!hay.includes(query)) {
                return false;
            }
        }

        return true;
    });
}


function socialhubMarketCardHTML(item) {

    const img =
        item.image_url
            ? `<img class="market-card-img" src="${socialhubMarketEscape(item.image_url)}" alt="">`
            : `<div class="market-card-noimg"><i class="fa-solid fa-store"></i></div>`;

    const soldBadge =
        item.sold
            ? '<span class="market-card-sold-badge">SOLD</span>'
            : "";

    const soldClass =
        item.sold ? " market-card-sold" : "";

    return `
        <div class="market-card${soldClass}" onclick="socialhubMarketOpenDetail('${item.id}')">

            <div style="position:relative;">
                ${img}
                ${soldBadge}
            </div>

            <div class="market-card-body${item.sold ? " market-card-sold-overlay" : ""}">

                <p class="market-card-price">${socialhubMarketFormatPrice(item.price)}</p>

                <p class="market-card-title">${socialhubMarketEscape(item.title)}</p>

                <div class="market-card-meta">
                    <span class="cat-pill">${socialhubMarketEscape(item.category || "Other")}</span>
                    <span>${socialhubMarketTimeAgo(item.created_at)}</span>
                </div>

            </div>

        </div>
    `;
}


function socialhubMarketRenderGrid() {

    const grid =
        document.getElementById("marketGrid");

    if (!grid) {
        return;
    }

    const visible =
        socialhubMarketVisibleItems();

    if (visible.length === 0) {

        grid.innerHTML = `
            <p class="empty-message" style="grid-column:1/-1;">
                No listings found.
            </p>
        `;

        return;
    }

    grid.innerHTML =
        visible.map(socialhubMarketCardHTML).join("");
}


// ======================================================
// 4. CREATE LISTING
// ======================================================

function socialhubMarketOpenCreate() {

    const modal =
        document.createElement("div");

    modal.className = "market-modal";

    modal.innerHTML = `
        <div class="market-modal-box">

            <div class="cr-head" style="padding:16px 18px;border-bottom:1px solid #e4e6eb;display:flex;align-items:center;justify-content:space-between;">

                <h2 style="margin:0;font-size:18px;display:flex;align-items:center;gap:8px;">
                    <i class="fa-solid fa-store" style="color:#9d00ff;"></i>
                    Sell Something
                </h2>

                <button class="cr-close" type="button" title="Close" style="border:none;background:#e4e6eb;width:32px;height:32px;border-radius:50%;cursor:pointer;">
                    <i class="fa-solid fa-xmark"></i>
                </button>

            </div>

            <div class="cr-body" style="padding:16px 18px;">

                <label>Photo</label>

                <div class="market-pick-row" style="display:flex;align-items:center;gap:10px;margin-bottom:4px;">

                    <label style="cursor:pointer;background:#f0f2f5;color:#1c1e21;padding:9px 16px;border-radius:18px;font-size:13px;font-weight:700;display:inline-flex;align-items:center;gap:7px;">
                        <i class="fa-solid fa-image"></i>
                        Choose Photo
                        <input type="file" accept="image/*" style="display:none;" onchange="socialhubMarketPickImage(this)">
                    </label>

                    <img id="marketPickPreview" alt="" style="display:none;width:52px;height:52px;border-radius:8px;object-fit:cover;">

                </div>

                <label>Title</label>
                <input type="text" id="mkTitle" placeholder="What are you selling?" maxlength="80">

                <label>Price (৳)</label>
                <input type="number" id="mkPrice" placeholder="e.g. 1500" min="0">

                <div style="display:flex;gap:12px;">

                    <div style="flex:1;">

                        <label>Category</label>

                        <select id="mkCategory" style="width:100%;box-sizing:border-box;padding:11px 13px;border:1px solid #d4d7dd;border-radius:8px;font-size:14px;font-family:inherit;outline:none;background:#fff;">
                            ${SOCIALHUB_MARKET_CATEGORIES.map(c => `<option>${socialhubMarketEscape(c)}</option>`).join("")}
                        </select>

                    </div>

                    <div style="flex:1;">

                        <label>Condition</label>

                        <select id="mkCondition" style="width:100%;box-sizing:border-box;padding:11px 13px;border:1px solid #d4d7dd;border-radius:8px;font-size:14px;font-family:inherit;outline:none;background:#fff;">
                            ${SOCIALHUB_MARKET_CONDITIONS.map(c => `<option>${socialhubMarketEscape(c)}</option>`).join("")}
                        </select>

                    </div>

                </div>

                <label>Description</label>
                <textarea id="mkDesc" rows="3" placeholder="Describe your item..."></textarea>

            </div>

            <div class="cr-actions" style="padding:14px 18px;border-top:1px solid #e4e6eb;display:flex;gap:10px;justify-content:flex-end;">

                <button class="socialhub-cr-cancel" type="button">Cancel</button>

                <button class="socialhub-create-btn" type="button">
                    <i class="fa-solid fa-tags"></i>
                    Publish Listing
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

            const title =
                modal.querySelector("#mkTitle").value.trim();

            const price =
                parseFloat(modal.querySelector("#mkPrice").value);

            const category =
                modal.querySelector("#mkCategory").value;

            const condition =
                modal.querySelector("#mkCondition").value;

            const description =
                modal.querySelector("#mkDesc").value.trim();

            if (!title) {

                socialhubMarketToast("Title is required.");

                return;
            }

            if (isNaN(price) || price < 0) {

                socialhubMarketToast("Enter a valid price.");

                return;
            }

            const me =
                await socialhubMarketGetMe();

            if (!me) {

                socialhubMarketToast("Please login first.");

                return;
            }

            const createBtn =
                modal.querySelector(".socialhub-create-btn");

            createBtn.disabled = true;

            createBtn.textContent = "Publishing...";

            let imageUrl = null;

            const fileInput =
                modal.querySelector('input[type="file"]');

            if (fileInput.files && fileInput.files.length > 0) {

                const file =
                    fileInput.files[0];

                const path =
                    `market/${me.id}/${Date.now()}-${file.name}`;

                const { error: uploadError } =
                    await db.storage
                        .from("post-images")
                        .upload(path, file);

                if (uploadError) {

                    alert("Image upload failed: " + uploadError.message);

                    createBtn.disabled = false;

                    createBtn.textContent = "Publish Listing";

                    return;
                }

                const { data: pub } =
                    db.storage
                        .from("post-images")
                        .getPublicUrl(path);

                imageUrl = pub.publicUrl;
            }

            const { error } =
                await db
                    .from("marketplace_items")
                    .insert({
                        seller_id: me.id,
                        title,
                        price,
                        category,
                        condition,
                        description,
                        image_url: imageUrl
                    });

            createBtn.disabled = false;

            createBtn.textContent = "Publish Listing";

            if (error) {

                alert("Could not create listing: " + error.message);

                return;
            }

            modal.remove();

            socialhubMarketToast("✅ Listing published!");

            socialhubMarketLoad();
        });
}


function socialhubMarketPickImage(input) {

    const preview =
        document.getElementById("marketPickPreview");

    if (!input.files || input.files.length === 0) {

        if (preview) {
            preview.style.display = "none";
        }

        return;
    }

    const file =
        input.files[0];

    const url =
        URL.createObjectURL(file);

    if (preview) {

        preview.src = url;

        preview.style.display = "block";
    }
}


// ======================================================
// 5. DETAIL MODAL
// ======================================================

async function socialhubMarketOpenDetail(itemId) {

    const me =
        await socialhubMarketGetMe();

    if (!me) {
        return;
    }

    const {
        data: item,
        error
    } = await db
        .from("marketplace_items")
        .select("*")
        .eq("id", itemId)
        .single();

    if (error || !item) {

        socialhubMarketToast("Listing not found.");

        return;
    }

    let seller =
        socialhubMarketState.sellers[item.seller_id] || null;

    if (!seller) {

        const {
            data: p
        } = await db
            .from("profiles")
            .select("id, full_name, avatar_url")
            .eq("id", item.seller_id)
            .single();

        seller = p || null;
    }

    const isMine =
        item.seller_id === me.id;

    const modal =
        document.createElement("div");

    modal.className = "market-modal";

    const img =
        item.image_url
            ? `<img class="market-modal-img" src="${socialhubMarketEscape(item.image_url)}" alt="">`
            : `<div class="market-modal-noimg"><i class="fa-solid fa-store"></i></div>`;

    const sellerAvatar =
        seller && seller.avatar_url
            ? `<img class="market-seller-avatar" src="${socialhubMarketEscape(seller.avatar_url)}" alt="">`
            : `<div class="market-seller-avatar">${socialhubMarketEscape((seller && seller.full_name || "U").charAt(0).toUpperCase())}</div>`;

    modal.innerHTML = `
        <div class="market-modal-box">

            <div style="position:relative;">
                ${img}
                ${item.sold ? '<span class="market-card-sold-badge" style="font-size:13px;">SOLD</span>' : ""}
            </div>

            <div class="market-modal-body">

                <p class="market-modal-price">
                    ${socialhubMarketFormatPrice(item.price)}
                    ${item.sold ? '<span style="font-size:13px;color:#e41e3f;font-weight:800;margin-left:8px;">SOLD</span>' : ""}
                </p>

                <h2 class="market-modal-title">${socialhubMarketEscape(item.title)}</h2>

                <div class="market-modal-tags">
                    <span class="cat">${socialhubMarketEscape(item.category || "Other")}</span>
                    <span>${socialhubMarketEscape(item.condition || "New")}</span>
                    <span>Posted ${socialhubMarketTimeAgo(item.created_at)}</span>
                </div>

                <p class="market-modal-desc">
                    ${socialhubMarketEscape(item.description || "No description provided.")}
                </p>

                <div
                    class="market-seller-row"
                    onclick="location.href='../profile/user-profile.html?user=${item.seller_id}'"
                >
                    ${sellerAvatar}
                    <div>
                        <b>${socialhubMarketEscape(seller ? seller.full_name : "Someone")}</b>
                        <small>Seller${isMine ? " · That's you!" : ""}</small>
                    </div>
                </div>

                <div class="market-modal-actions">

                    ${
                        isMine
                            ? `
                                ${!item.sold
                                    ? `
                                        <button class="market-sold-btn" type="button">
                                            <i class="fa-solid fa-check"></i>
                                            Mark as Sold
                                        </button>
                                    `
                                    : ""}
                                <button class="market-msg-btn market-del-btn" type="button" style="color:#e41e3f;">
                                    <i class="fa-solid fa-trash-can"></i>
                                    Delete Listing
                                </button>
                            `
                            : `
                                <button class="socialhub-create-btn market-chat-btn" type="button">
                                    <i class="fa-solid fa-comment-dots"></i>
                                    Message Seller
                                </button>
                            `
                    }

                </div>

            </div>

        </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener("click", event => {

        if (event.target === modal) {
            modal.remove();
        }
    });

    const closeBtn =
        modal.querySelector(".cr-close");

    if (!closeBtn) {

        const x = document.createElement("button");

        x.className = "cr-close";

        x.type = "button";

        x.title = "Close";

        x.style.cssText =
            "position:absolute;top:10px;right:10px;border:none;background:rgba(0,0,0,0.55);color:#fff;width:34px;height:34px;border-radius:50%;cursor:pointer;z-index:2;";

        x.innerHTML = '<i class="fa-solid fa-xmark"></i>';

        modal.querySelector(".market-modal-box").appendChild(x);

        x.addEventListener("click", () => modal.remove());

    } else {

        closeBtn.addEventListener("click", () => modal.remove());
    }

    const soldBtn =
        modal.querySelector(".market-sold-btn");

    if (soldBtn) {

        soldBtn.addEventListener("click", async () => {

            const { error } =
                await db
                    .from("marketplace_items")
                    .update({ sold: true })
                    .eq("id", item.id);

            if (error) {

                alert("Could not update: " + error.message);

                return;
            }

            modal.remove();

            socialhubMarketToast("✅ Marked as sold!");

            socialhubMarketLoad();
        });
    }

    const delBtn =
        modal.querySelector(".market-del-btn");

    if (delBtn) {

        delBtn.addEventListener("click", async () => {

            if (!confirm("Delete this listing?")) {
                return;
            }

            const { error } =
                await db
                    .from("marketplace_items")
                    .delete()
                    .eq("id", item.id);

            if (error) {

                alert("Could not delete: " + error.message);

                return;
            }

            modal.remove();

            socialhubMarketToast("Listing deleted.");

            socialhubMarketLoad();
        });
    }

    const chatBtn =
        modal.querySelector(".market-chat-btn");

    if (chatBtn) {

        chatBtn.addEventListener("click", () => {

            location.href =
                `../messages/index.html?thread=${item.seller_id}`;
        });
    }
}


// ======================================================
// 6. INIT
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

    socialhubMarketLoad();
});