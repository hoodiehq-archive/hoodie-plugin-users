class Users.Router extends Backbone.Router

  routes:
    ""              : "default"
    "user/:id"      : "editUser"

  default: ->
    users.app.views.body.update()

  editUser: (id) ->
    users.app.views.body.editUser(id)