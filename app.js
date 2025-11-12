(() => {
  const $ = (sel) => document.querySelector(sel);
  const chkStarred = document.getElementById('chkStarred');
  const chkRead = document.getElementById('chkRead');
  const modeStudyBtn = $('#modeStudy');
  const modeTestBtn = $('#modeTest');
  const modePracticeBtn = document.getElementById('modePractice');
  const modeExportBtn = document.getElementById('modeExport');
  const modeSwitch = document.getElementById('modeSwitch');
  
  // Study direction elements
  const studyDirDefToTermBtn = document.getElementById('studyDirDefToTerm');
  const studyDirTermToDefBtn = document.getElementById('studyDirTermToDef');
  let studyDirection = 'term_to_def'; // Default: Thuật ngữ -> Định nghĩa
  const btnLoad = $('#btnLoad');
  const btnSave = document.getElementById('btnSave');
  const btnOpen = document.getElementById('btnOpen');
  const jsonFile = document.getElementById('jsonFile');
  const fileInput = $('#htmlFile');
  const status = $('#status');
  const chkAppend = document.getElementById('chkAppend');
  const ghList = document.getElementById('ghList');

  const meta = $('#meta');
  const setTitle = $('#setTitle');
  const countEl = $('#count');

  const studyView = $('#studyView');
  const cardArea = $('#cardArea');
  const card = $('#card');
  const cardInner = $('#cardInner');
  const cardFront = $('#cardFront');
  const cardBack = $('#cardBack');
  const prevBtn = $('#prevBtn');
  const nextBtn = $('#nextBtn');
  const progressIndex = $('#progressIndex');
  const progressTotal = $('#progressTotal');

  const testView = $('#testView');
  const testArea = $('#testArea');
  const testPrompt = $('#testPrompt');
  const testAnswer = $('#testAnswer');
  const checkBtn = $('#checkBtn');
  const skipBtn = $('#skipBtn');
  const testFeedback = $('#testFeedback');
  const testIndex = $('#testIndex');
  const testTotal = $('#testTotal');
  const dirDefToTermBtn = document.getElementById('dirDefToTerm');
  const dirTermToDefBtn = document.getElementById('dirTermToDef');
  const summaryView = document.getElementById('summaryView');
  const exportView = document.getElementById('exportView');
  const summaryArea = document.getElementById('summaryArea');
  const summaryHeader = document.querySelector('.summary-header');
  const btnSaveCorrect = document.getElementById('btnSaveCorrect');
  const btnSaveWrong = document.getElementById('btnSaveWrong');
  const expSep1 = document.getElementById('expSep1');
  const expSep2 = document.getElementById('expSep2');
  const btnExport = document.getElementById('btnExport');
  const exportBox = document.getElementById('exportBox');
  const expListDef = document.getElementById('expListDef');
  const expListTerm = document.getElementById('expListTerm');
  const btnExportList = document.getElementById('btnExportList');
  const exportListBox = document.getElementById('exportListBox');
  const btnExportStandalone = document.getElementById('btnExportStandalone');

  // ---------- Favicon utilities ----------
  function ensureFaviconLink() {
    let link = document.querySelector('link[rel="icon"]') || document.querySelector('link[rel="shortcut icon"]');
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'icon');
      document.head.appendChild(link);
    }
    return link;
  }

  function setFaviconDataUrl(dataUrl, type = 'image/png') {
    const link = ensureFaviconLink();
    link.setAttribute('type', type);
    link.setAttribute('href', dataUrl);
  }

  async function tintFaviconFromPng(src, color = '#FFA000') {
    try {
      // If running from file://, canvas may be tainted; skip tinting gracefully
      if (typeof location !== 'undefined' && String(location.protocol).toLowerCase() === 'file:') {
        const link = ensureFaviconLink();
        link.removeAttribute('type');
        link.setAttribute('href', src);
        return;
      }
      await new Promise((resolve) => {
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', resolve, { once: true });
        else resolve();
      });
      await new Promise((resolve) => setTimeout(resolve, 0)); // yield once for head to be ready
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.decoding = 'async';
      img.onload = () => {
        try {
          const w = img.naturalWidth || 64;
          const h = img.naturalHeight || 64;
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d');
          // Draw solid color
          ctx.fillStyle = color;
          ctx.fillRect(0, 0, w, h);
          // Keep only original alpha mask
          ctx.globalCompositeOperation = 'destination-in';
          ctx.imageSmoothingEnabled = true;
          ctx.drawImage(img, 0, 0, w, h);
          const url = canvas.toDataURL('image/png');
          setFaviconDataUrl(url, 'image/png');
        } catch (e) {
          // Canvas tainted or blocked; fallback to original src
          const link = ensureFaviconLink();
          link.removeAttribute('type');
          link.setAttribute('href', src);
        }
      };
      img.onerror = () => {
        // ignore if file missing or blocked
      };
      img.src = src;
    } catch {}
  }

  let cards = [];
  let idx = 0;
  let testIdx = 0;
  let testOrder = [];
  let knownCards = new Set(); // Track known card indices
  
  // Toggle star status for a card (only updates in memory, doesn't save to file)
  function toggleStar(cardIndex) {
    if (cardIndex >= 0 && cardIndex < cards.length) {
      cards[cardIndex].starred = !cards[cardIndex].starred;
      updateStarButton(cardIndex);
      // Don't save to file here, only update the UI
    }
  }
  
  // Toggle known status for a card
  function toggleKnown(cardIndex) {
    if (cardIndex >= 0 && cardIndex < cards.length) {
      if (knownCards.has(cardIndex)) {
        knownCards.delete(cardIndex);
      } else {
        knownCards.add(cardIndex);
      }
      updateKnownButton(cardIndex);
      updateNextButtonText();
    }
  }
  
  // Update star button appearance based on card's starred status
  function updateStarButton(cardIndex) {
    const starBtn = document.getElementById('starBtn');
    if (starBtn && cardIndex >= 0 && cardIndex < cards.length) {
      const isStarred = cards[cardIndex]?.starred;
      starBtn.innerHTML = isStarred ? '★' : '☆';
      starBtn.style.color = isStarred ? '#ffd700' : '#ccc';
      starBtn.classList.toggle('starred', isStarred);
    }
  }
  
  // Update known button appearance
  function updateKnownButton(cardIndex) {
    const knownBtn = document.getElementById('knownBtn');
    if (knownBtn) {
      const isKnown = knownCards.has(cardIndex);
      knownBtn.innerHTML = isKnown ? '✓' : '✓';
      knownBtn.style.color = isKnown ? '#4CAF50' : '#ccc';
      knownBtn.style.opacity = isKnown ? '1' : '0.5';
      knownBtn.title = isKnown ? 'Bỏ đánh dấu đã biết' : 'Đánh dấu đã biết';
    }
  }
  
  // Update next button text based on known cards
  function updateNextButtonText() {
    const currentCards = getCurrentCards();
    const isLastCard = idx === currentCards.length - 1;
    const hasKnownCards = knownCards.size > 0;
    
    if (nextBtn) {
      if (isLastCard && hasKnownCards) {
        nextBtn.textContent = 'Học tiếp';
      } else {
        nextBtn.textContent = 'Tiếp ▶';
      }
    }
  }
  let mode = 'study';
  let testCorrect = 0;
  let currentWasWrong = false;
  let currentFirstWrongAnswer = '';
  let currentEnqueued = false;
  let results = [];
  // def_to_term: prompt = definition, expect = term
  // term_to_def: prompt = term, expect = definition
  let testDirection = 'def_to_term';
  // Practice mode queue (indices)
  let practiceQueue = [];

  function setMode(newMode) {
    mode = newMode;
    // Active states
    modeStudyBtn.classList.toggle('active', mode === 'study');
    modeTestBtn.classList.toggle('active', mode === 'test');
    if (modePracticeBtn) modePracticeBtn.classList.toggle('active', mode === 'practice');
    if (modeExportBtn) modeExportBtn.classList.toggle('active', mode === 'export');

    // Views visibility
    const showStudy = mode === 'study';
    const showTestish = mode === 'test' || mode === 'practice';
    const showExport = mode === 'export';

    studyView.hidden = !showStudy;
    testView.hidden = !showTestish;
    if (summaryView) summaryView.hidden = true; // hide summary when switching modes
    if (exportView) exportView.hidden = !showExport;
  }

  // Try tint local favicon.png to orange ASAP
  tintFaviconFromPng('./favicon.png', '#FFA000');

  function stripParenthesesAll(s) {
    // Remove all parenthetical segments and normalize spaces
    return String(s || '')
      .replace(/\r?\n/g, ' ')
      .replace(/\s*\([^)]*\)\s*/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function exportList() {
    try {
      const useDef = !expListTerm || (expListDef && expListDef.checked);
      const lines = (cards || []).map((c) => {
        const raw = useDef ? (c.definition || '') : (c.term || '');
        return stripParenthesesAll(raw);
      });
      const out = lines.join('\n');
      if (exportListBox) exportListBox.value = out;
      status.textContent = 'Đã tạo danh sách.';
      status.classList.remove('error');
      status.classList.add('success');
    } catch (e) {
      status.textContent = 'Lỗi tạo danh sách: ' + (e && e.message ? e.message : e);
      status.classList.remove('success');
      status.classList.add('error');
    }
  }

  function exportToQuizletString() {
    try {
      const sep1 = (expSep1 && expSep1.value != null) ? String(expSep1.value) : '{';
      const sep2 = (expSep2 && expSep2.value != null) ? String(expSep2.value) : '}';
      const lines = (cards || []).map((c) => (
        stripParenthesesAll(c.term || '') + sep1 + stripParenthesesAll(c.definition || '') + sep2
      ));
      const out = lines.join('\n');
      if (exportBox) exportBox.value = out;
      status.textContent = 'Đã tạo chuỗi xuất.';
      status.classList.remove('error');
      status.classList.add('success');
    } catch (e) {
      status.textContent = 'Lỗi tạo chuỗi: ' + (e && e.message ? e.message : e);
      status.classList.remove('success');
      status.classList.add('error');
    }
  }

  function exportStandaloneHtml() {
    try {
      if (!cards.length) {
        status.textContent = 'Chưa có thẻ để xuất.';
        status.classList.remove('success');
        status.classList.add('error');
        return;
      }
      const dataTitle = setTitle.textContent || 'Bộ thẻ';
      // Sanitize cards to plain text to avoid HTML tags affecting comparison in exported file
      const safeCardsArr = (cards || []).map((c) => ({
        term: htmlToTextPreserveBreaks((c && c.term) || ''),
        definition: htmlToTextPreserveBreaks((c && c.definition) || '')
      }));
      // Prepare JSON for embedding into a <script type="application/json"> tag
      // 1) JSON.stringify the array
      // 2) Escape </script> and '<' to avoid breaking the enclosing script tag
      const rawJson = JSON.stringify(safeCardsArr);
      const jsonForTag = rawJson
        .replace(/</g, '\\u003C')
        .replace(/<\//g, '<\\/');
      const html = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(dataTitle)} — Standalone Trainer</title>
<style>
body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;margin:0;background:#0e0f12;color:#eaeef2}
.container{max-width:900px;margin:0 auto;padding:16px;box-sizing:border-box}
.header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
.brand-title{font-weight:700;font-size:18px}
.badge{background:#1f2937;color:#eaeef2;padding:4px 8px;border-radius:6px;font-size:12px}
.section{background:#12141a;border:1px solid #1f2937;border-radius:12px;padding:12px;margin-bottom:12px}
.row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:8px}
.btn{background:#334155;border:none;color:#fff;padding:8px 12px;border-radius:8px;cursor:pointer;transition:background .15s}
.btn:hover{background:#3f4a62}
.btn.primary{background:#2563eb}
.btn.secondary{background:#334155}
.btn.active{background:#f59e0b;color:#111827}
.status{margin-top:8px;min-height:20px;padding:6px 8px;border-radius:8px;background:#0b0c10;border:1px solid #1f2937}
.status.success{border-color:#065f46;color:#34d399;background:#052b24}
.status.error{border-color:#7f1d1d;color:#fca5a5;background:#2b0b0b}
.prompt{white-space:pre-wrap;padding:10px;background:#0b0c10;border:1px solid #1f2937;border-radius:8px;margin:8px 0}
.input{display:block;width:100%;max-width:100%;box-sizing:border-box;padding:10px;border-radius:8px;border:1px solid #1f2937;background:#0b0c10;color:#eaeef2}
.progress{opacity:.8}
.summary{display:grid;gap:10px}
.summary-item{border:1px solid #1f2937;border-radius:10px;padding:10px;background:#0b0c10}
.summary-item.ok .badge{background:#065f46}
.summary-item.fail .badge{background:#7f1d1d}
pre{white-space:pre-wrap;margin:0}
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <div class="brand-title">${escapeHtml(dataTitle)}</div>
    <div class="badge">Standalone Practice/Test</div>
  </div>
  <div class="row" style="margin:6px 0 0 0"><div id="loadedCount" class="badge">Đang nạp...</div></div>
  <script id="cardsData" type="application/json">${jsonForTag}</script>
  <div class="section">
    <div class="row">
      <button id="modePractice" class="btn secondary" type="button" onclick="try{ switchToPractice(); }catch(e){}">Thực hành</button>
      <button id="modeTest" class="btn secondary" type="button" onclick="try{ switchToTest(); }catch(e){}">Kiểm tra</button>
      <button id="dirDefToTerm" class="btn secondary" type="button" onclick="try{ setDefToTerm(); }catch(e){}">Định nghĩa → Thuật ngữ</button>
      <button id="dirTermToDef" class="btn secondary" type="button" onclick="try{ setTermToDef(); }catch(e){}">Thuật ngữ → Định nghĩa</button>
      <span class="progress"><span id="idx">0</span>/<span id="tot">0</span></span>
    </div>
    <div id="prompt" class="prompt"></div>
    <input id="answer" class="input" placeholder="Nhập câu trả lời..." onkeydown="if(event && (event.key==='Enter'||event.keyCode===13)){ event.preventDefault(); try{ check(); }catch(e){} }" />
    <div class="row">
      <button id="check" class="btn" type="button" onclick="try{ check(); }catch(e){}">Kiểm tra</button>
      <button id="skip" class="btn secondary" type="button" onclick="try{ skip(); }catch(e){}">Bỏ qua</button>
    </div>
    <div id="fb" class="status"></div>
  </div>
  <div class="section">
    <div class="badge">Kết quả</div>
    <div id="summaryStats" class="badge" style="margin-bottom:8px;background:#1f2937;color:#eaeef2">Đang tính toán...</div>
    <div id="sum" class="summary"></div>
  </div>
</div>
<script>
// Global error surface so page never looks frozen
window.addEventListener('error', function(ev){
  try {
    var el = document.getElementById('loadedCount');
    if (el) el.textContent = 'Lỗi khởi tạo: ' + (ev && ev.message ? ev.message : 'Không rõ');
    var dbg = document.getElementById('dbg'); if (dbg) { dbg.style.display='block'; dbg.textContent = String((ev && ev.error) || ev.message || ev); }
  } catch {}
});
var __cards_raw = (function(){ try { var el=document.getElementById('cardsData'); return el ? el.textContent || '' : ''; } catch(e){ return ''; } })();
const cards=(function(){
  try {
    return JSON.parse(__cards_raw || '[]');
  } catch (e) {
    try { console.error('Parse cards failed:', e); } catch {}
    return [];
  }
})();
let mode='practice';
let testDirection='def_to_term';
let order=[];let tIdx=0;let pq=[];let results=[];let currentWasWrong=false;let currentFirstWrong='';let currentEnqueued=false;
function n(s){
  var txt = String(s == null ? '' : s);
  try { if (String.prototype.normalize) txt = txt.normalize('NFKD'); } catch {}
  txt = txt.replace(/\\r?\\n/g, ' ').replace(/\\t/g, ' ');
  txt = txt.toLowerCase();
  // strip accents (combining marks) and map đ
  txt = txt.replace(/[\\u0300-\\u036f]/g, '').replace(/đ/g, 'd');
  // normalize curly quotes
  txt = txt.replace(/[\\u2018\\u2019\\u201C\\u201D]/g, '"');
  return txt;
}
function nf(s){
  var t = n(s);
  t = t.replace(/<[^>]*>/g, ' ');
  t = t.replace(/\\([^)]*\\)/g, ' ');
  // remove all non a-z0-9 and spaces, then collapse spaces
  t = t.replace(/[^a-z0-9 ]+/g, ' ').replace(/\\s+/g, ' ').trim();
  // for strict compare, remove spaces entirely
  return t.replace(/\\s+/g, '');
}
function sh(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function gi(){if(mode==='practice')return pq.length?pq[0]:0;return order[tIdx]}
// Inline helpers for buttons
function switchToPractice(){ mode='practice'; updateModeButtons(); start(); }
function switchToTest(){ mode='test'; updateModeButtons(); start(); }
function setDefToTerm(){ testDirection='def_to_term'; updateDirButtons(); render(); }
function setTermToDef(){ testDirection='term_to_def'; updateDirButtons(); render(); }
function updateModeButtons(){
  const mp=document.getElementById('modePractice');
  const mt=document.getElementById('modeTest');
  if(mp) mp.classList.toggle('active', mode==='practice');
  if(mt) mt.classList.toggle('active', mode==='test');
}
function updateDirButtons(){
  const d1=document.getElementById('dirDefToTerm');
  const d2=document.getElementById('dirTermToDef');
  if(d1) d1.classList.toggle('active', testDirection==='def_to_term');
  if(d2) d2.classList.toggle('active', testDirection==='term_to_def');
}
function start(){
  if(mode==='test'){
    // Trong chế độ test, kiểm tra hết tất cả thẻ theo thứ tự gốc (không shuffle)
    order=Array.from({length:cards.length},(_,i)=>i);
  }else{
    // Trong chế độ practice, shuffle để học hiệu quả hơn
    order=sh(Array.from({length:cards.length},(_,i)=>i));
  }
  tIdx=0;pq=[];for(let i=0;i<cards.length;i++)pq.push(i);updateModeButtons();updateDirButtons();render()
}
// show loaded count (always attempt)
(function(){ try { document.getElementById('loadedCount').textContent='Đã nạp ' + String(cards.length) + ' thẻ'; } catch (e) {} })();
function render(){const c=cards[gi()];const p=document.getElementById('prompt');if(testDirection==='def_to_term'){p.textContent=c.definition||'';document.getElementById('answer').placeholder='Nhập thuật ngữ...'}else{p.textContent=c.term||'';document.getElementById('answer').placeholder='Nhập định nghĩa...'}
document.getElementById('answer').value='';const fb=document.getElementById('fb');fb.textContent='';fb.className='status';document.getElementById('idx').textContent=mode==='practice'?String(cards.length-(pq.length-1)):String(tIdx+1);document.getElementById('tot').textContent=String(mode==='practice'?cards.length:order.length);currentWasWrong=false;currentFirstWrong='';currentEnqueued=false;}
function check(){
  const i=gi();
  const c=cards[i];
  const expectedRaw=(testDirection==='def_to_term'?c.term:c.definition)||'';
  const exp=nf(expectedRaw);
  const raw=(document.getElementById('answer').value||'').trim();
  if(!raw) return;
  const got=nf(raw);
  if(exp && got && (got.length===exp.length) && (got===exp)){
    const fb=document.getElementById('fb');
    if(currentWasWrong){
      fb.textContent='Đúng (sau khi sai lần đầu). Không tính điểm.';
    } else {
      fb.textContent='Đúng!';
      results.push({index:i,term:c.term||'',definition:c.definition||'',userAnswer:raw,correctFirstTry:true});
    }
    fb.classList.remove('error');
    fb.classList.add('success');
    if(mode==='practice'){
      nextP(true);
    } else {
      setTimeout(nextT, 800);
    }
  } else {
    const correct=testDirection==='def_to_term'?(c.term||''):(c.definition||'');
    const fb=document.getElementById('fb');
    fb.textContent='Sai. Đáp án: '+correct;
    fb.classList.remove('success');
    fb.classList.add('error');
    currentWasWrong=true;
    if(!currentFirstWrong)currentFirstWrong=raw;
    if(mode!=='practice'){
      const already=results.some(r=>r.index===i);
      if(!already){
        results.push({index:i,term:c.term||'',definition:c.definition||'',userAnswer:currentFirstWrong||raw,correctFirstTry:false});
      }
      setTimeout(nextT, 800);
    }
    if(mode==='practice'){
      const last=results[results.length-1];
      const isDup=last&&last.index===i&&((last.userAnswer||'')===(raw||''));
      if(!isDup){
        results.push({index:i,term:c.term||'',definition:c.definition||'',userAnswer:raw,correctFirstTry:false});
      }
      if(!currentEnqueued){ pq.push(i); currentEnqueued=true; }
    }
  }
}
function skip(){const i=gi();const c=cards[i];results.push({index:i,term:c.term||'',definition:c.definition||'',userAnswer:'',correctFirstTry:false});if(mode==='practice'){nextP(false)}else{nextT()}}
function nextT(){if(tIdx<order.length-1){tIdx+=1;render()}else{renderSummary('Kết quả kiểm tra')}}
function nextP(ok){if(!pq.length)return;const cur=pq.shift();if(!ok)pq.push(cur);if(pq.length)render();else{renderSummary('Kết quả thực hành')}}
function renderSummary(title){
  document.getElementById('prompt').textContent='';
  document.getElementById('fb').textContent=title;
  const g=new Map();
  for(const r of results){
    if(!g.has(r.index)) g.set(r.index,{term:r.term,definition:r.definition,attempts:[],correctFirstTry:r.correctFirstTry});
    const item=g.get(r.index);
    item.attempts.push(r.userAnswer||'(bỏ qua)');
  }
  
  // Tính thống kê
  const totalCards = g.size || cards.length;
  const correctCount = Array.from(g.values()).filter(item => item.correctFirstTry).length;
  const percent = totalCards ? Math.round((correctCount / totalCards) * 100) : 0;
  
  // Hiển thị thống kê
  const statsEl = document.getElementById('summaryStats');
  if(statsEl) {
    statsEl.textContent = 'Kết quả: ' + correctCount + '/' + totalCards + ' câu đúng (' + percent + '%)';
  }
  
  const items=Array.from(g.entries()).map(function(entry, i){
    const item=entry[1];
    const ok=!!item.correctFirstTry;
    const cls=ok?'ok':'fail';
    const ans = (mode==='test')
      ? ('<pre>' + (item.attempts[0]||'') + '</pre>')
      : ('<ol>' + item.attempts.map(function(a){ return '<li><pre>' + a + '</pre></li>'; }).join('') + '</ol>');
    return '<div class="summary-item ' + cls + '">' +
           '<div class="badge">' + (ok?'Đúng':'Sai') + '</div>' +
           '<div><span class="badge">#' + (i+1) + '</span></div>' +
           '<div><span class="badge">Thuật ngữ</span> <pre>' + (item.term||'') + '</pre></div>' +
           '<div><span class="badge">Định nghĩa</span> <pre>' + (item.definition||'') + '</pre></div>' +
           '<div><span class="badge">Bạn trả lời</span> ' + ans + '</div>' +
           '</div>';
  }).join('');
  document.getElementById('sum').innerHTML=items;
}
document.getElementById('tot').textContent=String(cards.length);
start();
</script>
</body>
</html>
`
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const safeTitle = (dataTitle || 'standalone').replace(/[^\w\-]+/g, '_').slice(0, 50);
      const filename = (safeTitle || 'standalone') + '.html';
      let ok = false;
      try {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => { try { URL.revokeObjectURL(url); } catch {} }, 1000);
        ok = true;
      } catch {}
      if (!ok) {
        try {
          const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(html);
          const a2 = document.createElement('a');
          a2.href = dataUrl;
          a2.download = filename;
          a2.style.display = 'none';
          document.body.appendChild(a2);
          a2.click();
          document.body.removeChild(a2);
          ok = true;
        } catch {}
      }
      if (ok) {
        status.textContent = 'Đã tạo file HTML độc lập.';
        status.classList.remove('error');
        status.classList.add('success');
      } else {
        status.textContent = 'Không thể tải file HTML. Trình duyệt có thể chặn.';
        status.classList.remove('success');
        status.classList.add('error');
      }
    } catch (e) {
      status.textContent = 'Lỗi xuất HTML: ' + (e && e.message ? e.message : e);
      status.classList.remove('success');
      status.classList.add('error');
    }
  }

  function download(filename, text) {
    try {
      const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
      // IE/Edge Legacy
      if (window.navigator && (window.navigator.msSaveOrOpenBlob || window.navigator.msSaveBlob)) {
        const msSave = window.navigator.msSaveOrOpenBlob || window.navigator.msSaveBlob;
        msSave(blob, filename);
        return true;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'cards.json';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // Fallback attempt for some browsers
      setTimeout(() => {
        try { URL.revokeObjectURL(url); } catch {}
      }, 1000);
      return true;
    } catch (e) {
      try {
        // Last resort: open data URL
        const dataUrl = 'data:application/json;charset=utf-8,' + encodeURIComponent(text);
        window.open(dataUrl, '_blank');
        return true;
      } catch (e2) {
        return false;
      }
    }
  }

  function saveCardsToJson() {
    if (!cards.length) return;
    
    const data = {
      title: setTitle.value || 'Flashcards',
      cards: cards.map(c => ({
        term: c.term,
        definition: c.definition,
        starred: !!c.starred,  // Include star status when saving
        timestamp: c.timestamp || new Date().toISOString()
      }))
    };
    const safeTitle = (data.title || 'bo-the').replace(/[^\w\-]+/g, '_').slice(0, 50);
    const filename = (safeTitle || 'bo-the') + '.json';
    const ok = download(filename, JSON.stringify(data, null, 2));
    if (ok) {
      status.textContent = 'Đã lưu thẻ vào file JSON.';
      status.classList.remove('error');
      status.classList.add('success');
    } else {
      status.textContent = 'Không thể tự động tải xuống. Trình duyệt có thể chặn. Vui lòng thử trình duyệt khác (Chrome/Edge) hoặc kiểm tra cài đặt download.';
      status.classList.remove('success');
      status.classList.add('error');
    }
  }

  async function openCardsFromJson(file) {
    try {
      const text = await file.text();
      const obj = JSON.parse(text);
      const arr = Array.isArray(obj) ? obj : obj.cards; // allow raw array or wrapped object
      const list = Array.isArray(arr) ? arr : [];
      const normalized = list.map((c) => ({
        term: (c && (c.term || c.front || c.word)) || '',
        definition: (c && (c.definition || c.back)) || '',
        starred: !!c.starred,
        timestamp: c.timestamp || new Date().toISOString()
      })).filter((c) => c.term || c.definition);
      if (!normalized.length) throw new Error('File JSON không hợp lệ hoặc không có thẻ.');
      cards = normalized;
      setTitle.textContent = (obj && obj.title) || file.name.replace(/\.json$/i, '');
      countEl.textContent = String(cards.length);
      meta.hidden = false;
      if (modeSwitch) modeSwitch.hidden = false;

      idx = 0;
      renderStudy();
      startTest();

      status.textContent = 'Đã mở thẻ từ file JSON.';
      status.classList.remove('error');
      status.classList.add('success');
    } catch (e) {
      status.textContent = 'Lỗi mở file JSON: ' + (e && e.message ? e.message : e);
      status.classList.remove('success');
      status.classList.add('error');
      if (modeSwitch) modeSwitch.hidden = true;
    }
  }

  async function openCardsFromGithub(url, name) {
    try {
      const resp = await fetch(url, { cache: 'no-store' });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const text = await resp.text();
      const { normalized, title } = parseJsonTextToCards(text);
      if (!normalized.length) throw new Error('File JSON không hợp lệ hoặc không có thẻ.');
      const shouldAppend = !!(cards && cards.length && chkAppend && chkAppend.checked);
      if (shouldAppend) {
        cards = (cards || []).concat(normalized);
        countEl.textContent = String(cards.length);
        meta.hidden = false;
        if (modeSwitch) modeSwitch.hidden = false;
        renderStudy();
        status.textContent = 'Đã thêm ' + normalized.length + ' thẻ từ GitHub.';
        status.classList.remove('error');
        status.classList.add('success');
      } else {
        cards = normalized;
        setTitle.textContent = title || name || '';
        countEl.textContent = String(cards.length);
        meta.hidden = false;
        idx = 0;
        renderStudy();
        startTest();
        status.textContent = 'Đã mở từ GitHub.';
        status.classList.remove('error');
        status.classList.add('success');
      }
    } catch (e) {
      status.textContent = 'Lỗi mở từ GitHub: ' + (e && e.message ? e.message : e);
      status.classList.remove('success');
      status.classList.add('error');
    }
  }

  async function loadGithubBrowser(path = '') {
    if (!ghList) return;
    try {
      ghList.textContent = 'Đang tải danh sách...';
      const api = path
        ? `https://api.github.com/repos/albertthai-alt/browse/contents/quizlet/${path}`
        : 'https://api.github.com/repos/albertthai-alt/browse/contents/quizlet';
      
      const resp = await fetch(api, { cache: 'no-store' });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      
      const data = await resp.json();
      const items = Array.isArray(data) ? data : [];
      
      // Separate folders and files
      const folders = items.filter(it => it.type === 'dir');
      const files = items.filter(it => it.type === 'file' && /\.json$/i.test(it.name));
      
      // Sort alphabetically
      folders.sort((a,b) => a.name.localeCompare(b.name, 'vi'));
      files.sort((a,b) => a.name.localeCompare(b.name, 'vi'));
      
      // Create breadcrumb navigation
      const pathParts = path.split('/').filter(Boolean);
      let breadcrumb = '<div style="margin-bottom: 10px;">';
      breadcrumb += '<a href="#" class="gh-folder" data-path="" style="color: #60a5fa;">Thư viện</a>';
      
      let currentPath = '';
      pathParts.forEach((part, index) => {
        currentPath += (currentPath ? '/' : '') + part;
        breadcrumb += ' / ';
        breadcrumb += `<a href="#" class="gh-folder" data-path="${currentPath}" style="color: #60a5fa;">${part}</a>`;
      });
      
      breadcrumb += '</div>';
      
      // Create folder list
      let html = breadcrumb;
      
      if (folders.length > 0) {
        html += '<div style="margin-bottom: 10px;">';
        html += '<div style="font-weight: bold; margin-bottom: 5px;">Thư mục:</div>';
        html += folders.map(folder => (
          `<a href="#" class="gh-folder" data-path="${path ? path + '/' : ''}${folder.name}" style="display:inline-flex;align-items:center;padding:6px 10px;margin:0 5px 5px 0;border:1px solid #3b82f6;border-radius:8px;background:rgba(59,130,246,0.1);color:#60a5fa;text-decoration:none;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:5px;">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
            ${folder.name}
          </a>`
        )).join('');
        html += '</div>';
      }
      
      // Create file list
      if (files.length > 0) {
        html += '<div>';
        html += '<div style="font-weight: bold; margin: 10px 0 5px 0;">Tập tin JSON:</div>';
        html += files.map(file => (
          `<a href="#" class="gh-json" data-url="${file.download_url || ''}" data-name="${file.name || ''}" style="display:inline-flex;align-items:center;padding:6px 10px;margin:0 5px 5px 0;border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc;color:#4b5563;text-decoration:none;transition:all 0.2s ease;box-shadow:0 1px 2px 0 rgba(0,0,0,0.05);font-size:0.9em;max-width:100%;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" style="margin-right:6px;flex-shrink:0;">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <span style="white-space: normal; word-break: break-word; text-align: left;">${file.name}</span>
          </a>`
        )).join('');
        html += '</div>';
      }
      
      if (folders.length === 0 && files.length === 0) {
        html += '<div>Không tìm thấy thư mục hoặc file JSON nào.</div>';
      }
      
      ghList.innerHTML = html;
      
    } catch (e) {
      console.error('Error loading GitHub browser:', e);
      ghList.innerHTML = '<div style="color: #ef4444;">Lỗi tải danh sách từ GitHub. Vui lòng thử lại sau.</div>';
    }
  }

  function extractJsonFragmentByKey(text, keyLiteral) {
    const idx = text.indexOf(keyLiteral);
    if (idx === -1) return '';
    // Find nearest opening brace before key
    let start = idx;
    while (start > 0 && text[start] !== '{' && text[start] !== '[') start--;
    if (text[start] !== '{' && text[start] !== '[') return '';
    const openChar = text[start];
    const closeChar = openChar === '{' ? '}' : ']';
    let depth = 0;
    for (let i = start; i < text.length; i++) {
      const ch = text[i];
      if (ch === openChar) depth++;
      else if (ch === closeChar) depth--;
      // rudimentary string skip to avoid braces inside strings
      if (ch === '"') {
        i++;
        while (i < text.length) {
          const c2 = text[i];
          if (c2 === '\\') { i += 2; continue; }
          if (c2 === '"') { break; }
          i++;
        }
      }
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
    return '';
  }

  function parseFastFromText(htmlText) {
    // Extract __NEXT_DATA__ content using regex to avoid DOMParser limits
    let m = htmlText.match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
    if (m && m[1]) {
      try {
        const obj = JSON.parse(m[1]);
        const extracted = extractFromObj(obj);
        if (extracted.cards && extracted.cards.length) return extracted;
      } catch {}
    }
    // Fallback: window.Quizlet assignment if present
    m = htmlText.match(/window\.Quizlet\s*=\s*(\{[\s\S]*?\});/);
    if (m && m[1]) {
      try {
        const obj = JSON.parse(m[1]);
        const extracted = extractFromObj(obj);
        if (extracted.cards && extracted.cards.length) return extracted;
      } catch {}
    }
    // Fallback: try to locate a JSON object containing a key like "studiableItems" or "cardSides"
    const keysToTry = ['"studiableItems"', '"cardSides"', '"term"', '"definition"'];
    for (const key of keysToTry) {
      const frag = extractJsonFragmentByKey(htmlText, key);
      if (frag) {
        try {
          const obj = JSON.parse(frag);
          const extracted = extractFromObj(obj);
          if (extracted.cards && extracted.cards.length) return extracted;
        } catch {}
      }
    }
    // Fallback: Regex-based DOM-less extraction by pairing term/definition blocks
    const termRegex = /data-testid=["'](?:TermText|term-text)["'][^>]*>([\s\S]*?)<\//gi;
    const defRegex = /data-testid=["'](?:DefinitionText|definition-text)["'][^>]*>([\s\S]*?)<\//gi;
    const terms = [];
    const defs = [];
    let tm;
    while ((tm = termRegex.exec(htmlText)) !== null) {
      terms.push(cleanText(tm[1]));
    }
    let dm;
    while ((dm = defRegex.exec(htmlText)) !== null) {
      defs.push(cleanText(dm[1]));
    }
    if (terms.length && defs.length) {
      const n = Math.min(terms.length, defs.length);
      const cards = [];
      for (let i = 0; i < n; i++) {
        const t = terms[i] || '';
        const d = defs[i] || '';
        if (t || d) cards.push({ term: t, definition: d });
      }
      if (cards.length) {
        // Try to get title from <title>
        const tMatch = htmlText.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        const title = tMatch ? cleanText(tMatch[1]).replace('| Quizlet','').trim() : '';
        return { title, cards };
      }
    }
    return { title: '', cards: [] };
  }

  // Function to get current cards based on filters
  function getCurrentCards() {
    // Always return a fresh copy of cards to avoid reference issues
    let currentCards = JSON.parse(JSON.stringify(cards));
    
    // Apply star filter if needed
    if (chkStarred && chkStarred.checked) {
      currentCards = currentCards.filter(card => card.starred);
    }
    
    return currentCards;
  }

  // Update card count display
  function updateCardCount() {
    if (!countEl) return;
    const currentCards = getCurrentCards();
    countEl.textContent = currentCards.length;
  }

  function renderStudy() {
    const currentCards = getCurrentCards();
    const filteredCards = currentCards.filter((card, index) => {
      const cardIndex = cards.findIndex(c => 
        c.term === card.term && c.definition === card.definition
      );
      return !knownCards.has(cardIndex);
    });
    
    if (filteredCards.length === 0) {
      cardArea.hidden = true;
      // If no cards left but we have known cards, reset to show all cards
      if (knownCards.size > 0) {
        knownCards.clear();
        idx = 0;
        renderStudy();
      }
      return;
    }
    
    // Ensure idx is within bounds for filtered cards
    if (idx >= filteredCards.length) {
      idx = Math.max(0, filteredCards.length - 1);
    }
    cardArea.hidden = false;
    
    const c = filteredCards[idx];
    const currentCardIndex = cards.findIndex(card => 
      card.term === c.term && card.definition === c.definition
    );
    
    // Set card content based on study direction
    if (studyDirection === 'def_to_term') {
      cardFront.textContent = c.definition || '';
      cardBack.textContent = c.term || '';
    } else {
      cardFront.textContent = c.term || '';
      cardBack.textContent = c.definition || '';
    }
    card.classList.remove('flipped');
    progressIndex.textContent = String(idx + 1);
    // Show filtered card count in study mode
    progressTotal.textContent = String(filteredCards.length);
    
    // Update buttons with the correct card index from the original cards array
    updateStarButton(currentCardIndex);
    updateKnownButton(currentCardIndex);
  }

  function normalize(s) {
    return (s || '')
      .toString()
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase();
  }

  // Make parentheses content optional for matching
  function normalizeForCompare(s) {
    const base = normalize(s);
    // remove any parenthetical segments e.g. "word (IPA)" -> "word"
    const stripped = base.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
    // ignore spaces and hyphens completely for comparison (e.g., "pourover", "pour over", "pour-over")
    return stripped.replace(/[\s-]+/g, '');
  }

  function getCurrentIndex() {
    if (mode === 'practice') return practiceQueue.length ? practiceQueue[0] : -1;
    return testOrder[testIdx];
  }

  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function startTest() {
    const currentCards = getCurrentCards();
    if (!currentCards.length) {
      testArea.hidden = true;
      return;
    }
    // Create an array of original indices for the current filtered cards
    const originalIndices = [];
    if (chkStarred && chkStarred.checked) {
      // If filtering by starred, get the original indices of starred cards
      cards.forEach((card, index) => {
        if (card.starred) originalIndices.push(index);
      });
    } else {
      // Otherwise use all indices
      originalIndices.push(...Array(cards.length).keys());
    }
    
    testOrder = shuffle(originalIndices);
    testIdx = 0;
    testCorrect = 0;
    results = [];
    testArea.hidden = false;
    if (summaryView) summaryView.hidden = true;
    // update direction button states if present
    if (dirDefToTermBtn && dirTermToDefBtn) {
      if (testDirection === 'def_to_term') {
        dirDefToTermBtn.classList.add('active');
        dirTermToDefBtn.classList.remove('active');
      } else {
        dirTermToDefBtn.classList.add('active');
        dirDefToTermBtn.classList.remove('active');
      }
    }
    testTotal.textContent = String(currentCards.length);
    showTestPrompt();
  }

  function startPractice() {
    const currentCards = getCurrentCards();
    if (!currentCards.length) {
      testArea.hidden = true;
      return;
    }
    
    // Create an array of original indices for the current filtered cards
    const originalIndices = [];
    if (chkStarred && chkStarred.checked) {
      // If filtering by starred, get the original indices of starred cards
      cards.forEach((card, index) => {
        if (card.starred) originalIndices.push(index);
      });
    } else {
      // Otherwise use all indices
      originalIndices.push(...Array(cards.length).keys());
    }
    
    practiceQueue = shuffle(originalIndices);
    testCorrect = 0;
    results = [];
    testArea.hidden = false;
    if (summaryView) summaryView.hidden = true;
    if (dirDefToTermBtn && dirTermToDefBtn) {
      if (testDirection === 'def_to_term') {
        dirDefToTermBtn.classList.add('active');
        dirTermToDefBtn.classList.remove('active');
      } else {
        dirTermToDefBtn.classList.add('active');
        dirDefToTermBtn.classList.remove('active');
      }
    }
    testTotal.textContent = String(currentCards.length);
    showTestPrompt();
  }

  function showTestPrompt() {
    const currentIndex = getCurrentIndex();
    if (currentIndex === -1 || currentIndex >= cards.length) {
      testArea.hidden = true;
      return;
    }
    const c = cards[currentIndex];
    if (testDirection === 'def_to_term') {
      // Show definition, expect term
      testPrompt.textContent = c.definition || '';
      if (testAnswer) testAnswer.placeholder = 'Nhập thuật ngữ...';
    } else {
      // Show term, expect definition
      testPrompt.textContent = c.term || '';
      if (testAnswer) testAnswer.placeholder = 'Nhập định nghĩa...';
    }
    testAnswer.value = '';
    testFeedback.textContent = '';
    testFeedback.classList.remove('error', 'success');
    if (mode === 'practice') {
      const remaining = practiceQueue.length;
      const total = getCurrentCards().length;
      testIndex.textContent = String(total - remaining + 1);
    } else {
      testIndex.textContent = String(testIdx + 1);
    }
    testAnswer.focus();
    currentWasWrong = false;
    currentFirstWrongAnswer = '';
    currentEnqueued = false;
  }

  function checkAnswer() {
    const idxNow = getCurrentIndex();
    const c = cards[idxNow];
    // Determine expected based on direction
    const expected = normalizeForCompare(testDirection === 'def_to_term' ? c.term : c.definition);
    const rawInput = (testAnswer.value || '').trim();
    if (!rawInput) {
      // Do not treat as wrong; simply ignore
      return;
    }
    const got = normalizeForCompare(rawInput);
    const correctAnswer = testDirection === 'def_to_term' ? (c.term || '') : (c.definition || '');
    
    if (got && expected && (got === expected)) {
      // If previously wrong for this card, do not increase score; allow advance for learning purposes
      if (currentWasWrong) {
        testFeedback.textContent = 'Đúng (sau khi sai lần đầu). Không tính điểm, tiếp tục học.';
        testFeedback.classList.remove('error');
        testFeedback.classList.add('success');
        // Do not record the corrective attempt in any mode; only the first wrong attempt should be kept for test mode
      } else {
        testFeedback.textContent = 'Đúng!';
        testFeedback.classList.remove('error');
        testFeedback.classList.add('success');
        // Only count first attempt correctness once per card (relevant for practice)
        const seenBefore = results.some(r => r.index === idxNow);
        if (!seenBefore) testCorrect += 1;
        results.push({
          index: idxNow,
          term: c.term || '',
          definition: c.definition || '',
          userAnswer: rawInput,
          correctFirstTry: true
        });
      }
      
      // Speak only the correct answer
      speakText(correctAnswer);
      
      if (mode === 'practice') setTimeout(() => nextPractice(true), 2000);
      else setTimeout(nextTest, 2000);
    } else {
      // Always show the correct answer from the card for wrong attempts
      testFeedback.textContent = 'Sai. Đáp án: ' + correctAnswer;
      testFeedback.classList.remove('success');
      testFeedback.classList.add('error');
      currentWasWrong = true;
      if (!currentFirstWrongAnswer) currentFirstWrongAnswer = rawInput;
      
      // Speak only the correct answer
      speakText(correctAnswer);
      
      // In test mode: record only the first wrong attempt for this index
      if (mode !== 'practice') {
        const already = results.some(r => r.index === idxNow);
        if (!already) {
          results.push({
            index: idxNow,
            term: c.term || '',
            definition: c.definition || '',
            userAnswer: currentFirstWrongAnswer || rawInput,
            correctFirstTry: false
          });
        }
      }
      // In practice mode: stay on the same card, but enqueue it once to the end.
      if (mode === 'practice') {
        // Record this wrong attempt as a separate try (skip if same as last attempt for same card)
        const last = results[results.length - 1];
        const isDup = last && last.index === idxNow && (last.userAnswer || '') === (rawInput || '');
        if (!isDup) {
          results.push({
            index: idxNow,
            term: c.term || '',
            definition: c.definition || '',
            userAnswer: rawInput,
            correctFirstTry: false
          });
        }
        if (!currentEnqueued) {
          practiceQueue.push(idxNow);
          currentEnqueued = true;
        }
        // Do not advance; let user retry until correct
      }
    }
  }

  function skipQuestion() {
    const idxNow = getCurrentIndex();
    const c = cards[idxNow];
    results.push({
      index: idxNow,
      term: c.term || '',
      definition: c.definition || '',
      userAnswer: '',
      correctFirstTry: false
    });
    if (mode === 'practice') nextPractice(false); else nextTest();
  }

  function nextTest() {
    if (testIdx < testOrder.length - 1) {
      testIdx += 1;
      showTestPrompt();
    } else {
      const total = testOrder.length || 0;
      const percent = total ? Math.round((testCorrect / total) * 100) : 0;
      testFeedback.textContent = 'Hoàn thành bài kiểm tra! Kết quả: ' + testCorrect + '/' + total + ' (' + percent + '%)';
      testFeedback.classList.remove('error');
      testFeedback.classList.add('success');
      testArea.hidden = false;
      renderSummary();
      if (summaryView) {
        testView.hidden = true;
        summaryView.hidden = false;
      }
    }
  }

  function nextPractice(correctNow) {
    if (!practiceQueue.length) return;
    // Remove current from front
    const current = practiceQueue.shift();
    // If wrong, push to end
    if (!correctNow) practiceQueue.push(current);
    if (practiceQueue.length) {
      showTestPrompt();
    } else {
      // Finished when all answered correctly (eventually)
      const total = cards.length || 0;
      const percent = total ? Math.round((testCorrect / total) * 100) : 0;
      testFeedback.textContent = 'Hoàn thành thực hành! Đúng ngay lần đầu: ' + testCorrect + '/' + total + ' (' + percent + '%)';
      testFeedback.classList.remove('error');
      testFeedback.classList.add('success');
      renderSummary();
      if (summaryView) {
        testView.hidden = true;
        summaryView.hidden = false;
      }
    }
  }

  // Overrides for marking an originally wrong item as correct/incorrect in the summary
  const summaryOverrides = new Map(); // index:number -> boolean (true means treat as correct)

  function isEffectiveCorrect(idx, correctFirstTry) {
    return !!(correctFirstTry || summaryOverrides.get(idx));
  }

  function renderSummary() {
    if (!summaryArea) return;
    // Group attempts by index to list multi-attempt answers
    const groups = new Map();
    for (const r of results) {
      if (!groups.has(r.index)) groups.set(r.index, { term: r.term, definition: r.definition, attempts: [], correctFirstTry: r.correctFirstTry });
      const g = groups.get(r.index);
      g.attempts.push(r.userAnswer || '(bỏ qua)');
      // keep correctFirstTry as first record's value
    }
    const totalCards = groups.size || (cards ? cards.length : 0);
    // Effective correctness considers summaryOverrides
    const correct = Array.from(groups.entries()).filter(([idx, g]) => g.correctFirstTry || !!summaryOverrides.get(idx)).length;
    const percent = totalCards ? Math.round((correct / totalCards) * 100) : 0;
    if (summaryHeader) {
      const label = (mode === 'practice') ? 'Kết quả thực hành' : 'Kết quả kiểm tra';
      summaryHeader.innerHTML = `
        <div>${label} — Đúng: ${correct}/${totalCards} (${percent}%)</div>
        <button id="starWrongBtn" class="secondary-btn" style="margin-left: 10px;">
          Đánh dấu sao các câu sai
        </button>
      `;
      
      // Add click handler for the star wrong answers button
      const starWrongBtn = document.getElementById('starWrongBtn');
      if (starWrongBtn) {
        starWrongBtn.addEventListener('click', () => {
          // Get all incorrect answers
          const incorrectIndices = Array.from(groups.entries())
            .filter(([idx, g]) => !g.correctFirstTry)
            .map(([idx]) => idx);
          
          // Mark them as starred
          incorrectIndices.forEach(idx => {
            if (cards[idx]) {
              cards[idx].starred = true;
            }
          });
          
          // Show feedback
          const feedback = document.createElement('div');
          feedback.textContent = `Đã đánh dấu sao ${incorrectIndices.length} câu sai.`;
          feedback.style.marginTop = '10px';
          feedback.style.color = '#0a7f2d';
          summaryHeader.appendChild(feedback);
          
          // Remove feedback after 3 seconds
          setTimeout(() => {
            feedback.remove();
          }, 3000);
        });
      }
    }
    const items = Array.from(groups.entries()).map(function(entry, i) {
      const idx = entry[0];
      const g = entry[1];
      const ok = !!g.correctFirstTry; // original status for styling
      const effOk = ok || !!summaryOverrides.get(idx); // effective status for label/header
      const status = effOk ? 'Đúng' : 'Sai';
      const cls = ok ? 'ok' : 'fail'; // keep original color/class unchanged
      const attemptsList = g.attempts.map(function(a){ return '<li><pre>' + escapeHtml(a) + '</pre></li>'; }).join('');
      const toggleBtn = ok ? '' : ('<button class="mark-toggle" data-index="' + idx + '">' + (effOk ? 'Đánh dấu sai' : 'Đánh dấu đúng') + '</button>');
      const starBtn = '<button class="star-item-btn" style="margin-left: 8px;" data-index="' + idx + '">' + 
                     (cards[idx]?.starred ? '★ Bỏ đánh dấu sao' : '☆ Đánh dấu sao') + '</button>';
      
      return (
        '<div class="summary-item ' + cls + '" data-card-index="' + idx + '">' +
          '<div class="summary-row">' +
            '<span class="badge ' + cls + '">' + status + '</span>' +
            '<span class="summary-idx">#' + (i + 1) + '</span>' +
            toggleBtn +
            starBtn +
          '</div>' +
          '<div class="summary-term"><span class="key">Thuật ngữ:</span> <pre>' + escapeHtml(g.term) + '</pre></div>' +
          '<div class="summary-def"><span class="key">Định nghĩa:</span> <pre>' + escapeHtml(g.definition) + '</pre></div>' +
          '<div class="summary-answer"><span class="key">Bạn trả lời:</span>' +
            (mode === 'test'
              ? ('<pre>' + escapeHtml(g.attempts[0] || '') + '</pre>')
              : ('<ol class="attempts">' + attemptsList + '</ol>')
            ) +
          '</div>' +
        '</div>'
      );
    });
    summaryArea.innerHTML = items.join('');
  }

  // Toggle handler for marking items in summary
  if (summaryArea) {
    summaryArea.addEventListener('click', (e) => {
      const t = e.target;
      if (!t || !t.classList) return;
      
      // Handle mark toggle button
      if (t.classList.contains('mark-toggle')) {
        const idxStr = t.getAttribute('data-index');
        const idx = idxStr != null ? parseInt(idxStr, 10) : NaN;
        if (isNaN(idx)) return;
        const current = !!summaryOverrides.get(idx);
        summaryOverrides.set(idx, !current);
        // Re-render to refresh header and labels (colors remain as original)
        renderSummary();
      }
      
      // Handle star button for individual items
      if (t.classList.contains('star-item-btn')) {
        e.preventDefault();
        e.stopPropagation();
        const cardItem = t.closest('.summary-item');
        if (cardItem) {
          const idxStr = cardItem.getAttribute('data-card-index');
          const idx = idxStr != null ? parseInt(idxStr, 10) : -1;
          if (idx >= 0 && idx < cards.length) {
            cards[idx].starred = !cards[idx].starred;
            t.textContent = cards[idx].starred ? '★ Bỏ đánh dấu sao' : '☆ Đánh dấu sao';
            t.classList.toggle('starred', cards[idx].starred);
          }
        }
      }
    });
  }

  function computeSummaryGroups() {
    const groups = new Map();
    for (const r of results) {
      if (!groups.has(r.index)) groups.set(r.index, { index: r.index, term: r.term, definition: r.definition, attempts: [], correctFirstTry: r.correctFirstTry });
      const g = groups.get(r.index);
      g.attempts.push(r.userAnswer || '(bỏ qua)');
    }
    return Array.from(groups.values());
  }

  function saveSubsetAsJson(which) {
    // which: 'correct' | 'wrong'
    try {
      const groups = computeSummaryGroups();
      const pick = groups.filter(g => {
        const eff = isEffectiveCorrect(g.index, g.correctFirstTry);
        return (which === 'correct') ? eff : !eff;
      });
      const subset = pick.map(g => ({ term: g.term, definition: g.definition }));
      if (!subset.length) {
        status.textContent = which === 'correct' ? 'Không có thẻ đúng để lưu.' : 'Không có thẻ sai để lưu.';
        status.classList.remove('success');
        status.classList.add('error');
        return;
      }
      const data = { title: ((setTitle.textContent || 'Bộ thẻ') + ' - ' + (which === 'correct' ? 'đúng' : 'sai')), count: subset.length, cards: subset };
      const safeTitle = (data.title || 'bo-the').replace(/[^\w\-]+/g, '_').slice(0, 60);
      download(safeTitle + '.json', JSON.stringify(data, null, 2));
      status.textContent = 'Đã lưu file JSON.';
      status.classList.remove('error');
      status.classList.add('success');
    } catch (e) {
      status.textContent = 'Lỗi lưu JSON: ' + (e && e.message ? e.message : e);
      status.classList.remove('success');
      status.classList.add('error');
    }
  }

  function parseJsonTextToCards(text) {
    const obj = JSON.parse(text);
    const arr = Array.isArray(obj) ? obj : obj && obj.cards;
    const list = Array.isArray(arr) ? arr : [];
    const normalized = list.map((c) => ({
      term: (c && (c.term || c.front || c.word)) || '',
      definition: (c && (c.definition || c.back)) || ''
    })).filter((c) => c.term || c.definition);
    return { normalized, title: (obj && obj.title) || '' };
  }

  async function openAdditionalCardsFromJson(file) {
    try {
      const text = await file.text();
      const { normalized } = parseJsonTextToCards(text);
      if (!normalized.length) throw new Error('File JSON không hợp lệ hoặc không có thẻ.');
      cards = (cards || []).concat(normalized);
      countEl.textContent = String(cards.length);
      meta.hidden = false;
      if (modeSwitch) modeSwitch.hidden = false;
      renderStudy();
      // Stop any ongoing speech when new cards are loaded
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      status.textContent = 'Đã thêm ' + normalized.length + ' thẻ từ file JSON.';
      status.classList.remove('error');
      status.classList.add('success');
    } catch (e) {
      status.textContent = 'Lỗi mở thêm file JSON: ' + (e && e.message ? e.message : e);
      status.classList.remove('success');
      status.classList.add('error');
    }
  }

  async function openAdditionalCardsFromJsonText(text) {
    try {
      const { normalized } = parseJsonTextToCards(text);
      if (!normalized.length) throw new Error('File JSON không hợp lệ hoặc không có thẻ.');
      cards = (cards || []).concat(normalized);
      countEl.textContent = String(cards.length);
      meta.hidden = false;
      if (modeSwitch) modeSwitch.hidden = false;
      renderStudy();
      // Stop any ongoing speech when new cards are loaded
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      status.textContent = 'Đã thêm ' + normalized.length + ' thẻ từ JSON.';
      status.classList.remove('error');
      status.classList.add('success');
    } catch (e) {
      status.textContent = 'Lỗi mở thêm JSON: ' + (e && e.message ? e.message : e);
      status.classList.remove('success');
      status.classList.add('error');
    }
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function htmlToTextPreserveBreaks(html) {
    if (!html) return '';
    let s = String(html);
    // Normalize common break tags to \n
    s = s.replace(/<\s*br\s*\/?\s*>/gi, '\n');
    s = s.replace(/<\s*\/p\s*>/gi, '\n');
    s = s.replace(/<\s*\/div\s*>/gi, '\n');
    s = s.replace(/<\s*\/li\s*>/gi, '\n');
    // Remove all other tags
    s = s.replace(/<[^>]+>/g, '');
    // Decode a few common entities
    s = s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    // Normalize newlines
    s = s.replace(/\r\n?|\u2028|\u2029/g, '\n');
    // Collapse spaces but keep newlines
    s = s.split('\n').map(line => line.replace(/[\t ]+/g, ' ').trim()).join('\n');
    // Trim overall and collapse excessive blank lines
    s = s.replace(/\n{3,}/g, '\n\n').trim();
    return s;
  }

  function cleanText(val) {
    if (val == null) return '';
    if (typeof val === 'string') {
      // Keep existing newlines; remove tags if any were passed accidentally
      return htmlToTextPreserveBreaks(val);
    }
    return String(val);
  }

  function mediaToText(media) {
    // Convert Quizlet media structures to plain text
    if (!media) return '';
    // If media is already a string
    if (typeof media === 'string') return cleanText(media);
    // If it's an array of media items
    if (Array.isArray(media)) {
      const parts = media.map((m) => mediaToText(m)).filter(Boolean);
      return cleanText(parts.join('\n'));
    }
    // Object media: try common fields
    if (typeof media === 'object') {
      if (media.plainText) return cleanText(media.plainText);
      if (media.text) return cleanText(media.text);
      // Rich text array
      if (Array.isArray(media.richText)) {
        const parts = media.richText.map((seg) => (seg && (seg.text || seg.plainText)) || '').filter(Boolean);
        return cleanText(parts.join('\n'));
      }
      // Sometimes wrapped as { media: [...]} or { content: ... }
      if (media.media) return mediaToText(media.media);
      if (media.content) return mediaToText(media.content);
    }
    return '';
  }

  function extractFromObj(obj) {
    let title = '';
    const res = [];
    const MAX_VISITS = 120000;
    const MAX_CARDS_EARLY_EXIT = 1000;
    let visits = 0;

    function add(term, definition) {
      const t = cleanText(term);
      const d = cleanText(definition);
      if (t || d) res.push({ term: t, definition: d });
    }

    // Priority BFS
    const queue = [];
    queue.push(obj);
    while (queue.length) {
      const node = queue.shift();
      if (!node) continue;
      if (visits++ > MAX_VISITS) break;

      // If node is a promising JSON string, parse and continue
      if (typeof node === 'string') {
        const s = node.trim();
        if ((s.startsWith('{') || s.startsWith('[')) && /cardsides|studiable|term|definition|wordrichtext|definitionrichtext/i.test(s)) {
          try { queue.unshift(JSON.parse(s)); continue; } catch {}
        }
      }

      if (Array.isArray(node)) {
        for (let i = 0; i < node.length; i++) {
          if (res.length >= MAX_CARDS_EARLY_EXIT) break;
          queue.push(node[i]);
        }
        continue;
      }

      if (typeof node === 'object') {
        // Title detection
        for (const k of ['title', 'name', 'setTitle', 'studyableTitle', 'setTitleText']) {
          if (!title && Object.prototype.hasOwnProperty.call(node, k)) {
            const cand = cleanText(node[k]);
            if (cand) title = cand;
          }
        }

        // Direct terms arrays
        if (Array.isArray(node.terms)) {
          node.terms.forEach((it) => {
            if (!it || typeof it !== 'object') return;
            if ('word' in it && 'definition' in it) add(it.word, it.definition);
            else if ('term' in it && 'definition' in it) add(it.term, it.definition);
            else if (it.roots && typeof it.roots === 'object') add(it.roots.word || it.roots.term, it.roots.definition);
            else if (it.wordRichText || it.definitionRichText) add(mediaToText(it.wordRichText), mediaToText(it.definitionRichText));
          });
        }

        // Common list keys
        for (const listKey of ['items', 'studyableItems', 'studiableItems', 'cards', 'termsWithDefinitions', 'data']) {
          const arr = node[listKey];
          if (Array.isArray(arr)) {
            arr.forEach((it) => {
              if (!it || typeof it !== 'object') return;
              if (Array.isArray(it.cardSides)) {
                const sides = it.cardSides;
                let front = '';
                let back = '';
                if (sides[0]) front = mediaToText(sides[0].media || sides[0].text || sides[0].content || sides[0]);
                if (sides[1]) back = mediaToText(sides[1].media || sides[1].text || sides[1].content || sides[1]);
                add(front, back);
              } else if ('term' in it && 'definition' in it) add(it.term, it.definition);
              else if ('word' in it && 'definition' in it) add(it.word, it.definition);
              else if (it.wordRichText || it.definitionRichText) add(mediaToText(it.wordRichText), mediaToText(it.definitionRichText));
            });
          }
        }

        if (res.length >= MAX_CARDS_EARLY_EXIT) break;

        // Enqueue children with priority: objects with promising keys first
        const children = Object.values(node);
        for (let i = 0; i < children.length; i++) {
          const v = children[i];
          if (typeof v === 'string') {
            const s = v.trim();
            if ((s.startsWith('{') || s.startsWith('[')) && /cardsides|studiable|term|definition|wordrichtext|definitionrichtext/i.test(s)) {
              try { queue.unshift(JSON.parse(s)); continue; } catch {}
            }
          }
          if (v && typeof v === 'object') {
            const keys = Array.isArray(v) ? [] : Object.keys(v);
            const keyStr = keys.join(',').toLowerCase();
            const score = (
              (keyStr.includes('cardsides') ? 5 : 0) +
              (keyStr.includes('studiable') ? 4 : 0) +
              (keyStr.includes('term') ? 3 : 0) +
              (keyStr.includes('definition') ? 3 : 0) +
              (keyStr.includes('items') ? 2 : 0) +
              (keyStr.includes('data') ? 1 : 0)
            );
            if (score >= 4) queue.unshift(v); else queue.push(v);
          } else {
            queue.push(v);
          }
        }
      }
    }

    // Deduplicate
    const seen = new Set();
    const deduped = [];
    for (const c of res) {
      const key = String(c.term) + '||' + String(c.definition);
      if (!seen.has(key) && (c.term || c.definition)) {
        seen.add(key);
        deduped.push(c);
      }
    }
    return { title, cards: deduped };
  }

  function parseHtmlAndExtract(htmlText) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');
    // Find __NEXT_DATA__ script
    let jsonStr = '';
    const nextScript = doc.querySelector('#__NEXT_DATA__');
    if (nextScript && nextScript.textContent) {
      jsonStr = nextScript.textContent;
    }
    if (!jsonStr) {
      // fallback: any script with JSON-looking content
      const scripts = doc.querySelectorAll('script');
      for (const s of scripts) {
        const text = (s.textContent || '').trim();
        if (text.startsWith('{') && text.endsWith('}')) { jsonStr = text; break; }
        const m = /window\.Quizlet\s*=\s*(\{[\s\S]*?\});/m.exec(text);
        if (m) { jsonStr = m[1]; break; }
      }
      
    }
    // If we found JSON, try JSON extraction first
    if (jsonStr) {
      try {
        const obj = JSON.parse(jsonStr);
        const extracted = extractFromObj(obj);
        if (extracted.cards && extracted.cards.length) return extracted;
      } catch (e) {
        
      }
    }

    // DOM-based fallback extraction for saved HTML variants
    const domRes = domExtractCards(doc);
    if (domRes.cards.length) return domRes;

    throw new Error('Không tìm thấy dữ liệu thẻ trong file (thiếu __NEXT_DATA__ và không nhận diện được phần tử DOM).');
  }

  function domExtractCards(doc) {
    // Try to detect title
    let title = '';
    const h1 = doc.querySelector('h1, .UIHeading, [data-testid="set-page-title"], [data-testid="SetPageHeading"]');
    if (h1 && h1.textContent) title = h1.textContent.trim();
    if (!title && doc.title) title = doc.title.replace('| Quizlet', '').trim();

    const cards = [];

    // Strategy 1: Pair by container terms
    const containers = doc.querySelectorAll('[data-testid="SetPageTerm"], .SetPageTerms-term, .TermContent');
    if (containers.length) {
      containers.forEach((el) => {
        const termEl = el.querySelector('[data-testid="TermText"], [data-testid="term-text"], .SetPageTerm-wordText, .TermText');
        const defEl = el.querySelector('[data-testid="DefinitionText"], [data-testid="definition-text"], .SetPageTerm-definitionText, .DefinitionText');
        const term = termEl ? htmlToTextPreserveBreaks(termEl.innerHTML || termEl.textContent || '') : '';
        const def = defEl ? htmlToTextPreserveBreaks(defEl.innerHTML || defEl.textContent || '') : '';
        if ((term && term.trim()) || (def && def.trim())) {
          cards.push({ term: term, definition: def });
        }
      });
      if (cards.length) return { title, cards };
    }

    // Strategy 2: Separate lists of term and def, pair by index
    const termNodes = Array.from(doc.querySelectorAll('[data-testid="TermText"], [data-testid="term-text"], .SetPageTerm-wordText, .TermText'));
    const defNodes = Array.from(doc.querySelectorAll('[data-testid="DefinitionText"], [data-testid="definition-text"], .SetPageTerm-definitionText, .DefinitionText'));
    if (termNodes.length && defNodes.length && termNodes.length === defNodes.length) {
      for (let i = 0; i < termNodes.length; i++) {
        const t = htmlToTextPreserveBreaks(termNodes[i].innerHTML || termNodes[i].textContent || '');
        const d = htmlToTextPreserveBreaks(defNodes[i].innerHTML || defNodes[i].textContent || '');
        if (t || d) cards.push({ term: t, definition: d });
      }
      if (cards.length) return { title, cards };
    }

    // Strategy 3: Look for common React props blobs within attributes (very rare in saved HTML)
    const html = doc.documentElement ? doc.documentElement.innerHTML : '';
    try {
      const m = html.match(/\{\"studiableItems\":[\s\S]*?\}\}\}/);
      if (m) {
        const approx = m[0];
        const safe = approx.replace(/&(amp|lt|gt|quot);/g, (all) => {
          switch (all) {
            case '&amp;': return '&';
            case '&lt;': return '<';
            case '&gt;': return '>';
            case '&quot;': return '"';
            default: return all;
          }
        });
        try {
          const obj = JSON.parse(safe);
          const extracted = extractFromObj(obj);
          if (extracted.cards && extracted.cards.length) return extracted;
        } catch {}
      }
    } catch {}

    return { title, cards: [] };
  }

  async function loadFromFile() {
    const file = fileInput.files && fileInput.files[0];
    if (!file) {
      status.textContent = 'Vui lòng chọn file HTML.';
      status.classList.remove('success');
      status.classList.add('error');
      return;
    }
    try {
      const text = await file.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      try { setFaviconFromDoc(doc); } catch {}

      // Try fast text-based extraction first
      let { title, cards: extracted } = parseFastFromText(text);
      if (!extracted || !extracted.length) {
        // Fallback to DOM-based approach
        const res = parseHtmlAndExtract(text);
        title = res.title;
        extracted = res.cards;
      }
      if (!extracted.length) throw new Error('Không trích xuất được thẻ từ file.');
      const shouldAppend = !!(cards && cards.length && chkAppend && chkAppend.checked);
      if (shouldAppend) {
        cards = (cards || []).concat(extracted);
        countEl.textContent = String(cards.length);
        meta.hidden = false;
        renderStudy();
        // Stop any ongoing speech when new cards are loaded
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
        status.textContent = 'Đã thêm ' + extracted.length + ' thẻ từ file HTML.';
        status.classList.remove('error');
        status.classList.add('success');
      } else {
        cards = extracted;
        setTitle.textContent = title || file.name;
        countEl.textContent = String(cards.length);
        meta.hidden = false;

        idx = 0;
        renderStudy();
        startTest();
        // Stop any ongoing speech when new cards are loaded
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
        status.textContent = 'Đã tải xong.';
        status.classList.add('success');
      }
    } catch (e) {
      const msg = 'Lỗi: ' + (e && e.message ? e.message : e);
      status.textContent = msg;
      status.classList.remove('success');
      status.classList.add('error');
      cards = [];
      renderStudy();
      testArea.hidden = true;
      meta.hidden = true;
      if (modeSwitch) modeSwitch.hidden = true;
    }
  }

  function setFaviconFromDoc(doc) {
    if (!doc) return;
    const link = doc.querySelector('link[rel="shortcut icon"], link[rel="icon"]');
    if (!link) return;
    let href = link.getAttribute('href') || '';
    if (!href) return;
    // Resolve to absolute
    if (/^\//.test(href)) {
      // Quizlet often serves static media under assets.quizlet.com
      href = 'https://assets.quizlet.com' + href;
    }
    // Replace or insert favicon link in our document
    let myIcon = document.querySelector('link[rel="icon"]');
    if (!myIcon) {
      myIcon = document.createElement('link');
      myIcon.setAttribute('rel', 'icon');
      document.head.appendChild(myIcon);
    }
    myIcon.setAttribute('href', href);
    myIcon.setAttribute('type', 'image/png');
  }

  // Study direction toggle
  function updateStudyDirection(newDirection) {
    studyDirection = newDirection;
    if (studyDirDefToTermBtn && studyDirTermToDefBtn) {
      studyDirDefToTermBtn.classList.toggle('active', studyDirection === 'def_to_term');
      studyDirTermToDefBtn.classList.toggle('active', studyDirection === 'term_to_def');
    }
    // Re-render the current card with the new direction
    if (mode === 'study') {
      renderStudy();
    }
  }

  if (studyDirDefToTermBtn) {
    studyDirDefToTermBtn.addEventListener('click', () => updateStudyDirection('def_to_term'));
  }
  if (studyDirTermToDefBtn) {
    studyDirTermToDefBtn.addEventListener('click', () => updateStudyDirection('term_to_def'));
  }
  
  // Set default study direction
  updateStudyDirection('term_to_def');

  // Toggle starred filter
  if (chkStarred) {
    chkStarred.addEventListener('change', () => {
      // Get current cards after filter change
      const currentCards = getCurrentCards();
      // Reset index if it's out of bounds
      if (currentCards.length > 0 && idx >= currentCards.length) {
        idx = 0;
      }
      
      // Update the UI to reflect the filtered cards
      if (mode === 'study') {
        // Reset to first card when filtering
        idx = 0;
        renderStudy();
      } else if (mode === 'test' || mode === 'practice') {
        // Reset test/practice state when filtering
        testIdx = 0;
        testOrder = [];
        if (mode === 'test') {
          startTest();
        } else if (mode === 'practice') {
          startPractice();
        }
      }
      
      // Update the card count
      updateCardCount();
    });
  }

  // Events
  btnLoad.addEventListener('click', loadFromFile);
  if (btnSave) btnSave.addEventListener('click', saveCardsToJson);
  if (btnOpen) btnOpen.addEventListener('click', () => jsonFile && jsonFile.click());
  fileInput.addEventListener('change', () => {
    status.textContent = '';
  });
  if (jsonFile) jsonFile.addEventListener('change', async () => {
    const f = jsonFile.files && jsonFile.files[0];
    if (f) {
      // Respect append checkbox when opening JSON
      const shouldAppend = !!(cards && cards.length && chkAppend && chkAppend.checked);
      if (shouldAppend) {
        await openAdditionalCardsFromJson(f);
      } else {
        await openCardsFromJson(f);
      }
      // reset input so picking the same file again still triggers change
      jsonFile.value = '';
    }
  });
  if (ghList) ghList.addEventListener('click', async (e) => {
    e.preventDefault();
    const t = e.target;
    if (!t || !t.closest) return;
    
    // Handle folder navigation
    const folderLink = t.closest('a.gh-folder');
    if (folderLink) {
      const path = folderLink.getAttribute('data-path') || '';
      await loadGithubBrowser(path);
      return;
    }
    
    // Handle JSON file click
    const jsonLink = t.closest('a.gh-json');
    if (jsonLink) {
      const url = jsonLink.getAttribute('data-url');
      const name = jsonLink.getAttribute('data-name');
      if (url) openCardsFromGithub(url, name);
    }
  });

  modeStudyBtn.addEventListener('click', () => setMode('study'));
  modeTestBtn.addEventListener('click', () => {
    setMode('test');
    startTest();
  });
  if (modePracticeBtn) modePracticeBtn.addEventListener('click', () => {
    setMode('practice');
    startPractice();
  });

  // Initialize speech synthesis
  const synth = window.speechSynthesis;
  let cachedVoices = [];
  function loadVoices() {
    try {
      cachedVoices = synth ? synth.getVoices() : [];
    } catch { cachedVoices = []; }
  }
  if (synth) {
    loadVoices();
    try { synth.addEventListener('voiceschanged', loadVoices); } catch {}
  }
  function isVietnameseText(t) {
    // Remove content within parentheses before language detection
    const cleanedText = String(t || '').replace(/\([^)]*\)/g, '').trim();
    const s = cleanedText.toLowerCase();
    if (!s) return false;
    // Check for Vietnamese-specific diacritics and characters
    const viChars = /[ăâđêôơưáàảãạắằẳẵặấầẩẫậéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i;
    if (viChars.test(s)) return true;
    // Fallback: common Vietnamese words
    const viWords = /(\b)và\b|\bcủa\b|\blà\b|\bmột\b|\bnhững\b|\bcác\b|\bcho\b|\btừ\b|\btrong\b|\bkhi\b|\bđược\b|\bvới\b|\bkhông\b|\bnhư\b|\bđã\b|\bnày\b|\bđó\b|\bthì\b|\bđể\b|\bsẽ\b|\brất\b|\bcó\b|\bnhưng\b|\bhay\b|\bhoặc\b|\btôi\b|\bbạn\b|\bchúng\b|\bta\b/i;
    return viWords.test(s);
  }

  // Function to speak text with auto language detection
  function speakText(text) {
    if (!text || !synth || !chkRead.checked) return;
    
    // Remove content within parentheses
    const cleanedText = text.replace(/\([^)]*\)/g, '').trim();
    if (!cleanedText) return;
    
    // Cancel any ongoing speech
    try { synth.cancel(); } catch {}
    
    // Create a new speech utterance with cleaned text
    const utterance = new SpeechSynthesisUtterance(cleanedText);
    
    // Decide desired language
    const wantVi = isVietnameseText(text);
    let voice = null;
    const list = cachedVoices && cachedVoices.length ? cachedVoices : (synth ? synth.getVoices() : []);
    if (wantVi) {
      voice = (list || []).find(v => v && v.lang && v.lang.toLowerCase().startsWith('vi')) || null;
      utterance.lang = 'vi-VN';
    } else {
      voice = (list || []).find(v => v && v.lang && v.lang.toLowerCase().startsWith('en')) || null;
      utterance.lang = 'en-US';
    }
    if (!voice && list && list.length) voice = list[0];
    if (voice) utterance.voice = voice;
    
    // Set speech properties
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    
    // Speak the text
    try { synth.speak(utterance); } catch {}
  }

  // Create known button
  const knownBtn = document.createElement('button');
  knownBtn.id = 'knownBtn';
  knownBtn.className = 'known-btn';
  knownBtn.textContent = '✓';
  knownBtn.style.position = 'absolute';
  knownBtn.style.top = '10px';
  knownBtn.style.right = '50px';
  knownBtn.style.background = 'none';
  knownBtn.style.border = 'none';
  knownBtn.style.fontSize = '24px';
  knownBtn.style.cursor = 'pointer';
  knownBtn.style.zIndex = '10';
  knownBtn.style.color = '#ccc';
  knownBtn.title = 'Đánh dấu đã biết';
  knownBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const currentCards = getCurrentCards();
    
    // Get the current card from the filtered list
    const filteredCards = currentCards.filter((card) => {
      const cardIndex = cards.findIndex(c => 
        c.term === card.term && c.definition === card.definition
      );
      return !knownCards.has(cardIndex);
    });
    
    if (filteredCards.length > 0 && idx >= 0 && idx < filteredCards.length) {
      const currentCard = filteredCards[idx];
      const cardIndex = cards.findIndex(card => 
        card.term === currentCard.term && 
        card.definition === currentCard.definition
      );
      
      if (cardIndex !== -1) {
        // Store the current card's index for comparison
        const currentCardBeforeToggle = filteredCards[idx];
        
        // Toggle the known status
        toggleKnown(cardIndex);
        
        // Re-render to update the UI with the new known status
        renderStudy();
        
        // After rendering, check if we have a new card in this position
        const currentCardsAfterToggle = getCurrentCards();
        const newFilteredCards = currentCardsAfterToggle.filter(card => {
          const idx = cards.findIndex(c => 
            c.term === card.term && c.definition === card.definition
          );
          return !knownCards.has(idx);
        });
        
        if (newFilteredCards.length > 0 && idx < newFilteredCards.length) {
          const newCard = newFilteredCards[idx];
          // If we have a new card in this position, read it aloud
          if (!currentCardBeforeToggle || 
              newCard.term !== currentCardBeforeToggle.term || 
              newCard.definition !== currentCardBeforeToggle.definition) {
            
            // Use the same logic as in navigateCard to read the text
            if (chkRead && chkRead.checked) {
              const textToRead = studyDirection === 'def_to_term' ? 
                (newCard.definition || '') : 
                (newCard.term || '');
              speakText(textToRead);
            }
          }
        }
      }
    }
  });
  card.appendChild(knownBtn);

  // Create star button
  const starBtn = document.createElement('button');
  starBtn.id = 'starBtn';
  starBtn.className = 'star-btn';
  starBtn.textContent = '☆';
  starBtn.style.position = 'absolute';
  starBtn.style.top = '10px';
  starBtn.style.right = '10px';
  starBtn.style.background = 'none';
  starBtn.style.border = 'none';
  starBtn.style.fontSize = '24px';
  starBtn.style.cursor = 'pointer';
  starBtn.style.zIndex = '10';
  starBtn.style.color = '#ccc';
  starBtn.title = 'Đánh dấu sao (chỉ lưu khi nhấn nút Lưu thẻ)';
  starBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const currentCards = getCurrentCards();
    if (currentCards.length > 0 && idx >= 0 && idx < currentCards.length) {
      const currentCard = currentCards[idx];
      const cardIndex = cards.findIndex(card => 
        card.term === currentCard.term && 
        card.definition === currentCard.definition
      );
      if (cardIndex !== -1) {
        toggleStar(cardIndex);
      }
    }
  });
  card.appendChild(starBtn);
  
  // Add click handler to flip the card when clicked and read the text
  card.addEventListener('click', () => {
    card.classList.toggle('flipped');
    
    // If the card is now flipped (showing back), read the back text
    // If it was flipped and now showing front, read the front text
    const textToRead = card.classList.contains('flipped') 
      ? cardBack.textContent 
      : cardFront.textContent;
      
    speakText(textToRead);
  });
  
  // Update card reading when direction changes
  if (studyDirDefToTermBtn) {
    studyDirDefToTermBtn.addEventListener('click', () => {
      if (chkRead && chkRead.checked) {
        speakText(cardFront.textContent);
      }
    });
  }
  
  if (studyDirTermToDefBtn) {
    studyDirTermToDefBtn.addEventListener('click', () => {
      if (chkRead && chkRead.checked) {
        speakText(cardFront.textContent);
      }
    });
  }

  function navigateCard(offset) {
    if (mode === 'study') {
      const currentCards = getCurrentCards();
      const filteredCards = currentCards.filter((_, index) => !knownCards.has(cards.indexOf(currentCards[index])));
      
      if (filteredCards.length === 0) {
        // No more cards to show, reset known cards and start over
        knownCards.clear();
        idx = 0;
      } else {
        const isLastCard = idx === filteredCards.length - 1 && offset > 0;
        const isFirstCard = idx === 0 && offset < 0;
        
        // Handle "Học tiếp" button
        if (isLastCard && knownCards.size > 0) {
          // Reset index and clear known cards for the next round
          idx = 0;
          knownCards.clear();
        } else {
          // Normal navigation
          idx = (idx + offset + filteredCards.length) % filteredCards.length;
        }
      }
      
      renderStudy();
      updateNextButtonText();
      
      // Read the front of the card if 'Đọc' is enabled
      if (chkRead && chkRead.checked) {
        const textToRead = cardFront.textContent;
        speakText(textToRead);
      }
    }
  }

  if (prevBtn) prevBtn.addEventListener('click', () => navigateCard(-1));
  if (nextBtn) nextBtn.addEventListener('click', () => navigateCard(1));

  checkBtn.addEventListener('click', checkAnswer);
  skipBtn.addEventListener('click', skipQuestion);
  testAnswer.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      checkAnswer();
    }
  });
  if (dirDefToTermBtn) dirDefToTermBtn.addEventListener('click', () => {
    testDirection = 'def_to_term';
    setMode('test');
    startTest();
  });
  if (dirTermToDefBtn) dirTermToDefBtn.addEventListener('click', () => {
    testDirection = 'term_to_def';
    setMode('test');
    startTest();
  });
  if (btnSaveCorrect) btnSaveCorrect.addEventListener('click', () => saveSubsetAsJson('correct'));
  if (btnSaveWrong) btnSaveWrong.addEventListener('click', () => saveSubsetAsJson('wrong'));
  if (btnExport) btnExport.addEventListener('click', exportToQuizletString);
  if (btnExportList) btnExportList.addEventListener('click', exportList);
  if (btnExportStandalone) btnExportStandalone.addEventListener('click', exportStandaloneHtml);
  if (modeExportBtn) modeExportBtn.addEventListener('click', () => {
    setMode('export');
  });
  loadGithubBrowser();
})();
