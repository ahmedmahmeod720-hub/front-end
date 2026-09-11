// 1. إعدادات Firebase - ضع رابط Realtime Database الخاص بك هنا
const firebaseConfig = {
    databaseURL: "https://el-ammar-egypt-default-rtdb.firebaseio.com" // <-- استبدل الرابط ده برابطك الحقيقي من Firebase
};

// تهيئة التوصيل
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = (typeof firebase !== 'undefined') ? firebase.database() : null;
const WHATSAPP_NUMBER = "201143348433";

// 2. دالة إظهار الرسائل التوضيحية (Toast)
function showToast(msg) {
    const toast = document.createElement("div");
    toast.style.cssText = "position:fixed; bottom:20px; right:20px; background:#28a745; color:#fff; padding:12px 24px; border-radius:8px; z-index:9999; font-weight:bold; box-shadow:0 4px 10px rgba(0,0,0,0.3);";
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// 3. تشغيل المكونات بعد تحميل الصفحة
document.addEventListener("DOMContentLoaded", () => {
    if (!db) {
        console.error("Firebase لم يتم تحميله بنجاح، تأكد من روابط المكتبات في ملف HTML");
        return;
    }
    loadBricks();
    loadGovernorates();
    setupEventListeners();
});

// 4. جلب وعرض أنواع الطوب
function loadBricks() {
    db.ref('bricks').on('value', (snapshot) => {
        const data = snapshot.val();
        const catalogGrid = document.getElementById("catalogGrid");
        const adminTable = document.getElementById("adminBricksTable");
        const selectType = document.getElementById("reqType");

        if (catalogGrid) catalogGrid.innerHTML = "";
        if (adminTable) adminTable.innerHTML = "";
        if (selectType) selectType.innerHTML = `<option value="">اختر نوع الطوب...</option>`;

        if (data) {
            Object.keys(data).forEach(key => {
                const item = data[key];

                if (catalogGrid) {
                    catalogGrid.innerHTML += `
                        <div class="brick-card" style="border:1px solid #ddd; padding:15px; margin:10px; border-radius:8px; background:#fff;">
                            <h3>${item.name}</h3>
                            <p>المقاس: ${item.size || 'قياسي'}</p>
                            <p style="color:#d9534f; font-weight:bold;">السعر: ${item.price} ج.م / ألف</p>
                        </div>`;
                }

                if (adminTable) {
                    adminTable.innerHTML += `
                        <tr>
                            <td>${item.name}</td>
                            <td>${item.size || '-'}</td>
                            <td>${item.price} ج.م</td>
                            <td><button onclick="deleteBrick('${key}')" style="background:#dc3545; color:#fff; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">حذف</button></td>
                        </tr>`;
                }

                if (selectType) {
                    selectType.innerHTML += `<option value="${item.name}">${item.name}</option>`;
                }
            });
        }
    });
}

// 5. جلب وعرض المحافظات
function loadGovernorates() {
    db.ref('governorates').on('value', (snapshot) => {
        const data = snapshot.val();
        const adminGovTable = document.getElementById("adminGovTable");
        const selectGov = document.getElementById("reqGovernorate");

        if (adminGovTable) adminGovTable.innerHTML = "";
        if (selectGov) selectGov.innerHTML = `<option value="">اختر المحافظة...</option>`;

        if (data) {
            Object.keys(data).forEach(key => {
                const item = data[key];

                if (adminGovTable) {
                    adminGovTable.innerHTML += `
                        <tr>
                            <td>${item.name}</td>
                            <td>${item.price} ج.م</td>
                            <td><button onclick="deleteGovernorate('${key}')" style="background:#dc3545; color:#fff; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">حذف</button></td>
                        </tr>`;
                }

                if (selectGov) {
                    selectGov.innerHTML += `<option value="${item.name}">${item.name}</option>`;
                }
            });
        }
    });
}

// 6. ربط أزرار الإضافة والتسجيل
function setupEventListeners() {
    // إضافة طوب
    const addBrickForm = document.getElementById("addBrickForm");
    if (addBrickForm) {
        addBrickForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const name = document.getElementById("brickName")?.value;
            const size = document.getElementById("brickSize")?.value || "";
            const price = document.getElementById("brickPrice")?.value;

            if (name && price) {
                db.ref('bricks').push({ name, size, price }).then(() => {
                    showToast("تمت إضافة نوع الطوب بنجاح ✨");
                    addBrickForm.reset();
                }).catch(err => alert("خطأ في الإضافة: " + err.message));
            }
        });
    }

    // إضافة محافظة
    const addGovForm = document.getElementById("addGovForm");
    if (addGovForm) {
        addGovForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const name = document.getElementById("govName")?.value;
            const price = document.getElementById("govPrice")?.value;

            if (name && price) {
                db.ref('governorates').push({ name, price }).then(() => {
                    showToast("تمت إضافة المحافظة بنجاح ✨");
                    addGovForm.reset();
                }).catch(err => alert("خطأ في الإضافة: " + err.message));
            }
        });
    }

    // إرسال الطلب وحفظه + توجيه للواتساب
    const clientOrderForm = document.getElementById("clientOrderForm");
    if (clientOrderForm) {
        clientOrderForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const payload = {
                name: document.getElementById("reqName")?.value || "",
                phone: document.getElementById("reqPhone")?.value || "",
                type: document.getElementById("reqType")?.value || "",
                qty: document.getElementById("reqQty")?.value || "",
                governorate: document.getElementById("reqGovernorate")?.value || "",
                address: document.getElementById("reqAddress")?.value || "",
                date: new Date().toLocaleString('ar-EG')
            };

            db.ref('orders').push(payload).then(() => {
                const message = `*طلب توريد جديد من موقع العمار مصر 🧱*%0A%0A` +
                    `*اسم العميل:* ${payload.name}%0A` +
                    `*التليفون:* ${payload.phone}%0A` +
                    `*النوع:* ${payload.type}%0A` +
                    `*الكمية:* ${payload.qty} طوبة%0A` +
                    `*المحافظة:* ${payload.governorate}%0A` +
                    `*العنوان:* ${payload.address}`;

                window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
                showToast("تم تسجيل طلبك وتحويلك للواتساب ✨");
                clientOrderForm.reset();
            }).catch(err => alert("خطأ في حفظ الطلب: " + err.message));
        });
    }
}

// 7. دوال الحذف
function deleteBrick(id) {
    if (confirm("هل أنت تأكد من حذف هذا النوع؟")) {
        db.ref(`bricks/${id}`).remove().then(() => showToast("تم الحذف بنجاح"));
    }
}

function deleteGovernorate(id) {
    if (confirm("هل أنت تأكد من حذف هذه المحافظة؟")) {
        db.ref(`governorates/${id}`).remove().then(() => showToast("تم الحذف بنجاح"));
    }
}
