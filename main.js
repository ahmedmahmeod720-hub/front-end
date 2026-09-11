// إعدادات Firebase المباشرة
const firebaseConfig = {
    databaseURL: "https://el-ammar-egypt-default-rtdb.firebaseio.com"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

const WHATSAPP_NUMBER = "201143348433";

// البيانات الافتراضية
const defaultBricks = {
    "طوب أحمر مفرغ": { price: 1200, size: "25×12×6" },
    "طوب أحمر مصمت": { price: 1400, size: "25×12×6" },
    "طوب أسمنتي آلي مصمت": { price: 1800, size: "25×12×6" },
    "طوب أسمنتي مفرغ": { price: 2100, size: "40×20×20" },
    "طوب خفيف (إيتونج)": { price: 3200, size: "60×20×20" },
    "طوب حراري": { price: 4500, size: "23×11×6" }
};

const defaultGovs = {
    "القاهرة": 300, "الجيزة": 300, "القليوبية": 350, "الإسكندرية": 500,
    "الشرقية": 400, "الدقهلية": 450, "المنوفية": 400, "الغربية": 450,
    "كفر الشيخ": 500, "الفيوم": 450, "بني سويف": 500, "المنيا": 600,
    "أسيوط": 700, "سوهاج": 800, "قنا": 900, "الأقصر": 950,
    "أسوان": 1000, "البحيرة": 450, "الإسماعيلية": 450, "السويس": 450,
    "بورسعيد": 500, "دمياط": 500, "مطروح": 800, "البحر الأحمر": 900,
    "الوادي الجديد": 1000, "شمال سيناء": 800, "جنوب سيناء": 900
};

let currentBricks = {};
let currentGovs = {};
let adminCreds = { username: "admin", password: "123" };

function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `custom-toast ${type}`;
    toast.innerText = message;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function openCertModal(src) {
    document.getElementById("certModal").style.display = "flex";
    document.getElementById("imgModalTarget").src = src;
}
function closeCertModal() { document.getElementById("certModal").style.display = "none"; }

function showSection(sectionId, btn) {
    document.querySelectorAll(".portal-page").forEach(p => p.classList.remove("active-page"));
    document.querySelectorAll("#clientNav .nav-link").forEach(b => b.classList.remove("active"));
    document.getElementById(sectionId)?.classList.add("active-page");
    btn?.classList.add("active");
}

function showAdminTab(tabId, btn) {
    document.querySelectorAll(".admin-tab-content").forEach(t => t.classList.remove("active-tab"));
    document.querySelectorAll("#adminNav .nav-link").forEach(b => b.classList.remove("active"));
    document.getElementById(tabId)?.classList.add("active-tab");
    btn?.classList.add("active");
}

function openAdminModal() { document.getElementById("adminAuthModal").style.display = "flex"; }
function closeAdminModal() { document.getElementById("adminAuthModal").style.display = "none"; }

function showAdminDashboard() {
    closeAdminModal();
    document.getElementById("clientPortal").style.display = "none";
    document.getElementById("clientNav").style.display = "none";
    document.getElementById("adminPortal").style.display = "block";
    document.getElementById("adminNav").style.display = "flex";
    loadAdminData();
}

function logoutAdmin() {
    localStorage.removeItem('isLoggedIn');
    document.getElementById("adminPortal").style.display = "none";
    document.getElementById("adminNav").style.display = "none";
    document.getElementById("clientPortal").style.display = "block";
    document.getElementById("clientNav").style.display = "flex";
    showToast("تم تسجيل الخروج بنجاح 👁️");
}

// الاستماع اللحظي للبيانات من السيرفر
document.addEventListener("DOMContentLoaded", () => {
    // 1. جلب بيانات الدخول أولاً من السيرفر
    db.ref('adminCredentials').on('value', snapshot => {
        const val = snapshot.val();
        if(val) { 
            adminCreds = val; 
        } else { 
            db.ref('adminCredentials').set(adminCreds); 
        }
    });

    // 2. جلب أسعار الطوب
    db.ref('bricks').on('value', snapshot => {
        const val = snapshot.val();
        if(val) { currentBricks = val; } 
        else { db.ref('bricks').set(defaultBricks); currentBricks = defaultBricks; }
        renderClientViews();
        if(localStorage.getItem('isLoggedIn') === 'true') loadAdminData();
    });

    // 3. جلب المحافظات والمشال
    db.ref('governorates').on('value', snapshot => {
        const val = snapshot.val();
        if(val) { currentGovs = val; } 
        else { db.ref('governorates').set(defaultGovs); currentGovs = defaultGovs; }
        renderClientViews();
        if(localStorage.getItem('isLoggedIn') === 'true') loadAdminData();
    });

    if(localStorage.getItem('isLoggedIn') === 'true') {
        showAdminDashboard();
    }
});

function renderClientViews() {
    const grid = document.getElementById("pricesDisplayGrid");
    const catalogGovBody = document.getElementById("catalogFreightTableBody");
    const typeSelect = document.getElementById("reqType");
    const govSelect = document.getElementById("reqGovernorate");

    if(!grid) return;
    grid.innerHTML = ""; 
    if(typeSelect) typeSelect.innerHTML = ""; 
    if(govSelect) govSelect.innerHTML = "";
    if(catalogGovBody) catalogGovBody.innerHTML = "";

    // عرض الكتالوج وأسعار المشال المباشرة جنب كل نوع طوب
    const defaultGovFreight = currentGovs["القاهرة"] || 300; // مثال للمشال المبدئي

    for (let type in currentBricks) {
        const b = currentBricks[type];
        grid.innerHTML += `
            <div class="brick-card">
                <h4>🧱 ${type}</h4>
                <p>المقاس القياسي: <strong>${b.size || 'غير محدد'}</strong></p>
                <div class="price-details-box">
                    <p class="price-line">سعر البضاعة (للألف): <span class="highlight-text">${Number(b.price).toLocaleString()} ج.م</span></p>
                    <p class="price-line">متوسط المشال والنقل: <span class="highlight-text-freight">${Number(defaultGovFreight).toLocaleString()} ج.م</span></p>
                </div>
                <div class="price-tag-big">الإجمالي التقديري للألف: ${(Number(b.price) + Number(defaultGovFreight)).toLocaleString()} ج.م</div>
            </div>
        `;
        if(typeSelect) typeSelect.innerHTML += `<option value="${type}">${type}</option>`;
    }

    for (let gov in currentGovs) {
        if(govSelect) govSelect.innerHTML += `<option value="${gov}">${gov} (مشال: ${currentGovs[gov]} ج.م/ألف)</option>`;
        if(catalogGovBody) {
            catalogGovBody.innerHTML += `
                <tr>
                    <td><strong>📍 ${gov}</strong></td>
                    <td><span class="price-tag-small">${Number(currentGovs[gov]).toLocaleString()} ج.م</span></td>
                </tr>
            `;
        }
    }
    calculateOrderTotal();
}

function calculateOrderTotal() {
    const type = document.getElementById("reqType")?.value;
    const qty = parseFloat(document.getElementById("reqQty")?.value) || 0;
    const gov = document.getElementById("reqGovernorate")?.value;

    const bPrice = currentBricks[type]?.price || 0;
    const gFreight = currentGovs[gov] || 0;

    const total = (qty / 1000) * (parseFloat(bPrice) + parseFloat(gFreight));
    if(document.getElementById("estimatedPrice")) {
        document.getElementById("estimatedPrice").value = total.toLocaleString() + " ج.م";
    }
}

// إرسال طلب جديد
document.getElementById("clientOrderForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const payload = {
        name: document.getElementById("reqName").value,
        phone: document.getElementById("reqPhone").value,
        type: document.getElementById("reqType").value,
        qty: document.getElementById("reqQty").value,
        governorate: document.getElementById("reqGovernorate").value,
        address: document.getElementById("reqAddress").value,
        total: document.getElementById("estimatedPrice").value,
        date: new Date().toLocaleString('ar-EG')
    };

    db.ref('orders').push(payload).then(() => {
        const message = `*طلب توريد جديد من موقع العمار مصر 🧱*%0A%0A` +
            `*اسم العميل:* ${payload.name}%0A` +
            `*التليفون:* ${payload.phone}%0A` +
            `*النوع:* ${payload.type}%0A` +
            `*الكمية:* ${payload.qty} طوبة%0A` +
            `*المحافظة:* ${payload.governorate}%0A` +
            `*العنوان:* ${payload.address}%0A` +
            `*الإجمالي:* ${payload.total}`;

        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
        showToast("تم تسجيل طلبك بنجاح ✨");
        e.target.reset();
    });
});

