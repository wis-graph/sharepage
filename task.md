# 리팩토링 및 안정화 작업 (Refactoring & Stabilization)

## 📌 목표
현재 `router.js`의 `navigate` 함수가 비대해져 유지보수가 어렵고, 수정 시 다른 기능이 깨지는 취약성(Fragility)을 보이고 있습니다.
`.agent/rules.md`의 **예측 가능성(Predictability)** 및 **인지 부하 감소(Low Cognitive Load)** 원칙에 따라, **책임 분리(Separation of Concerns)**를 수행하여 코드를 견고하게 만듭니다.

## 🛠 작업 내용

### 1. `router.js` 리팩토링
- **문제점**: `navigate` 함수가 데이터 가져오기(Fetch), 파싱(Parse), 변환(Transform), 렌더링(Render), DOM 조작(Update)을 모두 수행하고 있음. (God Function)
- **해결 방안**:
  - `loadDocument(filename)`: 문서 가져오기 및 프론트매터 파싱 (Data Layer)
  - `processMarkdown(content)`: 마크다운 변환, 로컬 이미지 처리, 수식 보호 등 (Logic Layer)
  - `updateView(html, metadata)`: DOM 업데이트 및 티커/목차 생성 (View Layer)

### 2. `utils.js` 경로 로직 확정
- **문제점**: 로컬/서버 환경에 따라 경로 처리가 계속 번복됨.
- **해결 방안**: 환경 감지 로직을 명확히 주석화하고, `isLocal` 상태를 전역 상수화하여 예측 가능성 확보.

### 3. 버전 관리 전략
- 리팩토링 배포 시 캐시 문제를 원천 차단하기 위해 버전 태그를 대대적으로 업데이트 (`v=2.0`).

## ✅ 체크리스트
- [ ] `router.js`의 `navigate` 함수 로직 분리
- [ ] `processMarkdown` 함수 추출 및 파이프라인화
- [ ] `utils.js`의 `getRawUrl` 로직 최종 검증 및 테스트
- [ ] GitHub Pages 배포 및 확인
