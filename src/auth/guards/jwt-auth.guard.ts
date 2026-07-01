import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { RequestWithUser } from '../interfaces/request-with-user.interface';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();

    if (!request.user) {
      throw new UnauthorizedException('Unauthorized');
    }

    return true;
  }
}
