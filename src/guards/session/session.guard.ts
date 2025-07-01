// src/guards/jwt-auth.guard.ts
import { ConfigType } from '@/config';
import {
  UnauthorizedException,
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import {
  CookiesData,
  AccessTokenPayload,
  RefreshTokenPayload,
  SessionCacheData,
} from '@/interfaces/auth';
import Cache from '@lib/cache';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<ConfigType>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // If public route, then skip authorization
    const isPublic = this.reflector.get<boolean>(
      'isPublic',
      context.getHandler(),
    );
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;
    // Unauthorized if Auth header missing or not proper
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('BAD_AUTH_HEADER');
    }

    const cookies = request.cookies as CookiesData;
    const cookieAccessToken = cookies.accessToken;
    const cookieRefreshToken = cookies.refreshToken;
    const sessionId = cookies.sessionId;
    // Unauthorized if cookies are missing
    if (!cookieAccessToken || !cookieRefreshToken || !sessionId) {
      throw new UnauthorizedException('JWT_TOKEN_MISSING');
    }
    // Check if session is active
    const isActiveSession = await Cache.exists(sessionId);
    const sessionPayload = await Cache.get<SessionCacheData>(sessionId);
    if (!isActiveSession || !sessionPayload) {
      throw new ForbiddenException('SESSION_EXPIRED');
    }

    const authToken = authHeader.split(' ')[1];
    // Unauthorized if the auth header token mismatch with the cookie token
    if (authToken !== cookieAccessToken) {
      throw new ForbiddenException('INVALID_ACCESS_TOKEN');
    }

    try {
      const accessTokenPayload: AccessTokenPayload = await this.jwt.verifyAsync(
        authToken,
        {
          secret: this.config.getOrThrow('JWT_SECRET_ACCESS'),
        },
      );

      const refreshToken = accessTokenPayload.refreshToken;
      // Unauthorized if refresh token mismatch
      if (refreshToken !== cookieRefreshToken) {
        throw new UnauthorizedException('INVALID_REFRESH_TOKEN');
      }
      const refreshTokenPayload: RefreshTokenPayload =
        await this.jwt.verifyAsync(refreshToken, {
          secret: this.config.getOrThrow('JWT_SECRET_REFRESH'),
        });

      if (
        sessionPayload.userId !== accessTokenPayload.id ||
        sessionPayload.userId !== refreshTokenPayload.id
      ) {
        throw new ForbiddenException('SESSION_MISMATCH');
      }
      if (!request.body) {
        request.body = {};
      }
      const body = request.body as Record<string, any>;
      body['userId'] = sessionPayload.userId;
      body['accessToken'] = authToken;
      body['sessionId'] = sessionId;
      return true;
    } catch (error: unknown) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      if (error instanceof ForbiddenException) {
        throw error;
      }
      console.error(error);
      throw new UnauthorizedException('AUTHORIZATION_FAILED');
    }
  }
}
