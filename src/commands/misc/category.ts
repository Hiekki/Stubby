import {
    AutocompleteInteraction,
    Command,
    CommandBuilder,
    CommandInteraction,
    ComponentBuilder,
    ComponentInteraction,
    Constants,
    Role,
    ThreadChannel,
} from 'athena';
import Stubby from '../../Bot';
import { BotColors, BotEmojis } from '../../utils/constants';
import { ConfirmAction, ErrorMessage, SuccessMessage } from '../../utils/message';
import moment from 'moment';
import MiddleWareType from '../../types/MiddleWare';

type RolesCreate = [Role, Role | null, Role | null];
type RolesEdit = [Role | null, Role | null, Role | null];

export default class Category extends Command<Stubby> {
    id = 'category';
    definition = new CommandBuilder('category', 'Create, edit, or delete a category for a ticket system')
        .setCommandType(Constants.ApplicationCommandType.ChatInput)
        .setMemberPermission(Constants.PermissionFlagsBits.ManageThreads)
        .setContexts([Constants.InteractionContextType.Guild])
        .addSubcommand('create', 'Create a new category', (sub) => {
            sub.addStringOption({
                name: 'ticket',
                description: 'The ticket to create the category in',
                required: true,
                autocomplete: true,
            })
                .addStringOption({
                    name: 'label',
                    description: 'What would you like to label this category?',
                    required: true,
                    max_length: 64,
                })
                .addStringOption({
                    name: 'description',
                    description: 'How would you like to describe this category?',
                    required: true,
                    max_length: 100,
                })
                .addRoleOption('role_one', 'What role would you like to ping when this category is mentioned?', true)
                .addRoleOption('role_two', 'What role would you like to ping when this category is mentioned?')
                .addRoleOption('role_three', 'What role would you like to ping when this category is mentioned?')
                .addStringOption({ name: 'emoji', description: 'What emoji would you like to use for this category?' })
                .addStringOption({
                    name: 'custom_message',
                    description: 'What message would you like for the user to see when they join?',
                    max_length: 4000,
                });
        })
        .addSubcommand('edit', 'Edit a category', (sub) => {
            sub.addStringOption({
                name: 'ticket',
                description: 'The ticket to edit the category in',
                required: true,
                autocomplete: true,
            })
                .addStringOption({
                    name: 'category',
                    description: 'The category you wish to edit',
                    required: true,
                    autocomplete: true,
                })
                .addStringOption({
                    name: 'label',
                    description: 'What would you like to label this category?',
                    max_length: 64,
                })
                .addStringOption({
                    name: 'description',
                    description: 'How would you like to describe this category?',
                    max_length: 100,
                })
                .addRoleOption('role_one', 'What role would you like to ping when this category is mentioned?')
                .addRoleOption('role_two', 'What role would you like to ping when this category is mentioned?')
                .addRoleOption('role_three', 'What role would you like to ping when this category is mentioned?')
                .addStringOption({ name: 'emoji', description: 'What emoji would you like to use for this category?' })
                .addStringOption({
                    name: 'custom_message',
                    description: 'What message would you like for the user to see when they join?',
                    max_length: 4000,
                });
        })
        .addSubcommand('delete', 'Delete a category', (sub) => {
            sub.addStringOption({
                name: 'ticket',
                description: 'The ticket to delete the category in',
                required: true,
                autocomplete: true,
            }).addStringOption({
                name: 'category',
                description: 'The category you wish to edit',
                required: true,
                autocomplete: true,
            });
        });

