var canvas;
var gl;
var sq;
var pyr;
var viewToggle;
var cam;
var interpolated;

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");
    gl = canvas.getContext('webgl2');
    if ( !gl ) { alert("WebGL 2.0 isn't available"); }

    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.polygonOffset(1, 1);

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1, 1, 1, 1);
    gl.enable(gl.DEPTH_TEST);

    viewToggle = false;
    interpolated = true;
    cam = new Camera();
    cam.pitch(45);
    sq = new Square(cam);
    pyr = new Pyramid(cam, "vshader1.glsl", "fshader1.glsl");

    render();
};

class Square {
    constructor(cam){
        var vertices = [vec3(-1, 0, -1), vec3(1, 0, -1), vec3(1, 0, 1),
            vec3(-1, 0, -1), vec3(1, 0, 1), vec3(-1, 0, 1)];

        // Load shaders and initialize attribute buffers
        this.program = initShaders(gl, "/vshader.glsl", "/fshader.glsl");
        gl.useProgram(this.program);

        // Load the data into the GPU
        this.bufferId = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferId);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

        // Get the location of the attribute and uniform variables from the shader program.
        this.aPosition = gl.getAttribLocation(this.program, "aPosition");
        this.uColor = gl.getUniformLocation(this.program, "uColor");
      
        this.modelMatrix = scale(2.5, 0, 2.5);
        this.modelMatrixID = gl.getUniformLocation(this.program, "modelMatrix");

        this.projMatrix = perspective(45, canvas.width / canvas.height, 0.1, 100);
        this.projMatrixID = gl.getUniformLocation(this.program, "projMatrix");

        this.camMatrix = cam.camMatrix;
        this.camMatrixID = gl.getUniformLocation(this.program, "camMatrix");
    }
    
    draw() {
        gl.useProgram(this.program);
        
        // point the attributes to the buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferId);
        gl.vertexAttribPointer(this.aPosition, 3, gl.FLOAT, false, 0, 0);
        
        // set the uniform variables
        gl.uniform4fv(this.uColor, vec4(0, 1, 0, 1));
        gl.uniformMatrix4fv(this.modelMatrixID, false, flatten(this.modelMatrix));
        gl.uniformMatrix4fv(this.projMatrixID, false, flatten(this.projMatrix));
        gl.uniformMatrix4fv(this.camMatrixID, false, flatten(this.camMatrix));
        
        // enable and draw!
        gl.enableVertexAttribArray(this.aPosition);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.disableVertexAttribArray(this.aPosition);
    }
}

class Pyramid {
    constructor(cam, vShader, fShader) {
        var vertices = [
            vec3(-1, 0, 1),
            vec3(1, 0, 1),
            vec3(-1, 0, -1),
            vec3(1, 0, -1),
            vec3(0, 1, 0)
        ];

        var vertexColors = [
            [ 1.0, 0.0, 0.0, 1.0 ], // red
            [ 1.0, 1.0, 0.0, 1.0 ], // yellow
            [ 0.0, 0.0, 0.0, 1.0 ], // black
            [ 0.0, 1.0, 0.0, 1.0 ], // green
            [ 1.0, 0.0, 1.0, 1.0 ] // magenta
        ];

        var indices = [
            0, 1, 3,
            0, 3, 2,
            3, 1, 4,
            3, 4, 2,
            0, 2, 4,
            0, 4, 1
        ];

        // Load shaders and initialize attribute buffers
        this.program = initShaders(gl, vShader, fShader);
        gl.useProgram(this.program);

        // Load the data into the GPU
        this.vID = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vID);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

