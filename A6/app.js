var canvas;
var gl;
var sphere;
var plane;
var cube;
var sun;
var sunAngle;
var flash;
var toggleFlash;
var vertexShade;
var cam;

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");
    gl = canvas.getContext('webgl2');
    if ( !gl ) { alert("WebGL 2.0 isn't available"); }

    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.polygonOffset(1, 1);

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.9, 0.9, 0.9, 1);
    gl.enable(gl.DEPTH_TEST);

    vertexShade = true;
    sunAngle = 0;
    var sunLight = [
        vec4(10, 0, 0, 1),
        vec4(0.2, 0.2, 0.2, 1),
        vec4(.8, .8, .8, 1),
        vec4(.8, .8, .8, 1),
        0
    ];

    var flashLight = [
        vec4(0.2, 0.2, 0.2, 1),
        vec4(.8, .8, .8, 1),
        vec4(.8, .8, .8, 1),
        10
    ]

    cam = new Camera(vec3(0, 0, 0), vec3(0, 1, 0));
    sun = new Light(...sunLight);
    flash = new Light(cam.eye, ...flashLight);
    sphere = new Sphere(cam, 4, 'vShaderV.glsl', 'fShaderV.glsl');
    plane = new Plane(cam, 1, 'vShaderV.glsl', 'fShaderV.glsl');
    cube = new Cube(cam, 'vShaderV.glsl', 'fShaderV.glsl')
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

        this.projMatrix = perspective(90, canvas.width / canvas.height, 0.1, 10);
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