    async handleCommand(caller: Stubby, command: CommandInteraction, middleware: MiddleWareType) {
        try {
            if (!command.guild) return;

            const user = command.member ? command.member.user : command.user;
            if (!user) return;

            const permissions = await caller.parsing.botPermissionsCheck(command, [
                'ManageThreads',
                'CreatePrivateThreads',
                'SendMessagesInThreads',
            ]);
            if (permissions) return;

            const ticketID = command.getRequiredString('ticket');
            const ticket = await caller.database.tickets.get(ticketID);
            if (!ticket) return await ErrorMessage(command, 'Could not find ticket!', true);

            let message = await caller.bot.getMessage(ticket.channelID, ticket.id);
            if (!message) message = await command.getOriginalMessage();
            if (!message) return await ErrorMessage(command, 'Could not find the message to edit!', true);

            const embed: Constants.APIEmbed = {
                color: BotColors.purple,
                footer: {
                    text: `${caller.bot.user?.username}`,
                    icon_url: caller.bot.user?.dynamicAvatarURL(),
                },
                timestamp: new Date().toISOString(),
            };

            switch (command.subcommand) {
                case 'create': {
                    if (ticket.categories.length >= 25) {
                        return await ErrorMessage(command, 'You cannot have more than 25 categories!', true);
                    }

                    const label = command.getRequiredString('label');
                    const description = command.getRequiredString('description');
                    const emoji = command.getString('emoji');
                    const custom_message = command.getString('custom_message');
                    const roles: RolesCreate = [
                        command.getRequiredRole('role_one'),
                        command.getRole('role_two'),
                        command.getRole('role_three'),
                    ];

                    embed.title = 'Tickets Category Created';
                    embed.description = `**Label:** ${label}\n**Description:** ${description}\n**Role One:** ${roles[0].mention}\n**Role Two:** ${roles[1] ? roles[1].mention : 'No second role selected'}\n**Role Three:** ${roles[2] ? roles[2].mention : 'No third role selected'}\n**Emoji:** ${emoji ?? 'No Emoji'}\n**Custom Message:** ${custom_message ?? 'No custom message'}`;

                    await caller.database.categories.create({
                        ticket: { connect: { id: ticket.id } },
                        label,
                        description,
                        role_one: roles[0].id,
                        role_two: roles[1] ? roles[1].id : null,
                        role_three: roles[2] ? roles[2].id : null,
                        emoji,
                        custom_message,
                    });

                    if (middleware?.guild.logsChannel) {
                        await caller.bot.createMessage(middleware.guild.logsChannel, {
                            content: `[<t:${caller.parsing.unix()}:f>] 🖊️ ${user.mention} (\`${user.id}\`) created a new category in **${ticket.title}**: **${label}**`,
                        });
                    }
                    break;
                }
                case 'edit': {
                    const label = command.getString('label');
                    const description = command.getString('description');
                    const emoji = command.getString('emoji');
                    const custom_message = command.getString('custom_message');
                    const roles: RolesEdit = [command.getRole('role_one'), command.getRole('role_two'), command.getRole('role_three')];

                    const categoryID = Number(command.getRequiredString('category'));
                    const category = await caller.database.categories.get(categoryID);
                    if (!category) return await ErrorMessage(command, 'Could not find category!', true);

                    embed.title = 'Tickets Category Edited';
                    embed.description = `**Label:** ${label ?? category.label}\n**Description:** ${description ?? category.description}\n**Role One:** ${roles[0] ? roles[0].mention : category.role_one ? `<@&${category.role_one}>` : 'No role selected'}\n**Role Two:** ${roles[1] ? roles[1].mention : category.role_two ? `<@&${category.role_two}>` : 'No second role selected'}\n**Role Three:** ${roles[2] ? roles[2].mention : category.role_three ? `<@&${category.role_three}>` : 'No third role selected'}\n**Emoji:** ${emoji ?? category.emoji ?? 'No Emoji'}\n**Custom Message:** ${custom_message ?? category.custom_message ?? 'No custom message'}`;

                    await caller.database.categories.update(categoryID, {
                        label: label ?? category.label,
                        description: description ?? category.description,
                        role_one: roles[0] ? roles[0].id : category.role_one,
                        role_two: roles[1] ? roles[1].id : category.role_two,
                        role_three: roles[2] ? roles[2].id : category.role_three,
                        emoji: emoji ?? category.emoji,
                        custom_message: custom_message ?? category.custom_message,
                    });

                    if (middleware?.guild.logsChannel) {
                        await caller.bot.createMessage(middleware.guild.logsChannel, {
                            content: `[<t:${caller.parsing.unix()}:f>] ✏️ ${user.mention} (\`${user.id}\`) edited a category in **${ticket.title}**: **${label}**`,
                        });
                    }
                    break;
                }
                case 'delete': {
                    const categoryID = Number(command.getRequiredString('category'));
                    const category = await caller.database.categories.get(categoryID);
                    if (!category) return await ErrorMessage(command, 'Could not find category!', true);

                    const deleteMessage = await ConfirmAction(caller, command, {
                        embeds: [
                            {
                                title: 'Delete Category',
                                description: `Are you sure you want to delete the category \`${category.label}\`?\n\n-# This command will timeout <t:${moment(Date.now()).add(1, 'minute').add(1, 'seconds').unix()}:R>`,
                                color: BotColors.purple,
                            },
                        ],
                        flags: Constants.MessageFlags.Ephemeral,
                    });

                    if (deleteMessage.timeout) {
                        return await command.editOriginalMessage({
                            embeds: [
                                {
                                    title: `Delete Category: Timed Out ${BotEmojis.yellowBang.full}`,
                                    description: 'You took too long to decide!',
                                    color: BotColors.yellow,
                                },
                            ],
                            components: [],
                        });
                    }

                    const confirmed = deleteMessage.result;

                    if (confirmed) {
                        try {
                            if (middleware?.guild.logsChannel) {
                                await caller.bot.createMessage(middleware.guild.logsChannel, {
                                    content: `[<t:${caller.parsing.unix()}:f>] 🗑️ ${user.mention} (\`${user.id}\`) deleted a category in **${ticket.title}**: **${category.label}**`,
                                });
                            }

                            await caller.database.categories.delete(categoryID);
                        } catch (error) {
                            caller.logger.error(error);
                            return await ErrorMessage(command, 'Failed to delete category!', true);
                        }
                    }

                    embed.title = confirmed
                        ? `Deleted Category: Success ${BotEmojis.greenTick.full}`
                        : `Deleted Category: Cancelled ${BotEmojis.redX.full}`;
                    embed.description = confirmed
                        ? `Successfully deleted category and updated the ticket: https://discord.com/channels/${ticket.guildID}/${ticket.channelID}/${ticket.id}!`
                        : `The request to delete the category has been cancelled.`;
                    embed.color = confirmed ? BotColors.green : BotColors.red;

                    break;
                }
            }

            const categories = await caller.database.categories.allMessage(ticket.id);
            if (categories.length) {
                const components = new ComponentBuilder('category')
                    .addActionRow((row) => {
                        row.addStringSelect({
                            custom_id: 'select',
                            placeholder: 'Select an option to open a ticket.',
                            options: categories.map((category) => {
                                return {
                                    label: category.label,
                                    value: `${category.id}`,
                                    description: category.description,
                                    emoji: category.emoji ? caller.utils.parseEmoji(category.emoji) : undefined,
                                };
                            }),
                        });
                    })
                    .toJSON();

                await message.edit({ components });
            } else await message.edit({ components: [] });

            if (command.subcommand != 'delete') {
                embed.description += `\n\nSuccessfully updated the ticket: https://discord.com/channels/${ticket.guildID}/${ticket.channelID}/${ticket.id}`;
                await command.createMessage({ embeds: [embed], components: [], flags: Constants.MessageFlags.Ephemeral });
            } else await command.editOriginalMessage({ embeds: [embed], components: [] });
        } catch (error) {
            caller.parsing.commandError(error);
        }
    }

