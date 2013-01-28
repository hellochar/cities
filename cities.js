window.onFinish.push(function () {
b2Vec2 = Box2D.Common.Math.b2Vec2;
b2BodyDef = Box2D.Dynamics.b2BodyDef;
b2Body = Box2D.Dynamics.b2Body;
b2FixtureDef = Box2D.Dynamics.b2FixtureDef;
b2Fixture = Box2D.Dynamics.b2Fixture;
b2World = Box2D.Dynamics.b2World;
b2MassData = Box2D.Collision.Shapes.b2MassData;
b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;
b2CircleShape = Box2D.Collision.Shapes.b2CircleShape;
b2DebugDraw = Box2D.Dynamics.b2DebugDraw;

//=====three.js variables

// scene, camera, renderer, controls, stats;
// sun;
//

//=====physics variables

//gameworld

//=====model variables

debugTerrain = false;
debugLight = true;
noShadows = true;
debugOnlyOneBuilding = false;
debugGeneration = false;

var debugAll = false;
if(debugAll) {
  _(window).keys().filter(function (name) { return /^debug.+$/.test(name); }).forEach(function (name) {
    console.log("turning on "+name);
    window[name] = true;
  });
}
//the world exists on a rect in [-worldWidth/2, worldWidth/2] and [-worldHeight/2, worldHeight/2]
worldWidth = worldHeight = 5000;

function init() {
  scene = new THREE.Scene();

  var seed = Math.random();
  // seed = 0.8510157817509025;
  console.log("seed: "+seed);
  Math.seedrandom(seed);

  //set up model
  terrain = new Terrain(worldWidth, worldHeight, 50, 50);

  //building the city:
  var parameters = {max: 1000, limit: 500, frequency: .02 };
  // parameters =     {max: 1000, limit: 50,  frequency: .01 };
  // parameters =     {max: 1000, limit: 50,  frequency: .01, minDist: 8, maxDist: 25 };
  // parameters =     {max: 100,  limit: 5,   frequency: .01 };
  parameters = {max: 10000, limit: 2500, frequency: .02};
  // parameters = {max: 10000, limit: 2500, frequency: .02, maxDist: 10};
  // parameters = {max: 10000, limit: 2500, frequency: .2, minDist: 2, maxDist: 5, speed: 1};
  city = new City(600, 600, 0.2, parameters);
  // $('#overlay').append(city.land.canvas);

  //Set up required three.js components
  // scene.add(city.mesh);
  // city.meshes.forEach(scene.add, scene);
  scene.add(terrain.mesh);

  gameworld = new GameWorld(terrain, city);

  var shadowCube = new THREE.CubeGeometry(worldWidth, worldWidth / 1e1, worldHeight);
  shadowCube.applyMatrix( new THREE.Matrix4().makeTranslation( new THREE.Vector3(0, -shadowCube.height * 2, 0) ) );
  // shadowCube.faces.remove(2);
  var cMesh = new THREE.Mesh(shadowCube);
  cMesh.castShadow = true;
  scene.add(cMesh);

  //add water
  (function () {
    var waterLevel = 180;
    var waterGeom = new THREE.PlaneGeometry(worldWidth * 10, worldHeight * 10);
    waterGeom.makeRotationX( -Math.PI/2 );
    waterGeom.makeTranslation( new THREE.Vector3(0, terrain.offsetY + waterLevel, 0));
    var waterMat = new THREE.MeshPhongMaterial({color: 0x224488});

    var mesh = new THREE.Mesh(waterGeom, waterMat);
    scene.add(mesh);
  })();

  camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 1, worldWidth * 3);
  camera.position.y = city.width * .4;
  camera.position.z = city.width * .5;

  if(debugOnlyOneBuilding) camera.position.divideScalar( 5 );

  renderer = new THREE.WebGLRenderer({ clearColor: 0x000000, clearAlpha: 1 });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  window.addEventListener( 'resize', onWindowResize, false );

  if( !noShadows ) {
    renderer.shadowMapEnabled = true;
  }
  // renderer.shadowMapSoft = true;

  controls = window.trackballControls = new THREE.TrackballControls(camera);
  window.FPScontrols = new FirstPersonControls(renderer.domElement);

  $(document).keypress(function (e) { if(String.fromCharCode(e.which) == 'z') {
    if(controls instanceof FirstPersonControls) {
      controls.unregister();
      //switch to trackball
      camera.position.set(0, city.width * .5, city.width * .75);
      camera.up.set(0, 1, 0);
      controls = window.trackballControls;
    }
    else {
      camera.up.set(0, 1, 0);
      controls = window.FPScontrols;
      controls.register();
    }
  } });

  scene.add(new THREE.AxisHelper(1000));

  //set up stats
  stats = new Stats();
  stats.setMode(0); // 0: fps, 1: ms

  // Align top-left
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';

  document.body.appendChild( stats.domElement );

  //set up lights

  sun = new Sun( 10000, 0xaaaaaa, 0x222222 );
  // sun = new Sun(10000, 0x202020, 0x202020);
  if( !noShadows ) {
    sun.setupShadows();
  }

  function dirLight(hex, x, y, z) {
    var dirLight = new THREE.DirectionalLight( hex );
    if(y === undefined) {
      dirLight.position.copy(x);
    } else {
      dirLight.position.set(x, y, z);
    }
    scene.add(dirLight);
  }
  dirLight(0x222222, 1, 1, 1);
  dirLight(0x222222, -.5, 2, -.75);

  window.arrow = new THREE.ArrowHelper(new THREE.Vector3(), new THREE.Vector3(0, 2000, 0), 1000, 0xffff00);
  scene.add(arrow);
};

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );
}

function render() {
  stats.begin();
  requestAnimationFrame(render);
  sun.update();
  arrow.setDirection( sun.directionalLight.position );
  controls.update();

  gameworld.update();

  if(gameworld.ofType(Tree).length < 20) {
    var ang = Math.random()*2*Math.PI;
    var mag = Math.randFloat(city.width/2, city.width);

    var pos = new THREE.Vector2(Math.cos(ang) * mag, Math.sin(ang) * mag);
    new Tree(gameworld, pos); //adds to gameworld by mutation
  }
  if(Math.randBoolean(.01)) {
    new Axe(gameworld, gameworld.player.position().toTHREE().addSelf(new THREE.Vector2(0, 5)));
  }


  renderer.render(scene, camera);
  stats.end();
}

init();
render();
});
