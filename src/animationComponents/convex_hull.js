// convex_hull.js v240601 x joserpagil@gmail.com

/*
export default function convex_hull( args ){
	// To find orientation of ordered triplet (p, q, r).
		// The function returns following values
		// 0 --> p, q and r are collinear
		// 1 --> Clockwise
		// 2 --> Counterclockwise
	function orientation(p, q, r){
		let val = (q.y - p.y) * (r.x - q.x) -
					(q.x - p.x) * (r.y - q.y);
			
			if (val == 0) return 0; // collinear
			return (val > 0)? 1: 2; // clock or counterclock wise
	}

	// Javascript program to find convex hull of a set of points. Refer 
	// https://www.geeksforgeeks.org/orientation-3-ordered-points/
	// for explanation of orientation()

		let n = args.points.length
	// There must be at least 3 points
		if (n < 3) return null;
		
		// Initialize Result
		let hull = [];
		
		// Find the leftmost point
		let l = 0;
		for (let i = 1; i < n; i++)
			if (args.points[i].x < args.points[l].x)
				l = i;
		
		// Start from leftmost point, keep moving 
		// counterclockwise until reach the start point
		// again. This loop runs O(h) times where h is
		// number of points in result or output.
		let p = l, q;
		do {
		
			// Add current point to result
			hull.push(args.points[p]);
		
			// Search for a point 'q' such that 
			// orientation(p, q, x) is counterclockwise 
			// for all points 'x'. The idea is to keep 
			// track of last visited most counterclock-
			// wise point in q. If any point 'i' is more 
			// counterclock-wise than q, then update q.
			q = (p + 1) % n;
			
			for (let i = 0; i < n; i++){
				// If i is more counterclockwise than 
				// current q, then update q
				if (orientation(args.points[p], args.points[i], args.points[q]) == 2) q = i;
			}
		
			// Now q is the most counterclockwise with
			// respect to p. Set p as q for next iteration, 
			// so that q is added to result 'hull'
			p = q;
		
		} while (p != l); // While we don't come to first point
		
		const Distance                  = ( p1 , p2 )                 => {
			var x = p1 . x - p2 . x
			var y = p1 . y - p2 . y

			return Math . sqrt ( x * x + y * y )
		}				
		const RDP                       = ( points , epsilon )        => {
			if ( points . length < 3 ) return points . slice ()

			var firstPoint = points [ 0 ]
			var lastPoint  = points [ points . length - 1 ]

			var index = - 1
			var dist  = 0
			var cDist = 0

			for ( var i = 1 ; i < points . length - 1 ; i ++ ) {
				var point = points [ i ]

				if ( firstPoint . x == lastPoint . x ) cDist = Math . abs ( point . x - firstPoint . x ) ;
				else {
					var slope    = ( lastPoint . y - firstPoint . y ) / ( lastPoint . x - firstPoint . x ) ;
					var intercept = firstPoint . y - (  slope * firstPoint . x ) ;
					cDist = Math . abs ( slope * point . x - point . y + intercept ) / Math . sqrt ( Math . pow ( slope , 2 ) + 1 ) ;
				}

				if ( cDist > dist ) {
					dist  = cDist ;
					index = i ;
				}
			}

			if ( dist > epsilon ) {
				var l1 = points . slice ( 0 , index + 1 ) ;
				var l2 = points . slice ( index ) ;
				var r1 = RDP ( l1 , epsilon ) ;
				var r2 = RDP ( l2 , epsilon ) ;
				r1 . pop ;
				r1 = r1 . concat ( r2 ) ;

				var r3 = []
				for ( var i = 0 ; i < r1 . length ; i ++ ) {
					if ( i == 0 ) r3 . push ( r1 [ 0 ] )
					else {
						var pi = r1 [ i ]
						var pi1 = r1 [ i - 1 ]
						if ( pi . x != pi1 . x || pi . y != pi1 . y ) r3 . push ( pi )
					}
				}

				return r3
			}
			return [ firstPoint , lastPoint ]
		}
				
		//hull.pop()
		
		let epsilon = 0
		if( 'epsilon' in args ) epsilon = args.epsilon
		return RDP( hull, epsilon )
}

*/

