import { Client, Events, GatewayIntentBits, REST, Routes, Collection, Interaction } from 'discord.js';
import { clientId, guildId, token } from './config.json';
import fs from 'node:fs';
import path from 'node:path';

const client: Client<boolean> = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection<string, any>();
const commands: any[] = [];

const foldersPath: string = path.join(__dirname, 'commands');
const commandFolders: string[] = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath: string = path.join(foldersPath, folder);
	const commandFiles: string[] = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath: string = path.join(commandsPath, file);
		const command: any = require(filePath);
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

for (const folder of commandFolders) {
	const commandsPath: string = path.join(foldersPath, folder);
	const commandFiles: string[] = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath: string = path.join(commandsPath, file);
		const command: any = require(filePath);
		if ('data' in command && 'execute' in command) {
			commands.push(command.data.toJSON());
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

const rest: REST = new REST().setToken(token);

(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		const data: any = await rest.put(
			Routes.applicationGuildCommands(clientId, guildId),
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		console.error(error);
	}
})();

client.on(Events.InteractionCreate, async (interaction: Interaction) => {
	if (!interaction.isChatInputCommand()) return;

	const command: any = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

client.once(Events.ClientReady, (readyClient: Client<boolean>) => {
	console.log(`Bot ready! Logged in as ${readyClient.user?.tag}`);
});

client.login(token);
