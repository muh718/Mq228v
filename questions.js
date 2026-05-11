/**
 * questions.js
 * بنك الأسئلة المتولد آلياً لثانوية رضوى
 */
const QUEST_BANK = { Radians: [], Areas: [], Functions: [] };

function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }

function fmtF(n, d) {
    const pi = '<span class="pi-symbol">π</span>';
    if (d === 1) return `<div class="math-ltr">${n}${pi}</div>`;
    return `<div class="math-ltr"><div class="fraction"><div class="numerator">${n === 1 ? '' : n}${pi}</div><div class="denominator">${d}</div></div></div>`;
}

function tR(d) {
    let common = gcd(d, 180), n = d / common, den = 180 / common;
    if (n === 1 && den === 1) return '<span class="pi-symbol">π</span>';
    return fmtF(n, den);
}

(function generate() {
    for (let i = 1; i <= 200; i++) {
        let d = (i * 3) + 15;
        QUEST_BANK.Radians.push({ id: `R_${i}`, q: `حوّل الزاوية <span class="math-ltr">${d}°</span> إلى الراديان:`, a: tR(d), o: [tR(d), tR(d + 15), tR(Math.abs(d - 10) || 20), `<span class="math-ltr">${d}°</span>`] });
        let s1 = 10 + (i % 20), s2 = 12 + (i % 15), ang = [30, 45, 60][i % 3];
        let val = (0.5 * s1 * s2 * Math.sin(ang * Math.PI / 180)).toFixed(1);
        QUEST_BANK.Areas.push({ id: `A_${i}`, q: `مساحة مثلث ضلعاه <span class="math-ltr">${s1}</span> و <span class="math-ltr">${s2}</span> والزاوية بينهما <span class="math-ltr">${ang}°</span>:`, a: `<span class="math-ltr">${val}</span>`, o: [`<span class="math-ltr">${val}</span>`, `<span class="math-ltr">${(val * 1.2).toFixed(1)}</span>`, `<span class="math-ltr">${(val * 0.8).toFixed(1)}</span>`, `<span class="math-ltr">${(parseFloat(val) + 8).toFixed(1)}</span>`] });
        let b = (i % 5) + 2, per = (360 / b).toFixed(0);
        QUEST_BANK.Functions.push({ id: `F_${i}`, q: `طول دورة الدالة <span class="math-ltr">y = cos(${b}θ)</span> هو:`, a: `<span class="math-ltr">${per}°</span>`, o: [`<span class="math-ltr">${per}°</span>`, `<span class="math-ltr">${(180 / b).toFixed(0)}°</span>`, `<span class="math-ltr">360°</span>`, `<span class="math-ltr">${(720 / b).toFixed(0)}°</span>`] });
    }
})();