        this.cID = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.cID);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(vertexColors), gl.STATIC_DRAW);
        this.aColor = gl.getAttribLocation(this.program, "aColor");

        this.eID = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.eID);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices), gl.STATIC_DRAW);

        // Get the location of the attribute and uniform variables from the shader program.
        this.aPosition = gl.getAttribLocation(this.program, "aPosition");

        this.modelMatrix = mat4();
        this.modelMatrixID = gl.getUniformLocation(this.program, "modelMatrix");

        this.projMatrix = perspective(45, canvas.width / canvas.height, 0.1, 100);
        this.projMatrixID = gl.getUniformLocation(this.program, "projMatrix");

        this.camMatrix = cam.camMatrix;
        this.camMatrixID = gl.getUniformLocation(this.program, "camMatrix");

        //frame
        //shader stuff
        this.frameProgram = initShaders( gl, "/vshader3.glsl", "/fshader1.glsl" );
        gl.useProgram( this.frameProgram );
        this.faPosition = gl.getAttribLocation( this.frameProgram, "aPosition" );

        this.fModelMatrix = mat4();
        this.fModelMatrixID = gl.getUniformLocation(this.frameProgram, "modelMatrix");

        this.fProjMatrix = perspective(45, canvas.width / canvas.height, 0.1, 100);
        this.fProjMatrixID = gl.getUniformLocation(this.frameProgram, "projMatrix");

        this.fCamMatrix = cam.camMatrix;
        this.fCamMatrixID = gl.getUniformLocation(this.frameProgram, "camMatrix");
    }

    draw() {
        gl.useProgram(this.program);
        
        // point the attributes to the buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vID);
        gl.vertexAttribPointer(this.aPosition, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.cID);
        gl.vertexAttribPointer(this.aColor, 4, gl.FLOAT, false, 0, 0);
        
        // set the uniform variables
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.eID);
        gl.uniformMatrix4fv(this.modelMatrixID, false, flatten(this.modelMatrix));
        gl.uniformMatrix4fv(this.projMatrixID, false, flatten(this.projMatrix));
        gl.uniformMatrix4fv(this.camMatrixID, false, flatten(this.camMatrix));
        
        // enable and draw!
        gl.enableVertexAttribArray(this.aPosition);
        gl.enableVertexAttribArray(this.aColor);
        gl.drawElements(gl.TRIANGLES, 18, gl.UNSIGNED_BYTE, 0);
        gl.disableVertexAttribArray(this.aPosition);
        gl.disableVertexAttribArray(this.aColor);

        //Draw the cube frame
        gl.useProgram( this.frameProgram );
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vID);
        gl.vertexAttribPointer(this.faPosition, 3, gl.FLOAT, false, 0, 0 );
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.fID);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.eID);
        gl.uniformMatrix4fv(this.fModelMatrixID, false, flatten(this.fModelMatrix));
        gl.uniformMatrix4fv(this.fProjMatrixID, false, flatten(this.fProjMatrix));
        gl.uniformMatrix4fv(this.fCamMatrixID, false, flatten(this.fCamMatrix));

        gl.enableVertexAttribArray(this.faPosition);
        gl.drawElements(gl.LINES, 18, gl.UNSIGNED_BYTE, 0);
        gl.disableVertexAttribArray(this.faPosition );
    }
}

class Camera {
    constructor() {
        this.camMatrix = mat4();
        this.eye = vec3(0, 5, 5);
        this.u = vec3(1, 0, 0);
        this.v = vec3(0, 1, 0);
        this.n = vec3(0, 0, 1);
        this.updateCamMatrix();
    }

    pitch(amt) {
        var angle = radians(amt);
        var vp = subtract(mult(Math.cos(angle), this.v), mult(Math.sin(angle), this.n));
        var np = add(mult(Math.sin(angle), this.v), mult(Math.cos(angle), this.n));
        this.v = normalize(vp);
        this.n = normalize(np);
        this.updateCamMatrix();
    }

    yaw(amt) {
        var angle = radians(amt);
        var up = add(mult(Math.cos(angle), this.u), mult(Math.sin(angle), this.n));
        var np = add(mult(-Math.sin(angle), this.u), mult(Math.cos(angle), this.n));
        this.u = normalize(up);
        this.n = normalize(np);
        this.updateCamMatrix();
    }

    roll(amt) {
        var angle = radians(amt);
        var up = subtract(mult(Math.cos(angle), this.u), mult(Math.sin(angle), this.v));
        var vp = add(mult(Math.sin(angle), this.u), mult(Math.cos(angle), this.v));
        this.u = normalize(up);
        this.v = normalize(vp);
        this.updateCamMatrix();
    }

    moveN(amt) {
        this.eye = add(this.eye, mult(-amt, this.n));
        this.updateCamMatrix();
    }

    moveU(amt) {
        this.eye = add(this.eye, mult(-amt, this.u));
        this.updateCamMatrix();
    }

    updateCamMatrix(){
        this.camMatrix = lookAt(this.eye, subtract(this.eye, this.n), this.v);
    }
}


function render() {
    setTimeout(function() {
        requestAnimationFrame(render);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        sq.draw();
        pyr.draw();
    }, 100);
}

document.addEventListener('keyup', event => {
    switch(event.code) {
        case 'KeyP':
            viewToggle = !viewToggle;
            sq.projMatrix = viewToggle ? ortho(-2, 2, -2, 2, 0.1, 100) : perspective(45, canvas.width / canvas.height, 0.1, 100);
            pyr.projMatrix = sq.projMatrix;
            pyr.fProjMatrix = sq.projMatrix;
            break;
        case 'KeyX':
            if (event.shiftKey) {
                cam.pitch(-5);
            } else {
                cam.pitch(5);
            }
            break;
        case 'KeyC':
            if (event.shiftKey) {
                cam.yaw(-5);
            } else {
                cam.yaw(5);
            }
            break;
        case 'KeyZ':
            if (event.shiftKey) {
                cam.roll(-5);
            } else {
                cam.roll(5);
            }
            break;
        case 'ArrowLeft':
            cam.moveU(1);
            break;
        case 'ArrowUp':
            cam.moveN(1);
            break;
        case 'ArrowDown':
            cam.moveN(-1);
            break;
        case 'ArrowRight':
            cam.moveU(-1);
            break;
        case 'Space':
            interpolated = !interpolated;
            if (interpolated) {
                pyr = new Pyramid(cam, "vshader1.glsl", "fshader1.glsl");
            } else {
                pyr = new Pyramid(cam, "vshader2.glsl", "fshader2.glsl");
            }
            break;
    }
    sq.camMatrix = cam.camMatrix;
    pyr.camMatrix = cam.camMatrix;
    pyr.fCamMatrix = cam.camMatrix;
});
