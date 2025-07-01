import { LoginResponseDto } from '@lib/common';
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class LoginResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const res = ctx.getResponse<Response>();

    return next.handle().pipe(
      map((data: LoginResponseDto) => {
        const { accessToken, refreshToken, sessionId, ...rest } = data;
        res.cookie('accessToken', accessToken, {
          httpOnly: false,
          secure: false,
          sameSite: 'strict',
          maxAge: 15 * 60 * 1000,
        });

        res.cookie('refreshToken', refreshToken, {
          httpOnly: false,
          secure: false,
          sameSite: 'strict',
          maxAge: 30 * 24 * 60 * 60 * 1000,
        });

        res.cookie('sessionId', sessionId, {
          httpOnly: false,
          secure: false,
          sameSite: 'strict',
          maxAge: 30 * 24 * 60 * 60 * 1000,
        });

        return rest;
      }),
    );
  }
}
