import {
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { EmailService } from '../email/email.service';
import { UsersRepository } from '../users/user.repository';
import { IUser } from '../users/interfaces/user.interface';
import { randomBytes, createHash } from 'crypto';

import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

import { JwtPayload } from './interfaces/jwt-payload.interface';
import { RefreshTokenPayload } from './interfaces/refresh-token-payload.interface';
import { PasswordResetTokenRepository } from './repositories/password-reset-token.repository';
import { TokensRepository } from './repositories/tokens.repository';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly tokensRepository: TokensRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly passwordResetTokenRepository: PasswordResetTokenRepository,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.usersRepository.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password_hash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = await this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user);

    return {
      accessToken,
      refreshToken,
      user: this.safeUser(user),
    };
  }

  async refresh(refreshTokenDto: RefreshTokenDto) {
    const oldRefreshToken = refreshTokenDto.RefreshToken;

    if (!oldRefreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    let payload: RefreshTokenPayload;

    try {
      payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
        oldRefreshToken,
        {
          secret: this.getRefreshSecret(),
        },
      );
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    const storedToken = await this.tokensRepository.findActiveByJti(
      payload.jti,
      'refresh',
    );

    if (!storedToken) {
      throw new UnauthorizedException('Refresh token revoked or expired');
    }

    const isTokenValid = await bcrypt.compare(
      oldRefreshToken,
      storedToken.token_hash,
    );

    if (!isTokenValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.usersRepository.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    await this.tokensRepository.revokeByJti(payload.jti, 'refresh');

    const newAccessToken = await this.generateAccessToken(user);
    const newRefreshToken = await this.generateRefreshToken(user);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: this.safeUser(user),
    };
  }

  async logout(refreshTokenDto: RefreshTokenDto) {
    const refreshToken = refreshTokenDto.RefreshToken;

    if (!refreshToken) {
      return {
        message: 'Logged out successfully',
      };
    }

    try {
      const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
        refreshToken,
        {
          secret: this.getRefreshSecret(),
        },
      );

      if (payload.type === 'refresh') {
        await this.tokensRepository.revokeByJti(payload.jti, 'refresh');
      }
    } catch {
      // Do not reveal token details.
    }

    return {
      message: 'Logged out successfully',
    };
  }

  private async generateAccessToken(user: IUser): Promise<string> {
    const userId = this.getUserId(user);
    const jti = randomUUID();

    const payload: JwtPayload = {
      sub: userId,
      email: user.email,
      full_name: user.full_name,
      jti,
      type: 'access',
    };

    const token = await this.jwtService.signAsync(payload, {
      secret: this.getAccessSecret(),
      expiresIn: this.getJwtExpiresIn('JWT_EXPIRES_IN', '1h'),
    });

    await this.storeToken({
      userId,
      tokenType: 'access',
      jti,
      token,
    });

    return token;
  }

  private async generateRefreshToken(user: IUser): Promise<string> {
    const userId = this.getUserId(user);
    const jti = randomUUID();

    const payload: RefreshTokenPayload = {
      sub: userId,
      jti,
      type: 'refresh',
    };

    const token = await this.jwtService.signAsync(payload, {
      secret: this.getRefreshSecret(),
      expiresIn: this.getJwtExpiresIn('JWT_REFRESH_EXPIRES_IN', '7d'),
    });

    await this.storeToken({
      userId,
      tokenType: 'refresh',
      jti,
      token,
    });

    return token;
  }

  private async storeToken(params: {
    userId: number;
    tokenType: 'access' | 'refresh' | 'password_reset';
    jti: string;
    token: string;
  }) {
    const tokenHash = await bcrypt.hash(params.token, 10);
    const expiresAt = this.getTokenExpiryDate(params.token);

    await this.tokensRepository.create({
      user_id: params.userId,
      token_type: params.tokenType,
      token_jti: params.jti,
      token_hash: tokenHash,
      expires_at: expiresAt,
    } as any);
  }

  private getTokenExpiryDate(token: string): Date {
    const decoded = this.jwtService.decode(token) as {
      exp?: number;
    } | null;

    if (!decoded?.exp) {
      throw new InternalServerErrorException(
        'Token expiry could not be decoded',
      );
    }

    return new Date(decoded.exp * 1000);
  }

  private getJwtExpiresIn(
    envKey: string,
    fallback: JwtSignOptions['expiresIn'],
  ): JwtSignOptions['expiresIn'] {
    return (this.configService.get<string>(envKey) ||
      fallback) as JwtSignOptions['expiresIn'];
  }

  private getAccessSecret(): string {
    const secret = this.configService.get<string>('JWT_SECRET');

    if (!secret) {
      throw new InternalServerErrorException('JWT_SECRET is not configured');
    }

    return secret;
  }

  private getRefreshSecret(): string {
    const secret = this.configService.get<string>('JWT_REFRESH_SECRET');

    if (!secret) {
      throw new InternalServerErrorException(
        'JWT_REFRESH_SECRET is not configured',
      );
    }

    return secret;
  }

  private getUserId(user: IUser): number {
    const userId = Number(user.user_id);

    if (!Number.isInteger(userId)) {
      throw new InternalServerErrorException('Invalid user id');
    }

    return userId;
  }

  private safeUser(user: IUser) {
    const { password_hash, ...safeUser } = user;
    return safeUser;
  }
  async exampleForgotPassword(email: string) {
    const resetToken = 'generated-reset-token-here';

    await this.emailService.sendPasswordResetEmail(email, resetToken);

    return {
      message: 'If this email exists, a reset link has been sent',
    };
  }

  async exampleLogin(user: { email: string; full_name: string }) {
    void this.emailService
      .sendNewLoginEmail(user.email, user.full_name)
      .catch((error) => {
        this.logger.warn(`Login email failed: ${error.message}`);
      });

    return {
      message: 'Login successful',
    };
  }

  async forgotPassword(email: string) {
    const user = await this.usersRepository.findByEmail(email);

    const response = {
      message: 'If this email exists, a password reset link has been sent',
    };

    const userId = user?.user_id;

    if (!user || typeof userId !== 'number') {
      return response;
    }

    await this.passwordResetTokenRepository.invalidateActiveTokensForUser(
      userId,
    );

    const rawToken = randomBytes(32).toString('hex');

    const tokenHash = this.hashResetToken(rawToken);

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.passwordResetTokenRepository.create(
      userId,
      tokenHash,
      expiresAt,
    );

    try {
      await this.emailService.sendPasswordResetEmail(user.email, rawToken);
      return response;
    } catch (error) {
      this.logger.error(
        `Password reset email failed for ${user.email}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new InternalServerErrorException(
        'Unable to send password reset email right now',
      );
    }
  }

  async resetPassword(token: string, password: string) {
    const tokenHash = this.hashResetToken(token);

    const passwordResetToken =
      await this.passwordResetTokenRepository.findValidByTokenHash(tokenHash);

    if (!passwordResetToken) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await this.usersRepository.updatePassword(
      passwordResetToken.user_id,
      passwordHash,
    );

    await this.passwordResetTokenRepository.markAsUsed(
      passwordResetToken.password_reset_token_id,
    );

    await this.passwordResetTokenRepository.invalidateActiveTokensForUser(
      passwordResetToken.user_id,
    );

    return {
      message: 'Password has been reset successfully',
    };
  }

  private hashResetToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
