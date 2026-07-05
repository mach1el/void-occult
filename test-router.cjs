function fix(n, mod = 12){
  return ((n % mod) + mod) % mod;
}
const BRANCHES = ["Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi","Tý","Sửu"];
const CYCLE_BRANCHES = ["Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi"];

function getTieuHanBase(namSinhChi, gioiTinh, namXemChi) {
    let startIndex;
    if(["Dần","Ngọ","Tuất"].includes(namSinhChi)) startIndex = BRANCHES.indexOf("Thìn");
    else if(["Thân","Tý","Thìn"].includes(namSinhChi)) startIndex = BRANCHES.indexOf("Tuất");
    else if(["Tỵ","Dậu","Sửu"].includes(namSinhChi)) startIndex = BRANCHES.indexOf("Mùi");
    else startIndex = BRANCHES.indexOf("Sửu"); // Hợi Mão Mùi
    
    const directionSign = gioiTinh === "male" ? 1 : -1;
    const offset = CYCLE_BRANCHES.indexOf(namXemChi);
    return fix(startIndex + offset * directionSign);
}

console.log("Mùi, Nữ, Xem Tỵ:", BRANCHES[getTieuHanBase("Mùi", "female", "Tỵ")]); // Should be Thân
