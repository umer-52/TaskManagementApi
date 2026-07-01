import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from '../email/email.service';
import { UsersRepository } from '../users/user.repository';
import { AuthService } from './auth.service';
import { PasswordResetTokenRepository } from './repositories/password-reset-token.repository';
import { TokensRepository } from './repositories/tokens.repository';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let usersRepository: {
    findById: jest.Mock;
    updatePassword: jest.Mock;
  };
  let passwordResetTokenRepository: {
    findValidByTokenHash: jest.Mock;
    markAsUsed: jest.Mock;
    invalidateActiveTokensForUser: jest.Mock;
  };

  beforeEach(async () => {
    usersRepository = {
      findById: jest.fn(),
      updatePassword: jest.fn(),
    };
    passwordResetTokenRepository = {
      findValidByTokenHash: jest.fn(),
      markAsUsed: jest.fn(),
      invalidateActiveTokensForUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersRepository, useValue: usersRepository },
        { provide: TokensRepository, useValue: {} },
        { provide: JwtService, useValue: {} },
        { provide: ConfigService, useValue: {} },
        { provide: EmailService, useValue: {} },
        {
          provide: PasswordResetTokenRepository,
          useValue: passwordResetTokenRepository,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('rejects resetting to the current password', async () => {
    const currentPassword = 'current-password';
    const passwordHash = await bcrypt.hash(currentPassword, 10);

    passwordResetTokenRepository.findValidByTokenHash.mockResolvedValue({
      password_reset_token_id: 1,
      user_id: 7,
    });
    usersRepository.findById.mockResolvedValue({
      user_id: 7,
      password_hash: passwordHash,
    });

    await expect(
      service.resetPassword('valid-token', currentPassword),
    ).rejects.toThrow('New password must be different from old password');
    expect(usersRepository.updatePassword).not.toHaveBeenCalled();
  });
});
