import { Prisma, PrismaClient, Tickets as TicketsModel } from '@prisma/client';

export default class Tickets {
    db: PrismaClient;

    constructor(db: PrismaClient) {
        this.db = db;
    }

    create(data: Prisma.TicketsCreateInput) {
        return this.db.tickets.create({ data });
    }

    get(id: TicketsModel['id']) {
        return this.db.tickets.findUnique({ where: { id }, include: { categories: true } });
    }

    allGuild(guildID: TicketsModel['guildID']) {
        return this.db.tickets.findMany({ where: { guildID } });
    }

    all() {
        return this.db.tickets.findMany();
    }

    update(id: TicketsModel['id'], data: Prisma.TicketsUpdateInput) {
        return this.db.tickets.update({ where: { id }, data });
    }

    delete(id: TicketsModel['id']) {
        return this.db.tickets.delete({ where: { id } });
    }

    list(guildID: TicketsModel['guildID']) {
        return this.db.tickets.findMany({ where: { guildID }, include: { categories: true } });
    }
}
