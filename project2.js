/**
 * @Instructions
 * 		@task1 : Complete the setTexture function to handle non power of 2 sized textures
 * 		@task2 : Implement the lighting by modifying the fragment shader, constructor,
 *      @task3: 
 *      @task4: 
 * 		setMesh, draw, setAmbientLight, setSpecularLight and enableLighting functions 
 */


function GetModelViewProjection(projectionMatrix, translationX, translationY, translationZ, rotationX, rotationY) {
	
	var trans1 = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		translationX, translationY, translationZ, 1
	];
	var rotatXCos = Math.cos(rotationX);
	var rotatXSin = Math.sin(rotationX);

	var rotatYCos = Math.cos(rotationY);
	var rotatYSin = Math.sin(rotationY);

	var rotatx = [
		1, 0, 0, 0,
		0, rotatXCos, -rotatXSin, 0,
		0, rotatXSin, rotatXCos, 0,
		0, 0, 0, 1
	]

	var rotaty = [
		rotatYCos, 0, -rotatYSin, 0,
		0, 1, 0, 0,
		rotatYSin, 0, rotatYCos, 0,
		0, 0, 0, 1
	]

	var test1 = MatrixMult(rotaty, rotatx);
	var test2 = MatrixMult(trans1, test1);
	var mvp = MatrixMult(projectionMatrix, test2);

	return mvp;
}


class MeshDrawer {
	// The constructor is a good place for taking care of the necessary initializations.
	constructor() {
		this.prog = InitShaderProgram(meshVS, meshFS);
		this.mvpLoc = gl.getUniformLocation(this.prog, 'mvp');
		this.showTexLoc = gl.getUniformLocation(this.prog, 'showTex');

		this.colorLoc = gl.getUniformLocation(this.prog, 'color');

		this.vertPosLoc = gl.getAttribLocation(this.prog, 'pos');
		this.texCoordLoc = gl.getAttribLocation(this.prog, 'texCoord');


		this.vertbuffer = gl.createBuffer();
		this.texbuffer = gl.createBuffer();

		this.numTriangles = 0;

		/**
		 * @Task2 : You should initialize the required variables for lighting here
		 */
		// Get attribute location for normals
        this.normalLoc = gl.getAttribLocation(this.prog, 'normal');
        // Create buffer for normals
        this.normalBuffer = gl.createBuffer();

        // Get uniform locations for lighting parameters
        this.enableLightingLoc = gl.getUniformLocation(this.prog, 'enableLighting');
        this.lightPosLoc = gl.getUniformLocation(this.prog, 'lightPos');
        this.ambientLoc = gl.getUniformLocation(this.prog, 'ambient');

        // Initialize lighting control variables
        this.lightingEnabled = false;
        this.ambientValue = 0.2; // Default ambient light intensity

		// Task 3: Initialize variables for specular lighting
        this.shininessLoc = gl.getUniformLocation(this.prog, 'shininess');
        this.cameraPosLoc = gl.getUniformLocation(this.prog, 'cameraPos');

        this.shininess = 32.0; // Default shininess exponent
		
	}

	setMesh(vertPos, texCoords, normalCoords) {
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

		// update texture coordinates
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

		/**
		 * @Task2 : You should update the rest of this function to handle the lighting
		 */

		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalCoords), gl.STATIC_DRAW);

		this.numTriangles = vertPos.length / 3;
	}

	// This method is called to draw the triangular mesh.
	// The argument is the transformation matrix, the same matrix returned
	// by the GetModelViewProjection function above.
	draw(trans) {
		gl.useProgram(this.prog);

		gl.uniformMatrix4fv(this.mvpLoc, false, trans);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
		gl.enableVertexAttribArray(this.vertPosLoc);
		gl.vertexAttribPointer(this.vertPosLoc, 3, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
		gl.enableVertexAttribArray(this.texCoordLoc);
		gl.vertexAttribPointer(this.texCoordLoc, 2, gl.FLOAT, false, 0, 0);

		// Bind normal data
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
		gl.enableVertexAttribArray(this.normalLoc);
		gl.vertexAttribPointer(this.normalLoc, 3, gl.FLOAT, false, 0, 0);
	
		// Update light position based on user input
		updateLightPos();
	
		// Pass lighting uniforms to the shader
		gl.uniform1i(this.enableLightingLoc, this.lightingEnabled ? 1 : 0);
		gl.uniform1f(this.ambientLoc, this.ambientValue);
		gl.uniform3f(this.lightPosLoc, lightX, lightY, 1.0);
	
		// Pass camera position to the shader
		gl.uniform3f(this.cameraPosLoc, 0.0, 0.0, transZ);

		// Pass shininess exponent to the shader
		gl.uniform1f(this.shininessLoc, this.shininess);
	
		gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);
	}

	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture(img, textureIndex = 0) {
		const texture = gl.createTexture();
		gl.activeTexture(gl.TEXTURE0 + textureIndex); // Use the specified texture unit
		gl.bindTexture(gl.TEXTURE_2D, texture);

		// You can set the texture image data using the following command.
		gl.texImage2D(
			gl.TEXTURE_2D,
			0,
			gl.RGB,
			gl.RGB,
			gl.UNSIGNED_BYTE,
			img);

		// Set texture parameters 
		if (isPowerOf2(img.width) && isPowerOf2(img.height)) {
			gl.generateMipmap(gl.TEXTURE_2D);
		} else {
			console.error("Task 1: Non power of 2, you should implement this part to accept non power of 2 sized textures");
			/**
			 * @Task1 : You should implement this part to accept non power of 2 sized textures
			 */
			// Handle NPOT textures

			// Set wrapping to CLAMP_TO_EDGE for NPOT textures
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

			// Use filters that don't require mipmaps
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		}

		// Pass texture sampler to the shader
		const sampler = gl.getUniformLocation(this.prog, `tex${textureIndex}`);
		gl.useProgram(this.prog);
		gl.uniform1i(sampler, textureIndex);
	}

	showTexture(show) {
		gl.useProgram(this.prog);
		gl.uniform1i(this.showTexLoc, show);
	}

	enableLighting(show) {
		gl.useProgram(this.prog);
		this.lightingEnabled = show;
		gl.uniform1i(this.enableLightingLoc, show ? 1 : 0);
	}
	
	setAmbientLight(ambient) {
		gl.useProgram(this.prog);
		this.ambientValue = ambient;
		gl.uniform1f(this.ambientLoc, ambient);
	}

	setSpecularLight(shininess) {
		gl.useProgram(this.prog);
		this.shininess = shininess;
		gl.uniform1f(this.shininessLoc, shininess);
	}
}


