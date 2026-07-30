<?php

use App\Http\Controllers\BookingController;
use App\Http\Controllers\CarController;
use App\Http\Controllers\CouponValidationController;
use App\Http\Controllers\PageController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\TaxCalculationController;
use App\Http\Controllers\Admin\AuthController as AdminAuthController;
use App\Http\Controllers\Admin\BookingController as AdminBookingController;
use App\Http\Controllers\Admin\CarController as AdminCarController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\CouponController as AdminCouponController;
use App\Http\Controllers\Admin\ReservationController as AdminReservationController;
use App\Http\Controllers\Admin\TaxController as AdminTaxController;
use App\Http\Controllers\Admin\FaqController as AdminFaqController;
use App\Http\Controllers\Admin\FooterSettingController as AdminFooterSettingController;
use App\Http\Controllers\Admin\HeroSettingController as AdminHeroSettingController;
use App\Http\Controllers\Admin\LocationController as AdminLocationController;
use App\Http\Controllers\Admin\ReservationSettingController as AdminReservationSettingController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Admin\WhyBookController as AdminWhyBookController;
use App\Http\Controllers\Admin\WhyChooseUsController as AdminWhyChooseUsController;
use App\Http\Controllers\Admin\ContactMessageController as AdminContactMessageController;
use App\Http\Controllers\Admin\FleetPageSettingController as AdminFleetPageSettingController;
use App\Http\Controllers\Admin\AboutUsSettingController as AdminAboutUsSettingController;
use App\Http\Controllers\Chat\ChatController;
use Illuminate\Support\Facades\Route;

// Public routes
Route::get('/', [CarController::class, 'index'])->name('cars.index');
Route::get('/cars/{car}', [CarController::class, 'show'])->name('cars.show');
Route::get('/fleet', [PageController::class, 'fleet'])->name('fleet');
Route::get('/locations', [PageController::class, 'locations'])->name('locations');
Route::get('/about', [PageController::class, 'about'])->name('about');
Route::get('/contact', [PageController::class, 'contact'])->name('contact');
Route::post('/contact', [App\Http\Controllers\ContactController::class, 'store'])->name('contact.store')->middleware('throttle:5,1');
Route::get('/reservations', [PageController::class, 'reservations'])->name('reservations');
Route::get('/book-now/{carId}', [PageController::class, 'bookNow'])->name('book.now');

Route::get('/track-reservation', [BookingController::class, 'lookup'])->name('bookings.lookup');
Route::post('/track-reservation', [BookingController::class, 'search'])->name('bookings.search')->middleware('throttle:10,1');
Route::get('/reservations/{reference}', [BookingController::class, 'guestShow'])->name('bookings.guest.show')->middleware('throttle:30,1');
Route::get('/reservations/{reference}/edit', [BookingController::class, 'editByReference'])->name('bookings.guest.edit');
Route::patch('/reservations/{reference}/edit', [BookingController::class, 'modifyByReference'])->name('bookings.guest.modify');

// Coupon validation
Route::post('/coupons/validate', [CouponValidationController::class, 'validate'])->name('coupons.validate')->middleware('throttle:10,1');

// Tax calculation
Route::post('/taxes/calculate', [TaxCalculationController::class, 'calculate'])->name('taxes.calculate')->middleware('throttle:30,1');

// Car availability check
Route::post('/cars/check-availability', [CarController::class, 'checkAvailability'])->name('cars.check-availability')->middleware('throttle:30,1');

// Guest reservation submission (from BookNow.tsx / Reservation.tsx)
Route::post('/reservations', [BookingController::class, 'storeGuest'])->name('reservations.store')->middleware('throttle:3,1');

// Legal pages
Route::get('/privacy-policy', [PageController::class, 'privacyPolicy'])->name('privacy-policy');
Route::get('/terms-of-service', [PageController::class, 'termsOfService'])->name('terms-of-service');
Route::get('/cookie-policy', [PageController::class, 'cookiePolicy'])->name('cookie-policy');
Route::get('/terms-and-conditions', [PageController::class, 'termsAndConditions'])->name('terms-and-conditions');

