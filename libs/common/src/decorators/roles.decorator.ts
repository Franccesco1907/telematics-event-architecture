import { ROLES_KEY, UserRole } from '../constants';
import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