// A javascript program to find simple closed path for n points
// for explanation of orientation()

// A global point needed for sorting points with reference
// to the first point. Used in compare function of qsort()
let p0

// A utility function to return square of distance between
// p1 and p2
function dist(p1, p2){
	return ( p1.x - p2.x ) * ( p1.x - p2.x) +
		   ( p1.y - p2.y ) * ( p1.y - p2.y )
}

// To find orientation of ordered triplet (p, q, r).
// The function returns following values
// 0 --> p, q and r are collinear
// 1 --> Clockwise
// 2 --> Counterclockwise
function orientation(p, q, r){
	//let val = ( q.y - p.y ) * ( r.x - q.x ) - ( q.x - p.x ) * ( r.y - q.y )
	
	    let val = ((q.y - p.y) * (r.x - q.x)
               - (q.x - p.x) * (r.y - q.y));

	if (val == 0) return 0 // collinear
	return (val > 0)? 1: 2 // clockwise or counterclock wise
}

function orientation2(p, q, r)
{
    let val = ((q.y - p.y) * (r.x - q.x)
               - (q.x - p.x) * (r.y - q.y));
    if (val == 0)
        return 0; // collinear
    else if (val > 0)
        return 1; // clock wise
    else
        return 2; // counterclock wise
}

// A function used by library function qsort() to sort
// an array of points with respect to the first point
function compare(vp1, vp2) {
	let p1 = vp1;
	let p2 = vp2;

	// Find orientation
	let o = orientation(p0, p1, p2);
	if (o == 0)
		return (dist(p0, p2) >= dist(p0, p1))? -1 : 1;

	return (o == 2)? -1: 1;
}

function nextToTop(S) { return S[S.length - 2]; }

export default function convex_hull( args ){
	const n = args.points.length
	
	// Find the bottommost point
	let ymin = args.points[0].y
	let min  = 0
	for( let i = 1; i < n; ++i ){
		let y = args.points[i].y
		
		// Pick the bottom-most. In case of tie, choose the left most point
		if (( y < ymin ) || ( ymin == y && args.points[i].x < args.points[min].x )){
			ymin = args.points[i].y
			min  = i
		}

	}
	
	// Place the bottom-most point at first position
	let temp         = args.points[0]
	args.points[0]   = args.points[min]
	args.points[min] = temp
	
	// Sort n-1 points with respect to the first point.
	// A point p1 comes before p2 in sorted output if p2
	// has larger polar angle (in counterclockwise
	// direction) than p1
	p0   = args.points[0]
	args.points.sort( compare )
	
    // If two or more points make same angle with p0,
    // Remove all but the one that is farthest from p0
    // Remember that, in above sorting, our criteria was
    // to keep the farthest point at the end when more than
    // one points have same angle.
    let m = 1; // Initialize size of modified array
    for( let i = 1; i < n; ++i ){
        // Keep removing i while angle of i and i+1 is same
        // with respect to p0
        while (( i < n - 1 ) && (orientation(p0, args.points[i], args.points[i + 1]) == 0))
            i += 1;
 
        args.points[m] = args.points[i];
        m += 1; // Update size of modified array
    }
	
	
    // If modified array of points has less than 3 points,
    // convex hull is not possible
    if ( m < 3 ) return null
	
    // Create an empty stack and push first three points
    // to it.
    let S = [];
    S.push( args.points[0]);
    S.push( args.points[1]);
    S.push( args.points[2]);
 
    // Process remaining n-3 points
    for( let i = 3; i < m; ++i ){
        // Keep removing top while the angle formed by
        // points next-to-top, top, and points[i] makes
        // a non-left turn
        while (true) {
            if (S.length < 2) break;
            if (orientation(nextToTop(S), S[S.length - 1], args.points[i]) >= 2) break;
            S.pop();
        }
 
        S.push( args.points[i]);
    }	
	
	return S
}

// The code is contributed by Nidhi goel.
