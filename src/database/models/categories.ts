import { PrismaClient, Categories as CategoriesModel } from '@prisma/client';

type UnchangeableFields = 'id' | 'createdAt' | 'updatedAt';

export default class Categories {
    db: PrismaClient;

    constructor(db: PrismaClient) {
        this.db = db;
    }

    create(data: Omit<CategoriesModel, UnchangeableFields>) {
        return this.db.categories.create({ data });
    }

    get(id: CategoriesModel['id']) {
        return this.db.categories.findUnique({ where: { id } });
    }

    all(messageID: CategoriesModel['messageID']) {
        return this.db.categories.findMany({ where: { messageID } });
    }

    update(id: CategoriesModel['id'], data: Partial<Omit<CategoriesModel, UnchangeableFields>>) {
        return this.db.categories.update({ where: { id }, data });
    }

    delete(id: CategoriesModel['id']) {
        return this.db.categories.delete({ where: { id } });
    }
}
