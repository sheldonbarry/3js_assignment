"use strict";

var menuDisplayed = false;
var menuBox = null;

var renderer = null,
scene = null,
camera = null,
light = null,
firelight = null,
group = null,
speed = 0.01,
zoom = 0,
init_zoom = 18,
animating = false,
clockwise = true,
daytime = true;

window.onload = function init()
{
    // Get container div
    var container = document.getElementById("container");

    // Create the Three.js renderer, add it to our div
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    renderer.sortObjects = false;
    container.appendChild( renderer.domElement );

    // Create a new Three.js scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xeeeeee );

    // Set up camera
    camera = new THREE.PerspectiveCamera( 45, container.offsetWidth / container.offsetHeight, 1, 4000 );
    camera.position.set( 0, 0, init_zoom );

    // Create a directional light to show off the objects
    light = new THREE.DirectionalLight( 0xffffff, 1.5);
    light.position.set(0, 0, 1);
    scene.add( light );


    // use for debugging
    // var axesHelper = new THREE.AxesHelper( 5 );
    // scene.add( axesHelper );


    // create a group to hold all objects in the scene
    group = new THREE.Group();
    
    // Create a point light for night fire (initial state is black i.e. no light)
    firelight = new THREE.PointLight( 0x000000, 1, 0, 2);
    firelight.position.set(0, 0, 2);
    group.add( firelight );    


    var texture0 = new THREE.TextureLoader();
    texture0.load("./images/grass.jpg", texture => {
    // First add a plane and rotate to ground
      var planeGeometry = new THREE.PlaneGeometry(12,12,1,1);
      var planeMaterial = new THREE.MeshPhongMaterial( { map: texture } );
      var plane = new THREE.Mesh( planeGeometry, planeMaterial ); 
      // set ground position and rotation
      plane.position.y = 0;
      plane.rotation.x = -90 * Math.PI / 180;
      // keeps ground plane at bottom of objects on same plane
      plane.renderOrder = 0; 
      group.add(plane);
      },
    );

    // Create shaded, texture-mapped objects and add them to the scene grouping

    var texture1 = new THREE.TextureLoader();
    texture1.load("./images/water.jpg", texture => {
      var circleGeometry = new THREE.CircleGeometry(3, 32);
      var circleMaterial = new THREE.MeshPhongMaterial( { map: texture } );
      var circle = new THREE.Mesh( circleGeometry, circleMaterial );
      circle.position.z = -2;
      circle.position.x = -1;
      circle.position.y = 0.002;
      circle.rotation.x = -90 * Math.PI / 180;
      circle.renderOrder = 1;
      group.add(circle);
      },
    );

    var texture2 = new THREE.TextureLoader();
    texture2.load("./images/mud.jpg", texture => {
      var cylinderGeometry = new THREE.CylinderGeometry(0.8, 0.8, 1, 16);
      var cylinderMaterial = new THREE.MeshPhongMaterial( { map: texture } );
      var cylinder = new THREE.Mesh( cylinderGeometry, cylinderMaterial );
      cylinder.position.x = 2.5;
      cylinder.position.y = 0.5
      cylinder.position.z = 2;
      cylinder.renderOrder = 2; 
      group.add(cylinder);
      },
    );

    var texture3 = new THREE.TextureLoader();
    texture3.load("./images/thatch.jpg", texture => {
      var coneGeometry = new THREE.ConeGeometry(1, 1, 16);
      var coneMaterial = new THREE.MeshPhongMaterial( { map: texture } );
      var cone = new THREE.Mesh( coneGeometry, coneMaterial );
      cone.position.x = 2.5;
      cone.position.y = 1.5;
      cone.position.z = 2;
      cone.renderOrder = 3; 
      group.add(cone);
      },
    );

    var texture4 = new THREE.TextureLoader();
    texture4.load("./images/bricks.jpg", texture => {
      var sphereGeometry = new THREE.SphereGeometry(1, 16, 16, 0, Math.PI * 2, 0, Math.PI/2);
      var sphereMaterial = new THREE.MeshPhongMaterial( { map: texture } );
      var sphere = new THREE.Mesh( sphereGeometry, sphereMaterial );
      sphere.position.x = -1.5;
      sphere.position.y = 0;
      sphere.position.z = 4;
      sphere.renderOrder = 4; 
      group.add(sphere);
      },
    );

    // Create and add fire object to scene
    var texture5 = new THREE.TextureLoader();
    texture5.load("./images/flames.jpg", texture => {
      var fireGeometry = new THREE.ConeGeometry(0.15, 0.3, 16);
      var fireMaterial = new THREE.MeshBasicMaterial( { map: texture } );
      var fire = new THREE.Mesh( fireGeometry, fireMaterial );
      fire.position.x = 0;
      fire.position.y = 0.15;
      fire.position.z = 2;
      fire.renderOrder = 5; 
      group.add(fire);
      },
    );

    // Turn objects toward the scene to better see 3d shapes!
    group.rotation.x = Math.PI / 8;
    group.rotation.y = Math.PI / 1.5;

    // Add the group of objects to our scene
    scene.add(group);

    // setup context menu event listeners
    
    renderer.domElement.addEventListener("contextmenu", function(event) {
        var left = event.clientX-1;
        var top = event.clientY-1;
        menuBox = window.document.querySelector(".menu");
        menuBox.style.left = left + "px";
        menuBox.style.top = top + "px";
        menuBox.style.display = "block";
        event.preventDefault();
        menuDisplayed = true;
    }, false);

    window.addEventListener("click", function() {
        if(menuDisplayed == true){
            menuBox.style.display = "none"; 
        }
    }, true);

    // context menu actions
    document.getElementById("menu-zoomin").onclick = function () {
        var newzoom = zoom + 1;
        var s = document.getElementById("slide-zoom");
        s.value = newzoom.toString();
        adjustZoom();
    };
    document.getElementById("menu-zoomout").onclick = function () {
        var newzoom = zoom - 1;
        var s = document.getElementById("slide-zoom");
        s.value = newzoom.toString();
        adjustZoom();
    };
    document.getElementById("menu-change-direction").onclick = function () {
        toggleDirection();
    };
    document.getElementById("menu-change-daynight").onclick = function () {
        toggleDaynight();
    };

    // Run our render loop
    run();
}

function run()
{
    // Day and Night scene light settings
    if (daytime)
    {
        light.color.setHex ( 0xffffff );
        firelight.color.setHex (0x000000);
    }
    else
    {
        light.color.setHex ( 0x000000 );
        firelight.color.setHex ( 0xff9900 );
    }
    
    // Render the scene
    renderer.render( scene, camera );
    if (animating)
    {
        if (clockwise)
        {
            group.rotation.y -= speed;
        }
        else
        {
            group.rotation.y += speed;
        }
    }
    // Spin the objects for next frame
    // Ask for another frame
    requestAnimationFrame(run);
}

function toggleAnimate()
{
    animating = !animating;
}

function toggleDirection()
{
    clockwise = !clockwise;
}

function toggleDaynight()
{
    daytime = !daytime;
}

function adjustSpeed()
{
    speed = parseFloat(document.getElementById("slide-speed").value);   
}

function adjustZoom()
{
    zoom = parseFloat(document.getElementById("slide-zoom").value);
    // set zoom of camera
    camera.position.z = init_zoom - zoom
}
