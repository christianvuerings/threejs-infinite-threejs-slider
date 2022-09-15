import * as THREE from "three";
import fragment from "./shaders/fragment.glsl";
import vertex from "./shaders/vertex.glsl";
import GUI from "lil-gui";
import image1 from "./images/1.jpg";
import image2 from "./images/2.jpg";
import image3 from "./images/3.jpg";
import image4 from "./images/4.jpg";
import image5 from "./images/5.jpg";
import image6 from "./images/6.jpg";
import image7 from "./images/7.jpg";

const images = [image1, image2, image3, image4, image5, image6, image7];

export default class Sketch {
	constructor({ dom, textures }) {
		this.scene = new THREE.Scene();

		this.container = dom;
		this.textures = textures;
		this.width = this.container.offsetWidth;
		this.height = this.container.offsetHeight;
		this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		this.scroll = 0;
		this.scrollTarget = 0;
		this.currentScroll = 0;
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		// this.renderer.setClearColor(0x000000, 1);
		this.renderer.physicallyCorrectLights = true;
		this.renderer.outputEncoding = THREE.sRGBEncoding;

		this.container.appendChild(this.renderer.domElement);

		// this.camera = new THREE.PerspectiveCamera(
		// 	70,
		// 	window.innerWidth / window.innerHeight,
		// 	0.001,
		// 	1000
		// );
		this.renderTarget = new THREE.WebGLRenderTarget(this.width, this.height, {
			format: THREE.RGBAFormat,
			magFilter: THREE.NearestFilter,
			minFilter: THREE.NearestFilter,
		});

		this.renderTarget1 = new THREE.WebGLRenderTarget(this.width, this.height, {
			format: THREE.RGBAFormat,
			magFilter: THREE.NearestFilter,
			minFilter: THREE.NearestFilter,
		});

		let frustumSize = 2;
		let aspect = window.innerWidth / window.innerHeight;
		this.aspect = this.width / this.height;
		this.camera = new THREE.OrthographicCamera(
			(frustumSize * aspect) / -2,
			(frustumSize * aspect) / 2,
			frustumSize / 2,
			frustumSize / -2,
			-1000,
			1000
		);
		this.camera.position.set(0, 0, 2);
		this.time = 0;
		// this.controls = new OrbitControls(this.camera, this.renderer.domElement);

		this.backgroundQuad = new THREE.Mesh(
			new THREE.PlaneGeometry(2 * this.aspect, 2),
			new THREE.MeshBasicMaterial({
				// transparent: true,
			})
		);
		// this.backgroundQuad.position.y = 0.5;
		this.backgroundQuad.position.z = -0.5;
		this.scene.add(this.backgroundQuad);

		this.isPlaying = true;

		this.initQuad();
		this.addObjects();
		this.resize();
		this.render();
		this.setupResize();
		this.scrollEvent();
	}

	scrollEvent() {
		console.log("scrollEvent");
		document.addEventListener("wheel", (e) => {
			// console.log(e.deltaY);
			this.scrollTarget += e.deltaY * 0.3;
		});
	}

	initQuad() {
		this.materialQuad = new THREE.ShaderMaterial({
			extensions: {
				derivatives: "#extension GL_OES_standard_derivatives : enable",
			},
			side: THREE.DoubleSide,
			uniforms: {
				time: { value: 0 },
				uTexture: { value: null },
				resolution: { value: new THREE.Vector4() },
			},
			transparent: true,
			vertexShader: vertex,
			fragmentShader: fragment,
		});

		this.sceneQuad = new THREE.Scene();
		// this.materialQuad = new THREE.MeshBasicMaterial({
		// 	transparent: true,
		// });
		this.quad = new THREE.Mesh(
			new THREE.PlaneGeometry(2 * this.aspect, 2),
			this.materialQuad
		);
		this.sceneQuad.add(this.quad);
	}

	settings() {
		let that = this;
		this.settings = {
			progress: 0,
		};
		this.gui = new GUI();
		this.gui.add(this.settings, "progress", 0, 1, 0.01);
	}

	setupResize() {
		window.addEventListener("resize", this.resize.bind(this));
	}

	resize() {
		this.width = window.innerWidth;
		this.height = window.innerHeight;
		this.renderer.setSize(this.width, this.height);
		this.camera.aspect = this.width / this.height;
		this.camera.updateProjectionMatrix();

		this.imageAspect = 853 / 1280;
		let a1;
		let a2;
		if (this.height / this.width > this.imageAspect) {
			a1 = (this.width / this.height) * this.imageAspect;
			a2 = 1;
		} else {
			a1 = 1;
			a2 = this.height / this.width / this.imageAspect;
		}

		this.camera.updateProjectionMatrix();
	}

	addObjects() {
		this.meshes = [];
		this.n = 10;
		for (let i = 0; i < this.n; i++) {
			const texture = this.textures[i % this.textures.length];
			let mesh = new THREE.Mesh(
				new THREE.PlaneGeometry(
					1,
					texture.image.height / texture.image.width,
					1,
					1
				),
				new THREE.MeshBasicMaterial({
					map: texture,
				})
			);
			this.meshes.push({
				mesh,
				index: i,
			});
			this.scene.add(mesh);
		}
	}

	updateMeshes() {
		this.margin = 1.1;
		this.wholeWidth = this.n * this.margin;

		this.meshes.forEach((o) => {
			// console.log(o.mesh);
			o.mesh.position.x =
				((this.margin * o.index +
					this.currentScroll +
					100000 * this.wholeWidth) %
					this.wholeWidth) -
				this.margin * 2;
		});
	}

	stop() {
		this.isPlaying = false;
	}

	start() {
		if (!this.isPlaying) {
			this.isPlaying = true;
			this.render();
		}
	}

	async render() {
		if (!this.isPlaying) return;

		this.time += 0.05;
		this.scroll += (this.scrollTarget - this.scroll) * 0.1;
		this.scroll *= 0.9;
		this.scrollTarget *= 0.9;
		this.currentScroll += this.scroll * 0.01;
		// console.log(this.currentScroll);
		this.updateMeshes();
		requestAnimationFrame(this.render.bind(this));

		// Default texture
		this.renderer.setRenderTarget(this.renderTarget);
		this.renderer.render(this.scene, this.camera);

		// Render distored texture
		this.renderer.setRenderTarget(this.renderTarget1);
		// this.renderer.setRenderTarget(null);
		this.materialQuad.uniforms.uTexture.value = this.renderTarget.texture;
		this.renderer.render(this.sceneQuad, this.camera);

		// Final scene
		this.renderer.setRenderTarget(null);
		this.backgroundQuad.material.map = this.renderTarget1.texture;
		this.renderer.render(this.scene, this.camera);
	}
}

(async () => {
	const textures = await Promise.all(
		images.map((image) => new THREE.TextureLoader().loadAsync(image))
	);

	new Sketch({
		dom: document.getElementById("container"),
		textures,
	});
})();
