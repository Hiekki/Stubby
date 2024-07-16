import { PrismaClient, Threads as ThreadsModel } from '@prisma/client';

type UnchangeableFields = 'createdAt' | 'updatedAt' | 'closed' | 'locked';

export default class Threads {
    db: PrismaClient;

    constructor(db: PrismaClient) {
        this.db = db;
    }

    create(data: Omit<ThreadsModel, UnchangeableFields>) {
        return this.db.threads.create({ data });
    }

    get(id: ThreadsModel['id']) {
        return this.db.threads.findUnique({ where: { id } });
    }

    allOpen(channelID: ThreadsModel['channelID']) {
        return this.db.threads.findMany({ where: { channelID, closed: false } });
    }

    update(id: ThreadsModel['id'], data: Pick<ThreadsModel, 'closed' | 'locked'>) {
        return this.db.threads.update({ where: { id }, data });
    }

    delete(id: ThreadsModel['id']) {
        return this.db.threads.delete({ where: { id } });
    }
}
