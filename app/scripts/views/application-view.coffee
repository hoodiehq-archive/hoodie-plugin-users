class Pocket.ApplicationView extends Pocket.BaseView

  events:
    "click a"       : "handleLinks"

  views:
    "body" : new Pocket.UsersView

  initialize: ->
    super

    @setElement( $('html') )
    @render()
    @views.body.update()

  handleLinks: (event) ->
    path = $(event.target).attr 'href'
    if /\.pdf$/.test path
      return true
    if /^\/[^\/]/.test(path)
      pocket.router.navigate path.substr(1), true
      return false
