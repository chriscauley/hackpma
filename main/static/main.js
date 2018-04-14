window.pma = window.pma || {};
uR.ready(function() {
  pma.map_config = new uR.Config("display",[
    { name: 'floor', value: "first" }
  ]);
  class Map extends uR.canvas.CanvasObject {
    constructor(opts={}) {
      super(opts)
      this.newCanvas({ controller: true });
      var floor = pma.map_config.get("floor");
      var self = this;
      uR.storage.remote(`/api/location/?per_page=0&floor=${floor}`,function(data) {
        self.data = data;
        self.showRooms(data.results);
        self.draw();
      });
    }
    mouseup(e) {
      var mouse_x = e.offsetX;
      var mouse_y = e.offsetY;
      for (var i=0; i<this.visible_rooms.length; i++) {
        var room = this.visible_rooms[i];
        if (mouse_x > room._geo.x_min &&
            mouse_x < room._geo.x_max &&
            mouse_y > room._geo.y_min &&
            mouse_y < room._geo.y_max) {
          console.log(room);
        }
      }
    }
    showRooms(rooms) {
      rooms = rooms.filter((r) => r.coordinates);
      //      rooms = rooms.filter((r) => r.id == 182);
      this.visible_rooms = rooms;
      var all_x = [];
      var all_y = [];
      for (var room of rooms) {
        if (!room.coordinates) { continue }
        for (var p of room.coordinates) {
          all_x.push(p[0]);
          all_y.push(p[1]);
        }
      }
      function analyzePoints(points) {
        var all_x = points.map((p) => p[0]);
        var all_y = points.map((p) => p[1]);
        var x_min = Math.min.apply(null,all_x);
        var x_max = Math.max.apply(null,all_x);
        var y_min = Math.min.apply(null,all_y);
        var y_max = Math.max.apply(null,all_y);
        return {
          x_min: x_min,
          x_max: x_max,
          y_min: y_min,
          y_max: y_max,
          x_mid: (x_min+x_max)/2,
          y_mid: (y_min+y_max)/2,
          x_range: x_max-x_min,
          y_range: y_max-y_min,
        }
      }
      function analyzeCollections(collections) {
        var _all = [];
        for (var points of collections) { _all = _all.concat(points) }
        return analyzePoints(_all);
      }

      function centerPoint(xy,origin) {
        return [xy[0]-origin[0],xy[1]-origin[1]];
      }
      function rotatePoint(xy,origin,angle) {
        return [
          Math.cos(angle) * (xy[0]-origin[0]) - Math.sin(angle) * (xy[1]-origin[1]) + origin[0],
          Math.sin(angle) * (xy[0]-origin[0]) + Math.cos(angle) * (xy[1]-origin[1]) + origin[1]
        ];
      }

      // center all the points
      var _g = analyzeCollections(rooms.map((r) => r.coordinates));
      var origin = [_g.x_mid,_g.y_mid];
      for (var room of rooms) {
        room.centered = room.coordinates.map((p) => centerPoint(p,origin));
      }

      // now rotate them
      var _g = analyzeCollections(rooms.map((r) => r.coordinates));
      var angle = -39/180*Math.PI;
      var skew = -14/180*Math.PI;

      for (var room of rooms) {
        room.rotated = room.centered.map((p) => rotatePoint(p,[0,0],angle));
      }
      var h = this.canvas.height;
      var w = this.canvas.width;
      var s = 400/_g.y_range;

      var _all = [];
      for (var room of rooms) { _all = _all.concat(room.rotated) }
      var _g = analyzePoints(_all);

      function normalizePoint(xy) {
        return [s*(xy[0]+0.25*xy[1])+w/2, s*(-xy[1])+h/2];
      }
      for (var room of rooms) {
        room.canvas_coords = room.rotated.map(normalizePoint);
        room._geo = analyzePoints(room.canvas_coords);
      }
      this.draw();
    }
    draw() {
      this.canvas.clear();
      for (var room of this.visible_rooms) {
        this.canvas.drawPolygon(room.canvas_coords);
      }

    }
  }
  new Map({ parent: document.getElementById("main") })
})
