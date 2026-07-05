(() => {
  const STEMS = ["Giáp","Ất","Bính","Đinh","Mậu","Kỷ","Canh","Tân","Nhâm","Quý"];
  const STEM_HAN = {Giáp:"甲",Ất:"乙",Bính:"丙",Đinh:"丁",Mậu:"戊",Kỷ:"己",Canh:"庚",Tân:"辛",Nhâm:"壬",Quý:"癸"};
  const BRANCHES = ["Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi","Tý","Sửu"];
  const BRANCH_HAN = {Tý:"子",Sửu:"丑",Dần:"寅",Mão:"卯",Thìn:"辰",Tỵ:"巳",Ngọ:"午",Mùi:"未",Thân:"申",Dậu:"酉",Tuất:"戌",Hợi:"亥"};
  const BRANCH_ZODIAC_NAME = {Tý:"Chuột",Sửu:"Trâu",Dần:"Hổ",Mão:"Mèo",Thìn:"Rồng",Tỵ:"Rắn",Ngọ:"Ngựa",Mùi:"Dê",Thân:"Khỉ",Dậu:"Gà",Tuất:"Chó",Hợi:"Heo"};
  const BRANCH_ZODIAC_ASSET = {
    Tý:"/assets/zodiac/transparent/ty.png",
    Sửu:"/assets/zodiac/transparent/suu.png",
    Dần:"/assets/zodiac/transparent/dan.png",
    Mão:"/assets/zodiac/transparent/mao.png",
    Thìn:"/assets/zodiac/transparent/thin.png",
    Tỵ:"/assets/zodiac/transparent/ti.png",
    Ngọ:"/assets/zodiac/transparent/ngo.png",
    Mùi:"/assets/zodiac/transparent/mui.png",
    Thân:"/assets/zodiac/transparent/than.png",
    Dậu:"/assets/zodiac/transparent/dau.png",
    Tuất:"/assets/zodiac/transparent/tuat.png",
    Hợi:"/assets/zodiac/transparent/hoi.png"
  };
  const CYCLE_BRANCHES = ["Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi"];
  const HOUR_BRANCHES = ["Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi"];
  const MONTH_NAMES = ["Giêng","Hai","Ba","Tư","Năm","Sáu","Bảy","Tám","Chín","Mười","Một","Chạp"];
  const PALACES_BY_FORWARD_BRANCH = ["Mệnh","Phụ Mẫu","Phúc Đức","Điền Trạch","Quan Lộc","Nô Bộc","Thiên Di","Tật Ách","Tài Bạch","Tử Tức","Phu Thê","Huynh Đệ"];
  const PALACE_HAN = {"Mệnh":"命","Huynh Đệ":"兄弟","Phu Thê":"夫妻","Tử Tức":"子女","Tài Bạch":"財帛","Tật Ách":"疾厄","Thiên Di":"遷移","Nô Bộc":"奴僕","Quan Lộc":"官祿","Điền Trạch":"田宅","Phúc Đức":"福德","Phụ Mẫu":"父母"};
  const PALACE_SHORT = {"Mệnh":"Mệnh","Huynh Đệ":"Huynh","Phu Thê":"Phu","Tử Tức":"Tử","Tài Bạch":"Tài","Tật Ách":"Tật","Thiên Di":"Di","Nô Bộc":"Nô","Quan Lộc":"Quan","Điền Trạch":"Điền","Phúc Đức":"Phúc","Phụ Mẫu":"Phụ"};
  const GRID_ORDER = ["Tỵ","Ngọ","Mùi","Thân","Thìn","Dậu","Mão","Tuất","Dần","Sửu","Tý","Hợi"];
  const TAM_HOP = {
    Dần:["Dần","Ngọ","Tuất"], Ngọ:["Dần","Ngọ","Tuất"], Tuất:["Dần","Ngọ","Tuất"],
    Thân:["Thân","Tý","Thìn"], Tý:["Thân","Tý","Thìn"], Thìn:["Thân","Tý","Thìn"],
    Tỵ:["Tỵ","Dậu","Sửu"],    Dậu:["Tỵ","Dậu","Sửu"],  Sửu:["Tỵ","Dậu","Sửu"],
    Hợi:["Hợi","Mão","Mùi"],  Mão:["Hợi","Mão","Mùi"],  Mùi:["Hợi","Mão","Mùi"]
  };
  const GRID_AREAS = {
    "Tỵ":"1 / 1", "Ngọ":"1 / 2", "Mùi":"1 / 3", "Thân":"1 / 4",
    "Thìn":"2 / 1", "Dậu":"2 / 4",
    "Mão":"3 / 1", "Tuất":"3 / 4",
    "Dần":"4 / 1", "Sửu":"4 / 2", "Tý":"4 / 3", "Hợi":"4 / 4"
  };
  const TIGER_RULE = {Giáp:"Bính",Kỷ:"Bính",Ất:"Mậu",Canh:"Mậu",Bính:"Canh",Tân:"Canh",Đinh:"Nhâm",Nhâm:"Nhâm",Mậu:"Giáp",Quý:"Giáp"};
  const STEM_POLARITY = {Giáp:"Dương",Bính:"Dương",Mậu:"Dương",Canh:"Dương",Nhâm:"Dương",Ất:"Âm",Đinh:"Âm",Kỷ:"Âm",Tân:"Âm",Quý:"Âm"};
  const NAP_AM_ELEMENTS = [
    "Kim","Hỏa","Mộc","Thổ","Kim","Hỏa","Thủy","Thổ","Kim","Mộc",
    "Thủy","Thổ","Hỏa","Mộc","Thủy","Kim","Hỏa","Mộc","Thổ","Kim",
    "Hỏa","Thủy","Thổ","Kim","Mộc","Thủy","Thổ","Hỏa","Mộc","Thủy"
  ];
  const CUC = {
    "Thủy":{number:2,name:"Thủy Nhị Cục"},
    "Mộc":{number:3,name:"Mộc Tam Cục"},
    "Kim":{number:4,name:"Kim Tứ Cục"},
    "Thổ":{number:5,name:"Thổ Ngũ Cục"},
    "Hỏa":{number:6,name:"Hỏa Lục Cục"}
  };
  // index: Dần(0) Mão(1) Thìn(2) Tỵ(3) Ngọ(4) Mùi(5) Thân(6) Dậu(7) Tuất(8) Hợi(9) Tý(10) Sửu(11)
  // Chính tinh brightness source table uses: M = Miếu, V = Vượng, Đ = Đắc, H = Hãm, B = Bình.
  const BRIGHTNESS = {
    "Tử Vi":     ["Miếu","Bình","Vượng","Vượng","Miếu","Miếu","Vượng","Bình","Vượng","Bình","Bình","Miếu"],
    "Thiên Cơ":  ["Đắc","Miếu","Miếu","Vượng","Đắc","Hãm","Vượng","Miếu","Miếu","Hãm","Đắc","Hãm"],
    "Thái Dương":["Vượng","Vượng","Vượng","Miếu","Miếu","Đắc","Hãm","Hãm","Hãm","Hãm","Hãm","Đắc"],
    "Vũ Khúc":   ["Vượng","Hãm","Miếu","Bình","Vượng","Miếu","Vượng","Hãm","Miếu","Bình","Vượng","Miếu"],
    "Thiên Đồng":["Miếu","Hãm","Hãm","Đắc","Hãm","Hãm","Miếu","Đắc","Hãm","Đắc","Vượng","Hãm"],
    "Liêm Trinh":["Miếu","Hãm","Miếu","Hãm","Vượng","Bình","Miếu","Hãm","Miếu","Hãm","Vượng","Bình"],
    "Thiên Phủ": ["Miếu","Bình","Vượng","Bình","Miếu","Bình","Miếu","Bình","Vượng","Bình","Miếu","Bình"],
    "Thái Âm":   ["Hãm","Hãm","Hãm","Hãm","Hãm","Đắc","Vượng","Miếu","Miếu","Miếu","Vượng","Đắc"],
    "Tham Lang": ["Đắc","Hãm","Vượng","Hãm","Hãm","Miếu","Đắc","Hãm","Vượng","Hãm","Hãm","Miếu"],
    "Cự Môn":    ["Vượng","Miếu","Hãm","Hãm","Vượng","Hãm","Đắc","Miếu","Hãm","Đắc","Vượng","Hãm"],
    "Thiên Tướng":["Miếu","Hãm","Vượng","Đắc","Vượng","Đắc","Miếu","Hãm","Vượng","Đắc","Vượng","Đắc"],
    "Thiên Lương":["Vượng","Vượng","Miếu","Hãm","Miếu","Đắc","Vượng","Hãm","Miếu","Hãm","Vượng","Đắc"],
    "Thất Sát":  ["Miếu","Hãm","Hãm","Vượng","Miếu","Đắc","Miếu","Hãm","Hãm","Vượng","Miếu","Đắc"],
    "Phá Quân":  ["Đắc","Hãm","Vượng","Hãm","Miếu","Vượng","Đắc","Hãm","Vượng","Hãm","Miếu","Vượng"],
    "Văn Xương": ["Hãm","Đắc","Đắc","Miếu","Hãm","Đắc","Đắc","Miếu","Hãm","Đắc","Đắc","Miếu"],
    "Văn Khúc":  ["","Vượng","Đắc","Miếu","Hãm","Vượng","Đắc","Miếu","Hãm","Vượng","Đắc","Miếu"],
    // Miếu: Dần/Ngọ/Tuất  |  Hãm: Thìn/Thân/Tý  |  Đắc: các vị trí còn lại
    "Hỏa Tinh":  ["Miếu","Đắc","Hãm","Đắc","Miếu","Đắc","Hãm","Đắc","Miếu","Đắc","Hãm","Đắc"],
    "Linh Tinh": ["Miếu","Đắc","Hãm","Đắc","Miếu","Đắc","Hãm","Đắc","Miếu","Đắc","Hãm","Hãm"]
  };
  const TU_HOA = {
    "Giáp":{Lộc:"Liêm Trinh",Quyền:"Phá Quân",Khoa:"Vũ Khúc",Kỵ:"Thái Dương"},
    "Ất":{Lộc:"Thiên Cơ",Quyền:"Thiên Lương",Khoa:"Tử Vi",Kỵ:"Thái Âm"},
    "Bính":{Lộc:"Thiên Đồng",Quyền:"Thiên Cơ",Khoa:"Văn Xương",Kỵ:"Liêm Trinh"},
    "Đinh":{Lộc:"Thái Âm",Quyền:"Thiên Đồng",Khoa:"Thiên Cơ",Kỵ:"Cự Môn"},
    "Mậu":{Lộc:"Tham Lang",Quyền:"Thái Âm",Khoa:"Hữu Bật",Kỵ:"Thiên Cơ"},
    "Kỷ":{Lộc:"Vũ Khúc",Quyền:"Tham Lang",Khoa:"Thiên Lương",Kỵ:"Văn Khúc"},
    "Canh":{Lộc:"Thái Dương",Quyền:"Vũ Khúc",Khoa:"Thiên Phủ",Kỵ:"Thiên Đồng"},
    "Tân":{Lộc:"Cự Môn",Quyền:"Thái Dương",Khoa:"Văn Khúc",Kỵ:"Văn Xương"},
    "Nhâm":{Lộc:"Thiên Lương",Quyền:"Tử Vi",Khoa:"Tả Phụ",Kỵ:"Vũ Khúc"},
    "Quý":{Lộc:"Phá Quân",Quyền:"Cự Môn",Khoa:"Thái Âm",Kỵ:"Tham Lang"}
  };
  const MAIN_OFFSETS = [
    ["Tử Vi",0], ["Thiên Cơ",-1], ["Thái Dương",-3], ["Vũ Khúc",-4], ["Thiên Đồng",-5], ["Liêm Trinh",-8]
  ];
  const TIANFU_OFFSETS = [
    ["Thiên Phủ",0], ["Thái Âm",1], ["Tham Lang",2], ["Cự Môn",3], ["Thiên Tướng",4], ["Thiên Lương",5], ["Thất Sát",6], ["Phá Quân",10]
  ];
  const MUTAGEN_CLASS = {Lộc:"loc",Quyền:"quyen",Khoa:"khoa",Kỵ:"ky"};
  const MUTAGEN_SHORT = {Lộc:"L",Quyền:"Q",Khoa:"Kh",Kỵ:"Kỵ"};
  const ELEMENT_CLASS = {Kim:"element-kim",Mộc:"element-moc",Thủy:"element-thuy",Hỏa:"element-hoa",Thổ:"element-tho"};
  const LAYER_SORT = {major:0,soft:1,wealth:2,mutagen:3,helper:4,move:5,romance:6,cycle:7,annual:8,tough:9,harm:10,void:11};
  const GOOD_LAYERS = new Set(["soft","wealth","helper","move","romance"]);
  const BAD_LAYERS = new Set(["tough","harm","void"]);
  const GOOD_MINOR_NAMES = new Set([
    "Tả Phụ","Tả Phù","Hữu Bật","Thiên Khôi","Thiên Việt","Văn Xương","Văn Khúc",
    "Hóa Lộc","Hóa Quyền","Hóa Khoa","Lộc Tồn","Thiên Mã","Thiên Tài","Thiên Thọ",
    "Ân Quang","Thiên Quý","Thiên Quan","Thiên Phúc","Quốc Ấn","Đường Phù","Thiên Trù",
    "Long Đức","Phúc Đức","Thiên Đức","Nguyệt Đức","Thiên Giải","Địa Giải","Giải Thần",
    "Đào Hoa","Hồng Loan","Thiên Hỷ","Hỷ Thần","Thanh Long","Thai Phụ","Phong Cáo",
    "Thiên Y","Hoa Cái","Thiếu Dương","Thiếu Âm","Bác Sĩ","Lực Sĩ","Tướng Quân",
    "Tấu Thư","Tam Thai","Bát Tọa","Long Trì","Phượng Các","Tướng Tinh","Phàn An","Tuế Dịch","Hàm Trì"
  ]);
  const BAD_MINOR_NAMES = new Set([
    "Kình Dương","Đà La","Hỏa Tinh","Linh Tinh","Địa Không","Địa Kiếp","Thiên Không",
    "Đại Hao","Tiểu Hao","Tang Môn","Bạch Hổ","Thiên Khốc","Thiên Hư","Hóa Kỵ",
    "Tuần","Triệt","Thiên La","Địa Võng","Thiên Sứ","Thiên Thương","Thiên Riêu",
    "Thái Tuế","Thiên Hình","Cô Thần","Quả Tú","Đẩu Quân","Kiếp Sát","Phá Toái",
    "Phục Binh","Quan Phù","Tử Phù","Tuế Phá","Điếu Khách","Trực Phù","Lưu Hà",
    "Phi Liêm","Bệnh Phù","Quan Phủ","Thiên Sát","Nguyệt Sát","Tai Sát","Tức Thần","Chỉ Bối","Vong Thần"
  ]);
  const BRIGHT_CLASS = {Miếu:"b-mieu",Vượng:"b-vuong",Đắc:"b-dac",Hãm:"b-ham",Bình:"b-binh"};
  const STAR_ELEMENTS = {
    "Tử Vi":"Thổ","Thiên Cơ":"Mộc","Thái Dương":"Hỏa","Vũ Khúc":"Kim","Thiên Đồng":"Thủy","Liêm Trinh":"Hỏa",
    "Thiên Phủ":"Thổ","Thái Âm":"Thủy","Tham Lang":"Mộc","Cự Môn":"Thủy","Thiên Tướng":"Thủy","Thiên Lương":"Thổ","Thất Sát":"Kim","Phá Quân":"Thủy",
    "Tả Phụ":"Thổ","Tả Phù":"Thổ","Hữu Bật":"Thủy","Văn Xương":"Kim","Văn Khúc":"Thủy","Lộc Tồn":"Thổ","Kình Dương":"Kim","Đà La":"Kim",
    "Hóa Lộc":"Mộc","Hóa Quyền":"Mộc","Hóa Khoa":"Thủy","Hóa Kỵ":"Thủy",
    "Thiên Khôi":"Hỏa","Thiên Việt":"Hỏa","Thiên Quan":"Hỏa","Thiên Phúc":"Hỏa","Quốc Ấn":"Thổ","Đường Phù":"Mộc","Thiên Trù":"Thổ",
    "Thiên Mã":"Hỏa","Hoa Cái":"Kim","Đào Hoa":"Mộc","Hồng Loan":"Thủy","Thiên Hỷ":"Thủy","Thiên Khốc":"Kim","Thiên Hư":"Thủy",
    "Cô Thần":"Thổ","Quả Tú":"Thổ","Thiên Đức":"Thổ","Nguyệt Đức":"Thủy","Long Trì":"Thủy","Phượng Các":"Mộc","Phá Toái":"Hỏa",
    "Thiên Hình":"Hỏa","Thiên Riêu":"Thủy","Thiên Y":"Thủy","Thiên Giải":"Hỏa","Địa Giải":"Thổ","Giải Thần":"Mộc",
    "Hỏa Tinh":"Hỏa","Linh Tinh":"Hỏa",
    "Thiên Tài":"Thổ","Thiên Thọ":"Thổ","Thai Phụ":"Kim","Phong Cáo":"Thổ","Địa Không":"Hỏa","Địa Kiếp":"Hỏa","Thiên Không":"Hỏa",
    "Thiên La":"Thổ","Địa Võng":"Thổ","Thiên Sứ":"Thủy","Thiên Thương":"Thủy","Lưu Hà":"Thủy",
    "Tam Thai":"Thủy","Bát Tọa":"Mộc","Ân Quang":"Hỏa","Thiên Quý":"Thổ","Thiên Vu":"Mộc",
    "Bác Sĩ":"Thủy","Lực Sĩ":"Hỏa","Thanh Long":"Thủy","Tiểu Hao":"Hỏa","Tướng Quân":"Mộc","Tấu Thư":"Kim","Phi Liêm":"Hỏa","Hỷ Thần":"Hỏa","Bệnh Phù":"Mộc","Đại Hao":"Hỏa","Phục Binh":"Hỏa","Quan Phủ":"Hỏa",
    "Thái Tuế":"Hỏa","Thiếu Dương":"Hỏa","Tang Môn":"Mộc","Thiếu Âm":"Thủy","Quan Phù":"Hỏa","Tử Phù":"Kim","Tuế Phá":"Hỏa","Long Đức":"Thủy","Bạch Hổ":"Kim","Phúc Đức":"Thổ","Điếu Khách":"Hỏa","Trực Phù":"Kim",
    "Đẩu Quân":"Hỏa","Âm Sát":"Thủy","Tuần":"Hỏa","Triệt":"Kim","Tuần Không":"Hỏa","Triệt Không":"Kim",
    "Kiếp Sát":"Hỏa","Tướng Tinh":"Mộc","Phàn An":"Thủy","Tuế Dịch":"Hỏa","Tức Thần":"Hỏa","Tai Sát":"Thủy","Thiên Sát":"Thổ","Chỉ Bối":"Kim","Hàm Trì":"Thủy","Nguyệt Sát":"Hỏa","Vong Thần":"Mộc",
    "Tràng Sinh":"Thủy","Mộc Dục":"Thủy","Quan Đới":"Kim","Lâm Quan":"Kim","Đế Vượng":"Kim","Suy":"Thủy","Bệnh":"Hỏa","Tử":"Hỏa","Mộ":"Thổ","Tuyệt":"Thổ","Thai":"Thổ","Dưỡng":"Mộc"
  };
  const TAI_TUE_CYCLE = ["Thái Tuế","Thiếu Dương","Tang Môn","Thiếu Âm","Quan Phù","Tử Phù","Tuế Phá","Long Đức","Bạch Hổ","Phúc Đức","Điếu Khách","Trực Phù"];
  const DOCTOR_CYCLE = ["Bác Sĩ","Lực Sĩ","Thanh Long","Tiểu Hao","Tướng Quân","Tấu Thư","Phi Liêm","Hỷ Thần","Bệnh Phù","Đại Hao","Phục Binh","Quan Phủ"];
  const TUONG_TINH_CYCLE = ["Tướng Tinh", "Phàn An", "Tuế Dịch", "Tức Thần", "Hoa Cái", "Kiếp Sát", "Tai Sát", "Thiên Sát", "Chỉ Bối", "Hàm Trì", "Nguyệt Sát", "Vong Thần"];
  // Lưu Văn Xương / Lưu Văn Khúc an theo CAN lưu niên (không theo giờ như nguyên cục)
  const LUU_VAN_XUONG = {Giáp:"Tỵ",Ất:"Ngọ",Bính:"Thân",Đinh:"Dậu",Mậu:"Thân",Kỷ:"Dậu",Canh:"Hợi",Tân:"Tý",Nhâm:"Dần",Quý:"Mão"};
  const LUU_VAN_KHUC  = {Giáp:"Dậu",Ất:"Thân",Bính:"Ngọ",Đinh:"Tỵ",Mậu:"Ngọ",Kỷ:"Tỵ",Canh:"Mão",Tân:"Dần",Nhâm:"Tý",Quý:"Hợi"};
  const YANG_STEMS = ["Giáp","Bính","Mậu","Canh","Nhâm"];
  // Lưu Hà an theo CAN năm sinh (sao bại tinh)
  const LUU_HA_BY_STEM = {Giáp:"Dậu",Ất:"Tuất",Bính:"Mùi",Đinh:"Thân",Mậu:"Tỵ",Kỷ:"Ngọ",Canh:"Thìn",Tân:"Mão",Nhâm:"Hợi",Quý:"Dần"};
  const CHANG_SHENG_CYCLE = ["Tràng Sinh","Mộc Dục","Quan Đới","Lâm Quan","Đế Vượng","Suy","Bệnh","Tử","Mộ","Tuyệt","Thai","Dưỡng"];
  const MONTH_STARS = [
    ["Thiên Hình","Dậu",1,"harm"], ["Thiên Riêu","Sửu",1,"romance"], ["Thiên Y","Sửu",1,"helper"],
    ["Thiên Giải","Thân",1,"helper"], ["Địa Giải","Mùi",1,"helper"], ["Giải Thần","Sửu",1,"helper"]
  ];
  const HOUR_STARS = [
    ["Địa Không","Hợi",-1,"harm"], ["Địa Kiếp","Hợi",1,"harm"], ["Thai Phụ","Ngọ",1,"helper"],
    ["Phong Cáo","Dần",1,"helper"]
  ];
  const STEM_KHOI_VIET = {
    Giáp:["Sửu","Mùi"], Ất:["Tý","Thân"], Bính:["Hợi","Dậu"], Đinh:["Hợi","Dậu"], Mậu:["Sửu","Mùi"],
    Kỷ:["Tý","Thân"], Canh:["Sửu","Mùi"], Tân:["Ngọ","Dần"], Nhâm:["Mão","Tỵ"], Quý:["Mão","Tỵ"]
  };
  const STEM_SUPPORT = {
    Giáp:{ThiênQuan:"Mùi",ThiênPhúc:"Dậu"},
    Ất:{ThiênQuan:"Thìn",ThiênPhúc:"Thân"},
    Bính:{ThiênQuan:"Tỵ",ThiênPhúc:"Tý"},
    Đinh:{ThiênQuan:"Dần",ThiênPhúc:"Hợi"},
    Mậu:{ThiênQuan:"Mão",ThiênPhúc:"Mão"},
    Kỷ:{ThiênQuan:"Dậu",ThiênPhúc:"Dần"},
    Canh:{ThiênQuan:"Hợi",ThiênPhúc:"Ngọ"},
    Tân:{ThiênQuan:"Dậu",ThiênPhúc:"Tỵ"},
    Nhâm:{ThiênQuan:"Tuất",ThiênPhúc:"Ngọ"},
    Quý:{ThiênQuan:"Ngọ",ThiênPhúc:"Tỵ"}
  };
  const STEM_THIEN_TRU = {
    Giáp:"Tỵ", Ất:"Ngọ", Bính:"Tý", Đinh:"Tỵ", Mậu:"Ngọ",
    Kỷ:"Thân", Canh:"Dần", Tân:"Ngọ", Nhâm:"Dậu", Quý:"Hợi"
  };
  const TRIET_BY_STEM = {
    Giáp:["Thân","Dậu"], Kỷ:["Thân","Dậu"], Ất:["Ngọ","Mùi"], Canh:["Ngọ","Mùi"],
    Bính:["Thìn","Tỵ"], Tân:["Thìn","Tỵ"], Đinh:["Dần","Mão"], Nhâm:["Dần","Mão"],
    Mậu:["Tý","Sửu"], Quý:["Tý","Sửu"]
  };
  const CHANG_SHENG_START = {"Thủy":"Thân","Thổ":"Thân","Mộc":"Hợi","Kim":"Tỵ","Hỏa":"Dần"};
  const ELEMENT_GENERATES = {Mộc:"Hỏa",Hỏa:"Thổ",Thổ:"Kim",Kim:"Thủy",Thủy:"Mộc"};
  const ELEMENT_CONTROLS = {Mộc:"Thổ",Thổ:"Thủy",Thủy:"Hỏa",Hỏa:"Kim",Kim:"Mộc"};

  const els = {
    solarDate: document.getElementById("solarDate"),
    annualYear: document.getElementById("annualYear"),
    timezone: document.getElementById("timezone"),
    hour: document.getElementById("birthHour"),
    gender: document.getElementById("gender"),
    chart: document.getElementById("chartGrid")
  };

  function fix(n, mod = 12){
    return ((n % mod) + mod) % mod;
  }

  function isValidDateParts(day, month, year){
    if(!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) return false;
    if(year < 1800 || year > 2200 || month < 1 || month > 12 || day < 1) return false;
    return day <= new Date(year, month, 0).getDate();
  }

  function parseDate(value){
    const raw = String(value || "").trim();
    let match = raw.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);
    if(match){
      const day = Number(match[1]);
      const month = Number(match[2]);
      const year = Number(match[3]);
      if(isValidDateParts(day, month, year)) return {year, month, day};
    }
    match = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if(match){
      const year = Number(match[1]);
      const month = Number(match[2]);
      const day = Number(match[3]);
      if(isValidDateParts(day, month, year)) return {year, month, day};
    }
    return {year:1990, month:6, day:15};
  }


  function stemBranchForYear(year){
    return {
      stem: STEMS[fix(year + 6, 10)],
      branch: CYCLE_BRANCHES[fix(year + 8, 12)]
    };
  }

  function stemBranchForLunarMonth(yearStem, lunarMonth){
    const tigerStem = TIGER_RULE[yearStem];
    return {
      stem: STEMS[fix(STEMS.indexOf(tigerStem) + lunarMonth - 1, 10)],
      branch: CYCLE_BRANCHES[fix(lunarMonth + 1, 12)]
    };
  }

  function stemBranchForSolarDay(day, month, year){
    const julianDay = jdFromDate(day, month, year);
    return {
      stem: STEMS[fix(julianDay + 9, 10)],
      branch: CYCLE_BRANCHES[fix(julianDay + 1, 12)]
    };
  }

  function stemForHour(dayStem, hourBranch){
    const tyStemByDay = {
      Giáp:"Giáp", Kỷ:"Giáp", Ất:"Bính", Canh:"Bính", Bính:"Mậu",
      Tân:"Mậu", Đinh:"Canh", Nhâm:"Canh", Mậu:"Nhâm", Quý:"Nhâm"
    };
    return STEMS[fix(
      STEMS.indexOf(tyStemByDay[dayStem]) + HOUR_BRANCHES.indexOf(hourBranch),
      10
    )];
  }

  function cycleBranchToIndex(branch){
    return BRANCHES.indexOf(branch);
  }

  function jdFromDate(dd, mm, yy){
    const a = Math.floor((14 - mm) / 12);
    const y = yy + 4800 - a;
    const m = mm + 12 * a - 3;
    let jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
    if(jd < 2299161){
      jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083;
    }
    return jd;
  }

  function newMoonDay(k, timeZone){
    const T = k / 1236.85;
    const T2 = T * T;
    const T3 = T2 * T;
    const dr = Math.PI / 180;
    let jd = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
    jd += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
    const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
    const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
    const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
    let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
    C1 -= 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(2 * dr * Mpr);
    C1 -= 0.0004 * Math.sin(3 * dr * Mpr);
    C1 += 0.0104 * Math.sin(2 * dr * F) - 0.0051 * Math.sin((M + Mpr) * dr);
    C1 -= 0.0074 * Math.sin((M - Mpr) * dr) + 0.0004 * Math.sin((2 * F + M) * dr);
    C1 -= 0.0004 * Math.sin((2 * F - M) * dr);
    C1 -= 0.0004 * Math.sin((2 * F + Mpr) * dr);
    C1 += 0.0010 * Math.sin((2 * F - Mpr) * dr) + 0.0005 * Math.sin((2 * Mpr + M) * dr);
    const deltaT = T < -11 ? 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3 : -0.000278 + 0.000265 * T + 0.000262 * T2;
    return Math.floor(jd + C1 - deltaT + 0.5 + timeZone / 24);
  }

  function sunLongitude(jdn, timeZone){
    const T = (jdn - 2451545.5 - timeZone / 24) / 36525;
    const T2 = T * T;
    const dr = Math.PI / 180;
    const M = 357.52910 + 35999.05030 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
    const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
    let DL = (1.914600 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
    DL += (0.019993 - 0.000101 * T) * Math.sin(2 * dr * M) + 0.000290 * Math.sin(3 * dr * M);
    let L = (L0 + DL) * dr;
    L -= Math.PI * 2 * Math.floor(L / (Math.PI * 2));
    return Math.floor(L / Math.PI * 6);
  }

  function lunarMonth11(year, timeZone){
    const off = jdFromDate(31, 12, year) - 2415021;
    const k = Math.floor(off / 29.530588853);
    let nm = newMoonDay(k, timeZone);
    if(sunLongitude(nm, timeZone) >= 9) nm = newMoonDay(k - 1, timeZone);
    return nm;
  }

  function leapMonthOffset(a11, timeZone){
    const k = Math.floor((a11 - 2415021.076998695) / 29.530588853 + 0.5);
    let last = 0;
    let i = 1;
    let arc = sunLongitude(newMoonDay(k + i, timeZone), timeZone);
    do {
      last = arc;
      i += 1;
      arc = sunLongitude(newMoonDay(k + i, timeZone), timeZone);
    } while(arc !== last && i < 14);
    return i - 1;
  }

  function solarToLunar(day, month, year, timeZone){
    const dayNumber = jdFromDate(day, month, year);
    const k = Math.floor((dayNumber - 2415021.076998695) / 29.530588853);
    let monthStart = newMoonDay(k + 1, timeZone);
    if(monthStart > dayNumber) monthStart = newMoonDay(k, timeZone);
    let a11 = lunarMonth11(year, timeZone);
    let b11 = a11;
    let lunarYear;
    if(a11 >= monthStart){
      lunarYear = year;
      a11 = lunarMonth11(year - 1, timeZone);
    } else {
      lunarYear = year + 1;
      b11 = lunarMonth11(year + 1, timeZone);
    }
    const lunarDay = dayNumber - monthStart + 1;
    const diff = Math.floor((monthStart - a11) / 29);
    let lunarLeap = 0;
    let lunarMonth = diff + 11;
    if(b11 - a11 > 365){
      const leapMonthDiff = leapMonthOffset(a11, timeZone);
      if(diff >= leapMonthDiff){
        lunarMonth = diff + 10;
        if(diff === leapMonthDiff) lunarLeap = 1;
      }
    }
    if(lunarMonth > 12) lunarMonth -= 12;
    if(lunarMonth >= 11 && diff < 4) lunarYear -= 1;
    return {day:lunarDay, month:lunarMonth, year:lunarYear, leap:lunarLeap};
  }

  function getPalaceStem(yearStem, branchIndex){
    const start = TIGER_RULE[yearStem];
    return STEMS[fix(STEMS.indexOf(start) + branchIndex, 10)];
  }

  function getNapAmElement(stem, branch){
    for(let i = 0; i < 60; i++){
      if(STEMS[i % 10] === stem && CYCLE_BRANCHES[i % 12] === branch){
        return NAP_AM_ELEMENTS[Math.floor(i / 2)];
      }
    }
    return "Thổ";
  }

  function getElementRelation(menhElement, cucElement){
    if(menhElement === cucElement){
      return {label:"Mệnh Cục bình hòa", detail:`Mệnh ${menhElement} đồng hành Cục ${cucElement}`};
    }
    if(ELEMENT_GENERATES[menhElement] === cucElement){
      return {label:"Mệnh sinh Cục", detail:`Mệnh ${menhElement} sinh Cục ${cucElement}`};
    }
    if(ELEMENT_GENERATES[cucElement] === menhElement){
      return {label:"Cục sinh Mệnh", detail:`Cục ${cucElement} sinh Mệnh ${menhElement}`};
    }
    if(ELEMENT_CONTROLS[menhElement] === cucElement){
      return {label:"Mệnh khắc Cục", detail:`Mệnh ${menhElement} khắc Cục ${cucElement}`};
    }
    return {label:"Cục khắc Mệnh", detail:`Cục ${cucElement} khắc Mệnh ${menhElement}`};
  }

  function getCuc(yearStem, menhBranch){
    const menhIndex = BRANCHES.indexOf(menhBranch);
    const palaceStem = getPalaceStem(yearStem, menhIndex);
    const element = getNapAmElement(palaceStem, menhBranch);
    return {...CUC[element], element, stem: palaceStem};
  }

  function getSoulBody(month, hourBranch){
    const monthIndex = month - 1;
    const hourIndex = HOUR_BRANCHES.indexOf(hourBranch);
    return {
      menhIndex: fix(monthIndex - hourIndex),
      thanIndex: fix(monthIndex + hourIndex),
      hourIndex
    };
  }

  function getZiweiStart(day, cucNumber){
    let borrowed = 0;
    while((day + borrowed) % cucNumber !== 0) borrowed++;
    const quotient = (day + borrowed) / cucNumber;
    let ziweiIndex = fix((quotient % 12) - 1);
    ziweiIndex = fix(ziweiIndex + (borrowed % 2 === 0 ? borrowed : -borrowed));
    // Thiên Phủ luôn đối cung Tử Vi (cách 6 cung), không phải 12-index
    // Nam Phái: Thiên Phủ tại vị trí đối xứng qua trục 0/6, không phải đối cung
    return {ziweiIndex, tianfuIndex: fix(12 - ziweiIndex), borrowed, quotient};
  }

  function addStar(palaces, index, name, layer, source = "natal"){
    const branchIndex = fix(index);
    const brightness = BRIGHTNESS[name] ? BRIGHTNESS[name][branchIndex] : "";
    const exists = palaces[branchIndex].stars.some(star => star.name === name && star.source === source);
    if(!exists) palaces[branchIndex].stars.push({name, layer, brightness, source});
  }

  function addStarAtBranch(palaces, branch, name, layer, source = "natal"){
    addStar(palaces, BRANCHES.indexOf(branch), name, layer, source);
  }

  function addCycle(palaces, startIndex, names, direction, layer, source = "natal"){
    names.forEach((name, offset) => addStar(palaces, startIndex + offset * direction, name, layer, source));
  }

  function getLuIndex(stem){
    const map = {
      Giáp:"Dần", Ất:"Mão", Bính:"Tỵ", Mậu:"Tỵ", Đinh:"Ngọ", Kỷ:"Ngọ",
      Canh:"Thân", Tân:"Dậu", Nhâm:"Hợi", Quý:"Tý"
    };
    return BRANCHES.indexOf(map[stem]);
  }

  function getTianMaIndex(yearBranch){
    if(["Dần","Ngọ","Tuất"].includes(yearBranch)) return BRANCHES.indexOf("Thân");
    if(["Thân","Tý","Thìn"].includes(yearBranch)) return BRANCHES.indexOf("Dần");
    if(["Tỵ","Dậu","Sửu"].includes(yearBranch)) return BRANCHES.indexOf("Hợi");
    return BRANCHES.indexOf("Tỵ");
  }

  function getHoaCaiIndex(yearBranch){
    if(["Dần","Ngọ","Tuất"].includes(yearBranch)) return BRANCHES.indexOf("Tuất");
    if(["Thân","Tý","Thìn"].includes(yearBranch)) return BRANCHES.indexOf("Thìn");
    if(["Tỵ","Dậu","Sửu"].includes(yearBranch)) return BRANCHES.indexOf("Sửu");
    return BRANCHES.indexOf("Mùi");
  }

  function getLongTriIndex(yearBranch){
    return BRANCHES.indexOf("Thìn") + CYCLE_BRANCHES.indexOf(yearBranch);
  }

  function getTuongTinhIndex(yearBranch){
    if(["Dần","Ngọ","Tuất"].includes(yearBranch)) return BRANCHES.indexOf("Ngọ");
    if(["Thân","Tý","Thìn"].includes(yearBranch)) return BRANCHES.indexOf("Tý");
    if(["Tỵ","Dậu","Sửu"].includes(yearBranch)) return BRANCHES.indexOf("Dậu");
    return BRANCHES.indexOf("Mão");
  }

  function getPhuongCacIndex(yearBranch){
    return BRANCHES.indexOf("Tuất") - CYCLE_BRANCHES.indexOf(yearBranch);
  }

  function getDaoHoaIndex(yearBranch){
    if(["Dần","Ngọ","Tuất"].includes(yearBranch)) return BRANCHES.indexOf("Mão");
    if(["Thân","Tý","Thìn"].includes(yearBranch)) return BRANCHES.indexOf("Dậu");
    if(["Tỵ","Dậu","Sửu"].includes(yearBranch)) return BRANCHES.indexOf("Ngọ");
    return BRANCHES.indexOf("Tý");
  }

  function getThienKhongIndex(yearBranch){
    return cycleBranchToIndex(CYCLE_BRANCHES[fix(CYCLE_BRANCHES.indexOf(yearBranch) + 1)]);
  }

  function getKiepSatIndex(yearBranch){
    if(["Dần","Ngọ","Tuất"].includes(yearBranch)) return BRANCHES.indexOf("Hợi");
    if(["Thân","Tý","Thìn"].includes(yearBranch)) return BRANCHES.indexOf("Tỵ");
    if(["Tỵ","Dậu","Sửu"].includes(yearBranch)) return BRANCHES.indexOf("Dần");
    return BRANCHES.indexOf("Thân");
  }

  function getPhaToaiIndex(yearBranch){
    if(["Tý","Ngọ","Mão","Dậu"].includes(yearBranch)) return BRANCHES.indexOf("Tỵ");
    if(["Dần","Thân","Tỵ","Hợi"].includes(yearBranch)) return BRANCHES.indexOf("Dậu");
    return BRANCHES.indexOf("Sửu");
  }

  function getCoQua(yearBranch){
    if(["Hợi","Tý","Sửu"].includes(yearBranch)) return {co:"Dần", qua:"Tuất"};
    if(["Dần","Mão","Thìn"].includes(yearBranch)) return {co:"Tỵ", qua:"Sửu"};
    if(["Tỵ","Ngọ","Mùi"].includes(yearBranch)) return {co:"Thân", qua:"Thìn"};
    return {co:"Hợi", qua:"Mùi"};
  }

  function getTuanBranches(yearStem, yearBranch){
    let cycleIndex = 0;
    for(let i = 0; i < 60; i++){
      if(STEMS[i % 10] === yearStem && CYCLE_BRANCHES[i % 12] === yearBranch){
        cycleIndex = i;
        break;
      }
    }
    const start = Math.floor(cycleIndex / 10) * 10;
    return [CYCLE_BRANCHES[(start + 10) % 12], CYCLE_BRANCHES[(start + 11) % 12]];
  }

  function addStemStars(palaces, stem, source = "natal"){
    if(source === "annual"){
      // Quý nhân & văn tinh lưu niên (an theo CAN lưu niên)
      const [lKhoi, lViet] = STEM_KHOI_VIET[stem];
      addStarAtBranch(palaces, lKhoi, "Lưu Thiên Khôi", "annual", "annual");
      addStarAtBranch(palaces, lViet, "Lưu Thiên Việt", "annual", "annual");
      addStarAtBranch(palaces, LUU_VAN_XUONG[stem], "Lưu Văn Xương", "annual", "annual");
      addStarAtBranch(palaces, LUU_VAN_KHUC[stem], "Lưu Văn Khúc", "annual", "annual");
      // Lưu Hỷ Thần: từ Lưu Lộc Tồn theo vòng Bác Sĩ (dương can thuận, âm can nghịch)
      const luIdx = getLuIndex(stem);
      const step = YANG_STEMS.includes(stem) ? 7 : -7;
      addStar(palaces, luIdx + step, "Lưu Hỷ Thần", "annual", "annual");
      return;
    }
    const [khoi, viet] = STEM_KHOI_VIET[stem];
    addStarAtBranch(palaces, khoi, "Thiên Khôi", "helper");
    addStarAtBranch(palaces, viet, "Thiên Việt", "helper");
    const support = STEM_SUPPORT[stem];
    const luIndex = getLuIndex(stem);
    addStarAtBranch(palaces, support.ThiênQuan, "Thiên Quan", "helper");
    addStarAtBranch(palaces, support.ThiênPhúc, "Thiên Phúc", "helper");
    addStarAtBranch(palaces, STEM_THIEN_TRU[stem], "Thiên Trù", "helper");
    addStar(palaces, luIndex + 8, "Quốc Ấn", "helper");
    addStar(palaces, luIndex + 5, "Đường Phù", "helper");
    addStarAtBranch(palaces, LUU_HA_BY_STEM[stem], "Lưu Hà", "harm");
  }

  function addYearBranchStars(palaces, yearBranch, source = "natal"){
    if(source === "annual"){
      // Sao lưu niên an theo CHI lưu niên (giữ các sao quan trọng, khớp lá số mẫu)
      const base = cycleBranchToIndex(yearBranch);
      const branchOffset = CYCLE_BRANCHES.indexOf(yearBranch);
      // Vòng Thái Tuế: Thái Tuế, Tang Môn, Long Đức, Bạch Hổ, Phúc Đức
      [0, 2, 7, 8, 9].forEach(i =>
        addStar(palaces, fix(base + i), `Lưu ${TAI_TUE_CYCLE[i]}`, "annual", "annual")
      );
      addStar(palaces, getTianMaIndex(yearBranch), "Lưu Thiên Mã", "annual", "annual");
      addStar(palaces, getDaoHoaIndex(yearBranch), "Lưu Đào Hoa", "annual", "annual");
      addStar(palaces, getKiepSatIndex(yearBranch), "Lưu Kiếp Sát", "annual", "annual");
      addStar(palaces, BRANCHES.indexOf("Mão") - branchOffset, "Lưu Hồng Loan", "annual", "annual");
      addStar(palaces, BRANCHES.indexOf("Dậu") - branchOffset, "Lưu Thiên Hỷ", "annual", "annual");
      addStar(palaces, BRANCHES.indexOf("Ngọ") - branchOffset, "Lưu Thiên Khốc", "annual", "annual");
      addStar(palaces, BRANCHES.indexOf("Ngọ") + branchOffset, "Lưu Thiên Hư", "annual", "annual");
      addStar(palaces, base + 9, "Lưu Thiên Đức", "annual", "annual");
      addStar(palaces, base + 5, "Lưu Nguyệt Đức", "annual", "annual");
      return;
    }
    // Natal
    addCycle(palaces, cycleBranchToIndex(yearBranch), TAI_TUE_CYCLE, 1, "cycle");
    addStar(palaces, getTianMaIndex(yearBranch), "Thiên Mã", "move");
    addStar(palaces, getHoaCaiIndex(yearBranch), "Hoa Cái", "cycle");
    addStar(palaces, getDaoHoaIndex(yearBranch), "Đào Hoa", "romance");
    addStar(palaces, getThienKhongIndex(yearBranch), "Thiên Không", "void");
    addStar(palaces, getKiepSatIndex(yearBranch), "Kiếp Sát", "harm");
    const branchOffset = CYCLE_BRANCHES.indexOf(yearBranch);
    addStar(palaces, BRANCHES.indexOf("Mão") - branchOffset, "Hồng Loan", "romance");
    addStar(palaces, BRANCHES.indexOf("Dậu") - branchOffset, "Thiên Hỷ", "romance");
    addStar(palaces, BRANCHES.indexOf("Ngọ") - branchOffset, "Thiên Khốc", "harm");
    addStar(palaces, BRANCHES.indexOf("Ngọ") + branchOffset, "Thiên Hư", "harm");
    const coQua = getCoQua(yearBranch);
    addStarAtBranch(palaces, coQua.co, "Cô Thần", "harm");
    addStarAtBranch(palaces, coQua.qua, "Quả Tú", "harm");
    addStar(palaces, cycleBranchToIndex(yearBranch) + 9, "Thiên Đức", "helper");
    addStar(palaces, cycleBranchToIndex(yearBranch) + 5, "Nguyệt Đức", "helper");
    addStar(palaces, getLongTriIndex(yearBranch), "Long Trì", "helper");
    addStar(palaces, getPhuongCacIndex(yearBranch), "Phượng Các", "helper");
    addStar(palaces, getPhaToaiIndex(yearBranch), "Phá Toái", "harm");
  }

  // An Hỏa Tinh / Linh Tinh theo năm sinh và giờ sinh (Trung Châu Phái)
  function addHoaLinhStars(palaces, yearBranch, hourIndex){
    const hoaStart = (["Dần","Ngọ","Tuất"].includes(yearBranch)) ? BRANCHES.indexOf("Sửu")
                   : (["Thân","Tý","Thìn"].includes(yearBranch)) ? BRANCHES.indexOf("Dần")
                   : (["Tỵ","Dậu","Sửu"].includes(yearBranch)) ? BRANCHES.indexOf("Mão")
                   : BRANCHES.indexOf("Dậu"); // Hợi/Mão/Mùi
    // Linh Tinh: Dần-Ngọ-Tuất khởi Mão; ba nhóm còn lại đều khởi Tuất
    const linhStart = (["Dần","Ngọ","Tuất"].includes(yearBranch)) ? BRANCHES.indexOf("Mão")
                    : BRANCHES.indexOf("Tuất");
    addStar(palaces, hoaStart + hourIndex, "Hỏa Tinh", "harm");
    addStar(palaces, linhStart + hourIndex, "Linh Tinh", "harm"); // Linh Tinh đi thuận (Trung Châu)
  }

  function addMonthDayHourStars(palaces, month, day, hourIndex){
    addStar(palaces, BRANCHES.indexOf("Thìn") + month - 1, "Tả Phụ", "helper");
    addStar(palaces, BRANCHES.indexOf("Tuất") - (month - 1), "Hữu Bật", "helper");
    addStar(palaces, BRANCHES.indexOf("Tuất") - hourIndex, "Văn Xương", "helper");
    addStar(palaces, BRANCHES.indexOf("Thìn") + hourIndex, "Văn Khúc", "helper");
    MONTH_STARS.forEach(([name, start, direction, layer]) => addStar(palaces, BRANCHES.indexOf(start) + (month - 1) * direction, name, layer));
    HOUR_STARS.forEach(([name, start, direction, layer]) => addStar(palaces, BRANCHES.indexOf(start) + hourIndex * direction, name, layer));
    addStar(palaces, BRANCHES.indexOf("Thìn") + month - 1 + day - 1, "Tam Thai", "helper");
    addStar(palaces, BRANCHES.indexOf("Tuất") - (month - 1) - (day - 1), "Bát Tọa", "helper");
    addStar(palaces, BRANCHES.indexOf("Tuất") - hourIndex + day - 2, "Ân Quang", "helper");
    addStar(palaces, BRANCHES.indexOf("Thìn") + hourIndex - day + 2, "Thiên Quý", "helper");
  }

  function addLuGroup(palaces, stem, source = "natal"){
    const lu = getLuIndex(stem);
    const prefix = source === "annual" ? "Lưu " : "";
    addStar(palaces, lu, `${prefix}Lộc Tồn`, source === "annual" ? "annual" : "wealth", source);
    addStar(palaces, lu + 1, `${prefix}Kình Dương`, source === "annual" ? "annual" : "tough", source);
    addStar(palaces, lu - 1, `${prefix}Đà La`, source === "annual" ? "annual" : "tough", source);
    // Vòng Bác Sĩ (Nam Phái) luôn an thuận theo Lộc Tồn
    if(source === "natal") addCycle(palaces, lu, DOCTOR_CYCLE, 1, "cycle");
  }

  function addChangSheng(palaces, cuc, directionSign){
    const start = BRANCHES.indexOf(CHANG_SHENG_START[cuc.element]);
    palaces.forEach(palace => {
      palace.changSheng = CHANG_SHENG_CYCLE[fix((palace.index - start) * directionSign)];
    });
  }

  function assignMajorFortunes(palaces, menhIndex, cucNumber, directionSign, age){
    let activePalace = null;
    palaces.forEach(palace => {
      const order = fix((palace.index - menhIndex) * directionSign);
      const start = cucNumber + order * 10;
      const end = start + 9;
      palace.majorFortune = {
        order,
        start,
        end,
        active: age >= start && age <= end
      };
      if(palace.majorFortune.active) activePalace = palace;
    });
    return activePalace;
  }

  function getSmallLimitStartIndex(yearBranch){
    if(["Dần","Ngọ","Tuất"].includes(yearBranch)) return BRANCHES.indexOf("Thìn");
    if(["Thân","Tý","Thìn"].includes(yearBranch)) return BRANCHES.indexOf("Tuất");
    if(["Tỵ","Dậu","Sửu"].includes(yearBranch)) return BRANCHES.indexOf("Mùi");
    return BRANCHES.indexOf("Sửu");
  }

  function assignSmallLimits(palaces, yearBranch, gender, age){
    const startIndex = getSmallLimitStartIndex(yearBranch);
    const directionSign = gender === "male" ? 1 : -1;
    let activePalace = null;
    palaces.forEach(palace => {
      palace.isSmallLimitPalace = false;
      palace.smallLimitAges = [];
    });
    for(let offset = 0; offset < 12; offset++){
      const palace = palaces[fix(startIndex + offset * directionSign)];
      palace.smallLimitAges = Array.from({length:10}, (_, cycle) => offset + 1 + cycle * 12);
    }
    const activeIndex = fix(startIndex + ((age - 1) % 12) * directionSign);
    activePalace = palaces[activeIndex];
    activePalace.isSmallLimitPalace = true;
    return {
      palace: activePalace,
      startPalace: palaces[startIndex],
      direction: directionSign === 1 ? "thuận" : "nghịch",
      directionSign
    };
  }

  function adjustedLunarMonth(month, day, isLeap){
    return month + (isLeap && day > 15 ? 1 : 0);
  }

  // Lưu niên đại vận (cung khởi tháng Giêng của năm xem):
  // Trong mỗi đại vận 10 năm với cung gốc G và cung xung chiếu O = G + 6:
  //   năm 1 = G; năm 2 = O; từ năm 3 trở đi = O + (m - 4) * s, với s là chiều đại vận
  //   (Dương Nam/Âm Nữ s = +1 thuận; Âm Nam/Dương Nữ s = -1 nghịch).
  function getLuuNienDaiVanIndex(majorFortunePalace, smallLimit, nominalAge, directionSign){
    if(!majorFortunePalace){
      return smallLimit && smallLimit.palace ? smallLimit.palace.index : null;
    }
    const G = majorFortunePalace.index;
    const m = nominalAge - majorFortunePalace.majorFortune.start + 1; // năm thứ m trong đại vận (1..10)
    if(m <= 1) return G;
    if(m === 2) return fix(G + 6);
    return fix(G + 6 + (m - 2) * directionSign);
  }

  function assignAnnualFlow(palaces, annualBranch, birthMonth, birthDay, birthLeap, hourIndex, monthAnchorPalaceIndex, annualStem, flowBase = "tieu-han"){
    palaces.forEach(palace => {
      palace.isAnnualPalace = false;
      palace.isTaiTuePalace = false;
      palace.isMonthStart = false;
      palace.flowMonths = [];
    });
    
    const annualPalaceIndex = BRANCHES.indexOf(annualBranch);
    const adjustedMonth = adjustedLunarMonth(birthMonth, birthDay, birthLeap);
    
    // Sao Lưu Đẩu Quân: từ cung Thái Tuế đếm nghịch tới tháng sinh, rồi thuận theo giờ sinh
    const dauQuanIndex = fix(annualPalaceIndex - adjustedMonth + hourIndex + 1);
    addStar(palaces, dauQuanIndex, "Lưu Đẩu Quân", "annual", "annual");
    
    const taiTuePalace = palaces[annualPalaceIndex];
    taiTuePalace.isTaiTuePalace = true;
    
    const monthAnchor = (monthAnchorPalaceIndex == null) ? annualPalaceIndex : fix(monthAnchorPalaceIndex);
    
    let monthStartIndex;
    if (flowBase === "tieu-han") {
      // Tiểu hạn của năm là tháng sinh, đếm nghịch tới tháng Giêng
      monthStartIndex = fix(monthAnchor - (adjustedMonth - 1));
    } else {
      // Lưu niên đại vận: nghịch tháng sinh, thuận giờ sinh
      monthStartIndex = fix(monthAnchor - adjustedMonth + hourIndex + 1);
    }
    
    const monthStartPalace = palaces[monthStartIndex];
    monthStartPalace.isMonthStart = true;
    
    const yearStemIndex = STEMS.indexOf(annualStem);
    const months = Array.from({length:12}, (_, offset) => {
      const palace = palaces[fix(monthStartIndex + offset)];
      const month = offset + 1;
      const mStemIndex = ((yearStemIndex % 5) * 2 + 2 + offset) % 10;
      const stem = STEMS[mStemIndex];
      const branch = CYCLE_BRANCHES[(offset + 2) % 12];
      const item = {month, label:MONTH_NAMES[offset], palace, stem, branch};
      palace.flowMonths.push(item);
      return item;
    });
    return {annualPalaceIndex, taiTuePalace, dauQuanIndex, monthStartIndex, monthStartPalace, months, adjustedMonth};
  }

  function getVoidMarkers(yearStem, yearBranch){
    return [
      {type:"Tuần", branches:getTuanBranches(yearStem, yearBranch)},
      {type:"Triệt", branches:TRIET_BY_STEM[yearStem]}
    ];
  }

  function addVoidStars(palaces, markers){
    markers.forEach(marker => {
      marker.branches.forEach(branch => addStarAtBranch(palaces, branch, marker.type, "void"));
    });
  }

  function addFixedPalaceStars(palaces){
    addStarAtBranch(palaces, "Thìn", "Thiên La", "void");
    addStarAtBranch(palaces, "Tuất", "Địa Võng", "void");
    const illnessPalace = palaces.find(palace => palace.name === "Tật Ách");
    if(illnessPalace) addStar(palaces, illnessPalace.index, "Thiên Sứ", "harm");
    const servantPalace = palaces.find(palace => palace.name === "Nô Bộc");
    if(servantPalace) addStar(palaces, servantPalace.index, "Thiên Thương", "harm");
  }

  function addLifeStars(palaces, menhIndex, thanIndex, yearBranch, month, hourIndex){
    const cyc = CYCLE_BRANCHES.indexOf(yearBranch);
    // Thiên Tài khởi từ Mệnh, Thiên Thọ khởi từ Thân, kể là Tý đếm thuận đến chi năm
    addStar(palaces, menhIndex + cyc, "Thiên Tài", "cycle");
    addStar(palaces, thanIndex + cyc, "Thiên Thọ", "cycle");
    // Đẩu Quân: từ cung Thái Tuế (chi năm) đếm nghịch tới tháng sinh, rồi thuận theo giờ sinh
    addStar(palaces, BRANCHES.indexOf(yearBranch) - (month - 1) + hourIndex, "Đẩu Quân", "harm");
  }

  const MUTAGEN_PREFIX = {"natal-mutagen":"", "annual-mutagen":"Lưu ", "major-mutagen":"ĐV "};
  function addMutagenStars(palaces, records, source){
    const prefix = MUTAGEN_PREFIX[source] || "";
    records.forEach(record => {
      if(!record.palace) return;
      const layer = record.mutagen === "Kỵ" ? "harm" : "mutagen";
      const name = `${prefix}Hóa ${record.mutagen}`;
      const exists = record.palace.stars.some(star => star.name === name && star.source === source);
      if(!exists){
        record.palace.stars.push({
          name,
          layer,
          source,
          mutagen: record.mutagen,
          targetStar: record.starName
        });
      }
    });
  }

  // ===================== TRUNG CHÂU: bộ sao tinh giản =====================
  // Sao đặc trưng Trung Châu (an theo tháng sinh âm lịch)
  const TC_THIEN_VU     = {1:"Tỵ",5:"Tỵ",9:"Tỵ", 2:"Thân",6:"Thân",10:"Thân", 3:"Dần",7:"Dần",11:"Dần", 4:"Hợi",8:"Hợi",12:"Hợi"};
  const TC_THIEN_NGUYET = {1:"Tuất",2:"Tỵ",3:"Thìn",4:"Dần",5:"Mùi",6:"Mão",7:"Hợi",8:"Mùi",9:"Dần",10:"Ngọ",11:"Tuất",12:"Dần"};
  const TC_AM_SAT       = {1:"Dần",7:"Dần",2:"Tý",8:"Tý",3:"Tuất",9:"Tuất",4:"Thân",10:"Thân",5:"Ngọ",11:"Ngọ",6:"Thìn",12:"Thìn"};
  const TC_NGUYET_GIAI  = {1:"Thân",2:"Thân",3:"Tuất",4:"Tuất",5:"Tý",6:"Tý",7:"Dần",8:"Dần",9:"Thìn",10:"Thìn",11:"Ngọ",12:"Ngọ"};

  function addTCSignatureStars(palaces, month){
    addStarAtBranch(palaces, TC_THIEN_VU[month], "Thiên Vu", "helper");
    addStarAtBranch(palaces, TC_THIEN_NGUYET[month], "Thiên Nguyệt", "harm");
    addStarAtBranch(palaces, TC_AM_SAT[month], "Âm Sát", "harm");
    addStarAtBranch(palaces, TC_NGUYET_GIAI[month], "Nguyệt Giải", "helper");
  }

  // Lục cát + lục sát + Lộc Tồn/Thiên Mã + Vòng Bác Sĩ
  function addTCLucCatSat(palaces, yearStem, yearBranch, month, hourIndex, directionSign){
    addStar(palaces, BRANCHES.indexOf("Thìn") + month - 1, "Tả Phụ", "helper");
    addStar(palaces, BRANCHES.indexOf("Tuất") - (month - 1), "Hữu Bật", "helper");
    addStar(palaces, BRANCHES.indexOf("Tuất") - hourIndex, "Văn Xương", "helper");
    addStar(palaces, BRANCHES.indexOf("Thìn") + hourIndex, "Văn Khúc", "helper");
    const [khoi, viet] = STEM_KHOI_VIET[yearStem];
    addStarAtBranch(palaces, khoi, "Thiên Khôi", "helper");
    addStarAtBranch(palaces, viet, "Thiên Việt", "helper");
    const lu = getLuIndex(yearStem);
    addStar(palaces, lu, "Lộc Tồn", "wealth");
    addStar(palaces, lu + 1, "Kình Dương", "tough");
    addStar(palaces, lu - 1, "Đà La", "tough");
    addCycle(palaces, lu, DOCTOR_CYCLE, directionSign, "cycle"); // Vòng Bác Sĩ
    addHoaLinhStars(palaces, yearBranch, hourIndex); // Hỏa Tinh, Linh Tinh
    addStar(palaces, BRANCHES.indexOf("Hợi") - hourIndex, "Địa Không", "harm");
    addStar(palaces, BRANCHES.indexOf("Hợi") + hourIndex, "Địa Kiếp", "harm");
    addStar(palaces, getTianMaIndex(yearBranch), "Thiên Mã", "move");
  }

  // Khoa danh chư diệu
  function addTCKhoaDanh(palaces, yearStem, month, day, hourIndex){
    addStar(palaces, BRANCHES.indexOf("Thìn") + month - 1 + day - 1, "Tam Thai", "helper");
    addStar(palaces, BRANCHES.indexOf("Tuất") - (month - 1) - (day - 1), "Bát Tọa", "helper");
    addStar(palaces, BRANCHES.indexOf("Tuất") - hourIndex + day - 2, "Ân Quang", "helper");
    addStar(palaces, BRANCHES.indexOf("Thìn") + hourIndex - day + 2, "Thiên Quý", "helper");
    addStar(palaces, BRANCHES.indexOf("Ngọ") + hourIndex, "Thai Phụ", "helper");
    addStar(palaces, BRANCHES.indexOf("Dần") + hourIndex, "Phong Cáo", "helper");
    const support = STEM_SUPPORT[yearStem];
    addStarAtBranch(palaces, support.ThiênQuan, "Thiên Quan", "helper");
    addStarAtBranch(palaces, support.ThiênPhúc, "Thiên Phúc", "helper");
    addStarAtBranch(palaces, STEM_THIEN_TRU[yearStem], "Thiên Trù", "helper");
  }

  // Tạp diệu Trung Châu dùng chung với Nam phái
  function addTCMiscStars(palaces, yearBranch, month){
    const branchOffset = CYCLE_BRANCHES.indexOf(yearBranch);
    addStar(palaces, BRANCHES.indexOf("Mão") - branchOffset, "Hồng Loan", "romance");
    addStar(palaces, BRANCHES.indexOf("Dậu") - branchOffset, "Thiên Hỷ", "romance");
    addStar(palaces, BRANCHES.indexOf("Ngọ") - branchOffset, "Thiên Khốc", "harm");
    addStar(palaces, BRANCHES.indexOf("Ngọ") + branchOffset, "Thiên Hư", "harm");
    addStar(palaces, getDaoHoaIndex(yearBranch), "Đào Hoa", "romance");
    addStar(palaces, getHoaCaiIndex(yearBranch), "Hoa Cái", "cycle");
    addStar(palaces, getLongTriIndex(yearBranch), "Long Trì", "helper");
    addStar(palaces, getPhuongCacIndex(yearBranch), "Phượng Các", "helper");
    addStar(palaces, getPhaToaiIndex(yearBranch), "Phá Toái", "harm");
    const coQua = getCoQua(yearBranch);
    addStarAtBranch(palaces, coQua.co, "Cô Thần", "harm");
    addStarAtBranch(palaces, coQua.qua, "Quả Tú", "harm");
    addStar(palaces, cycleBranchToIndex(yearBranch) + 9, "Thiên Đức", "helper");
    addStar(palaces, cycleBranchToIndex(yearBranch) + 5, "Nguyệt Đức", "helper");
    addStar(palaces, BRANCHES.indexOf("Dậu") + (month - 1), "Thiên Hình", "harm");
    addStar(palaces, BRANCHES.indexOf("Sửu") + (month - 1), "Thiên Riêu", "romance");
  }

  function addTCLifeStars(palaces, menhIndex, thanIndex, yearBranch){
    const cyc = CYCLE_BRANCHES.indexOf(yearBranch);
    addStar(palaces, menhIndex + cyc, "Thiên Tài", "cycle");
    addStar(palaces, thanIndex + cyc, "Thiên Thọ", "cycle");
  }

  // Sao lưu niên (an theo CAN năm xem) — gọn
  function addTCAnnualStars(palaces, stem, branch){
    const [lKhoi, lViet] = STEM_KHOI_VIET[stem];
    addStarAtBranch(palaces, lKhoi, "Lưu Thiên Khôi", "annual", "annual");
    addStarAtBranch(palaces, lViet, "Lưu Thiên Việt", "annual", "annual");
    addStarAtBranch(palaces, LUU_VAN_XUONG[stem], "Lưu Văn Xương", "annual", "annual");
    addStarAtBranch(palaces, LUU_VAN_KHUC[stem], "Lưu Văn Khúc", "annual", "annual");
    const lu = getLuIndex(stem);
    addStar(palaces, lu, "Lưu Lộc Tồn", "annual", "annual");
    addStar(palaces, lu + 1, "Lưu Kình Dương", "annual", "annual");
    addStar(palaces, lu - 1, "Lưu Đà La", "annual", "annual");
    addStar(palaces, getTianMaIndex(branch), "Lưu Thiên Mã", "annual", "annual");
  }

  function buildChartData(){
    const solar = parseDate(els.solarDate.value);
    const timeZone = Number(els.timezone.value) || 7;
    const lunar = solarToLunar(solar.day, solar.month, solar.year, timeZone);
    const birthHourBranch = els.hour.value || "Tý";
    const {stem:yearStem, branch:yearBranch} = stemBranchForYear(lunar.year);
    const birthMonthPillar = stemBranchForLunarMonth(yearStem, lunar.month);
    const birthDayPillar = stemBranchForSolarDay(solar.day, solar.month, solar.year);
    const birthHourStem = stemForHour(birthDayPillar.stem, birthHourBranch);
    const rawAnnual = Number(els.annualYear.value);
    const annualYear = (rawAnnual >= 1900 && rawAnnual <= 2100) ? rawAnnual : new Date().getFullYear();
    const annual = stemBranchForYear(annualYear);
    const month = lunar.month;
    const day = lunar.day;

    const {menhIndex, thanIndex, hourIndex} = getSoulBody(month, birthHourBranch);
    const menhBranch = BRANCHES[menhIndex];
    const cuc = getCuc(yearStem, menhBranch);
    const menhElement = getNapAmElement(yearStem, yearBranch);
    const cucMenhRelation = getElementRelation(menhElement, cuc.element);
    const starts = getZiweiStart(day, cuc.number);
    const yearPolarity = STEM_POLARITY[yearStem];
    const direction = (yearPolarity === "Dương" && els.gender.value === "male") || (yearPolarity === "Âm" && els.gender.value === "female") ? "thuận" : "nghịch";
    const directionSign = direction === "thuận" ? 1 : -1;
    const nominalAge = Math.max(1, annualYear - lunar.year + 1);

    const palaces = BRANCHES.map((branch, index) => {
      const name = PALACES_BY_FORWARD_BRANCH[fix(index - menhIndex)];
      return {
        index,
        branch,
        name,
        han: PALACE_HAN[name],
        stem: getPalaceStem(yearStem, index),
        isMenh: index === menhIndex,
        isThan: index === thanIndex,
        stars: []
      };
    });

    MAIN_OFFSETS.forEach(([name, offset]) => addStar(palaces, starts.ziweiIndex + offset, name, "major"));
    TIANFU_OFFSETS.forEach(([name, offset]) => addStar(palaces, starts.tianfuIndex + offset, name, "major"));

    const majorFortunePalace = assignMajorFortunes(palaces, menhIndex, cuc.number, directionSign, nominalAge);
    // Trung Châu: KHÔNG dùng tiểu hạn. Lưu mệnh năm = cung lưu Thái Tuế (chi năm xem).
    // Lưu nguyệt vẫn khởi từ cung Thái Tuế để 12 tháng hiện đầy đủ trên lá số.
    const annualBranchIndex = cycleBranchToIndex(annual.branch);
    const annualPalaceIndex = BRANCHES.indexOf(annual.branch);

    // Lưu niên đại vận (zigzag trong đại vận) — cung vận của năm xem.
    const luuNienDaiVanIndex = getLuuNienDaiVanIndex(majorFortunePalace, null, nominalAge, directionSign);
    if(luuNienDaiVanIndex != null) palaces[luuNienDaiVanIndex].isLuuNienDaiVan = true;

    const flowBase = document.getElementById("flowBase") ? document.getElementById("flowBase").value : "tieu-han";
    let monthAnchorPalaceIndex = annualPalaceIndex;
    if (flowBase === "tieu-han" && smallLimit && smallLimit.palace) {
      monthAnchorPalaceIndex = smallLimit.palace.index;
    } else if (flowBase === "dai-van" && luuNienDaiVanIndex != null) {
      monthAnchorPalaceIndex = luuNienDaiVanIndex;
    } else if (flowBase === "thai-tue") {
      monthAnchorPalaceIndex = annualPalaceIndex;
    }

    const annualFlow = assignAnnualFlow(
      palaces,
      annual.branch,
      month,
      day,
      lunar.leap,
      hourIndex,
      monthAnchorPalaceIndex,
      annual.stem,
      flowBase
    );
    const taiTuePalace = annualFlow.taiTuePalace;
    taiTuePalace.isAnnualPalace = true;
    // Trùng bài: tên 12 cung theo đại hạn (lưu mệnh đại hạn = cung đại vận đang hành) và theo lưu niên.
    palaces.forEach(p => {
      p.majorPalaceName = majorFortunePalace ? PALACES_BY_FORWARD_BRANCH[fix(p.index - majorFortunePalace.index)] : null;
      p.annualPalaceName = PALACES_BY_FORWARD_BRANCH[fix(p.index - annualBranchIndex)];
    });

    // ===== Bộ sao tinh giản Trung Châu =====
    addTCLucCatSat(palaces, yearStem, yearBranch, month, hourIndex, directionSign);
    addTCKhoaDanh(palaces, yearStem, month, day, hourIndex);
    addTCMiscStars(palaces, yearBranch, month);
    addTCSignatureStars(palaces, month);
    addTCLifeStars(palaces, menhIndex, thanIndex, yearBranch);
    addChangSheng(palaces, cuc, directionSign);
    addTCAnnualStars(palaces, annual.stem, annual.branch);

    // ===== Bổ sung các sao bị thiếu (để lá số đầy đủ) =====
    addCycle(palaces, cycleBranchToIndex(yearBranch), TAI_TUE_CYCLE, 1, "cycle"); // Vòng Thái Tuế
    addCycle(palaces, getTuongTinhIndex(yearBranch), TUONG_TINH_CYCLE, 1, "cycle"); // Vòng Tướng Tinh (Phàn An, Tức Thần, Vong Thần...)
    const voidMarkers = getVoidMarkers(yearStem, yearBranch);
    addVoidStars(palaces, voidMarkers); // Tuần, Triệt
    addFixedPalaceStars(palaces); // Thiên La, Địa Võng, Thiên Sứ, Thiên Thương
    addStar(palaces, BRANCHES.indexOf(yearBranch) - (month - 1) + hourIndex, "Đẩu Quân", "harm");
    addStarAtBranch(palaces, LUU_HA_BY_STEM[yearStem], "Lưu Hà", "harm");
    addStar(palaces, getThienKhongIndex(yearBranch), "Thiên Không", "void");
    addStar(palaces, getKiepSatIndex(yearBranch), "Kiếp Sát", "harm");

    // Tứ Hóa: bản mệnh (can năm sinh), đại vận (can cung đại hạn), lưu niên (can năm xem)
    const natalMutagens = getMutagenRecords(yearStem, palaces);
    const majorMutagens = majorFortunePalace ? getMutagenRecords(majorFortunePalace.stem, palaces, "major-mutagen") : [];
    const annualMutagens = getMutagenRecords(annual.stem, palaces, "annual");
    addMutagenStars(palaces, natalMutagens, "natal-mutagen");
    addMutagenStars(palaces, majorMutagens, "major-mutagen");
    addMutagenStars(palaces, annualMutagens, "annual-mutagen");
    const phiFlows = getPhiFlows(palaces);
    const annualStars = palaces.flatMap(palace => palace.stars.filter(star => star.source === "annual").map(star => ({...star, palace})));
    const starCount = palaces.reduce((sum, palace) => sum + palace.stars.length, 0);
    return {
      solar, lunar, timeZone, birthHourBranch, yearStem, yearBranch,
      birthMonthStem:birthMonthPillar.stem, birthMonthBranch:birthMonthPillar.branch,
      birthDayStem:birthDayPillar.stem, birthDayBranch:birthDayPillar.branch,
      birthHourStem,
      annualYear, annualStem:annual.stem, annualBranch:annual.branch,
      nominalAge, month, day, menhIndex, thanIndex, menhBranch, menhElement,
      cucMenhRelation, cuc, starts, direction, directionSign, yearPolarity,
      palaces, majorFortunePalace, annualPalace:taiTuePalace,
      smallLimitPalace:null, smallLimitStartPalace:null, smallLimitDirection:"",
      taiTuePalace, monthStartPalace:annualFlow.monthStartPalace,
      monthlyPalaces:annualFlow.months, annualMonthSeed:annualFlow.adjustedMonth,
      natalMutagens, majorMutagens, annualMutagens, annualStars, phiFlows, voidMarkers, starCount
    };
  }

  function findStar(palaces, starName){
    for(const palace of palaces){
      const star = palace.stars.find(item => item.name === starName);
      if(star) return {palace, star};
    }
    return null;
  }

  function getMutagenRecords(stem, palaces, source = "natal"){
    return Object.entries(TU_HOA[stem]).map(([mutagen, starName]) => {
      const found = findStar(palaces, starName);
      return {source, mutagen, starName, palace: found ? found.palace : null};
    });
  }

  function getPhiFlows(palaces){
    const flows = [];
    palaces.forEach(source => {
      Object.entries(TU_HOA[source.stem]).forEach(([mutagen, starName]) => {
        const found = findStar(palaces, starName);
        flows.push({
          source,
          mutagen,
          starName,
          target: found ? found.palace : null,
          self: !!found && found.palace.index === source.index
        });
      });
    });
    return flows;
  }

  function baseStarName(name){
    if(name === "Lưu Hà") return name; // sao nguyên cục, "Lưu" là tên không phải tiền tố lưu niên
    return name.replace(/^Lưu\s+/, "");
  }

  function elementForStar(name){
    return STAR_ELEMENTS[baseStarName(name)] || "";
  }

  function elementClassForStar(name){
    const element = elementForStar(name);
    return element ? ELEMENT_CLASS[element] : "";
  }

  function isBeneficMinor(star){
    const name = baseStarName(star.name);
    if(GOOD_MINOR_NAMES.has(name)) return true;
    if(BAD_MINOR_NAMES.has(name)) return false;
    if(star.source === "natal-mutagen" || star.source === "annual-mutagen") return star.mutagen !== "Kỵ";
    if(GOOD_LAYERS.has(star.layer)) return true;
    if(BAD_LAYERS.has(star.layer)) return false;
    return true;
  }

  function renderSplitStars(stars, className, data, sortFn){
    if(!stars.length) return "";
    const good = stars.filter(isBeneficMinor).slice().sort(sortFn);
    const bad = stars.filter(star => !isBeneficMinor(star)).slice().sort(sortFn);
    const side = (items, sideClass) => {
      if(!items.length) return "";
      const density = items.length >= 9 ? " is-split-dense" : items.length >= 6 ? " is-split-packed" : "";
      return `<div class="${sideClass}${density}">${items.map(star => renderStarChip(star, data)).join("")}</div>`;
    };
    const state = `${good.length ? " has-good" : ""}${bad.length ? " has-bad" : ""}`;
    return `<div class="${className} stars-layer${state}">${side(good, "stars-good")}${side(bad, "stars-bad")}</div>`;
  }

  // Gộp natal + lưu niên vào CÙNG 2 cột tốt/xấu (sao lưu xếp dưới, ngăn bằng vạch mảnh).
  // Chia sao thành 2 cột CÂN số lượng (sao tốt dồn trái, sao xấu/yếu sang phải) -> mọi cung
  // đều có 2 cột đều nhau, tránh cảnh 1 cột dài 1 cột ngắn.
  function renderCellStars(natal, annual, data, sortFn){
    const all = natal.concat(annual);
    const good = all.filter(isBeneficMinor).slice().sort(sortFn);
    const bad = all.filter(s => !isBeneficMinor(s)).slice().sort(sortFn);
    const ordered = good.concat(bad);
    if(!ordered.length) return "";
    const half = Math.ceil(ordered.length / 2);
    const left = ordered.slice(0, half);
    const right = ordered.slice(half);
    const col = (items, sideClass) => items.length
      ? `<div class="${sideClass}">${items.map(s => renderStarChip(s, data)).join("")}</div>`
      : "";
    const state = `${left.length ? " has-good" : ""}${right.length ? " has-bad" : ""}`;
    return `<div class="stars-natal stars-layer${state}">${col(left, "stars-good")}${col(right, "stars-bad")}</div>`;
  }

  function phiCornerForPalace(data, palace){
    if(!document.getElementById("showPhi").checked) return "";
    const hits = data.phiFlows.filter(flow => flow.source.index === palace.index);
    if(!hits.length) return "";
    const chips = hits.map(flow => {
      const target = flow.target ? `${flow.target.name} ${flow.target.branch}` : "chưa an";
      const self = flow.self ? " · tự hóa" : "";
      const title = `${palace.name} ${palace.stem} phi Hóa ${flow.mutagen} ${flow.starName} nhập ${target}${self}`;
      return `<span class="phi-chip" title="${title}"><span class="phi-kind ${MUTAGEN_CLASS[flow.mutagen]}">${MUTAGEN_SHORT[flow.mutagen]}</span><span class="phi-star">${flow.starName}</span><span class="phi-target">→ ${flow.target ? PALACE_SHORT[flow.target.name] : "?"}</span></span>`;
    }).join("");
    return `<div class="phi-corner">${chips}</div>`;
  }



  function renderNatalMutagenList(data){
    return data.natalMutagens.map(item => {
      const palace = item.palace ? `${PALACE_SHORT[item.palace.name]} ${item.palace.branch}` : "chưa an";
      const title = `Năm sinh ${data.yearStem}${data.yearBranch}: Hóa ${item.mutagen} tại ${item.starName}${item.palace ? ` (${item.palace.name} ${item.palace.branch})` : ""}`;
      return `<span class="ci-hua-item" title="${title}"><span class="hua ${MUTAGEN_CLASS[item.mutagen]}">${MUTAGEN_SHORT[item.mutagen]}</span><span>${item.starName}</span><small>${palace}</small></span>`;
    }).join("");
  }

  function formatSolar(data){
    return `${String(data.solar.day).padStart(2,"0")}/${String(data.solar.month).padStart(2,"0")}/${data.solar.year}`;
  }

  function formatLunar(data){
    return `${String(data.lunar.day).padStart(2,"0")}/${String(data.lunar.month).padStart(2,"0")}${data.lunar.leap ? " nhuận" : ""}/${data.lunar.year}`;
  }

  function renderCenterPanel(data){
    const thanPalace = data.palaces[data.thanIndex];
    const genderLabel = els.gender.value === "male" ? "Nam" : "Nữ";
    const solarText = formatSolar(data);
    const lunarText = `${formatLunar(data)} · giờ ${data.birthHourBranch}${BRANCH_HAN[data.birthHourBranch]}`;
    const canChiText = `${data.yearStem}${STEM_HAN[data.yearStem]} ${data.yearBranch}${BRANCH_HAN[data.yearBranch]}`;
    const major = data.majorFortunePalace ? data.majorFortunePalace.majorFortune : null;
    const majorPalaceText = data.majorFortunePalace ? `${data.majorFortunePalace.name} ${data.majorFortunePalace.branch}` : `khởi ${data.cuc.number} tuổi`;
    const smallLimitText = data.smallLimitPalace ? `${data.nominalAge} tuổi · ${data.smallLimitPalace.name} ${data.smallLimitPalace.branch}` : `${data.nominalAge} tuổi`;
    const smallLimitStartText = data.smallLimitStartPalace ? `${data.smallLimitDirection} · khởi ${data.smallLimitStartPalace.branch}` : data.smallLimitDirection;
    const taiTueText = data.taiTuePalace ? `${data.taiTuePalace.name} ${data.taiTuePalace.branch}` : "";
    return `
      <div class="ci-head">
        <div class="ci-seal">紫微</div>
        <div class="ci-title">
          <strong>${canChiText}</strong>
          <span>${solarText}</span>
        </div>
      </div>
      <div class="ci-subline">${lunarText}</div>
      <div class="ci-grid">
        <div class="ci-card"><b>Mệnh</b><span>${data.menhBranch} · ${data.menhElement}</span><small>${data.cucMenhRelation.label}</small></div>
        <div class="ci-card"><b>Thân</b><span>${thanPalace.name}</span><small>${thanPalace.branch}</small></div>
        <div class="ci-card"><b>Cục</b><span>${data.cuc.name}</span><small>${data.cucMenhRelation.detail}</small></div>
        <div class="ci-card"><b>Âm dương</b><span>${data.yearPolarity} ${genderLabel}</span><small>${data.direction} · đại vận khởi ${data.cuc.number}</small></div>
        <div class="ci-card"><b>Đại vận</b><span>${major ? `${major.start}-${major.end}` : "chưa nhập"}</span><small>${majorPalaceText}</small></div>
        <div class="ci-card"><b>Tiểu hạn</b><span>${smallLimitText}</span><small>${smallLimitStartText}</small></div>
        <div class="ci-card"><b>Lưu niên</b><span>${data.annualYear} ${data.annualStem}${STEM_HAN[data.annualStem]} ${data.annualBranch}${BRANCH_HAN[data.annualBranch]}</span><small>Thái Tuế: ${taiTueText}</small></div>
      </div>
      <div class="ci-hua-block">
        <div class="ci-section-title">Tứ Hóa năm sinh</div>
        <div class="ci-hua-list" aria-label="Tứ Hóa năm sinh">${renderNatalMutagenList(data)}</div>
      </div>`;
  }

  function renderMajorStar(star){
    const bc = BRIGHT_CLASS[star.brightness] || "";
    const starSlug = baseStarName(star.name).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/Đ/g, "D").replace(/đ/g, "d").toLowerCase().replace(/\s+/g, "-");
    const brightHtml = star.brightness
      ? `<span class="star-bright">${star.brightness}</span>`
      : "";
    const element = elementForStar(star.name);
    const title = `${star.name}${star.brightness ? " · " + star.brightness : ""}${element ? " · " + element : ""}`;
    return `<span class="major-star ${bc} ${elementClassForStar(star.name)} star-${starSlug}" title="${title}"><span class="major-name-row">${star.name}</span>${brightHtml}</span>`;
  }

  function renderStarChip(star, data){
    const bright = star.brightness === "Đắc"
      ? `<span class="minor-bright is-dac">(Đ)</span>`
      : star.brightness === "Hãm"
        ? `<span class="minor-bright is-ham">(H)</span>`
        : "";
    const element = elementForStar(star.name);
    const elementText = element ? ` · Ngũ hành ${element}` : "";
    const title = star.source === "natal-mutagen"
      ? `Tứ Hóa năm sinh: ${star.name} nhập ${star.targetStar}${elementText}`
      : star.source === "annual-mutagen"
        ? `Tứ Hóa năm ${data.annualYear}: ${baseStarName(star.name)} nhập ${star.targetStar}${elementText}`
        : `${star.source === "annual" ? "Sao lưu niên" : "Sao nguyên cục"}${elementText}`;
    const name = star.source === "annual" || star.source === "annual-mutagen"
      ? `<span class="src">L.</span>${baseStarName(star.name)}`
      : star.name;
    const huaClass = star.source === "natal-mutagen" || star.source === "annual-mutagen" ? `hua-star hua-${MUTAGEN_CLASS[star.mutagen]}` : "";
    return `<span class="star ${star.layer} ${elementClassForStar(star.name)} ${huaClass}" title="${title}">${name}${bright}</span>`;
  }

  function renderPalaceMeta(data, palace){
    const fortune = palace.majorFortune;
    const fortuneChip = fortune
      ? `<span class="fortune-chip ${fortune.active ? "is-active" : ""}" title="Đại vận ${fortune.start}-${fortune.end} tuổi tại ${palace.name} ${palace.branch}">ĐV ${fortune.start}-${fortune.end}</span>`
      : "";
    // TH (Tiểu Hạn) & TT (Thái Tuế) không ghi ở cung nữa — đã có trong bảng giữa lá số.
    const monthChips = (palace.flowMonths || []).map(item => {
      const startClass = palace.isMonthStart && item.month === 1 ? " is-start" : "";
      return `<span class="month-chip${startClass}" title="Tháng ${item.month} (${item.label}) tại ${palace.name} ${palace.branch}">T${item.month}</span>`;
    }).join("");
    const stageElement = elementForStar(palace.changSheng);
    const stageTitle = stageElement ? `${palace.changSheng} · Ngũ hành ${stageElement}` : palace.changSheng;
    return `<div class="palace-meta"><span class="stage ${elementClassForStar(palace.changSheng)}" title="${stageTitle}">${palace.changSheng}</span>${fortuneChip}${monthChips}</div>`;
  }

  function renderChart(data){
    const showMutagens = document.getElementById("showMutagens").checked;
    const showAnnual = document.getElementById("showAnnual").checked;
    const cells = GRID_ORDER.map(branch => {
      const palace = data.palaces[BRANCHES.indexOf(branch)];
      const phiCorner = phiCornerForPalace(data, palace);

      const sortFn = (a, b) => (LAYER_SORT[a.layer] ?? 6) - (LAYER_SORT[b.layer] ?? 6);
      const allNatal = palace.stars.filter(s => s.source !== "annual" && s.source !== "annual-mutagen");
      const annualVisible = showAnnual ? palace.stars.filter(s => s.source === "annual").sort(sortFn) : [];
      const annualMutagenVisible = showMutagens ? palace.stars.filter(s => s.source === "annual-mutagen").sort(sortFn) : [];

      const majorStars = allNatal.filter(s => s.layer === "major");
      const natalMutagenStars = allNatal.filter(s => s.source === "natal-mutagen");
      const minorNatal = allNatal.filter(s => s.layer !== "major" && s.source !== "natal-mutagen").concat(natalMutagenStars);

      const majorHtml  = majorStars.map(s => renderMajorStar(s)).join("");
      const annualStack = annualVisible.concat(annualMutagenVisible).sort(sortFn);
      const majorRowHtml = majorHtml || '<span class="void-diep">Vô chính diệu</span>';

      const visibleStarCount = minorNatal.length + annualStack.length;
      const densityClass = visibleStarCount >= 30 ? " is-ultra-packed" : visibleStarCount >= 22 ? " is-overpacked" : visibleStarCount >= 14 ? " is-packed" : "";
      const minorInner = renderSplitStars(minorNatal, "stars-natal", data, sortFn);
      const annualInner = renderSplitStars(annualStack, "stars-annual-row", data, sortFn);

      const marks = [
        palace.isMenh ? `<span class="mark">Mệnh</span>` : "",
        palace.isThan ? `<span class="mark">Thân</span>` : ""
      ].join("");

      return `
        <article class="palace-cell ${palace.isMenh ? "is-menh" : ""} ${palace.isThan ? "is-than" : ""} ${palace.majorFortune && palace.majorFortune.active ? "is-major-fortune" : ""} ${palace.isAnnualPalace ? "is-annual-palace" : ""}${densityClass}" style="grid-area:${GRID_AREAS[branch]}" data-branch="${branch}" data-zodiac-name="${BRANCH_ZODIAC_NAME[branch]}">
          <img class="zodiac-bg" src="${BRANCH_ZODIAC_ASSET[branch]}" alt="" aria-hidden="true" decoding="async">
          <div class="palace-header">
            <div class="palace-namerow">
              <span class="palace-han han">${palace.han}</span>
              <span class="palace-vname">${palace.name}</span>
              ${marks}
              ${majorRowHtml ? `<span class="palace-major-row">${majorRowHtml}</span>` : ""}
            </div>
            <div class="palace-inforow">
              <span class="branch-tag"><b class="han">${BRANCH_HAN[branch]}</b> ${branch}</span>
              <span class="stem">${palace.stem}${STEM_HAN[palace.stem]}</span>
            </div>
          </div>
          <div class="stars">${minorInner}${annualInner}</div>
          ${phiCorner}
          ${renderPalaceMeta(data, palace)}
        </article>`;
    }).join("");

    els.chart.innerHTML = `${cells}<section class="center-panel">${renderCenterPanel(data)}</section><svg class="tam-hop-lines" id="tamHopSvg" aria-hidden="true"></svg>`;
  }

  function setupTamHop(){
    // Bỏ hiệu ứng nối tam hợp trên mobile (frame-mode scale làm lệch toạ độ, lại không có hover thật).
    if(window.innerWidth <= 700) return;
    const svg = document.getElementById("tamHopSvg");
    const grid = els.chart;

    grid.querySelectorAll('.palace-cell').forEach(cell => {
      cell.addEventListener('mouseenter', () => {
        const branch = cell.dataset.branch;
        const group = TAM_HOP[branch];
        if(!group || !svg) return;

        grid.querySelectorAll('.palace-cell').forEach(c => {
          const inGroup = group.includes(c.dataset.branch);
          c.classList.toggle('th-active', inGroup);
          c.classList.toggle('th-dim', !inGroup);
        });

        const gRect = grid.getBoundingClientRect();
        const pts = group.map(b => {
          const el = grid.querySelector(`[data-branch="${b}"]`);
          if(!el) return null;
          const r = el.getBoundingClientRect();
          return [(r.left+r.right)/2 - gRect.left, (r.top+r.bottom)/2 - gRect.top];
        }).filter(Boolean);

        if(pts.length === 3){
          const [[ax,ay],[bx,by],[cx,cy]] = pts;
          svg.innerHTML =
            `<line x1="${ax}" y1="${ay}" x2="${bx}" y2="${by}"/>` +
            `<line x1="${bx}" y1="${by}" x2="${cx}" y2="${cy}"/>` +
            `<line x1="${cx}" y1="${cy}" x2="${ax}" y2="${ay}"/>` +
            `<circle cx="${ax}" cy="${ay}" r="4" class="th-dot"/>` +
            `<circle cx="${bx}" cy="${by}" r="4" class="th-dot"/>` +
            `<circle cx="${cx}" cy="${cy}" r="4" class="th-dot"/>`;
        }
      });

      cell.addEventListener('mouseleave', () => {
        grid.querySelectorAll('.palace-cell').forEach(c => c.classList.remove('th-active','th-dim'));
        if(svg) svg.innerHTML = '';
      });
    });
  }

  let lastData = null;
  function render(){
    lastData = buildChartData();
    renderChart(lastData);
    setupTamHop();
  }

  window.TuViEngines = window.TuViEngines || {};
  window.TuViEngines["trung-chau"] = { render, getData: () => lastData, elementForStar };
})();
