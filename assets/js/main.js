
(function($) {

	var	$window = $(window),
		$body = $('body'),
		$wrapper = $('#wrapper'),
		$header = $('#header'),
		$banner = $('#banner');

	// Breakpoints.
		breakpoints({
			xlarge:    ['1281px',   '1680px'   ],
			large:     ['981px',    '1280px'   ],
			medium:    ['721px',    '980px'    ],
			small:     ['481px',    '720px'    ],
			xsmall:    ['361px',    '480px'    ],
			xxsmall:   [null,       '360px'    ]
		});

	/**
	 * Applies parallax scrolling to an element's background image.
	 * @return {jQuery} jQuery object.
	 */
	$.fn._parallax = (browser.name == 'ie' || browser.name == 'edge' || browser.mobile) ? function() { return $(this) } : function(intensity) {

		var	$window = $(window),
			$this = $(this);

		if (this.length == 0 || intensity === 0)
			return $this;

		if (this.length > 1) {

			for (var i=0; i < this.length; i++)
				$(this[i])._parallax(intensity);

			return $this;

		}

		if (!intensity)
			intensity = 0.25;

		$this.each(function() {

			var $t = $(this),
				on, off;

			on = function() {

				$t.css('background-position', 'center 100%, center 100%, center 0px');

				$window
					.on('scroll._parallax', function() {

						var pos = parseInt($window.scrollTop()) - parseInt($t.position().top);

						$t.css('background-position', 'center ' + (pos * (-1 * intensity)) + 'px');

					});

			};

			off = function() {

				$t
					.css('background-position', '');

				$window
					.off('scroll._parallax');

			};

			breakpoints.on('<=medium', off);
			breakpoints.on('>medium', on);

		});

		$window
			.off('load._parallax resize._parallax')
			.on('load._parallax resize._parallax', function() {
				$window.trigger('scroll');
			});

		return $(this);

	};

	// Play initial animations on page load.
		$window.on('load', function() {
			window.setTimeout(function() {
				$body.removeClass('is-preload');
			}, 100);
		});

	// Clear transitioning state on unload/hide.
		$window.on('unload pagehide', function() {
			window.setTimeout(function() {
				$('.is-transitioning').removeClass('is-transitioning');
			}, 250);
		});

	// Fix: Enable IE-only tweaks.
		if (browser.name == 'ie' || browser.name == 'edge')
			$body.addClass('is-ie');

	// Scrolly.
		$('.scrolly').scrolly({
			offset: function() {
				return $header.height() - 2;
			}
		});

	// Tiles.
		var $tiles = $('.tiles > article');

		$tiles.each(function() {

			var $this = $(this),
				$image = $this.find('.image'), $img = $image.find('img'),
				$link = $this.find('.link'),
				x;

			// Image.

				// Set image.
					$this.css('background-image', 'url(' + $img.attr('src') + ')');

				// Set position.
					if (x = $img.data('position'))
						$image.css('background-position', x);

				// Hide original.
					$image.hide();

			// Link.
				if ($link.length > 0) {

					$x = $link.clone()
						.text('')
						.addClass('primary')
						.appendTo($this);

					$link = $link.add($x);

					$link.on('click', function(event) {

						var href = $link.attr('href');

						// Prevent default.
							event.stopPropagation();
							event.preventDefault();

						// Target blank?
							if ($link.attr('target') == '_blank') {

								// Open in new tab.
									window.open(href);

							}

						// Otherwise ...
							else {

								// Start transitioning.
									$this.addClass('is-transitioning');
									$wrapper.addClass('is-transitioning');

								// Redirect.
									window.setTimeout(function() {
										location.href = href;
									}, 500);

							}

					});

				}

		});

	// Header.
		if ($banner.length > 0
		&&	$header.hasClass('alt')) {

			$window.on('resize', function() {
				$window.trigger('scroll');
			});

			$window.on('load', function() {

				$banner.scrollex({
					bottom:		$header.height() + 10,
					terminate:	function() { $header.removeClass('alt'); },
					enter:		function() { $header.addClass('alt'); },
					leave:		function() { $header.removeClass('alt'); $header.addClass('reveal'); }
				});

				window.setTimeout(function() {
					$window.triggerHandler('scroll');
				}, 100);

			});

		}

	// Banner.
		$banner.each(function() {

			var $this = $(this),
				$image = $this.find('.image'), $img = $image.find('img');

			// Parallax.
				$this._parallax(0.275);

			// Image.
				if ($image.length > 0) {

					// Set image.
						$this.css('background-image', 'url(' + $img.attr('src') + ')');

					// Hide original.
						$image.hide();

				}

		});

	// Menu.
		var $menu = $('#menu'),
			$menuInner;

		$menu.wrapInner('<div class="inner"></div>');
		$menuInner = $menu.children('.inner');
		$menu._locked = false;

		$menu._lock = function() {

			if ($menu._locked)
				return false;

			$menu._locked = true;

			window.setTimeout(function() {
				$menu._locked = false;
			}, 350);

			return true;

		};

		$menu._show = function() {

			if ($menu._lock())
				$body.addClass('is-menu-visible');

		};

		$menu._hide = function() {

			if ($menu._lock())
				$body.removeClass('is-menu-visible');

		};

		$menu._toggle = function() {

			if ($menu._lock())
				$body.toggleClass('is-menu-visible');

		};

		$menuInner
			.on('click', function(event) {
				event.stopPropagation();
			})
			.on('click', 'a', function(event) {

				var href = $(this).attr('href');

				event.preventDefault();
				event.stopPropagation();

				// Hide.
					$menu._hide();

				// Redirect.
					window.setTimeout(function() {
						window.location.href = href;
					}, 250);

			});

		$menu
			.appendTo($body)
			.on('click', function(event) {

				event.stopPropagation();
				event.preventDefault();

				$body.removeClass('is-menu-visible');

			})
			.append('<a class="close" href="#menu">Close</a>');

		$body
			.on('click', 'a[href="#menu"]', function(event) {

				event.stopPropagation();
				event.preventDefault();

				// Toggle.
					$menu._toggle();

			})
			.on('click', function(event) {

				// Hide.
					$menu._hide();

			})
			.on('keydown', function(event) {

				// Hide on escape.
					if (event.keyCode == 27)
						$menu._hide();

			});
			
			/* assets/js/main.js - APPEND TO BOTTOM */

			document.addEventListener("DOMContentLoaded", () => {
				sanitizeInterface();
				activateProfilePhoto();
				activateLogoLink();
			});

			function sanitizeInterface() {
				console.log(">> SYSTEM: SANITIZING DUMMY DATA...");
				
				// The specific "Dummy Values" you mentioned
				const dummyTargets = [
					{ find: "142", replace: "0" },
					{ find: "98%", replace: "0%" },
					{ find: "$14,200", replace: "$0.00" },
					{ find: "$500.00", replace: "$0.00" },
					{ find: "Rank - Private", replace: "Rank - Recruit" },
					{ find: "Active Tasks", replace: "0 Active Tasks" }
				];

				// Scan all text elements (Span, H1-H6, P, B)
				document.querySelectorAll('span, h1, h2, h3, h4, h5, p, b, strong').forEach(el => {
					// Only target elements with no children (just text)
					if (el.children.length === 0) {
						const text = el.innerText.trim();
						
						dummyTargets.forEach(target => {
							if (text.includes(target.find)) {
								el.innerText = target.replace;
								el.classList.add('zeroed-value'); // Mark it so we can animate it later
							}
						});
					}
				});
			}
			
			function activateProfilePhoto() {
			const profilePic = document.getElementById('profile-pic');
			
			if (profilePic) {
				// 1. Add Visual Cue (Cursor)
				profilePic.style.cursor = "pointer";
				profilePic.title = "Click to Change Identification";
				
				// 2. Create the Hidden File Input
				const fileInput = document.createElement('input');
				fileInput.type = 'file';
				fileInput.accept = 'image/*';
				fileInput.style.display = 'none';
				document.body.appendChild(fileInput);

				// 3. Link Click to Input
				profilePic.addEventListener('click', () => {
					fileInput.click();
				});

				// 4. Handle File Selection (Preview only for now)
				fileInput.addEventListener('change', (e) => {
					const file = e.target.files[0];
					if (file) {
						const reader = new FileReader();
						reader.onload = (e) => {
							profilePic.src = e.target.result; // Show new image immediately
							// TODO: Add Firestore Upload Logic here in Step 5
						};
						reader.readAsDataURL(file);
						}
					});
				}
			}
		
			function activateLogoLink() {
			// Find the logo image. Usually in #header img or .logo img
			const logoImg = document.querySelector('#header img') || document.querySelector('.logo img');
			
			if (logoImg) {
				logoImg.style.cursor = "pointer";
				logoImg.addEventListener('click', () => {
					window.location.href = 'index.html'; // Return to Base
				});
				
				// Determine Room Type for Color matching
				const path = window.location.pathname;
				if (path.includes("Admin")) logoImg.classList.add('glow-gold');
				else if (path.includes("Student")) logoImg.classList.add('glow-cyan');
				else if (path.includes("Freelancer")) logoImg.classList.add('glow-orange');
			}
		}

})(jQuery);