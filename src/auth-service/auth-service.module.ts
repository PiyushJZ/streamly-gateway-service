import { Module } from '@nestjs/common';
import { AuthServiceController } from './auth-service.controller';
import { SwaggerModule } from '@nestjs/swagger';
import { GrpcClientModule } from '@/grpc-client/grpc-client.module';

@Module({
  imports: [SwaggerModule, GrpcClientModule],
  controllers: [AuthServiceController],
  providers: [],
})
export class AuthServiceModule {}
