# SharePage 옵시디언 플러그인 연동 가이드 (한국어)

이 가이드는 SharePage 깃헙 저장소와 연동되는 옵시디언 플러그인을 개발하는 개발자(및 AI 에이전트)를 위한 지침서입니다.

## 🏗 아키텍처 개요

배포 지연을 최소화하고 일관된 소셜 미디어 미리보기(Open Graph)를 보장하기 위해, 시스템은 **하이브리드 렌더링 전략**을 따릅니다.

| 컴포넌트 | 책임 범위 |
| :--- | :--- |
| **옵시디언 플러그인** | 즉각적인 "사전 패키징": 푸시 전 OG용 HTML을 생성하고 대시보드를 직접 업데이트합니다. |
| **GitHub REST API** | 데이터 교환: 저장소 전체를 클론하지 않고 멀티 파일 커밋을 수행합니다. |
| **GitHub Actions** | 백그라운드 유지보수: 레거시 파일 동기화, CSS 번들링, 최종 CDN 배포를 트리거합니다. 또한 **고아 파일 청소(Orphan Cleanup)**를 통해 마크다운 삭제 시 HTML/링크를 자동으로 정리합니다. |

---

## � 참고해야 할 핵심 스크립트

플러그인이 구현해야 할 모든 변환 로직은 다음 파일들에 정의되어 있습니다:

### 1. `scripts/core-logic.js` (가장 중요: 시스템의 브레인)
플러그인이 배포 전에 수행해야 할 **모든 변환 공식**이 들어있습니다.
*   **활용**: 플러그인은 이 파일의 로직을 그대로 복사하거나 동일하게 구현해야 합니다.
*   **주요 함수**:
    *   `applyMetadataToTemplate`: HTML 템플릿에 제목/설명/이미지를 주입하는 규칙.
    *   `updateDashboardContent`: `_dashboard.md` 파일의 특정 섹션에 링크를 정교하게 찔러넣는 로직.
    *   `normalizeName`: 한글 깨짐 방지를 위한 NFC 정규화(필수).

### 2. `scripts/classifier.js` (분류 지능)
문서가 대시보드의 어디로 갈지 결정하는 **분류 규칙**이 들어있습니다.
*   **활용**: 플러그인이 `_dashboard.md`를 업데이트할 때, 문서의 `type`이나 `source_type`을 보고 어떤 헤딩(`## YouTube` 등) 아래에 넣을지 판단하는 근거가 됩니다.

### 3. `scripts/processors/` 폴더 (데이터 추출 규칙)
각 문서 타입별로 **무엇을 미리보기 데이터(OG)로 쓸지** 정의합니다.
*   **활용**: `standard.js` 및 `youtube.js` 로직을 참고하여 HTML 생성 시 플레이스홀더를 채울 데이터를 추출하십시오.

---

## �🛠 공유 로직 (`scripts/core-logic.js`, `scripts/classifier.js`)

플러그인은 완벽한 일관성을 위해 저장소 내 스크립트의 로직을 그대로 따라야 합니다.

### 플러그인에 구현해야 할 핵심 로직:

1.  **NFC 정규화**: 모든 한글 파일명과 경로는 반드시 NFC 형식으로 강제해야 합니다.
    ```javascript
    const normalized = name.normalize('NFC');
    ```

2.  **메타데이터 추출**: YAML 프론트매터를 파싱하고 OG 태그용 텍스트를 정제합니다.
    *   마크다운 링크 `[[...]]` 및 각종 서식 기호 제거.
    *   `title`, `description`, `thumbnail`, `tags` 추출.

3.  **HTML 빌더**:
    *   저장소에서 `src/index.html` 템플릿을 가져옵니다.
    *   플레이스홀더 치환: `{{TITLE}}`, `{{DESCRIPTION}}`, `{{PAGE_URL}}`, `{{OG_IMAGE}}`, `{{DOMAIN}}`.
    *   **규칙**: 모든 자산에 절대 URL을 사용합니다. 형식: `${DOMAIN}/posts/${normalizedName}.html`.

