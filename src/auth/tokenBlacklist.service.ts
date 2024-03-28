import { Cache } from '@nestjs/cache-manager';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TokenBlacklistService {
  private accessTokenExpirationTime: number;
  private currentTokenKeyAlias = 'current:';
  private blacklistedTokenKeyAlias = 'blacklisted:';

  constructor(
    private cache: Cache,
    private configService: ConfigService,
  ) {
    this.accessTokenExpirationTime = parseInt(
      this.configService.get('ACCESS_TOKEN_EXPIRATION_SECONDS'),
    );
  }

  addTokenAsCurrent(token: string) {
    return this.cache.set(
      this.getCurrentTokenKey(token),
      true,
      this.accessTokenExpirationTime + 10,
    );
  }

  addTokenToBlackList(token: string) {
    return this.cache.set(
      this.getBlacklistedTokenKey(token),
      true,
      this.accessTokenExpirationTime + 10,
    );
  }

  async isTokenCurrent(token) {
    const cachedValue = await this.cache.get(this.getCurrentTokenKey(token));

    return !!cachedValue;
  }

  async isTokenBlacklisted(token) {
    const cachedValue = await this.cache.get(
      this.getBlacklistedTokenKey(token),
    );

    return !!cachedValue;
  }

  getCurrentTokenKey(token: string): string {
    return this.currentTokenKeyAlias + token;
  }

  getBlacklistedTokenKey(token: string): string {
    return this.blacklistedTokenKeyAlias + token;
  }
}
