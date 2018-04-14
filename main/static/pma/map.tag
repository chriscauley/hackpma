<pma-map>
  <div ref="map_container"></div>
  <div class="room-list"></div>

  this.on("mount",function() {
    this.map = new pma.Map({
      parent: this.refs.map_container,
      tag: this,
    });
  });
</pma-map>
