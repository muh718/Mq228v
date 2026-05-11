/**
 * app.js
 * الربط مع Supabase والتحكم في اللعبة
 */

// ⚠️ تأكد من وضع بياناتك من Supabase هنا
const SUPABASE_URL = 'https://jdlaajmsafjuouafhndg.supabase.co'; 
const SUPABASE_KEY = 'الصق_هنا_مفتاح_anon_public_الخاص_بمشروعك'; 
const SUBJECT_ID = "Trigonometry_v2"; 

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

let userUID = localStorage.getItem('trig_user_id') || crypto.randomUUID();
localStorage.setItem('trig_user_id', userUID);

let seenIds = [], curIdx = 0, scoreVal = 0, currentRound = [];

async function boot() {
    try {
        const { data } = await sb.from('user_history').select('*').eq('user_id', `${userUID}_${SUBJECT_ID}`).single();
        if (data) seenIds = data.seen_ids || [];
        else await sb.from('user_history').insert([{ user_id: `${userUID}_${SUBJECT_ID}`, seen_ids: [], last_reset: new Date() }]);
    } catch (e) { console.log("New session startup"); }
    document.getElementById('loader').classList.add('hidden');
    document.getElementById('scr-start').classList.remove('hidden');
}

window.startGame = () => {
    const n = document.getElementById('in-name').value.trim(), s = document.getElementById('in-sect').value.trim();
    if (n.split(" ").length < 3 || s === "") { alert("أدخل بياناتك كاملة"); return; }
    const f = (arr) => arr.filter(q => !seenIds.includes(q.id)).sort(() => Math.random() - 0.5);
    let r = f(QUEST_BANK.Radians), a = f(QUEST_BANK.Areas), fu = f(QUEST_BANK.Functions);
    if(r.length < 10) r = QUEST_BANK.Radians.sort(()=>Math.random()-0.5);
    if(a.length < 10) a = QUEST_BANK.Areas.sort(()=>Math.random()-0.5);
    if(fu.length < 10) fu = QUEST_BANK.Functions.sort(()=>Math.random()-0.5);
    currentRound = []; for (let i = 0; i < 10; i++) currentRound.push(r[i], a[i], fu[i]);
    document.getElementById('p-info').innerText = `${n} | شعبة: ${s}`;
    document.getElementById('scr-start').classList.add('hidden');
    document.getElementById('scr-game').classList.remove('hidden');
    render();
};

function render() {
    const q = currentRound[curIdx];
    document.getElementById('q-text').innerHTML = q.q;
    document.getElementById('q-idx').innerText = curIdx + 1;
    document.getElementById('g-score').innerText = scoreVal;
    const box = document.getElementById('opt-box'); box.innerHTML = "";
    [...q.o].sort(() => Math.random() - 0.5).forEach(opt => {
        const btn = document.createElement('button'); btn.className = "option-btn text-white p-5 shadow-lg"; btn.innerHTML = opt;
        btn.onclick = () => {
            document.querySelectorAll('.option-btn').forEach(b => b.disabled = true);
            if (opt === q.a) { btn.classList.add('correct'); scoreVal++; } else btn.classList.add('wrong');
            seenIds.push(q.id);
            sb.from('user_history').update({ seen_ids: seenIds }).eq('user_id', `${userUID}_${SUBJECT_ID}`).then();
            setTimeout(() => { curIdx++; if (curIdx < 30) render(); else finish(); }, 500);
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
    // تأكد أن اسم الجدول هو 'score' كما في إنشاءك اليدوي
    await sb.from('score').insert([{ name: n, section: s, score: scoreVal, percentage: p, subject: SUBJECT_ID }]);
}

window.resetToStart = () => { curIdx = 0; scoreVal = 0; document.getElementById('scr-res').classList.add('hidden'); document.getElementById('scr-start').classList.remove('hidden'); };

window.toggleAuth = (s) => {
    if(s) {
        let p = prompt("كلمة سر المعلم:");
        if(p === "sdxc") { document.getElementById('scr-start').classList.add('hidden'); document.getElementById('scr-dash').classList.remove('hidden'); loadScores(); }
    }
};

window.hideDash = () => { document.getElementById('scr-dash').classList.add('hidden'); document.getElementById('scr-start').classList.remove('hidden'); };

async function loadScores() {
    const body = document.getElementById('scores-body'); body.innerHTML = "<tr><td colspan='5' class='p-10 text-center animate-pulse'>جاري التحميل...</td></tr>";
    const { data } = await sb.from('score').select('*').eq('subject', SUBJECT_ID).order('created_at', { ascending: false });
    body.innerHTML = (!data || data.length === 0) ? "<tr><td colspan='5' class='p-10 text-center opacity-50 text-white'>لا توجد نتائج مسجلة</td></tr>" : "";
    data?.forEach(r => {
        body.innerHTML += `<tr class="border-b border-slate-800"><td class="p-5 font-bold text-white text-right">${r.name}</td><td class="p-5 text-center text-slate-400">${r.section}</td><td class="p-5 text-center font-bold text-emerald-400">${r.score}</td><td class="p-5 text-center font-bold text-sky-400">${r.percentage}%</td><td class="p-5 text-left opacity-20 text-[10px] text-white">${new Date(r.created_at).toLocaleTimeString('ar-SA')}</td></tr>`;
    });
}

window.onload = boot;
