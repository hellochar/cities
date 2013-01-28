function Item(gameworld, pos) {
  this.gameworld = gameworld;
  this.pos = pos;

  this.gameworld.items.push(this);

  this.model = window[classOf(this)].model.clone();
  //assumes existence of a "model" static member
  //
  scene.add(this.model);
}

Item.prototype.update = function() {
  if( ! this.isPickedUp() ) {
    this.model.position.copy( terrain.onTerrain(this.pos) ).addSelf(0, (1 + Math.sin(new Date().getTime() / 2000)) / 2, 0);
    this.model.rotation.y += .04;
  }
}

Item.prototype.toString = function() {
  return classOf(this);
}

Item.prototype.isPickedUp = function() {
  return _.contains(this.gameworld.player.items, this);
}

function Axe(gameworld, pos) { 
  Item.call(this, gameworld, pos);
}

Axe.prototype = Object.create( Item.prototype );
Axe.prototype.constructor = Axe;

(function() {
  // var handle = new THREE.CubeGeometry(25, 25, 25);
  var handle = new THREE.CubeGeometry(.1, 1, .1);
  var blade = new THREE.CubeGeometry(.25, .2, .05);
  blade.makeTranslation( new THREE.Vector3( .25 / 2, .5 - .1 - .025, 0 ) );
  handle.union(blade);
  handle.makeTranslation( new THREE.Vector3( 0, .5, 0 ) );

  handle.makeScale( new THREE.Vector3( 2, 2, 2 ) );

  Axe.model = new THREE.Mesh(handle, new THREE.MeshNormalMaterial());
})();
