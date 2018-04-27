<image-modal>
  <div class={ theme.outer }>
    <div class={ theme.content }>
      <div class="container">
        <div class="columns">
          <div class="column col-4 card" each={ image,i in opts.images }>
            <div>
              <img src={ image.thumbnail_url } />
              <h2>{ image.data['Title'] }</h2>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <script>
  </script>
</image-modal>

<pma-map>
  <div class="room-list">
    <div class="nav" each={ floor,_f in pma.floor_list }>
      <a class="nav-item floor" href="#/{floor.name}/">{ uR.unslugify(floor.name) } Floor</a>
      <div class="nav" if={ floor == pma.current_floor }>
        <div class="nav-item group" each={ group,_g in floor.groups }>
          <a href="#/{floor.name}/{group.name}/">
            <span class="swatch" style="background: { group.color }"></span>
            <span class="name">{ group.name }</span>
          </a>
          <div class="nav" if={ pma.current_group == group }>
            <a class="nav-item room" href="#/{floor.name}/{group.name}/{room.name}/"
               each={ room,_r in group.room_list }>{ room.name }</a>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div ref="map_container"></div>
  <button class="fa fa-home { uR.css.btn.primary }" onclick={ reset }></button>

  this.on("before-mount",function() {
  });

  this.on("mount",function() {
    this.map = new pma.Map({
      parent: this.refs.map_container,
      tag: this,
      ready: function() { this.route(window.location.hash,opts); }.bind(this),
    });
  });
  route(pathname,data) {
    if (data.matches) {
      pma.current_floor = pma.floors[data.matches[1] || "first"];
      pma.current_group = pma.groups[decodeURI(data.matches[2])];
      pma.current_room = pma.rooms[decodeURI(data.matches[3])];
      pma.current_room && uR.ajax({
        url: "/api/object/?location_id="+pma.current_room.id,
        success: function(data) {
          uR.alertElement("image-modal",{ images: data.results });
        },
      });
      this.map && this.map.update();
    }
    this.update()
  }
  reset() {
    uR.route(`#/${pma.current_floor.name}/`)
  }
</pma-map>
