const { DBHelper } = require("./helper");
const { DB_HOST, DB_NAME, DB_PWD, DB_USER } = require("../config.json");
const moment = require("moment");
const mysql = require("mysql");
const { pool } = require("../db-settings");

class DBUser {
  constructor(steamId, faceitId, discordId, lastUpdateDate, creationDate) {
    this.steamId = steamId;
    this.faceitId = faceitId;
    this.discordId = discordId;
    this.lastUpdateDate = lastUpdateDate;
    this.creationDate = creationDate;
  }

  static pushQuery =
    "REPLACE INTO users (steam_id, faceit_id, discord_id, last_update_date, creation_date) VALUES (?);";

  values() {
    return [
      [
        this.steamId,
        this.faceitId,
        this.discordId,
        this.lastUpdateDate,
        this.creationDate,
      ],
    ];
  }

  async pushToDb() {
    pool.query(
      DBUser.pushQuery,
      this.values(),
      function (err, result) {
        if (err) throw err;
        return result;
      }
    );
  }

  async removeFromDb() {
    this.removeFromDbByFaceitID(this.faceitId);
  }

  async removeFromDbByFaceitID(faceitId) {
    pool.query(
      `DELETE FROM users WHERE faceit_id = '${faceitId}'`,
      function (err, result) {
        if (err) return 0;
        return 1;
      }
    );
  }
  async removeFromDbBySteamID(steamId) {
    pool.query(
      `DELETE FROM users WHERE steam_id = '${steamId}'`,
      function (err, result) {
        if (err) return 0;
        return 1;
      }
    );
  }
  async removeFromDbByDiscordID(discordId) {
    pool.query(
      `DELETE FROM users WHERE discord_id = '${discordId}'`,
      function (err, result) {
        if (err) return 0;
        return 1;
      }
    );
  }

  static async getByDiscordId(discordId) {
    return new Promise((resolve, reject) => {
      pool.query(
        `SELECT * FROM users WHERE discord_id = ${discordId}`,
        function (err, result) {
          if(result == undefined || err || result.length == 0)
            return resolve(undefined);
          return resolve(new DBUser(
            result[0].STEAM_ID,
            result[0].FACEIT_ID,
            result[0].DISCORD_ID,
            result[0].LAST_UPDATE_DATE,
            result[0].CREATION_DATE,
          ));
        }
      );
    });
  }

  static async getByFaceitId(faceitId) {
    return new Promise((resolve, reject) => {
      pool.query(
        `SELECT * FROM users WHERE faceit_id = "${faceitId}"`,
        function (err, result) {
          if(result == undefined || err || result.length == 0)
            return resolve(undefined);
          return resolve(new DBUser(
            result[0].STEAM_ID,
            result[0].FACEIT_ID,
            result[0].DISCORD_ID,
            result[0].LAST_UPDATE_DATE,
            result[0].CREATION_DATE,
          ));
        }
      );
    });
  }
}

module.exports = { DBUser };
