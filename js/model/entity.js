function Entity(pos, shape, heading, mesh) {

  //this.position
  //this.rotation
  
  this.body = gameworld.createEntityBody(pos, shape, facing);

  this.syncVariables();
}

Entity.prototype.syncVariables = function() {
  
}

Entity.prototype.update = function() {
  //game logic

}
