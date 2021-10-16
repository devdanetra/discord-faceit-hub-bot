const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { clientId, guildId, token, roleIDs } = require('./config.json');


const adminPerms = [
	{
		id: roleIDs.admin,
		type: 'ROLE',
		permission: true,
	},
];

const modPerms = [
	{
		id: roleIDs.mod,
		type: 'ROLE',
		permission: true,
	},
];

const userPerms = [
	{
		id: roleIDs.user,
		type: 'ROLE',
		permission: true,
	},
];

const commands = [
	new SlashCommandBuilder().setName('fadmin').setDescription('Administration of faceit integration').setDefaultPermission(false)
	.addSubcommand(command => command.setName("user").setDescription("Adminstrate users"))
	.addSubcommand(command => command.setName("hub").setDescription("Adminstrate hub"))
	.addSubcommand(command => command.setName("start").setDescription("start automation"))
	.addSubcommand(command => command.setName("stop").setDescription("stop automation")),
	new SlashCommandBuilder().setName('fsync').setDescription('Manage your synced faceit account').setDefaultPermission(false),
	new SlashCommandBuilder().setName('fstats').setDescription('Get stats from FACEIT').setDefaultPermission(false)
	.addUserOption(userOption => userOption.setName("user").setDescription("User stats"))
]

commands.map(command => command.toJSON());

console.log(commands)

const rest = new REST({ version: '9' }).setToken(token);

(async () => {
	try {
		await rest.put(
			Routes.applicationGuildCommands(clientId, guildId),
			{ body: commands },
		);

		console.log('Successfully registered application commands.');
	} catch (error) {
		console.error(error);
	}
})();