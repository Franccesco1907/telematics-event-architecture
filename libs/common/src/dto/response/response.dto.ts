import { ApiProperty } from '@nestjs/swagger';

export class ResponseDto<T> {
  @ApiProperty({
    description: 'HTTP status code of the response',
    example: 200,
  })
  status: number = 200;

  @ApiProperty({
    description: 'Payload returned by the API',
  })
  data: T;

  @ApiProperty({
    nullable: true,
    description: 'Errors if any occurred during the request',
    example: null,
  })
  errors: any = null;

  constructor(status: number, data: T, errors: any) {
    this.status = status;
    this.data = data;
    this.errors = errors;
  }
}

