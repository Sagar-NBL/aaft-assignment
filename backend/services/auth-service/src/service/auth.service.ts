import { v4 as uuidv4 } from 'uuid';
import {
  comparePassword,
  hashPassword,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  generateAvatar,
  type UserDto,
  type AuthResponseDto,
} from '@aaft/common-lib';
import { User, UserRole } from '@aaft/db-lib';
import { UserAuthService } from './user-auth.service';
import { RefreshTokenService } from './refresh-token.service';

interface RegisterParams {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

interface IssueTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * AuthService — orchestrates authentication flows.
 *
 * Single Responsibility: handle login / register / refresh / logout. Persistence
 * is delegated to the two repositories (UserAuthService, RefreshTokenService),
 * cryptography to common-lib helpers. This service contains business rules only.
 */
export class AuthService {
  constructor(
    private readonly users: UserAuthService,
    private readonly tokens: RefreshTokenService,
  ) {}

  // -----------------------------------------------------------------
  // Login
  // -----------------------------------------------------------------

  async login(email: string, password: string): Promise<AuthResponseDto> {
    const user = await this.users.findByEmail(email);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const ok = await comparePassword(password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { accessToken } = await this.issueTokens(user);
    return {
      token: accessToken,
      user: this.toUserDto(user),
    };
  }

  // -----------------------------------------------------------------
  // Register
  // -----------------------------------------------------------------

  async register(params: RegisterParams): Promise<AuthResponseDto> {
    const email = params.email.toLowerCase();
    const existing = await this.users.findByEmail(email);
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await hashPassword(params.password);
    const created = await this.users.create({
      email,
      passwordHash,
      name: params.name,
      role: params.role ?? UserRole.student,
      avatar: generateAvatar(params.name),
    });

    const { accessToken } = await this.issueTokens(created);
    return {
      token: accessToken,
      user: this.toUserDto(created),
    };
  }

  // -----------------------------------------------------------------
  // Refresh
  // -----------------------------------------------------------------

  async refresh(refreshToken: string): Promise<{ token: string }> {
    const payload = verifyRefreshToken(refreshToken);
    const stored = await this.tokens.findActiveByJti(payload.jti);
    if (!stored) {
      throw new UnauthorizedException('Refresh token revoked or expired');
    }
    const user = await this.users.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User no longer active');
    }
    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });
    return { token: accessToken };
  }

  // -----------------------------------------------------------------
  // Logout
  // -----------------------------------------------------------------

  async logout(refreshToken: string): Promise<void> {
    // Best-effort: even if the token is malformed we ack 200 — logout is idempotent.
    try {
      const payload = verifyRefreshToken(refreshToken);
      await this.tokens.revokeByJti(payload.jti);
    } catch {
      /* swallow — logout never reveals token validity */
    }
  }

  // -----------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------

  /**
   * Issue both tokens and persist the refresh token's jti.
   */
  private async issueTokens(user: User): Promise<IssueTokens> {
    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const jti = uuidv4();
    const refreshToken = signRefreshToken({ sub: user.id, jti });
    const expiresAt = this.computeRefreshExpiry();
    await this.tokens.issue({ userId: user.id, jti, expiresAt });

    return { accessToken, refreshToken };
  }

  private computeRefreshExpiry(): Date {
    const raw = process.env.JWT_REFRESH_EXPIRES ?? '7d';
    const match = raw.match(/^(\d+)([smhd])$/);
    if (!match) {
      // default 7 days
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }
    const n = parseInt(match[1], 10);
    const unit = match[2];
    const ms =
      unit === 's' ? n * 1000 :
      unit === 'm' ? n * 60 * 1000 :
      unit === 'h' ? n * 60 * 60 * 1000 :
      n * 24 * 60 * 60 * 1000;
    return new Date(Date.now() + ms);
  }

  /** Strip sensitive fields and shape the User for client consumption. */
  private toUserDto(user: User): UserDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      // Part A frontend only knows admin/student. Map instructor → admin for UI.
      role: user.role === UserRole.student ? 'student' : 'admin',
      avatar: user.avatar ?? generateAvatar(user.name),
    };
  }

  async findUserById(id: string): Promise<User> {
    const user = await this.users.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
