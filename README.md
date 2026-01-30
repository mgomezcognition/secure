# Cognition Secure

This application was created by [Cognition Cloud](https://cognition.cloud) App Factory.

## Project Structure

```
Cognition Secure/
├── frontend/          # React + TypeScript + Vite
│   ├── src/
│   │   ├── App.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   └── main.tsx
│   └── package.json
├── backend/           # .NET 9 Web API
│   ├── Program.cs
│   ├── Controllers/
│   │   └── AuthController.cs
│   ├── Data/
│   │   └── AppDbContext.cs
│   ├── Models/
│   │   └── User.cs
│   ├── DTOs/
│   │   └── AuthDtos.cs
│   └── Cognition Secure.Api.csproj
└── README.md
```

## Getting Started

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
dotnet restore
dotnet ef migrations add InitialCreate
dotnet ef database update
dotnet run
```

## Environment Variables

### Frontend
- `VITE_API_URL`: URL of the backend API
- `VITE_SUITE_URL`: URL of Cognition Suite for SSO

### Backend (Azure App Settings)

The following settings must be configured in Azure App Service:

| Setting | Description | Example |
|---------|-------------|---------|
| `ASPNETCORE_ENVIRONMENT` | Runtime environment | `Production` |
| `AllowedOrigins` | CORS allowed origins | `https://secure.cognition.com.ar` |
| `Jwt__Key` | JWT signing key (min 32 chars) | `your-secret-key-here-32-chars-min` |
| `Jwt__Issuer` | JWT issuer | `cognitionsecure-api` |
| `Jwt__Audience` | JWT audience | `cognitionsecure-app` |
| `ConnectionStrings__DefaultConnection` | PostgreSQL connection | `Host=...;Database=...;` |

> **Important:** Azure reads connection strings from multiple sources. Add `ConnectionStrings__DefaultConnection` as an **Application Setting** (not just a Connection String) to ensure compatibility.

## Database Migrations

To create and apply migrations:

```bash
cd backend
dotnet ef migrations add InitialCreate
dotnet ef database update
```

For production databases, run:
```bash
dotnet ef database update --connection "Your-Production-Connection-String"
```

## Authentication

This app supports:
- **Local authentication**: Email/password registration and login
- **SSO via Cognition Suite**: Automatic login when redirected from Suite

## Deployment

This project is automatically deployed by Cognition Cloud when changes are pushed to the main branch.

- **Frontend URL:** https://secure.cognition.com.ar
- **API URL:** https://api.secure.cognition.com.ar

## API Endpoints

### Health & Diagnostics
- `GET /health` - Health check endpoint
- `GET /diag` - Diagnostic information (config status)
- `GET /swagger` - API documentation

### Authentication
- `POST /api/auth/login` - Local login
- `POST /api/auth/register` - User registration
- `POST /api/auth/sso` - SSO login from Cognition Suite

## License

MIT