class Plane {
    constructor(cam, subdivs, vShader, fShader) {
        this.numVertices = 2 * 4 ** subdivs * 3;
        var a = vec3(-1, 0, 1);
        var b = vec3(1, 0, 1);
        var c = vec3(1, 0, -1);
        var d = vec3(-1, 0, -1);
        this.vPositions = [];
        this.vNormals = [];
        this.divideQuad(a, b, c, d, subdivs);
        this.program = initShaders(gl, vShader, fShader);
        gl.useProgram(this.program);

        // Load the data into the GPU
        this.vID = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vID);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.vPositions), gl.STATIC_DRAW);

        this.nID = gl.createBuffer();
        gl.bindBuffer( gl.ARRAY_BUFFER, this.nID );
        gl.bufferData( gl.ARRAY_BUFFER, flatten(this.vNormals), gl.STATIC_DRAW );

        // Get the location of the attribute and uniform variables from the shader program.
        this.aColor = gl.getAttribLocation(this.program, "aColor");
        this.aPosition = gl.getAttribLocation(this.program, "aPosition");
        this.aNormal = gl.getAttribLocation( this.program, "aNormal" );

        this.modelMatrix = scale(10, 0, 10);
        this.modelMatrixID = gl.getUniformLocation(this.program, "modelMatrix");

        this.projMatrix = perspective(90, canvas.width / canvas.height, 0.1, 100);
        this.projMatrixID = gl.getUniformLocation(this.program, "projMatrix");

        this.camMatrix = cam.camMatrix;
        this.camMatrixID = gl.getUniformLocation(this.program, "camMatrix");

        this.lightPos = gl.getUniformLocation(this.program, "lightPos");
        this.lightDiff = gl.getUniformLocation(this.program, "lightDiffuse");
        this.lightSpec = gl.getUniformLocation(this.program, "lightSpecular");
        this.lightAmb = gl.getUniformLocation(this.program, "lightAmbient");
        //this.lightAlpha = gl.getUniformLocation(this.program, "lightAlpha");

        this.specular = vec4(0, 0, 0, 1);
        this.diffuse = vec4(1, 1, 1, 1);
        this.ambient = vec4(0, 1, 0, 1);
        this.shininess = 10;
        this.matSpec = gl.getUniformLocation(this.program, "matSpecular");
        this.matDiff = gl.getUniformLocation(this.program, "matDiffuse");
        this.matAmb = gl.getUniformLocation(this.program, "matAmbient");
        this.matAlpha = gl.getUniformLocation(this.program, "matAlpha");
    }

    divideQuad(a, b, c, d, depth) {
        if (depth > 0) {
            var v1 = mult(0.5, add(a, b));
            var v2 = mult(0.5, add(b, c));
            var v3 = mult(0.5, add(c, d));
            var v4 = mult(0.5, add(d, a));
            var v5 = mult(0.5, add(a, c));
            this.divideQuad(a, v1, v5, v4, depth - 1);
            this.divideQuad(v1, b, v2, v5, depth - 1);
            this.divideQuad(v2, c, v3, v5, depth - 1);
            this.divideQuad(v3, d, v4, v5, depth - 1);
        } else {
            //Triangle #1
            this.triangle(a, b, c);
            //Triangle #2
            this.triangle(c, d, a);
        }
    }
    
    triangle(a, b, c){
        var N = normalize(cross(subtract(b, a), subtract(c, a)));
        this.vPositions.push(vec4(...a, 1.0));
        this.vNormals.push(N);
        this.vPositions.push(vec4(...b, 1.0));
        this.vNormals.push(N);
        this.vPositions.push(vec4(...c, 1.0));
        this.vNormals.push(N);
    }

    draw() {
        gl.useProgram(this.program);
        
        // point the attributes to the buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vID);
        gl.vertexAttribPointer(this.aPosition, 4, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.nID);
        gl.vertexAttribPointer(this.aNormal, 3, gl.FLOAT, false, 0, 0 );
        
        // set the uniform variables
        gl.uniformMatrix4fv(this.modelMatrixID, false, flatten(this.modelMatrix));
        gl.uniformMatrix4fv(this.projMatrixID, false, flatten(this.projMatrix));
        gl.uniformMatrix4fv(this.camMatrixID, false, flatten(this.camMatrix));

        //assumes a light object called light
        gl.uniform4fv(this.lightPos, sun.position);
        gl.uniform4fv(this.lightDiff, sun.diffuse);
        gl.uniform4fv(this.lightSpec, sun.specular);
        gl.uniform4fv(this.lightAmb, sun.ambient);
        // gl.uniform1f(this.lightAlpha, sun.alpha);

        gl.uniform4fv(this.matSpec, this.specular);
        gl.uniform4fv(this.matDiff, this.diffuse);
        gl.uniform4fv(this.matAmb, this.ambient);
        gl.uniform1f(this.matAlpha, this.shininess);

        // enable and draw!
        gl.enableVertexAttribArray(this.aPosition);
        gl.enableVertexAttribArray(this.aNormal);
        gl.drawArrays(gl.TRIANGLES, 0, this.numVertices);
        gl.disableVertexAttribArray(this.aPosition);
        gl.disableVertexAttribArray(this.aNormal); 
    }
}

