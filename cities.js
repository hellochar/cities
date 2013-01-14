window.onFinish.push(function () {
//=====three.js variables

// scene, camera, renderer, controls, stats;
// sun;

//=====model variables

debugTerrain = false;
debugLight = false;
noShadows = false;
debugBuilding = false;
simpleBuildings = false;
//the world exists on a rect in [-worldWidth/2, worldWidth/2] and [-worldHeight/2, worldHeight/2]
worldWidth = worldHeight = 3000;

//terrain is a mesh holding the terrain data
// terrain;
// terrainOffset;
// city;

trees = [];

function makeRandomTree(size) {
  //trunk diameter vs height is about 1/3 - 1/5 for good bulky looking ones

  var trunkLen = Math.randFloat(40, 200);
  if(Math.random() < .01) trunkLen = Math.randFloat(600, 800);
  var trunkRadius = trunkLen / 4;
  var foliageLength = trunkLen * 1.2;
  // var trunkRadius = Math.randFloat(10, 40);
  // var foliageLength = Math.randFloat(30, 80);
  var segments = 3;

  var tree = new Tree(trunkLen, trunkRadius, foliageLength, segments);
  var ang = Math.random()*2*Math.PI;
  var mag = Math.randFloat(worldWidth/4, worldWidth/2);

  var x = Math.cos(ang) * mag,
      z = Math.sin(ang) * mag,
      y = noiseFunc(x, z);
  tree.position.set( x, y, z );
  scene.add(tree);
}

function init() {

  Math.seedrandom('qwer');

  //set up model
  terrain = new Terrain(worldWidth, worldHeight, 10, 10);

  //building the city:
  var parameters = {max: 1000, limit: 500, frequency: .02 };
  // parameters =     {max: 1000, limit: 50,  frequency: .01 };
  // parameters =     {max: 1000, limit: 50,  frequency: .01, minDist: 8, maxDist: 25 };
  // parameters =     {max: 100,  limit: 5,   frequency: .01 };
  parameters = {max: 10000, limit: 2500, frequency: .02};
  city = new City(2000, 2000, 0.06, parameters);
  $('#overlay').append(city.land.canvas);

  //Set up required three.js components
  scene = new THREE.Scene();
  // scene.add(city.mesh);
  city.meshes.forEach(scene.add, scene);
  scene.add(terrain.mesh);

  var shadowCube = new THREE.CubeGeometry(worldWidth, worldWidth / 1e1, worldHeight);
  shadowCube.applyMatrix( new THREE.Matrix4().makeTranslation( new THREE.Vector3(0, -shadowCube.height * 2, 0) ) );
  // shadowCube.faces.remove(2);
  var cMesh = new THREE.Mesh(shadowCube);
  cMesh.castShadow = true;
  scene.add(cMesh);

  camera = new THREE.PerspectiveCamera(90, window.innerWidth/window.innerHeight, 1, worldWidth * 3);
  camera.position.y = city.width * .4;
  camera.position.z = city.width * .5;

  if(debugBuilding) camera.position.divideScalar( 5 );

  renderer = new THREE.WebGLRenderer({ clearColor: 0x000000, clearAlpha: 1 });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  window.addEventListener( 'resize', onWindowResize, false );

  if( !noShadows ) {
    renderer.shadowMapEnabled = true;
  }
  // renderer.shadowMapSoft = true;

  controls = window.trackballControls = new THREE.TrackballControls(camera);
  window.FPScontrols = new FirstPersonControls(.8, 5, renderer.domElement);

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

  sun = new Sun( 10000, 0xcccccc, 0x222222 );
  // sun = new Sun(10000, 0x202020, 0x202020);
  if( !noShadows ) {
    sun.setupShadows();
  }
  var dirLight = new THREE.DirectionalLight( 0x222222 );
  dirLight.position.set(1, 1, 1);
  scene.add(dirLight);
  if(debugLight) {
    scene.add(new THREE.AmbientLight(0x404040));
  }

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

  // if(trees.length < 200) {
  //   trees.push(makeRandomTree());
  // }

  controls.update();
  renderer.render(scene, camera);
  stats.end();
}

init();
render();
});
