import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';

describe('EmailService', () => {
  let service: EmailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const values: Record<string, string> = {
                SMTP_HOST: 'smtp.example.com',
                SMTP_USER: 'no-reply@example.com',
                SMTP_PASS: 'test-password',
                SMTP_PORT: '587',
                SMTP_SECURE: 'false',
                MAIL_FROM_NAME: 'Task Management API',
              };

              return values[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
