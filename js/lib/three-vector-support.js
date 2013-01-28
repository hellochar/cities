(function (THREE) {
  if(THREE === undefined) {
    console.log("cannot add vector support to THREE.js; not found!");
  }

  //addSelf(x, y, z)
  //multiplyScalar(x, y, z)

  var _originalMethods = {};
  _originalMethods["addSelf"] = THREE.Vector3.prototype["addSelf"];

  var proto = THREE.Vector3.prototype;

  proto.addSelf = function(x, y, z) {
    if(y === undefined && z === undefined) {
      return _originalMethods.addSelf.call(this, x);
    } else {
      this.x += x;
      this.y += y;
      this.z += z;
      return this;
    }
  }

  proto.toString = function () {
    return "("+this.x+", "+this.y+", "+this.z+")";
  }

  //Vector etc.
  THREE.Vector2.prototype.wedge = function (b) {
    return this.x * b.y - this.y * b.x;
  }

  THREE.Vector2.prototype.toString = function() { return "("+this.x+", "+this.y+")"; }

  THREE.Vector2.prototype.round = function() { this.x = Math.round(this.x); this.y = Math.round(this.y); return this; }

  THREE.Vector2.prototype.angle = function() { return Math.atan2(this.y, this.x); }

  //treats the vectors as positions
  THREE.Vector2.prototype.angleTo = function(v2) { return this.clone().subSelf(v2).angle(); }
  THREE.Vector2.prototype.angleBetween = function(v2) { return Math.acos((this.dot(v2)) / (this.length() * v2.length())); }

  THREE.Vector2.prototype.toBox2D = function() { return new Box2D.Common.Math.b2Vec2(this.x, this.y) };
  Box2D.Common.Math.b2Vec2.prototype.toTHREE = function() { return new THREE.Vector2(this.x, this.y) };

  THREE.Vector3.prototype.toString = function() { return "("+this.x+", "+this.y+", "+this.z+")"; }

  THREE.Vector3.prototype.lerp = function(end, amount) {
    return new THREE.Vector3(
        Math.mapLinear(amount, 0, 1, this.x, end.x),
        Math.mapLinear(amount, 0, 1, this.y, end.y),
        Math.mapLinear(amount, 0, 1, this.z, end.z)
        );
  }

  THREE.Vector3.spherical = function(azimuth, altitude) {
    return new THREE.Vector3(
        Math.cos(azimuth) * Math.cos(altitude),
        Math.sin(altitude),
        Math.sin(azimuth) * Math.cos(altitude)
    );
  }
})(window.THREE);
