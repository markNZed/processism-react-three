

import * as TTHRE from './_testdelete3';

function useBlobGeometryWorker() {
    //const code = blobGeometryWorker.toString();
    const workerBlob = new Blob([source]);
    return new Worker(URL.createObjectURL(workerBlob));
}

export default useBlobGeometryWorker;

const threeSource = 
`

const REVISION = '159';

const MOUSE = { LEFT: 0, MIDDLE: 1, RIGHT: 2, ROTATE: 0, DOLLY: 1, PAN: 2 };
const TOUCH = { ROTATE: 0, PAN: 1, DOLLY_PAN: 2, DOLLY_ROTATE: 3 };
const CullFaceNone = 0;
const CullFaceBack = 1;
const CullFaceFront = 2;
const CullFaceFrontBack = 3;
const BasicShadowMap = 0;
const PCFShadowMap = 1;
const PCFSoftShadowMap = 2;
const VSMShadowMap = 3;
const FrontSide = 0;
const BackSide = 1;
const DoubleSide = 2;
const TwoPassDoubleSide = 2; // r149
const NoBlending = 0;
const NormalBlending = 1;
const AdditiveBlending = 2;
const SubtractiveBlending = 3;
const MultiplyBlending = 4;
const CustomBlending = 5;
const AddEquation = 100;
const SubtractEquation = 101;
const ReverseSubtractEquation = 102;
const MinEquation = 103;
const MaxEquation = 104;
const ZeroFactor = 200;
const OneFactor = 201;
const SrcColorFactor = 202;
const OneMinusSrcColorFactor = 203;
const SrcAlphaFactor = 204;
const OneMinusSrcAlphaFactor = 205;
const DstAlphaFactor = 206;
const OneMinusDstAlphaFactor = 207;
const DstColorFactor = 208;
const OneMinusDstColorFactor = 209;
const SrcAlphaSaturateFactor = 210;
const ConstantColorFactor = 211;
const OneMinusConstantColorFactor = 212;
const ConstantAlphaFactor = 213;
const OneMinusConstantAlphaFactor = 214;
const NeverDepth = 0;
const AlwaysDepth = 1;
const LessDepth = 2;
const LessEqualDepth = 3;
const EqualDepth = 4;
const GreaterEqualDepth = 5;
const GreaterDepth = 6;
const NotEqualDepth = 7;
const MultiplyOperation = 0;
const MixOperation = 1;
const AddOperation = 2;
const NoToneMapping = 0;
const LinearToneMapping = 1;
const ReinhardToneMapping = 2;
const CineonToneMapping = 3;
const ACESFilmicToneMapping = 4;
const CustomToneMapping = 5;
const AttachedBindMode = 'attached';
const DetachedBindMode = 'detached';

const UVMapping = 300;
const CubeReflectionMapping = 301;
const CubeRefractionMapping = 302;
const EquirectangularReflectionMapping = 303;
const EquirectangularRefractionMapping = 304;
const CubeUVReflectionMapping = 306;
const RepeatWrapping = 1000;
const ClampToEdgeWrapping = 1001;
const MirroredRepeatWrapping = 1002;
const NearestFilter = 1003;
const NearestMipmapNearestFilter = 1004;
const NearestMipMapNearestFilter = 1004;
const NearestMipmapLinearFilter = 1005;
const NearestMipMapLinearFilter = 1005;
const LinearFilter = 1006;
const LinearMipmapNearestFilter = 1007;
const LinearMipMapNearestFilter = 1007;
const LinearMipmapLinearFilter = 1008;
const LinearMipMapLinearFilter = 1008;
const UnsignedByteType = 1009;
const ByteType = 1010;
const ShortType = 1011;
const UnsignedShortType = 1012;
const IntType = 1013;
const UnsignedIntType = 1014;
const FloatType = 1015;
const HalfFloatType = 1016;
const UnsignedShort4444Type = 1017;
const UnsignedShort5551Type = 1018;
const UnsignedInt248Type = 1020;
const AlphaFormat = 1021;
const RGBAFormat = 1023;
const LuminanceFormat = 1024;
const LuminanceAlphaFormat = 1025;
const DepthFormat = 1026;
const DepthStencilFormat = 1027;
const RedFormat = 1028;
const RedIntegerFormat = 1029;
const RGFormat = 1030;
const RGIntegerFormat = 1031;
const RGBAIntegerFormat = 1033;

const RGB_S3TC_DXT1_Format = 33776;
const RGBA_S3TC_DXT1_Format = 33777;
const RGBA_S3TC_DXT3_Format = 33778;
const RGBA_S3TC_DXT5_Format = 33779;
const RGB_PVRTC_4BPPV1_Format = 35840;
const RGB_PVRTC_2BPPV1_Format = 35841;
const RGBA_PVRTC_4BPPV1_Format = 35842;
const RGBA_PVRTC_2BPPV1_Format = 35843;
const RGB_ETC1_Format = 36196;
const RGB_ETC2_Format = 37492;
const RGBA_ETC2_EAC_Format = 37496;
const RGBA_ASTC_4x4_Format = 37808;
const RGBA_ASTC_5x4_Format = 37809;
const RGBA_ASTC_5x5_Format = 37810;
const RGBA_ASTC_6x5_Format = 37811;
const RGBA_ASTC_6x6_Format = 37812;
const RGBA_ASTC_8x5_Format = 37813;
const RGBA_ASTC_8x6_Format = 37814;
const RGBA_ASTC_8x8_Format = 37815;
const RGBA_ASTC_10x5_Format = 37816;
const RGBA_ASTC_10x6_Format = 37817;
const RGBA_ASTC_10x8_Format = 37818;
const RGBA_ASTC_10x10_Format = 37819;
const RGBA_ASTC_12x10_Format = 37820;
const RGBA_ASTC_12x12_Format = 37821;
const RGBA_BPTC_Format = 36492;
const RGB_BPTC_SIGNED_Format = 36494;
const RGB_BPTC_UNSIGNED_Format = 36495;
const RED_RGTC1_Format = 36283;
const SIGNED_RED_RGTC1_Format = 36284;
const RED_GREEN_RGTC2_Format = 36285;
const SIGNED_RED_GREEN_RGTC2_Format = 36286;
const LoopOnce = 2200;
const LoopRepeat = 2201;
const LoopPingPong = 2202;
const InterpolateDiscrete = 2300;
const InterpolateLinear = 2301;
const InterpolateSmooth = 2302;
const ZeroCurvatureEnding = 2400;
const ZeroSlopeEnding = 2401;
const WrapAroundEnding = 2402;
const NormalAnimationBlendMode = 2500;
const AdditiveAnimationBlendMode = 2501;
const TrianglesDrawMode = 0;
const TriangleStripDrawMode = 1;
const TriangleFanDrawMode = 2;
/** @deprecated Use LinearSRGBColorSpace or NoColorSpace in three.js r152+. */
const LinearEncoding = 3000;
/** @deprecated Use SRGBColorSpace in three.js r152+. */
const sRGBEncoding = 3001;
const BasicDepthPacking = 3200;
const RGBADepthPacking = 3201;
const TangentSpaceNormalMap = 0;
const ObjectSpaceNormalMap = 1;

// Color space string identifiers, matching CSS Color Module Level 4 and WebGPU names where available.
const NoColorSpace = '';
const SRGBColorSpace = 'srgb';
const LinearSRGBColorSpace = 'srgb-linear';
const DisplayP3ColorSpace = 'display-p3';
const LinearDisplayP3ColorSpace = 'display-p3-linear';

const LinearTransfer = 'linear';
const SRGBTransfer = 'srgb';

const Rec709Primaries = 'rec709';
const P3Primaries = 'p3';

const ZeroStencilOp = 0;
const KeepStencilOp = 7680;
const ReplaceStencilOp = 7681;
const IncrementStencilOp = 7682;
const DecrementStencilOp = 7683;
const IncrementWrapStencilOp = 34055;
const DecrementWrapStencilOp = 34056;
const InvertStencilOp = 5386;

const NeverStencilFunc = 512;
const LessStencilFunc = 513;
const EqualStencilFunc = 514;
const LessEqualStencilFunc = 515;
const GreaterStencilFunc = 516;
const NotEqualStencilFunc = 517;
const GreaterEqualStencilFunc = 518;
const AlwaysStencilFunc = 519;

const NeverCompare = 512;
const LessCompare = 513;
const EqualCompare = 514;
const LessEqualCompare = 515;
const GreaterCompare = 516;
const NotEqualCompare = 517;
const GreaterEqualCompare = 518;
const AlwaysCompare = 519;

const StaticDrawUsage = 35044;
const DynamicDrawUsage = 35048;
const StreamDrawUsage = 35040;
const StaticReadUsage = 35045;
const DynamicReadUsage = 35049;
const StreamReadUsage = 35041;
const StaticCopyUsage = 35046;
const DynamicCopyUsage = 35050;
const StreamCopyUsage = 35042;

const GLSL1 = '100';
const GLSL3 = '300 es';

const _SRGBAFormat = 1035; // fallback for WebGL 1

const WebGLCoordinateSystem = 2000;
const WebGPUCoordinateSystem = 2001;

class EventDispatcher {

		addEventListener( type, listener ) {

			if ( this._listeners === undefined ) this._listeners = {};

			const listeners = this._listeners;

			if ( listeners[ type ] === undefined ) {

				listeners[ type ] = [];

			}

			if ( listeners[ type ].indexOf( listener ) === - 1 ) {

				listeners[ type ].push( listener );

			}

		}

		hasEventListener( type, listener ) {

			if ( this._listeners === undefined ) return false;

			const listeners = this._listeners;

			return listeners[ type ] !== undefined && listeners[ type ].indexOf( listener ) !== - 1;

		}

		removeEventListener( type, listener ) {

			if ( this._listeners === undefined ) return;

			const listeners = this._listeners;
			const listenerArray = listeners[ type ];

			if ( listenerArray !== undefined ) {

				const index = listenerArray.indexOf( listener );

				if ( index !== - 1 ) {

					listenerArray.splice( index, 1 );

				}

			}

		}

		dispatchEvent( event ) {

			if ( this._listeners === undefined ) return;

			const listeners = this._listeners;
			const listenerArray = listeners[ event.type ];

			if ( listenerArray !== undefined ) {

				event.target = this;

				// Make a copy, in case listeners are removed while iterating.
				const array = listenerArray.slice( 0 );

				for ( let i = 0, l = array.length; i < l; i ++ ) {

					array[ i ].call( this, event );

				}

				event.target = null;

			}

		}

	}

    
    const _lut = [ '00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '0a', '0b', '0c', '0d', '0e', '0f', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '1a', '1b', '1c', '1d', '1e', '1f', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '2a', '2b', '2c', '2d', '2e', '2f', '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '3a', '3b', '3c', '3d', '3e', '3f', '40', '41', '42', '43', '44', '45', '46', '47', '48', '49', '4a', '4b', '4c', '4d', '4e', '4f', '50', '51', '52', '53', '54', '55', '56', '57', '58', '59', '5a', '5b', '5c', '5d', '5e', '5f', '60', '61', '62', '63', '64', '65', '66', '67', '68', '69', '6a', '6b', '6c', '6d', '6e', '6f', '70', '71', '72', '73', '74', '75', '76', '77', '78', '79', '7a', '7b', '7c', '7d', '7e', '7f', '80', '81', '82', '83', '84', '85', '86', '87', '88', '89', '8a', '8b', '8c', '8d', '8e', '8f', '90', '91', '92', '93', '94', '95', '96', '97', '98', '99', '9a', '9b', '9c', '9d', '9e', '9f', 'a0', 'a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8', 'a9', 'aa', 'ab', 'ac', 'ad', 'ae', 'af', 'b0', 'b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7', 'b8', 'b9', 'ba', 'bb', 'bc', 'bd', 'be', 'bf', 'c0', 'c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9', 'ca', 'cb', 'cc', 'cd', 'ce', 'cf', 'd0', 'd1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8', 'd9', 'da', 'db', 'dc', 'dd', 'de', 'df', 'e0', 'e1', 'e2', 'e3', 'e4', 'e5', 'e6', 'e7', 'e8', 'e9', 'ea', 'eb', 'ec', 'ed', 'ee', 'ef', 'f0', 'f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'fa', 'fb', 'fc', 'fd', 'fe', 'ff' ];

	let _seed = 1234567;


	const DEG2RAD = Math.PI / 180;
	const RAD2DEG = 180 / Math.PI;

	// http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/21963136#21963136
	function generateUUID() {

		const d0 = Math.random() * 0xffffffff | 0;
		const d1 = Math.random() * 0xffffffff | 0;
		const d2 = Math.random() * 0xffffffff | 0;
		const d3 = Math.random() * 0xffffffff | 0;
		const uuid = _lut[ d0 & 0xff ] + _lut[ d0 >> 8 & 0xff ] + _lut[ d0 >> 16 & 0xff ] + _lut[ d0 >> 24 & 0xff ] + '-' +
				_lut[ d1 & 0xff ] + _lut[ d1 >> 8 & 0xff ] + '-' + _lut[ d1 >> 16 & 0x0f | 0x40 ] + _lut[ d1 >> 24 & 0xff ] + '-' +
				_lut[ d2 & 0x3f | 0x80 ] + _lut[ d2 >> 8 & 0xff ] + '-' + _lut[ d2 >> 16 & 0xff ] + _lut[ d2 >> 24 & 0xff ] +
				_lut[ d3 & 0xff ] + _lut[ d3 >> 8 & 0xff ] + _lut[ d3 >> 16 & 0xff ] + _lut[ d3 >> 24 & 0xff ];

		// .toLowerCase() here flattens concatenated strings to save heap memory space.
		return uuid.toLowerCase();

	}

	function clamp( value, min, max ) {

		return Math.max( min, Math.min( max, value ) );

	}

	// compute euclidean modulo of m % n
	// https://en.wikipedia.org/wiki/Modulo_operation
	function euclideanModulo( n, m ) {

		return ( ( n % m ) + m ) % m;

	}

	// Linear mapping from range <a1, a2> to range <b1, b2>
	function mapLinear( x, a1, a2, b1, b2 ) {

		return b1 + ( x - a1 ) * ( b2 - b1 ) / ( a2 - a1 );

	}

	// https://www.gamedev.net/tutorials/programming/general-and-gameplay-programming/inverse-lerp-a-super-useful-yet-often-overlooked-function-r5230/
	function inverseLerp( x, y, value ) {

		if ( x !== y ) {

			return ( value - x ) / ( y - x );

		} else {

			return 0;

		}

	}

	// https://en.wikipedia.org/wiki/Linear_interpolation
	function lerp( x, y, t ) {

		return ( 1 - t ) * x + t * y;

	}

	// http://www.rorydriscoll.com/2016/03/07/frame-rate-independent-damping-using-lerp/
	function damp( x, y, lambda, dt ) {

		return lerp( x, y, 1 - Math.exp( - lambda * dt ) );

	}

	// https://www.desmos.com/calculator/vcsjnyz7x4
	function pingpong( x, length = 1 ) {

		return length - Math.abs( euclideanModulo( x, length * 2 ) - length );

	}

	// http://en.wikipedia.org/wiki/Smoothstep
	function smoothstep( x, min, max ) {

		if ( x <= min ) return 0;
		if ( x >= max ) return 1;

		x = ( x - min ) / ( max - min );

		return x * x * ( 3 - 2 * x );

	}

	function smootherstep( x, min, max ) {

		if ( x <= min ) return 0;
		if ( x >= max ) return 1;

		x = ( x - min ) / ( max - min );

		return x * x * x * ( x * ( x * 6 - 15 ) + 10 );

	}

	// Random integer from <low, high> interval
	function randInt( low, high ) {

		return low + Math.floor( Math.random() * ( high - low + 1 ) );

	}

	// Random float from <low, high> interval
	function randFloat( low, high ) {

		return low + Math.random() * ( high - low );

	}

	// Random float from <-range/2, range/2> interval
	function randFloatSpread( range ) {

		return range * ( 0.5 - Math.random() );

	}

	// Deterministic pseudo-random float in the interval [ 0, 1 ]
	function seededRandom( s ) {

		if ( s !== undefined ) _seed = s;

		// Mulberry32 generator

		let t = _seed += 0x6D2B79F5;

		t = Math.imul( t ^ t >>> 15, t | 1 );

		t ^= t + Math.imul( t ^ t >>> 7, t | 61 );

		return ( ( t ^ t >>> 14 ) >>> 0 ) / 4294967296;

	}

	function degToRad( degrees ) {

		return degrees * DEG2RAD;

	}

	function radToDeg( radians ) {

		return radians * RAD2DEG;

	}

	function isPowerOfTwo( value ) {

		return ( value & ( value - 1 ) ) === 0 && value !== 0;

	}

	function ceilPowerOfTwo( value ) {

		return Math.pow( 2, Math.ceil( Math.log( value ) / Math.LN2 ) );

	}

	function floorPowerOfTwo( value ) {

		return Math.pow( 2, Math.floor( Math.log( value ) / Math.LN2 ) );

	}

	function setQuaternionFromProperEuler( q, a, b, c, order ) {

		// Intrinsic Proper Euler Angles - see https://en.wikipedia.org/wiki/Euler_angles

		// rotations are applied to the axes in the order specified by 'order'
		// rotation by angle 'a' is applied first, then by angle 'b', then by angle 'c'
		// angles are in radians

		const cos = Math.cos;
		const sin = Math.sin;

		const c2 = cos( b / 2 );
		const s2 = sin( b / 2 );

		const c13 = cos( ( a + c ) / 2 );
		const s13 = sin( ( a + c ) / 2 );

		const c1_3 = cos( ( a - c ) / 2 );
		const s1_3 = sin( ( a - c ) / 2 );

		const c3_1 = cos( ( c - a ) / 2 );
		const s3_1 = sin( ( c - a ) / 2 );

		switch ( order ) {

			case 'XYX':
				q.set( c2 * s13, s2 * c1_3, s2 * s1_3, c2 * c13 );
				break;

			case 'YZY':
				q.set( s2 * s1_3, c2 * s13, s2 * c1_3, c2 * c13 );
				break;

			case 'ZXZ':
				q.set( s2 * c1_3, s2 * s1_3, c2 * s13, c2 * c13 );
				break;

			case 'XZX':
				q.set( c2 * s13, s2 * s3_1, s2 * c3_1, c2 * c13 );
				break;

			case 'YXY':
				q.set( s2 * c3_1, c2 * s13, s2 * s3_1, c2 * c13 );
				break;

			case 'ZYZ':
				q.set( s2 * s3_1, s2 * c3_1, c2 * s13, c2 * c13 );
				break;

			default:
				console.warn( 'THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: ' + order );

		}

	}

	function denormalize( value, array ) {

		switch ( array.constructor ) {

			case Float32Array:

				return value;

			case Uint32Array:

				return value / 4294967295.0;

			case Uint16Array:

				return value / 65535.0;

			case Uint8Array:

				return value / 255.0;

			case Int32Array:

				return Math.max( value / 2147483647.0, - 1.0 );

			case Int16Array:

				return Math.max( value / 32767.0, - 1.0 );

			case Int8Array:

				return Math.max( value / 127.0, - 1.0 );

			default:

				throw new Error( 'Invalid component type.' );

		}

	}

	function normalize( value, array ) {

		switch ( array.constructor ) {

			case Float32Array:

				return value;

			case Uint32Array:

				return Math.round( value * 4294967295.0 );

			case Uint16Array:

				return Math.round( value * 65535.0 );

			case Uint8Array:

				return Math.round( value * 255.0 );

			case Int32Array:

				return Math.round( value * 2147483647.0 );

			case Int16Array:

				return Math.round( value * 32767.0 );

			case Int8Array:

				return Math.round( value * 127.0 );

			default:

				throw new Error( 'Invalid component type.' );

		}

	}

	const MathUtils = {
		DEG2RAD: DEG2RAD,
		RAD2DEG: RAD2DEG,
		generateUUID: generateUUID,
		clamp: clamp,
		euclideanModulo: euclideanModulo,
		mapLinear: mapLinear,
		inverseLerp: inverseLerp,
		lerp: lerp,
		damp: damp,
		pingpong: pingpong,
		smoothstep: smoothstep,
		smootherstep: smootherstep,
		randInt: randInt,
		randFloat: randFloat,
		randFloatSpread: randFloatSpread,
		seededRandom: seededRandom,
		degToRad: degToRad,
		radToDeg: radToDeg,
		isPowerOfTwo: isPowerOfTwo,
		ceilPowerOfTwo: ceilPowerOfTwo,
		floorPowerOfTwo: floorPowerOfTwo,
		setQuaternionFromProperEuler: setQuaternionFromProperEuler,
		normalize: normalize,
		denormalize: denormalize
	};

	class Vector2 {

		constructor( x = 0, y = 0 ) {

			Vector2.prototype.isVector2 = true;

			this.x = x;
			this.y = y;

		}

		get width() {

			return this.x;

		}

		set width( value ) {

			this.x = value;

		}

		get height() {

			return this.y;

		}

		set height( value ) {

			this.y = value;

		}

		set( x, y ) {

			this.x = x;
			this.y = y;

			return this;

		}

		setScalar( scalar ) {

			this.x = scalar;
			this.y = scalar;

			return this;

		}

		setX( x ) {

			this.x = x;

			return this;

		}

		setY( y ) {

			this.y = y;

			return this;

		}

		setComponent( index, value ) {

			switch ( index ) {

				case 0: this.x = value; break;
				case 1: this.y = value; break;
				default: throw new Error( 'index is out of range: ' + index );

			}

			return this;

		}

		getComponent( index ) {

			switch ( index ) {

				case 0: return this.x;
				case 1: return this.y;
				default: throw new Error( 'index is out of range: ' + index );

			}

		}

		clone() {

			return new this.constructor( this.x, this.y );

		}

		copy( v ) {

			this.x = v.x;
			this.y = v.y;

			return this;

		}

		add( v ) {

			this.x += v.x;
			this.y += v.y;

			return this;

		}

		addScalar( s ) {

			this.x += s;
			this.y += s;

			return this;

		}

		addVectors( a, b ) {

			this.x = a.x + b.x;
			this.y = a.y + b.y;

			return this;

		}

		addScaledVector( v, s ) {

			this.x += v.x * s;
			this.y += v.y * s;

			return this;

		}

		sub( v ) {

			this.x -= v.x;
			this.y -= v.y;

			return this;

		}

		subScalar( s ) {

			this.x -= s;
			this.y -= s;

			return this;

		}

		subVectors( a, b ) {

			this.x = a.x - b.x;
			this.y = a.y - b.y;

			return this;

		}

		multiply( v ) {

			this.x *= v.x;
			this.y *= v.y;

			return this;

		}

		multiplyScalar( scalar ) {

			this.x *= scalar;
			this.y *= scalar;

			return this;

		}

		divide( v ) {

			this.x /= v.x;
			this.y /= v.y;

			return this;

		}

		divideScalar( scalar ) {

			return this.multiplyScalar( 1 / scalar );

		}

		applyMatrix3( m ) {

			const x = this.x, y = this.y;
			const e = m.elements;

			this.x = e[ 0 ] * x + e[ 3 ] * y + e[ 6 ];
			this.y = e[ 1 ] * x + e[ 4 ] * y + e[ 7 ];

			return this;

		}

		min( v ) {

			this.x = Math.min( this.x, v.x );
			this.y = Math.min( this.y, v.y );

			return this;

		}

		max( v ) {

			this.x = Math.max( this.x, v.x );
			this.y = Math.max( this.y, v.y );

			return this;

		}

		clamp( min, max ) {

			// assumes min < max, componentwise

			this.x = Math.max( min.x, Math.min( max.x, this.x ) );
			this.y = Math.max( min.y, Math.min( max.y, this.y ) );

			return this;

		}

		clampScalar( minVal, maxVal ) {

			this.x = Math.max( minVal, Math.min( maxVal, this.x ) );
			this.y = Math.max( minVal, Math.min( maxVal, this.y ) );

			return this;

		}

		clampLength( min, max ) {

			const length = this.length();

			return this.divideScalar( length || 1 ).multiplyScalar( Math.max( min, Math.min( max, length ) ) );

		}

		floor() {

			this.x = Math.floor( this.x );
			this.y = Math.floor( this.y );

			return this;

		}

		ceil() {

			this.x = Math.ceil( this.x );
			this.y = Math.ceil( this.y );

			return this;

		}

		round() {

			this.x = Math.round( this.x );
			this.y = Math.round( this.y );

			return this;

		}

		roundToZero() {

			this.x = Math.trunc( this.x );
			this.y = Math.trunc( this.y );

			return this;

		}

		negate() {

			this.x = - this.x;
			this.y = - this.y;

			return this;

		}

		dot( v ) {

			return this.x * v.x + this.y * v.y;

		}

		cross( v ) {

			return this.x * v.y - this.y * v.x;

		}

		lengthSq() {

			return this.x * this.x + this.y * this.y;

		}

		length() {

			return Math.sqrt( this.x * this.x + this.y * this.y );

		}

		manhattanLength() {

			return Math.abs( this.x ) + Math.abs( this.y );

		}

		normalize() {

			return this.divideScalar( this.length() || 1 );

		}

		angle() {

			// computes the angle in radians with respect to the positive x-axis

			const angle = Math.atan2( - this.y, - this.x ) + Math.PI;

			return angle;

		}

		angleTo( v ) {

			const denominator = Math.sqrt( this.lengthSq() * v.lengthSq() );

			if ( denominator === 0 ) return Math.PI / 2;

			const theta = this.dot( v ) / denominator;

			// clamp, to handle numerical problems

			return Math.acos( clamp( theta, - 1, 1 ) );

		}

		distanceTo( v ) {

			return Math.sqrt( this.distanceToSquared( v ) );

		}

		distanceToSquared( v ) {

			const dx = this.x - v.x, dy = this.y - v.y;
			return dx * dx + dy * dy;

		}

		manhattanDistanceTo( v ) {

			return Math.abs( this.x - v.x ) + Math.abs( this.y - v.y );

		}

		setLength( length ) {

			return this.normalize().multiplyScalar( length );

		}

		lerp( v, alpha ) {

			this.x += ( v.x - this.x ) * alpha;
			this.y += ( v.y - this.y ) * alpha;

			return this;

		}

		lerpVectors( v1, v2, alpha ) {

			this.x = v1.x + ( v2.x - v1.x ) * alpha;
			this.y = v1.y + ( v2.y - v1.y ) * alpha;

			return this;

		}

		equals( v ) {

			return ( ( v.x === this.x ) && ( v.y === this.y ) );

		}

		fromArray( array, offset = 0 ) {

			this.x = array[ offset ];
			this.y = array[ offset + 1 ];

			return this;

		}

		toArray( array = [], offset = 0 ) {

			array[ offset ] = this.x;
			array[ offset + 1 ] = this.y;

			return array;

		}

		fromBufferAttribute( attribute, index ) {

			this.x = attribute.getX( index );
			this.y = attribute.getY( index );

			return this;

		}

		rotateAround( center, angle ) {

			const c = Math.cos( angle ), s = Math.sin( angle );

			const x = this.x - center.x;
			const y = this.y - center.y;

			this.x = x * c - y * s + center.x;
			this.y = x * s + y * c + center.y;

			return this;

		}

		random() {

			this.x = Math.random();
			this.y = Math.random();

			return this;

		}

		*[ Symbol.iterator ]() {

			yield this.x;
			yield this.y;

		}

	}

	class Matrix3 {

		constructor( n11, n12, n13, n21, n22, n23, n31, n32, n33 ) {

			Matrix3.prototype.isMatrix3 = true;

			this.elements = [

				1, 0, 0,
				0, 1, 0,
				0, 0, 1

			];

			if ( n11 !== undefined ) {

				this.set( n11, n12, n13, n21, n22, n23, n31, n32, n33 );

			}

		}

		set( n11, n12, n13, n21, n22, n23, n31, n32, n33 ) {

			const te = this.elements;

			te[ 0 ] = n11; te[ 1 ] = n21; te[ 2 ] = n31;
			te[ 3 ] = n12; te[ 4 ] = n22; te[ 5 ] = n32;
			te[ 6 ] = n13; te[ 7 ] = n23; te[ 8 ] = n33;

			return this;

		}

		identity() {

			this.set(

				1, 0, 0,
				0, 1, 0,
				0, 0, 1

			);

			return this;

		}

		copy( m ) {

			const te = this.elements;
			const me = m.elements;

			te[ 0 ] = me[ 0 ]; te[ 1 ] = me[ 1 ]; te[ 2 ] = me[ 2 ];
			te[ 3 ] = me[ 3 ]; te[ 4 ] = me[ 4 ]; te[ 5 ] = me[ 5 ];
			te[ 6 ] = me[ 6 ]; te[ 7 ] = me[ 7 ]; te[ 8 ] = me[ 8 ];

			return this;

		}

		extractBasis( xAxis, yAxis, zAxis ) {

			xAxis.setFromMatrix3Column( this, 0 );
			yAxis.setFromMatrix3Column( this, 1 );
			zAxis.setFromMatrix3Column( this, 2 );

			return this;

		}

		setFromMatrix4( m ) {

			const me = m.elements;

			this.set(

				me[ 0 ], me[ 4 ], me[ 8 ],
				me[ 1 ], me[ 5 ], me[ 9 ],
				me[ 2 ], me[ 6 ], me[ 10 ]

			);

			return this;

		}

		multiply( m ) {

			return this.multiplyMatrices( this, m );

		}

		premultiply( m ) {

			return this.multiplyMatrices( m, this );

		}

		multiplyMatrices( a, b ) {

			const ae = a.elements;
			const be = b.elements;
			const te = this.elements;

			const a11 = ae[ 0 ], a12 = ae[ 3 ], a13 = ae[ 6 ];
			const a21 = ae[ 1 ], a22 = ae[ 4 ], a23 = ae[ 7 ];
			const a31 = ae[ 2 ], a32 = ae[ 5 ], a33 = ae[ 8 ];

			const b11 = be[ 0 ], b12 = be[ 3 ], b13 = be[ 6 ];
			const b21 = be[ 1 ], b22 = be[ 4 ], b23 = be[ 7 ];
			const b31 = be[ 2 ], b32 = be[ 5 ], b33 = be[ 8 ];

			te[ 0 ] = a11 * b11 + a12 * b21 + a13 * b31;
			te[ 3 ] = a11 * b12 + a12 * b22 + a13 * b32;
			te[ 6 ] = a11 * b13 + a12 * b23 + a13 * b33;

			te[ 1 ] = a21 * b11 + a22 * b21 + a23 * b31;
			te[ 4 ] = a21 * b12 + a22 * b22 + a23 * b32;
			te[ 7 ] = a21 * b13 + a22 * b23 + a23 * b33;

			te[ 2 ] = a31 * b11 + a32 * b21 + a33 * b31;
			te[ 5 ] = a31 * b12 + a32 * b22 + a33 * b32;
			te[ 8 ] = a31 * b13 + a32 * b23 + a33 * b33;

			return this;

		}

		multiplyScalar( s ) {

			const te = this.elements;

			te[ 0 ] *= s; te[ 3 ] *= s; te[ 6 ] *= s;
			te[ 1 ] *= s; te[ 4 ] *= s; te[ 7 ] *= s;
			te[ 2 ] *= s; te[ 5 ] *= s; te[ 8 ] *= s;

			return this;

		}

		determinant() {

			const te = this.elements;

			const a = te[ 0 ], b = te[ 1 ], c = te[ 2 ],
				d = te[ 3 ], e = te[ 4 ], f = te[ 5 ],
				g = te[ 6 ], h = te[ 7 ], i = te[ 8 ];

			return a * e * i - a * f * h - b * d * i + b * f * g + c * d * h - c * e * g;

		}

		invert() {

			const te = this.elements,

				n11 = te[ 0 ], n21 = te[ 1 ], n31 = te[ 2 ],
				n12 = te[ 3 ], n22 = te[ 4 ], n32 = te[ 5 ],
				n13 = te[ 6 ], n23 = te[ 7 ], n33 = te[ 8 ],

				t11 = n33 * n22 - n32 * n23,
				t12 = n32 * n13 - n33 * n12,
				t13 = n23 * n12 - n22 * n13,

				det = n11 * t11 + n21 * t12 + n31 * t13;

			if ( det === 0 ) return this.set( 0, 0, 0, 0, 0, 0, 0, 0, 0 );

			const detInv = 1 / det;

			te[ 0 ] = t11 * detInv;
			te[ 1 ] = ( n31 * n23 - n33 * n21 ) * detInv;
			te[ 2 ] = ( n32 * n21 - n31 * n22 ) * detInv;

			te[ 3 ] = t12 * detInv;
			te[ 4 ] = ( n33 * n11 - n31 * n13 ) * detInv;
			te[ 5 ] = ( n31 * n12 - n32 * n11 ) * detInv;

			te[ 6 ] = t13 * detInv;
			te[ 7 ] = ( n21 * n13 - n23 * n11 ) * detInv;
			te[ 8 ] = ( n22 * n11 - n21 * n12 ) * detInv;

			return this;

		}

		transpose() {

			let tmp;
			const m = this.elements;

			tmp = m[ 1 ]; m[ 1 ] = m[ 3 ]; m[ 3 ] = tmp;
			tmp = m[ 2 ]; m[ 2 ] = m[ 6 ]; m[ 6 ] = tmp;
			tmp = m[ 5 ]; m[ 5 ] = m[ 7 ]; m[ 7 ] = tmp;

			return this;

		}

		getNormalMatrix( matrix4 ) {

			return this.setFromMatrix4( matrix4 ).invert().transpose();

		}

		transposeIntoArray( r ) {

			const m = this.elements;

			r[ 0 ] = m[ 0 ];
			r[ 1 ] = m[ 3 ];
			r[ 2 ] = m[ 6 ];
			r[ 3 ] = m[ 1 ];
			r[ 4 ] = m[ 4 ];
			r[ 5 ] = m[ 7 ];
			r[ 6 ] = m[ 2 ];
			r[ 7 ] = m[ 5 ];
			r[ 8 ] = m[ 8 ];

			return this;

		}

		setUvTransform( tx, ty, sx, sy, rotation, cx, cy ) {

			const c = Math.cos( rotation );
			const s = Math.sin( rotation );

			this.set(
				sx * c, sx * s, - sx * ( c * cx + s * cy ) + cx + tx,
				- sy * s, sy * c, - sy * ( - s * cx + c * cy ) + cy + ty,
				0, 0, 1
			);

			return this;

		}

		//

		scale( sx, sy ) {

			this.premultiply( _m3.makeScale( sx, sy ) );

			return this;

		}

		rotate( theta ) {

			this.premultiply( _m3.makeRotation( - theta ) );

			return this;

		}

		translate( tx, ty ) {

			this.premultiply( _m3.makeTranslation( tx, ty ) );

			return this;

		}

		// for 2D Transforms

		makeTranslation( x, y ) {

			if ( x.isVector2 ) {

				this.set(

					1, 0, x.x,
					0, 1, x.y,
					0, 0, 1

				);

			} else {

				this.set(

					1, 0, x,
					0, 1, y,
					0, 0, 1

				);

			}

			return this;

		}

		makeRotation( theta ) {

			// counterclockwise

			const c = Math.cos( theta );
			const s = Math.sin( theta );

			this.set(

				c, - s, 0,
				s, c, 0,
				0, 0, 1

			);

			return this;

		}

		makeScale( x, y ) {

			this.set(

				x, 0, 0,
				0, y, 0,
				0, 0, 1

			);

			return this;

		}

		//

		equals( matrix ) {

			const te = this.elements;
			const me = matrix.elements;

			for ( let i = 0; i < 9; i ++ ) {

				if ( te[ i ] !== me[ i ] ) return false;

			}

			return true;

		}

		fromArray( array, offset = 0 ) {

			for ( let i = 0; i < 9; i ++ ) {

				this.elements[ i ] = array[ i + offset ];

			}

			return this;

		}

		toArray( array = [], offset = 0 ) {

			const te = this.elements;

			array[ offset ] = te[ 0 ];
			array[ offset + 1 ] = te[ 1 ];
			array[ offset + 2 ] = te[ 2 ];

			array[ offset + 3 ] = te[ 3 ];
			array[ offset + 4 ] = te[ 4 ];
			array[ offset + 5 ] = te[ 5 ];

			array[ offset + 6 ] = te[ 6 ];
			array[ offset + 7 ] = te[ 7 ];
			array[ offset + 8 ] = te[ 8 ];

			return array;

		}

		clone() {

			return new this.constructor().fromArray( this.elements );

		}

	}

	const _m3 = /*@__PURE__*/ new Matrix3();

	function arrayNeedsUint32( array ) {

		// assumes larger values usually on last

		for ( let i = array.length - 1; i >= 0; -- i ) {

			if ( array[ i ] >= 65535 ) return true; // account for PRIMITIVE_RESTART_FIXED_INDEX, #24565

		}

		return false;

	}

	const TYPED_ARRAYS = {
		Int8Array: Int8Array,
		Uint8Array: Uint8Array,
		Uint8ClampedArray: Uint8ClampedArray,
		Int16Array: Int16Array,
		Uint16Array: Uint16Array,
		Int32Array: Int32Array,
		Uint32Array: Uint32Array,
		Float32Array: Float32Array,
		Float64Array: Float64Array
	};

	function getTypedArray( type, buffer ) {

		return new TYPED_ARRAYS[ type ]( buffer );

	}

	function createElementNS( name ) {

		return document.createElementNS( 'http://www.w3.org/1999/xhtml', name );

	}

	function createCanvasElement() {

		const canvas = createElementNS( 'canvas' );
		canvas.style.display = 'block';
		return canvas;

	}

	const _cache = {};

	function warnOnce( message ) {

		if ( message in _cache ) return;

		_cache[ message ] = true;

		console.warn( message );

	}

    class Quaternion {

		constructor( x = 0, y = 0, z = 0, w = 1 ) {

			this.isQuaternion = true;

			this._x = x;
			this._y = y;
			this._z = z;
			this._w = w;

		}

		static slerpFlat( dst, dstOffset, src0, srcOffset0, src1, srcOffset1, t ) {

			// fuzz-free, array-based Quaternion SLERP operation

			let x0 = src0[ srcOffset0 + 0 ],
				y0 = src0[ srcOffset0 + 1 ],
				z0 = src0[ srcOffset0 + 2 ],
				w0 = src0[ srcOffset0 + 3 ];

			const x1 = src1[ srcOffset1 + 0 ],
				y1 = src1[ srcOffset1 + 1 ],
				z1 = src1[ srcOffset1 + 2 ],
				w1 = src1[ srcOffset1 + 3 ];

			if ( t === 0 ) {

				dst[ dstOffset + 0 ] = x0;
				dst[ dstOffset + 1 ] = y0;
				dst[ dstOffset + 2 ] = z0;
				dst[ dstOffset + 3 ] = w0;
				return;

			}

			if ( t === 1 ) {

				dst[ dstOffset + 0 ] = x1;
				dst[ dstOffset + 1 ] = y1;
				dst[ dstOffset + 2 ] = z1;
				dst[ dstOffset + 3 ] = w1;
				return;

			}

			if ( w0 !== w1 || x0 !== x1 || y0 !== y1 || z0 !== z1 ) {

				let s = 1 - t;
				const cos = x0 * x1 + y0 * y1 + z0 * z1 + w0 * w1,
					dir = ( cos >= 0 ? 1 : - 1 ),
					sqrSin = 1 - cos * cos;

				// Skip the Slerp for tiny steps to avoid numeric problems:
				if ( sqrSin > Number.EPSILON ) {

					const sin = Math.sqrt( sqrSin ),
						len = Math.atan2( sin, cos * dir );

					s = Math.sin( s * len ) / sin;
					t = Math.sin( t * len ) / sin;

				}

				const tDir = t * dir;

				x0 = x0 * s + x1 * tDir;
				y0 = y0 * s + y1 * tDir;
				z0 = z0 * s + z1 * tDir;
				w0 = w0 * s + w1 * tDir;

				// Normalize in case we just did a lerp:
				if ( s === 1 - t ) {

					const f = 1 / Math.sqrt( x0 * x0 + y0 * y0 + z0 * z0 + w0 * w0 );

					x0 *= f;
					y0 *= f;
					z0 *= f;
					w0 *= f;

				}

			}

			dst[ dstOffset ] = x0;
			dst[ dstOffset + 1 ] = y0;
			dst[ dstOffset + 2 ] = z0;
			dst[ dstOffset + 3 ] = w0;

		}

		static multiplyQuaternionsFlat( dst, dstOffset, src0, srcOffset0, src1, srcOffset1 ) {

			const x0 = src0[ srcOffset0 ];
			const y0 = src0[ srcOffset0 + 1 ];
			const z0 = src0[ srcOffset0 + 2 ];
			const w0 = src0[ srcOffset0 + 3 ];

			const x1 = src1[ srcOffset1 ];
			const y1 = src1[ srcOffset1 + 1 ];
			const z1 = src1[ srcOffset1 + 2 ];
			const w1 = src1[ srcOffset1 + 3 ];

			dst[ dstOffset ] = x0 * w1 + w0 * x1 + y0 * z1 - z0 * y1;
			dst[ dstOffset + 1 ] = y0 * w1 + w0 * y1 + z0 * x1 - x0 * z1;
			dst[ dstOffset + 2 ] = z0 * w1 + w0 * z1 + x0 * y1 - y0 * x1;
			dst[ dstOffset + 3 ] = w0 * w1 - x0 * x1 - y0 * y1 - z0 * z1;

			return dst;

		}

		get x() {

			return this._x;

		}

		set x( value ) {

			this._x = value;
			this._onChangeCallback();

		}

		get y() {

			return this._y;

		}

		set y( value ) {

			this._y = value;
			this._onChangeCallback();

		}

		get z() {

			return this._z;

		}

		set z( value ) {

			this._z = value;
			this._onChangeCallback();

		}

		get w() {

			return this._w;

		}

		set w( value ) {

			this._w = value;
			this._onChangeCallback();

		}

		set( x, y, z, w ) {

			this._x = x;
			this._y = y;
			this._z = z;
			this._w = w;

			this._onChangeCallback();

			return this;

		}

		clone() {

			return new this.constructor( this._x, this._y, this._z, this._w );

		}

		copy( quaternion ) {

			this._x = quaternion.x;
			this._y = quaternion.y;
			this._z = quaternion.z;
			this._w = quaternion.w;

			this._onChangeCallback();

			return this;

		}

		setFromEuler( euler, update ) {

			const x = euler._x, y = euler._y, z = euler._z, order = euler._order;

			// http://www.mathworks.com/matlabcentral/fileexchange/
			// 	20696-function-to-convert-between-dcm-euler-angles-quaternions-and-euler-vectors/
			//	content/SpinCalc.m

			const cos = Math.cos;
			const sin = Math.sin;

			const c1 = cos( x / 2 );
			const c2 = cos( y / 2 );
			const c3 = cos( z / 2 );

			const s1 = sin( x / 2 );
			const s2 = sin( y / 2 );
			const s3 = sin( z / 2 );

			switch ( order ) {

				case 'XYZ':
					this._x = s1 * c2 * c3 + c1 * s2 * s3;
					this._y = c1 * s2 * c3 - s1 * c2 * s3;
					this._z = c1 * c2 * s3 + s1 * s2 * c3;
					this._w = c1 * c2 * c3 - s1 * s2 * s3;
					break;

				case 'YXZ':
					this._x = s1 * c2 * c3 + c1 * s2 * s3;
					this._y = c1 * s2 * c3 - s1 * c2 * s3;
					this._z = c1 * c2 * s3 - s1 * s2 * c3;
					this._w = c1 * c2 * c3 + s1 * s2 * s3;
					break;

				case 'ZXY':
					this._x = s1 * c2 * c3 - c1 * s2 * s3;
					this._y = c1 * s2 * c3 + s1 * c2 * s3;
					this._z = c1 * c2 * s3 + s1 * s2 * c3;
					this._w = c1 * c2 * c3 - s1 * s2 * s3;
					break;

				case 'ZYX':
					this._x = s1 * c2 * c3 - c1 * s2 * s3;
					this._y = c1 * s2 * c3 + s1 * c2 * s3;
					this._z = c1 * c2 * s3 - s1 * s2 * c3;
					this._w = c1 * c2 * c3 + s1 * s2 * s3;
					break;

				case 'YZX':
					this._x = s1 * c2 * c3 + c1 * s2 * s3;
					this._y = c1 * s2 * c3 + s1 * c2 * s3;
					this._z = c1 * c2 * s3 - s1 * s2 * c3;
					this._w = c1 * c2 * c3 - s1 * s2 * s3;
					break;

				case 'XZY':
					this._x = s1 * c2 * c3 - c1 * s2 * s3;
					this._y = c1 * s2 * c3 - s1 * c2 * s3;
					this._z = c1 * c2 * s3 + s1 * s2 * c3;
					this._w = c1 * c2 * c3 + s1 * s2 * s3;
					break;

				default:
					console.warn( 'THREE.Quaternion: .setFromEuler() encountered an unknown order: ' + order );

			}

			if ( update !== false ) this._onChangeCallback();

			return this;

		}

		setFromAxisAngle( axis, angle ) {

			// http://www.euclideanspace.com/maths/geometry/rotations/conversions/angleToQuaternion/index.htm

			// assumes axis is normalized

			const halfAngle = angle / 2, s = Math.sin( halfAngle );

			this._x = axis.x * s;
			this._y = axis.y * s;
			this._z = axis.z * s;
			this._w = Math.cos( halfAngle );

			this._onChangeCallback();

			return this;

		}

		setFromRotationMatrix( m ) {

			// http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToQuaternion/index.htm

			// assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)

			const te = m.elements,

				m11 = te[ 0 ], m12 = te[ 4 ], m13 = te[ 8 ],
				m21 = te[ 1 ], m22 = te[ 5 ], m23 = te[ 9 ],
				m31 = te[ 2 ], m32 = te[ 6 ], m33 = te[ 10 ],

				trace = m11 + m22 + m33;

			if ( trace > 0 ) {

				const s = 0.5 / Math.sqrt( trace + 1.0 );

				this._w = 0.25 / s;
				this._x = ( m32 - m23 ) * s;
				this._y = ( m13 - m31 ) * s;
				this._z = ( m21 - m12 ) * s;

			} else if ( m11 > m22 && m11 > m33 ) {

				const s = 2.0 * Math.sqrt( 1.0 + m11 - m22 - m33 );

				this._w = ( m32 - m23 ) / s;
				this._x = 0.25 * s;
				this._y = ( m12 + m21 ) / s;
				this._z = ( m13 + m31 ) / s;

			} else if ( m22 > m33 ) {

				const s = 2.0 * Math.sqrt( 1.0 + m22 - m11 - m33 );

				this._w = ( m13 - m31 ) / s;
				this._x = ( m12 + m21 ) / s;
				this._y = 0.25 * s;
				this._z = ( m23 + m32 ) / s;

			} else {

				const s = 2.0 * Math.sqrt( 1.0 + m33 - m11 - m22 );

				this._w = ( m21 - m12 ) / s;
				this._x = ( m13 + m31 ) / s;
				this._y = ( m23 + m32 ) / s;
				this._z = 0.25 * s;

			}

			this._onChangeCallback();

			return this;

		}

		setFromUnitVectors( vFrom, vTo ) {

			// assumes direction vectors vFrom and vTo are normalized

			let r = vFrom.dot( vTo ) + 1;

			if ( r < Number.EPSILON ) {

				// vFrom and vTo point in opposite directions

				r = 0;

				if ( Math.abs( vFrom.x ) > Math.abs( vFrom.z ) ) {

					this._x = - vFrom.y;
					this._y = vFrom.x;
					this._z = 0;
					this._w = r;

				} else {

					this._x = 0;
					this._y = - vFrom.z;
					this._z = vFrom.y;
					this._w = r;

				}

			} else {

				// crossVectors( vFrom, vTo ); // inlined to avoid cyclic dependency on Vector3

				this._x = vFrom.y * vTo.z - vFrom.z * vTo.y;
				this._y = vFrom.z * vTo.x - vFrom.x * vTo.z;
				this._z = vFrom.x * vTo.y - vFrom.y * vTo.x;
				this._w = r;

			}

			return this.normalize();

		}

		angleTo( q ) {

			return 2 * Math.acos( Math.abs( clamp( this.dot( q ), - 1, 1 ) ) );

		}

		rotateTowards( q, step ) {

			const angle = this.angleTo( q );

			if ( angle === 0 ) return this;

			const t = Math.min( 1, step / angle );

			this.slerp( q, t );

			return this;

		}

		identity() {

			return this.set( 0, 0, 0, 1 );

		}

		invert() {

			// quaternion is assumed to have unit length

			return this.conjugate();

		}

		conjugate() {

			this._x *= - 1;
			this._y *= - 1;
			this._z *= - 1;

			this._onChangeCallback();

			return this;

		}

		dot( v ) {

			return this._x * v._x + this._y * v._y + this._z * v._z + this._w * v._w;

		}

		lengthSq() {

			return this._x * this._x + this._y * this._y + this._z * this._z + this._w * this._w;

		}

		length() {

			return Math.sqrt( this._x * this._x + this._y * this._y + this._z * this._z + this._w * this._w );

		}

		normalize() {

			let l = this.length();

			if ( l === 0 ) {

				this._x = 0;
				this._y = 0;
				this._z = 0;
				this._w = 1;

			} else {

				l = 1 / l;

				this._x = this._x * l;
				this._y = this._y * l;
				this._z = this._z * l;
				this._w = this._w * l;

			}

			this._onChangeCallback();

			return this;

		}

		multiply( q ) {

			return this.multiplyQuaternions( this, q );

		}

		premultiply( q ) {

			return this.multiplyQuaternions( q, this );

		}

		multiplyQuaternions( a, b ) {

			// from http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/code/index.htm

			const qax = a._x, qay = a._y, qaz = a._z, qaw = a._w;
			const qbx = b._x, qby = b._y, qbz = b._z, qbw = b._w;

			this._x = qax * qbw + qaw * qbx + qay * qbz - qaz * qby;
			this._y = qay * qbw + qaw * qby + qaz * qbx - qax * qbz;
			this._z = qaz * qbw + qaw * qbz + qax * qby - qay * qbx;
			this._w = qaw * qbw - qax * qbx - qay * qby - qaz * qbz;

			this._onChangeCallback();

			return this;

		}

		slerp( qb, t ) {

			if ( t === 0 ) return this;
			if ( t === 1 ) return this.copy( qb );

			const x = this._x, y = this._y, z = this._z, w = this._w;

			// http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/slerp/

			let cosHalfTheta = w * qb._w + x * qb._x + y * qb._y + z * qb._z;

			if ( cosHalfTheta < 0 ) {

				this._w = - qb._w;
				this._x = - qb._x;
				this._y = - qb._y;
				this._z = - qb._z;

				cosHalfTheta = - cosHalfTheta;

			} else {

				this.copy( qb );

			}

			if ( cosHalfTheta >= 1.0 ) {

				this._w = w;
				this._x = x;
				this._y = y;
				this._z = z;

				return this;

			}

			const sqrSinHalfTheta = 1.0 - cosHalfTheta * cosHalfTheta;

			if ( sqrSinHalfTheta <= Number.EPSILON ) {

				const s = 1 - t;
				this._w = s * w + t * this._w;
				this._x = s * x + t * this._x;
				this._y = s * y + t * this._y;
				this._z = s * z + t * this._z;

				this.normalize();
				this._onChangeCallback();

				return this;

			}

			const sinHalfTheta = Math.sqrt( sqrSinHalfTheta );
			const halfTheta = Math.atan2( sinHalfTheta, cosHalfTheta );
			const ratioA = Math.sin( ( 1 - t ) * halfTheta ) / sinHalfTheta,
				ratioB = Math.sin( t * halfTheta ) / sinHalfTheta;

			this._w = ( w * ratioA + this._w * ratioB );
			this._x = ( x * ratioA + this._x * ratioB );
			this._y = ( y * ratioA + this._y * ratioB );
			this._z = ( z * ratioA + this._z * ratioB );

			this._onChangeCallback();

			return this;

		}

		slerpQuaternions( qa, qb, t ) {

			return this.copy( qa ).slerp( qb, t );

		}

		random() {

			// Derived from http://planning.cs.uiuc.edu/node198.html
			// Note, this source uses w, x, y, z ordering,
			// so we swap the order below.

			const u1 = Math.random();
			const sqrt1u1 = Math.sqrt( 1 - u1 );
			const sqrtu1 = Math.sqrt( u1 );

			const u2 = 2 * Math.PI * Math.random();

			const u3 = 2 * Math.PI * Math.random();

			return this.set(
				sqrt1u1 * Math.cos( u2 ),
				sqrtu1 * Math.sin( u3 ),
				sqrtu1 * Math.cos( u3 ),
				sqrt1u1 * Math.sin( u2 ),
			);

		}

		equals( quaternion ) {

			return ( quaternion._x === this._x ) && ( quaternion._y === this._y ) && ( quaternion._z === this._z ) && ( quaternion._w === this._w );

		}

		fromArray( array, offset = 0 ) {

			this._x = array[ offset ];
			this._y = array[ offset + 1 ];
			this._z = array[ offset + 2 ];
			this._w = array[ offset + 3 ];

			this._onChangeCallback();

			return this;

		}

		toArray( array = [], offset = 0 ) {

			array[ offset ] = this._x;
			array[ offset + 1 ] = this._y;
			array[ offset + 2 ] = this._z;
			array[ offset + 3 ] = this._w;

			return array;

		}

		fromBufferAttribute( attribute, index ) {

			this._x = attribute.getX( index );
			this._y = attribute.getY( index );
			this._z = attribute.getZ( index );
			this._w = attribute.getW( index );

			return this;

		}

		toJSON() {

			return this.toArray();

		}

		_onChange( callback ) {

			this._onChangeCallback = callback;

			return this;

		}

		_onChangeCallback() {}

		*[ Symbol.iterator ]() {

			yield this._x;
			yield this._y;
			yield this._z;
			yield this._w;

		}

	}

	class Vector3 {

		constructor( x = 0, y = 0, z = 0 ) {

			Vector3.prototype.isVector3 = true;

			this.x = x;
			this.y = y;
			this.z = z;

		}

		set( x, y, z ) {

			if ( z === undefined ) z = this.z; // sprite.scale.set(x,y)

			this.x = x;
			this.y = y;
			this.z = z;

			return this;

		}

		setScalar( scalar ) {

			this.x = scalar;
			this.y = scalar;
			this.z = scalar;

			return this;

		}

		setX( x ) {

			this.x = x;

			return this;

		}

		setY( y ) {

			this.y = y;

			return this;

		}

		setZ( z ) {

			this.z = z;

			return this;

		}

		setComponent( index, value ) {

			switch ( index ) {

				case 0: this.x = value; break;
				case 1: this.y = value; break;
				case 2: this.z = value; break;
				default: throw new Error( 'index is out of range: ' + index );

			}

			return this;

		}

		getComponent( index ) {

			switch ( index ) {

				case 0: return this.x;
				case 1: return this.y;
				case 2: return this.z;
				default: throw new Error( 'index is out of range: ' + index );

			}

		}

		clone() {

			return new this.constructor( this.x, this.y, this.z );

		}

		copy( v ) {

			this.x = v.x;
			this.y = v.y;
			this.z = v.z;

			return this;

		}

		add( v ) {

			this.x += v.x;
			this.y += v.y;
			this.z += v.z;

			return this;

		}

		addScalar( s ) {

			this.x += s;
			this.y += s;
			this.z += s;

			return this;

		}

		addVectors( a, b ) {

			this.x = a.x + b.x;
			this.y = a.y + b.y;
			this.z = a.z + b.z;

			return this;

		}

		addScaledVector( v, s ) {

			this.x += v.x * s;
			this.y += v.y * s;
			this.z += v.z * s;

			return this;

		}

		sub( v ) {

			this.x -= v.x;
			this.y -= v.y;
			this.z -= v.z;

			return this;

		}

		subScalar( s ) {

			this.x -= s;
			this.y -= s;
			this.z -= s;

			return this;

		}

		subVectors( a, b ) {

			this.x = a.x - b.x;
			this.y = a.y - b.y;
			this.z = a.z - b.z;

			return this;

		}

		multiply( v ) {

			this.x *= v.x;
			this.y *= v.y;
			this.z *= v.z;

			return this;

		}

		multiplyScalar( scalar ) {

			this.x *= scalar;
			this.y *= scalar;
			this.z *= scalar;

			return this;

		}

		multiplyVectors( a, b ) {

			this.x = a.x * b.x;
			this.y = a.y * b.y;
			this.z = a.z * b.z;

			return this;

		}

		applyEuler( euler ) {

			return this.applyQuaternion( _quaternion$4.setFromEuler( euler ) );

		}

		applyAxisAngle( axis, angle ) {

			return this.applyQuaternion( _quaternion$4.setFromAxisAngle( axis, angle ) );

		}

		applyMatrix3( m ) {

			const x = this.x, y = this.y, z = this.z;
			const e = m.elements;

			this.x = e[ 0 ] * x + e[ 3 ] * y + e[ 6 ] * z;
			this.y = e[ 1 ] * x + e[ 4 ] * y + e[ 7 ] * z;
			this.z = e[ 2 ] * x + e[ 5 ] * y + e[ 8 ] * z;

			return this;

		}

		applyNormalMatrix( m ) {

			return this.applyMatrix3( m ).normalize();

		}

		applyMatrix4( m ) {

			const x = this.x, y = this.y, z = this.z;
			const e = m.elements;

			const w = 1 / ( e[ 3 ] * x + e[ 7 ] * y + e[ 11 ] * z + e[ 15 ] );

			this.x = ( e[ 0 ] * x + e[ 4 ] * y + e[ 8 ] * z + e[ 12 ] ) * w;
			this.y = ( e[ 1 ] * x + e[ 5 ] * y + e[ 9 ] * z + e[ 13 ] ) * w;
			this.z = ( e[ 2 ] * x + e[ 6 ] * y + e[ 10 ] * z + e[ 14 ] ) * w;

			return this;

		}

		applyQuaternion( q ) {

			// quaternion q is assumed to have unit length

			const vx = this.x, vy = this.y, vz = this.z;
			const qx = q.x, qy = q.y, qz = q.z, qw = q.w;

			// t = 2 * cross( q.xyz, v );
			const tx = 2 * ( qy * vz - qz * vy );
			const ty = 2 * ( qz * vx - qx * vz );
			const tz = 2 * ( qx * vy - qy * vx );

			// v + q.w * t + cross( q.xyz, t );
			this.x = vx + qw * tx + qy * tz - qz * ty;
			this.y = vy + qw * ty + qz * tx - qx * tz;
			this.z = vz + qw * tz + qx * ty - qy * tx;

			return this;

		}

		project( camera ) {

			return this.applyMatrix4( camera.matrixWorldInverse ).applyMatrix4( camera.projectionMatrix );

		}

		unproject( camera ) {

			return this.applyMatrix4( camera.projectionMatrixInverse ).applyMatrix4( camera.matrixWorld );

		}

		transformDirection( m ) {

			// input: THREE.Matrix4 affine matrix
			// vector interpreted as a direction

			const x = this.x, y = this.y, z = this.z;
			const e = m.elements;

			this.x = e[ 0 ] * x + e[ 4 ] * y + e[ 8 ] * z;
			this.y = e[ 1 ] * x + e[ 5 ] * y + e[ 9 ] * z;
			this.z = e[ 2 ] * x + e[ 6 ] * y + e[ 10 ] * z;

			return this.normalize();

		}

		divide( v ) {

			this.x /= v.x;
			this.y /= v.y;
			this.z /= v.z;

			return this;

		}

		divideScalar( scalar ) {

			return this.multiplyScalar( 1 / scalar );

		}

		min( v ) {

			this.x = Math.min( this.x, v.x );
			this.y = Math.min( this.y, v.y );
			this.z = Math.min( this.z, v.z );

			return this;

		}

		max( v ) {

			this.x = Math.max( this.x, v.x );
			this.y = Math.max( this.y, v.y );
			this.z = Math.max( this.z, v.z );

			return this;

		}

		clamp( min, max ) {

			// assumes min < max, componentwise

			this.x = Math.max( min.x, Math.min( max.x, this.x ) );
			this.y = Math.max( min.y, Math.min( max.y, this.y ) );
			this.z = Math.max( min.z, Math.min( max.z, this.z ) );

			return this;

		}

		clampScalar( minVal, maxVal ) {

			this.x = Math.max( minVal, Math.min( maxVal, this.x ) );
			this.y = Math.max( minVal, Math.min( maxVal, this.y ) );
			this.z = Math.max( minVal, Math.min( maxVal, this.z ) );

			return this;

		}

		clampLength( min, max ) {

			const length = this.length();

			return this.divideScalar( length || 1 ).multiplyScalar( Math.max( min, Math.min( max, length ) ) );

		}

		floor() {

			this.x = Math.floor( this.x );
			this.y = Math.floor( this.y );
			this.z = Math.floor( this.z );

			return this;

		}

		ceil() {

			this.x = Math.ceil( this.x );
			this.y = Math.ceil( this.y );
			this.z = Math.ceil( this.z );

			return this;

		}

		round() {

			this.x = Math.round( this.x );
			this.y = Math.round( this.y );
			this.z = Math.round( this.z );

			return this;

		}

		roundToZero() {

			this.x = Math.trunc( this.x );
			this.y = Math.trunc( this.y );
			this.z = Math.trunc( this.z );

			return this;

		}

		negate() {

			this.x = - this.x;
			this.y = - this.y;
			this.z = - this.z;

			return this;

		}

		dot( v ) {

			return this.x * v.x + this.y * v.y + this.z * v.z;

		}

		// TODO lengthSquared?

		lengthSq() {

			return this.x * this.x + this.y * this.y + this.z * this.z;

		}

		length() {

			return Math.sqrt( this.x * this.x + this.y * this.y + this.z * this.z );

		}

		manhattanLength() {

			return Math.abs( this.x ) + Math.abs( this.y ) + Math.abs( this.z );

		}

		normalize() {

			return this.divideScalar( this.length() || 1 );

		}

		setLength( length ) {

			return this.normalize().multiplyScalar( length );

		}

		lerp( v, alpha ) {

			this.x += ( v.x - this.x ) * alpha;
			this.y += ( v.y - this.y ) * alpha;
			this.z += ( v.z - this.z ) * alpha;

			return this;

		}

		lerpVectors( v1, v2, alpha ) {

			this.x = v1.x + ( v2.x - v1.x ) * alpha;
			this.y = v1.y + ( v2.y - v1.y ) * alpha;
			this.z = v1.z + ( v2.z - v1.z ) * alpha;

			return this;

		}

		cross( v ) {

			return this.crossVectors( this, v );

		}

		crossVectors( a, b ) {

			const ax = a.x, ay = a.y, az = a.z;
			const bx = b.x, by = b.y, bz = b.z;

			this.x = ay * bz - az * by;
			this.y = az * bx - ax * bz;
			this.z = ax * by - ay * bx;

			return this;

		}

		projectOnVector( v ) {

			const denominator = v.lengthSq();

			if ( denominator === 0 ) return this.set( 0, 0, 0 );

			const scalar = v.dot( this ) / denominator;

			return this.copy( v ).multiplyScalar( scalar );

		}

		projectOnPlane( planeNormal ) {

			_vector$c.copy( this ).projectOnVector( planeNormal );

			return this.sub( _vector$c );

		}

		reflect( normal ) {

			// reflect incident vector off plane orthogonal to normal
			// normal is assumed to have unit length

			return this.sub( _vector$c.copy( normal ).multiplyScalar( 2 * this.dot( normal ) ) );

		}

		angleTo( v ) {

			const denominator = Math.sqrt( this.lengthSq() * v.lengthSq() );

			if ( denominator === 0 ) return Math.PI / 2;

			const theta = this.dot( v ) / denominator;

			// clamp, to handle numerical problems

			return Math.acos( clamp( theta, - 1, 1 ) );

		}

		distanceTo( v ) {

			return Math.sqrt( this.distanceToSquared( v ) );

		}

		distanceToSquared( v ) {

			const dx = this.x - v.x, dy = this.y - v.y, dz = this.z - v.z;

			return dx * dx + dy * dy + dz * dz;

		}

		manhattanDistanceTo( v ) {

			return Math.abs( this.x - v.x ) + Math.abs( this.y - v.y ) + Math.abs( this.z - v.z );

		}

		setFromSpherical( s ) {

			return this.setFromSphericalCoords( s.radius, s.phi, s.theta );

		}

		setFromSphericalCoords( radius, phi, theta ) {

			const sinPhiRadius = Math.sin( phi ) * radius;

			this.x = sinPhiRadius * Math.sin( theta );
			this.y = Math.cos( phi ) * radius;
			this.z = sinPhiRadius * Math.cos( theta );

			return this;

		}

		setFromCylindrical( c ) {

			return this.setFromCylindricalCoords( c.radius, c.theta, c.y );

		}

		setFromCylindricalCoords( radius, theta, y ) {

			this.x = radius * Math.sin( theta );
			this.y = y;
			this.z = radius * Math.cos( theta );

			return this;

		}

		setFromMatrixPosition( m ) {

			const e = m.elements;

			this.x = e[ 12 ];
			this.y = e[ 13 ];
			this.z = e[ 14 ];

			return this;

		}

		setFromMatrixScale( m ) {

			const sx = this.setFromMatrixColumn( m, 0 ).length();
			const sy = this.setFromMatrixColumn( m, 1 ).length();
			const sz = this.setFromMatrixColumn( m, 2 ).length();

			this.x = sx;
			this.y = sy;
			this.z = sz;

			return this;

		}

		setFromMatrixColumn( m, index ) {

			return this.fromArray( m.elements, index * 4 );

		}

		setFromMatrix3Column( m, index ) {

			return this.fromArray( m.elements, index * 3 );

		}

		setFromEuler( e ) {

			this.x = e._x;
			this.y = e._y;
			this.z = e._z;

			return this;

		}

		setFromColor( c ) {

			this.x = c.r;
			this.y = c.g;
			this.z = c.b;

			return this;

		}

		equals( v ) {

			return ( ( v.x === this.x ) && ( v.y === this.y ) && ( v.z === this.z ) );

		}

		fromArray( array, offset = 0 ) {

			this.x = array[ offset ];
			this.y = array[ offset + 1 ];
			this.z = array[ offset + 2 ];

			return this;

		}

		toArray( array = [], offset = 0 ) {

			array[ offset ] = this.x;
			array[ offset + 1 ] = this.y;
			array[ offset + 2 ] = this.z;

			return array;

		}

		fromBufferAttribute( attribute, index ) {

			this.x = attribute.getX( index );
			this.y = attribute.getY( index );
			this.z = attribute.getZ( index );

			return this;

		}

		random() {

			this.x = Math.random();
			this.y = Math.random();
			this.z = Math.random();

			return this;

		}

		randomDirection() {

			// Derived from https://mathworld.wolfram.com/SpherePointPicking.html

			const u = ( Math.random() - 0.5 ) * 2;
			const t = Math.random() * Math.PI * 2;
			const f = Math.sqrt( 1 - u ** 2 );

			this.x = f * Math.cos( t );
			this.y = f * Math.sin( t );
			this.z = u;

			return this;

		}

		*[ Symbol.iterator ]() {

			yield this.x;
			yield this.y;
			yield this.z;

		}

	}

    

	const _vector$c = /*@__PURE__*/ new Vector3();
	const _quaternion$4 = /*@__PURE__*/ new Quaternion();

    class Box3 {

		constructor( min = new Vector3( + Infinity, + Infinity, + Infinity ), max = new Vector3( - Infinity, - Infinity, - Infinity ) ) {

			this.isBox3 = true;

			this.min = min;
			this.max = max;

		}

		set( min, max ) {

			this.min.copy( min );
			this.max.copy( max );

			return this;

		}

		setFromArray( array ) {

			this.makeEmpty();

			for ( let i = 0, il = array.length; i < il; i += 3 ) {

				this.expandByPoint( _vector$b.fromArray( array, i ) );

			}

			return this;

		}

		setFromBufferAttribute( attribute ) {

			this.makeEmpty();

			for ( let i = 0, il = attribute.count; i < il; i ++ ) {

				this.expandByPoint( _vector$b.fromBufferAttribute( attribute, i ) );

			}

			return this;

		}

		setFromPoints( points ) {

			this.makeEmpty();

			for ( let i = 0, il = points.length; i < il; i ++ ) {

				this.expandByPoint( points[ i ] );

			}

			return this;

		}

		setFromCenterAndSize( center, size ) {

			const halfSize = _vector$b.copy( size ).multiplyScalar( 0.5 );

			this.min.copy( center ).sub( halfSize );
			this.max.copy( center ).add( halfSize );

			return this;

		}

		setFromObject( object, precise = false ) {

			this.makeEmpty();

			return this.expandByObject( object, precise );

		}

		clone() {

			return new this.constructor().copy( this );

		}

		copy( box ) {

			this.min.copy( box.min );
			this.max.copy( box.max );

			return this;

		}

		makeEmpty() {

			this.min.x = this.min.y = this.min.z = + Infinity;
			this.max.x = this.max.y = this.max.z = - Infinity;

			return this;

		}

		isEmpty() {

			// this is a more robust check for empty than ( volume <= 0 ) because volume can get positive with two negative axes

			return ( this.max.x < this.min.x ) || ( this.max.y < this.min.y ) || ( this.max.z < this.min.z );

		}

		getCenter( target ) {

			return this.isEmpty() ? target.set( 0, 0, 0 ) : target.addVectors( this.min, this.max ).multiplyScalar( 0.5 );

		}

		getSize( target ) {

			return this.isEmpty() ? target.set( 0, 0, 0 ) : target.subVectors( this.max, this.min );

		}

		expandByPoint( point ) {

			this.min.min( point );
			this.max.max( point );

			return this;

		}

		expandByVector( vector ) {

			this.min.sub( vector );
			this.max.add( vector );

			return this;

		}

		expandByScalar( scalar ) {

			this.min.addScalar( - scalar );
			this.max.addScalar( scalar );

			return this;

		}

		expandByObject( object, precise = false ) {

			// Computes the world-axis-aligned bounding box of an object (including its children),
			// accounting for both the object's, and children's, world transforms

			object.updateWorldMatrix( false, false );

			const geometry = object.geometry;

			if ( geometry !== undefined ) {

				const positionAttribute = geometry.getAttribute( 'position' );

				// precise AABB computation based on vertex data requires at least a position attribute.
				// instancing isn't supported so far and uses the normal (conservative) code path.

				if ( precise === true && positionAttribute !== undefined && object.isInstancedMesh !== true ) {

					for ( let i = 0, l = positionAttribute.count; i < l; i ++ ) {

						if ( object.isMesh === true ) {

							object.getVertexPosition( i, _vector$b );

						} else {

							_vector$b.fromBufferAttribute( positionAttribute, i );

						}

						_vector$b.applyMatrix4( object.matrixWorld );
						this.expandByPoint( _vector$b );

					}

				} else {

					if ( object.boundingBox !== undefined ) {

						// object-level bounding box

						if ( object.boundingBox === null ) {

							object.computeBoundingBox();

						}

						_box$4.copy( object.boundingBox );


					} else {

						// geometry-level bounding box

						if ( geometry.boundingBox === null ) {

							geometry.computeBoundingBox();

						}

						_box$4.copy( geometry.boundingBox );

					}

					_box$4.applyMatrix4( object.matrixWorld );

					this.union( _box$4 );

				}

			}

			const children = object.children;

			for ( let i = 0, l = children.length; i < l; i ++ ) {

				this.expandByObject( children[ i ], precise );

			}

			return this;

		}

		containsPoint( point ) {

			return point.x < this.min.x || point.x > this.max.x ||
				point.y < this.min.y || point.y > this.max.y ||
				point.z < this.min.z || point.z > this.max.z ? false : true;

		}

		containsBox( box ) {

			return this.min.x <= box.min.x && box.max.x <= this.max.x &&
				this.min.y <= box.min.y && box.max.y <= this.max.y &&
				this.min.z <= box.min.z && box.max.z <= this.max.z;

		}

		getParameter( point, target ) {

			// This can potentially have a divide by zero if the box
			// has a size dimension of 0.

			return target.set(
				( point.x - this.min.x ) / ( this.max.x - this.min.x ),
				( point.y - this.min.y ) / ( this.max.y - this.min.y ),
				( point.z - this.min.z ) / ( this.max.z - this.min.z )
			);

		}

		intersectsBox( box ) {

			// using 6 splitting planes to rule out intersections.
			return box.max.x < this.min.x || box.min.x > this.max.x ||
				box.max.y < this.min.y || box.min.y > this.max.y ||
				box.max.z < this.min.z || box.min.z > this.max.z ? false : true;

		}

		intersectsSphere( sphere ) {

			// Find the point on the AABB closest to the sphere center.
			this.clampPoint( sphere.center, _vector$b );

			// If that point is inside the sphere, the AABB and sphere intersect.
			return _vector$b.distanceToSquared( sphere.center ) <= ( sphere.radius * sphere.radius );

		}

		intersectsPlane( plane ) {

			// We compute the minimum and maximum dot product values. If those values
			// are on the same side (back or front) of the plane, then there is no intersection.

			let min, max;

			if ( plane.normal.x > 0 ) {

				min = plane.normal.x * this.min.x;
				max = plane.normal.x * this.max.x;

			} else {

				min = plane.normal.x * this.max.x;
				max = plane.normal.x * this.min.x;

			}

			if ( plane.normal.y > 0 ) {

				min += plane.normal.y * this.min.y;
				max += plane.normal.y * this.max.y;

			} else {

				min += plane.normal.y * this.max.y;
				max += plane.normal.y * this.min.y;

			}

			if ( plane.normal.z > 0 ) {

				min += plane.normal.z * this.min.z;
				max += plane.normal.z * this.max.z;

			} else {

				min += plane.normal.z * this.max.z;
				max += plane.normal.z * this.min.z;

			}

			return ( min <= - plane.constant && max >= - plane.constant );

		}

		intersectsTriangle( triangle ) {

			if ( this.isEmpty() ) {

				return false;

			}

			// compute box center and extents
			this.getCenter( _center );
			_extents.subVectors( this.max, _center );

			// translate triangle to aabb origin
			_v0$2.subVectors( triangle.a, _center );
			_v1$7.subVectors( triangle.b, _center );
			_v2$4.subVectors( triangle.c, _center );

			// compute edge vectors for triangle
			_f0.subVectors( _v1$7, _v0$2 );
			_f1.subVectors( _v2$4, _v1$7 );
			_f2.subVectors( _v0$2, _v2$4 );

			// test against axes that are given by cross product combinations of the edges of the triangle and the edges of the aabb
			// make an axis testing of each of the 3 sides of the aabb against each of the 3 sides of the triangle = 9 axis of separation
			// axis_ij = u_i x f_j (u0, u1, u2 = face normals of aabb = x,y,z axes vectors since aabb is axis aligned)
			let axes = [
				0, - _f0.z, _f0.y, 0, - _f1.z, _f1.y, 0, - _f2.z, _f2.y,
				_f0.z, 0, - _f0.x, _f1.z, 0, - _f1.x, _f2.z, 0, - _f2.x,
				- _f0.y, _f0.x, 0, - _f1.y, _f1.x, 0, - _f2.y, _f2.x, 0
			];
			if ( ! satForAxes( axes, _v0$2, _v1$7, _v2$4, _extents ) ) {

				return false;

			}

			// test 3 face normals from the aabb
			axes = [ 1, 0, 0, 0, 1, 0, 0, 0, 1 ];
			if ( ! satForAxes( axes, _v0$2, _v1$7, _v2$4, _extents ) ) {

				return false;

			}

			// finally testing the face normal of the triangle
			// use already existing triangle edge vectors here
			_triangleNormal.crossVectors( _f0, _f1 );
			axes = [ _triangleNormal.x, _triangleNormal.y, _triangleNormal.z ];

			return satForAxes( axes, _v0$2, _v1$7, _v2$4, _extents );

		}

		clampPoint( point, target ) {

			return target.copy( point ).clamp( this.min, this.max );

		}

		distanceToPoint( point ) {

			return this.clampPoint( point, _vector$b ).distanceTo( point );

		}

		getBoundingSphere( target ) {

			if ( this.isEmpty() ) {

				target.makeEmpty();

			} else {

				this.getCenter( target.center );

				target.radius = this.getSize( _vector$b ).length() * 0.5;

			}

			return target;

		}

		intersect( box ) {

			this.min.max( box.min );
			this.max.min( box.max );

			// ensure that if there is no overlap, the result is fully empty, not slightly empty with non-inf/+inf values that will cause subsequence intersects to erroneously return valid values.
			if ( this.isEmpty() ) this.makeEmpty();

			return this;

		}

		union( box ) {

			this.min.min( box.min );
			this.max.max( box.max );

			return this;

		}

		applyMatrix4( matrix ) {

			// transform of empty box is an empty box.
			if ( this.isEmpty() ) return this;

			// NOTE: I am using a binary pattern to specify all 2^3 combinations below
			_points[ 0 ].set( this.min.x, this.min.y, this.min.z ).applyMatrix4( matrix ); // 000
			_points[ 1 ].set( this.min.x, this.min.y, this.max.z ).applyMatrix4( matrix ); // 001
			_points[ 2 ].set( this.min.x, this.max.y, this.min.z ).applyMatrix4( matrix ); // 010
			_points[ 3 ].set( this.min.x, this.max.y, this.max.z ).applyMatrix4( matrix ); // 011
			_points[ 4 ].set( this.max.x, this.min.y, this.min.z ).applyMatrix4( matrix ); // 100
			_points[ 5 ].set( this.max.x, this.min.y, this.max.z ).applyMatrix4( matrix ); // 101
			_points[ 6 ].set( this.max.x, this.max.y, this.min.z ).applyMatrix4( matrix ); // 110
			_points[ 7 ].set( this.max.x, this.max.y, this.max.z ).applyMatrix4( matrix ); // 111

			this.setFromPoints( _points );

			return this;

		}

		translate( offset ) {

			this.min.add( offset );
			this.max.add( offset );

			return this;

		}

		equals( box ) {

			return box.min.equals( this.min ) && box.max.equals( this.max );

		}

	}

	const _points = [
		/*@__PURE__*/ new Vector3(),
		/*@__PURE__*/ new Vector3(),
		/*@__PURE__*/ new Vector3(),
		/*@__PURE__*/ new Vector3(),
		/*@__PURE__*/ new Vector3(),
		/*@__PURE__*/ new Vector3(),
		/*@__PURE__*/ new Vector3(),
		/*@__PURE__*/ new Vector3()
	];

	const _vector$b = /*@__PURE__*/ new Vector3();

	const _box$4 = /*@__PURE__*/ new Box3();

	// triangle centered vertices

	const _v0$2 = /*@__PURE__*/ new Vector3();
	const _v1$7 = /*@__PURE__*/ new Vector3();
	const _v2$4 = /*@__PURE__*/ new Vector3();

	// triangle edge vectors

	const _f0 = /*@__PURE__*/ new Vector3();
	const _f1 = /*@__PURE__*/ new Vector3();
	const _f2 = /*@__PURE__*/ new Vector3();

	const _center = /*@__PURE__*/ new Vector3();
	const _extents = /*@__PURE__*/ new Vector3();
	const _triangleNormal = /*@__PURE__*/ new Vector3();
	const _testAxis = /*@__PURE__*/ new Vector3();

	function satForAxes( axes, v0, v1, v2, extents ) {

		for ( let i = 0, j = axes.length - 3; i <= j; i += 3 ) {

			_testAxis.fromArray( axes, i );
			// project the aabb onto the separating axis
			const r = extents.x * Math.abs( _testAxis.x ) + extents.y * Math.abs( _testAxis.y ) + extents.z * Math.abs( _testAxis.z );
			// project all 3 vertices of the triangle onto the separating axis
			const p0 = v0.dot( _testAxis );
			const p1 = v1.dot( _testAxis );
			const p2 = v2.dot( _testAxis );
			// actual test, basically see if either of the most extreme of the triangle points intersects r
			if ( Math.max( - Math.max( p0, p1, p2 ), Math.min( p0, p1, p2 ) ) > r ) {

				// points of the projected triangle are outside the projected half-length of the aabb
				// the axis is separating and we can exit
				return false;

			}

		}

		return true;

	}

	const _box$3 = /*@__PURE__*/ new Box3();
	const _v1$6 = /*@__PURE__*/ new Vector3();
	const _v2$3 = /*@__PURE__*/ new Vector3();

	class Sphere {

		constructor( center = new Vector3(), radius = - 1 ) {

			this.center = center;
			this.radius = radius;

		}

		set( center, radius ) {

			this.center.copy( center );
			this.radius = radius;

			return this;

		}

		setFromPoints( points, optionalCenter ) {

			const center = this.center;

			if ( optionalCenter !== undefined ) {

				center.copy( optionalCenter );

			} else {

				_box$3.setFromPoints( points ).getCenter( center );

			}

			let maxRadiusSq = 0;

			for ( let i = 0, il = points.length; i < il; i ++ ) {

				maxRadiusSq = Math.max( maxRadiusSq, center.distanceToSquared( points[ i ] ) );

			}

			this.radius = Math.sqrt( maxRadiusSq );

			return this;

		}

		copy( sphere ) {

			this.center.copy( sphere.center );
			this.radius = sphere.radius;

			return this;

		}

		isEmpty() {

			return ( this.radius < 0 );

		}

		makeEmpty() {

			this.center.set( 0, 0, 0 );
			this.radius = - 1;

			return this;

		}

		containsPoint( point ) {

			return ( point.distanceToSquared( this.center ) <= ( this.radius * this.radius ) );

		}

		distanceToPoint( point ) {

			return ( point.distanceTo( this.center ) - this.radius );

		}

		intersectsSphere( sphere ) {

			const radiusSum = this.radius + sphere.radius;

			return sphere.center.distanceToSquared( this.center ) <= ( radiusSum * radiusSum );

		}

		intersectsBox( box ) {

			return box.intersectsSphere( this );

		}

		intersectsPlane( plane ) {

			return Math.abs( plane.distanceToPoint( this.center ) ) <= this.radius;

		}

		clampPoint( point, target ) {

			const deltaLengthSq = this.center.distanceToSquared( point );

			target.copy( point );

			if ( deltaLengthSq > ( this.radius * this.radius ) ) {

				target.sub( this.center ).normalize();
				target.multiplyScalar( this.radius ).add( this.center );

			}

			return target;

		}

		getBoundingBox( target ) {

			if ( this.isEmpty() ) {

				// Empty sphere produces empty bounding box
				target.makeEmpty();
				return target;

			}

			target.set( this.center, this.center );
			target.expandByScalar( this.radius );

			return target;

		}

		applyMatrix4( matrix ) {

			this.center.applyMatrix4( matrix );
			this.radius = this.radius * matrix.getMaxScaleOnAxis();

			return this;

		}

		translate( offset ) {

			this.center.add( offset );

			return this;

		}

		expandByPoint( point ) {

			if ( this.isEmpty() ) {

				this.center.copy( point );

				this.radius = 0;

				return this;

			}

			_v1$6.subVectors( point, this.center );

			const lengthSq = _v1$6.lengthSq();

			if ( lengthSq > ( this.radius * this.radius ) ) {

				// calculate the minimal sphere

				const length = Math.sqrt( lengthSq );

				const delta = ( length - this.radius ) * 0.5;

				this.center.addScaledVector( _v1$6, delta / length );

				this.radius += delta;

			}

			return this;

		}

		union( sphere ) {

			if ( sphere.isEmpty() ) {

				return this;

			}

			if ( this.isEmpty() ) {

				this.copy( sphere );

				return this;

			}

			if ( this.center.equals( sphere.center ) === true ) {

				 this.radius = Math.max( this.radius, sphere.radius );

			} else {

				_v2$3.subVectors( sphere.center, this.center ).setLength( sphere.radius );

				this.expandByPoint( _v1$6.copy( sphere.center ).add( _v2$3 ) );

				this.expandByPoint( _v1$6.copy( sphere.center ).sub( _v2$3 ) );

			}

			return this;

		}

		equals( sphere ) {

			return sphere.center.equals( this.center ) && ( sphere.radius === this.radius );

		}

		clone() {

			return new this.constructor().copy( this );

		}

	}

	const _vector$a = /*@__PURE__*/ new Vector3();
	const _segCenter = /*@__PURE__*/ new Vector3();
	const _segDir = /*@__PURE__*/ new Vector3();
	const _diff = /*@__PURE__*/ new Vector3();

	const _edge1 = /*@__PURE__*/ new Vector3();
	const _edge2 = /*@__PURE__*/ new Vector3();
	const _normal$1 = /*@__PURE__*/ new Vector3();

    class Ray {

		constructor( origin = new Vector3(), direction = new Vector3( 0, 0, - 1 ) ) {

			this.origin = origin;
			this.direction = direction;

		}

		set( origin, direction ) {

			this.origin.copy( origin );
			this.direction.copy( direction );

			return this;

		}

		copy( ray ) {

			this.origin.copy( ray.origin );
			this.direction.copy( ray.direction );

			return this;

		}

		at( t, target ) {

			return target.copy( this.origin ).addScaledVector( this.direction, t );

		}

		lookAt( v ) {

			this.direction.copy( v ).sub( this.origin ).normalize();

			return this;

		}

		recast( t ) {

			this.origin.copy( this.at( t, _vector$a ) );

			return this;

		}

		closestPointToPoint( point, target ) {

			target.subVectors( point, this.origin );

			const directionDistance = target.dot( this.direction );

			if ( directionDistance < 0 ) {

				return target.copy( this.origin );

			}

			return target.copy( this.origin ).addScaledVector( this.direction, directionDistance );

		}

		distanceToPoint( point ) {

			return Math.sqrt( this.distanceSqToPoint( point ) );

		}

		distanceSqToPoint( point ) {

			const directionDistance = _vector$a.subVectors( point, this.origin ).dot( this.direction );

			// point behind the ray

			if ( directionDistance < 0 ) {

				return this.origin.distanceToSquared( point );

			}

			_vector$a.copy( this.origin ).addScaledVector( this.direction, directionDistance );

			return _vector$a.distanceToSquared( point );

		}

		distanceSqToSegment( v0, v1, optionalPointOnRay, optionalPointOnSegment ) {

			// from https://github.com/pmjoniak/GeometricTools/blob/master/GTEngine/Include/Mathematics/GteDistRaySegment.h
			// It returns the min distance between the ray and the segment
			// defined by v0 and v1
			// It can also set two optional targets :
			// - The closest point on the ray
			// - The closest point on the segment

			_segCenter.copy( v0 ).add( v1 ).multiplyScalar( 0.5 );
			_segDir.copy( v1 ).sub( v0 ).normalize();
			_diff.copy( this.origin ).sub( _segCenter );

			const segExtent = v0.distanceTo( v1 ) * 0.5;
			const a01 = - this.direction.dot( _segDir );
			const b0 = _diff.dot( this.direction );
			const b1 = - _diff.dot( _segDir );
			const c = _diff.lengthSq();
			const det = Math.abs( 1 - a01 * a01 );
			let s0, s1, sqrDist, extDet;

			if ( det > 0 ) {

				// The ray and segment are not parallel.

				s0 = a01 * b1 - b0;
				s1 = a01 * b0 - b1;
				extDet = segExtent * det;

				if ( s0 >= 0 ) {

					if ( s1 >= - extDet ) {

						if ( s1 <= extDet ) {

							// region 0
							// Minimum at interior points of ray and segment.

							const invDet = 1 / det;
							s0 *= invDet;
							s1 *= invDet;
							sqrDist = s0 * ( s0 + a01 * s1 + 2 * b0 ) + s1 * ( a01 * s0 + s1 + 2 * b1 ) + c;

						} else {

							// region 1

							s1 = segExtent;
							s0 = Math.max( 0, - ( a01 * s1 + b0 ) );
							sqrDist = - s0 * s0 + s1 * ( s1 + 2 * b1 ) + c;

						}

					} else {

						// region 5

						s1 = - segExtent;
						s0 = Math.max( 0, - ( a01 * s1 + b0 ) );
						sqrDist = - s0 * s0 + s1 * ( s1 + 2 * b1 ) + c;

					}

				} else {

					if ( s1 <= - extDet ) {

						// region 4

						s0 = Math.max( 0, - ( - a01 * segExtent + b0 ) );
						s1 = ( s0 > 0 ) ? - segExtent : Math.min( Math.max( - segExtent, - b1 ), segExtent );
						sqrDist = - s0 * s0 + s1 * ( s1 + 2 * b1 ) + c;

					} else if ( s1 <= extDet ) {

						// region 3

						s0 = 0;
						s1 = Math.min( Math.max( - segExtent, - b1 ), segExtent );
						sqrDist = s1 * ( s1 + 2 * b1 ) + c;

					} else {

						// region 2

						s0 = Math.max( 0, - ( a01 * segExtent + b0 ) );
						s1 = ( s0 > 0 ) ? segExtent : Math.min( Math.max( - segExtent, - b1 ), segExtent );
						sqrDist = - s0 * s0 + s1 * ( s1 + 2 * b1 ) + c;

					}

				}

			} else {

				// Ray and segment are parallel.

				s1 = ( a01 > 0 ) ? - segExtent : segExtent;
				s0 = Math.max( 0, - ( a01 * s1 + b0 ) );
				sqrDist = - s0 * s0 + s1 * ( s1 + 2 * b1 ) + c;

			}

			if ( optionalPointOnRay ) {

				optionalPointOnRay.copy( this.origin ).addScaledVector( this.direction, s0 );

			}

			if ( optionalPointOnSegment ) {

				optionalPointOnSegment.copy( _segCenter ).addScaledVector( _segDir, s1 );

			}

			return sqrDist;

		}

		intersectSphere( sphere, target ) {

			_vector$a.subVectors( sphere.center, this.origin );
			const tca = _vector$a.dot( this.direction );
			const d2 = _vector$a.dot( _vector$a ) - tca * tca;
			const radius2 = sphere.radius * sphere.radius;

			if ( d2 > radius2 ) return null;

			const thc = Math.sqrt( radius2 - d2 );

			// t0 = first intersect point - entrance on front of sphere
			const t0 = tca - thc;

			// t1 = second intersect point - exit point on back of sphere
			const t1 = tca + thc;

			// test to see if t1 is behind the ray - if so, return null
			if ( t1 < 0 ) return null;

			// test to see if t0 is behind the ray:
			// if it is, the ray is inside the sphere, so return the second exit point scaled by t1,
			// in order to always return an intersect point that is in front of the ray.
			if ( t0 < 0 ) return this.at( t1, target );

			// else t0 is in front of the ray, so return the first collision point scaled by t0
			return this.at( t0, target );

		}

		intersectsSphere( sphere ) {

			return this.distanceSqToPoint( sphere.center ) <= ( sphere.radius * sphere.radius );

		}

		distanceToPlane( plane ) {

			const denominator = plane.normal.dot( this.direction );

			if ( denominator === 0 ) {

				// line is coplanar, return origin
				if ( plane.distanceToPoint( this.origin ) === 0 ) {

					return 0;

				}

				// Null is preferable to undefined since undefined means.... it is undefined

				return null;

			}

			const t = - ( this.origin.dot( plane.normal ) + plane.constant ) / denominator;

			// Return if the ray never intersects the plane

			return t >= 0 ? t : null;

		}

		intersectPlane( plane, target ) {

			const t = this.distanceToPlane( plane );

			if ( t === null ) {

				return null;

			}

			return this.at( t, target );

		}

		intersectsPlane( plane ) {

			// check if the ray lies on the plane first

			const distToPoint = plane.distanceToPoint( this.origin );

			if ( distToPoint === 0 ) {

				return true;

			}

			const denominator = plane.normal.dot( this.direction );

			if ( denominator * distToPoint < 0 ) {

				return true;

			}

			// ray origin is behind the plane (and is pointing behind it)

			return false;

		}

		intersectBox( box, target ) {

			let tmin, tmax, tymin, tymax, tzmin, tzmax;

			const invdirx = 1 / this.direction.x,
				invdiry = 1 / this.direction.y,
				invdirz = 1 / this.direction.z;

			const origin = this.origin;

			if ( invdirx >= 0 ) {

				tmin = ( box.min.x - origin.x ) * invdirx;
				tmax = ( box.max.x - origin.x ) * invdirx;

			} else {

				tmin = ( box.max.x - origin.x ) * invdirx;
				tmax = ( box.min.x - origin.x ) * invdirx;

			}

			if ( invdiry >= 0 ) {

				tymin = ( box.min.y - origin.y ) * invdiry;
				tymax = ( box.max.y - origin.y ) * invdiry;

			} else {

				tymin = ( box.max.y - origin.y ) * invdiry;
				tymax = ( box.min.y - origin.y ) * invdiry;

			}

			if ( ( tmin > tymax ) || ( tymin > tmax ) ) return null;

			if ( tymin > tmin || isNaN( tmin ) ) tmin = tymin;

			if ( tymax < tmax || isNaN( tmax ) ) tmax = tymax;

			if ( invdirz >= 0 ) {

				tzmin = ( box.min.z - origin.z ) * invdirz;
				tzmax = ( box.max.z - origin.z ) * invdirz;

			} else {

				tzmin = ( box.max.z - origin.z ) * invdirz;
				tzmax = ( box.min.z - origin.z ) * invdirz;

			}

			if ( ( tmin > tzmax ) || ( tzmin > tmax ) ) return null;

			if ( tzmin > tmin || tmin !== tmin ) tmin = tzmin;

			if ( tzmax < tmax || tmax !== tmax ) tmax = tzmax;

			//return point closest to the ray (positive side)

			if ( tmax < 0 ) return null;

			return this.at( tmin >= 0 ? tmin : tmax, target );

		}

		intersectsBox( box ) {

			return this.intersectBox( box, _vector$a ) !== null;

		}

		intersectTriangle( a, b, c, backfaceCulling, target ) {

			// Compute the offset origin, edges, and normal.

			// from https://github.com/pmjoniak/GeometricTools/blob/master/GTEngine/Include/Mathematics/GteIntrRay3Triangle3.h

			_edge1.subVectors( b, a );
			_edge2.subVectors( c, a );
			_normal$1.crossVectors( _edge1, _edge2 );

			// Solve Q + t*D = b1*E1 + b2*E2 (Q = kDiff, D = ray direction,
			// E1 = kEdge1, E2 = kEdge2, N = Cross(E1,E2)) by
			//   |Dot(D,N)|*b1 = sign(Dot(D,N))*Dot(D,Cross(Q,E2))
			//   |Dot(D,N)|*b2 = sign(Dot(D,N))*Dot(D,Cross(E1,Q))
			//   |Dot(D,N)|*t = -sign(Dot(D,N))*Dot(Q,N)
			let DdN = this.direction.dot( _normal$1 );
			let sign;

			if ( DdN > 0 ) {

				if ( backfaceCulling ) return null;
				sign = 1;

			} else if ( DdN < 0 ) {

				sign = - 1;
				DdN = - DdN;

			} else {

				return null;

			}

			_diff.subVectors( this.origin, a );
			const DdQxE2 = sign * this.direction.dot( _edge2.crossVectors( _diff, _edge2 ) );

			// b1 < 0, no intersection
			if ( DdQxE2 < 0 ) {

				return null;

			}

			const DdE1xQ = sign * this.direction.dot( _edge1.cross( _diff ) );

			// b2 < 0, no intersection
			if ( DdE1xQ < 0 ) {

				return null;

			}

			// b1+b2 > 1, no intersection
			if ( DdQxE2 + DdE1xQ > DdN ) {

				return null;

			}

			// Line intersects triangle, check if ray does.
			const QdN = - sign * _diff.dot( _normal$1 );

			// t < 0, no intersection
			if ( QdN < 0 ) {

				return null;

			}

			// Ray intersects triangle.
			return this.at( QdN / DdN, target );

		}

		applyMatrix4( matrix4 ) {

			this.origin.applyMatrix4( matrix4 );
			this.direction.transformDirection( matrix4 );

			return this;

		}

		equals( ray ) {

			return ray.origin.equals( this.origin ) && ray.direction.equals( this.direction );

		}

		clone() {

			return new this.constructor().copy( this );

		}

	}

	class Matrix4 {

		constructor( n11, n12, n13, n14, n21, n22, n23, n24, n31, n32, n33, n34, n41, n42, n43, n44 ) {

			Matrix4.prototype.isMatrix4 = true;

			this.elements = [

				1, 0, 0, 0,
				0, 1, 0, 0,
				0, 0, 1, 0,
				0, 0, 0, 1

			];

			if ( n11 !== undefined ) {

				this.set( n11, n12, n13, n14, n21, n22, n23, n24, n31, n32, n33, n34, n41, n42, n43, n44 );

			}

		}

		set( n11, n12, n13, n14, n21, n22, n23, n24, n31, n32, n33, n34, n41, n42, n43, n44 ) {

			const te = this.elements;

			te[ 0 ] = n11; te[ 4 ] = n12; te[ 8 ] = n13; te[ 12 ] = n14;
			te[ 1 ] = n21; te[ 5 ] = n22; te[ 9 ] = n23; te[ 13 ] = n24;
			te[ 2 ] = n31; te[ 6 ] = n32; te[ 10 ] = n33; te[ 14 ] = n34;
			te[ 3 ] = n41; te[ 7 ] = n42; te[ 11 ] = n43; te[ 15 ] = n44;

			return this;

		}

		identity() {

			this.set(

				1, 0, 0, 0,
				0, 1, 0, 0,
				0, 0, 1, 0,
				0, 0, 0, 1

			);

			return this;

		}

		clone() {

			return new Matrix4().fromArray( this.elements );

		}

		copy( m ) {

			const te = this.elements;
			const me = m.elements;

			te[ 0 ] = me[ 0 ]; te[ 1 ] = me[ 1 ]; te[ 2 ] = me[ 2 ]; te[ 3 ] = me[ 3 ];
			te[ 4 ] = me[ 4 ]; te[ 5 ] = me[ 5 ]; te[ 6 ] = me[ 6 ]; te[ 7 ] = me[ 7 ];
			te[ 8 ] = me[ 8 ]; te[ 9 ] = me[ 9 ]; te[ 10 ] = me[ 10 ]; te[ 11 ] = me[ 11 ];
			te[ 12 ] = me[ 12 ]; te[ 13 ] = me[ 13 ]; te[ 14 ] = me[ 14 ]; te[ 15 ] = me[ 15 ];

			return this;

		}

		copyPosition( m ) {

			const te = this.elements, me = m.elements;

			te[ 12 ] = me[ 12 ];
			te[ 13 ] = me[ 13 ];
			te[ 14 ] = me[ 14 ];

			return this;

		}

		setFromMatrix3( m ) {

			const me = m.elements;

			this.set(

				me[ 0 ], me[ 3 ], me[ 6 ], 0,
				me[ 1 ], me[ 4 ], me[ 7 ], 0,
				me[ 2 ], me[ 5 ], me[ 8 ], 0,
				0, 0, 0, 1

			);

			return this;

		}

		extractBasis( xAxis, yAxis, zAxis ) {

			xAxis.setFromMatrixColumn( this, 0 );
			yAxis.setFromMatrixColumn( this, 1 );
			zAxis.setFromMatrixColumn( this, 2 );

			return this;

		}

		makeBasis( xAxis, yAxis, zAxis ) {

			this.set(
				xAxis.x, yAxis.x, zAxis.x, 0,
				xAxis.y, yAxis.y, zAxis.y, 0,
				xAxis.z, yAxis.z, zAxis.z, 0,
				0, 0, 0, 1
			);

			return this;

		}

		extractRotation( m ) {

			// this method does not support reflection matrices

			const te = this.elements;
			const me = m.elements;

			const scaleX = 1 / _v1$5.setFromMatrixColumn( m, 0 ).length();
			const scaleY = 1 / _v1$5.setFromMatrixColumn( m, 1 ).length();
			const scaleZ = 1 / _v1$5.setFromMatrixColumn( m, 2 ).length();

			te[ 0 ] = me[ 0 ] * scaleX;
			te[ 1 ] = me[ 1 ] * scaleX;
			te[ 2 ] = me[ 2 ] * scaleX;
			te[ 3 ] = 0;

			te[ 4 ] = me[ 4 ] * scaleY;
			te[ 5 ] = me[ 5 ] * scaleY;
			te[ 6 ] = me[ 6 ] * scaleY;
			te[ 7 ] = 0;

			te[ 8 ] = me[ 8 ] * scaleZ;
			te[ 9 ] = me[ 9 ] * scaleZ;
			te[ 10 ] = me[ 10 ] * scaleZ;
			te[ 11 ] = 0;

			te[ 12 ] = 0;
			te[ 13 ] = 0;
			te[ 14 ] = 0;
			te[ 15 ] = 1;

			return this;

		}

		makeRotationFromEuler( euler ) {

			const te = this.elements;

			const x = euler.x, y = euler.y, z = euler.z;
			const a = Math.cos( x ), b = Math.sin( x );
			const c = Math.cos( y ), d = Math.sin( y );
			const e = Math.cos( z ), f = Math.sin( z );

			if ( euler.order === 'XYZ' ) {

				const ae = a * e, af = a * f, be = b * e, bf = b * f;

				te[ 0 ] = c * e;
				te[ 4 ] = - c * f;
				te[ 8 ] = d;

				te[ 1 ] = af + be * d;
				te[ 5 ] = ae - bf * d;
				te[ 9 ] = - b * c;

				te[ 2 ] = bf - ae * d;
				te[ 6 ] = be + af * d;
				te[ 10 ] = a * c;

			} else if ( euler.order === 'YXZ' ) {

				const ce = c * e, cf = c * f, de = d * e, df = d * f;

				te[ 0 ] = ce + df * b;
				te[ 4 ] = de * b - cf;
				te[ 8 ] = a * d;

				te[ 1 ] = a * f;
				te[ 5 ] = a * e;
				te[ 9 ] = - b;

				te[ 2 ] = cf * b - de;
				te[ 6 ] = df + ce * b;
				te[ 10 ] = a * c;

			} else if ( euler.order === 'ZXY' ) {

				const ce = c * e, cf = c * f, de = d * e, df = d * f;

				te[ 0 ] = ce - df * b;
				te[ 4 ] = - a * f;
				te[ 8 ] = de + cf * b;

				te[ 1 ] = cf + de * b;
				te[ 5 ] = a * e;
				te[ 9 ] = df - ce * b;

				te[ 2 ] = - a * d;
				te[ 6 ] = b;
				te[ 10 ] = a * c;

			} else if ( euler.order === 'ZYX' ) {

				const ae = a * e, af = a * f, be = b * e, bf = b * f;

				te[ 0 ] = c * e;
				te[ 4 ] = be * d - af;
				te[ 8 ] = ae * d + bf;

				te[ 1 ] = c * f;
				te[ 5 ] = bf * d + ae;
				te[ 9 ] = af * d - be;

				te[ 2 ] = - d;
				te[ 6 ] = b * c;
				te[ 10 ] = a * c;

			} else if ( euler.order === 'YZX' ) {

				const ac = a * c, ad = a * d, bc = b * c, bd = b * d;

				te[ 0 ] = c * e;
				te[ 4 ] = bd - ac * f;
				te[ 8 ] = bc * f + ad;

				te[ 1 ] = f;
				te[ 5 ] = a * e;
				te[ 9 ] = - b * e;

				te[ 2 ] = - d * e;
				te[ 6 ] = ad * f + bc;
				te[ 10 ] = ac - bd * f;

			} else if ( euler.order === 'XZY' ) {

				const ac = a * c, ad = a * d, bc = b * c, bd = b * d;

				te[ 0 ] = c * e;
				te[ 4 ] = - f;
				te[ 8 ] = d * e;

				te[ 1 ] = ac * f + bd;
				te[ 5 ] = a * e;
				te[ 9 ] = ad * f - bc;

				te[ 2 ] = bc * f - ad;
				te[ 6 ] = b * e;
				te[ 10 ] = bd * f + ac;

			}

			// bottom row
			te[ 3 ] = 0;
			te[ 7 ] = 0;
			te[ 11 ] = 0;

			// last column
			te[ 12 ] = 0;
			te[ 13 ] = 0;
			te[ 14 ] = 0;
			te[ 15 ] = 1;

			return this;

		}

		makeRotationFromQuaternion( q ) {

			return this.compose( _zero, q, _one );

		}

		lookAt( eye, target, up ) {

			const te = this.elements;

			_z.subVectors( eye, target );

			if ( _z.lengthSq() === 0 ) {

				// eye and target are in the same position

				_z.z = 1;

			}

			_z.normalize();
			_x.crossVectors( up, _z );

			if ( _x.lengthSq() === 0 ) {

				// up and z are parallel

				if ( Math.abs( up.z ) === 1 ) {

					_z.x += 0.0001;

				} else {

					_z.z += 0.0001;

				}

				_z.normalize();
				_x.crossVectors( up, _z );

			}

			_x.normalize();
			_y.crossVectors( _z, _x );

			te[ 0 ] = _x.x; te[ 4 ] = _y.x; te[ 8 ] = _z.x;
			te[ 1 ] = _x.y; te[ 5 ] = _y.y; te[ 9 ] = _z.y;
			te[ 2 ] = _x.z; te[ 6 ] = _y.z; te[ 10 ] = _z.z;

			return this;

		}

		multiply( m ) {

			return this.multiplyMatrices( this, m );

		}

		premultiply( m ) {

			return this.multiplyMatrices( m, this );

		}

		multiplyMatrices( a, b ) {

			const ae = a.elements;
			const be = b.elements;
			const te = this.elements;

			const a11 = ae[ 0 ], a12 = ae[ 4 ], a13 = ae[ 8 ], a14 = ae[ 12 ];
			const a21 = ae[ 1 ], a22 = ae[ 5 ], a23 = ae[ 9 ], a24 = ae[ 13 ];
			const a31 = ae[ 2 ], a32 = ae[ 6 ], a33 = ae[ 10 ], a34 = ae[ 14 ];
			const a41 = ae[ 3 ], a42 = ae[ 7 ], a43 = ae[ 11 ], a44 = ae[ 15 ];

			const b11 = be[ 0 ], b12 = be[ 4 ], b13 = be[ 8 ], b14 = be[ 12 ];
			const b21 = be[ 1 ], b22 = be[ 5 ], b23 = be[ 9 ], b24 = be[ 13 ];
			const b31 = be[ 2 ], b32 = be[ 6 ], b33 = be[ 10 ], b34 = be[ 14 ];
			const b41 = be[ 3 ], b42 = be[ 7 ], b43 = be[ 11 ], b44 = be[ 15 ];

			te[ 0 ] = a11 * b11 + a12 * b21 + a13 * b31 + a14 * b41;
			te[ 4 ] = a11 * b12 + a12 * b22 + a13 * b32 + a14 * b42;
			te[ 8 ] = a11 * b13 + a12 * b23 + a13 * b33 + a14 * b43;
			te[ 12 ] = a11 * b14 + a12 * b24 + a13 * b34 + a14 * b44;

			te[ 1 ] = a21 * b11 + a22 * b21 + a23 * b31 + a24 * b41;
			te[ 5 ] = a21 * b12 + a22 * b22 + a23 * b32 + a24 * b42;
			te[ 9 ] = a21 * b13 + a22 * b23 + a23 * b33 + a24 * b43;
			te[ 13 ] = a21 * b14 + a22 * b24 + a23 * b34 + a24 * b44;

			te[ 2 ] = a31 * b11 + a32 * b21 + a33 * b31 + a34 * b41;
			te[ 6 ] = a31 * b12 + a32 * b22 + a33 * b32 + a34 * b42;
			te[ 10 ] = a31 * b13 + a32 * b23 + a33 * b33 + a34 * b43;
			te[ 14 ] = a31 * b14 + a32 * b24 + a33 * b34 + a34 * b44;

			te[ 3 ] = a41 * b11 + a42 * b21 + a43 * b31 + a44 * b41;
			te[ 7 ] = a41 * b12 + a42 * b22 + a43 * b32 + a44 * b42;
			te[ 11 ] = a41 * b13 + a42 * b23 + a43 * b33 + a44 * b43;
			te[ 15 ] = a41 * b14 + a42 * b24 + a43 * b34 + a44 * b44;

			return this;

		}

		multiplyScalar( s ) {

			const te = this.elements;

			te[ 0 ] *= s; te[ 4 ] *= s; te[ 8 ] *= s; te[ 12 ] *= s;
			te[ 1 ] *= s; te[ 5 ] *= s; te[ 9 ] *= s; te[ 13 ] *= s;
			te[ 2 ] *= s; te[ 6 ] *= s; te[ 10 ] *= s; te[ 14 ] *= s;
			te[ 3 ] *= s; te[ 7 ] *= s; te[ 11 ] *= s; te[ 15 ] *= s;

			return this;

		}

		determinant() {

			const te = this.elements;

			const n11 = te[ 0 ], n12 = te[ 4 ], n13 = te[ 8 ], n14 = te[ 12 ];
			const n21 = te[ 1 ], n22 = te[ 5 ], n23 = te[ 9 ], n24 = te[ 13 ];
			const n31 = te[ 2 ], n32 = te[ 6 ], n33 = te[ 10 ], n34 = te[ 14 ];
			const n41 = te[ 3 ], n42 = te[ 7 ], n43 = te[ 11 ], n44 = te[ 15 ];

			//TODO: make this more efficient
			//( based on http://www.euclideanspace.com/maths/algebra/matrix/functions/inverse/fourD/index.htm )

			return (
				n41 * (
					+ n14 * n23 * n32
					 - n13 * n24 * n32
					 - n14 * n22 * n33
					 + n12 * n24 * n33
					 + n13 * n22 * n34
					 - n12 * n23 * n34
				) +
				n42 * (
					+ n11 * n23 * n34
					 - n11 * n24 * n33
					 + n14 * n21 * n33
					 - n13 * n21 * n34
					 + n13 * n24 * n31
					 - n14 * n23 * n31
				) +
				n43 * (
					+ n11 * n24 * n32
					 - n11 * n22 * n34
					 - n14 * n21 * n32
					 + n12 * n21 * n34
					 + n14 * n22 * n31
					 - n12 * n24 * n31
				) +
				n44 * (
					- n13 * n22 * n31
					 - n11 * n23 * n32
					 + n11 * n22 * n33
					 + n13 * n21 * n32
					 - n12 * n21 * n33
					 + n12 * n23 * n31
				)

			);

		}

		transpose() {

			const te = this.elements;
			let tmp;

			tmp = te[ 1 ]; te[ 1 ] = te[ 4 ]; te[ 4 ] = tmp;
			tmp = te[ 2 ]; te[ 2 ] = te[ 8 ]; te[ 8 ] = tmp;
			tmp = te[ 6 ]; te[ 6 ] = te[ 9 ]; te[ 9 ] = tmp;

			tmp = te[ 3 ]; te[ 3 ] = te[ 12 ]; te[ 12 ] = tmp;
			tmp = te[ 7 ]; te[ 7 ] = te[ 13 ]; te[ 13 ] = tmp;
			tmp = te[ 11 ]; te[ 11 ] = te[ 14 ]; te[ 14 ] = tmp;

			return this;

		}

		setPosition( x, y, z ) {

			const te = this.elements;

			if ( x.isVector3 ) {

				te[ 12 ] = x.x;
				te[ 13 ] = x.y;
				te[ 14 ] = x.z;

			} else {

				te[ 12 ] = x;
				te[ 13 ] = y;
				te[ 14 ] = z;

			}

			return this;

		}

		invert() {

			// based on http://www.euclideanspace.com/maths/algebra/matrix/functions/inverse/fourD/index.htm
			const te = this.elements,

				n11 = te[ 0 ], n21 = te[ 1 ], n31 = te[ 2 ], n41 = te[ 3 ],
				n12 = te[ 4 ], n22 = te[ 5 ], n32 = te[ 6 ], n42 = te[ 7 ],
				n13 = te[ 8 ], n23 = te[ 9 ], n33 = te[ 10 ], n43 = te[ 11 ],
				n14 = te[ 12 ], n24 = te[ 13 ], n34 = te[ 14 ], n44 = te[ 15 ],

				t11 = n23 * n34 * n42 - n24 * n33 * n42 + n24 * n32 * n43 - n22 * n34 * n43 - n23 * n32 * n44 + n22 * n33 * n44,
				t12 = n14 * n33 * n42 - n13 * n34 * n42 - n14 * n32 * n43 + n12 * n34 * n43 + n13 * n32 * n44 - n12 * n33 * n44,
				t13 = n13 * n24 * n42 - n14 * n23 * n42 + n14 * n22 * n43 - n12 * n24 * n43 - n13 * n22 * n44 + n12 * n23 * n44,
				t14 = n14 * n23 * n32 - n13 * n24 * n32 - n14 * n22 * n33 + n12 * n24 * n33 + n13 * n22 * n34 - n12 * n23 * n34;

			const det = n11 * t11 + n21 * t12 + n31 * t13 + n41 * t14;

			if ( det === 0 ) return this.set( 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 );

			const detInv = 1 / det;

			te[ 0 ] = t11 * detInv;
			te[ 1 ] = ( n24 * n33 * n41 - n23 * n34 * n41 - n24 * n31 * n43 + n21 * n34 * n43 + n23 * n31 * n44 - n21 * n33 * n44 ) * detInv;
			te[ 2 ] = ( n22 * n34 * n41 - n24 * n32 * n41 + n24 * n31 * n42 - n21 * n34 * n42 - n22 * n31 * n44 + n21 * n32 * n44 ) * detInv;
			te[ 3 ] = ( n23 * n32 * n41 - n22 * n33 * n41 - n23 * n31 * n42 + n21 * n33 * n42 + n22 * n31 * n43 - n21 * n32 * n43 ) * detInv;

			te[ 4 ] = t12 * detInv;
			te[ 5 ] = ( n13 * n34 * n41 - n14 * n33 * n41 + n14 * n31 * n43 - n11 * n34 * n43 - n13 * n31 * n44 + n11 * n33 * n44 ) * detInv;
			te[ 6 ] = ( n14 * n32 * n41 - n12 * n34 * n41 - n14 * n31 * n42 + n11 * n34 * n42 + n12 * n31 * n44 - n11 * n32 * n44 ) * detInv;
			te[ 7 ] = ( n12 * n33 * n41 - n13 * n32 * n41 + n13 * n31 * n42 - n11 * n33 * n42 - n12 * n31 * n43 + n11 * n32 * n43 ) * detInv;

			te[ 8 ] = t13 * detInv;
			te[ 9 ] = ( n14 * n23 * n41 - n13 * n24 * n41 - n14 * n21 * n43 + n11 * n24 * n43 + n13 * n21 * n44 - n11 * n23 * n44 ) * detInv;
			te[ 10 ] = ( n12 * n24 * n41 - n14 * n22 * n41 + n14 * n21 * n42 - n11 * n24 * n42 - n12 * n21 * n44 + n11 * n22 * n44 ) * detInv;
			te[ 11 ] = ( n13 * n22 * n41 - n12 * n23 * n41 - n13 * n21 * n42 + n11 * n23 * n42 + n12 * n21 * n43 - n11 * n22 * n43 ) * detInv;

			te[ 12 ] = t14 * detInv;
			te[ 13 ] = ( n13 * n24 * n31 - n14 * n23 * n31 + n14 * n21 * n33 - n11 * n24 * n33 - n13 * n21 * n34 + n11 * n23 * n34 ) * detInv;
			te[ 14 ] = ( n14 * n22 * n31 - n12 * n24 * n31 - n14 * n21 * n32 + n11 * n24 * n32 + n12 * n21 * n34 - n11 * n22 * n34 ) * detInv;
			te[ 15 ] = ( n12 * n23 * n31 - n13 * n22 * n31 + n13 * n21 * n32 - n11 * n23 * n32 - n12 * n21 * n33 + n11 * n22 * n33 ) * detInv;

			return this;

		}

		scale( v ) {

			const te = this.elements;
			const x = v.x, y = v.y, z = v.z;

			te[ 0 ] *= x; te[ 4 ] *= y; te[ 8 ] *= z;
			te[ 1 ] *= x; te[ 5 ] *= y; te[ 9 ] *= z;
			te[ 2 ] *= x; te[ 6 ] *= y; te[ 10 ] *= z;
			te[ 3 ] *= x; te[ 7 ] *= y; te[ 11 ] *= z;

			return this;

		}

		getMaxScaleOnAxis() {

			const te = this.elements;

			const scaleXSq = te[ 0 ] * te[ 0 ] + te[ 1 ] * te[ 1 ] + te[ 2 ] * te[ 2 ];
			const scaleYSq = te[ 4 ] * te[ 4 ] + te[ 5 ] * te[ 5 ] + te[ 6 ] * te[ 6 ];
			const scaleZSq = te[ 8 ] * te[ 8 ] + te[ 9 ] * te[ 9 ] + te[ 10 ] * te[ 10 ];

			return Math.sqrt( Math.max( scaleXSq, scaleYSq, scaleZSq ) );

		}

		makeTranslation( x, y, z ) {

			if ( x.isVector3 ) {

				this.set(

					1, 0, 0, x.x,
					0, 1, 0, x.y,
					0, 0, 1, x.z,
					0, 0, 0, 1

				);

			} else {

				this.set(

					1, 0, 0, x,
					0, 1, 0, y,
					0, 0, 1, z,
					0, 0, 0, 1

				);

			}

			return this;

		}

		makeRotationX( theta ) {

			const c = Math.cos( theta ), s = Math.sin( theta );

			this.set(

				1, 0, 0, 0,
				0, c, - s, 0,
				0, s, c, 0,
				0, 0, 0, 1

			);

			return this;

		}

		makeRotationY( theta ) {

			const c = Math.cos( theta ), s = Math.sin( theta );

			this.set(

				 c, 0, s, 0,
				 0, 1, 0, 0,
				- s, 0, c, 0,
				 0, 0, 0, 1

			);

			return this;

		}

		makeRotationZ( theta ) {

			const c = Math.cos( theta ), s = Math.sin( theta );

			this.set(

				c, - s, 0, 0,
				s, c, 0, 0,
				0, 0, 1, 0,
				0, 0, 0, 1

			);

			return this;

		}

		makeRotationAxis( axis, angle ) {

			// Based on http://www.gamedev.net/reference/articles/article1199.asp

			const c = Math.cos( angle );
			const s = Math.sin( angle );
			const t = 1 - c;
			const x = axis.x, y = axis.y, z = axis.z;
			const tx = t * x, ty = t * y;

			this.set(

				tx * x + c, tx * y - s * z, tx * z + s * y, 0,
				tx * y + s * z, ty * y + c, ty * z - s * x, 0,
				tx * z - s * y, ty * z + s * x, t * z * z + c, 0,
				0, 0, 0, 1

			);

			return this;

		}

		makeScale( x, y, z ) {

			this.set(

				x, 0, 0, 0,
				0, y, 0, 0,
				0, 0, z, 0,
				0, 0, 0, 1

			);

			return this;

		}

		makeShear( xy, xz, yx, yz, zx, zy ) {

			this.set(

				1, yx, zx, 0,
				xy, 1, zy, 0,
				xz, yz, 1, 0,
				0, 0, 0, 1

			);

			return this;

		}

		compose( position, quaternion, scale ) {

			const te = this.elements;

			const x = quaternion._x, y = quaternion._y, z = quaternion._z, w = quaternion._w;
			const x2 = x + x,	y2 = y + y, z2 = z + z;
			const xx = x * x2, xy = x * y2, xz = x * z2;
			const yy = y * y2, yz = y * z2, zz = z * z2;
			const wx = w * x2, wy = w * y2, wz = w * z2;

			const sx = scale.x, sy = scale.y, sz = scale.z;

			te[ 0 ] = ( 1 - ( yy + zz ) ) * sx;
			te[ 1 ] = ( xy + wz ) * sx;
			te[ 2 ] = ( xz - wy ) * sx;
			te[ 3 ] = 0;

			te[ 4 ] = ( xy - wz ) * sy;
			te[ 5 ] = ( 1 - ( xx + zz ) ) * sy;
			te[ 6 ] = ( yz + wx ) * sy;
			te[ 7 ] = 0;

			te[ 8 ] = ( xz + wy ) * sz;
			te[ 9 ] = ( yz - wx ) * sz;
			te[ 10 ] = ( 1 - ( xx + yy ) ) * sz;
			te[ 11 ] = 0;

			te[ 12 ] = position.x;
			te[ 13 ] = position.y;
			te[ 14 ] = position.z;
			te[ 15 ] = 1;

			return this;

		}

		decompose( position, quaternion, scale ) {

			const te = this.elements;

			let sx = _v1$5.set( te[ 0 ], te[ 1 ], te[ 2 ] ).length();
			const sy = _v1$5.set( te[ 4 ], te[ 5 ], te[ 6 ] ).length();
			const sz = _v1$5.set( te[ 8 ], te[ 9 ], te[ 10 ] ).length();

			// if determine is negative, we need to invert one scale
			const det = this.determinant();
			if ( det < 0 ) sx = - sx;

			position.x = te[ 12 ];
			position.y = te[ 13 ];
			position.z = te[ 14 ];

			// scale the rotation part
			_m1$2.copy( this );

			const invSX = 1 / sx;
			const invSY = 1 / sy;
			const invSZ = 1 / sz;

			_m1$2.elements[ 0 ] *= invSX;
			_m1$2.elements[ 1 ] *= invSX;
			_m1$2.elements[ 2 ] *= invSX;

			_m1$2.elements[ 4 ] *= invSY;
			_m1$2.elements[ 5 ] *= invSY;
			_m1$2.elements[ 6 ] *= invSY;

			_m1$2.elements[ 8 ] *= invSZ;
			_m1$2.elements[ 9 ] *= invSZ;
			_m1$2.elements[ 10 ] *= invSZ;

			quaternion.setFromRotationMatrix( _m1$2 );

			scale.x = sx;
			scale.y = sy;
			scale.z = sz;

			return this;

		}

		makePerspective( left, right, top, bottom, near, far, coordinateSystem = WebGLCoordinateSystem ) {

			const te = this.elements;
			const x = 2 * near / ( right - left );
			const y = 2 * near / ( top - bottom );

			const a = ( right + left ) / ( right - left );
			const b = ( top + bottom ) / ( top - bottom );

			let c, d;

			if ( coordinateSystem === WebGLCoordinateSystem ) {

				c = - ( far + near ) / ( far - near );
				d = ( - 2 * far * near ) / ( far - near );

			} else if ( coordinateSystem === WebGPUCoordinateSystem ) {

				c = - far / ( far - near );
				d = ( - far * near ) / ( far - near );

			} else {

				throw new Error( 'THREE.Matrix4.makePerspective(): Invalid coordinate system: ' + coordinateSystem );

			}

			te[ 0 ] = x;	te[ 4 ] = 0;	te[ 8 ] = a; 	te[ 12 ] = 0;
			te[ 1 ] = 0;	te[ 5 ] = y;	te[ 9 ] = b; 	te[ 13 ] = 0;
			te[ 2 ] = 0;	te[ 6 ] = 0;	te[ 10 ] = c; 	te[ 14 ] = d;
			te[ 3 ] = 0;	te[ 7 ] = 0;	te[ 11 ] = - 1;	te[ 15 ] = 0;

			return this;

		}

		makeOrthographic( left, right, top, bottom, near, far, coordinateSystem = WebGLCoordinateSystem ) {

			const te = this.elements;
			const w = 1.0 / ( right - left );
			const h = 1.0 / ( top - bottom );
			const p = 1.0 / ( far - near );

			const x = ( right + left ) * w;
			const y = ( top + bottom ) * h;

			let z, zInv;

			if ( coordinateSystem === WebGLCoordinateSystem ) {

				z = ( far + near ) * p;
				zInv = - 2 * p;

			} else if ( coordinateSystem === WebGPUCoordinateSystem ) {

				z = near * p;
				zInv = - 1 * p;

			} else {

				throw new Error( 'THREE.Matrix4.makeOrthographic(): Invalid coordinate system: ' + coordinateSystem );

			}

			te[ 0 ] = 2 * w;	te[ 4 ] = 0;		te[ 8 ] = 0; 		te[ 12 ] = - x;
			te[ 1 ] = 0; 		te[ 5 ] = 2 * h;	te[ 9 ] = 0; 		te[ 13 ] = - y;
			te[ 2 ] = 0; 		te[ 6 ] = 0;		te[ 10 ] = zInv;	te[ 14 ] = - z;
			te[ 3 ] = 0; 		te[ 7 ] = 0;		te[ 11 ] = 0;		te[ 15 ] = 1;

			return this;

		}

		equals( matrix ) {

			const te = this.elements;
			const me = matrix.elements;

			for ( let i = 0; i < 16; i ++ ) {

				if ( te[ i ] !== me[ i ] ) return false;

			}

			return true;

		}

		fromArray( array, offset = 0 ) {

			for ( let i = 0; i < 16; i ++ ) {

				this.elements[ i ] = array[ i + offset ];

			}

			return this;

		}

		toArray( array = [], offset = 0 ) {

			const te = this.elements;

			array[ offset ] = te[ 0 ];
			array[ offset + 1 ] = te[ 1 ];
			array[ offset + 2 ] = te[ 2 ];
			array[ offset + 3 ] = te[ 3 ];

			array[ offset + 4 ] = te[ 4 ];
			array[ offset + 5 ] = te[ 5 ];
			array[ offset + 6 ] = te[ 6 ];
			array[ offset + 7 ] = te[ 7 ];

			array[ offset + 8 ] = te[ 8 ];
			array[ offset + 9 ] = te[ 9 ];
			array[ offset + 10 ] = te[ 10 ];
			array[ offset + 11 ] = te[ 11 ];

			array[ offset + 12 ] = te[ 12 ];
			array[ offset + 13 ] = te[ 13 ];
			array[ offset + 14 ] = te[ 14 ];
			array[ offset + 15 ] = te[ 15 ];

			return array;

		}

	}

	const _v1$5 = /*@__PURE__*/ new Vector3();
	const _m1$2 = /*@__PURE__*/ new Matrix4();
	const _zero = /*@__PURE__*/ new Vector3( 0, 0, 0 );
	const _one = /*@__PURE__*/ new Vector3( 1, 1, 1 );
	const _x = /*@__PURE__*/ new Vector3();
	const _y = /*@__PURE__*/ new Vector3();
	const _z = /*@__PURE__*/ new Vector3();

	const _matrix$1 = /*@__PURE__*/ new Matrix4();
	const _quaternion$3 = /*@__PURE__*/ new Quaternion();

	class Euler {

		constructor( x = 0, y = 0, z = 0, order = Euler.DEFAULT_ORDER ) {

			this.isEuler = true;

			this._x = x;
			this._y = y;
			this._z = z;
			this._order = order;

		}

		get x() {

			return this._x;

		}

		set x( value ) {

			this._x = value;
			this._onChangeCallback();

		}

		get y() {

			return this._y;

		}

		set y( value ) {

			this._y = value;
			this._onChangeCallback();

		}

		get z() {

			return this._z;

		}

		set z( value ) {

			this._z = value;
			this._onChangeCallback();

		}

		get order() {

			return this._order;

		}

		set order( value ) {

			this._order = value;
			this._onChangeCallback();

		}

		set( x, y, z, order = this._order ) {

			this._x = x;
			this._y = y;
			this._z = z;
			this._order = order;

			this._onChangeCallback();

			return this;

		}

		clone() {

			return new this.constructor( this._x, this._y, this._z, this._order );

		}

		copy( euler ) {

			this._x = euler._x;
			this._y = euler._y;
			this._z = euler._z;
			this._order = euler._order;

			this._onChangeCallback();

			return this;

		}

		setFromRotationMatrix( m, order = this._order, update = true ) {

			// assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)

			const te = m.elements;
			const m11 = te[ 0 ], m12 = te[ 4 ], m13 = te[ 8 ];
			const m21 = te[ 1 ], m22 = te[ 5 ], m23 = te[ 9 ];
			const m31 = te[ 2 ], m32 = te[ 6 ], m33 = te[ 10 ];

			switch ( order ) {

				case 'XYZ':

					this._y = Math.asin( clamp( m13, - 1, 1 ) );

					if ( Math.abs( m13 ) < 0.9999999 ) {

						this._x = Math.atan2( - m23, m33 );
						this._z = Math.atan2( - m12, m11 );

					} else {

						this._x = Math.atan2( m32, m22 );
						this._z = 0;

					}

					break;

				case 'YXZ':

					this._x = Math.asin( - clamp( m23, - 1, 1 ) );

					if ( Math.abs( m23 ) < 0.9999999 ) {

						this._y = Math.atan2( m13, m33 );
						this._z = Math.atan2( m21, m22 );

					} else {

						this._y = Math.atan2( - m31, m11 );
						this._z = 0;

					}

					break;

				case 'ZXY':

					this._x = Math.asin( clamp( m32, - 1, 1 ) );

					if ( Math.abs( m32 ) < 0.9999999 ) {

						this._y = Math.atan2( - m31, m33 );
						this._z = Math.atan2( - m12, m22 );

					} else {

						this._y = 0;
						this._z = Math.atan2( m21, m11 );

					}

					break;

				case 'ZYX':

					this._y = Math.asin( - clamp( m31, - 1, 1 ) );

					if ( Math.abs( m31 ) < 0.9999999 ) {

						this._x = Math.atan2( m32, m33 );
						this._z = Math.atan2( m21, m11 );

					} else {

						this._x = 0;
						this._z = Math.atan2( - m12, m22 );

					}

					break;

				case 'YZX':

					this._z = Math.asin( clamp( m21, - 1, 1 ) );

					if ( Math.abs( m21 ) < 0.9999999 ) {

						this._x = Math.atan2( - m23, m22 );
						this._y = Math.atan2( - m31, m11 );

					} else {

						this._x = 0;
						this._y = Math.atan2( m13, m33 );

					}

					break;

				case 'XZY':

					this._z = Math.asin( - clamp( m12, - 1, 1 ) );

					if ( Math.abs( m12 ) < 0.9999999 ) {

						this._x = Math.atan2( m32, m22 );
						this._y = Math.atan2( m13, m11 );

					} else {

						this._x = Math.atan2( - m23, m33 );
						this._y = 0;

					}

					break;

				default:

					console.warn( 'THREE.Euler: .setFromRotationMatrix() encountered an unknown order: ' + order );

			}

			this._order = order;

			if ( update === true ) this._onChangeCallback();

			return this;

		}

		setFromQuaternion( q, order, update ) {

			_matrix$1.makeRotationFromQuaternion( q );

			return this.setFromRotationMatrix( _matrix$1, order, update );

		}

		setFromVector3( v, order = this._order ) {

			return this.set( v.x, v.y, v.z, order );

		}

		reorder( newOrder ) {

			// WARNING: this discards revolution information -bhouston

			_quaternion$3.setFromEuler( this );

			return this.setFromQuaternion( _quaternion$3, newOrder );

		}

		equals( euler ) {

			return ( euler._x === this._x ) && ( euler._y === this._y ) && ( euler._z === this._z ) && ( euler._order === this._order );

		}

		fromArray( array ) {

			this._x = array[ 0 ];
			this._y = array[ 1 ];
			this._z = array[ 2 ];
			if ( array[ 3 ] !== undefined ) this._order = array[ 3 ];

			this._onChangeCallback();

			return this;

		}

		toArray( array = [], offset = 0 ) {

			array[ offset ] = this._x;
			array[ offset + 1 ] = this._y;
			array[ offset + 2 ] = this._z;
			array[ offset + 3 ] = this._order;

			return array;

		}

		_onChange( callback ) {

			this._onChangeCallback = callback;

			return this;

		}

		_onChangeCallback() {}

		*[ Symbol.iterator ]() {

			yield this._x;
			yield this._y;
			yield this._z;
			yield this._order;

		}

	}

	Euler.DEFAULT_ORDER = 'XYZ';

	class Layers {

		constructor() {

			this.mask = 1 | 0;

		}

		set( channel ) {

			this.mask = ( 1 << channel | 0 ) >>> 0;

		}

		enable( channel ) {

			this.mask |= 1 << channel | 0;

		}

		enableAll() {

			this.mask = 0xffffffff | 0;

		}

		toggle( channel ) {

			this.mask ^= 1 << channel | 0;

		}

		disable( channel ) {

			this.mask &= ~ ( 1 << channel | 0 );

		}

		disableAll() {

			this.mask = 0;

		}

		test( layers ) {

			return ( this.mask & layers.mask ) !== 0;

		}

		isEnabled( channel ) {

			return ( this.mask & ( 1 << channel | 0 ) ) !== 0;

		}

	}

	let _object3DId = 0;

	const _v1$4 = /*@__PURE__*/ new Vector3();
	const _q1 = /*@__PURE__*/ new Quaternion();
	const _m1$1 = /*@__PURE__*/ new Matrix4();
	const _target = /*@__PURE__*/ new Vector3();

	const _position$3 = /*@__PURE__*/ new Vector3();
	const _scale$2 = /*@__PURE__*/ new Vector3();
	const _quaternion$2 = /*@__PURE__*/ new Quaternion();

	const _xAxis = /*@__PURE__*/ new Vector3( 1, 0, 0 );
	const _yAxis = /*@__PURE__*/ new Vector3( 0, 1, 0 );
	const _zAxis = /*@__PURE__*/ new Vector3( 0, 0, 1 );

	const _addedEvent = { type: 'added' };
	const _removedEvent = { type: 'removed' };

	class Object3D extends EventDispatcher {

		constructor() {

			super();

			this.isObject3D = true;

			Object.defineProperty( this, 'id', { value: _object3DId ++ } );

			this.uuid = generateUUID();

			this.name = '';
			this.type = 'Object3D';

			this.parent = null;
			this.children = [];

			this.up = Object3D.DEFAULT_UP.clone();

			const position = new Vector3();
			const rotation = new Euler();
			const quaternion = new Quaternion();
			const scale = new Vector3( 1, 1, 1 );

			function onRotationChange() {

				quaternion.setFromEuler( rotation, false );

			}

			function onQuaternionChange() {

				rotation.setFromQuaternion( quaternion, undefined, false );

			}

			rotation._onChange( onRotationChange );
			quaternion._onChange( onQuaternionChange );

			Object.defineProperties( this, {
				position: {
					configurable: true,
					enumerable: true,
					value: position
				},
				rotation: {
					configurable: true,
					enumerable: true,
					value: rotation
				},
				quaternion: {
					configurable: true,
					enumerable: true,
					value: quaternion
				},
				scale: {
					configurable: true,
					enumerable: true,
					value: scale
				},
				modelViewMatrix: {
					value: new Matrix4()
				},
				normalMatrix: {
					value: new Matrix3()
				}
			} );

			this.matrix = new Matrix4();
			this.matrixWorld = new Matrix4();

			this.matrixAutoUpdate = Object3D.DEFAULT_MATRIX_AUTO_UPDATE;

			this.matrixWorldAutoUpdate = Object3D.DEFAULT_MATRIX_WORLD_AUTO_UPDATE; // checked by the renderer
			this.matrixWorldNeedsUpdate = false;

			this.layers = new Layers();
			this.visible = true;

			this.castShadow = false;
			this.receiveShadow = false;

			this.frustumCulled = true;
			this.renderOrder = 0;

			this.animations = [];

			this.userData = {};

		}

		onBeforeShadow( /* renderer, object, camera, shadowCamera, geometry, depthMaterial, group */ ) {}

		onAfterShadow( /* renderer, object, camera, shadowCamera, geometry, depthMaterial, group */ ) {}

		onBeforeRender( /* renderer, scene, camera, geometry, material, group */ ) {}

		onAfterRender( /* renderer, scene, camera, geometry, material, group */ ) {}

		applyMatrix4( matrix ) {

			if ( this.matrixAutoUpdate ) this.updateMatrix();

			this.matrix.premultiply( matrix );

			this.matrix.decompose( this.position, this.quaternion, this.scale );

		}

		applyQuaternion( q ) {

			this.quaternion.premultiply( q );

			return this;

		}

		setRotationFromAxisAngle( axis, angle ) {

			// assumes axis is normalized

			this.quaternion.setFromAxisAngle( axis, angle );

		}

		setRotationFromEuler( euler ) {

			this.quaternion.setFromEuler( euler, true );

		}

		setRotationFromMatrix( m ) {

			// assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)

			this.quaternion.setFromRotationMatrix( m );

		}

		setRotationFromQuaternion( q ) {

			// assumes q is normalized

			this.quaternion.copy( q );

		}

		rotateOnAxis( axis, angle ) {

			// rotate object on axis in object space
			// axis is assumed to be normalized

			_q1.setFromAxisAngle( axis, angle );

			this.quaternion.multiply( _q1 );

			return this;

		}

		rotateOnWorldAxis( axis, angle ) {

			// rotate object on axis in world space
			// axis is assumed to be normalized
			// method assumes no rotated parent

			_q1.setFromAxisAngle( axis, angle );

			this.quaternion.premultiply( _q1 );

			return this;

		}

		rotateX( angle ) {

			return this.rotateOnAxis( _xAxis, angle );

		}

		rotateY( angle ) {

			return this.rotateOnAxis( _yAxis, angle );

		}

		rotateZ( angle ) {

			return this.rotateOnAxis( _zAxis, angle );

		}

		translateOnAxis( axis, distance ) {

			// translate object by distance along axis in object space
			// axis is assumed to be normalized

			_v1$4.copy( axis ).applyQuaternion( this.quaternion );

			this.position.add( _v1$4.multiplyScalar( distance ) );

			return this;

		}

		translateX( distance ) {

			return this.translateOnAxis( _xAxis, distance );

		}

		translateY( distance ) {

			return this.translateOnAxis( _yAxis, distance );

		}

		translateZ( distance ) {

			return this.translateOnAxis( _zAxis, distance );

		}

		localToWorld( vector ) {

			this.updateWorldMatrix( true, false );

			return vector.applyMatrix4( this.matrixWorld );

		}

		worldToLocal( vector ) {

			this.updateWorldMatrix( true, false );

			return vector.applyMatrix4( _m1$1.copy( this.matrixWorld ).invert() );

		}

		lookAt( x, y, z ) {

			// This method does not support objects having non-uniformly-scaled parent(s)

			if ( x.isVector3 ) {

				_target.copy( x );

			} else {

				_target.set( x, y, z );

			}

			const parent = this.parent;

			this.updateWorldMatrix( true, false );

			_position$3.setFromMatrixPosition( this.matrixWorld );

			if ( this.isCamera || this.isLight ) {

				_m1$1.lookAt( _position$3, _target, this.up );

			} else {

				_m1$1.lookAt( _target, _position$3, this.up );

			}

			this.quaternion.setFromRotationMatrix( _m1$1 );

			if ( parent ) {

				_m1$1.extractRotation( parent.matrixWorld );
				_q1.setFromRotationMatrix( _m1$1 );
				this.quaternion.premultiply( _q1.invert() );

			}

		}

		add( object ) {

			if ( arguments.length > 1 ) {

				for ( let i = 0; i < arguments.length; i ++ ) {

					this.add( arguments[ i ] );

				}

				return this;

			}

			if ( object === this ) {

				console.error( 'THREE.Object3D.add: object can\\'t be added as a child of itself.', object );
				return this;

			}

			if ( object && object.isObject3D ) {

				if ( object.parent !== null ) {

					object.parent.remove( object );

				}

				object.parent = this;
				this.children.push( object );

				object.dispatchEvent( _addedEvent );

			} else {

				console.error( 'THREE.Object3D.add: object not an instance of THREE.Object3D.', object );

			}

			return this;

		}

		remove( object ) {

			if ( arguments.length > 1 ) {

				for ( let i = 0; i < arguments.length; i ++ ) {

					this.remove( arguments[ i ] );

				}

				return this;

			}

			const index = this.children.indexOf( object );

			if ( index !== - 1 ) {

				object.parent = null;
				this.children.splice( index, 1 );

				object.dispatchEvent( _removedEvent );

			}

			return this;

		}

		removeFromParent() {

			const parent = this.parent;

			if ( parent !== null ) {

				parent.remove( this );

			}

			return this;

		}

		clear() {

			return this.remove( ... this.children );

		}

		attach( object ) {

			// adds object as a child of this, while maintaining the object's world transform

			// Note: This method does not support scene graphs having non-uniformly-scaled nodes(s)

			this.updateWorldMatrix( true, false );

			_m1$1.copy( this.matrixWorld ).invert();

			if ( object.parent !== null ) {

				object.parent.updateWorldMatrix( true, false );

				_m1$1.multiply( object.parent.matrixWorld );

			}

			object.applyMatrix4( _m1$1 );

			this.add( object );

			object.updateWorldMatrix( false, true );

			return this;

		}

		getObjectById( id ) {

			return this.getObjectByProperty( 'id', id );

		}

		getObjectByName( name ) {

			return this.getObjectByProperty( 'name', name );

		}

		getObjectByProperty( name, value ) {

			if ( this[ name ] === value ) return this;

			for ( let i = 0, l = this.children.length; i < l; i ++ ) {

				const child = this.children[ i ];
				const object = child.getObjectByProperty( name, value );

				if ( object !== undefined ) {

					return object;

				}

			}

			return undefined;

		}

		getObjectsByProperty( name, value, result = [] ) {

			if ( this[ name ] === value ) result.push( this );

			const children = this.children;

			for ( let i = 0, l = children.length; i < l; i ++ ) {

				children[ i ].getObjectsByProperty( name, value, result );

			}

			return result;

		}

		getWorldPosition( target ) {

			this.updateWorldMatrix( true, false );

			return target.setFromMatrixPosition( this.matrixWorld );

		}

		getWorldQuaternion( target ) {

			this.updateWorldMatrix( true, false );

			this.matrixWorld.decompose( _position$3, target, _scale$2 );

			return target;

		}

		getWorldScale( target ) {

			this.updateWorldMatrix( true, false );

			this.matrixWorld.decompose( _position$3, _quaternion$2, target );

			return target;

		}

		getWorldDirection( target ) {

			this.updateWorldMatrix( true, false );

			const e = this.matrixWorld.elements;

			return target.set( e[ 8 ], e[ 9 ], e[ 10 ] ).normalize();

		}

		raycast( /* raycaster, intersects */ ) {}

		traverse( callback ) {

			callback( this );

			const children = this.children;

			for ( let i = 0, l = children.length; i < l; i ++ ) {

				children[ i ].traverse( callback );

			}

		}

		traverseVisible( callback ) {

			if ( this.visible === false ) return;

			callback( this );

			const children = this.children;

			for ( let i = 0, l = children.length; i < l; i ++ ) {

				children[ i ].traverseVisible( callback );

			}

		}

		traverseAncestors( callback ) {

			const parent = this.parent;

			if ( parent !== null ) {

				callback( parent );

				parent.traverseAncestors( callback );

			}

		}

		updateMatrix() {

			this.matrix.compose( this.position, this.quaternion, this.scale );

			this.matrixWorldNeedsUpdate = true;

		}

		updateMatrixWorld( force ) {

			if ( this.matrixAutoUpdate ) this.updateMatrix();

			if ( this.matrixWorldNeedsUpdate || force ) {

				if ( this.parent === null ) {

					this.matrixWorld.copy( this.matrix );

				} else {

					this.matrixWorld.multiplyMatrices( this.parent.matrixWorld, this.matrix );

				}

				this.matrixWorldNeedsUpdate = false;

				force = true;

			}

			// update children

			const children = this.children;

			for ( let i = 0, l = children.length; i < l; i ++ ) {

				const child = children[ i ];

				if ( child.matrixWorldAutoUpdate === true || force === true ) {

					child.updateMatrixWorld( force );

				}

			}

		}

		updateWorldMatrix( updateParents, updateChildren ) {

			const parent = this.parent;

			if ( updateParents === true && parent !== null && parent.matrixWorldAutoUpdate === true ) {

				parent.updateWorldMatrix( true, false );

			}

			if ( this.matrixAutoUpdate ) this.updateMatrix();

			if ( this.parent === null ) {

				this.matrixWorld.copy( this.matrix );

			} else {

				this.matrixWorld.multiplyMatrices( this.parent.matrixWorld, this.matrix );

			}

			// update children

			if ( updateChildren === true ) {

				const children = this.children;

				for ( let i = 0, l = children.length; i < l; i ++ ) {

					const child = children[ i ];

					if ( child.matrixWorldAutoUpdate === true ) {

						child.updateWorldMatrix( false, true );

					}

				}

			}

		}

		toJSON( meta ) {

			// meta is a string when called from JSON.stringify
			const isRootObject = ( meta === undefined || typeof meta === 'string' );

			const output = {};

			// meta is a hash used to collect geometries, materials.
			// not providing it implies that this is the root object
			// being serialized.
			if ( isRootObject ) {

				// initialize meta obj
				meta = {
					geometries: {},
					materials: {},
					textures: {},
					images: {},
					shapes: {},
					skeletons: {},
					animations: {},
					nodes: {}
				};

				output.metadata = {
					version: 4.6,
					type: 'Object',
					generator: 'Object3D.toJSON'
				};

			}

			// standard Object3D serialization

			const object = {};

			object.uuid = this.uuid;
			object.type = this.type;

			if ( this.name !== '' ) object.name = this.name;
			if ( this.castShadow === true ) object.castShadow = true;
			if ( this.receiveShadow === true ) object.receiveShadow = true;
			if ( this.visible === false ) object.visible = false;
			if ( this.frustumCulled === false ) object.frustumCulled = false;
			if ( this.renderOrder !== 0 ) object.renderOrder = this.renderOrder;
			if ( Object.keys( this.userData ).length > 0 ) object.userData = this.userData;

			object.layers = this.layers.mask;
			object.matrix = this.matrix.toArray();
			object.up = this.up.toArray();

			if ( this.matrixAutoUpdate === false ) object.matrixAutoUpdate = false;

			// object specific properties

			if ( this.isInstancedMesh ) {

				object.type = 'InstancedMesh';
				object.count = this.count;
				object.instanceMatrix = this.instanceMatrix.toJSON();
				if ( this.instanceColor !== null ) object.instanceColor = this.instanceColor.toJSON();

			}

			if ( this.isBatchedMesh ) {

				object.type = 'BatchedMesh';
				object.perObjectFrustumCulled = this.perObjectFrustumCulled;
				object.sortObjects = this.sortObjects;

				object.drawRanges = this._drawRanges;
				object.reservedRanges = this._reservedRanges;

				object.visibility = this._visibility;
				object.active = this._active;
				object.bounds = this._bounds.map( bound => ( {
					boxInitialized: bound.boxInitialized,
					boxMin: bound.box.min.toArray(),
					boxMax: bound.box.max.toArray(),

					sphereInitialized: bound.sphereInitialized,
					sphereRadius: bound.sphere.radius,
					sphereCenter: bound.sphere.center.toArray()
				} ) );

				object.maxGeometryCount = this._maxGeometryCount;
				object.maxVertexCount = this._maxVertexCount;
				object.maxIndexCount = this._maxIndexCount;

				object.geometryInitialized = this._geometryInitialized;
				object.geometryCount = this._geometryCount;

				object.matricesTexture = this._matricesTexture.toJSON( meta );

				if ( this.boundingSphere !== null ) {

					object.boundingSphere = {
						center: object.boundingSphere.center.toArray(),
						radius: object.boundingSphere.radius
					};

				}

				if ( this.boundingBox !== null ) {

					object.boundingBox = {
						min: object.boundingBox.min.toArray(),
						max: object.boundingBox.max.toArray()
					};

				}

			}

			//

			function serialize( library, element ) {

				if ( library[ element.uuid ] === undefined ) {

					library[ element.uuid ] = element.toJSON( meta );

				}

				return element.uuid;

			}

			if ( this.isScene ) {

				if ( this.background ) {

					if ( this.background.isColor ) {

						object.background = this.background.toJSON();

					} else if ( this.background.isTexture ) {

						object.background = this.background.toJSON( meta ).uuid;

					}

				}

				if ( this.environment && this.environment.isTexture && this.environment.isRenderTargetTexture !== true ) {

					object.environment = this.environment.toJSON( meta ).uuid;

				}

			} else if ( this.isMesh || this.isLine || this.isPoints ) {

				object.geometry = serialize( meta.geometries, this.geometry );

				const parameters = this.geometry.parameters;

				if ( parameters !== undefined && parameters.shapes !== undefined ) {

					const shapes = parameters.shapes;

					if ( Array.isArray( shapes ) ) {

						for ( let i = 0, l = shapes.length; i < l; i ++ ) {

							const shape = shapes[ i ];

							serialize( meta.shapes, shape );

						}

					} else {

						serialize( meta.shapes, shapes );

					}

				}

			}

			if ( this.isSkinnedMesh ) {

				object.bindMode = this.bindMode;
				object.bindMatrix = this.bindMatrix.toArray();

				if ( this.skeleton !== undefined ) {

					serialize( meta.skeletons, this.skeleton );

					object.skeleton = this.skeleton.uuid;

				}

			}

			if ( this.material !== undefined ) {

				if ( Array.isArray( this.material ) ) {

					const uuids = [];

					for ( let i = 0, l = this.material.length; i < l; i ++ ) {

						uuids.push( serialize( meta.materials, this.material[ i ] ) );

					}

					object.material = uuids;

				} else {

					object.material = serialize( meta.materials, this.material );

				}

			}

			//

			if ( this.children.length > 0 ) {

				object.children = [];

				for ( let i = 0; i < this.children.length; i ++ ) {

					object.children.push( this.children[ i ].toJSON( meta ).object );

				}

			}

			//

			if ( this.animations.length > 0 ) {

				object.animations = [];

				for ( let i = 0; i < this.animations.length; i ++ ) {

					const animation = this.animations[ i ];

					object.animations.push( serialize( meta.animations, animation ) );

				}

			}

			if ( isRootObject ) {

				const geometries = extractFromCache( meta.geometries );
				const materials = extractFromCache( meta.materials );
				const textures = extractFromCache( meta.textures );
				const images = extractFromCache( meta.images );
				const shapes = extractFromCache( meta.shapes );
				const skeletons = extractFromCache( meta.skeletons );
				const animations = extractFromCache( meta.animations );
				const nodes = extractFromCache( meta.nodes );

				if ( geometries.length > 0 ) output.geometries = geometries;
				if ( materials.length > 0 ) output.materials = materials;
				if ( textures.length > 0 ) output.textures = textures;
				if ( images.length > 0 ) output.images = images;
				if ( shapes.length > 0 ) output.shapes = shapes;
				if ( skeletons.length > 0 ) output.skeletons = skeletons;
				if ( animations.length > 0 ) output.animations = animations;
				if ( nodes.length > 0 ) output.nodes = nodes;

			}

			output.object = object;

			return output;

			// extract data from the cache hash
			// remove metadata on each item
			// and return as array
			function extractFromCache( cache ) {

				const values = [];
				for ( const key in cache ) {

					const data = cache[ key ];
					delete data.metadata;
					values.push( data );

				}

				return values;

			}

		}

		clone( recursive ) {

			return new this.constructor().copy( this, recursive );

		}

		copy( source, recursive = true ) {

			this.name = source.name;

			this.up.copy( source.up );

			this.position.copy( source.position );
			this.rotation.order = source.rotation.order;
			this.quaternion.copy( source.quaternion );
			this.scale.copy( source.scale );

			this.matrix.copy( source.matrix );
			this.matrixWorld.copy( source.matrixWorld );

			this.matrixAutoUpdate = source.matrixAutoUpdate;

			this.matrixWorldAutoUpdate = source.matrixWorldAutoUpdate;
			this.matrixWorldNeedsUpdate = source.matrixWorldNeedsUpdate;

			this.layers.mask = source.layers.mask;
			this.visible = source.visible;

			this.castShadow = source.castShadow;
			this.receiveShadow = source.receiveShadow;

			this.frustumCulled = source.frustumCulled;
			this.renderOrder = source.renderOrder;

			this.animations = source.animations.slice();

			this.userData = JSON.parse( JSON.stringify( source.userData ) );

			if ( recursive === true ) {

				for ( let i = 0; i < source.children.length; i ++ ) {

					const child = source.children[ i ];
					this.add( child.clone() );

				}

			}

			return this;

		}

	}

    Object3D.DEFAULT_UP = /*@__PURE__*/ new Vector3( 0, 1, 0 );
	Object3D.DEFAULT_MATRIX_AUTO_UPDATE = true;
	Object3D.DEFAULT_MATRIX_WORLD_AUTO_UPDATE = true;

	const _v0$1 = /*@__PURE__*/ new Vector3();
	const _v1$3 = /*@__PURE__*/ new Vector3();
	const _v2$2 = /*@__PURE__*/ new Vector3();
	const _v3$1 = /*@__PURE__*/ new Vector3();

	const _vab = /*@__PURE__*/ new Vector3();
	const _vac = /*@__PURE__*/ new Vector3();
	const _vbc = /*@__PURE__*/ new Vector3();
	const _vap = /*@__PURE__*/ new Vector3();
	const _vbp = /*@__PURE__*/ new Vector3();
	const _vcp = /*@__PURE__*/ new Vector3();

	let warnedGetUV = false;

	class Triangle {

		constructor( a = new Vector3(), b = new Vector3(), c = new Vector3() ) {

			this.a = a;
			this.b = b;
			this.c = c;

		}

		static getNormal( a, b, c, target ) {

			target.subVectors( c, b );
			_v0$1.subVectors( a, b );
			target.cross( _v0$1 );

			const targetLengthSq = target.lengthSq();
			if ( targetLengthSq > 0 ) {

				return target.multiplyScalar( 1 / Math.sqrt( targetLengthSq ) );

			}

			return target.set( 0, 0, 0 );

		}

		// static/instance method to calculate barycentric coordinates
		// based on: http://www.blackpawn.com/texts/pointinpoly/default.html
		static getBarycoord( point, a, b, c, target ) {

			_v0$1.subVectors( c, a );
			_v1$3.subVectors( b, a );
			_v2$2.subVectors( point, a );

			const dot00 = _v0$1.dot( _v0$1 );
			const dot01 = _v0$1.dot( _v1$3 );
			const dot02 = _v0$1.dot( _v2$2 );
			const dot11 = _v1$3.dot( _v1$3 );
			const dot12 = _v1$3.dot( _v2$2 );

			const denom = ( dot00 * dot11 - dot01 * dot01 );

			// collinear or singular triangle
			if ( denom === 0 ) {

				// arbitrary location outside of triangle?
				// not sure if this is the best idea, maybe should be returning undefined
				return target.set( - 2, - 1, - 1 );

			}

			const invDenom = 1 / denom;
			const u = ( dot11 * dot02 - dot01 * dot12 ) * invDenom;
			const v = ( dot00 * dot12 - dot01 * dot02 ) * invDenom;

			// barycentric coordinates must always sum to 1
			return target.set( 1 - u - v, v, u );

		}

		static containsPoint( point, a, b, c ) {

			this.getBarycoord( point, a, b, c, _v3$1 );

			return ( _v3$1.x >= 0 ) && ( _v3$1.y >= 0 ) && ( ( _v3$1.x + _v3$1.y ) <= 1 );

		}

		static getUV( point, p1, p2, p3, uv1, uv2, uv3, target ) { // @deprecated, r151

			if ( warnedGetUV === false ) {

				console.warn( 'THREE.Triangle.getUV() has been renamed to THREE.Triangle.getInterpolation().' );

				warnedGetUV = true;

			}

			return this.getInterpolation( point, p1, p2, p3, uv1, uv2, uv3, target );

		}

		static getInterpolation( point, p1, p2, p3, v1, v2, v3, target ) {

			this.getBarycoord( point, p1, p2, p3, _v3$1 );

			target.setScalar( 0 );
			target.addScaledVector( v1, _v3$1.x );
			target.addScaledVector( v2, _v3$1.y );
			target.addScaledVector( v3, _v3$1.z );

			return target;

		}

		static isFrontFacing( a, b, c, direction ) {

			_v0$1.subVectors( c, b );
			_v1$3.subVectors( a, b );

			// strictly front facing
			return ( _v0$1.cross( _v1$3 ).dot( direction ) < 0 ) ? true : false;

		}

		set( a, b, c ) {

			this.a.copy( a );
			this.b.copy( b );
			this.c.copy( c );

			return this;

		}

		setFromPointsAndIndices( points, i0, i1, i2 ) {

			this.a.copy( points[ i0 ] );
			this.b.copy( points[ i1 ] );
			this.c.copy( points[ i2 ] );

			return this;

		}

		setFromAttributeAndIndices( attribute, i0, i1, i2 ) {

			this.a.fromBufferAttribute( attribute, i0 );
			this.b.fromBufferAttribute( attribute, i1 );
			this.c.fromBufferAttribute( attribute, i2 );

			return this;

		}

		clone() {

			return new this.constructor().copy( this );

		}

		copy( triangle ) {

			this.a.copy( triangle.a );
			this.b.copy( triangle.b );
			this.c.copy( triangle.c );

			return this;

		}

		getArea() {

			_v0$1.subVectors( this.c, this.b );
			_v1$3.subVectors( this.a, this.b );

			return _v0$1.cross( _v1$3 ).length() * 0.5;

		}

		getMidpoint( target ) {

			return target.addVectors( this.a, this.b ).add( this.c ).multiplyScalar( 1 / 3 );

		}

		getNormal( target ) {

			return Triangle.getNormal( this.a, this.b, this.c, target );

		}

		getPlane( target ) {

			return target.setFromCoplanarPoints( this.a, this.b, this.c );

		}

		getBarycoord( point, target ) {

			return Triangle.getBarycoord( point, this.a, this.b, this.c, target );

		}

		getUV( point, uv1, uv2, uv3, target ) { // @deprecated, r151

			if ( warnedGetUV === false ) {

				console.warn( 'THREE.Triangle.getUV() has been renamed to THREE.Triangle.getInterpolation().' );

				warnedGetUV = true;

			}

			return Triangle.getInterpolation( point, this.a, this.b, this.c, uv1, uv2, uv3, target );

		}

		getInterpolation( point, v1, v2, v3, target ) {

			return Triangle.getInterpolation( point, this.a, this.b, this.c, v1, v2, v3, target );

		}

		containsPoint( point ) {

			return Triangle.containsPoint( point, this.a, this.b, this.c );

		}

		isFrontFacing( direction ) {

			return Triangle.isFrontFacing( this.a, this.b, this.c, direction );

		}

		intersectsBox( box ) {

			return box.intersectsTriangle( this );

		}

		closestPointToPoint( p, target ) {

			const a = this.a, b = this.b, c = this.c;
			let v, w;

			// algorithm thanks to Real-Time Collision Detection by Christer Ericson,
			// published by Morgan Kaufmann Publishers, (c) 2005 Elsevier Inc.,
			// under the accompanying license; see chapter 5.1.5 for detailed explanation.
			// basically, we're distinguishing which of the voronoi regions of the triangle
			// the point lies in with the minimum amount of redundant computation.

			_vab.subVectors( b, a );
			_vac.subVectors( c, a );
			_vap.subVectors( p, a );
			const d1 = _vab.dot( _vap );
			const d2 = _vac.dot( _vap );
			if ( d1 <= 0 && d2 <= 0 ) {

				// vertex region of A; barycentric coords (1, 0, 0)
				return target.copy( a );

			}

			_vbp.subVectors( p, b );
			const d3 = _vab.dot( _vbp );
			const d4 = _vac.dot( _vbp );
			if ( d3 >= 0 && d4 <= d3 ) {

				// vertex region of B; barycentric coords (0, 1, 0)
				return target.copy( b );

			}

			const vc = d1 * d4 - d3 * d2;
			if ( vc <= 0 && d1 >= 0 && d3 <= 0 ) {

				v = d1 / ( d1 - d3 );
				// edge region of AB; barycentric coords (1-v, v, 0)
				return target.copy( a ).addScaledVector( _vab, v );

			}

			_vcp.subVectors( p, c );
			const d5 = _vab.dot( _vcp );
			const d6 = _vac.dot( _vcp );
			if ( d6 >= 0 && d5 <= d6 ) {

				// vertex region of C; barycentric coords (0, 0, 1)
				return target.copy( c );

			}

			const vb = d5 * d2 - d1 * d6;
			if ( vb <= 0 && d2 >= 0 && d6 <= 0 ) {

				w = d2 / ( d2 - d6 );
				// edge region of AC; barycentric coords (1-w, 0, w)
				return target.copy( a ).addScaledVector( _vac, w );

			}

			const va = d3 * d6 - d5 * d4;
			if ( va <= 0 && ( d4 - d3 ) >= 0 && ( d5 - d6 ) >= 0 ) {

				_vbc.subVectors( c, b );
				w = ( d4 - d3 ) / ( ( d4 - d3 ) + ( d5 - d6 ) );
				// edge region of BC; barycentric coords (0, 1-w, w)
				return target.copy( b ).addScaledVector( _vbc, w ); // edge region of BC

			}

			// face region
			const denom = 1 / ( va + vb + vc );
			// u = va * denom
			v = vb * denom;
			w = vc * denom;

			return target.copy( a ).addScaledVector( _vab, v ).addScaledVector( _vac, w );

		}

		equals( triangle ) {

			return triangle.a.equals( this.a ) && triangle.b.equals( this.b ) && triangle.c.equals( this.c );

		}

	}

    

	const _vector$9 = /*@__PURE__*/ new Vector3();
	const _vector2$1 = /*@__PURE__*/ new Vector2();

	class BufferAttribute {

		constructor( array, itemSize, normalized = false ) {

			if ( Array.isArray( array ) ) {

				throw new TypeError( 'THREE.BufferAttribute: array should be a Typed Array.' );

			}

			this.isBufferAttribute = true;

			this.name = '';

			this.array = array;
			this.itemSize = itemSize;
			this.count = array !== undefined ? array.length / itemSize : 0;
			this.normalized = normalized;

			this.usage = StaticDrawUsage;
			this._updateRange = { offset: 0, count: - 1 };
			this.updateRanges = [];
			this.gpuType = FloatType;

			this.version = 0;

		}

		onUploadCallback() {}

		set needsUpdate( value ) {

			if ( value === true ) this.version ++;

		}

		get updateRange() {

			console.warn( 'THREE.BufferAttribute: "updateRange" is deprecated and removed in r169. Use "addUpdateRange()" instead.' ); // @deprecated, r159
			return this._updateRange;

		}

		setUsage( value ) {

			this.usage = value;

			return this;

		}

		addUpdateRange( start, count ) {

			this.updateRanges.push( { start, count } );

		}

		clearUpdateRanges() {

			this.updateRanges.length = 0;

		}

		copy( source ) {

			this.name = source.name;
			this.array = new source.array.constructor( source.array );
			this.itemSize = source.itemSize;
			this.count = source.count;
			this.normalized = source.normalized;

			this.usage = source.usage;
			this.gpuType = source.gpuType;

			return this;

		}

		copyAt( index1, attribute, index2 ) {

			index1 *= this.itemSize;
			index2 *= attribute.itemSize;

			for ( let i = 0, l = this.itemSize; i < l; i ++ ) {

				this.array[ index1 + i ] = attribute.array[ index2 + i ];

			}

			return this;

		}

		copyArray( array ) {

			this.array.set( array );

			return this;

		}

		applyMatrix3( m ) {

			if ( this.itemSize === 2 ) {

				for ( let i = 0, l = this.count; i < l; i ++ ) {

					_vector2$1.fromBufferAttribute( this, i );
					_vector2$1.applyMatrix3( m );

					this.setXY( i, _vector2$1.x, _vector2$1.y );

				}

			} else if ( this.itemSize === 3 ) {

				for ( let i = 0, l = this.count; i < l; i ++ ) {

					_vector$9.fromBufferAttribute( this, i );
					_vector$9.applyMatrix3( m );

					this.setXYZ( i, _vector$9.x, _vector$9.y, _vector$9.z );

				}

			}

			return this;

		}

		applyMatrix4( m ) {

			for ( let i = 0, l = this.count; i < l; i ++ ) {

				_vector$9.fromBufferAttribute( this, i );

				_vector$9.applyMatrix4( m );

				this.setXYZ( i, _vector$9.x, _vector$9.y, _vector$9.z );

			}

			return this;

		}

		applyNormalMatrix( m ) {

			for ( let i = 0, l = this.count; i < l; i ++ ) {

				_vector$9.fromBufferAttribute( this, i );

				_vector$9.applyNormalMatrix( m );

				this.setXYZ( i, _vector$9.x, _vector$9.y, _vector$9.z );

			}

			return this;

		}

		transformDirection( m ) {

			for ( let i = 0, l = this.count; i < l; i ++ ) {

				_vector$9.fromBufferAttribute( this, i );

				_vector$9.transformDirection( m );

				this.setXYZ( i, _vector$9.x, _vector$9.y, _vector$9.z );

			}

			return this;

		}

		set( value, offset = 0 ) {

			// Matching BufferAttribute constructor, do not normalize the array.
			this.array.set( value, offset );

			return this;

		}

		getComponent( index, component ) {

			let value = this.array[ index * this.itemSize + component ];

			if ( this.normalized ) value = denormalize( value, this.array );

			return value;

		}

		setComponent( index, component, value ) {

			if ( this.normalized ) value = normalize( value, this.array );

			this.array[ index * this.itemSize + component ] = value;

			return this;

		}

		getX( index ) {

			let x = this.array[ index * this.itemSize ];

			if ( this.normalized ) x = denormalize( x, this.array );

			return x;

		}

		setX( index, x ) {

			if ( this.normalized ) x = normalize( x, this.array );

			this.array[ index * this.itemSize ] = x;

			return this;

		}

		getY( index ) {

			let y = this.array[ index * this.itemSize + 1 ];

			if ( this.normalized ) y = denormalize( y, this.array );

			return y;

		}

		setY( index, y ) {

			if ( this.normalized ) y = normalize( y, this.array );

			this.array[ index * this.itemSize + 1 ] = y;

			return this;

		}

		getZ( index ) {

			let z = this.array[ index * this.itemSize + 2 ];

			if ( this.normalized ) z = denormalize( z, this.array );

			return z;

		}

		setZ( index, z ) {

			if ( this.normalized ) z = normalize( z, this.array );

			this.array[ index * this.itemSize + 2 ] = z;

			return this;

		}

		getW( index ) {

			let w = this.array[ index * this.itemSize + 3 ];

			if ( this.normalized ) w = denormalize( w, this.array );

			return w;

		}

		setW( index, w ) {

			if ( this.normalized ) w = normalize( w, this.array );

			this.array[ index * this.itemSize + 3 ] = w;

			return this;

		}

		setXY( index, x, y ) {

			index *= this.itemSize;

			if ( this.normalized ) {

				x = normalize( x, this.array );
				y = normalize( y, this.array );

			}

			this.array[ index + 0 ] = x;
			this.array[ index + 1 ] = y;

			return this;

		}

		setXYZ( index, x, y, z ) {

			index *= this.itemSize;

			if ( this.normalized ) {

				x = normalize( x, this.array );
				y = normalize( y, this.array );
				z = normalize( z, this.array );

			}

			this.array[ index + 0 ] = x;
			this.array[ index + 1 ] = y;
			this.array[ index + 2 ] = z;

			return this;

		}

		setXYZW( index, x, y, z, w ) {

			index *= this.itemSize;

			if ( this.normalized ) {

				x = normalize( x, this.array );
				y = normalize( y, this.array );
				z = normalize( z, this.array );
				w = normalize( w, this.array );

			}

			this.array[ index + 0 ] = x;
			this.array[ index + 1 ] = y;
			this.array[ index + 2 ] = z;
			this.array[ index + 3 ] = w;

			return this;

		}

		onUpload( callback ) {

			this.onUploadCallback = callback;

			return this;

		}

		clone() {

			return new this.constructor( this.array, this.itemSize ).copy( this );

		}

		toJSON() {

			const data = {
				itemSize: this.itemSize,
				type: this.array.constructor.name,
				array: Array.from( this.array ),
				normalized: this.normalized
			};

			if ( this.name !== '' ) data.name = this.name;
			if ( this.usage !== StaticDrawUsage ) data.usage = this.usage;

			return data;

		}

	}

	//

	class Int8BufferAttribute extends BufferAttribute {

		constructor( array, itemSize, normalized ) {

			super( new Int8Array( array ), itemSize, normalized );

		}

	}

	class Uint8BufferAttribute extends BufferAttribute {

		constructor( array, itemSize, normalized ) {

			super( new Uint8Array( array ), itemSize, normalized );

		}

	}

	class Uint8ClampedBufferAttribute extends BufferAttribute {

		constructor( array, itemSize, normalized ) {

			super( new Uint8ClampedArray( array ), itemSize, normalized );

		}

	}

	class Int16BufferAttribute extends BufferAttribute {

		constructor( array, itemSize, normalized ) {

			super( new Int16Array( array ), itemSize, normalized );

		}

	}

	class Uint16BufferAttribute extends BufferAttribute {

		constructor( array, itemSize, normalized ) {

			super( new Uint16Array( array ), itemSize, normalized );

		}

	}

	class Int32BufferAttribute extends BufferAttribute {

		constructor( array, itemSize, normalized ) {

			super( new Int32Array( array ), itemSize, normalized );

		}

	}

	class Uint32BufferAttribute extends BufferAttribute {

		constructor( array, itemSize, normalized ) {

			super( new Uint32Array( array ), itemSize, normalized );

		}

	}

	class Float16BufferAttribute extends BufferAttribute {

		constructor( array, itemSize, normalized ) {

			super( new Uint16Array( array ), itemSize, normalized );

			this.isFloat16BufferAttribute = true;

		}

		getX( index ) {

			let x = fromHalfFloat( this.array[ index * this.itemSize ] );

			if ( this.normalized ) x = denormalize( x, this.array );

			return x;

		}

		setX( index, x ) {

			if ( this.normalized ) x = normalize( x, this.array );

			this.array[ index * this.itemSize ] = toHalfFloat( x );

			return this;

		}

		getY( index ) {

			let y = fromHalfFloat( this.array[ index * this.itemSize + 1 ] );

			if ( this.normalized ) y = denormalize( y, this.array );

			return y;

		}

		setY( index, y ) {

			if ( this.normalized ) y = normalize( y, this.array );

			this.array[ index * this.itemSize + 1 ] = toHalfFloat( y );

			return this;

		}

		getZ( index ) {

			let z = fromHalfFloat( this.array[ index * this.itemSize + 2 ] );

			if ( this.normalized ) z = denormalize( z, this.array );

			return z;

		}

		setZ( index, z ) {

			if ( this.normalized ) z = normalize( z, this.array );

			this.array[ index * this.itemSize + 2 ] = toHalfFloat( z );

			return this;

		}

		getW( index ) {

			let w = fromHalfFloat( this.array[ index * this.itemSize + 3 ] );

			if ( this.normalized ) w = denormalize( w, this.array );

			return w;

		}

		setW( index, w ) {

			if ( this.normalized ) w = normalize( w, this.array );

			this.array[ index * this.itemSize + 3 ] = toHalfFloat( w );

			return this;

		}

		setXY( index, x, y ) {

			index *= this.itemSize;

			if ( this.normalized ) {

				x = normalize( x, this.array );
				y = normalize( y, this.array );

			}

			this.array[ index + 0 ] = toHalfFloat( x );
			this.array[ index + 1 ] = toHalfFloat( y );

			return this;

		}

		setXYZ( index, x, y, z ) {

			index *= this.itemSize;

			if ( this.normalized ) {

				x = normalize( x, this.array );
				y = normalize( y, this.array );
				z = normalize( z, this.array );

			}

			this.array[ index + 0 ] = toHalfFloat( x );
			this.array[ index + 1 ] = toHalfFloat( y );
			this.array[ index + 2 ] = toHalfFloat( z );

			return this;

		}

		setXYZW( index, x, y, z, w ) {

			index *= this.itemSize;

			if ( this.normalized ) {

				x = normalize( x, this.array );
				y = normalize( y, this.array );
				z = normalize( z, this.array );
				w = normalize( w, this.array );

			}

			this.array[ index + 0 ] = toHalfFloat( x );
			this.array[ index + 1 ] = toHalfFloat( y );
			this.array[ index + 2 ] = toHalfFloat( z );
			this.array[ index + 3 ] = toHalfFloat( w );

			return this;

		}

	}


	class Float32BufferAttribute extends BufferAttribute {

		constructor( array, itemSize, normalized ) {

			super( new Float32Array( array ), itemSize, normalized );

		}

	}

	class Float64BufferAttribute extends BufferAttribute {

		constructor( array, itemSize, normalized ) {

			super( new Float64Array( array ), itemSize, normalized );

		}

	}

	let _id$2 = 0;

	const _m1 = /*@__PURE__*/ new Matrix4();
	const _obj = /*@__PURE__*/ new Object3D();
	const _offset = /*@__PURE__*/ new Vector3();
	const _box$2 = /*@__PURE__*/ new Box3();
	const _boxMorphTargets = /*@__PURE__*/ new Box3();
	const _vector$8 = /*@__PURE__*/ new Vector3();

	class BufferGeometry extends EventDispatcher {

		constructor() {

			super();

			this.isBufferGeometry = true;

			Object.defineProperty( this, 'id', { value: _id$2 ++ } );

			this.uuid = generateUUID();

			this.name = '';
			this.type = 'BufferGeometry';

			this.index = null;
			this.attributes = {};

			this.morphAttributes = {};
			this.morphTargetsRelative = false;

			this.groups = [];

			this.boundingBox = null;
			this.boundingSphere = null;

			this.drawRange = { start: 0, count: Infinity };

			this.userData = {};

		}

		getIndex() {

			return this.index;

		}

		setIndex( index ) {

			if ( Array.isArray( index ) ) {

				this.index = new ( arrayNeedsUint32( index ) ? Uint32BufferAttribute : Uint16BufferAttribute )( index, 1 );

			} else {

				this.index = index;

			}

			return this;

		}

		getAttribute( name ) {

			return this.attributes[ name ];

		}

		setAttribute( name, attribute ) {

			this.attributes[ name ] = attribute;

			return this;

		}

		deleteAttribute( name ) {

			delete this.attributes[ name ];

			return this;

		}

		hasAttribute( name ) {

			return this.attributes[ name ] !== undefined;

		}

		addGroup( start, count, materialIndex = 0 ) {

			this.groups.push( {

				start: start,
				count: count,
				materialIndex: materialIndex

			} );

		}

		clearGroups() {

			this.groups = [];

		}

		setDrawRange( start, count ) {

			this.drawRange.start = start;
			this.drawRange.count = count;

		}

		applyMatrix4( matrix ) {

			const position = this.attributes.position;

			if ( position !== undefined ) {

				position.applyMatrix4( matrix );

				position.needsUpdate = true;

			}

			const normal = this.attributes.normal;

			if ( normal !== undefined ) {

				const normalMatrix = new Matrix3().getNormalMatrix( matrix );

				normal.applyNormalMatrix( normalMatrix );

				normal.needsUpdate = true;

			}

			const tangent = this.attributes.tangent;

			if ( tangent !== undefined ) {

				tangent.transformDirection( matrix );

				tangent.needsUpdate = true;

			}

			if ( this.boundingBox !== null ) {

				this.computeBoundingBox();

			}

			if ( this.boundingSphere !== null ) {

				this.computeBoundingSphere();

			}

			return this;

		}

		applyQuaternion( q ) {

			_m1.makeRotationFromQuaternion( q );

			this.applyMatrix4( _m1 );

			return this;

		}

		rotateX( angle ) {

			// rotate geometry around world x-axis

			_m1.makeRotationX( angle );

			this.applyMatrix4( _m1 );

			return this;

		}

		rotateY( angle ) {

			// rotate geometry around world y-axis

			_m1.makeRotationY( angle );

			this.applyMatrix4( _m1 );

			return this;

		}

		rotateZ( angle ) {

			// rotate geometry around world z-axis

			_m1.makeRotationZ( angle );

			this.applyMatrix4( _m1 );

			return this;

		}

		translate( x, y, z ) {

			// translate geometry

			_m1.makeTranslation( x, y, z );

			this.applyMatrix4( _m1 );

			return this;

		}

		scale( x, y, z ) {

			// scale geometry

			_m1.makeScale( x, y, z );

			this.applyMatrix4( _m1 );

			return this;

		}

		lookAt( vector ) {

			_obj.lookAt( vector );

			_obj.updateMatrix();

			this.applyMatrix4( _obj.matrix );

			return this;

		}

		center() {

			this.computeBoundingBox();

			this.boundingBox.getCenter( _offset ).negate();

			this.translate( _offset.x, _offset.y, _offset.z );

			return this;

		}

		setFromPoints( points ) {

			const position = [];

			for ( let i = 0, l = points.length; i < l; i ++ ) {

				const point = points[ i ];
				position.push( point.x, point.y, point.z || 0 );

			}

			this.setAttribute( 'position', new Float32BufferAttribute( position, 3 ) );

			return this;

		}

		computeBoundingBox() {

			if ( this.boundingBox === null ) {

				this.boundingBox = new Box3();

			}

			const position = this.attributes.position;
			const morphAttributesPosition = this.morphAttributes.position;

			if ( position && position.isGLBufferAttribute ) {

				console.error( 'THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box. Alternatively set "mesh.frustumCulled" to "false".', this );

				this.boundingBox.set(
					new Vector3( - Infinity, - Infinity, - Infinity ),
					new Vector3( + Infinity, + Infinity, + Infinity )
				);

				return;

			}

			if ( position !== undefined ) {

				this.boundingBox.setFromBufferAttribute( position );

				// process morph attributes if present

				if ( morphAttributesPosition ) {

					for ( let i = 0, il = morphAttributesPosition.length; i < il; i ++ ) {

						const morphAttribute = morphAttributesPosition[ i ];
						_box$2.setFromBufferAttribute( morphAttribute );

						if ( this.morphTargetsRelative ) {

							_vector$8.addVectors( this.boundingBox.min, _box$2.min );
							this.boundingBox.expandByPoint( _vector$8 );

							_vector$8.addVectors( this.boundingBox.max, _box$2.max );
							this.boundingBox.expandByPoint( _vector$8 );

						} else {

							this.boundingBox.expandByPoint( _box$2.min );
							this.boundingBox.expandByPoint( _box$2.max );

						}

					}

				}

			} else {

				this.boundingBox.makeEmpty();

			}

			if ( isNaN( this.boundingBox.min.x ) || isNaN( this.boundingBox.min.y ) || isNaN( this.boundingBox.min.z ) ) {

				console.error( 'THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.', this );

			}

		}

		computeBoundingSphere() {

			if ( this.boundingSphere === null ) {

				this.boundingSphere = new Sphere();

			}

			const position = this.attributes.position;
			const morphAttributesPosition = this.morphAttributes.position;

			if ( position && position.isGLBufferAttribute ) {

				console.error( 'THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere. Alternatively set "mesh.frustumCulled" to "false".', this );

				this.boundingSphere.set( new Vector3(), Infinity );

				return;

			}

			if ( position ) {

				// first, find the center of the bounding sphere

				const center = this.boundingSphere.center;

				_box$2.setFromBufferAttribute( position );

				// process morph attributes if present

				if ( morphAttributesPosition ) {

					for ( let i = 0, il = morphAttributesPosition.length; i < il; i ++ ) {

						const morphAttribute = morphAttributesPosition[ i ];
						_boxMorphTargets.setFromBufferAttribute( morphAttribute );

						if ( this.morphTargetsRelative ) {

							_vector$8.addVectors( _box$2.min, _boxMorphTargets.min );
							_box$2.expandByPoint( _vector$8 );

							_vector$8.addVectors( _box$2.max, _boxMorphTargets.max );
							_box$2.expandByPoint( _vector$8 );

						} else {

							_box$2.expandByPoint( _boxMorphTargets.min );
							_box$2.expandByPoint( _boxMorphTargets.max );

						}

					}

				}

				_box$2.getCenter( center );

				// second, try to find a boundingSphere with a radius smaller than the
				// boundingSphere of the boundingBox: sqrt(3) smaller in the best case

				let maxRadiusSq = 0;

				for ( let i = 0, il = position.count; i < il; i ++ ) {

					_vector$8.fromBufferAttribute( position, i );

					maxRadiusSq = Math.max( maxRadiusSq, center.distanceToSquared( _vector$8 ) );

				}

				// process morph attributes if present

				if ( morphAttributesPosition ) {

					for ( let i = 0, il = morphAttributesPosition.length; i < il; i ++ ) {

						const morphAttribute = morphAttributesPosition[ i ];
						const morphTargetsRelative = this.morphTargetsRelative;

						for ( let j = 0, jl = morphAttribute.count; j < jl; j ++ ) {

							_vector$8.fromBufferAttribute( morphAttribute, j );

							if ( morphTargetsRelative ) {

								_offset.fromBufferAttribute( position, j );
								_vector$8.add( _offset );

							}

							maxRadiusSq = Math.max( maxRadiusSq, center.distanceToSquared( _vector$8 ) );

						}

					}

				}

				this.boundingSphere.radius = Math.sqrt( maxRadiusSq );

				if ( isNaN( this.boundingSphere.radius ) ) {

					console.error( 'THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.', this );

				}

			}

		}

		computeTangents() {

			const index = this.index;
			const attributes = this.attributes;

			// based on http://www.terathon.com/code/tangent.html
			// (per vertex tangents)

			if ( index === null ||
				 attributes.position === undefined ||
				 attributes.normal === undefined ||
				 attributes.uv === undefined ) {

				console.error( 'THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)' );
				return;

			}

			const indices = index.array;
			const positions = attributes.position.array;
			const normals = attributes.normal.array;
			const uvs = attributes.uv.array;

			const nVertices = positions.length / 3;

			if ( this.hasAttribute( 'tangent' ) === false ) {

				this.setAttribute( 'tangent', new BufferAttribute( new Float32Array( 4 * nVertices ), 4 ) );

			}

			const tangents = this.getAttribute( 'tangent' ).array;

			const tan1 = [], tan2 = [];

			for ( let i = 0; i < nVertices; i ++ ) {

				tan1[ i ] = new Vector3();
				tan2[ i ] = new Vector3();

			}

			const vA = new Vector3(),
				vB = new Vector3(),
				vC = new Vector3(),

				uvA = new Vector2(),
				uvB = new Vector2(),
				uvC = new Vector2(),

				sdir = new Vector3(),
				tdir = new Vector3();

			function handleTriangle( a, b, c ) {

				vA.fromArray( positions, a * 3 );
				vB.fromArray( positions, b * 3 );
				vC.fromArray( positions, c * 3 );

				uvA.fromArray( uvs, a * 2 );
				uvB.fromArray( uvs, b * 2 );
				uvC.fromArray( uvs, c * 2 );

				vB.sub( vA );
				vC.sub( vA );

				uvB.sub( uvA );
				uvC.sub( uvA );

				const r = 1.0 / ( uvB.x * uvC.y - uvC.x * uvB.y );

				// silently ignore degenerate uv triangles having coincident or colinear vertices

				if ( ! isFinite( r ) ) return;

				sdir.copy( vB ).multiplyScalar( uvC.y ).addScaledVector( vC, - uvB.y ).multiplyScalar( r );
				tdir.copy( vC ).multiplyScalar( uvB.x ).addScaledVector( vB, - uvC.x ).multiplyScalar( r );

				tan1[ a ].add( sdir );
				tan1[ b ].add( sdir );
				tan1[ c ].add( sdir );

				tan2[ a ].add( tdir );
				tan2[ b ].add( tdir );
				tan2[ c ].add( tdir );

			}

			let groups = this.groups;

			if ( groups.length === 0 ) {

				groups = [ {
					start: 0,
					count: indices.length
				} ];

			}

			for ( let i = 0, il = groups.length; i < il; ++ i ) {

				const group = groups[ i ];

				const start = group.start;
				const count = group.count;

				for ( let j = start, jl = start + count; j < jl; j += 3 ) {

					handleTriangle(
						indices[ j + 0 ],
						indices[ j + 1 ],
						indices[ j + 2 ]
					);

				}

			}

			const tmp = new Vector3(), tmp2 = new Vector3();
			const n = new Vector3(), n2 = new Vector3();

			function handleVertex( v ) {

				n.fromArray( normals, v * 3 );
				n2.copy( n );

				const t = tan1[ v ];

				// Gram-Schmidt orthogonalize

				tmp.copy( t );
				tmp.sub( n.multiplyScalar( n.dot( t ) ) ).normalize();

				// Calculate handedness

				tmp2.crossVectors( n2, t );
				const test = tmp2.dot( tan2[ v ] );
				const w = ( test < 0.0 ) ? - 1.0 : 1.0;

				tangents[ v * 4 ] = tmp.x;
				tangents[ v * 4 + 1 ] = tmp.y;
				tangents[ v * 4 + 2 ] = tmp.z;
				tangents[ v * 4 + 3 ] = w;

			}

			for ( let i = 0, il = groups.length; i < il; ++ i ) {

				const group = groups[ i ];

				const start = group.start;
				const count = group.count;

				for ( let j = start, jl = start + count; j < jl; j += 3 ) {

					handleVertex( indices[ j + 0 ] );
					handleVertex( indices[ j + 1 ] );
					handleVertex( indices[ j + 2 ] );

				}

			}

		}

		computeVertexNormals() {

			const index = this.index;
			const positionAttribute = this.getAttribute( 'position' );

			if ( positionAttribute !== undefined ) {

				let normalAttribute = this.getAttribute( 'normal' );

				if ( normalAttribute === undefined ) {

					normalAttribute = new BufferAttribute( new Float32Array( positionAttribute.count * 3 ), 3 );
					this.setAttribute( 'normal', normalAttribute );

				} else {

					// reset existing normals to zero

					for ( let i = 0, il = normalAttribute.count; i < il; i ++ ) {

						normalAttribute.setXYZ( i, 0, 0, 0 );

					}

				}

				const pA = new Vector3(), pB = new Vector3(), pC = new Vector3();
				const nA = new Vector3(), nB = new Vector3(), nC = new Vector3();
				const cb = new Vector3(), ab = new Vector3();

				// indexed elements

				if ( index ) {

					for ( let i = 0, il = index.count; i < il; i += 3 ) {

						const vA = index.getX( i + 0 );
						const vB = index.getX( i + 1 );
						const vC = index.getX( i + 2 );

						pA.fromBufferAttribute( positionAttribute, vA );
						pB.fromBufferAttribute( positionAttribute, vB );
						pC.fromBufferAttribute( positionAttribute, vC );

						cb.subVectors( pC, pB );
						ab.subVectors( pA, pB );
						cb.cross( ab );

						nA.fromBufferAttribute( normalAttribute, vA );
						nB.fromBufferAttribute( normalAttribute, vB );
						nC.fromBufferAttribute( normalAttribute, vC );

						nA.add( cb );
						nB.add( cb );
						nC.add( cb );

						normalAttribute.setXYZ( vA, nA.x, nA.y, nA.z );
						normalAttribute.setXYZ( vB, nB.x, nB.y, nB.z );
						normalAttribute.setXYZ( vC, nC.x, nC.y, nC.z );

					}

				} else {

					// non-indexed elements (unconnected triangle soup)

					for ( let i = 0, il = positionAttribute.count; i < il; i += 3 ) {

						pA.fromBufferAttribute( positionAttribute, i + 0 );
						pB.fromBufferAttribute( positionAttribute, i + 1 );
						pC.fromBufferAttribute( positionAttribute, i + 2 );

						cb.subVectors( pC, pB );
						ab.subVectors( pA, pB );
						cb.cross( ab );

						normalAttribute.setXYZ( i + 0, cb.x, cb.y, cb.z );
						normalAttribute.setXYZ( i + 1, cb.x, cb.y, cb.z );
						normalAttribute.setXYZ( i + 2, cb.x, cb.y, cb.z );

					}

				}

				this.normalizeNormals();

				normalAttribute.needsUpdate = true;

			}

		}

		normalizeNormals() {

			const normals = this.attributes.normal;

			for ( let i = 0, il = normals.count; i < il; i ++ ) {

				_vector$8.fromBufferAttribute( normals, i );

				_vector$8.normalize();

				normals.setXYZ( i, _vector$8.x, _vector$8.y, _vector$8.z );

			}

		}

		toNonIndexed() {

			function convertBufferAttribute( attribute, indices ) {

				const array = attribute.array;
				const itemSize = attribute.itemSize;
				const normalized = attribute.normalized;

				const array2 = new array.constructor( indices.length * itemSize );

				let index = 0, index2 = 0;

				for ( let i = 0, l = indices.length; i < l; i ++ ) {

					if ( attribute.isInterleavedBufferAttribute ) {

						index = indices[ i ] * attribute.data.stride + attribute.offset;

					} else {

						index = indices[ i ] * itemSize;

					}

					for ( let j = 0; j < itemSize; j ++ ) {

						array2[ index2 ++ ] = array[ index ++ ];

					}

				}

				return new BufferAttribute( array2, itemSize, normalized );

			}

			//

			if ( this.index === null ) {

				console.warn( 'THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed.' );
				return this;

			}

			const geometry2 = new BufferGeometry();

			const indices = this.index.array;
			const attributes = this.attributes;

			// attributes

			for ( const name in attributes ) {

				const attribute = attributes[ name ];

				const newAttribute = convertBufferAttribute( attribute, indices );

				geometry2.setAttribute( name, newAttribute );

			}

			// morph attributes

			const morphAttributes = this.morphAttributes;

			for ( const name in morphAttributes ) {

				const morphArray = [];
				const morphAttribute = morphAttributes[ name ]; // morphAttribute: array of Float32BufferAttributes

				for ( let i = 0, il = morphAttribute.length; i < il; i ++ ) {

					const attribute = morphAttribute[ i ];

					const newAttribute = convertBufferAttribute( attribute, indices );

					morphArray.push( newAttribute );

				}

				geometry2.morphAttributes[ name ] = morphArray;

			}

			geometry2.morphTargetsRelative = this.morphTargetsRelative;

			// groups

			const groups = this.groups;

			for ( let i = 0, l = groups.length; i < l; i ++ ) {

				const group = groups[ i ];
				geometry2.addGroup( group.start, group.count, group.materialIndex );

			}

			return geometry2;

		}

		toJSON() {

			const data = {
				metadata: {
					version: 4.6,
					type: 'BufferGeometry',
					generator: 'BufferGeometry.toJSON'
				}
			};

			// standard BufferGeometry serialization

			data.uuid = this.uuid;
			data.type = this.type;
			if ( this.name !== '' ) data.name = this.name;
			if ( Object.keys( this.userData ).length > 0 ) data.userData = this.userData;

			if ( this.parameters !== undefined ) {

				const parameters = this.parameters;

				for ( const key in parameters ) {

					if ( parameters[ key ] !== undefined ) data[ key ] = parameters[ key ];

				}

				return data;

			}

			// for simplicity the code assumes attributes are not shared across geometries, see #15811

			data.data = { attributes: {} };

			const index = this.index;

			if ( index !== null ) {

				data.data.index = {
					type: index.array.constructor.name,
					array: Array.prototype.slice.call( index.array )
				};

			}

			const attributes = this.attributes;

			for ( const key in attributes ) {

				const attribute = attributes[ key ];

				data.data.attributes[ key ] = attribute.toJSON( data.data );

			}

			const morphAttributes = {};
			let hasMorphAttributes = false;

			for ( const key in this.morphAttributes ) {

				const attributeArray = this.morphAttributes[ key ];

				const array = [];

				for ( let i = 0, il = attributeArray.length; i < il; i ++ ) {

					const attribute = attributeArray[ i ];

					array.push( attribute.toJSON( data.data ) );

				}

				if ( array.length > 0 ) {

					morphAttributes[ key ] = array;

					hasMorphAttributes = true;

				}

			}

			if ( hasMorphAttributes ) {

				data.data.morphAttributes = morphAttributes;
				data.data.morphTargetsRelative = this.morphTargetsRelative;

			}

			const groups = this.groups;

			if ( groups.length > 0 ) {

				data.data.groups = JSON.parse( JSON.stringify( groups ) );

			}

			const boundingSphere = this.boundingSphere;

			if ( boundingSphere !== null ) {

				data.data.boundingSphere = {
					center: boundingSphere.center.toArray(),
					radius: boundingSphere.radius
				};

			}

			return data;

		}

		clone() {

			return new this.constructor().copy( this );

		}

		copy( source ) {

			// reset

			this.index = null;
			this.attributes = {};
			this.morphAttributes = {};
			this.groups = [];
			this.boundingBox = null;
			this.boundingSphere = null;

			// used for storing cloned, shared data

			const data = {};

			// name

			this.name = source.name;

			// index

			const index = source.index;

			if ( index !== null ) {

				this.setIndex( index.clone( data ) );

			}

			// attributes

			const attributes = source.attributes;

			for ( const name in attributes ) {

				const attribute = attributes[ name ];
				this.setAttribute( name, attribute.clone( data ) );

			}

			// morph attributes

			const morphAttributes = source.morphAttributes;

			for ( const name in morphAttributes ) {

				const array = [];
				const morphAttribute = morphAttributes[ name ]; // morphAttribute: array of Float32BufferAttributes

				for ( let i = 0, l = morphAttribute.length; i < l; i ++ ) {

					array.push( morphAttribute[ i ].clone( data ) );

				}

				this.morphAttributes[ name ] = array;

			}

			this.morphTargetsRelative = source.morphTargetsRelative;

			// groups

			const groups = source.groups;

			for ( let i = 0, l = groups.length; i < l; i ++ ) {

				const group = groups[ i ];
				this.addGroup( group.start, group.count, group.materialIndex );

			}

			// bounding box

			const boundingBox = source.boundingBox;

			if ( boundingBox !== null ) {

				this.boundingBox = boundingBox.clone();

			}

			// bounding sphere

			const boundingSphere = source.boundingSphere;

			if ( boundingSphere !== null ) {

				this.boundingSphere = boundingSphere.clone();

			}

			// draw range

			this.drawRange.start = source.drawRange.start;
			this.drawRange.count = source.drawRange.count;

			// user data

			this.userData = source.userData;

			return this;

		}

		dispose() {

			this.dispatchEvent( { type: 'dispose' } );

		}

	}

    function checkIntersection( object, material, raycaster, ray, pA, pB, pC, point ) {

		let intersect;

		if ( material.side === BackSide ) {

			intersect = ray.intersectTriangle( pC, pB, pA, true, point );

		} else {

			intersect = ray.intersectTriangle( pA, pB, pC, ( material.side === FrontSide ), point );

		}

		if ( intersect === null ) return null;

		_intersectionPointWorld.copy( point );
		_intersectionPointWorld.applyMatrix4( object.matrixWorld );

		const distance = raycaster.ray.origin.distanceTo( _intersectionPointWorld );

		if ( distance < raycaster.near || distance > raycaster.far ) return null;

		return {
			distance: distance,
			point: _intersectionPointWorld.clone(),
			object: object
		};

	}

	function checkGeometryIntersection( object, material, raycaster, ray, uv, uv1, normal, a, b, c ) {

		object.getVertexPosition( a, _vA$1 );
		object.getVertexPosition( b, _vB$1 );
		object.getVertexPosition( c, _vC$1 );

		const intersection = checkIntersection( object, material, raycaster, ray, _vA$1, _vB$1, _vC$1, _intersectionPoint );

		if ( intersection ) {

			if ( uv ) {

				_uvA$1.fromBufferAttribute( uv, a );
				_uvB$1.fromBufferAttribute( uv, b );
				_uvC$1.fromBufferAttribute( uv, c );

				intersection.uv = Triangle.getInterpolation( _intersectionPoint, _vA$1, _vB$1, _vC$1, _uvA$1, _uvB$1, _uvC$1, new Vector2() );

			}

			if ( uv1 ) {

				_uvA$1.fromBufferAttribute( uv1, a );
				_uvB$1.fromBufferAttribute( uv1, b );
				_uvC$1.fromBufferAttribute( uv1, c );

				intersection.uv1 = Triangle.getInterpolation( _intersectionPoint, _vA$1, _vB$1, _vC$1, _uvA$1, _uvB$1, _uvC$1, new Vector2() );
				intersection.uv2 = intersection.uv1; // @deprecated, r152

			}

			if ( normal ) {

				_normalA.fromBufferAttribute( normal, a );
				_normalB.fromBufferAttribute( normal, b );
				_normalC.fromBufferAttribute( normal, c );

				intersection.normal = Triangle.getInterpolation( _intersectionPoint, _vA$1, _vB$1, _vC$1, _normalA, _normalB, _normalC, new Vector3() );

				if ( intersection.normal.dot( ray.direction ) > 0 ) {

					intersection.normal.multiplyScalar( - 1 );

				}

			}

			const face = {
				a: a,
				b: b,
				c: c,
				normal: new Vector3(),
				materialIndex: 0
			};

			Triangle.getNormal( _vA$1, _vB$1, _vC$1, face.normal );

			intersection.face = face;

		}

		return intersection;

	}

    class Curve {

		constructor() {

			this.type = 'Curve';

			this.arcLengthDivisions = 200;

		}

		// Virtual base class method to overwrite and implement in subclasses
		//	- t [0 .. 1]

		getPoint( /* t, optionalTarget */ ) {

			console.warn( 'THREE.Curve: .getPoint() not implemented.' );
			return null;

		}

		// Get point at relative position in curve according to arc length
		// - u [0 .. 1]

		getPointAt( u, optionalTarget ) {

			const t = this.getUtoTmapping( u );
			return this.getPoint( t, optionalTarget );

		}

		// Get sequence of points using getPoint( t )

		getPoints( divisions = 5 ) {

			const points = [];

			for ( let d = 0; d <= divisions; d ++ ) {

				points.push( this.getPoint( d / divisions ) );

			}

			return points;

		}

		// Get sequence of points using getPointAt( u )

		getSpacedPoints( divisions = 5 ) {

			const points = [];

			for ( let d = 0; d <= divisions; d ++ ) {

				points.push( this.getPointAt( d / divisions ) );

			}

			return points;

		}

		// Get total curve arc length

		getLength() {

			const lengths = this.getLengths();
			return lengths[ lengths.length - 1 ];

		}

		// Get list of cumulative segment lengths

		getLengths( divisions = this.arcLengthDivisions ) {

			if ( this.cacheArcLengths &&
				( this.cacheArcLengths.length === divisions + 1 ) &&
				! this.needsUpdate ) {

				return this.cacheArcLengths;

			}

			this.needsUpdate = false;

			const cache = [];
			let current, last = this.getPoint( 0 );
			let sum = 0;

			cache.push( 0 );

			for ( let p = 1; p <= divisions; p ++ ) {

				current = this.getPoint( p / divisions );
				sum += current.distanceTo( last );
				cache.push( sum );
				last = current;

			}

			this.cacheArcLengths = cache;

			return cache; // { sums: cache, sum: sum }; Sum is in the last element.

		}

		updateArcLengths() {

			this.needsUpdate = true;
			this.getLengths();

		}

		// Given u ( 0 .. 1 ), get a t to find p. This gives you points which are equidistant

		getUtoTmapping( u, distance ) {

			const arcLengths = this.getLengths();

			let i = 0;
			const il = arcLengths.length;

			let targetArcLength; // The targeted u distance value to get

			if ( distance ) {

				targetArcLength = distance;

			} else {

				targetArcLength = u * arcLengths[ il - 1 ];

			}

			// binary search for the index with largest value smaller than target u distance

			let low = 0, high = il - 1, comparison;

			while ( low <= high ) {

				i = Math.floor( low + ( high - low ) / 2 ); // less likely to overflow, though probably not issue here, JS doesn't really have integers, all numbers are floats

				comparison = arcLengths[ i ] - targetArcLength;

				if ( comparison < 0 ) {

					low = i + 1;

				} else if ( comparison > 0 ) {

					high = i - 1;

				} else {

					high = i;
					break;

					// DONE

				}

			}

			i = high;

			if ( arcLengths[ i ] === targetArcLength ) {

				return i / ( il - 1 );

			}

			// we could get finer grain at lengths, or use simple interpolation between two points

			const lengthBefore = arcLengths[ i ];
			const lengthAfter = arcLengths[ i + 1 ];

			const segmentLength = lengthAfter - lengthBefore;

			// determine where we are between the 'before' and 'after' points

			const segmentFraction = ( targetArcLength - lengthBefore ) / segmentLength;

			// add that fractional amount to t

			const t = ( i + segmentFraction ) / ( il - 1 );

			return t;

		}

		// Returns a unit vector tangent at t
		// In case any sub curve does not implement its tangent derivation,
		// 2 points a small delta apart will be used to find its gradient
		// which seems to give a reasonable approximation

		getTangent( t, optionalTarget ) {

			const delta = 0.0001;
			let t1 = t - delta;
			let t2 = t + delta;

			// Capping in case of danger

			if ( t1 < 0 ) t1 = 0;
			if ( t2 > 1 ) t2 = 1;

			const pt1 = this.getPoint( t1 );
			const pt2 = this.getPoint( t2 );

			const tangent = optionalTarget || ( ( pt1.isVector2 ) ? new Vector2() : new Vector3() );

			tangent.copy( pt2 ).sub( pt1 ).normalize();

			return tangent;

		}

		getTangentAt( u, optionalTarget ) {

			const t = this.getUtoTmapping( u );
			return this.getTangent( t, optionalTarget );

		}

		computeFrenetFrames( segments, closed ) {

			// see http://www.cs.indiana.edu/pub/techreports/TR425.pdf

			const normal = new Vector3();

			const tangents = [];
			const normals = [];
			const binormals = [];

			const vec = new Vector3();
			const mat = new Matrix4();

			// compute the tangent vectors for each segment on the curve

			for ( let i = 0; i <= segments; i ++ ) {

				const u = i / segments;

				tangents[ i ] = this.getTangentAt( u, new Vector3() );

			}

			// select an initial normal vector perpendicular to the first tangent vector,
			// and in the direction of the minimum tangent xyz component

			normals[ 0 ] = new Vector3();
			binormals[ 0 ] = new Vector3();
			let min = Number.MAX_VALUE;
			const tx = Math.abs( tangents[ 0 ].x );
			const ty = Math.abs( tangents[ 0 ].y );
			const tz = Math.abs( tangents[ 0 ].z );

			if ( tx <= min ) {

				min = tx;
				normal.set( 1, 0, 0 );

			}

			if ( ty <= min ) {

				min = ty;
				normal.set( 0, 1, 0 );

			}

			if ( tz <= min ) {

				normal.set( 0, 0, 1 );

			}

			vec.crossVectors( tangents[ 0 ], normal ).normalize();

			normals[ 0 ].crossVectors( tangents[ 0 ], vec );
			binormals[ 0 ].crossVectors( tangents[ 0 ], normals[ 0 ] );


			// compute the slowly-varying normal and binormal vectors for each segment on the curve

			for ( let i = 1; i <= segments; i ++ ) {

				normals[ i ] = normals[ i - 1 ].clone();

				binormals[ i ] = binormals[ i - 1 ].clone();

				vec.crossVectors( tangents[ i - 1 ], tangents[ i ] );

				if ( vec.length() > Number.EPSILON ) {

					vec.normalize();

					const theta = Math.acos( clamp( tangents[ i - 1 ].dot( tangents[ i ] ), - 1, 1 ) ); // clamp for floating pt errors

					normals[ i ].applyMatrix4( mat.makeRotationAxis( vec, theta ) );

				}

				binormals[ i ].crossVectors( tangents[ i ], normals[ i ] );

			}

			// if the curve is closed, postprocess the vectors so the first and last normal vectors are the same

			if ( closed === true ) {

				let theta = Math.acos( clamp( normals[ 0 ].dot( normals[ segments ] ), - 1, 1 ) );
				theta /= segments;

				if ( tangents[ 0 ].dot( vec.crossVectors( normals[ 0 ], normals[ segments ] ) ) > 0 ) {

					theta = - theta;

				}

				for ( let i = 1; i <= segments; i ++ ) {

					// twist a little...
					normals[ i ].applyMatrix4( mat.makeRotationAxis( tangents[ i ], theta * i ) );
					binormals[ i ].crossVectors( tangents[ i ], normals[ i ] );

				}

			}

			return {
				tangents: tangents,
				normals: normals,
				binormals: binormals
			};

		}

		clone() {

			return new this.constructor().copy( this );

		}

		copy( source ) {

			this.arcLengthDivisions = source.arcLengthDivisions;

			return this;

		}

		toJSON() {

			const data = {
				metadata: {
					version: 4.6,
					type: 'Curve',
					generator: 'Curve.toJSON'
				}
			};

			data.arcLengthDivisions = this.arcLengthDivisions;
			data.type = this.type;

			return data;

		}

		fromJSON( json ) {

			this.arcLengthDivisions = json.arcLengthDivisions;

			return this;

		}

	}

	class EllipseCurve extends Curve {

		constructor( aX = 0, aY = 0, xRadius = 1, yRadius = 1, aStartAngle = 0, aEndAngle = Math.PI * 2, aClockwise = false, aRotation = 0 ) {

			super();

			this.isEllipseCurve = true;

			this.type = 'EllipseCurve';

			this.aX = aX;
			this.aY = aY;

			this.xRadius = xRadius;
			this.yRadius = yRadius;

			this.aStartAngle = aStartAngle;
			this.aEndAngle = aEndAngle;

			this.aClockwise = aClockwise;

			this.aRotation = aRotation;

		}

		getPoint( t, optionalTarget ) {

			const point = optionalTarget || new Vector2();

			const twoPi = Math.PI * 2;
			let deltaAngle = this.aEndAngle - this.aStartAngle;
			const samePoints = Math.abs( deltaAngle ) < Number.EPSILON;

			// ensures that deltaAngle is 0 .. 2 PI
			while ( deltaAngle < 0 ) deltaAngle += twoPi;
			while ( deltaAngle > twoPi ) deltaAngle -= twoPi;

			if ( deltaAngle < Number.EPSILON ) {

				if ( samePoints ) {

					deltaAngle = 0;

				} else {

					deltaAngle = twoPi;

				}

			}

			if ( this.aClockwise === true && ! samePoints ) {

				if ( deltaAngle === twoPi ) {

					deltaAngle = - twoPi;

				} else {

					deltaAngle = deltaAngle - twoPi;

				}

			}

			const angle = this.aStartAngle + t * deltaAngle;
			let x = this.aX + this.xRadius * Math.cos( angle );
			let y = this.aY + this.yRadius * Math.sin( angle );

			if ( this.aRotation !== 0 ) {

				const cos = Math.cos( this.aRotation );
				const sin = Math.sin( this.aRotation );

				const tx = x - this.aX;
				const ty = y - this.aY;

				// Rotate the point about the center of the ellipse.
				x = tx * cos - ty * sin + this.aX;
				y = tx * sin + ty * cos + this.aY;

			}

			return point.set( x, y );

		}

		copy( source ) {

			super.copy( source );

			this.aX = source.aX;
			this.aY = source.aY;

			this.xRadius = source.xRadius;
			this.yRadius = source.yRadius;

			this.aStartAngle = source.aStartAngle;
			this.aEndAngle = source.aEndAngle;

			this.aClockwise = source.aClockwise;

			this.aRotation = source.aRotation;

			return this;

		}

		toJSON() {

			const data = super.toJSON();

			data.aX = this.aX;
			data.aY = this.aY;

			data.xRadius = this.xRadius;
			data.yRadius = this.yRadius;

			data.aStartAngle = this.aStartAngle;
			data.aEndAngle = this.aEndAngle;

			data.aClockwise = this.aClockwise;

			data.aRotation = this.aRotation;

			return data;

		}

		fromJSON( json ) {

			super.fromJSON( json );

			this.aX = json.aX;
			this.aY = json.aY;

			this.xRadius = json.xRadius;
			this.yRadius = json.yRadius;

			this.aStartAngle = json.aStartAngle;
			this.aEndAngle = json.aEndAngle;

			this.aClockwise = json.aClockwise;

			this.aRotation = json.aRotation;

			return this;

		}

	}

	class ArcCurve extends EllipseCurve {

		constructor( aX, aY, aRadius, aStartAngle, aEndAngle, aClockwise ) {

			super( aX, aY, aRadius, aRadius, aStartAngle, aEndAngle, aClockwise );

			this.isArcCurve = true;

			this.type = 'ArcCurve';

		}

	}

	/**
	 * Centripetal CatmullRom Curve - which is useful for avoiding
	 * cusps and self-intersections in non-uniform catmull rom curves.
	 * http://www.cemyuksel.com/research/catmullrom_param/catmullrom.pdf
	 *
	 * curve.type accepts centripetal(default), chordal and catmullrom
	 * curve.tension is used for catmullrom which defaults to 0.5
	 */


	/*
	Based on an optimized c++ solution in
	 - http://stackoverflow.com/questions/9489736/catmull-rom-curve-with-no-cusps-and-no-self-intersections/
	 - http://ideone.com/NoEbVM

	This CubicPoly class could be used for reusing some variables and calculations,
	but for three.js curve use, it could be possible inlined and flatten into a single function call
	which can be placed in CurveUtils.
	*/

	function CubicPoly() {

		let c0 = 0, c1 = 0, c2 = 0, c3 = 0;

		/*
		 * Compute coefficients for a cubic polynomial
		 *   p(s) = c0 + c1*s + c2*s^2 + c3*s^3
		 * such that
		 *   p(0) = x0, p(1) = x1
		 *  and
		 *   p'(0) = t0, p'(1) = t1.
		 */
		function init( x0, x1, t0, t1 ) {

			c0 = x0;
			c1 = t0;
			c2 = - 3 * x0 + 3 * x1 - 2 * t0 - t1;
			c3 = 2 * x0 - 2 * x1 + t0 + t1;

		}

		return {

			initCatmullRom: function ( x0, x1, x2, x3, tension ) {

				init( x1, x2, tension * ( x2 - x0 ), tension * ( x3 - x1 ) );

			},

			initNonuniformCatmullRom: function ( x0, x1, x2, x3, dt0, dt1, dt2 ) {

				// compute tangents when parameterized in [t1,t2]
				let t1 = ( x1 - x0 ) / dt0 - ( x2 - x0 ) / ( dt0 + dt1 ) + ( x2 - x1 ) / dt1;
				let t2 = ( x2 - x1 ) / dt1 - ( x3 - x1 ) / ( dt1 + dt2 ) + ( x3 - x2 ) / dt2;

				// rescale tangents for parametrization in [0,1]
				t1 *= dt1;
				t2 *= dt1;

				init( x1, x2, t1, t2 );

			},

			calc: function ( t ) {

				const t2 = t * t;
				const t3 = t2 * t;
				return c0 + c1 * t + c2 * t2 + c3 * t3;

			}

		};

	}

	//

	const tmp = /*@__PURE__*/ new Vector3();
	const px = /*@__PURE__*/ new CubicPoly();
	const py = /*@__PURE__*/ new CubicPoly();
	const pz = /*@__PURE__*/ new CubicPoly();

	class CatmullRomCurve3 extends Curve {

		constructor( points = [], closed = false, curveType = 'centripetal', tension = 0.5 ) {

			super();

			this.isCatmullRomCurve3 = true;

			this.type = 'CatmullRomCurve3';

			this.points = points;
			this.closed = closed;
			this.curveType = curveType;
			this.tension = tension;

		}

		getPoint( t, optionalTarget = new Vector3() ) {

			const point = optionalTarget;

			const points = this.points;
			const l = points.length;

			const p = ( l - ( this.closed ? 0 : 1 ) ) * t;
			let intPoint = Math.floor( p );
			let weight = p - intPoint;

			if ( this.closed ) {

				intPoint += intPoint > 0 ? 0 : ( Math.floor( Math.abs( intPoint ) / l ) + 1 ) * l;

			} else if ( weight === 0 && intPoint === l - 1 ) {

				intPoint = l - 2;
				weight = 1;

			}

			let p0, p3; // 4 points (p1 & p2 defined below)

			if ( this.closed || intPoint > 0 ) {

				p0 = points[ ( intPoint - 1 ) % l ];

			} else {

				// extrapolate first point
				tmp.subVectors( points[ 0 ], points[ 1 ] ).add( points[ 0 ] );
				p0 = tmp;

			}

			const p1 = points[ intPoint % l ];
			const p2 = points[ ( intPoint + 1 ) % l ];

			if ( this.closed || intPoint + 2 < l ) {

				p3 = points[ ( intPoint + 2 ) % l ];

			} else {

				// extrapolate last point
				tmp.subVectors( points[ l - 1 ], points[ l - 2 ] ).add( points[ l - 1 ] );
				p3 = tmp;

			}

			if ( this.curveType === 'centripetal' || this.curveType === 'chordal' ) {

				// init Centripetal / Chordal Catmull-Rom
				const pow = this.curveType === 'chordal' ? 0.5 : 0.25;
				let dt0 = Math.pow( p0.distanceToSquared( p1 ), pow );
				let dt1 = Math.pow( p1.distanceToSquared( p2 ), pow );
				let dt2 = Math.pow( p2.distanceToSquared( p3 ), pow );

				// safety check for repeated points
				if ( dt1 < 1e-4 ) dt1 = 1.0;
				if ( dt0 < 1e-4 ) dt0 = dt1;
				if ( dt2 < 1e-4 ) dt2 = dt1;

				px.initNonuniformCatmullRom( p0.x, p1.x, p2.x, p3.x, dt0, dt1, dt2 );
				py.initNonuniformCatmullRom( p0.y, p1.y, p2.y, p3.y, dt0, dt1, dt2 );
				pz.initNonuniformCatmullRom( p0.z, p1.z, p2.z, p3.z, dt0, dt1, dt2 );

			} else if ( this.curveType === 'catmullrom' ) {

				px.initCatmullRom( p0.x, p1.x, p2.x, p3.x, this.tension );
				py.initCatmullRom( p0.y, p1.y, p2.y, p3.y, this.tension );
				pz.initCatmullRom( p0.z, p1.z, p2.z, p3.z, this.tension );

			}

			point.set(
				px.calc( weight ),
				py.calc( weight ),
				pz.calc( weight )
			);

			return point;

		}

		copy( source ) {

			super.copy( source );

			this.points = [];

			for ( let i = 0, l = source.points.length; i < l; i ++ ) {

				const point = source.points[ i ];

				this.points.push( point.clone() );

			}

			this.closed = source.closed;
			this.curveType = source.curveType;
			this.tension = source.tension;

			return this;

		}

		toJSON() {

			const data = super.toJSON();

			data.points = [];

			for ( let i = 0, l = this.points.length; i < l; i ++ ) {

				const point = this.points[ i ];
				data.points.push( point.toArray() );

			}

			data.closed = this.closed;
			data.curveType = this.curveType;
			data.tension = this.tension;

			return data;

		}

		fromJSON( json ) {

			super.fromJSON( json );

			this.points = [];

			for ( let i = 0, l = json.points.length; i < l; i ++ ) {

				const point = json.points[ i ];
				this.points.push( new Vector3().fromArray( point ) );

			}

			this.closed = json.closed;
			this.curveType = json.curveType;
			this.tension = json.tension;

			return this;

		}

	}

	/**
	 * Bezier Curves formulas obtained from
	 * https://en.wikipedia.org/wiki/B%C3%A9zier_curve
	 */

	function CatmullRom( t, p0, p1, p2, p3 ) {

		const v0 = ( p2 - p0 ) * 0.5;
		const v1 = ( p3 - p1 ) * 0.5;
		const t2 = t * t;
		const t3 = t * t2;
		return ( 2 * p1 - 2 * p2 + v0 + v1 ) * t3 + ( - 3 * p1 + 3 * p2 - 2 * v0 - v1 ) * t2 + v0 * t + p1;

	}

	//

	function QuadraticBezierP0( t, p ) {

		const k = 1 - t;
		return k * k * p;

	}

	function QuadraticBezierP1( t, p ) {

		return 2 * ( 1 - t ) * t * p;

	}

	function QuadraticBezierP2( t, p ) {

		return t * t * p;

	}

	function QuadraticBezier( t, p0, p1, p2 ) {

		return QuadraticBezierP0( t, p0 ) + QuadraticBezierP1( t, p1 ) +
			QuadraticBezierP2( t, p2 );

	}

	//

	function CubicBezierP0( t, p ) {

		const k = 1 - t;
		return k * k * k * p;

	}

	function CubicBezierP1( t, p ) {

		const k = 1 - t;
		return 3 * k * k * t * p;

	}

	function CubicBezierP2( t, p ) {

		return 3 * ( 1 - t ) * t * t * p;

	}

	function CubicBezierP3( t, p ) {

		return t * t * t * p;

	}

	function CubicBezier( t, p0, p1, p2, p3 ) {

		return CubicBezierP0( t, p0 ) + CubicBezierP1( t, p1 ) + CubicBezierP2( t, p2 ) +
			CubicBezierP3( t, p3 );

	}

	class CubicBezierCurve extends Curve {

		constructor( v0 = new Vector2(), v1 = new Vector2(), v2 = new Vector2(), v3 = new Vector2() ) {

			super();

			this.isCubicBezierCurve = true;

			this.type = 'CubicBezierCurve';

			this.v0 = v0;
			this.v1 = v1;
			this.v2 = v2;
			this.v3 = v3;

		}

		getPoint( t, optionalTarget = new Vector2() ) {

			const point = optionalTarget;

			const v0 = this.v0, v1 = this.v1, v2 = this.v2, v3 = this.v3;

			point.set(
				CubicBezier( t, v0.x, v1.x, v2.x, v3.x ),
				CubicBezier( t, v0.y, v1.y, v2.y, v3.y )
			);

			return point;

		}

		copy( source ) {

			super.copy( source );

			this.v0.copy( source.v0 );
			this.v1.copy( source.v1 );
			this.v2.copy( source.v2 );
			this.v3.copy( source.v3 );

			return this;

		}

		toJSON() {

			const data = super.toJSON();

			data.v0 = this.v0.toArray();
			data.v1 = this.v1.toArray();
			data.v2 = this.v2.toArray();
			data.v3 = this.v3.toArray();

			return data;

		}

		fromJSON( json ) {

			super.fromJSON( json );

			this.v0.fromArray( json.v0 );
			this.v1.fromArray( json.v1 );
			this.v2.fromArray( json.v2 );
			this.v3.fromArray( json.v3 );

			return this;

		}

	}

	class CubicBezierCurve3 extends Curve {

		constructor( v0 = new Vector3(), v1 = new Vector3(), v2 = new Vector3(), v3 = new Vector3() ) {

			super();

			this.isCubicBezierCurve3 = true;

			this.type = 'CubicBezierCurve3';

			this.v0 = v0;
			this.v1 = v1;
			this.v2 = v2;
			this.v3 = v3;

		}

		getPoint( t, optionalTarget = new Vector3() ) {

			const point = optionalTarget;

			const v0 = this.v0, v1 = this.v1, v2 = this.v2, v3 = this.v3;

			point.set(
				CubicBezier( t, v0.x, v1.x, v2.x, v3.x ),
				CubicBezier( t, v0.y, v1.y, v2.y, v3.y ),
				CubicBezier( t, v0.z, v1.z, v2.z, v3.z )
			);

			return point;

		}

		copy( source ) {

			super.copy( source );

			this.v0.copy( source.v0 );
			this.v1.copy( source.v1 );
			this.v2.copy( source.v2 );
			this.v3.copy( source.v3 );

			return this;

		}

		toJSON() {

			const data = super.toJSON();

			data.v0 = this.v0.toArray();
			data.v1 = this.v1.toArray();
			data.v2 = this.v2.toArray();
			data.v3 = this.v3.toArray();

			return data;

		}

		fromJSON( json ) {

			super.fromJSON( json );

			this.v0.fromArray( json.v0 );
			this.v1.fromArray( json.v1 );
			this.v2.fromArray( json.v2 );
			this.v3.fromArray( json.v3 );

			return this;

		}

	}

	class LineCurve extends Curve {

		constructor( v1 = new Vector2(), v2 = new Vector2() ) {

			super();

			this.isLineCurve = true;

			this.type = 'LineCurve';

			this.v1 = v1;
			this.v2 = v2;

		}

		getPoint( t, optionalTarget = new Vector2() ) {

			const point = optionalTarget;

			if ( t === 1 ) {

				point.copy( this.v2 );

			} else {

				point.copy( this.v2 ).sub( this.v1 );
				point.multiplyScalar( t ).add( this.v1 );

			}

			return point;

		}

		// Line curve is linear, so we can overwrite default getPointAt
		getPointAt( u, optionalTarget ) {

			return this.getPoint( u, optionalTarget );

		}

		getTangent( t, optionalTarget = new Vector2() ) {

			return optionalTarget.subVectors( this.v2, this.v1 ).normalize();

		}

		getTangentAt( u, optionalTarget ) {

			return this.getTangent( u, optionalTarget );

		}

		copy( source ) {

			super.copy( source );

			this.v1.copy( source.v1 );
			this.v2.copy( source.v2 );

			return this;

		}

		toJSON() {

			const data = super.toJSON();

			data.v1 = this.v1.toArray();
			data.v2 = this.v2.toArray();

			return data;

		}

		fromJSON( json ) {

			super.fromJSON( json );

			this.v1.fromArray( json.v1 );
			this.v2.fromArray( json.v2 );

			return this;

		}

	}

	class LineCurve3 extends Curve {

		constructor( v1 = new Vector3(), v2 = new Vector3() ) {

			super();

			this.isLineCurve3 = true;

			this.type = 'LineCurve3';

			this.v1 = v1;
			this.v2 = v2;

		}

		getPoint( t, optionalTarget = new Vector3() ) {

			const point = optionalTarget;

			if ( t === 1 ) {

				point.copy( this.v2 );

			} else {

				point.copy( this.v2 ).sub( this.v1 );
				point.multiplyScalar( t ).add( this.v1 );

			}

			return point;

		}

		// Line curve is linear, so we can overwrite default getPointAt
		getPointAt( u, optionalTarget ) {

			return this.getPoint( u, optionalTarget );

		}

		getTangent( t, optionalTarget = new Vector3() ) {

			return optionalTarget.subVectors( this.v2, this.v1 ).normalize();

		}

		getTangentAt( u, optionalTarget ) {

			return this.getTangent( u, optionalTarget );

		}

		copy( source ) {

			super.copy( source );

			this.v1.copy( source.v1 );
			this.v2.copy( source.v2 );

			return this;

		}

		toJSON() {

			const data = super.toJSON();

			data.v1 = this.v1.toArray();
			data.v2 = this.v2.toArray();

			return data;

		}

		fromJSON( json ) {

			super.fromJSON( json );

			this.v1.fromArray( json.v1 );
			this.v2.fromArray( json.v2 );

			return this;

		}

	}

	class QuadraticBezierCurve extends Curve {

		constructor( v0 = new Vector2(), v1 = new Vector2(), v2 = new Vector2() ) {

			super();

			this.isQuadraticBezierCurve = true;

			this.type = 'QuadraticBezierCurve';

			this.v0 = v0;
			this.v1 = v1;
			this.v2 = v2;

		}

		getPoint( t, optionalTarget = new Vector2() ) {

			const point = optionalTarget;

			const v0 = this.v0, v1 = this.v1, v2 = this.v2;

			point.set(
				QuadraticBezier( t, v0.x, v1.x, v2.x ),
				QuadraticBezier( t, v0.y, v1.y, v2.y )
			);

			return point;

		}

		copy( source ) {

			super.copy( source );

			this.v0.copy( source.v0 );
			this.v1.copy( source.v1 );
			this.v2.copy( source.v2 );

			return this;

		}

		toJSON() {

			const data = super.toJSON();

			data.v0 = this.v0.toArray();
			data.v1 = this.v1.toArray();
			data.v2 = this.v2.toArray();

			return data;

		}

		fromJSON( json ) {

			super.fromJSON( json );

			this.v0.fromArray( json.v0 );
			this.v1.fromArray( json.v1 );
			this.v2.fromArray( json.v2 );

			return this;

		}

	}

	class QuadraticBezierCurve3 extends Curve {

		constructor( v0 = new Vector3(), v1 = new Vector3(), v2 = new Vector3() ) {

			super();

			this.isQuadraticBezierCurve3 = true;

			this.type = 'QuadraticBezierCurve3';

			this.v0 = v0;
			this.v1 = v1;
			this.v2 = v2;

		}

		getPoint( t, optionalTarget = new Vector3() ) {

			const point = optionalTarget;

			const v0 = this.v0, v1 = this.v1, v2 = this.v2;

			point.set(
				QuadraticBezier( t, v0.x, v1.x, v2.x ),
				QuadraticBezier( t, v0.y, v1.y, v2.y ),
				QuadraticBezier( t, v0.z, v1.z, v2.z )
			);

			return point;

		}

		copy( source ) {

			super.copy( source );

			this.v0.copy( source.v0 );
			this.v1.copy( source.v1 );
			this.v2.copy( source.v2 );

			return this;

		}

		toJSON() {

			const data = super.toJSON();

			data.v0 = this.v0.toArray();
			data.v1 = this.v1.toArray();
			data.v2 = this.v2.toArray();

			return data;

		}

		fromJSON( json ) {

			super.fromJSON( json );

			this.v0.fromArray( json.v0 );
			this.v1.fromArray( json.v1 );
			this.v2.fromArray( json.v2 );

			return this;

		}

	}

	class SplineCurve extends Curve {

		constructor( points = [] ) {

			super();

			this.isSplineCurve = true;

			this.type = 'SplineCurve';

			this.points = points;

		}

		getPoint( t, optionalTarget = new Vector2() ) {

			const point = optionalTarget;

			const points = this.points;
			const p = ( points.length - 1 ) * t;

			const intPoint = Math.floor( p );
			const weight = p - intPoint;

			const p0 = points[ intPoint === 0 ? intPoint : intPoint - 1 ];
			const p1 = points[ intPoint ];
			const p2 = points[ intPoint > points.length - 2 ? points.length - 1 : intPoint + 1 ];
			const p3 = points[ intPoint > points.length - 3 ? points.length - 1 : intPoint + 2 ];

			point.set(
				CatmullRom( weight, p0.x, p1.x, p2.x, p3.x ),
				CatmullRom( weight, p0.y, p1.y, p2.y, p3.y )
			);

			return point;

		}

		copy( source ) {

			super.copy( source );

			this.points = [];

			for ( let i = 0, l = source.points.length; i < l; i ++ ) {

				const point = source.points[ i ];

				this.points.push( point.clone() );

			}

			return this;

		}

		toJSON() {

			const data = super.toJSON();

			data.points = [];

			for ( let i = 0, l = this.points.length; i < l; i ++ ) {

				const point = this.points[ i ];
				data.points.push( point.toArray() );

			}

			return data;

		}

		fromJSON( json ) {

			super.fromJSON( json );

			this.points = [];

			for ( let i = 0, l = json.points.length; i < l; i ++ ) {

				const point = json.points[ i ];
				this.points.push( new Vector2().fromArray( point ) );

			}

			return this;

		}

	}

	var Curves = /*#__PURE__*/Object.freeze({
		__proto__: null,
		ArcCurve: ArcCurve,
		CatmullRomCurve3: CatmullRomCurve3,
		CubicBezierCurve: CubicBezierCurve,
		CubicBezierCurve3: CubicBezierCurve3,
		EllipseCurve: EllipseCurve,
		LineCurve: LineCurve,
		LineCurve3: LineCurve3,
		QuadraticBezierCurve: QuadraticBezierCurve,
		QuadraticBezierCurve3: QuadraticBezierCurve3,
		SplineCurve: SplineCurve
	});

	/**************************************************************
	 *	Curved Path - a curve path is simply a array of connected
	 *  curves, but retains the api of a curve
	 **************************************************************/

	class CurvePath extends Curve {

		constructor() {

			super();

			this.type = 'CurvePath';

			this.curves = [];
			this.autoClose = false; // Automatically closes the path

		}

		add( curve ) {

			this.curves.push( curve );

		}

		closePath() {

			// Add a line curve if start and end of lines are not connected
			const startPoint = this.curves[ 0 ].getPoint( 0 );
			const endPoint = this.curves[ this.curves.length - 1 ].getPoint( 1 );

			if ( ! startPoint.equals( endPoint ) ) {

				const lineType = ( startPoint.isVector2 === true ) ? 'LineCurve' : 'LineCurve3';
				this.curves.push( new Curves[ lineType ]( endPoint, startPoint ) );

			}

			return this;

		}

		// To get accurate point with reference to
		// entire path distance at time t,
		// following has to be done:

		// 1. Length of each sub path have to be known
		// 2. Locate and identify type of curve
		// 3. Get t for the curve
		// 4. Return curve.getPointAt(t')

		getPoint( t, optionalTarget ) {

			const d = t * this.getLength();
			const curveLengths = this.getCurveLengths();
			let i = 0;

			// To think about boundaries points.

			while ( i < curveLengths.length ) {

				if ( curveLengths[ i ] >= d ) {

					const diff = curveLengths[ i ] - d;
					const curve = this.curves[ i ];

					const segmentLength = curve.getLength();
					const u = segmentLength === 0 ? 0 : 1 - diff / segmentLength;

					return curve.getPointAt( u, optionalTarget );

				}

				i ++;

			}

			return null;

			// loop where sum != 0, sum > d , sum+1 <d

		}

		// We cannot use the default THREE.Curve getPoint() with getLength() because in
		// THREE.Curve, getLength() depends on getPoint() but in THREE.CurvePath
		// getPoint() depends on getLength

		getLength() {

			const lens = this.getCurveLengths();
			return lens[ lens.length - 1 ];

		}

		// cacheLengths must be recalculated.
		updateArcLengths() {

			this.needsUpdate = true;
			this.cacheLengths = null;
			this.getCurveLengths();

		}

		// Compute lengths and cache them
		// We cannot overwrite getLengths() because UtoT mapping uses it.

		getCurveLengths() {

			// We use cache values if curves and cache array are same length

			if ( this.cacheLengths && this.cacheLengths.length === this.curves.length ) {

				return this.cacheLengths;

			}

			// Get length of sub-curve
			// Push sums into cached array

			const lengths = [];
			let sums = 0;

			for ( let i = 0, l = this.curves.length; i < l; i ++ ) {

				sums += this.curves[ i ].getLength();
				lengths.push( sums );

			}

			this.cacheLengths = lengths;

			return lengths;

		}

		getSpacedPoints( divisions = 40 ) {

			const points = [];

			for ( let i = 0; i <= divisions; i ++ ) {

				points.push( this.getPoint( i / divisions ) );

			}

			if ( this.autoClose ) {

				points.push( points[ 0 ] );

			}

			return points;

		}

		getPoints( divisions = 12 ) {

			const points = [];
			let last;

			for ( let i = 0, curves = this.curves; i < curves.length; i ++ ) {

				const curve = curves[ i ];
				const resolution = curve.isEllipseCurve ? divisions * 2
					: ( curve.isLineCurve || curve.isLineCurve3 ) ? 1
						: curve.isSplineCurve ? divisions * curve.points.length
							: divisions;

				const pts = curve.getPoints( resolution );

				for ( let j = 0; j < pts.length; j ++ ) {

					const point = pts[ j ];

					if ( last && last.equals( point ) ) continue; // ensures no consecutive points are duplicates

					points.push( point );
					last = point;

				}

			}

			if ( this.autoClose && points.length > 1 && ! points[ points.length - 1 ].equals( points[ 0 ] ) ) {

				points.push( points[ 0 ] );

			}

			return points;

		}

		copy( source ) {

			super.copy( source );

			this.curves = [];

			for ( let i = 0, l = source.curves.length; i < l; i ++ ) {

				const curve = source.curves[ i ];

				this.curves.push( curve.clone() );

			}

			this.autoClose = source.autoClose;

			return this;

		}

		toJSON() {

			const data = super.toJSON();

			data.autoClose = this.autoClose;
			data.curves = [];

			for ( let i = 0, l = this.curves.length; i < l; i ++ ) {

				const curve = this.curves[ i ];
				data.curves.push( curve.toJSON() );

			}

			return data;

		}

		fromJSON( json ) {

			super.fromJSON( json );

			this.autoClose = json.autoClose;
			this.curves = [];

			for ( let i = 0, l = json.curves.length; i < l; i ++ ) {

				const curve = json.curves[ i ];
				this.curves.push( new Curves[ curve.type ]().fromJSON( curve ) );

			}

			return this;

		}

	}

	class Path extends CurvePath {

		constructor( points ) {

			super();

			this.type = 'Path';

			this.currentPoint = new Vector2();

			if ( points ) {

				this.setFromPoints( points );

			}

		}

		setFromPoints( points ) {

			this.moveTo( points[ 0 ].x, points[ 0 ].y );

			for ( let i = 1, l = points.length; i < l; i ++ ) {

				this.lineTo( points[ i ].x, points[ i ].y );

			}

			return this;

		}

		moveTo( x, y ) {

			this.currentPoint.set( x, y ); // TODO consider referencing vectors instead of copying?

			return this;

		}

		lineTo( x, y ) {

			const curve = new LineCurve( this.currentPoint.clone(), new Vector2( x, y ) );
			this.curves.push( curve );

			this.currentPoint.set( x, y );

			return this;

		}

		quadraticCurveTo( aCPx, aCPy, aX, aY ) {

			const curve = new QuadraticBezierCurve(
				this.currentPoint.clone(),
				new Vector2( aCPx, aCPy ),
				new Vector2( aX, aY )
			);

			this.curves.push( curve );

			this.currentPoint.set( aX, aY );

			return this;

		}

		bezierCurveTo( aCP1x, aCP1y, aCP2x, aCP2y, aX, aY ) {

			const curve = new CubicBezierCurve(
				this.currentPoint.clone(),
				new Vector2( aCP1x, aCP1y ),
				new Vector2( aCP2x, aCP2y ),
				new Vector2( aX, aY )
			);

			this.curves.push( curve );

			this.currentPoint.set( aX, aY );

			return this;

		}

		splineThru( pts /*Array of Vector*/ ) {

			const npts = [ this.currentPoint.clone() ].concat( pts );

			const curve = new SplineCurve( npts );
			this.curves.push( curve );

			this.currentPoint.copy( pts[ pts.length - 1 ] );

			return this;

		}

		arc( aX, aY, aRadius, aStartAngle, aEndAngle, aClockwise ) {

			const x0 = this.currentPoint.x;
			const y0 = this.currentPoint.y;

			this.absarc( aX + x0, aY + y0, aRadius,
				aStartAngle, aEndAngle, aClockwise );

			return this;

		}

		absarc( aX, aY, aRadius, aStartAngle, aEndAngle, aClockwise ) {

			this.absellipse( aX, aY, aRadius, aRadius, aStartAngle, aEndAngle, aClockwise );

			return this;

		}

		ellipse( aX, aY, xRadius, yRadius, aStartAngle, aEndAngle, aClockwise, aRotation ) {

			const x0 = this.currentPoint.x;
			const y0 = this.currentPoint.y;

			this.absellipse( aX + x0, aY + y0, xRadius, yRadius, aStartAngle, aEndAngle, aClockwise, aRotation );

			return this;

		}

		absellipse( aX, aY, xRadius, yRadius, aStartAngle, aEndAngle, aClockwise, aRotation ) {

			const curve = new EllipseCurve( aX, aY, xRadius, yRadius, aStartAngle, aEndAngle, aClockwise, aRotation );

			if ( this.curves.length > 0 ) {

				// if a previous curve is present, attempt to join
				const firstPoint = curve.getPoint( 0 );

				if ( ! firstPoint.equals( this.currentPoint ) ) {

					this.lineTo( firstPoint.x, firstPoint.y );

				}

			}

			this.curves.push( curve );

			const lastPoint = curve.getPoint( 1 );
			this.currentPoint.copy( lastPoint );

			return this;

		}

		copy( source ) {

			super.copy( source );

			this.currentPoint.copy( source.currentPoint );

			return this;

		}

		toJSON() {

			const data = super.toJSON();

			data.currentPoint = this.currentPoint.toArray();

			return data;

		}

		fromJSON( json ) {

			super.fromJSON( json );

			this.currentPoint.fromArray( json.currentPoint );

			return this;

		}

	}

    class Shape extends Path {

		constructor( points ) {

			super( points );

			this.uuid = generateUUID();

			this.type = 'Shape';

			this.holes = [];

		}

		getPointsHoles( divisions ) {

			const holesPts = [];

			for ( let i = 0, l = this.holes.length; i < l; i ++ ) {

				holesPts[ i ] = this.holes[ i ].getPoints( divisions );

			}

			return holesPts;

		}

		// get points of shape and holes (keypoints based on segments parameter)

		extractPoints( divisions ) {

			return {

				shape: this.getPoints( divisions ),
				holes: this.getPointsHoles( divisions )

			};

		}

		copy( source ) {

			super.copy( source );

			this.holes = [];

			for ( let i = 0, l = source.holes.length; i < l; i ++ ) {

				const hole = source.holes[ i ];

				this.holes.push( hole.clone() );

			}

			return this;

		}

		toJSON() {

			const data = super.toJSON();

			data.uuid = this.uuid;
			data.holes = [];

			for ( let i = 0, l = this.holes.length; i < l; i ++ ) {

				const hole = this.holes[ i ];
				data.holes.push( hole.toJSON() );

			}

			return data;

		}

		fromJSON( json ) {

			super.fromJSON( json );

			this.uuid = json.uuid;
			this.holes = [];

			for ( let i = 0, l = json.holes.length; i < l; i ++ ) {

				const hole = json.holes[ i ];
				this.holes.push( new Path().fromJSON( hole ) );

			}

			return this;

		}

	}

	/**
	 * Port from https://github.com/mapbox/earcut (v2.2.4)
	 */

	const Earcut = {

		triangulate: function ( data, holeIndices, dim = 2 ) {

			const hasHoles = holeIndices && holeIndices.length;
			const outerLen = hasHoles ? holeIndices[ 0 ] * dim : data.length;
			let outerNode = linkedList( data, 0, outerLen, dim, true );
			const triangles = [];

			if ( ! outerNode || outerNode.next === outerNode.prev ) return triangles;

			let minX, minY, maxX, maxY, x, y, invSize;

			if ( hasHoles ) outerNode = eliminateHoles( data, holeIndices, outerNode, dim );

			// if the shape is not too simple, we'll use z-order curve hash later; calculate polygon bbox
			if ( data.length > 80 * dim ) {

				minX = maxX = data[ 0 ];
				minY = maxY = data[ 1 ];

				for ( let i = dim; i < outerLen; i += dim ) {

					x = data[ i ];
					y = data[ i + 1 ];
					if ( x < minX ) minX = x;
					if ( y < minY ) minY = y;
					if ( x > maxX ) maxX = x;
					if ( y > maxY ) maxY = y;

				}

				// minX, minY and invSize are later used to transform coords into integers for z-order calculation
				invSize = Math.max( maxX - minX, maxY - minY );
				invSize = invSize !== 0 ? 32767 / invSize : 0;

			}

			earcutLinked( outerNode, triangles, dim, minX, minY, invSize, 0 );

			return triangles;

		}

	};

	// create a circular doubly linked list from polygon points in the specified winding order
	function linkedList( data, start, end, dim, clockwise ) {

		let i, last;

		if ( clockwise === ( signedArea( data, start, end, dim ) > 0 ) ) {

			for ( i = start; i < end; i += dim ) last = insertNode( i, data[ i ], data[ i + 1 ], last );

		} else {

			for ( i = end - dim; i >= start; i -= dim ) last = insertNode( i, data[ i ], data[ i + 1 ], last );

		}

		if ( last && equals( last, last.next ) ) {

			removeNode( last );
			last = last.next;

		}

		return last;

	}

	// eliminate colinear or duplicate points
	function filterPoints( start, end ) {

		if ( ! start ) return start;
		if ( ! end ) end = start;

		let p = start,
			again;
		do {

			again = false;

			if ( ! p.steiner && ( equals( p, p.next ) || area( p.prev, p, p.next ) === 0 ) ) {

				removeNode( p );
				p = end = p.prev;
				if ( p === p.next ) break;
				again = true;

			} else {

				p = p.next;

			}

		} while ( again || p !== end );

		return end;

	}

	// main ear slicing loop which triangulates a polygon (given as a linked list)
	function earcutLinked( ear, triangles, dim, minX, minY, invSize, pass ) {

		if ( ! ear ) return;

		// interlink polygon nodes in z-order
		if ( ! pass && invSize ) indexCurve( ear, minX, minY, invSize );

		let stop = ear,
			prev, next;

		// iterate through ears, slicing them one by one
		while ( ear.prev !== ear.next ) {

			prev = ear.prev;
			next = ear.next;

			if ( invSize ? isEarHashed( ear, minX, minY, invSize ) : isEar( ear ) ) {

				// cut off the triangle
				triangles.push( prev.i / dim | 0 );
				triangles.push( ear.i / dim | 0 );
				triangles.push( next.i / dim | 0 );

				removeNode( ear );

				// skipping the next vertex leads to less sliver triangles
				ear = next.next;
				stop = next.next;

				continue;

			}

			ear = next;

			// if we looped through the whole remaining polygon and can't find any more ears
			if ( ear === stop ) {

				// try filtering points and slicing again
				if ( ! pass ) {

					earcutLinked( filterPoints( ear ), triangles, dim, minX, minY, invSize, 1 );

					// if this didn't work, try curing all small self-intersections locally

				} else if ( pass === 1 ) {

					ear = cureLocalIntersections( filterPoints( ear ), triangles, dim );
					earcutLinked( ear, triangles, dim, minX, minY, invSize, 2 );

					// as a last resort, try splitting the remaining polygon into two

				} else if ( pass === 2 ) {

					splitEarcut( ear, triangles, dim, minX, minY, invSize );

				}

				break;

			}

		}

	}

	// check whether a polygon node forms a valid ear with adjacent nodes
	function isEar( ear ) {

		const a = ear.prev,
			b = ear,
			c = ear.next;

		if ( area( a, b, c ) >= 0 ) return false; // reflex, can't be an ear

		// now make sure we don't have other points inside the potential ear
		const ax = a.x, bx = b.x, cx = c.x, ay = a.y, by = b.y, cy = c.y;

		// triangle bbox; min & max are calculated like this for speed
		const x0 = ax < bx ? ( ax < cx ? ax : cx ) : ( bx < cx ? bx : cx ),
			y0 = ay < by ? ( ay < cy ? ay : cy ) : ( by < cy ? by : cy ),
			x1 = ax > bx ? ( ax > cx ? ax : cx ) : ( bx > cx ? bx : cx ),
			y1 = ay > by ? ( ay > cy ? ay : cy ) : ( by > cy ? by : cy );

		let p = c.next;
		while ( p !== a ) {

			if ( p.x >= x0 && p.x <= x1 && p.y >= y0 && p.y <= y1 &&
				pointInTriangle( ax, ay, bx, by, cx, cy, p.x, p.y ) &&
				area( p.prev, p, p.next ) >= 0 ) return false;
			p = p.next;

		}

		return true;

	}

	function isEarHashed( ear, minX, minY, invSize ) {

		const a = ear.prev,
			b = ear,
			c = ear.next;

		if ( area( a, b, c ) >= 0 ) return false; // reflex, can't be an ear

		const ax = a.x, bx = b.x, cx = c.x, ay = a.y, by = b.y, cy = c.y;

		// triangle bbox; min & max are calculated like this for speed
		const x0 = ax < bx ? ( ax < cx ? ax : cx ) : ( bx < cx ? bx : cx ),
			y0 = ay < by ? ( ay < cy ? ay : cy ) : ( by < cy ? by : cy ),
			x1 = ax > bx ? ( ax > cx ? ax : cx ) : ( bx > cx ? bx : cx ),
			y1 = ay > by ? ( ay > cy ? ay : cy ) : ( by > cy ? by : cy );

		// z-order range for the current triangle bbox;
		const minZ = zOrder( x0, y0, minX, minY, invSize ),
			maxZ = zOrder( x1, y1, minX, minY, invSize );

		let p = ear.prevZ,
			n = ear.nextZ;

		// look for points inside the triangle in both directions
		while ( p && p.z >= minZ && n && n.z <= maxZ ) {

			if ( p.x >= x0 && p.x <= x1 && p.y >= y0 && p.y <= y1 && p !== a && p !== c &&
				pointInTriangle( ax, ay, bx, by, cx, cy, p.x, p.y ) && area( p.prev, p, p.next ) >= 0 ) return false;
			p = p.prevZ;

			if ( n.x >= x0 && n.x <= x1 && n.y >= y0 && n.y <= y1 && n !== a && n !== c &&
				pointInTriangle( ax, ay, bx, by, cx, cy, n.x, n.y ) && area( n.prev, n, n.next ) >= 0 ) return false;
			n = n.nextZ;

		}

		// look for remaining points in decreasing z-order
		while ( p && p.z >= minZ ) {

			if ( p.x >= x0 && p.x <= x1 && p.y >= y0 && p.y <= y1 && p !== a && p !== c &&
				pointInTriangle( ax, ay, bx, by, cx, cy, p.x, p.y ) && area( p.prev, p, p.next ) >= 0 ) return false;
			p = p.prevZ;

		}

		// look for remaining points in increasing z-order
		while ( n && n.z <= maxZ ) {

			if ( n.x >= x0 && n.x <= x1 && n.y >= y0 && n.y <= y1 && n !== a && n !== c &&
				pointInTriangle( ax, ay, bx, by, cx, cy, n.x, n.y ) && area( n.prev, n, n.next ) >= 0 ) return false;
			n = n.nextZ;

		}

		return true;

	}

	// go through all polygon nodes and cure small local self-intersections
	function cureLocalIntersections( start, triangles, dim ) {

		let p = start;
		do {

			const a = p.prev,
				b = p.next.next;

			if ( ! equals( a, b ) && intersects( a, p, p.next, b ) && locallyInside( a, b ) && locallyInside( b, a ) ) {

				triangles.push( a.i / dim | 0 );
				triangles.push( p.i / dim | 0 );
				triangles.push( b.i / dim | 0 );

				// remove two nodes involved
				removeNode( p );
				removeNode( p.next );

				p = start = b;

			}

			p = p.next;

		} while ( p !== start );

		return filterPoints( p );

	}

	// try splitting polygon into two and triangulate them independently
	function splitEarcut( start, triangles, dim, minX, minY, invSize ) {

		// look for a valid diagonal that divides the polygon into two
		let a = start;
		do {

			let b = a.next.next;
			while ( b !== a.prev ) {

				if ( a.i !== b.i && isValidDiagonal( a, b ) ) {

					// split the polygon in two by the diagonal
					let c = splitPolygon( a, b );

					// filter colinear points around the cuts
					a = filterPoints( a, a.next );
					c = filterPoints( c, c.next );

					// run earcut on each half
					earcutLinked( a, triangles, dim, minX, minY, invSize, 0 );
					earcutLinked( c, triangles, dim, minX, minY, invSize, 0 );
					return;

				}

				b = b.next;

			}

			a = a.next;

		} while ( a !== start );

	}

	// link every hole into the outer loop, producing a single-ring polygon without holes
	function eliminateHoles( data, holeIndices, outerNode, dim ) {

		const queue = [];
		let i, len, start, end, list;

		for ( i = 0, len = holeIndices.length; i < len; i ++ ) {

			start = holeIndices[ i ] * dim;
			end = i < len - 1 ? holeIndices[ i + 1 ] * dim : data.length;
			list = linkedList( data, start, end, dim, false );
			if ( list === list.next ) list.steiner = true;
			queue.push( getLeftmost( list ) );

		}

		queue.sort( compareX );

		// process holes from left to right
		for ( i = 0; i < queue.length; i ++ ) {

			outerNode = eliminateHole( queue[ i ], outerNode );

		}

		return outerNode;

	}

	function compareX( a, b ) {

		return a.x - b.x;

	}

	// find a bridge between vertices that connects hole with an outer ring and link it
	function eliminateHole( hole, outerNode ) {

		const bridge = findHoleBridge( hole, outerNode );
		if ( ! bridge ) {

			return outerNode;

		}

		const bridgeReverse = splitPolygon( bridge, hole );

		// filter collinear points around the cuts
		filterPoints( bridgeReverse, bridgeReverse.next );
		return filterPoints( bridge, bridge.next );

	}

	// David Eberly's algorithm for finding a bridge between hole and outer polygon
	function findHoleBridge( hole, outerNode ) {

		let p = outerNode,
			qx = - Infinity,
			m;

		const hx = hole.x, hy = hole.y;

		// find a segment intersected by a ray from the hole's leftmost point to the left;
		// segment's endpoint with lesser x will be potential connection point
		do {

			if ( hy <= p.y && hy >= p.next.y && p.next.y !== p.y ) {

				const x = p.x + ( hy - p.y ) * ( p.next.x - p.x ) / ( p.next.y - p.y );
				if ( x <= hx && x > qx ) {

					qx = x;
					m = p.x < p.next.x ? p : p.next;
					if ( x === hx ) return m; // hole touches outer segment; pick leftmost endpoint

				}

			}

			p = p.next;

		} while ( p !== outerNode );

		if ( ! m ) return null;

		// look for points inside the triangle of hole point, segment intersection and endpoint;
		// if there are no points found, we have a valid connection;
		// otherwise choose the point of the minimum angle with the ray as connection point

		const stop = m,
			mx = m.x,
			my = m.y;
		let tanMin = Infinity, tan;

		p = m;

		do {

			if ( hx >= p.x && p.x >= mx && hx !== p.x &&
					pointInTriangle( hy < my ? hx : qx, hy, mx, my, hy < my ? qx : hx, hy, p.x, p.y ) ) {

				tan = Math.abs( hy - p.y ) / ( hx - p.x ); // tangential

				if ( locallyInside( p, hole ) && ( tan < tanMin || ( tan === tanMin && ( p.x > m.x || ( p.x === m.x && sectorContainsSector( m, p ) ) ) ) ) ) {

					m = p;
					tanMin = tan;

				}

			}

			p = p.next;

		} while ( p !== stop );

		return m;

	}

	// whether sector in vertex m contains sector in vertex p in the same coordinates
	function sectorContainsSector( m, p ) {

		return area( m.prev, m, p.prev ) < 0 && area( p.next, m, m.next ) < 0;

	}

	// interlink polygon nodes in z-order
	function indexCurve( start, minX, minY, invSize ) {

		let p = start;
		do {

			if ( p.z === 0 ) p.z = zOrder( p.x, p.y, minX, minY, invSize );
			p.prevZ = p.prev;
			p.nextZ = p.next;
			p = p.next;

		} while ( p !== start );

		p.prevZ.nextZ = null;
		p.prevZ = null;

		sortLinked( p );

	}

	// Simon Tatham's linked list merge sort algorithm
	// http://www.chiark.greenend.org.uk/~sgtatham/algorithms/listsort.html
	function sortLinked( list ) {

		let i, p, q, e, tail, numMerges, pSize, qSize,
			inSize = 1;

		do {

			p = list;
			list = null;
			tail = null;
			numMerges = 0;

			while ( p ) {

				numMerges ++;
				q = p;
				pSize = 0;
				for ( i = 0; i < inSize; i ++ ) {

					pSize ++;
					q = q.nextZ;
					if ( ! q ) break;

				}

				qSize = inSize;

				while ( pSize > 0 || ( qSize > 0 && q ) ) {

					if ( pSize !== 0 && ( qSize === 0 || ! q || p.z <= q.z ) ) {

						e = p;
						p = p.nextZ;
						pSize --;

					} else {

						e = q;
						q = q.nextZ;
						qSize --;

					}

					if ( tail ) tail.nextZ = e;
					else list = e;

					e.prevZ = tail;
					tail = e;

				}

				p = q;

			}

			tail.nextZ = null;
			inSize *= 2;

		} while ( numMerges > 1 );

		return list;

	}

	// z-order of a point given coords and inverse of the longer side of data bbox
	function zOrder( x, y, minX, minY, invSize ) {

		// coords are transformed into non-negative 15-bit integer range
		x = ( x - minX ) * invSize | 0;
		y = ( y - minY ) * invSize | 0;

		x = ( x | ( x << 8 ) ) & 0x00FF00FF;
		x = ( x | ( x << 4 ) ) & 0x0F0F0F0F;
		x = ( x | ( x << 2 ) ) & 0x33333333;
		x = ( x | ( x << 1 ) ) & 0x55555555;

		y = ( y | ( y << 8 ) ) & 0x00FF00FF;
		y = ( y | ( y << 4 ) ) & 0x0F0F0F0F;
		y = ( y | ( y << 2 ) ) & 0x33333333;
		y = ( y | ( y << 1 ) ) & 0x55555555;

		return x | ( y << 1 );

	}

	// find the leftmost node of a polygon ring
	function getLeftmost( start ) {

		let p = start,
			leftmost = start;
		do {

			if ( p.x < leftmost.x || ( p.x === leftmost.x && p.y < leftmost.y ) ) leftmost = p;
			p = p.next;

		} while ( p !== start );

		return leftmost;

	}

	// check if a point lies within a convex triangle
	function pointInTriangle( ax, ay, bx, by, cx, cy, px, py ) {

		return ( cx - px ) * ( ay - py ) >= ( ax - px ) * ( cy - py ) &&
	           ( ax - px ) * ( by - py ) >= ( bx - px ) * ( ay - py ) &&
	           ( bx - px ) * ( cy - py ) >= ( cx - px ) * ( by - py );

	}

	// check if a diagonal between two polygon nodes is valid (lies in polygon interior)
	function isValidDiagonal( a, b ) {

		return a.next.i !== b.i && a.prev.i !== b.i && ! intersectsPolygon( a, b ) && // dones't intersect other edges
	           ( locallyInside( a, b ) && locallyInside( b, a ) && middleInside( a, b ) && // locally visible
	            ( area( a.prev, a, b.prev ) || area( a, b.prev, b ) ) || // does not create opposite-facing sectors
	            equals( a, b ) && area( a.prev, a, a.next ) > 0 && area( b.prev, b, b.next ) > 0 ); // special zero-length case

	}

	// signed area of a triangle
	function area( p, q, r ) {

		return ( q.y - p.y ) * ( r.x - q.x ) - ( q.x - p.x ) * ( r.y - q.y );

	}

	// check if two points are equal
	function equals( p1, p2 ) {

		return p1.x === p2.x && p1.y === p2.y;

	}

	// check if two segments intersect
	function intersects( p1, q1, p2, q2 ) {

		const o1 = sign( area( p1, q1, p2 ) );
		const o2 = sign( area( p1, q1, q2 ) );
		const o3 = sign( area( p2, q2, p1 ) );
		const o4 = sign( area( p2, q2, q1 ) );

		if ( o1 !== o2 && o3 !== o4 ) return true; // general case

		if ( o1 === 0 && onSegment( p1, p2, q1 ) ) return true; // p1, q1 and p2 are collinear and p2 lies on p1q1
		if ( o2 === 0 && onSegment( p1, q2, q1 ) ) return true; // p1, q1 and q2 are collinear and q2 lies on p1q1
		if ( o3 === 0 && onSegment( p2, p1, q2 ) ) return true; // p2, q2 and p1 are collinear and p1 lies on p2q2
		if ( o4 === 0 && onSegment( p2, q1, q2 ) ) return true; // p2, q2 and q1 are collinear and q1 lies on p2q2

		return false;

	}

	// for collinear points p, q, r, check if point q lies on segment pr
	function onSegment( p, q, r ) {

		return q.x <= Math.max( p.x, r.x ) && q.x >= Math.min( p.x, r.x ) && q.y <= Math.max( p.y, r.y ) && q.y >= Math.min( p.y, r.y );

	}

	function sign( num ) {

		return num > 0 ? 1 : num < 0 ? - 1 : 0;

	}

	// check if a polygon diagonal intersects any polygon segments
	function intersectsPolygon( a, b ) {

		let p = a;
		do {

			if ( p.i !== a.i && p.next.i !== a.i && p.i !== b.i && p.next.i !== b.i &&
				intersects( p, p.next, a, b ) ) return true;
			p = p.next;

		} while ( p !== a );

		return false;

	}

	// check if a polygon diagonal is locally inside the polygon
	function locallyInside( a, b ) {

		return area( a.prev, a, a.next ) < 0 ?
			area( a, b, a.next ) >= 0 && area( a, a.prev, b ) >= 0 :
			area( a, b, a.prev ) < 0 || area( a, a.next, b ) < 0;

	}

	// check if the middle point of a polygon diagonal is inside the polygon
	function middleInside( a, b ) {

		let p = a,
			inside = false;
		const px = ( a.x + b.x ) / 2,
			py = ( a.y + b.y ) / 2;
		do {

			if ( ( ( p.y > py ) !== ( p.next.y > py ) ) && p.next.y !== p.y &&
				( px < ( p.next.x - p.x ) * ( py - p.y ) / ( p.next.y - p.y ) + p.x ) )
				inside = ! inside;
			p = p.next;

		} while ( p !== a );

		return inside;

	}

	// link two polygon vertices with a bridge; if the vertices belong to the same ring, it splits polygon into two;
	// if one belongs to the outer ring and another to a hole, it merges it into a single ring
	function splitPolygon( a, b ) {

		const a2 = new Node( a.i, a.x, a.y ),
			b2 = new Node( b.i, b.x, b.y ),
			an = a.next,
			bp = b.prev;

		a.next = b;
		b.prev = a;

		a2.next = an;
		an.prev = a2;

		b2.next = a2;
		a2.prev = b2;

		bp.next = b2;
		b2.prev = bp;

		return b2;

	}

	// create a node and optionally link it with previous one (in a circular doubly linked list)
	function insertNode( i, x, y, last ) {

		const p = new Node( i, x, y );

		if ( ! last ) {

			p.prev = p;
			p.next = p;

		} else {

			p.next = last.next;
			p.prev = last;
			last.next.prev = p;
			last.next = p;

		}

		return p;

	}

	function removeNode( p ) {

		p.next.prev = p.prev;
		p.prev.next = p.next;

		if ( p.prevZ ) p.prevZ.nextZ = p.nextZ;
		if ( p.nextZ ) p.nextZ.prevZ = p.prevZ;

	}

	function Node( i, x, y ) {

		// vertex index in coordinates array
		this.i = i;

		// vertex coordinates
		this.x = x;
		this.y = y;

		// previous and next vertex nodes in a polygon ring
		this.prev = null;
		this.next = null;

		// z-order curve value
		this.z = 0;

		// previous and next nodes in z-order
		this.prevZ = null;
		this.nextZ = null;

		// indicates whether this is a steiner point
		this.steiner = false;

	}

	function signedArea( data, start, end, dim ) {

		let sum = 0;
		for ( let i = start, j = end - dim; i < end; i += dim ) {

			sum += ( data[ j ] - data[ i ] ) * ( data[ i + 1 ] + data[ j + 1 ] );
			j = i;

		}

		return sum;

	}

	class ShapeUtils {

		// calculate area of the contour polygon

		static area( contour ) {

			const n = contour.length;
			let a = 0.0;

			for ( let p = n - 1, q = 0; q < n; p = q ++ ) {

				a += contour[ p ].x * contour[ q ].y - contour[ q ].x * contour[ p ].y;

			}

			return a * 0.5;

		}

		static isClockWise( pts ) {

			return ShapeUtils.area( pts ) < 0;

		}

		static triangulateShape( contour, holes ) {

			const vertices = []; // flat array of vertices like [ x0,y0, x1,y1, x2,y2, ... ]
			const holeIndices = []; // array of hole indices
			const faces = []; // final array of vertex indices like [ [ a,b,d ], [ b,c,d ] ]

			removeDupEndPts( contour );
			addContour( vertices, contour );

			//

			let holeIndex = contour.length;

			holes.forEach( removeDupEndPts );

			for ( let i = 0; i < holes.length; i ++ ) {

				holeIndices.push( holeIndex );
				holeIndex += holes[ i ].length;
				addContour( vertices, holes[ i ] );

			}

			//

			const triangles = Earcut.triangulate( vertices, holeIndices );

			//

			for ( let i = 0; i < triangles.length; i += 3 ) {

				faces.push( triangles.slice( i, i + 3 ) );

			}

			return faces;

		}

	}

	function removeDupEndPts( points ) {

		const l = points.length;

		if ( l > 2 && points[ l - 1 ].equals( points[ 0 ] ) ) {

			points.pop();

		}

	}

	function addContour( vertices, contour ) {

		for ( let i = 0; i < contour.length; i ++ ) {

			vertices.push( contour[ i ].x );
			vertices.push( contour[ i ].y );

		}

	}

    class ShapeGeometry extends BufferGeometry {

		constructor( shapes = new Shape( [ new Vector2( 0, 0.5 ), new Vector2( - 0.5, - 0.5 ), new Vector2( 0.5, - 0.5 ) ] ), curveSegments = 12 ) {

			super();

			this.type = 'ShapeGeometry';

			this.parameters = {
				shapes: shapes,
				curveSegments: curveSegments
			};

			// buffers

			const indices = [];
			const vertices = [];
			const normals = [];
			const uvs = [];

			// helper variables

			let groupStart = 0;
			let groupCount = 0;

			// allow single and array values for "shapes" parameter

			if ( Array.isArray( shapes ) === false ) {

				addShape( shapes );

			} else {

				for ( let i = 0; i < shapes.length; i ++ ) {

					addShape( shapes[ i ] );

					this.addGroup( groupStart, groupCount, i ); // enables MultiMaterial support

					groupStart += groupCount;
					groupCount = 0;

				}

			}

			// build geometry

			this.setIndex( indices );
			this.setAttribute( 'position', new Float32BufferAttribute( vertices, 3 ) );
			this.setAttribute( 'normal', new Float32BufferAttribute( normals, 3 ) );
			this.setAttribute( 'uv', new Float32BufferAttribute( uvs, 2 ) );


			// helper functions

			function addShape( shape ) {

				const indexOffset = vertices.length / 3;
				const points = shape.extractPoints( curveSegments );

				let shapeVertices = points.shape;
				const shapeHoles = points.holes;

				// check direction of vertices

				if ( ShapeUtils.isClockWise( shapeVertices ) === false ) {

					shapeVertices = shapeVertices.reverse();

				}

				for ( let i = 0, l = shapeHoles.length; i < l; i ++ ) {

					const shapeHole = shapeHoles[ i ];

					if ( ShapeUtils.isClockWise( shapeHole ) === true ) {

						shapeHoles[ i ] = shapeHole.reverse();

					}

				}

				const faces = ShapeUtils.triangulateShape( shapeVertices, shapeHoles );

				// join vertices of inner and outer paths to a single array

				for ( let i = 0, l = shapeHoles.length; i < l; i ++ ) {

					const shapeHole = shapeHoles[ i ];
					shapeVertices = shapeVertices.concat( shapeHole );

				}

				// vertices, normals, uvs

				for ( let i = 0, l = shapeVertices.length; i < l; i ++ ) {

					const vertex = shapeVertices[ i ];

					vertices.push( vertex.x, vertex.y, 0 );
					normals.push( 0, 0, 1 );
					uvs.push( vertex.x, vertex.y ); // world uvs

				}

				// indices

				for ( let i = 0, l = faces.length; i < l; i ++ ) {

					const face = faces[ i ];

					const a = face[ 0 ] + indexOffset;
					const b = face[ 1 ] + indexOffset;
					const c = face[ 2 ] + indexOffset;

					indices.push( a, b, c );
					groupCount += 3;

				}

			}

		}

		copy( source ) {

			super.copy( source );

			this.parameters = Object.assign( {}, source.parameters );

			return this;

		}

		toJSON() {

			const data = super.toJSON();

			const shapes = this.parameters.shapes;

			return toJSON( shapes, data );

		}

		static fromJSON( data, shapes ) {

			const geometryShapes = [];

			for ( let j = 0, jl = data.shapes.length; j < jl; j ++ ) {

				const shape = shapes[ data.shapes[ j ] ];

				geometryShapes.push( shape );

			}

			return new ShapeGeometry( geometryShapes, data.curveSegments );

		}

	}

	function toJSON( shapes, data ) {

		data.shapes = [];

		if ( Array.isArray( shapes ) ) {

			for ( let i = 0, l = shapes.length; i < l; i ++ ) {

				const shape = shapes[ i ];

				data.shapes.push( shape.uuid );

			}

		} else {

			data.shapes.push( shapes.uuid );

		}

		return data;

	}

    


    const THREE = {
        EventDispatcher,
        Vector2,
        Matrix3,
        Quaternion,
        Vector3,
        Box3,
        Sphere,
        Ray,
        Matrix4,
        Euler,
        Layers,
        Object3D,
        Triangle,
        BufferAttribute,
        Int8BufferAttribute,
        Uint8BufferAttribute,
        Uint8ClampedBufferAttribute,
        Int16BufferAttribute,
        Uint16BufferAttribute,
        Int32BufferAttribute,
        Uint32BufferAttribute,
        Float16BufferAttribute,
        Float32BufferAttribute,
        Float64BufferAttribute,
        BufferGeometry,
        Curve,
        EllipseCurve,
        ArcCurve,
        CatmullRomCurve3,
        CubicBezierCurve,
        CubicBezierCurve3,
        LineCurve,
        LineCurve3,
        QuadraticBezierCurve,
        QuadraticBezierCurve3,
        SplineCurve,
        CurvePath,
        Path,
        Shape,
        ShapeUtils,
        ShapeGeometry,
    };

`;


