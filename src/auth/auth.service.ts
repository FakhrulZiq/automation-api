import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { UserContext } from './interfaces/user-context.interface';

interface TokenRecord extends UserContext {
  token: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly tokenMap: Map<string, TokenRecord> = new Map();

  constructor(private readonly configService: ConfigService) {
    this.loadTokens();
  }

  validateToken(token: string | undefined | null): UserContext | null {
    if (!token) {
      return null;
    }

    const record = this.tokenMap.get(token.trim());
    if (!record) {
      return null;
    }

    return {
      userId: record.userId,
      scopes: [...record.scopes],
    };
  }

  private loadTokens(): void {
    const entries = this.configService.get<string>('MCP_API_KEYS');
    if (!entries) {
      this.logger.warn('No MCP_API_KEYS configured; MCP authentication will fail for all tokens');
      return;
    }

    const records = entries
      .split(',')
      .map((segment) => segment.trim())
      .filter(Boolean)
      .map((segment) => {
        // Format: token:userId:scope1|scope2
        const [token, userId, scopes = ''] = segment.split(':');
        if (!token || !userId) {
          this.logger.warn(`Skipping invalid MCP token entry: ${segment}`);
          return null;
        }

        const scopeList = scopes
          .split('|')
          .map((scope) => scope.trim())
          .filter(Boolean);

        return {
          token,
          userId,
          scopes: scopeList,
        } satisfies TokenRecord;
      })
      .filter((value): value is TokenRecord => value !== null);

    this.tokenMap.clear();
    for (const record of records) {
      this.tokenMap.set(record.token, record);
    }

    this.logger.log(`Loaded ${this.tokenMap.size} MCP API tokens`);
  }
}
