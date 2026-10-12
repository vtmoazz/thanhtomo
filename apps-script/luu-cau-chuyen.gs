// Web app that appends each anonymous story from hom-thu-an-danh.vercel.app as a row.
const SHEET_ID = "1hLQqZrYFdUIpih-FvkhNgg-48Xz-ABjUudXZJvGBB3k";
const COLUMNS = ["Biệt danh", "Số chủ đạo", "Câu chuyện", "Cách vượt qua", "Lời nhắn", "Đồng ý dùng cho workshop"];

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  if (data._honey || !String(data["Câu chuyện"] || "").trim()) {
    return ContentService.createTextOutput("ignored");
  }
  // A leading ' stops Sheets from evaluating text that starts like a formula.
  const cell = (v) => {
    const s = String(v || "").slice(0, 20000);
    return /^[=+\-@]/.test(s) ? "'" + s : s;
  };
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
  sheet.appendRow([new Date()].concat(COLUMNS.map((c) => cell(data[c]))));
  return ContentService.createTextOutput("ok");
}
