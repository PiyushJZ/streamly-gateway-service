import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  OnModuleInit,
  Injectable,
  Inject,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import {
  LoginDto,
  LoginResponseDto,
  SignupDto,
  SignupResponseDto,
  LogoutDto,
  LogoutResponseDto,
  ForgotPasswordDto,
  ForgotPasswordResponseDto,
  IAuthService,
} from '@lib/common';
import { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { GrpcErrorInterceptor } from './interceptors/error.interceptor';
import { LoginResponseInterceptor } from './interceptors/login.response.interceptor';
import { Public } from '@/decorators/public/public.decorator';

@ApiTags('auth-service')
@Controller('auth-service')
@UseInterceptors(GrpcErrorInterceptor)
@Injectable()
export class AuthServiceController implements OnModuleInit {
  private authService!: IAuthService;

  constructor(
    @Inject('GRPC_AUTH_SERVICE') private readonly grpcClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.authService = this.grpcClient.getService<IAuthService>('AuthService');
  }

  @Public()
  @Post('login')
  @ApiCreatedResponse()
  @ApiNotFoundResponse()
  @HttpCode(HttpStatus.CREATED)
  @HttpCode(HttpStatus.UNAUTHORIZED)
  @UseInterceptors(LoginResponseInterceptor)
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    const grpcLoginResponse = await lastValueFrom(
      this.authService.login(loginDto),
    );
    return grpcLoginResponse;
  }

  @Public()
  @Post('signup')
  @ApiCreatedResponse()
  @ApiForbiddenResponse()
  @HttpCode(HttpStatus.CREATED)
  @HttpCode(HttpStatus.CONFLICT)
  async signup(@Body() signupDto: SignupDto): Promise<SignupResponseDto> {
    const grpcSignupResponse = await lastValueFrom(
      this.authService.signup(signupDto),
    );
    return grpcSignupResponse;
  }

  @Post('logout')
  @ApiOkResponse()
  @ApiUnauthorizedResponse()
  @HttpCode(HttpStatus.OK)
  @HttpCode(HttpStatus.FORBIDDEN)
  async logout(@Body() logoutDto: LogoutDto): Promise<LogoutResponseDto> {
    const grpcLogoutResponse = await lastValueFrom(
      this.authService.logout(logoutDto),
    );
    return grpcLogoutResponse;
  }

  @Public()
  @Post('forgot-password')
  @ApiCreatedResponse()
  @HttpCode(HttpStatus.CREATED)
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<ForgotPasswordResponseDto> {
    const grpcForgotPasswordResponse = await lastValueFrom(
      this.authService.forgotPassword(forgotPasswordDto),
    );
    return grpcForgotPasswordResponse;
  }
}
