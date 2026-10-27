# PDF 이미지 기반 재배치 점검

기준: AI정밀측정zone.pdf 3~7쪽. 실제 설치 도면이나 안전 인증 결과가 아닌 시연용 배치 검토.

- Cell 1: 표면·피처 비전 부스 / O-INSPECT / MMZ M을 가로 배치. 그리퍼·툴 스테이션은 부스와 CMM 사이의 별도 공간.
- Cell 2: ScanBox 8160 / 5130 / UT 부스 / X-ray를 나란히 배치. 전면 조작반·펜스·반입 공간 분리.
- Cell 3: 지상 순찰 통로 및 충전 캐비닛·도킹 공간.
- Cell 4: 창고 랙·드론 도킹/충전 공간. 공장 상부 순찰 유지.
- Cell 5: 후면 관제월, 중간 운영 데스크, 전면 서버를 서로 분리.

## 간섭 개선

- H2515 베이스를 검사 지그 좌우 바깥으로 이동. 우측 로봇의 기준 방향 반전.
- HDR50-22를 전면 독립 받침대에 배치. 기존 지그 내부 베이스 겹침 제거.
- 검사 설비를 AMR 정차점 뒤로 2.5m 이동. AMR 주 통로를 검사 셀 좌측으로 분리.
- 부스 폭 확대, 전면 개구부 확보. 로딩/언로딩 시 협동로봇은 대기 위치로 복귀.
- CMM 프로브는 로딩 대기 시 상승. OCS 서버와 AMR 정차점도 분리.

## 검증 범위

H2515 2대와 HDR50-22의 시연 동작을 101개 진행 시점에서 검사. 로봇 메시별 경계상자와 비전 테이블, 로봇 상호 간 경계상자 겹침 후보 0건. 최대 TCP 목표 오차 약 12mm. 수치는 시각화 IK 검사 결과이며 실제 측정 정밀도가 아니다.

이는 메시 삼각형 기반 연속 충돌 검증, 모든 제품의 운반 부피 검증, 가반하중·공구 자세·안전거리 검증을 대체하지 않는다. 실제 설비 배치는 제조사 CAD 및 안전 검토가 필요하다.

## 2026-10-24 검사 동작 개정

위 101개 시점 간섭 검사는 이전 동작에 대한 기록이며 이번 경로에 그대로 적용되지 않는다.
이번 버전은 제품 메시의 상부 표면을 레이캐스팅하여 검사 예시점을 생성한다. ABIS III 표면 영역 검사 후 AIMAX 측정점을 순차 검사한다. 접촉 측정은 안전 높이 이동, 접근, 정지 취득, 후퇴를 구분한다. O-INSPECT는 광학 후 접촉, MMZ M은 접촉 측정으로 표시한다. ATOS는 다중 위치 정지 취득, X-ray는 반입·차폐문 닫힘·인터록 확인·조사·개방·반출을 구분한다.

도달 범위 확보를 위해 H2515에는 후면 이동축을 시각화했다. 이는 실제 공급 구성 확정이 아닌 개념 배치 추가다. ScanBox의 센서 이동 기구도 개념 표현이다. 피처/용접점은 실제 CAD의 홀·용접선이나 GD&T를 식별한 결과가 아닌 표면 기반 예시점이다. 센서 자세는 가상 조정 마운트로 표현하며 실제 6축 자세 역기구학 검증 결과가 아니다.

검증: 6개 제품 × 4개 검사 동작 × 160 진행 지점에서 좌표 유효성과 표면 아래로의 목표 침범 여부 확인. ABIS/AIMAX 목표에 대한 반복 위치 IK 최대 잔차 약 0.012m(시연 솔버의 종료 허용오차). 실제 장비 측정 정확도, 연속 충돌 회피, 제조사 프로그램 또는 공정 승인과 무관하다.

## 2026-10-25 MMZ G 및 AMR 교통 개정

