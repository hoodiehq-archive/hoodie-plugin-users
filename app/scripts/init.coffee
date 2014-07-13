window.hoodieAdmin = top.hoodieAdmin
# Nasty hacks and mocks
hoodieAdmin.id = -> 'id'
hoodieAdmin.uuid = -> Math.random().toString()
# maybe return some random ones from findall
hoodieAdmin.user.findAll().done ( results )->
  hoodieAdmin.user.search = -> $.Deferred().resolve(results.slice(0, 10)).promise()

# configure Backbone Layoutmanager
Backbone.Layout.configure

  # augment Backbone Views
  manage: true

  # get precompiled Handlebars template
  fetch: (path) ->
    JST[path]

# init when page loaded
jQuery(document).ready ->
  new Users
