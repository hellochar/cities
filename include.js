(function() {
  var lib = [
    "underscore.js",      //basic js helpers
    "jquery-1.8.3.js",

    "Box2dWeb-2.1.a.3.js",

    "seedrandom.js",      //noise and random for terrain and city generation
    "SimplexNoise.js",
    "PerlinNoise.js", 

    "three.js",           //renderer
    "Stats.js",

    "csg.js",             //constructive geometry for building generation
    "threecsg.js",

    "three-vector-support.js",

    "helvetiker_font/helvetiker_regular.typeface.js", 

    "TrackballControls.js", //control schemes for renderer
    "FirstPersonControls.js",
    "PivotControls.js",

    "TreeModel.js",
  ].map(function (x) { return 'lib/'+x;});

  var model = [
    "utils.js", 
    "face.js",
    "Road.js",
    "Land.js",
    "sun.js",
    "city.js",
    "Terrain.js",
    "Gameworld.js",
  ].map(function (x) { return 'model/'+x;});

  var generator = [
    'generator_utils.js',
    'basicgenerator.js',
  ].map(function (x) { return 'generator/'+x;});

  var urls = lib.concat(model).concat(generator);

  var finishedCount = 0;
  window.onFinish = [];
  window.onFinish.push = function(fn) {
    return Array.prototype.push.call(window.onFinish, fn.bind(window));
  };

  function loadTrigger(i) {
    if(i === urls.length) {
        window.onFinish.forEach(function (fn) {fn();});
        return;
    } else {
      var url = 'js/'+urls[i];
      var script = document.createElement('script');
      script.src = url;
      script.onload = function() {
        console.log('got '+url);
        loadTrigger(i + 1);
      }
      document.body.appendChild(script);
    }
  }
  loadTrigger(0);

  //press esc to quit
  document.onkeydown = function (e) { // press esc to quit
    if(e.keyCode == 27) { //escape
      window.close();
    }
  }
})();
