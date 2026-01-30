using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using cognitionsecure.Api.Data;

var builder = WebApplication.CreateBuilder(args);

// Add Database Context - reads from multiple sources for Azure compatibility
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? Environment.GetEnvironmentVariable("CUSTOMCONNSTR_DefaultConnection")
    ?? Environment.GetEnvironmentVariable("POSTGRESQLCONNSTR_DefaultConnection")
    ?? Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection");

if (!string.IsNullOrEmpty(connectionString))
{
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseNpgsql(connectionString));
}
else
{
    // Fallback for local development
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseNpgsql("Host=localhost;Database=cognitionsecure_db;Username=postgres;Password=postgres"));
}

// Add HttpClient for SSO validation
builder.Services.AddHttpClient();

// Add JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"] ?? "cognition-cognitionsecure-secret-key-minimum-32-characters-long";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "cognitionsecure-api";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "cognitionsecure-app";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };
});

// Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { 
        Title = "Cognition Secure API", 
        Version = "v1",
        Description = "API for Cognition Secure - Powered by Cognition Suite"
    });
    
    // Add JWT authentication to Swagger
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme.",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    
    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// Configure CORS - reads from AllowedOrigins config, defaults to allow all if not set
var allowedOrigins = builder.Configuration.GetValue<string>("AllowedOrigins") ?? "*";

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        if (allowedOrigins == "*")
        {
            policy.AllowAnyOrigin()
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        }
        else
        {
            var originList = allowedOrigins.Split(',');
            var trimmedOrigins = new List<string>();
            foreach (var origin in originList)
            {
                var trimmed = origin.Trim();
                if (!string.IsNullOrEmpty(trimmed))
                {
                    trimmedOrigins.Add(trimmed);
                }
            }
            
            policy.WithOrigins(trimmedOrigins.ToArray())
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .WithExposedHeaders("Content-Disposition", "X-Total-Count")
                  .SetPreflightMaxAge(TimeSpan.FromMinutes(10))
                  .AllowCredentials();
        }
    });
});

var app = builder.Build();

// Run database migrations automatically
using (var scope = app.Services.CreateScope())
{
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        Console.WriteLine("[DB] Starting database migration...");
        var pendingMigrations = db.Database.GetPendingMigrations().ToList();
        Console.WriteLine($"[DB] Pending migrations: {pendingMigrations.Count}");
        
        db.Database.Migrate();
        
        Console.WriteLine("[DB] Database migration completed successfully!");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[DB] Migration failed: {ex.Message}");
        // Don't throw - allow app to start even if DB is not ready
        // This helps with initial deployment when DB might not be fully configured
    }
}

// CRITICAL: Handle OPTIONS preflight requests FIRST
app.Use(async (context, next) =>
{
    if (context.Request.Method == "OPTIONS")
    {
        var origin = context.Request.Headers["Origin"].ToString();
        if (!string.IsNullOrEmpty(origin))
        {
            context.Response.Headers["Access-Control-Allow-Origin"] = origin;
        }
        else
        {
            context.Response.Headers["Access-Control-Allow-Origin"] = "*";
        }
        context.Response.Headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, PATCH, OPTIONS";
        context.Response.Headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With, Accept";
        context.Response.Headers["Access-Control-Allow-Credentials"] = "true";
        context.Response.Headers["Access-Control-Max-Age"] = "600";
        context.Response.StatusCode = 204;
        return;
    }
    await next();
});

// CORS middleware
app.UseCors();

// Global exception handler
app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        context.Response.StatusCode = 500;
        context.Response.ContentType = "application/json";
        
        var error = context.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerFeature>();
        if (error != null)
        {
            var ex = error.Error;
            await context.Response.WriteAsJsonAsync(new
            {
                error = "Internal Server Error",
                message = ex.Message,
                type = ex.GetType().Name
            });
        }
    });
});

// Configure pipeline - Enable Swagger in all environments for debugging
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Cognition Secure API v1");
    c.RoutePrefix = "swagger";
});

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Health check endpoint
app.MapGet("/health", () => new { status = "healthy", app = "Cognition Secure", timestamp = DateTime.UtcNow });

// Diagnostic endpoint
app.MapGet("/diag", (IConfiguration config) => {
    var connStr = config.GetConnectionString("DefaultConnection");
    var customConnStr = Environment.GetEnvironmentVariable("CUSTOMCONNSTR_DefaultConnection");
    var pgConnStr = Environment.GetEnvironmentVariable("POSTGRESQLCONNSTR_DefaultConnection");
    var connStrEnv = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection");
    var effectiveConnStr = connStr ?? customConnStr ?? pgConnStr ?? connStrEnv;
    
    return new { 
        allowedOrigins = config.GetValue<string>("AllowedOrigins") ?? "not set",
        environment = app.Environment.EnvironmentName,
        hasConnectionString = !string.IsNullOrEmpty(effectiveConnStr),
        hasJwtKey = !string.IsNullOrEmpty(config["Jwt:Key"]),
        timestamp = DateTime.UtcNow
    };
});

// Welcome endpoint
app.MapGet("/", () => new { 
    message = "Welcome to Cognition Secure API",
    version = "1.0.0",
    documentation = "/swagger",
    description = "Cognition Secure - Powered by Cognition Suite"
});

app.Run();
