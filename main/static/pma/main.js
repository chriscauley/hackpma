window.pma = window.pma || {};
uR.config.mount_to = "#main";
uR.ready(function() {

  pma.floor_list = [
    { 'name': 'ground', },
    { 'name': 'first', },
    { 'name': 'second', },
  ];
  pma.floors = {};
  pma.floor_list.forEach(function(f) { pma.floors[f.name] = f });

  pma.group_list = [
    { name: 'Modern and Contemporary Art',
      color: '#fff799',
      rooms: ["167a", "167", "168", "169", "170", "171", "179", "181", "182", "183", "188", "178", "174", "173", "172", "176", "175", "166", "184", "185", "186", "187", "188", "177", "180"], },
    { name: 'European Art 1100-1500',
      color: '#ffe200',
      rooms: ["213a", "206", "221", "205", "220", "219", "204", "202", "203", "210", "201", "215", "216", "214", "200", "207", "208", "209","213", "212", "211", "218", "217"] },

    { name: 'European Art 1500-1850',
      color: '#a5d9c9',
      rooms: ["294", "295", "296", "299", "297", "292", "291", "298", "290b_2", "290", "280", "284", "279", "278", "283", "281", "282", "277", "277a", "276", "elevator_276", "276a", "252", "250", "251", "256", "255", "254", "257", "258", "260", "265", "266", "268", "271", "270", "269", "272","288", "290a", "290b_2", "293", "253", "261", "262", "263", "275", "274", "273", "267", "264", "259", "253"],
    },
    { name: 'European Art 1850-1900',
      color: '#c2cb1e',
      rooms: ["151", "150", "154", "156", "153", "155", "152", "157", "159", "bath_159", "160", "161", "158", "161", "162", "165", "165a", "164", "163"],},
    { name: 'American Art',
      color: '#f15745',
      rooms: ["114", "115", "111", "112", "113", "110", "109", "116", "104", "106", "104", "104", "105", "116", "118", "102", "103", "119", "222b_1", "222b_1", "100", "101", "101", "101", "elevator_100", "116", "117", "108", "107","289","287","286","285"] },
    { name: 'Arms and Armor',
      color: '#cfe5ae',
      rooms: ["249", "248", "247", "245", "246"],},
    { name: 'Asian Art',
      color: '#63a9c6',
      rooms: ["243", "244", "240a", "239", "238", "241", "226", "237", "236", "235", "234", "233", "elevator_222", "223", "227", "228", "229", "224", "230", "231", "225", "226", "231","240", "242", "232", "222", "233a"],},
    { name: 'Prints, Drawings and Photographs',
      color: '#6ecff6',
      rooms: ["123", "122", "121", "120"] },
    //{ name: 'Special Exhibitions',
    //  color: },
    //{ name: 'Textiles'
    //  color: },
  ]
  pma.groups = {};
  pma.group_list.forEach(function(f) { pma.groups[f.name] = f });

  var ROOM_COLOR_MAP = {};
  var ROOM_GROUP_MAP = {};
  for (var group of pma.group_list) {
    for (var name of group.rooms) {
      ROOM_COLOR_MAP[name] = group.color;
      ROOM_GROUP_MAP[name] = group.name;
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
  function centerPoint(xy,origin) {
    return [xy[0]-origin[0],xy[1]-origin[1]];
  }
  function rotatePoint(xy,origin,angle) {
    return [
      Math.cos(angle) * (xy[0]-origin[0]) - Math.sin(angle) * (xy[1]-origin[1]) + origin[0],
      Math.sin(angle) * (xy[0]-origin[0]) + Math.cos(angle) * (xy[1]-origin[1]) + origin[1]
    ];
  }
  function skewPoint(xy) {
    // the lat-lon to xy translation makes the geometry trapizoidal
    return [xy[0]+0.25*xy[1],xy[1]];
  }

  pma.map_config = new uR.Config("display",[
    { name: 'floor', value: "first" }
  ]);
  pma.Map = class Map extends uR.canvas.CanvasObject {
    constructor(opts={}) {
      super(opts)
      //this.newCanvas({ controller: true });
      this.floor = pma.map_config.get("floor");
      var self = this;
      this._selected = [];
      this.width = opts.parent.scrollWidth;
      this.height = opts.parent.scrollHeight;
      this.svg_tag = uR.newElement("svg",{
        id: "svg",
        parent: opts.parent,
        height: this.width,
        width: this.height
      });
      this.svg = SVG(this.svg_tag);
      // var f = FLOORS[this.floor]
      // var max_wh = Math.min(this.width,this.height);

      // self.svg.image(
      //   `/static/pma/img/${self.floor}.png`,
      //   max_wh*f.x_scale,
      //   max_wh*f.y_scale,
      // ).center(this.width/2,this.height/2+f.y_off*max_wh);
      uR.storage.remote(`/api/location/?per_page=0`,function(data) {
        self.all_rooms = data.results;
        self.normalizeCoordinates();
        self.showRooms(pma.map_config.getData());
        var visible_groups = [];
        for (var room of self.visible_rooms) {
          var group_name = ROOM_GROUP_MAP[room.name];
          room.group = pma.groups[group_name];
          if (group_name && visible_groups.indexOf(group_name) == -1) {
            visible_groups.push(group_name)
          }
          var polygon = self.svg.polygon(room.canvas_coords).fill(ROOM_COLOR_MAP[room.name] || "#ccc")
            .stroke({ width: 1 })
            .click(function() {
              self.focusOn(this.room);
            });
          room.bbox = polygon.bbox();
          self.bbox = self.bbox?self.bbox.merge(room.bbox):room.bbox;
          if (group_name) {
            var group = pma.groups[group_name];
            group.bbox = group.bbox?group.bbox.merge(room.bbox):room.bbox;
          }
          polygon.room = room;
        }
        visible_groups.sort();
        pma.visible_groups = visible_groups.map((name) => pma.groups[name]);

        self.svg.viewbox(self.bbox);
        self.tag.update()
      });
    }
    zoomSVG(bbox) {
      bbox = bbox.merge(bbox);
      var dx = 5;
      var dy = 5;
      bbox.x = bbox.x-dx;
      bbox.y = bbox.y-dy
      bbox.width = bbox.width+2*dx;
      bbox.height = bbox.height+2*dy;
      this.svg.animate().viewbox(bbox);
    }
    focusOn(room) {
      if (!room || !room.group) { return }
      if (this.focused_group == room.group) {
        this.zoomSVG(room.bbox);
      } else {
        this.focused_group = room.group;
        this.zoomSVG(room.group.bbox);
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
      function analyzeCollections(collections) {
        var _all = [];
        for (var points of collections) { _all = _all.concat(points) }
        return analyzePoints(_all);
      }

      // center all the points
      var _g = analyzeCollections(rooms.map((r) => r.coordinates));
      var origin = [_g.x_mid,_g.y_mid];
      for (var room of rooms) {
        room.centered = room.coordinates.map((p) => centerPoint(p,origin));
      }

      // now rotate them
      var _g = analyzeCollections(rooms.map((r) => r.coordinates));
      var angle = -38.5/180*Math.PI;
      var skew = -14/180*Math.PI;

      for (var room of rooms) {
        room.rotated = room.centered.map((p) => skewPoint(rotatePoint(p,[0,0],angle)));
      }
    }
    normalizeRooms(rooms) {
      var h = this.height;
      var w = this.width;
      var _all = [];
      for (var room of rooms) { _all = _all.concat(room.rotated) }
      var _g = analyzePoints(_all);
      for (var room of rooms) {
        room._centered = room.rotated.map((p) => centerPoint(p,[_g.x_mid,_g.y_mid]));
      }
      var _all = [];
      for (var room of rooms) { _all = _all.concat(room._centered) }
      var _g = analyzePoints(_all);
      var s = (h<w)?h/_g.y_range:w/_g.x_range;

      function normalizePoint(xy) {
        // this takes some explanation...
        // the points are currently between [-_g.x_range,_g.x_range] for x and [-g.y_range,_g.y_range] for y
        // adding half the width/height 
        // the x axis needs to be mirrored, so
        // +0.25*xy[1] skews the image to correct for the map projection
        return [w/2-s*(xy[0]), s*(xy[1])+h/2];
      }
      for (var room of rooms) {
        room.canvas_coords = room.rotated.map(normalizePoint);
        let g = room._geo = analyzePoints(room.canvas_coords);
        room.canvas_coords = [
          [g.x_min,g.y_min],
          [g.x_min,g.y_max],
          [g.x_max,g.y_max],
          [g.x_max,g.y_min],
        ]
      }
    }
    showRooms(filters) {
      var rooms = this.all_rooms.filter((r) => r.coordinates);
      for (var key in filters) {
        rooms = rooms.filter((r) => r[key] == filters[key])
      }
      this.visible_rooms = rooms;
      this.normalizeRooms(rooms);
    }
  }
})
