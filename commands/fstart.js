const { SlashCommandBuilder, SlashCommandSubcommandGroupBuilder } = require("@discordjs/builders");
const { MessageEmbed, Client, Intents } = require('discord.js');
const bot = require("../index.js");
const { HubThread } = require("../automation/hub");
const { logChannel } = require("../helper/logger.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("fstart")
    .setDescription("Start bot.")
    .setDefaultPermission(true),

  async execute(interaction) {
        var log = logChannel(interaction.client);
        await interaction.reply({ content: 'Sending message to start threads...',ephemeral: true});
        return startAutomations(interaction,log);
  },
};



async function startAutomations(interaction,log){
    await startSingleThread(HubThread,interaction,log);
}


async function startSingleThread(thread,interaction,log){
    var res = await thread.start(interaction);
    console.log(res);
    if(res == 1){
        log.send({ embeds: [new MessageEmbed()
        .setColor('#ff5722')
        .setTitle(thread.logtag)
        .setDescription("Thread started")]});
    }else{
        if(thread.status == 1)
            log.send({ embeds: [new MessageEmbed()
            .setColor('#ff5722')
            .setTitle(thread.logtag)
            .setDescription("Tried to start but thread is already online")]});
        else
            log.send({ embeds: [new MessageEmbed()
            .setColor('#ff5722')
            .setTitle(thread.logtag)
            .setDescription("There was an error trying to start this thread")]});
    }
}