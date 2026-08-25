# Google Sheets 제출 연결 설정

이 폴더의 `Code.gs`는 학생 답안을 Google Sheets에 기록하는 Google Apps Script 코드입니다.

## 1. Google Sheet 만들기
1. Google Drive에서 새 Google 스프레드시트를 만듭니다.
2. 예: `미적분1_극한과연속_학생제출`
3. 시트에서 **확장 프로그램 → Apps Script**를 엽니다.

## 2. Apps Script 붙여넣기
1. 기본으로 있는 `Code.gs`의 내용을 모두 지웁니다.
2. 이 폴더의 `Code.gs` 내용을 전부 복사해 붙여넣습니다.
3. 저장합니다.

## 3. 웹 앱으로 배포
1. Apps Script 오른쪽 위 **배포 → 새 배포**를 누릅니다.
2. 유형 선택에서 **웹 앱**을 선택합니다.
3. 실행 계정: **나**
4. 액세스 권한: **모든 사용자(Anyone)** 로 설정합니다.
5. **배포**를 누르고 권한을 승인합니다.
6. 표시되는 **웹 앱 URL**을 복사합니다. URL은 보통 아래와 같습니다.
   `https://script.google.com/macros/s/...../exec`

## 4. 웹페이지에 URL 연결
`assets/js/config.js` 파일을 열어 아래 부분만 바꿉니다.

```js
window.CALCULUS_ACTIVITY_CONFIG = {
  GOOGLE_APPS_SCRIPT_WEB_APP_URL: "여기에_복사한_웹앱_URL"
};
```

## 5. GitHub에 업로드
변경된 `config.js`를 포함하여 웹사이트 파일을 GitHub 저장소에 업로드/덮어쓰기 합니다.
GitHub Pages 주소는 그대로 유지됩니다.

## 6. 테스트
학생용 웹페이지에서 과제 제출 탭으로 이동한 뒤
- 학번
- 이름
- 답안 1
- 답안 2
을 모두 작성하고 **구글 시트로 제출**을 누릅니다.

Google Sheet에 `제출답안` 시트가 자동으로 생성되고 다음 항목이 기록됩니다.
- 서버 제출시각
- 과제
- 학번
- 이름
- 문항1 / 답안1
- 문항2 / 답안2
- 학생 기기 제출시각
- 페이지 주소
- 제출 ID

## 개인정보 안내
웹 앱을 '모든 사용자'로 공개하는 것은 학생들이 Google 로그인 없이 제출할 수 있게 하기 위한 설정입니다.
Google Sheet 자체를 공개할 필요는 없습니다. 제출된 학번/이름/답안이 들어 있는 Sheet는 교사 계정에서 비공개로 유지하세요.