// Reviews
Route::get('/reviews/{booking:reference_code}', [ReviewController::class, 'create'])->name('reviews.create');
Route::post('/reviews/{booking:reference_code}', [ReviewController::class, 'store'])->name('reviews.store')->middleware('throttle:5,1');

// Authenticated user routes
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [PageController::class, 'dashboard'])->name('dashboard');

    // Profile
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Bookings
    Route::get('/bookings', [BookingController::class, 'index'])->name('bookings.index');
    Route::get('/cars/{car}/book', [BookingController::class, 'create'])->name('bookings.create');
    Route::post('/bookings', [BookingController::class, 'store'])->name('bookings.store')->middleware('throttle:10,1');
    Route::get('/bookings/{booking}', [BookingController::class, 'show'])->name('bookings.show');
    Route::patch('/bookings/{booking}/cancel', [BookingController::class, 'cancel'])->name('bookings.cancel')->middleware('throttle:5,1');
    Route::get('/bookings/{booking}/edit', [BookingController::class, 'edit'])->name('bookings.edit');
    Route::patch('/bookings/{booking}/modify', [BookingController::class, 'modify'])->name('bookings.modify')->middleware('throttle:5,1');
});

// Chat routes (API-like, for the widget)
Route::get('/chat/conversations', [ChatController::class, 'conversations'])->name('chat.conversations');
Route::get('/chat/conversations/search', [ChatController::class, 'search'])->name('chat.search');
Route::get('/chat/conversations/{conversation}/messages', [ChatController::class, 'messages'])->name('chat.messages');
Route::post('/chat/messages', [ChatController::class, 'store'])->name('chat.messages.store')->middleware('throttle:30,1');
Route::post('/chat/messages/read', [ChatController::class, 'markAsRead'])->name('chat.messages.read');
Route::post('/chat/typing', [ChatController::class, 'typing'])->name('chat.typing');
Route::get('/chat/faqs', [ChatController::class, 'faqs'])->name('chat.faqs');
Route::post('/chat/faq-answer', [ChatController::class, 'faqAnswer'])->name('chat.faq-answer');
Route::post('/chat/guest-identity', [ChatController::class, 'storeGuestIdentity'])->name('chat.guest-identity')->middleware('throttle:10,1');


// Admin guest routes
Route::prefix('admin')->name('admin.')->group(function () {
    Route::get('login', [AdminAuthController::class, 'create'])->name('login');
    Route::post('login', [AdminAuthController::class, 'store']);
});

Route::post('admin/logout', [AdminAuthController::class, 'destroy'])->name('admin.logout');

