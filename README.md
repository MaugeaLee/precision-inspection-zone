# 정밀검사 Zone · Inspection Studio

메타팩토리의 정밀검사존만 독립 실행하는 3D 애니메이션입니다. 다른 생산 Zone의 3D 공장은 만들지 않고, 샘플 반입 구역과 품질 환류 요청으로 연결을 표현합니다.

## 실행

Node.js가 있는 환경에서 이 폴더의 터미널을 열고 `node server.mjs`를 실행한 후 `http://127.0.0.1:8786`을 엽니다. 별도 npm 설치나 빌드가 필요 없습니다. `dist/`는 정적 호스팅으로도 실행할 수 있습니다. ES 모듈을 사용하므로 index.html을 파일로 직접 여는 방식은 지원하지 않습니다.

## 포함 기능

- 접수·도킹, 비전검사, 3D 스캔·UT, O-INSPECT, ATOS, AI 판정의 6개 공정 노드
- 원본의 검사장비 모델·관절 로봇·AMR 3대·검사 상태머신
- 제품별 경로: 후드·도어·도어트림은 VIS→SCAN, e-axle은 VIS→OINS, 유압블록·리어커버는 ATOS→OINS
- 정상 OK, 불확실→O-INSPECT 재측정→OK, NG→보류·선행공정 환류 요청
- 제품·판정 시나리오별 수동 투입, 자동 시연, 재생·일시정지·1/3/10/30배속, 보호정지·해제
- 셀 클릭 확대, 전체 보기, 라벨·데이터 패킷 표시, 셀 이상·복구 시연
- 제품 ID·샘플별 검사 이력과 수행 경로의 CSV/JSON 저장
- 1920×1080 WebM 영상 녹화: 3D 장면·공정 라벨·시각·실적을 포함

Space는 재생/일시정지, Esc는 전체 보기입니다. 초기 시연에는 후드 OK, 유압블록 불확실 후 재측정, e-axle NG가 각각 1개씩 들어 있습니다. 모드 전환·초기화는 현재 이력을 초기화하므로 필요한 이력은 먼저 저장합니다.

## 표현 범위

장비의 실제 도입 구성·검사 정확도·결함검출 성능·장비별 적합성 검증을 의미하지 않습니다. 사이클·판정은 시나리오 모사값입니다. 실장비·PLC·MQTT·AI 모델과 연결하지 않았습니다. NG 후속 조치는 제조 Zone으로 보내는 요청으로 기록하며, 실제 리워크가 완료되었다고 표시하지 않습니다.

원본의 단독 사용자 시뮬레이션을 기반으로 합니다. SERVER_SPEC_PLAN.pdf의 A-3 정밀조립존 서버 구성·인력·저장 용량은 이 정밀검사존의 도입 사양으로 전용하지 않았습니다.

## 원본·수정 범위

- 원본: https://github.com/theuniversepark/meta-factory / Jin Park
- 참조 커밋: `8e703832d445e5751baa747ce51983bb620d89e0`
- 원본 화면: https://theuniversepark.github.io/meta-factory/
- `dist/original/`에는 `js/inspzone.js`와 그 전이 의존성을 보관했습니다. 다른 Zone의 시뮬레이션 클래스는 실행하지 않습니다.
- `session.js`는 샘플 요청·반입 경로·강제 시연 판정·검사 이력·설비 이상 시연을 독립 실행용으로 연결합니다.
- `app.js`, `style.css`, `index.html`은 단독 관제 화면·시점·녹화·내보내기입니다.
- 원본 O-INSPECT 코드에서 주석 뒤에 붙어 실행되지 않던 탐침 위치 갱신문을 별도 줄로 복원했습니다.
- 원본의 `package.json`은 ISC 라이선스로 표기합니다. 원본 오픈소스 고지는 `dist/assets/ORIGINAL_OPEN_SOURCE.md`, 소스 버전은 `dist/assets/source.json`에 있습니다.
- three.js의 MIT 라이선스와 ABB 모델의 Apache-2.0 라이선스를 각각 `dist/vendor/three/LICENSE`, `dist/assets/models/ABB_APACHE-2.0.txt`에 포함합니다.

브라우저 검증: 초기 후드의 DOCK→VIS→SCAN→JUDGE 후 OK, e-axle의 DOCK→VIS→OINS→JUDGE 후 NG, 유압블록의 DOCK→ATOS→OINS→JUDGE→OINS→JUDGE 후 OK를 품질 이력 화면에서 확인했습니다.
