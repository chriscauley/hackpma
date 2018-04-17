uR.router.add({
  "#/(\\w+)/$": uR.router.routeElement("pma-map"),
  "#/(\\w+)/([^/]+)/$": uR.router.routeElement("pma-map"),
  "#/(\\w+)/([^/]+)/([^/]+)/$": uR.router.routeElement("pma-map"),
});
uR.router.default_route = uR.router.routeElement("pma-map");
uR.router.start();
