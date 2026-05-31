import crypto from 'crypto';
import { BaseService, prisma, Prisma, RefreshToken } from '@aaft/db-lib';

/**
 * RefreshTokenService — persistence for issued refresh tokens.
 *
 * We store a SHA-256 hash of the JWT id ("jti") so that an attacker who reads
 * the database cannot directly forge a refresh token. Revoking a token = setting
 * `revokedAt`. Expired or revoked rows are rejected during refresh.
 */
export class RefreshTokenService extends BaseService<
  RefreshToken,
  Prisma.RefreshTokenCreateInput,
  Prisma.RefreshTokenUpdateInput,
  Prisma.RefreshTokenWhereUniqueInput,
  Prisma.RefreshTokenWhereInput,
  Prisma.RefreshTokenOrderByWithRelationInput,
  Prisma.RefreshTokenInclude
> {
  protected get model() {
    return prisma.refreshToken;
  }
  protected get entityName(): string {
    return 'RefreshToken';
  }

  static hashJti(jti: string): string {
    return crypto.createHash('sha256').update(jti).digest('hex');
  }

  issue(params: { userId: string; jti: string; expiresAt: Date }): Promise<RefreshToken> {
    return prisma.refreshToken.create({
      data: {
        userId: params.userId,
        tokenHash: RefreshTokenService.hashJti(params.jti),
        expiresAt: params.expiresAt,
      },
    });
  }

  findActiveByJti(jti: string): Promise<RefreshToken | null> {
    return prisma.refreshToken.findFirst({
      where: {
        tokenHash: RefreshTokenService.hashJti(jti),
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
  }

  revokeByJti(jti: string): Promise<Prisma.BatchPayload> {
    return prisma.refreshToken.updateMany({
      where: { tokenHash: RefreshTokenService.hashJti(jti), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  revokeAllForUser(userId: string): Promise<Prisma.BatchPayload> {
    return prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
