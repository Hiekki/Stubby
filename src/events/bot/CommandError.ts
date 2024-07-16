import EventBase from '../../types/EventBase';
import { Events, Interaction, CommandErrorData, CommandError } from 'athena';
import Stubby from '../../Bot';

export default class CommandErrorEvent extends EventBase {
    name: keyof Events = 'commandError';
    enabled = true;

    async handle(caller: Stubby, command: string, interaction: Interaction, error: CommandErrorData) {
        if (!this.enabled) return;

        switch (error.type) {
            case CommandError.NotDeveloperGuild: //0
            case CommandError.DeniedUser: //1
            case CommandError.DeniedGuild: //2
            case CommandError.MissingPermission: //3
            case CommandError.OnCooldown: //4
            case CommandError.MiddlewareError: //5
            case CommandError.UncaughtError: //6
                caller.logger.error(`Command ${command} errored with ${error.data}`);
                break;
            default:
                caller.logger.warning(`Command ${command} errored`);
                caller.logger.error(error);
        }
    }
}
