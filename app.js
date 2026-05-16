const SUPABASE_URL = 'https://jdlaajmsafjuouafhndg.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_nu7rkhwKsLeg4see5dT4VQ_fQVnx5mh'; 
const SUBJECT_ID = "Trigonometry_v2"; // تغيير المعرف لبدء سجل جديد نظيف

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

// معرف فريد للجهاز
let userUID = localStorage.getItem('trig_user_id') || crypto.randomUUID();
localStorage.setItem('trig_user_id', userUID);

let seenIds = [], curIdx = 0, scoreVal = 0, currentRound = [];

// نظام النوافذ المنبثقة المخصصة
function showModal(type, title, desc, callback) {
    const modal = document.getElementById('custom-modal');
    if(!modal) return false;
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-desc').innerText = desc;
    const mInput = document.getElementById('modal-input');
    if (type === 'prompt') { mInput.classList.remove('hidden'); mInput.value = ''; setTimeout(() => mInput.focus(), 100); } 
    else { mInput.classList.add('hidden'); }
    modal.classList.remove('hidden');
    const confirmBtn = document.getElementById('modal-confirm');
    const cancelBtn = document.getElementById('modal-cancel');
    const newConfirm = confirmBtn.cloneNode(true);
    const newCancel = cancelBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirm, confirmBtn);
    cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);
    newConfirm.onclick = () => { modal.classList.add('hidden'); callback(type === 'prompt' ? mInput.value : true); };
    newCancel.onclick = () => { modal.classList.add('hidden'); callback(null); };
    return true;
}

// تحميل السجل من السحابة عند فتح الموقع
async function boot() {
    try {
        const { data, error } = await sb.from('user_history').select('seen_ids').eq('user_id', `${userUID}_${SUBJECT_ID}`).single();
        if (data) {
            seenIds = data.seen_ids || [];
        } else {
            await sb.from('user_history').insert([{ user_id: `${userUID}_${SUBJECT_ID}`, seen_ids: [] }]);
        }
    } catch (e) { console.log("First time user"); }
    document.getElementById('loader').classList.add('hidden');
    document.getElementById('scr-start').classList.remove('hidden');
}

window.startGame = () => {
    const n = document.getElementById('in-name').value.trim();
    const s = document.getElementById('in-sect').value.trim();
    if (n.split(" ").length < 3 || s === "") { 
        showModal('alert', 'بيانات ناقصة', 'الرجاء إدخال اسمك الثلاثي ورقم الشعبة', () => {}); 
        return; 
    }

    // --- منطق منع التكرار ---
    const getFreshPool = (pool) => {
        let fresh = pool.filter(q => !seenIds.includes(q.id));
        // إذا شارف القسم على الانتهاء (أقل من 10 أسئلة)، نقوم بتصفير السجل لهذا القسم
        if (fresh.length < 10) {
            seenIds = seenIds.filter(id => !pool.map(p => p.id).includes(id));
            return [...pool].sort(() => Math.random() - 0.5);
        }
        return fresh.sort(() => Math.random() - 0.5);
    };

    let radPool = getFreshPool(QUEST_BANK.Radians);
    let areaPool = getFreshPool(QUEST_BANK.Areas);
    let funcPool = getFreshPool(QUEST_BANK.Functions);

    // اختيار 10 من كل نوع عشوائياً
    currentRound = [];
    for(let i=0; i<10; i++) {
        currentRound.push(radPool[i], areaPool[i], funcPool[i]);
    }
    // خلط ترتيب الـ 30 سؤال النهائية
    currentRound.sort(() => Math.random() - 0.5);

    document.getElementById('p-info').innerText = `${n} | شعبة: ${s}`;
    document.getElementById('scr-start').classList.add('hidden'); 
    document.getElementById('scr-game').classList.remove('hidden');
    render();
};

