function Tree(gameworld, pos, radius, movespeed, turnspeed, facingThreshold, attackLength) {

  this.radius = radius || 1;

  this.movespeed = movespeed || 60;
  this.turnspeed = turnspeed || 60;
  this.facingThreshold = facingThreshold || 20;
  this.attackLength = attackLength || 2;

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

Tree.prototype.logic = function () {

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
      
    } else {
      // console.log("running forward!");
      var impulse = playerPos.Copy();
      impulse.Subtract(this.body.GetPosition());
      impulse.Normalize();
      impulse.Multiply(this.movespeed);
      this.body.ApplyImpulse(impulse, this.body.GetPosition());
      }
  } else { //face player
    var turn = offsetAngle * this.turnspeed;
    this.body.ApplyTorque(turn);
  }
}

Tree.prototype.isBeingSeen = function() {
  var player_pos_physics = gameworld.player.body.GetPosition();
  var player_pos_renderer = new THREE.Vector2( player_pos_physics.x, player_pos_physics.y );
}
