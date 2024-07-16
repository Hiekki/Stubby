import { Constants } from 'athena';

const allPermissions = Object.keys(Constants.PermissionFlagsBits) as (keyof typeof Constants.PermissionFlagsBits)[];
export type AllPermissions = (typeof allPermissions)[number];