function render() {
    const q = currentRound[curIdx];
    document.getElementById('q-text').innerHTML = q.q; 
    const idxEl = document.getElementById('q-idx');
    if (idxEl) idxEl.innerText = curIdx + 1; 
    document.getElementById('g-score').innerText = scoreVal;
    
    const box = document.getElementById('opt-box'); 
    box.innerHTML = "";
    
    [...q.o].sort(() => Math.random() - 0.5).forEach(opt => {
        const btn = document.createElement('button');
        btn.className = "option-btn text-white p-5 shadow-lg";
        btn.innerHTML = opt;
        btn.onclick = async () => {
            document.querySelectorAll('.option-btn').forEach(b => b.disabled = true);
            if (opt === q.a) { btn.classList.add('correct'); scoreVal++; } else btn.classList.add('wrong');
            
            // إضافة السؤال لقائمة "تمت رؤيته"
            if (!seenIds.includes(q.id)) seenIds.push(q.id);
            
            // تحديث السجل في السحابة فوراً
            await sb.from('user_history').update({ seen_ids: seenIds }).eq('user_id', `${userUID}_${SUBJECT_ID}`);

            setTimeout(() => { 
                curIdx++; 
                if (curIdx < 30) render(); 
                else finish(); 
            }, 600);
        };
        box.appendChild(btn);
    });
}

async function finish() {
    const n = document.getElementById('in-name').value, s = document.getElementById('in-sect').value, p = Math.round((scoreVal/30)*100);
    document.getElementById('r-name').innerText = n; 
    document.getElementById('f-score').innerText = scoreVal; 
    document.getElementById('f-perc').innerText = `${p}%`;
    document.getElementById('scr-game').classList.add('hidden'); 
    document.getElementById('scr-res').classList.remove('hidden');
    
    // إرسال النتيجة للجدول الرئيسي
    await sb.from('score').insert([{ name: n, section: s, score: scoreVal, percentage: p, subject: SUBJECT_ID }]);
}

window.resetToStart = () => { curIdx = 0; scoreVal = 0; document.getElementById('scr-res').classList.add('hidden'); document.getElementById('scr-start').classList.remove('hidden'); };

window.toggleAuth = (s) => {
    if(s) {
        showModal('prompt', 'لوحة المعلم', 'الرجاء إدخال كلمة المرور السريّة:', (val) => {
            if(val === "sdxc") { 
                document.getElementById('scr-start').classList.add('hidden'); 
                document.getElementById('scr-dash').classList.remove('hidden'); 
                loadScores(); 
            } else if(val !== null) {
                showModal('alert', 'عذراً', 'كلمة المرور غير صحيحة', () => {});
            }
        });
    }
};

window.hideDash = () => { document.getElementById('scr-dash').classList.add('hidden'); document.getElementById('scr-start').classList.remove('hidden'); };

async function loadScores() {
    const body = document.getElementById('scores-body'); 
    body.innerHTML = "<tr><td colspan='4' class='p-10 text-center animate-pulse text-emerald-400'>جاري جلب النتائج من السحابة...</td></tr>";
    const { data, error } = await sb.from('score').select('*').eq('subject', SUBJECT_ID).order('created_at', { ascending: false });
    if (error) { body.innerHTML = `<tr><td colspan='4' class='p-10 text-center text-red-500 font-bold'>الخطأ: ${error.message}</td></tr>`; return; }
    body.innerHTML = (!data || data.length === 0) ? "<tr><td colspan='4' class='p-10 text-center opacity-50 text-white'>لا توجد نتائج مسجلة حتى الآن</td></tr>" : "";
    data?.forEach(r => {
        body.innerHTML += `<tr class="border-b border-emerald-900/30"><td class="p-5 font-bold text-white text-right">${r.name}</td><td class="p-5 text-center text-emerald-200/50">${r.section}</td><td class="p-5 text-center font-bold text-emerald-400">${r.score}</td><td class="p-5 text-center font-bold text-emerald-300">${r.percentage}%</td></tr>`;
    });
}

window.onload = boot;
