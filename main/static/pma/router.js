uR.router.add({
  "#/floor/(\\w+)/": uR.router.routeElement("pma-map"),
});
uR.router.default_route = uR.router.routeElement("pma-map");
