const { DBHelper } = require("./helper");
const moment = require("moment");
const mysql = require("mysql");
const { pool } = require("../db-settings");

class Verification {
  constructor(steamId, faceitId, discordId, secretCode, expirationDate) {
    this.steamId = steamId;
    this.faceitId = faceitId;
    this.discordId = discordId;
    this.secretCode = secretCode;
    this.expirationDate = expirationDate;
  }

  static pushQuery =
    "INSERT INTO verifications (steam_id, faceit_id, discord_id, secret_code, expiration) VALUES (?);";

  values() {
    return [
      [
        this.steamId,
        this.faceitId,
        this.discordId,
        this.secretCode,
        DBHelper.formatDateTime(this.expirationDate),
      ],
    ];
  }

  async pushToDb() {
    pool.query(Verification.pushQuery, this.values(), function (err, result) {
      if (err) throw err;
      return result;
    });
  }

  async removeFromDb() {
    pool.query(
      `DELETE FROM verifications WHERE faceit_id = '${this.faceitId}'`,
      this.values(),
      function (err, result) {
        if (err) return 0;
        return 1;
      }
    );
  }

  static async removeFromDbByFaceitID(faceitId) {
    pool.query(
      `DELETE FROM verifications WHERE faceit_id = '${faceitId}'`,
      this.values,
      function (err, result) {
        if (err) return 0;
        return 1;
      }
    );
  }

  static async removeFromDbBySteamID(steamId) {
    pool.query(
      `DELETE FROM verifications WHERE steam_id = '${steamId}'`,
      function (err, result) {
        if (err) return 0;
        return 1;
      }
    );
  }

  static async removeFromDbByDiscordID(discordId) {
    pool.query(
      `DELETE FROM verifications WHERE discord_id = '${discordId}'`,
      function (err, result) {
        if (err) return 0;
        return 1;
      }
    );
  }

  static async getByDiscordId(discordId) {
    return new Promise((resolve, reject) => {
      console.log(discordId);
      pool.query(
        `SELECT * FROM verifications WHERE discord_id = ${discordId}`,
        function (err, result) {
          console.log(result);
          if(result.length == 0)
            return resolve(undefined);
          return resolve(new Verification(
            result[0].STEAM_ID,
            result[0].FACEIT_ID,
            result[0].DISCORD_ID,
            result[0].SECRET_CODE,
            result[0].EXPIRATION,
          ));
        }
      );
    });
  }
}

module.exports = { Verification };
