// convex_hull.js v240605 x joserpagil@gmail.com


export default function build_curve( args ){
	const get_control_points = args =>{
		const d01 = Math . sqrt ( Math . pow ( args . p1 . x - args . p0 . x , 2 ) + Math . pow ( args . p1 . y - args . p0 . y , 2 ) )
		const d12 = Math . sqrt ( Math . pow ( args . p2 . x - args . p1 . x , 2 ) + Math . pow ( args . p2 . y - args . p1 . y , 2 ) )

		const fa = args . tension * d01 / ( d01 + d12 )
		const fb = args . tension - fa

		const c1 = { x : args . p1 . x + fa * ( args . p0 . x - args . p2 . x ) , y : args . p1 . y + fa * ( args . p0 . y - args . p2 . y )}
		const c2 = { x : args . p1 . x - fb * ( args . p0 . x - args . p2 . x ) , y : args . p1 . y - fb * ( args . p0 . y - args . p2 . y )}

		return [ c1 , c2 ]
	}
	
	const curve_points       = args.points.slice()
	let   n                  = curve_points.length
	if( args.closed ){
		curve_points.push   ( curve_points[ 0     ])
		curve_points.unshift( curve_points[ n - 1 ])
	} else n -= 2
	const control_points     =[]
	for( let i = 0 ; i < n; ++i ) {
		const cpoints = get_control_points({ 
			p0      : curve_points[ i     ] , 
			p1      : curve_points[ i + 1 ] , 
			p2      : curve_points[ i + 2 ] , 
			tension : 0 })
			
		control_points.push( cpoints[ 0 ], cpoints[ 1 ])
	}
	return                   control_points
}
