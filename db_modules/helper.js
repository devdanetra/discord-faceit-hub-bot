const moment = require("moment");

class DBHelper {
  static formatDateTime(date) {
    return date.format("YYYY-MM-DD HH:mm:ss");
  }
}

module.exports = { DBHelper };
