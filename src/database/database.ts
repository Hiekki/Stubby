import Stubby from '../Bot';
import { PrismaClient } from '@prisma/client';
import Guild from './models/guild';
import Tickets from './models/tickets';
import Categories from './models/categories';
import Threads from './models/threads';

export default class Database {
    caller: Stubby;
    private prisma = new PrismaClient();
    guild: Guild;
    tickets: Tickets;
    categories: Categories;
    threads: Threads;

    constructor(caller: Stubby) {
        this.caller = caller;
        this.guild = new Guild(this.prisma);
        this.tickets = new Tickets(this.prisma);
        this.categories = new Categories(this.prisma);
        this.threads = new Threads(this.prisma);
    }
}
