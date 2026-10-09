# FPTU-Xperience Frontend

## Context triển khai hiện tại

- [Lịch học theo tuần và calendar do Admin cấu hình](docs/study-schedule-implementation-context.md): quyết định sản phẩm, trạng thái mock, contract BE và checklist tích hợp. Đọc cùng [API contract](docs/contracts/study-schedule-api.md) trước khi nối BE; không xem `localStorage` là nguồn dữ liệu production.

## Cấu trúc

```
frontend/
├── src/
│   ├── components/     # React components
│   ├── pages/          # Page components
│   ├── services/       # API services
│   ├── hooks/          # Custom hooks
│   ├── contexts/        # React contexts
│   └── utils/          # Utilities
├── dist/               # Build output
├── Dockerfile
└── package.json
```

## Chạy Local

```bash
cd frontend
npm install
npm run dev
```

## API Base URL

Set qua biến môi trường `VITE_API_BASE_URL`:

- Local: `http://localhost:7000`
- Docker: `http://api-gateway:8080`

## Build Docker

```bash
cd frontend
docker build -t clubreport-frontend .
docker run -p 3000:80 clubreport-frontend
```

The [backend API implementation handoff](docs/contracts/backend-api-implementation-handoff.md) is the entry point for pending frontend API work, with the [2026-10-09 debt register](docs/contracts/frontend-api-debt-register.md), source evidence and dependency-ordered contract tasks.
