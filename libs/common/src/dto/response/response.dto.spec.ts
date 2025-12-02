import { ResponseDto } from './response.dto';

describe('ResponseDto', () => {
  it('should create an instance with provided values', () => {
    const response = new ResponseDto(201, { id: 1, name: 'Test' }, null);

    expect(response.status).toBe(201);
    expect(response.data).toEqual({ id: 1, name: 'Test' });
    expect(response.errors).toBeNull();
  });

  it('should accept errors when provided', () => {
    const error = { message: 'Something went wrong' };
    const response = new ResponseDto(500, null, error);

    expect(response.status).toBe(500);
    expect(response.data).toBeNull();
    expect(response.errors).toEqual(error);
  });
});

