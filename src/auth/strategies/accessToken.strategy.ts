import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ACCESS_TOKEN_STRATEGY_ALIAS } from './consts';

type JwtPayload = {
  sub: string;
  email: string;
  iat: number;
  exp: number;
};

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(
  Strategy,
  ACCESS_TOKEN_STRATEGY_ALIAS,
) {
  constructor(private configService: ConfigService) {
    const secret = configService.get('ACCESS_TOKEN_SECRET');
    const strategyOptions = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    };

    super(strategyOptions);
  }

  validate(payload: JwtPayload) {
    return payload; // req.user = payload - under the hood
  }
}
