import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
  HttpException,
} from '@nestjs/common';
import { Observable, catchError, throwError } from 'rxjs';
import { status } from '@grpc/grpc-js';

@Injectable()
export class GrpcErrorInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error: { code?: status; details?: string }) => {
        if (error instanceof HttpException) {
          throw error;
        }
        switch (error.code) {
          case status.NOT_FOUND:
            return throwError(() => new NotFoundException(error.details));
          case status.INVALID_ARGUMENT:
            return throwError(() => new BadRequestException(error.details));
          case status.ALREADY_EXISTS:
            return throwError(() => new ConflictException(error.details));
          case status.UNAUTHENTICATED:
            return throwError(() => new UnauthorizedException(error.details));
          case status.INTERNAL:
            return throwError(
              () => new InternalServerErrorException(error.details),
            );
          case status.PERMISSION_DENIED:
            return throwError(() => new ForbiddenException(error.details));
          default:
            return throwError(
              () =>
                new InternalServerErrorException(
                  `Unexpected gRPC error: ${error.details}`,
                ),
            );
        }
      }),
    );
  }
}