- 문형 측정기를 ZEISS MMZ G로 변경. 공식 제품 사진의 양측 장축 레일, 테이퍼 기둥, 굵은 문형 빔, 상부 Z축을 반영한 코드 기반 시각화. 제조사 CAD 또는 특정 크기 구성의 실치수 모델은 아니다.
- AMR 대기 간격 4m, 북측 접수 대기 위치 및 접수 도크를 분리. 주행은 셀 앞 가로 통로와 좌측 세로 통로를 경유하며 화면 경로선도 동일 경로를 사용.
- 전체 이동 경로 예약을 보수적으로 적용: 공용 통로에서는 한 대가 이동하고 다른 AMR은 통로 밖 정차 위치에서 대기. 장비 검사는 병렬 진행 가능. 통로 예약 대기를 UI에 표시.
- 20초 경과 후 강행, 정차 차량 무시, 상대 셀 동시 맞교환을 제거. 점유된 후속 셀을 기다릴 때 개인 대기소로 이동한 뒤 다시 진입.
- AMR 모델 및 6종 제품의 수평 외곽 반경 약 0.881m 이하 확인. 최소 중심 간격 2.6m 적용.
- 원래 검사 상태 머신으로 12개 혼합 작업을 dt 0.08/0.04초에서 각각 실행: 전량 완료·3대 복귀, 최소 중심 거리 약 2.900m.
- 연속 요청·고장 주입·재측정 포함 시험: 36개 요청 모두 완료, 재측정 6회, 고장 주입 12회, 3대 모두 복귀, 최소 중심 거리 약 2.900m.
- 테스트는 시연 경로와 AMR 간 간격에 대한 소프트웨어 검증이다. 실제 시설의 사람·순찰 로봇·설비 전체와의 안전 검증을 의미하지 않는다.
- MMZ G 참고: https://www.zeiss.com/metrology/en/systems/cmms/large-cmms/mmz-g.html

## 2026-10-25 O-INSPECT 8/6/3 형상 개정

ZEISS 공식 8/6/3 제품 사진을 참고하여 흰색 본체·검은색 베이스, 양측 지지 구조, 주름형 가이드 커버, 세로 헤드, 광학부와 접촉 프로브, 유리 테이블, 전면 조이스틱 조작부를 재구성했다. 제조사 CAD 또는 외형 실치수 재현은 아니다. 테이블 이동과 헤드 위치를 기존 광학/접촉 시연 단계에 연결했다. 형상 보기에도 O-INSPECT 8/6/3 항목을 추가했다.

검증: JS 구문 검사, 브라우저 광학·접촉 단계 확인, 6종 제품의 8개 접촉점(총 48개)에서 테이블 이동 후 프로브 끝과 목표점의 기하학적 일치 확인. 이는 실제 800×600×300mm 측정 범위 적합성이나 제조사 측정 정확도 검증이 아니다.
참고: https://www.zeiss.com/metrology/en/systems/cmms/vmms/o-inspect.html

## AMR physical handoff animation (2026-10-25)
- One carrier payload object is reparented to the HDR50-22 gripper and fixture; released only after landing. Product-height grasp offset, jaw closing dwell, vertical lift/lower, lateral transfer arc, and empty return added.
- Preview includes an AMR; reverse seeking and product replacement supported. Session reset/ready/detach restores or removes held payloads.
- Validation: 528 scene ownership/pose checks across six products and four stations; maximum sampled IK residual 5.3 mm. Existing 36-request traffic regression completes, including six remeasurements and twelve faults.
- Concept animation: gripper orientation is stabilized, not a validated six-axis tool-orientation program. SCAN internal ATOS/UT/X-ray stage transitions retain the existing schematic display; AMR-to-staging-fixture handoff is updated.


## Product routing and handling tools (2026-10-25)
- Demo classification: hood/door -> MMZ G; doortrim/e-axle/hblock/rcover -> O-INSPECT. Same policy for initial inspection, uncertain-result remeasurement, and preview selection.
- Four-pad vacuum tooling for large panels, dimensioned opening/closing parallel jaws for remaining products. Tool mount, actuator and gripping indicator visible. Illustrative tooling, not validated engineering design or machine capacity certification.
- Six uncertain scenarios each completed two measurements on only their permitted CMM; 528 transfer ownership checks and the 36-request traffic regression passed. Preview verified both tool types and disabled incompatible product choices.

## ScanBox sizing and welded-only NDT (2026-10-25)
- ScanBox selection shares the existing size policy: hood/door -> 8160, other products -> 5130 when 3D scanning is selected. Existing product-level scan route inclusion is preserved.
- Welding is a separate recipe attribute. Demo hood/door variants are assumed welded assemblies; remaining variants are non-welded. UT robot motion, specimen visibility, X-ray exposure and phase events are gated on welding.
- Non-welded scans cover the scan interval without UT/X-ray stages. Product route display and stored result metadata describe ScanBox allocation and NDT eligibility.
- Validation: 60 scene-level checks across six products and phase boundaries; all six CMM initial/remeasurement routing tests passed. Browser verified door on 8160 and doortrim on 5130 with NDT excluded.

## ScanBox selection fix (2026-10-26)
- Scanner geometry carries distinct 8160/5130 selection identities. Each identity targets its own world position instead of the shared SCAN/UT docking position.
- Added dedicated scanner list buttons and pointer/keyboard-enabled labels. Shared SCAN selection frames the complete inspection row.
- Browser verification: both list buttons update the camera and equipment heading; direct 8160 mesh click switches selection; label Enter activation works.

