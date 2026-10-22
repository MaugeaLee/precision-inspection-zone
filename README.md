# 정밀검사 Zone · Inspection Studio

메타팩토리의 정밀검사존만 독립 실행하는 3D 애니메이션입니다. 다른 생산 Zone의 3D 공장은 만들지 않고, 샘플 반입 구역과 품질 환류 요청으로 연결을 표현합니다.

## 실행

Node.js가 있는 환경에서 이 폴더의 터미널을 열고 `node server.mjs`를 실행한 후 `http://127.0.0.1:8786`을 엽니다. 별도 npm 설치나 빌드가 필요 없습니다. `dist/`는 정적 호스팅으로도 실행할 수 있습니다. ES 모듈을 사용하므로 index.html을 파일로 직접 여는 방식은 지원하지 않습니다.

## 포함 기능

- 사업계획서의 A-4-1~A-4-5 5개 셀, 접수·도킹은 공용 반입 구역
- A-4-1: 초고성능 로봇형 검사 비전 시스템 Cell
- A-4-2: 3D 스캔과 초음파 용접 검사 로봇 Cell
- A-4-3: 4족 보행 검사 및 안전 모니터링 로봇 Cell
- A-4-4: 원키트 (One-Kit) 비전 센서 기술 드론 Cell
- A-4-5: AI정밀검사(QMS) 통합 OCS 시뮬레이션 Cell
- 피지컬AI 전용. 자동화 모드 선택 삭제
- ZEISS ABIS III, AIMAX, O-INSPECT 8/6/3, MMZ M 개념 모델
- 두산 H2017/H2515 검사 협동로봇 선택, 현대 HDR50-22 이적재 로봇
- 두산 H2017/H2515 및 현대 HDR50-22는 공식 공개 메시와 URDF 관절 원점·축·제한값을 반영. HDR80-22는 공식 형상 미확보로 선택 비활성화. 가반하중·충돌·센서 자세 검증 모델은 아님
- AMR 3대·검사 상태머신은 원본을 기반으로 함
- 제품별 경로: 후드·도어·도어트림은 VIS→SCAN, e-axle은 VIS→OINS, 유압블록·리어커버는 MMZ→OINS
- 정상 OK, 불확실→O-INSPECT 재측정→OK, NG→보류·선행공정 환류 요청
- 제품·판정 시나리오별 수동 투입, 자동 시연, 재생·일시정지·1/3/10/30배속, 보호정지·해제
- 셀 클릭 확대, 전체 보기, 라벨·데이터 패킷 표시, 셀 이상·복구 시연
- 제품 ID·샘플별 검사 이력과 수행 경로의 CSV/JSON 저장
- 1920×1080 WebM 영상 녹화: 3D 장면·공정 라벨·시각·실적을 포함

Space는 재생/일시정지, Esc는 전체 보기입니다. 초기 시연에는 후드 OK, 유압블록 불확실 후 재측정, e-axle NG가 각각 1개씩 들어 있습니다. 초기화는 현재 이력을 초기화하므로 필요한 이력은 먼저 저장합니다.

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

브라우저 검증: 초기 후드의 DOCK→VIS→SCAN→JUDGE 후 OK, e-axle의 DOCK→VIS→OINS→JUDGE 후 NG, 유압블록의 DOCK→MMZ→OINS→JUDGE→OINS→JUDGE 후 OK를 품질 이력 화면에서 확인했습니다.


## 구성 근거 (2026-10-22 수정)

셀 명칭: 연구개발계획서 부록 최종제출본 PDF 55~56쪽 및 78쪽. 장비 모델: 사용자 지정. O-INSPECT는 A-4-1, MMZ M은 A-4-2 하위 장비로 배치한 시연 구성안이며 사업계획서의 확정 배치를 뜻하지 않습니다. MMZ M은 문형 CMM으로 초음파 센서를 대체하지 않습니다. 4족·드론은 제조사 미지정 개념 모델입니다.

모델 참고: https://www.zeiss.com/metrology/en/systems/optical-3d/automated-solutions/zeiss-abis-iii.html , https://www.zeiss.com/metrology/en/systems/cmms/large-cmms/mmz-m.html , https://www.doosanrobotics.com/en/product-solutions/product/h-series/h2515/ , https://hd-hyundairobotics.com/biz/product/detail/14


## 로봇·제품 형상 수정

- `shapes.js`: 공식 메시와 URDF의 관절 계층·링크 길이를 유지하고 6축 위치 IK를 적용합니다. 로봇 링크를 늘이거나 다른 모델로 확대 대체하지 않습니다.
- `models.html`: 로봇 3종과 제품 6종의 개별 확대·회전 확인 화면.
- 제품은 원본 메타팩토리의 GLB 6종을 그대로 사용합니다. 검사 대상인 가공 완료 상태를 선택하며 유압블록 Raw 그룹은 숨깁니다. AMR·운반·지그에서 동일 제품을 표시합니다. 실물 CAD가 아닙니다.
- 두산 공식 소스: https://github.com/DoosanRobotics/doosan-robot2
- 현대 공식 소스: https://github.com/hyundai-robotics/hdr_description
- 커밋: `dist/assets/models/official/sources.json`. BSD-3-Clause 고지를 함께 제공합니다.
- 변환: 공식 DAE/STL을 GLB로 변환, URDF visual 원점·0.001 단위 변환·관절 축·범위 유지. Z-up에서 Y-up으로 좌표축 회전만 적용합니다.
- 검증: 3개 로봇별 대표 3개 TCP 목표의 유한값·관절 범위 및 30 mm 이하 시각화 IK 잔차 확인, 제품 6종 유효 경계 크기 확인. 이는 충돌·센서 방향·실장비 정확도 검증이 아닙니다. UI에서 9개 모델을 시각 확인하고 정상/NG/재측정 경로를 확인했습니다.


## 부스 및 공장 순찰 수정
- 화면의 사업계획 셀 코드 표기 제거, 5개 셀 설명 유지.
- AI정밀측정zone.pdf 3~4쪽을 참고한 프레임·투명 안전패널·반입 개구부의 검사 부스 구성. 제조사 CAD 부스는 아님.
- 4족 로봇: 생산·조립·가공·물류·검사 구역 주변 지상 통로 순찰. 드론: 공장 전체 6m 상공 순찰. 두 경로 모두 시뮬레이션 시간과 재생·정지에 연동.
- 주변 공장 구역은 순찰 시연을 위한 개념 배치이며 실제 건축 배치가 아님.
