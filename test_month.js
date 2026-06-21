const BRANCHES = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];
function fix(n) { return ((n % 12) + 12) % 12; }
function adjustedLunarMonth(month, day, isLeap) { return month + (isLeap && day > 15 ? 1 : 0); }
function getSmallLimitStartIndex(yearBranch){
    if(["Dần","Ngọ","Tuất"].includes(yearBranch)) return BRANCHES.indexOf("Thìn"); // 4
    if(["Thân","Tý","Thìn"].includes(yearBranch)) return BRANCHES.indexOf("Tuất"); // 10
    if(["Tỵ","Dậu","Sửu"].includes(yearBranch)) return BRANCHES.indexOf("Mùi"); // 7
    return BRANCHES.indexOf("Sửu"); // 1
}

const yearBranch = "Dần";
const gender = "male";
const nominalAge = 29;

const startIndex = getSmallLimitStartIndex(yearBranch);
const directionSign = 1;
const activeIndex = fix(startIndex + ((nominalAge - 1) % 12) * directionSign);

const monthAnchorIndex = activeIndex;
const birthMonth = 10;
const birthDay = 1;
const hourIndex = 2; // Dần

const adjustedMonth = adjustedLunarMonth(birthMonth, birthDay, false);
const monthStartIndex = fix(monthAnchorIndex - adjustedMonth + hourIndex + 1);

console.log("Tiểu hạn: " + BRANCHES[activeIndex]);
console.log("Tháng 1: " + BRANCHES[monthStartIndex]);
