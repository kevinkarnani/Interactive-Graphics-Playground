var canvas;
var gl;

window.onload = function init(){
    canvas = document.getElementById( "gl-canvas" );
    gl = canvas.getContext('webgl2');
    if ( !gl ) { alert( "WebGL 2.0 isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    gl.clear( gl.COLOR_BUFFER_BIT );

    var sq = new Square();
    sq.draw();
	let pg = new Pentagon();
	pg.draw();
};

class Square{ 
    constructor(){
 		// Four Vertices

  		var vertices = [
			vec2( -1, -1 ),
			vec2(  -1,  0 ),
			vec2(  0, 0 ),
			vec2( 0, -1)
  		];

 		//  Load shaders and initialize attribute buffers
   		this.program = initShaders( gl, "/vshader.glsl", "/fshader.glsl" );
   		gl.useProgram( this.program );

  		// Load the data into the GPU

  		this.bufferId = gl.createBuffer();
  		gl.bindBuffer( gl.ARRAY_BUFFER, this.bufferId );
  		gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW );

  		// Get the location of the attribute and uniform variables from the shader program.
  		this.aPosition = gl.getAttribLocation( this.program, "aPosition" );
  		this.uColor = gl.getUniformLocation( this.program, "uColor" );
  		
    }
    draw() {
        
        gl.useProgram( this.program );
        
        //point the attributes to the buffer
        gl.bindBuffer( gl.ARRAY_BUFFER, this.bufferId );
        gl.vertexAttribPointer( this.aPosition, 2, gl.FLOAT, false, 0, 0 );
	
		//set the uniform variables
		gl.uniform4fv(this.uColor, vec4(0,0,1,1));
		
		//enable and draw!
		gl.enableVertexAttribArray(this.aPosition );
    	gl.drawArrays( gl.TRIANGLE_FAN, 0, 4 );
    	gl.disableVertexAttribArray(this.aPosition );    
    }
}

class Pentagon {
	constructor() {
		// 5 vertices

		let vertices = [
			vec2(0.75, 0.5),
			vec2(0.5, 1),
			vec2(0, 1),
			vec2(0, 0),
			vec2(0.5, 0)
		];

		//  Load shaders and initialize attribute buffers
		this.program = initShaders( gl, "/vshader.glsl", "/fshader.glsl" );
		gl.useProgram( this.program );

	   // Load the data into the GPU

	   this.bufferId = gl.createBuffer();
	   gl.bindBuffer( gl.ARRAY_BUFFER, this.bufferId );
	   gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW );

	   // Get the location of the attribute and uniform variables from the shader program.
	   this.aPosition = gl.getAttribLocation( this.program, "aPosition" );
	   this.uColor = gl.getUniformLocation( this.program, "uColor" );
	}

	draw() {
        
        gl.useProgram( this.program );
        
        //point the attributes to the buffer
        gl.bindBuffer( gl.ARRAY_BUFFER, this.bufferId );
        gl.vertexAttribPointer( this.aPosition, 2, gl.FLOAT, false, 0, 0 );
	
		//set the uniform variables
		gl.uniform4fv(this.uColor, vec4(0,1,0,1));
		
		//enable and draw!
		gl.enableVertexAttribArray(this.aPosition );
    	gl.drawArrays( gl.TRIANGLE_FAN, 0, 5 );
    	gl.disableVertexAttribArray(this.aPosition );    
    }
}
