var Worker = require("./lib/Worker.js");

var config = {
    server: process.env.HOODIE_SERVER || "http://127.0.0.1:5984",
    admin: {
      user: process.env["HOODIE_ADMIN_USER"],
      pass: process.env["HOODIE_ADMIN_PASS"]
    },
    persistent_since_storage: false
};
var worker = new Worker(config);