4.  **분류 엔진 (Classifier)**:
    *   `scripts/classifier.js`를 참조하여 문서가 어느 대시보드 섹션으로 갈지 결정합니다.
    *   **로직**: 메타데이터의 `type` 또는 `source_type` 확인.
    *   **매핑**: 타입이 `youtube`면 `## YouTube` 섹션, 그 외에는 기본적으로 `## Inbox` 섹션으로 분류.

5.  **대시보드 동기화**:
    *   `notes/_dashboard.md`를 가져옵니다.
    *   **분류 엔진**을 사용하여 올바른 헤딩(예: `## YouTube`)을 찾습니다.
    *   해당 섹션 바로 아래에 `- [[NoteName]] YYYY-MM-DD`를 삽입합니다.
    *   파일 전체를 덮어쓰지 말고 해당 라인만 정교하게 삽입하십시오.

---

## 🚀 플러그인 워크플로우 (단계별)

깃헙 액션 완료를 기다리지 않고 "즉시 공유"를 구현하기 위해 플러그인은 다음 순서를 따릅니다.

### 1단계: 데이터 조회
GitHub REST API(GET)를 통해 필요한 컨텍스트를 가져옵니다:
*   `src/index.html` (HTML 생성용 템플릿)
*   `notes/_dashboard.md` (업데이트할 대시보드 파일)
*   `posts/file_index.json` (업로드된 전체 노트 레지스트리 - 목록 조회 및 관리용)

### 2단계: 메모리 기반 처리
디스크 쓰기 없이 메모리상에서 처리합니다:
1.  활성화된 옵시디언 노트에서 프론트매터 추출.
2.  소셜 미리보기용 정적 HTML 생성.
3.  업데이트된 `_dashboard.md` 문자열 생성.

### 3단계: 원자적 멀티 파일 커밋 (Atomic Commit)
GitHub REST API를 사용하여 **모든 파일을 단일 커밋**으로 푸시합니다.
*   **커밋 포함 파일**:
    1.  `notes/노트명.md` (원본 콘텐츠)
    2.  `posts/노트명.html` (OG 미리보기용)
    3.  `notes/_dashboard.md` (업데이트된 인덱스)

### 4단계: 문서 삭제 및 일괄 작업
문서를 삭제하거나 관리할 때:
1.  **조회**: `posts/file_index.json`을 읽어 현재 공유 중인 노트를 리스팅합니다.
2.  **삭제**: `notes/노트명.md` 파일에 대해 `DELETE` 작업을 수행하는 것으로 충분합니다.
    *   **참고**: 깃헙 액션 서버가 다음 실행 시 대응하는 `posts/노트명.html`과 대시보드 링크를 자동으로 지워줍니다 (고아 파일 청소).
    *   보다 즉각적인 동기화를 위해 같은 커밋에서 `posts/노트명.html`까지 함께 지우는 것을 권장합니다.

### 5단계: 배포 추적 (Tracking)
푸시 후 GitHub API(`/repos/{owner}/{repo}/pages/deployments`)를 폴링하여 배포 상태를 추적합니다.
1.  사용자 알림: "GitHub에 저장 중..."
2.  사용자 알림: "웹 서버 배포 중 (약 30초 소요)..."
3.  상태가 `succeed`가 되면 URL을 클립보드에 복사하고 알림: "공유 링크가 준비되었습니다!"

---

## 🤖 AI 개발자를 위한 팁

-   **클론 불필요**: `Octokit`이나 네이티브 `fetch`를 사용해 REST API로 직접 통신하세요.
    -   **Base64 인코딩**: GitHub API는 파일 콘텐츠를 Base64로 인코딩하여 전송해야 합니다.
    -   **NFC는 필수**: `.normalize('NFC')`를 누락하면 카카오톡 등에서 한글 링크가 깨집니다.
    -   **URL 안전성**: `{{PAGE_URL}}` 태그의 파일명에는 반드시 `encodeURIComponent`를 사용하세요.

---

## 🔗 참조 URL 형식
-   **포스트 경로**: `${DOMAIN}/posts/${encodeURIComponent(name)}.html`
    -   **자산 경로**: `${DOMAIN}/images/${imageName}`
    -   **스타일**: 항상 `${DOMAIN}/css/bundle.css`를 링크하세요.
