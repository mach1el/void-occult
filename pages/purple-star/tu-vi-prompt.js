/* Bộ tạo PROMPT luận giải Tử Vi (question-aware, bám sát lá số).
 *
 * Không cần KB/server. Toàn bộ "tri thức" ở đây là TẤT ĐỊNH/cấu trúc:
 *   - Phân loại câu hỏi -> cung trọng tâm.
 *   - Dựng liên cung (tam hợp ±4 chi, xung chiếu +6, giáp ±1) ngay từ dữ liệu lá số.
 *   - Phát hiện cách cục (tổ hợp chính tinh) trong nhóm cung đang xét.
 *   - Tính sẵn sinh-khắc ngũ hành (sao vs Bản mệnh, sát tinh vs chính tinh tọa thủ).
 *   - Truy Tứ Hóa phi tinh rơi vào nhóm cung đang xét (đặc biệt Kỵ/Lộc).
 * Ý nghĩa luận vẫn do model đảm nhiệm, nhưng prompt ép tư duy liên cung và
 * chỉ đưa dữ kiện THỰC CÓ -> chống bịa sao, bám sát lá số.
 *
 * API: window.VoidOccult.buildFocus(question) -> string (khối "trọng tâm" prepend vào câu hỏi).
 */
(function(){
  "use strict";

  const FIVE = ["Kim","Mộc","Thủy","Hỏa","Thổ"];
  const SINH = {"Mộc":"Hỏa","Hỏa":"Thổ","Thổ":"Kim","Kim":"Thủy","Thủy":"Mộc"};
  const KHAC = {"Mộc":"Thổ","Thổ":"Thủy","Thủy":"Hỏa","Hỏa":"Kim","Kim":"Mộc"};

  const fix = (n) => ((n % 12) + 12) % 12;
  const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d").replace(/Đ/g, "d").toLowerCase();
  function elementOf(s){ const n = norm(s); for(const e of FIVE){ if(n.includes(norm(e))) return e; } return ""; }

  // ── Phân loại câu hỏi -> cung trọng tâm ──
  const INTENTS = [
    {key:"wealth",  label:"Tài chính / tiền bạc",        palace:"Tài Bạch",
     kw:["tai chinh","tien","tai loc","tai bach","thu nhap","giau","dau tu","tai san","kiem tien","luong","no nan"]},
    {key:"career",  label:"Sự nghiệp / công danh",       palace:"Quan Lộc",
     kw:["su nghiep","cong viec","cong danh","nghe nghiep","nghe ","thang tien","thang chuc","quan loc","chuc vu","kinh doanh","khoi nghiep","cong ty","lam an","du an","cong chuc"]},
    {key:"love",    label:"Tình duyên / hôn nhân",       palace:"Phu Thê",
     kw:["tinh duyen","tinh cam","hon nhan","vo chong","ban doi","nguoi yeu","ket hon","cuoi","phu the","tinh yeu","yeu duong"," chong"," vo ","ly hon"]},
    {key:"health",  label:"Sức khỏe / tật ách",          palace:"Tật Ách",
     kw:["suc khoe","benh","tat ach","om dau","tai nan"," tho ","an uong"]},
    {key:"property",label:"Nhà cửa / điền sản",          palace:"Điền Trạch",
     kw:["nha cua","nha ","dat dai","dat ","bat dong san","dien trach","gia dao","mua nha"]},
    {key:"children",label:"Con cái",                     palace:"Tử Tức",
     kw:["con cai"," con ","tu tuc","sinh con","sinh no","duong con"]},
    {key:"parents", label:"Cha mẹ / bề trên",            palace:"Phụ Mẫu",
     kw:["cha me","bo me","phu mau"," cha "," me "]},
    {key:"siblings",label:"Anh chị em",                  palace:"Huynh Đệ",
     kw:["anh em","huynh de","chi em","anh chi"]},
    {key:"friends", label:"Bạn bè / cấp dưới / đối tác", palace:"Nô Bộc",
     kw:["ban be","nhan vien","cap duoi","doi tac","no boc","dong nghiep"]},
    {key:"fortune", label:"Phúc đức / tinh thần",        palace:"Phúc Đức",
     kw:["phuc duc","huong thu","tam linh","phuc phan","an nhan","binh an","may man","tinh than"]},
    {key:"travel",  label:"Thiên di / xuất ngoại",       palace:"Thiên Di",
     kw:["xuat ngoai","di chuyen","di xa","nuoc ngoai","thien di","moi truong","chuyen di","di cu","dinh cu"]},
    {key:"overview",label:"Tổng quan mệnh cách",         palace:"Mệnh",
     kw:["tong quan","tong the","tong quat"," menh ","tinh cach","con nguoi","ban than","van menh","cuoc doi","la so"]},
  ];
  const TIMING_KW = ["nam nay","nam toi","nam sau","dai van","luu nien","van han","van trinh","thoi diem","khi nao","bao gio","sap toi","giai doan","thang nay","2024","2025","2026","2027"];

  // ── Cách cục (tổ hợp chính tinh) ──
  const CACH_CUC = [
    {id:"Sát-Phá-Tham",          m:["Thất Sát","Phá Quân","Tham Lang"],               min:2, note:"trục biến động, khai phá, thăng trầm mạnh"},
    {id:"Cơ-Nguyệt-Đồng-Lương",  m:["Thiên Cơ","Thái Âm","Thiên Đồng","Thiên Lương"], min:3, note:"trục ổn định, tham mưu, chuyên môn/hành chính; không gộp với Âm-Dương-Lương"},
    {id:"Âm-Dương-Lương",        m:["Thái Âm","Thái Dương","Thiên Lương"],            min:3, note:"âm dương phối Thiên Lương, thiên về danh, đạo lý, quý khí"},
    {id:"Tử-Phủ",                m:["Tử Vi","Thiên Phủ"],                             min:2, note:"trục lãnh đạo, ổn trọng, quản trị"},
    {id:"Nhật-Nguyệt",           m:["Thái Dương","Thái Âm"],                          min:2, note:"âm dương song huy, danh & tài (tốt/xấu tùy miếu hãm)"},
    {id:"Cự-Cơ",                 m:["Cự Môn","Thiên Cơ"],                             min:2, note:"khẩu tài, tư duy nhanh, dễ thị phi"},
    {id:"Cự-Nhật",               m:["Cự Môn","Thái Dương"],                           min:2, note:"khẩu tài + danh, hợp ngoại giao/giảng dạy"},
    {id:"Liêm-Tham",             m:["Liêm Trinh","Tham Lang"],                        min:2, note:"giao tế, dục vọng, nghệ thuật"},
    {id:"Vũ-Tham",               m:["Vũ Khúc","Tham Lang"],                           min:2, note:"tài tinh + đào hoa, thường phát muộn"},
    {id:"Vũ-Phủ",                m:["Vũ Khúc","Thiên Phủ"],                           min:2, note:"kho tài, tài chính vững"},
    {id:"Tử-Tham",               m:["Tử Vi","Tham Lang"],                             min:2, note:"quyền + dục, đào hoa quyền lực"},
    {id:"Liêm-Tướng",            m:["Liêm Trinh","Thiên Tướng"],                      min:2, note:"chính trực, công quyền"},
  ];

  const SAT = ["Kình Dương","Đà La","Hỏa Tinh","Linh Tinh","Địa Không","Địa Kiếp"];
  const KEY_PHU = SAT.concat(["Tả Phụ","Hữu Bật","Thiên Khôi","Thiên Việt","Văn Xương","Văn Khúc","Lộc Tồn","Thiên Mã","Đào Hoa","Hồng Loan","Thiên Hình","Thiên Riêu"]);

  // ── Truy cập lá số đang hiển thị ──
  function chartCtx(){
    const VO = window.VoidOccult || {};
    const school = VO.getSchool ? VO.getSchool() : "nam-phai";
    const eng = (window.TuViEngines || {})[school] || {};
    const data = eng.getData ? eng.getData() : null;
    const ef = eng.elementForStar || (() => "");
    return { data, ef };
  }
  const palaceByName = (data, name) => data.palaces.find(p => p.name === name);
  const relPalace = (data, i) => data.palaces[fix(i)];
  function groupStars(p){
    const major = [], phu = [], hoa = [], luu = [];
    (p.stars || []).forEach(s => {
      if(s.layer === "major") major.push(s);
      else if(/-mutagen$/.test(s.source || "")) hoa.push(s);
      else if(s.source === "annual") luu.push(s);
      else phu.push(s);
    });
    return { major, phu, hoa, luu };
  }
  const lbl = (s) => s.name + (s.brightness ? `(${s.brightness})` : "");
  function relate(a, b){
    if(!a || !b) return "";
    if(a === b) return `đồng hành (${a})`;
    if(SINH[a] === b) return `${a} sinh ${b}`;
    if(SINH[b] === a) return `${b} sinh ${a}`;
    if(KHAC[a] === b) return `${a} khắc ${b}`;
    if(KHAC[b] === a) return `${b} khắc ${a}`;
    return "";
  }

  function classifyIntent(q){
    const n = " " + norm(q) + " ";
    let found = null;
    for(const it of INTENTS){ if(it.kw.some(k => n.includes(k))){ found = it; break; } }
    if(!found) found = INTENTS.find(i => i.key === "overview");
    return { intent: found, timing: TIMING_KW.some(k => n.includes(k)) };
  }

  // Nhóm cung liên quan: chính + tam hợp (±4) + xung chiếu (+6) + giáp (±1)
  function selectPalaces(data, intent){
    const primary = palaceByName(data, intent.palace);
    if(!primary) return [];
    const i = primary.index;
    return [
      { p: primary,            role: "chính" },
      { p: relPalace(data, i - 4), role: "tam hợp" },
      { p: relPalace(data, i + 4), role: "tam hợp" },
      { p: relPalace(data, i + 6), role: "xung chiếu" },
      { p: relPalace(data, i - 1), role: "giáp" },
      { p: relPalace(data, i + 1), role: "giáp" },
    ];
  }

  function detectCachCuc(subset){
    const names = new Set();
    subset.forEach(x => (x.p.stars || []).forEach(s => { if(s.layer === "major") names.add(s.name); }));
    return CACH_CUC.filter(c => c.m.filter(m => names.has(m)).length >= c.min);
  }

  function huaIntoSet(data, setNames, recs, tag){
    const out = [];
    (recs || []).forEach(r => {
      if(r.palace && setNames.has(r.palace.name)){
        const flag = r.mutagen === "Kỵ" ? " ⚠ điểm vướng" : (r.mutagen === "Lộc" ? " ✦ điểm thông" : "");
        out.push(`${tag} Hóa ${r.mutagen} (${r.starName}) → ${r.palace.name}${flag}`);
      }
    });
    return out;
  }

  function buildFocus(question){
    const { data, ef } = chartCtx();
    if(!data) return "";
    const { intent, timing } = classifyIntent(question);
    const set = selectPalaces(data, intent);
    if(!set.length) return "";
    const setNames = new Set(set.map(x => x.p.name));
    const menhEl = elementOf(data.menhElement);
    const L = [];

    L.push(`[TRỌNG TÂM] Câu hỏi thuộc nhóm: ${intent.label}. Bắt buộc luận theo liên cung dưới đây (không đọc cung đơn lẻ):`);
    set.forEach(x => {
      const g = groupStars(x.p);
      const parts = [];
      if(g.major.length) parts.push("Chính tinh: " + g.major.map(lbl).join(", "));
      const kp = g.phu.filter(s => KEY_PHU.includes(s.name));
      if(kp.length) parts.push("Phụ tinh: " + kp.map(lbl).join(", "));
      if(g.hoa.length) parts.push("Tứ Hóa: " + g.hoa.map(s => s.name + (s.targetStar ? `→${s.targetStar}` : "")).join(", "));
      if(g.luu.length) parts.push("Sao lưu: " + g.luu.map(s => s.name).join(", "));
      const empty = x.role === "giáp" ? " — trống (không tạo thế giáp)" : " — vô chính diệu (mượn sao cung xung chiếu để luận)";
      L.push(`• [${x.role}] ${x.p.name} (${x.p.branch})` + (parts.length ? " — " + parts.join(" | ") : empty));
    });

    const cc = detectCachCuc(set.filter(x => x.role !== "giáp"));
    if(cc.length) L.push(`[CÁCH CỤC] ${cc.map(c => `${c.id} (${c.note})`).join("; ")}`);

    // Sinh-khắc ngũ hành — tính sẵn để model không suy sai
    const sk = [];
    if(menhEl){
      set.filter(x => x.role === "chính" || x.role === "tam hợp").forEach(x => {
        const g = groupStars(x.p);
        const chinh = g.major[0];
        const chinhEl = chinh ? ef(chinh.name) : "";
        g.major.forEach(s => { const r = relate(ef(s.name), menhEl); if(r) sk.push(`${s.name}(${ef(s.name)}) ↔ Bản mệnh ${menhEl}: ${r}`); });
        g.phu.filter(s => SAT.includes(s.name)).forEach(s => {
          const e = ef(s.name);
          const r1 = relate(e, menhEl);
          const r2 = chinhEl ? relate(e, chinhEl) : "";
          sk.push(`Sát tinh ${s.name}(${e}) tại ${x.p.name}` +
            ` ↔ Bản mệnh ${menhEl}: ${r1 || "—"}` +
            (chinh ? `; ↔ ${chinh.name}(${chinhEl}) tọa thủ: ${r2 || "—"}` : ""));
        });
      });
    }
    if(sk.length){ L.push("[NGŨ HÀNH SINH-KHẮC — đã tính sẵn, dùng đúng kết quả này]"); sk.slice(0, 12).forEach(s => L.push("• " + s)); }

    // Tứ Hóa phi tinh rơi vào nhóm cung đang xét
    const hua = []
      .concat(huaIntoSet(data, setNames, data.natalMutagens, "Năm sinh:"))
      .concat(huaIntoSet(data, setNames, data.annualMutagens, `Lưu niên ${data.annualStem}:`));
    if(timing) hua.push(...huaIntoSet(data, setNames, data.majorMutagens, "Đại vận:"));
    if(hua.length){ L.push("[TỨ HÓA PHI TINH vào nhóm cung đang xét]"); hua.forEach(h => L.push("• " + h)); }

    if(timing){
      const mf = data.majorFortunePalace;
      if(mf && mf.majorFortune) L.push(`[ĐẠI VẬN hiện hành] ${mf.majorFortune.start}–${mf.majorFortune.end} tuổi tại ${mf.name} (${mf.branch}).`);
      L.push(`[LƯU NIÊN] ${data.annualYear} ${data.annualStem} ${data.annualBranch} (${data.nominalAge} tuổi)` +
        (data.taiTuePalace ? ` · Thái Tuế tại ${data.taiTuePalace.name} (${data.taiTuePalace.branch})` : "") + ".");
    }

    L.push("[YÊU CẦU] Chỉ luận trên cung/sao đã liệt kê; mỗi nhận định nêu căn cứ (cung + cách cục + sinh-khắc + Tứ Hóa). Tuyệt đối không thêm sao/cung không có ở trên.");
    return L.join("\n");
  }

  window.VoidOccult = window.VoidOccult || {};
  window.VoidOccult.buildFocus = buildFocus;
  window.VoidOccult.classifyIntent = (q) => classifyIntent(q).intent.key; // debug
})();