## ScanBox reference-based exterior (2026-10-26)
- Rebuilt 5130 with white front columns, dark modular side/rear panels, open top/front, control display, vents, light curtain and round table. Rebuilt 8160 with twin tall dark cabinets, elongated enclosure, twin linear rails and fixture table.
- Reference envelope: 5130 4.30 x 4.25 x 3.05 m; 8160 5.75 x 10.15 x 3.90 m. Detailed geometry is interpretive, not manufacturer CAD. User-requested H2515 robots are retained instead of the different yellow arms in the reference photos; robot bases and tool poses remain concept animation.
- Official visual references inspected: https://www.zeiss.com/metrology/en/systems/optical-3d/automated-solutions/scanbox/zeiss-scanbox-series-5.html and https://www.zeiss.com/metrology/en/systems/optical-3d/automated-solutions/scanbox/atos-scanbox-series-8.html
- Dimensions: ZEISS ATOS 5 brochure https://asset-downloads.zeiss.com/catalogs/download/iqs/5cae8e6c-b6c5-48f6-8bbf-4bceeb15c0a3/zeiss_atos_5_brochure_en.pdf.pdf
- Removed intersecting old scanner fences and control pedestal. Existing click identity/labels preserved; 60 scene recipe checks passed and both new exteriors inspected in browser.


## 2026-10-26 참고 이미지 기반 구역 재배치

공정 시나리오 v0.4 p.1/3/5/7의 장비 관계를 적용했다. 비전 중앙 지그와 양측 센서는 유지하고 툴 스테이션을 부스 좌측 안쪽, 제어반을 우측으로 이동했다. O-INSPECT와 MMZ G 사이 간격을 줄이고 중간 툴 교환 공간을 마련했다. ScanBox 두 반입구를 동일 선상에 두고 앞쪽 캐리어/레일을 추가했다. UT는 개방 작업대로 변경하고 협동로봇을 좌측, X-ray를 우측에 배치했다. 네 구역 바닥 경계와 배치별 카메라 버튼을 추가했다.

치수 없는 참고 이미지이므로 장비 간격은 개념 배치다. 이미지의 공용 이송 로봇 1대 대신 기존 공정별 이송 로봇을 유지한다. 측면 이동 실험은 도달 범위 검증에서 실패하여 취소했다. 실제 적용 위치에서 이송 528 프레임의 최대 TCP 오차는 0.0053 scene units. 검사 조합 1344 프레임, 34건 연속 AMR 운행 완료, 최소 AMR 중심 간격 2.90 scene units. 이는 완전한 3D 충돌/안전 검증이 아니다.


## 비전검사 부스 확장
외곽 기둥 기준 폭 6.5 → 8.4, 깊이 4.9 → 6.4, 높이 3.4 → 3.8 scene units. 앞쪽 반입 기준은 고정하고 후방 및 좌우를 확장했다. 로봇·지그 좌표는 유지하고 우측 제어반을 외곽으로 이동했다. 좌측 벽은 x=31.05로 AMR 주 통로 x=29.4와 분리했다. 실제 설치 치수는 아니다.


## 2026-10-27 첨부 이미지 기준 비전검사 구성

투명 프레임 안전 패널과 열린 전면, 중앙 품목별 고정 지그, 좌우 고정 베이스 H2515 센서 로봇, 좌측 전면 HDR50-22 이송 로봇과 AMR 도킹으로 수정. 도어/후드/도어트림은 90도 세워 검사하고 조립품은 평면 안착한다. 이송 중 그리퍼와 제품이 동일 회전으로 자세를 바꾸며 고정 지그에 인계한다. 검사 좌표/법선/측정 이력 점도 제품 회전에 맞춰 변환한다. 검사 로봇의 이전 좌우 이동축 모사는 비전검사에서 제거했다. 외벽, 부품과 지그는 참고 이미지 기반 시연 형상이며 정확한 실물 CAD 재현이 아니다.

검증: 이송 528개 프레임에서 소유권/파지 오프셋/역방향 스크럽 유지, 최대 TCP 오차 0.0091 scene units. 4제품의 두 센서 취득 지점에서 최대 목표 오차 0.012 이하. AMR 연속 34건 및 혼합 12건 운행 회귀 완료. 정확한 물리 충돌 또는 실제 로봇 안전성 검증은 아니다.

## 2026-10-27 AMR source bay separation
Moved all three sample pickup bays from z=-31.5 to -37.5, behind the vision rear wall at -31.4. Visible pads and actual dispatch destinations share source-bays.js. Rear aisle remains -39; ground patrol remains -35, between the booth and bays. South charging station is unchanged.