// Admin routes
Route::middleware(['auth', 'verified', 'role:admin', 'throttle:300,1'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', [AdminDashboardController::class, 'index'])->name('dashboard');
    Route::get('/dashboard/export', [AdminDashboardController::class, 'export'])->name('dashboard.export');

    // Admin - Cars
    Route::get('/cars', [AdminCarController::class, 'index'])->name('cars.index');
    Route::get('/cars/create', [AdminCarController::class, 'create'])->name('cars.create');
    Route::post('/cars', [AdminCarController::class, 'store'])->name('cars.store');
    Route::get('/cars/{car}/edit', [AdminCarController::class, 'edit'])->name('cars.edit');
    Route::put('/cars/{car}', [AdminCarController::class, 'update'])->name('cars.update');
    Route::delete('/cars/{car}', [AdminCarController::class, 'destroy'])->name('cars.destroy');
    Route::get('/cars/schedule', [AdminCarController::class, 'schedule'])->name('cars.schedule');

    // Admin - Bookings
    Route::get('/bookings', [AdminBookingController::class, 'index'])->name('bookings.index');
    Route::get('/bookings/{booking}', [AdminBookingController::class, 'show'])->name('bookings.show');
    Route::get('/bookings/{booking}/edit', [AdminBookingController::class, 'edit'])->name('bookings.edit');
    Route::patch('/bookings/{booking}', [AdminBookingController::class, 'update'])->name('bookings.update');
    Route::patch('/bookings/{booking}/status', [AdminBookingController::class, 'updateStatus'])->name('bookings.status');
    Route::post('/bookings/{booking}/payments', [AdminBookingController::class, 'recordPayment'])->name('bookings.payments.store');
    Route::patch('/bookings/{booking}/payments/{payment}', [AdminBookingController::class, 'updatePayment'])->name('bookings.payments.update');
    Route::patch('/bookings/{booking}/modify', [AdminBookingController::class, 'modify'])->name('bookings.modify');

    // Admin - Reservations
    Route::get('/reservations', [AdminReservationController::class, 'index'])->name('reservations.index');

    // Admin - Coupons
    Route::get('/coupons', [AdminCouponController::class, 'index'])->name('coupons.index');
    Route::get('/coupons/create', [AdminCouponController::class, 'create'])->name('coupons.create');
    Route::post('/coupons', [AdminCouponController::class, 'store'])->name('coupons.store');
    Route::get('/coupons/{coupon}/edit', [AdminCouponController::class, 'edit'])->name('coupons.edit');
    Route::put('/coupons/{coupon}', [AdminCouponController::class, 'update'])->name('coupons.update');
    Route::delete('/coupons/{coupon}', [AdminCouponController::class, 'destroy'])->name('coupons.destroy');

    // Admin - Tax & Surcharges
    Route::get('/tax', [AdminTaxController::class, 'index'])->name('tax.index');
    Route::post('/tax', [AdminTaxController::class, 'store'])->name('tax.store');
    Route::put('/tax/{tax}', [AdminTaxController::class, 'update'])->name('tax.update');
    Route::delete('/tax/{tax}', [AdminTaxController::class, 'destroy'])->name('tax.destroy');

    // Admin - Account Management
    Route::get('/users', [AdminUserController::class, 'index'])->name('users.index');
    Route::get('/users/create', [AdminUserController::class, 'create'])->name('users.create');
    Route::post('/users', [AdminUserController::class, 'store'])->name('users.store');
    Route::get('/users/{user}', [AdminUserController::class, 'show'])->name('users.show');
    Route::get('/users/{user}/edit', [AdminUserController::class, 'edit'])->name('users.edit');
    Route::put('/users/{user}', [AdminUserController::class, 'update'])->name('users.update');
    Route::delete('/users/{user}', [AdminUserController::class, 'destroy'])->name('users.destroy');

    // Admin - Page Customization
    Route::get('/hero-settings', [AdminHeroSettingController::class, 'index'])->name('hero-settings');
    Route::post('/hero-settings', [AdminHeroSettingController::class, 'update'])->name('hero-settings.update');
    Route::post('/hero-settings/images', [AdminHeroSettingController::class, 'uploadImage'])->name('hero-settings.images.upload');
    Route::post('/hero-settings/images/reorder', [AdminHeroSettingController::class, 'reorderImages'])->name('hero-settings.images.reorder');
    Route::post('/hero-settings/images/{heroImage}', [AdminHeroSettingController::class, 'updateImage'])->name('hero-settings.images.update');
    Route::delete('/hero-settings/images/{heroImage}', [AdminHeroSettingController::class, 'deleteImage'])->name('hero-settings.images.delete');

    Route::post('/fleet-page-settings', [AdminFleetPageSettingController::class, 'update'])->name('fleet-page-settings.update');

    // Admin - About Us Settings
    Route::post('/about-us-settings', [AdminAboutUsSettingController::class, 'update'])->name('about-us-settings.update');

    // Admin - FAQ Management
    Route::get('/faqs', [AdminFaqController::class, 'index'])->name('faqs.index');
    Route::post('/faqs', [AdminFaqController::class, 'store'])->name('faqs.store');
    Route::put('/faqs/{faq}', [AdminFaqController::class, 'update'])->name('faqs.update');
    Route::delete('/faqs/{faq}', [AdminFaqController::class, 'destroy'])->name('faqs.destroy');

    // Admin - Footer Settings
    Route::get('/footer-settings', [AdminFooterSettingController::class, 'index'])->name('footer-settings');
    Route::put('/footer-settings', [AdminFooterSettingController::class, 'update'])->name('footer-settings.update');

    // Admin - Reservation Settings
    Route::get('/reservation-settings', [AdminReservationSettingController::class, 'index'])->name('reservation-settings');
    Route::post('/reservation-settings', [AdminReservationSettingController::class, 'update'])->name('reservation-settings.update');
    Route::post('/reservation-settings/images', [AdminReservationSettingController::class, 'uploadImage'])->name('reservation-settings.images.upload');
    Route::post('/reservation-settings/images/{reservationHeroImage}', [AdminReservationSettingController::class, 'updateImage'])->name('reservation-settings.images.update');
    Route::delete('/reservation-settings/images/{reservationHeroImage}', [AdminReservationSettingController::class, 'deleteImage'])->name('reservation-settings.images.delete');

    // Admin - Locations
    Route::get('/locations', [AdminLocationController::class, 'index'])->name('locations.index');
    Route::post('/locations', [AdminLocationController::class, 'store'])->name('locations.store');
    Route::put('/locations/{vehicleLocation}', [AdminLocationController::class, 'update'])->name('locations.update');
    Route::delete('/locations/{vehicleLocation}', [AdminLocationController::class, 'destroy'])->name('locations.destroy');
    Route::post('/locations/page-settings', [AdminLocationController::class, 'updatePageSettings'])->name('locations.page-settings.update');

    // Admin - Why Book With Us
    Route::get('/why-book', [AdminWhyBookController::class, 'index'])->name('why-book.index');
    Route::post('/why-book', [AdminWhyBookController::class, 'store'])->name('why-book.store');
    Route::put('/why-book/{whyBookItem}', [AdminWhyBookController::class, 'update'])->name('why-book.update');
    Route::delete('/why-book/{whyBookItem}', [AdminWhyBookController::class, 'destroy'])->name('why-book.destroy');

    // Admin - Why Choose Us
    Route::get('/why-choose-us', [AdminWhyChooseUsController::class, 'index'])->name('why-choose-us.index');
    Route::post('/why-choose-us', [AdminWhyChooseUsController::class, 'store'])->name('why-choose-us.store');
    Route::put('/why-choose-us/{whyChooseUsItem}', [AdminWhyChooseUsController::class, 'update'])->name('why-choose-us.update');
    Route::delete('/why-choose-us/{whyChooseUsItem}', [AdminWhyChooseUsController::class, 'destroy'])->name('why-choose-us.destroy');

    // Admin - Contact Messages
    Route::get('/contact-messages', [AdminContactMessageController::class, 'index'])->name('contact-messages.index');
    Route::patch('/contact-messages/{contactMessage}/read', [AdminContactMessageController::class, 'markAsRead'])->name('contact-messages.read');
    Route::delete('/contact-messages/{contactMessage}', [AdminContactMessageController::class, 'destroy'])->name('contact-messages.destroy');

    // Admin - Live Chat
    Route::get('/chats', [ChatController::class, 'index'])->name('chats.index');
    Route::get('/chats/admins', [ChatController::class, 'admins'])->name('chats.admins');
    Route::post('/chats/heartbeat', [ChatController::class, 'heartbeat'])->name('chats.heartbeat');
    Route::get('/chats/{conversation}', [ChatController::class, 'show'])->name('chats.show');
    Route::post('/chats/{conversation}/assign', [ChatController::class, 'assign'])->name('chats.assign');

    // Admin - Vehicle Classes
    Route::get('/vehicle-classes', [\App\Http\Controllers\Admin\VehicleClassController::class, 'index'])->name('vehicle-classes.index');
    Route::post('/vehicle-classes', [\App\Http\Controllers\Admin\VehicleClassController::class, 'store'])->name('vehicle-classes.store');
    Route::put('/vehicle-classes/{vehicleClass}', [\App\Http\Controllers\Admin\VehicleClassController::class, 'update'])->name('vehicle-classes.update');
    Route::delete('/vehicle-classes/{vehicleClass}', [\App\Http\Controllers\Admin\VehicleClassController::class, 'destroy'])->name('vehicle-classes.destroy');
});

require __DIR__.'/auth.php';
