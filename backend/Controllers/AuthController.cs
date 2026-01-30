using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using cognitionsecure.Api.Data;
using cognitionsecure.Api.DTOs;
using cognitionsecure.Api.Models;

namespace cognitionsecure.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        AppDbContext context, 
        IConfiguration configuration, 
        ILogger<AuthController> logger)
    {
        _context = context;
        _configuration = configuration;
        _logger = logger;
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
    {
        try
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == request.Email && u.IsActive);

            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                return Unauthorized(new { message = "Invalid email or password" });
            }

            var token = GenerateJwtToken(user);
            return Ok(new AuthResponse
            {
                Token = token,
                Email = user.Email,
                Username = user.Username,
                FirstName = user.FirstName,
                LastName = user.LastName,
                ExpiresAt = DateTime.UtcNow.AddHours(24)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login for {Email}", request.Email);
            return StatusCode(500, new { message = "Error during login", error = ex.Message });
        }
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest request)
    {
        try
        {
            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
            {
                return BadRequest(new { message = "Email already exists" });
            }

            if (await _context.Users.AnyAsync(u => u.Username == request.Username))
            {
                return BadRequest(new { message = "Username already exists" });
            }

            var user = new User
            {
                Username = request.Username,
                Email = request.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                FirstName = request.FirstName,
                LastName = request.LastName
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var token = GenerateJwtToken(user);
            return CreatedAtAction(nameof(Login), new AuthResponse
            {
                Token = token,
                Email = user.Email,
                Username = user.Username,
                FirstName = user.FirstName,
                LastName = user.LastName,
                ExpiresAt = DateTime.UtcNow.AddHours(24)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during registration for {Email}", request.Email);
            return StatusCode(500, new { message = "Error during registration", error = ex.Message });
        }
    }

    [HttpPost("sso")]
    public async Task<ActionResult<AuthResponse>> Sso([FromBody] SsoRequest request)
    {
        try
        {
            _logger.LogInformation("SSO attempt with token length: {TokenLength}", request.SuiteToken?.Length ?? 0);

            if (string.IsNullOrEmpty(request.SuiteToken))
            {
                return BadRequest(new { message = "Suite token is required" });
            }

            // Validate Suite JWT token directly
            var principal = ValidateSuiteToken(request.SuiteToken);
            
            if (principal == null)
            {
                _logger.LogWarning("Suite token validation failed");
                return Unauthorized(new { message = "Invalid or expired Suite token" });
            }

            // Extract user info from token claims
            var email = principal.FindFirst(JwtRegisteredClaimNames.Email)?.Value 
                       ?? principal.FindFirst(ClaimTypes.Email)?.Value;
            var name = principal.FindFirst(JwtRegisteredClaimNames.Name)?.Value 
                      ?? principal.FindFirst(ClaimTypes.Name)?.Value;

            if (string.IsNullOrEmpty(email))
            {
                _logger.LogWarning("Suite token missing email claim");
                return Unauthorized(new { message = "Invalid token: missing email" });
            }

            _logger.LogInformation("SSO validated for user: {Email}", email);

            // Find or create user
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower());
            
            if (user == null)
            {
                var nameParts = (name ?? email.Split('@')[0]).Split(' ', 2);
                user = new User
                {
                    Username = email.Split('@')[0],
                    Email = email.ToLower(),
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString()),
                    FirstName = nameParts[0],
                    LastName = nameParts.Length > 1 ? nameParts[1] : ""
                };
                _context.Users.Add(user);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Created new user via SSO: {Email}", user.Email);
            }
            else
            {
                // Update user info from Suite
                if (!string.IsNullOrEmpty(name))
                {
                    var nameParts = name.Split(' ', 2);
                    user.FirstName = nameParts[0];
                    user.LastName = nameParts.Length > 1 ? nameParts[1] : user.LastName;
                }
                user.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }

            var token = GenerateJwtToken(user);
            return Ok(new AuthResponse
            {
                Token = token,
                Email = user.Email,
                Username = user.Username,
                FirstName = user.FirstName,
                LastName = user.LastName,
                ExpiresAt = DateTime.UtcNow.AddHours(24)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during SSO authentication");
            return StatusCode(500, new { 
                message = "Error during SSO authentication", 
                error = ex.Message,
                type = ex.GetType().Name,
                inner = ex.InnerException?.Message
            });
        }
    }

    private ClaimsPrincipal? ValidateSuiteToken(string token)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        
        // Suite JWT configuration - same as Cognition Suite
        var suiteSecretKey = _configuration["Jwt:Suite:SecretKey"] 
            ?? "CognitionSuiteSecretKey2024!@#$%^&*()_+SuperSecure";
        var suiteIssuer = _configuration["Jwt:Suite:Issuer"] ?? "CognitionSuite";
        var suiteAudience = _configuration["Jwt:Suite:Audience"] ?? "CognitionSuiteApp";

        var key = Encoding.UTF8.GetBytes(suiteSecretKey);

        try
        {
            var principal = tokenHandler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = true,
                ValidIssuer = suiteIssuer,
                ValidateAudience = true,
                ValidAudience = suiteAudience,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.FromMinutes(5)
            }, out _);

            return principal;
        }
        catch (Exception ex)
        {
            _logger.LogWarning("Error validating Suite token: {Error}", ex.Message);
            return null;
        }
    }

    private string GenerateJwtToken(User user)
    {
        var key = _configuration["Jwt:Key"] ?? "cognition-cognitionsecure-secret-key-minimum-32-characters-long";
        var issuer = _configuration["Jwt:Issuer"] ?? "cognitionsecure-api";
        var audience = _configuration["Jwt:Audience"] ?? "cognitionsecure-app";

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim("firstName", user.FirstName ?? ""),
            new Claim("lastName", user.LastName ?? "")
        };

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(24),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