const source = 
`
//importScripts('../../../node_modules/three/build/three.js');
//importScripts('./node_modules/three/build/three.js');
//import * as THREE from 'three';

${threeSource}

//const queue = [];
var currentFrame = { frameId: -1, queue: [] };
var nextFrame = { frameId: -1, queue: [] };

onmessage = (e) => {
    const data = e.data;
    const { id, frameId } = data;

    if (currentFrame.queue.length === 0) {
        if (frameId > currentFrame.frameId) { currentFrame.frameId = frameId; }

        if (frameId === currentFrame.frameId) {
            currentFrame.queue.push(data);
            dispatch();
        }
    }
    else {
        if (frameId === currentFrame.frameId) {
            currentFrame.queue.push(data);
            dispatch();
        }
        else {
            if (frameId > currentFrame.frameId) {
                if (frameId > nextFrame.frameId) { nextFrame.frameId = frameId; nextFrame.queue = []; }

                if (frameId === nextFrame.frameId) {
                    nextFrame.queue.push(data);
                    dispatch();
                }
            }
        }
    }

    //for (let i=0; i<queue.length; ++i) {
    //    if (queue[i].id === id) { 
    //        queue[i] = data; 
    //        dispatch(); 
    //        return; 
    //    }
    //}
    //queue.push(data);
    //dispatch();
}

function delay(ms) {
    return new Promise((resolve, reject) => {
        setTimeout(() => resolve(undefined), ms);
    });
}

var isDispatching = false;
async function dispatch() {
    if (isDispatching) return;
    
    if (currentFrame.queue.length === 0 && nextFrame.queue.length !== 0) {
        let temp = currentFrame;
        currentFrame = nextFrame;
        nextFrame = currentFrame;
    }
    let queue = currentFrame.queue;
    if (queue.length === 0) return;

    try {
        isDispatching = true;

        while (queue.length !== 0) {
            let data = queue.shift();
            const { id, frameId, points, particleRadius } = data;

            const finalPoints = points_to_geometry(points.map((p) => new THREE.Vector3(p.x, p.y, p.z)), particleRadius);
            //postMessage({ id, finalPoints });

            // Line segment geometry
            let shape = new THREE.Shape();
            shape.moveTo(finalPoints[0].x, finalPoints[0].y);
            for (let i=1; i<finalPoints.length; ++i) {
                let p = finalPoints[i];
                shape.lineTo(p.x, p.y);
            }
            shape.closePath();
            const geometry = new THREE.ShapeGeometry(shape);

            const position = geometry.getAttribute('position').array.buffer;
            const normal = geometry.getAttribute('normal').array.buffer;
            const uv = geometry.getAttribute('uv').array.buffer;
            const index = geometry.getIndex().array.buffer;
            postMessage({ id, frameId, position, normal, uv, index }, [position, normal, uv, index ]);

            geometry.dispose();

            if (currentFrame.queue.length === 0 && nextFrame.queue.length !== 0) {
                let temp = currentFrame;
                currentFrame = nextFrame;
                nextFrame = currentFrame;
                queue = currentFrame.queue;
            }
            await delay(0);
        }

        //while (queue.length !== 0) {
        //    let data = queue.shift();
        //    const { id, points, particleRadius } = data;
        //
        //    const finalPoints = points_to_geometry(points.map((p) => new THREE.Vector3(p.x, p.y, p.z)), particleRadius);
        //    //postMessage({ id, finalPoints });
        //
        //    // Line segment geometry
        //    let shape = new THREE.Shape();
        //    shape.moveTo(finalPoints[0].x, finalPoints[0].y);
        //    for (let i=1; i<finalPoints.length; ++i) {
        //        let p = finalPoints[i];
        //        shape.lineTo(p.x, p.y);
        //    }
        //    shape.closePath();
        //    const geometry = new THREE.ShapeGeometry(shape);
        //
        //    const position = geometry.getAttribute('position').array.buffer;
        //    const normal = geometry.getAttribute('normal').array.buffer;
        //    const uv = geometry.getAttribute('uv').array.buffer;
        //    const index = geometry.getIndex().array.buffer;
        //    postMessage({ id, position, normal, uv, index }, [position, normal, uv, index ]);
        //
        //    geometry.dispose();
        //
        //    await delay(0);
        //}
    }
    finally { isDispatching = false; }
}

const points_to_geometry_circle_segments = 16;
const points_to_geometry = (points, particleRadius) => {

    const circlePoints = getCirclePointsForPoints(points, particleRadius, points_to_geometry_circle_segments);
    const circleSegments = [];
    for (let i=0; i<circlePoints.length; ++i) {
        let cp = circlePoints[i];
        let seg = [];
        circleSegments.push(seg);
        for (let n=0; n<cp.length; ++n) {
            let p = cp[n];
            let np = n === cp.length - 1 ? cp[0] : cp[n + 1];
            seg.push({ start: p.clone(), end: np.clone() });
            //setLine2D(circleSegments[i][n], p.x, p.y, np.x, np.y);
        }
    }

    const circlePoints2 = circlePoints.map((cp, i) => {
        let p = points[i];
        let lp = points[i === 0 ? points.length - 1 : i - 1];
        let np = points[i === points.length - 1 ? 0 : i + 1];
        
        //let lineToLast = utilityLines[0];
        //let lineToNext = utilityLines[1];
        //setLine2D(lineToLast, p.x, p.y, lp.x, lp.y);
        //setLine2D(lineToNext, p.x, p.y, np.x, np.y);
        let lineToLast = { start: p.clone(), end: lp.clone() };
        let lineToNext = { start: p.clone(), end: np.clone() };

        let dir = new THREE.Vector2();
        let perpendicularEnd = new THREE.Vector2();

        /** @type {Array<TME.Vec2>} */
        let firstIntersections = circleSegments[i].reduce((a, cs) => {
            let ip = intersect(lineToLast.start, lineToLast.end, cs.start, cs.end, true);
            //let ip = lineToLast.intersect(cs, true);
            if (ip != null) { a.push(ip); }
            return a;
        }, []);
        let firstPoint;
        if (firstIntersections.length === 0) {
            // Shouldn't happen but does - probably the intersection is on one of the circle segment end points, so just find the closest one
            let start = lineToLast.start;
            dir.copy(lineToLast.end).sub(start);
            perpendicularEnd.copy(dir.y, -dir.x).add(start); // 90 degrees clockwise
            
            firstPoint = cp.filter((cpp) => isLeftOfLine(start, perpendicularEnd, cpp) >= 0).map((cpp) => { return { pt: cpp, dist: getDistPointToLine(start, dir, cpp) }; }).sort((a, b) => a.dist - b.dist);
            firstPoint = firstPoint.length !== 0 ? firstPoint[0].pt : undefined;
        }
        else { firstPoint = firstIntersections.reduce((a, b) => a.add(b)).divideScalar(firstIntersections.length); }
        if (firstPoint) firstPoint = new THREE.Vector3(firstPoint.x, firstPoint.y, 0);
        else return cp;

        /** @type {Array<TME.Vec2>} */
        let lastIntersections = circleSegments[i].reduce((a, cs) => {
            let ip = intersect(lineToNext.start, lineToNext.end, cs.start, cs.end, true);
            //let ip = lineToNext.intersect(cs, true);
            if (ip != null) { a.push(ip); }
            return a;
        }, []);
        let lastPoint;
        if (lastIntersections.length === 0) {
            // Shouldn't happen but does - probably the intersection is on one of the circle segment end points, so just find the closest one
            let start = lineToNext.start;
            dir.copy(lineToNext.end).sub(start);
            perpendicularEnd.copy(dir.y, -dir.x).add(start); // 90 degrees clockwise

            lastPoint = cp.filter((cpp) => isLeftOfLine(start, perpendicularEnd, cpp) >= 0).map((cpp) => { return { pt: cpp, dist: getDistPointToLine(start, dir, cpp) }; }).sort((a, b) => a.dist - b.dist);
            lastPoint = lastPoint.length !== 0 ? lastPoint[0].pt : undefined;
        }
        else { lastPoint = lastIntersections.reduce((a, b) => a.add(b)).divideScalar(lastIntersections.length); }
        if (lastPoint) lastPoint = new THREE.Vector3(lastPoint.x, lastPoint.y, 0);
        else return cp;

        let startAngle = Math.atan2(firstPoint.y - p.y, firstPoint.x - p.x);
        let endAngle = Math.atan2(lastPoint.y - p.y, lastPoint.x - p.x);
        let angleDif = endAngle - startAngle;
        let clockwiseAngleRange = angleDif < 0 ? -angleDif : 2*Math.PI - angleDif;

        let ret = [ firstPoint ];
        ret.push(...cp.map((ccp) => {
            let angle = Math.atan2(ccp.y - p.y, ccp.x - p.x);
            angleDif = angle - startAngle;
            let clockwiseAngle = angleDif < 0 ? -angleDif : 2*Math.PI - angleDif;
            return { point: ccp, angle: clockwiseAngle, keep: clockwiseAngle > 0 && clockwiseAngle < clockwiseAngleRange };
        }).filter((e) => e.keep).sort((a, b) => a.angle - b.angle).map((e) => e.point));
        ret.push(lastPoint);

        return ret;
    });
    
    const finalPoints = circlePoints2.reduce((a, b) => { a.push(...b); return a; }, []);
    
    return finalPoints;
    
}

function intersect(thisStart, thisEnd, otherStart, otherEnd, lineSegmentOnly) {
    // Check if none of the lines are of length 0
    if ((thisStart.x === thisEnd.x && thisStart.y === thisEnd.y) || (otherStart.x === otherEnd.x && otherStart.y === otherEnd.y)) {
        return null;
    }

    const denominator = ((otherEnd.y - otherStart.y) * (thisEnd.x - thisStart.x) - (otherEnd.x - otherStart.x) * (thisEnd.y - thisStart.y));

    // Lines are parallel
    if (denominator === 0) {
        return null;
    }

    const ua = ((otherEnd.x - otherStart.x) * (thisStart.y - otherStart.y) - (otherEnd.y - otherStart.y) * (thisStart.x - otherStart.x)) / denominator;

    // Check if the intersection point is within the bounds of the line segments if required
    if (lineSegmentOnly) {
        const ub = ((thisEnd.x - thisStart.x) * (thisStart.y - otherStart.y) - (thisEnd.y - thisStart.y) * (thisStart.x - otherStart.x)) / denominator;
        if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
            return null;
        }
    }

    // Return an object with the x and y coordinates of the intersection
    const x = thisStart.x + ua * (thisEnd.x - thisStart.x);
    const y = thisStart.y + ua * (thisEnd.y - thisStart.y);

    return new THREE.Vector3(x, y, 0);
}


/**
 * @private
 * @param {List<THREE.Vector3>} points 
 * @param {Number} radius 
 * @param {Number} segments 
 * @param {Array<Array<THREE.Vector3>>} outCirclePoints 
 */
function getCirclePointsForPoints(points, radius, segments) {
    if (segments < 3) { segments = 3; }

    let ret = [];
    let stepAngle = 2*Math.PI / segments;
    for (let i=0; i<points.length; ++i) {
        let p = points[i];

        /** @type {Array<THREE.Vector3>} */
        let circlePoints = [];
        ret.push(circlePoints);
        for (let n=0; n<segments; ++n) {
            let pt = new THREE.Vector3();
            circlePoints.push(pt);
            let angle = stepAngle * n;

            let x = p.x + Math.cos(angle) * radius;
            let y = p.y + Math.sin(angle) * radius;
            let z = 0;
            pt.set(x, y, z);
        }
    }

    return ret;
}

/**
 * @private
 * @param {TME.Line2D} line 
 * @param {Number} x1 
 * @param {Number} y1 
 * @param {Number} x2 
 * @param {Number} y2 
 */
function setLine2D(line, x1, y1, x2, y2) {
    line.start.set(x1, y1);
    line.end.set(x2, y2);
}

/**
 * @private
 * Phong https://forum.unity.com/threads/closest-point-on-a-line.121567/
 * @param {THREE.Vector2} origin 
 * @param {THREE.Vector2} direction 
 * @param {THREE.Vector2} point 
 * @returns 
 */
function getDistPointToLine(origin, direction, point) {
    _direction.set(direction.x, direction.y, 0);
    _point2origin.set(origin.x, origin.y, 0).sub(point);
    _point2closestPointOnLine.copy(_point2origin).sub(_direction.multiplyScalar(_point2origin.dot(_direction)));
    return _point2closestPointOnLine.clone();
}

/** @private @type {THREE.Vector3} */
_point2origin = new THREE.Vector3();

/** @private @type {THREE.Vector3} */
_direction = new THREE.Vector3();

/** @private @type {THREE.Vector3} */
_point2closestPointOnLine = new THREE.Vector3();

/**
 * @private
 *  isLeftOfLine(): tests if a point is Left|On|Right of an infinite line.
 *  Input:  three points a, b, and p
 *  Return: >0 for p left of the line through a and b
 *      =0 for p on the line
 *      <0 for p right of the line
 * @param {THREE.Vector3} a 
 * @param {THREE.Vector3} b 
 * @param {THREE.Vector3} p 
 * @returns {Boolean}
 */
function isLeftOfLine(a, b, p) {
    return ( (b.x - a.x)*(p.y - a.y)
    - (p.x - a.x)*(b.y - a.y));
}
    
`;

// 15901 threejs file full look up to that point