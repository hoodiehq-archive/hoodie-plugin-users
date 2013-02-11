nodemailer  = require("nodemailer");
var transportMock = { 
  sendMail : jasmine.createSpy('sendMail'),
  close : jasmine.createSpy('close')
};
beforeEach( function() {
  spyOn(nodemailer, "createTransport").andReturn( transportMock );  
});
module.exports = nodemailer;
module.exports.transportMock = transportMock;