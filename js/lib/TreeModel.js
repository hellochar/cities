var TreeModel = function (base_length, base_radius, foliageLength, segments, doSpheres, material) {

  THREE.Object3D.call( this );

  if ( base_length === undefined ) base_length = 20;
  if ( base_radius === undefined ) base_radius = 5;
  segments = segments || 10;
  doSpheres = doSpheres || false;

  this.material = material || new THREE.MeshLambertMaterial({color: 0xffbb88});

  //logic for generating tree structure
  function Branch(start, end, thickStart, thickEnd) {
    this.start = start;
    this.end = end;
    this.offset = end.clone().subSelf(start);
    this.thickStart = thickStart;
    this.thickEnd = thickEnd;
  }

  var main = new Branch( new THREE.Vector3(), new THREE.Vector3(0, base_length, 0), base_radius, base_radius * 3/5);
  var branches = [main];
  var tip = [main];
  for(var i = 0; i < 2; i++) {

    var spawns = tip.map( function (branch) {
      return _.range(Math.randInt(2, 3)).map( function (bIdx) {
        var shortenFactor = Math.randFloat(.3, .7);
        var offset = new THREE.Vector3( Math.randFloatSpread(1), Math.random(), Math.randFloatSpread(1) ).setLength( branch.offset.length() * shortenFactor );
        return new Branch(branch.end, branch.end.clone().addSelf(offset), branch.thickEnd, branch.thickEnd * shortenFactor );
      });
    });

    tip = _.flatten(spawns);
    branches = branches.concat(tip);
  }


  //create trunk branches
  branches.forEach(function (branch) {
    var offset = branch.offset;
    var tall = offset.length() * 1.0;
    // var azimuth = Math.atan2( offset.z, offset.x );
    // var altitude = offset.angleTo( new THREE.Vector3(offset.x, 0, offset.z) );

    var cGeom = new THREE.CylinderGeometry(branch.thickEnd, branch.thickStart, tall, segments);
    cGeom.applyMatrix(new THREE.Matrix4().makeTranslation( new THREE.Vector3( 0, tall/2, 0 ) ) );
    //cylinder is now going from origin to 0, height, 0

    //rotate to put it on positive X axis (rotate +Z by -pi/2);
    //rotate to put it on x-z axis (rotate Y by -azimuth)
    //rotate to put it on up axis (rotate Z by altitude)

    // cylinder.applyMatrix(new THREE.Matrix4().makeRotationZ( -Math.PI/2 ) );
    // cylinder.applyMatrix(new THREE.Matrix4().makeRotationY( -azimuth ) );
    // cylinder.applyMatrix(new THREE.Matrix4().makeRotationZ( altitude ) );

    // cylinder.applyMatrix(new THREE.Matrix4().makeTranslation( branch.start ) );

    var cylinder = new THREE.Mesh(cGeom, this.material );
    cylinder.position.copy( branch.start );


    var axis = new THREE.Vector3( 0, 1, 0 ).crossSelf( offset );
    var radians = new THREE.Vector3( 0, 1, 0 ).angleTo( offset );
    cylinder.matrix = new THREE.Matrix4().makeRotationAxis( axis.normalize(), radians );
    cylinder.rotation.setEulerFromRotationMatrix( cylinder.matrix, cylinder.eulerOrder );

    this.add(cylinder);

    if(doSpheres) {
      var sphere = new THREE.Mesh( new THREE.SphereGeometry( branch.thickStart, segments, segments ), this.material );
      sphere.position.copy( branch.end );
      this.add(sphere);
    }

  }, this);

  var pGeom = new THREE.PlaneGeometry(foliageLength, foliageLength);
  pGeom.applyMatrix( new THREE.Matrix4().makeRotationX( -Math.PI/2 ) );
  var pMat = new THREE.MeshLambertMaterial({color: 0x37b677, side: THREE.DoubleSide});

  //create foliage
  (tip.concat(_.chain(branches).difference(tip).without(main).value()).filter(function (x) { return Math.random() < .5 }) ).forEach(function (endBranch) {
    var offset = endBranch.offset.clone();

    //bias the foliage to point up a little bit
    offset.setY(offset.y * 2);
    offset.normalize();

    var foliage = new THREE.Mesh(pGeom, pMat);

    var axis = new THREE.Vector3( 0, 1, 0 ).crossSelf( offset );
    var radians = new THREE.Vector3( 0, 1, 0 ).angleTo( offset );
    foliage.matrix = new THREE.Matrix4().makeRotationAxis( axis.normalize(), radians );
    foliage.rotation.setEulerFromRotationMatrix( foliage.matrix, foliage.eulerOrder );

    foliage.position.copy( endBranch.end.clone().addSelf( offset.setLength(.1) ) );

    this.add(foliage);
  }, this);

};

Tree.prototype = Object.create( THREE.Object3D.prototype );
