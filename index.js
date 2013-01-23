var Worker = require("./lib/worker.js");
var fs     = require("fs");

var package_json = JSON.parse(fs.readFileSync("./package.json"));
// turn 'hoodie-worker-whatever' in 'whatever'
var workerName   = package_json.name.substr(14);

var config = {
    name: workerName,
    server: process.env.HOODIE_SERVER || "http://127.0.0.1:5984",
    admin: {
      user: process.env["HOODIE_ADMIN_USER"],
      pass: process.env["HOODIE_ADMIN_PASS"]
    },
    persistent_since_storage: false
};
var worker = new Worker(config);
