class Pocket.Router extends Backbone.Router

  routes:
    ""              : "default"
    "user/:id"      : "editUser"

  default: ->
    console.log "default"
    pocket.app.views.body.update()

  editUser: (id) ->
    console.log "editUser"
    pocket.app.views.body.editUser(id)