import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { useContainer } from 'class-validator';
import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';

import validationOptions from '@/utils/validation.options';
import { ConfigType } from '@/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  const configService = app.get(ConfigService<ConfigType>);

  app.enableShutdownHooks();
  app.setGlobalPrefix(configService.getOrThrow('API_PREFIX', { infer: true }), {
    exclude: ['/'],
  });
  app.useGlobalPipes(new ValidationPipe(validationOptions));

  const options = new DocumentBuilder()
    .setTitle('API Gateway')
    .setDescription('API docs')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('docs', app, document);

  app.use(
    helmet({
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      xssFilter: true,
      xDownloadOptions: true,
      frameguard: { action: 'deny' },
      noSniff: true,
      hsts: {
        maxAge: 63072000, // 2 years
        includeSubDomains: true,
        preload: true,
      },
      permittedCrossDomainPolicies: {
        permittedPolicies: 'none',
      },
    }),
  );

  app.use(
    cookieParser(configService.getOrThrow('COOKIE_SECRET', { infer: true })),
  );
  app.use(
    bodyParser.json({
      limit: '100mb',
      strict: true,
    }),
  );
  await app.listen(configService.getOrThrow('GATEWAY_PORT', { infer: true }));
  console.log('Server is ready!');
  console.log(
    `Server started at with timezone: ${configService.getOrThrow('TZ')} at date:`,
    new Date(),
  );
}
void bootstrap();