// عمليات الإدارة والربط بالسيرفر
function handleAddNewBrick(e) {
    e.preventDefault();
    const name = document.getElementById("newBrickName").value;
    const price = document.getElementById("newBrickPrice").value;
    const size = document.getElementById("newBrickSize").value;
    db.ref(`bricks/${name}`).set({ price, size }).then(() => {
        showToast("تم إضافة الطوب للكتالوج ✅");
        e.target.reset();
    });
}

function handleAddNewGov(e) {
    e.preventDefault();
    const name = document.getElementById("newGovName").value;
    const freight = document.getElementById("newGovFreight").value;
    db.ref(`governorates/${name}`).set(freight).then(() => {
        showToast("تم إضافة المحافظة ✅");
        e.target.reset();
    });
}

function saveBrickData(name, price, size) {
    db.ref(`bricks/${name}`).set({ price, size }).then(() => {
        showToast("تم حفظ السعر وتحديثه على السيرفر ✅");
    });
}

function saveGovData(name, freight) {
    db.ref(`governorates/${name}`).set(freight).then(() => {
        showToast("تم تعديل سعر المشال بنجاح ✅");
    });
}

function deleteBrick(name) {
    if(confirm(`هل أنت تأكد من حذف ${name}؟`)) {
        db.ref(`bricks/${name}`).remove().then(() => showToast("تم الحذف ❌", "error"));
    }
}

