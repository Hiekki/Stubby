import { Prisma, PrismaClient, Categories as CategoriesModel } from '@prisma/client';

export default class Categories {
    db: PrismaClient;

    constructor(db: PrismaClient) {
        this.db = db;
    }

    create(data: Prisma.CategoriesCreateInput) {
        return this.db.categories.create({ data });
    }

    get(id: CategoriesModel['id']) {
        return this.db.categories.findUnique({ where: { id } });
    }

    allMessage(messageID: CategoriesModel['messageID']) {
        return this.db.categories.findMany({ where: { messageID } });
    }

    all() {
        return this.db.categories.findMany();
    }

    update(id: CategoriesModel['id'], data: Prisma.CategoriesUpdateInput) {
        return this.db.categories.update({ where: { id }, data });
    }

    delete(id: CategoriesModel['id']) {
        return this.db.categories.delete({ where: { id } });
    }
}
