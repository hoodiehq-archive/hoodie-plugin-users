# Hoodie Worker

This is the base hoodie worker with some basic functionalities 
that your workers can inherit from. Simply add it as dependancy
to your package.json:

```js
{
  "name": "hoodie-worker-worlddomination",
  "dependencies": {
    "hoodie-worker": "git://github.com/hoodiehq/hoodie-worker.git"
  },
  "devDependencies": {
    "mocha": "*"
  },
  "scripts": {
    "test": "mocha",
    "start": "node index.js"
  }
}
```

And then intherit from it.

```js
var util          = require('util');
var HoodieWorker  = require('hoodie-worker');

var Worker = function(config) {
  this.setup(config).then( this.launch.bind(this) )
};
util.inherits(Worker, HoodieWorker);

Worker.prototype.launch = function() {
  // your worker magic starts hier!
}
```

You can use [worker-new](https://github.com/hoodiehq/worker-new)
as a skeleton for your new worlddomination hoodie worker.