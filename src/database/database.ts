import Stubby from '../Bot';
import { PrismaClient } from '@prisma/client';
import Guild from './models/guild';

export default class Database {
    caller: Stubby;
    private prisma = new PrismaClient();
    guild: Guild;

    constructor(caller: Stubby) {
        this.caller = caller;
        this.guild = new Guild(this.prisma);
    }
}
