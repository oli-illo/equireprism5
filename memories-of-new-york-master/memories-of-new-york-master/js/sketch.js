var camera, scene, renderer;
var polyObjects = [];

var isUserInteracting = false,
  lon = 0,
  lat = 0,
  phi = 0,
  theta = 0,
  distance = 50,
  onPointerDownPointerX = 0,
  onPointerDownPointerY = 0,
  onPointerDownLon = 0,
  onPointerDownLat = 0;

init();
animate();

function init() {

  var container, mesh;

  container = document.getElementById('container');

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1100);
  camera.target = new THREE.Vector3(0, 0, 0);

  scene = new THREE.Scene();

  var geometry = new THREE.SphereBufferGeometry(500, 60, 40);
  geometry.scale(-1, 1, 1);

  var video = document.getElementById('video');
  video.play();

  var texture = new THREE.VideoTexture(video);
  var material = new THREE.MeshBasicMaterial({
    map: texture
  });

  mesh = new THREE.Mesh(geometry, material);

  scene.add(mesh);

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  document.addEventListener('mousedown', onDocumentMouseDown, false);
  document.addEventListener('mousemove', onDocumentMouseMove, false);
  document.addEventListener('mouseup', onDocumentMouseUp, false);
  document.addEventListener('wheel', onDocumentMouseWheel, false);

  window.addEventListener('resize', onWindowResize, false);

  var ambient = new THREE.HemisphereLight(0xbbbbff, 0x886666, 0.75);
  ambient.position.set(-0.5, 0.75, -1);
  scene.add(ambient);

  var light = new THREE.DirectionalLight(0xffffff, 0.75);
  light.position.set(1, 0.75, 0.5);
  scene.add(light);

}

var geometryFront = new THREE.BoxGeometry(1, 1, 1);
var materialFront = new THREE.MeshBasicMaterial({
  color: 0x00ff00
});
var in_front_of_you = new THREE.Mesh(geometryFront, materialFront);
camera.add(in_front_of_you);
in_front_of_you.position.set(0, 0, -50);

function getCoordsInFrontOfCamera() {
  const posInWorld = new THREE.Vector3();
  in_front_of_you.getWorldPosition(posInWorld);
  return posInWorld;
}

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

}

function onDocumentMouseDown(event) {

  event.preventDefault();

  isUserInteracting = true;

  onPointerDownPointerX = event.clientX;
  onPointerDownPointerY = event.clientY;

  onPointerDownLon = lon;
  onPointerDownLat = lat;

}

function onDocumentMouseMove(event) {

  if (isUserInteracting === true) {

    lon = (onPointerDownPointerX - event.clientX) * 0.1 + onPointerDownLon;
    lat = (event.clientY - onPointerDownPointerY) * 0.1 + onPointerDownLat;

  }

}

function onDocumentMouseUp() {

  isUserInteracting = false;

}

function onDocumentMouseWheel(event) {

  distance += event.deltaY * 0.05;

  distance = THREE.MathUtils.clamp(distance, 1, 50);

}

function animate() {

  requestAnimationFrame(animate);
  update();

  for (var i = 0; i < polyObjects.length; i++) {
    polyObjects[i].rotation.y += .01;
  }

}

function update() {

  lat = Math.max(-85, Math.min(85, lat));
  phi = THREE.MathUtils.degToRad(90 - lat);
  theta = THREE.MathUtils.degToRad(lon);

  camera.position.x = distance * Math.sin(phi) * Math.cos(theta);
  camera.position.y = distance * Math.cos(phi);
  camera.position.z = distance * Math.sin(phi) * Math.sin(theta);

  camera.lookAt(camera.target);

  renderer.render(scene, camera);

}

var listener = new THREE.AudioListener();
camera.add(listener);
var sound = new THREE.Audio(listener);
var audioLoader = new THREE.AudioLoader();

//Google Poly
function searchPoly(keywords) {
  console.log("Searching Poly for " + keywords);

  var url = `https://poly.googleapis.com/v1/assets?keywords=${keywords}&format=OBJ&key=${k1+k2+k3+k4+k5}`;
  var request = new XMLHttpRequest();
  request.open('GET', url, true);
  request.addEventListener('load', function(event) {
    var data = JSON.parse(event.target.response);
    var assets = data.assets;
    if (assets) {
      var asset = assets[0];
      var format = asset.formats.find(format => {
        return format.formatType === 'OBJ';
      });
      if (format === undefined) {
        console.log("no OBJ option");
      } else {
        var obj = format.root;
        var mtl = format.resources.find(resource => {
          return resource.url.endsWith('mtl')
        });
        mtl = mtl.relativePath;
        var path = obj.url.slice(0, obj.url.indexOf(obj.relativePath));
        obj = obj.relativePath;
        createObject(path, mtl, obj);
      }
    } else {
      results.innerHTML = '<center>NO RESULTS</center>';
    }
  });
  request.send(null);
}

function createObject(path, mtl, obj) {
  scene.remove(scene.children[3]);
  var mtlLoader = new THREE.MTLLoader();
  mtlLoader.setCrossOrigin(true);
  mtlLoader.setPath(path);
  mtlLoader.load(mtl, function(materials) {
    materials.preload();
    var objLoader = new THREE.OBJLoader();
    objLoader.setCrossOrigin(true);
    objLoader.setMaterials(materials);
    objLoader.setPath(path);
    objLoader.load(obj, function(object) {

      var box = new THREE.Box3();
      box.setFromObject(object);
      var scaler = new THREE.Group();
      scaler.add(object);
      var boxSize = new THREE.Vector3();
      box.getSize(boxSize);
      scaler.scale.setScalar(30 / boxSize.length());

      let front = getCoordsInFrontOfCamera();
      scaler.position.set(front.x, front.y, front.z);
      scene.add(scaler);
      polyObjects.push(scaler);

    });
  });
}

//---------------Buttons---------------

//Scene buttons
$("#empire-state-building").click(function() {
  window.location = "index.html";
});

$("#times-square-aerial").click(function() {
  window.location = "TimesSquareAerial.html";
});

$("#times-square").click(function() {
  window.location = "TimesSquare.html";
});

$("#wtc").click(function() {
  window.location = "WTC.html";
});

//Music buttons
$("#theme-from-ny-ny").click(function() {
  sound.pause();
  audioLoader.load('music/ThemeFromNewYorkNewYork.mp3', function(buffer) {
    playMusic(buffer);
  });
});

$("#empire-state-of-mind").click(function() {
  sound.pause();
  audioLoader.load('music/EmpireStateOfMind.mp3', function(buffer) {
    playMusic(buffer);
  });
});

$("#welcome-to-new-york").click(function() {
  sound.pause();
  audioLoader.load('music/WelcomeToNewYork.mp3', function(buffer) {
    playMusic(buffer);
  });
});

$("#music-stop").click(function() {
  sound.pause();
});

function playMusic(buffer) {
  sound.setBuffer(buffer);
  sound.setLoop(true);
  sound.setVolume(0.5);
  sound.play();
}

//Object buttons
$("#plane").click(function() {
  searchPoly("plane");
});

$("#balloon").click(function() {
  searchPoly("air bolloons");
});

$("#car").click(function() {
  searchPoly("car");
});

$("#penguin").click(function() {
  searchPoly("penguin");
});

$("#helicopter").click(function() {
  searchPoly("helicopter");
});

$("#cloud").click(function() {
  searchPoly("sky");
});

$("#paper-plane").click(function() {
  searchPoly("paper plane");
});

$("#none").click(function() {
  scene.remove(scene.children[3]);
});