class Sphere {
    constructor(cam, subdivs, vShader, fShader) {
        //(4 triangular faces per tetrahedron)^(numDivisions+1)*3 vertices per triangle
        this.numVertices = 4 ** (subdivs + 1) * 3;
        this.vPositions = [];
        this.vNormals = [];
        this.build(subdivs) //populates vPositions and vColors
        this.assignGouradNormals();
        // Load shaders and initialize attribute buffers
        this.program = initShaders(gl, vShader, fShader);
        gl.useProgram(this.program);

        // Load the data into the GPU
        this.vID = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vID);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.vPositions), gl.STATIC_DRAW);

        this.nID = gl.createBuffer();
        gl.bindBuffer( gl.ARRAY_BUFFER, this.nID );
        gl.bufferData( gl.ARRAY_BUFFER, flatten(this.vNormals), gl.STATIC_DRAW );

        // Get the location of the attribute and uniform variables from the shader program.
        this.aColor = gl.getAttribLocation(this.program, "aColor");
        this.aPosition = gl.getAttribLocation(this.program, "aPosition");
        this.aNormal = gl.getAttribLocation( this.program, "aNormal" );

        this.modelMatrix = translate(-2, 1, 0);
        this.modelMatrixID = gl.getUniformLocation(this.program, "modelMatrix");

        this.projMatrix = perspective(90, canvas.width / canvas.height, 0.1, 100);
        this.projMatrixID = gl.getUniformLocation(this.program, "projMatrix");

        this.camMatrix = cam.camMatrix;
        this.camMatrixID = gl.getUniformLocation(this.program, "camMatrix");

        this.lightPos = gl.getUniformLocation(this.program, "lightPos");
        this.lightDiff = gl.getUniformLocation(this.program, "lightDiffuse");
        this.lightSpec = gl.getUniformLocation(this.program, "lightSpecular");
        this.lightAmb = gl.getUniformLocation(this.program, "lightAmbient");
        //this.lightAlpha = gl.getUniformLocation(this.program, "lightAlpha");

        this.specular = vec4(.6, .6, .6, 1);
        this.diffuse = vec4(.6, .6, .6, 1);
        this.ambient = vec4(1, .5, 0, 1);
        this.shininess = 10;
        this.matSpec = gl.getUniformLocation(this.program, "matSpecular");
        this.matDiff = gl.getUniformLocation(this.program, "matDiffuse");
        this.matAmb = gl.getUniformLocation(this.program, "matAmbient");
        this.matAlpha = gl.getUniformLocation(this.program, "matAlpha");
    }

    assignGouradNormals() {
        var normalSum = [];
        var counts = [];
        for (var i = 0; i < this.numVertices; i++) {
            normalSum.push(vec3(0, 0, 0));
            counts.push(0);
        }
        //for each vertex, find all duplicates and assign the normal to be the average.
        for (var i = 0; i < this.numVertices; i++) {
            var count = 0;
            for (var j = 0; j < this.numVertices; j++) {
                if ((this.vPositions[i][0] == this.vPositions[j][0]) &&
                    (this.vPositions[i][1] == this.vPositions[j][1]) &&
                    (this.vPositions[i][2] == this.vPositions[j][2])) {
                    count++;
                    normalSum[i] = add(normalSum[i], this.vNormals[j]);
                }
            }
            counts[i] = count;
        }
        for (var i = 0; i < this.numVertices; i++) {
            this.vNormals[i] = mult(1.0 / counts[i], normalSum[i]);
        }
    }

    build(subdivs) {
        var sqrt2 = Math.sqrt(2.0);
        var sqrt6 = Math.sqrt(6.0);
        var vertices = [vec3(0,0,1),
        vec3(0, 2 * sqrt2 / 3, -1.0 / 3),
        vec3(-sqrt6 / 3.0, -sqrt2 / 3.0, -1.0 / 3),
        vec3(sqrt6 / 3.0, -sqrt2 / 3.0, -1.0 / 3)];
        this.divideTriangle(vertices[0], vertices[1], vertices[2], subdivs);
        this.divideTriangle(vertices[3], vertices[2], vertices[1], subdivs);
        this.divideTriangle(vertices[0], vertices[3], vertices[1], subdivs);
        this.divideTriangle(vertices[0], vertices[2], vertices[3], subdivs);
    }

    divideTriangle(a, b, c, subdivs) {
        if (subdivs > 0) {
            var v1 = normalize(add(a, b));
            var v2 = normalize(add(a, c));
            var v3 = normalize(add(b, c));
            this.divideTriangle(a, v1, v2, subdivs - 1);
            this.divideTriangle(c, v2, v3, subdivs - 1);
            this.divideTriangle(b, v3, v1, subdivs - 1);
            this.divideTriangle(v1, v3, v2, subdivs - 1);
        } else {
            this.triangle(a, b, c);
        }
    }

    triangle(a, b, c){
        var N = normalize(cross(subtract(b, a), subtract(c, a)));
        this.vPositions.push(vec4(...a, 1.0));
        this.vNormals.push(N);
        this.vPositions.push(vec4(...b, 1.0));
        this.vNormals.push(N);
        this.vPositions.push(vec4(...c, 1.0));
        this.vNormals.push(N);
    }

    draw() {
        gl.useProgram(this.program);
        
        // point the attributes to the buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vID);
        gl.vertexAttribPointer(this.aPosition, 4, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.nID);
        gl.vertexAttribPointer(this.aNormal, 3, gl.FLOAT, false, 0, 0 );
        
        // set the uniform variables
        gl.uniformMatrix4fv(this.modelMatrixID, false, flatten(this.modelMatrix));
        gl.uniformMatrix4fv(this.projMatrixID, false, flatten(this.projMatrix));
        gl.uniformMatrix4fv(this.camMatrixID, false, flatten(this.camMatrix));

        //assumes a light object called light
        gl.uniform4fv(this.lightPos, sun.position);
        gl.uniform4fv(this.lightDiff, sun.diffuse);
        gl.uniform4fv(this.lightSpec, sun.specular);
        gl.uniform4fv(this.lightAmb, sun.ambient);
        // gl.uniform1f(this.lightAlpha, sun.alpha);

        gl.uniform4fv(this.matSpec, this.specular);
        gl.uniform4fv(this.matDiff, this.diffuse);
        gl.uniform4fv(this.matAmb, this.ambient);
        gl.uniform1f(this.matAlpha, this.shininess);

        // enable and draw!
        gl.enableVertexAttribArray(this.aPosition);
        gl.enableVertexAttribArray(this.aNormal);
        gl.drawArrays(gl.TRIANGLES, 0, this.numVertices);
        gl.disableVertexAttribArray(this.aPosition);
        gl.disableVertexAttribArray(this.aNormal); 
    }
}

