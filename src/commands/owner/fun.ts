import Stubby from '../../Bot.js';
import {
    Command,
    CommandBuilder,
    CommandInteraction,
    Constants,
    ModalSubmitInteraction,
    ModalBuilder,
    ComponentBuilder,
    ComponentInteraction,
    AutocompleteInteraction,
} from 'athena';

export default class Fun extends Command<Stubby> {
    // ID should always be set to the command name from the definition below
    id = 'fun';
    // Define the command
    definition = new CommandBuilder('fun', 'does some fun stuff')
        // Set the command type to ChatInput | User | Message
        .setCommandType(Constants.ApplicationCommandType.ChatInput)
        // A Sumbcommand
        .addSubcommand('modal', 'do a modal thing')
        .addSubcommand('components', 'do a components thing')
        .addSubcommand('autocomplete', 'autocomplete, baby', (sub) =>
            // A String Option
            sub
                .addStringOption({
                    name: 'first_project',
                    description: 'list of projects',
                    required: true,
                    autocomplete: true,
                })
                .addStringOption({
                    name: 'second_project',
                    description: 'list of projects',
                    required: true,
                    autocomplete: true,
                }),
        );

    // If you only want Developers to use this command, set this to true
    developerOnly = true;
    // If you only want this command to be used in specific guilds, add the guild IDs here
    guilds = ['671824837899059210'];

    // This is where you would handle the command
    async handleCommand(caller: Stubby, command: CommandInteraction) {
        try {
            switch (command.subcommand) {
                case 'modal': {
                    // Easy way to create a modal
                    // Inside of ModalBuilder, the custom_id should always start with the command name
                    // If you want to have multiple Modals within one command, you can specify `:modal` or another identifier that you can use later to differentiate the modals the user is currently interacting with
                    let modal = new ModalBuilder('Some Modal', 'fun:modal')
                        // The custom_id here is for identifying the field later
                        .addTextInput({
                            label: 'Enter a thing',
                            custom_id: 'title',
                            style: Constants.TextInputStyle.Short,
                        })
                        .addTextInput({
                            label: 'Enter a long thing',
                            custom_id: 'description',
                            style: Constants.TextInputStyle.Paragraph,
                        });

                    // Send the modal to the user
                    // Handle the modal in the handleModal function below
                    await command.createModal(modal.toJSON());
                    break;
                }
                case 'components': {
                    // Easy way to create components
                    // Inside of ComponentBuilder, the prefix (if you use one) should be the command name.
                    // This prefix will always be added to your custom_id's later with `fun:` (fun is example here, remember it should be command name)
                    const components = new ComponentBuilder('fun')
                        .addActionRow((row) =>
                            row
                                // This custom_id, for example, will be `fun:click1` for you to use later.
                                .addNormalButton({
                                    label: 'Click me',
                                    custom_id: 'click1',
                                    style: Constants.ButtonStyle.Primary,
                                })
                                .addURLButton({ label: 'Google', url: 'https://google.com' })
                                // This custom_id, for example, will be `fun:click2` for you to use later.
                                .addNormalButton({
                                    label: 'Cant Click me',
                                    custom_id: 'click2',
                                    style: Constants.ButtonStyle.Secondary,
                                    disabled: true,
                                })
                                // This custom_id, for example, will be `fun:click3` for you to use later.
                                .addNormalButton({
                                    label: 'Danger',
                                    custom_id: 'click3',
                                    style: Constants.ButtonStyle.Danger,
                                })
                                // This custom_id, for example, will be `fun:click4` for you to use later.
                                .addNormalButton({
                                    label: 'Success',
                                    custom_id: 'click4',
                                    style: Constants.ButtonStyle.Success,
                                }),
                        )
                        // This custom_id, for example, will be `fun:select` for you to use later.
                        .addActionRow((row) =>
                            row.addStringSelect({
                                placeholder: 'Select me',
                                custom_id: 'select',
                                options: [
                                    { label: 'Option 1', value: '1' },
                                    { label: 'Option 2', value: '2' },
                                ],
                            }),
                        )
                        .toJSON();

                    // Send the message to the user with the components from above
                    // Handle the component interaction in the handleComponent function below
                    await command.createMessage({
                        embeds: [
                            {
                                title: 'Some Embed',
                                description: 'Some Description',
                                color: 0x00ff00,
                            },
                        ],
                        components: components,
                    });
                    break;
                }
                case 'autocomplete': {
                    await command.createMessage({
                        content: `You chose ${command.getRequiredString('first_project')} and ${command.getRequiredString('second_project')}.`,
                    });
                    break;
                }
            }
        } catch (error) {
            caller.parsing.commandError(error);
        }
    }

    // This is where you would handle the modal submission
    async handleModal(caller: Stubby, interaction: ModalSubmitInteraction) {
        await interaction.createMessage({
            content: `You entered ${interaction.fields[0].value} for title text, and \`${interaction.fields[1].value}\` for description text.`,
        });
    }

    // This is where you would handle the component interaction
    async handleComponent(caller: Stubby, interaction: ComponentInteraction) {
        switch (interaction.data.component_type) {
            // This is where you would handle the button interaction
            // This doesn't have to be specified if you don't use Select menus:
            // You could do a switch between your custom_id's here if you have multiple buttons and want to handle them differently.
            case Constants.ComponentType.Button: {
                await interaction.createMessage({ content: `You clicked ${interaction.data.custom_id}` });
                break;
            }
            // This is where you would handle the select menu interaction
            case Constants.ComponentType.StringSelect: {
                await interaction.createMessage({ content: `You selected ${interaction.data.values.join(', ')}` });
                break;
            }
        }
    }

    // This is where you would handle the autocomplete interaction
    async handleAutocomplete(caller: Stubby, interaction: AutocompleteInteraction) {
        // This is an example list. You could fetch this from a database or an API.
        const projectList = ['Zira', 'HepBoat', 'HepGG', 'Zira Music', 'KeyBot', 'ALKMY', 'Picsart'];
        // This will get the focused field they are currently typing in.
        const focused = interaction.focused()?.value as string;
        // This will filter the list of projects based on what they are typing in the focused field.
        // It will then map the results to an object that the autocomplete can understand.
        // It will then slice the results to a maximum of 25. (discord limit) (IMPORTANT STEP)
        const results = projectList
            .filter((project) => project.toLowerCase().includes(focused.toLowerCase()))
            .map((project) => ({ name: project, value: project }))
            .slice(0, 25);
        // This will acknowledge the autocomplete with the results.
        return await interaction.acknowledge(results);
    }
}
