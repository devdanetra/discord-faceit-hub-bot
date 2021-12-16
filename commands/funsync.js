const { SlashCommandBuilder } = require("@discordjs/builders");
const { clear } = require("console");
const { Verification } = require("../db_modules/verification");
const { FaceitPlayer } = require("../faceit_consumer/player");
const { SteamUser } = require("../steam_consumer/user");
const moment = require("moment");
const { DBUser } = require("../db_modules/users");
const { getUserRole } = require("../helper/generalFetcher");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("funsync")
    .setDescription("Unsync your faceit account")
    .setDefaultPermission(true),

  async execute(interaction) {
    try{
        var user = await DBUser.getByDiscordId(interaction.member.id)
        if(user != undefined){
            await interaction.reply({ content: 'Unsyncing user...',ephemeral: true,});
            await interaction.member.roles.remove(await getUserRole(interaction.guild));
            await user.removeFromDb();
            await interaction.editReply({ content: 'Unsynced succesfully.',ephemeral: true,});
        }else{
            interaction.reply({ content: 'You are not synced yet.',ephemeral: true,});
        }
    }catch(e){
      interaction.channel.send({ content: e.message});
    }
  }
};