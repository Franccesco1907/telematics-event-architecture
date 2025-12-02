import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import { LoggingInterceptor } from './logging.interceptor';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;
  let mockExecutionContext: Partial<ExecutionContext>;
  let mockCallHandler: Partial<CallHandler>;
  let loggerSpy: jest.SpyInstance;

  beforeEach(() => {
    interceptor = new LoggingInterceptor();
    loggerSpy = jest.spyOn(interceptor['logger'], 'log').mockImplementation(() => {});

    mockExecutionContext = {
      getType: jest.fn().mockReturnValue('http'),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn(() => ({
          get: jest.fn().mockReturnValue('mock-user-agent'),
          ip: '127.0.0.1',
          method: 'GET',
          path: '/test',
          user: { userId: 'user123' },
        })),
        getResponse: jest.fn(() => ({
          statusCode: 200,
          get: jest.fn().mockReturnValue('123'),
        })),
      }),
      getClass: jest.fn().mockReturnValue({ name: 'TestController' }),
      getHandler: jest.fn().mockReturnValue({ name: 'testMethod' }),
    };

    mockCallHandler = {
      handle: jest.fn(() => of('response')),
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should log request and response for HTTP context with user-agent', (done) => {
    interceptor
      .intercept(mockExecutionContext as ExecutionContext, mockCallHandler as CallHandler)
      .subscribe(() => {
        expect(loggerSpy).toHaveBeenCalledTimes(2);
        expect(loggerSpy).toHaveBeenCalledWith(
          expect.stringContaining('[') &&
            expect.stringContaining(
              'GET /test user123 mock-user-agent 127.0.0.1: TestController testMethod',
            ),
        );
        expect(mockCallHandler.handle).toHaveBeenCalled();
        done();
      });
  });

  it('should log request and response for HTTP context without user-agent', (done) => {
    (mockExecutionContext.switchToHttp as jest.Mock).mockReturnValue({
      getRequest: jest.fn(() => ({
        get: jest.fn().mockReturnValue(undefined),
        ip: '127.0.0.1',
        method: 'GET',
        path: '/test',
        user: { userId: 'user123' },
      })),
      getResponse: jest.fn(() => ({
        statusCode: 200,
        get: jest.fn().mockReturnValue('123'),
      })),
    });

    interceptor
      .intercept(mockExecutionContext as ExecutionContext, mockCallHandler as CallHandler)
      .subscribe(() => {
        expect(loggerSpy).toHaveBeenCalledTimes(2);
        expect(loggerSpy).toHaveBeenCalledWith(
          expect.stringContaining('[') &&
            expect.stringContaining('GET /test user123  127.0.0.1: TestController testMethod'),
        );
        expect(mockCallHandler.handle).toHaveBeenCalled();
        done();
      });
  });

  it('should bypass logging for non-HTTP context', () => {
    (mockExecutionContext.getType as jest.Mock).mockReturnValue('rpc');

    interceptor.intercept(mockExecutionContext as ExecutionContext, mockCallHandler as CallHandler);

    expect(mockCallHandler.handle).toHaveBeenCalled();
    expect(loggerSpy).not.toHaveBeenCalled();
  });
});

