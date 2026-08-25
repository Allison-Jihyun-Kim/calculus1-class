# 미적분Ⅰ 극한과 연속 상호작용 활동자료

GitHub Pages 배포용 정리본입니다.

## 폴더 구조

```text
calculus_limit_continuity_github/
├─ index.html
├─ .nojekyll
├─ README.md
└─ assets/
   ├─ css/
   │  └─ styles.css
   ├─ js/
   │  └─ app.js
   └─ images/
```

## 로컬에서 미리보기

`index.html`을 Chrome/Edge로 열면 기본 화면을 확인할 수 있습니다.

더 안정적으로 보려면 Windows PowerShell에서 이 폴더로 이동한 뒤:

```powershell
py -m http.server 8000
```

브라우저에서 `http://localhost:8000` 을 여세요.

## GitHub Pages 배포

1. GitHub에서 새 repository를 만듭니다.
2. 이 폴더 **안의 파일들**을 repository 최상위(root)에 업로드합니다.
3. `Settings` → `Pages`로 이동합니다.
4. `Build and deployment`에서 `Deploy from a branch` 선택.
5. Branch `main`, folder `/ (root)`를 선택하고 저장합니다.
6. 배포가 완료되면 Pages 주소가 표시됩니다.

## 무엇을 어디서 수정하나

- 페이지 내용, 문항, 탭: `index.html`
- 색상, 레이아웃, 글자 크기: `assets/css/styles.css`
- 버튼, 그래프, 슬라이더, 정답 판정: `assets/js/app.js`
- 교과서 그림이나 아이콘: `assets/images/`

## Google Sheets 학생 제출 기능
최종 버전에는 학생이 **학번 + 이름 + 답안 2개**를 입력한 뒤 Google Sheets로 제출할 수 있는 기능이 포함되어 있습니다.

연결에는 교사가 한 번만 Google Apps Script 웹 앱을 배포해야 합니다.
자세한 단계는 `google-apps-script/SETUP.md`를 참고하세요.

연결 파일: `assets/js/config.js`
