import { Injectable, NestMiddleware } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { NextFunction, Response } from 'express';

import * as bcrypt from 'bcrypt';

import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { RequestWithUser } from '../interfaces/request-with-user.interface';
import { TokensRepository } from '../repositories/tokens.repository';

@Injectable()
export class AttachUserMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly tokensRepository: TokensRepository,
  ) {}

  async use(req: RequestWithUser, res: Response, next: NextFunction) {
    const authorization = req.headers['authorization'];

    if (!authorization) {
      return res.status(401).json({
        statusCode: 401,
        message: 'Authorization header missing',
        error: 'Unauthorized',
      });
    }

    const [type, token] = authorization.split(' ');

    if (type !== 'Bearer' || !token) {
      return res.status(401).json({
        statusCode: 401,
        message: 'Invalid authorization format',
        error: 'Unauthorized',
      });
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: process.env.JWT_SECRET,
      });

      if (payload.type !== 'access') {
        return res.status(401).json({
          statusCode: 401,
          message: 'Invalid token type',
          error: 'Unauthorized',
        });
      }

      const storedToken = await this.tokensRepository.findActiveByJti(
        payload.jti!,
        'access',
      );

      if (!storedToken) {
        return res.status(401).json({
          statusCode: 401,
          message: 'Access token revoked or expired',
          error: 'Unauthorized',
        });
      }

      const isTokenValid = await bcrypt.compare(token, storedToken.token_hash);

      if (!isTokenValid) {
        return res.status(401).json({
          statusCode: 401,
          message: 'Invalid access token',
          error: 'Unauthorized',
        });
      }

      req.user = payload;

      return next();
    } catch {
      return res.status(401).json({
        statusCode: 401,
        message: 'Invalid or expired access token',
        error: 'Unauthorized',
      });
    }
  }
}
