/* --- DSPTF.js — DYNAMIC SUBSCRIPTION PACKAGE TRANSFER FRAMEWORK --- */

/* --- Utility: Parse URL Query Parameters --- */
function getQueryParams() {
    const params = {};
    const queryString = window.location.search.substring(1);
    const regex = /([^&=]+)=([^&]*)/g;  // FIXED: Valid regex
    let m;
    while ((m = regex.exec(queryString)) !== null) {
        params[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
    }
    return params;
}

/* --- Packages.html: Sender Logic --- */
function initPackagesPage() {
    $('.package-card a.package-select-button').on('click', function(e) {
        e.preventDefault();
        const $card = $(this).closest('.package-card');
        const packageId = $card.data('package-id');
        const packageName = $card.find('h3').text().trim();
        const packagePrice = $card.data('package-price');

        if (packageId && packagePrice) {
            const redirectUrl = `Payment_Gateway.html?id=${packageId}&name=${encodeURIComponent(packageName)}&price=${packagePrice}`;
            $('body').addClass('fade-out');
            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 500);
        } else {
            console.error('Missing package data. Falling back.');
            $('body').addClass('fade-out');
            setTimeout(() => {
                window.location.href = 'Payment_Gateway.html';
            }, 500);
        }
    });

    // Fade-in on load
    $('body').css('opacity', 0).animate({ opacity: 1 }, 500);
}

/* --- Payment_Gateway.html: Receiver + Payment Logic --- */
function initPaymentGatewayPage() {
    const params = getQueryParams();
    const packageId = params.id || 'Unknown';
    const packageName = params.name || 'a Service Package';
    const packagePrice = params.price || 'a TBD amount';

    function showMessage(message, type) {
        const $msg = $('#status-message').removeClass('success error processing').html(message).show();
        if (type) $msg.addClass(type);
        $('html, body').animate({
            scrollTop: $msg.offset().top - 100  // FIXED: Colon
        }, 500);
    }

    function displayPackageDetails() {
        $('#package-name').text(packageName);
        const $priceEl = $('#package-price');
        const price = parseFloat(packagePrice);
        const priceText = (!isNaN(price) && packagePrice !== 'a TBD amount')
            ? `$${price.toFixed(2)}/mo`
            : packagePrice;
        $priceEl.text(priceText);
    }

    displayPackageDetails();

    // --- Tab Switching ---
    $('#payment-tabs a').on('click', function(e) {
        e.preventDefault();
        const tabId = $(this).data('tab');
        $('#payment-tabs a').removeClass('active');
        $(this).addClass('active');
        $('.tab-content').hide();
        $(`#${tabId}`).show();
        $('#status-message').hide().removeClass('success error processing');
    });

    // --- Mock Card Payment ---
    $('#payment-form').on('submit', function(e) {
        e.preventDefault();
        const cardNumber = $('#card-number').val().replace(/\s/g, '');
        if (cardNumber.length < 15 || cardNumber.length > 19) {  // FIXED: Logic
            showMessage('Please enter a valid card number.', 'error');
            return;
        }
        showMessage(`Processing payment for ${packageName}...`, 'processing');
        const delay = Math.random() * 2000 + 1000;
        setTimeout(() => {
            if (Math.random() < 0.8) {
                showMessage(`Payment successful for ${packageName}! Redirecting...`, 'success');
                setTimeout(() => {
                    window.location.href = 'Admin_Room.html';
                }, 3000);
            } else {
                showMessage('Payment failed. Please try again.', 'error');
            }
        }, delay);
    });

    // --- Mock PayPal ---
    $('#paypal-redirect').on('click', function(e) {
        e.preventDefault();
        showMessage('Redirecting to PayPal...', 'processing');
        setTimeout(() => {
            if (Math.random() < 0.7) {
                showMessage(`PayPal success for ${packageName}! Redirecting...`, 'success');
                setTimeout(() => {
                    window.location.href = 'Admin_Room.html';
                }, 3000);
            } else {
                showMessage('PayPal cancelled or failed.', 'error');
            }
        }, 2500);
    });
}

/* --- Auto-Init Based on Page --- */
$(function() {
    if (window.location.pathname.includes('Packages.html')) {
        initPackagesPage();
    } else if (window.location.pathname.includes('Payment_Gateway.html')) {
        initPaymentGatewayPage();
    }
});