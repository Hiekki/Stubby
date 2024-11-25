import { Prisma, PrismaClient, Threads as ThreadsModel } from '@prisma/client';

export default class Threads {
    db: PrismaClient;

    constructor(db: PrismaClient) {
        this.db = db;
    }

    create(data: Prisma.ThreadsCreateInput) {
        return this.db.threads.create({ data });
    }

    get(id: ThreadsModel['id']) {
        return this.db.threads.findUnique({ where: { id } });
    }

    allOpen(channelID: ThreadsModel['channelID']) {
        return this.db.threads.findMany({ where: { channelID, closed: false } });
    }

    all() {
        return this.db.threads.findMany();
    }

    update(id: ThreadsModel['id'], data: Prisma.ThreadsUpdateInput) {
        return this.db.threads.update({ where: { id }, data });
    }

    delete(id: ThreadsModel['id']) {
        return this.db.threads.update({ where: { id }, data: { deleted: true, closed: true } });
    }
}
