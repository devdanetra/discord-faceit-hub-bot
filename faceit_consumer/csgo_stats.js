const { default: axios } = require("axios");
const { apiSource, apiToken } = require("../config.json");

class CSGOstats {
  static endpoint = apiSource + "players";

  static async getById(id) {
    const response = await axios
      .get(CSGOstats.endpoint + "/" + id + "/stats/csgo", {
        headers: { Authorization: `Bearer ${apiToken}` },
      })
      .catch(function (error) {
        return error.response;
      });
    switch (
      response.status //temp solution
    ) {
      case 404:
        return undefined;
      default:
        var result = new CSGOstats();
        Object.assign(result, response.data);
        return result;
    }
  }
}

module.exports = { CSGOstats };
