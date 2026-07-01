import { Controller, UseInterceptors } from '@nestjs/common';
import { Body, Get, Post, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { RequestWithUser } from './interfaces/request-with-user.interface';
import { HttpCode } from '@nestjs/common';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
  @Post('refresh')
  @HttpCode(200)
  async refresh(@Body() refreshtokenDto: RefreshTokenDto) {
    return this.authService.refresh(refreshtokenDto);
  }

  @Post('logout')
  @HttpCode(200)
  async logout(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.logout(refreshTokenDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: RequestWithUser) {
    return req.user;
  }
  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }
  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );
  }
}
