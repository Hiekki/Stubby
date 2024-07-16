import { PrismaClient, Guild as GuildModel } from '@prisma/client';

type UnchangeableFields = 'id' | 'guildID';

export default class Guild {
    db: PrismaClient;

    constructor(db: PrismaClient) {
        this.db = db;
    }

    //Creates a new guild in the database
    create(data: GuildModel) {
        return this.db.guild.create({
            data,
        });
    }

    //Gets a guild from the database
    get(guildID: GuildModel['guildID']) {
        return this.db.guild.findUnique({
            where: {
                guildID,
            },
        });
    }

    /* 
    Partial makes it so all fields are optional 
    - Omit makes it so the id and guildID field is not included
    - - GuildModel is the type of the object
    - - UnchangeableFields is the fields that cannot be changed
    Example: GuildModel = {
        id: string,
        guildID: string,
        guildName: string,
        createdAt: Date,
        updatedAt: Date,
    }
    Turns into: GuildModel = {
        guildName?: string,
        createdAt?: Date,
        updatedAt?: Date,
    }
    This makes it so we enforce not being able to change those fields as Prisma doesn't include this functionality
    */

    //Updates a guild in the database
    update(guildID: GuildModel['guildID'], data: Partial<Omit<GuildModel, UnchangeableFields>>) {
        return this.db.guild.update({
            where: {
                guildID,
            },
            data,
        });
    }

    //Deletes a guild from the database
    delete(guildID: GuildModel['guildID']) {
        return this.db.guild.delete({
            where: {
                guildID,
            },
        });
    }
}
