//the sun rotates in the x-y plane
function Sun(period, sunColor, darkColor, directionalInfluence, intensityFunction) {
  this.period = period;

  this.sunColor = new THREE.Color(sunColor || 0x8b8888);
  this.darkColor = new THREE.Color(darkColor || 0x202020);

  this.directionalInfluence = directionalInfluence || 0.5;

  this.intensityFunction = intensityFunction || this.defaultIntensity;

  this.position = new THREE.Vector3();

  this.ambientLight = new THREE.AmbientLight();
  this.directionalLight = new THREE.DirectionalLight();

  this.sunRadius = worldWidth / 2 * 1.5;

  this.update();

  scene.add(this.ambientLight);
  scene.add(this.directionalLight);
};

//call each render
Sun.prototype.update = function () {
  this.time = new Date().getTime();

  this.angle = THREE.Math.mapLinear(this.time, 0, this.period, 0, 2*Math.PI) % (2*Math.PI);
  
  if(debugLight) this.angle = Math.PI/2;

  var shadowCutoffAngle = 30 * Math.PI / 180;
  var angleVector = new THREE.Vector2(Math.cos(this.angle), Math.sin(this.angle)); //unit
  var up = new THREE.Vector2(0, 1); //unit

  var angleBetween = Math.acos(angleVector.dot(up));

  if(Math.abs( angleBetween ) < Math.PI / 2 + shadowCutoffAngle) { //use shadows
    // renderer.shadowMapAutoUpdate = true;
  } else { //turn shadows off
    // renderer.shadowMapAutoUpdate = false;
    // renderer.setClearColor( 0xffffff, 1 );
    // renderer.clearTarget( this.directionalLight.shadowMap );
  }
  this.currentIntensity = this.intensityFunction(this.angle);
  this.currentColor = lerpColor(this.darkColor, this.sunColor, this.currentIntensity);

  this.position.set( this.sunRadius * Math.cos( this.angle ) , this.sunRadius * Math.sin( this.angle ) , 0 );

  //rotate the sun some amount along the positive y axis (to offset it with respect to the city)
//   var angle = 26.54 * Math.PI / 180; //26.54 degrees - completely random
//   var axis = new THREE.Vector3(0, 1, 0);
//   var matrix = new THREE.Matrix4().makeRotationAxis( axis, angle );
// 
  // matrix.multiplyVector3( this.position );

  //move the sun a little off center
  // this.position.addSelf(new THREE.Vector3(38, 0, 16));

  this.ambientLight.color.copy( lerpColor(this.currentColor, new THREE.Color(0x000000), 1 - this.directionalInfluence) );

  this.directionalLight.color.copy( lerpColor(this.currentColor, new THREE.Color(0x000000), this.directionalInfluence) );
  this.directionalLight.position.copy(this.position);

  renderer.setClearColor( 0x000000 );
};

//gets called with values ranging from 0 to 2*PI; PI/2 should be brightest (1); return values in the range [0, 1]; the intensity at 0 and PI should be 0 (or very close to)
Sun.prototype.defaultIntensity = function (angle) {
  // var value = Math.pow( 1 / (1 + Math.pow( Math.cos( angle ) , 8 ) ) , 8 );
  var value = (Math.sin(angle) + 1) / 2;
  return value;
};

Sun.prototype.setupShadows = function () {
  var light = this.directionalLight;

  light.shadowCameraNear = 200;
  light.shadowCameraFar = this.sunRadius * 2 ;

  var radius = Math.max(worldWidth, worldHeight) / 2 * 1.5;

  light.shadowCameraLeft = -radius;
  light.shadowCameraRight = radius;

  light.shadowCameraBottom = -radius;
  light.shadowCameraTop = radius;


  light.shadowMapWidth = Math.pow(2, 10);
  light.shadowMapHeight = Math.pow(2, 10);

  light.shadowCameraVisible = true;
  // light.onlyShadow = true;
  light.shadowDarkness = .5;
  light.shadowBias = .0033;

  light.castShadow = true;
};