function deleteGov(name) {
    if(confirm(`هل أنت تأكد من حذف ${name}؟`)) {
        db.ref(`governorates/${name}`).remove().then(() => showToast("تم الحذف ❌", "error"));
    }
}

function loadAdminData() {
    const pContainer = document.getElementById("adminPriceControls");
    if(pContainer) {
        pContainer.innerHTML = "";
        for(let type in currentBricks) {
            const b = currentBricks[type];
            pContainer.innerHTML += `
                <div class="form-group full-width" style="margin-bottom:15px; background: rgba(255,255,255,0.03); padding: 10px; border-radius: 8px;">
                    <label style="color:var(--accent); font-weight:bold; font-size: 1rem;">🧱 ${type}</label>
                    <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top: 5px;">
                        <input type="number" id="price_${type}" value="${b.price}" placeholder="السعر لكل ألف">
                        <input type="text" id="size_${type}" value="${b.size||''}" placeholder="المقاس">
                        <button class="btn-submit" onclick="saveBrickData('${type}', document.getElementById('price_${type}').value, document.getElementById('size_${type}').value)">حفظ 💾</button>
                        <button class="btn-submit btn-cancel" onclick="deleteBrick('${type}')">حذف ❌</button>
                    </div>
                </div>
            `;
        }
    }

    const gBody = document.getElementById("adminFreightTableBody");
    if(gBody) {
        gBody.innerHTML = "";
        for(let gov in currentGovs) {
            gBody.innerHTML += `
                <tr>
                    <td><strong>📍 ${gov}</strong></td>
                    <td><input type="number" id="gov_${gov}" value="${currentGovs[gov]}" style="width: 100px;"> ج.م</td>
                    <td>
                        <button class="btn-submit" onclick="saveGovData('${gov}', document.getElementById('gov_${gov}').value)">حفظ 💾</button>
                        <button class="btn-submit btn-cancel" onclick="deleteGov('${gov}')">حذف ❌</button>
                    </td>
                </tr>
            `;
        }
    }

    db.ref('orders').on('value', snapshot => {
        const orders = snapshot.val();
        const oBody = document.getElementById("adminOrdersTableBody");
        if(oBody) {
            oBody.innerHTML = "";
            let count = 0;
            if(orders) {
                for(let key in orders) {
                    count++;
                    const o = orders[key];
                    oBody.innerHTML += `
                        <tr>
                            <td>${o.name}</td>
                            <td>${o.phone}</td>
                            <td>${o.type} (${o.qty})</td>
                            <td>${o.governorate} - ${o.address}</td>
                            <td>${o.total}</td>
                            <td><button class="btn-submit btn-cancel" onclick="db.ref('orders/${key}').remove()">حذف</button></td>
                        </tr>
                    `;
                }
            }
            document.getElementById("totalOrdersCount").innerText = count;
        }
    });
}

// تسجيل الدخول مع مطابقة بيانات السيرفر
document.getElementById('loginForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const u = document.getElementById('loginUsername').value;
    const p = document.getElementById('loginPassword').value;

    if(u === adminCreds.username && p === adminCreds.password) {
        localStorage.setItem('isLoggedIn', 'true');
        showToast("تم تسجيل الدخول بنجاح! ✨");
        showAdminDashboard();
    } else {
        showToast("اسم المستخدم أو كلمة المرور غير صحيحة", "error");
    }
});

// التغيير الحقيقي المباشر لبيانات الدخول على السيرفر
document.getElementById('changePasswordForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const newU = document.getElementById('newUsername').value;
    const newP = document.getElementById('newPassword').value;

    db.ref('adminCredentials').set({ username: newU, password: newP }).then(() => {
        adminCreds = { username: newU, password: newP };
        showToast("تم تحديث بيانات الدخول وحفظها على السيرفر بنجاح! 💾");
        e.target.reset();
    }).catch(err => {
        showToast("حدث خطأ أثناء التحديث على السيرفر", "error");
    });
});
