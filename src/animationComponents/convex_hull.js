// convex_hull.js v240601 x joserpagil@gmail.com

export default function convex_hull( points ){
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

		let n = points.length
	// There must be at least 3 points
		if (n < 3) return null;
		
		// Initialize Result
		let hull = [];
		
		// Find the leftmost point
		let l = 0;
		for (let i = 1; i < n; i++)
			if (points[i].x < points[l].x)
				l = i;
		
		// Start from leftmost point, keep moving 
		// counterclockwise until reach the start point
		// again. This loop runs O(h) times where h is
		// number of points in result or output.
		let p = l, q;
		do {
		
			// Add current point to result
			hull.push(points[p]);
		
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
				if (orientation(points[p], points[i], points[q]) == 2) q = i;
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
				
		return RDP( hull, 0 )
}

