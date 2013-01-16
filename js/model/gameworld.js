function GameWorld(terrain, city) {
  var b2Vec2 = Box2D.Common.Math.b2Vec2,
      b2BodyDef = Box2D.Dynamics.b2BodyDef,
      b2Body = Box2D.Dynamics.b2Body,
      b2FixtureDef = Box2D.Dynamics.b2FixtureDef,
      b2Fixture = Box2D.Dynamics.b2Fixture,
      b2World = Box2D.Dynamics.b2World,
      b2MassData = Box2D.Collision.Shapes.b2MassData,
      b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape,
      b2CircleShape = Box2D.Collision.Shapes.b2CircleShape,
      b2DebugDraw = Box2D.Dynamics.b2DebugDraw;

  this.terrain = terrain;
  this.city = city;

  // this.scalar = scalar || (10 / Math.max(this.city.width, this.city.height)

  //the x-z coordinates of the renderer map to the xy coordinates of the game
  world = new b2World(
      new b2Vec2(0, 0)    //gravity
      ,  true                 //allow sleep
      );

  var fixDef = new b2FixtureDef();
  fixDef.density = 1.0;
  fixDef.friction = 0.5;
  fixDef.restitution = 0.2;

  var bodyDef = new b2BodyDef();

  //create ground
  bodyDef.type = b2Body.b2_staticBody;
  bodyDef.position.x = 9;
  bodyDef.position.y = 13;
  fixDef.shape = new b2PolygonShape;
  fixDef.shape.SetAsBox(10, 0.5);
  world.CreateBody(bodyDef).CreateFixture(fixDef);

  //create some objects
  bodyDef.type = b2Body.b2_dynamicBody;
  for(var i = 0; i < 10; ++i) {
    if(Math.random() > 0.5) {
      fixDef.shape = new b2PolygonShape;
      fixDef.shape.SetAsBox(
          Math.random() + 0.1 //half width
          ,  Math.random() + 0.1 //half height
          );
    } else {
      fixDef.shape = new b2CircleShape(
          Math.random() + 0.1 //radius
          );
    }
    bodyDef.position.x = Math.random() * 10;
    bodyDef.position.y = Math.random() * 10;
    world.CreateBody(bodyDef).CreateFixture(fixDef);
  }

}

GameWorld.prototype.addFace = function(face) {

}
GameWorld.prototype.update = function() {
  updateRenderer();
}

//sync up the physics' features with the renderer
GameWorld.prototype.updateRenderer = function() {
}
