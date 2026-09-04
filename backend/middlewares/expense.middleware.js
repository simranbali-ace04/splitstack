const fs = require("fs");

function logResReq(filename) {
  return (req, res, next) => {
    const log = `${new Date().toISOString()} ${req.method} ${req.url}\n`;
    fs.appendFile(filename, log, (err) => {
      if (err) {
        console.log("Error while logging");
      }
      next();
    });
  };
}
module.exports = {
  logResReq,
};
