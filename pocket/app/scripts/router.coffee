class Pocket.Router extends Backbone.Router

  routes:
    "*subroute"     : "modules"

  modules: (subroute) ->
    moduleName = 'users'
    console.log("modules: ",moduleName, subroute);

    unless Pocket.Routers
      Pocket.Routers = {}

    window.hoodieAdmin.modules.find(moduleName).then (module) =>
      moduleViewName = @capitaliseFirstLetter(moduleName)+"View"
      # If module has a Router to handle its own subroutes
      if !Pocket.Routers[moduleViewName] and Pocket[moduleViewName]?.Router
        Pocket.Routers[moduleViewName] = new Pocket[moduleViewName].Router('modules/'+moduleName, {createTrailingSlashRoutes: true});
      else
        # Module has no routes of its own
        view = new Pocket.ModulesView
        pocket.app.views.body.setView(".main", view)
        view.module = module
        view.render()

  capitaliseFirstLetter : (string) ->
    string.charAt(0).toUpperCase() + string.slice(1)


