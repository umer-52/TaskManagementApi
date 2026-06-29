import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasswordResetTokenRepository } from './repositories/password-reset-token.repository';
import { MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { EmailModule } from 'src/email/email.module';

import { JwtModule, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { UsersModule } from '../users/users.module';
import { TokensRepository } from './repositories/tokens.repository';
import { AttachUserMiddleware } from './middleware/attach-user.middleware';

@Module({
  imports: [
    UsersModule,
    DatabaseModule,
    EmailModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const expiresIn =
          (configService.get<string>(
            'JWT_EXPIRES_IN',
          ) as JwtSignOptions['expiresIn']) || '1h';

        return {
          secret: configService.get<string>('JWT_SECRET'),
          signOptions: {
            expiresIn,
          },
        };
      },
    }),
  ],

  controllers: [AuthController],
  providers: [
    AuthService,
    TokensRepository,
    PasswordResetTokenRepository,
    AttachUserMiddleware,
  ],
  exports: [TokensRepository],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AttachUserMiddleware).forRoutes(
      {
        path: 'auth/me',
        method: RequestMethod.GET,
      },
      {
        path: 'users',
        method: RequestMethod.GET,
      },
      {
        path: 'users/:id',
        method: RequestMethod.GET,
      },
    );
  }
}
