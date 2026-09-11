
// 1. إعدادات Firebase (استبدل الرابط أدناه برابط Realtime Database الخاص بك)
const firebaseConfig = {
    databaseURL: "https://el-ammar-egypt-default-rtdb.firebaseio.com"
};

// تهيئة التوصيل بـ Firebase
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = (typeof firebase !== 'undefined') ? firebase.database() : null;
const WHATSAPP_NUMBER = "201143348433";

// 2. دالة إظهار إشعارات سريعة (Toast)
function showToast(msg) {
    const toast = document.createElement("div");
    toast.className = "toast-msg";
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// 3. تشغيل الدوال عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", () => {
    if (!db) {
        console.error("لم يتم الاتصال بـ Firebase. تحقق من استدعاء المكتبات ورابط قاعدة البيانات.");
        return;
    }
    loadBricks();
    loadGovernorates();
    setupEventListeners();
});

// 4. تحميل وعرض أنواع الطوب (مع الصور)
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
                const imgUrl = item.imageUrl || 'https://via.placeholder.com/300x180?text=صورة+الطوب';

                // العرض في الكتالوج للزوار
                if (catalogGrid) {
                    catalogGrid.innerHTML += `
                        <div class="brick-card">
                            <img src="${imgUrl}" alt="${item.name}" class="brick-img">
                            <div class="brick-info">
                                <h3>${item.name}</h3>
                                <p>المقاس: ${item.size || 'قياسي'}</p>
                                <p class="price">السعر: ${item.price} ج.م / ألف</p>
                            </div>
                        </div>`;
                }

                // العرض في لوحة التحكم
                if (adminTable) {
                    adminTable.innerHTML += `
                        <tr>
                            <td><img src="${imgUrl}" style="width:50px; height:35px; object-fit:cover; border-radius:4px;"></td>
                            <td>${item.name}</td>
                            <td>${item.size || '-'}</td>
                            <td>${item.price} ج.م</td>
                            <td><button onclick="deleteBrick('${key}')" class="btn-danger">حذف</button></td>
                        </tr>`;
                }

                // العرض في قوائم الاختيار للطلب
                if (selectType) {
                    selectType.innerHTML += `<option value="${item.name}">${item.name}</option>`;
                }
            });
        }
    });
}

// 5. تحميل وعرض المحافظات
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
                            <td><button onclick="deleteGovernorate('${key}')" class="btn-danger">حذف</button></td>
                        </tr>`;
                }

                if (selectGov) {
                    selectGov.innerHTML += `<option value="${item.name}">${item.name}</option>`;
                }
            });
        }
    });
}

// 6. أحداث النماذج والإضافة
function setupEventListeners() {
    // إضافة طوب جديد (يدعم رابط الصورة)
    const addBrickForm = document.getElementById("addBrickForm");
    if (addBrickForm) {
        addBrickForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const name = document.getElementById("brickName")?.value;
            const size = document.getElementById("brickSize")?.value || "";
            const price = document.getElementById("brickPrice")?.value;
            const imageUrl = document.getElementById("brickImage")?.value || "";

            if (name && price) {
                db.ref('bricks').push({ name, size, price, imageUrl }).then(() => {
                    showToast("تمت إضافة نوع الطوب بنجاح ✨");
                    addBrickForm.reset();
                }).catch(err => alert("خطأ في الإضافة: " + err.message));
            }
        });
    }

    // إضافة محافظة جديدة
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

    // إرسال الطلب وحفظه + التوجيه للواتساب
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
                    `*الكمية:* ${payload.qty} ألف طوبة%0A` +
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
    if (confirm("هل أنت متأكد من حذف هذا النوع؟")) {
        db.ref(`bricks/${id}`).remove().then(() => showToast("تم الحذف بنجاح"));
    }
}

function deleteGovernorate(id) {
    if (confirm("هل أنت متأكد من حذف هذه المحافظة؟")) {
        db.ref(`governorates/${id}`).remove().then(() => showToast("تم الحذف بنجاح"));
    }
}
