var canvas;
var gl;

window.onload = function init(){
    canvas = document.getElementById("gl-canvas");
    gl = canvas.getContext('webgl2');
    if ( !gl ) { alert("WebGL 2.0 isn't available"); }
    var slide = document.getElementById("slide");
    slide.onchange = setSlideIncrement;

    render();
};

class Square {
    constructor(location, scale, angle){
        var vertices = [];

        for (let i = 1; i <= 4; i++) {
            vertices.push(vec2(location[0] + Math.cos(Math.PI / 2 * i), location[1] + Math.sin(Math.PI / 2 * i)));
        }

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

        var scaling = mat3(scale[0], 0, 0,
                           0, scale[1], 0,
                           0, 0, 1);
        var translation = mat3(1, 0, location[0],
                               0, 1, location[1],
                               0, 0, 1);
        var rotation = mat3(Math.cos(angle), -Math.sin(angle), 0,
                            Math.sin(angle), Math.cos(angle), 0,
                            0, 0, 1);
        
        var translation_neg = mat3(1, 0, -location[0],
                                   0, 1, -location[1],
                                   0, 0, 1);
      
        this.modelMatrix = mult(translation, mult(scaling, mult(rotation, translation_neg)));
        this.modelMatrixID = gl.getUniformLocation(this.program, "modelMatrix");
    }
    
    draw(color) {
        gl.useProgram(this.program);
        
        // point the attributes to the buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferId);
        gl.vertexAttribPointer(this.aPosition, 2, gl.FLOAT, false, 0, 0);
        
        // set the uniform variables
        gl.uniform4fv(this.uColor, color);
        gl.uniformMatrix3fv(this.modelMatrixID, false, flatten(this.modelMatrix));
        
        // enable and draw!
        gl.enableVertexAttribArray(this.aPosition);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
        gl.disableVertexAttribArray(this.aPosition);
    }
}

class Circle {
    constructor(location, scale, angle) {
        var vertices = [];
        var colors = [];

        for (let i = 0; i <= 100; i++) {
            vertices.push(vec2(location[0] + Math.cos(Math.PI / 50 * i), location[1] + Math.sin(Math.PI / 50 * i)));
            colors.push(vec4(Math.abs(i / 50 - 1), 0, 0, 1));
        }

        // Load shaders and initialize attribute buffers
        this.program = initShaders(gl, "/vshader1.glsl", "/fshader.glsl");
        gl.useProgram(this.program);

        // Load the data into the GPU
        this.bufferId = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferId);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

        this.colorBufferId = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBufferId);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

        // Get the location of the attribute and uniform variables from the shader program.
        this.aPosition = gl.getAttribLocation(this.program, "aPosition");
        this.aColor = gl.getAttribLocation(this.program, "aColor");

        var scaling = mat3(scale[0], 0, 0,
                           0, scale[1], 0,
                           0, 0, 1);
        var translation = mat3(1, 0, location[0],
                               0, 1, location[1],
                               0, 0, 1);
        var rotation = mat3(Math.cos(angle), -Math.sin(angle), 0,
                            Math.sin(angle), Math.cos(angle), 0,
                            0, 0, 1);

        var translation_neg = mat3(1, 0, -location[0],
                                   0, 1, -location[1],
                                   0, 0, 1);
         
        this.modelMatrix = mult(translation, mult(scaling, mult(rotation, translation_neg)));
        this.modelMatrixID = gl.getUniformLocation(this.program, "modelMatrix");
    }

    draw() {
        gl.useProgram(this.program);
        
        // point the attributes to the buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferId);
        gl.vertexAttribPointer(this.aPosition, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBufferId);
        gl.vertexAttribPointer(this.aColor, 4, gl.FLOAT, false, 0, 0);

        gl.uniformMatrix3fv(this.modelMatrixID, false, flatten(this.modelMatrix));
        
        // enable and draw!
        gl.enableVertexAttribArray(this.aPosition);
        gl.enableVertexAttribArray(this.aColor);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 101);
        gl.disableVertexAttribArray(this.aPosition);
        gl.disableVertexAttribArray(this.aColor);
    }
}

class Ellipse {
    constructor(location, scale, angle) {
        var vertices = [];

        for (let i = 0; i <= 100; i++) {
            vertices.push(vec2(location[0] + Math.cos(Math.PI / 50 * i), location[1] + 3/5 * Math.sin(Math.PI / 50 * i)));
        }

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

        var scaling = mat3(scale[0], 0, 0,
                           0, scale[1], 0,
                           0, 0, 1);
        var translation = mat3(1, 0, location[0],
                               0, 1, location[1],
                               0, 0, 1);
        var rotation = mat3(Math.cos(angle), -Math.sin(angle), 0,
                            Math.sin(angle), Math.cos(angle), 0,
                            0, 0, 1);
        
        var translation_neg = mat3(1, 0, -location[0],
                                   0, 1, -location[1],
                                   0, 0, 1);
         
        this.modelMatrix = mult(translation, mult(scaling, mult(rotation, translation_neg)));
        this.modelMatrixID = gl.getUniformLocation(this.program, "modelMatrix");
    }

