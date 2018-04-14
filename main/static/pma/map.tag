<pma-map>
  <div ref="map_container"></div>
  <div class="room-list"></div>
  <button class="fa fa-home { uR.css.btn.primary }" onclick={ reset }></button>

  this.on("mount",function() {
    this.map = new pma.Map({
      parent: this.refs.map_container,
      tag: this,
    });
  });

  reset() {
    this.map.svg.animate().viewbox(this.map.bbox);
  }
</pma-map>
