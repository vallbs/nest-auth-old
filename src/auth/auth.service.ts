import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto } from './dto/auth.dto';
import { Tokens } from './types';
import { TokenBlacklistService } from './tokenBlacklist.service';

@Injectable()
export class AuthService {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly accessTokenExpiration: number;
  private readonly refreshTokenExpiration: number;

  constructor(
    private prisma: PrismaService,
    private jwtServise: JwtService,
    private configService: ConfigService,
    private tokenBlacklistService: TokenBlacklistService,
  ) {
    this.accessTokenSecret = this.configService.get<string>(
      'ACCESS_TOKEN_SECRET',
    );
    this.refreshTokenSecret = this.configService.get<string>(
      'REFRESH_TOKEN_SECRET',
    );
    this.accessTokenExpiration = parseInt(
      this.configService.get('ACCESS_TOKEN_EXPIRATION_SECONDS'),
    );
    this.refreshTokenExpiration = parseInt(
      this.configService.get('REFRESH_TOKEN_EXPIRATION_SECONDS'),
    );
  }

  async signupLocal(dto: AuthDto): Promise<Tokens> {
    const hash = await this.hashData(dto.password);

    const newUser = await this.prisma.user.create({
      data: {
        email: dto.email,
        hash,
      },
    });

    const tokens = await this.getTokens(newUser.id, newUser.email);
    await this.updateRefreshTokenHash(newUser.id, tokens.refreshToken);

    return tokens;
  }

  async signinLocal(user: AuthDto): Promise<Tokens | { message: string }> {
    const existingUser = await this.prisma.user.findUnique({
      where: {
        email: user.email,
      },
    });

    if (!existingUser) {
      throw new ForbiddenException(
        `User with the email ${user.email} not found`,
      );
    }

    const doPasswordsMatch = await bcrypt.compare(
      user.password,
      existingUser.hash,
    );

    if (!doPasswordsMatch) {
      throw new ForbiddenException(`Entered password is incorrect`);
    }

    const tokens = await this.getTokens(existingUser.id, existingUser.email);
    await this.updateRefreshTokenHash(existingUser.id, tokens.refreshToken);

    return tokens;
  }

  async signout(userId: number) {
    const findExixsitngUserPromise = this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    const updateRefreshTokenPromise = this.prisma.user.updateMany({
      where: {
        id: userId,
        hashedRefreshToken: { not: null },
      },
      data: {
        hashedRefreshToken: null,
      },
    });
    const [exsistingUser, result] = await Promise.all([
      findExixsitngUserPromise,
      updateRefreshTokenPromise,
    ]);

    if (result?.count === 1) {
      return { message: `User successfully logged out.` };
    }

    if (result?.count === 0 && exsistingUser) {
      throw new BadRequestException(`User is already logged out`);
    }

    throw new Error('Error during user log out');
  }

  async refreshTokens(userId: number, refreshToken: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser || !existingUser.hashedRefreshToken)
      throw new ForbiddenException('Access Denied');

    const tokenMatches = await bcrypt.compare(
      refreshToken,
      existingUser.hashedRefreshToken,
    );

    if (!tokenMatches) throw new ForbiddenException('Access Denied');

    const tokens = await this.getTokens(existingUser.id, existingUser.email);
    await this.updateRefreshTokenHash(existingUser.id, tokens.refreshToken);

    return tokens;
  }

  hashData(data: string) {
    return bcrypt.hash(data, 10);
  }

  // getTokensExpirations() {
  //   const accessTokenExpiration = parseInt(
  //     this.configService.get('ACCESS_TOKEN_EXPIRATION_SECONDS'),
  //   );
  //   const refreshTokenExpiration = parseInt(
  //     this.configService.get('REFRESH_TOKEN_EXPIRATION_SECONDS'),
  //   );

  //   return {
  //     accessTokenExpiration,
  //     refreshTokenExpiration,
  //   };
  // }

  async getTokens(userId: number, email: string) {
    // const { accessTokenExpiration, refreshTokenExpiration } =
    //   this.getTokensExpirations();
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtServise.signAsync(
        {
          sub: userId,
          email,
        },
        {
          secret: this.accessTokenSecret,
          expiresIn: this.accessTokenExpiration,
        },
      ),
      this.jwtServise.signAsync(
        {
          sub: userId,
          email,
        },
        {
          secret: this.refreshTokenSecret,
          expiresIn: this.refreshTokenExpiration,
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  async updateRefreshTokenHash(userId: number, refreshToken: string) {
    const hashedRefreshToken = await this.hashData(refreshToken);

    await this.prisma.user.update({
      where: { id: userId },
      data: { hashedRefreshToken },
    });
  }
}
