# 기술 스펙

## 플랫폼

웹

## 기술 스택

- 백엔드: Kotlin, Spring Boot, MySQL. API만 제공
- 프론트엔드: Next.js (TypeScript)

## 저장소 구조

```
ycc/
├── backend/    # Spring Boot
├── frontend/   # Next.js
├── compose.yaml
└── docs/
    ├── product/  # 기획서
    ├── spec/     # 기술 스펙
    └── tasks/    # 작업 계획
```

## 로컬 실행

```
docker compose up -d --build
```

- 프론트: http://localhost:3000
- 백엔드: http://localhost:8080
- MySQL: localhost:3306 (root / root, DB `ycc`)