class Cube {
    constructor(cam, vShader, fShader) {
        var vertices = [
            vec3(-1, -1, 1),
            vec3(-1, 1, 1),
            vec3(1, 1, 1),
            vec3(1, -1, 1),
            vec3(-1, -1, -1),
            vec3(-1, 1, -1),
            vec3(1, 1, -1),
            vec3(1, -1, -1),
        ];

        var indices = [
            0, 3, 2,
            0, 2, 1,
            2, 3, 7,
            2, 7, 6,
            0, 4, 7,
            0, 7, 3,
            1, 2, 6,
            1, 6, 5,
            4, 5, 6,
            4, 6, 7,
            0, 1, 5,
            0, 5, 4
        ];

        this.vPositions = [];
        this.vNormals = [];
        this.findNormals(vertices, indices);

        // Load shaders and initialize attribute buffers
        this.program = initShaders(gl, vShader, fShader);
        gl.useProgram(this.program);

        // Load the data into the GPU
        this.vID = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vID);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.vPositions), gl.STATIC_DRAW);

        this.nID = gl.createBuffer();
        gl.bindBuffer( gl.ARRAY_BUFFER, this.nID );
        gl.bufferData( gl.ARRAY_BUFFER, flatten(this.vNormals), gl.STATIC_DRAW );

        this.eID = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.eID);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices), gl.STATIC_DRAW);

        // Get the location of the attribute and uniform variables from the shader program.
        this.aColor = gl.getAttribLocation(this.program, "aColor");
        this.aPosition = gl.getAttribLocation(this.program, "aPosition");
        this.aNormal = gl.getAttribLocation( this.program, "aNormal" );

        this.modelMatrix = translate(2, 1, 0);
        this.modelMatrixID = gl.getUniformLocation(this.program, "modelMatrix");

        this.projMatrix = perspective(90, canvas.width / canvas.height, 0.1, 100);
        this.projMatrixID = gl.getUniformLocation(this.program, "projMatrix");

        this.camMatrix = cam.camMatrix;
        this.camMatrixID = gl.getUniformLocation(this.program, "camMatrix");

        this.lightPos = gl.getUniformLocation(this.program, "lightPos");
        this.lightDiff = gl.getUniformLocation(this.program, "lightDiffuse");
        this.lightSpec = gl.getUniformLocation(this.program, "lightSpecular");
        this.lightAmb = gl.getUniformLocation(this.program, "lightAmbient");
        //this.lightAlpha = gl.getUniformLocation(this.program, "lightAlpha");

        this.specular = vec4(.6, .6, .6, 1);
        this.diffuse = vec4(.6, .6, .6, 1);
        this.ambient = vec4(1, .5, 0, 1);
        this.shininess = 10;
        this.matSpec = gl.getUniformLocation(this.program, "matSpecular");
        this.matDiff = gl.getUniformLocation(this.program, "matDiffuse");
        this.matAmb = gl.getUniformLocation(this.program, "matAmbient");
        this.matAlpha = gl.getUniformLocation(this.program, "matAlpha");
    }
    
    findNormals(vertices, indices) {
        for (let i = 0; i < indices.length; i += 3) {
            var a = vertices[indices[i]];
            var b = vertices[indices[i + 1]];
            var c = vertices[indices[i + 2]];
            var N = normalize(cross(subtract(b, a), subtract(c, a)));
            this.vPositions.push(vec4(...a, 1));
            this.vNormals.push(N);
            this.vPositions.push(vec4(...b, 1));
            this.vNormals.push(N);
            this.vPositions.push(vec4(...c, 1));
            this.vNormals.push(N);
        }
    }

    draw() {
        gl.useProgram(this.program);
        
        // point the attributes to the buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vID);
        gl.vertexAttribPointer(this.aPosition, 4, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.nID);
        gl.vertexAttribPointer(this.aNormal, 3, gl.FLOAT, false, 0, 0 );

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.eID);
        
        // set the uniform variables
        gl.uniformMatrix4fv(this.modelMatrixID, false, flatten(this.modelMatrix));
        gl.uniformMatrix4fv(this.projMatrixID, false, flatten(this.projMatrix));
        gl.uniformMatrix4fv(this.camMatrixID, false, flatten(this.camMatrix));

        //assumes a light object called light
        gl.uniform4fv(this.lightPos, sun.position);
        gl.uniform4fv(this.lightDiff, sun.diffuse);
        gl.uniform4fv(this.lightSpec, sun.specular);
        gl.uniform4fv(this.lightAmb, sun.ambient);
        // gl.uniform1f(this.lightAlpha, sun.alpha);

        gl.uniform4fv(this.matSpec, this.specular);
        gl.uniform4fv(this.matDiff, this.diffuse);
        gl.uniform4fv(this.matAmb, this.ambient);
        gl.uniform1f(this.matAlpha, this.shininess);

        // enable and draw!
        gl.enableVertexAttribArray(this.aPosition);
        gl.enableVertexAttribArray(this.aNormal);
        gl.drawArrays(gl.TRIANGLES, 0, 36);
        gl.disableVertexAttribArray(this.aPosition);
        gl.disableVertexAttribArray(this.aNormal); 
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

