const SHEET_NAME = '제출답안';

function doGet() {
  return ContentService
    .createTextOutput('미적분Ⅰ 활동자료 제출 시스템이 정상 작동 중입니다.')
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
    }

    const headers = [
      '서버 제출시각',
      '과제',
      '학번',
      '이름',
      '문항1',
      '답안1',
      '문항2',
      '답안2',
      '학생 기기 제출시각',
      '페이지 주소',
      '제출 ID'
    ];

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }

    const p = e && e.parameter ? e.parameter : {};
    const submissionId = String(p.submissionId || '');

    // 같은 제출 ID가 이미 기록되어 있으면 중복 저장하지 않습니다.
    if (submissionId && sheet.getLastRow() >= 2) {
      const existing = sheet.getRange(2, 11, sheet.getLastRow() - 1, 1).getDisplayValues().flat();
      if (existing.includes(submissionId)) {
        return jsonResponse_({ ok: true, duplicate: true });
      }
    }

    sheet.appendRow([
      new Date(),
      p.assignment || '',
      p.studentId || '',
      p.studentName || '',
      p.question1 || '',
      p.answer1 || '',
      p.question2 || '',
      p.answer2 || '',
      p.clientSubmittedAt || '',
      p.pageUrl || '',
      submissionId
    ]);

    return jsonResponse_({ ok: true, duplicate: false });
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
