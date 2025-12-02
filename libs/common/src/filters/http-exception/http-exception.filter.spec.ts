import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { AllExceptionFilter } from './http-exception.filter';

describe('AllExceptionFilter', () => {
  let filter: AllExceptionFilter;

  beforeEach(() => {
    filter = new AllExceptionFilter();
  });

  const mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  const mockRequest = {
    url: '/test-url',
  };

  const createMockHost = (exception: any) => {
    const res = mockResponse();
    return {
      switchToHttp: () => ({
        getResponse: () => res,
        getRequest: () => mockRequest,
      }),
    } as unknown as ArgumentsHost;
  };

  it('should handle HttpException correctly', () => {
    const exception = new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    const host = createMockHost(exception);

    filter.catch(exception, host);

    const expectedStatus = HttpStatus.FORBIDDEN;
    const res = host.switchToHttp().getResponse();

    expect(res.status).toHaveBeenCalledWith(expectedStatus);
    expect(res.json).toHaveBeenCalledWith({
      status: expectedStatus,
      data: null,
      errors: {
        error: exception.getResponse(),
        path: mockRequest.url,
      },
    });
  });

  it('should handle non-HttpException as 500', () => {
    const exception = new Error('Something went wrong');
    const host = createMockHost(exception);

    filter.catch(exception, host);

    const res = host.switchToHttp().getResponse();
    expect(res.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(res.json).toHaveBeenCalledWith({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      data: null,
      errors: {
        error: exception,
        path: mockRequest.url,
      },
    });
  });
});

