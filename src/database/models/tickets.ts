import { PrismaClient, Tickets as TicketsModel } from '@prisma/client';

type UnchangeableFields = 'createdAt' | 'updatedAt';

export default class Tickets {
    db: PrismaClient;

    constructor(db: PrismaClient) {
        this.db = db;
    }

    create(data: Omit<TicketsModel, UnchangeableFields>) {
        return this.db.tickets.create({ data });
    }

    get(id: TicketsModel['id']) {
        return this.db.tickets.findUnique({ where: { id }, include: { categories: true } });
    }

    all(guildID: TicketsModel['guildID']) {
        return this.db.tickets.findMany({ where: { guildID } });
    }

    update(id: TicketsModel['id'], data: Partial<Omit<TicketsModel, 'id' | UnchangeableFields>>) {
        return this.db.tickets.update({ where: { id }, data });
    }

    delete(id: TicketsModel['id']) {
        return this.db.tickets.delete({ where: { id } });
    }

    list(guildID: TicketsModel['guildID']) {
        return this.db.tickets.findMany({ where: { guildID }, include: { categories: true } });
    }
}
