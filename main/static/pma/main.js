window.pma = window.pma || {};
uR.config.mount_to = "#main";
uR.ready(function() {
  var NAME_COLOR_MAP = {
    '#fff799': ["167a", "167", "168", "169", "170", "171", "179", "181", "182", "183", "188", "178", "174", "173", "172", "176", "175", "166", "184", "185", "186", "187", "188", "177", "180"],
    '#c2cb1e': ["151", "150", "154", "156", "153", "155", "152", "157", "159", "bath_159", "160", "161", "158", "161", "162", "165", "165a", "164", "163"],
    '#6ecff6': ["123", "122", "121", "120"],
    '#f15745': ["114", "115", "111", "112", "113", "110", "109", "116", "104", "106", "104", "104", "105", "116", "118", "102", "103", "119", "222b_1", "222b_1", "100", "101", "101", "101", "elevator_100", "116", "117", "108", "107","289","287","286","285"],
    '#a5d9c9': ["294", "295", "296", "299", "297", "292", "291", "298", "290b_2", "290", "280", "284", "279", "278", "283", "281", "282", "277", "277a", "276", "elevator_276", "276a", "252", "250", "251", "256", "255", "254", "257", "258", "260", "265", "266", "268", "271", "270", "269", "272","288", "290a", "290b_2", "293", "253", "261", "262", "263", "275", "274", "273", "267", "264", "259", "253"],
    '#cfe5ae': ["249", "248", "247", "245", "246"],
    '#ffe200': ["213a", "206", "221", "205", "220", "219", "204", "202", "203", "210", "201", "215", "216", "214", "200", "207", "208", "209","213", "212", "211", "218", "217"],
    '#63a9c6': ["243", "244", "240a", "239", "238", "241", "226", "237", "236", "235", "234", "233", "elevator_222", "223", "227", "228", "229", "224", "230", "231", "225", "226", "231","240", "242", "232", "222", "233a"],
  }
  for (var color in NAME_COLOR_MAP) {
    for (var name of NAME_COLOR_MAP[color]) {
      NAME_COLOR_MAP[name] = color;
    }
  }
  pma.map_config = new uR.Config("display",[
    { name: 'floor', value: "first" }
  ]);
  pma.Map = class Map extends uR.canvas.CanvasObject {
    constructor(opts={}) {
      super(opts)
      this.newCanvas({ controller: true });
      var floor = pma.map_config.get("floor");
      var self = this;
      this._selected = [];
      uR.storage.remote(`/api/location/?per_page=0`,function(data) {
        self.all_rooms = data.results;
        self.normalizeCoordinates();
        self.showRooms(pma.map_config.getData());
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
          this._selected.push(room.name);
          this.showRooms({ id: room.id})
        }
      }
    }
    normalizeCoordinates() {
      var rooms = this.all_rooms.filter((r) => r.coordinates);
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
      var s = (h<w)?h/_g.y_range:w/_g.x_range;
      var _all = [];
      for (var room of rooms) { _all = _all.concat(room.rotated) }
      var _g = analyzePoints(_all);

      function normalizePoint(xy) {
        // this takes some explanation...
        // the points are currently between [-_g.x_range,_g.x_range] for x and [-g.y_range,_g.y_range] for y
        // adding half the width/height 
        // the x axis needs to be mirrored, so
        return [w/2-s*(xy[0]+0.25*xy[1]), s*(xy[1])+h/2];
      }
      for (var room of rooms) {
        room.canvas_coords = room.rotated.map(normalizePoint);
        room._geo = analyzePoints(room.canvas_coords);
      }
    }
    showRooms(filters) {
      var rooms = this.all_rooms.filter((r) => r.coordinates);
      for (var key in filters) {
        rooms = rooms.filter((r) => r[key] == filters[key])
      }
      this.visible_rooms = rooms;
      this.draw();
    }
    draw() {
      this.canvas.clear();
      for (var room of this.visible_rooms) {
        this.canvas.drawPolygon(room.canvas_coords,{fillStyle: NAME_COLOR_MAP[room.name] || "black" });
      }
    }
  }
})
