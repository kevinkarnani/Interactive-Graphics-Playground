var canvas;
var gl;

window.onload = function init(){
    canvas = document.getElementById("gl-canvas");
    gl = canvas.getContext('webgl2');
    if ( !gl ) { alert("WebGL 2.0 isn't available"); }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // add shapes
    var ellipse = new Ellipse();
    ellipse.draw();

    var triangle = new Triangle();
    triangle.draw();

    var circle = new Circle();
    circle.draw();

    var vertices = [
        vec2(-.8, -.8),
        vec2(-.8, .8),
        vec2(.8, .8),
        vec2(.8, -.8)
    ];

    for (let i = 0; i <= 6; i++) {
        var color = i % 2 == 0 ? new vec4(0, 0, 0, 1): new vec4(1, 1, 1, 1);
        vertices.map(x => {
            x[0] = (x[0] > 0) ? x[0] - .1 : x[0] + .1;
            x[1] = (x[1] > 0) ? x[1] - .1 : x[1] + .1;
        });
        var square = new Square(vertices);
        square.draw(color);
    }
};

class Square {
    constructor(vertices){
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
    }
    
    draw(color) {
        gl.useProgram(this.program);
        
        // point the attributes to the buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferId);
        gl.vertexAttribPointer(this.aPosition, 2, gl.FLOAT, false, 0, 0);
        
        // set the uniform variables
        gl.uniform4fv(this.uColor, color);
        
        // enable and draw!
        gl.enableVertexAttribArray(this.aPosition);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
        gl.disableVertexAttribArray(this.aPosition);
    }
}

class Circle {
    constructor() {
        var center = vec2(5, 8);
        var r = 0.1
        var vertices = [];
        var colors = [];

        for (let i = 0; i <= 100; i++) {
            vertices.push(vec2(r * (center[0] + Math.cos(Math.PI / 50 * i)), r * (center[1] + Math.sin(Math.PI / 50 * i))));
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
    }

    draw() {
        gl.useProgram(this.program);
        
        // point the attributes to the buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferId);
        gl.vertexAttribPointer(this.aPosition, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBufferId);
        gl.vertexAttribPointer(this.aColor, 4, gl.FLOAT, false, 0, 0);
        
        // enable and draw!
        gl.enableVertexAttribArray(this.aPosition);
        gl.enableVertexAttribArray(this.aColor);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 101);
        gl.disableVertexAttribArray(this.aPosition);
        gl.disableVertexAttribArray(this.aColor);
    }
}

class Ellipse {
    constructor() {
        var center = vec2(-5, 8);
        var r = 0.1;
        var vertices = [];

        for (let i = 0; i <= 100; i++) {
            vertices.push(vec2(r * (center[0] + Math.cos(Math.PI / 50 * i)), r * (center[1] + 3/5 * Math.sin(Math.PI / 50 * i))));
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
    }

    draw() {
        gl.useProgram(this.program);
        
        // point the attributes to the buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferId);
        gl.vertexAttribPointer(this.aPosition, 2, gl.FLOAT, false, 0, 0);
        
        // set the uniform variables
        gl.uniform4fv(this.uColor, vec4(1, 0, 0, 1));
        
        // enable and draw!
        gl.enableVertexAttribArray(this.aPosition);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 101);
        gl.disableVertexAttribArray(this.aPosition);
    }
}

class Triangle {
    constructor() {
        var vertices = [
            vec2(-0.2, .7),
            vec2(0.2, .7),
            vec2(0, 1)
        ];

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
    }

    draw() {
        gl.useProgram(this.program);
        
        // point the attributes to the buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferId);
        gl.vertexAttribPointer(this.aPosition, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBufferId);
        gl.vertexAttribPointer(this.aColor, 4, gl.FLOAT, false, 0, 0);
        
        // enable and draw!
        gl.enableVertexAttribArray(this.aPosition);
        gl.enableVertexAttribArray(this.aColor);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.disableVertexAttribArray(this.aPosition);
        gl.disableVertexAttribArray(this.aColor);
    }
}