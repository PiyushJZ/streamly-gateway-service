import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NatsClientModule } from '@/nats-client/nats-client.module';
import { validateEnv, configuration } from '@/config';
import { GrpcClientModule } from './grpc-client/grpc-client.module';
import { AuthServiceModule } from './auth-service/auth-service.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ConfigType } from '@/config';
import { JwtAuthGuard } from '@/guards/session/session.guard';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
      cache: true,
    }),
    NatsClientModule,
    GrpcClientModule,
    AuthServiceModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<ConfigType>) => [
        {
          name: 'OneMinute',
          ttl: config.getOrThrow('THROTTLE_TTL_LONG'),
          limit: config.getOrThrow('THROTTLE_LIMIT_LONG'),
          blockDuration: config.getOrThrow('THROTTLE_TTL_LONG'),
        },
        {
          name: 'OneSecond',
          ttl: config.getOrThrow('THROTTLE_TTL_SHORT'),
          limit: config.getOrThrow('THROTTLE_LIMIT_SHORT'),
        },
      ],
    }),
    JwtModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
