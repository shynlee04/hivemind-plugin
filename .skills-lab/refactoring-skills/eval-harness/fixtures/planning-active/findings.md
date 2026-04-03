# Findings

## Research Results
- Current auth uses JWT with 15min expiry
- Need to add refresh token rotation

## Key Decisions
- Use HS256 for signing
- Store refresh tokens in Redis
