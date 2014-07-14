(function() {

  window.hoodieAdmin = top.hoodieAdmin;

  hoodieAdmin.id = function() {
    return 'id';
  };

  hoodieAdmin.uuid = function() {
    return Math.random().toString().substr(2);
  };

  Backbone.Layout.configure({
    manage: true,
    fetch: function(path) {
      return JST[path];
    }
  });

  jQuery(document).ready(function() {
    return new Users;
  });

}).call(this);

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  window.Users = (function(_super) {

    __extends(Users, _super);

    function Users() {
      this.setAppInfo = __bind(this.setAppInfo, this);

      this.loadAppInfo = __bind(this.loadAppInfo, this);
      window.users = this;
      this.setElement('html');
      this.registerHandlebarsHelpers();
      this.registerListeners();
      this.router = new Users.Router;
      this.app = new Users.ApplicationView;
      Backbone.history.start();
      this.app.render();
    }

    Users.prototype.setElement = function(selector) {
      return this.$el = $(selector);
    };

    Users.prototype.handleConditionalFormElements = function(el, speed) {
      var condition, conditions, requirement, requirementMet, target, _i, _len, _results;
      if (speed == null) {
        speed = 250;
      }
      conditions = $(el).data("conditions");
      conditions = conditions.split(',');
      _results = [];
      for (_i = 0, _len = conditions.length; _i < _len; _i++) {
        condition = conditions[_i];
        requirement = condition.split(':')[0];
        target = condition.split(':')[1];
        requirementMet = false;
        if ($(el).is('input[type=checkbox]')) {
          if ($(el).is(':checked') && requirement === "true") {
            requirementMet = true;
          }
          if (!$(el).is(':checked') && requirement === "false") {
            requirementMet = true;
          }
        }
        if ($(el).val() === requirement) {
          requirementMet = true;
        }
        if (requirementMet) {
          _results.push($(target).slideDown(speed));
        } else {
          _results.push($(target).slideUp(speed));
        }
      }
      return _results;
    };

    Users.prototype.registerListeners = function() {
      var _this = this;
      $("body").on("change", ".formCondition", function(event) {
        return _this.handleConditionalFormElements(event.target);
      });
      return $("body").on("click", ".toggler", function(event) {
        $(this).toggleClass('open');
        return $(this).siblings('.togglee').slideToggle(150);
      });
    };

    Users.prototype.registerHandlebarsHelpers = function() {
      Handlebars.registerHelper('testHelper', function(name, context) {
        return "HANDLEBARS TESTHELPER";
      });
      Handlebars.registerHelper('convertTimestampToISO', function(timestamp) {
        if (!timestamp) {
          return;
        }
        if (timestamp.toString().length === 10) {
          timestamp += '000';
        }
        return JSON.parse(JSON.stringify(new Date(parseInt(timestamp))));
      });
      Handlebars.registerHelper('convertISOToTimestamp', function(ISODate) {
        if (!ISODate) {
          return;
        }
        return new Date(ISODate).getTime();
      });
      Handlebars.registerHelper('convertISOToHuman', function(ISODate) {
        return "hey " + ISODate;
      });
      Handlebars.registerHelper('defaultReplyMailAddress', function() {
        if (!users.appInfo.name) {
          return "please-reply@your-app.com";
        }
        if (users.appInfo.name.indexOf(".") === -1) {
          return "please-reply@" + users.appInfo.name + ".com";
        } else {
          return "please-reply@" + users.appInfo.name;
        }
        return users.appInfo.defaultReplyEmailAddress;
      });
      Handlebars.registerHelper('linkToFutonUser', function(userName) {
        return window.location.origin + '/_api/_utils/document.html?_users/org.couchdb.user:' + userName;
      });
      Handlebars.registerHelper("debug", function(optionalValue) {
        console.log("\nCurrent Context");
        console.log("====================");
        console.log(this);
        if (optionalValue) {
          console.log("Value");
          console.log("====================");
          return console.log(optionalValue);
        }
      });
      Handlebars.registerHelper('inArray', function(haystack, needle, options) {
        if (haystack.indexOf(needle) !== -1) {
          return options.fn(this);
        } else {
          return options.inverse(this);
        }
      });
      Handlebars.registerHelper('positiveSuccessNegativeWarning', function(value) {
        if (value > 0) {
          return 'success';
        } else {
          return 'warning';
        }
      });
      Handlebars.registerHelper('positiveWarningNegativeSuccess', function(value) {
        if (value > 0) {
          return 'warning';
        } else {
          return 'success';
        }
      });
      return null;
    };

    Users.prototype.loadAppInfo = function() {
      return hoodieAdmin.app.getInfo().pipe(this.setAppInfo);
    };

    Users.prototype.setAppInfo = function(info) {
      console.log('info', info);
      return users.appInfo = info;
    };

    return Users;

  })(Backbone.Events);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Users.BaseView = (function(_super) {

    __extends(BaseView, _super);

    function BaseView() {
      return BaseView.__super__.constructor.apply(this, arguments);
    }

    BaseView.prototype.serialize = function() {
      return this;
    };

    BaseView.prototype.beforeRender = function() {
      return this.appInfo = {
        name: "TEST"
      };
    };

    BaseView.prototype.afterRender = function() {
      return $('.timeago').timeago();
    };

    BaseView.prototype.makeURLHuman = function(string) {
      var result;
      this.string = string;
      result = this.string.replace(/-/g, ' ');
      return result = result.charAt(0).toUpperCase() + result.slice(1);
    };

    return BaseView;

  })(Backbone.Layout);

}).call(this);

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Users.UsersView = (function(_super) {

    __extends(UsersView, _super);

    function UsersView() {
      this._updateModule = __bind(this._updateModule, this);

      this.afterRender = __bind(this.afterRender, this);

      this.removeUser = __bind(this.removeUser, this);

      this.removeUserPrompt = __bind(this.removeUserPrompt, this);

      this.onAddUser = __bind(this.onAddUser, this);

      this.update = __bind(this.update, this);
      return UsersView.__super__.constructor.apply(this, arguments);
    }

    UsersView.prototype.template = 'users';

    UsersView.prototype.sort = void 0;

    UsersView.prototype.sortBy = 'signupDate';

    UsersView.prototype.sortDirection = 'sort-up';

    UsersView.prototype.blockSorting = false;

    UsersView.prototype.events = {
      'submit form.config': 'updateConfig',
      'submit form.userSearch': 'search',
      'submit form.updatePassword': 'updatePassword',
      'submit form.updateUsername': 'updateUsername',
      'submit form.addUser': 'addUser',
      'click .addUser button[type="submit"]': 'addUser',
      'click .user a.removeUserPrompt': 'removeUserPrompt',
      'click #confirmUserRemoveModal .removeUser': 'removeUser',
      'click .clearSearch': 'clearSearch',
      'click .sort-header': 'saveSorting'
    };

    UsersView.prototype.update = function() {
      var _this = this;
      return hoodieAdmin.user.findAll().then(function(users, object, appConfig) {
        var _base;
        if (object == null) {
          object = {};
        }
        if (appConfig == null) {
          appConfig = {};
        }
        _this.totalUsers = users.length;
        _this.users = users;
        console.log('users: ', users);
        _this.config = $.extend(_this._configDefaults(), object.config);
        _this.editableUser = null;
        switch (users.length) {
          case 0:
            _this.resultsDesc = "You have no users yet";
            break;
          case 1:
            _this.resultsDesc = "You have a single user";
            break;
          default:
            _this.resultsDesc = "Currently displaying all " + _this.totalUsers + " users";
        }
        (_base = _this.config).confirmationEmailText || (_base.confirmationEmailText = "Hello {name}, Thanks for signing up!");
        return _this.render();
      });
    };

    UsersView.prototype.updateConfig = function(event) {
      event.preventDefault();
      return hoodieAdmin.modules.update('module', 'users', this._updateModule);
    };

    UsersView.prototype.emailTransportNotConfigured = function() {
      var isConfigured, _ref, _ref1;
      isConfigured = ((_ref = this.appConfig) != null ? (_ref1 = _ref.email) != null ? _ref1.transport : void 0 : void 0) != null;
      return !isConfigured;
    };

    UsersView.prototype.addUser = function(event) {
      var $btn, $submitMessage, hoodieId, password, username;
      event.preventDefault();
      $btn = $(event.currentTarget);
      username = $('.addUser .username').val();
      password = $('.addUser .password').val();
      $submitMessage = $btn.siblings('.submitMessage');
      if (username && password) {
        $btn.attr('disabled', 'disabled');
        $btn.text("Adding " + username + "…");
        hoodieId = hoodieAdmin.uuid();
        return hoodieAdmin.user.add('user', {
          id: username,
          name: "user/" + username,
          hoodieId: hoodieId,
          database: "user/" + hoodieId,
          signedUpAt: new Date(),
          roles: [],
          password: password
        }).done(this.onAddUser).fail(function(data) {
          console.log("could not add user: ", data);
          $btn.attr('disabled', null);
          if (data.name === "HoodieConflictError") {
            $submitMessage.text("Sorry, '" + username + "' already exists");
          } else {
            $submitMessage.text("Error: " + data.status + " - " + data.responseText);
          }
          $btn.text("Add user");
          return $btn.attr('disabled', null);
        });
      } else {
        return $submitMessage.text("Please enter a username and a password");
      }
    };

    UsersView.prototype.onAddUser = function(event) {
      var $btn;
      $('.addUser .username').val("");
      $('.addUser .password').val("");
      $btn = $('form.addUser button').text("Add user").attr('disabled', null);
      $('form.addUser .submitMessage').text("Added new user.");
      this.update();
    };

    UsersView.prototype.removeUserPrompt = function(event) {
      var id, type;
      event.preventDefault();
      id = $(event.currentTarget).closest("[data-id]").data('id');
      type = $(event.currentTarget).closest("[data-type]").data('type');
      return $('#confirmUserRemoveModal').modal('show').data({
        id: id,
        type: type
      }).find('.modal-body').text('Really remove the user ' + id + '? This cannot be undone!').end().find('.modal-title').text('Remove user ' + id).end();
    };

    UsersView.prototype.removeUser = function(event) {
      var id, type,
        _this = this;
      event.preventDefault();
      id = $('#confirmUserRemoveModal').data('id');
      type = $('#confirmUserRemoveModal').data('type');
      return hoodieAdmin.user.remove(type, id).then(function() {
        $('[data-id="' + id + '"]').remove();
        $('#confirmUserRemoveModal').modal('hide');
        $('body').removeClass('modal-open');
        $('.modal-backdrop').remove();
        return _this.update();
      });
    };

    UsersView.prototype.editUser = function(id) {
      var _this = this;
      return $.when(hoodieAdmin.user.find('user', id)).then(function(user) {
        _this.editableUser = user;
        _this.render();
      });
    };

    UsersView.prototype.updateUsername = function(event) {
      var $btn, $form, id;
      event.preventDefault();
      id = $(event.currentTarget).closest('form').data('id');
      $form = $(event.currentTarget);
      return $btn = $form.find('[type="submit"]');
    };

    UsersView.prototype.updatePassword = function(event) {
      var $btn, $form, id, password;
      event.preventDefault();
      id = $(event.currentTarget).closest('form').data('id');
      $form = $(event.currentTarget);
      $btn = $form.find('[type="submit"]');
      password = $form.find('[name="password"]').val();
      if (password) {
        $btn.attr('disabled', 'disabled');
        $form.find('.submitMessage').text("Updating password");
        return hoodieAdmin.user.update('user', id, {
          password: password
        }).done(function(data) {
          $btn.attr('disabled', null);
          return $form.find('.submitMessage').text("Password updated");
        }).fail(function(data) {
          $btn.attr('disabled', null);
          return $form.find('.submitMessage').text("Error: could not update password");
        });
      } else {
        return $form.find('.submitMessage').text("You didn't change anything.");
      }
    };

    UsersView.prototype.search = function(event) {
      var _this = this;
      event.preventDefault();
      this.searchQuery = $('input.search-query', event.currentTarget).val();
      if (!this.searchQuery) {
        this.resultsDesc = "Please enter a search term first";
        this.render();
        return;
      }
      return hoodieAdmin.user.search(this.searchQuery).then(function(users) {
        _this.users = users;
        switch (users.length) {
          case 0:
            _this.resultsDesc = "No users matching '" + _this.searchQuery + "'";
            break;
          case 1:
            _this.resultsDesc = "" + users.length + " user matching '" + _this.searchQuery + "'";
            break;
          default:
            _this.resultsDesc = "" + users.length + " users matching '" + _this.searchQuery + "'";
        }
        return _this.render();
      });
    };

    UsersView.prototype.clearSearch = function(event) {
      event.preventDefault();
      this.searchQuery = null;
      return this.update();
    };

    UsersView.prototype.saveSorting = function(event) {
      if (!this.blockSorting) {
        this.sortBy = $('#userList .sort-up, #userList .sort-down').data('sort-by');
        if (this.sortBy) {
          this.sortDirection = 'sort-down';
          if ($('#userList .sort-up').length !== 0) {
            return this.sortDirection = 'sort-up';
          }
        }
      }
    };

    UsersView.prototype.afterRender = function() {
      var sortHeader, userList;
      userList = document.getElementById('userList');
      if (userList) {
        this.sort = new Tablesort(userList);
        this.blockSorting = true;
        sortHeader = $('#userList [data-sort-by="' + this.sortBy + '"]');
        sortHeader.click();
        if (this.sortDirection === 'sort-up') {
          sortHeader.click();
        }
        this.blockSorting = false;
      }
      this.$el.find('.formCondition').each(function(index, el) {
        return users.handleConditionalFormElements(el, 0);
      });
      return UsersView.__super__.afterRender.apply(this, arguments);
    };

    UsersView.prototype._updateModule = function(module) {
      module.config.confirmationMandatory = this.$el.find('[name=confirmationMandatory]').is(':checked');
      module.config.confirmationEmailFrom = this.$el.find('[name=confirmationEmailFrom]').val();
      module.config.confirmationEmailSubject = this.$el.find('[name=confirmationEmailSubject]').val();
      module.config.confirmationEmailText = this.$el.find('[name=confirmationEmailText]').val();
      return module;
    };

    UsersView.prototype._configDefaults = function() {};

    return UsersView;

  })(Users.BaseView);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Users.ApplicationView = (function(_super) {

    __extends(ApplicationView, _super);

    function ApplicationView() {
      return ApplicationView.__super__.constructor.apply(this, arguments);
    }

    ApplicationView.prototype.events = {
      "click a": "handleLinks"
    };

    ApplicationView.prototype.views = {
      "body": new Users.UsersView
    };

    ApplicationView.prototype.initialize = function() {
      ApplicationView.__super__.initialize.apply(this, arguments);
      this.setElement($('html'));
      this.render();
      return this.views.body.update();
    };

    ApplicationView.prototype.handleLinks = function(event) {
      var path;
      path = $(event.target).attr('href');
      if (/\.pdf$/.test(path)) {
        return true;
      }
      if (/^\/[^\/]/.test(path)) {
        users.router.navigate(path.substr(1), true);
        return false;
      }
    };

    return ApplicationView;

  })(Users.BaseView);

}).call(this);

