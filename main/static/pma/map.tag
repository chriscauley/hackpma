<pma-map>
  <div class="room-list">
    <div class="nav" each={ floor,i in pma.floor_list }>
      <a class="nav-item floor" href="#/{floor.name}/">{ uR.unslugify(floor.name) } Floor</a>
      <div class="nav" if={ floor.name == state.floor }>
        <a class="nav-item group" each={ group,i in pma.visible_groups } href="#/{floor.name}/{group.name}/">
          <span class="swatch" style="background: { group.color }"></span>
          <span class="name">{ group.name }</span>
        </a>
      </div>
    </div>
  </div>
  <div ref="map_container"></div>
  <button class="fa fa-home { uR.css.btn.primary }" onclick={ reset }></button>

  this.on("before-mount",function() {
    this.state = pma.map_config.getData();
  });

  this.on("mount",function() {
    this.map = new pma.Map({
      parent: this.refs.map_container,
      tag: this,
    });
  });
  this.on("update",function() {
    this.state = pma.map_config.getData();
  })

  route(pathname,data) {
    if (data.matches) {
      var floor = data.matches[1];
      var group = pma.groups[decodeURI(data.matches[2])];
      floor && console.log('floor',floor);
      group && console.log('group',group);
    }
  }
  reset() {
    this.map.svg.animate().viewbox(this.map.bbox);
  }
</pma-map>
