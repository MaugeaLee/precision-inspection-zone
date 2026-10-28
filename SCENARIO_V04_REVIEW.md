# 공정 시나리오 v0.4 반영 (2026-10-26)

- 비전: ABIS 표면 / AIMAX 피처 / 모두 선택, 선택하지 않은 센서 대기.
- 3D: 5130은 도어·후드·트렁크 패널, 8160은 BIW·차체·대형 패널 대상으로 구분. 현재 제공 제품에는 BIW 형상이 없음.
- NDT: 용접·접합부 및 하우징 대상 UT / X-ray / 모두 선택, 두 검사 순서 선택.
- 정밀측정: 대형 패널 MMZ G, 그 외 O-INSPECT. 고정·환경·프로브·좌표계 준비 및 유효성 분석 단계 표시.
- 예외: 레시피, 고정, 환경, 취득, 정합, CAD 정렬, 불확실, NG, X-ray 인터록 보류와 조치 확인 후 재개. 취득/분석 관련 재검사는 검사 구간에서만 주입 가능.
- 불확실 판정 시 마지막 검사 공정을 다시 실행. 기록에 레시피와 예외 처리 이력 포함.

## 검증과 범위

선택 검사 조합 1,344 프레임, 비전 4모드, 인터록 차단, 보류 중 진행 정지, 해당 공정 재검사 및 AMR 혼합 운행 회귀 검증.
제품별 기본 레시피는 시연 예시이며 생산용 승인 조건이 아니다. 실제 센서 측정값, 교정, 안전 PLC, 리워크 및 미해결 예외의 자동 처리는 구현 범위가 아니다. ScanBox와 NDT 사이 이송은 개념 단계 표현이며 모든 내부 이송이 물리적으로 연속된 로봇 동작은 아니다.

## 2026-10-27 Physical AI explanatory animation
- Added physical-ai.html, linked from the main factory header: three 30-second chapters, pause, seek, replay and chapter selection.
- Door pickup: example AMR load offset/yaw changes the pickup pose and gripper trajectory.
- Reacquisition: ABIS 3 observes the same sample location from a changed sensor pose; acquisition is disabled until the confirmation stage.
- Fixture recovery: reverse the placement approach to regrasp/lift, shift to the nominal location, lower and release, then resume inspection.
- Captions show AS-IS / TO-BE and perception, decision, action, verification. They are included in a 1920x1080 silent WebM recording.
- All detections, decisions and confirmations are scripted examples, explicitly labeled. No learned policy, camera feed, inference service or live robot integration is claimed.
- Verification: 4506 forward/reverse timeline frames, max handler target error 0.002, max sensor target error 0.012 (scene units); payload retains gripper ownership. Existing transfer regression: 528 checks passed. These are visualization checks, not equipment safety/accuracy certification.

## Unified demo mode (supersedes the separate explanation page)
Physical AI example actions now run within the actual VIS sample lifecycle for door/hood surface recipes. Logical progress remains monotonic; the visual progress performs regrasp/reseating before inspection, then revisits an acquisition point before continuing the chosen recipe and unloading to the same AMR. The existing pause, protective stop, fault, process hold, speed, reset and recording controls govern the sequence. VIS examples use at least 100 simulation seconds for readability. The main sidebar and existing video recorder show synchronized explanatory captions. The previous physical-ai.html URL redirects to the main demo. No separate mode selector remains.

## Contact ultrasonic spot weld reference model
The PDF specifies UT/NDT and probe tracking, without a vendor model. Replaced the bare stylus with a matrix contact head, compliant guide/yoke, flexible face, hose and signal cable, couplant reservoir, reference coupon and analysis terminal. H2515 is retained. Tool length compensation places the membrane at the surface during coupling/acquisition. Fixed robot base replaces the moving base. Illustrative weld sites are placed on visible specimen surfaces and explicitly labeled as examples, not production weld maps. The displayed waveform is synthetic and carries no calibrated units or acceptance verdict. Other joint types require a separate qualified technique; this model does not claim all panels are spot welded.
References: https://scanmaster-irt.com/wp-content/uploads/2023/06/ScanMaster-UTX_18-06-23.pdf ; https://www.abb.com/global/en/areas/robotics/solutions/functional-modules/ultrasonic-spot-welding-quality-inspection

## Robot virtual cameras
Robot body/label selection and the camera selector enter a following virtual camera. Covers inspection/handling arms, ScanBox arms, patrol dog/drone and AMRs. Exit, Escape and overview return to orbit controls; reset rebinds AMR references. Selected robot body meshes are hidden only for rendering, preserving the carried product. Camera captions are recorded. These are synthesized viewpoints, not installed RGB/ultrasonic hardware video.

## Automatic problem and recovery demonstration
Door/hood surface inspection now highlights two existing physical recovery sequences: fixture misalignment and low-quality visual acquisition. The incident panel and robot camera status show detection, decision, recovery and verification; floor marker identifies the affected vision booth. Completion is counted only after the verification interval ends. Event logging catches skipped UI frames at high playback speeds and avoids duplicates. Protective stops and process holds suspend recovery. This is a scripted demonstration, not live AI inference or an emergency safety controller.

