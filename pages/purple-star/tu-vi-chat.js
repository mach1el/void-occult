/* Chat luận giải lá số Tử Vi — gọi backend Python (FastAPI).
   - Build prompt (liên cung) + RAG + LLM chạy server-side; API key ẩn ở backend.
   - Frontend gửi {question, chartText, chart, history} và stream kết quả về.
   - BACKEND_URL cấu hình trong tu-vi-config.js; mặc định dùng cùng origin. */
(function(){
  "use strict";

  const LS_KEY = "voidocc.gemini.key";
  const LS_MODEL = "voidocc.gemini.model";
  const DEFAULT_MODEL = "gemini-2.5-flash";

  const $ = (id) => document.getElementById(id);
  let history = []; // {role:"user"|"model", text}
  let busy = false;

  // Ưu tiên config do dev đặt sẵn (tu-vi-config.js) -> user không cần nhập; fallback localStorage/UI.
  function cfg(k){ return (window.VOIDOCC_CONFIG && window.VOIDOCC_CONFIG[k]) ? String(window.VOIDOCC_CONFIG[k]).trim() : ""; }
  function storedModel(){ return (localStorage.getItem(LS_MODEL) || "").trim(); }
  function getKey(){ return cfg("GEMINI_API_KEY") || (localStorage.getItem(LS_KEY) || "").trim(); }
  function getModel(){ return cfg("GEMINI_MODEL") || storedModel() || DEFAULT_MODEL; }
  function syncModelInput(){
    const input = $("aiModel");
    if(input) input.value = getModel();
  }

  function escapeHtml(s){
    return s.replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c]));
  }

  // Markdown rất nhẹ: **đậm**, *nghiêng*, gạch đầu dòng, xuống dòng.
  function formatMarkdown(text){
    const lines = escapeHtml(text).split(/\n/);
    let html = "", inList = false;
    const inline = (s) => s
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*])\*(?!\s)(.+?)\*(?!\*)/g, "$1<em>$2</em>")
      .replace(/`([^`]+)`/g, "<code>$1</code>");
    for(let raw of lines){
      const line = raw.trim();
      const li = line.match(/^[-*•]\s+(.*)/) || line.match(/^\d+[.)]\s+(.*)/);
      if(li){
        if(!inList){ html += "<ul>"; inList = true; }
        html += "<li>" + inline(li[1]) + "</li>";
      } else {
        if(inList){ html += "</ul>"; inList = false; }
        if(line) html += "<p>" + inline(line) + "</p>";
      }
    }
    if(inList) html += "</ul>";
    return html || "<p></p>";
  }

  function addMsg(role, text, opts){
    const wrap = $("aiChatMsgs");
    const el = document.createElement("div");
    el.className = "ai-msg ai-msg-" + role + (opts && opts.cls ? " " + opts.cls : "");
    
    const avatar = role === "ai" ? "🔮" : "👤";
    const avatarHtml = `<div class="ai-msg-avatar">${avatar}</div>`;
    const contentHtml = `<div class="ai-msg-content">${role === "ai" ? formatMarkdown(text) : escapeHtml(text)}</div>`;
    
    el.innerHTML = avatarHtml + contentHtml;
    wrap.appendChild(el);
    wrap.scrollTop = wrap.scrollHeight;
    return el;
  }

  function backendUrl(){
    const base = cfg("BACKEND_URL") || (localStorage.getItem("voidocc.backend") || "").trim();
    return base ? base.replace(/\/+$/, "") : window.location.origin;
  }

  // Gọi backend Python (FastAPI) — build prompt/RAG + LLM chạy server-side, stream kết quả về.
  async function callGemini(userText){
    const chartText = (window.VoidOccult && window.VoidOccult.getChartText) ? window.VoidOccult.getChartText() : "";
    const chart = (window.VoidOccult && window.VoidOccult.getChartData) ? window.VoidOccult.getChartData() : null;
    if(!chartText || !chart){ addMsg("ai", "Chưa có lá số để luận. Hãy nhập dữ liệu sinh trước.", {cls:"is-warn"}); return; }

    const priorHistory = history.slice(); // lịch sử TRƯỚC câu hỏi hiện tại
    history.push({ role: "user", text: userText });
    addMsg("user", userText);
    const thinking = addMsg("ai", "Đang luận giải…", {cls:"is-thinking"});
    busy = true; setSendState();
    const contentEl = thinking.querySelector(".ai-msg-content");

    try {
      const resp = await fetch(backendUrl() + "/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userText, chartText, chart, history: priorHistory })
      });
      if(!resp.ok || !resp.body){
        let msg = "HTTP " + resp.status;
        try { const j = await resp.json(); if(j && j.error) msg = j.error; } catch(_){}
        throw new Error(msg);
      }
      thinking.classList.remove("is-thinking");
      const reader = resp.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      for(;;){
        const { done, value } = await reader.read();
        if(done) break;
        acc += dec.decode(value, { stream: true });
        contentEl.innerHTML = formatMarkdown(acc);
        const w = $("aiChatMsgs"); if(w) w.scrollTop = w.scrollHeight;
      }
      if(!acc.trim()) throw new Error("Backend không trả về nội dung");
      history.push({ role: "model", text: acc });
    } catch(err) {
      thinking.classList.remove("is-thinking");
      thinking.classList.add("is-warn");
      contentEl.innerHTML = formatMarkdown("⚠ Lỗi: " + (err && err.message ? err.message : err) +
        "\n\nKiểm tra backend và central routing đã chạy, hoặc cấu hình `BACKEND_URL`.");
      if(history.length && history[history.length-1].role === "user") history.pop();
    } finally {
      busy = false; setSendState();
    }
  }

  function setSendState(){
    const btn = $("aiChatSend"), ta = $("aiChatText");
    if(btn) btn.disabled = busy;
    if(ta) ta.disabled = busy;
  }

  function autoGrow(ta){ ta.style.height = "auto"; ta.style.height = Math.min(120, ta.scrollHeight) + "px"; }

  function setup(){
    const panel = $("aiChatPanel");
    if(!panel) return;

    // nạp key/model đã lưu
    if($("aiApiKey")) $("aiApiKey").value = getKey();
    syncModelInput();

    if(!history.length){
      addMsg("ai", "Chào bạn! Tôi là trợ lý luận giải Tử Vi.\n\nBạn có thể hỏi về **tổng quan mệnh cách, sự nghiệp, tài chính, tình duyên, sức khỏe** hoặc **đại vận/lưu niên** của lá số đang hiển thị nhé.", {cls:"is-intro"});
    }

    const settingsBtn = $("aiChatSettings");
    if(settingsBtn) settingsBtn.addEventListener("click", () => {
      const b = $("aiChatSettingsBox"); b.hidden = !b.hidden;
    });

    const clearBtn = $("aiChatClear");
    if(clearBtn) clearBtn.addEventListener("click", () => {
      history = []; $("aiChatMsgs").innerHTML = "";
      addMsg("ai", "Đã xoá hội thoại. Bạn muốn hỏi gì tiếp theo?", {cls:"is-intro"});
    });
    
    const saveKeyBtn = $("aiSaveKey");
    if(saveKeyBtn) saveKeyBtn.addEventListener("click", () => {
      localStorage.setItem(LS_KEY, ($("aiApiKey").value || "").trim());
      const model = ($("aiModel").value || "").trim() || DEFAULT_MODEL;
      $("aiModel").value = model;
      if(model === DEFAULT_MODEL) localStorage.removeItem(LS_MODEL);
      else localStorage.setItem(LS_MODEL, model);
      $("aiChatSettingsBox").hidden = true;
      addMsg("ai", "Đã lưu cài đặt ✓", {cls:"is-intro"});
    });

    const formEl = $("aiChatForm"), ta = $("aiChatText");
    formEl.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = (ta.value || "").trim();
      if(!text || busy) return;
      ta.value = ""; autoGrow(ta);
      callGemini(text);
    });
    ta.addEventListener("input", () => autoGrow(ta));
    ta.addEventListener("keydown", (e) => {
      if(e.key === "Enter" && !e.shiftKey){ e.preventDefault(); formEl.requestSubmit(); }
    });
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", setup);
  else setup();
})();
