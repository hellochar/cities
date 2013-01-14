(function (THREE) {
  if(THREE === undefined) {
    console.log("cannot add vector support to THREE.js; not found!");
  }

  //addSelf(x, y, z)
  //multiplyScalar(x, y, z)

  var _originalMethods = window._originalMethods = {};
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
})(window.THREE);
