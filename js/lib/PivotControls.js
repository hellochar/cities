PivotControls = function ( camera, scene, wantedDistance, domElement ) {
  this.domElement = ( domElement !== undefined ) ? domElement : document;
  this.scene = scene;
  this.camera = camera;

  if(wantedDistance) {
    this.wantedDistance = wantedDistance;
    this.camera.position.set(0, wantedDistance, wantedDistance);
  }

  this.mouseX = this.mouseY = 0;

  this.update = function() {
    var angle = (this.mouseX - window.innerWidth / 2) / (window.innerWidth) * 2 * Math.PI;
    console.log("angle: "+this.angle+": "+this.mouseX+", "+window);

    var length = new THREE.Vector2(this.camera.position.x, this.camera.position.z).length();
    if(length == 0) length = this.camera.position.y != 0 ? this.camera.position.y : 500;
    console.log("length: "+this.length);

    this.camera.position.z = length * Math.cos(angle);
    this.camera.position.x = length * Math.sin(angle);
    this.camera.lookAt( scene.position );
  }.bind(this);

  function mousemove(evt) {
    this.mouseX = evt.clientX;
    this.mouseY = evt.clientY;
  }

  this.domElement.addEventListener( 'mousemove', mousemove, false );
};
