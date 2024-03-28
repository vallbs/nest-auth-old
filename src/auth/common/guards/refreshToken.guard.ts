import { AuthGuard } from '@nestjs/passport';
import { REFRESH_TOKEN_STRATEGY_ALIAS } from 'src/auth/strategies';

export class RefreshTokenGuard extends AuthGuard(REFRESH_TOKEN_STRATEGY_ALIAS) {
  constructor() {
    super();
  }
}
