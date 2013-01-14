function City(width, height, simScale, options) {
  this.width = width;
  this.height = height;
  this.simScale = simScale;
  this.meshes = [];


  this.land = new Land(width * simScale, height * simScale, function (land) { land.done = true; }, options);

  this.land.done = false;
  this.land.init();
  while(!this.land.done) {
    this.land.update(); //this will call the callback on the 3rd argument when it's "done"
  }
  delete this.land.done;

  this.simRawEdges = detectFaces(this.land.all_roads);



  var facesCanvasCoords = this.simRawEdges.map(function (edges) { return new Face(edges); });
  var halfSim = new THREE.Vector2( this.land.width / 2, this.land.height / 2);
  this.faces = facesCanvasCoords.map(function (face) { return face.subSelf( halfSim ).multiplyScalar( 1 / simScale ); });

  if(debugBuilding) {
    var extent = width/5;
    this.faces = [
      new Face([
        new THREE.Vector2(extent/2, 0),
        new THREE.Vector2(0, extent/2),
        new THREE.Vector2(-extent/2, 0),
        new THREE.Vector2(0, -extent/2),
      ])
      // new Face([
      //   new THREE.Vector2(-extent/2, -extent/2),
      //   new THREE.Vector2(extent/2, -extent/2),
      //   new THREE.Vector2(extent/2, extent/2),
      //   new THREE.Vector2(-extent/2, extent/2)
      // ])
    ];
  }

  this.faces = this.faces.filter(function (face) {
    return face.getCentroid().lengthSq() / (this.width * this.width + this.height * this.height) / 4 < Math.random();
  }, this);

  // this.faces = this.faces.filter(function (face) {
  //   return ! ( face.getArea() < 100 || face.getArea() > 10000 );
  // });

  this.faces = this.faces.map(function (face) { return face.getInset(40); });

  window.si = [];
  this.faces = this.faces.filter(function (face) {
    var si = face.selfIntersects();
    if(si) window.si.push(face);
    return !si;
  });

  //sort faces array by how many points the polygon has. Helps to detect crazy geometries with like 10+ faces
  //faces.sort(function (x, y) { return y.length - x.length; });

  this.faces.forEach(function (vertices, idx) {

    var geometry = this.createGeometry(vertices);

    var color = new THREE.Color(); color.r = Math.random(); color.g = Math.random(); color.b = Math.random();

    // var materialSide = new THREE.MeshLambertMaterial({ side: THREE.DoubleSide, color:color, shading: THREE.FlatShading});
    // var materialRoof = new THREE.MeshLambertMaterial({ side: THREE.DoubleSide, transparent: false, opacity: 0.8, color:color, shading: THREE.FlatShading});

    // var mesh = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial( [materialSide, materialRoof ] ) );

    var material = new THREE.MeshLambertMaterial({ side: THREE.DoubleSide, color:color, shading: THREE.FlatShading});
    var mesh = new THREE.Mesh(geometry, material);

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    this.meshes.push(mesh);

    console.log("completed "+(idx+1)+" of "+this.faces.length);
  }, this);

  // this.mesh.name = "City";
}

City.prototype.createGeometry = function (face) {
  //Choose a height for the building; ones farther away from the center are smaller
  var centroid = face.getCentroid();
  var heightScalar = (1 / this.simScale) * 1 / (2 * centroid.lengthSq() / (this.width * this.height) + 1); //curves from *1 to *1/4

  // var heightSample = _.map(vertices, function (vertex) { return terrain.getHeight(vertex.x, vertex.y); });
  // var groundPlane = _.min(heightSample);
  // var groundHighest = _.max(heightSample);
  // var height = (Math.random() * 3 + 5) * heightScalar + (groundHighest - groundPlane);
  // console.log("heightScalar, height contributon from ground:  "+heightScalar+", "+(groundHighest - groundPlane)+"("+groundPlane+")");

  var height = (Math.random() * 3 + 5) * heightScalar;

  try{
    var geometry;
    if(simpleBuildings) {
      geometry = simpleBuilding(face, height);
    } else {
      geometry = randomBuilding(face, height);
    }

    return geometry;
  }catch(err) {
    console.log('bad: '+err.stack);
    var floatGeom = face.extrudeY(height*500, true);

    var mat = new THREE.MeshBasicMaterial({color:0xff0000, transparent: true, opacity: .2});

    this.meshes.push(new THREE.Mesh(floatGeom, mat));
    return new THREE.CubeGeometry(1,1,1);
  }
};

