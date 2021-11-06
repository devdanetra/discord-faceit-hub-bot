const { SlashCommandBuilder } = require("@discordjs/builders");
const { clear } = require("console");
const { Verification } = require("../db_modules/verification");
const { FaceitPlayer } = require("../faceit_consumer/player");
const { SteamUser } = require("../steam_consumer/user");
const moment = require("moment");
const { DBUser } = require("../db_modules/users");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("fsync")
    .setDescription("Sync your faceit account")
    .setDefaultPermission(true)
    .addStringOption((option) =>
      option
        .setName("faceit_nickname")
        .setDescription("Enter your Faceit Nickname (CAPS sensitive)")
    ),

  async execute(interaction) {
    if (interaction.options.data.length == 0)
      return interaction.reply(
        "Please enter your Faceit Name (CAPS sensitive)"
      );

    var faceit_nickname = interaction.options.getString("faceit_nickname");
    var player = await FaceitPlayer.getPlayerByNick(faceit_nickname);
    
    if (player == undefined) {
      return interaction.reply("Nickname not found (CAPS sensitive)");
    }
    console.log("USER ID " + interaction.member.id);
    var currentVerification = await Verification.getByDiscordId(
      interaction.member.id
    );

    console.log(currentVerification);

    if (currentVerification != undefined) {
      return await interaction.reply({
        content: `Add to your steam account name the following token : \n
       ${currentVerification.secretCode} \n\n You have 5 minutes to complete this change, once done you'll be verified.`,
        ephemeral: true,
      });
    } else {
      console.log("no ongoing verification");
      if(await discordAlreadySynced(interaction.member.id)){ //checking if discord already synced to faceit
        console.log("message");
        return await interaction.reply({
          content: `You already have an account synced (!funsync to unsync your account)`,
          ephemeral: true,
        });
      }

      if(await faceitAlreadySynced(faceit_nickname)){ //checking if faceit already synced to other acc
        return await interaction.reply({
          content: `The specified faceit account is synchronized to another user. 
          If you are the legitimate owner, please contact an adminsitrator`,
          ephemeral: true,
        });
      }


      await interaction.reply({
        content: `Generating verification... `,
        ephemeral: true,
      });

      return createVerification(interaction, player);
    }
  },
};

async function createVerification(interaction, player) {
  var randToken =
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
  var expirationDate = moment().add(5, "minutes");

  var verification = new Verification(
    player.steam_id_64,
    player.player_id,
    interaction.member.id,
    randToken,
    expirationDate
  );
  try {
    await verification.pushToDb();
  } catch (err) {
    return await interaction.editReply({
      content: "Couldn't generate verification, please contact an admin.",
      ephemeral: true,
    });
  }
  await interaction.editReply({
    content: `Add to your steam account name the following token : \n ${randToken} \n\n You have 5 minutes to complete this change, once done you'll be verified.`,
    ephemeral: true,
  });
  return startVerificationThread(interaction, verification);
}

async function startVerificationThread(interaction, verification) {
  const interval = setInterval(async function () {
    var steamUser = await SteamUser.getById(verification.steamId);
    if (steamUser.personaname.includes(verification.secretCode)) {
      new DBUser(
        verification.steamId,
        verification.faceitId,
        interaction.member.id
      ).pushToDb();
      await interaction.editReply({
        content: `Account id : ${verification.faceitId} succesfully synchronized.`,
        ephemeral: true,
      });
      verification.removeFromDb();
      return clearInterval(interval);
    }
    if (verification.expirationDate.isBefore(moment())) {
      await interaction.editReply({
        content: `Verification expired, please retry or contact an admin.`,
        ephemeral: true,
      });
      verification.removeFromDb();
      return clearInterval(interval);
    }
  }, 5000);
}



async function discordAlreadySynced(id){
  var user = await DBUser.getByDiscordId(id);
  console.log("user found ->" + user);
  console.log(user != undefined);
  return user != undefined;

}

async function faceitAlreadySynced(nickname){
  var faceitUser = await FaceitPlayer.getPlayerByNick(nickname);
  var user = await DBUser.getByFaceitId(faceitUser.player_id);
  return user != undefined;
}