    async handleAutocomplete(caller: Stubby, interaction: AutocompleteInteraction) {
        if (!interaction.guild) return;

        const focused = interaction.focused();
        switch (focused?.name) {
            case 'ticket': {
                const focusedValue = focused?.value as string;
                const tickets = await caller.database.tickets.allGuild(interaction.guild.id);
                const results = tickets
                    .filter((ticket) => ticket.title.toLowerCase().includes(focusedValue.toLowerCase()))
                    .map((ticket) => {
                        return { name: ticket.title, value: ticket.id };
                    })
                    .slice(0, 25);
                await interaction.acknowledge(results);
                break;
            }
            case 'category': {
                const ticketID = interaction.options[0].value as string;
                if (!ticketID) return await interaction.acknowledge([{ name: 'Please select a ticket first.', value: '0' }]);

                const focusedValue = focused?.value as string;
                const categories = await caller.database.categories.allMessage(ticketID);
                const results = categories
                    .filter((category) => category.label.toLowerCase().includes(focusedValue.toLowerCase()))
                    .map((category) => {
                        return { name: category.label, value: `${category.id}` };
                    })
                    .slice(0, 25);

                await interaction.acknowledge(results);
                break;
            }
        }
    }

    async handleComponent(caller: Stubby, interaction: ComponentInteraction, middleware: MiddleWareType) {
        if (!interaction.guild) return;

        const user = interaction.member;
        if (!user) return;

        switch (interaction.data.component_type) {
            case Constants.ComponentType.StringSelect: {
                const categoryID = Number(interaction.data.values[0]);
                const category = await caller.database.categories.get(categoryID);
                if (!category) return;

                const title = `${user.nick ?? user.displayName(true)} | ${category.label}`;

                const activeThreads = await caller.database.threads.allOpen(interaction.channel.id);
                const openUserThreads = activeThreads.filter((thread) => thread.categoryID == categoryID && thread.userID == user.id);
                if (openUserThreads.length) {
                    await this.resetMessage(caller, category.messageID);
                    return interaction.createMessage({
                        embeds: [
                            {
                                title: `Found Thread: ${category.label}`,
                                description: `You already have an active ticket for this category!\n\n**Ticket:** <#${openUserThreads[0].id}>`,
                                color: BotColors.embedGray,
                            },
                        ],
                        flags: Constants.MessageFlags.Ephemeral,
                    });
                }

                if (!interaction.acknowledged) await interaction.deferUpdate().catch(() => {});

                const roles = [category.role_one, category.role_two, category.role_three].filter((role) => role !== null);

                const thread = (await caller.bot.createThreadWithoutMessage(interaction.channel.id, {
                    name: title,
                    invitable: false,
                    type: Constants.ChannelType.PrivateThread,
                    auto_archive_duration: 10080,
                })) as ThreadChannel;

                await caller.database.threads.create({
                    id: thread.id,
                    userID: user.id,
                    category: { connect: { id: categoryID } },
                    ticket: { connect: { id: category.messageID } },
                    channelID: interaction.channel.id,
                });

                if (middleware?.guild.logsChannel) {
                    await caller.bot.createMessage(middleware.guild.logsChannel, {
                        content: `[<t:${caller.parsing.unix()}:f>] 🖊️ ${user.mention} (\`${user.id}\`) opened a new ticket in <#${interaction.channel.id}>: **${category.label}**`,
                    });
                }

                await thread.createMessage({
                    content: `${roles.map((role) => `<@&${role}>`).join(' ')} | ${user.mention} | ${user.id}`,
                    allowed_mentions: {
                        users: [user.id],
                        roles,
                    },
                    embeds: [
                        {
                            title: `Topic: ${category.label}`,
                            description:
                                category.custom_message?.replace(/\\n/g, '\n') ??
                                'Thank you for reaching out to us. Feel free to go ahead and ask any questions you may have regarding this topic. Someone will be with you shortly.',
                            color: BotColors.embedGray,
                            thumbnail: {
                                url: interaction.guild.iconURL ?? '',
                            },
                            footer: {
                                text: `${caller.bot.user?.username} • Tickets`,
                                icon_url: caller.bot.user?.dynamicAvatarURL(),
                            },
                            timestamp: new Date().toISOString(),
                        },
                    ],
                    components: new ComponentBuilder('category')
                        .addActionRow((row) => {
                            row.addNormalButton({
                                label: 'Close',
                                custom_id: `close:${thread.id}`,
                                style: Constants.ButtonStyle.Primary,
                                emoji: '📫',
                            })
                                .addNormalButton({
                                    label: 'Lock',
                                    custom_id: `lock:${thread.id}`,
                                    style: Constants.ButtonStyle.Secondary,
                                    emoji: '🔒',
                                })
                                .addNormalButton({
                                    label: 'Delete',
                                    custom_id: `delete:${thread.id}`,
                                    style: Constants.ButtonStyle.Danger,
                                    emoji: BotEmojis.redX.full,
                                });
                        })
                        .toJSON(),
                });

                await this.resetMessage(caller, category.messageID);

                break;
            }
            case Constants.ComponentType.Button: {
                const params = interaction.data.custom_id.split(':');
                const options = params[1];
                const threadID = params[2];

                const channel = interaction.channel;
                if (!channel) return await interaction.deferUpdate();

                let mod = false;

                if (channel.isTextBased() && channel.inGuild()) {
                    const modPermissions = channel.permissionsOf(user.id);
                    if (modPermissions.has(Constants.PermissionFlagsBits.ManageThreads)) mod = true;
                }

                const thread = await caller.database.threads.get(threadID);
                if (!thread) return await interaction.deferUpdate();

                if (!mod) {
                    return await interaction.createMessage({
                        content: user.mention,
                        embeds: [
                            {
                                description: 'You do not have permission to close this ticket.',
                                color: BotColors.embedGray,
                            },
                        ],
                        flags: Constants.MessageFlags.Ephemeral,
                    });
                }

                const chosenOption = options == 'lock' ? 'lock' : options == 'close' ? 'close' : 'delete';

                const confirmMessage = await ConfirmAction(caller, interaction, {
                    embeds: [
                        {
                            title: `${caller.utils.uppercaseWords(chosenOption)} Ticket`,
                            description: `Are you sure you want to ${chosenOption} this ticket?\n\n-# This command will timeout <t:${moment(Date.now()).add(1, 'minute').add(1, 'seconds').unix()}:R>`,
                            color: BotColors.purple,
                        },
                    ],
                    flags: Constants.MessageFlags.Ephemeral,
                });

                if (confirmMessage.timeout) {
                    return await interaction.editOriginalMessage({
                        embeds: [
                            {
                                title: `${caller.utils.uppercaseWords(chosenOption)} Ticket: Timed Out ${BotEmojis.yellowBang.full}`,
                                description: 'You took too long to decide!',
                                color: BotColors.yellow,
                            },
                        ],
                        components: [],
                    });
                }

                const confirmed = confirmMessage.result;

                if (confirmed) {
                    try {
                        await interaction.deleteOriginalMessage().catch(() => {});
                        await SuccessMessage(
                            interaction,
                            `This ticket will be ${chosenOption == 'lock' ? 'locked' : chosenOption == 'close' ? 'closed' : 'deleted'} in 5 seconds.`,
                        );

                        if (middleware?.guild.logsChannel) {
                            switch (chosenOption) {
                                case 'lock':
                                    await caller.bot.createMessage(middleware.guild.logsChannel, {
                                        //@ts-ignore
                                        content: `[<t:${caller.parsing.unix()}:f>] 🔒 ${user.mention} (\`${user.id}\`) locked a ticket: **${channel.name}**`,
                                    });
                                    break;
                                case 'close':
                                    await caller.bot.createMessage(middleware.guild.logsChannel, {
                                        //@ts-ignore
                                        content: `[<t:${caller.parsing.unix()}:f>] 📫 ${user.mention} (\`${user.id}\`) closed a ticket: **${channel.name}**`,
                                    });
                                    break;
                                case 'delete':
                                    await caller.bot.createMessage(middleware.guild.logsChannel, {
                                        //@ts-ignore
                                        content: `[<t:${caller.parsing.unix()}:f>] 🗑️ ${user.mention} (\`${user.id}\`) deleted a ticket: **${channel.name}**`,
                                    });
                                    break;
                            }
                        }

                        setTimeout(async () => {
                            if (channel.isThread()) {
                                options == 'delete'
                                    ? await caller.database.threads.delete(threadID)
                                    : await caller.database.threads.update(threadID, { closed: true, locked: options == 'lock' });

                                options == 'delete'
                                    ? await channel.delete().catch(() => {})
                                    : await channel.edit({ archived: true, locked: options == 'lock' });
                            }
                        }, 5 * 1000);
                    } catch (error) {
                        caller.logger.error(error);
                        return await ErrorMessage(interaction, `Failed to ${chosenOption} ticket!`, true);
                    }
                } else {
                    return await interaction.editOriginalMessage({
                        embeds: [
                            {
                                title: `${caller.utils.uppercaseWords(chosenOption)} Ticket: Cancelled ${BotEmojis.redX.full}`,
                                description: `The request to ${chosenOption} the thread has been cancelled.`,
                                color: BotColors.red,
                            },
                        ],
                        components: [],
                    });
                }

                break;
            }
            default: {
                //* No other components for now
                break;
            }
        }
    }

    async resetMessage(caller: Stubby, ticketID: string) {
        const ticket = await caller.database.tickets.get(ticketID);
        if (!ticket) return;

        const message = await caller.bot.getMessage(ticket.channelID, ticket.id);
        if (!message) return;

        await caller.bot.editMessage(ticket.channelID, ticket.id, {
            components: message.components,
        });
    }
}