function isPowerOf2(value) {
	return (value & (value - 1)) == 0;
}

function normalize(v, dst) {
	dst = dst || new Float32Array(3);
	var length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
	// make sure we don't divide by 0.
	if (length > 0.00001) {
		dst[0] = v[0] / length;
		dst[1] = v[1] / length;
		dst[2] = v[2] / length;
	}
	return dst;
}

// Vertex shader source code
const meshVS = `
    attribute vec3 pos; 
    attribute vec2 texCoord; 
    attribute vec3 normal;

    uniform mat4 mvp; 

    varying vec2 v_texCoord; 
    varying vec3 v_normal; 
    varying vec3 v_pos;

    void main()
    {
        v_texCoord = texCoord;
        v_normal = normal;
        v_pos = pos; // Pass the vertex position to the fragment shader

        gl_Position = mvp * vec4(pos,1);
    }`;


// Fragment shader source code
/**
 * @Task2 : Updated fragment shader to handle lighting
 */

const meshFS = `
    precision mediump float;

uniform bool showTex;
uniform bool enableLighting;
uniform sampler2D tex0; // First texture sampler
uniform sampler2D tex1; // Second texture sampler
uniform vec3 color; 
uniform vec3 lightPos; // Position of the light source
uniform float ambient; // Ambient light intensity
uniform float shininess;   // Shininess exponent
uniform vec3 cameraPos;    // Camera position

varying vec2 v_texCoord;
varying vec3 v_normal;
varying vec3 v_pos;

void main() {
    vec3 normal = normalize(v_normal);
    vec3 lightDir = normalize(lightPos - v_pos);  // Direction to the light source
    vec3 viewDir = normalize(cameraPos - v_pos); // Direction to the camera
    
    // ** Calculate Diffuse Component **
    float diffuse = max(dot(normal, lightDir), 0.0);
    
    // ** Calculate Specular Component **
    vec3 reflectDir = reflect(-lightDir, normal);
    float specular = 0.0;
    if (diffuse > 0.0) {
        specular = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
    }

    // ** Calculate Ambient Component (Adjusted to Use Light Position) **
    float distance = length(lightPos - v_pos); // Distance from the light
    float attenuation = 1.0 / (1.0 + 0.1 * distance * distance); // Attenuation factor
    vec3 ambientComponent = vec3(ambient) * attenuation;

    // Combine ambient, diffuse, and specular components
    vec3 lighting = ambientComponent + diffuse + specular;

    vec4 baseColor;
    if (showTex) {
        // Sample from both textures
        vec4 color1 = texture2D(tex0, v_texCoord);
        vec4 color2 = texture2D(tex1, v_texCoord);

        // Fixed 50-50 blend between the two textures
        baseColor = mix(color1, color2, 0.5);
    } else {
        baseColor = vec4(color, 1.0); // Use uniform color if textures are not shown
    }

    if (enableLighting) {
        vec3 finalColor = baseColor.rgb * lighting;
        gl_FragColor = vec4(finalColor, baseColor.a);
    } else {
        gl_FragColor = baseColor;
    }
}`;


// Light direction parameters for Task 2
var lightX = 1;
var lightY = 1;

const keys = {};
function updateLightPos() {
	const translationSpeed = 1;
	if (keys['ArrowUp']) lightY -= translationSpeed;
	if (keys['ArrowDown']) lightY += translationSpeed;
	if (keys['ArrowRight']) lightX -= translationSpeed;
	if (keys['ArrowLeft']) lightX += translationSpeed;
}
///////////////////////////////////////////////////////////////////////////////////