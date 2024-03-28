import { AuthGuard } from '@nestjs/passport';
import { ACCESS_TOKEN_STRATEGY_ALIAS } from 'src/auth/strategies';

export class AccessTokenGuard extends AuthGuard(ACCESS_TOKEN_STRATEGY_ALIAS) {
  constructor() {
    super();
  }
}
