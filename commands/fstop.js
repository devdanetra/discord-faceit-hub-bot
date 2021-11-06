const { SlashCommandBuilder, SlashCommandSubcommandGroupBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require('discord.js');
const { HubThread } = require("../automation/hub");
const { logChannel } = require("../helper/logger");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("fstop")
    .setDescription("Stops Bot.")
    .setDefaultPermission(true),

  async execute(interaction) {
        var log = logChannel(interaction.client);
        interaction.reply({ content: 'Sending message to stop threads...'});
        return stopAutomations(log);
  },
};



async function stopAutomations(interaction,log){
    await stopSingleThread(HubThread,interaction,log);
}


async function stopSingleThread(thread,interaction,log){
    var res = await thread.stop(interaction);
    if(res == 1){
        log.send({ embeds: [new MessageEmbed()
        .setColor('#ff5722')
        .setTitle(thread.logtag)
        .setDescription("Thread stopped")]});
    }else{
        if(thread.status == 0)
            log.send({ embeds: [new MessageEmbed()
            .setColor('#ff5722')
            .setTitle(thread.logtag)
            .setDescription("Tried to stop but thread is already offline")]});
        else
            log.send({ embeds: [new MessageEmbed()
            .setColor('#ff5722')
            .setTitle(thread.logtag)
            .setDescription("There was an error trying to stop this thread")]});
    }
}