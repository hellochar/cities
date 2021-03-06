function Tree(gameworld, pos, radius, movespeed, turnspeed, facingThreshold, attackLength) {

  this.radius = radius || 1;

  this.movespeed = movespeed || 6;
  this.turnspeed = turnspeed || 9;
  this.facingThreshold = facingThreshold || 20;
  this.attackLength = attackLength || 4;

  var trunkLen = Math.randFloat(4, 10);
  var foliageLength = trunkLen * 1.2;
  var segments = 3;

  var model = new TreeModel(trunkLen, this.radius, foliageLength, segments);
  Actor.call(
      this,
      gameworld,
      model,
      Actor.defaultBodyDef(pos.x, pos.y),
      Actor.defaultFixDef(this.radius)
  );
}

Tree.prototype = Object.create( Actor.prototype );
Tree.prototype.constructor = Tree;

Tree.prototype.logic = function () {

  if(this.arrow) {
    scene.remove(this.arrow);
    this.arrow = undefined;
  }

  if(this.isBeingSeen()) {
    // console.log("yeah i'm seen!");
    if(!this.arrow) {
      this.arrow = new THREE.Mesh(new THREE.CubeGeometry(2, 2, 2), new THREE.MeshNormalMaterial());
      scene.add(this.arrow);
    }
    return;
  }

  //if you're not facing the player, turn towards him and end
  //if you are facing the player (within 10-20 degrees?), and he is not reachable (i.e. longer than melee), go towards him
  //if he is reachable, attack

  var playerPos = gameworld.player.body.GetPosition();
  var offset = this.body.GetLocalPoint(playerPos);//.toTHREE();

  var offsetAngle = Math.atan2( offset.y, offset.x );
  // console.log(180 * offsetAngle / Math.PI);


  if(Math.abs(offsetAngle) < Math.PI / 180 * this.facingThreshold) {
    if(offset.Length() < this.attackLength) {
      //attack
      this.gameworld.player.health -= 1;
    } else {
      // console.log("running forward!");
      var impulse = playerPos.Copy();
      impulse.Subtract(this.body.GetPosition());
      impulse.Normalize();
      impulse.Multiply(this.movespeed);
      impulse.Multiply(this.body.GetMass());
      this.body.ApplyImpulse(impulse, this.body.GetPosition());
      }
  } else { //face player
    var turn = offsetAngle * this.turnspeed * this.body.GetMass();
    this.body.ApplyTorque(turn);
  }
}

Tree.prototype.isBeingSeen = function() {
  var myRelPos = this.gameworld.player.body.GetLocalPoint(this.position());
  var offsetAngle = Math.atan2( myRelPos.y, myRelPos.x );

  if(Math.abs(offsetAngle) < Math.PI / 180 * window.FPScontrols.fovx() / 2 ) {
    return true;
  }
  return false;
}