    draw() {
        gl.useProgram(this.program);
        
        // point the attributes to the buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferId);
        gl.vertexAttribPointer(this.aPosition, 2, gl.FLOAT, false, 0, 0);
        
        // set the uniform variables
        gl.uniform4fv(this.uColor, vec4(1, 0, 0, 1));
        gl.uniformMatrix3fv(this.modelMatrixID, false, flatten(this.modelMatrix));
        
        // enable and draw!
        gl.enableVertexAttribArray(this.aPosition);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 101);
        gl.disableVertexAttribArray(this.aPosition);
    }
}

class Triangle {
    constructor(location, scale, angle) {
        var vertices = [];

        for (let i = 1; i <= 3; i++) {
            vertices.push(vec2(location[0] + Math.cos(2 * Math.PI / 3 * i), location[1] + Math.sin(2 * Math.PI / 3 * i)));
        }

        var colors = [
            vec4(0, 1, 0, 1),
            vec4(0, 0, 1, 1),
            vec4(1, 0, 0, 1)
        ];

        // Load shaders and initialize attribute buffers
        this.program = initShaders(gl, "/vshader1.glsl", "/fshader.glsl");
        gl.useProgram(this.program);

        // Load the data into the GPU
        this.bufferId = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferId);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

        this.colorBufferId = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBufferId);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

        // Get the location of the attribute and uniform variables from the shader program.
        this.aPosition = gl.getAttribLocation(this.program, "aPosition");
        this.aColor = gl.getAttribLocation(this.program, "aColor");

        var scaling = mat3(scale[0], 0, 0,
                           0, scale[1], 0,
                           0, 0, 1);
        var translation = mat3(1, 0, location[0],
                               0, 1, location[1],
                               0, 0, 1);
        var rotation = mat3(Math.cos(angle), -Math.sin(angle), 0,
                            Math.sin(angle), Math.cos(angle), 0,
                            0, 0, 1);
        var translation_neg = mat3(1, 0, -location[0],
                               0, 1, -location[1],
                               0, 0, 1);
        
        this.modelMatrix = mult(translation, mult(scaling, mult(rotation, translation_neg)));
        this.modelMatrixID = gl.getUniformLocation(this.program, "modelMatrix");
    }

    draw() {
        gl.useProgram(this.program);
        
        // point the attributes to the buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferId);
        gl.vertexAttribPointer(this.aPosition, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBufferId);
        gl.vertexAttribPointer(this.aColor, 4, gl.FLOAT, false, 0, 0);

        gl.uniformMatrix3fv(this.modelMatrixID, false, flatten(this.modelMatrix));
        
        // enable and draw!
        gl.enableVertexAttribArray(this.aPosition);
        gl.enableVertexAttribArray(this.aColor);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.disableVertexAttribArray(this.aPosition);
        gl.disableVertexAttribArray(this.aColor);
    }
}

var squareAngle = 0;
var tAngle = 0;
var cAngle = 0;
var toggle = true;
var slideIncrement = 5;
function render() {
    setTimeout(function() {
        requestAnimationFrame(render);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0, 0, 0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        var ellipse = new Ellipse(vec2(-.5, .8), vec2(.1, .1), 0);
        ellipse.draw();

        tAngle = (toggle ? tAngle - slideIncrement : tAngle + slideIncrement) % 360;
        var tRad = tAngle * Math.PI / 180;
        var triangle = new Triangle(vec2(0, .8), vec2(.1, .1), tRad);
        triangle.draw();

        cAngle = (cAngle + slideIncrement) % 360;
        var cRad = cAngle * Math.PI / 180;
        var cScale = .05 * Math.sin(cRad) + .1;
        var circle = new Circle(vec2(.5, .8), vec2(cScale, cScale), 0);
        circle.draw();

        squareAngle = (toggle ? squareAngle + slideIncrement: squareAngle - slideIncrement) % 360;
        var sRad = squareAngle * Math.PI / 180;
        var squareScale = .7;

        for (let i = 0; i <= 6; i++) {
            var color = i % 2 == 0 ? new vec4(0, 0, 0, 1): new vec4(1, 1, 1, 1);
            var square = new Square(vec2(0, 0), vec2(squareScale, squareScale), sRad);
            squareScale -= .1;
            square.draw(color);
        }
    }, 100);
}

function setSlideIncrement(event) {
    slideIncrement = event.srcElement.value / 10;
};

function setToggle() {
    toggle = !toggle;
}