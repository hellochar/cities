window.onFinish.push(function () {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(90, window.innerWidth/window.innerHeight, .001, 10000);
  camera.position.set(0, 50, 50);

  renderer = new THREE.WebGLRenderer({ clearColor: 0x808080, clearAlpha: 1 });
  renderer.setSize(window.innerWidth, window.innerHeight);

  document.body.appendChild(renderer.domElement);
  window.addEventListener( 'resize', onWindowResize, false );
  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
  }

  controls = new THREE.TrackballControls(camera);

  scene.add(new THREE.AxisHelper(1));


  setupLights = function() {
    light = new THREE.DirectionalLight(0xffffff);
    light.position.set(1,1,1);
    scene.add(light);
  }

  function render() {
    requestAnimationFrame(render);
    controls.update();
    renderer.render(scene, camera);
  }
  render();
});

