import { PrismaClient, Guild as GuildModel } from '@prisma/client';

type UnchangeableFields = 'id' | 'guildID';

export default class Guild {
    db: PrismaClient;

    constructor(db: PrismaClient) {
        this.db = db;
    }

    create(data: Pick<GuildModel, 'guildID' | 'guildName'>) {
        return this.db.guild.create({ data });
    }

    get(guildID: GuildModel['guildID']) {
        return this.db.guild.findUnique({ where: { guildID } });
    }

    all() {
        return this.db.guild.findMany();
    }

    update(guildID: GuildModel['guildID'], data: Partial<Omit<GuildModel, UnchangeableFields>>) {
        return this.db.guild.update({ where: { guildID }, data });
    }

    delete(guildID: GuildModel['guildID']) {
        return this.db.guild.delete({ where: { guildID } });
    }
}