class SMF {
    constructor(cam, fname) {
        this.vPositions = [];
        this.vColors = [];
        this.indices = [];
        var smf_file = loadFileAJAX(fname);
        var lines = smf_file.split('\n');
        for (var line = 0; line < lines.length; line++) {
            var [type, ...nums] = lines[line].trimRight().split(' ');
            var color = vec4(Math.random(), Math.random(), Math.random(), 1.0);
            switch (type) {
                case 'v':
                this.vPositions.push(vec3(...nums.map(x => parseFloat(x))));
                this.vColors.push(color);
                break;
                case 'f':
                this.indices.push(...nums.map(x => parseInt(x) - 1));
                break;
            }
        }

        // Load shaders and initialize attribute buffers
        this.program = initShaders(gl, "vshader2.glsl", "fshader2.glsl");
        gl.useProgram(this.program);

        // Load the data into the GPU
        this.vID = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vID);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.vPositions), gl.STATIC_DRAW);

        this.cID = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.cID);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(this.vColors), gl.STATIC_DRAW);

        this.eID = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.eID);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.indices), gl.STATIC_DRAW);

        // Get the location of the attribute and uniform variables from the shader program.
        this.aColor = gl.getAttribLocation(this.program, "aColor");
        this.aPosition = gl.getAttribLocation(this.program, "aPosition");

        this.modelMatrix = mat4();
        this.modelMatrixID = gl.getUniformLocation(this.program, "modelMatrix");

        this.projMatrix = perspective(90, canvas.width / canvas.height, 0.1, 10);
        this.projMatrixID = gl.getUniformLocation(this.program, "projMatrix");

        this.camMatrix = cam.camMatrix;
        this.camMatrixID = gl.getUniformLocation(this.program, "camMatrix");
    }

    draw() {
        gl.useProgram(this.program);
        
        // point the attributes to the buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vID);
        gl.vertexAttribPointer(this.aPosition, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.cID);
        gl.vertexAttribPointer(this.aColor, 4, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.eID);
        
        // set the uniform variables
        gl.uniformMatrix4fv(this.modelMatrixID, false, flatten(this.modelMatrix));
        gl.uniformMatrix4fv(this.projMatrixID, false, flatten(this.projMatrix));
        gl.uniformMatrix4fv(this.camMatrixID, false, flatten(this.camMatrix));
        
        // enable and draw!
        gl.enableVertexAttribArray(this.aPosition);
        gl.enableVertexAttribArray(this.aColor);
        gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_INT, 0);
        gl.disableVertexAttribArray(this.aPosition);
        gl.disableVertexAttribArray(this.aColor);
    }
}

