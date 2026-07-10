"""Tính toán sao Lưu Niên tự động dựa trên năm."""

STEMS = ["Canh", "Tân", "Nhâm", "Quý", "Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ"]
BRANCHES = ["Thân", "Dậu", "Tuất", "Hợi", "Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi"]

# Lộc Tồn theo Can
LOC_TON_MAP = {
    "Giáp": "Dần", "Ất": "Mão", "Bính": "Tỵ", "Đinh": "Ngọ", "Mậu": "Tỵ",
    "Kỷ": "Ngọ", "Canh": "Thân", "Tân": "Dậu", "Nhâm": "Hợi", "Quý": "Tý"
}

# Tứ hóa lưu niên theo Can (Lộc, Quyền, Khoa, Kỵ)
TU_HOA_MAP = {
    "Giáp": ("Liêm Trinh", "Phá Quân", "Vũ Khúc", "Thái Dương"),
    "Ất": ("Thiên Cơ", "Thiên Lương", "Tử Vi", "Thái Âm"),
    "Bính": ("Thiên Đồng", "Thiên Cơ", "Văn Xương", "Liêm Trinh"),
    "Đinh": ("Thái Âm", "Thiên Đồng", "Thiên Cơ", "Cự Môn"),
    "Mậu": ("Tham Lang", "Thái Âm", "Hữu Bật", "Thiên Cơ"),
    "Kỷ": ("Vũ Khúc", "Tham Lang", "Thiên Lương", "Văn Khúc"),
    "Canh": ("Thái Dương", "Vũ Khúc", "Thái Âm", "Thiên Đồng"),
    "Tân": ("Cự Môn", "Thái Dương", "Văn Khúc", "Văn Xương"),
    "Nhâm": ("Thiên Lương", "Tử Vi", "Tả Phù", "Vũ Khúc"),
    "Quý": ("Phá Quân", "Cự Môn", "Thái Âm", "Tham Lang")
}

def get_stem_branch(year: int) -> tuple[str, str]:
    return STEMS[year % 10], BRANCHES[year % 12]

def get_annual_stars(year: int) -> dict:
    stem, branch = get_stem_branch(year)
    
    # Tính Thiên Mã
    ma = ""
    if branch in ["Thân", "Tý", "Thìn"]: ma = "Dần"
    elif branch in ["Dần", "Ngọ", "Tuất"]: ma = "Thân"
    elif branch in ["Hợi", "Mão", "Mùi"]: ma = "Tỵ"
    elif branch in ["Tỵ", "Dậu", "Sửu"]: ma = "Hợi"

    loc_ton_branch = LOC_TON_MAP[stem]
    idx_loc = BRANCHES.index(loc_ton_branch)
    kinh_duong_branch = BRANCHES[(idx_loc + 1) % 12]
    da_la_branch = BRANCHES[(idx_loc - 1 + 12) % 12]
    
    tu_hoa = TU_HOA_MAP[stem]

    return {
        "year": year,
        "stem": stem,
        "branch": branch,
        "stars": {
            "Lưu Thái Tuế": branch,
            "Lưu Lộc Tồn": loc_ton_branch,
            "Lưu Kình Dương": kinh_duong_branch,
            "Lưu Đà La": da_la_branch,
            "Lưu Thiên Mã": ma
        },
        "mutagens": {
            "Lộc": tu_hoa[0],
            "Quyền": tu_hoa[1],
            "Khoa": tu_hoa[2],
            "Kỵ": tu_hoa[3]
        }
    }
