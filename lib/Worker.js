var install = require("./install");

function Worker(config)
{
    install(this, config).then( this.sayHi )
}


Worker.prototype = {
  sayHi: function() {
    console.log("Hi. I'm the new Worker.");
  }
}

module.exports = Worker;