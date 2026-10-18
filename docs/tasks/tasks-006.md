# tasks-006: GCP 배포 (VM + Terraform)

## 목표

로컬에서 쓰던 docker compose 구성을 GCP Compute Engine VM 한 대에 올리고 DB는 Cloud SQL을 써서, 휴대폰으로 HTTPS 주소에 접속해 로그인·콘서트·로그 기능을 쓸 수 있게 한다. 인프라는 Terraform으로 관리한다.

## 범위

- 포함: Terraform 인프라(VM, 고정 IP, 방화벽, 비밀값, 이미지 저장소, 백업), 운영용 compose, HTTPS 리버스 프록시, 배포 스크립트, 배포에 필요한 최소 앱 수정
- 제외: 커스텀 도메인(서비스 이름 확정 후), CI/CD 자동 배포, 모니터링 대시보드, 스테이징 환경, 여러 대로 늘리기

## 체크리스트

### 0. 결정

- [x] GCP 프로젝트: `festivalwith`, 리전 서울 `asia-northeast3`
- [x] 실행: Compute Engine VM 1대(e2-small, 메모리 2GB)에서 docker compose
- [x] DB: Cloud SQL MySQL 8.4 최소 사양(db-f1-micro). VM 안의 Cloud SQL Auth Proxy로만 접속(외부 허용 목록 없음). 자동 백업 매일·7개 보관
- [x] OS: Ubuntu LTS. 보안 업데이트는 자동(unattended-upgrades)
- [x] 구성: Caddy(HTTPS, 리버스 프록시) + 프론트 + 백엔드 + Cloud SQL Auth Proxy, 영상은 VM 디스크의 Docker 볼륨
- [x] 주소: 도메인 없이 고정 IP 기반 `<IP>.nip.io`. Caddy가 HTTPS 인증서 자동 발급
- [x] 경로: Caddy가 `/api/*`, `/oauth2/*`, `/login/oauth2/*`는 백엔드로, 나머지는 프론트로 → 브라우저는 주소 하나만 사용(로그인 쿠키 문제 해결)
- [x] 방화벽: 80·443만 외부에 열고, SSH는 IAP 터널로만. 백엔드(8080)·프론트(3000)·프록시(3306)는 외부에 열지 않음
- [x] 비밀값: Secret Manager에 저장, VM이 켜질 때 받아서 `.env` 생성
- [x] 이미지: Cloud Build로 빌드(amd64) → Artifact Registry → VM이 받아서 실행
- [x] 백업: DB는 Cloud SQL 자동 백업, 영상은 VM 디스크 스냅샷 매일·7일 보관
- [x] Terraform 상태 파일: GCS 버킷, 코드 위치 저장소 루트 `infra/`
- [x] 예산 알림: 월 5만 원 (예상 약 4만 원: VM 약 $16 + Cloud SQL 약 $12 + 기타)

### 1. 앱 수정

- [x] 백엔드: 프록시 뒤에서 원래 주소(https, 접속 호스트)를 알도록 forwarded 헤더 처리 → 카카오 Redirect URI·세션 쿠키 Secure가 자동으로 맞춰짐
- [x] 프론트: 카카오 로그인 링크를 운영에서는 같은 주소(`/oauth2/authorization/kakao`)로. 로컬 개발은 지금처럼 백엔드 주소
- [x] 운영용 compose(`compose.prod.yaml`): 빌드 대신 Artifact Registry 이미지, Caddy·Cloud SQL Auth Proxy 추가, 내부 포트 비공개
- [x] Caddyfile

### 2. 인프라 (Terraform)

- [x] 상태 파일용 GCS 버킷, provider 설정
- [x] 필요한 GCP API 켜기
- [x] 고정 외부 IP
- [x] 방화벽 규칙 (80·443, IAP SSH)
- [x] Artifact Registry 저장소
- [x] Secret Manager 비밀값 (KOPIS, 카카오 로그인 키·시크릿, 카카오맵 키, DB 비밀번호)
- [x] Cloud SQL 인스턴스, DB, 사용자
- [x] VM 서비스 계정과 권한 (이미지 받기, 비밀값 읽기, Cloud SQL 접속)
- [x] VM (디스크, 시작 스크립트: Docker 설치 → 비밀값으로 `.env` → compose 실행)
- [x] 디스크 스냅샷 일정
- [x] 예산 알림

### 3. 배포

- [x] 배포 스크립트: Cloud Build로 이미지 빌드·푸시 → IAP SSH로 VM에서 `docker compose pull && up -d`
- [x] 카카오 콘솔: Redirect URI `https://34-64-181-32.nip.io/login/oauth2/code/kakao`, JavaScript SDK 도메인 `https://34-64-181-32.nip.io` 추가
- [x] 첫 배포 후 KOPIS 동기화가 GCP에서도 되는지 확인 → 1296건 동기화 완료

### 4. 완료 기준

- [x] 휴대폰으로 `https://34-64-181-32.nip.io`에 접속해 콘서트 목록·지도·상세가 보인다
- [x] 카카오 로그인 → 시작 설정 → 목록이 이어진다
- [x] 휴대폰에서 앱 안 카메라로 로그를 남기고 재생된다
- [x] VM을 재시작해도 데이터(DB, 영상)와 로그인이 유지된다
- [x] 외부에서 3306·8080·3000·22 포트에 접속되지 않는다
- [x] `terraform destroy`로 전부 지울 수 있다
