/**
 * tilelayer.js
 *
 * requirements:
 *	 tools.js
 *	 ui.js
 *	 slider.js
 *
 * @todo redo all public interfaces to use physical coordinates instead of pixel coordinates
 */

/**
 * 
 */
function TileLayer(
		stack,						//!< reference to the parent stack
		tileWidth,
		tileHeight,
		tileSource
		)
{
	/**
	 * initialise the tiles array
	 */
	var initTiles = function( rows, cols )
	{
		while ( tilesContainer.firstChild )
			tilesContainer.removeChild( tilesContainer.firstChild );
		
		delete tiles;
		tiles = new Array();
		
		for ( var i = 0; i < rows; ++i )
		{
			tiles[ i ] = new Array();
			for ( var j = 0; j < cols; ++j )
			{
				tiles[ i ][ j ] = document.createElement( "img" );
				tiles[ i ][ j ].alt = "empty";
				tiles[ i ][ j ].src = "widgets/empty256.gif";
				
				tilesContainer.appendChild( tiles[ i ][ j ] );
			}
		}

		return;
	}

	this.redraw = function( completionCallback )
	{
		var vox = - stack.viewWidth / 2;
		var voy = - stack.viewHeight / 2;

		var stackToView = new THREE.Matrix4();
		stackToView.copy( stack.stackToViewTransform );

		var stackOriginInView = new THREE.Vector3();
		stackOriginInView.getPositionFromMatrix( stackToView );
		var xc = stackOriginInView.getComponent( 0 ) - vox;
		var yc = stackOriginInView.getComponent( 1 ) - voy;

		var top;
		var left;

		if ( yc <= 0 )
			top  = yc % tileHeight;
		else
			top  = ( yc - 1 ) % tileHeight + 1 - tileHeight;
		if ( xc <= 0 )
			left = xc % tileWidth;
		else
			left = ( xc - 1 ) % tileWidth + 1 - tileWidth;

		var viewToTile = new THREE.Matrix4(
				1, 0, 0, stack.viewWidth / 2 - left,
				0, 1, 0, stack.viewHeight / 2 - top,
				0, 0, 1, 0,
				0, 0, 0, 1 );

		var stackToTile = new THREE.Matrix4();

		if ( stack.z == stack.old_z && stack.s == stack.old_s )
		{
			xd = Math.floor( xc / tileWidth ) - Math.floor( self.old_xc / tileWidth );
			yd = Math.floor( yc / tileHeight ) - Math.floor( self.old_yc / tileHeight );
			self.old_xc = xc;
			self.old_yc = yc;

			// re-order the tiles array on demand
			if ( xd < 0 )
			{
				for ( var i = 0; i < tiles.length; ++i )
				{
					tilesContainer.removeChild( tiles[ i ].pop() );
					var img = document.createElement( "img" );
					img.alt = "empty";
					img.src = "widgets/empty256.gif";
					img.style.visibility = "hidden";
					tilesContainer.appendChild( img );
					tiles[ i ].unshift( img );
				}
			}
			else if ( xd > 0 )
			{
				for ( var i = 0; i < tiles.length; ++i )
				{
					tilesContainer.removeChild( tiles[ i ].shift() );
					var img = document.createElement( "img" );
					img.alt = "empty";
					img.src = "widgets/empty256.gif";
					img.style.visibility = "hidden";
					tilesContainer.appendChild( img );
					tiles[ i ].push( img );
				}
			}
			else if ( yd < 0 )
			{
				var old_row = tiles.pop();
				var new_row = new Array();
				for ( var i = 0; i < tiles[ 0 ].length; ++i )
				{
					tilesContainer.removeChild( old_row.pop() );
					var img = document.createElement( "img" );
					img.alt = "empty";
					img.src = "widgets/empty256.gif";
					img.style.visibility = "hidden";
					tilesContainer.appendChild( img );
					new_row.push( img );
				}
				tiles.unshift( new_row );
			}
			else if ( yd > 0 )
			{
				var old_row = tiles.shift();
				var new_row = new Array();
				for ( var i = 0; i < tiles[ 0 ].length; ++i )
				{
					tilesContainer.removeChild( old_row.pop() );
					var img = document.createElement( "img" );
					img.alt = "empty";
					img.src = "widgets/empty256.gif";
					img.style.visibility = "hidden";
					tilesContainer.appendChild( img );
					new_row.push( img );
				}
				tiles.push( new_row );
			}
		}

		var t = top;
		var l = left;

		// update the images sources
		for ( var i = 0; i < tiles.length; ++i )
		{
			for ( var j = 0; j < tiles[ 0 ].length; ++j )
			{
				viewToTile.elements[ 12 ] = - vox - l;
				viewToTile.elements[ 13 ] = - voy - t;
				stackToTile.multiplyMatrices( viewToTile, stackToView );

				tiles[ i ][ j ].alt = "";
				tiles[ i ][ j ].src = self.tileSource.getTileURL( 0, stack, 0,
					tileWidth, tileHeight,
					0, 0, 0,
					stackToTile );
//////////////////////////////////////////////////////////
		//		tiles[ i ][ j ].src = "widgets/black.gif";
//////////////////////////////////////////////////////////

				tiles[ i ][ j ].style.top = t + "px";
				tiles[ i ][ j ].style.left = l + "px";
				tiles[ i ][ j ].style.visibility = "visible";

				tiles[ i ][ j ].style.width = tileWidth + "px";
				tiles[ i ][ j ].style.height = tileHeight + "px";

				console.log( tiles[i][j].src );

				l += tileWidth;
			}
			l = left;
			t += tileHeight;
		}

		if (typeof completionCallback !== "undefined") {
			completionCallback();
		}
	}

	this.resize = function( width, height )
	{
		self.navigatorbox.resize( width, height );

		var rows = Math.floor( height / tileHeight ) + 2;
		var cols = Math.floor( width / tileWidth ) + 2;
		initTiles( rows, cols );
		self.redraw();
		return;
	}
	
	/**
	 * Get the width of an image tile.
	 */
	this.getTileWidth = function(){ return tileWidth; }
	
	/**
	 * Get the height of an image tile.
	 */
	this.getTileHeight = function(){ return tileHeight; }
	
	/**
	 * Get the number of tile columns.
	 */
	this.numTileColumns = function()
	{
		if ( tiles.length == 0 )
			return 0;
		else
			return tiles[ 0 ].length;
	}
	
	/**
	 * Get the number of tile rows.
	 */
	this.numTileColumns = function(){ return tiles.length; }
	
	/**
	 * Get the stack.
	 */
	this.getStack = function(){ return stack; }

	this.setOpacity = function( val )
	{
		tilesContainer.style.opacity = val+"";
		opacity = val;
	}

	this.getOpacity = function()
	{
		return opacity;
	}

	// initialise
	var self = this;

	// internal opacity variable
	var opacity = 100;
	
	/* Contains all tiles in a 2d-array */
	var tiles = new Array();

	self.navigatorbox = new NavigatorBox( stack );

	var tilesContainer = document.createElement( "div" );
	tilesContainer.className = "sliceTiles";
	stack.getView().appendChild( tilesContainer );

	var LAST_XT = Math.floor( ( stack.dimension.x * stack.scale - 1 ) / tileWidth );
	var LAST_YT = Math.floor( ( stack.dimension.y * stack.scale - 1 ) / tileHeight );

	self.tileSource = tileSource;

	var overviewLayer = tileSource.getOverviewLayer( this );
}

