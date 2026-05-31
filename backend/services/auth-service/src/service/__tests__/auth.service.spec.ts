import { hashPassword, UnauthorizedException, ConflictException } from '@aaft/common-lib';
import type { User } from '@aaft/db-lib';
import { UserRole } from '@aaft/db-lib';
import { AuthService } from '../auth.service';

/**
 * AuthService unit tests.
 *
 * The service takes its two repositories via constructor injection so we don't
 * need to mock the `@aaft/db-lib` module here — just hand it stub repositories
 * that record what they were called with and return what we tell them to.
 */
describe('AuthService', () => {
  const futureUser = (overrides: Partial<User> = {}): User =>
    ({
      id: 'u-1',
      email: 'admin@aaft.com',
      passwordHash: 'will-be-set',
      name: 'Avery Admin',
      avatar: null,
      role: UserRole.admin,
      isActive: true,
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
      ...overrides,
    }) as User;

  let users: any;
  let tokens: any;
  let service: AuthService;

  beforeEach(() => {
    users = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
    };
    tokens = {
      issue: jest.fn().mockResolvedValue({}),
      findActiveByJti: jest.fn(),
      revokeByJti: jest.fn().mockResolvedValue({ count: 1 }),
    };
    service = new AuthService(users, tokens);
  });

  describe('login', () => {
    it('rejects unknown email with 401 Invalid credentials', async () => {
      users.findByEmail.mockResolvedValue(null);
      await expect(service.login('nope@aaft.com', 'whatever')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rejects an inactive user (soft-deleted)', async () => {
      const hash = await hashPassword('Admin@123');
      users.findByEmail.mockResolvedValue(futureUser({ isActive: false, passwordHash: hash }));
      await expect(service.login('admin@aaft.com', 'Admin@123')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rejects a wrong password', async () => {
      const hash = await hashPassword('Admin@123');
      users.findByEmail.mockResolvedValue(futureUser({ passwordHash: hash }));
      await expect(service.login('admin@aaft.com', 'wrong')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('returns { token, user } on successful login + persists a refresh token row', async () => {
      const hash = await hashPassword('Admin@123');
      users.findByEmail.mockResolvedValue(futureUser({ passwordHash: hash }));

      const result = await service.login('admin@aaft.com', 'Admin@123');

      expect(result.token).toEqual(expect.any(String));
      expect(result.token.split('.').length).toBe(3); // header.payload.signature
      expect(result.user.email).toBe('admin@aaft.com');
      expect(result.user.role).toBe('admin');
      // Instructor / admin mapped to 'admin' for the Part A frontend; never expose the hash.
      expect((result.user as unknown as { passwordHash?: string }).passwordHash).toBeUndefined();
      expect(tokens.issue).toHaveBeenCalledTimes(1);
    });

    it('maps internal `student` role straight through; non-student → admin (Part A bridge)', async () => {
      const hash = await hashPassword('Student@123');
      users.findByEmail.mockResolvedValue(
        futureUser({ email: 'student@aaft.com', role: UserRole.student, passwordHash: hash }),
      );

      const result = await service.login('student@aaft.com', 'Student@123');
      expect(result.user.role).toBe('student');
    });
  });

  describe('register', () => {
    it('rejects duplicate email with 409', async () => {
      users.findByEmail.mockResolvedValue(futureUser());
      await expect(
        service.register({ email: 'admin@aaft.com', password: 'Admin@123', name: 'x' }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(users.create).not.toHaveBeenCalled();
    });

    it('hashes the password before passing it to the repository', async () => {
      users.findByEmail.mockResolvedValue(null);
      users.create.mockResolvedValue(futureUser({ email: 'new@aaft.com', name: 'Newbie' }));

      await service.register({ email: 'new@aaft.com', password: 'StrongPwd1', name: 'Newbie' });

      expect(users.create).toHaveBeenCalledTimes(1);
      const passedData = users.create.mock.calls[0][0];
      expect(passedData.passwordHash).not.toBe('StrongPwd1');
      expect(passedData.passwordHash).toMatch(/^\$2[aby]\$\d{2}\$/); // bcrypt prefix
      expect(passedData.email).toBe('new@aaft.com');
    });
  });

  describe('logout', () => {
    it('is idempotent — accepts a malformed token without throwing', async () => {
      await expect(service.logout('not-a-real-jwt')).resolves.toBeUndefined();
      expect(tokens.revokeByJti).not.toHaveBeenCalled();
    });
  });
});
