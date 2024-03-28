import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  GetCurrentUserId,
  GetCurrentUserRefreshToken,
} from './common/decorators';
import { AccessTokenGuard, RefreshTokenGuard } from './common/guards';
import { AuthDto } from './dto/auth.dto';
import { Tokens } from './types';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/local/signup')
  @HttpCode(HttpStatus.CREATED)
  signupLocal(@Body() dto: AuthDto): Promise<Tokens> {
    return this.authService.signupLocal(dto);
  }

  @Post('/local/signin')
  @HttpCode(HttpStatus.OK)
  signinLocal(
    @Body() dto: AuthDto,
    @Req() req: any,
  ): Promise<Tokens | { message: string }> {
    console.log('req', req.headers);
    console.log('req', req.connection);
    return this.authService.signinLocal(dto);
  }

  @UseGuards(AccessTokenGuard)
  @Post('/signout')
  @HttpCode(HttpStatus.OK)
  signout(@GetCurrentUserId() userId: number) {
    return this.authService.signout(userId);
  }

  @UseGuards(RefreshTokenGuard)
  @Post('/refresh-token')
  @HttpCode(HttpStatus.OK)
  refreshTokens(
    @GetCurrentUserId() userId: number,
    @GetCurrentUserRefreshToken() refreshToken: string,
  ) {
    return this.authService.refreshTokens(userId, refreshToken);
  }
}
