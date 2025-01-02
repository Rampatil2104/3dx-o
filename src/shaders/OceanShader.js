export const OceanShader = {
    vertexShader: `
      uniform float time;
      varying vec2 vUv;
      varying float vElevation;
      varying vec3 vNormal;
  
      float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
      }
  
      vec2 rotate(vec2 v, float a) {
        float s = sin(a);
        float c = cos(a);
        mat2 m = mat2(c, -s, s, c);
        return m * v;
      }
  
      void main() {
        vUv = uv;
        
        vec4 modelPosition = modelMatrix * vec4(position, 1.0);
        
        float elevation = 
          sin(modelPosition.x * 3.0 + time * 2.0) * 
          sin(modelPosition.z * 2.5 + time * 1.5) * 0.15 +
          sin(modelPosition.x * 2.0 + time * 1.0) * 
          sin(modelPosition.z * 3.0 + time * 1.8) * 0.1 +
          sin(modelPosition.x * 5.0 + time * 2.5) * 
          sin(modelPosition.z * 4.0 + time * 2.2) * 0.05;
  
        float noise = random(rotate(position.xz, time * 0.1)) * 0.05;
        elevation += noise;
        
        modelPosition.y += elevation;
        vElevation = elevation;
  
        vec3 n = normalize(vec3(
          -elevation * 2.0,
          1.0,
          -elevation * 2.0
        ));
        vNormal = normalMatrix * n;
  
        gl_Position = projectionMatrix * viewMatrix * modelPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uColorDeep;
      uniform vec3 uColorShallow;
      uniform float time;
      
      varying vec2 vUv;
      varying float vElevation;
      varying vec3 vNormal;
  
      void main() {
        float mixStrength = (vElevation + 0.2) * 3.0;
        vec3 color = mix(uColorDeep, uColorShallow, mixStrength);
        
        float shimmer = 
          sin(vUv.x * 100.0 + time * 3.0) * 
          sin(vUv.y * 100.0 + time * 2.0) * 0.1 +
          sin(vUv.x * 50.0 - time * 2.0) * 
          sin(vUv.y * 50.0 + time * 1.5) * 0.05;
        
        float specular = pow(max(dot(normalize(vNormal), normalize(vec3(1.0, 1.0, 1.0))), 0.0), 32.0);
        color += shimmer + specular * 0.5;
        
        float alpha = mix(0.9, 1.0, smoothstep(-0.2, 0.2, vElevation));
        
        gl_FragColor = vec4(color, alpha);
      }
    `
  };