(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Users.Router = (function(_super) {

    __extends(Router, _super);

    function Router() {
      return Router.__super__.constructor.apply(this, arguments);
    }

    Router.prototype.routes = {
      "": "default",
      "user/:id": "editUser"
    };

    Router.prototype.initialize = function() {
      return users.router = this;
    };

    Router.prototype["default"] = function() {
      return users.app.views.body.update();
    };

    Router.prototype.editUser = function(id) {
      return users.app.views.body.editUser(id);
    };

    return Router;

  })(Backbone.Router);

}).call(this);

this["JST"] = this["JST"] || {};

this["JST"]["users"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression, self=this, helperMissing=helpers.helperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n  ";
  stack1 = helpers['with'].call(depth0, depth0.editableUser, {hash:{},inverse:self.noop,fn:self.program(2, program2, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  ";
  return buffer;
  }
function program2(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n  <h2>Edit user '";
  if (stack1 = helpers.id) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.id; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "'</h2>\n  <form class=\"updatePassword\" data-id=\"";
  if (stack1 = helpers.id) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.id; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\">\n    <fieldset>\n      <label for=\"input-1\">";
  if (stack1 = helpers.id) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.id; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "'s password</label>\n      <input type=\"text\" class=\"form-control\" name=\"password\" placeholder=\"password can not be empty\">\n      <button class=\"btn\" type=\"submit\">Update password</button>\n      <span class=\"submitMessage\"></span>\n    </fieldset>\n  </form>\n  <a href=\"#\">back</a>\n  ";
  return buffer;
  }

function program4(depth0,data) {
  
  var buffer = "", stack1, stack2;
  buffer += "\n  <!--\n  <h2>Settings</h2>\n  <p>Configure whether users must confirm their signup and if yes, set up the email they will receive for this purpose.</p>\n  <form>\n    ";
  stack1 = helpers['if'].call(depth0, depth0.emailTransportNotConfigured, {hash:{},inverse:self.program(7, program7, data),fn:self.program(5, program5, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </form>\n  <hr>\n  -->\n\n  <h2>Add new user</h2>\n  <form action=\"\" class=\"addUser\">\n    <fieldset>\n      <div class=\"group\">\n        <label for=\"\">New user's name</label>\n        <input type=\"text\" class=\"form-control username\" placeholder=\"User name\" required=\"\">\n        <label for=\"\">New user's password</label>\n        <input type=\"text\" class=\"form-control password\" placeholder=\"Password\" required=\"\">\n        <button class=\"submit btn ok\" type=\"submit\">Add user</button>\n        <span class=\"submitMessage\"></span>\n      </div>\n    </fieldset>\n  </form>\n\n  <h2>Search for users</h2>\n  <form action=\"\" class=\"userSearch\">\n    <fieldset>\n      <div class=\"group\">\n        <label for=\"\">Search term</label>\n        <input type=\"text\" class=\"form-control search-query\" placeholder=\"Username\"";
  stack1 = helpers['if'].call(depth0, depth0.searchQuery, {hash:{},inverse:self.noop,fn:self.program(9, program9, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += ">\n        <p class=\"help-block\">Search only applies to usernames.</p>\n        <button class=\"submit btn ok\" type=\"submit\">Search</button>\n        ";
  stack1 = helpers['if'].call(depth0, depth0.searchQuery, {hash:{},inverse:self.noop,fn:self.program(11, program11, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n      </div>\n    </fieldset>\n  </form>\n\n  <h2>Your users</h2>\n  <div class=\"content centered\">\n    <div class=\"tableStatus\">\n      <p class=\"currentSearchTerm muted\">";
  if (stack1 = helpers.resultsDesc) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.resultsDesc; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "</p>\n      <p class=\"currentSearchMetrics muted\">Showing "
    + escapeExpression(((stack1 = ((stack1 = depth0.users),stack1 == null || stack1 === false ? stack1 : stack1.length)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + " of ";
  if (stack2 = helpers.totalUsers) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.totalUsers; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + " users</p>\n    </div>\n    ";
  stack2 = helpers['if'].call(depth0, depth0.users, {hash:{},inverse:self.noop,fn:self.program(13, program13, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n    ";
  stack2 = helpers['if'].call(depth0, depth0.users, {hash:{},inverse:self.noop,fn:self.program(22, program22, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n    ";
  return buffer;
  }
function program5(depth0,data) {
  
  
  return "\n    <section>\n      <div class=\"control-group\">\n        <label>\n          Signup confirmation\n        </label>\n        <div class=\"controls\">\n          <span class=\"note\">Email needs to be configured in <a href=\"/modules/appconfig\">Appconfig</a> before enabling signup confirmation</span>\n        </div>\n      </div>\n    </section>\n    ";
  }

function program7(depth0,data) {
  
  var buffer = "", stack1, stack2;
  buffer += "\n    <section>\n      <div class=\"control-group\">\n        <label>\n          Signup confirmation\n        </label>\n        <div class=\"controls\">\n          <label class=\"checkbox\">\n            <input type=\"checkbox\" name=\"confirmationMandatory\" class=\"formCondition\" data-conditions=\"true:.confirmationOptions\"> is mandatory\n          </label>\n        </div>\n      </div>\n    </section>\n\n    <section class=\"confirmationOptions\">\n      <div class=\"control-group\">\n        <label>\n          From address\n        </label>\n        <div class=\"controls\">\n          <input type=\"email\" name=\"confirmationEmailFrom\" value=\""
    + escapeExpression(((stack1 = ((stack1 = depth0.config),stack1 == null || stack1 === false ? stack1 : stack1.confirmationEmailFrom)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\" placeholder=\"";
  if (stack2 = helpers.defaultReplyMailAddress) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.defaultReplyMailAddress; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "\" required>\n          <span class=\"note\">From address for all of your app's emails.</span>\n        </div>\n      </div>\n    </section>\n\n    <section class=\"confirmationOptions\">\n      <div class=\"control-group\">\n        <label>\n          Subject line\n        </label>\n        <div class=\"controls\">\n          <input type=\"text\" name=\"confirmationEmailSubject\" value=\""
    + escapeExpression(((stack1 = ((stack1 = depth0.config),stack1 == null || stack1 === false ? stack1 : stack1.confirmationEmailSubject)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\" placeholder=\"Please confirm your signup at "
    + escapeExpression(((stack1 = ((stack1 = depth0.appInfo),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\">\n        </div>\n      </div>\n    </section>\n\n    <section class=\"confirmationOptions\">\n      <div class=\"control-group\">\n        <label>\n          Body\n        </label>\n        <div class=\"controls\">\n          <textarea rows=\"4\" name=\"confirmationEmailText\">"
    + escapeExpression(((stack1 = ((stack1 = depth0.config),stack1 == null || stack1 === false ? stack1 : stack1.confirmationEmailText)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</textarea>\n        </div>\n      </div>\n    </section>\n\n    <section>\n      <div class=\"control-group\">\n        <label>\n          &nbsp;\n        </label>\n        <div class=\"controls\">\n          <button class=\"btn\" type=\"submit\">Update</button>\n        </div>\n      </div>\n    </section>\n    ";
  return buffer;
  }

function program9(depth0,data) {
  
  var buffer = "", stack1;
  buffer += " value=\"";
  if (stack1 = helpers.searchQuery) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.searchQuery; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\"";
  return buffer;
  }

function program11(depth0,data) {
  
  
  return "\n        <button class=\"btn clearSearch\">Clear search</button>\n        ";
  }

function program13(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n    <table id=\"userList\" class=\"table users table-striped\">\n      <thead>\n        <tr>\n          <th data-sort-by=\"username\">Username</th>\n          <th data-sort-by=\"signupDate\">Signup date</th>\n          <th data-sort-by=\"state\">State</th>\n          <th class=\"no-sort\"></th>\n        </tr>\n      </thead>\n      <tbody>\n        ";
  stack1 = helpers.each.call(depth0, depth0.users, {hash:{},inverse:self.noop,fn:self.program(14, program14, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n      </tbody>\n    </table>\n    ";
  return buffer;
  }
function program14(depth0,data) {
  
  var buffer = "", stack1, stack2, options;
  buffer += "\n        <tr data-id=\"";
  if (stack1 = helpers.id) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.id; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" data-type=\"";
  if (stack1 = helpers.type) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.type; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" class=\"user\">\n          <td>";
  if (stack1 = helpers.id) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.id; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</td>\n          <td data-sort=\"";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.convertISOToTimestamp || depth0.convertISOToTimestamp),stack1 ? stack1.call(depth0, depth0.signedUpAt, options) : helperMissing.call(depth0, "convertISOToTimestamp", depth0.signedUpAt, options)))
    + "\" class=\"timeago\" title=\"";
  if (stack2 = helpers.signedUpAt) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.signedUpAt; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "\">";
  if (stack2 = helpers.signedUpAt) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.signedUpAt; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "</td>\n          <td>\n            ";
  stack2 = helpers['if'].call(depth0, depth0.$error, {hash:{},inverse:self.program(17, program17, data),fn:self.program(15, program15, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n          </td>\n          <td class=\"no-sort\">\n            <a href=\"#user/";
  if (stack2 = helpers.id) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.id; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "\" class=\"edit\">edit</a> /\n            <a href=\"#\" class=\"removeUserPrompt\">delete</a> /\n            <a href=\"";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.linkToFutonUser || depth0.linkToFutonUser),stack1 ? stack1.call(depth0, depth0.name, options) : helperMissing.call(depth0, "linkToFutonUser", depth0.name, options)))
    + "\">futon</a>\n          </td>\n        </tr>\n        ";
  return buffer;
  }
function program15(depth0,data) {
  
  var buffer = "", stack1, stack2, options;
  buffer += "\n            <div class=\"inTableError\">\n              <span class=\"error\">";
  if (stack1 = helpers.$state) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.$state; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</span><i class=\"icon-warning-sign\"></i>\n              <div class=\"errorTooltip\">\n                <i class=\"icon-warning-sign\"></i><strong>"
    + escapeExpression(((stack1 = ((stack1 = depth0.$error),stack1 == null || stack1 === false ? stack1 : stack1.name)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</strong>\n                <p>"
    + escapeExpression(((stack1 = ((stack1 = depth0.$error),stack1 == null || stack1 === false ? stack1 : stack1.message)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</p>\n                <p><a href=\"";
  options = {hash:{},data:data};
  buffer += escapeExpression(((stack1 = helpers.linkToFutonUser || depth0.linkToFutonUser),stack1 ? stack1.call(depth0, depth0.name, options) : helperMissing.call(depth0, "linkToFutonUser", depth0.name, options)))
    + "\">";
  if (stack2 = helpers.id) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.id; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "'s user page in Futon</a></p>\n              </div>\n            </div>\n            ";
  return buffer;
  }

function program17(depth0,data) {
  
  var buffer = "", stack1, stack2, options;
  buffer += "\n            ";
  options = {hash:{},inverse:self.program(20, program20, data),fn:self.program(18, program18, data),data:data};
  stack2 = ((stack1 = helpers.inArray || depth0.inArray),stack1 ? stack1.call(depth0, depth0.roles, "confirmed", options) : helperMissing.call(depth0, "inArray", depth0.roles, "confirmed", options));
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n            ";
  return buffer;
  }
function program18(depth0,data) {
  
  
  return "\n            <span class=\"pill success\">confirmed</span>\n            ";
  }

function program20(depth0,data) {
  
  
  return "\n            <span class=\"pill warn\">unconfirmed</span>\n            ";
  }

function program22(depth0,data) {
  
  var buffer = "", stack1, stack2;
  buffer += "\n    <div class=\"tableStatus\">\n      <p class=\"currentSearchTerm muted\">";
  if (stack1 = helpers.resultsDesc) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.resultsDesc; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "</p>\n      <p class=\"currentSearchMetrics muted\">Showing "
    + escapeExpression(((stack1 = ((stack1 = depth0.users),stack1 == null || stack1 === false ? stack1 : stack1.length)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + " of ";
  if (stack2 = helpers.totalUsers) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.totalUsers; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + " users</p>\n    </div>\n    ";
  return buffer;
  }

  buffer += "<div class=\"container\">\n  <h1>Users</h1>\n  ";
  stack1 = helpers['if'].call(depth0, depth0.editableUser, {hash:{},inverse:self.program(4, program4, data),fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </div>\n\n  <div class=\"modal fade\" id=\"confirmUserRemoveModal\" tabindex=\"-1\" role=\"dialog\" aria-labelledby=\"myModalLabel\" aria-hidden=\"true\">\n    <div class=\"modal-dialog\">\n      <div class=\"modal-content\">\n        <div class=\"modal-header\">\n          <button type=\"button\" class=\"close\" data-dismiss=\"modal\"><span aria-hidden=\"true\">&times;</span><span class=\"sr-only\">Close</span></button>\n          <h4 class=\"modal-title\" id=\"myModalLabel\">Modal title</h4>\n        </div>\n        <div class=\"modal-body\">\n          ...\n        </div>\n        <div class=\"modal-footer\">\n          <button class=\"closeModal btn unobtrusive\" data-dismiss=\"modal\" aria-hidden=\"true\">Cancel</button>\n          <button class=\"removeUser btn danger\">Remove user</button>\n        </div>\n      </div>\n    </div>\n  </div>\n\n</div>\n";
  return buffer;
  });