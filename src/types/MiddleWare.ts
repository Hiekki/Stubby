import { Guild } from '@prisma/client';

type MiddleWareType = {
    guild: Guild;
} | null;

export default MiddleWareType;
