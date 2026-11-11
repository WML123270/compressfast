( function () {
	'use strict';

	function init() {
		var jpeg = document.getElementById( 'compressfast_jpeg_quality' );
		var jpegVal = document.getElementById( 'compressfast_jpeg_quality_val' );

		if ( jpeg && jpegVal ) {
			jpeg.addEventListener( 'input', function () {
				jpegVal.textContent = jpeg.value;
			} );
		}

		var png = document.getElementById( 'compressfast_png_quality' );
		var pngVal = document.getElementById( 'compressfast_png_quality_val' );

		if ( png && pngVal ) {
			png.addEventListener( 'input', function () {
				pngVal.textContent = png.value;
			} );
		}

		var bulkForm = document.getElementById( 'compressfast-bulk-form' );

		if ( bulkForm ) {
			bulkForm.addEventListener( 'submit', function ( event ) {
				if ( ! window.confirm( 'This will optimize ALL images in your library. Continue?' ) ) {
					event.preventDefault();
				}
			} );
		}
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', init );
	} else {
		init();
	}
} )();
