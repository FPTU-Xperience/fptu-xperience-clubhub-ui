# ClubReportHub Frontend

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
