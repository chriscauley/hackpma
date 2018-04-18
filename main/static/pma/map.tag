<pma-map>
  <div class="room-list">
    <div class="nav" each={ floor,i in pma.floor_list }>
      <a class="nav-item floor" href="#/{floor.name}/">{ uR.unslugify(floor.name) } Floor</a>
      <div class="nav" if={ floor == pma.current_floor }>
        <a class="nav-item group" each={ group,i in floor.groups } href="#/{floor.name}/{group.name}/">
          <span class="swatch" style="background: { group.color }"></span>
          <span class="name">{ group.name }</span>
        </a>
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
      this.map && this.map.update();
    }
    this.update()
  }
  reset() {
    uR.route(`#/${pma.current_floor.name}/`)
  }
</pma-map>
