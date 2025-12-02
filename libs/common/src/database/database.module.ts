import { Global, Module } from '@nestjs/common';
import { OrmDatabaseModule } from './orm';

@Global()
@Module({
  imports: [
    OrmDatabaseModule,
  ],
  exports: [
    OrmDatabaseModule,
  ],
})
export class DatabaseModule { }
