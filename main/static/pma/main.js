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
      room_names: ["166", "167", "167a", "168", "169", "170", "171", "172", "173", "174", "175", "176", "177", "178", "179", "180", "181", "182", "183", "184", "185", "186", "187", "188"], },
    { name: 'European Art 1100-1500',
      color: '#ffe200',
      room_names: ["200", "201", "202", "203", "204", "205", "206", "207", "208", "209", "210", "211", "212", "213", "213a", "214", "215", "216", "217", "218", "219", "220", "221"], },

    { name: 'European Art 1500-1850',
      color: '#a5d9c9',
      room_names: ["250", "251", "252", "253", "254", "255", "256", "257", "258", "259", "260", "261", "262", "263", "264", "265", "266", "267", "268", "269", "270", "271", "272", "273", "274", "275", "276", "276a", "277", "277a", "278", "279", "280", "281", "282", "283", "284", "288", "290", "290a", "290b_2", "291", "292", "293", "294", "295", "296", "297", "298", "299", "elevator_276"], },
    { name: 'European Art 1850-1900',
      color: '#c2cb1e',
      room_names: ["150", "151", "152", "153", "154", "155", "156", "157", "158", "159", "160", "161", "162", "163", "164", "165", "165a", "bath_159"], },
    { name: 'American Art',
      color: '#f15745',
      room_names: ["100", "101", "102", "103", "104", "105", "106", "107", "108", "109", "110", "111", "112", "113", "114", "115", "116", "117", "118", "119", "222b_1", "285", "286", "287", "289", "elevator_100"], },
    { name: 'Arms and Armor',
      color: '#cfe5ae',
      room_names: ["245", "246", "247", "248", "249"], },
    { name: 'Asian Art',
      color: '#63a9c6',
      room_names: ["222", "223", "224", "225", "226", "227", "228", "229", "230", "231", "232", "233", "233a", "234", "235", "236", "237", "238", "239", "240", "240a", "241", "242", "243", "244", "elevator_222"], },
    { name: 'Prints, Drawings and Photographs',
      color: '#6ecff6',
      room_names: ["120", "121", "122", "123"] },
    //{ name: 'Special Exhibitions',
    //  color: },
    //{ name: 'Textiles'
    //  color: },
  ]
  pma.groups = {};
  pma.group_list.forEach(function(g) {
    pma.groups[g.name] = g;
    g.room_names = Array.from(new Set(g.room_names));
    g.room_names.sort();
  });
  pma.rooms = {};
  pma.room_list = [];

  var ROOM_COLOR_MAP = {};
  var ROOM_GROUP_MAP = {};
  for (var group of pma.group_list) {
    for (var name of group.room_names) {
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

  pma.Map = class Map extends uR.canvas.CanvasObject {
    constructor(opts={}) {
      super(opts)
      this.defaults(opts,{
        ready: uR.REQUIRED,
        parent: uR.REQUIRED,
        width: opts.parent.scrollWidth,
        height: opts.parent.scrollHeight,
      });
      //this.newCanvas({ controller: true });
      var self = this;
      this._selected = [];

      // var f = FLOORS[this.floor]
      // var max_wh = Math.min(this.width,this.height);

      // self.svg.image(
      //   `/static/pma/img/${self.floor}.png`,
      //   max_wh*f.x_scale,
      //   max_wh*f.y_scale,
      // ).center(this.width/2,this.height/2+f.y_off*max_wh);
      uR.ajax({
        url: `/api/location/?per_page=0`,
        success: function(data) {
          self.all_rooms = data.results;
          pma.room_list = pma.room_list.concat(data.results);
          for (var room of pma.room_list) { pma.rooms[room.name] = room; }
          var rooms = self.all_rooms.filter((r) => r.coordinates);
          for (var group of pma.group_list) {
            group.room_list = group.room_names.map((name) => pma.rooms[name])
          }
          self.normalizeCoordinates(rooms);
          self.normalizeRooms(rooms);
          self.createSVGs();
          self.ready();
          self.update();
          self.tag.update()
        }
      });
    }
    update() {
      if (this.current_floor != pma.current_floor) {
        this.current_floor && this.current_floor.svg.animate().opacity(0).style("z-index",0);
        pma.current_floor.svg.animate().opacity(1).style("z-index",1);
        this.current_floor = pma.current_floor;
      }
      if (pma.current_room) {
        var bbox = pma.current_room.bbox;
      } else if (pma.current_group) {
        var bbox = pma.current_floor.bboxes[pma.current_group.name];
      } else {
        var bbox = pma.current_floor.bbox;
      }
      this.current_floor.svg.animate().viewbox(bbox);
    }
    normalizeCoordinates(rooms) {
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
    createSVGs() {
      for (var floor of pma.floor_list) {
        var svg_tag = uR.newElement("svg",{
          id: "svg-"+floor.name,
          parent: this.parent,
          height: this.width,
          width: this.height
        });
        floor.svg = SVG(svg_tag);
        floor.svg.floor = floor;
        floor.bboxes = {};

        var visible_rooms = this.all_rooms.filter((r) =>
                                                  r.coordinates &&
                                                  r.coordinates.length
                                                  && r.floor == floor.name);
        var visible_groups = [];
        var buffer = 10;
        for (var room of visible_rooms) {
          var group_name = ROOM_GROUP_MAP[room.name];
          room.group = pma.groups[group_name];
          if (group_name && visible_groups.indexOf(group_name) == -1) {
            visible_groups.push(group_name)
          }
          var polygon = floor.svg.polygon(room.canvas_coords).fill(ROOM_COLOR_MAP[room.name] || "#ccc")
            .stroke({ width: 1 })
            .click(function() {
              if (pma.current_group == this.room.group) {
                uR.route(`#/${pma.current_floor.name}/${this.room.group.name}/${this.room.name}/`);
              } else { // no group selected, zoom in on group
                this.room.group && uR.route(`#/${pma.current_floor.name}/${this.room.group.name}/`);
              }
            });
          polygon.room = room;
          room.bbox = polygon.bbox();
          room.bbox.x -= buffer;
          room.bbox.y -= buffer;
          room.bbox.width += 2*buffer;
          room.bbox.height += 2*buffer;
          floor.bbox = floor.bbox?floor.bbox.merge(room.bbox):room.bbox;
          if (group_name) {
            if (!floor.bboxes[group_name]) { floor.bboxes[group_name] = room.bbox; }
            floor.bboxes[group_name] = floor.bboxes[group_name].merge(room.bbox);
          }
        }
        visible_groups.sort();
        floor.groups = visible_groups.map((name) => pma.groups[name]);
        floor.svg.opacity(0);
        floor.svg.viewbox(floor.bbox);
      }
    }
  }
})