class Camera {
    constructor(at, up) {
        this.camMatrix = mat4();
        this.r = 5;
        this.h = 5;
        this.t = 0;
        this.eye = vec3(this.r * Math.sin(this.t), this.h, this.r * Math.cos(this.t));
        this.n = normalize(subtract(this.eye, at));
        this.u = normalize(cross(up, this.n));
        this.v = cross(this.n, this.u);
        this.updateCamMatrix();
    }

    updateEye() {
        this.eye = vec3(this.r * Math.sin(this.t), this.h, this.r * Math.cos(this.t));
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

class Light {
    constructor(position, diffuse, specular, ambient, alpha) {
        this.position = position;
        this.diffuse = diffuse;
        this.specular = specular;
        this.ambient = ambient;
        this.alpha = alpha;
    }
}


function render() {
    setTimeout(function() {
        requestAnimationFrame(render);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        sunAngle += .1;
        var sunLight = [
            vec4(10 * Math.cos(sunAngle), 10 * Math.sin(sunAngle), 0, 1),
            vec4(0.2, 0.2, 0.2, 1),
            vec4(.8, .8, .8, 1),
            vec4(.5, .5, .5, 1),
            0
        ];
        sun = new Light(...sunLight);
        sphere.draw();
        plane.draw();
        cube.draw();
    }, 100);
}

document.addEventListener('keyup', event => {
    switch(event.code) {
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
        case 'KeyS':
            vertexShade = !vertexShade;
            if (vertexShade) {
                sphere = new Sphere(cam, 4, 'vShaderV.glsl', 'fShaderV.glsl');
                plane = new Plane(cam, 1, 'vShaderV.glsl', 'fShaderV.glsl');
                cube = new Cube(cam, 'vShaderV.glsl', 'fShaderV.glsl');
            } else {
                sphere = new Sphere(cam, 4, 'vShaderF.glsl', 'fShaderF.glsl');
                plane = new Plane(cam, 1, 'vShaderF.glsl', 'fShaderF.glsl');
                cube = new Cube(cam, 'vShaderF.glsl', 'fShaderF.glsl');
            }
            break;
    }
    cam.updateCamMatrix();
    sphere.camMatrix = cam.camMatrix;
    plane.camMatrix = cam.camMatrix;
    cube.camMatrix = cam.camMatrix;
});
