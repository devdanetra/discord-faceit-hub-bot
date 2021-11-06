const { default: axios } = require("axios");
const { apiSource, apiToken } = require("../config.json");

class FaceitTeam {
  static endpoint = apiSource + "matches";

  static getByID = async function (id) {
    const response = await axios
      .get(FaceitTeam.endpoint + "/" + id, {
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
        var result = new FaceitTeam();
        Object.assign(result, response.data);
        return result;
    }
  };
}

module.exports = { FaceitTeam };
