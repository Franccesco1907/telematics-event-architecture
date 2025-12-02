import { CallHandler, ExecutionContext, RequestTimeoutException } from '@nestjs/common';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { TimeoutInterceptor } from './timeout.interceptor';

describe('TimeoutInterceptor', () => {
  let interceptor: TimeoutInterceptor;
  let mockExecutionContext: Partial<ExecutionContext>;
  let mockCallHandler: Partial<CallHandler>;

  beforeEach(() => {
    interceptor = new TimeoutInterceptor();

    mockExecutionContext = {};

    mockCallHandler = {
      handle: jest.fn(() => of('OK')),
    };
  });

  it('should return the observable if within timeout', (done) => {
    interceptor
      .intercept(mockExecutionContext as ExecutionContext, mockCallHandler as CallHandler)
      .subscribe((result) => {
        expect(result).toBe('OK');
        expect(mockCallHandler.handle).toHaveBeenCalled();
        done();
      });
  });

  it('should throw RequestTimeoutException if request takes too long', (done) => {
    mockCallHandler.handle = jest.fn(
      () => of('Delayed').pipe(delay(4000)),
    );

    interceptor
      .intercept(mockExecutionContext as ExecutionContext, mockCallHandler as CallHandler)
      .subscribe({
        next: () => {
          done(new Error('Expected timeout error'));
        },
        error: (err) => {
          expect(err).toBeInstanceOf(RequestTimeoutException);
          done();
        },
      });
  });
});

