/* Vỏ ứng dụng Tử Vi: sở hữu form + chọn trường phái, điều phối tới engine đang chọn.
   Mỗi engine tự đọc DOM (form) và tự render vào #chartGrid khi được gọi render(). */
(function(){
  "use strict";

  const HOUR_BRANCHES = ["Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi"];
  const BRANCH_HAN = {
    "Tý":"子","Sửu":"丑","Dần":"寅","Mão":"卯","Thìn":"辰","Tỵ":"巳",
    "Ngọ":"午","Mùi":"未","Thân":"申","Dậu":"酉","Tuất":"戌","Hợi":"亥"
  };
  const HOUR_RANGES = ["23:00-01:00","01:00-03:00","03:00-05:00","05:00-07:00","07:00-09:00","09:00-11:00","11:00-13:00","13:00-15:00","15:00-17:00","17:00-19:00","19:00-21:00","21:00-23:00"];
  const STORAGE_KEY = "tuvi.school";
  const DEFAULT_SCHOOL = "nam-phai";

  const form = document.getElementById("chartForm");
  const controls = ["showMutagens","showPhi","showAnnual"].map(id => document.getElementById(id)).filter(Boolean);
  const hourSelect = document.getElementById("birthHour");
  const annualYear = document.getElementById("annualYear");
  const schoolInputs = Array.from(document.querySelectorAll('input[name="school"]'));

  function activeSchool(){
    const checked = schoolInputs.find(i => i.checked);
    return (checked && checked.value) || DEFAULT_SCHOOL;
  }

  // Lá số luôn dựng ở khung gốc 864×1152 (CSS .frame-mode) rồi transform:scale cho vừa khung hiển thị.
  // Desktop (>1060): vừa cả rộng lẫn cao, căn giữa, không cuộn. ≤1060: vừa bề ngang, cuộn dọc.
  const FRAME_W = 864, FRAME_H = 1296;
  function updateChartView() {
    const grid = document.getElementById("chartGrid");
    const img = document.getElementById("chartImageMobile");
    if(img){ img.hidden = true; img.removeAttribute("src"); }
    if(!grid) return;
    const scroll = grid.parentElement;
    grid.style.display = "";
    grid.style.opacity = "1";
    if(window.innerWidth <= 700 && scroll){
      // Mobile: khung dọc, scale vừa bề ngang, trang cuộn dọc.
      grid.classList.add("frame-mode");
      grid.style.transformOrigin = "top left";
      scroll.style.position = "relative";
      scroll.style.overflow = "hidden";
      scroll.style.padding = "0";
      const availW = scroll.clientWidth;
      if(availW > 50){
        const scale = availW / FRAME_W;
        grid.style.transform = "scale(" + scale + ")";
        scroll.style.height = (FRAME_H * scale) + "px";
      }
    } else {
      // Tablet/Desktop: lưới rộng tự co theo chiều ngang (CSS reflow), gỡ frame-mode + inline styles.
      grid.classList.remove("frame-mode");
      grid.style.transform = "";
      grid.style.transformOrigin = "";
      if(scroll){ scroll.style.position = ""; scroll.style.overflow = ""; scroll.style.padding = ""; scroll.style.height = ""; }
    }
  }
  let frameRAF = null;
  window.addEventListener("resize", () => {
    if(frameRAF) cancelAnimationFrame(frameRAF);
    frameRAF = requestAnimationFrame(updateChartView);
  });

  function render(){
    const engine = (window.TuViEngines || {})[activeSchool()];
    if(engine && typeof engine.render === "function") {
      engine.render();
      updateChartView();
    }
  }

  function setupHourSelect(){
    if(!hourSelect || hourSelect.options.length) return;
    HOUR_BRANCHES.forEach((branch, index) => {
      const opt = document.createElement("option");
      opt.value = branch;
      opt.textContent = `${branch} ${BRANCH_HAN[branch]} · ${HOUR_RANGES[index].replace(/:00/g, "")}`;
      hourSelect.appendChild(opt);
    });
    hourSelect.value = "Dần";
  }

  function setupSchoolSelector(){
    const saved = localStorage.getItem(STORAGE_KEY);
    const target = schoolInputs.find(i => i.value === saved) || schoolInputs.find(i => i.value === DEFAULT_SCHOOL);
    if(target) target.checked = true;
    schoolInputs.forEach(input => input.addEventListener("change", () => {
      localStorage.setItem(STORAGE_KEY, activeSchool());
      render();
    }));
  }

  const SCHOOL_LABEL = {"nam-phai":"Nam phái", "trung-chau":"Trung Châu phái"};
  const PALACE_ORDER = ["Mệnh","Phụ Mẫu","Phúc Đức","Điền Trạch","Quan Lộc","Nô Bộc","Thiên Di","Tật Ách","Tài Bạch","Tử Tức","Phu Thê","Huynh Đệ"];

  function starsByGroup(palace){
    const major = [], phu = [], hoa = [], luu = [];
    (palace.stars || []).forEach(s => {
      if(s.layer === "major") major.push(s);
      else if(/-mutagen$/.test(s.source || "")) hoa.push(s);
      else if(s.source === "annual") luu.push(s);
      else phu.push(s);
    });
    return {major, phu, hoa, luu};
  }
  function starLabel(s){ return s.name + (s.brightness ? `(${s.brightness})` : ""); }
  function fmtMutagens(recs){ return (recs || []).filter(r => r.palace).map(r => `${r.mutagen}→${r.starName}`).join(" · ") || "—"; }
  function pad2(n){ return String(n).padStart(2, "0"); }

  function buildChartText(data, school){
    if(!data) return "";
    const L = [];
    const genderLabel = (document.getElementById("gender") || {}).value === "female" ? "Nữ" : "Nam";
    const thanName = data.palaces[data.thanIndex] ? data.palaces[data.thanIndex].name : "";
    L.push(`LÁ SỐ TỬ VI — ${SCHOOL_LABEL[school] || school}`);
    L.push("=".repeat(46));
    L.push(`Dương lịch: ${pad2(data.solar.day)}/${pad2(data.solar.month)}/${data.solar.year} · giờ ${data.birthHourBranch}`);
    L.push(`Âm lịch: ${pad2(data.lunar.day)}/${pad2(data.lunar.month)}${data.lunar.leap ? " (nhuận)" : ""}/${data.lunar.year} · năm ${data.yearStem} ${data.yearBranch}`);
    L.push(`Giới tính: ${genderLabel} · ${data.yearPolarity} ${genderLabel} · đại vận ${data.direction}`);
    L.push(`Mệnh: ${data.menhBranch} (${data.menhElement}) · Thân: cung ${thanName} · Cục: ${data.cuc.name}`);
    L.push(`Quan hệ Mệnh–Cục: ${data.cucMenhRelation.label}`);
    const mf = data.majorFortunePalace;
    if(mf && mf.majorFortune) L.push(`Đại vận hiện hành: ${mf.majorFortune.start}–${mf.majorFortune.end} tuổi · cung ${mf.name} (${mf.branch})`);
    L.push(`Năm xem: ${data.annualYear} ${data.annualStem} ${data.annualBranch} (${data.nominalAge} tuổi)`);
    if(data.taiTuePalace) L.push(`Lưu Thái Tuế: cung ${data.taiTuePalace.name} (${data.taiTuePalace.branch})`);
    L.push("");
    L.push(`Tứ Hóa năm sinh (${data.yearStem}): ${fmtMutagens(data.natalMutagens)}`);
    if(data.majorMutagens && data.majorMutagens.length) L.push(`Tứ Hóa đại vận: ${fmtMutagens(data.majorMutagens)}`);
    L.push(`Tứ Hóa lưu niên (${data.annualStem}): ${fmtMutagens(data.annualMutagens)}`);
    L.push("");
    L.push("── 12 CUNG ──");
    const ordered = [...data.palaces].sort((a, b) => PALACE_ORDER.indexOf(a.name) - PALACE_ORDER.indexOf(b.name));
    ordered.forEach(p => {
      const g = starsByGroup(p);
      const tags = [];
      if(p.isMenh) tags.push("Mệnh");
      if(p.isThan) tags.push("Thân");
      if(p.majorFortune && p.majorFortune.active) tags.push("đại vận");
      if(p.isTaiTuePalace) tags.push("Thái Tuế");
      L.push(`[${p.name}] ${p.branch} (can ${p.stem})${tags.length ? " «" + tags.join(", ") + "»" : ""}`);
      if(g.major.length) L.push(`  Chính tinh: ${g.major.map(starLabel).join(", ")}`);
      if(g.phu.length)   L.push(`  Phụ tinh: ${g.phu.map(starLabel).join(", ")}`);
      if(g.hoa.length)   L.push(`  Tứ hóa: ${g.hoa.map(s => s.name + (s.targetStar ? "→" + s.targetStar : "")).join(", ")}`);
      if(g.luu.length)   L.push(`  Sao lưu: ${g.luu.map(s => s.name).join(", ")}`);
      if(p.changSheng)   L.push(`  Tràng sinh: ${p.changSheng}`);
    });
    L.push("");
    L.push("(Lá số lập bởi Void Occult · Tử Vi Đẩu Số — dán vào trợ lý AI để luận giải)");
    return L.join("\n");
  }

  function currentChartText(){
    const school = activeSchool();
    const engine = (window.TuViEngines || {})[school];
    const data = engine && engine.getData ? engine.getData() : null;
    return buildChartText(data, school);
  }

  function copyText(text){
    if(navigator.clipboard && window.isSecureContext){
      return navigator.clipboard.writeText(text);
    }
    return new Promise((resolve, reject) => {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy") ? resolve() : reject(); }
      catch(e){ reject(e); }
      finally { document.body.removeChild(ta); }
    });
  }

  function flashButton(btn, text){
    if(!btn) return;
    const prev = btn.textContent;
    btn.textContent = text;
    btn.disabled = true;
    setTimeout(() => { btn.textContent = prev; btn.disabled = false; }, 1400);
  }

  function chartFileStamp(){
    const engine = (window.TuViEngines || {})[activeSchool()];
    const data = engine && engine.getData ? engine.getData() : null;
    return data ? `${pad2(data.solar.day)}${pad2(data.solar.month)}${data.solar.year}` : "laso";
  }

  function downloadBlob(blob, filename){
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function setupExport(){
    const copyBtn = document.getElementById("copyChartText");
    const dlBtn = document.getElementById("downloadChartText");
    const imgBtn = document.getElementById("downloadChartImage");
    if(copyBtn) copyBtn.addEventListener("click", () => {
      const text = currentChartText();
      if(!text){ flashButton(copyBtn, "Chưa có lá số"); return; }
      copyText(text).then(() => flashButton(copyBtn, "Đã chép ✓"))
        .catch(() => flashButton(copyBtn, "Lỗi sao chép"));
    });
    if(dlBtn) dlBtn.addEventListener("click", () => {
      const text = currentChartText();
      if(!text){ flashButton(dlBtn, "Chưa có lá số"); return; }
      const blob = new Blob([text], {type:"text/plain;charset=utf-8"});
      downloadBlob(blob, `la-so-tu-vi-${activeSchool()}-${chartFileStamp()}.txt`);
      flashButton(dlBtn, "Đã tải ✓");
    });
    if(imgBtn) imgBtn.addEventListener("click", () => {
      const original = imgBtn.textContent;
      const grid = document.getElementById("chartGrid");
      if(typeof html2canvas !== "function"){ flashButton(imgBtn, "Thiếu thư viện"); return; }
      if(!grid || !grid.children.length){ flashButton(imgBtn, "Chưa có lá số"); return; }
      imgBtn.disabled = true;
      imgBtn.textContent = "Đang tạo…";
      html2canvas(grid, {
        backgroundColor: "#0c0a18",
        scale: 2,
        useCORS: true,
        // Bỏ qua ảnh nền con giáp (tránh "tainted canvas" khi mở bằng file://)
        ignoreElements: (el) => el.classList && el.classList.contains("zodiac-bg")
      })
        .then(canvas => new Promise((resolve, reject) =>
          canvas.toBlob(b => b ? resolve(b) : reject(new Error("toBlob trả về null")))))
        .then(blob => {
          downloadBlob(blob, `la-so-tu-vi-${activeSchool()}-${chartFileStamp()}.png`);
          imgBtn.disabled = false;
          imgBtn.textContent = "Đã tải ✓";
          setTimeout(() => { imgBtn.textContent = original; }, 1400);
        })
        .catch(err => {
          console.error("Export ảnh lỗi:", err);
          imgBtn.disabled = false;
          imgBtn.textContent = "Lỗi — thử mở qua http";
          setTimeout(() => { imgBtn.textContent = original; }, 2000);
        });
    });
  }

  function setupForm(){
    setupHourSelect();
    if(annualYear){
      if(!annualYear.value) annualYear.value = new Date().getFullYear();
      // Chỉ kẹp giá trị lưu niên khi rời ô (blur), không kẹp lúc đang gõ.
      annualYear.addEventListener("blur", () => {
        const v = Number(annualYear.value);
        if(!v) return;
        annualYear.value = Math.max(1900, Math.min(2100, v));
        render();
      });
    }
    if(form){
      form.addEventListener("input", render);
      form.addEventListener("change", render);
    }
    controls.forEach(control => control.addEventListener("change", render));
  }

  setupForm();
  setupSchoolSelector();
  setupExport();
  render();
})();
